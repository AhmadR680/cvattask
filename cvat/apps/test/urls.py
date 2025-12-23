from django.urls import path
from .views import ClassImageStatsAPIView

urlpatterns = [
    path('class-image-stats/', ClassImageStatsAPIView.as_view(), name='class-image-stats'),
]