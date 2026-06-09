from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from inertia.test import InertiaTestCase

from .models import CampaignItem


class StudioViewTests(InertiaTestCase):
    def setUp(self):
        super().setUp()
        self.today = timezone.localdate()
        self.item = CampaignItem.objects.create(
            title="Q3 launch brief",
            owner="Mina",
            channel=CampaignItem.Channel.NEWSLETTER,
            status=CampaignItem.Status.WRITING,
            priority=CampaignItem.Priority.HIGH,
            due_date=self.today + timedelta(days=4),
            summary="Landing page, email sequence, and launch checklist.",
            is_featured=True,
        )

    def test_dashboard_renders_inertia_component(self):
        self.client.get(reverse("studio:dashboard"))
        self.assertComponentUsed("Studio/Dashboard")
        self.assertEqual(self.props()["headline"]["title"], "Content workspace")

    def test_library_renders_inertia_component(self):
        self.client.get(reverse("studio:library"))
        self.assertComponentUsed("Studio/Library")
        self.assertEqual(self.props()["items"][0]["id"], self.item.id)

    def test_campaign_detail_renders_route_parameter_page(self):
        self.client.get(reverse("studio:campaign_detail", args=[self.item.id]))
        self.assertComponentUsed("Studio/CampaignDetail")
        self.assertEqual(self.props()["pathDemo"]["itemId"], self.item.id)

    def test_create_item_persists_record(self):
        response = self.inertia.post(
            reverse("studio:create_item"),
            {
                "title": "Repurpose webinar clips",
                "owner": "Sofia",
                "channel": CampaignItem.Channel.SOCIAL,
                "status": CampaignItem.Status.REVIEW,
                "priority": CampaignItem.Priority.MEDIUM,
                "due_date": (self.today + timedelta(days=10)).isoformat(),
                "summary": "Cut three 30-second clips for paid social.",
                "is_featured": True,
                "return_to": reverse("studio:dashboard"),
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(CampaignItem.objects.count(), 2)

    def test_update_status_changes_existing_item(self):
        response = self.inertia.post(
            reverse("studio:update_status", args=[self.item.id]),
            {
                "status": CampaignItem.Status.SCHEDULED,
                "return_to": reverse("studio:dashboard"),
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, CampaignItem.Status.SCHEDULED)
