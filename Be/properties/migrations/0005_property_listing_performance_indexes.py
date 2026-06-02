from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0004_property_availability_schedule"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="property",
            index=models.Index(
                fields=["is_active", "-is_featured", "-created_at"],
                name="prop_active_featured_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(
                fields=["is_active", "listing_type", "-created_at"],
                name="prop_listing_type_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(
                fields=["is_active", "price"],
                name="prop_price_idx",
            ),
        ),
    ]
