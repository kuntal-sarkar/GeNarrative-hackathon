"""Per-user AI request limits for TakeGrid's single-process Flask development server.

Register this as a before_request hook AFTER the Supabase JWT authentication hook.
Buckets are separate for general text, multi-part creative critiques and images.
For a production multi-worker deployment replace this in-memory store with a shared
atomic backend (e.g. Redis) and add quota / cost controls.
"""
import os
import time
from collections import defaultdict, deque
from threading import Lock

from flask import g, jsonify, request

_lock = Lock()
_calls = defaultdict(deque)
_last_cleanup = 0.0


def _env_limit(name, fallback):
    try:
        n = int(os.getenv(name, str(fallback)))
        return max(1, min(n, 10000))
    except (TypeError, ValueError):
        return fallback


def _ai_category(path):
    # Explicit image route must be identified before the generic /api/ai prefix.
    if path.startswith('/api/ai/storyboard/image'):
        return 'image'

    # A single large-project review can request up to 20 partial analyses + 1
    # synthesis. Keep them out of the regular 15 RPM text bucket.
    if path == '/api/ai/critics':
        return 'critics'
    if path.startswith('/api/projects/') and '/ai/' in path:
        suffix = path.split('/ai/', 1)[1].rstrip('/')
        if suffix in ('critique', 'critique/synthesize'):
            return 'critics'
        return 'text'

    if path.startswith('/api/ai/') or path.startswith('/api/global-ai/'):
        return 'text'
    return None


def limit_ai_request():
    """Return a Flask response only when a signed-in user's quota is exceeded."""
    if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
        return None
    category = _ai_category(request.path)
    if not category:
        return None

    user_id = getattr(g, 'owner_id', None)
    if not user_id:
        return jsonify(success=False, error='Sign in required.'), 401

    if category == 'image':
        limit = _env_limit('TAKEGRID_AI_IMAGE_RPM', 3)
    elif category == 'critics':
        limit = _env_limit('TAKEGRID_AI_CRITICS_RPM', 30)
    else:
        limit = _env_limit('TAKEGRID_AI_TEXT_RPM', 15)

    window = 60.0
    key = (str(user_id), category)
    now = time.monotonic()
    global _last_cleanup
    with _lock:
        if now - _last_cleanup > 300:
            for k, values in list(_calls.items()):
                while values and values[0] <= now - window:
                    values.popleft()
                if not values:
                    del _calls[k]
            _last_cleanup = now
        calls = _calls[key]
        while calls and calls[0] <= now - window:
            calls.popleft()
        if len(calls) >= limit:
            retry = max(1, int(calls[0] + window - now) + 1)
            response = jsonify(
                success=False,
                error=f'AI request limit reached. Try again in {retry} seconds.',
                retryAfter=retry,
            )
            response.status_code = 429
            response.headers['Retry-After'] = str(retry)
            response.headers['Cache-Control'] = 'no-store'
            return response
        calls.append(now)
    return None
