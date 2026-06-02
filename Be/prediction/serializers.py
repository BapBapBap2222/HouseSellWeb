from rest_framework import serializers


class PricePredictionInputSerializer(serializers.Serializer):
    province_name = serializers.CharField(required=False, default="Hà Nội")
    district_name = serializers.CharField(required=False, allow_blank=True, default="")
    ward_name = serializers.CharField(required=False, allow_blank=True, default="")
    property_type_name = serializers.ChoiceField(
        required=False,
        default="Nhà",
        choices=["Nhà", "Đất", "Căn hộ chung cư", "Biệt thự/Nhà liền kề", "Shophouse"],
    )
    area = serializers.FloatField(required=False, min_value=1, default=80.0)
    floor_count = serializers.FloatField(required=False, min_value=0, default=3.0)
    bedroom_count = serializers.FloatField(required=False, min_value=0, default=3.0)
    bathroom_count = serializers.FloatField(required=False, min_value=0, default=2.0)
    latitude = serializers.FloatField(required=True, min_value=8.0, max_value=24.0)
    longitude = serializers.FloatField(required=True, min_value=102.0, max_value=110.0)
