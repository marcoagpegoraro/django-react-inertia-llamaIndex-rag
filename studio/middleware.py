from django.contrib.messages import get_messages
from django.urls import reverse

from inertia import share


class InertiaSharedDataMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        share(
            request,
            app={
                "name": "Pulseboard",
                "tagline": "Content planning powered by Django, React, and Inertia.",
                "stack": ["Django 5.2", "React 19", "Inertia 3", "Material UI"],
                "navigation": [
                    {
                        "label": "Dashboard",
                        "href": reverse("studio:dashboard"),
                        "icon": "dashboard",
                    },
                    {
                        "label": "Campaign library",
                        "href": reverse("studio:library"),
                        "icon": "library",
                    },
                ],
            },
            flash=self._serialize_flash(request),
            errors=request.session.pop("_inertia_errors", {}),
        )
        return self.get_response(request)

    @staticmethod
    def _serialize_flash(request):
        return [
            {
                "level": message.tags or "info",
                "text": str(message),
            }
            for message in get_messages(request)
        ]
