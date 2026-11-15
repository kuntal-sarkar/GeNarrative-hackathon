"""TakeGrid: authenticate all AI mutation endpoints and check project ownership.

Imported by Flask app. API keys stay on the backend.
"""
from uuid import UUID
from flask import g, jsonify, request, current_app
from services.supabase_client import get_supabase


def protect_ai_request():
    if request.method == 'OPTIONS':
        return None
    path = request.path
    guarded = (path.startswith('/api/ai/') or
               path.startswith('/api/global-ai/') or
               (path.startswith('/api/projects/') and '/ai/' in path))
    # Storyboard GET needs Bearer auth too: direct image URLs are never public.
    private_frame_get = (request.method == 'GET' and
                         path.startswith('/api/ai/storyboard/frames/'))
    if not guarded or (request.method not in ('POST', 'PUT', 'PATCH', 'DELETE')
                       and not private_frame_get):
        return None

    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer ') or not authorization[7:].strip():
        return jsonify(success=False, error='Sign in required.'), 401

    try:
        user_result = get_supabase().auth.get_user(authorization[7:].strip())
        owner_id = str(user_result.user.id) if user_result and user_result.user else None
    except Exception:
        current_app.logger.warning('AI authentication failed', exc_info=False)
        owner_id = None
    if not owner_id:
        return jsonify(success=False, error='Invalid or expired session.'), 401
    g.owner_id = owner_id

    if path.startswith('/api/projects/') and '/ai/' in path:
        project_id = path[len('/api/projects/'):].split('/', 1)[0]
        try:
            parsed = UUID(project_id)
            if parsed.version != 4:
                raise ValueError('Not UUID v4')
        except (ValueError, AttributeError):
            return jsonify(success=False, error='Invalid project id.'), 400
        try:
            response = (get_supabase().table('takegrid_projects')
                        .select('id').eq('owner_id', owner_id)
                        .eq('id', str(parsed)).limit(1).execute())
        except Exception:
            current_app.logger.exception('Project authorization lookup failed')
            return jsonify(success=False, error='Project authorization unavailable.'), 503
        if not response.data:
            return jsonify(success=False, error='Project not found.'), 404
    return None
