# Hướng dẫn nhập môn cho người mới

Tài liệu này viết cho người chưa biết Django, chưa quen React, chưa hiểu API, cũng chưa biết vì sao dự án lại chia nhiều thư mục như vậy. Đọc xong file này, bạn có thể mở code và biết nên nhìn vào đâu trước, từng phần làm gì, request chạy qua những lớp nào, và có thể trình bày tương đối lưu loát về dự án.

## 1. Dự án này là gì?

HouseSellWeb là một website bất động sản. Người dùng có thể:

- Xem danh sách nhà bán hoặc cho thuê.
- Tìm kiếm và lọc nhà theo tỉnh/thành, quận/huyện, giá, loại bất động sản, số phòng ngủ.
- Xem chi tiết một căn nhà.
- Lưu nhà vào danh sách yêu thích.
- Đặt lịch xem nhà.
- Đăng ký, đăng nhập, cập nhật hồ sơ.
- Seller đăng nhà và quản lý trạng thái nhà: đang bán, tạm ẩn, đã bán, đã cho thuê.
- Xem danh sách agent/seller.
- Đánh giá agent bằng rating và comment.
- Đọc tin tức.
- Dự đoán giá nhà bằng mô hình Linear Regression.

Dự án được chia làm 2 phần lớn:

```text
FE/  = Frontend, phần giao diện người dùng nhìn thấy trong trình duyệt.
BE/  = Backend, phần API xử lý nghiệp vụ, database, phân quyền và prediction.
```

Ngoài ra còn có:

```text
BE/ml_models/           Model Linear Regression đang dùng khi chạy backend.
LinearRegressionModel/  Nơi lưu dữ liệu/training workspace, không bắt buộc khi chạy web.
supabase/               Cấu hình Supabase CLI/local.
docs/                   Tài liệu bàn giao.
```

## 2. Frontend, backend, database là gì?

Hãy tưởng tượng website là một nhà hàng:

- Frontend là khu vực khách nhìn thấy: menu, bàn ghế, nút bấm, form nhập liệu.
- Backend là bếp và quầy xử lý: nhận yêu cầu, kiểm tra quyền, xử lý logic, trả kết quả.
- Database là kho lưu trữ: người dùng, nhà, lịch hẹn, tin tức, rating.

Khi user mở trang `/listings`, quy trình cơ bản là:

```text
Trình duyệt
  -> React frontend render trang Listings
  -> Frontend gọi API Django: GET /api/properties/
  -> Django kiểm tra filter, query database
  -> Database trả dữ liệu property
  -> Django biến dữ liệu thành JSON
  -> React nhận JSON và hiển thị card nhà
```

## 3. API là gì?

API là cách frontend nói chuyện với backend. Frontend không đọc database trực tiếp. Frontend gửi request HTTP đến backend.

Ví dụ:

```text
GET /api/properties/
```

Câu này nghĩa là: "Backend ơi, trả cho tôi danh sách bất động sản".

Ví dụ khác:

```text
POST /api/properties/42/favorite/
```

Câu này nghĩa là: "Backend ơi, user hiện tại muốn yêu thích hoặc bỏ yêu thích property số 42".

Backend sẽ kiểm tra:

- User đã đăng nhập chưa?
- Property có tồn tại không?
- User có quyền làm việc này không?
- Dữ liệu gửi lên có hợp lệ không?

Sau đó backend trả JSON về cho frontend.

## 4. Django là gì?

Django là framework Python để xây dựng backend web. Trong dự án này Django làm các việc:

- Định nghĩa database bằng `models.py`.
- Tạo API bằng Django REST Framework.
- Quản lý đăng nhập, user, admin.
- Kết nối database Supabase PostgreSQL.
- Validate dữ liệu gửi từ frontend.
- Kiểm tra phân quyền.
- Xử lý upload file.
- Gọi model Linear Regression để dự đoán giá.

## 5. Django REST Framework là gì?

Django bình thường mạnh về web truyền thống. Django REST Framework, viết tắt là DRF, giúp Django làm API dễ hơn.

DRF cung cấp các khái niệm quan trọng:

- Serializer: validate input và biến model thành JSON.
- View/APIView/ListAPIView: nhận request và trả response.
- Permission: kiểm tra quyền.
- Pagination: phân trang dữ liệu.
- Filter/Search/Ordering: lọc, tìm kiếm, sắp xếp.

Trong dự án này, frontend React cần JSON, nên backend dùng DRF.

## 6. Một request Django chạy qua những file nào?

Ví dụ user mở danh sách nhà:

