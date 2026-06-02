# Flow chi tiết của dự án HouseSellWeb

Tài liệu này mô tả dự án theo kiểu "một request chạy qua những lớp nào". Mục tiêu là khi đọc xong, bạn có thể trình bày được dự án không chỉ ở mức "React gọi Django", mà hiểu rõ từng lớp có trách nhiệm gì, vì sao chia như vậy, dữ liệu đi qua đâu, validate ở đâu, query database ở đâu, phân quyền ở đâu và response quay về giao diện như thế nào.

## 1. Bức tranh tổng thể

HouseSellWeb là ứng dụng full-stack gồm 5 khối chính:

```text
Người dùng / Browser
  -> Frontend React Vite
    -> Axios API client
      -> Backend Django REST Framework
        -> Service / Repository / Serializer / Model
          -> Supabase PostgreSQL
          -> Supabase Storage / local media
          -> Linear Regression model trong BE/ml_models
```

Nói ngắn gọn:

- Frontend chịu trách nhiệm hiển thị giao diện, lấy input người dùng, gọi API, lưu token đăng nhập và điều hướng trang.
- Backend chịu trách nhiệm xác thực, phân quyền, validate dữ liệu, xử lý nghiệp vụ, truy vấn database và trả JSON.
- Database PostgreSQL trên Supabase lưu user, profile, property, appointment, favorite, agent, review, news.
- Supabase Storage hoặc media backend lưu ảnh/property image/avatar/tài liệu xác minh.
- Prediction dùng model Linear Regression đã đóng gói trong backend, không cần chạy folder `LinearRegressionModel` khi production.

## 2. Flow từ browser vào frontend

Khi người dùng mở web, trình duyệt tải app React từ frontend.

```text
Browser mở URL
  -> FE/src/main.tsx
    -> FE/src/App.tsx
      -> QueryClientProvider
      -> AuthProvider
      -> TooltipProvider
      -> BrowserRouter
      -> Routes
      -> Page component
```

Trong [App.tsx](../FE/src/App.tsx), dự án dùng `BrowserRouter` và `Routes` để map URL thành page:

- `/` -> `Index`
- `/listings` -> `Listings`
- `/property/:id` -> `PropertyDetail`
- `/agents` -> `Agents`
- `/agents/:slug` -> `AgentDetail`
- `/explore` -> `Explore`
- `/prediction` -> `PricePrediction`
- `/login` -> `Login`
- `/register` -> `Register`
- `/profile` -> `ProtectedRoute` rồi mới vào `Profile`
- `/add-property` -> `ProtectedRoute requireVerifiedSeller` rồi mới vào `AddProperty`
- `/admin-dashboard` -> `AdminRoute` rồi mới vào `AdminDashboard`

Điểm quan trọng: frontend không tự quyết định dữ liệu thật. Frontend chỉ giữ state tạm thời, hiển thị UI và gọi backend. Quyền thật vẫn do backend kiểm tra lại.

## 3. Các lớp chính trong frontend

Frontend được chia theo lớp như sau:

```text
pages/
  -> màn hình lớn tương ứng route
components/
  -> UI dùng lại hoặc từng phần của trang
contexts/
  -> state dùng toàn app, hiện tại quan trọng nhất là AuthContext
lib/
  -> hàm gọi API, chuẩn hóa dữ liệu, helper nghiệp vụ
data/
  -> dữ liệu tĩnh như tỉnh/thành, đơn vị hành chính
assets/
  -> ảnh, logo, visual dùng trong UI
```

### 3.1. Page layer

`pages/` là nơi người dùng thật sự nhìn thấy từng màn hình.

Ví dụ:

- `Listings.tsx`: danh sách bất động sản, filter, search, query params.
- `PropertyDetail.tsx`: chi tiết nhà, ảnh, favorite, đặt lịch.
- `AddProperty.tsx`: form seller đăng nhà.
- `ManageProperty.tsx`: seller chỉnh sửa/xóa/chuyển trạng thái nhà.
- `Agents.tsx`: danh sách agent, filter agent.
- `AgentDetail.tsx`: profile agent, activity, rating/comment.
- `Profile.tsx`: profile cá nhân, favorite, lịch hẹn, property của mình, review.
- `AdminDashboard.tsx`: admin duyệt seller, quản lý agent/news.
- `PricePrediction.tsx`: nhập thông tin nhà và gọi model dự đoán.

Page layer thường làm 4 việc:

1. Đọc route/query param từ URL.
2. Gọi API qua `lib/*Api.ts`.
3. Lưu state hiển thị như `loading`, `error`, `items`, `selectedFilter`.
4. Render components.

### 3.2. Component layer

`components/` chứa những phần UI tái sử dụng:

