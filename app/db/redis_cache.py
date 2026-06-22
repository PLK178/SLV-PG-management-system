import json
import logging
# pyrefly: ignore [missing-import]
import redis
from typing import Optional, List
# pyrefly: ignore [missing-import]
from redis.retry import Retry
# pyrefly: ignore [missing-import]
from redis.backoff import NoBackoff

logger = logging.getLogger("uvicorn.error")

try:
    # Initialize redis client with extremely short timeouts and 0 retries to avoid any blocking/hanging
    redis_client = redis.Redis(
        host="127.0.0.1", 
        port=6379, 
        db=0, 
        socket_timeout=0.05, 
        socket_connect_timeout=0.05,
        retry=Retry(NoBackoff(), 0)
    )
except Exception as e:
    logger.warning(f"Failed to initialize Redis client: {e}")
    redis_client = None

def get_skills_cache(user_id: int) -> Optional[List[dict]]:
    """Retrieve user's skills cache from Redis."""
    if not redis_client:
        return None
    try:
        cache_key = f"skills:user:{user_id}"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            logger.info(f"Redis cache hit for user {user_id}")
            return json.loads(cached_data)
    except Exception as e:
        logger.warning(f"Redis not available (get_skills_cache fallback): {e}")
    return None

def set_skills_cache(user_id: int, skills_list: List[dict]):
    """Set user's skills cache in Redis with 10-minute expiration."""
    if not redis_client:
        return
    try:
        cache_key = f"skills:user:{user_id}"
        redis_client.set(cache_key, json.dumps(skills_list), ex=600)
        logger.info(f"Redis cache populated for user {user_id}")
    except Exception as e:
        logger.warning(f"Redis not available (set_skills_cache fallback): {e}")

def clear_skills_cache(user_id: int):
    """Invalidate user's skills cache from Redis."""
    if not redis_client:
        return
    try:
        cache_key = f"skills:user:{user_id}"
        redis_client.delete(cache_key)
        logger.info(f"Redis cache cleared/invalidated for user {user_id}")
    except Exception as e:
        logger.warning(f"Redis not available (clear_skills_cache fallback): {e}")
