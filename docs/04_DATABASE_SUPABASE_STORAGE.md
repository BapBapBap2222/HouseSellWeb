# Database, Supabase và Storage

## Supabase dùng để làm gì?

Trong dự án này Supabase có hai vai trò:

- PostgreSQL database: lưu dữ liệu nghiệp vụ.
- Storage: lưu file upload như ảnh nhà, avatar, ảnh tin tức, giấy tờ xác minh.

Frontend không gọi Supabase trực tiếp trong flow chính. Frontend gọi Django API, Django mới làm việc với database/storage.

## Database là gì?

Database là nơi lưu dữ liệu lâu dài. Nếu tắt server rồi bật lại, dữ liệu vẫn còn trong database.

Ví dụ dữ liệu cần lưu:

- User.
- Profile.
- Property.
- Favorite.
- Appointment.
- Agent.
- Rating/comment.
- News.

## Các bảng chính

| Bảng/model | Ý nghĩa |
| --- | --- |
| `auth_user` | Tài khoản Django |
| `accounts_userprofile` | Profile mở rộng của user |
| `accounts_verificationrequest` | Yêu cầu xác minh seller |
| `properties_property` | Bất động sản |
| `properties_propertyimage` | Ảnh property |
| `properties_favorite` | Nhà user yêu thích |
| `appointments_appointment` | Lịch hẹn xem nhà |
| `agents_agent` | Hồ sơ agent/seller |
| `agents_agentreview` | Rating/comment agent |
| `news_news` | Tin tức |

## Quan hệ dữ liệu

```text
User 1-1 UserProfile
User 1-1 Agent
User 1-n Property
Property 1-n PropertyImage
User n-n Property thông qua Favorite
User 1-n Appointment
Property 1-n Appointment
Agent 1-n AgentReview
User 1-n AgentReview
```

## Migration là gì?

Migration là lịch sử thay đổi database.

Khi thêm field vào model, ví dụ `profile_visible`, phải tạo và chạy migration:

```powershell
python manage.py makemigrations
python manage.py migrate
```

Nếu code có field mới nhưng database chưa migrate, backend có thể lỗi.

## Biến môi trường database

Backend đọc cấu hình database từ `.env`:

```env
HSW_DB_ENGINE=django.db.backends.postgresql
HSW_DB_NAME=postgres
HSW_DB_USER=postgres.<project-ref>
HSW_DB_PASSWORD=<password>
HSW_DB_HOST=<pooler-host>
HSW_DB_PORT=5432
HSW_DB_SSLMODE=require
HSW_DB_SEARCH_PATH=housesell_db,public
```

Không commit password thật vào Git.

## Supabase Storage

Các bucket thường dùng:

- `property-images`
- `avatars`
- `verification-docs`

Backend cần:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

`SUPABASE_SERVICE_ROLE_KEY` là secret mạnh, chỉ để backend dùng.

## Lưu ý bảo mật

- Không commit `.env`.
- Không đưa database password vào docs.
- Không đưa service role key vào frontend.
- Frontend chỉ nên gọi Django API.

