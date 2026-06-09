from django.db import models


class CampaignItemQuerySet(models.QuerySet):
    def live(self):
        return self.filter(status=CampaignItem.Status.LIVE)

    def active(self):
        return self.exclude(status=CampaignItem.Status.LIVE)

    def featured(self):
        return self.filter(is_featured=True)


class CampaignItem(models.Model):
    class Status(models.TextChoices):
        BACKLOG = "backlog", "Backlog"
        WRITING = "writing", "Writing"
        REVIEW = "review", "In review"
        SCHEDULED = "scheduled", "Scheduled"
        LIVE = "live", "Live"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class Channel(models.TextChoices):
        BLOG = "blog", "Blog post"
        WEBINAR = "webinar", "Webinar"
        NEWSLETTER = "newsletter", "Newsletter"
        SOCIAL = "social", "Social campaign"
        CASE_STUDY = "case-study", "Case study"

    title = models.CharField(max_length=140)
    owner = models.CharField(max_length=80)
    channel = models.CharField(
        max_length=20,
        choices=Channel.choices,
        default=Channel.BLOG,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BACKLOG,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    due_date = models.DateField()
    is_featured = models.BooleanField(default=False)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CampaignItemQuerySet.as_manager()

    class Meta:
        ordering = ("due_date", "-is_featured", "title")

    def __str__(self):
        return self.title
