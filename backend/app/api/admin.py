
import asyncio
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote
from uuid import UUID, uuid4

import httpx
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from pydantic import BaseModel, Field

from ..core.security import get_current_user


# --------------------------------------------------
# Configuration
# --------------------------------------------------

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=False)

router = APIRouter(prefix="/api/admin", tags=["admin"])

MAX_ROWS = 500
MAX_UPLOAD_BYTES = 8 * 1024 * 1024

PROFILE_FIELDS = {
    "name",
    "dob",
    "status",
    "experience",
    "country",
    "goal",
    "target_role",
    "headline",
    "bio",
    "education",
    "experience_summary",
    "skills",
    "career_prefs",
    "avatar_path",
    "resume_path",
}

# Admin privileges are controlled only by ADMIN_USER_IDS.
# Never let a normal user's profile role grant admin access.
EDITABLE_PROFILE_ROLES = {"user", "moderator"}

ALLOWED_FILE_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


# --------------------------------------------------
# Request models
# --------------------------------------------------

class CreateUserRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=120)
    role: str = "user"
    target_role: str | None = None
    status: str | None = None
    country: str | None = None
    experience: str | None = None
    goal: str | None = None


class UpdateUserRequest(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    email: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: str | None = None
    target_role: str | None = None
    status: str | None = None
    dob: str | None = None
    experience: str | None = None
    country: str | None = None
    goal: str | None = None
    headline: str | None = None
    bio: str | None = None
    education: str | None = None
    experience_summary: str | None = None
    skills: list[Any] | None = None
    career_prefs: dict[str, Any] | None = None


# --------------------------------------------------
# Authorization and configuration
# --------------------------------------------------

def _require_admin(user: Any) -> str:
    allowed_ids = {
        value.strip()
        for value in os.getenv("ADMIN_USER_IDS", "").split(",")
        if value.strip()
    }

    user_id = str(getattr(user, "id", "") or "").strip()

    if not allowed_ids:
        raise HTTPException(
            status_code=403,
            detail="Admin access is not configured in backend/.env.",
        )

    if not user_id or user_id not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail="This account is not authorized to access the admin panel.",
        )

    return user_id


def _supabase_config() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not url or not key:
        raise HTTPException(
            status_code=503,
            detail="Admin API requires server-side Supabase configuration.",
        )

    return url, key


def _headers(key: str) -> dict[str, str]:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }


def _valid_uuid(value: str) -> str:
    try:
        return str(UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid user ID.")


def _email(value: str) -> str:
    value = value.strip().lower()

    if len(value) > 254 or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+",
        value,
    ):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    return value


async def _request_json(
    client: httpx.AsyncClient,
    method: str,
    path: str,
    **kwargs: Any,
) -> Any:
    try:
        response = await client.request(method, path, **kwargs)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Could not communicate with Supabase.",
        )

    if response.is_error:
        # Keep internal Supabase errors and credentials out of responses.
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Requested record not found.")
        if response.status_code == 409:
            raise HTTPException(status_code=409, detail="This account or record already exists.")
        if response.status_code in (401, 403):
            raise HTTPException(
                status_code=502,
                detail="Supabase rejected the server-side request. Check backend credentials and permissions.",
            )
        if response.status_code == 429:
            raise HTTPException(status_code=503, detail="Supabase rate limit reached.")
        if response.status_code >= 500:
            raise HTTPException(status_code=502, detail="Supabase service is temporarily unavailable.")
        raise HTTPException(
            status_code=400,
            detail="Supabase could not complete the requested operation.",
        )

    if response.status_code == 204 or not response.content:
        return None

    try:
        return response.json()
    except ValueError:
        return None


async def _table_rows(
    client: httpx.AsyncClient,
    table: str,
    *,
    limit: int = MAX_ROWS,
    filters: dict[str, str] | None = None,
) -> list[dict]:
    params = {"select": "*", "limit": str(limit)}
    if filters:
        params.update(filters)

    try:
        response = await client.get(f"/rest/v1/{table}", params=params)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not read Supabase data.")

    if response.status_code == 404:
        raise HTTPException(
            status_code=500,
            detail=f"The required database table '{table}' is missing or unavailable.",
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read the required database table '{table}'. Check its schema and permissions.",
        )

    try:
        data = response.json()
    except ValueError:
        return []

    return [item for item in data if isinstance(item, dict)] if isinstance(data, list) else []


