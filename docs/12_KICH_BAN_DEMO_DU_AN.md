# Kịch bản demo HouseSellWeb

Tài liệu này là kịch bản để demo dự án mượt, có thứ tự, có lời nói mẫu và có checklist trước khi trình bày. Bạn có thể dùng trực tiếp khi bảo vệ hoặc quay video demo.

## 1. Mục tiêu khi demo

Khi demo, đừng chỉ bấm chức năng. Cần cho người nghe thấy 3 ý:

1. Dự án giải quyết bài toán bất động sản thật: tìm nhà, đăng nhà, đặt lịch, lưu yêu thích, agent/rating, dự đoán giá.
2. Hệ thống có phân quyền rõ: khách, buyer, seller đã xác minh, admin.
3. Code có kiến trúc rõ: React frontend gọi Django REST API, backend xử lý qua serializer/service/repository/model, dữ liệu lưu Supabase PostgreSQL, ảnh lưu storage, prediction dùng Linear Regression.

## 2. Chuẩn bị trước khi demo

### 2.1. Chạy backend

```powershell
cd BE
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Kiểm tra nhanh:

```text
http://127.0.0.1:8000/swagger/
```

Nếu Swagger mở được hoặc API trả response là backend ổn.

### 2.2. Chạy frontend

```powershell
cd FE
npm install
npm run dev -- --host 127.0.0.1 --port 8080
```

Mở:

```text
http://127.0.0.1:8080
```

### 2.3. Kiểm tra file `.env`

Backend cần có `BE/.env`, frontend cần có `FE/.env`.

Frontend local nên có:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Backend cần trỏ đúng Supabase/database nếu muốn có data thật. Nếu máy khác chạy mà không có data, thường là do `BE/.env` chưa trỏ tới Supabase DB.

### 2.4. Chuẩn bị tài khoản demo

Điền trước vào bảng này, không commit mật khẩu thật lên Git:

| Vai trò | Username | Password | Dùng để demo |
| --- | --- | --- | --- |
| Buyer | `<buyer_username>` | `<buyer_password>` | Login, favorite, đặt lịch, rating agent |
| Seller verified | `<seller_username>` | `<seller_password>` | Đăng nhà, quản lý nhà, xem appointment |
| Admin | `<admin_username>` | `<admin_password>` | Duyệt seller, quản lý admin dashboard |

Nếu chưa có tài khoản admin local:

```powershell
cd BE
python manage.py createsuperuser
```

## 3. Cấu trúc demo đề xuất

Nếu có ít thời gian, demo trong 8-10 phút:

1. Giới thiệu tổng quan.
2. Trang chủ.
3. Listings/filter/search.
4. Property detail + favorite + appointment.
5. Login/profile.
6. Seller flow.
7. Agent/rating.
8. Prediction Linear Regression.
9. Admin/verification.
10. Kết luận kiến trúc.

Nếu có 15-20 phút, đi sâu thêm:

1. Mở Swagger API.
2. Chỉ ra Supabase/database.
3. Nói về Service/Repository/Serializer.
4. Nói về model trong `BE/ml_models`.
5. Nói về tối ưu load/pagination.

## 4. Lời mở đầu

Bạn có thể nói:

> Em xin demo dự án HouseSellWeb. Đây là website bất động sản full-stack, gồm frontend React và backend Django REST Framework. Người dùng có thể xem nhà bán hoặc cho thuê, lọc theo địa điểm/giá/loại nhà, lưu yêu thích, đặt lịch xem nhà, seller có thể đăng và quản lý bất động sản, agent có profile và rating/comment. Ngoài ra hệ thống có chức năng dự đoán giá nhà bằng mô hình Linear Regression. Dữ liệu được lưu ở PostgreSQL trên Supabase, file upload lưu qua storage, còn backend là lớp xử lý API, phân quyền và nghiệp vụ.

Sau đó nói tiếp:

> Khi demo, em sẽ đi theo flow người dùng thật trước, sau đó em giải thích nhanh kiến trúc phía sau từng chức năng.

## 5. Demo trang chủ

### Thao tác

1. Mở `http://127.0.0.1:8080`.
2. Chỉ vào header: Explore, Agents, News, Listings, Buy, Rent, Prediction, Sell Property, Profile.
3. Kéo xuống Featured Listings.
4. Kéo xuống Trusted Agents.
5. Chỉ phần Explore/Location nếu có.

