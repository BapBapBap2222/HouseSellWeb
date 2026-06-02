import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Map, MapControls, MapMarker, MarkerContent } from '@/components/ui/map';
import { ScheduleModal } from '@/components/common/ScheduleModal';
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  CalendarCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Image,
  Layers,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  Share2,
  Shield,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment } from '@/lib/appointmentsApi';
import { deleteProperty, getImageUrl, getProperty, Property, toggleFavorite } from '@/lib/propertiesApi';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop';

const formatVndPrice = (price?: number | string | null): string => {
  const value = Number(price ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 'N/A';
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`;
};

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
    if (typeof record.error === 'string') return record.error;
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

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadProperty = async () => {
      const propertyId = Number(id);
      if (!Number.isInteger(propertyId) || propertyId <= 0) {
        if (mounted) {
          setError('Property ID is invalid.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getProperty(propertyId);
        if (!mounted) return;

        setProperty(data);
        setIsSaved(Boolean(data.is_favorited));
        setActiveImage(0);
      } catch {
        if (mounted) {
          setError('Cannot load property details from server.');
          setProperty(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProperty();
    return () => {
      mounted = false;
    };
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!property) return [FALLBACK_IMAGE];
    const fromImages =
      property.images?.map((img) => getImageUrl(img.image)).filter(Boolean) ?? [];
    const merged = [
      ...(property.primary_image ? [getImageUrl(property.primary_image)] : []),
      ...fromImages,
    ];
    const unique = Array.from(new Set(merged));
    return unique.length > 0 ? unique : [FALLBACK_IMAGE];
  }, [property]);

  const mapLat = toNumber(property?.latitude) ?? 10.7769;
  const mapLng = toNumber(property?.longitude) ?? 106.7009;
  const availabilitySchedule = property?.availability_schedule ?? [];

  const detailRows = useMemo(() => {
    if (!property) return [];
    const rows = [
      { label: 'Property Type', value: property.property_type_display || property.property_type, icon: Building2 },
      { label: 'Listing Type', value: property.listing_type_display || property.listing_type, icon: Layers },
      { label: 'Status', value: property.status_display || property.status, icon: CheckCircle },
      { label: 'Area', value: `${property.area} m²`, icon: Maximize },
      { label: 'Facing', value: property.facing || 'Not specified', icon: Compass },
      { label: 'Legal', value: property.legal_status || 'Not specified', icon: Shield },
      { label: 'Address', value: property.address, icon: MapPin },
      { label: 'District', value: property.district || 'N/A', icon: Compass },
      { label: 'City', value: property.city, icon: Shield },
    ];

    if (property.property_type !== 'land') {
      rows.splice(
        3,
        0,
        { label: 'Bedrooms', value: property.bedrooms ?? 'N/A', icon: Bed },
        { label: 'Bathrooms', value: property.bathrooms ?? 'N/A', icon: Bath },
        { label: 'Floors', value: property.floors ?? 'N/A', icon: Layers },
        { label: 'Year Built', value: property.year_built ?? 'N/A', icon: CalendarCheck },
        { label: 'Parking', value: property.parking_details || 'Not specified', icon: Building2 },
        { label: 'Furniture', value: property.furniture_status || 'Not specified', icon: Building2 },
      );
    }

    return rows;
  }, [property]);

  const features = useMemo(() => (property ? buildFeatureList(property) : []), [property]);

  const agentName =
    property?.owner_name?.trim() ||
    property?.owner_username?.trim() ||
    'Property Agent';

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
    } catch {
      setBookingError('Cannot update favorite right now. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    const url = `${window.location.origin}/property/${property.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
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

  const handleDeleteProperty = async () => {
    if (!property || !user?.is_staff) return;
    if (!window.confirm(`Delete "${property.title}" permanently?`)) return;

    try {
      setDeleteLoading(true);
      setBookingError('');
      await deleteProperty(property.id);
      navigate('/listings', { replace: true });
    } catch {
      setBookingError('Cannot delete this property right now.');
      setDeleteLoading(false);
    }
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
          ? 'Requested with custom time from property detail.'
          : 'Requested from property detail.',
      });

      setIsScheduleModalOpen(false);
      navigate(`/appointment/${appointment.id}`);
    } catch (err) {
      setBookingError(getReadableError(err, 'Cannot create appointment right now.'));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9]">
        <Header />
        <div className="pt-28 pb-16 max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="text-center py-20 text-slate-500">Loading property details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property || error) {
    return (
      <div className="min-h-screen bg-[#F6F7F9]">
        <Header />
        <div className="pt-28 pb-16 max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Property Not Found</h1>
            <p className="text-slate-500 mb-6">{error || "The property you're looking for is unavailable."}</p>
            <Link to="/listings">
              <Button className="h-11 px-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Listings
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/listings" className="hover:text-teal-600 transition-colors">Listings</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold truncate max-w-[320px]">{property.title}</span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <div className="relative rounded-2xl overflow-hidden mb-3 group">
                  <img
                    src={galleryImages[activeImage]}
                    alt={property.title}
                    className="w-full h-[320px] md:h-[460px] object-cover"
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImage((index) => (index === 0 ? galleryImages.length - 1 : index - 1))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImage((index) => (index === galleryImages.length - 1 ? 0 : index + 1))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                      </button>
                    </>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all cursor-pointer"
                      title="Share property"
                    >
                      <Share2 className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                      onClick={handleToggleFavorite}
                      disabled={favoriteLoading}
                      className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
                    </button>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {activeImage + 1} / {galleryImages.length}
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((img, index) => (
                    <button
                      key={img + index}
                      onClick={() => setActiveImage(index)}
                      className={`relative rounded-xl overflow-hidden h-20 min-w-20 flex-shrink-0 cursor-pointer transition-all ${
                        activeImage === index ? 'ring-2 ring-teal-500 ring-offset-2' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 mb-6"
              >
                <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-start md:justify-between md:gap-6">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 mb-3">
                      {property.property_type_display || property.property_type}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight break-words">
                      {property.title}
                    </h1>
                  </div>
                  <p className="text-xl md:text-3xl font-bold text-teal-700 md:whitespace-nowrap md:shrink-0">
                    {formatVndPrice(property.price)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-5">
                  <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>{[property.address, property.district, property.city].filter(Boolean).join(', ')}</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {property.property_type !== 'land' && (
                    <>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                        <Bed className="w-4 h-4 text-teal-600" />
                        <span className="text-sm font-semibold text-slate-700">{property.bedrooms ?? 0} Bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                        <Bath className="w-4 h-4 text-teal-600" />
                        <span className="text-sm font-semibold text-slate-700">{property.bathrooms ?? 0} Bathrooms</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    <Maximize className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-semibold text-slate-700">{property.area} m²</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 mb-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-3">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {property.description || 'No detailed description provided yet.'}
                </p>

                <h3 className="text-lg font-bold text-slate-900 mb-3">Features & Amenities</h3>
                {features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {feature}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No extra features are currently listed.</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 mb-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4">Property Details</h3>
                <div className="space-y-0">
                  {detailRows.map((row, index) => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between py-3.5 ${
                          index < detailRows.length - 1 ? 'border-b border-slate-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-slate-500">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{row.label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{String(row.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {galleryImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 mb-6"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-teal-600" />
                    Property Photos
                  </h3>
                  <div className="space-y-4">
                    {galleryImages.map((img, index) => (
                      <div key={img + index} className="rounded-xl overflow-hidden border border-slate-100 group">
                        <img
                          src={img}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-56 md:h-72 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  Location
                </h3>
                <p className="text-sm text-slate-500 mb-4">{[property.address, property.district, property.city].filter(Boolean).join(', ')}</p>
                <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-100">
                  <Map
                    viewport={{
                      center: [mapLng, mapLat],
                      zoom: 13,
                      bearing: 0,
                      pitch: 0,
                    }}
                    className="w-full h-full"
                  >
                    <MapMarker longitude={mapLng} latitude={mapLat}>
                      <MarkerContent>
                        <div className="relative h-5 w-5 rounded-full border-[3px] border-white bg-teal-500 shadow-lg" />
                      </MarkerContent>
                    </MapMarker>
                    <MapControls position="bottom-right" />
                  </Map>
                </div>
              </motion.div>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="w-full lg:w-[380px] flex-shrink-0"
            >
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Listing Contact</h3>

                  <div className="flex items-center gap-4 mb-5">
                    <Avatar className="w-14 h-14 border-2 border-teal-100">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-sky-500 text-white font-bold text-lg">
                        {agentName
                          .split(' ')
                          .filter(Boolean)
                          .map((name) => name[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{agentName}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Verified owner</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="font-medium">{property.owner_phone || 'Phone hidden'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="font-medium">{property.owner_username ? `${property.owner_username}@example.com` : 'Contact via platform'}</span>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {bookingError}
                    </div>
                  )}
                  {shareMessage && (
                    <div className="mb-4 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                      {shareMessage}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base font-bold rounded-xl border-2 border-slate-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                      onClick={() => {
                        if (property.owner_agent_slug) {
                          navigate(`/agents/${property.owner_agent_slug}`);
                          return;
                        }
                        setBookingError('This seller does not have a public agent profile yet.');
                      }}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Agent
                    </Button>
                    <Button
                      onClick={handleOpenSchedule}
                      disabled={bookingLoading}
                      className="w-full h-12 text-base font-bold rounded-xl bg-teal-600 hover:bg-teal-700 cursor-pointer disabled:opacity-70"
                    >
                      <CalendarCheck className="w-5 h-5 mr-2" />
                      {bookingLoading ? 'Booking...' : 'Book Appointment'}
                    </Button>
                    {user?.is_staff && (
                      <Button
                        variant="destructive"
                        className="w-full h-12 text-base font-bold rounded-xl cursor-pointer"
                        disabled={deleteLoading}
                        onClick={handleDeleteProperty}
                      >
                        {deleteLoading ? 'Deleting...' : 'Delete Property'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>

      <Footer />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleSchedule}
        propertyName={property.title}
        availabilitySchedule={availabilitySchedule}
      />
    </div>
  );
};

export default PropertyDetail;

