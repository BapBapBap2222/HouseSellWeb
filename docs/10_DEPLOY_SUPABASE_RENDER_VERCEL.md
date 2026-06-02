# Deploy Supabase, Render và Vercel

Tài liệu này giải thích cách đưa dự án lên production. Người mới nên hiểu theo thứ tự:

```text
Supabase  = database PostgreSQL + storage file upload
Render    = nơi chạy backend Django API
Vercel    = nơi chạy frontend React/Vite
```

Frontend trên Vercel không nói chuyện trực tiếp với database. Frontend gọi backend Render qua `VITE_API_BASE_URL`. Backend Render mới kết nối Supabase.

## 1. Sơ đồ production

```text
Người dùng
  |
  v
Vercel frontend
  URL ví dụ: https://djangofe.vercel.app
  |
  | gọi API bằng VITE_API_BASE_URL
  v
Render backend Django
  URL ví dụ: https://djangobe-pz4a.onrender.com
  |
  | kết nối DB + Storage bằng secret backend
  v
Supabase
  PostgreSQL + Storage buckets
```

## 2. Thứ tự deploy đúng

Nên làm theo thứ tự này:

1. Chuẩn bị Supabase database và storage.
2. Deploy backend Django lên Render hoặc nền tảng server tương đương.
3. Chạy migrate trên backend production.
4. Kiểm tra backend API production hoạt động.
5. Deploy frontend React lên Vercel.
6. Set `VITE_API_BASE_URL` của Vercel trỏ về backend production.
7. Quay lại backend, thêm domain Vercel vào `CORS_ALLOWED_ORIGINS`.
8. Test login, listings, favorite, appointment, rating, prediction trên domain Vercel.

Không nên deploy frontend trước khi backend production chạy ổn, vì frontend cần backend URL thật.

## 3. Supabase cần chuẩn bị gì?

Bạn cần:

- Project URL, ví dụ `https://<project-ref>.supabase.co`.
- Database password.
- Connection string hoặc thông tin pooler.
- Service role key cho backend.
- Các bucket storage.

Các bucket nên có:

```text
avatars
property-images
verification-docs
```

Nếu news dùng chung bucket với property images thì `SUPABASE_NEWS_BUCKET=property-images` cũng được.

## 4. Biến môi trường backend production

Backend cần set các biến này trên Render hoặc server backend.

Core:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<secret-random-mạnh>
DJANGO_ALLOWED_HOSTS=<backend-domain>
FRONTEND_BASE_URL=<frontend-production-domain>
```

Ví dụ:

```env
DJANGO_ALLOWED_HOSTS=djangobe-pz4a.onrender.com
FRONTEND_BASE_URL=https://djangofe.vercel.app
```

Database Supabase:

```env
HSW_DB_ENGINE=django.db.backends.postgresql
HSW_DB_NAME=postgres
HSW_DB_USER=postgres.<project-ref>
HSW_DB_PASSWORD=<supabase-db-password>
HSW_DB_HOST=<supabase-pooler-host>
HSW_DB_PORT=5432
HSW_DB_SSLMODE=require
HSW_DB_SEARCH_PATH=housesell_db,public
```

CORS:

```env
CORS_ALLOWED_ORIGINS=https://<frontend-domain>,https://<vercel-preview-or-alias>.vercel.app
```

Nếu chỉ có một domain production thì chỉ cần:

```env
CORS_ALLOWED_ORIGINS=https://djangofe.vercel.app
```

Supabase Storage:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_AVATARS_BUCKET=avatars
SUPABASE_PROPERTY_IMAGES_BUCKET=property-images
SUPABASE_VERIFICATION_DOCS_BUCKET=verification-docs
SUPABASE_NEWS_BUCKET=property-images
SUPABASE_SIGNED_URL_EXPIRES_IN=3600
```

Email:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=<email>
EMAIL_HOST_PASSWORD=<app-password>
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=Blue Sky <email>
PASSWORD_RESET_TIMEOUT=1800
```

API docs:

```env
SWAGGER_PUBLIC=false
```

Không đưa các giá trị thật như password, service role key, email app password vào Git hoặc tài liệu public.

## 5. Deploy backend Django lên Render

Backend có sẵn `BE/Procfile`:

```text
web: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
```

Nếu deploy backend từ thư mục `BE`, cấu hình thường là:

```text
Root Directory: BE
Build Command: pip install -r requirements.txt
Start Command: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
```

Nếu nền tảng tự đọc `Procfile`, start command có thể lấy từ đó.

Sau khi deploy backend:

1. Mở shell/console của backend production.
2. Chạy migration:

```powershell
python manage.py migrate
```

3. Nếu cần tạo admin:

```powershell
python manage.py createsuperuser
```

4. Kiểm tra backend:

```text
https://<backend-domain>/swagger/
https://<backend-domain>/api/properties/?page=1&page_size=1
```

Nếu `SWAGGER_PUBLIC=false`, Swagger cần admin login. Khi đó chỉ cần test API public như `/api/properties/`.

## 6. Deploy frontend React lên Vercel

Frontend là Vite app trong thư mục `FE`.

Cấu hình Vercel nên là:

```text
Root Directory: FE
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Biến môi trường frontend trên Vercel:

```env
VITE_API_BASE_URL=https://<backend-domain>
```

