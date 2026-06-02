# Theo dõi hoàn thiện dự án trên nhánh predone

Ngày cập nhật: 02/06/2026

## Phạm vi nhánh

- Nhánh đang làm: `predone`
- Remote đang track: `origin/Pre-Done`
- Không làm trên `main`. Nhánh `main` là bản cũ.
- Bản sai trước đó đã được giữ lại ở nhánh local `predone-from-main-backup` để tham khảo, không dùng làm nền chính.

## Việc đã hoàn thành

1. Đồng bộ lại đúng nền code từ `origin/Pre-Done`.
2. Hoàn thiện frontend dùng một kiểu font nhất quán, bỏ các class font mờ/nghiêng như `font-light`, `italic`, `Josefin Sans`.
3. Thêm route truy cập trên header:
   - `Explore` -> `/explore`
   - `Agents` -> `/agents`
4. Thêm dữ liệu hành chính Việt Nam đầy đủ 63 tỉnh/thành, gồm tỉnh, quận/huyện, phường/xã.
5. Áp dụng tỉnh/quận/xã vào:
   - Form thêm bất động sản
   - Form quản lý bất động sản
   - Trang listings/filter
   - Trang đổi thông tin liên hệ
   - Trang dự đoán giá
6. Thêm trường `ward` vào luồng property frontend/backend.
7. Sửa prediction API bắt buộc có tọa độ `latitude`, `longitude` và validate trong phạm vi Việt Nam.
8. Rebuild model dự đoán bằng linear regression dạng `Ridge`, không dùng mô hình phi tuyến.
9. Huấn luyện model từ dữ liệu Hugging Face đã tải trong `LinearRegressionModel/data/vietnam-real-estates`.
10. Thêm hiệu chỉnh vùng để Hà Nội và Hồ Chí Minh không bị dự đoán rẻ bất thường hơn các tỉnh miền Trung với cùng thông số nhà.
11. Sửa prediction view để request JSON lỗi trả `400`, không trả nhầm `500`.
12. Sửa cấu hình backend đọc `BE/.env` local, hỗ trợ Supabase PostgreSQL, CORS dev `5173/5174`, và bật các security setting khi `DJANGO_DEBUG=False`.
13. Thêm ignore cho `FE/.env`, `FE/.vercel` và cache Supabase CLI để tránh commit cấu hình máy cá nhân hoặc secret.
14. Thêm `BE/Procfile`, `STATIC_ROOT` và cấu hình proxy SSL để Render/Gunicorn chạy backend ổn định hơn khi redeploy.

## Supabase cần cấu hình

Không commit secret vào git. Các giá trị này chỉ đặt trong `BE/.env`, Render Environment Variables, hoặc dashboard deploy.

Backend cần các biến:

```env
HSW_DB_ENGINE=django.db.backends.postgresql
HSW_DB_NAME=postgres
HSW_DB_USER=postgres.<project-ref>
HSW_DB_PASSWORD=<supabase-db-password>
HSW_DB_HOST=<supabase-pooler-host>
HSW_DB_PORT=5432
HSW_DB_SSLMODE=require
HSW_DB_SEARCH_PATH=housesell_db,public

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
SUPABASE_AVATARS_BUCKET=avatars
SUPABASE_PROPERTY_IMAGES_BUCKET=property-images
SUPABASE_VERIFICATION_DOCS_BUCKET=verification-docs
SUPABASE_NEWS_BUCKET=property-images
```

Frontend production cần:

```env
VITE_API_BASE_URL=https://<backend-domain>
```

Backend production cần thêm:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<strong-random-secret>
DJANGO_ALLOWED_HOSTS=<backend-domain>
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
FRONTEND_BASE_URL=https://<frontend-domain>
```

Nếu đổi domain Vercel, phải cập nhật `CORS_ALLOWED_ORIGINS` trên Render rồi redeploy backend.

## Kết quả kiểm thử đã chạy

- `python LinearRegressionModel/train_vietnam_lr.py`: pass, đã tạo lại model.
- `python manage.py test prediction`: pass 8/8.
- `python manage.py test`: pass 51/51.
- `npm run lint`: pass, còn 5 warning Fast Refresh cũ, không có error.
- `npm run test`: pass 1/1.
- `npm run build`: pass.
- `python manage.py check --deploy`: pass.
- Smoke API local:
  - Register: OK
  - Login: OK
  - Get profile: OK
  - Properties: OK
  - Agents: OK
  - News: OK
  - Prediction: OK
- Smoke UI Playwright local:
  - Header có `Explore` và `Agents`: OK
  - Prediction có tỉnh/quận/xã: OK
  - Validation không gọi API khi thiếu field: OK
  - Payload prediction có đủ schema và tọa độ: OK
  - Lỗi API hiển thị message an toàn: OK

## Việc còn phải xác nhận ở production

Frontend production đã deploy:

- Alias: `https://djangofe-kappa.vercel.app`
- Deployment: `https://djangofe-7o2e7un2g-minhtridn05-5328s-projects.vercel.app`

Kết quả smoke production hiện tại:

- Frontend Vercel render `200`: OK
- Backend Render direct register/login/profile: OK
- Backend Render `/api/properties/`: OK sau khi service wake
- Backend Render CORS từ `https://djangofe-kappa.vercel.app`: chưa OK, thiếu `Access-Control-Allow-Origin`
- Backend Render `/api/prediction/`: đang `500`, cần redeploy backend với code/model mới trên nhánh `predone`

Việc cần làm trên Render sau khi code được push:

1. Đảm bảo Render deploy từ nhánh `Pre-Done` hoặc nhánh production đúng.
2. Cập nhật env `CORS_ALLOWED_ORIGINS=https://djangofe-kappa.vercel.app` hoặc thêm domain production thật nếu đổi domain.
3. Redeploy backend để nhận model/code prediction mới.
4. Chạy lại smoke production qua browser:
   - Register/login thật qua frontend.
   - Gọi prediction thật qua frontend.
   - Kiểm tra upload ảnh/property nếu bucket Supabase đúng.

## Lưu ý bảo mật

- Các secret đã từng được dán trong chat nên nên rotate trước khi dùng production thật.
- Không commit `BE/.env`, `FE/.env`, `.vercel`, service role key, database password, Gmail app password.
