"""Advisory-only Home Global AI endpoints; no server-side project writes."""
from flask import Blueprint, request, jsonify
from google.genai import errors as genai_errors
from services.global_ai_service import global_chat, global_project_proposal
from routes.project_ai_routes import _read_chat_request

global_ai_bp = Blueprint('global_ai', __name__, url_prefix='/api/global-ai')


def _handle(action):
    try:
        data, attachments, names = _read_chat_request()
        projects = data.get('projects') or []
        history = data.get('history') or []
        message = data.get('message') or ''
        if action == 'chat':
            return jsonify({'success': True, 'answer': global_chat(message, projects, history, attachments),
                            'processedAttachments': names}), 200
        if attachments:
            raise ValueError('Attachments are supported in chat; discuss the file there before creating a proposal.')
        return jsonify({'success': True, 'proposal': global_project_proposal(message, projects, history)}), 200
    except ValueError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400
    except genai_errors.APIError as exc:


        print(
    "[PROJECT BUILDER DEBUG]",
    "Provider status:", getattr(exc, "code", None),
    "Error type:", type(exc).__name__,
    flush=True,
)


        code = getattr(exc, 'code', None)
        status = code if code in (429, 503) else 502
        reason = 'AI is busy right now. Please try again shortly.' if code == 429 else 'AI service unavailable. Please retry.'
        return jsonify({'success': False, 'error': reason}), status
    except Exception:
        return jsonify({'success': False, 'error': 'Global AI request failed. Check Flask logs and retry.'}), 500


@global_ai_bp.post('/chat')
def chat():
    return _handle('chat')


@global_ai_bp.post('/proposal')
def proposal():
    return _handle('proposal')
