# Prediction Contract Mapping - Plan 006

## 1) Contract tu Guide V3 (baseline)

### Endpoint baseline trong guide
- `POST /api/predict/`

### Request baseline trong guide
```json
{
  "area": 80,
  "bedrooms": 3,
  "bathrooms": 2,
  "district": "Quan 1",
  "city": "TP.HCM",
  "floor": 5,
  "year_built": 2015
}
```

### Response baseline trong guide
```json
{
  "predicted_price": 4500000000,
  "unit": "VND",
  "confidence": 0.87
}
```

## 2) Baseline code truoc V6

- Runtime endpoint: `POST /api/prediction/`.
- Payload California-based:
  - `latitude`, `longitude`, `total_rooms`, `total_bedrooms`, `housing_median_age`,
  - `population`, `households`, `median_income`, `ocean_proximity`.
- Service convert USD -> VND (gia lap theo California model).
- FE form co labels/map/image huong California.

## 3) Contract chot V6 (runtime final)

### 3.1 Endpoint
- `POST /api/prediction/`

### 3.2 Request V6

| Field | Type | Required | Rule |
|---|---|---|---|
| `province_name` | string | optional | default `Ha Noi` |
| `district_name` | string | optional | allow blank |
| `ward_name` | string | optional | allow blank |
| `property_type_name` | enum string | optional | default `Nha`, enum: Nha/Dat/Can ho chung cu/Biet thu-Nha lien ke/Shophouse |
| `area` | float | optional | min `>= 1`, default `80` |
| `floor_count` | float | optional | min `>= 0`, default `3` |
| `bedroom_count` | float | optional | min `>= 0`, default `3` |
| `bathroom_count` | float | optional | min `>= 0`, default `2` |

### 3.3 Response V6

| Field | Type | Meaning |
|---|---|---|
| `estimated_price` | int | gia du doan (VND) |
| `price_min` | int | can duoi khoang gia |
| `price_max` | int | can tren khoang gia |
| `confidence` | float | do tin cay he thong |
| `price_per_m2` | int | gia/m2 du doan |

### 3.4 Error contract

| Tinh huong | Status | Shape |
|---|---|---|
| Serializer validation fail | 400 | `{ "error": { ...field errors... } }` |
| ValueError trong service | 400 | `{ "error": "..." }` |
| Model file missing/unknown error | 500 | `{ "error": "Internal server error." }` |

## 4) Mapping guide -> runtime V6

| Muc | Guide V3 | Runtime V6 |
|---|---|---|
| Endpoint | `/api/predict/` | `/api/prediction/` |
| Location fields | `city`, `district` | `province_name`, `district_name`, `ward_name` |
| Property type | khong explicit enum | `property_type_name` enum |
| Numeric fields | `area`, `bedrooms`, `bathrooms`, `floor`, `year_built` | `area`, `floor_count`, `bedroom_count`, `bathroom_count` |
| Response key | `predicted_price`, `unit` | `estimated_price`, `price_min`, `price_max`, `price_per_m2`, `confidence` |

## 5) Model artifact mapping

| Item | Runtime rule |
|---|---|
| Primary model file | `LinearRegressionModel/models/vietnam.pkl` |
| Fallback model file | `LinearRegressionModel/models/lr_pipeline.joblib` |
| Training script | `LinearRegressionModel/train_vietnam_lr.py` |
| Metrics artifact | `LinearRegressionModel/models/lr_pipeline_metrics.json` |

## 6) FE sync points

- File: `FE/src/pages/PricePrediction.tsx`
- Da sync:
  - payload gui dung schema V6
  - form fields bo schema California
  - map center VN
  - bo khoi map image California

## 7) Trang thai contract (2026-04-07)

- Contract V6 da duoc implement BE+FE.
- Checklist regression da dong C05-C07 (browser smoke report co evidence).
- Verify runtime:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction` pass.
  - `npm run build` pass.

## 8) Policy artifact legacy California

- `housing.csv`, `california_housing_model.pkl`, notebook theory duoc giu lai de:
  - tham chieu lich su migration schema.
  - ho tro fallback/rollback trong truong hop can doi soat mo hinh cu.
- Runtime V6 khong dung artifact California.
- Runtime chi dung:
  - primary: `LinearRegressionModel/models/vietnam.pkl`
  - fallback compat: `LinearRegressionModel/models/lr_pipeline.joblib`
