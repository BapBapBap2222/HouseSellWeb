import { useState } from 'react';
import { Search, ChevronDown, MapPin, Wallet, CheckCircle2, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TabType = 'buy' | 'rent';

interface SearchModuleProps {
  onViewChange?: (view: 'left' | 'right' | 'top' | 'middle') => void;
}

export const SearchModule = ({ onViewChange }: SearchModuleProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsOpen, setBedsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const trustIndicators = [
    { icon: <CheckCircle2 className="w-5 h-5" />, label: '10K+ Listings' },
    { icon: <Users className="w-5 h-5" />, label: 'Verified Agents' },
    { icon: <Shield className="w-5 h-5" />, label: 'Legal Support' },
  ];

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
              onClick={() => setPriceOpen(!priceOpen)}
              className="chip chip-default flex items-center gap-2"
            >
              <span>Price Range</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {priceOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-border p-4 z-10 min-w-[200px]">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <input type="radio" name="price" className="accent-accent" />
                    <span className="text-sm">Under 1B</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <input type="radio" name="price" className="accent-accent" />
                    <span className="text-sm">1 - 3B</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <input type="radio" name="price" className="accent-accent" />
                    <span className="text-sm">3 - 5B</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <input type="radio" name="price" className="accent-accent" />
                    <span className="text-sm">Above 5B</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Bedrooms */}
          <div className="relative">
            <button
              onClick={() => setBedsOpen(!bedsOpen)}
              className="chip chip-default flex items-center gap-2"
            >
              <span>Bedrooms</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {bedsOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-border p-4 z-10 min-w-[180px]">
                <div className="flex flex-wrap gap-2">
                  {['1', '2', '3', '4', '5+'].map((num) => (
                    <button
                      key={num}
                      className="chip chip-default text-sm px-4 py-2"
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
              onClick={() => setTypeOpen(!typeOpen)}
              className="chip chip-default flex items-center gap-2"
            >
              <span>Property Type</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {typeOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-border p-4 z-10 min-w-[200px]">
                <div className="space-y-2">
                  {['Apartment', 'Townhouse', 'Villa', 'Land', 'Office'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <input type="checkbox" className="accent-accent" />
                      <span className="text-sm">{type}</span>
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
