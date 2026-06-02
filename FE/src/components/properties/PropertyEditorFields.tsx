import { ChangeEvent, useEffect } from 'react';
import { FileText, Home, Landmark, MapPin, MapPinned, Navigation, RotateCcw, Ruler, Sparkles } from 'lucide-react';

import { VIETNAM_ADMINISTRATIVE_UNITS } from '@/data/vietnamAdministrative';
import { Button } from '@/components/ui/button';
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import {
  FACING_OPTIONS,
  FURNITURE_OPTIONS,
  LEGAL_OPTIONS,
  LISTING_TYPE_OPTIONS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_OPTIONS,
  PropertyFormState,
  PropertyTypeValue,
  isStructureProperty,
} from '@/lib/propertyForm';

type PropertyEditorFieldsProps = {
  form: PropertyFormState;
  onTextChange: (field: keyof PropertyFormState, value: string) => void;
  onBooleanChange: (field: keyof PropertyFormState, checked: boolean) => void;
  onPropertyTypeChange: (value: PropertyTypeValue) => void;
  disabled?: boolean;
};

const fieldClassName =
  'w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

const sectionTitleClassName = 'text-lg font-semibold text-slate-900';
const sectionHintClassName = 'text-sm text-slate-500';

const formatPreviewPrice = (value: string): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return '7.600.000.000 VND';
  return `${new Intl.NumberFormat('vi-VN').format(parsed)} VND`;
};

const getCurrentProvince = (city: string) => VIETNAM_ADMINISTRATIVE_UNITS.find((item) => item.name === city);

const getCurrentDistricts = (city: string) => getCurrentProvince(city)?.districts ?? [];

const getCurrentWards = (city: string, district: string) =>
  getCurrentDistricts(city).find((item) => item.name === district)?.wards ?? [];

function MapClickListener({ onCoordChange }: { onCoordChange: (lat: string, lng: string) => void }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleClick = (event: { lngLat: { lat: number; lng: number } }) => {
      const { lat, lng } = event.lngLat;
      onCoordChange(lat.toFixed(6), lng.toFixed(6));
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isLoaded, map, onCoordChange]);

  return null;
}

