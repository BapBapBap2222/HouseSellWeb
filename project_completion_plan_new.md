# Theo dõi hoàn thiện dự án trên nhánh new

Ngày cập nhật: 02/06/2026

## Trạng thái nhánh

- Nhánh đang làm: `new`
- Remote đang track: `origin/new`
- Mục tiêu: giữ toàn bộ phần đã làm trước đó, đồng thời khôi phục đúng dữ liệu/model predict từ `tinixai/vietnam-real-estates`.

## Dữ liệu predict đã khôi phục

Đã copy lại từ nhánh backup `predone-from-main-backup` sang `new`:

- `LinearRegressionModel/data/tinixai_vietnam_real_estates_sample.csv`
- `LinearRegressionModel/data/tinixai_vietnam_real_estates_geo_sample.csv`
- `LinearRegressionModel/data/tinixai_vietnam_real_estates_market_coverage.csv`
- `LinearRegressionModel/data/tinixai_vietnam_real_estates_augmented.csv`
- `LinearRegressionModel/models/vietname.pkl`
- `LinearRegressionModel/models/vietname_metadata.json`
- `LinearRegressionModel/train_vietnam_model.py`

Dataset gốc Hugging Face vẫn còn trong:

- `LinearRegressionModel/data/vietnam-real-estates/shard_0000.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0001.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0002.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0003.parquet`
- `LinearRegressionModel/data/vietnam-real-estates/shard_0004.parquet`

## Model đang dùng

- Model production: `LinearRegressionModel/models/vietname.pkl`
- Model alias: `LinearRegressionModel/models/lr_pipeline.joblib`
- Hai file trên đã được đồng bộ cùng một model.
- Loại model: `Ridge linear regression with log-transformed target`
- Không dùng mô hình phi tuyến.
- Metadata/metrics:
  - Source: `tinixai/vietnam-real-estates`
  - Training rows: `35000`
  - Province coverage: `63`
  - R2: `0.9463`
  - MAE: `1059705107` VND

## Logic prediction đã sửa

- Backend `PredictionService` tự đọc schema feature từ model hoặc metadata.
- Model tinixai augmented dùng đúng các feature:
  - `property_type_name`
  - `province_name`
  - `district_name`
  - `area`
  - `area_log`
  - `floor_count`
  - `bedroom_count`
  - `bathroom_count`
  - `latitude`
  - `longitude`
- API vẫn nhận `ward_name` từ FE, nhưng model hiện tại không dùng feature này nếu metadata không yêu cầu.
- Có guardrail vùng để Hà Nội/Hồ Chí Minh không bị thấp hơn miền Trung với cùng thông số nhà.

## Giá kiểm tra nhanh

Cùng một căn nhà mẫu: `80m2`, `3 tầng`, `3 phòng ngủ`, `2 phòng tắm`, loại `Nhà`.

- Hồ Chí Minh: khoảng `17.66 tỷ`
- Hà Nội: khoảng `17.30 tỷ`
- Đà Nẵng: khoảng `7.36 tỷ`
- Quảng Nam: khoảng `4.58 tỷ`
- Quảng Ngãi: khoảng `3.96 tỷ`

Lý do chỉnh ngày 02/06/2026:

- Baseline cũ đặt Quảng Nam `32 triệu/m2`, Quảng Ngãi `24 triệu/m2`, lại bị backend giảm multiplier, nên giá ra quá thấp.
- Baseline mới đặt Quảng Nam `48 triệu/m2`, Quảng Ngãi `42 triệu/m2`.
- Backend không còn kéo giảm riêng Quảng Nam/Quảng Ngãi.
- Test prediction đã thêm ngưỡng tối thiểu để tránh hồi quy về giá quá rẻ:
  - Quảng Nam phải lớn hơn `4 tỷ` cho căn mẫu.
  - Quảng Ngãi phải lớn hơn `3.5 tỷ` cho căn mẫu.

## Kiểm thử đã chạy

- `python LinearRegressionModel/train_vietnam_lr.py`: pass
- `python manage.py test prediction`: pass 8/8
- `python manage.py test`: pass 51/51
- `npm run build`: pass
- `npm run test`: pass 1/1

## Lưu ý

- `train_vietnam_lr.py` hiện là wrapper gọi `train_vietnam_model.py`, để không train nhầm sang pipeline parquet cũ.
- Nếu deploy production, Render phải redeploy backend để nhận lại model `vietname.pkl` mới.
