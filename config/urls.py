from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from documents.views import RegisterView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('documents.urls')),
    path('api/login/', obtain_auth_token),
    path('api/register/', RegisterView.as_view()),
]
