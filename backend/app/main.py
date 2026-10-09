import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import challenges, dashboard, exam, extras, interviews, jobs, labs, learning, notifications, profile
from .api.routes import router
from .core.config import settings
from .core.db import DatabaseError
from .core.security import ip_limiter
from .ai.provider import NeedsBrowserAI

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("skillsetra")
prod = settings.app_env == "production"

app = FastAPI(
    title="SkillSetra AI API",
    docs_url=None if prod else "/docs",
    redoc_url=None,
    openapi_url=None if prod else "/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in settings.allowed_origins.split(",")
        if o.strip()
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-AI-Ticket"],
)


@app.middleware("http")
async def protect(request: Request, call_next):
    if request.method != "OPTIONS":
        try:
            ip_limiter.check(
                request.client.host if request.client else "unknown"
            )
        except HTTPException as e:
            return JSONResponse(
                {"detail": e.detail},
                status_code=429,
                headers=e.headers
            )

        if int(request.headers.get("content-length") or 0) > 100_000:
            return JSONResponse(
                {"detail": "Request is too large."},
                status_code=413
            )

    response = await call_next(request)

    response.headers.update({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Cache-Control": "no-store"
    })

    return response


@app.exception_handler(RequestValidationError)
async def invalid(_, exc):
    # never echo internals back to the user
    return JSONResponse(
        {
            "detail": (
                "Some of the information sent is invalid. "
                "Please check it and try again."
            )
        },
        status_code=422
    )


@app.exception_handler(DatabaseError)
async def db_error(_, exc):
    return JSONResponse(
        {
            "detail": (
                "We couldn't reach the database. "
                "Please try again."
            )
        },
        status_code=503
    )


@app.exception_handler(NeedsBrowserAI)
async def needs_browser_ai(_, exc: NeedsBrowserAI):
    return JSONResponse(
        {
            "needs_ai": True,
            "ticket": exc.ticket,
            "system": exc.system,
            "prompt": exc.prompt,
        }
    )


@app.exception_handler(Exception)
async def unexpected(request: Request, exc: Exception):
    error_id = uuid.uuid4().hex[:8]

    log.exception(
        "Unhandled error %s on %s",
        error_id,
        request.url.path
    )

    # details stay in the server log
    return JSONResponse(
        {
            "detail": (
                f"Something went wrong. "
                f"Reference: {error_id}"
            )
        },
        status_code=500
    )


app.include_router(router)
app.include_router(exam.router)
app.include_router(dashboard.router)
app.include_router(challenges.router)
app.include_router(labs.router)
app.include_router(extras.router)
app.include_router(profile.router)
app.include_router(notifications.router)
app.include_router(interviews.router)
app.include_router(learning.router)
app.include_router(jobs.router)