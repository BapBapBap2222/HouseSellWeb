from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_userprofile_activity_visible"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="profile_visible",
            field=models.BooleanField(default=True),
        ),
    ]
