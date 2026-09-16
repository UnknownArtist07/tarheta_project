from django.db import migrations, models


class Migration(migrations.Migration):

	dependencies = [('hub', '0011_schedule_list')]

	operations = [
		migrations.AddField(model_name='tarhetaaccount', name='display_handle', field=models.CharField(blank=True, max_length=80)),
		migrations.AddField(model_name='tarhetaaccount', name='card_tagline', field=models.CharField(blank=True, max_length=150)),
		migrations.AddField(model_name='tarhetaaccount', name='location', field=models.CharField(blank=True, max_length=120)),
		migrations.AddField(model_name='tarhetaaccount', name='pronouns', field=models.CharField(blank=True, max_length=40)),
		migrations.AddField(model_name='tarhetaaccount', name='card_visible_fields', field=models.JSONField(blank=True, default=list)),
		migrations.AddField(model_name='hubcard', name='inherit_theme', field=models.BooleanField(default=True)),
		migrations.AddField(model_name='hubcard', name='icon', field=models.CharField(blank=True, max_length=8)),
	]