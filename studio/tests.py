from datetime import timedelta
from unittest.mock import Mock, patch

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

    @patch("studio.views.get_policy_rag_service")
    def test_policy_assistant_renders_inertia_component(self, mock_service_factory):
        mock_service = Mock()
        mock_service.get_status.return_value = {
            "policyFile": "studio/data/company_policy.txt",
            "collectionName": "company-policy",
            "chunkCount": 6,
            "lastIndexedAt": "2026-06-09 16:00 UTC",
            "policyUpdatedAt": "2026-06-09 15:30 UTC",
            "embeddingModel": "keyword-hash-256-v1",
            "generationMode": "retrieval-backed local synthesis",
        }
        mock_service_factory.return_value = mock_service

        self.client.get(reverse("studio:policy_assistant"))
        self.assertComponentUsed("Studio/PolicyAssistant")
        self.assertEqual(self.props()["assistantMeta"]["collectionName"], "company-policy")

    @patch("studio.views.get_policy_rag_service")
    def test_policy_assistant_returns_answer_result(self, mock_service_factory):
        mock_service = Mock()
        mock_service.get_status.return_value = {
            "policyFile": "studio/data/company_policy.txt",
            "collectionName": "company-policy",
            "chunkCount": 6,
            "lastIndexedAt": "2026-06-09 16:00 UTC",
            "policyUpdatedAt": "2026-06-09 15:30 UTC",
            "embeddingModel": "keyword-hash-256-v1",
            "generationMode": "retrieval-backed local synthesis",
        }
        answer_result = Mock()
        answer_result.to_dict.return_value = {
            "question": "How much notice do I need to give before taking PTO?",
            "answer": "According to the current company policy, PTO requests should be submitted at least 10 calendar days in advance.",
            "generationMode": "retrieval-backed local synthesis",
            "sources": [
                {
                    "section": "Paid time off",
                    "score": 0.431,
                    "excerpt": "Full-time employees receive 20 days of paid time off per calendar year.",
                    "matchedSentences": [
                        "PTO requests should be submitted at least 10 calendar days in advance."
                    ],
                }
            ],
        }
        mock_service.answer.return_value = answer_result
        mock_service_factory.return_value = mock_service

        self.client.get(
            reverse("studio:policy_assistant"),
            {"question": "How much notice do I need to give before taking PTO?"},
        )
        self.assertComponentUsed("Studio/PolicyAssistant")
        self.assertEqual(
            self.props()["answerResult"]["sources"][0]["section"],
            "Paid time off",
        )

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
