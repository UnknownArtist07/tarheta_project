from django.contrib import admin
from .models import TarhetaAccount


@admin.register(TarhetaAccount)
class TarhetaAccountAdmin(admin.ModelAdmin):
	list_display = ('username', 'full_name', 'email', 'created_at')
	search_fields = ('username', 'full_name', 'email')
	readonly_fields = ('created_at',)