### Lời nói mẫu

> Đây là trang chủ của hệ thống. Header chia các flow chính: xem bất động sản, khám phá theo tỉnh thành, xem agent, đọc tin tức, dự đoán giá và seller đăng nhà. Trang chủ chỉ hiển thị dữ liệu nổi bật, ví dụ featured listings và trusted agents, để người dùng vào nhanh các nội dung quan trọng.

Nói thêm về kỹ thuật:

> Phần Trusted Agents ở trang chủ không tải toàn bộ danh sách agent. Frontend gọi API với `page_size=4`, backend cũng giới hạn payload agents tối đa 20 để giảm tải tài nguyên.

## 6. Demo Explore Vietnam

### Thao tác

1. Bấm `Explore`.
2. Chỉ hero nền văn hóa Việt Nam.
3. Bấm một tỉnh, ví dụ Hà Nội/Hồ Chí Minh/Đà Nẵng.
4. Bấm một quận/huyện trong card tỉnh.

### Lời nói mẫu

> Trang Explore giúp người dùng duyệt bất động sản theo tỉnh thành Việt Nam. Mỗi tỉnh có danh sách quận/huyện lấy từ dữ liệu hành chính, khi bấm tỉnh hoặc quận thì hệ thống chuyển sang trang listings với query params tương ứng.

Nói kỹ thuật:

> Frontend dùng dữ liệu tỉnh/thành trong `FE/src/data`, sau đó điều hướng sang `/listings?province=...&location=...`. Trang Listings đọc query params này để gọi API lọc property.

## 7. Demo Listings, Buy, Rent và bộ lọc

### Thao tác

1. Bấm `Listings`.
2. Chọn listing type hoặc bấm `Buy`, `Rent`.
3. Search theo tên/địa điểm.
4. Chọn tỉnh, quận, khoảng giá.
5. Bỏ chọn filter để cho thấy list reset lại đúng.
6. Chọn sort nếu có.

### Lời nói mẫu

> Đây là trang danh sách bất động sản. Người dùng có thể lọc theo loại giao dịch bán/cho thuê, tỉnh thành, quận/huyện, khoảng giá, loại nhà và từ khóa. Các filter không xử lý bằng cách tải toàn bộ dữ liệu về frontend, mà được gửi thành query params tới backend để database lọc.

Flow kỹ thuật:

```text
Listings.tsx
  -> propertiesApi.getProperties(filters)
  -> GET /api/properties/?...
  -> PropertyListCreateView
  -> PropertyFilter/Search/Ordering
  -> PropertyRepository.get_available()
  -> PropertyListSerializer
  -> JSON trả về FE
```

Nói thêm:

> Backend dùng `select_related` để lấy owner/profile/agent và `prefetch_related` để lấy ảnh, tránh query lặp lại từng card.

## 8. Demo chi tiết property

### Thao tác

1. Bấm vào một card nhà.
2. Chỉ ảnh, giá, diện tích, phòng ngủ, địa chỉ.
3. Chỉ thông tin seller/agent.
4. Bấm favorite nếu đã login.
5. Bấm đặt lịch xem nhà.

### Lời nói mẫu

> Trang chi tiết property hiển thị thông tin đầy đủ hơn so với card ở danh sách: ảnh, giá, diện tích, tiện ích, địa chỉ, thông tin người bán và lịch rảnh xem nhà. Khi người dùng mở detail, backend cũng tăng `views_count` để ghi nhận lượt xem.

Flow kỹ thuật:

```text
PropertyDetail.tsx
  -> GET /api/properties/<id>/
  -> PropertyDetailView.retrieve()
  -> PropertyService.track_view()
  -> PropertyRepository.increment_view()
  -> PropertyDetailSerializer
```

