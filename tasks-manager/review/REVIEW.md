# REVIEW MEMORY

## Plan 010 draft created - 2026-04-07

- Da doc preflight: review + guide + rules + skill `writing-plans`.
- Da tao moi:
  - `tasks-manager/plan/plan-010.md`
  - `tasks-manager/task/plan-010/tasks.md`
- Scope plan 010 da chot:
  - seed ~100 property tu `vietnam-real-estates` parquet
  - tao ~10 users
  - tao 4-6 image URL/property
  - lien ket favorites + appointments de mo phong mua/ban/lien he
- Trang thai: moi o muc planning/tasking, chua bat dau implement runtime Plan 010.
## Plan 009 execution completed - 2026-04-07

### Viec da lam

- Hoan thien admin panel coverage:
  - `Be/accounts/admin.py`: register `UserProfile`.
  - `Be/properties/admin.py`: register `Property`, `PropertyImage`, `Favorite` + inline/filters/search.
  - `Be/prediction/admin.py`: ghi ro app khong co model DB.
- Chuan hoa deploy security baseline:
  - `Be/core/settings.py`:
    - guard bat buoc `DJANGO_SECRET_KEY` khi `DJANGO_DEBUG=False`.
    - guard bat buoc `DJANGO_ALLOWED_HOSTS` khi `DJANGO_DEBUG=False`.
    - bo sung `SWAGGER_PUBLIC` toggle theo env.
  - `Be/core/urls.py`:
    - docs permission class dong theo `SWAGGER_PUBLIC`.
- Bo sung docs readiness:
  - `Be/prediction/views.py`: them `swagger_auto_schema` cho request body.
- Bo sung test readiness:
  - `Be/accounts/tests.py`: them `DeployReadinessApiTests` (admin registry + swagger schema endpoint check).
  - `Be/appointments/views.py`: short-circuit `swagger_fake_view` de tranh schema generation error.
- Tao artifact V9:
  - `tasks-manager/task/plan-009/deploy-contract-mapping.md`
  - `tasks-manager/task/plan-009/deploy-regression-checklist.md`
  - `tasks-manager/task/plan-009/superuser-runbook.md`
  - `tasks-manager/task/plan-009/evidence/run-plan009-deploy-readiness-smoke.py`
  - `tasks-manager/task/plan-009/evidence/plan009-deploy-readiness-report.json`
  - `Be/.env.example`

### File da thay doi

- `Be/accounts/admin.py`
- `Be/properties/admin.py`
- `Be/prediction/admin.py`
- `Be/core/settings.py`
- `Be/core/urls.py`
- `Be/prediction/views.py`
- `Be/appointments/views.py`
- `Be/accounts/tests.py`
- `Be/.env.example`
- `tasks-manager/plan/plan-009.md`
- `tasks-manager/task/plan-009/tasks.md`
- `tasks-manager/task/plan-009/deploy-contract-mapping.md`
- `tasks-manager/task/plan-009/deploy-regression-checklist.md`
- `tasks-manager/task/plan-009/superuser-runbook.md`
- `tasks-manager/task/plan-009/evidence/run-plan009-deploy-readiness-smoke.py`
- `tasks-manager/task/plan-009/evidence/plan009-deploy-readiness-report.json`
- `tasks-manager/review/REVIEW.md`

### Verification

- Backend:
  - `python manage.py check` -> pass
  - `python manage.py makemigrations --check --dry-run` -> pass
  - `python manage.py test accounts properties appointments news prediction` -> pass (46 tests)
- Smoke V9:
  - `python tasks-manager/task/plan-009/evidence/run-plan009-deploy-readiness-smoke.py`
  - ket qua: C01..C08 = pass, `all_pass = true`

### Rui ro con lai

- Con warning non-blocking trong moi truong local:
  - `requests` dependency warning (`urllib3/chardet/charset_normalizer`).
  - JWT key-length warning khi test bang secret ngan (chi xuat hien o test env).

### Bai hoc rut ra

- Deploy guard o settings (fail-fast khi `DEBUG=False` ma thieu secret/hosts) giup tranh loi cau hinh production.
- Smoke script release-readiness giup xac minh nhanh admin/docs/security baseline truoc khi deploy.

### Buoc tiep theo de xuat

1. Dung secret >= 32 bytes trong env that (staging/prod) de bo JWT warning.
2. Neu can hardening hon, dat `SWAGGER_PUBLIC=false` cho staging/prod va bat buoc auth docs.
## Plan 009 draft created - 2026-04-07

