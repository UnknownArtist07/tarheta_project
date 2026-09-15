from django.db import migrations, models


class Migration(migrations.Migration):
	dependencies = [('hub', '0008_tarhetaaccount_age_birthday')]
	operations = [
		migrations.AddField(model_name='hubcard', name='audio_file', field=models.FileField(blank=True, upload_to='cards/audio/')),
		migrations.AddField(model_name='hubcard', name='card_theme', field=models.CharField(default='paper', max_length=20)),
		migrations.AddField(model_name='hubcard', name='cover_image', field=models.ImageField(blank=True, upload_to='cards/covers/')),
		migrations.AddField(model_name='hubcard', name='password_hash', field=models.CharField(blank=True, max_length=128)),
		migrations.AddField(model_name='hubcard', name='schedule', field=models.JSONField(blank=True, default=dict)),
		migrations.AddField(model_name='hubcard', name='video_file', field=models.FileField(blank=True, upload_to='cards/video/')),
	]