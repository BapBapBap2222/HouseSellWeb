import logging
from rest_framework import status
from rest_framework.exceptions import ParseError, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema

from .serializers import PricePredictionInputSerializer
from .services import PredictionService

logger = logging.getLogger(__name__)

class PricePredictionView(APIView):
    """
    API View to handle house price prediction.
    Delegates machine learning operations to PredictionService.
    """
    @swagger_auto_schema(request_body=PricePredictionInputSerializer)
    def post(self, request):
        try:
            serializer = PricePredictionInputSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            result = PredictionService.predict_price(serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
            
        except ValueError as e:
            # Custom validation errors
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except ParseError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except FileNotFoundError:
            # Do not leak internal model paths in logs/responses.
            logger.error("Prediction model file is unavailable.")
            return Response({"error": "Internal server error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            # Unexpected errors.
            logger.exception("Unexpected error while predicting price.")
            return Response({"error": "Internal server error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
