from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from uuid import UUID

from .models import HubCard, TarhetaAccount


class RegistrationTests(TestCase):
	def test_registration_creates_account_with_hashed_password(self):
		response = self.client.post('/register/', {
			'full_name': 'Juan Dela Cruz',
			'username': 'juandelacruz',
			'email': 'juan@example.com',
			'password': 'Strong-password-123!',
		})

		account = TarhetaAccount.objects.get(username='juandelacruz')
		self.assertRedirects(response, '/hub/')
		self.assertEqual(account.full_name, 'Juan Dela Cruz')
		self.assertNotEqual(account.password, 'strong-password-123')
		self.assertTrue(account.check_password('Strong-password-123!'))

	def test_duplicate_username_does_not_create_second_account(self):
		TarhetaAccount.objects.create(
			full_name='Existing User',
			username='existing',
			email='existing@example.com',
			password='already-hashed',
		)

		response = self.client.post('/register/', {
			'full_name': 'Another User',
			'username': 'existing',
			'email': 'another@example.com',
			'password': 'Strong-password-123!',
		})

		self.assertEqual(response.status_code, 200)
		self.assertEqual(TarhetaAccount.objects.filter(username='existing').count(), 1)

	def test_registration_rejects_missing_fields(self):
		response = self.client.post('/register/', {
			'full_name': 'Incomplete User',
			'username': '',
			'email': 'incomplete@example.com',
			'password': 'Strong-password-123!',
		})

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Please fill in all fields.')
		self.assertEqual(TarhetaAccount.objects.count(), 0)

	def test_registration_rejects_password_without_required_complexity(self):
		response = self.client.post('/register/', {
			'full_name': 'Weak Password User',
			'username': 'weakpassword',
			'email': 'weak@example.com',
			'password': 'weak-password',
		})

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Password must be at least 12 characters')
		self.assertFalse(TarhetaAccount.objects.filter(username='weakpassword').exists())


class LoginTests(TestCase):
	def setUp(self):
		account = TarhetaAccount(
			full_name='Juan Dela Cruz',
			username='juandelacruz',
			email='juan@example.com',
		)
		account.set_password('Strong-password-123!')
		account.save()

	def test_login_redirects_to_hub_and_stores_account_session(self):
		response = self.client.post('/login/', {
			'username': 'JUANDELACRUZ',
			'password': 'Strong-password-123!',
		})

		self.assertRedirects(response, '/hub/')
		self.assertEqual(self.client.session['tarheta_account_id'], TarhetaAccount.objects.get(username='juandelacruz').id)

	def test_login_rejects_invalid_password(self):
		response = self.client.post('/login/', {
			'username': 'juandelacruz',
			'password': 'wrong-password',
		})

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Username or password is incorrect.')
		self.assertNotIn('tarheta_account_id', self.client.session)

	def test_logout_clears_account_session(self):
		self.client.post('/login/', {
			'username': 'juandelacruz',
			'password': 'Strong-password-123!',
		})

		response = self.client.get('/logout/')

		self.assertRedirects(response, '/')
		self.assertNotIn('tarheta_account_id', self.client.session)


