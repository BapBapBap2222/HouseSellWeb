import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


RANDOM_STATE = 42
TARGET_COL = "price"
NUM_COLS = [
    "area",
    "floor_count",
    "bedroom_count",
    "bathroom_count",
    "province_market_score",
]
CAT_COLS = ["property_type_name", "province_name", "district_name", "ward_name"]
SOURCE_COLS = [*CAT_COLS, "area", "floor_count", "bedroom_count", "bathroom_count", TARGET_COL]

PROVINCE_MARKET_SCORES = {
    "Hà Nội": 2.10,
    "Hồ Chí Minh": 2.05,
    "Đà Nẵng": 1.05,
    "Hải Phòng": 1.02,
    "Bình Dương": 1.00,
    "Đồng Nai": 0.98,
    "Khánh Hòa": 0.96,
    "Quảng Ninh": 0.95,
    "Bà Rịa - Vũng Tàu": 0.95,
    "Cần Thơ": 0.93,
}
DEFAULT_MARKET_SCORE = 0.72


def get_market_score(province_name: str) -> float:
    return PROVINCE_MARKET_SCORES.get(str(province_name).strip(), DEFAULT_MARKET_SCORE)


def load_dataset(base_dir: Path) -> pd.DataFrame:
    data_dir = base_dir / "data" / "vietnam-real-estates"
    shards = sorted(data_dir.glob("shard_*.parquet"))
    if not shards:
        raise FileNotFoundError(f"No parquet shard found in: {data_dir}")

    frames = [pd.read_parquet(shard, columns=SOURCE_COLS) for shard in shards]
    return pd.concat(frames, ignore_index=True)


def clean_dataset(df: pd.DataFrame, sample_size: int = 300_000) -> pd.DataFrame:
    df = df.copy()
    df = df[pd.to_numeric(df[TARGET_COL], errors="coerce") > 0]

    for col in ["area", "floor_count", "bedroom_count", "bathroom_count", TARGET_COL]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in CAT_COLS:
        df[col] = df[col].fillna("NA").astype(str).str.strip()
        df.loc[df[col] == "", col] = "NA"

    df = df.dropna(subset=["area", TARGET_COL])
    df = df[(df["area"] >= 10) & (df["area"] <= 1000)]
    df = df[(df[TARGET_COL] >= 100_000_000) & (df[TARGET_COL] <= 500_000_000_000)]

    for col in ["floor_count", "bedroom_count", "bathroom_count"]:
        df[col] = df[col].clip(lower=0, upper=df[col].quantile(0.995))

    # Use robust clipping per square meter so the linear model is not dominated by bad listing prices.
    price_per_m2 = df[TARGET_COL] / df["area"]
    low, high = price_per_m2.quantile([0.02, 0.98])
    df = df[(price_per_m2 >= low) & (price_per_m2 <= high)]
    df["province_market_score"] = df["province_name"].map(get_market_score).astype(float)

    if len(df) > sample_size:
        df = df.sample(sample_size, random_state=RANDOM_STATE)

    return df.dropna(subset=[TARGET_COL])


def build_pipeline() -> TransformedTargetRegressor:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    category_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", min_frequency=20)),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUM_COLS),
            ("cat", category_pipeline, CAT_COLS),
        ]
    )
    regressor = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", Ridge(alpha=8.0)),
        ]
    )
    return TransformedTargetRegressor(
        regressor=regressor,
        func=np.log1p,
        inverse_func=np.expm1,
    )


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    model_dir = base_dir / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    print("Loading dataset...")
    raw_df = load_dataset(base_dir)
    print(f"Raw rows: {len(raw_df):,}")

    print("Cleaning dataset...")
    df = clean_dataset(raw_df)
    print(f"Rows after clean: {len(df):,}")

    x = df[CAT_COLS + NUM_COLS]
    y = df[TARGET_COL]
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
    )

    pipeline = build_pipeline()
    print("Training Ridge linear regression...")
    pipeline.fit(x_train, y_train)

    y_pred = pipeline.predict(x_test)
    metrics = {
        "dataset_source": "tinixai/vietnam-real-estates parquet shards",
        "model_type": "Ridge linear regression with log1p target",
        "mae": float(mean_absolute_error(y_test, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
        "r2": float(r2_score(y_test, y_pred)),
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "features": CAT_COLS + NUM_COLS,
        "province_coverage": int(df["province_name"].nunique()),
        "province_market_scores": PROVINCE_MARKET_SCORES,
        "default_market_score": DEFAULT_MARKET_SCORE,
    }

    model_path = model_dir / "lr_pipeline.joblib"
    vietname_model_path = model_dir / "vietname.pkl"
    metrics_path = model_dir / "lr_pipeline_metrics.json"
    joblib.dump(pipeline, model_path)
    joblib.dump(pipeline, vietname_model_path)
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved model: {model_path}")
    print(f"Saved model: {vietname_model_path}")
    print(f"Saved metrics: {metrics_path}")
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
