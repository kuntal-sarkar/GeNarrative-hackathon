
import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Backend-only Supabase client."""
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SECRET_KEY", "").strip()

    if not url or not key:
        raise RuntimeError("Supabase configuration is missing.")

    return create_client(url, key)