- `Header`, `Footer`: layout chung.
- `ProtectedRoute`, `AdminRoute`: chặn route theo quyền.
- `AgentTrust`, `FeaturedListings`, `LocationTiles`: các block ở trang chủ.
- `components/ui/*`: button, toast, form control, map, sonner...
- `components/listings/*`: filter/sidebar/card liên quan listing.

Component không nên chứa quá nhiều nghiệp vụ database. Nó chỉ nhận props, gọi callback hoặc gọi API nhỏ khi thật sự cần.

### 3.3. AuthContext layer

[AuthContext.tsx](../FE/src/contexts/AuthContext.tsx) là nơi frontend giữ trạng thái đăng nhập hiện tại.

Flow khi app khởi động:

```text
App render
  -> AuthProvider mount
    -> kiểm tra localStorage có access_token không
      -> nếu không có: user = null, loading = false
      -> nếu có: gọi getMe()
        -> backend trả profile
        -> setUser(profile)
```

AuthContext cung cấp:

- `user`: thông tin user hiện tại.
- `loading`: đang kiểm tra token/profile.
- `isLoggedIn`: đã đăng nhập hay chưa.
- `login(payload)`: gọi login API, nhận token, sau đó gọi `/me`.
- `logout()`: gọi logout API và clear user.
- `register(payload)`: gọi đăng ký.
- `refreshUser()`: tải lại profile sau khi update.

### 3.4. API client layer

[api.ts](../FE/src/lib/api.ts) là lõi gọi API bằng Axios.

Flow mỗi request frontend gọi backend:

```text
Page/component gọi hàm trong lib
  -> lib dùng api.get/post/patch/delete
    -> api.ts tự gắn baseURL
    -> request interceptor lấy access_token từ localStorage
    -> gắn Authorization: Bearer <token>
    -> gửi request sang Django
```

Flow khi token hết hạn:

```text
Backend trả 401
  -> response interceptor trong api.ts bắt lỗi
    -> lấy refresh_token từ localStorage
    -> gọi /api/auth/token/refresh/
      -> nếu thành công: lưu access token mới, gọi lại request cũ
      -> nếu thất bại: clear token, redirect /login
```

Đây là lý do page không cần tự xử lý refresh token. Mọi API đều đi qua `api.ts`.

### 3.5. API helper layer trong `lib/`

Các file `lib/*Api.ts` đóng vai trò wrapper cho endpoint backend:

- `authApi.ts`: đăng nhập, đăng ký, logout, get profile.
- `propertiesApi.ts`: listing, detail, create/update/delete, upload ảnh, favorite.
- `appointmentsApi.ts`: tạo lịch hẹn, danh sách lịch hẹn, đổi trạng thái.
- `agentsApi.ts`: list/detail agent, review, admin revoke/delete.
- `newsApi.ts`: danh sách/tạo/sửa/xóa tin tức.
- `verificationApi.ts`: gửi yêu cầu seller verification, admin duyệt.

Lớp này giúp page không phải nhớ URL backend. Page chỉ gọi hàm có nghĩa nghiệp vụ, ví dụ `getProperties()`, `toggleFavorite()`, `createAgentReview()`.

## 4. Flow từ frontend sang backend

Ví dụ người dùng mở `/listings?listing_type=sale&province=ha-noi`.

```text
Listings.tsx
  -> đọc query params
  -> gọi getProperties(filters)
    -> FE/src/lib/propertiesApi.ts
      -> api.get("/api/properties/", { params })
        -> Axios interceptor gắn JWT nếu có
          -> Django nhận request
```

Backend nhận request theo thứ tự:

```text
HTTP request
  -> Django middleware
    -> CORS middleware
    -> Authentication middleware
    -> Django URL resolver trong core/urls.py
      -> app urls.py
        -> View class/function
          -> Permission classes
          -> Serializer validate input nếu có body
          -> Service xử lý nghiệp vụ
          -> Repository query database
          -> Model ORM
          -> Database / Storage / Model prediction
          -> Serializer format output
          -> Response JSON
```

## 5. Các lớp chính trong backend

Backend nằm trong `BE/`, gồm nhiều Django app theo domain:

```text
accounts/
agents/
appointments/
properties/
news/
prediction/
core/
utils/
ml_models/
```

### 5.1. `core/`: cấu hình gốc

`core/` là project Django chính:

- [settings.py](../BE/core/settings.py): cấu hình app, database, JWT, CORS, Supabase, email, media, security.
- [urls.py](../BE/core/urls.py): route tổng, include các app API.
- `wsgi.py`, `asgi.py`: entrypoint khi deploy.
- `permissions.py`: custom permission dùng chung.

`core/urls.py` map API như sau:

