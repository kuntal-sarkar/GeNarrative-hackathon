"""Shared Gemini transport for TakeGrid AI services.

Keep a single process-lifetime HTTPX client. All service-specific model settings,
request schemas and existing error handling remain in their original modules.
"""

import os

import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

# Same transport configuration as the successful isolated connectivity test.
# Keep TLS validation enabled and honour configured network proxies.
_transport = httpx.Client(http2=False, timeout=45.0, trust_env=True)
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(httpx_client=_transport),
)
