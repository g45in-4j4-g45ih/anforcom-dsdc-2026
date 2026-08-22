from django.contrib import admin
from .models import Store, Item, ItemImage, Klaim, Location

admin.site.register(Store)
admin.site.register(Item)
admin.site.register(ItemImage)
admin.site.register(Klaim)
admin.site.register(Location)