```text
/api/auth/        -> accounts.urls
/api/properties/  -> properties.urls
/api/appointments/-> appointments.urls
/api/agents/      -> agents.urls
/api/news/        -> news.urls
/api/prediction/  -> prediction.urls
/swagger/         -> Swagger API docs
/redoc/           -> Redoc API docs
```

### 5.2. `models.py`: lớp dữ liệu

`models.py` định nghĩa bảng database thông qua Django ORM.

Ví dụ `properties.models.Property` đại diện bảng bất động sản:

- owner
- title
- price
- area
- city/district/ward/address
- latitude/longitude
- listing_type
- status
- images
- is_featured
- is_active
- views_count

Django migration chuyển model thành schema database. Khi gọi `Property.objects.filter(...)`, Django tạo SQL để query PostgreSQL.

### 5.3. `urls.py`: lớp định tuyến trong app

Mỗi app có `urls.py` để map endpoint cụ thể vào view.

Ví dụ ý nghĩa:

```text
GET  /api/properties/       -> PropertyListCreateView
POST /api/properties/       -> PropertyListCreateView
GET  /api/properties/<id>/  -> PropertyDetailView
POST /api/properties/<id>/favorite/ -> FavoriteToggleView
```

`urls.py` không xử lý logic. Nó chỉ nói: URL này đi vào view nào.

### 5.4. `views.py`: lớp API controller

View là nơi nhận request và trả response.

Một view thường làm:

1. Chọn permission.
2. Chọn serializer.
3. Lấy queryset.
4. Gọi service nếu có nghiệp vụ.
5. Trả `Response`.

Ví dụ [PropertyListCreateView](../BE/properties/views.py):

- `GET /api/properties/`: lấy danh sách property qua repository, cho filter/search/ordering/pagination.
- `POST /api/properties/`: validate bằng serializer, rồi gọi `PropertyService.create_property`.

View không nên chứa quá nhiều business logic. Nếu logic dài, dự án đẩy sang `services.py`.

### 5.5. `serializers.py`: lớp contract dữ liệu

Serializer trong Django REST Framework có 2 vai trò:

1. Input validation: kiểm tra dữ liệu FE gửi lên.
2. Output formatting: biến model Python thành JSON trả về FE.

Ví dụ khi tạo property:

```text
FE gửi JSON/form data
  -> PropertyCreateUpdateSerializer kiểm tra field
    -> thiếu title/price/city thì báo lỗi
    -> kiểu dữ liệu sai thì báo lỗi
    -> dữ liệu hợp lệ thì tạo validated_data
```

Khi trả property list:

```text
Property model object
  -> PropertyListSerializer
    -> thêm ảnh chính
    -> thêm owner/agent info nếu cần
    -> thêm is_favorited cho user hiện tại
    -> trả JSON gọn cho card listing
```

Serializer là nơi rất quan trọng vì nó là hợp đồng giữa FE và BE. FE phụ thuộc đúng field serializer trả ra.

### 5.6. `services.py`: lớp nghiệp vụ

Service chứa logic nghiệp vụ không nên để trong view.

Ví dụ [PropertyService](../BE/properties/services.py):

- tạo property
- update property
- xóa property
- tăng views_count
- toggle favorite
- upload ảnh
- validate số lượng ảnh, định dạng ảnh, dung lượng ảnh
- xóa ảnh và chọn ảnh primary thay thế

Ví dụ [AppointmentService](../BE/appointments/services.py):

- requester chỉ được hủy lịch của mình.
- seller/admin được chuyển trạng thái lịch hẹn theo rule.
- không cho chuyển trạng thái sai luồng.

Service giúp code dễ thuyết trình:

> View nhận request, serializer validate dữ liệu, service xử lý nghiệp vụ, repository truy vấn database.

### 5.7. `repositories.py`: lớp truy vấn database

Repository gom query database vào một nơi.

Ví dụ [PropertyRepository](../BE/properties/repositories.py):

- `get_available(user)`: lấy property đang active, kèm owner/profile/agent/image.
- `get_accessible_for_user(user)`: user thường thấy active, owner thấy cả property của mình.
- `get_by_owner(user)`: lấy property của seller.
- `get_favorites(user)`: lấy favorite kèm property và ảnh.
- `increment_view(property_obj)`: tăng views_count bằng SQL update.

Vì sao cần repository:

- Tránh viết query lặp lại trong nhiều view.
- Dễ tối ưu `select_related`, `prefetch_related`.
- Tách rõ "query dữ liệu" khỏi "xử lý nghiệp vụ".

### 5.8. `permissions.py`: lớp phân quyền

Backend không tin frontend. Dù frontend có ẩn nút, backend vẫn phải kiểm tra.