Ví dụ:

```env
VITE_API_BASE_URL=https://djangobe-pz4a.onrender.com
```

Sau khi đổi biến môi trường ở Vercel, phải redeploy frontend để Vite build lại. Biến `VITE_*` được nhúng lúc build, không phải lúc runtime.

## 7. CORS giữa Vercel và backend

Nếu frontend Vercel gọi backend mà bị lỗi CORS, kiểm tra backend:

```env
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
```

Ví dụ:

```env
CORS_ALLOWED_ORIGINS=https://djangofe.vercel.app
```

Nếu có domain custom:

```env
CORS_ALLOWED_ORIGINS=https://djangofe.vercel.app,https://www.yourdomain.com
```

Sau khi đổi CORS trên backend, redeploy hoặc restart backend.

## 8. Allowed hosts cho backend

Nếu backend báo lỗi `Invalid HTTP_HOST header`, nghĩa là `DJANGO_ALLOWED_HOSTS` thiếu domain backend.

Ví dụ:

```env
DJANGO_ALLOWED_HOSTS=djangobe-pz4a.onrender.com
```

Nếu có nhiều host:

```env
DJANGO_ALLOWED_HOSTS=djangobe-pz4a.onrender.com,api.yourdomain.com
```

Không nên dùng `*` trong production nếu không thật sự cần.

## 9. Checklist sau khi deploy backend

Kiểm tra:

- Backend URL mở được.
- `/api/properties/?page=1&page_size=1` trả JSON.
- Migration đã chạy.
- Admin login được tại `/admin/`.
- Supabase database có bảng mới.
- Supabase storage buckets tồn tại.
- Upload ảnh không lỗi.
- `/api/prediction/` không 500.
- Logs backend không báo thiếu model `vietnam.pkl`.

## 10. Checklist sau khi deploy frontend

Kiểm tra trên domain Vercel:

1. Trang chủ load được.
2. Featured Listings hiện được.
3. `/listings?type=buy` load được.
4. Đăng ký user mới.
5. Đăng nhập.
6. Favorite property rồi vào Profile/Favorites kiểm tra.
7. Mở property detail.
8. Đặt lịch xem nhà.
9. Mở agent detail và gửi rating/comment.
10. Mở `/prediction`, gửi payload hợp lệ.
11. Mở `/news`.

## 11. Các lỗi production thường gặp

### Frontend Vercel gọi nhầm local backend

Dấu hiệu:

- Trên Vercel, network request gọi `http://127.0.0.1:8000`.
- Login/listings fail.

Cách sửa:

```env
VITE_API_BASE_URL=https://<backend-domain>
```

Set lại trên Vercel rồi redeploy frontend.

### CORS error

Dấu hiệu:

- Browser console báo CORS.
- API chạy được khi mở trực tiếp nhưng frontend gọi bị chặn.

Cách sửa:

```env
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
```

Restart/redeploy backend.

### Backend không kết nối Supabase

Dấu hiệu:

- API 500.
- Logs báo database connection/authentication failed.

Kiểm tra:

- `HSW_DB_USER`
- `HSW_DB_PASSWORD`
- `HSW_DB_HOST`
- `HSW_DB_PORT`
- `HSW_DB_SSLMODE=require`

### Prediction 500 trên production

Kiểm tra:

- `BE/ml_models/vietnam.pkl` có được commit/deploy không.
- `scikit-learn`, `pandas`, `joblib` có trong `requirements.txt`.
- Backend logs có báo thiếu model không.
- Payload có latitude/longitude hợp lệ không.

### Upload ảnh fail

Kiểm tra:

- `SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`.
- Bucket đã tạo chưa.
- Bucket name đúng chưa.
- File có vượt giới hạn không.

## 12. Có cần deploy backend lên Vercel không?

Không nên deploy Django backend chính lên Vercel trong dự án này. Vercel phù hợp cho frontend React/Vite. Backend Django chạy tốt hơn trên Render hoặc server hỗ trợ Python long-running process.

Mô hình khuyến nghị:

```text
FE React -> Vercel
BE Django -> Render
DB/Storage -> Supabase
```

## 13. Khi tách thành 2 repo

Repo frontend deploy Vercel:

```text
FE/
```

Repo backend deploy Render:

```text
BE/
```

Nếu tách repo, nhớ:

- Backend repo phải có `BE/ml_models`.
- Frontend repo phải có `.env.example` hướng dẫn `VITE_API_BASE_URL`.
- CORS backend phải thêm domain Vercel.
- Vercel phải trỏ đúng backend production.

## 14. Câu trình bày khi được hỏi về deploy

Có thể nói:

> Production được chia thành ba phần. Frontend React/Vite deploy trên Vercel vì Vercel phù hợp cho static frontend build ra thư mục `dist`. Backend Django REST Framework deploy trên Render vì backend cần process Python chạy lâu dài bằng Gunicorn. Database và file upload dùng Supabase, gồm PostgreSQL và Storage buckets. Frontend gọi backend qua biến `VITE_API_BASE_URL`, còn backend kết nối Supabase bằng biến môi trường bảo mật. Để frontend gọi được backend, backend cần cấu hình `CORS_ALLOWED_ORIGINS` chứa domain Vercel và `DJANGO_ALLOWED_HOSTS` chứa domain backend.

