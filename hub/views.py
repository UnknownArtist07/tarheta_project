from django.contrib import messages
from django.db.models import F
from django.shortcuts import get_object_or_404, redirect, render
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password, check_password
from datetime import date
import json
from urllib.parse import urlparse

from .models import HubCard, TarhetaAccount
from subscriptions.models import Plan, UserSubscription


def get_session_account(request):
	return TarhetaAccount.objects.filter(
		id=request.session.get('tarheta_account_id')
	).first()


def build_social_links(account):
	base_urls = {
		'facebook': 'https://facebook.com/',
		'instagram': 'https://instagram.com/',
		'x': 'https://x.com/',
		'linkedin': 'https://linkedin.com/in/',
		'tiktok': 'https://tiktok.com/@',
		'youtube': 'https://youtube.com/@',
	}
	icons = {
		'facebook': 'f', 'instagram': '◎', 'x': '𝕏',
		'linkedin': 'in', 'tiktok': '♪', 'youtube': '▶',
	}
	links = []
	for social in account.socials or []:
		platform = social.get('platform', '')
		handle = social.get('handle', '').strip()
		if not platform or not handle:
			continue
		parsed = urlparse(handle)
		href = handle if parsed.scheme in ('http', 'https') and parsed.netloc else base_urls.get(platform, '') + handle.lstrip('@')
		links.append({'platform': platform, 'handle': handle, 'href': href, 'icon': icons.get(platform, '?')})
	return links

def home(request):
	accounts = TarhetaAccount.objects.all()
	return render(request, 'hub/home.html', {
		'hub_count': accounts.count(),
		'card_count': HubCard.objects.count(),
		'profile_count': accounts.exclude(bio='').count(),
		'media_count': HubCard.objects.exclude(image='').count(),
		'plans': Plan.objects.filter(is_active=True),
	})


def register(request):
	if request.method == 'POST':
		full_name = request.POST.get('full_name', '').strip()
		username = request.POST.get('username', '').strip().lower()
		email = request.POST.get('email', '').strip().lower()
		raw_password = request.POST.get('password', '')

		errors = []
		if not full_name or not username or not email or not raw_password:
			errors.append('Please fill in all fields.')
		try:
			validate_email(email)
		except ValidationError:
			errors.append('Please enter a valid email address.')
		if len(raw_password) < 12 or not any(character.isupper() for character in raw_password) or not any(character.isdigit() for character in raw_password) or not any(not character.isalnum() for character in raw_password):
			errors.append('Password must be at least 12 characters and include a capital letter, a number, and a special character.')

		if errors:
			for error in errors:
				messages.error(request, error)
		elif TarhetaAccount.objects.filter(username=username).exists():
			messages.error(request, 'That username is already taken.')
		elif TarhetaAccount.objects.filter(email=email).exists():
			messages.error(request, 'That email is already registered.')
		else:
			account = TarhetaAccount(
				full_name=full_name,
				username=username,
				email=email,
			)
			account.set_password(raw_password)
			account.save()
			free_plan = Plan.objects.filter(name='Free', is_active=True).first()
			if free_plan:
				UserSubscription.objects.create(account=account, plan=free_plan)
			request.session['tarheta_account_id'] = account.id
			return redirect('hub')

	return render(request, 'hub/register.html')


def login(request):
	if request.method == 'POST':
		username = request.POST.get('username', '').strip().lower()
		raw_password = request.POST.get('password', '')
		account = TarhetaAccount.objects.filter(username=username).first()

		if account and account.check_password(raw_password):
			request.session['tarheta_account_id'] = account.id
			return redirect('hub')

		messages.error(request, 'Username or password is incorrect.')

	return render(request, 'hub/login.html')


def logout(request):
	request.session.flush()
	return redirect('home')