Một số permission/logic:

- `IsAuthenticated`: bắt buộc đăng nhập.
- `IsAuthenticatedOrReadOnly`: ai cũng đọc được, nhưng ghi phải đăng nhập.
- `IsOwnerOrReadOnly`: owner mới được sửa/xóa tài nguyên.
- `ProtectedRoute requireVerifiedSeller` ở FE chỉ là chặn UI; backend vẫn kiểm tra owner/quyền trong service/view.
- Admin action kiểm tra `request.user.is_staff`.

### 5.9. `pagination.py`, `filters.py`: lớp giảm tải và lọc dữ liệu

Pagination giúp API không trả quá nhiều dữ liệu một lần.

Ví dụ agents:

- `/api/agents/` mặc định trả tối đa 20.
- Trang chủ gọi `page_size=4`.
- Nếu client cố gọi `page_size=999`, backend vẫn giới hạn `max_page_size=20`.

Filters giúp FE truyền query params:

```text
/api/properties/?listing_type=sale&city=Hà Nội&min_price=1000000000
```

Backend đọc query params và lọc queryset thay vì FE tải hết rồi lọc.

## 6. Flow đăng ký, đăng nhập, giữ phiên

### 6.1. Đăng ký

```text
Register.tsx
  -> AuthContext.register()
    -> authApi.register()
      -> POST /api/auth/register/
        -> RegisterView
          -> RegisterSerializer validate username/password/email
          -> AuthService.register()
            -> tạo User
            -> signal tạo UserProfile
            -> signal sync Agent profile cho user
            -> tạo JWT access/refresh
          -> trả token/profile data
```

Điểm đáng chú ý:

- Khi tạo `User`, signal trong `accounts/signals.py` tự tạo `UserProfile`.
- Dự án cũng sync `Agent` profile cho user để user có thể có public agent profile.
- Password không lưu plaintext; Django hash password.

### 6.2. Đăng nhập

```text
Login.tsx
  -> AuthContext.login()
    -> authApi.login()
      -> POST /api/auth/login/
        -> LoginView
          -> LoginSerializer validate input
          -> AuthService.login(username, password)
            -> authenticate user
            -> tạo JWT access/refresh
          -> trả token
    -> tokenStorage lưu localStorage
    -> getMe()
      -> GET /api/auth/profile/
      -> setUser(profile)
```

### 6.3. Request đã đăng nhập

```text
FE gọi API
  -> api.ts lấy access_token
  -> gắn Authorization: Bearer ...
  -> Django REST Framework JWTAuthentication đọc token
  -> request.user = User tương ứng
  -> permission kiểm tra user
```

### 6.4. Token hết hạn

```text
API trả 401
  -> Axios interceptor trong api.ts
    -> POST /api/auth/token/refresh/
      -> nếu refresh hợp lệ: lấy access mới, gọi lại request cũ
      -> nếu refresh lỗi: clear localStorage, chuyển /login
```

## 7. Flow xem danh sách bất động sản

```text
User mở /listings
  -> Listings.tsx đọc query params
  -> gọi propertiesApi.getProperties(filters)
  -> GET /api/properties/?...
  -> core/urls.py -> properties.urls
  -> PropertyListCreateView.get_queryset()
  -> PropertyRepository.get_available(request.user)
  -> filter backend xử lý PropertyFilter
  -> search backend xử lý search
  -> ordering backend xử lý ordering
  -> pagination xử lý page/page_size nếu có
  -> PropertyListSerializer format output
  -> Response JSON
  -> Listings.tsx render card
```

Các lớp chạy qua:

```text
Page -> lib API -> Axios -> Django URL -> View -> Repository -> Model/DB -> Serializer -> Response -> Page
```

Tối ưu ở flow này:

- `select_related("owner", "owner__profile", "owner__agent_profile")` để tránh query owner lặp lại.
- `prefetch_related(images)` để lấy ảnh theo batch.
- `is_favorited_value` annotate bằng `Exists` để FE biết user đã yêu thích property chưa.
- filter/search/order chạy ở backend, không tải toàn bộ rồi lọc ở frontend.

## 8. Flow xem chi tiết property

```text
User bấm một card listing
  -> Link /property/:id
  -> PropertyDetail.tsx
  -> GET /api/properties/<id>/
  -> PropertyDetailView.retrieve()
    -> get_object() kiểm tra accessible queryset
    -> PropertyService.track_view(instance)
      -> PropertyRepository.increment_view()
    -> refresh views_count
    -> PropertyDetailSerializer format detail
  -> FE render ảnh, giá, địa chỉ, agent, nút favorite, form appointment
```

Điểm quan trọng:

- `views_count` tăng ở backend, không tăng ở frontend.
- Nếu property inactive, người ngoài không xem được; owner vẫn có thể xem property của mình.
- Serializer detail trả nhiều thông tin hơn serializer list.

## 9. Flow favorite

```text
User bấm nút tim
  -> FE gọi toggleFavorite(propertyId)
  -> POST /api/properties/<id>/favorite/
  -> FavoriteToggleView
    -> permission IsAuthenticated
    -> PropertyService.toggle_favorite(user, property_id)
      -> PropertyRepository.get_by_id()
      -> get_or_create Favorite
        -> nếu chưa có: tạo Favorite, trả is_favorited=True
        -> nếu đã có: xóa Favorite, trả is_favorited=False
  -> FE cập nhật trạng thái nút tim
```

Flow xem lại favorite:

```text
Profile.tsx tab favorites
  -> GET /api/properties/favorites/
  -> FavoriteListView
  -> PropertyRepository.get_favorites(user)
  -> FavoriteSerializer
  -> FE render danh sách nhà đã lưu
```

## 10. Flow seller đăng nhà

```text
User bấm Sell Property
  -> Header link /add-property
  -> ProtectedRoute requireVerifiedSeller
    -> nếu chưa đăng nhập: chuyển /login
    -> nếu chưa verified seller: chặn UI
    -> nếu verified: vào AddProperty
```

Khi submit:

```text
AddProperty.tsx
  -> chuẩn hóa form bằng propertyForm.ts
  -> POST /api/properties/
  -> PropertyListCreateView.create()
    -> PropertyCreateUpdateSerializer validate field
    -> PropertyService.create_property(owner=request.user, validated_data)
      -> PropertyRepository.create()
      -> Property.objects.create()
    -> PropertyDetailSerializer output
  -> FE chuyển sang detail/manage hoặc báo thành công
```

Nếu upload ảnh:

```text
FE gửi multipart/form-data
  -> POST /api/properties/<id>/images/
  -> PropertyImageUploadView
    -> parser MultiPartParser/FormParser
    -> PropertyService.upload_images()
      -> kiểm tra owner
      -> kiểm tra số file tối đa
      -> kiểm tra định dạng file
      -> kiểm tra dung lượng
      -> tạo PropertyImage
      -> storage backend lưu file
    -> PropertyImageUploadSerializer trả danh sách ảnh
```

Nơi lưu ảnh:

- Nếu cấu hình Supabase Storage đầy đủ: file đi qua Supabase storage helper.
- Nếu local/dev: Django media/local storage vẫn có thể dùng theo cấu hình hiện tại.
- URL ảnh khi trả về FE được build qua `utils.supabase_storage.build_media_url`.

## 11. Flow seller quản lý nhà

```text
Seller mở Profile
  -> tab property/my listings
  -> GET /api/properties/my/
  -> MyPropertiesView
    -> PropertyRepository.get_by_owner(request.user)
    -> PropertyListSerializer
```

Khi seller sửa:

```text
ManageProperty.tsx
  -> PATCH/PUT /api/properties/<id>/
  -> PropertyDetailView.update()
    -> get_object() lấy property accessible
    -> serializer validate dữ liệu mới
    -> PropertyService.update_property(user, property_obj, validated_data)
      -> kiểm tra owner hoặc staff
      -> set field mới
      -> PropertyRepository.save()
    -> trả PropertyDetailSerializer
```

Khi seller xóa:

```text
ManageProperty.tsx
  -> DELETE /api/properties/<id>/
  -> PropertyDetailView.destroy()
    -> PropertyService.delete_property()
      -> kiểm tra owner hoặc staff
      -> xóa image files liên quan
      -> xóa property
```

Trạng thái property:

- `active`: đang hiển thị.
- `inactive`: không hoạt động.
- `sold`: đã bán.
- `rented`: đã cho thuê.

Seller là người hợp lý để chuyển trạng thái property của mình. Backend vẫn kiểm tra owner.

## 12. Flow seller verification

Mục đích: không phải user nào cũng được đăng bán ngay. User cần gửi yêu cầu xác minh seller.

```text
Profile/Verification UI
  -> POST /api/auth/verification/
  -> VerificationRequestView.post()
    -> kiểm tra user đã verified chưa
    -> kiểm tra đang có pending request chưa
    -> VerificationRequestSerializer validate dữ liệu/tài liệu
    -> tạo VerificationRequest status=PENDING
```

Admin duyệt:

