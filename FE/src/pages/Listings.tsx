import { MouseEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, LayoutGrid, List, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { DetailPanel } from '@/components/listings/DetailPanel';
import {
  DEFAULT_LISTING_FILTERS,
  FilterSidebar,
  ListingFiltersState,
} from '@/components/listings/FilterSidebar';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingRow } from '@/components/listings/ListingRow';
import { Pagination } from '@/components/listings/Pagination';
import { VIETNAM_ADMINISTRATIVE_UNITS } from '@/data/vietnamAdministrative';
import { VIETNAM_PROVINCES } from '@/data/provinces';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl, getProperties, normalizeListResponse, Property, PropertyFilters, toggleFavorite } from '@/lib/propertiesApi';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'price-asc' | 'price-desc';

interface ListingViewModel {
  id: number;
  image: string;
  price: string;
  rawPrice: number;
  title: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  type: string;
  city: string;
  district: string;
  listingType: 'sale' | 'rent';
  propertyType: 'house' | 'apartment' | 'land' | 'villa' | 'other';
  isFavorited: boolean;
  latitude: number | null;
  longitude: number | null;
}

const ITEMS_PER_PAGE = 30;
const PRICE_PRESETS: Record<string, [number, number]> = {
  '0-2': [0, 2],
  '2-5': [2, 5],
  '5-10': [5, 10],
  '10-60': [10, 60],
};

const normalizeListingTypeParam = (value: string | null): ListingFiltersState['listingType'] =>
  value === 'rent' ? 'rent' : 'buy';

const parsePropertyTypesParam = (value: string | null): string[] =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const parseBedroomsParam = (value: string | null): number | null => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeLocationValue = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slugifyLocationValue = (value: string): string =>
  normalizeLocationValue(value).replace(/\s+/g, '-');

const dedupeLocations = (values: string[]): string[] => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = normalizeLocationValue(trimmed);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    deduped.push(trimmed);
  });

  return deduped.sort((a, b) => a.localeCompare(b, 'vi'));
};

const getAdministrativeProvince = (city: string) => {
  const normalizedCity = normalizeLocationValue(city);
  return VIETNAM_ADMINISTRATIVE_UNITS.find(
    (item) =>
      normalizeLocationValue(item.name) === normalizedCity ||
      normalizeLocationValue(item.full_name) === normalizedCity,
  );
};

const formatDistrictLabel = (city: string, district: string | null | undefined): string => {
  const rawDistrict = String(district ?? '').trim();
  if (!rawDistrict) return '';

  const province = getAdministrativeProvince(city);
  const normalizedDistrict = normalizeLocationValue(rawDistrict);
  const matchedDistrict = province?.districts.find(
    (item) =>
      normalizeLocationValue(item.name) === normalizedDistrict ||
      normalizeLocationValue(item.full_name) === normalizedDistrict,
  );
  if (matchedDistrict) {
    return matchedDistrict.full_name || matchedDistrict.name;
  }

  const isHoChiMinh = normalizeLocationValue(city).includes('ho chi minh');
  if (isHoChiMinh && /^\d+$/.test(rawDistrict)) {
    return `Quận ${rawDistrict}`;
  }
  if (isHoChiMinh) {
    const districtNumber = rawDistrict.match(/^district\s+(\d+)$/i)?.[1];
    if (districtNumber) return `Quận ${districtNumber}`;
  }

  return rawDistrict;
};

const getLocationLabelFromSlug = (provinceSlug: string | null, locationSlug: string | null) => {
  const province = provinceSlug
    ? VIETNAM_PROVINCES.find((item) => item.slug === provinceSlug)
    : undefined;
  const administrativeProvince = province ? getAdministrativeProvince(province.name) : undefined;
  const district = province && locationSlug
    ? (
        administrativeProvince?.districts.find((item) =>
          slugifyLocationValue(item.full_name || item.name) === locationSlug ||
          slugifyLocationValue(item.name) === locationSlug,
        ) ??
        province.locations.find((item) => item.slug === locationSlug)
      )
    : undefined;

  return {
    city: province?.name ?? '',
    district: district ? ('full_name' in district ? district.full_name || district.name : district.name) : '',
  };
};

