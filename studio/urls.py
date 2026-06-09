from django.urls import path

from . import views

app_name = "studio"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("campaigns/", views.library, name="library"),
    path("campaigns/<int:item_id>/", views.campaign_detail, name="campaign_detail"),
    path("policy-assistant/", views.policy_assistant, name="policy_assistant"),
    path("items/create/", views.create_item, name="create_item"),
    path("items/<int:item_id>/status/", views.update_status, name="update_status"),
    path("items/<int:item_id>/feature/", views.toggle_featured, name="toggle_featured"),
]