```text
AdminDashboard
  -> GET /api/auth/admin/verification-requests/
  -> AdminVerificationRequestListView
  -> admin chọn accept/deny
  -> POST /api/auth/admin/verification-requests/<id>/decision/
    -> AdminVerificationDecisionView
      -> kiểm tra is_staff
      -> nếu accept:
        -> VerificationRequest.status = APPROVED
        -> agent.is_verified = True
      -> nếu deny:
        -> VerificationRequest.status = DENIED
        -> lưu denial_reason
        -> agent.is_verified = False nếu cần
```

Ý nghĩa:

- FE chỉ hiển thị form/nút.
- Backend mới là nơi quyết định user có được verified hay không.
- Agent profile gắn với user được dùng để hiển thị seller/agent công khai.

## 13. Flow appointment đặt lịch xem nhà

Người mua đặt lịch:

```text
PropertyDetail.tsx
  -> user nhập ngày, giờ, tên, số điện thoại, message
  -> POST /api/appointments/
  -> AppointmentListView.post()
    -> AppointmentSerializer validate
    -> AppointmentService.create_appointment(user, validated_data)
      -> gắn user hiện tại vào appointment
      -> AppointmentRepository.create_appointment()
    -> trả appointment vừa tạo
```

Người mua xem lịch của mình:

```text
Profile / appointments tab
  -> GET /api/appointments/
  -> AppointmentListView.get_queryset()
  -> AppointmentRepository.get_user_appointments(request.user)
```

Seller xem lịch trên nhà của mình:

```text
Profile seller appointments
  -> GET /api/appointments/owner/
  -> OwnerAppointmentListView
  -> AppointmentRepository.get_owner_appointments(request.user)
```

Seller đổi trạng thái:

```text
Seller bấm confirm/reject/complete
  -> PATCH /api/appointments/<id>/status/
  -> AppointmentStatusUpdateView
    -> AppointmentStatusUpdateSerializer validate status
    -> AppointmentService.update_status(user, appointment_id, new_status)
      -> lấy appointment
      -> nếu requester:
        -> chỉ được chuyển sang CANCELLED
      -> nếu property owner/admin:
        -> chỉ được đi theo transition hợp lệ
      -> save status
```

Luồng trạng thái:

```text
PENDING
  -> CONFIRMED
  -> COMPLETED

PENDING
  -> REJECTED

PENDING/CONFIRMED
  -> CANCELLED bởi requester
```

## 14. Flow agents

### 14.1. Trang chủ load trusted agents

```text
Index.tsx
  -> AgentTrust component
  -> getAgents({ page: 1, page_size: 4 })
  -> GET /api/agents/?page=1&page_size=4
  -> AgentListView
    -> AgentPageNumberPagination giới hạn max 20
    -> select_related user/profile
    -> prefetch visible properties
    -> AgentListSerializer
  -> FE render 4 cards
```

Trang chủ không tải hết agents. Nó chỉ xin 4 item.

### 14.2. Trang agents

```text
Agents.tsx
  -> getAgents({ page: 1, page_size: 20 })
  -> GET /api/agents/?page=1&page_size=20
  -> AgentListView
  -> trả tối đa 20 agents
```

Backend đang giới hạn `max_page_size=20` để payload nhẹ.

### 14.3. Agent detail

```text
User bấm agent
  -> /agents/:slug
  -> AgentDetail.tsx
  -> GET /api/agents/<slug>/
  -> AgentDetailView
    -> chỉ trả agent không phải staff/superuser
    -> chỉ trả user có profile_visible=True
    -> AgentDetailSerializer
      -> areas
      -> latest_activities nếu activity_visible=True
      -> thông tin liên hệ/profile
```

### 14.4. Rating/comment agent

```text
AgentDetail/Profile rating tab
  -> POST /api/agents/<slug>/reviews/
  -> AgentReviewListCreateView.create()
    -> get_agent()
    -> không cho user rate chính agent của mình
    -> AgentReviewSerializer validate rating/comment
    -> update_or_create review theo agent + reviewer
    -> AgentReview.save()
      -> agent.refresh_review_stats()
        -> tính average rating
        -> tính total_reviews
```

Điểm hay của flow này:

- Một user chỉ có một review cho một agent.
- Nếu review lại, backend update review cũ thay vì tạo trùng.
- Rating trung bình được refresh ở model.

## 15. Flow prediction Linear Regression

Prediction là module riêng trong backend, không phụ thuộc route property.

```text
PricePrediction.tsx
  -> user nhập tỉnh, quận, loại nhà, diện tích, tầng, phòng, tọa độ...
  -> POST /api/prediction/
  -> PricePredictionView.post()
    -> PricePredictionInputSerializer validate input
    -> PredictionService.predict_price(validated_data)
      -> normalize province/district/ward/property type
      -> kiểm tra area > 0
      -> kiểm tra tọa độ nằm trong Việt Nam
      -> load model lazy từ BE/ml_models/vietnam.pkl
      -> đọc feature order từ model hoặc vietnam_metadata.json
      -> tạo pandas DataFrame đúng schema
      -> pipeline.predict(input_data)
      -> hiệu chỉnh theo regional multiplier
      -> tính price_min/price_max/price_per_m2/confidence
    -> Response JSON
  -> FE hiển thị kết quả dự đoán
```

