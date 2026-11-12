"""TakeGrid model routing, quota-aware per-model failover, and shared TLS-safe transport.

One top-level generate_content call per candidate model. Google SDK may perform
its own internal retries. No retries on invalid input, auth, or malformed responses.
Never logs prompts, context, API keys or generated text.
"""

import logging
import os
import httpx
import threading
import time
from google.genai import errors as genai_errors
from services.gemini_client import client as _client

_log = logging.getLogger(__name__)

# Prefer independent high-quota Lite models for frequent structured requests.
# Chat uses a dedicated Lite fallback; story uses stronger Flash models.
DEFAULT_ROUTES = {
    # Chat has a reserved Lite model, verified working by the project owner.
    # Attempt Lite immediately after the first strong Flash failure to reduce
    # latency from overloaded stronger models.
    "chat": ("gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"),
    "story": ("gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.6-flash"),
    "project_builder": ("gemini-3.1-flash-lite", "gemini-2.5-flash-lite"),
    "general": ("gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"),
    "critics": ("gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"),
    "scenes": ("gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"),
    "shots": ("gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"),
    "characters": ("gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"),
    "continuity": ("gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"),
}

# Optional overrides in .env without modifying existing GEMINI_MODEL.
# Format: comma-separated Google model IDs, in priority order.
OVERRIDE_ENV = {
    "chat": "TAKEGRID_CHAT_MODELS",
    "story": "TAKEGRID_STORY_MODELS",
    "project_builder": "TAKEGRID_BUILDER_MODELS",
    "general": "TAKEGRID_GENERAL_MODELS",
    "critics": "TAKEGRID_CRITICS_MODELS",
    "scenes": "TAKEGRID_SCENES_MODELS",
    "shots": "TAKEGRID_SHOTS_MODELS",
    "characters": "TAKEGRID_CHARACTERS_MODELS",
    "continuity": "TAKEGRID_CONTINUITY_MODELS",
}


def route_models(role):
    if role not in DEFAULT_ROUTES:
        raise ValueError("Unknown AI role: " + str(role))
    value = os.getenv(OVERRIDE_ENV[role], "").strip()
    choices = value.split(",") if value else DEFAULT_ROUTES[role]
    models = tuple(dict.fromkeys(m.strip() for m in choices if m.strip()))
    if not models:
        raise ValueError("Empty model route: " + role)
    # Enforce the dedicated Chat Lite pool, including when .env overrides exist.
    dedicated = "gemini-3.5-flash-lite"
    if role == "chat":
        if dedicated not in models:
            # Respect custom strong-model order while keeping a reliable Lite fallback.
            models = models[:1] + (dedicated,) + models[1:]
    elif dedicated in models:
        raise ValueError(
            dedicated + " is reserved for Chat. Remove it from " + OVERRIDE_ENV[role]
        )
    return models


# Cooldown is shared across all AI services within the Flask process.
# This prevents repeatedly hitting models known to be rate-limited or overloaded.
_cooldown_until = {}
_cooldown_lock = threading.Lock()


def _cooldown_remaining(model):
    with _cooldown_lock:
        return max(0.0, _cooldown_until.get(model, 0.0) - time.monotonic())


def _mark_unavailable(model, exc):
    code = getattr(exc, "code", None)
    # 429 may mean per-minute or daily limit; 2-minute cooldown for conservative fallback.
    seconds = 120 if code == 429 else 30
    with _cooldown_lock:
        _cooldown_until[model] = time.monotonic() + seconds


def _retryable(exc):
    # Rate and capacity issues, and transient Google server problems only.
    if isinstance(exc, genai_errors.APIError):
        return getattr(exc, "code", None) in {429, 500, 502, 503, 504}
    return isinstance(exc, (httpx.TimeoutException, httpx.TransportError))


class _ModelsProxy:
    def __init__(self, role):
        self._role = role

    def generate_content(self, *, model, **kwargs):
        # Preserve the exact original contents, system instruction, output schema,
        # safety settings, and other request kwargs for every candidate.
        choices = route_models(self._role)
        # Skip models currently known to be unavailable, unless *all* are blocked.
        available = tuple(m for m in choices if not _cooldown_remaining(m))
        candidates = available or (min(choices, key=_cooldown_remaining),)
        for index, candidate in enumerate(candidates):
            try:
                result = _client.models.generate_content(model=candidate, **kwargs)
                # Only Chat gets empty-text failover. Other AI services may
                # return structured outputs and must keep their existing schema.
                if self._role == "chat" and not (getattr(result, "text", None) or "").strip():
                    if index < len(candidates) - 1:
                        _log.warning(
                            "TakeGrid Chat model returned empty text; trying next model=%s",
                            candidates[index + 1],
                        )
                        continue
                    raise RuntimeError("All available Chat models returned no usable text")
                if index or candidate != choices[0]:
                    _log.info("TakeGrid AI failover succeeded role=%s model=%s", self._role, candidate)
                return result
            except (genai_errors.APIError, httpx.TransportError) as exc:
                if not _retryable(exc):
                    raise
                _mark_unavailable(candidate, exc)
                if index == len(candidates) - 1:
                    raise
                _log.warning(
                    "TakeGrid AI failover role=%s model=%s reason=%s status=%s next=%s",
                    self._role,
                    candidate,
                    type(exc).__name__,
                    getattr(exc, "code", "network"),
                    candidates[index + 1],
                )
        raise RuntimeError("No AI models configured")

    def __getattr__(self, attr):
        return getattr(_client.models, attr)


class _RoutedClient:
    def __init__(self, role):
        self.models = _ModelsProxy(role)

    def __getattr__(self, attr):
        return getattr(_client, attr)


def client_for(role):
    # Cheap per-service proxy; all roles share the existing verified HTTPX client.
    return _RoutedClient(role)
