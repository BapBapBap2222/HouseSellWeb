import json
import math
import os
import joblib
import pandas as pd
from django.conf import settings


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
REGIONAL_CALIBRATION_MULTIPLIERS = {
    "Hà Nội": 1.18,
    "Hồ Chí Minh": 1.20,
    "Đà Nẵng": 0.94,
    "Quảng Nam": 1.00,
    "Quảng Ngãi": 1.00,
}


def get_market_score(province_name: str) -> float:
    return PROVINCE_MARKET_SCORES.get(str(province_name).strip(), DEFAULT_MARKET_SCORE)


class PredictionService:
    """Service Layer for Vietnam house price prediction."""

    _model_pipeline = None
    _model_features = None

    @classmethod
    def _get_model_dir(cls):
        return os.path.join(settings.BASE_DIR, "ml_models")

    @classmethod
    def get_model(cls):
        """Lazy-load machine learning model."""
        if cls._model_pipeline is None:
            model_dir = cls._get_model_dir()
            model_path = os.path.join(model_dir, "vietnam.pkl")
            fallback_path = os.path.join(model_dir, "lr_pipeline.joblib")
            if not os.path.exists(model_path) and os.path.exists(fallback_path):
                model_path = fallback_path
            if not os.path.exists(model_path):
                raise FileNotFoundError(
                    "Machine learning model file not found. Expected 'vietnam.pkl'."
                )
            cls._model_pipeline = joblib.load(model_path)
        return cls._model_pipeline

    @classmethod
    def get_model_features(cls) -> list[str]:
        """Return the exact feature order expected by the loaded model."""
        if cls._model_features is not None:
            return cls._model_features

        model = cls.get_model()
        feature_names = getattr(model, "feature_names_in_", None)
        if feature_names is not None:
            cls._model_features = [str(feature) for feature in feature_names]
            return cls._model_features

        metadata_path = os.path.join(cls._get_model_dir(), "vietnam_metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r", encoding="utf-8") as metadata_file:
                metadata = json.load(metadata_file)
            metadata_features = metadata.get("feature_columns") or metadata.get("features")
            if metadata_features:
                cls._model_features = [str(feature) for feature in metadata_features]
                return cls._model_features

        cls._model_features = [
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
        return cls._model_features

    @staticmethod
    def predict_price(data: dict) -> dict:
        """
        Takes raw input dict, processes it, and returns the prediction result dict.
        Raises ValueError or FileNotFoundError if validation or model loading fails.
        """
        # 1. Extract and normalize variables from vietnam-real-estates schema.
        try:
            province_name = str(data.get("province_name", "Hà Nội")).strip() or "Hà Nội"
            district_name = str(data.get("district_name", "")).strip()
            ward_name = str(data.get("ward_name", "")).strip()
            property_type_name = str(data.get("property_type_name", "Nhà")).strip() or "Nhà"
            area = float(data.get("area", 80.0))
            floor_count = float(data.get("floor_count", 3.0))
            bedroom_count = float(data.get("bedroom_count", 3.0))
            bathroom_count = float(data.get("bathroom_count", 2.0))
            latitude = float(data.get("latitude"))
            longitude = float(data.get("longitude"))
        except (TypeError, ValueError):
            raise ValueError("Invalid numerical values provided in the payload.")

        if area <= 0:
            raise ValueError("Field 'area' must be greater than 0.")
        if floor_count < 0 or bedroom_count < 0 or bathroom_count < 0:
            raise ValueError("floor_count, bedroom_count, bathroom_count must be >= 0.")
        if not (8.0 <= latitude <= 24.0 and 102.0 <= longitude <= 110.0):
            raise ValueError("Coordinates must be inside Vietnam.")

        # 2. Create DataFrame in the exact schema expected by the loaded model.
        feature_values = {
            "property_type_name": property_type_name,
            "province_name": province_name,
            "district_name": district_name or "NA",
            "ward_name": ward_name or "NA",
            "area": area,
            "area_log": math.log1p(area),
            "floor_count": floor_count,
            "bedroom_count": bedroom_count,
            "bathroom_count": bathroom_count,
            "latitude": latitude,
            "longitude": longitude,
            "province_market_score": get_market_score(province_name),
        }
        feature_columns = PredictionService.get_model_features()
        input_data = pd.DataFrame(
            [{feature: feature_values.get(feature, "NA") for feature in feature_columns}],
            columns=feature_columns,
        )

        # 3. Load model and predict.
        pipeline = PredictionService.get_model()
        predicted_price_vnd = float(pipeline.predict(input_data)[0])
        predicted_price_vnd *= REGIONAL_CALIBRATION_MULTIPLIERS.get(province_name, 1.0)
        if predicted_price_vnd <= 0:
            predicted_price_vnd = 100_000_000.0

        # 4. Construct business response.
        price_min = predicted_price_vnd * 0.88
        price_max = predicted_price_vnd * 1.12
        price_per_m2 = predicted_price_vnd / area
        confidence = 0.80

        return {
            "estimated_price": round(predicted_price_vnd),
            "price_min": round(price_min),
            "price_max": round(price_max),
            "confidence": confidence,
            "price_per_m2": round(price_per_m2),
        }
