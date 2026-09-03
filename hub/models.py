from django.db import models
import uuid


class TarhetaAccount(models.Model):
	public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
	full_name = models.CharField(max_length=150)
	username = models.SlugField(max_length=150, unique=True)
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128)
	avatar_url = models.ImageField(upload_to='avatars/', blank=True)
	bio = models.TextField(blank=True, max_length=280)
	phone = models.CharField(max_length=40, blank=True)
	socials = models.JSONField(default=list, blank=True)
	school = models.CharField(max_length=150, blank=True)
	card_email = models.EmailField(blank=True)
	card_title = models.CharField(max_length=80, blank=True)
	card_role = models.CharField(max_length=120, blank=True)
	card_theme = models.CharField(max_length=20, default='paper')
	created_at = models.DateTimeField(auto_now_add=True)

	def set_password(self, raw_password):
		from django.contrib.auth.hashers import make_password

		self.password = make_password(raw_password)

	def check_password(self, raw_password):
		from django.contrib.auth.hashers import check_password

		return check_password(raw_password, self.password)

	def __str__(self):
		return self.username


class HubCard(models.Model):
	CARD_TYPES = (
		('link', 'Link'),
		('image', 'Image'),
		('media', 'Video'),
	)
	account = models.ForeignKey(TarhetaAccount, on_delete=models.CASCADE, related_name='cards')
	kind = models.CharField(max_length=10, choices=CARD_TYPES, default='link')
	title = models.CharField(max_length=100)
	subtitle = models.CharField(max_length=150, blank=True)
	destination = models.URLField(blank=True)
	image = models.ImageField(upload_to='cards/', blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ('created_at', 'id')

	def __str__(self):
		return self.title
