# Prediction Regression Checklist - Plan 006

## Muc tieu
- Smoke test nhanh luong prediction V6 theo schema Vietnam.
- Xac nhan contract BE-FE khong mismatch sau khi doi model + payload.

## Chuan bi
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:8080`
- Model file ton tai:
  - `LinearRegressionModel/models/vietnam.pkl`
- Co it nhat 1 bo input hop le:
  - province_name=Ha Noi
  - property_type_name=Nha
  - area=80, floor_count=4, bedroom_count=3, bathroom_count=3

## Checklist

### C01 - API valid payload
- Buoc:
  1. `POST /api/prediction/` voi payload hop le.
- Ky vong:
  - `200`
  - Co du keys: `estimated_price`, `price_min`, `price_max`, `confidence`, `price_per_m2`.

### C02 - API invalid enum
- Buoc:
  1. `POST /api/prediction/` voi `property_type_name=UNKNOWN`.
- Ky vong:
  - `400`
  - Co field error cho enum.

### C03 - API invalid area
- Buoc:
  1. `POST /api/prediction/` voi `area=0`.
- Ky vong:
  - `400`
  - Bao loi `area` min_value.

### C04 - Model file missing handling
- Buoc:
  1. Tam doi ten `vietnam.pkl` va fallback file.
  2. Goi API prediction.
- Ky vong:
  - `500`
  - Khong leak stacktrace/path noi bo trong body.

### C05 - FE form validation
- Buoc:
  1. Mo trang `/prediction`.
  2. Submit khi thieu field bat buoc.
- Ky vong:
  - Khong call API.
  - Hien thong bao loi form.

### C06 - FE -> BE payload sync
- Buoc:
  1. Fill form hop le.
  2. Submit va quan sat request trong Network.
- Ky vong:
  - Request body dung schema V6.
  - API response render dung card ket qua.

### C07 - FE fallback when API fail
- Buoc:
  1. Tat backend hoac force 500.
  2. Submit form.
- Ky vong:
  - Trang khong crash.
  - Hien fallback result an toan.

### C08 - Backend test command
- Buoc:
  1. Chay `python manage.py test prediction`.
- Ky vong:
  - Pass.

### C09 - Frontend build command
- Buoc:
  1. Chay `npm run build` trong `FE`.
- Ky vong:
  - Pass (warning non-blocking duoc ghi nhan).

### C10 - FE hien thi serializer error object than thien
- Buoc:
  1. Submit payload sai enum/area de BE tra `{ error: { ... } }`.
- Ky vong:
  - UI hien message de doc cho nguoi dung.
  - Khong hien chuoi `[object Object]`.

### C11 - FE fallback range align voi BE
- Buoc:
  1. Force FE di vao fallback mode (tat BE).
  2. Submit form hop le.
- Ky vong:
  - `price_min` = `estimated_price * 0.88`
  - `price_max` = `estimated_price * 1.12`

## Ket qua thuc thi (dien khi chay)

| Check | Ket qua | Evidence/Ghi chu |
|---|---|---|
| C01 | PASS | Service call local tra ket qua day du keys |
| C02 | PASS | Covered trong `test_prediction_rejects_invalid_payload` |
| C03 | PASS | Covered trong `test_prediction_rejects_invalid_payload` |
| C04 | PASS | Da smoke model-missing: `500` + body `Internal server error.` + khong leak path |
| C05 | PASS | Browser smoke (`FE/scripts/run-c05-c07-smoke.mjs`): submit thieu field, `predictionRequestCount=0`, hien loi form |
| C06 | PASS | Browser smoke: capture request body dung schema V6 + render heading `Ket qua du doan` |
| C07 | PASS | Browser smoke: force network fail, trang khong crash, hien fallback card (4.40 ty - 5.60 ty) |
| C08 | PASS | `python manage.py test prediction` pass (3 tests) |
| C09 | PASS | `npm run build` pass |
| C10 | PASS | FE da parse object error qua helper `normalizeApiErrorMessage(...)` |
| C11 | PASS | FE fallback da doi thanh `price_max * 1.12` |

## Auto verification da chay

- Backend:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` -> pass (3 tests).
- Frontend:
  - `npm run build` -> pass (co warning chunk size/dynamic import, khong chan build).
- Browser smoke:
  - `node FE/scripts/run-c05-c07-smoke.mjs` -> pass C05/C06/C07.
  - Report: `tasks-manager/task/plan-006/evidence/c05-c07-smoke-report.json`.
