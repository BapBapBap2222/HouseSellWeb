# Theo dõi hoàn thiện dự án trên nhánh new

Ngày cập nhật: 02/06/2026

## Trạng thái nhánh

- Nhánh đang làm: `new`
- Remote đang track: `origin/new`
- Mục tiêu: giữ toàn bộ phần đã làm trước đó, đồng thời khôi phục đúng dữ liệu/model predict từ `tinixai/vietnam-real-estates`.

## Dữ liệu predict đã khôi phục

Đã copy lại từ nhánh backup `predone-from-main-backup` sang `new`:

- `LinearRegressionModel/data/tinixai_vietnam_real_estates_sample.csv`
- `LinearRegressionModel/data/tinixai_vietnam_real_estates_geo_sample.csv`
- `LinearRegressionModel/data/tinixai_vietnam_real_estates_market_coverage.csv`
- `LinearRegressionModel/data/tinixai_vietnam_real_estates_augmented.csv`
- `LinearRegressionModel/models/vietname.pkl`
- `LinearRegressionModel/models/vietname_metadata.json`
- `LinearRegressionModel/train_vietnam_model.py`

Dataset gốc Hugging Face vẫn còn trong:

- `LinearRegressionModel/data/vietnam-real-estates/shard_0000.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0001.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0002.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0003.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0004.parquet`

## Model đang dùng

- Model production: `LinearRegressionModel/models/vietname.pkl`
- Model alias: `LinearRegressionModel/models/lr_pipeline.joblib`
- Hai file trên đã được đồng bộ cùng một model.
- Loại model: `Ridge linear regression with log-transformed target`
- Không dùng mô hình phi tuyến.
- Metadata/metrics:
  - Source: `tinixai/vietnam-real-estates`
  - Training rows: `35000`
  - Province coverage: `63`
  - R2: `0.9463`
  - MAE: `1059705107` VND

## Logic prediction đã sửa

- Backend `PredictionService` tự đọc schema feature từ model hoặc metadata.
- Model tinixai augmented dùng đúng các feature:
  - `property_type_name`
  - `province_name`
  - `district_name`
  - `area`
  - `area_log`
  - `floor_count`
  - `bedroom_count`
  - `bathroom_count`
  - `latitude`
  - `longitude`
- API vẫn nhận `ward_name` từ FE, nhưng model hiện tại không dùng feature này nếu metadata không yêu cầu.
- Có guardrail vùng để Hà Nội/Hồ Chí Minh không bị thấp hơn miền Trung với cùng thông số nhà.

## Giá kiểm tra nhanh

Cùng một căn nhà mẫu: `80m2`, `3 tầng`, `3 phòng ngủ`, `2 phòng tắm`, loại `Nhà`.

- Hồ Chí Minh: khoảng `17.66 tỷ`
- Hà Nội: khoảng `17.30 tỷ`
- Đà Nẵng: khoảng `7.36 tỷ`
- Quảng Nam: khoảng `4.58 tỷ`
- Quảng Ngãi: khoảng `3.96 tỷ`

Lý do chỉnh ngày 02/06/2026:

- Baseline cũ đặt Quảng Nam `32 triệu/m2`, Quảng Ngãi `24 triệu/m2`, lại bị backend giảm multiplier, nên giá ra quá thấp.
- Baseline mới đặt Quảng Nam `48 triệu/m2`, Quảng Ngãi `42 triệu/m2`.
- Backend không còn kéo giảm riêng Quảng Nam/Quảng Ngãi.
- Test prediction đã thêm ngưỡng tối thiểu để tránh hồi quy về giá quá rẻ:
  - Quảng Nam phải lớn hơn `4 tỷ` cho căn mẫu.
  - Quảng Ngãi phải lớn hơn `3.5 tỷ` cho căn mẫu.

## Kiểm thử đã chạy

- `python LinearRegressionModel/train_vietnam_lr.py`: pass
- `python manage.py test prediction`: pass 8/8
- `python manage.py test`: pass 51/51
- `npm run build`: pass
- `npm run test`: pass 1/1

## Audit web toàn bộ ngày 02/06/2026

Mục tiêu của vòng này là duyệt lại route, nút bấm, chart, trang tin tức, footer/header và các flow chính để giảm tình trạng nút nhìn bấm được nhưng không có chức năng.

### Frontend đã hoàn thiện thêm

- Header/home:
  - Nút `Discover Location` điều hướng thật sang `/explore`.
  - Nút icon lưu trong hero điều hướng sang `/listings`.
  - Ô search ở hero đã gửi keyword sang `/listings?search=...`.
  - Tab `Buy/Rent` ở hero đã ảnh hưởng route danh sách, rent đi `/listings?type=rent`.

