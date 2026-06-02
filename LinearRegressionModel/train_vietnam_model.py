from __future__ import annotations

import hashlib
import json
from pathlib import Path
from time import sleep

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
MODEL_DIR = ROOT_DIR / "models"

RAW_SAMPLE_PATH = DATA_DIR / "tinixai_vietnam_real_estates_sample.csv"
GEO_SAMPLE_PATH = DATA_DIR / "tinixai_vietnam_real_estates_geo_sample.csv"
COVERAGE_PATH = DATA_DIR / "tinixai_vietnam_real_estates_market_coverage.csv"
AUGMENTED_PATH = DATA_DIR / "tinixai_vietnam_real_estates_augmented.csv"
MODEL_PATH = MODEL_DIR / "vietname.pkl"
METADATA_PATH = MODEL_DIR / "vietname_metadata.json"
PIPELINE_MODEL_PATH = MODEL_DIR / "lr_pipeline.joblib"
PIPELINE_METRICS_PATH = MODEL_DIR / "lr_pipeline_metrics.json"

HF_ROWS_API = "https://datasets-server.huggingface.co/rows"
HF_DATASET = "tinixai/vietnam-real-estates"
HF_CONFIG = "default"
HF_SPLIT = "train"
HF_TOTAL_ROWS = 3_500_744

RANDOM_SEED = 42
RAW_TARGET_ROWS = 2_000
AUGMENTED_TARGET_ROWS = 35_000
BATCH_SIZE = 100

PROPERTY_TYPES = {"Nhà", "Đất", "Căn hộ chung cư", "Biệt thự/Nhà liền kề", "Shophouse"}
PROPERTY_TYPE_MULTIPLIERS = {
    "Đất": 0.95,
    "Nhà": 1.0,
    "Căn hộ chung cư": 0.72,
    "Biệt thự/Nhà liền kề": 1.25,
    "Shophouse": 1.45,
}

# Practical market guardrails for old 63-province data. Values are VND/m2 for a
# typical urban house plot and are blended with Hugging Face observations.
PROVINCE_PRICE_M2: dict[str, float] = {
    "Hồ Chí Minh": 165_000_000,
    "Hà Nội": 145_000_000,
    "Đà Nẵng": 78_000_000,
    "Khánh Hòa": 70_000_000,
    "Bình Dương": 58_000_000,
    "Bà Rịa - Vũng Tàu": 56_000_000,
    "Quảng Ninh": 54_000_000,
    "Hải Phòng": 52_000_000,
    "Đồng Nai": 48_000_000,
    "Bắc Ninh": 46_000_000,
    "Hưng Yên": 42_000_000,
    "Long An": 40_000_000,
    "Cần Thơ": 40_000_000,
    "Kiên Giang": 38_000_000,
    "Lâm Đồng": 38_000_000,
    "Vĩnh Phúc": 36_000_000,
    "Hải Dương": 34_000_000,
    "Thái Nguyên": 34_000_000,
    "Quảng Nam": 32_000_000,
    "Bình Thuận": 32_000_000,
    "Thanh Hóa": 31_000_000,
    "Nghệ An": 30_000_000,
    "Bình Định": 30_000_000,
    "Thừa Thiên Huế": 30_000_000,
    "Ninh Bình": 29_000_000,
    "Bình Phước": 28_000_000,
    "Tây Ninh": 28_000_000,
    "Tiền Giang": 28_000_000,
    "Đắk Lắk": 27_000_000,
    "Lào Cai": 27_000_000,
    "An Giang": 26_000_000,
    "Bến Tre": 26_000_000,
    "Đồng Tháp": 26_000_000,
    "Phú Yên": 26_000_000,
    "Hà Nam": 25_000_000,
    "Nam Định": 25_000_000,
    "Thái Bình": 25_000_000,
    "Vĩnh Long": 25_000_000,
    "Quảng Ngãi": 24_000_000,
    "Sóc Trăng": 24_000_000,
    "Bạc Liêu": 24_000_000,
    "Cà Mau": 24_000_000,
    "Hậu Giang": 23_000_000,
    "Trà Vinh": 23_000_000,
    "Gia Lai": 23_000_000,
    "Đắk Nông": 22_000_000,
    "Quảng Bình": 22_000_000,
    "Ninh Thuận": 22_000_000,
    "Bắc Giang": 22_000_000,
    "Hà Tĩnh": 21_000_000,
    "Phú Thọ": 21_000_000,
    "Hòa Bình": 20_000_000,
    "Tuyên Quang": 19_000_000,
    "Yên Bái": 19_000_000,
    "Lạng Sơn": 19_000_000,
    "Sơn La": 18_000_000,
    "Quảng Trị": 18_000_000,
    "Kon Tum": 18_000_000,
    "Hà Giang": 17_000_000,
    "Cao Bằng": 17_000_000,
    "Bắc Kạn": 17_000_000,
    "Lai Châu": 16_000_000,
    "Điện Biên": 16_000_000,
}

