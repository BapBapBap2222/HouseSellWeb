# Luồng nghiệp vụ chính

## Đăng ký và đăng nhập

```text
User nhập form
  -> FE gọi API auth
  -> BE validate
  -> BE tạo user hoặc trả token
  -> FE lưu access_token/refresh_token
  -> AuthContext lấy thông tin user hiện tại
```

Nếu token hết hạn, axios interceptor thử refresh token. Nếu refresh thất bại, FE đưa user về trang login.

## Xem và lọc listing

```text
User vào /listings
  -> FE đọc query params
  -> FE gửi filter lên /api/properties/
  -> BE filter + paginate + serialize
  -> FE render danh sách
```

Danh sách không tải toàn bộ database. Mỗi lần chỉ tải một trang.

## Favorite

```text
User bấm bookmark
  -> Nếu chưa login: chuyển về /login
  -> Nếu đã login: FE cập nhật UI tạm thời
  -> POST /api/properties/<id>/favorite/
  -> BE thêm hoặc xóa Favorite
  -> FE đồng bộ kết quả
```

Profile tab Favorites gọi `/api/properties/favorites/` để lấy lại danh sách đã lưu.

## Đặt lịch xem nhà

```text
Buyer mở modal đặt lịch
  -> Chọn ngày/giờ
  -> POST /api/appointments/
  -> BE tạo appointment pending
  -> Seller xem lịch ở profile/owner appointments
```

## Seller đăng và quản lý nhà

Seller verified mới được vào:

- `/add-property`
- `/manage-property/:id`

Seller có thể:

- Activate.
- Pause.
- Mark sold.
- Mark rented.
- Delete.

Backend kiểm tra owner thật sự trước khi cho sửa/xóa.

## Agent rating/comment

```text
User vào /agents/:slug
  -> FE tải reviews
  -> User gửi rating/comment
  -> POST /api/agents/<slug>/reviews/
  -> BE chặn self-rating
  -> BE update_or_create review
  -> BE cập nhật rating trung bình của Agent
```

Seller xem rating mình nhận được trong Profile tab Ratings.

## Public/private profile

Trong profile có setting:

- `profile_visible`: bật/tắt profile public.
- `activity_visible`: bật/tắt activity public.

Khi profile private, agent có thể bị ẩn khỏi danh sách public.

## Prediction

```text
User vào /prediction
  -> Nhập thông tin nhà
  -> POST /api/prediction/
  -> Backend validate và gọi Linear Regression model
  -> Trả estimated_price và khoảng giá
```

## News

```text
User vào /news
  -> FE gọi /api/news/
  -> Render danh sách bài viết
User mở /news/:id
  -> FE gọi detail
  -> Render nội dung bài viết
```