```text
GET /api/properties/?listing_type=sale&page=1&page_size=30
```

Request này đi qua:

```text
BE/core/urls.py
  -> include("properties.urls")

BE/properties/urls.py
  -> PropertyListCreateView

BE/properties/views.py
  -> nhận request, chọn serializer, gọi queryset

BE/properties/filters.py
  -> đọc query params như listing_type, city, district, price

BE/properties/repositories.py
  -> query database, select_related, prefetch_related, annotate favorite

BE/properties/serializers.py
  -> biến Property object thành JSON frontend cần

Response JSON
  -> FE/src/pages/Listings.tsx render giao diện
```

Khi thuyết trình, có thể nói:

> Một request listing sẽ đi từ `core/urls.py` vào `properties/urls.py`, sau đó vào view. View dùng filter để xử lý query params, repository để query database tối ưu, serializer để format JSON, rồi frontend nhận JSON để render danh sách.

## 7. Vì sao backend chia nhiều app?

Trong Django, một "app" là một module nghiệp vụ. Dự án chia như sau:

```text
accounts      Quản lý user, profile, xác minh seller.
properties    Quản lý bất động sản, ảnh, favorite, trạng thái nhà.
appointments  Quản lý lịch hẹn xem nhà.
agents        Quản lý hồ sơ agent/seller public, rating/comment.
news          Quản lý tin tức.
prediction    API dự đoán giá nhà.
core          Settings, URL tổng, permission chung.
utils         Helper dùng chung.
```

Vì sao không để tất cả trong một app?

Nếu để tất cả vào một chỗ, file sẽ rất dài và khó bảo trì. Khi tách theo nghiệp vụ:

- Muốn sửa favorite thì vào `properties`.
- Muốn sửa rating thì vào `agents`.
- Muốn sửa login/profile thì vào `accounts`.
- Muốn sửa dự đoán giá thì vào `prediction`.

Cách này giúp người mới dễ tìm đúng nơi cần sửa.

## 8. Giải thích từng file backend thường gặp

### `models.py`

Đây là nơi định nghĩa bảng database.

Ví dụ trong `properties/models.py`, model `Property` tương ứng với bảng bất động sản. Nó có các field như:

- `title`: tiêu đề.
- `price`: giá.
- `area`: diện tích.
- `city`, `district`, `ward`: địa chỉ.
- `owner`: chủ sở hữu.
- `status`: trạng thái như active/sold/rented.

Django dựa vào model để tạo migration và bảng database.

### `serializers.py`

Serializer có 2 nhiệm vụ:

1. Validate dữ liệu frontend gửi lên.
2. Chuyển object Django thành JSON trả về frontend.

Ví dụ frontend không cần toàn bộ field của property trong danh sách listing. Vì vậy có `PropertyListSerializer` để trả dữ liệu gọn hơn.

### `views.py`

View là nơi nhận request.

View trả lời các câu hỏi:

- Request này là GET, POST, PATCH hay DELETE?
- User có quyền không?
- Dùng serializer nào?
- Lấy dữ liệu từ đâu?
- Trả status code gì?

Ví dụ:

- GET `/api/properties/`: lấy danh sách.
- POST `/api/properties/`: tạo property mới.
- PATCH `/api/properties/42/`: sửa property 42.
- DELETE `/api/properties/42/`: xóa property 42.

### `urls.py`

URL file nối đường dẫn API với view.

Ví dụ:

```text
/api/properties/        -> PropertyListCreateView
/api/properties/my/     -> MyPropertiesView
/api/properties/42/     -> PropertyDetailView
```

### `services.py`

Service chứa business logic, tức là logic nghiệp vụ.

Ví dụ:

- Tạo property.
- Update property.
- Xóa property.
- Toggle favorite.
- Upload ảnh.
- Track view.
- Dự đoán giá.

Lý do tách service: view không nên quá dài. View chỉ nên nhận request và trả response, còn logic thật để service xử lý.

### `repositories.py`

Repository gom query database vào một nơi.

Ví dụ:

- `get_available()`: lấy property đang active.
- `get_accessible_for_user()`: lấy property user được phép xem.
- `get_favorites()`: lấy danh sách favorite.

Lý do tách repository: query database có thể phức tạp. Nếu để thẳng trong view, view sẽ rất khó đọc.

### `tests.py`

Test kiểm tra chức năng có chạy đúng không.

Ví dụ:

- Non-owner không được sửa property.
- Favorite add/remove đúng.
- Rating không cho tự đánh giá chính mình.
- Prediction reject payload sai.

## 9. Frontend React là gì?

