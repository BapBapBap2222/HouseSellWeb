# Chạy, test và bàn giao

## Yêu cầu môi trường

- Python 3.10+.
- Node.js 18+ hoặc 20+.
- Git.
- Supabase/PostgreSQL nếu chạy với database thật.

## Chạy backend

```powershell
cd BE
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Nếu đã có môi trường Python sẵn thì có thể bỏ qua bước tạo venv.

## Chạy frontend

```powershell
cd FE
npm install
npm run dev -- --host 127.0.0.1 --port 8080
```

Mở:

```text
http://127.0.0.1:8080
```

## Biến môi trường frontend

Trong `FE/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Biến môi trường backend tối thiểu

```env
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=<local-secret>
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://127.0.0.1:8080,http://localhost:8080
FRONTEND_BASE_URL=http://127.0.0.1:8080
```

Nếu dùng Supabase, thêm `HSW_DB_*` và `SUPABASE_*` như mô tả trong tài liệu database.

## Test backend

```powershell
cd BE
python manage.py check
python manage.py test accounts properties appointments news prediction agents --keepdb
```

Test từng module:

```powershell
python manage.py test properties --keepdb
python manage.py test agents --keepdb
python manage.py test prediction --keepdb
```

## Test frontend

```powershell
cd FE
npm run build
npm run test
npm run lint
```

Playwright smoke:

```powershell
cd FE
$env:SMOKE_BASE_URL="http://127.0.0.1:8080"
npx playwright test tests/site.audit.spec.cjs --reporter=line
```

## Checklist kiểm tra bằng tay

1. Trang chủ load được FeaturedListings.
2. `/listings?type=buy` load được danh sách.
3. Filter giá, tỉnh/thành, quận/huyện hoạt động.
4. Bỏ filter thì danh sách reset đúng.
5. Login buyer, favorite property, vào Profile/Favorites kiểm tra.
6. Login seller verified, vào Profile/Sell kiểm tra property của mình.
7. Seller pause/activate/mark sold/delete property.
8. Vào Agent Detail, gửi rating/comment.
9. Vào Profile/Ratings của seller, thấy rating nhận được.
10. Vào `/prediction`, gửi payload hợp lệ, nhận estimate.
11. Vào `/news`, mở detail news.
12. Chưa login vào `/profile` phải bị chuyển về login.

## Checklist bàn giao

- Working tree sạch hoặc commit rõ ràng.
- Migration đã chạy trên database bàn giao.
- `.env.example` dùng placeholder, không có secret thật.
- Model prediction nằm trong `BE/ml_models`.
- FE trỏ đúng backend qua `VITE_API_BASE_URL`.
- Supabase buckets đã tạo nếu dùng upload.
- Backend production đã có URL thật, ví dụ Render.
- Frontend production đã deploy lên Vercel và trỏ đúng backend production.
- Backend `CORS_ALLOWED_ORIGINS` có domain Vercel production.
- Có tài khoản demo buyer/seller/admin hoặc hướng dẫn tạo.
- Tài liệu trong `docs/` đủ để người mới đọc và trình bày.

## Deploy production

Quy trình production chi tiết nằm ở:

[Deploy Supabase, Render và Vercel](10_DEPLOY_SUPABASE_RENDER_VERCEL.md)
