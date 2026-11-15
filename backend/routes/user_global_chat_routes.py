"""Authenticated cloud persistence for Home AI chat history (not project chats)."""
from datetime import datetime, timezone
from flask import Blueprint, g, jsonify, request, current_app
from routes.user_project_routes import authenticated
from services.supabase_client import get_supabase

user_global_chat_bp = Blueprint("user_global_chat", __name__, url_prefix="/api/user/global-chat")
TABLE = "takegrid_global_chats"
MAX_BYTES = 1024 * 1024


def failed(exc):
    current_app.logger.exception("Global chat DB operation failed")
    return jsonify(success=False, error="Global chat database operation failed. Check Flask logs."), 502


@user_global_chat_bp.get("")
@authenticated
def read_global_chats():
    try:
        rows = (get_supabase().table(TABLE).select("threads,current_id,updated_at")
                .eq("owner_id", g.owner_id).limit(1).execute())
        return jsonify(success=True, chat=rows.data[0] if rows.data else None)
    except Exception as exc:
        return failed(exc)


@user_global_chat_bp.put("")
@authenticated
def save_global_chats():
    if request.content_length is not None and request.content_length > MAX_BYTES:
        return jsonify(success=False, error="Chat history exceeds 1 MB limit."), 413
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify(success=False, error="JSON object required."), 400
    threads = body.get("threads")
    current_id = body.get("currentId", "")
    if (not isinstance(threads, list) or len(threads) > 30 or
        not isinstance(current_id, str) or len(current_id) > 100 or
        any(not isinstance(t, dict) or not isinstance(t.get("id"), str) or
            not isinstance(t.get("messages"), list) or len(t["messages"]) > 100
            for t in threads)):
        return jsonify(success=False, error="Invalid chat history."), 400
    try:
        get_supabase().table(TABLE).upsert({
            "owner_id": g.owner_id,
            "threads": threads,
            "current_id": current_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, on_conflict="owner_id").execute()
        return jsonify(success=True)
    except Exception as exc:
        return failed(exc)
