# search/models.py
from django.db import models
from django.contrib.auth.models import User

class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="searches")  # Người đi tìm
    searched_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="being_searched")  # Người bị tìm
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-searched_at']
        unique_together = ('user', 'searched_user')  # Mỗi user chỉ lưu 1 record tìm người A
        indexes = [
            models.Index(fields=["user", "searched_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} searched {self.searched_user.username}"