def hub(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	return render(request, 'hub/hub.html', {
		'account': account,
		'social_links': build_social_links(account),
		'cards': account.cards.all(),
		'plans': Plan.objects.filter(is_active=True),
		'subscription': UserSubscription.objects.filter(account=account).select_related('plan').first(),
	})


def public_hub(request, username):
	account = get_object_or_404(TarhetaAccount, username__iexact=username)
	is_owner = get_session_account(request) == account
	unlocked_key = f'public_hub_unlocked_{account.id}'
	if request.method == 'POST' and account.hub_password_hash and request.POST.get('hub_password'):
		if account.check_hub_password(request.POST['hub_password']):
			request.session[unlocked_key] = True
			return redirect('public_hub', username=account.username)
		messages.error(request, 'That hub password is incorrect.')
	if not is_owner and not account.hub_is_public:
		return render(request, 'hub/public_private.html', {'account': account})
	if not is_owner and account.hub_password_hash and not request.session.get(unlocked_key):
		return render(request, 'hub/public_gate.html', {'account': account})
	if not is_owner:
		TarhetaAccount.objects.filter(id=account.id).update(hub_view_count=F('hub_view_count') + 1)
	return render(request, 'hub/public_hub.html', {
		'account': account,
		'social_links': build_social_links(account),
		'cards': account.cards.filter(is_active=True),
		'is_public_view': True,
	})


def profile(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		update_fields = []
		if 'full_name' in request.POST:
			account.full_name = request.POST.get('full_name', '').strip()
			update_fields.append('full_name')
		if request.FILES.get('avatar'):
			account.avatar_url = request.FILES['avatar']
			update_fields.append('avatar_url')
		if 'bio' in request.POST:
			account.bio = request.POST.get('bio', '').strip()
			update_fields.append('bio')
		if 'phone' in request.POST:
			account.phone = request.POST.get('phone', '').strip()
			update_fields.append('phone')
		if 'social_platform' in request.POST:
			platforms = request.POST.getlist('social_platform')
			handles = request.POST.getlist('social_handle')
			account.socials = [
				{'platform': platform, 'handle': handle.strip()}
				for platform, handle in zip(platforms, handles)
				if platform and handle.strip()
			]
			update_fields.append('socials')
		if 'school' in request.POST:
			account.school = request.POST.get('school', '').strip()
			update_fields.append('school')
		if 'age' in request.POST:
			age = request.POST.get('age', '').strip()
			account.age = int(age) if age else None
			update_fields.append('age')
		if 'birthday' in request.POST:
			birthday = request.POST.get('birthday', '').strip()
			account.birthday = date.fromisoformat(birthday) if birthday else None
			update_fields.append('birthday')
		if 'card_email' in request.POST:
			account.card_email = request.POST.get('card_email', '').strip().lower()
			update_fields.append('card_email')
		if not account.full_name:
			messages.error(request, 'Your full name is required.')
		else:
			try:
				TarhetaAccount._meta.get_field('avatar_url').clean(account.avatar_url, account)
				if account.card_email:
					validate_email(account.card_email)
			except (ValidationError, ValueError):
				messages.error(request, 'Please enter valid profile details.')
			else:
				account.save(update_fields=list(dict.fromkeys(update_fields)))
				messages.success(request, 'Profile updated.')
	return redirect('hub')


def card(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		update_fields = []
		if 'card_title' in request.POST:
			account.card_title = request.POST.get('card_title', '').strip()
			update_fields.append('card_title')
		if 'card_role' in request.POST:
			account.card_role = request.POST.get('card_role', '').strip()
			update_fields.append('card_role')
		if 'card_email' in request.POST:
			account.card_email = request.POST.get('card_email', '').strip().lower()
			update_fields.append('card_email')
		if 'card_theme' in request.POST:
			account.card_theme = request.POST.get('card_theme', 'paper')
			update_fields.append('card_theme')
		if account.card_email:
			try:
				validate_email(account.card_email)
			except ValidationError:
				messages.error(request, 'Please enter a valid calling card email.')
				return redirect('hub')
		account.save(update_fields=list(dict.fromkeys(update_fields)))
		messages.success(request, 'Calling card updated.')
	return redirect('hub')


def settings(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		email = request.POST.get('email', '').strip().lower()
		current_password = request.POST.get('current_password', '')
		new_password = request.POST.get('new_password', '')
		if email != account.email:
			try:
				validate_email(email)
			except ValidationError:
				messages.error(request, 'Please enter a valid email address.')
				return redirect('hub')
			if TarhetaAccount.objects.filter(email=email).exclude(id=account.id).exists():
				messages.error(request, 'That email is already registered.')
				return redirect('hub')
			account.email = email
		if new_password:
			if not account.check_password(current_password):
				messages.error(request, 'Your current password is incorrect.')
				return redirect('hub')
			if len(new_password) < 12 or not any(character.isupper() for character in new_password) or not any(character.isdigit() for character in new_password) or not any(not character.isalnum() for character in new_password):
				messages.error(request, 'New password must be at least 12 characters and include a capital letter, a number, and a special character.')
				return redirect('hub')
			account.set_password(new_password)
		account.save()
		messages.success(request, 'Settings updated.')
	return redirect('hub')


def hub_settings(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		account.hub_is_public = request.POST.get('hub_is_public') == 'on'
		if request.POST.get('clear_hub_password') == 'on':
			account.set_hub_password('')
		elif request.POST.get('hub_password', ''):
			account.set_hub_password(request.POST['hub_password'])
		account.save(update_fields=['hub_is_public', 'hub_password_hash'])
		messages.success(request, 'Hub settings updated.')
	return redirect('hub')


def create_card(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		title = request.POST.get('title', '').strip()
		destination = request.POST.get('destination', '').strip()
		kind = request.POST.get('kind', 'link')
		image = request.FILES.get('image')
		video_file = request.FILES.get('video_file')
		audio_file = request.FILES.get('audio_file')
		if kind == 'media':
			kind = 'video'
		if not title:
			messages.error(request, 'A card title is required.')
		elif kind == 'image' and not image:
			messages.error(request, 'Please choose an image for an image card.')
		elif kind == 'video' and not video_file:
			messages.error(request, 'Please choose an MP4 video.')
		elif kind == 'audio' and not audio_file:
			messages.error(request, 'Please choose an MP3 file.')
		elif kind in ('link', 'schedule') and destination:
			parsed = urlparse(destination)
			if parsed.scheme not in ('http', 'https') or not parsed.netloc:
				messages.error(request, 'Please enter a valid http or https card link.')
			else:
				HubCard.objects.create(account=account, kind=kind, title=title, subtitle=request.POST.get('subtitle', '').strip(), destination=destination, image=image, video_file=video_file, audio_file=audio_file)
				messages.success(request, 'Card added.')
		else:
			HubCard.objects.create(account=account, kind=kind, title=title, subtitle=request.POST.get('subtitle', '').strip(), image=image, video_file=video_file, audio_file=audio_file)
			messages.success(request, 'Card added.')
	return redirect('hub')


def delete_card(request, card_id):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		card = HubCard.objects.filter(id=card_id, account=account).first()
		if card:
			card.delete()
			messages.success(request, 'Card removed.')
	return redirect('hub')


def toggle_card(request, card_id):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		card = HubCard.objects.filter(id=card_id, account=account).first()
		if card:
			card.is_active = not card.is_active
			card.save(update_fields=['is_active'])
	return redirect('hub')


def update_function_card(request, card_id):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	card = HubCard.objects.filter(id=card_id, account=account).first()
	if not card:
		return redirect('hub')
	if request.method == 'POST':
		kind = request.POST.get('kind', card.kind)
		if kind == 'media':
			kind = 'video'
		card.kind = kind
		card.title = request.POST.get('title', '').strip()
		card.subtitle = request.POST.get('subtitle', '').strip()
		card.destination = request.POST.get('destination', '').strip()
		card.card_theme = request.POST.get('card_theme', 'paper')
		schedule_payload = request.POST.get('schedule_json', '')
		try:
			if schedule_payload:
				card.schedule = json.loads(schedule_payload)
			else:
				legacy_entry = {
					'day': request.POST.get('schedule_day', '').strip(),
					'subject': request.POST.get('schedule_subject', '').strip(),
					'time': request.POST.get('schedule_time', '').strip(),
					'professor': request.POST.get('schedule_professor', '').strip(),
					'description': request.POST.get('schedule_description', '').strip(),
				}
				card.schedule = [legacy_entry] if any(legacy_entry.values()) else []
		except json.JSONDecodeError:
			card.schedule = []
		if request.FILES.get('image'):
			card.image = request.FILES['image']
		if request.POST.get('remove_image') == 'on':
			card.image = None
		if request.FILES.get('video_file'):
			card.video_file = request.FILES['video_file']
		if request.FILES.get('audio_file'):
			card.audio_file = request.FILES['audio_file']
		if request.FILES.get('cover_image'):
			card.cover_image = request.FILES['cover_image']
		if request.POST.get('remove_cover') == 'on':
			card.cover_image = None
		password = request.POST.get('card_password', '')
		if password:
			card.password_hash = make_password(password)
		elif request.POST.get('clear_card_password') == 'on':
			card.password_hash = ''
		card.save()
		messages.success(request, 'Function card updated.')
	return redirect('hub')


def delete_function_card(request, card_id):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		HubCard.objects.filter(id=card_id, account=account).delete()
		messages.success(request, 'Function card deleted.')
	return redirect('hub')


def edit_card(request, card_id):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	card = HubCard.objects.filter(id=card_id, account=account).first()
	if not card:
		return redirect('hub')
	if request.method == 'POST':
		title = request.POST.get('title', '').strip()
		destination = request.POST.get('destination', '').strip()
		kind = request.POST.get('kind', 'link')
		image = request.FILES.get('image')
		parsed = urlparse(destination)
		if not title:
			messages.error(request, 'A card title is required.')
		elif kind == 'image' and not (image or card.image):
			messages.error(request, 'Please choose an image for an image card.')
		elif kind != 'image' and destination and (parsed.scheme not in ('http', 'https') or not parsed.netloc):
			messages.error(request, 'Please enter a valid http or https card link.')
		else:
			card.kind = kind
			card.title = title
			card.subtitle = request.POST.get('subtitle', '').strip()
			card.destination = destination
			if image:
				card.image = image
			card.save(update_fields=['kind', 'title', 'subtitle', 'destination', 'image'])
			messages.success(request, 'Card updated.')
	return redirect('hub')