HIGH_MARKET_PROVINCES = {"Hồ Chí Minh", "Hà Nội"}
UPPER_MID_MARKET_PROVINCES = {
    "Đà Nẵng",
    "Khánh Hòa",
    "Bình Dương",
    "Bà Rịa - Vũng Tàu",
    "Quảng Ninh",
    "Hải Phòng",
    "Đồng Nai",
    "Bắc Ninh",
}

PROVINCE_COORDS: dict[str, tuple[float, float]] = {
    "An Giang": (10.5216, 105.1259),
    "Bà Rịa - Vũng Tàu": (10.5417, 107.2429),
    "Bạc Liêu": (9.2940, 105.7278),
    "Bắc Giang": (21.2731, 106.1946),
    "Bắc Kạn": (22.1470, 105.8348),
    "Bắc Ninh": (21.1861, 106.0763),
    "Bến Tre": (10.2433, 106.3756),
    "Bình Dương": (10.9804, 106.6519),
    "Bình Định": (13.7820, 109.2190),
    "Bình Phước": (11.7512, 106.7235),
    "Bình Thuận": (10.9333, 108.1000),
    "Cà Mau": (9.1768, 105.1524),
    "Cần Thơ": (10.0452, 105.7469),
    "Cao Bằng": (22.6666, 106.2639),
    "Đà Nẵng": (16.0471, 108.2068),
    "Đắk Lắk": (12.6662, 108.0382),
    "Đắk Nông": (12.2646, 107.6098),
    "Điện Biên": (21.3860, 103.0230),
    "Đồng Nai": (10.9574, 106.8427),
    "Đồng Tháp": (10.4938, 105.6882),
    "Gia Lai": (13.9833, 108.0000),
    "Hà Giang": (22.8233, 104.9836),
    "Hà Nam": (20.5835, 105.9227),
    "Hà Nội": (21.0285, 105.8542),
    "Hà Tĩnh": (18.3428, 105.9057),
    "Hải Dương": (20.9373, 106.3146),
    "Hải Phòng": (20.8449, 106.6881),
    "Hậu Giang": (9.7845, 105.4701),
    "Hòa Bình": (20.8133, 105.3383),
    "Hồ Chí Minh": (10.7769, 106.7009),
    "Hưng Yên": (20.6464, 106.0511),
    "Khánh Hòa": (12.2388, 109.1967),
    "Kiên Giang": (10.0125, 105.0809),
    "Kon Tum": (14.3545, 108.0076),
    "Lai Châu": (22.3862, 103.4708),
    "Lâm Đồng": (11.9404, 108.4583),
    "Lạng Sơn": (21.8526, 106.7610),
    "Lào Cai": (22.4856, 103.9707),
    "Long An": (10.6956, 106.2431),
    "Nam Định": (20.4388, 106.1621),
    "Nghệ An": (18.6796, 105.6813),
    "Ninh Bình": (20.2506, 105.9744),
    "Ninh Thuận": (11.5643, 108.9886),
    "Phú Thọ": (21.2684, 105.2046),
    "Phú Yên": (13.0955, 109.3207),
    "Quảng Bình": (17.4689, 106.6223),
    "Quảng Nam": (15.5394, 108.0191),
    "Quảng Ngãi": (15.1214, 108.8044),
    "Quảng Ninh": (20.9712, 107.0448),
    "Quảng Trị": (16.7500, 107.2000),
    "Sóc Trăng": (9.6025, 105.9739),
    "Sơn La": (21.3280, 103.9140),
    "Tây Ninh": (11.3100, 106.0983),
    "Thái Bình": (20.4463, 106.3366),
    "Thái Nguyên": (21.5942, 105.8482),
    "Thanh Hóa": (19.8077, 105.7764),
    "Thừa Thiên Huế": (16.4637, 107.5909),
    "Tiền Giang": (10.4493, 106.3421),
    "Trà Vinh": (9.9347, 106.3453),
    "Tuyên Quang": (21.8236, 105.2180),
    "Vĩnh Long": (10.2537, 105.9722),
    "Vĩnh Phúc": (21.3089, 105.6049),
    "Yên Bái": (21.7229, 104.9113),
}

