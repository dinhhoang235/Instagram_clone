from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0005_add_postimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='hide_likes',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='post',
            name='disable_comments',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='postimage',
            name='alt_text',
            field=models.CharField(blank=True, max_length=1024, null=True),
        ),
    ]