Model runtime nằm ở:

```text
BE/ml_models/
  -> vietnam.pkl
  -> vietnam_metadata.json
  -> lr_pipeline_metrics.json
```

`LinearRegressionModel/` là workspace huấn luyện/dữ liệu. Khi chạy web, backend dùng model đã copy vào `BE/ml_models`, nên nếu tách repo BE thì phải mang theo folder này.

Vì đề tài là Linear Regression:

- Dự án dùng pipeline linear regression đã train sẵn.
- Input được đưa về đúng feature schema.
- Response trả khoảng giá chứ không chỉ một số duy nhất để UI dễ giải thích.

## 16. Flow news

Danh sách tin:

```text
News.tsx
  -> GET /api/news/
  -> NewsListView
    -> NewsRepository.get_actor_scope(user)
    -> NewsPagination page_size=10
    -> NewsSerializer
```

Chi tiết tin:

```text
NewsDetail.tsx
  -> GET /api/news/<id>/
  -> NewsDetailView.get_object()
    -> nếu GET thì NewsService.increment_view_count()
    -> refresh views_count
    -> trả NewsSerializer
```

Admin/staff tạo tin:

```text
AdminDashboard / News form
  -> POST /api/news/
  -> IsStaffOrReadOnly kiểm tra staff
  -> NewsSerializer validate
  -> NewsService.create_news(user, validated_data)
```

## 17. Flow upload file và Supabase Storage

Upload file xuất hiện ở:

- Avatar/profile.
- Property images.
- Verification documents.
- News images nếu dùng bucket news/property-images.

Flow tổng quát:

```text
FE gửi multipart/form-data
  -> Axios không ép JSON cho request file
  -> Django parser MultiPartParser/FormParser
  -> Serializer/Service validate file
  -> Model ImageField/FileField nhận file
  -> Storage backend hoặc helper Supabase xử lý lưu
  -> Database lưu path/key
  -> Serializer trả URL đã build
```

Các biến môi trường liên quan:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_AVATARS_BUCKET`
- `SUPABASE_PROPERTY_IMAGES_BUCKET`
- `SUPABASE_VERIFICATION_DOCS_BUCKET`
- `SUPABASE_NEWS_BUCKET`
- `SUPABASE_SIGNED_URL_EXPIRES_IN`

Điểm cần trình bày:

- Database và storage là hai thứ khác nhau.
- Database lưu metadata/path.
- Storage lưu file thật.
- Backend build URL cho FE hiển thị.

## 18. Flow database Supabase PostgreSQL

Khi backend cần dữ liệu:

```text
Repository/Model
  -> Django ORM
    -> DATABASES trong settings.py
      -> HSW_DATABASE_URL hoặc HSW_DB_*
        -> Supabase PostgreSQL
```

Ví dụ query:

```python
Property.objects.filter(is_active=True)
```

Django ORM chuyển thành SQL tương đương:

```sql
SELECT ...
FROM properties_property
WHERE is_active = true;
```

Nếu dùng `select_related`:

```python
Property.objects.select_related("owner", "owner__profile")
```

Django dùng SQL join để lấy owner/profile trong cùng query.

Nếu dùng `prefetch_related`:

```python
Property.objects.prefetch_related("images")
```

Django query property trước, query images sau, rồi ghép trong Python. Cách này hợp cho quan hệ one-to-many như property có nhiều ảnh.

## 19. Flow lỗi và validate

Lỗi được xử lý ở nhiều lớp:

```text
FE form validation nhẹ
  -> BE serializer validation
    -> Service validation nghiệp vụ
      -> Permission validation
        -> Database constraint
```

Ví dụ upload ảnh:

- FE có thể giới hạn file.
- Backend vẫn kiểm tra file thật.
- Service kiểm tra số lượng, dung lượng, content type.
- Nếu sai, backend trả `400 Bad Request`.
- FE hiển thị toast/error.

Ví dụ sửa property:

- FE ẩn nút edit nếu không phải owner.
- Backend vẫn kiểm tra `property_obj.owner != user`.
- Nếu cố gọi API bằng tool bên ngoài, backend trả `403 Permission Denied`.

## 20. Flow production

Khi lên production:

```text
User
  -> Vercel frontend domain
    -> React static bundle
      -> gọi VITE_API_BASE_URL
        -> Render backend domain
          -> Django app
            -> Supabase PostgreSQL
            -> Supabase Storage
