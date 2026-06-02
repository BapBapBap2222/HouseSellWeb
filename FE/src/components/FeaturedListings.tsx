import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertyCard } from './PropertyCard';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl, getProperties, normalizeListResponse, Property, toggleFavorite } from '@/lib/propertiesApi';

const filterChips = ['All', 'Apartment', 'Townhouse', 'Land', 'Office'];
const FEATURED_CACHE_TTL_MS = 60_000;

let featuredListingsCache: {
  key: string;
  items: FeaturedListingItem[];
  cachedAt: number;
} | null = null;

interface FeaturedListingItem {
  id: number;
  image: string;
  price: string;
  title: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  isVerified: boolean;
  isNew: boolean;
  isFavorited: boolean;
  propertyType: 'house' | 'apartment' | 'land' | 'villa' | 'other';
}

const chipToPropertyType: Record<string, FeaturedListingItem['propertyType'] | null> = {
  All: null,
  Apartment: 'apartment',
  Townhouse: 'house',
  Land: 'land',
  Office: 'other',
};

const formatListingPrice = (price: number) => {
  if (!Number.isFinite(price) || price <= 0) return 'N/A';
  return `${new Intl.NumberFormat('vi-VN').format(price)} VND`;
};

const toFeaturedItem = (property: Property): FeaturedListingItem => {
  const createdAt = property.created_at ? new Date(property.created_at) : null;
  const isNew = createdAt ? Date.now() - createdAt.getTime() <= 1000 * 60 * 60 * 24 * 14 : false;

  return {
    id: property.id,
    image: property.primary_image
      ? getImageUrl(property.primary_image)
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
    price: formatListingPrice(Number(property.price || 0)),
    title: property.title,
    address: [property.district, property.city].filter(Boolean).join(', '),
    beds: property.bedrooms ?? 0,
    baths: property.bathrooms ?? 0,
    area: Number(property.area || 0),
    isVerified: Boolean(property.is_featured),
    isNew,
    isFavorited: Boolean(property.is_favorited),
    propertyType: property.property_type,
  };
};

export const FeaturedListings = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const cacheKey = user?.username ?? 'guest';
  const [activeFilter, setActiveFilter] = useState('All');
  const [listings, setListings] = useState<FeaturedListingItem[]>(() => {
    if (!featuredListingsCache) return [];
    const isFresh = featuredListingsCache.key === cacheKey && Date.now() - featuredListingsCache.cachedAt < FEATURED_CACHE_TTL_MS;
    return isFresh ? featuredListingsCache.items : [];
  });
  const [loading, setLoading] = useState(() => listings.length === 0);

  useEffect(() => {
    const cached = featuredListingsCache;
    if (cached && cached.key === cacheKey && Date.now() - cached.cachedAt < FEATURED_CACHE_TTL_MS) {
      setListings(cached.items);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchFeaturedListings = async () => {
      setLoading(true);
      try {
        const response = await getProperties(
          {
            ordering: '-is_featured,-created_at',
            page: 1,
            page_size: 12,
          },
          controller.signal,
        );
        const source = normalizeListResponse(response).map(toFeaturedItem).slice(0, 12);

        featuredListingsCache = { key: cacheKey, items: source, cachedAt: Date.now() };
        setListings(source);
      } catch (_error) {
        const error = _error as { code?: string };
        if (error.code === 'ERR_CANCELED' || controller.signal.aborted) {
          return;
        }
        setListings([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedListings();
    return () => {
      controller.abort();
    };
  }, [cacheKey]);

  const filteredListings = useMemo(() => {
    const propertyType = chipToPropertyType[activeFilter];
    if (!propertyType) return listings.slice(0, 6);
    return listings.filter((listing) => listing.propertyType === propertyType).slice(0, 6);
  }, [activeFilter, listings]);

  const handleToggleFavorite = async (
    propertyId: number,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const previous = listings.find((item) => item.id === propertyId)?.isFavorited ?? false;
    setListings((current) =>
      current.map((item) => item.id === propertyId ? { ...item, isFavorited: !previous } : item),
    );

    try {
      const result = await toggleFavorite(propertyId);
      const syncFavoriteState = (current: FeaturedListingItem[]) =>
        current.map((item) => item.id === propertyId ? { ...item, isFavorited: result.is_favorited } : item);
      setListings(syncFavoriteState);
      if (featuredListingsCache) {
        featuredListingsCache = {
          ...featuredListingsCache,
          items: syncFavoriteState(featuredListingsCache.items),
        };
      }
    } catch {
      setListings((current) =>
        current.map((item) => item.id === propertyId ? { ...item, isFavorited: previous } : item),
      );
    }
  };

  return (
    <section className="section-padding bg-surface">
      <div className="max-w-content mx-auto px-4 md:px-8">
        <div className="section-header">
          <div>
            <h2 className="mb-2">Featured Listings</h2>
            <p className="text-muted-foreground">Discover the most popular real estate listings</p>
          </div>
          <Link to="/listings" className="text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={cn('chip', activeFilter === chip ? 'chip-active' : 'chip-default')}
            >
              {chip}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-muted-foreground py-10">Loading featured listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="card-elevated p-8 text-center text-muted-foreground">
            No featured listings are available right now.
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {filteredListings.map((listing) => (
              <motion.div
                key={listing.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <PropertyCard
                  {...listing}
                  isSaved={listing.isFavorited}
                  onToggleFavorite={(event) => handleToggleFavorite(listing.id, event)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};