DISTRICT_COORD_OVERRIDES: dict[tuple[str, str], tuple[float, float]] = {
    ("Hà Nội", "Cầu Giấy"): (21.0362, 105.7906),
    ("Hà Nội", "Đống Đa"): (21.0181, 105.8296),
    ("Hà Nội", "Tây Hồ"): (21.0717, 105.8190),
    ("Hà Nội", "Bắc Từ Liêm"): (21.0730, 105.7704),
    ("Hà Nội", "Hà Đông"): (20.9712, 105.7788),
    ("Hà Nội", "Long Biên"): (21.0405, 105.8889),
    ("Hà Nội", "Thanh Xuân"): (20.9947, 105.7994),
    ("Hồ Chí Minh", "1"): (10.7769, 106.7009),
    ("Hồ Chí Minh", "3"): (10.7840, 106.6848),
    ("Hồ Chí Minh", "7"): (10.7320, 106.7218),
    ("Hồ Chí Minh", "8"): (10.7241, 106.6286),
    ("Hồ Chí Minh", "10"): (10.7732, 106.6678),
    ("Hồ Chí Minh", "12"): (10.8672, 106.6413),
    ("Hồ Chí Minh", "Tân Bình"): (10.8015, 106.6526),
    ("Hồ Chí Minh", "Tân Phú"): (10.7901, 106.6289),
    ("Hồ Chí Minh", "Bình Thạnh"): (10.8057, 106.7140),
    ("Hồ Chí Minh", "Thủ Đức"): (10.8494, 106.7537),
    ("Đà Nẵng", "Hải Châu"): (16.0471, 108.2068),
    ("Đà Nẵng", "Sơn Trà"): (16.1065, 108.2520),
    ("Đà Nẵng", "Cẩm Lệ"): (16.0156, 108.1985),
    ("Khánh Hòa", "Nha Trang"): (12.2388, 109.1967),
    ("Đồng Nai", "Biên Hòa"): (10.9574, 106.8427),
    ("Bình Dương", "Dĩ An"): (10.9068, 106.7694),
}


def stable_jitter(*parts: object, scale: float = 0.035) -> tuple[float, float]:
    raw = "|".join("" if part is None else str(part) for part in parts)
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    lat_unit = int.from_bytes(digest[:4], "big") / 2**32
    lng_unit = int.from_bytes(digest[4:8], "big") / 2**32
    return (lat_unit - 0.5) * scale, (lng_unit - 0.5) * scale


