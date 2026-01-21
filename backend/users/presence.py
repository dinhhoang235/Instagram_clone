from django.core.cache import cache


def _key(user_id: int) -> str:
    return f"presence:{user_id}"


def increment_presence(user_id: int) -> int:
    """Increment presence counter for a user and return new count."""
    key = _key(user_id)
    try:
        # cache.incr raises ValueError if key doesn't exist
        return cache.incr(key)
    except ValueError:
        cache.set(key, 1, None)
        return 1


def decrement_presence(user_id: int) -> int:
    """Decrement presence counter for a user and return new count (>=0)."""
    key = _key(user_id)
    try:
        val = cache.decr(key)
        if val <= 0:
            cache.delete(key)
            return 0
        return val
    except ValueError:
        # Key did not exist
        return 0


def is_user_online(user_id: int) -> bool:
    return bool(cache.get(_key(user_id), 0))
