import { MapPin } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ListingTypeFilter = 'buy' | 'rent';

export interface ListingFiltersState {
  city: string;
  district: string;
  listingType: ListingTypeFilter;
  priceRange: [number, number];
  selectedPricePreset: string | null;
  propertyTypes: string[];
  bedrooms: number | null;
}

export const DEFAULT_LISTING_FILTERS: ListingFiltersState = {
  city: '',
  district: '',
  listingType: 'buy',
  priceRange: [0, 60],
  selectedPricePreset: null,
  propertyTypes: [],
  bedrooms: null,
};

const PRICE_PRESETS: Array<{ label: string; value: string; range: [number, number] }> = [
  { label: 'Under 2B', value: '0-2', range: [0, 2] },
  { label: '2B - 5B', value: '2-5', range: [2, 5] },
  { label: '5B - 10B', value: '5-10', range: [5, 10] },
  { label: 'Above 10B', value: '10-60', range: [10, 60] },
];

const PROPERTY_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'Townhouse', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Land', value: 'land' },
  { label: 'Office', value: 'other' },
];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

interface FilterSidebarProps {
  value: ListingFiltersState;
  cities: string[];
  districts: string[];
  onChange: (next: ListingFiltersState) => void;
}

export const FilterSidebar = ({ value, cities, districts, onChange }: FilterSidebarProps) => {
  const handleCityChange = (city: string) => {
    onChange({
      ...value,
      city,
      district: '',
    });
  };

  const handlePricePresetChange = (presetValue: string, checked: boolean) => {
    if (!checked) {
      onChange({
        ...value,
        selectedPricePreset: null,
        priceRange: DEFAULT_LISTING_FILTERS.priceRange,
      });
      return;
    }

    const preset = PRICE_PRESETS.find((item) => item.value === presetValue);
    if (!preset) {
      return;
    }
    onChange({
      ...value,
      selectedPricePreset: preset.value,
      priceRange: preset.range,
    });
  };

  const togglePropertyType = (propertyType: string, checked: boolean) => {
    const set = new Set(value.propertyTypes);
    if (checked) {
      set.add(propertyType);
    } else {
      set.delete(propertyType);
    }
    onChange({
      ...value,
      propertyTypes: Array.from(set),
    });
  };

  return (
    <div className="w-[300px] flex-shrink-0 bg-white rounded-xl shadow-sm border border-border p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button
          className="text-sm text-primary hover:underline"
          onClick={() => onChange(DEFAULT_LISTING_FILTERS)}
        >
          Clear all
        </button>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-medium mb-3">Location</h4>
        <div className="space-y-3">
          <Select value={value.city || 'all'} onValueChange={(v) => handleCityChange(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
              <div
                className={`flex items-center gap-2 ${
                  value.city ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <SelectValue placeholder="Select City" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={value.district || 'all'}
            onValueChange={(v) => onChange({ ...value, district: v === 'all' ? '' : v })}
            disabled={!value.city}
          >
            <SelectTrigger className="w-full">
              <div
                className={`flex items-center gap-2 ${
                  value.district ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <SelectValue placeholder="Select District" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full h-px bg-border my-6" />

      <div className="mb-8">
        <h4 className="text-sm font-medium mb-3">Listing Type</h4>
        <div className="flex p-1 bg-secondary/50 rounded-lg">
          {['buy', 'rent'].map((type) => (
            <button
              key={type}
              onClick={() => onChange({ ...value, listingType: type as ListingTypeFilter })}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                value.listingType === type
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-border my-6" />

      <div className="mb-8">
        <h4 className="text-sm font-medium mb-4">Price Range (Billion VND)</h4>
        <Slider
          max={60}
          step={0.5}
          className="mb-4"
          onValueChange={(raw) => {
            const nextRange: [number, number] = [raw[0] ?? 0, raw[1] ?? 60];
            onChange({
              ...value,
              priceRange: nextRange,
              selectedPricePreset: null,
            });
          }}
          value={value.priceRange}
        />
        <div className="flex justify-between text-sm text-muted-foreground font-medium">
          <span>{value.priceRange[0]}B</span>
          <span>{value.priceRange[1]}B+</span>
        </div>
        <div className="mt-4 space-y-2">
          {PRICE_PRESETS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={value.selectedPricePreset === option.value}
                onCheckedChange={(checked) => handlePricePresetChange(option.value, Boolean(checked))}
              />
              <label
                htmlFor={option.value}
                className="text-sm font-normal text-muted-foreground leading-none cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-border my-6" />

      <div className="mb-8">
        <h4 className="text-sm font-medium mb-3">Bedrooms</h4>
        <div className="grid grid-cols-5 gap-2">
          {BEDROOM_OPTIONS.map((bedroom) => (
            <button
              key={bedroom}
              type="button"
              onClick={() => onChange({ ...value, bedrooms: value.bedrooms === bedroom ? null : bedroom })}
              className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                value.bedrooms === bedroom
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {bedroom === 5 ? '5+' : bedroom}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-border my-6" />

      <div className="mb-8">
        <h4 className="text-sm font-medium mb-3">Property Type</h4>
        <div className="space-y-2">
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`type-${option.value}`}
                checked={value.propertyTypes.includes(option.value)}
                onCheckedChange={(checked) => togglePropertyType(option.value, Boolean(checked))}
              />
              <Label htmlFor={`type-${option.value}`} className="text-sm font-normal text-muted-foreground">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
