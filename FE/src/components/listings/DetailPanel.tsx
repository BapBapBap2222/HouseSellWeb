import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Bath, Bed, Heart, MapPin, Maximize, Share2, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ScheduleModal } from '@/components/common/ScheduleModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment } from '@/lib/appointmentsApi';
import {
  getImageUrl,
  getProperty,
  Property,
  PropertyAvailabilityDay,
  toggleFavorite,
} from '@/lib/propertiesApi';

interface DetailPanelProps {
  listing: {
    id: number;
    image: string;
    price: string;
    title: string;
    address: string;
    beds: number;
    baths: number;
    area: number;
  };
  onClose?: () => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';

const parseTimeTo24h = (raw: string | undefined, fallbackDate: Date): string => {
  if (!raw) return format(fallbackDate, 'HH:mm');
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return format(fallbackDate, 'HH:mm');

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  let converted = hour % 12;
  if (period === 'PM') converted += 12;
  return `${String(converted).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const getReadableError = (error: unknown, fallback: string): string => {
  const payload = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.detail === 'string') return record.detail;
    const firstArray = Object.values(record).find((value) => Array.isArray(value));
    if (Array.isArray(firstArray) && typeof firstArray[0] === 'string') {
      return firstArray[0];
    }
  }
  return fallback;
};

const buildFeatureList = (property: Property): string[] => {
  const features: string[] = [];
  if (property.has_parking) features.push('Parking');
  if (property.has_pool) features.push('Swimming Pool');
  if (property.has_garden) features.push('Garden');
  if (property.is_furnished) features.push('Furnished');
  if (property.is_featured) features.push('Featured');
  return features;
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const DetailPanel = ({ listing, onClose }: DetailPanelProps) => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProperty = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getProperty(listing.id);
        if (!mounted) return;
        setProperty(data);
        setIsSaved(Boolean(data.is_favorited));
      } catch {
        if (!mounted) return;
        setProperty(null);
        setError('Cannot load the selected property right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProperty();
    return () => {
      mounted = false;
    };
  }, [listing.id]);

  const gallery = useMemo(() => {
    if (!property) {
      return [{ src: listing.image || FALLBACK_IMAGE, caption: '' }];
    }

    const primary = property.primary_image
      ? [{ src: getImageUrl(property.primary_image), caption: property.images?.find((item) => item.is_primary)?.caption || '' }]
      : [];
    const others =
      property.images?.map((image) => ({
        src: getImageUrl(image.image),
        caption: image.caption || '',
      })) ?? [];

    const unique = Array.from(
      new Map([...primary, ...others].map((image) => [image.src, image])).values(),
    );

    return unique.length ? unique : [{ src: listing.image || FALLBACK_IMAGE, caption: '' }];
  }, [listing.image, property]);

  const detailRows = useMemo(() => {
    if (!property) return [];

    const rows: Array<{ label: string; value: string }> = [
      { label: 'Property Type', value: property.property_type_display || property.property_type },
      { label: 'Listing Type', value: property.listing_type_display || property.listing_type },
      { label: 'Area', value: `${property.area} m²` },
      { label: 'Facing', value: property.facing || 'Not specified' },
      { label: 'Legal', value: property.legal_status || 'Not specified' },
    ];

    if (property.property_type !== 'land') {
      rows.push(
        { label: 'Beds', value: String(property.bedrooms ?? 0) },
        { label: 'Baths', value: String(property.bathrooms ?? 0) },
        { label: 'Floors', value: String(property.floors ?? 0) },
        { label: 'Year Built', value: property.year_built ? String(property.year_built) : 'Not specified' },
        { label: 'Parking', value: property.parking_details || 'Not specified' },
        { label: 'Furniture', value: property.furniture_status || 'Not specified' },
      );
    }

    return rows;
  }, [property]);

  const features = useMemo(() => (property ? buildFeatureList(property) : []), [property]);
  const agentName =
    property?.owner_name?.trim() ||
    property?.owner_username?.trim() ||
    'Property Agent';
  const availabilitySchedule = (property?.availability_schedule ?? []) as PropertyAvailabilityDay[];
  const locationText = property
    ? [property.address, property.district, property.city].filter(Boolean).join(', ')
    : listing.address;

  const handleOpenSchedule = () => {
    setBookingError('');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!user?.phone) {
      setBookingError('Please update your phone number in profile before booking.');
      return;
    }
    setIsScheduleModalOpen(true);
  };

  const handleSchedule = async (date: Date, isCustom: boolean, selectedTime?: string) => {
    if (!property || !user) return;

    const rawName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    const contactName = rawName || user.username;
    const normalizedTime = parseTimeTo24h(selectedTime, date);

    try {
      setBookingLoading(true);
      setBookingError('');
      const appointment = await createAppointment({
        property: property.id,
        date: format(date, 'yyyy-MM-dd'),
        time: normalizedTime,
        name: contactName,
        phone: user.phone ?? '',
        message: isCustom
          ? 'Requested with custom time from listings panel.'
          : 'Requested from listings panel.',
      });
      setIsScheduleModalOpen(false);
      navigate(`/appointment/${appointment.id}`);
    } catch (err) {
      setBookingError(getReadableError(err, 'Cannot create appointment right now.'));
    } finally {
      setBookingLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!property) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      setFavoriteLoading(true);
      const result = await toggleFavorite(property.id);
      setIsSaved(result.is_favorited);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const title = property?.title || listing.title;
    const url = `${window.location.origin}/property/${listing.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setShareMessage('Property link shared.');
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage('Property link copied.');
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setShareMessage('Cannot share this property right now.');
      }
    } finally {
      window.setTimeout(() => setShareMessage(''), 2400);
    }
  };

  if (!listing) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground bg-white rounded-xl border border-border">
        <p>Select a property to view details</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-border sticky top-20 max-h-[calc(100vh-160px)] flex flex-col overflow-hidden">
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent h-full w-full pb-6">
          <div className="relative h-48 w-full">
            <img src={gallery[0]?.src || FALLBACK_IMAGE} alt={listing.title} className="w-full h-full object-cover" />
            <button
              onClick={handleShare}
              className="absolute top-4 right-14 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              title="Share property"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors text-red-500 disabled:opacity-60"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="mb-2 flex flex-col gap-2">
                <h2 className="text-xl font-bold text-foreground leading-tight break-words">
                  {property?.title || listing.title}
                </h2>
                <span className="text-xl font-bold text-primary break-words">{listing.price}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>{locationText}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {property?.property_type !== 'land' && (
                  <>
                    <div className="bg-secondary/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <Bed className="w-4 h-4 text-primary" />
                      <span className="font-medium">{property?.bedrooms ?? listing.beds} Beds</span>
                    </div>
                    <div className="bg-secondary/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="font-medium">{property?.bathrooms ?? listing.baths} Baths</span>
                    </div>
                  </>
                )}
                <div className="bg-secondary/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span className="font-medium">{property?.area ?? listing.area} m²</span>
                </div>
              </div>
            </div>

            {loading && <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">Loading details...</div>}
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="border-b border-border mb-6">
              <div className="flex gap-6">
                {['overview', 'detail'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as 'overview' | 'detail')}
                    className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                      activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8 min-h-[150px]">
              {activeTab === 'overview' && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {property?.description || 'No detailed description provided yet.'}
                  </p>

                  <h4 className="font-semibold text-sm mt-4 mb-2">Features</h4>
                  {features.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature) => (
                        <span key={feature} className="text-xs bg-accent/5 text-accent px-2.5 py-1 rounded-full font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No extra features listed yet.</p>
                  )}
                </>
              )}

              {activeTab === 'detail' && (
                <>
                  <div className="space-y-3">
                    {detailRows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 gap-4">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold text-sm mt-6 mb-3">Property Photos</h4>
                  <div className="space-y-4">
                    {gallery.map((photo, index) => (
                      <div key={`${photo.src}-${index}`} className="rounded-xl overflow-hidden border border-border/50">
                        <img src={photo.src} alt={photo.caption || `Property image ${index + 1}`} className="w-full h-36 object-cover" />
                        {photo.caption && <p className="text-xs text-muted-foreground px-3 py-2 bg-secondary/30">{photo.caption}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 bg-secondary/30 rounded-xl">
              <Avatar className="w-10 h-10">
                <AvatarImage src={property?.owner_phone ? undefined : undefined} />
                <AvatarFallback>{getInitials(agentName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{agentName}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span>{property?.owner_agent_slug ? 'Verified agent profile available' : 'Agent profile unavailable'}</span>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {bookingError}
              </div>
            )}
            {shareMessage && (
              <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                {shareMessage}
              </div>
            )}

            <div className="space-y-3 mb-6">
              <Button
                className="w-full h-11 text-base font-semibold"
                onClick={() => {
                  if (property?.owner_agent_slug) {
                    navigate(`/agents/${property.owner_agent_slug}`);
                    return;
                  }
                  setBookingError('This seller does not have a public agent profile yet.');
                }}
              >
                Contact Agent
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-base font-semibold"
                onClick={handleOpenSchedule}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Booking...' : 'Book Viewing'}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-base font-semibold"
                onClick={() => navigate(`/property/${listing.id}`)}
              >
                Read More
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Property Location
              </div>
              <div className="text-sm font-medium leading-relaxed text-foreground">
                {locationText || 'Location details will appear here once the seller updates them.'}
              </div>
              <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Full gallery, map and extended information are available in the property page.
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleSchedule}
        propertyName={property?.title || listing.title}
        availabilitySchedule={availabilitySchedule}
      />
    </>
  );
};