def fetch_hf_sample(force_refresh: bool = False) -> pd.DataFrame:
    if RAW_SAMPLE_PATH.exists() and not force_refresh:
        cached_df = pd.read_csv(RAW_SAMPLE_PATH)
        if len(cached_df) >= RAW_TARGET_ROWS:
            return cached_df

    offsets = np.linspace(
        0,
        HF_TOTAL_ROWS - BATCH_SIZE,
        num=int(np.ceil(RAW_TARGET_ROWS / BATCH_SIZE)),
        dtype=int,
    )
    records: list[dict] = []

    for index, offset in enumerate(offsets, start=1):
        response = requests.get(
            HF_ROWS_API,
            params={
                "dataset": HF_DATASET,
                "config": HF_CONFIG,
                "split": HF_SPLIT,
                "offset": int(offset),
                "length": BATCH_SIZE,
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        records.extend(item["row"] for item in payload.get("rows", []))
        pd.DataFrame(records).to_csv(RAW_SAMPLE_PATH, index=False)
        print(
            f"Fetched batch {index}/{len(offsets)} at offset {offset} ({len(records)} rows)",
            flush=True,
        )
        sleep(0.05)

    df = pd.DataFrame(records)
    RAW_SAMPLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_SAMPLE_PATH, index=False)
    return df


def normalize_text(value: object, default: str = "") -> str:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return default
    text = str(value).strip()
    return text if text and text.lower() != "nan" else default


def target_price_for_record(row: dict) -> float:
    province = normalize_text(row.get("province_name"), "Hà Nội")
    property_type = normalize_text(row.get("property_type_name"), "Nhà")
    area = max(10.0, float(row.get("area") or 80.0))
    floor_count = max(0.0, float(row.get("floor_count") or 0.0))
    bedroom_count = max(0.0, float(row.get("bedroom_count") or 0.0))
    bathroom_count = max(0.0, float(row.get("bathroom_count") or 0.0))

    base_price_m2 = PROVINCE_PRICE_M2.get(province, 22_000_000)
    type_multiplier = PROPERTY_TYPE_MULTIPLIERS.get(property_type, 1.0)

    if property_type == "Đất":
        structure_multiplier = 1.0
    elif property_type == "Căn hộ chung cư":
        structure_multiplier = 1.0 + min(max(bedroom_count - 2, -1), 3) * 0.035
    else:
        structure_multiplier = (
            1.0
            + min(max(floor_count - 1, 0), 7) * 0.045
            + min(bedroom_count, 8) * 0.012
            + min(bathroom_count, 8) * 0.01
        )

    return max(300_000_000.0, area * base_price_m2 * type_multiplier * structure_multiplier)


def apply_market_calibration(df: pd.DataFrame) -> pd.DataFrame:
    calibrated = df.copy()
    province_counts = calibrated["province_name"].value_counts()
    prices = []

    for row in calibrated.to_dict("records"):
        observed_price = float(row["price"])
        observed_price_m2 = observed_price / max(10.0, float(row["area"]))
        observed_price_m2 = float(np.clip(observed_price_m2, 5_000_000, 350_000_000))
        observed_price = observed_price_m2 * max(10.0, float(row["area"]))
        target_price = target_price_for_record(row)

        province = normalize_text(row.get("province_name"))
        count = int(province_counts.get(province, 0))
        observed_weight = 0.45 if count >= 25 else 0.22
        if province in HIGH_MARKET_PROVINCES:
            observed_weight = 0.35
        elif province in UPPER_MID_MARKET_PROVINCES:
            observed_weight = min(observed_weight, 0.4)

        blended_price = observed_price * observed_weight + target_price * (1 - observed_weight)
        prices.append(round(float(np.clip(blended_price, 300_000_000, 120_000_000_000))))

    calibrated["price"] = prices
    return calibrated


def clean_real_estate_data(raw_df: pd.DataFrame) -> pd.DataFrame:
    df = raw_df.copy()

    for col in [
        "property_type_name",
        "province_name",
        "district_name",
        "ward_name",
        "street_name",
        "project_name",
    ]:
        if col not in df.columns:
            df[col] = ""
        df[col] = df[col].map(normalize_text)

    numeric_cols = [
        "price",
        "area",
        "floor_count",
        "bedroom_count",
        "bathroom_count",
        "frontage_width",
        "house_depth",
        "road_width",
    ]
    for col in numeric_cols:
        if col not in df.columns:
            df[col] = np.nan
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df[
        df["property_type_name"].isin(PROPERTY_TYPES)
        & df["province_name"].isin(PROVINCE_COORDS)
        & df["price"].between(300_000_000, 120_000_000_000)
        & df["area"].between(10, 2_000)
    ].copy()

    df["floor_count"] = df["floor_count"].fillna(
        df.groupby("property_type_name")["floor_count"].transform("median")
    )
    df["bedroom_count"] = df["bedroom_count"].fillna(
        df.groupby("property_type_name")["bedroom_count"].transform("median")
    )
    df["bathroom_count"] = df["bathroom_count"].fillna(
        df.groupby("property_type_name")["bathroom_count"].transform("median")
    )

    for col, default in [("floor_count", 0), ("bedroom_count", 0), ("bathroom_count", 0)]:
        df[col] = df[col].fillna(default).clip(lower=0)

    land_mask = df["property_type_name"].eq("Đất")
    df.loc[land_mask, ["floor_count", "bedroom_count", "bathroom_count"]] = 0
    apartment_mask = df["property_type_name"].eq("Căn hộ chung cư")
    df.loc[apartment_mask, "floor_count"] = df.loc[apartment_mask, "floor_count"].clip(upper=60)

    df["floor_count"] = df["floor_count"].clip(0, 80)
    df["bedroom_count"] = df["bedroom_count"].clip(0, 30)
    df["bathroom_count"] = df["bathroom_count"].clip(0, 30)

    df = apply_market_calibration(df)
    return df.reset_index(drop=True)


def make_coverage_records() -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED + 7)
    records = []
    template_areas = [45, 60, 80, 120, 180]

    for province, (base_lat, base_lng) in PROVINCE_COORDS.items():
        districts = [
            district
            for province_name, district in DISTRICT_COORD_OVERRIDES
            if province_name == province
        ] or ["Trung tâm"]

        for property_type in sorted(PROPERTY_TYPES):
            for district in districts[:4]:
                for area in template_areas:
                    floor_count = 0 if property_type == "Đất" else float(rng.choice([1, 2, 3, 4, 5]))
                    bedroom_count = 0 if property_type == "Đất" else float(rng.choice([1, 2, 3, 4, 5]))
                    bathroom_count = 0 if property_type == "Đất" else float(rng.choice([1, 2, 3, 4]))
                    jitter_lat, jitter_lng = stable_jitter(province, district, property_type, area, scale=0.05)
                    record = {
                        "name": f"{property_type} {district} {province}",
                        "description": "Coverage row generated from market priors and Hugging Face schema.",
                        "property_type_name": property_type,
                        "province_name": province,
                        "district_name": district,
                        "ward_name": "",
                        "street_name": "",
                        "project_name": "",
                        "area": float(area),
                        "floor_count": floor_count,
                        "bedroom_count": bedroom_count,
                        "bathroom_count": bathroom_count,
                        "latitude": round(base_lat + jitter_lat, 6),
                        "longitude": round(base_lng + jitter_lng, 6),
                    }
                    noise = rng.uniform(0.94, 1.06)
                    record["price"] = round(target_price_for_record(record) * noise)
                    records.append(record)

    return pd.DataFrame(records)


