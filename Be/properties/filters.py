import django_filters
import re
import unicodedata
from django_filters import rest_framework as filters
from django.db.models import Q

from .models import Property, PropertyType, ListingType, PropertyStatus


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass


def normalize_location_value(value):
    return (
        unicodedata.normalize("NFD", str(value or ""))
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
        .strip()
    )


class PropertyFilter(django_filters.FilterSet):
    # Lọc theo loại BĐS và hình thức
    property_type = django_filters.ChoiceFilter(choices=PropertyType.choices)
    property_types = CharInFilter(field_name='property_type', lookup_expr='in')
    listing_type  = django_filters.ChoiceFilter(choices=ListingType.choices)
    status        = django_filters.ChoiceFilter(choices=PropertyStatus.choices)

    # Lọc theo giá (khoảng)
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    # Lọc theo diện tích (khoảng)
    area_min = django_filters.NumberFilter(field_name='area', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area', lookup_expr='lte')

    # Lọc theo địa điểm
    city = django_filters.CharFilter(method='filter_city')
    # Backward-compatible alias (old FE used province)
    province = django_filters.CharFilter(method='filter_city')
    district = django_filters.CharFilter(method='filter_district')

    # Lọc theo số phòng ngủ (tối thiểu)
    bedrooms = django_filters.NumberFilter(field_name='bedrooms')
    bedrooms_min = django_filters.NumberFilter(field_name='bedrooms', lookup_expr='gte')

    # Tiện ích
    has_parking  = django_filters.BooleanFilter()
    has_pool     = django_filters.BooleanFilter()
    is_furnished = django_filters.BooleanFilter()
    is_featured  = django_filters.BooleanFilter()

    # Lọc theo chủ sở hữu
    owner = django_filters.NumberFilter(field_name='owner__id')

    class Meta:
        model = Property
        fields = [
            'property_type', 'property_types', 'listing_type', 'status',
            'price_min', 'price_max', 'area_min', 'area_max',
            'city', 'province', 'district', 'bedrooms', 'bedrooms_min',
            'has_parking', 'has_pool', 'is_furnished', 'is_featured', 'owner',
        ]

    def filter_city(self, queryset, _name, value):
        raw_value = str(value or "").strip()
        if not raw_value:
            return queryset

        normalized = normalize_location_value(raw_value)
        variants = {raw_value}
        if "ho chi minh" in normalized or normalized in {"hcm", "tp hcm", "tphcm"}:
            variants.update({
                "Hồ Chí Minh",
                "Ho Chi Minh",
                "TP Hồ Chí Minh",
                "Thành phố Hồ Chí Minh",
            })
        elif "ha noi" in normalized or "hanoi" in normalized:
            variants.update({"Hà Nội", "Ha Noi", "Hanoi", "Thành phố Hà Nội"})

        query = Q()
        for variant in variants:
            query |= Q(city__icontains=variant)
        return queryset.filter(query)

    def filter_district(self, queryset, _name, value):
        raw_value = str(value or "").strip()
        if not raw_value:
            return queryset

        normalized = normalize_location_value(raw_value)
        variants = {raw_value}
        for prefix in ("quan ", "huyen ", "thi xa ", "thanh pho ", "tp "):
            if normalized.startswith(prefix):
                variants.add(raw_value.split(" ", 1)[1])
                break

        district_number = re.search(r"(?:quan|district)?\s*(\d+)$", normalized)
        if district_number:
            number = district_number.group(1)
            variants.update({number, f"Quận {number}", f"District {number}"})

        query = Q()
        for variant in variants:
            query |= Q(district__icontains=variant)
        return queryset.filter(query)
