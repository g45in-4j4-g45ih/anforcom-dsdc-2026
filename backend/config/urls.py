from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('items.urls')),
    path('api/', include('locations.urls')),
    path('api/', include('forum.urls')),
    path('api/', include('reviews.urls')),
    path('api/materials/', include('materials.urls')),
    path('api/impact/', include('impact.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
