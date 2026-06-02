import { useState } from 'react';
import { Search, ChevronDown, CheckCircle2, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TabType = 'buy' | 'rent';
type PricePreset = { label: string; value: string; range: [number, number] };
type PropertyTypeOption = { label: string; value: string };

const PRICE_PRESETS: PricePreset[] = [
  { label: 'Under 2B', value: '0-2', range: [0, 2] },
  { label: '2B - 5B', value: '2-5', range: [2, 5] },
  { label: '5B - 10B', value: '5-10', range: [5, 10] },
  { label: 'Above 10B', value: '10-60', range: [10, 60] },
];

const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5+'];

const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'Townhouse', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Land', value: 'land' },
  { label: 'Office', value: 'other' },
];

interface SearchModuleProps {
  onViewChange?: (view: 'left' | 'right' | 'top' | 'middle') => void;
}

export const SearchModule = ({ onViewChange }: SearchModuleProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsOpen, setBedsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const trustIndicators = [
    { icon: <CheckCircle2 className="w-5 h-5" />, label: '10K+ Listings' },
    { icon: <Users className="w-5 h-5" />, label: 'Verified Agents' },
    { icon: <Shield className="w-5 h-5" />, label: 'Legal Support' },
  ];

  const selectedPriceLabel = PRICE_PRESETS.find((item) => item.value === selectedPrice)?.label ?? 'Price Range';
  const selectedBedroomLabel = selectedBedrooms ? `${selectedBedrooms} Bedrooms` : 'Bedrooms';
  const selectedTypeLabel = selectedTypes.length === 0
    ? 'Property Type'
    : selectedTypes.length === 1
      ? PROPERTY_TYPE_OPTIONS.find((item) => item.value === selectedTypes[0])?.label ?? 'Property Type'
      : `${selectedTypes.length} Types`;

  const toggleType = (value: string) => {
    setSelectedTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <button
          type="button"
          onClick={() => setActiveTab('buy')}
          className={cn(
            "px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm",
            activeTab === 'buy'
              ? "bg-primary text-white"
              : "bg-white text-muted-foreground hover:bg-gray-50"
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rent')}
          className={cn(
            "px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm",
            activeTab === 'rent'
              ? "bg-primary text-white"
              : "bg-white text-muted-foreground hover:bg-gray-50"
          )}
        >
          Rent
        </button>
      </div>

      {/* Search Box */}
      <form
        className="bg-white rounded-xl shadow-xl p-4 md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const params = new URLSearchParams();
          if (activeTab === 'rent') params.set('type', 'rent');
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          if (selectedPrice) params.set('price', selectedPrice);
          if (selectedBedrooms) params.set('bedrooms', selectedBedrooms.replace('+', ''));
          if (selectedTypes.length > 0) params.set('property_type', selectedTypes.join(','));
          navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
        }}
      >
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter area, street, project…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="input-field pl-12"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Price Range */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPriceOpen(!priceOpen)}
              className="chip chip-default flex items-center gap-2"
            >
              <span>{selectedPriceLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {priceOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-border p-4 z-10 min-w-[200px]">
                <div className="space-y-2">
                  {PRICE_PRESETS.map((preset) => (
                    <label key={preset.value} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPrice === preset.value}
                        onChange={() => setSelectedPrice(preset.value)}
                        className="accent-accent"
                      />
                      <span className="text-sm">{preset.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bedrooms */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setBedsOpen(!bedsOpen)}
              className="chip chip-default flex items-center gap-2"
            >
              <span>{selectedBedroomLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {bedsOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-border p-4 z-10 min-w-[180px]">
                <div className="flex flex-wrap gap-2">
                  {BEDROOM_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedBedrooms(selectedBedrooms === num ? null : num)}
                      className={cn(
                        'chip text-sm px-4 py-2',
                        selectedBedrooms === num ? 'chip-active' : 'chip-default',
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property Type */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeOpen(!typeOpen)}
              className="chip chip-default flex items-center gap-2"
            >
              <span>{selectedTypeLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {typeOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-border p-4 z-10 min-w-[200px]">
                <div className="space-y-2">
                  {PROPERTY_TYPE_OPTIONS.map((type) => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.value)}
                        onChange={() => toggleType(type.value)}
                        className="accent-accent"
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>
      </form>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-muted-foreground">
        {trustIndicators.map((indicator, index) => (
          <div key={index} className="flex items-center gap-2 text-base md:text-lg font-medium">
            <div className="text-primary">{indicator.icon}</div>
            <span>{indicator.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
