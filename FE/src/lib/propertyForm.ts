import { CreatePropertyPayload, Property } from '@/lib/propertiesApi';

export type PropertyTypeValue = '' | 'house' | 'apartment' | 'land' | 'villa' | 'other';
export type ListingTypeValue = 'sale' | 'rent';
export type PropertyStatusValue = 'active' | 'inactive' | 'sold' | 'rented';

export type PropertyFormState = {
  title: string;
  description: string;
  property_type: PropertyTypeValue;
  listing_type: ListingTypeValue;
  price: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  floors: string;
  year_built: string;
  parking_details: string;
  facing: string;
  legal_status: string;
  furniture_status: string;
  city: string;
  district: string;
  ward: string;
  address: string;
  latitude: string;
  longitude: string;
  has_pool: boolean;
  has_garden: boolean;
  is_featured: boolean;
  is_active: boolean;
};

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'villa', label: 'Villa' },
  { value: 'other', label: 'Other' },
] as const;

export const LISTING_TYPE_OPTIONS = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
] as const;

export const FACING_OPTIONS = [
  'North',
  'South',
  'East',
  'West',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
];

export const FURNITURE_OPTIONS = [
  'Unfurnished',
  'Basic furnished',
  'Fully furnished',
  'Luxury furnished',
];

export const LEGAL_OPTIONS = [
  'Red book available',
  'Pink book available',
  'Sale contract',
  'Waiting for certificate',
];

export const EMPTY_PROPERTY_FORM: PropertyFormState = {
  title: '',
  description: '',
  property_type: '',
  listing_type: 'sale',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  floors: '',
  year_built: '',
  parking_details: '',
  facing: '',
  legal_status: '',
  furniture_status: '',
  city: '',
  district: '',
  ward: '',
  address: '',
  latitude: '',
  longitude: '',
  has_pool: false,
  has_garden: false,
  is_featured: false,
  is_active: true,
};

export const PROPERTY_TYPE_LABELS: Record<Exclude<PropertyTypeValue, ''>, string> = {
  house: 'House',
  apartment: 'Apartment',
  land: 'Land',
  villa: 'Villa',
  other: 'Other',
};

export const PROPERTY_TYPES_WITH_STRUCTURE = new Set<PropertyTypeValue>(['house', 'apartment', 'villa', 'other']);

export const toNumberOrUndefined = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const isStructureProperty = (propertyType: PropertyTypeValue): boolean =>
  PROPERTY_TYPES_WITH_STRUCTURE.has(propertyType);

export const applyPropertyTypeRules = (
  nextType: PropertyTypeValue,
  current: PropertyFormState,
): PropertyFormState => {
  if (nextType !== 'land') {
    return { ...current, property_type: nextType };
  }

  return {
    ...current,
    property_type: nextType,
    bedrooms: '',
    bathrooms: '',
    floors: '',
    year_built: '',
    parking_details: '',
    furniture_status: '',
    has_pool: false,
    has_garden: false,
  };
};

export const buildPropertyPayload = (form: PropertyFormState): CreatePropertyPayload => {
  const price = Number(form.price);
  const area = Number(form.area);

  if (!form.property_type) {
    throw new Error('Please choose the property type first.');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Price must be greater than 0.');
  }
  if (!Number.isFinite(area) || area <= 0) {
    throw new Error('Area must be greater than 0.');
  }
  if (
    !form.title.trim() ||
    !form.city.trim() ||
    !form.district.trim() ||
    !form.ward.trim() ||
    !form.address.trim() ||
    !form.description.trim()
  ) {
    throw new Error('Please fill in all required fields.');
  }

  const structureProperty = isStructureProperty(form.property_type);
  const furnitureStatus = structureProperty ? form.furniture_status.trim() : '';
  const parkingDetails = structureProperty ? form.parking_details.trim() : '';

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    property_type: form.property_type,
    listing_type: form.listing_type,
    status: 'active',
    price,
    area,
    bedrooms: structureProperty ? toNumberOrUndefined(form.bedrooms) : undefined,
    bathrooms: structureProperty ? toNumberOrUndefined(form.bathrooms) : undefined,
    floors: structureProperty ? toNumberOrUndefined(form.floors) : undefined,
    year_built: structureProperty ? toNumberOrUndefined(form.year_built) : undefined,
    parking_details: parkingDetails || undefined,
    facing: form.facing.trim() || undefined,
    legal_status: form.legal_status.trim() || undefined,
    furniture_status: furnitureStatus || undefined,
    city: form.city.trim(),
    district: form.district.trim(),
    ward: form.ward.trim(),
    address: form.address.trim(),
    latitude: toNumberOrUndefined(form.latitude),
    longitude: toNumberOrUndefined(form.longitude),
    has_parking: Boolean(parkingDetails),
    has_pool: structureProperty ? form.has_pool : false,
    has_garden: structureProperty ? form.has_garden : false,
    is_furnished: Boolean(furnitureStatus && furnitureStatus.toLowerCase() !== 'unfurnished'),
    is_featured: form.is_featured,
    is_active: form.is_active,
  };
};

const toStringOrEmpty = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

const isVietnamCoordinatePair = (latitude: unknown, longitude: unknown): boolean => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  return lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110;
};

export const mapPropertyToForm = (property: Property): PropertyFormState => ({
  title: toStringOrEmpty(property.title),
  description: toStringOrEmpty(property.description),
  property_type: (property.property_type as PropertyTypeValue) || '',
  listing_type: (property.listing_type as ListingTypeValue) || 'sale',
  price: toStringOrEmpty(property.price),
  area: toStringOrEmpty(property.area),
  bedrooms: toStringOrEmpty(property.bedrooms),
  bathrooms: toStringOrEmpty(property.bathrooms),
  floors: toStringOrEmpty(property.floors),
  year_built: toStringOrEmpty(property.year_built),
  parking_details: toStringOrEmpty(property.parking_details),
  facing: toStringOrEmpty(property.facing),
  legal_status: toStringOrEmpty(property.legal_status),
  furniture_status: toStringOrEmpty(property.furniture_status),
  city: toStringOrEmpty(property.city),
  district: toStringOrEmpty(property.district),
  ward: toStringOrEmpty(property.ward),
  address: toStringOrEmpty(property.address),
  latitude: isVietnamCoordinatePair(property.latitude, property.longitude)
    ? toStringOrEmpty(property.latitude)
    : '',
  longitude: isVietnamCoordinatePair(property.latitude, property.longitude)
    ? toStringOrEmpty(property.longitude)
    : '',
  has_pool: Boolean(property.has_pool),
  has_garden: Boolean(property.has_garden),
  is_featured: Boolean(property.is_featured),
  is_active: property.is_active !== false,
});