async def _profile_by_id(
    client: httpx.AsyncClient,
    user_id: str,
) -> dict:
    rows = await _table_rows(
        client,
        "profiles",
        limit=1,
        filters={"user_id": f"eq.{user_id}"},
    )

    if not rows:
        raise HTTPException(status_code=404, detail="User profile not found.")

    return rows[0]


def _safe_profile(row: dict) -> dict:
    """Return only fields intended for the admin UI."""
    return {
        "id": row.get("user_id") or row.get("id"),
        "user_id": row.get("user_id") or row.get("id"),
        "name": (
            row.get("name")
            or row.get("full_name")
            or row.get("display_name")
            or row.get("username")
            or ""
        ),
        "email": row.get("email") or "",
        "role": row.get("role") or "user",
        "dob": row.get("dob"),
        "status": row.get("status"),
        "experience": row.get("experience"),
        "country": row.get("country"),
        "goal": row.get("goal"),
        "target_role": row.get("target_role"),
        "created_at": row.get("created_at"),
        "headline": row.get("headline"),
        "bio": row.get("bio"),
        "education": row.get("education"),
        "experience_summary": row.get("experience_summary"),
        "skills": row.get("skills") or [],
        "career_prefs": row.get("career_prefs") or {},
        "avatar_path": row.get("avatar_path"),
        "resume_path": row.get("resume_path"),
    }


def _is_admin_account(user_id: str, admin_ids: set[str]) -> bool:
    return user_id in admin_ids


def _admin_ids() -> set[str]:
    return {
        item.strip()
        for item in os.getenv("ADMIN_USER_IDS", "").split(",")
        if item.strip()
    }


def _created_at(row: dict) -> str | None:
    for field in ("created_at", "started_at", "updated_at", "timestamp"):
        value = row.get(field)
        if isinstance(value, str) and value:
            return value
    return None


def _activity_item(row: dict, category: str, fallback: str) -> dict:
    return {
        "id": str(row.get("id") or row.get("session_id") or ""),
        "title": str(
            row.get("title") or row.get("name") or row.get("activity") or fallback
        )[:180],
        "description": str(row.get("description") or row.get("status") or "")[:300],
        "category": category,
        "created_at": _created_at(row),
    }


def _http_client() -> httpx.AsyncClient:
    url, key = _supabase_config()
    return httpx.AsyncClient(
        base_url=url,
        headers=_headers(key),
        timeout=httpx.Timeout(20.0, connect=5.0),
    )


# --------------------------------------------------
# Dashboard overview
# --------------------------------------------------

@router.get("/overview")
async def admin_overview(user: Any = Depends(get_current_user)):
    _require_admin(user)

    table_names = (
        "profiles",
        "exam_sessions",
        "exam_results",
        "challenge_attempts",
        "interview_sessions",
        "learning_progress",
        "saved_jobs",
        "evidence",
        "job_analyses",
        "resume_analyses",
    )

    async with _http_client() as client:
        results = await asyncio.gather(
            *[_table_rows(client, table) for table in table_names],
            return_exceptions=True,
        )

    tables: dict[str, list[dict]] = {}
    for name, result in zip(table_names, results):
        if isinstance(result, Exception):
            # Feature tables can be absent on older installations.
            if name == "profiles":
                raise result
            tables[name] = []
        else:
            tables[name] = result

    profiles = tables["profiles"]
    admins = _admin_ids()

    # Do not include configured admin accounts in regular user results.
    regular_profiles = [
        row for row in profiles
        if str(row.get("user_id") or row.get("id") or "") not in admins
    ]

    activity = []
    for table, category, fallback in (
        ("exam_results", "assessment", "Assessment completed"),
        ("challenge_attempts", "practice", "Practice attempt"),
        ("interview_sessions", "interview", "Interview session"),
        ("learning_progress", "learning", "Learning progress"),
        ("job_analyses", "job", "Job analysis"),
        ("resume_analyses", "resume", "Resume analysis"),
    ):
        activity.extend(
            _activity_item(row, category, fallback)
            for row in tables[table]
        )

    activity.sort(
        key=lambda item: item.get("created_at") or "",
        reverse=True,
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "users": len(regular_profiles),
            "assessments": len(tables["exam_sessions"]) + len(tables["exam_results"]),
            "practice_attempts": len(tables["challenge_attempts"]),
            "interviews": len(tables["interview_sessions"]),
            "learning_records": len(tables["learning_progress"]),
            "saved_jobs": len(tables["saved_jobs"]),
            "evidence_records": len(tables["evidence"]),
            "job_analyses": len(tables["job_analyses"]),
            "resume_analyses": len(tables["resume_analyses"]),
        },
        "users": [_safe_profile(row) for row in regular_profiles],
        "activity": activity[:100],
    }