## 9. Demo đăng nhập

### Thao tác

1. Bấm `Login`.
2. Đăng nhập bằng buyer.
3. Sau login, vào `Profile`.
4. Chỉ thông tin profile, favorite, appointments, ratings nếu có.

### Lời nói mẫu

> Hệ thống dùng JWT để đăng nhập. Khi login thành công, backend trả access token và refresh token. Frontend lưu token trong localStorage. Mỗi request sau đó Axios tự gắn `Authorization: Bearer token`.

Flow kỹ thuật:

```text
Login.tsx
  -> AuthContext.login()
  -> POST /api/auth/login/
  -> LoginView
  -> AuthService.login()
  -> trả JWT
  -> getMe()
  -> setUser(profile)
```

Nói thêm:

> Nếu access token hết hạn, Axios interceptor tự gọi endpoint refresh token. Nếu refresh cũng lỗi thì hệ thống clear token và chuyển người dùng về trang login.

## 10. Demo favorite

### Thao tác

1. Đăng nhập buyer.
2. Mở một property detail.
3. Bấm icon tim.
4. Vào Profile, tab Favorites để thấy property đã lưu.
5. Bấm lại icon tim để bỏ lưu nếu muốn.

### Lời nói mẫu

> Chức năng favorite cho phép buyer lưu lại các bất động sản quan tâm. Backend không chỉ đổi UI mà tạo hoặc xóa record trong bảng Favorite, nên người dùng đăng nhập lại vẫn thấy danh sách yêu thích.

Flow kỹ thuật:

```text
POST /api/properties/<id>/favorite/
  -> FavoriteToggleView
  -> PropertyService.toggle_favorite()
  -> PropertyRepository.get_or_create_favorite()
  -> nếu đã có thì delete
```

## 11. Demo đặt lịch xem nhà

### Thao tác

1. Đăng nhập buyer.
2. Mở property detail.
3. Nhập ngày/giờ, tên, số điện thoại, message.
4. Submit appointment.
5. Vào Profile xem lịch hẹn vừa tạo.

### Lời nói mẫu

> Buyer có thể đặt lịch xem nhà trực tiếp ở trang chi tiết. Appointment được lưu vào database và gắn với property, buyer và seller sở hữu property đó.

Flow kỹ thuật:

```text
PropertyDetail.tsx
  -> POST /api/appointments/
  -> AppointmentListView
  -> AppointmentSerializer validate
  -> AppointmentService.create_appointment()
  -> AppointmentRepository.create_appointment()
```

## 12. Demo seller quản lý nhà

### Thao tác

1. Logout buyer.
2. Login seller verified.
3. Vào Profile.
4. Mở tab property/listings của seller.
5. Bấm quản lý một nhà.
6. Sửa thông tin hoặc đổi trạng thái `active/sold/rented/inactive`.
7. Nếu cần, bấm `Sell Property` để vào form đăng nhà.

### Lời nói mẫu

> Với seller đã được xác minh, hệ thống cho phép đăng bất động sản mới và quản lý các bất động sản của chính mình. Seller có thể chỉnh sửa thông tin, upload ảnh, xóa nhà hoặc chuyển trạng thái như đã bán/đã cho thuê.

Flow kỹ thuật:

```text
ManageProperty.tsx
  -> PATCH /api/properties/<id>/
  -> PropertyDetailView.update()
  -> PropertyCreateUpdateSerializer validate
  -> PropertyService.update_property()
  -> kiểm tra owner hoặc staff
  -> PropertyRepository.save()
```

Nhấn mạnh:

> Frontend có `ProtectedRoute requireVerifiedSeller` để chặn UI, nhưng backend vẫn kiểm tra quyền owner. Người dùng không thể sửa property của người khác chỉ bằng cách gọi API thủ công.

## 13. Demo seller xem appointment và đổi trạng thái

### Thao tác

1. Login seller.
2. Vào Profile phần appointments liên quan property của mình.
3. Chọn appointment.
4. Confirm/reject/complete nếu có trạng thái phù hợp.