- Da doc preflight: review + guide + rules + skills (`deploy`, `security-review`, `writing-plans`).
- Da tao moi:
  - `tasks-manager/plan/plan-009.md`
  - `tasks-manager/task/plan-009/tasks.md`
- Scope V9 chot theo guide: admin coverage, swagger docs readiness, deploy security baseline.
- Trang thai: moi o muc planning/tasking, chua bat dau implement runtime V9.
## Plan 008 execution completed - 2026-04-07

### Viec da lam

- Chot contract media V8 va tao artifact:
  - `tasks-manager/task/plan-008/media-contract-mapping.md`
  - `tasks-manager/task/plan-008/media-regression-checklist.md`
- Backend hardening media:
  - `Be/core/settings.py`:
    - them policy env cho upload image:
      - `PROPERTY_IMAGE_ALLOWED_TYPES`
      - `PROPERTY_IMAGE_MAX_UPLOAD_BYTES`
      - `PROPERTY_IMAGE_MAX_FILES_PER_UPLOAD`
      - `PROPERTY_IMAGE_MAX_FILES_PER_PROPERTY`
  - `Be/properties/services.py`:
    - validate `order >= 0`, caption length, mime/type, size, count limit.
    - enforce max files per upload/property.
    - hardening delete primary image -> auto promote image tiep theo.
  - `Be/properties/repositories.py`:
    - bo sung helper count/primary/first-image/set-primary.
  - `Be/properties/tests.py`:
    - mo rong test len 11 case cho media validation + owner boundary + primary fallback.
- Frontend sync media workflow:
  - `FE/src/lib/propertiesApi.ts`:
    - upload options (`caption`, `isPrimary`, `order`).
    - helper `normalizeListResponse`.
  - `FE/src/pages/AddProperty.tsx`:
    - bo mock submit, tao property that qua API, upload image that.
  - `FE/src/pages/ManageProperty.tsx`:
    - bo mock property/gallery, load/update property that, upload/delete image that.
  - `FE/src/pages/Listings.tsx`:
    - dung `normalizeListResponse`, giu render image qua `getImageUrl`.
- Tao evidence smoke V8:
  - script: `tasks-manager/task/plan-008/evidence/run-plan008-media-smoke.py`
  - report: `tasks-manager/task/plan-008/evidence/plan008-media-smoke-report.json`

### File da thay doi

- `Be/core/settings.py`
- `Be/properties/repositories.py`
- `Be/properties/services.py`
- `Be/properties/tests.py`
- `FE/src/lib/propertiesApi.ts`
- `FE/src/pages/AddProperty.tsx`
- `FE/src/pages/ManageProperty.tsx`
- `FE/src/pages/Listings.tsx`
- `FE/src/pages/Profile.tsx`
- `tasks-manager/plan/plan-008.md`
- `tasks-manager/task/plan-008/tasks.md`
- `tasks-manager/task/plan-008/media-contract-mapping.md`
- `tasks-manager/task/plan-008/media-regression-checklist.md`
- `tasks-manager/task/plan-008/evidence/run-plan008-media-smoke.py`
- `tasks-manager/task/plan-008/evidence/plan008-media-smoke-report.json`
- `tasks-manager/review/REVIEW.md`

### Verification

- Backend:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py check` -> pass
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py makemigrations --check --dry-run` -> pass
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test properties` -> pass (11 tests)
- Frontend:
  - `npm run build` -> pass
  - `npm run test -- --run` -> pass (1 test)
- Smoke:
  - `python tasks-manager/task/plan-008/evidence/run-plan008-media-smoke.py`
  - ket qua: C01..C10 = pass, `all_pass = true`
- Completion patch:
  - `npm run build` -> pass
  - `npm run test -- --run` -> pass
  - `python tasks-manager/task/plan-008/evidence/run-plan008-media-smoke.py` -> pass

### Rui ro con lai

- Da dong bo tab `Sell` trong `Profile` voi API `getMyProperties` (loading/empty/list states).
- Con warning non-blocking:
  - Python requests dependency warning.
  - Vite chunk-size warning.

### Bai hoc rut ra

- Hardening upload o service layer + test negative-path som giup chan regression de do.
- Tach ro contract media (request/response/policy) giup FE sync nhanh va giam hardcode.

### Buoc tiep theo de xuat

1. Can nhac bo sung image compression/thumbnail strategy neu anh upload tang nhanh.
## Plan 008 draft created - 2026-04-07

- Da doc lai rule + guide + local skills theo preflight cho phase V8 Media Files.
- Da tao moi:
  - `tasks-manager/plan/plan-008.md`
  - `tasks-manager/task/plan-008/tasks.md`
- Huong V8 duoc chot: media files e2e hardening (upload/delete/serving URL + FE sync Add/Manage).
- Trang thai: moi o muc planning/tasking, chua bat dau implement runtime V8.

## Plan 007 execution completed - 2026-04-07

### Viec da lam

- Thuc thi full Plan 007 (V7 CORS + FE-BE connectivity hardening).
- Chuan hoa FE API base contract:
  - `FE/src/lib/api.ts` dung `VITE_API_BASE_URL` + fallback `http://127.0.0.1:8000`.
  - refresh token flow dung `API_ORIGIN` thay hardcode.
