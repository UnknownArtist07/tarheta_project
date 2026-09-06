from django.db import models

from hub.models import TarhetaAccount


class Plan(models.Model):
	name = models.CharField(max_length=50, unique=True)
	price_label = models.CharField(max_length=50)
	features = models.JSONField(default=list)
	is_active = models.BooleanField(default=True)
	sort_order = models.PositiveIntegerField(default=0)

	class Meta:
		ordering = ('sort_order', 'id')

	def __str__(self):
		return self.name


class UserSubscription(models.Model):
	STATUS_CHOICES = (('active', 'Active'), ('cancelled', 'Cancelled'))
	account = models.OneToOneField(TarhetaAccount, on_delete=models.CASCADE, related_name='subscription')
	plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

	def __str__(self):
		return f'{self.account.username} - {self.plan.name}'
