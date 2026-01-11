"""Supabase client."""

from supabase import Client, create_client
from config.settings import SUPABASE_SERVICE_KEY, SUPABASE_URL

_client: Client | None = None


def get_client() -> Client:
    """Get or create Supabase client."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client
