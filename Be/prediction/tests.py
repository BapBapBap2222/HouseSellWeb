from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from sklearn.linear_model import Ridge


class PricePredictionApiTests(APITestCase):
    @patch("prediction.views.PredictionService.predict_price")
    def test_prediction_success_with_valid_payload(self, mock_predict):
        mock_predict.return_value = {
            "estimated_price": 1000000000,
            "price_min": 900000000,
            "price_max": 1100000000,
            "confidence": 0.82,
            "price_per_m2": 12500000,
        }
        payload = {
            "province_name": "Hà Nội",
            "district_name": "Cầu Giấy",
            "ward_name": "Dịch Vọng",
            "property_type_name": "Nhà",
            "area": 80,
            "floor_count": 4,
            "bedroom_count": 3,
            "bathroom_count": 3,
            "latitude": 21.0362,
            "longitude": 105.7906,
        }
        response = self.client.post(reverse("price-prediction"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("estimated_price", response.data)
        mock_predict.assert_called_once()

    @patch("prediction.views.PredictionService.predict_price")
    def test_prediction_rejects_invalid_payload(self, mock_predict):
        payload = {"area": 0, "property_type_name": "UNKNOWN"}
        response = self.client.post(reverse("price-prediction"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        mock_predict.assert_not_called()

    @patch("prediction.views.PredictionService.predict_price")
    def test_prediction_hides_internal_error_details(self, mock_predict):
        mock_predict.side_effect = FileNotFoundError(
            "Machine learning model file not found at /secret/models/vietnam.pkl"
        )
        payload = {
            "province_name": "Ha Noi",
            "property_type_name": "Nhà",
            "area": 80,
            "floor_count": 4,
            "bedroom_count": 3,
            "bathroom_count": 3,
            "latitude": 21.0362,
            "longitude": 105.7906,
        }
        response = self.client.post(reverse("price-prediction"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data.get("error"), "Internal server error.")
        self.assertNotIn("secret", str(response.data))

    def test_prediction_rejects_missing_coordinates(self):
        payload = {
            "province_name": "Hà Nội",
            "district_name": "Cầu Giấy",
            "property_type_name": "Nhà",
            "area": 80,
            "floor_count": 4,
            "bedroom_count": 3,
            "bathroom_count": 3,
        }
        response = self.client.post(reverse("price-prediction"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_prediction_rejects_coordinates_outside_vietnam(self):
        payload = {
            "province_name": "Hà Nội",
            "district_name": "Cầu Giấy",
            "property_type_name": "Nhà",
            "area": 80,
            "floor_count": 4,
            "bedroom_count": 3,
            "bathroom_count": 3,
            "latitude": 1.3521,
            "longitude": 103.8198,
        }
        response = self.client.post(reverse("price-prediction"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_prediction_rejects_malformed_json_as_bad_request(self):
        response = self.client.post(
            reverse("price-prediction"),
            data=b'{"province_name":',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)


class PredictionModelRegionalOrderingTests(APITestCase):
    def test_model_regressor_is_ridge_linear_regression(self):
        from prediction.services import PredictionService

        model = PredictionService.get_model()
        regressor = getattr(model, "regressor_", getattr(model, "regressor", None))
        final_estimator = regressor.named_steps["regressor"]
        self.assertIsInstance(final_estimator, Ridge)

    def predict_house(self, province_name, district_name, latitude, longitude):
        from prediction.services import PredictionService

        return PredictionService.predict_price({
            "province_name": province_name,
            "district_name": district_name,
            "ward_name": "",
            "property_type_name": "Nhà",
            "area": 80,
            "floor_count": 3,
            "bedroom_count": 3,
            "bathroom_count": 2,
            "latitude": latitude,
            "longitude": longitude,
        })["estimated_price"]

    def test_large_markets_are_not_cheaper_than_central_provinces(self):
        hcm = self.predict_house("Hồ Chí Minh", "Bình Thạnh", 10.8057, 106.7140)
        hanoi = self.predict_house("Hà Nội", "Cầu Giấy", 21.0362, 105.7906)
        da_nang = self.predict_house("Đà Nẵng", "Hải Châu", 16.0471, 108.2068)
        quang_nam = self.predict_house("Quảng Nam", "Tam Kỳ", 15.5394, 108.0191)
        quang_ngai = self.predict_house("Quảng Ngãi", "TP Quảng Ngãi", 15.1214, 108.8044)

        self.assertGreater(hcm, da_nang)
        self.assertGreater(hanoi, da_nang)
        self.assertGreater(hcm, quang_nam)
        self.assertGreater(hanoi, quang_nam)
        self.assertGreater(hcm, quang_ngai)
        self.assertGreater(hanoi, quang_ngai)
        self.assertGreater(quang_nam, 4_000_000_000)
        self.assertGreater(quang_ngai, 3_500_000_000)
