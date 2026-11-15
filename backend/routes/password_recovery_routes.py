"""TakeGrid password recovery: anonymous, rate-limited email request endpoint.

Requires SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (public key only).
Do not use a privileged Supabase service-role/secret key for this endpoint.

Development limiter is per Flask process. Production needs shared limits and
correct client-IP handling behind a trusted reverse proxy.
"""

import hashlib
import json
import os
import re
import secrets
import time
from collections import defaultdict, deque
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from flask import Blueprint, current_app, jsonify, request

password_recovery_bp = Blueprint('password_recovery', __name__, url_prefix='/api/auth')
_guard = Lock()
_ip_calls = defaultdict(deque)
_email_calls = {}
_global_calls = deque()
_last_gc = 0.0
_salt = secrets.token_bytes(32)
_EMAIL_RE = re.compile(r'^[^\s@]{1,64}@[^\s@]{1,190}$')
_SAFE_ERROR_CODE_RE = re.compile(r'^[a-zA-Z0-9_.-]{1,80}$')

# Never accept an arbitrary redirectTo from the incoming JSON body.
_ALLOWED_ORIGINS = ('http://localhost:5173', 'http://127.0.0.1:5173')


def _retry_response(seconds):
    seconds = max(1, int(seconds) + 1)
    response = jsonify(
        success=False,
        error='Too many reset requests. Please try again later.',
        retryAfter=seconds,
    )
    response.status_code = 429
    response.headers['Retry-After'] = str(seconds)
    response.headers['Cache-Control'] = 'no-store'
    return response


def _limits(email, remote):
    """5 per IP/15m, 1 per email/60s, 30 total/hour per Flask process."""
    global _last_gc
    now = time.monotonic()
    hashed = hashlib.blake2s(email.encode('utf-8'), key=_salt, digest_size=16).hexdigest()

    with _guard:
        if now - _last_gc > 600:
            for key, entries in list(_ip_calls.items()):
                while entries and entries[0] <= now - 900:
                    entries.popleft()
                if not entries:
                    _ip_calls.pop(key, None)
            for key, last in list(_email_calls.items()):
                if last <= now - 900:
                    _email_calls.pop(key, None)
            _last_gc = now

        ip_entries = _ip_calls[remote]
        while ip_entries and ip_entries[0] <= now - 900:
            ip_entries.popleft()
        while _global_calls and _global_calls[0] <= now - 3600:
            _global_calls.popleft()

        if len(ip_entries) >= 5:
            return _retry_response(ip_entries[0] + 900 - now)
        if len(_global_calls) >= 30:
            return _retry_response(_global_calls[0] + 3600 - now)
        last = _email_calls.get(hashed)
        if last is not None and now - last < 60:
            return _retry_response(last + 60 - now)

        ip_entries.append(now)
        _global_calls.append(now)
        _email_calls[hashed] = now
    return None


def _safe_provider_error_code(http_error):
    """Read only a machine error code; never log the provider message/details."""
    try:
        data = json.loads(http_error.read(2048).decode('utf-8'))
        if not isinstance(data, dict):
            return 'unknown'
        value = data.get('error_code') or data.get('code') or 'unknown'
        if isinstance(value, str) and _SAFE_ERROR_CODE_RE.fullmatch(value):
            return value
    except (ValueError, UnicodeDecodeError, OSError):
        pass
    return 'unknown'


@password_recovery_bp.post('/password-reset/request')
def request_password_reset():
    if request.content_length is not None and request.content_length > 4096:
        return jsonify(success=False, error='Invalid request.'), 413

    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get('email'), str):
        return jsonify(success=False, error='A valid email is required.'), 400

    captcha_token = body.get('captchaToken')
    if not isinstance(captcha_token, str) or not 1 <= len(captcha_token) <= 2048:
        return jsonify(success=False, error='Complete CAPTCHA verification.'), 400

    email = body['email'].strip().lower()
    if len(email) > 254 or not _EMAIL_RE.fullmatch(email):
        return jsonify(success=False, error='A valid email is required.'), 400

    origin = request.headers.get('Origin', '')
    if origin not in _ALLOWED_ORIGINS:
        return jsonify(success=False, error='Origin not allowed.'), 403

    blocked = _limits(email, request.remote_addr or 'unknown')
    if blocked is not None:
        return blocked

    url = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
    publishable = os.getenv('SUPABASE_PUBLISHABLE_KEY', '').strip()
    if not url.startswith('https://') or not publishable:
        current_app.logger.error('Password recovery unavailable: missing Supabase Auth configuration')
        return jsonify(success=False, error='Password recovery is temporarily unavailable.'), 503

    redirect = origin + '/reset-password'
    target = url + '/auth/v1/recover?redirect_to=' + quote(redirect, safe='')

    # Let Supabase validate the Turnstile token. Do NOT also call Siteverify:
    # Turnstile tokens are single-use.
    payload = json.dumps({
        'email': email,
        'gotrue_meta_security': {'captcha_token': captcha_token},
    }).encode('utf-8')
    provider_request = Request(target, data=payload, method='POST', headers={
        'apikey': publishable,
        'Content-Type': 'application/json',
    })

    try:
        with urlopen(provider_request, timeout=10) as provider_response:
            provider_response.read(4096)
    except HTTPError as exc:
        current_app.logger.warning(
            'Password recovery rejected: HTTP %s, code=%s',
            exc.code,
            _safe_provider_error_code(exc),
        )
    except (URLError, TimeoutError, OSError) as exc:
        current_app.logger.warning(
            'Password recovery network failure: %s',
            type(exc).__name__,
        )

    # Identical response regardless of account existence or upstream provider error.
    response = jsonify(
        success=True,
        message='If the email is registered, a password reset code may be sent shortly.',
    )
    response.headers['Cache-Control'] = 'no-store'
    return response