### Lời nói mẫu

> Seller có thể xem các lịch hẹn trên bất động sản mình sở hữu và chuyển trạng thái lịch hẹn. Luồng trạng thái được backend kiểm soát để tránh chuyển sai logic.

Flow trạng thái:

```text
PENDING -> CONFIRMED -> COMPLETED
PENDING -> REJECTED
PENDING/CONFIRMED -> CANCELLED bởi buyer
```

Flow kỹ thuật:

```text
PATCH /api/appointments/<id>/status/
  -> AppointmentStatusUpdateView
  -> AppointmentStatusUpdateSerializer
  -> AppointmentService.update_status()
  -> kiểm tra requester/owner/admin
  -> kiểm tra transition hợp lệ
```

## 14. Demo agent và rating/comment

### Thao tác

1. Bấm `Agents`.
2. Mở một agent/seller profile.
3. Chỉ thông tin agent, rating, khu vực hoạt động, latest activity.
4. Login buyer nếu chưa login.
5. Để lại rating/comment.
6. Vào Profile của seller xem tab ratings nếu cần.

### Lời nói mẫu

> Mỗi seller/agent có profile công khai để buyer xem thông tin, khu vực hoạt động, rating và comment. Người dùng có thể đánh giá agent, nhưng backend không cho tự đánh giá chính mình.

Flow kỹ thuật:

```text
POST /api/agents/<slug>/reviews/
  -> AgentReviewListCreateView.create()
  -> kiểm tra không phải own profile
  -> AgentReviewSerializer validate rating/comment
  -> update_or_create review
  -> Agent.refresh_review_stats()
```

Nói thêm:

> Một buyer chỉ có một review cho một agent. Nếu review lại, backend update review cũ thay vì tạo trùng.

## 15. Demo Prediction Linear Regression

### Thao tác

1. Bấm `Prediction`.
2. Nhập thông tin nhà:
   - Tỉnh/thành: Hà Nội hoặc Hồ Chí Minh.
   - Quận/huyện.
   - Loại nhà.
   - Diện tích.
   - Số tầng, phòng ngủ, phòng tắm.
   - Tọa độ.
3. Bấm predict.
4. Chỉ estimated price, min/max, price per m2, confidence.
5. Thử đổi tỉnh sang Quảng Nam/Quảng Ngãi/Đà Nẵng để nói về hiệu chỉnh vùng.

### Lời nói mẫu

> Đây là chức năng dự đoán giá nhà bằng Linear Regression. Người dùng nhập thông tin bất động sản, frontend gửi dữ liệu sang backend. Backend validate input, chuẩn hóa feature, load model đã train trong `BE/ml_models`, tạo DataFrame đúng schema rồi gọi `pipeline.predict`.

Flow kỹ thuật:

```text
PricePrediction.tsx
  -> POST /api/prediction/
  -> PricePredictionView
  -> PricePredictionInputSerializer
  -> PredictionService.predict_price()
  -> load BE/ml_models/vietnam.pkl
  -> tạo pandas DataFrame
  -> Linear Regression pipeline predict
  -> trả estimated_price, price_min, price_max
```

Nhấn mạnh đề tài:

> Model của em là Linear Regression, không phải non-linear model. Folder `LinearRegressionModel` dùng để xử lý data/train, còn production backend dùng model đã đóng gói trong `BE/ml_models`.

## 16. Demo News

### Thao tác

1. Bấm `News`.
2. Mở một bài viết.
3. Chỉ lượt xem nếu có.
4. Nếu admin, vào dashboard tạo/sửa bài viết.

### Lời nói mẫu

> News là module tin tức thị trường bất động sản. Người dùng thường chỉ đọc, còn staff/admin mới được tạo hoặc chỉnh sửa bài viết.

Flow kỹ thuật:

```text
GET /api/news/
  -> NewsListView
  -> NewsRepository.get_actor_scope()
  -> NewsPagination

GET /api/news/<id>/
  -> NewsDetailView.get_object()
  -> NewsService.increment_view_count()
```

