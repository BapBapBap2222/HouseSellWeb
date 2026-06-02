# HouseSellWeb - Tài liệu bàn giao dự án

HouseSellWeb là ứng dụng bất động sản full-stack gồm frontend React và backend Django REST Framework. Dự án cho phép người dùng xem tin bán/cho thuê, tìm kiếm theo địa điểm/giá/loại nhà, lưu yêu thích, đặt lịch xem nhà, quản lý bất động sản của seller, xem agent, đánh giá/comment agent và dự đoán giá nhà bằng Linear Regression.

Nếu bạn chưa biết Django, React, API hay cấu trúc dự án, hãy đọc tài liệu này trước:

1. [Hướng dẫn nhập môn cho người mới](docs/09_HUONG_DAN_NHAP_MON_CHO_NGUOI_MOI.md)

Sau đó đọc các phần chi tiết theo thứ tự:

1. [Mục lục và cách đọc](docs/00_MUC_LUC_VA_CACH_DOC.md)
2. [Tổng quan kiến trúc](docs/01_TONG_QUAN_KIEN_TRUC.md)
3. [Backend Django API](docs/02_BACKEND_DJANGO_API.md)
4. [Frontend React](docs/03_FRONTEND_REACT.md)
5. [Database, Supabase và Storage](docs/04_DATABASE_SUPABASE_STORAGE.md)
6. [Prediction Linear Regression](docs/05_PREDICTION_LINEAR_REGRESSION.md)
7. [Luồng nghiệp vụ chính](docs/06_LUONG_NGHIEP_VU.md)
8. [Design patterns và quy ước code](docs/07_DESIGN_PATTERNS.md)
9. [Chạy, test và bàn giao](docs/08_CHAY_TEST_BAN_GIAO.md)
10. [Deploy Supabase, Render và Vercel](docs/10_DEPLOY_SUPABASE_RENDER_VERCEL.md)
11. [Flow chi tiết của dự án](docs/11_FLOW_CHI_TIET_DU_AN.md)
12. [Kịch bản demo dự án](docs/12_KICH_BAN_DEMO_DU_AN.md)

## Tóm tắt nhanh

- `FE/`: ứng dụng React + Vite + TypeScript, chịu trách nhiệm giao diện người dùng.
- `BE/`: Django REST Framework API, chịu trách nhiệm xử lý nghiệp vụ, phân quyền, database và prediction.
- `BE/ml_models/`: model Linear Regression và metadata dùng trực tiếp bởi backend.
- `supabase/`: cấu hình liên quan Supabase CLI/local project.
- `LinearRegressionModel/`: workspace huấn luyện và dữ liệu nguồn của model; backend runtime không phụ thuộc thư mục này.
- `docs/`: bộ tài liệu bàn giao chính thức, viết để người mới có thể đọc và trình bày lại dự án.

## Lệnh chạy local

Backend:

```powershell
cd BE
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Frontend:

```powershell
cd FE
npm install
npm run dev -- --host 127.0.0.1 --port 8080
```

Mở trình duyệt tại `http://127.0.0.1:8080`.
