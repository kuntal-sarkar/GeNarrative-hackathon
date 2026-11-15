"""Authenticated, per-user TakeGrid project persistence.

Every request must supply a Supabase access token. Owner is derived from
Supabase Auth, never from the payload. Service-role queries are always scoped
by owner_id, including updates and deletes.
"""
from datetime import datetime, timezone
from functools import wraps
from uuid import UUID

from flask import Blueprint, g, jsonify, request
from postgrest.exceptions import APIError

from services.supabase_client import get_supabase

user_projects_bp = Blueprint("user_projects", __name__, url_prefix="/api/user/projects")
TABLE = "takegrid_projects"
MAX_BYTES = 2 * 1024 * 1024


def _utc():
    return datetime.now(timezone.utc).isoformat()


def _uuid4(value):
    try:
        item = UUID(str(value))
        return str(item) if item.version == 4 else None
    except (TypeError, ValueError, AttributeError):
        return None


def authenticated(func):
    @wraps(func)
    def inner(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer ") or not auth[7:].strip():
            return jsonify(success=False, error="Sign in required."), 401
        token = auth[7:].strip()
        try:
            result = get_supabase().auth.get_user(token)
            uid = str(result.user.id) if result and result.user else None
        except Exception:
            uid = None
        if not uid:
            return jsonify(success=False, error="Invalid or expired session."), 401
        g.owner_id = uid
        return func(*args, **kwargs)
    return inner


def parse_project():
    if request.content_length is not None and request.content_length > MAX_BYTES:
        return None, "Project exceeds the 2 MB payload limit.", 413
    project = request.get_json(silent=True)
    if not isinstance(project, dict):
        return None, "Project JSON object required.", 400
    pid = _uuid4(project.get("id"))
    if not pid:
        return None, "Valid UUIDv4 project id required.", 400
    if not isinstance(project.get("title"), str) or not project["title"].strip():
        return None, "Non-empty project title required.", 400
    if not isinstance(project.get("story", ""), str):
        return None, "Story must be text.", 400
    if not isinstance(project.get("scenes", []), list):
        return None, "Scenes must be an array.", 400
    project["id"] = pid
    # Don't trust payload ownership or allow it to override the database owner.
    project.pop("owner_id", None)
    project.pop("ownerId", None)
    return project, None, None


def db_error(exc):
    print(f"[TAKEGRID DB ERROR] {type(exc).__name__}: {exc}", flush=True)

    if isinstance(exc, APIError) and str(getattr(exc, "code", "")) == "23505":
        return jsonify(success=False, error="Project already exists."), 409

    return jsonify(
        success=False,
        error="Project database operation failed. Check Flask server logs."
    ), 502


@user_projects_bp.get("")
@authenticated
def list_projects():
    try:
        rows = (get_supabase().table(TABLE).select("data")
                .eq("owner_id", g.owner_id)
                .order("updated_at", desc=True).limit(500).execute())
        return jsonify(success=True, projects=[r["data"] for r in rows.data])
    except Exception as exc:
        return db_error(exc)


@user_projects_bp.get("/<project_id>")
@authenticated
def read_project(project_id):
    pid = _uuid4(project_id)
    if not pid:
        return jsonify(success=False, error="Invalid project id."), 400
    try:
        rows = (get_supabase().table(TABLE).select("data")
                .eq("owner_id", g.owner_id).eq("id", pid).limit(1).execute())
        if not rows.data:
            return jsonify(success=False, error="Project not found."), 404
        return jsonify(success=True, project=rows.data[0]["data"])
    except Exception as exc:
        return db_error(exc)


@user_projects_bp.post("")
@authenticated
def create_project():
    project, error, code = parse_project()
    if error:
        return jsonify(success=False, error=error), code
    now = _utc()
    project["updatedAt"] = project.get("updatedAt") or now
    try:
        get_supabase().table(TABLE).insert({
            "id": project["id"], "owner_id": g.owner_id, "data": project,
            "created_at": project.get("createdAt") or now,
            "updated_at": project["updatedAt"],
        }).execute()
        return jsonify(success=True, project=project), 201
    except Exception as exc:
        return db_error(exc)


@user_projects_bp.put("/<project_id>")
@authenticated
def update_project(project_id):
    pid = _uuid4(project_id)
    project, error, code = parse_project()
    if not pid or (project and project["id"] != pid):
        return jsonify(success=False, error="Project id mismatch."), 400
    if error:
        return jsonify(success=False, error=error), code
    now = _utc()
    project["updatedAt"] = now
    try:
        rows = (get_supabase().table(TABLE)
                .update({"data": project, "updated_at": now})
                .eq("owner_id", g.owner_id).eq("id", pid).execute())
        if not rows.data:
            return jsonify(success=False, error="Project not found."), 404
        return jsonify(success=True, project=rows.data[0]["data"])
    except Exception as exc:
        return db_error(exc)


@user_projects_bp.delete("/<project_id>")
@authenticated
def delete_project(project_id):
    pid = _uuid4(project_id)
    if not pid:
        return jsonify(success=False, error="Invalid project id."), 400
    try:
        rows = (get_supabase().table(TABLE).delete()
                .eq("owner_id", g.owner_id).eq("id", pid).execute())
        if not rows.data:
            return jsonify(success=False, error="Project not found."), 404
        return jsonify(success=True, deletedId=pid)
    except Exception as exc:
        return db_error(exc)
