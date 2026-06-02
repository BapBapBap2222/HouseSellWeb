from django.db import models
from django.contrib.auth.models import User


class PropertyType(models.TextChoices):
    HOUSE      = 'house',      'Nhà ở'
    APARTMENT  = 'apartment',  'Căn hộ'
    LAND       = 'land',       'Đất nền'
    VILLA      = 'villa',      'Biệt thự'
    OTHER      = 'other',      'Khác'


class ListingType(models.TextChoices):
    FOR_SALE = 'sale',  'Bán'
    FOR_RENT = 'rent',  'Cho thuê'


class PropertyStatus(models.TextChoices):
    ACTIVE     = 'active',   'Đang hoạt động'
    INACTIVE   = 'inactive', 'Không hoạt động'
    SOLD       = 'sold',     'Đã bán'
    RENTED     = 'rented',   'Đã cho thuê'


class Property(models.Model):
    # Thông tin cơ bản
    owner        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties', verbose_name='Chủ sở hữu')
    title        = models.CharField(max_length=255, verbose_name='Tiêu đề')
    description  = models.TextField(verbose_name='Mô tả')
    property_type = models.CharField(max_length=20, choices=PropertyType.choices, default=PropertyType.HOUSE, verbose_name='Loại BĐS')
    listing_type  = models.CharField(max_length=10, choices=ListingType.choices, default=ListingType.FOR_SALE, verbose_name='Hình thức')
    status       = models.CharField(max_length=20, choices=PropertyStatus.choices, default=PropertyStatus.ACTIVE, verbose_name='Trạng thái')

    # Giá cả
    price        = models.DecimalField(max_digits=15, decimal_places=0, verbose_name='Giá (VNĐ)')
    price_unit   = models.CharField(max_length=20, default='VND', verbose_name='Đơn vị tiền tệ')

    # Diện tích & thông số
    area         = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Diện tích (m²)')
    bedrooms     = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Số phòng ngủ')
    bathrooms    = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Số phòng tắm')
    floors       = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Số tầng')
    year_built   = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Năm xây dựng')
    parking_details = models.CharField(max_length=120, blank=True, verbose_name='Thông tin đỗ xe')
    facing       = models.CharField(max_length=80, blank=True, verbose_name='Hướng')
    legal_status = models.CharField(max_length=120, blank=True, verbose_name='Pháp lý')
    furniture_status = models.CharField(max_length=120, blank=True, verbose_name='Tình trạng nội thất')

    # Địa chỉ
    city         = models.CharField(max_length=100, verbose_name='Tỉnh/Thành phố')
    district     = models.CharField(max_length=100, null=True, blank=True, verbose_name='Quận/Huyện')
    ward         = models.CharField(max_length=100, null=True, blank=True, verbose_name='Phường/Xã')
    address      = models.CharField(max_length=255, verbose_name='Địa chỉ cụ thể')
    latitude     = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude    = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Tiện ích
    has_parking  = models.BooleanField(default=False, verbose_name='Có chỗ đậu xe')
    has_pool     = models.BooleanField(default=False, verbose_name='Có hồ bơi')
    has_garden   = models.BooleanField(default=False, verbose_name='Có sân vườn')
    is_furnished = models.BooleanField(default=False, verbose_name='Có nội thất')
    availability_schedule = models.JSONField(default=list, blank=True, verbose_name='Lịch rảnh xem nhà')

    # Meta
    views_count  = models.PositiveIntegerField(default=0, verbose_name='Lượt xem')
    is_featured  = models.BooleanField(default=False, verbose_name='Nổi bật')
    is_active    = models.BooleanField(default=True, verbose_name='Hiển thị')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Bất động sản'
        verbose_name_plural = 'Bất động sản'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', '-is_featured', '-created_at'], name='prop_active_featured_idx'),
            models.Index(fields=['is_active', 'listing_type', '-created_at'], name='prop_listing_type_idx'),
            models.Index(fields=['is_active', 'price'], name='prop_price_idx'),
        ]

    def __str__(self):
        return f"{self.title} - {self.city}"


class PropertyImage(models.Model):
    """Nhiều ảnh cho một bất động sản"""
    property  = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image     = models.ImageField(upload_to='properties/%Y/%m/', verbose_name='Ảnh')
    caption   = models.CharField(max_length=200, blank=True, verbose_name='Chú thích')
    is_primary = models.BooleanField(default=False, verbose_name='Ảnh đại diện')
    order     = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Ảnh {self.id} - {self.property.title}"


class Favorite(models.Model):
    """Lưu BĐS yêu thích"""
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    property  = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'property']
        verbose_name = 'Yêu thích'

    def __str__(self):
        return f"{self.user.username} → {self.property.title}"