- Chuan hoa helper URL anh:
  - `FE/src/lib/propertiesApi.ts` dung `API_ORIGIN`.
- Chuan hoa backend trust config:
  - `Be/core/settings.py` bo sung `CSRF_TRUSTED_ORIGINS` sync cung CORS env list.
- Tao artifact V7:
  - `tasks-manager/task/plan-007/connectivity-contract-mapping.md`
  - `tasks-manager/task/plan-007/connectivity-regression-checklist.md`
  - `tasks-manager/task/plan-007/evidence/run-plan007-connectivity-smoke.py`
  - `FE/scripts/run-plan007-browser-connectivity-smoke.mjs`
  - `FE/.env.example`

### File da thay doi

- `Be/core/settings.py`
- `FE/src/lib/api.ts`
- `FE/src/lib/propertiesApi.ts`
- `FE/.env.example`
- `FE/scripts/run-plan007-browser-connectivity-smoke.mjs`
- `tasks-manager/plan/plan-007.md`
- `tasks-manager/task/plan-007/tasks.md`
- `tasks-manager/task/plan-007/connectivity-contract-mapping.md`
- `tasks-manager/task/plan-007/connectivity-regression-checklist.md`
- `tasks-manager/task/plan-007/evidence/run-plan007-connectivity-smoke.py`
- `tasks-manager/review/REVIEW.md`

### Verification

- Backend smoke script V7: pass
  - `python ..\tasks-manager\task\plan-007\evidence\run-plan007-connectivity-smoke.py`
  - report: `tasks-manager/task/plan-007/evidence/plan007-connectivity-smoke-report.json`
- Backend verify: pass
  - `python manage.py check`
  - `python manage.py makemigrations --check --dry-run`
  - `python manage.py test properties appointments news prediction accounts` (38 tests)
- Frontend verify: pass
  - `npm run build`
  - `npm run test -- --run`
- Browser smoke origin 8080: pass (C01..C07)
  - `node FE/scripts/run-plan007-browser-connectivity-smoke.mjs`
  - report: `tasks-manager/task/plan-007/evidence/plan007-browser-connectivity-smoke-report.json`

### Rui ro con lai

- Van con warning non-blocking:
  - Python `requests` dependency version warning.
  - JWT dev secret length warning.
  - Vite chunk-size/dynamic-import warnings.

### Bai hoc rut ra

- Contract base URL theo env giup giam loi moi truong `localhost` vs `127.0.0.1`.
- Browser smoke tu origin FE thuc te la cach nhanh de bat loi CORS/auth khi ket noi.

### Buoc tiep theo de xuat

