# Mục lục và cách đọc

Tài liệu này thay cho các plan/guide cũ. Mục tiêu là để một người chưa biết dự án, thậm chí chưa biết Django, vẫn có thể hiểu:

- Dự án giải quyết bài toán gì.
- Frontend, backend, database và model prediction phối hợp với nhau như thế nào.
- Mỗi thư mục dùng để làm gì.
- Mỗi module nghiệp vụ có trách nhiệm gì.
- Vì sao dự án chia code như hiện tại.
- Khi thuyết trình hoặc bảo vệ dự án thì nên nói những ý nào.

## Nếu bạn chưa biết gì, đọc theo thứ tự này

1. Đọc `09_HUONG_DAN_NHAP_MON_CHO_NGUOI_MOI.md` trước. File này giải thích từ nền tảng: Django là gì, React là gì, API là gì, request chạy qua đâu.
2. Đọc `01_TONG_QUAN_KIEN_TRUC.md` để nắm bức tranh tổng thể.
3. Đọc `02_BACKEND_DJANGO_API.md` để hiểu backend Django REST Framework.
4. Đọc `03_FRONTEND_REACT.md` để hiểu frontend React.
5. Đọc `04_DATABASE_SUPABASE_STORAGE.md` để hiểu database, Supabase và upload file.
6. Đọc `05_PREDICTION_LINEAR_REGRESSION.md` để hiểu phần dự đoán giá nhà.
7. Đọc `06_LUONG_NGHIEP_VU.md` để hiểu các flow chính: đăng nhập, listing, favorite, appointment, seller, rating.
8. Đọc `07_DESIGN_PATTERNS.md` để nắm các pattern dùng trong code.
9. Đọc `08_CHAY_TEST_BAN_GIAO.md` để biết cách chạy, test và bàn giao.
10. Đọc `10_DEPLOY_SUPABASE_RENDER_VERCEL.md` để biết cách đưa dự án lên production bằng Supabase, backend Render và frontend Vercel.
11. Đọc `11_FLOW_CHI_TIET_DU_AN.md` để hiểu sâu request chạy qua từng lớp: frontend route, API client, Django URL/view/serializer/service/repository/model, database, storage và prediction.
12. Đọc `12_KICH_BAN_DEMO_DU_AN.md` để có kịch bản demo, lời thoại, checklist và cách xử lý lỗi khi trình bày.

## Cách hiểu dự án trong một câu

HouseSellWeb là một web bất động sản full-stack: React hiển thị giao diện, Django REST Framework cung cấp API, Supabase PostgreSQL lưu dữ liệu, Supabase Storage lưu file upload, và backend dùng model Linear Regression trong `BE/ml_models` để dự đoán giá nhà.

## Cách trình bày nhanh trong 2-3 phút

Có thể nói như sau:

> Dự án của em là website bất động sản gồm frontend React và backend Django REST Framework. Người dùng có thể xem danh sách nhà bán/cho thuê, lọc theo giá/địa điểm/loại nhà, lưu yêu thích, đặt lịch xem nhà, seller có thể đăng và quản lý nhà, agent có profile riêng và nhận rating/comment. Backend được chia theo domain như `accounts`, `properties`, `appointments`, `agents`, `news`, `prediction`. Dữ liệu lưu trong PostgreSQL trên Supabase, file upload lưu qua Supabase Storage. Phần prediction dùng Linear Regression, model được đóng gói trong `BE/ml_models` và backend expose endpoint `/api/prediction/`. Code backend áp dụng Repository-Service-Serializer để tách query, business logic và API contract.

## Những phần đã được dọn dẹp

- Đã xóa các plan/tracking cũ trong `tasks-manager`.
- Đã xóa các guide backend version cũ để tránh nội dung lỗi thời.
- Đã gom tài liệu chính vào `docs/`.
- Không đưa secret vào tài liệu; biến môi trường chỉ được mô tả bằng placeholder.
