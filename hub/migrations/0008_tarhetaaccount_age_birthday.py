from django.db import migrations, models


class Migration(migrations.Migration):
	dependencies = [('hub', '0007_tarhetaaccount_hub_fields')]
	operations = [
		migrations.AddField(
			model_name='tarhetaaccount',
			name='age',
			field=models.PositiveIntegerField(blank=True, null=True),
		),
		migrations.AddField(
			model_name='tarhetaaccount',
			name='birthday',
			field=models.DateField(blank=True, null=True),
		),
	]