# Plan 006 - V6 AI Price Prediction (Vietnam Dataset)

## Checklist Tien Do

- [x] Da tao plan
- [x] Da thuc thi plan
- [x] Da verify ket qua
- [x] Da cap nhat task + review
## Skill orchestration dung cho ke hoach nay

- `writing-plans`: chia phase/task atomic, ro input/output/dependency.
- `software-architecture`: chot contract BE-FE va mapping guide -> code.
- `django-pro`: chuan hoa endpoint serializer/view/service prediction.
- `python-pro`: service logic + model loading + error handling.
- `python-testing-patterns`: test matrix API prediction + verify command.
- `typescript-pro`: dong bo payload/response FE theo contract BE.
- `backend-security-coder`: input validation, error response, khong leak internal path.

## Muc tieu

1. Chuyen V6 prediction sang du lieu Vietnam (`tinixai/vietnam-real-estates`).
2. Model runtime cua BE phai nhan tu file `LinearRegressionModel/models/vietnam.pkl`.
3. Endpoint `/api/prediction/` nhan payload schema Vietnam va tra response nhat quan cho FE.
4. FE `PricePrediction` gui dung payload moi, hien thi ket qua on dinh, khong phu thuoc schema California.
5. Co artifact contract/checklist va evidence verify theo 4 gate.

## Baseline truoc V6

- Prediction flow cu theo schema California (`ocean_proximity`, `total_rooms`, `median_income`, ...).
- FE form/map/noi dung dang huong California.
- Model runtime chua chot theo `vietnam.pkl`.
- Guide v3 co endpoint mau `/api/predict/` va payload generic, can mapping sang implementation thuc te.

## Trang thai cap nhat theo code hien tai (as-built)

- Da co script train model Vietnam:
  - `LinearRegressionModel/train_vietnam_lr.py`
- Da export model:
  - `LinearRegressionModel/models/vietnam.pkl`
  - `LinearRegressionModel/models/lr_pipeline.joblib` (compat fallback)
  - `LinearRegressionModel/models/lr_pipeline_metrics.json`
- BE prediction da doi schema Vietnam:
  - `Be/prediction/serializers.py`
  - `Be/prediction/services.py`
  - `Be/prediction/tests.py`
- FE prediction da doi payload/schema Vietnam:
  - `FE/src/pages/PricePrediction.tsx`
  - Da xu ly:
    - FE fallback `price_max` da dong bo 1.12 theo BE.
    - FE da parse object error thanh message than thien.
    - FE da cleanup chuoi UI mojibake tren trang prediction.
- Verify da chay:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` -> pass.
  - `npm run build` (FE) -> pass.
  - Browser smoke C05-C07 -> pass (`node FE/scripts/run-c05-c07-smoke.mjs`).

## Scope chi tiet

### Backend

- Endpoint runtime su dung: `POST /api/prediction/`.
- Request contract V6:
  - `province_name`
  - `district_name` (optional)
  - `ward_name` (optional)
  - `property_type_name`
  - `area`
  - `floor_count`
  - `bedroom_count`
  - `bathroom_count`
- Response contract V6:
  - `estimated_price`
  - `price_min`
  - `price_max`
  - `confidence`
  - `price_per_m2`
- Model loading rule:
  - Uu tien `vietnam.pkl`.
  - Fallback `lr_pipeline.joblib` (tam thoi de safe runtime).

### Frontend

- Form input va payload gui BE phai khop request contract V6.
- UI bo phu thuoc field California.
- Error state va fallback state hoat dong on dinh khi API fail.
- Validation error tu BE (`{ error: { field: [...] } }`) phai duoc parse ra text de hien thi than thien.
- Fallback result local phai canh chuan business formula voi BE (`min=0.88`, `max=1.12`).

### ML Artifact

- Script train co the reproducible tren local.
- Co metrics file luu thong so co ban (`mae`, `rmse`, `r2`, features).

## Out of scope

- Toi uu chat luong model nang cao (feature engineering sau, model phi-tuyen).
- Build pipeline MLOps day du (registry/versioning/CI retrain).
- Dong bo toan bo notebook ly thuyet cu (California) trong cung sprint.
- Refactor tong the UI/UX cua trang prediction.

## Done criteria

1. `prediction-contract-mapping.md` chot ro guide vs runtime contract.
2. `PredictionService` load duoc `vietnam.pkl` va du doan thanh cong.
3. Serializer validate dung schema V6, reject payload sai.
4. FE gui dung payload V6 va render ket qua tu API.
5. Backend test `prediction` pass.
6. FE build pass.
7. Co `prediction-regression-checklist.md` va co ket qua pass/fail + evidence.
8. `tasks-manager/review/REVIEW.md` duoc cap nhat cho Plan 006.
9. FE xu ly dung error shape object cua BE va render message de doc.
10. FE fallback range align voi BE (`price_max` theo 1.12).

## 4 cong kiem tra bat buoc

### Gate 1 - Logic
- Request/response schema khop giua serializer, service, FE payload.
- Model input columns khop feature_names cua model da train.

### Gate 2 - Nghiep vu
- Du doan tra ve theo don vi VND va co khoang gia (`price_min`, `price_max`).
- Form FE phan anh dung data can cho du doan gia BDS Viet Nam.

### Gate 3 - Security
- Input numeric co min_value/range check.
- Khong tra stacktrace/path model noi bo ra ngoai API response.

### Gate 4 - Test chay thuc te
- `python manage.py test prediction` pass.
- `npm run build` pass.
- Smoke manual API + FE flow pass theo checklist.

## Task gate bat buoc (theo rule)

- Gate Logic: `T018` (tasks.md)
- Gate Nghiep vu: `T019` (tasks.md)
- Gate Security: `T020` (tasks.md)
- Gate Test runtime: `T021` (tasks.md)
- Quy uoc: khong duoc danh dau complete plan neu T018/T019/T020/T021 chua co evidence.

## Trang thai gate hien tai (2026-04-07)

| Gate | Trang thai | Evidence |
|---|---|---|
| Logic | PASS | Contract mapping + payload/schema BE-FE dong bo; FE fallback `price_max` da align 1.12 |
| Nghiep vu | PASS | Response VND + range dung rule business; FE form theo schema VN va fallback formula khop BE |
| Security | PASS | Serializer min/range + response generic 500; da test model-missing va khong leak path trong response |
| Test | PASS | `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` pass (3 tests), `npm run build` pass, browser smoke C05-C07 pass |

## Deliverables

- `tasks-manager/plan/plan-006.md`
- `tasks-manager/task/plan-006/tasks.md`
- `tasks-manager/task/plan-006/prediction-contract-mapping.md`
- `tasks-manager/task/plan-006/prediction-regression-checklist.md`
- `tasks-manager/review/REVIEW.md` (cap nhat Plan 006)


