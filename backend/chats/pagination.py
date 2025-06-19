from rest_framework.pagination import LimitOffsetPagination

class MessagePagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100
