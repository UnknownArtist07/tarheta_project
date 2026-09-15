from django.db import migrations, models


def convert_schedule_to_list(apps, schema_editor):
	HubCard = apps.get_model('hub', 'HubCard')
	for card in HubCard.objects.all().iterator():
		if isinstance(card.schedule, dict):
			card.schedule = [card.schedule] if any(card.schedule.values()) else []
			card.save(update_fields=['schedule'])


class Migration(migrations.Migration):
	dependencies = [('hub', '0010_alter_hubcard_kind')]
	operations = [
		migrations.RunPython(convert_schedule_to_list, migrations.RunPython.noop),
		migrations.AlterField(
			model_name='hubcard',
			name='schedule',
			field=models.JSONField(blank=True, default=list),
		),
	]