# --------------------------------------------------
# List regular users
# --------------------------------------------------

@router.get("/users")
async def list_users(
    search: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=200, ge=1, le=MAX_ROWS),
    user: Any = Depends(get_current_user),
):
    _require_admin(user)

    async with _http_client() as client:
        profiles = await _table_rows(client, "profiles", limit=limit)

    admin_ids = _admin_ids()
    users = [
        _safe_profile(row)
        for row in profiles
        if str(row.get("user_id") or row.get("id") or "") not in admin_ids
    ]

    if search:
        term = search.casefold().strip()
        users = [
            row for row in users
            if term in str(row.get("name") or "").casefold()
            or term in str(row.get("email") or "").casefold()
            or term in str(row.get("target_role") or "").casefold()
        ]

    return {"users": users, "total": len(users)}


# --------------------------------------------------
# Create a real Supabase Auth user
# --------------------------------------------------

@router.post("/users", status_code=201)
async def create_user(
    payload: CreateUserRequest,
    user: Any = Depends(get_current_user),
):
    _require_admin(user)

    role = payload.role.strip().lower()
    if role not in EDITABLE_PROFILE_ROLES:
        raise HTTPException(
            status_code=422,
            detail="Profile role must be user or moderator. Admin access is configured separately.",
        )

    email = _email(payload.email)

    async with _http_client() as client:
        auth_user = await _request_json(
            client,
            "POST",
            "/auth/v1/admin/users",
            json={
                "email": email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {"name": payload.name.strip()},
            },
        )

        if not isinstance(auth_user, dict):
            raise HTTPException(
                status_code=502,
                detail="Supabase did not return the created account.",
            )

        auth_data = auth_user.get("user") or auth_user
        user_id = auth_data.get("id")

        if not user_id:
            raise HTTPException(
                status_code=502,
                detail="The created account did not include a user ID.",
            )

        profile = {
            "user_id": user_id,
            "email": email,
            "name": payload.name.strip(),
            "role": role,
            "target_role": payload.target_role,
            "status": payload.status,
            "country": payload.country,
            "experience": payload.experience,
            "goal": payload.goal,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            await _request_json(
                client,
                "POST",
                "/rest/v1/profiles",
                params={"on_conflict": "user_id"},
                headers={"Prefer": "resolution=merge-duplicates,return=representation"},
                json=profile,
            )
        except HTTPException:
            # Avoid leaving an Auth account without its profile.
            try:
                await _request_json(
                    client,
                    "DELETE",
                    f"/auth/v1/admin/users/{user_id}",
                )
            except HTTPException:
                pass
            raise

    return {
        "message": "User account created.",
        "user": _safe_profile(profile),
    }


# --------------------------------------------------
# Update profile, email, password or role
# --------------------------------------------------

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    user: Any = Depends(get_current_user),
):
    _require_admin(user)
    user_id = _valid_uuid(user_id)

    if user_id in _admin_ids():
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts cannot be modified from regular user management.",
        )

    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(status_code=400, detail="No changes were provided.")

    requested_role = changes.get("role")
    if requested_role is not None:
        requested_role = requested_role.strip().lower()
        if requested_role not in EDITABLE_PROFILE_ROLES:
            raise HTTPException(
                status_code=422,
                detail="Profile role must be user or moderator. Admin access is configured separately.",
            )
        changes["role"] = requested_role

    email = changes.pop("email", None)
    password = changes.pop("password", None)

    profile_changes = {
        key: value
        for key, value in changes.items()
        if key in PROFILE_FIELDS or key == "role"
    }

    if "name" in profile_changes and profile_changes["name"] is not None:
        profile_changes["name"] = profile_changes["name"].strip()

    async with _http_client() as client:
        existing = await _profile_by_id(client, user_id)

        # Update Auth separately from profile data.
        auth_update: dict[str, Any] = {}
        if email is not None:
            auth_update["email"] = _email(email)
            auth_update["email_confirm"] = True
        if password is not None:
            auth_update["password"] = password

        if auth_update:
            await _request_json(
                client,
                "PUT",
                f"/auth/v1/admin/users/{user_id}",
                json=auth_update,
            )

        if profile_changes:
            await _request_json(
                client,
                "PATCH",
                "/rest/v1/profiles",
                params={"user_id": f"eq.{user_id}"},
                headers={"Prefer": "return=representation"},
                json=profile_changes,
            )

        updated = await _profile_by_id(client, user_id)

    return {
        "message": "User updated successfully.",
        "user": _safe_profile(updated),
    }