1. Chuan hoa bien moi truong cho staging/prod (`VITE_API_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `DJANGO_ALLOWED_HOSTS`).
2. Neu can hardening tiep, bo sung smoke refresh token expiry scenario va 401 replay.
## Plan 007 draft created - 2026-04-07

- Da doc lai rule, guide, skill theo preflight cho yeu cau V7.
- Da tao moi:
  - `tasks-manager/plan/plan-007.md`
  - `tasks-manager/task/plan-007/tasks.md`
- Huong V7 duoc chot: CORS + FE-BE connectivity hardening, smoke tren cong 8080.
- Trang thai: moi o muc planning/tasking, chua bat dau implement code runtime V7.
## Closure update (001 -> 006) - 2026-04-07

- Hoan tat cac task con pending:
  - Plan 002: `T020` -> DONE (6 flow smoke pass).
  - Plan 004: `T014` -> DONE (checklist duoc dien bang ket qua smoke).
  - Plan 005: `T015`, `T016` -> DONE (API + browser smoke + verify command).
- Tick lai dung theo evidence:
  - `tasks-manager/plan/plan-002.md`: thuc thi + verify = checked.
  - `tasks-manager/plan/plan-004.md`: thuc thi + verify = checked.
  - `tasks-manager/plan/plan-005.md`: thuc thi + verify = checked.
- Plan 003: khong co artifact plan/task trong repo, danh dau N/A.

### Evidence moi

- Plan 002 smoke:
  - `tasks-manager/task/plan-002/evidence/plan002-e2e-smoke-report.json`
- Plan 004 smoke:
  - `tasks-manager/task/plan-004/evidence/plan004-appointment-smoke-report.json`
- Plan 005 smoke:
  - API: `tasks-manager/task/plan-005/evidence/plan005-news-api-smoke-report.json`
  - FE browser C16/C17: `tasks-manager/task/plan-005/evidence/news-fe-c16-c17-report.json`

### 3-step verify (re-run)

1. Backend integrity:
   - `python manage.py check` -> pass
   - `python manage.py makemigrations --check --dry-run` -> pass
2. Backend regression tests:
   - `python manage.py test properties appointments news prediction accounts` -> pass (38 tests)
3. Frontend runtime checks:
   - `npm run build` -> pass
   - `npm run test -- --run` -> pass (1 test)
   - Browser smoke C16/C17 -> pass

### Non-blocking warnings

- `requests` dependency warning (`urllib3/chardet/charset_normalizer` versions) during Python commands.
- JWT warning: dev secret key length < 32 bytes.
- Vite warnings: large chunks + mixed static/dynamic import for `Footer`.
## Audit checkbox plan/task (001 -> 006) - 2026-04-07

- Ban ghi nay la moc audit tam thoi truoc khi closure.
- Trang thai moi nhat da duoc cap nhat tai section `Closure update (001 -> 006) - 2026-04-07` o phia tren.
## Cap nhat bo sung - Plan 006 smoke C05-C07 + gate closure (2026-04-07)

- Da chay browser smoke C05-C07 va PASS:
  - command: `node FE/scripts/run-c05-c07-smoke.mjs`
  - report: `tasks-manager/task/plan-006/evidence/c05-c07-smoke-report.json`
- Da dong toan bo task con pending trong plan-006:
  - `T012` (manual smoke) -> DONE
  - `T014` (legacy artifact policy) -> DONE
- Da rerun verify command:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` -> PASS (3 tests)
  - `npm run build` -> PASS
- 3 kiem tra bat buoc sau task:
  - Logic: PASS (payload schema V6 sync qua smoke C06)
  - Nghiep vu: PASS (fallback range 0.88/1.12 qua smoke C07)
  - Security: PASS (test internal error generic + khong leak path)
## Bo sung review tong hop (Plan 004 / 005 / 006) - 2026-04-07

### Plan 004 - Appointments (V4)

- Trang thai: DONE (co verify), con mot so risk moi truong.
- Da thuc hien:
  - Chuan hoa actor scope + validation + state transition cho Appointments (BE).
  - Dong bo FE theo contract (`updated_at`, slot time, cancel states).
  - Hoan tat contract/checklist artifact cho plan-004.
- Evidence:
  - `python manage.py test appointments` pass voi env SQLite override (12 tests).
  - `npm run build` pass.
- Risk ton dong:
  - MySQL local default chua san sang.
  - FE con mot so mock flow ngoai scope.

### Plan 005 - News hardening

- Trang thai: DONE (co verify), da co 2 moc review theo tien trinh T005 -> full hardening.
- Da thuc hien:
  - Chuan hoa `serializers/repositories/services/views/tests` cho app `news`.
  - Dong bo FE parse contract response moi.
  - Hoan tat contract/checklist artifact cho plan-005.
- Evidence:
  - `python manage.py test news` pass (giai doan full hardening: 16 tests).
  - `npm run build` pass.
- Risk ton dong:
  - Chua smoke browser day du checklist.
  - Bundle size warning la issue legacy.

### Plan 006 - Prediction V6 Vietnam dataset + vietnam.pkl

- Trang thai: DONE full (Logic/Nghiep vu/Security/Test = PASS, manual C05-C07 da dong).
- Da thuc hien:
  - Chuyen flow prediction sang schema Vietnam + artifact `vietnam.pkl`.
  - Dong bo BE/FE contract V6.
  - Hoan tat 3 task gate yeu cau:
    - Logic: dong bo formula FE/BE (`price_max = 1.12`).
    - Nghiep vu: FE fallback va output align rule business.
    - Security: bo sung test + harden error handling, khong leak path noi bo.
  - Cleanup text mojibake tren `PricePrediction.tsx`.
- Evidence:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` pass (3 tests).
  - `npm run build` pass.
  - Smoke C04 model-missing: `500` + body generic, khong leak path trong response.
  - Browser smoke C05-C07 pass:
    - command: `node FE/scripts/run-c05-c07-smoke.mjs`
    - report: `tasks-manager/task/plan-006/evidence/c05-c07-smoke-report.json`
- Risk ton dong:
  - MySQL local default chua san sang (dang verify qua SQLite override cho test command).
  - Artifact legacy California van duoc giu de tham chieu lich su, can tiep tuc quan tri scope de tranh nham runtime.

## Phien moi nhat (Plan 006 - V6 AI Prediction Vietnam dataset + vietnam.pkl)

### Viec da lam

- Da doi prediction flow sang du lieu Vietnam (`tinixai/vietnam-real-estates`).
- Da bo sung script train:
  - `LinearRegressionModel/train_vietnam_lr.py`
- Da train va xuat artifact:
  - `LinearRegressionModel/models/vietnam.pkl`
  - `LinearRegressionModel/models/lr_pipeline.joblib`
  - `LinearRegressionModel/models/lr_pipeline_metrics.json`
- Da cap nhat backend prediction:
  - `Be/prediction/serializers.py` (schema V6)
  - `Be/prediction/services.py` (uu tien load `vietnam.pkl`, fallback `lr_pipeline.joblib`)
  - `Be/prediction/tests.py` (valid + invalid payload)
- Da cap nhat frontend prediction:
  - `FE/src/pages/PricePrediction.tsx`
    - bo field/schema California
    - gui payload V6 (`province_name`, `property_type_name`, `area`, `floor_count`, `bedroom_count`, `bathroom_count`)
    - map center VN
    - bo block map image California
- Da cap nhat artifact plan/task V6:
  - `tasks-manager/plan/plan-006.md`
  - `tasks-manager/task/plan-006/tasks.md`
  - `tasks-manager/task/plan-006/prediction-contract-mapping.md`
  - `tasks-manager/task/plan-006/prediction-regression-checklist.md`

### Verification

- Backend:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` -> pass (3 tests).
  - Goi thu service local -> tra result hop le (`estimated_price`, `price_min`, `price_max`, `confidence`, `price_per_m2`).
- Frontend:
  - `npm run build` -> pass (co warning chunk size/dynamic import, khong chan build).
- Re-verify (2026-04-07):
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` -> pass (3 tests).
  - `npm run build` -> pass (warning non-blocking).
  - Smoke C04 (model missing): `500` + body generic, khong leak path trong response.
  - Smoke C05-C07 (browser): pass, co report JSON evidence.

### Rui ro con lai

- MySQL local khong san sang tren may hien tai, can env override SQLite de chay test.
- Con artifact legacy California trong `LinearRegressionModel` (notebook/data/model cu) co the gay nham context neu khong ghi ro policy runtime.

### Ket luan gate hien tai

- Logic: PASS.
- Nghiep vu: PASS.
- Security: PASS.
- Test: PASS (auto + browser smoke C05-C07).
- Da tach task gate rieng theo rule trong tasks Plan 006:
  - `T018` Logic, `T019` Nghiep vu, `T020` Security, `T021` Test runtime.

### Bai hoc rut ra

- Chot contract BE-FE truoc khi doi model giup giam mismatch payload.
- Uu tien model file primary + fallback runtime giup deploy an toan hon trong giai doan chuyen tiep.

### Buoc tiep theo de xuat

1. Neu can verify BE tren config mac dinh MySQL, bat lai MySQL local va rerun `python manage.py test prediction`.
2. Theo doi va tach ro artifact legacy California khoi runtime docs de tranh confusion.
3. Can nhac clean tiep text/docs mojibake neu con xuat hien o file ngoai `PricePrediction.tsx`.

## Phiên m?i nh?t (Plan 005 - tri?n khai BE/FE News hardening + verify)

### Vi?c dã làm

- Tri?n khai backend `news` theo contract plan-005:
  - `Be/news/serializers.py`:
    - B? sung validation `title`/`content` không cho blank sau khi trim.
    - Gi? `author`, `views_count` ? ch? d? read-only.
    - Chu?n hóa build absolute URL cho `thumbnail` khi có request context.
  - `Be/news/repositories.py`:
    - B? sung `increment_view_count()` dùng `F()` d? tang view count an toàn.
  - `Be/news/services.py`:
    - Chu?n hóa rule create/update/delete (author ho?c superuser cho mutate).
    - Thêm defense-in-depth: create ch? cho staff/superuser.
  - `Be/news/views.py`:
    - Chu?n hóa list/detail theo actor scope t?p trung t? repository.
    - Thêm pagination cho list (`NewsPagination`).
    - Chu?n hóa lu?ng tang view count trong `GET detail`.
    - Chu?n hóa response create/update/delete v?i serializer context d?y d?.
  - `Be/news/tests.py`:
    - M? r?ng test lên 16 case bao ph? list/detail scope, permission matrix mutate, validation, view count.
- Ð?ng b? frontend theo contract m?i:
  - `FE/src/lib/newsApi.ts`:
    - Chu?n hóa type `NewsListResponse` d? parse response paginated/array an toàn.
  - `FE/src/pages/News.tsx`:
    - Harden parse d? li?u list t? API.
    - Lo?i b? cast `any` trong lu?ng News card mapping.
    - Chu?n hóa typing cho chart tooltip callback và article card.
- Hoàn thi?n artifact c?a plan-005:
  - `tasks-manager/task/plan-005/news-contract-mapping.md`
  - `tasks-manager/task/plan-005/news-regression-checklist.md`

### File dã thay d?i

- `Be/news/serializers.py`
- `Be/news/repositories.py`
- `Be/news/services.py`
- `Be/news/views.py`
- `Be/news/tests.py`
- `FE/src/lib/newsApi.ts`
- `FE/src/pages/News.tsx`
- `tasks-manager/task/plan-005/news-contract-mapping.md`
- `tasks-manager/task/plan-005/news-regression-checklist.md`
- `tasks-manager/review/REVIEW.md`

### Verification

- Backend (SQLite env override):
  - `python manage.py check` -> pass.
  - `python manage.py makemigrations --check --dry-run` -> pass (`No changes detected`).
  - `python manage.py test news` -> pass (16 tests).
- Frontend:
  - `npm run build` -> pass (có warning chunk size/dynamic import, không ch?n build).
  - `npm run test -- --run` -> pass (1 test).

### R?i ro còn l?i

- Trang News FE hi?n v?n gi? nhi?u kh?i mock/UI data ngoài ph?m vi list/detail API sync (market chart, stats, province ranking).
- Chua ch?y manual browser smoke toàn b? checklist C01-C18 v?i d? li?u môi tru?ng th?t; m?i có auto verify command + test suite.
- Warning bundle size FE v?n t?n t?i (legacy issue toàn app).

### Bài h?c rút ra

- T?p trung actor scope ? repository + reuse ? view giúp gi?m l?ch logic list/detail.
- B? sung test matrix s?m giúp khóa regression permission tru?c khi d?ng b? FE.

### Bu?c ti?p theo d? xu?t

1. Ch?y manual smoke checklist `news-regression-checklist.md` trên môi tru?ng FE-BE dang ch?y.
2. N?u mu?n ch?t 1 response list duy nh?t vinh vi?n, cân nh?c enforce paginated-only ? m?i consumer FE (không gi? fallback array).
3. Cân nh?c tách chunk trang News d? gi?m warning bundle size.
## Phiên m?i nh?t (Plan 005 - th?c thi T005 News Repository)

### Vi?c dã làm

- Th?c thi `T005` c?a `plan-005`: chu?n hóa repository News theo actor scope.
- Refactor `Be/news/repositories.py`:
  - Thêm `_base_queryset()` dùng chung v?i `select_related("author")`.
  - Chu?n hóa `get_published_news()` và `get_all_news()`.
  - Thêm `get_actor_scope(user)` cho 3 nhóm:
    - Anonymous: ch? bài published.
    - Staff/Superuser: toàn b? bài.
    - User thu?ng: bài published + bài do chính user t?o.
  - Chu?n hóa `get_by_id()` v?i `NotFound` thay vì d? exception DB tr?i lên tr?c ti?p.
  - Thêm `get_by_id_for_actor()` d? h? tr? object-level access theo scope ngu?i dùng.

### File dã thay d?i

- `Be/news/repositories.py`
- `tasks-manager/review/REVIEW.md`

### Verification

- Ch?y backend check v?i SQLite local env override:
  - `python manage.py check` -> pass.
- Ch?y test module news:
  - `python manage.py test news` -> pass (3 tests).

### R?i ro còn l?i

- `views.py` chua dùng tr?c ti?p `get_by_id_for_actor()`; lu?ng chi ti?t hi?n v?n d?a vào queryset ? view.
- Test coverage c?a `news` hi?n m?i co b?n, chua bao ph? h?t permission matrix nâng cao (n?m ? các task sau c?a plan-005).

### Bài h?c rút ra

- Scope logic nên t?p trung ? repository s?m d? gi?m duplication ? view/service.
- Chu?n hóa `NotFound` ? repository giúp response API ?n d?nh hon cho FE.

### Bu?c ti?p theo d? xu?t

1. Làm `T006` d? khóa business rule create/update/delete/view count trong `services.py`.
2. Làm `T007` d? chu?n hóa permission + endpoint behavior ? `views.py`.
## Phiên m?i nh?t (Plan 004 - V4 App Appointments tri?n khai + verify)

### Vi?c dã làm

- Ð?c l?i rule preflight/planning/gates/review và tri?n khai theo `plan-004`.
- T?o tài li?u contract và checklist cho v4:
  - `tasks-manager/task/plan-004/appointment-contract-mapping.md`
  - `tasks-manager/task/plan-004/appointment-regression-checklist.md`
- Refactor backend Appointments:
  - `Be/appointments/repositories.py`:
    - Thêm actor scope query, `NotFound` handling, `select_related` nh?t quán.
  - `Be/appointments/serializers.py`:
    - B? sung validation ngày/gi?, ch?n d?t l?ch cho nhà c?a chính user, ch?n nhà không kh? d?ng.
    - B? sung `updated_at` vào response DTO.
  - `Be/appointments/services.py`:
    - Chu?n hóa ma tr?n chuy?n tr?ng thái theo vai trò requester/owner/admin.
    - Chu?n hóa quy?n h?y l?ch qua service th?ng nh?t.
  - `Be/appointments/views.py`:
    - Chu?n hóa queryset actor scope cho detail.
    - Chu?n hóa response message cho delete/status update.
  - `Be/appointments/tests.py`:
    - M? r?ng thành 12 test cho create/validation/status transitions/object-level access/admin path.
- Ð?ng b? frontend Appointments:
  - `FE/src/lib/appointmentsApi.ts`: thêm `updated_at` trong `Appointment` type.
  - `FE/src/components/common/ScheduleModal.tsx`:
    - Chu?n hóa slot gi? `HH:mm`, g?n gi? tr?c ti?p vào `Date` tru?c khi submit.
  - `FE/src/pages/AppointmentDetail.tsx`:
    - Cho phép nút cancel ? tr?ng thái `pending` và `confirmed` d? kh?p rule backend.

### File dã thay d?i

- `Be/appointments/repositories.py`
- `Be/appointments/serializers.py`
- `Be/appointments/services.py`
- `Be/appointments/views.py`
- `Be/appointments/tests.py`
- `FE/src/lib/appointmentsApi.ts`
- `FE/src/components/common/ScheduleModal.tsx`
- `FE/src/pages/AppointmentDetail.tsx`
- `tasks-manager/task/plan-004/appointment-contract-mapping.md`
- `tasks-manager/task/plan-004/appointment-regression-checklist.md`
- `tasks-manager/review/REVIEW.md`

### Verification

- Backend check/migration:
  - `python manage.py check` -> pass.
  - `python manage.py makemigrations --check --dry-run` -> pass (`No changes detected`).
- Backend tests:
  - V?i config m?c d?nh MySQL: `python manage.py test appointments` fail do thi?u quy?n DB local (`Access denied for user 'ADMIN'@'localhost'`).
  - V?i override env SQLite local:
    - `DB_ENGINE=django.db.backends.sqlite3`
    - `DB_NAME=db.sqlite3`
    - `python manage.py test appointments` -> pass (12 tests).
- Frontend:
  - `npm run build` -> pass.
  - `npm run test` -> pass (1 test).
  - `npm run lint` -> fail do l?i lint t?n t?i s?n ? nhi?u file ngoài ph?m vi Appointments.

### R?i ro còn l?i

- Môi tru?ng DB m?c d?nh (MySQL local) chua s?n sàng nên test backend m?c d?nh chua ch?y du?c.
- FE `ManageProperty` v?n dang dùng d? li?u mock cho appointment requests, chua n?i API owner appointments.
- Lint FE còn l?i legacy ngoài scope v4.

### Bài h?c rút ra

- C?n tách rõ 2 l?p ki?m th?:
  - verify logic theo test suite b?ng DB t?m (SQLite),
  - verify môi tru?ng th?t theo DB production-like (MySQL) d? tránh false confidence.
- Ch?t ma tr?n tr?ng thái ngay trong service giúp gi?m sai l?ch gi?a FE và BE.

### Bu?c ti?p theo d? xu?t

1. C?u hình bi?n môi tru?ng MySQL local chu?n d? test `manage.py test` ch?y b?ng default DB.
2. N?i `ManageProperty` v?i `GET /api/appointments/owner/` + `PATCH /status/` d? hoàn thi?n lu?ng owner.
3. D?n debt lint FE theo t?ng module (uu tiên file ngoài scope hi?n t?i).
## Phiên m?i nh?t (Plan 002 - tri?n khai FE detail + verify)

### Vi?c dã làm

- Ð?c l?i rule preflight và ti?p t?c tri?n khai code theo `plan-002`.
- Refactor `FE/src/pages/PropertyDetail.tsx`:
  - B? toàn b? mock property.
  - Fetch d? li?u th?t b?ng `getProperty(id)`.
  - Mapping ?nh t? `images`/`primary_image`.
  - K?t n?i toggle favorite qua API `toggleFavorite`.
  - K?t n?i booking t? detail b?ng `createAppointment`.
  - Thêm ki?m tra login + b?t bu?c có phone tru?c khi d?t l?ch.
- Refactor `FE/src/pages/AppointmentDetail.tsx`:
  - B? toàn b? mock appointment/property.
  - Fetch `getAppointmentDetails(id)` và fetch thêm property b?ng `getProperty`.
  - Hi?n th? tr?ng thái l?ch theo d? li?u BE th?c.
  - K?t n?i h?y l?ch th?t qua `cancelAppointment`.
- C?p nh?t `FE/src/components/common/ScheduleModal.tsx`:
  - M? r?ng callback `onSchedule` d? tr? thêm `selectedTime`, giúp submit time chu?n lên BE.
- Ð?ng b? artifact theo chu?n thu m?c singular:
  - `tasks-manager/task/plan-002/*`

### Verification

- FE build pass:
  - `npm install` (cài dependency FE local).
  - `npm run build` thành công.
- Không có l?i TypeScript/Vite block build.
- Có warning bundle size/chunking (không ch?n release local).

### R?i ro còn l?i

- `ScheduleModal` hi?n v?n dùng danh sách time mock c? d?nh ? UI.
- Lu?ng booking ph? thu?c profile có `phone`; user chua c?p nh?t phone s? b? ch?n d?t l?ch.
- FE chua có thông báo toast chu?n hóa (dang dùng inline error message ? các màn m?i s?a).

### Bu?c ti?p theo d? xu?t

1. Ch?y smoke test end-to-end theo checklist `fe-regression-checklist.md` (6 flow).
2. T?i uu chunk/bundle FE (warning >500kb).
3. B? sung test FE (component/integration) cho 2 màn detail v?a refactor.

## Phiên tru?c dó (Plan 002 - c?p nh?t l?i)

### Vi?c dã làm

- Ð?c l?i rule, guide và yêu c?u b?t bu?c tru?c khi c?p nh?t k? ho?ch.
- S?a l?i `plan-002` theo hu?ng rõ m?c tiêu BE + FE, có 4 c?ng ki?m tra b?t bu?c.
- S?a l?i `tasks-002` thành task atomic, m?i task g?n dúng 1 skill, có gate Logic/Nghi?p v?/Security/Test.
- Ð?ng b? file plan/task theo chu?n:
  - `tasks-manager/plan/plan-002.md`
  - `tasks-manager/task/plan-002/tasks.md`

### Verification

- Ðã xác nh?n t?n t?i d?y d? 4 file plan/task c?a Plan 002.
- Ðã xác nh?n n?i dung task có mapping skill + quality gates theo rule m?i.

### R?i ro còn l?i

- Chua b?t d?u code BE/FE nên các gi? d?nh regression m?i ? m?c k? ho?ch.
- C?n user duy?t Plan 002 tru?c khi chuy?n sang tri?n khai code.

### Bu?c ti?p theo d? xu?t

1. User review và duy?t `plan-002` + `tasks-002`.
2. Tri?n khai theo th? t? task, c?p nh?t review sau m?i phase.

## Phiên tru?c dó

### Vi?c dã làm

- So sánh guide v1/v2/v3 và ch?t hu?ng dùng v3.
- Ðánh giá code BE hi?n t?i và xác d?nh ph?n chua d?t v3 (tr?ng tâm `properties`).
- T?o rule b? sung:
  - plan tru?c r?i m?i task, xin duy?t r?i m?i code
  - luôn c?p nh?t review memory
  - làm BE ph?i sync contract v?i FE
  - task nh? + 1 skill/task + b?t bu?c qua quality gates

### Verification

- Các file rule dã du?c t?o/c?p nh?t trong `.claude/rules/`.
- Các file plan/task/review dã có c?u trúc d? v?n hành vòng l?p plan -> task -> review.




















