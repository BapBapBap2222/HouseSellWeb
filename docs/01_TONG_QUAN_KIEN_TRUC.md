# Tổng quan kiến trúc

## Mục tiêu dự án

HouseSellWeb là website bất động sản phục vụ ba nhóm người dùng:

- Buyer/renter: xem nhà, lọc danh sách, lưu yêu thích, đặt lịch xem nhà.
- Seller/agent: đăng nhà, quản lý trạng thái nhà, xem lịch hẹn, nhận rating/comment.
- Admin: quản lý dữ liệu qua Django Admin và trang admin trong frontend.

Dự án không chỉ là CRUD cơ bản. Nó có thêm:

- Hệ thống xác minh seller.
- Profile public/private.
- Favorite lưu lại được.
- Rating/comment cho agent.
- Quản lý trạng thái nhà đã bán/đã thuê.
- Dự đoán giá nhà bằng Linear Regression.

## Kiến trúc tổng thể

```text
Người dùng trên trình duyệt
  |
  v
Frontend React/Vite
  - Hiển thị giao diện
  - Điều hướng route
  - Gửi request API
  - Lưu trạng thái đăng nhập
  |
  v
Backend Django REST Framework
  - Xử lý nghiệp vụ
  - Validate dữ liệu
  - Kiểm tra quyền
  - Query database
  - Upload file
  - Gọi model prediction
  |
  v
Supabase PostgreSQL + Supabase Storage
  - PostgreSQL lưu dữ liệu nghiệp vụ
  - Storage lưu ảnh và giấy tờ upload
```

## Vì sao tách frontend và backend?

Frontend tập trung vào trải nghiệm người dùng: layout, form, nút bấm, loading, route, hiển thị dữ liệu.

Backend tập trung vào nghiệp vụ và dữ liệu: user có quyền gì, property có được sửa không, favorite lưu thế nào, appointment tạo ra sao, rating hợp lệ không, model prediction chạy thế nào.

Cách tách này giúp:

- Dễ phát triển song song.
- Dễ test backend riêng.
- Dễ thay giao diện mà không phá logic nghiệp vụ.
- Dễ tách thành 2 repo `FE` và `BE` nếu cần.

## Cấu trúc thư mục cấp cao

```text
HouseSellWeb/
  BE/                    Backend Django REST Framework
  FE/                    Frontend React + Vite + TypeScript
  LinearRegressionModel/ Workspace huấn luyện model
  supabase/              Cấu hình Supabase CLI/local
  docs/                  Tài liệu bàn giao
  README.md              Cửa vào tài liệu
```

## Runtime cần những gì?

Khi chạy website, phần bắt buộc là:

- `BE/`
- `FE/`
- Database PostgreSQL/Supabase hoặc cấu hình database local
- Model trong `BE/ml_models/`

Thư mục `LinearRegressionModel/` chỉ cần khi muốn train lại model, không bắt buộc khi chạy web.

## Các route frontend quan trọng

| Route | Ý nghĩa |
| --- | --- |
| `/` | Trang chủ |
| `/listings` | Danh sách nhà mua/thuê |
| `/property/:id` | Chi tiết bất động sản |
| `/agents` | Danh sách agent/seller |
| `/agents/:slug` | Hồ sơ agent và rating/comment |
| `/profile` | Hồ sơ cá nhân, favorite, sell, appointment, rating |
| `/add-property` | Seller verified đăng nhà |
| `/manage-property/:id` | Seller quản lý nhà đã đăng |
| `/news` | Danh sách tin tức |
| `/prediction` | Dự đoán giá nhà |
| `/admin-dashboard` | Trang admin trong frontend |

## Các API backend quan trọng

| Endpoint | Module | Ý nghĩa |
| --- | --- | --- |
| `/api/auth/` | accounts | Đăng ký, đăng nhập, profile, verification |
| `/api/properties/` | properties | Listing, filter, tạo property |
| `/api/properties/my/` | properties | Nhà của seller hiện tại |
| `/api/properties/<id>/favorite/` | properties | Thêm/bỏ yêu thích |
| `/api/appointments/` | appointments | Đặt lịch xem nhà |
| `/api/appointments/owner/` | appointments | Seller xem lịch hẹn nhà mình |
| `/api/agents/` | agents | Danh sách agent |
| `/api/agents/<slug>/reviews/` | agents | Rating/comment agent |
| `/api/news/` | news | Tin tức |
| `/api/prediction/` | prediction | Dự đoán giá bằng Linear Regression |

## Một câu để trình bày kiến trúc

> Dự án dùng kiến trúc client-server: React là client hiển thị giao diện, Django REST Framework là server cung cấp API và xử lý nghiệp vụ, Supabase PostgreSQL lưu dữ liệu, Supabase Storage lưu file upload, còn model Linear Regression được đóng gói trong backend để phục vụ endpoint dự đoán giá.

