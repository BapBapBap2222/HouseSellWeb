from rest_framework.pagination import PageNumberPagination


class OptionalPageNumberPagination(PageNumberPagination):
    """
    Paginate property collections by default.

    Listing pages can become very large after Supabase is populated. Returning
    one bounded page protects both the API process and the browser from loading
    every property just to render Buy/Rent views.
    """

    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 48
