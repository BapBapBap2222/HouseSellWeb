# Backend Django API

## Backend là phần nào?

Backend nằm trong thư mục `BE/`. Đây là phần chạy bằng Python/Django, chịu trách nhiệm:

- Nhận request từ frontend.
- Validate dữ liệu.
- Kiểm tra đăng nhập và phân quyền.
- Đọc/ghi database.
- Upload file.
- Trả JSON cho frontend.
- Gọi model Linear Regression để dự đoán giá.

## Công nghệ chính

- Django: framework backend Python.
- Django REST Framework: tạo API JSON.
- Simple JWT: đăng nhập bằng access token và refresh token.
- django-filter: lọc danh sách property/news.
- drf-yasg: Swagger/Redoc API docs.
- PostgreSQL/Supabase: database chính.

## Cấu trúc backend

```text
BE/
  core/             Settings, URL tổng, permission chung
  accounts/         User, profile, xác minh seller
  properties/       Bất động sản, ảnh, favorite, trạng thái nhà
  appointments/     Lịch hẹn xem nhà
  agents/           Agent profile, rating/comment
  news/             Tin tức
  prediction/       API dự đoán giá nhà
  utils/            Helper dùng chung
  ml_models/        Model Linear Regression runtime
  manage.py
  requirements.txt
```

## Một app Django gồm những file nào?

| File | Giải thích cho người mới |
| --- | --- |
| `models.py` | Định nghĩa bảng database |
| `serializers.py` | Validate input và biến object thành JSON |
| `views.py` | Nhận request, gọi logic, trả response |
| `urls.py` | Gắn đường dẫn API với view |
| `services.py` | Business logic như tạo nhà, favorite, predict |
| `repositories.py` | Query database tập trung |
| `filters.py` | Định nghĩa filter query params |
| `tests.py` | Test chức năng |

## Request đi qua đâu?

Ví dụ:

```text
GET /api/properties/?listing_type=sale&page=1&page_size=30
```

Luồng:

```text
BE/core/urls.py
  -> BE/properties/urls.py
  -> BE/properties/views.py
  -> BE/properties/filters.py
  -> BE/properties/repositories.py
  -> BE/properties/serializers.py
  -> JSON response
```

## Accounts

`accounts` quản lý:

- Đăng ký/đăng nhập.
- Thông tin profile.
- Avatar, phone, address, intro, bio.
- Public/private profile.
- Activity visible.
- Yêu cầu xác minh seller.

Model chính:

- `UserProfile`
- `VerificationRequest`

## Properties

`properties` là module lớn nhất vì liên quan trực tiếp tới listing.

Model chính:

- `Property`: bất động sản.
- `PropertyImage`: ảnh property.
- `Favorite`: property user đã lưu.

Chức năng:

- List property.
- Filter/search/order.
- Tạo/sửa/xóa property.
- Upload ảnh.
- Toggle favorite.
- Seller đổi status: active, inactive, sold, rented.

Tối ưu quan trọng:

- API list phân trang mặc định.
- FE gửi filter lên BE thay vì tải toàn bộ data.
- `is_favorited` dùng SQL `Exists` để tránh query từng dòng.
- Có index database cho listing.

## Appointments

`appointments` quản lý lịch hẹn xem nhà.

Buyer tạo lịch hẹn, seller xem lịch hẹn của các property mình sở hữu. Status gồm:

- `pending`
- `confirmed`
- `rejected`
- `completed`
- `cancelled`

## Agents và rating

`agents` quản lý hồ sơ public của seller/agent và review.

Model:

- `Agent`
- `AgentReview`

Rule:

- User đăng nhập mới rating được.
- Không được tự rating chính mình.
- Một user chỉ có một review cho một agent.
- Khi review thay đổi, rating trung bình của agent được cập nhật.

## News

`news` quản lý bài viết:

- Title.
- Content.
- Thumbnail.
- Author.
- Views count.
- Published status.

## Prediction

`prediction` không cần bảng database nghiệp vụ riêng. Nó nhận input, validate, gọi service, service load model trong `BE/ml_models` và trả kết quả dự đoán.

Endpoint:

```text
POST /api/prediction/
```

## Swagger và Redoc

Backend có:

- `/swagger/`
- `/redoc/`

Đây là nơi xem danh sách API, payload và response.

