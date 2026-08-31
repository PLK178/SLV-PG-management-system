import json
import os

from redis import Redis


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL_SECONDS = 60
_client = None


def get_cache_client() -> Redis:
    global _client
    if _client is None:
        _client = Redis.from_url(REDIS_URL, decode_responses=True)
    return _client


def get_cached_json(key: str):
    try:
        value = get_cache_client().get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


def set_cached_json(key: str, value) -> None:
    try:
        get_cache_client().setex(key, CACHE_TTL_SECONDS, json.dumps(value))
    except Exception:
        pass


def delete_cached(key: str) -> None:
    try:
        get_cache_client().delete(key)
    except Exception:
        pass