class HubWorkflowTests(TestCase):
	def setUp(self):
		self.account = TarhetaAccount(
			full_name='Juan Dela Cruz',
			username='juandelacruz',
			email='juan@example.com',
		)
		self.account.set_password('Strong-password-123!')
		self.account.save()
		self.client.post('/login/', {
			'username': 'juandelacruz',
			'password': 'Strong-password-123!',
		})

	def test_hub_uses_saved_account_identity(self):
		response = self.client.get('/hub/')

		self.assertContains(response, 'Juan Dela Cruz')
		self.assertContains(response, str(self.account.public_id)[:8].upper())
		self.assertIsInstance(UUID(str(self.account.public_id)), UUID)

	def test_hub_renders_clickable_social_icons(self):
		self.account.socials = [{'platform': 'instagram', 'handle': '@juan'}]
		self.account.save(update_fields=['socials'])

		response = self.client.get('/hub/')

		self.assertContains(response, 'class="social-icon social-instagram"')
		self.assertContains(response, 'href="https://instagram.com/juan"')

	def test_profile_and_card_updates_are_persisted(self):
		self.client.post('/profile/', {
			'full_name': 'Maria Santos', 'avatar_url': 'https://example.com/maria.jpg',
			'bio': 'Product designer', 'phone': '09171234567',
			'social_platform': ['instagram', 'linkedin'], 'social_handle': ['@maria', 'maria-santos'], 'school': 'PUP',
		})
		self.client.post('/card/', {
			'card_title': 'Maria Santos', 'card_role': 'Product Designer',
			'card_email': 'maria@example.com', 'card_theme': 'moss',
		})

		self.account.refresh_from_db()
		self.assertEqual(self.account.full_name, 'Maria Santos')
		self.assertEqual(self.account.socials, [
			{'platform': 'instagram', 'handle': '@maria'},
			{'platform': 'linkedin', 'handle': 'maria-santos'},
		])
		self.assertEqual(self.account.card_role, 'Product Designer')
		self.assertEqual(self.account.card_theme, 'moss')

	def test_profile_upload_saves_image(self):
		image = SimpleUploadedFile(
			'avatar.png',
			b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0dIDAT\x08\xd7c\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82',
			content_type='image/png',
		)

		self.client.post('/profile/', {'full_name': 'Juan Dela Cruz', 'avatar': image})

		self.account.refresh_from_db()
		self.assertEqual(self.account.avatar_url.name, 'avatars/avatar.png')
		self.addCleanup(self.account.avatar_url.delete, save=False)

	def test_settings_updates_email_and_password(self):
		response = self.client.post('/settings/', {
			'email': 'new@example.com',
			'current_password': 'Strong-password-123!',
			'new_password': 'New-strong-password-456!',
		})

		self.account.refresh_from_db()
		self.assertRedirects(response, '/hub/')
		self.assertEqual(self.account.email, 'new@example.com')
		self.assertTrue(self.account.check_password('New-strong-password-456!'))

	def test_hub_requires_login(self):
		self.client.get('/logout/')

		response = self.client.get('/hub/')

		self.assertRedirects(response, '/login/')

	def test_user_can_create_and_view_card(self):
		response = self.client.post('/cards/new/', {
			'kind': 'link', 'title': 'My Portfolio', 'subtitle': 'Selected work',
			'destination': 'https://example.com/portfolio',
		})

		card = HubCard.objects.get(account=self.account)
		self.assertRedirects(response, '/hub/')
		self.assertEqual(card.title, 'My Portfolio')
		self.assertContains(self.client.get('/hub/'), 'https://example.com/portfolio')

	def test_user_can_create_image_card_with_uploaded_image(self):
		image = SimpleUploadedFile(
			'card-image.png',
			b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0dIDAT\x08\xd7c\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82',
			content_type='image/png',
		)

		response = self.client.post('/cards/new/', {
			'kind': 'image', 'title': 'My Photo', 'subtitle': 'A memory', 'image': image,
		})

		card = HubCard.objects.get(account=self.account)
		self.assertRedirects(response, '/hub/')
		self.assertEqual(card.image.name, 'cards/card-image.png')
		self.addCleanup(card.image.delete, save=False)

	def test_home_stats_use_live_database_counts(self):
		HubCard.objects.create(account=self.account, title='Portfolio')
		self.account.bio = 'A real profile'
		self.account.save(update_fields=['bio'])

		response = self.client.get('/')

		self.assertContains(response, 'data-target="1"')
		self.assertContains(response, 'HUBS CREATED')
		self.assertContains(response, 'CARDS PUBLISHED')

	def test_card_rejects_invalid_destination(self):
		response = self.client.post('/cards/new/', {
			'kind': 'link', 'title': 'Unsafe Link', 'destination': 'javascript:alert(1)',
		})

		self.assertRedirects(response, '/hub/')
		self.assertFalse(HubCard.objects.filter(title='Unsafe Link').exists())

	def test_user_can_edit_owned_card(self):
		card = HubCard.objects.create(account=self.account, title='Old title', destination='https://example.com/old')

		response = self.client.post(f'/cards/{card.id}/edit/', {
			'kind': 'media', 'title': 'New title', 'subtitle': 'Updated detail',
			'destination': 'https://example.com/new',
		})

		card.refresh_from_db()
		self.assertRedirects(response, '/hub/')
		self.assertEqual(card.title, 'New title')
		self.assertEqual(card.kind, 'media')
		self.assertEqual(card.destination, 'https://example.com/new')

	def test_user_can_delete_only_owned_card(self):
		card = HubCard.objects.create(account=self.account, title='Remove me')

		response = self.client.post(f'/cards/{card.id}/delete/')

		self.assertRedirects(response, '/hub/')
		self.assertFalse(HubCard.objects.filter(id=card.id).exists())
