from django.db import migrations, models


class Migration(migrations.Migration):
	dependencies = [('hub', '0006_hubcard_image')]
	operations = [
		migrations.AddField(model_name='tarhetaaccount', name='hub_is_public', field=models.BooleanField(default=True)),
		migrations.AddField(model_name='tarhetaaccount', name='hub_password_hash', field=models.CharField(blank=True, max_length=128, null=True)),
		migrations.AddField(model_name='tarhetaaccount', name='hub_view_count', field=models.PositiveIntegerField(default=0)),
		migrations.AddField(model_name='hubcard', name='order', field=models.PositiveIntegerField(default=0)),
		migrations.AddField(model_name='hubcard', name='is_active', field=models.BooleanField(default=True)),
		migrations.AlterModelOptions(name='hubcard', options={'ordering': ('order', 'created_at', 'id')}),
	]
