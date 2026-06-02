import api, { API_ORIGIN } from './api';

export interface PropertyImage {
  id: number;
  image: string;
  caption: string | null;
  is_primary?: boolean;
  order?: number;
}

export interface PropertyAvailabilitySlot {
  start: string;
  end: string;
}

export interface PropertyAvailabilityDay {
  dayOfWeek: string;
  enabled: boolean;
  slots: PropertyAvailabilitySlot[];
}

export interface Property {
  id: number;
  title: string;
  description?: string;
  property_type: 'house' | 'apartment' | 'land' | 'villa' | 'other';
  property_type_display?: string;
  listing_type: 'sale' | 'rent';
  listing_type_display?: string;
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  year_built?: number | null;
  parking_details?: string | null;
  facing?: string | null;
  legal_status?: string | null;
  furniture_status?: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  status: 'active' | 'inactive' | 'sold' | 'rented';
  status_display?: string;
  price_unit?: string;
  has_parking?: boolean;
  has_pool?: boolean;
  has_garden?: boolean;
  is_furnished?: boolean;
  is_active?: boolean;
  is_featured: boolean;
  owner?: number;
  owner_name?: string;
  owner_username?: string;
  owner_phone?: string | null;
  owner_agent_slug?: string | null;
  availability_schedule?: PropertyAvailabilityDay[];
  images?: PropertyImage[];
  primary_image?: string | null;
  is_favorited?: boolean;
  views_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListResponse<T> = PaginatedResponse<T> | T[];

export interface PropertyFilters {
  search?: string;
  property_type?: string;
  property_types?: string;
  listing_type?: string;
  city?: string;
  district?: string;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms_min?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  status?: string;
  is_featured?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface CreatePropertyPayload {
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  year_built?: number;
  parking_details?: string;
  facing?: string;
  legal_status?: string;
  furniture_status?: string;
  address: string;
  ward?: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  has_parking?: boolean;
  has_pool?: boolean;
  has_garden?: boolean;
  is_furnished?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  availability_schedule?: PropertyAvailabilityDay[];
}

export interface FavoriteItem {
  id: number;
  property_id: number;
  property_title: string;
  property: Property;
  created_at: string;
}

export interface UploadPropertyImageOptions {
  caption?: string;
  isPrimary?: boolean;
  order?: number;
}

export const getImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
};

const normalizePropertyFilters = (filters?: PropertyFilters): PropertyFilters | undefined => {
  if (!filters) return filters;
  const params: PropertyFilters = { ...filters };

  if (params.min_price !== undefined && params.price_min === undefined) params.price_min = params.min_price;
  if (params.max_price !== undefined && params.price_max === undefined) params.price_max = params.max_price;
  if (params.min_area !== undefined && params.area_min === undefined) params.area_min = params.min_area;
  if (params.max_area !== undefined && params.area_max === undefined) params.area_max = params.max_area;
  if (params.bedrooms !== undefined && params.bedrooms_min === undefined) params.bedrooms_min = params.bedrooms;

  return params;
};

export const getProperties = async (
  filters?: PropertyFilters,
  signal?: AbortSignal,
): Promise<ListResponse<Property>> => {
  const { data } = await api.get<ListResponse<Property>>('/api/properties/', {
    params: normalizePropertyFilters(filters),
    signal,
  });
  return data;
};

export const normalizeListResponse = <T>(response: ListResponse<T>): T[] => {
  return Array.isArray(response) ? response : response.results;
};

export const getProperty = async (id: number): Promise<Property> => {
  const { data } = await api.get<Property>(`/api/properties/${id}/`);
  return data;
};

export const getMyProperties = async (
  filters?: PropertyFilters,
  signal?: AbortSignal,
): Promise<ListResponse<Property>> => {
  const { data } = await api.get<ListResponse<Property>>('/api/properties/my/', {
    params: normalizePropertyFilters(filters),
    signal,
  });
  return data;
};

export const createProperty = async (payload: CreatePropertyPayload): Promise<Property> => {
  const { data } = await api.post<Property>('/api/properties/', payload);
  return data;
};

export const updateProperty = async (
  id: number,
  payload: Partial<CreatePropertyPayload>
): Promise<Property> => {
  const { data } = await api.patch<Property>(`/api/properties/${id}/`, payload);
  return data;
};

export const deleteProperty = async (id: number): Promise<void> => {
  await api.delete(`/api/properties/${id}/`);
};

export const uploadPropertyImages = async (
  propertyId: number,
  files: File[],
  options: UploadPropertyImageOptions = {}
): Promise<PropertyImage[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  if (options.caption !== undefined) formData.append('caption', options.caption);
  if (options.isPrimary !== undefined) formData.append('is_primary', String(options.isPrimary));
  if (options.order !== undefined) formData.append('order', String(options.order));
  const { data } = await api.post<PropertyImage[]>(
    `/api/properties/${propertyId}/images/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
};

export const deletePropertyImage = async (imageId: number): Promise<void> => {
  await api.delete(`/api/properties/images/${imageId}/`);
};

export const getFavorites = async (): Promise<ListResponse<FavoriteItem>> => {
  const { data } = await api.get<ListResponse<FavoriteItem>>('/api/properties/favorites/');
  return data;
};

export const toggleFavorite = async (
  propertyId: number
): Promise<{ is_favorited: boolean; message?: string }> => {
  const { data } = await api.post<{ is_favorited: boolean; message?: string }>(
    `/api/properties/${propertyId}/favorite/`
  );
  return data;
};
