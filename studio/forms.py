from django import forms

from .models import CampaignItem


class CampaignItemForm(forms.ModelForm):
    due_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"}),
        input_formats=["%Y-%m-%d"],
    )

    class Meta:
        model = CampaignItem
        fields = [
            "title",
            "owner",
            "channel",
            "status",
            "priority",
            "due_date",
            "is_featured",
            "summary",
        ]
        widgets = {
            "summary": forms.Textarea(attrs={"rows": 4}),
        }

    def clean_title(self):
        return self.cleaned_data["title"].strip()

    def clean_owner(self):
        return self.cleaned_data["owner"].strip()

    def clean_summary(self):
        return self.cleaned_data["summary"].strip()


class CampaignItemStatusForm(forms.Form):
    status = forms.ChoiceField(choices=CampaignItem.Status.choices)