const PropertyEditorFields = ({
  form,
  onTextChange,
  onBooleanChange,
  onPropertyTypeChange,
  disabled = false,
}: PropertyEditorFieldsProps) => {
  const hasSelectedType = Boolean(form.property_type);
  const structureProperty = isStructureProperty(form.property_type);
  const districtOptions = getCurrentDistricts(form.city);
  const wardOptions = getCurrentWards(form.city, form.district);
  const hasMapCoordinates = form.latitude.trim() !== '' && form.longitude.trim() !== '';
  const mapLatitude = Number.parseFloat(form.latitude);
  const mapLongitude = Number.parseFloat(form.longitude);
  const mapCenter =
    Number.isFinite(mapLatitude) && Number.isFinite(mapLongitude)
      ? [mapLongitude, mapLatitude] as [number, number]
      : [106.7009, 10.7769] as [number, number];

  const previewTitle =
    form.title.trim() ||
    (form.property_type === 'land'
      ? 'Bán đất 12.7m đường Lê Duẩn - gần ngã tư Thạch Cao'
      : 'Modern apartment');
  const previewAddress =
    [form.address.trim(), form.ward.trim(), form.district.trim(), form.city.trim()].filter(Boolean).join(', ') ||
    'Lê Duẩn, Đông Hà, Quảng Trị';

  const renderTextInput = (
    field: keyof PropertyFormState,
    placeholder: string,
    inputMode: 'text' | 'number' = 'text',
    extraProps?: Record<string, string | number>,
  ) => (
    <input
      className={fieldClassName}
      value={String(form[field] ?? '')}
      onChange={(event) => onTextChange(field, event.target.value)}
      placeholder={placeholder}
      type={inputMode}
      disabled={disabled || (!hasSelectedType && field !== 'property_type')}
      {...extraProps}
    />
  );

  const renderSelect = (
    field: keyof PropertyFormState,
    options: Array<{ value: string; label: string }>,
    placeholder: string,
    isDisabled?: boolean,
  ) => (
    <select
      className={fieldClassName}
      value={String(form[field] ?? '')}
      onChange={(event) => onTextChange(field, event.target.value)}
      disabled={disabled || isDisabled}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const handleCoordChange = (lat: string, lng: string) => {
    onTextChange('latitude', lat);
    onTextChange('longitude', lng);
  };

  const handleResetLocation = () => {
    onTextChange('latitude', '');
    onTextChange('longitude', '');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 md:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClassName}>Property Category First</h2>
            <p className={sectionHintClassName}>
              Choose the property type before filling the rest of the form. Land listings will automatically hide house-only fields.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Property Type *</label>
              <select
                className={fieldClassName}
                value={form.property_type}
                onChange={(event) => onPropertyTypeChange(event.target.value as PropertyTypeValue)}
                disabled={disabled}
              >
                <option value="">Choose property type</option>
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {hasSelectedType && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Title *</label>
                {renderTextInput('title', 'Title *')}
              </div>
            )}

            {!hasSelectedType && (
              <div className="rounded-[20px] border border-dashed border-sky-300 bg-white px-4 py-3 text-sm text-sky-700">
                Pick one type first. After that, address and detail fields will unlock.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Example
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Title should describe the asset clearly, for example:
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {form.property_type ? PROPERTY_TYPE_LABELS[form.property_type as Exclude<PropertyTypeValue, ''>] : 'Property'} in a searchable location with key selling point
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClassName}>General Information</h2>
            <p className={sectionHintClassName}>
              Fill in the public-facing title, exact province, district, ward and short sales description.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {renderSelect(
                'city',
                VIETNAM_ADMINISTRATIVE_UNITS.map((item) => ({ value: item.name, label: item.name })),
                'Province / City *',
                !hasSelectedType,
              )}
              {renderSelect(
                'district',
                districtOptions.map((district) => ({ value: district.name, label: district.name })),
                'District *',
                !hasSelectedType || !form.city,
              )}
              {renderSelect(
                'ward',
                wardOptions.map((ward) => ({ value: ward.name, label: ward.name })),
                'Ward *',
                !hasSelectedType || !form.city || !form.district,
              )}
              {renderTextInput('address', 'Street address, project name, alley number... *')}
            </div>

            <textarea
              className={`${fieldClassName} min-h-[150px] resize-none`}
              value={form.description}
              onChange={(event) => onTextChange('description', event.target.value)}
              placeholder="Description *"
              disabled={disabled || !hasSelectedType}
            />
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText className="h-4 w-4 text-teal-600" />
              Live preview
            </div>
            <div className="space-y-3">
              <h3 className="text-[28px] font-bold leading-tight text-slate-900">{previewTitle}</h3>
              <p className="text-[24px] font-bold text-slate-900">{formatPreviewPrice(form.price)}</p>
              <div className="flex items-start gap-2 text-slate-500">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" />
                <span>{previewAddress}</span>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-3 text-sm text-slate-600">
                Use the title to answer: what is being sold, where is it, and what makes it attractive.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClassName}>Property Details</h2>
            <p className={sectionHintClassName}>
              Complete the detailed specs buyers expect to compare. New listings are active by default, and house-specific fields are hidden automatically for land listings.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {renderSelect('listing_type', LISTING_TYPE_OPTIONS as Array<{ value: string; label: string }>, 'Listing type *', !hasSelectedType)}
              {renderTextInput('price', 'Price (VND) *', 'number', { min: 1 })}
              {renderTextInput('area', 'Area (m2) *', 'number', { min: 1, step: '0.01' })}
              {renderSelect(
                'facing',
                FACING_OPTIONS.map((item) => ({ value: item, label: item })),
                'Facing',
                !hasSelectedType,
              )}
              {renderSelect(
                'legal_status',
                LEGAL_OPTIONS.map((item) => ({ value: item, label: item })),
                'Legal',
                !hasSelectedType,
              )}

              {structureProperty && (
                <>
                  {renderTextInput('bedrooms', 'Beds', 'number', { min: 0 })}
                  {renderTextInput('bathrooms', 'Baths', 'number', { min: 0 })}
                  {renderTextInput('floors', 'Floors', 'number', { min: 0 })}
                  {renderTextInput('year_built', 'Year Built', 'number', { min: 1900, max: 2100 })}
                  {renderTextInput('parking_details', 'Parking')}
                  {renderSelect(
                    'furniture_status',
                    FURNITURE_OPTIONS.map((item) => ({ value: item, label: item })),
                    'Furniture',
                    !hasSelectedType,
                  )}
                </>
              )}
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">Optional highlights</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.has_pool}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onBooleanChange('has_pool', event.target.checked)}
                    disabled={disabled || !hasSelectedType || !structureProperty}
                  />
                  Swimming pool
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.has_garden}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onBooleanChange('has_garden', event.target.checked)}
                    disabled={disabled || !hasSelectedType || !structureProperty}
                  />
                  Garden
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onBooleanChange('is_featured', event.target.checked)}
                    disabled={disabled || !hasSelectedType}
                  />
                  Mark as featured
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onBooleanChange('is_active', event.target.checked)}
                    disabled={disabled || !hasSelectedType}
                  />
                  Visible listing
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Ruler className="h-4 w-4 text-amber-600" />
              Detail example
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-[18px] bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">Suggested structure</p>
                <p className="mt-1">Property Type, Year Built, Parking, Floor, Facing, Legal, Furniture, Status, Beds, Baths, Area.</p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">Current type</p>
                <p className="mt-1">
                  {form.property_type
                    ? PROPERTY_TYPE_LABELS[form.property_type as Exclude<PropertyTypeValue, ''>]
                    : 'No type selected yet'}
                </p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">Land logic</p>
                <p className="mt-1">If you choose land, room, bathroom, floor, year built, parking and furniture fields are hidden automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClassName}>Property Location</h2>
            <p className={sectionHintClassName}>
              Pick the exact location on the map and save it with this listing. Buyers will use this position for viewing requests and map preview.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPinned className="h-4 w-4 text-cyan-600" />
                Choose position on map
              </div>
              {hasMapCoordinates && (
                <button
                  type="button"
                  onClick={handleResetLocation}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset location
                </button>
              )}
            </div>

            <div className="h-[340px] overflow-hidden rounded-[24px] border border-slate-200">
              <Map
                theme="light"
                viewport={{
                  center: mapCenter,
                  zoom: hasMapCoordinates ? 14 : 5.5,
                  bearing: 0,
                  pitch: 0,
                }}
                className="h-full w-full"
              >
                <MapClickListener onCoordChange={handleCoordChange} />
                {hasMapCoordinates && Number.isFinite(mapLatitude) && Number.isFinite(mapLongitude) && (
                  <MapMarker longitude={mapLongitude} latitude={mapLatitude}>
                    <MarkerContent>
                      <div style={{ transform: 'translateY(-22px)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="42" fill="none">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0F766E" />
                          <circle cx="12" cy="9" r="2.5" fill="white" />
                        </svg>
                      </div>
                    </MarkerContent>
                  </MapMarker>
                )}
                <MapControls position="bottom-right" showZoom showLocate />
              </Map>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {renderTextInput('latitude', 'Latitude', 'number', { step: '0.000001' })}
              {renderTextInput('longitude', 'Longitude', 'number', { step: '0.000001' })}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Navigation className="h-4 w-4 text-cyan-600" />
              Location status
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-[18px] bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">Current coordinates</p>
                <p className="mt-1 font-mono text-slate-700">
                  {hasMapCoordinates ? `${form.latitude}, ${form.longitude}` : 'No exact position saved yet'}
                </p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">How to update</p>
                <p className="mt-1">Click directly on the map or type precise latitude and longitude manually.</p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">Save location</p>
                <p className="mt-1">After picking the right point, save it to the property so the public map and booking flow use the new coordinates.</p>
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={disabled || !hasSelectedType}>
                Save Property Location
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PropertyEditorFields;
