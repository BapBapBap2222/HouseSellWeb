# Prediction Linear Regression

## Mục tiêu

Module prediction dùng Linear Regression để ước lượng giá nhà tại Việt Nam. Người dùng nhập thông tin nhà, backend trả về giá dự đoán.

## Vì sao dùng Linear Regression?

Đề tài yêu cầu Linear Regression, nên model runtime là mô hình hồi quy tuyến tính. Linear Regression có ưu điểm:

- Dễ giải thích.
- Train nhanh.
- Phù hợp demo học thuật.
- Dễ đóng gói vào backend.

Dự án không dùng non-linear model cho prediction chính.

## File liên quan

```text
BE/ml_models/
  vietnam.pkl
  lr_pipeline.joblib
  vietnam_metadata.json
  lr_pipeline_metrics.json

BE/prediction/
  serializers.py
  services.py
  views.py
  urls.py
  tests.py

LinearRegressionModel/
  data/
  models/
  train_vietnam_lr.py
```

Backend runtime dùng `BE/ml_models`. Thư mục `LinearRegressionModel` dùng khi train lại hoặc kiểm tra dữ liệu nguồn.

## Luồng prediction

```text
User nhập form ở /prediction
  -> FE gọi POST /api/prediction/
  -> Serializer validate input
  -> PredictionService load model
  -> Service tạo DataFrame đúng feature
  -> model.predict()
  -> Service tạo estimated_price, price_min, price_max
  -> FE hiển thị kết quả
```

## Payload ví dụ

```json
{
  "province_name": "Hồ Chí Minh",
  "district_name": "Quận 1",
  "ward_name": "Bến Nghé",
  "property_type_name": "Nhà",
  "area": 80,
  "floor_count": 3,
  "bedroom_count": 3,
  "bathroom_count": 2,
  "latitude": 10.7769,
  "longitude": 106.7009
}
```

## Response ví dụ

```json
{
  "estimated_price": 8500000000,
  "price_min": 7480000000,
  "price_max": 9520000000,
  "confidence": 0.8,
  "price_per_m2": 106250000
}
```

## Validate input

Serializer kiểm tra:

- `latitude` trong khoảng 8-24.
- `longitude` trong khoảng 102-110.
- `area >= 1`.
- Số tầng/phòng ngủ/phòng tắm không âm.
- Loại bất động sản thuộc danh sách cho phép.

Input sai trả 400, không để lỗi 500.

## Calibration

Service có hệ số hiệu chỉnh theo vùng để kết quả hợp lý hơn. Ví dụ Hà Nội và Hồ Chí Minh thường có giá cao hơn nhiều khu vực khác.

Điểm cần nói khi thuyết trình:

> Model chính vẫn là Linear Regression. Calibration chỉ là bước hiệu chỉnh nghiệp vụ sau dự đoán để tránh kết quả quá thấp hoặc phi thực tế ở một số tỉnh/thành.

