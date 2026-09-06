from django.db import migrations


PLANS = [
	('Free', 'Free', ['One calling card', 'Up to five cards', 'Public hub link']),
	('Pro', '$9 / month', ['Unlimited cards', 'Custom hub passwords', 'Hub analytics']),
	('Business', '$29 / month', ['Unlimited cards', 'Advanced analytics', 'Team hubs']),
]


def seed_plans(apps, schema_editor):
	Plan = apps.get_model('subscriptions', 'Plan')
	for sort_order, (name, price_label, features) in enumerate(PLANS):
		Plan.objects.update_or_create(name=name, defaults={
			'price_label': price_label,
			'features': features,
			'is_active': True,
			'sort_order': sort_order,
		})


def remove_plans(apps, schema_editor):
	apps.get_model('subscriptions', 'Plan').objects.filter(name__in=[plan[0] for plan in PLANS]).delete()


class Migration(migrations.Migration):
	dependencies = [('subscriptions', '0001_initial')]
	operations = [migrations.RunPython(seed_plans, remove_plans)]
