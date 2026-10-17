
import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .ai.provider import NeedsBrowserAI
from .api import (
    admin,
    analytics,
    challenges,
    dashboard,
    exam,
    extras,
    graph,
    insights,
    interviews,
    jobcheck,
    jobs,
    labs,
    learning,
    notifications,
    passport,
    profile,
    radar,
    resume,
    search,
    whatif,
)
from .api.routes import router
from .core.config import settings
from .core.db import DatabaseError
from .core.security import ip_limiter


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("skillsetra")

prod = settings.app_env == "production"


app = FastAPI(
    title="SkillSetra AI API",
    docs_url=None if prod else "/docs",
    redoc_url=None,
    openapi_url=None if prod else "/openapi.json",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

configured_origins = [
    origin.strip().rstrip("/")
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

# Ensure local development origins are available.
# Keep your configured origins for deployed environments.
if not prod:
    for origin in (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ):
        if origin not in configured_origins:
            configured_origins.append(origin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "X-AI-Ticket",
    ],
)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "service": "SkillSetra API",
    }


# --------------------------------------------------
# Security middleware
# --------------------------------------------------

@app.middleware("http")
async def protect(request: Request, call_next):
    # Browser CORS preflight requests must not be blocked
    # by the application's rate limiter or body-size limit.
    if request.method != "OPTIONS":
        try:
            ip_limiter.check(
                request.client.host
                if request.client
                else "unknown"
            )
        except HTTPException as exc:
            return JSONResponse(
                content={"detail": exc.detail},
                status_code=429,
                headers=exc.headers,
            )

        # Keep the normal request-size limit.
        # Resume uploads that exceed this limit need their own
        # carefully scoped exception if your app supports them.
        content_length = request.headers.get("content-length")

        if content_length:
            try:
                request_size = int(content_length)
            except ValueError:
                return JSONResponse(
                    content={"detail": "Invalid Content-Length header."},
                    status_code=400,
                )

            if request_size > 100_000:
                return JSONResponse(
                    content={"detail": "Request is too large."},
                    status_code=413,
                )

    response = await call_next(request)

    response.headers.update(
        {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "no-referrer",
            "Cache-Control": "no-store",
        }
    )

    return response


# --------------------------------------------------
# Exception handlers
# --------------------------------------------------

@app.exception_handler(RequestValidationError)
async def invalid(request: Request, exc: RequestValidationError):
    return JSONResponse(
        content={
            "detail": (
                "Some of the information sent is invalid. "
                "Please check it and try again."
            )
        },
        status_code=422,
    )


@app.exception_handler(DatabaseError)
async def db_error(request: Request, exc: DatabaseError):
    log.exception("Database error on %s", request.url.path)

    return JSONResponse(
        content={
            "detail": (
                "We couldn't reach the database. "
                "Please try again."
            )
        },
        status_code=503,
    )


@app.exception_handler(NeedsBrowserAI)
async def needs_browser_ai(
    request: Request,
    exc: NeedsBrowserAI,
):
    return JSONResponse(
        content={
            "needs_ai": True,
            "ticket": exc.ticket,
            "system": exc.system,
            "prompt": exc.prompt,
        },
        status_code=200,
    )


@app.exception_handler(Exception)
async def unexpected(request: Request, exc: Exception):
    error_id = uuid.uuid4().hex[:8]

    log.exception(
        "Unhandled error %s on %s",
        error_id,
        request.url.path,
    )

    return JSONResponse(
        content={
            "detail": (
                f"Something went wrong. "
                f"Reference: {error_id}"
            )
        },
        status_code=500,
    )


# --------------------------------------------------
# API routes
# Register each router exactly once.
# --------------------------------------------------

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
app.include_router(insights.router)
app.include_router(whatif.router)
app.include_router(graph.router)
app.include_router(passport.router)
app.include_router(radar.router)
app.include_router(jobcheck.router)
app.include_router(search.router)
app.include_router(resume.router)
app.include_router(analytics.router)
app.include_router(admin.router)