## 17. Demo admin dashboard

### Thao tác

1. Logout seller/buyer.
2. Login admin.
3. Vào `Admin`.
4. Mở tab verification requests.
5. Duyệt hoặc từ chối seller request nếu có.
6. Chỉ chức năng quản lý agent/news nếu có.

### Lời nói mẫu

> Admin có quyền duyệt yêu cầu xác minh seller. Khi admin accept, hệ thống cập nhật verification request thành approved và đánh dấu agent của user đó là verified. Khi deny, hệ thống lưu lý do từ chối.

Flow kỹ thuật:

```text
AdminDashboard
  -> GET /api/auth/admin/verification-requests/
  -> AdminVerificationRequestListView
  -> POST /api/auth/admin/verification-requests/<id>/decision/
  -> AdminVerificationDecisionView
  -> kiểm tra user.is_staff
  -> update VerificationRequest và Agent.is_verified
```

Nhấn mạnh:

> Admin route ở frontend chỉ để điều hướng, còn backend vẫn kiểm tra `is_staff`. Nếu không phải admin mà gọi API admin thì backend trả 403.

## 18. Demo Swagger/API

Nếu hội đồng hỏi backend hoặc API:

### Thao tác

1. Mở `http://127.0.0.1:8000/swagger/`.
2. Chỉ các nhóm endpoint:
   - `/api/auth/`
   - `/api/properties/`
   - `/api/appointments/`
   - `/api/agents/`
   - `/api/news/`
   - `/api/prediction/`

### Lời nói mẫu

> Đây là Swagger API docs của backend Django REST Framework. Frontend không truy cập database trực tiếp mà gọi các endpoint này. Mỗi endpoint được map từ `core/urls.py` sang từng app như properties, appointments, agents, prediction.

## 19. Đoạn giải thích kiến trúc sau demo

Bạn có thể nói đoạn này ở cuối:

> Về kiến trúc, dự án được chia thành frontend và backend. Frontend React chịu trách nhiệm route, UI, form, state và gọi API. Backend Django REST Framework chịu trách nhiệm authentication, permission, validation và business logic. Trong backend, em tách các lớp theo hướng: View nhận request, Serializer validate input/output, Service xử lý nghiệp vụ, Repository gom query database, Model ánh xạ bảng PostgreSQL. Nhờ vậy mỗi phần có trách nhiệm riêng, dễ debug và mở rộng.

Nói tiếp:

> Database dùng Supabase PostgreSQL. File upload như ảnh property, avatar, verification docs dùng storage/media helper. Prediction dùng Linear Regression model đã train sẵn và đặt trong `BE/ml_models`, backend load lazy khi có request dự đoán.

## 20. Câu kết luận

Bạn có thể kết bằng:

> Tóm lại, HouseSellWeb không chỉ là giao diện xem nhà, mà là một hệ thống bất động sản có đầy đủ các flow chính: buyer tìm và lưu nhà, đặt lịch xem nhà; seller đăng và quản lý bất động sản; admin duyệt seller; agent có rating/comment; và hệ thống hỗ trợ dự đoán giá bằng Linear Regression. Em cũng tách kiến trúc rõ giữa frontend, backend, database, storage và model để dự án có thể triển khai và bảo trì được.

## 21. Checklist trước khi bấm demo thật

Trước demo 15 phút:

- Backend đang chạy ở `http://127.0.0.1:8000`.
- Frontend đang chạy ở `http://127.0.0.1:8080`.
- `FE/.env` trỏ đúng `VITE_API_BASE_URL`.
- `BE/.env` trỏ đúng database có data.
- Đăng nhập thử buyer thành công.
- Đăng nhập thử seller verified thành công.
- Đăng nhập thử admin thành công.
- Mở `/listings` có data.
- Mở `/agents` có data.
- Mở `/prediction` predict được.
- Mở `/swagger/` được nếu cần nói API.
- Tắt những tab/thứ không cần thiết.
- Không để lộ file `.env`, password hoặc secret trên màn hình.