React là thư viện JavaScript để xây dựng giao diện. Trong dự án này React làm:

- Hiển thị trang chủ.
- Hiển thị listing card.
- Hiển thị form đăng nhập/đăng ký.
- Hiển thị profile.
- Gửi request API đến backend.
- Lưu trạng thái user đang đăng nhập.
- Điều hướng route.

Frontend nằm trong `FE/src`.

## 10. Giải thích từng thư mục frontend

```text
FE/src/pages/
```

Mỗi file trong đây thường là một trang lớn:

- `Index.tsx`: trang chủ.
- `Listings.tsx`: trang danh sách nhà.
- `PropertyDetail.tsx`: chi tiết nhà.
- `Profile.tsx`: profile user.
- `AgentDetail.tsx`: chi tiết agent.
- `PricePrediction.tsx`: trang dự đoán giá.

```text
FE/src/components/
```

Chứa các component dùng lại nhiều nơi:

- `Header`
- `Footer`
- `FeaturedListings`
- `HeroCarousel`
- `PropertyCard`
- `SearchModule`

```text
FE/src/components/listings/
```

Chứa component riêng cho trang listing:

- `FilterSidebar`
- `ListingCard`
- `ListingRow`
- `Pagination`
- `DetailPanel`

```text
FE/src/lib/
```

Chứa các file gọi API:

- `api.ts`: axios instance chung.
- `propertiesApi.ts`: API property.
- `authApi.ts`: API auth.
- `agentsApi.ts`: API agent/rating.
- `appointmentsApi.ts`: API appointment.
- `newsApi.ts`: API news.

Frontend page không nên tự viết axios raw khắp nơi. Thay vào đó page gọi hàm có sẵn trong `lib`.

```text
FE/src/contexts/AuthContext.tsx
```

Quản lý trạng thái đăng nhập:

- User hiện tại là ai?
- Đã login chưa?
- Login/logout như thế nào?
- Refresh user profile như thế nào?

## 11. Một request frontend chạy như thế nào?

Ví dụ user bấm favorite:

```text
User bấm nút bookmark
  -> ListingCard gọi onToggleFavorite
  -> Listings.tsx xử lý
  -> Nếu chưa login: navigate /login
  -> Nếu đã login: gọi toggleFavorite trong propertiesApi.ts
  -> propertiesApi.ts gọi axios POST /api/properties/<id>/favorite/
  -> Django backend xử lý Favorite
  -> FE cập nhật icon bookmark
```

## 12. Database nằm ở đâu?

Database chính dùng PostgreSQL trên Supabase.

Backend kết nối qua biến môi trường:

```env
HSW_DB_ENGINE=django.db.backends.postgresql
HSW_DB_NAME=postgres
HSW_DB_USER=postgres.<project-ref>
HSW_DB_PASSWORD=<password>
HSW_DB_HOST=<host>
HSW_DB_PORT=5432
```

Frontend không kết nối database trực tiếp. Frontend chỉ gọi backend.

## 13. Supabase Storage là gì?

Supabase Storage là nơi lưu file upload:

- Avatar.
- Ảnh property.
- Ảnh news.
- Giấy tờ xác minh seller.

Backend dùng helper `BE/utils/supabase_storage.py` để build URL và làm việc với storage.

## 14. Migration là gì?

Migration là file Django dùng để thay đổi cấu trúc database.

Ví dụ thêm field `profile_visible` vào `UserProfile`, Django tạo migration:

```text
accounts/migrations/0005_userprofile_profile_visible.py
```

Sau đó chạy:

```powershell
python manage.py migrate
```

Django sẽ cập nhật database thật.

Nếu không chạy migrate, code có thể gọi field mới nhưng database chưa có cột, dẫn đến lỗi.

## 15. Các bảng chính trong database

Bạn không cần nhớ từng cột ngay, nhưng cần hiểu các bảng chính:

```text
auth_user                         Tài khoản user Django.
accounts_userprofile              Profile mở rộng của user.
accounts_verificationrequest      Yêu cầu xác minh seller.
properties_property               Bất động sản.
properties_propertyimage          Ảnh của bất động sản.
properties_favorite               Nhà user đã yêu thích.
appointments_appointment          Lịch hẹn xem nhà.
agents_agent                      Hồ sơ agent/seller public.
agents_agentreview                Rating/comment dành cho agent.
news_news                         Tin tức.
```

## 16. Prediction Linear Regression hoạt động thế nào?

Phần prediction nằm ở:

```text
BE/prediction/
BE/ml_models/
```

Luồng chạy:

```text
User nhập form dự đoán trên /prediction
  -> FE gọi POST /api/prediction/
  -> PricePredictionInputSerializer validate input
  -> PredictionService load model trong BE/ml_models/vietnam.pkl
  -> Service tạo DataFrame đúng feature model cần
  -> model.predict()
  -> Backend trả estimated_price, price_min, price_max, price_per_m2
  -> FE hiển thị kết quả
```

Điểm quan trọng:

- Đề tài dùng Linear Regression, không dùng non-linear model.
- Model runtime đã nằm trong `BE/ml_models`, nên backend không cần thư mục ngoài để predict.
- `LinearRegressionModel/` là workspace train model, không phải dependency bắt buộc khi chạy web.

## 17. Vì sao có calibration trong prediction?

Linear Regression học từ dữ liệu. Nếu dữ liệu mất cân bằng, ví dụ tỉnh nhỏ có nhiều mẫu rẻ hơn, model có thể dự đoán quá thấp cho một số khu vực.

Vì vậy service có thêm hệ số hiệu chỉnh theo tỉnh/thành:

- Hà Nội và Hồ Chí Minh có hệ số cao hơn.
- Một số tỉnh miền Trung được giữ mức hợp lý.

Calibration này giúp kết quả thực tế hơn, nhưng model chính vẫn là Linear Regression.

## 18. Chức năng rating/comment nằm ở đâu?

Backend:

```text
BE/agents/models.py       AgentReview
BE/agents/serializers.py  AgentReviewSerializer
BE/agents/views.py        AgentReviewListCreateView, MyAgentReviewsView
BE/agents/urls.py         /api/agents/<slug>/reviews/
```

Frontend:

```text
FE/src/pages/AgentDetail.tsx
FE/src/pages/Profile.tsx
FE/src/lib/agentsApi.ts
```

Rule nghiệp vụ:

- User đăng nhập mới rating được.
- User không được tự rating agent profile của mình.
- Một user chỉ có một review cho một agent.
- Nếu rating lại thì cập nhật review cũ.
- Agent tự cập nhật rating trung bình và tổng số review.

## 19. Chức năng favorite nằm ở đâu?

Backend:

```text
BE/properties/models.py        Favorite
BE/properties/views.py         FavoriteListView, FavoriteToggleView
BE/properties/services.py      toggle_favorite
BE/properties/repositories.py  get_favorites
```

Frontend:

```text
FE/src/lib/propertiesApi.ts
FE/src/pages/Listings.tsx
FE/src/pages/Profile.tsx
FE/src/pages/PropertyDetail.tsx
```

Flow:

```text
User bấm yêu thích
  -> FE optimistic update
  -> POST /api/properties/<id>/favorite/
  -> BE thêm hoặc xóa Favorite
  -> FE đồng bộ lại trạng thái
```

## 20. Chức năng seller quản lý trạng thái nhà

Seller có thể:

- Activate: hiện lại nhà.
- Pause: tạm ẩn nhà.
- Mark Sold: đánh dấu đã bán.
- Mark Rented: đánh dấu đã cho thuê.
- Delete: xóa nhà.

Quan trọng: chỉ owner của property mới được sửa/xóa property đó. Backend enforce rule này, không chỉ frontend.

## 21. Vì sao Listings phải phân trang?

Nếu database có 10 căn nhà, tải hết vẫn ổn. Nhưng nếu có hàng nghìn căn, tải hết về frontend sẽ:

- Chậm.
- Tốn RAM trình duyệt.
- Dễ timeout.
- Làm Supabase/backend quá tải.

Vì vậy trang Listings hiện gửi filter lên backend:

```text
/api/properties/?listing_type=sale&page=1&page_size=30&city=Hồ Chí Minh
```

Backend chỉ trả 30 item của trang hiện tại.

## 22. Design pattern là gì, dự án dùng gì?

Design pattern là cách tổ chức code đã được dùng nhiều để giải quyết vấn đề lặp lại.

Dự án này dùng các pattern chính:

### Repository pattern

Gom query database vào repository.

Ví dụ:

```text
PropertyRepository.get_available()
PropertyRepository.get_favorites()
```

Ý nghĩa: view không phải chứa query phức tạp.

### Service layer pattern

Gom business logic vào service.

Ví dụ:

```text
PropertyService.toggle_favorite()
PredictionService.predict_price()
```

Ý nghĩa: logic nghiệp vụ không bị rải khắp view.

### Serializer/DTO pattern

Serializer định nghĩa dữ liệu đi vào/đi ra API.

Ý nghĩa: frontend và backend có contract rõ ràng.

### Component composition

