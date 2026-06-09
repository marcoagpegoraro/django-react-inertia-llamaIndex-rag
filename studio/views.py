import json
from datetime import timedelta

from django.contrib import messages
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse
from django.utils import timezone
from inertia import inertia

from .forms import CampaignItemForm, CampaignItemStatusForm
from .models import CampaignItem


def _request_data(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST


def _store_form_errors(request, form, bag=None):
    current_errors = request.session.get("_inertia_errors", {})
    serialized = {
        key: value[0]["message"]
        for key, value in form.errors.get_json_data(escape_html=False).items()
    }

    if bag:
        current_errors[bag] = serialized
    else:
        current_errors.update(serialized)

    request.session["_inertia_errors"] = current_errors


def _redirect_back(request):
    data = _request_data(request)
    return_to = data.get("return_to") or request.headers.get("Referer")
    return redirect(return_to or reverse("studio:dashboard"))


def _choice_options(choice_enum, all_label=None):
    options = []
    if all_label:
        options.append({"value": "all", "label": all_label})
    options.extend(
        {"value": choice.value, "label": choice.label}
        for choice in choice_enum
    )
    return options


def _build_routes(sample_item=None):
    routes = {
        "dashboard": reverse("studio:dashboard"),
        "library": reverse("studio:library"),
        "createItem": reverse("studio:create_item"),
    }

    if sample_item is not None:
        routes["exampleCampaign"] = reverse(
            "studio:campaign_detail",
            args=[sample_item.id],
        )

    return routes


def _serialize_item(item, today):
    return {
        "id": item.id,
        "title": item.title,
        "owner": item.owner,
        "summary": item.summary,
        "channel": item.channel,
        "channelLabel": item.get_channel_display(),
        "status": item.status,
        "statusLabel": item.get_status_display(),
        "priority": item.priority,
        "priorityLabel": item.get_priority_display(),
        "dueDate": item.due_date.isoformat(),
        "isFeatured": item.is_featured,
        "isOverdue": item.due_date < today and item.status != CampaignItem.Status.LIVE,
        "statusUrl": reverse("studio:update_status", args=[item.id]),
        "featureUrl": reverse("studio:toggle_featured", args=[item.id]),
        "detailUrl": reverse("studio:campaign_detail", args=[item.id]),
    }


def _serialize_item_detail(item, today):
    return {
        **_serialize_item(item, today),
        "createdAt": timezone.localtime(item.created_at).strftime("%b %d, %Y %H:%M"),
        "updatedAt": timezone.localtime(item.updated_at).strftime("%b %d, %Y %H:%M"),
    }


def _build_status_breakdown(items):
    counts = {choice.value: 0 for choice in CampaignItem.Status}
    for status in items.values_list("status", flat=True):
        counts[status] += 1

    return [
        {"value": choice.value, "label": choice.label, "count": counts[choice.value]}
        for choice in CampaignItem.Status
    ]


def _build_stats(items, filtered_items, today):
    end_of_week = today + timedelta(days=7)
    start_of_month = today.replace(day=1)
    return [
        {
            "label": "Visible items",
            "value": filtered_items.count(),
            "caption": "After the current filters are applied",
        },
        {
            "label": "In motion",
            "value": items.active().count(),
            "caption": "Everything not yet marked live",
        },
        {
            "label": "Due this week",
            "value": items.active().filter(due_date__range=(today, end_of_week)).count(),
            "caption": "Upcoming deadlines in the next 7 days",
        },
        {
            "label": "Published this month",
            "value": items.live().filter(due_date__gte=start_of_month).count(),
            "caption": "Items already shipped this month",
        },
    ]


def _build_library_summary(items, filtered_items):
    return [
        {
            "label": "All items",
            "value": items.count(),
            "caption": "The full content backlog",
        },
        {
            "label": "Visible",
            "value": filtered_items.count(),
            "caption": "Rows after the active filters",
        },
        {
            "label": "Featured",
            "value": items.featured().count(),
            "caption": "Pinned items across the workspace",
        },
        {
            "label": "High priority",
            "value": items.filter(priority=CampaignItem.Priority.HIGH).count(),
            "caption": "Campaigns that need close attention",
        },
    ]


def _filtered_items(request):
    items = CampaignItem.objects.all()
    filters = {
        "search": request.GET.get("search", "").strip(),
        "status": request.GET.get("status", "all"),
        "priority": request.GET.get("priority", "all"),
        "channel": request.GET.get("channel", "all"),
    }

    filtered = items

    if filters["search"]:
        filtered = filtered.filter(
            Q(title__icontains=filters["search"])
            | Q(owner__icontains=filters["search"])
            | Q(summary__icontains=filters["search"])
        )
    if filters["status"] != "all":
        filtered = filtered.filter(status=filters["status"])
    if filters["priority"] != "all":
        filtered = filtered.filter(priority=filters["priority"])
    if filters["channel"] != "all":
        filtered = filtered.filter(channel=filters["channel"])

    return items, filtered, filters


@inertia("Studio/Dashboard")
def dashboard(request):
    today = timezone.localdate()
    items, filtered_items, filters = _filtered_items(request)
    sample_item = items.order_by("id").first()
    upcoming_items = (
        items.active()
        .filter(due_date__gte=today)
        .order_by("due_date", "-is_featured", "title")[:4]
    )

    return {
        "shell": {
            "title": "Dashboard",
            "description": "A more standard Material-style workspace with server-driven filters and forms.",
        },
        "headline": {
            "title": "Content workspace",
            "description": (
                "Django owns the records, filters, validation, and redirects while "
                "React handles navigation and interactive UI."
            ),
        },
        "filters": filters,
        "filterOptions": {
            "status": _choice_options(CampaignItem.Status, "All statuses"),
            "priority": _choice_options(CampaignItem.Priority, "All priorities"),
            "channel": _choice_options(CampaignItem.Channel, "All channels"),
        },
        "statusFlow": _choice_options(CampaignItem.Status),
        "stats": _build_stats(items, filtered_items, today),
        "statusBreakdown": _build_status_breakdown(items),
        "upcomingItems": [_serialize_item(item, today) for item in upcoming_items],
        "items": [_serialize_item(item, today) for item in filtered_items],
        "formDefaults": {
            "title": "",
            "owner": "",
            "channel": CampaignItem.Channel.BLOG,
            "status": CampaignItem.Status.BACKLOG,
            "priority": CampaignItem.Priority.MEDIUM,
            "due_date": (today + timedelta(days=7)).isoformat(),
            "is_featured": False,
            "summary": "",
        },
        "routes": _build_routes(sample_item),
    }


@inertia("Studio/Library")
def library(request):
    today = timezone.localdate()
    items, filtered_items, filters = _filtered_items(request)
    sample_item = items.order_by("id").first()

    return {
        "shell": {
            "title": "Campaign library",
            "description": "Use the side navigation and open any row to test routed detail pages with path parameters.",
        },
        "filters": filters,
        "filterOptions": {
            "status": _choice_options(CampaignItem.Status, "All statuses"),
            "priority": _choice_options(CampaignItem.Priority, "All priorities"),
            "channel": _choice_options(CampaignItem.Channel, "All channels"),
        },
        "items": [_serialize_item(item, today) for item in filtered_items],
        "summary": _build_library_summary(items, filtered_items),
        "pathDemo": {
            "routePattern": "/campaigns/<item_id>/",
            "examplePath": sample_item and reverse("studio:campaign_detail", args=[sample_item.id]),
        },
        "routes": _build_routes(sample_item),
    }


@inertia("Studio/CampaignDetail")
def campaign_detail(request, item_id):
    today = timezone.localdate()
    item = get_object_or_404(CampaignItem, pk=item_id)
    related_items = (
        CampaignItem.objects.exclude(pk=item.pk)
        .filter(Q(owner=item.owner) | Q(channel=item.channel))
        .order_by("due_date", "title")[:4]
    )

    return {
        "shell": {
            "title": item.title,
            "description": "This screen is resolved from a Django route with an integer path parameter.",
        },
        "item": _serialize_item_detail(item, today),
        "pathDemo": {
            "itemId": item.id,
            "currentPath": reverse("studio:campaign_detail", args=[item.id]),
            "routePattern": "/campaigns/<item_id>/",
        },
        "relatedItems": [_serialize_item(related_item, today) for related_item in related_items],
        "routes": _build_routes(item),
    }


def create_item(request):
    if request.method != "POST":
        return redirect("studio:dashboard")

    form = CampaignItemForm(_request_data(request))
    if form.is_valid():
        item = form.save()
        messages.success(request, f'Added "{item.title}" to the board.')
    else:
        _store_form_errors(request, form, bag=request.headers.get("X-Inertia-Error-Bag"))
    return _redirect_back(request)


def update_status(request, item_id):
    if request.method != "POST":
        return redirect("studio:dashboard")

    item = get_object_or_404(CampaignItem, pk=item_id)
    form = CampaignItemStatusForm(_request_data(request))
    if form.is_valid():
        item.status = form.cleaned_data["status"]
        item.save(update_fields=["status", "updated_at"])
        messages.success(request, f'"{item.title}" moved to {item.get_status_display()}.')
    else:
        messages.error(request, "Choose a valid status before saving.")
    return _redirect_back(request)


def toggle_featured(request, item_id):
    if request.method != "POST":
        return redirect("studio:dashboard")

    item = get_object_or_404(CampaignItem, pk=item_id)
    item.is_featured = not item.is_featured
    item.save(update_fields=["is_featured", "updated_at"])
    if item.is_featured:
        messages.success(request, f'"{item.title}" is now pinned as a spotlight item.')
    else:
        messages.success(request, f'"{item.title}" was removed from the spotlight.')
    return _redirect_back(request)