# --------------------------------------------------
# Delete a user and their Auth account
# --------------------------------------------------

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    user: Any = Depends(get_current_user),
):
    _require_admin(user)
    user_id = _valid_uuid(user_id)

    if user_id in _admin_ids():
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts cannot be deleted from regular user management.",
        )

    async with _http_client() as client:
        # Verify the profile exists before attempting deletion.
        await _profile_by_id(client, user_id)

        # Delete the Auth account. Supabase may cascade related records
        # depending on the foreign keys configured in your database.
        await _request_json(
            client,
            "DELETE",
            f"/auth/v1/admin/users/{user_id}",
        )

        # Also remove the profile explicitly if it remains.
        await _request_json(
            client,
            "DELETE",
            "/rest/v1/profiles",
            params={"user_id": f"eq.{user_id}"},
        )

    return {"message": "User account deleted.", "id": user_id}


# --------------------------------------------------
# Private Storage: list, upload and delete files
# --------------------------------------------------

def _bucket_name() -> str:
    return os.getenv(
        "SUPABASE_STORAGE_BUCKET",
        "skillsetra-files",
    ).strip()


def _safe_storage_path(path: str) -> str:
    path = path.strip().replace("\\", "/").lstrip("/")

    if not path or "\x00" in path:
        raise HTTPException(status_code=400, detail="Invalid file path.")

    parts = path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    return path


@router.get("/files")
async def list_files(
    limit: int = Query(default=100, ge=1, le=MAX_ROWS),
    user: Any = Depends(get_current_user),
):
    _require_admin(user)
    bucket = _bucket_name()

    async with _http_client() as client:
        data = await _request_json(
            client,
            "POST",
            f"/storage/v1/object/list/{quote(bucket, safe='')}",
            json={
                "prefix": "",
                "limit": limit,
                "offset": 0,
                "sortBy": {"column": "created_at", "order": "desc"},
            },
        )

    files = []
    if isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue
            files.append({
                "name": item.get("name"),
                "id": item.get("id"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
                "metadata": item.get("metadata"),
            })

    return {"bucket": bucket, "files": files}


@router.post("/files", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    user: Any = Depends(get_current_user),
):
    _require_admin(user)

    filename = Path(file.filename or "upload").name
    content_type = (file.content_type or "application/octet-stream").lower()

    if content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=415,
            detail="This file type is not allowed.",
        )

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Files must be 8 MB or smaller.",
        )

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Use a unique object path to avoid overwriting another user's file.
    object_path = f"admin-uploads/{uuid4().hex}/{filename}"
    bucket = _bucket_name()

    async with _http_client() as client:
        try:
            response = await client.post(
                f"/storage/v1/object/{quote(bucket, safe='')}/{quote(object_path, safe='/')}",
                content=content,
                headers={
                    "Content-Type": content_type,
                    "x-upsert": "false",
                },
            )
        except httpx.HTTPError:
            raise HTTPException(
                status_code=502,
                detail="Could not upload the file to Supabase Storage.",
            )

        if response.is_error:
            raise HTTPException(
                status_code=502,
                detail="Supabase Storage rejected the upload. Verify that the private bucket exists.",
            )

    return {
        "message": "File uploaded successfully.",
        "bucket": bucket,
        "path": object_path,
        "filename": filename,
        "size": len(content),
        "content_type": content_type,
    }


@router.delete("/files")
async def delete_file(
    path: str = Query(..., min_length=1, max_length=500),
    user: Any = Depends(get_current_user),
):
    _require_admin(user)
    object_path = _safe_storage_path(path)
    bucket = _bucket_name()

    async with _http_client() as client:
        await _request_json(
            client,
            "DELETE",
            f"/storage/v1/object/{quote(bucket, safe='')}",
            json={"prefixes": [object_path]},
        )

    return {"message": "File deleted successfully.", "path": object_path}
