from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from studio.models import CampaignItem


class Command(BaseCommand):
    help = "Seed Pulseboard with demo campaign items."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing campaign items before loading the demo set.",
        )

    def handle(self, *args, **options):
        today = timezone.localdate()

        if options["reset"]:
            deleted_count, _ = CampaignItem.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Removed {deleted_count} existing items."))

        if CampaignItem.objects.exists():
            self.stdout.write(
                self.style.NOTICE("Campaign items already exist. Use --reset to replace them.")
            )
            return

        demo_items = [
            {
                "title": "Quarterly product launch brief",
                "owner": "Mina",
                "channel": CampaignItem.Channel.BLOG,
                "status": CampaignItem.Status.WRITING,
                "priority": CampaignItem.Priority.HIGH,
                "due_date": today + timedelta(days=2),
                "is_featured": True,
                "summary": "Anchor article that frames the launch story and links the rest of the campaign.",
            },
            {
                "title": "Customer story webinar promo",
                "owner": "Sofia",
                "channel": CampaignItem.Channel.WEBINAR,
                "status": CampaignItem.Status.REVIEW,
                "priority": CampaignItem.Priority.HIGH,
                "due_date": today + timedelta(days=5),
                "is_featured": False,
                "summary": "Registration page, teaser clips, and follow-up email copy.",
            },
            {
                "title": "Executive newsletter draft",
                "owner": "Jonas",
                "channel": CampaignItem.Channel.NEWSLETTER,
                "status": CampaignItem.Status.SCHEDULED,
                "priority": CampaignItem.Priority.MEDIUM,
                "due_date": today + timedelta(days=7),
                "is_featured": True,
                "summary": "A founder-style note with a simple CTA into the launch page.",
            },
            {
                "title": "Behind-the-scenes social series",
                "owner": "Aya",
                "channel": CampaignItem.Channel.SOCIAL,
                "status": CampaignItem.Status.BACKLOG,
                "priority": CampaignItem.Priority.LOW,
                "due_date": today + timedelta(days=12),
                "is_featured": False,
                "summary": "Five evergreen posts built from team quotes and product screenshots.",
            },
            {
                "title": "Proof-driven case study refresh",
                "owner": "Luca",
                "channel": CampaignItem.Channel.CASE_STUDY,
                "status": CampaignItem.Status.LIVE,
                "priority": CampaignItem.Priority.MEDIUM,
                "due_date": today - timedelta(days=3),
                "is_featured": False,
                "summary": "Recently published refresh with updated conversion and retention metrics.",
            },
        ]

        for item in demo_items:
            CampaignItem.objects.create(**item)

        self.stdout.write(self.style.SUCCESS(f"Created {len(demo_items)} demo campaign items."))