def add_synthetic_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    records = []
    for row in df.to_dict("records"):
        province = normalize_text(row.get("province_name"))
        district = normalize_text(row.get("district_name"))
        base_lat, base_lng = DISTRICT_COORD_OVERRIDES.get(
            (province, district),
            PROVINCE_COORDS.get(province, (16.0, 106.0)),
        )
        jitter_lat, jitter_lng = stable_jitter(
            province,
            district,
            row.get("ward_name"),
            row.get("street_name"),
            row.get("project_name"),
        )
        row["latitude"] = round(base_lat + jitter_lat, 6)
        row["longitude"] = round(base_lng + jitter_lng, 6)
        records.append(row)

    geo_df = pd.DataFrame(records)
    geo_df.to_csv(GEO_SAMPLE_PATH, index=False)
    return geo_df


def augment_records(geo_df: pd.DataFrame) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)
    base_records = geo_df.to_dict("records")
    repeats = int(np.ceil(AUGMENTED_TARGET_ROWS / max(1, len(base_records))))
    records = []

    for row in base_records:
        records.append(row)
        for _ in range(max(0, repeats - 1)):
            area_ratio = rng.uniform(0.92, 1.08)
            price_ratio = rng.uniform(0.88, 1.12)
            house_type = row["property_type_name"]
            floors = float(row["floor_count"])
            bedrooms = float(row["bedroom_count"])
            bathrooms = float(row["bathroom_count"])

            if house_type not in {"Đất", "Căn hộ chung cư"}:
                floors = max(1.0, floors + rng.choice([-1, 0, 0, 1]))
            if house_type != "Đất":
                bedrooms = max(1.0, bedrooms + rng.choice([-1, 0, 0, 1]))
                bathrooms = max(1.0, bathrooms + rng.choice([-1, 0, 0, 1]))

            augmented = {
                **row,
                "area": round(max(10.0, float(row["area"]) * area_ratio), 2),
                "floor_count": floors,
                "bedroom_count": bedrooms,
                "bathroom_count": bathrooms,
                "latitude": round(float(row["latitude"]) + rng.uniform(-0.004, 0.004), 6),
                "longitude": round(float(row["longitude"]) + rng.uniform(-0.004, 0.004), 6),
                "price": round(max(300_000_000.0, float(row["price"]) * price_ratio * (0.75 + area_ratio * 0.25))),
            }
            records.append(augmented)

    augmented_df = (
        pd.DataFrame(records)
        .sample(min(AUGMENTED_TARGET_ROWS, len(records)), random_state=RANDOM_SEED)
        .reset_index(drop=True)
    )
    augmented_df.to_csv(AUGMENTED_PATH, index=False)
    return augmented_df