## 22. Nếu demo bị lỗi thì nói gì

### Login/register fail

Nói:

> Phần này thường do frontend đang trỏ sai backend hoặc backend chưa kết nối đúng database. Em sẽ kiểm tra `VITE_API_BASE_URL` và `.env` backend.

Kiểm tra nhanh:

- `FE/.env`
- backend terminal có lỗi không
- `http://127.0.0.1:8000/swagger/`

### Không có data

Nói:

> Data không nằm trong repo mà nằm trong database. Nếu máy khác chạy local không có data thì cần trỏ backend tới cùng Supabase PostgreSQL hoặc chạy seed/import data.

### Ảnh không hiện

Nói:

> Ảnh được lưu qua media/storage, database chỉ lưu path. Nếu ảnh không hiện cần kiểm tra bucket/storage URL hoặc media settings.

### Prediction lỗi

Nói:

> Prediction phụ thuộc file model trong `BE/ml_models`. Nếu thiếu `vietnam.pkl` hoặc metadata thì backend không load được model.

## 23. Bản demo cực ngắn trong 3 phút

Nếu bị giới hạn thời gian, dùng flow này:

1. Trang chủ:
   > Đây là web bất động sản full-stack React + Django.
2. Listings:
   > Người dùng lọc nhà theo giá, địa điểm, loại giao dịch.
3. Detail:
   > Xem chi tiết, favorite, đặt lịch.
4. Profile:
   > Người dùng xem favorite, appointments, thông tin cá nhân.
5. Seller:
   > Seller verified đăng và quản lý nhà.
6. Agents:
   > Agent có profile, rating và comment.
7. Prediction:
   > Backend dùng Linear Regression để dự đoán giá.
8. Kết kiến trúc:
   > Frontend gọi API, backend qua View/Serializer/Service/Repository/Model, dữ liệu ở Supabase, model ở `BE/ml_models`.

## 24. Bản demo tiêu chuẩn trong 10 phút

```text
00:00 - 00:45  Giới thiệu bài toán và kiến trúc
00:45 - 01:30  Trang chủ
01:30 - 02:30  Explore + Listings filter
02:30 - 03:30  Property detail + favorite
03:30 - 04:30  Appointment
04:30 - 05:45  Seller profile + manage property
05:45 - 06:45  Agents + rating/comment
06:45 - 08:00  Prediction Linear Regression
08:00 - 09:00  Admin verification
09:00 - 10:00  Swagger/kiến trúc/kết luận
```

## 25. Những câu hỏi dễ bị hỏi và cách trả lời

### Vì sao dùng Django REST Framework?

> Vì Django REST Framework hỗ trợ xây API nhanh, có serializer để validate dữ liệu, permission để phân quyền, authentication JWT và dễ tách module theo app như accounts, properties, appointments, agents.

### Frontend có truy cập database không?

> Không. Frontend chỉ gọi API qua Axios. Database chỉ được truy cập từ backend Django.

### Repository-Service-Serializer khác nhau thế nào?

> Serializer validate input và format output. Service xử lý nghiệp vụ như favorite, appointment status, upload ảnh. Repository gom query database và tối ưu query. View là lớp nhận request và điều phối các lớp đó.

### Data nằm ở đâu?

> Data nằm trong PostgreSQL trên Supabase hoặc database local tùy `.env`. Repo chỉ chứa code, không chứa data thật.

### Model prediction nằm ở đâu?

> Model runtime nằm trong `BE/ml_models`. Folder `LinearRegressionModel` dùng để train/xử lý data, còn backend production dùng file model đã train sẵn.

### Có phân quyền không?

> Có. Frontend có `ProtectedRoute` và `AdminRoute` để chặn UI. Backend kiểm tra lại bằng permission, `request.user`, owner check và `is_staff`, nên không phụ thuộc vào frontend.

### Tối ưu load như thế nào?

> Backend dùng pagination, `select_related`, `prefetch_related`, filter/search ở database. Ví dụ agents ở trang chủ chỉ load 4 item, endpoint agents giới hạn payload tối đa 20.
