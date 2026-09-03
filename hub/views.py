from django.contrib import messages
from django.shortcuts import redirect, render
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from urllib.parse import urlparse

from .models import HubCard, TarhetaAccount


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
	return render(request, 'hub/hub.html', {'account': account, 'social_links': build_social_links(account), 'cards': account.cards.all()})


def profile(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		account.full_name = request.POST.get('full_name', '').strip()
		if request.FILES.get('avatar'):
			account.avatar_url = request.FILES['avatar']
		account.bio = request.POST.get('bio', '').strip()
		account.phone = request.POST.get('phone', '').strip()
		platforms = request.POST.getlist('social_platform')
		handles = request.POST.getlist('social_handle')
		account.socials = [
			{'platform': platform, 'handle': handle.strip()}
			for platform, handle in zip(platforms, handles)
			if platform and handle.strip()
		]
		account.school = request.POST.get('school', '').strip()
		if not account.full_name:
			messages.error(request, 'Your full name is required.')
		else:
			try:
				TarhetaAccount._meta.get_field('avatar_url').clean(account.avatar_url, account)
			except ValidationError:
				messages.error(request, 'Please choose a valid image file.')
			else:
				account.save(update_fields=['full_name', 'avatar_url', 'bio', 'phone', 'socials', 'school'])
				messages.success(request, 'Profile updated.')
	return redirect('hub')


def card(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		account.card_title = request.POST.get('card_title', '').strip()
		account.card_role = request.POST.get('card_role', '').strip()
		account.card_email = request.POST.get('card_email', '').strip().lower()
		account.card_theme = request.POST.get('card_theme', 'paper')
		if account.card_email:
			try:
				validate_email(account.card_email)
			except ValidationError:
				messages.error(request, 'Please enter a valid calling card email.')
				return redirect('hub')
		account.save(update_fields=['card_title', 'card_role', 'card_email', 'card_theme'])
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


def create_card(request):
	account = get_session_account(request)
	if not account:
		return redirect('login')
	if request.method == 'POST':
		title = request.POST.get('title', '').strip()
		destination = request.POST.get('destination', '').strip()
		kind = request.POST.get('kind', 'link')
		image = request.FILES.get('image')
		if not title:
			messages.error(request, 'A card title is required.')
		elif kind == 'image' and not image:
			messages.error(request, 'Please choose an image for an image card.')
		elif kind != 'image' and destination:
			parsed = urlparse(destination)
			if parsed.scheme not in ('http', 'https') or not parsed.netloc:
				messages.error(request, 'Please enter a valid http or https card link.')
			else:
				HubCard.objects.create(account=account, kind=kind, title=title, subtitle=request.POST.get('subtitle', '').strip(), destination=destination, image=image)
				messages.success(request, 'Card added.')
		else:
			HubCard.objects.create(account=account, kind=kind, title=title, subtitle=request.POST.get('subtitle', '').strip(), image=image)
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
