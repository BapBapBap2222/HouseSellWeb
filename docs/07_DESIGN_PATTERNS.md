# Design patterns và quy ước code

## Domain-based modular architecture

Backend chia theo nghiệp vụ:

```text
accounts
properties
appointments
agents
news
prediction
```

Mỗi app chịu trách nhiệm một phần rõ ràng. Đây là cách tổ chức giúp dự án dễ đọc và dễ mở rộng.

## Repository pattern

Repository gom query database vào một nơi.

Ví dụ:

```text
BE/properties/repositories.py
```

Lợi ích:

- View không bị query phức tạp.
- Dễ tối ưu `select_related`, `prefetch_related`, `annotate`.
- Dễ tìm nơi sửa query.

## Service layer pattern

Service chứa business logic.

Ví dụ:

- Toggle favorite.
- Upload image.
- Update property status.
- Predict price.

Lợi ích:

- View mỏng hơn.
- Logic nghiệp vụ không bị lặp.
- Dễ test.

## Serializer/DTO pattern

Serializer định nghĩa contract giữa FE và BE:

- Input cần field nào.
- Field nào hợp lệ.
- Response trả về field nào.

Ví dụ:

- `PropertyListSerializer`
- `PropertyDetailSerializer`
- `AgentReviewSerializer`
- `PricePredictionInputSerializer`

## Permission pattern

Backend là nơi enforce quyền thật sự:

- User chưa login không được favorite.
- Non-owner không được sửa property.
- Agent không được tự rating mình.
- Admin mới vào admin dashboard.

Frontend có thể ẩn nút, nhưng backend vẫn phải kiểm tra.

## API client layer

Frontend gom API vào `FE/src/lib/*Api.ts`.

Lợi ích:

- Page không gọi axios raw khắp nơi.
- Dễ đổi endpoint.
- TypeScript type tập trung.

## Component composition

Frontend chia UI thành component:

```text
Listings page = FilterSidebar + ListingCard + Pagination + DetailPanel
Profile page = Tabs + Cards + Forms + Modals
```

Lợi ích:

- Dễ tái sử dụng.
- Dễ đọc UI.
- Dễ bảo trì.

## Lazy loading và cache

Dự án dùng:

- Lazy-load model prediction.
- Cache FeaturedListings 60 giây.
- Abort request cũ khi đổi filter nhanh.

Mục tiêu là giảm tải backend và làm UI phản hồi nhanh hơn.

## Câu trình bày mẫu

> Backend dùng Repository-Service-Serializer. Repository gom query database, Service gom business logic, Serializer định nghĩa input/output API, còn View chỉ điều phối request và response. Frontend dùng component composition và API client layer để tách UI khỏi logic gọi API.

