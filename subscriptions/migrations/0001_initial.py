from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
	initial = True
	dependencies = [
		('hub', '0007_tarhetaaccount_hub_fields'),
	]
	operations = [
		migrations.CreateModel(
			name='Plan',
			fields=[
				('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
				('name', models.CharField(max_length=50, unique=True)),
				('price_label', models.CharField(max_length=50)),
				('features', models.JSONField(default=list)),
				('is_active', models.BooleanField(default=True)),
				('sort_order', models.PositiveIntegerField(default=0)),
			],
			options={'ordering': ('sort_order', 'id')},
		),
		migrations.CreateModel(
			name='UserSubscription',
			fields=[
				('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
				('status', models.CharField(choices=[('active', 'Active'), ('cancelled', 'Cancelled')], default='active', max_length=20)),
				('account', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='subscription', to='hub.tarhetaaccount')),
				('plan', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='subscriptions', to='subscriptions.plan')),
			],
		),
	]