const formatVndPrice = (price: number): string => {
  if (!Number.isFinite(price)) return 'N/A';
  return `${new Intl.NumberFormat('vi-VN').format(price)} VND`;
};

const mapPropertyToListing = (property: Property): ListingViewModel => {
  const rawPrice = Number(property.price || 0);
  const district = formatDistrictLabel(property.city || '', property.district);
  return {
    id: property.id,
    image: property.primary_image
      ? getImageUrl(property.primary_image)
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
    price: formatVndPrice(rawPrice),
    rawPrice,
    title: property.title,
    address: [property.address, property.ward, district, property.city].filter(Boolean).join(', '),
    beds: property.bedrooms ?? 0,
    baths: property.bathrooms ?? 0,
    area: Number(property.area || 0),
    type: property.property_type_display || property.property_type || 'Property',
    city: property.city || '',
    district,
    listingType: property.listing_type,
    propertyType: property.property_type,
    isFavorited: Boolean(property.is_favorited),
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
  };
};

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const requestedType = normalizeListingTypeParam(searchParams.get('type'));
  const requestedSearch = searchParams.get('search')?.trim() ?? '';
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const [allListings, setAllListings] = useState<ListingViewModel[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedListing, setSelectedListing] = useState<ListingViewModel | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchInput, setSearchInput] = useState(requestedSearch);
  const [filters, setFilters] = useState<ListingFiltersState>(() => {
    const initial = getLocationLabelFromSlug(
      searchParams.get('province'),
      searchParams.get('location'),
    );
    const selectedPricePreset = searchParams.get('price');
    const priceRange = selectedPricePreset && PRICE_PRESETS[selectedPricePreset]
      ? PRICE_PRESETS[selectedPricePreset]
      : DEFAULT_LISTING_FILTERS.priceRange;

    return {
      ...DEFAULT_LISTING_FILTERS,
      listingType: requestedType,
      city: initial.city,
      district: initial.district,
      selectedPricePreset: selectedPricePreset && PRICE_PRESETS[selectedPricePreset] ? selectedPricePreset : null,
      priceRange,
      propertyTypes: parsePropertyTypesParam(searchParams.get('property_type')),
      bedrooms: parseBedroomsParam(searchParams.get('bedrooms')),
    };
  });
  const [serverFilters, setServerFilters] = useState<ListingFiltersState>(filters);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setServerFilters(filters);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  const activeServerFilters = serverFilters;

  const propertyQueryFilters = useMemo(() => {
    const activeFilters = activeServerFilters;
    const [minPriceBillion, maxPriceBillion] = activeFilters.priceRange;
    const listingTypeValue = activeFilters.listingType === 'buy' ? 'sale' : 'rent';
    const ordering = sortBy === 'price-asc' ? 'price' : sortBy === 'price-desc' ? '-price' : '-created_at';
    const query: PropertyFilters = {
      listing_type: listingTypeValue,
      price_min: Math.round(minPriceBillion * 1_000_000_000),
      price_max: Math.round(maxPriceBillion * 1_000_000_000),
      ordering,
      page: currentPage,
      page_size: ITEMS_PER_PAGE,
    };

    if (requestedSearch) query.search = requestedSearch;
    if (activeFilters.city) query.city = activeFilters.city;
    if (activeFilters.district) query.district = activeFilters.district;
    if (activeFilters.propertyTypes.length === 1) {
      query.property_type = activeFilters.propertyTypes[0];
    } else if (activeFilters.propertyTypes.length > 1) {
      query.property_types = activeFilters.propertyTypes.join(',');
    }
    if (activeFilters.bedrooms !== null) {
      if (activeFilters.bedrooms >= 5) {
        query.bedrooms_min = activeFilters.bedrooms;
      } else {
        query.bedrooms = activeFilters.bedrooms;
      }
    }

    return query;
  }, [activeServerFilters, currentPage, requestedSearch, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchListings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getProperties(propertyQueryFilters, controller.signal);
        const items = normalizeListResponse(response);
        const mapped = items.map(mapPropertyToListing);
        setAllListings(mapped);
        setTotalResults(Array.isArray(response) ? mapped.length : response.count);
      } catch (_err) {
        const err = _err as {
          response?: { status?: number };
          code?: string;
        };
        if (err.code === 'ERR_CANCELED' || controller.signal.aborted) {
          return;
        }
        const statusCode = err.response?.status;
        const nextMessage = statusCode
          ? `Khong tai duoc danh sach bat dong san tu he thong (HTTP ${statusCode}).`
          : 'Khong tai duoc danh sach bat dong san tu he thong. Kiem tra backend, API URL hoac CORS.';
        setError(nextMessage);
        setAllListings([]);
        setTotalResults(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchListings();
    return () => {
      controller.abort();
    };
  }, [propertyQueryFilters]);

  useEffect(() => {
    const next = getLocationLabelFromSlug(
      searchParams.get('province'),
      searchParams.get('location'),
    );
    const nextListingType = normalizeListingTypeParam(searchParams.get('type'));
    const nextPricePreset = searchParams.get('price');
    const nextPriceRange = nextPricePreset && PRICE_PRESETS[nextPricePreset]
      ? PRICE_PRESETS[nextPricePreset]
      : DEFAULT_LISTING_FILTERS.priceRange;
    const nextPropertyTypes = parsePropertyTypesParam(searchParams.get('property_type'));
    const nextBedrooms = parseBedroomsParam(searchParams.get('bedrooms'));

    setFilters((current) => {
      if (
        current.city === next.city &&
        current.district === next.district &&
        current.listingType === nextListingType &&
        current.selectedPricePreset === (nextPricePreset && PRICE_PRESETS[nextPricePreset] ? nextPricePreset : null) &&
        current.priceRange[0] === nextPriceRange[0] &&
        current.priceRange[1] === nextPriceRange[1] &&
        current.bedrooms === nextBedrooms &&
        current.propertyTypes.join(',') === nextPropertyTypes.join(',')
      ) {
        return current;
      }

      return {
        ...current,
        listingType: nextListingType,
        city: next.city,
        district: next.district,
        selectedPricePreset: nextPricePreset && PRICE_PRESETS[nextPricePreset] ? nextPricePreset : null,
        priceRange: nextPriceRange,
        propertyTypes: nextPropertyTypes,
        bedrooms: nextBedrooms,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    setSearchInput(requestedSearch);
  }, [requestedSearch]);

  const cityOptions = useMemo(() => {
    return dedupeLocations([
      ...VIETNAM_PROVINCES.map((item) => item.name),
      ...VIETNAM_ADMINISTRATIVE_UNITS.map((item) => item.name),
      ...allListings.map((item) => item.city).filter(Boolean),
    ]);
  }, [allListings]);

  const districtOptions = useMemo(() => {
    if (!filters.city) return [];
    const normalizedCity = normalizeLocationValue(filters.city);
    const province = VIETNAM_PROVINCES.find((item) => normalizeLocationValue(item.name) === normalizedCity);
    const administrativeProvince = getAdministrativeProvince(filters.city);

    const referenceDistricts = administrativeProvince
      ? administrativeProvince.districts.map((item) => item.full_name || item.name)
      : province?.locations.map((item) => item.name) ?? [];

    return dedupeLocations([
      ...allListings
        .filter((item) => normalizeLocationValue(item.city) === normalizedCity)
        .map((item) => item.district)
        .filter(Boolean) as string[],
      ...referenceDistricts,
    ]);
  }, [allListings, filters.city]);

  const totalPages = Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE));
  const paginatedListings = allListings;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, requestedSearch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!selectedListing) return;
    const exists = allListings.some((item) => item.id === selectedListing.id);
    if (!exists) {
      setSelectedListing(null);
    }
  }, [allListings, selectedListing]);

  const handleToggleFavorite = async (
    propertyId: number,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const previous = allListings.find((item) => item.id === propertyId)?.isFavorited ?? false;
    setAllListings((current) =>
      current.map((item) => item.id === propertyId ? { ...item, isFavorited: !previous } : item),
    );

    try {
      const result = await toggleFavorite(propertyId);
      setAllListings((current) =>
        current.map((item) => item.id === propertyId ? { ...item, isFavorited: result.is_favorited } : item),
      );
    } catch {
      setAllListings((current) =>
        current.map((item) => item.id === propertyId ? { ...item, isFavorited: previous } : item),
      );
      setError('Cannot update favorite right now. Please try again.');
    }
  };

  const updateSearchParam = (value: string) => {
    const params = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <div className="bg-white">
        <Header />
      </div>

      <main className="max-w-[1440px] mx-auto px-6 pr-12 pt-40 pb-16">
        <div className="flex gap-8">
          <motion.aside
            className="hidden lg:block sticky top-40 h-[calc(100vh-160px)] overflow-y-auto w-[300px] flex-shrink-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-10 pr-3"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <FilterSidebar
              value={filters}
              cities={cityOptions}
              districts={districtOptions}
              onChange={setFilters}
            />
          </motion.aside>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-6 space-y-4">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  updateSearchParam(searchInput);
                }}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm md:flex-row md:items-center"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by title, street, district, province..."
                    className="h-11 w-full rounded-xl border border-transparent bg-secondary/40 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary/30 focus:bg-white"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        updateSearchParam('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="h-11 px-6">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>

              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{totalResults}</span> results
                </p>
                <div className="flex items-center gap-3">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="h-9 gap-2"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                  >
                    {sortBy === 'newest' && 'Newest'}
                    {sortBy === 'price-asc' && 'Price: Low to High'}
                    {sortBy === 'price-desc' && 'Price: High to Low'}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {showSortMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-10">
                      <button
                        onClick={() => {
                          setSortBy('newest');
                          setShowSortMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                      >
                        Newest
                        {sortBy === 'newest' && <Check className="w-4 h-4 text-primary" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('price-asc');
                          setShowSortMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                      >
                        Price: Low to High
                        {sortBy === 'price-asc' && <Check className="w-4 h-4 text-primary" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('price-desc');
                          setShowSortMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                      >
                        Price: High to Low
                        {sortBy === 'price-desc' && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center bg-white rounded-lg border border-border p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === 'grid'
                        ? 'bg-secondary text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/50',
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === 'list'
                        ? 'bg-secondary text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/50',
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </div>
            </div>

            {loading && (
              <div className="bg-white border border-border rounded-xl p-6 text-muted-foreground">
                Loading listings...
              </div>
            )}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
            )}

            {!loading && !error && (
              <div className="flex min-h-[calc(100vh-320px)] flex-col">
                <motion.div
                  className={cn(
                    'pb-10 transition-all duration-300 ease-in-out',
                    viewMode === 'grid'
                      ? cn(
                          'grid gap-6',
                          selectedListing ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                        )
                      : 'flex flex-col gap-4',
                  )}
                  key={viewMode}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.08, delayChildren: 0.12 },
                    },
                  }}
                >
                  {paginatedListings.map((listing) => (
                    <motion.div
                      key={listing.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: { type: 'spring', stiffness: 100, damping: 15 },
                        },
                      }}
                    >
                      {viewMode === 'grid' ? (
                        <ListingCard
                          {...listing}
                          isSelected={selectedListing?.id === listing.id}
                          onClick={() => setSelectedListing(listing)}
                          isSaved={listing.isFavorited}
                          onToggleFavorite={(event) => handleToggleFavorite(listing.id, event)}
                        />
                      ) : (
                        <ListingRow
                          {...listing}
                          isSelected={selectedListing?.id === listing.id}
                          onClick={() => setSelectedListing(listing)}
                          isSaved={listing.isFavorited}
                          onToggleFavorite={(event) => handleToggleFavorite(listing.id, event)}
                        />
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                <div className="mt-auto pt-8">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </div>
            )}
          </div>

          {selectedListing && (
            <aside className="hidden xl:block w-[400px] flex-shrink-0 sticky top-40 h-[calc(100vh-160px)] overflow-hidden animate-in slide-in-from-right-10 fade-in duration-300">
              <DetailPanel listing={selectedListing} onClose={() => setSelectedListing(null)} />
            </aside>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Listings;