def train_model(
    dataset: pd.DataFrame,
    raw_rows: int,
    clean_geo_rows: int,
) -> tuple[TransformedTargetRegressor, dict]:
    feature_columns = [
        "property_type_name",
        "province_name",
        "district_name",
        "area",
        "area_log",
        "floor_count",
        "bedroom_count",
        "bathroom_count",
        "latitude",
        "longitude",
    ]
    target_column = "price"
    numeric_columns = ["area", "area_log", "floor_count", "bedroom_count", "bathroom_count", "latitude", "longitude"]
    categorical_columns = ["property_type_name", "province_name", "district_name"]

    dataset = dataset.copy()
    dataset["area_log"] = np.log1p(dataset["area"].clip(lower=1))
    model_df = dataset[feature_columns + [target_column]].dropna().copy()
    x_train, x_test, y_train, y_test = train_test_split(
        model_df[feature_columns],
        model_df[target_column],
        test_size=0.2,
        random_state=RANDOM_SEED,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), numeric_columns),
            ("category", OneHotEncoder(handle_unknown="ignore"), categorical_columns),
        ]
    )
    pipeline = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("regressor", Ridge(alpha=2.0)),
        ]
    )
    model = TransformedTargetRegressor(
        regressor=pipeline,
        func=np.log1p,
        inverse_func=np.expm1,
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    metrics = {
        "source_dataset": HF_DATASET,
        "source_license": "cc-by-nc-4.0",
        "source_rows_total": HF_TOTAL_ROWS,
        "raw_sample_rows": raw_rows,
        "clean_geo_rows": clean_geo_rows,
        "coverage_rows": int((dataset.get("is_market_coverage", False) == True).sum()) if "is_market_coverage" in dataset.columns else 0,
        "training_rows": int(len(model_df)),
        "training_province_count": int(model_df["province_name"].nunique()),
        "expected_province_count": len(PROVINCE_COORDS),
        "feature_columns": feature_columns,
        "target_column": target_column,
        "model_type": "Ridge linear regression with log-transformed target",
        "mae_vnd": round(float(mean_absolute_error(y_test, predictions))),
        "r2": round(float(r2_score(y_test, predictions)), 4),
        "model_file": MODEL_PATH.name,
        "pipeline_file": PIPELINE_MODEL_PATH.name,
        "market_calibration_note": "Raw Hugging Face observations are blended with practical province-level VND/m2 guardrails, then coverage rows are added so all 63 old provinces are represented.",
        "coordinate_note": "Dataset does not provide coordinates. Coordinates are assigned from province/district centers with deterministic ward/street jitter, then lightly augmented.",
    }
    return model, metrics


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    raw_df = fetch_hf_sample()
    clean_df = clean_real_estate_data(raw_df)
    geo_df = add_synthetic_coordinates(clean_df)
    geo_df["is_market_coverage"] = False
    coverage_df = make_coverage_records()
    coverage_df["is_market_coverage"] = True
    coverage_df.to_csv(COVERAGE_PATH, index=False)
    base_df = pd.concat([geo_df, coverage_df], ignore_index=True)
    augmented_df = augment_records(base_df)
    model, metrics = train_model(
        augmented_df,
        raw_rows=len(raw_df),
        clean_geo_rows=len(geo_df),
    )

    joblib.dump(model, MODEL_PATH)
    joblib.dump(model, PIPELINE_MODEL_PATH)
    metrics_json = json.dumps(metrics, ensure_ascii=False, indent=2)
    METADATA_PATH.write_text(metrics_json, encoding="utf-8")
    PIPELINE_METRICS_PATH.write_text(metrics_json, encoding="utf-8")

    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