- Listings:
  - Danh sách đã lọc được theo query `search` từ hero/project card.
  - Nút trái tim trong card grid/list đã gọi API favorite thật.
  - Nếu chưa đăng nhập và bấm favorite, user được đưa về `/login`.
  - Trạng thái favorite được cập nhật optimistic và rollback nếu API lỗi.

- Featured listings:
  - Nút trái tim trong card featured đã gọi API favorite thật.
  - Không còn nút chặn click nhưng không có chức năng.

- Property detail:
  - Nút share dùng Web Share API nếu browser hỗ trợ.
  - Nếu không hỗ trợ share, tự copy link vào clipboard.
  - Có thông báo kết quả share/copy.

- Appointment detail:
  - Nút share lịch hẹn đã hoạt động thật.
  - Nút trái tim ở ảnh lịch hẹn được chuyển thành link mở property liên quan hoặc `/listings`.

- News:
  - Thêm route chi tiết tin tức `/news/:id`.
  - Card tin tức bấm được vào trang chi tiết.
  - Top provinces bấm được sang listings theo province.
  - Footer không còn link `#` giả.

- Profile:
  - Chart doanh thu không còn dùng data cứng.
  - Chart lấy dữ liệu từ listing bán của user theo năm đang chọn.
  - Card property/appointment trong profile có điều hướng tới trang quản lý/chi tiết tương ứng.

- NotFound:
  - Chuyển anchor reload trang sang `Link` của React Router.
  - Hiển thị path đang bị lỗi để dễ debug.

### Test audit đã thêm

- Thêm file `FE/tests/site.audit.spec.cjs`.
- Test các route public:
  - `/`
  - `/listings`
  - `/agents`
  - `/explore`
  - `/news`
  - `/news/1`
  - `/prediction`
  - `/privacy`
  - `/terms`
- Mỗi route kiểm tra:
  - Body render được.
  - Không còn `a[href="#"]`.
  - Không có page error từ browser.
- Test protected route `/profile` tự redirect về `/login`.
- Test CTA ở home điều hướng đúng.

### Kết quả kiểm thử mới nhất

- `npm run lint`: pass, còn 5 warning Fast Refresh cũ.
- `npm run build`: pass, còn warning chunk size và dynamic/static import của Footer.
- `npm run test`: pass 1/1.
- `python manage.py test`: pass 51/51.
- `npx playwright test tests/site.audit.spec.cjs --reporter=line`: pass 11/11.
- `npx playwright test tests/prediction.smoke.spec.cjs --reporter=line`: pass 5/5.
- API smoke local:
  - Register: pass.
  - Login: pass.
  - `/api/auth/users/me/`: pass.
  - `/api/properties/`: trả 105 items.
  - `/api/agents/`: trả 32 items.
  - `/api/news/`: trả 10 items.
  - `/api/prediction/`: trả kết quả estimate hợp lệ.

### Production deploy đã kiểm tra

- Đã deploy FE production bằng Vercel CLI.
- Deployment READY:
  - `https://djangofe-mzfba2uag-minhtridn05-5328s-projects.vercel.app`
  - Alias hiện tại của project: `https://djangofe-kappa.vercel.app`
- Smoke production FE trên `https://djangofe-kappa.vercel.app`: pass 11/11.
- Domain `https://djangofe.vercel.app` vẫn gọi được backend qua CORS, nhưng alias này không nằm trong Vercel project/scope hiện tại nên chưa ghi đè được bằng CLI.
- Đã thêm CORS regex production cho `https://*.vercel.app` trong backend để alias Vercel mới gọi được API sau khi Render redeploy backend.
- Backend Render hiện tại:
  - `/api/auth/login/`: 200.
  - `/api/agents/`: 200.
  - `/api/news/`: 200.
  - `/api/prediction/`: đang 500 trên Render hiện tại, trong khi local pass. Nguyên nhân hợp lý nhất là Render chưa redeploy code/model mới của nhánh `new` hoặc service đang chạy artifact cũ.

### Lưu ý còn lại trước khi bàn giao production

- Local đã chạy ổn với FE `http://127.0.0.1:5173` và BE `http://127.0.0.1:8000`.
- Muốn production nhận code mới, cần push nhánh `new` và deploy lại Vercel/Render theo branch/environment tương ứng.
- Render backend cần có đúng env production:
  - `HSW_DB_*`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - các bucket Supabase
  - `CORS_ALLOWED_ORIGINS=https://djangofe.vercel.app`
- Vercel frontend cần `VITE_API_BASE_URL=https://djangobe-pz4a.onrender.com`.
- Render backend cần redeploy từ commit mới nhất trên nhánh `new` để nhận model predict và CORS regex mới.

## Lưu ý

- `train_vietnam_lr.py` hiện là wrapper gọi `train_vietnam_model.py`, để không train nhầm sang pipeline parquet cũ.
- Nếu deploy production, Render phải redeploy backend để nhận lại model `vietname.pkl` mới.
