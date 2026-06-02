# Frontend React

## Frontend là phần nào?

Frontend nằm trong `FE/`. Đây là phần người dùng nhìn thấy trên trình duyệt: trang chủ, nút bấm, form, card bất động sản, profile, prediction.

Frontend không truy cập database trực tiếp. Nó gọi API backend qua HTTP.

## Công nghệ chính

- React: xây giao diện bằng component.
- TypeScript: thêm kiểu dữ liệu để giảm lỗi.
- Vite: dev server và build tool.
- React Router: điều hướng trang.
- Axios: gọi API.
- Tailwind/shadcn-style components: styling và UI primitive.
- Lucide React: icon.
- Vitest/Playwright: test frontend.

## Cấu trúc frontend

```text
FE/src/
  App.tsx             Khai báo route
  main.tsx            Điểm render app
  pages/              Các trang lớn
  components/         Component dùng lại
  contexts/           AuthContext
  lib/                API client và helper
  data/               Dữ liệu tỉnh/thành, quận/huyện
  styles/             CSS global
```

## `pages/` là gì?

`pages/` chứa các màn hình lớn theo route:

- `Index.tsx`: trang chủ.
- `Listings.tsx`: danh sách nhà.
- `PropertyDetail.tsx`: chi tiết nhà.
- `Profile.tsx`: profile user.
- `Agents.tsx`: danh sách agent.
- `AgentDetail.tsx`: chi tiết agent và rating.
- `PricePrediction.tsx`: dự đoán giá.
- `News.tsx`: tin tức.

Page thường là nơi giữ state lớn, đọc URL params, gọi API và ghép các component lại.

## `components/` là gì?

Component là mảnh UI có thể dùng lại.

Ví dụ:

- `Header`
- `Footer`
- `FeaturedListings`
- `SearchModule`
- `PropertyCard`
- `FilterSidebar`
- `ScheduleModal`
- `PropertyEditorFields`

Cách chia này giúp UI không bị viết lặp lại.

## `lib/*Api.ts` là gì?

Các file trong `FE/src/lib` là lớp gọi API:

- `api.ts`: cấu hình axios chung.
- `authApi.ts`: API đăng nhập/profile.
- `propertiesApi.ts`: API property/favorite.
- `agentsApi.ts`: API agent/rating.
- `appointmentsApi.ts`: API lịch hẹn.
- `newsApi.ts`: API tin tức.

Page không gọi URL raw trực tiếp. Page gọi hàm như:

```ts
getProperties()
toggleFavorite()
getAgentReviews()
```

Điều này giúp code dễ đọc và dễ sửa endpoint.

## AuthContext

`AuthContext.tsx` giữ trạng thái đăng nhập:

- `user`
- `isLoggedIn`
- `loading`
- `login`
- `logout`
- `register`
- `refreshUser`

Các route cần đăng nhập được bọc bằng `ProtectedRoute`. Route admin dùng `AdminRoute`.

## Trang Listings

Trang `/listings` đã được tối ưu:

- Đọc filter từ query string.
- Gửi filter lên backend.
- Có phân trang.
- Có debounce khi đổi filter.
- Có abort request cũ khi user đổi filter nhanh.
- Hỗ trợ grid/list view.
- Có detail panel.

## Trang Profile

Profile có nhiều tab:

- Thông tin cá nhân.
- Favorites.
- Sell/listing của tôi.
- Appointments.
- Ratings nhận được.
- Public/private setting.

## Trang Agent Detail

Agent detail hiển thị:

- Thông tin agent.
- Latest activity.
- Rating trung bình.
- Form gửi rating/comment.
- Danh sách comment theo ngày.

## Trang Prediction

Trang `/prediction` lấy input từ user rồi gọi:

```text
POST /api/prediction/
```

Sau đó hiển thị giá ước lượng, khoảng giá và giá/m2.

