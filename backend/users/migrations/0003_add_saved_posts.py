from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_profile_last_seen'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='saved_posts',
            field=models.ManyToManyField(blank=True, related_name='saved_by', to='posts.Post'),
        ),
    ]
