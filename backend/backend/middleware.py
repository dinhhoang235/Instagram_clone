from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
import logging

# Setup logger
logger = logging.getLogger('django')

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        if not token:
            return AnonymousUser()
            
        close_old_connections()
        access_token = AccessToken(token)
        # Try to get user_id from the token, falling back to 'sub' which is the default field
        # for user ID in JWT tokens
        user_id = access_token.get("user_id", access_token.get("sub"))
        if not user_id:
            return AnonymousUser()
        return User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist, KeyError) as e:
        logger.error(f"Authentication error: {str(e)}")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Unexpected error in authentication: {str(e)}")
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        token = None
        
        # Try to get token from query string
        if scope["type"] == "websocket":
            query_string = scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            token_list = query_params.get("token", [])
            if token_list and len(token_list) > 0:
                token = token_list[0]
        
        # If not found in query string, try headers
        if not token:
            headers = dict(scope.get("headers", []))
            auth_header = headers.get(b"authorization", b"").decode() if headers.get(b"authorization") else ""
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
        
        scope["user"] = await get_user_from_token(token)
        return await self.app(scope, receive, send)

def JWTAuthMiddlewareStack(app):
    return JWTAuthMiddleware(AuthMiddlewareStack(app))
