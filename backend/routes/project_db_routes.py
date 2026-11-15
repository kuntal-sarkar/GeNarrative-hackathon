"""Local-development-only Supabase project CRUD API.

Requires TAKEGRID_ENABLE_DEV_DB_API=1 and a loopback client.
NEVER enable this unauthenticated API in production or behind a public tunnel.
"""
import os
from uuid import UUID
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from postgrest.exceptions import APIError

from services.supabase_client import get_supabase

project_db_bp = Blueprint("project_db", __name__, url_prefix="/api/db/projects")
TABLE = "takegrid_projects"
MAX_BYTES = 2 * 1024 * 1024
LOCAL_IPS = {"127.0.0.1", "::1"}
ALLOWED_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}


def _utc():
    return datetime.now(timezone.utc).isoformat()


def _uuid(value):
    try:
        parsed = UUID(str(value))
        if parsed.version != 4:
            return None
        return str(parsed)
    except (ValueError, AttributeError, TypeError):
        return None


@project_db_bp.before_request
def local_only():
    if os.environ.get("TAKEGRID_ENABLE_DEV_DB_API") != "1":
        return jsonify({"success": False, "error": "Development project API disabled."}), 404
    if request.remote_addr not in LOCAL_IPS:
        return jsonify({"success": False, "error": "Local development only."}), 403
    origin = request.headers.get("Origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return jsonify({"success": False, "error": "Origin not allowed."}), 403
    if request.content_length is not None and request.content_length > MAX_BYTES:
        return jsonify({"success": False, "error": "Project payload too large."}), 413


def _payload():
    project = request.get_json(silent=True)
    if not isinstance(project, dict):
        return None, "JSON project object required."
    pid = _uuid(project.get("id"))
    if pid is None:
        return None, "Valid UUIDv4 project id required."
    if not isinstance(project.get("title"), str) or not project["title"].strip():
        return None, "Nonempty project title required."
    if not isinstance(project.get("story", ""), str):
        return None, "Story must be text."
    if not isinstance(project.get("scenes", []), list):
        return None, "Scenes must be an array."
    project["id"] = pid
    return project, None


def _db_error(exc):
    # Avoid returning database internals, secrets or schema details to the browser.
    if isinstance(exc, APIError) and getattr(exc, "code", None) == "23505":
        return jsonify({"success": False, "error": "Project already exists."}), 409
    return jsonify({"success": False, "error": "Database operation failed."}), 502


@project_db_bp.get("")
def list_projects():
    try:
        result = (get_supabase().table(TABLE).select("data")
                  .order("updated_at", desc=True).limit(100).execute())
        return jsonify({"success": True, "projects": [r["data"] for r in result.data]})
    except Exception as exc:
        return _db_error(exc)


@project_db_bp.get("/<project_id>")
def read_project(project_id):
    pid = _uuid(project_id)
    if not pid:
        return jsonify({"success": False, "error": "Invalid project id."}), 400
    try:
        result = (get_supabase().table(TABLE).select("data")
                  .eq("id", pid).limit(1).execute())
        if not result.data:
            return jsonify({"success": False, "error": "Project not found."}), 404
        return jsonify({"success": True, "project": result.data[0]["data"]})
    except Exception as exc:
        return _db_error(exc)


@project_db_bp.post("")
def create_project():
    project, error = _payload()
    if error:
        return jsonify({"success": False, "error": error}), 400
    try:
        get_supabase().table(TABLE).insert({"id": project["id"], "data": project}).execute()
        return jsonify({"success": True, "project": project}), 201
    except Exception as exc:
        return _db_error(exc)


@project_db_bp.put("/<project_id>")
def update_project(project_id):
    pid = _uuid(project_id)
    if not pid:
        return jsonify({"success": False, "error": "Invalid project id."}), 400
    project, error = _payload()
    if error:
        return jsonify({"success": False, "error": error}), 400
    if project["id"] != pid:
        return jsonify({"success": False, "error": "URL id and project id mismatch."}), 400
    project["updatedAt"] = _utc()
    try:
        result = (get_supabase().table(TABLE)
                  .update({"data": project, "updated_at": project["updatedAt"]})
                  .eq("id", pid).execute())
        if not result.data:
            return jsonify({"success": False, "error": "Project not found."}), 404
        return jsonify({"success": True, "project": result.data[0]["data"]})
    except Exception as exc:
        return _db_error(exc)


@project_db_bp.delete("/<project_id>")
def delete_project(project_id):
    pid = _uuid(project_id)
    if not pid:
        return jsonify({"success": False, "error": "Invalid project id."}), 400
    try:
        result = (get_supabase().table(TABLE).delete().eq("id", pid).execute())
        if not result.data:
            return jsonify({"success": False, "error": "Project not found."}), 404
        return jsonify({"success": True, "deletedId": pid})
    except Exception as exc:
        return _db_error(exc)
