from django.urls import path
from .views import DocumentListAPIView

urlpatterns = [
    # Route traffic hitting 'documents/' to our View
    path('documents/', DocumentListAPIView.as_view(), name='document-list'),
]