```

Các biến môi trường cần đúng:

Frontend:

- `VITE_API_BASE_URL=https://backend-domain`

Backend:

- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_BASE_URL`
- `HSW_DB_*` hoặc `HSW_DATABASE_URL`
- `SUPABASE_*`
- `EMAIL_*` nếu dùng forgot password thật

Nếu CORS sai:

```text
Browser chặn request
  -> FE báo fail dù backend có thể vẫn chạy
```

Nếu `VITE_API_BASE_URL` sai:

```text
FE gọi nhầm local/old backend
  -> login/register/listings fail hoặc data không đúng
```

Nếu `DJANGO_ALLOWED_HOSTS` sai:

```text
Django trả DisallowedHost
```

## 21. Tóm tắt flow theo từng module

### Accounts

```text
FE auth/profile pages
  -> authApi/verificationApi
  -> accounts.urls
  -> accounts.views
  -> serializers validate
  -> AuthService hoặc view logic
  -> User/UserProfile/VerificationRequest/Agent
  -> JWT/email/storage nếu cần
```

### Properties

```text
FE listings/property/add/manage
  -> propertiesApi
  -> properties.views
  -> PropertyFilter/pagination/search/order
  -> PropertyService
  -> PropertyRepository
  -> Property/PropertyImage/Favorite
```

### Appointments

```text
FE property detail/profile appointment tab
  -> appointmentsApi
  -> appointments.views
  -> AppointmentSerializer
  -> AppointmentService state transition
  -> AppointmentRepository
  -> Appointment model
```

### Agents

```text
FE AgentTrust/Agents/AgentDetail/Profile ratings
  -> agentsApi
  -> agents.views
  -> pagination/search
  -> AgentListSerializer/AgentDetailSerializer/AgentReviewSerializer
  -> Agent/AgentReview model
```

### News

```text
FE News/AdminDashboard
  -> newsApi
  -> news.views
  -> NewsService
  -> NewsRepository
  -> News model
```

### Prediction

```text
FE PricePrediction
  -> prediction API
  -> PricePredictionView
  -> PricePredictionInputSerializer
  -> PredictionService
  -> BE/ml_models/vietnam.pkl
  -> JSON estimated_price/price_min/price_max
```

## 22. Vì sao dự án chia lớp như vậy

Dự án không gom hết vào một file vì sẽ khó bảo trì.

Cách chia hiện tại có ý nghĩa:

- `pages`: người dùng nhìn thấy gì.
- `components`: UI dùng lại.
- `lib`: FE gọi API thế nào.
- `contexts`: state toàn app.
- `views`: backend nhận request.
- `serializers`: contract input/output.
- `services`: nghiệp vụ.
- `repositories`: query database.
- `models`: cấu trúc dữ liệu.
- `settings`: cấu hình môi trường.

Khi có bug, bạn lần theo flow:

```text
UI sai?
  -> kiểm tra page/component

API gọi sai URL/payload?
  -> kiểm tra lib/*Api.ts và network tab

Backend trả lỗi?
  -> kiểm tra views/serializers/services

Data sai?
  -> kiểm tra repositories/models/database

Ảnh không hiện?
  -> kiểm tra storage/helper URL/env bucket

Prediction sai?
  -> kiểm tra serializer input, PredictionService, model metadata, dữ liệu huấn luyện
```

## 23. Cách trình bày trong buổi bảo vệ

Có thể trình bày theo thứ tự:

1. Dự án là web bất động sản full-stack, FE React, BE Django REST Framework.
2. Người dùng thao tác trên React page, React gọi API qua Axios client.
3. Axios tự gắn JWT và tự refresh token khi access token hết hạn.
4. Django nhận request qua `core/urls.py`, route vào từng app.
5. View kiểm tra quyền và nhận request.
6. Serializer validate dữ liệu và định dạng response.
7. Service xử lý nghiệp vụ như favorite, appointment status, upload ảnh.
8. Repository gom query database và tối ưu bằng `select_related`, `prefetch_related`, pagination.
9. Model ánh xạ bảng database PostgreSQL Supabase.
10. File upload đi qua media/Supabase Storage.
11. Prediction đi qua `PredictionService`, load Linear Regression model trong `BE/ml_models`.
12. Response JSON quay về frontend, page cập nhật state và render UI.

Một câu kết luận tốt:

> Điểm chính của dự án là em tách rõ giao diện, API contract, nghiệp vụ và truy vấn database. Vì vậy khi sửa một tính năng như favorite hoặc appointment, em biết chính xác phần nào xử lý UI, phần nào validate, phần nào kiểm tra quyền và phần nào ghi database.