Frontend chia UI thành component nhỏ rồi ghép lại.

Ví dụ:

```text
Listings page = FilterSidebar + ListingCard + Pagination + DetailPanel
```

### API client layer

Frontend không gọi axios lung tung mà gom vào `src/lib/*Api.ts`.

Ý nghĩa: đổi endpoint dễ, page dễ đọc.

## 23. Khi mở code thì nên đọc từ đâu?

Nếu muốn hiểu backend:

1. Mở `BE/core/urls.py` để xem endpoint tổng.
2. Mở app cần hiểu, ví dụ `BE/properties`.
3. Đọc `models.py` trước để hiểu dữ liệu.
4. Đọc `urls.py` để biết endpoint.
5. Đọc `views.py` để biết request được xử lý thế nào.
6. Đọc `serializers.py` để biết JSON input/output.
7. Đọc `services.py` và `repositories.py` nếu logic/query phức tạp.
8. Đọc `tests.py` để biết rule nào đã được kiểm tra.

Nếu muốn hiểu frontend:

1. Mở `FE/src/App.tsx` để xem route.
2. Chọn route, ví dụ `/listings`, rồi mở `FE/src/pages/Listings.tsx`.
3. Xem page dùng component nào.
4. Mở API client trong `FE/src/lib`.
5. Mở component con nếu cần.

## 24. Cách thuyết trình dự án mạch lạc

Bạn có thể trình bày theo khung này:

1. Bài toán: website bất động sản có buyer, seller, admin.
2. Kiến trúc: React frontend, Django REST backend, Supabase database/storage, Linear Regression model.
3. Backend: chia app theo domain, dùng DRF để expose API.
4. Frontend: chia pages/components/lib API clients, dùng AuthContext để quản lý login.
5. Database: các bảng chính và quan hệ user-property-appointment-agent-review.
6. Prediction: model Linear Regression đóng gói trong backend, endpoint `/api/prediction/`.
7. Các chức năng nổi bật: listing filter/pagination, favorite, seller status, appointment, rating/comment, profile public/private.
8. Pattern: Repository-Service-Serializer ở backend, API client layer và component composition ở frontend.
9. Testing: backend tests, FE build/test/lint, Playwright smoke.

## 25. Đoạn nói mẫu khi được hỏi "Django trong dự án này làm gì?"

Có thể trả lời:

> Django là backend của dự án. Nó định nghĩa database bằng models, cung cấp API bằng Django REST Framework, kiểm tra đăng nhập và phân quyền, xử lý nghiệp vụ như favorite, đặt lịch, seller quản lý nhà, rating agent, upload file và gọi model Linear Regression để dự đoán giá. Frontend React không truy cập database trực tiếp mà gọi API do Django cung cấp.

## 26. Đoạn nói mẫu khi được hỏi "Vì sao chia Service và Repository?"

Có thể trả lời:

> Em tách Repository để gom query database vào một nơi, giúp tối ưu `select_related`, `prefetch_related`, pagination và annotate favorite dễ hơn. Service chứa business logic như tạo property, toggle favorite, upload ảnh, predict price. View chỉ nhận request, gọi service/repository và trả response. Cách này làm code dễ đọc, dễ test và dễ mở rộng hơn so với để toàn bộ logic trong view.

## 27. Đoạn nói mẫu khi được hỏi "Prediction dùng gì?"

Có thể trả lời:

> Prediction dùng Linear Regression theo yêu cầu đề tài. Model được train từ dữ liệu bất động sản Việt Nam và đóng gói vào `BE/ml_models/vietnam.pkl`. Backend nhận input như tỉnh/thành, quận/huyện, loại nhà, diện tích, số tầng, số phòng và tọa độ, sau đó tạo DataFrame đúng schema model, gọi `predict`, áp dụng calibration theo vùng và trả về giá ước lượng cùng khoảng giá min/max.

## 28. Checklist tự kiểm tra trước khi trình bày

- Tôi biết `FE/` và `BE/` khác nhau thế nào.
- Tôi biết request từ FE đến BE đi qua API nào.
- Tôi biết `models.py`, `serializers.py`, `views.py`, `services.py`, `repositories.py` làm gì.
- Tôi biết property, favorite, appointment, agent review nằm ở app nào.
- Tôi biết Supabase dùng cho database và storage.
- Tôi biết model prediction nằm trong `BE/ml_models`.
- Tôi biết vì sao listing cần pagination.
- Tôi biết nói về Repository-Service-Serializer.
- Tôi biết chạy backend và frontend local.
- Tôi biết chạy test cơ bản.

