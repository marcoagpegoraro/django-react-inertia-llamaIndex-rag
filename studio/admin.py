from django.contrib import admin

from .models import CampaignItem


@admin.register(CampaignItem)
class CampaignItemAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "channel",
        "status",
        "priority",
        "due_date",
        "is_featured",
    )
    list_filter = ("status", "priority", "channel", "is_featured")
    search_fields = ("title", "owner", "summary")
