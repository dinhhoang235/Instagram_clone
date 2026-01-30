from django.conf import settings
from django_redis import get_redis_connection


def _key(user_id: int) -> str:
    return f"presence:{user_id}"


def increment_presence(user_id: int) -> int:
    """Increment presence counter for a user and return new count. Also (re)set TTL."""
    key = _key(user_id)
    redis = get_redis_connection("default")
    # Use pipeline to make INCR and EXPIRE happen together
    with redis.pipeline() as pipe:
        pipe.incr(key)
        pipe.expire(key, settings.PRESENCE_TTL)
        val, _ = pipe.execute()
    return int(val)


def decrement_presence(user_id: int) -> int:
    """Decrement presence counter for a user and return new count (>=0)."""
    key = _key(user_id)
    redis = get_redis_connection("default")
    val = redis.decr(key)
    if val <= 0:
        redis.delete(key)
        return 0
    # keep TTL up-to-date when user remains present
    redis.expire(key, settings.PRESENCE_TTL)
    return int(val)


def refresh_presence(user_id: int) -> int:
    """Refresh presence TTL without incrementing connection count. If key doesn't exist set it to 1."""
    key = _key(user_id)
    redis = get_redis_connection("default")
    # If key exists, just update TTL
    if redis.exists(key):
        redis.expire(key, settings.PRESENCE_TTL)
        try:
            return int(redis.get(key) or 0)
        except Exception:
            val = redis.get(key)
            return int(val) if val is not None else 0

    # Key didn't exist: set to 1 with TTL
    redis.set(key, 1, ex=settings.PRESENCE_TTL)
    return 1


def is_user_online(user_id: int) -> bool:
    # keep using Django cache API for reads
    from django.core.cache import cache

    return bool(cache.get(_key(user_id), 0))
