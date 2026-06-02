import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Map, MapControls, MapMarker, MarkerContent } from '@/components/ui/map';
import {
  ArrowLeft,
  Bath,
  Bed,
  CalendarCheck,
  CalendarClock,
  Clock,
  MapPin,
  Maximize,
  Share2,
  Heart,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Appointment,
  cancelAppointment,
  getAppointmentDetails,
} from '@/lib/appointmentsApi';
import { getImageUrl, getProperty, Property } from '@/lib/propertiesApi';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop';

const statusMeta: Record<
  Appointment['status'],
  { label: string; badge: string; icon: JSX.Element }
> = {
  pending: {
    label: 'Pending Seller Approval',
    badge: 'bg-orange-50 border-orange-200 text-orange-700',
    icon: <CalendarClock className="w-4 h-4" />,
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: <CalendarCheck className="w-4 h-4" />,
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-red-50 border-red-200 text-red-700',
    icon: <XCircle className="w-4 h-4" />,
  },
  completed: {
    label: 'Completed',
    badge: 'bg-sky-50 border-sky-200 text-sky-700',
    icon: <CalendarCheck className="w-4 h-4" />,
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-100 border-slate-200 text-slate-700',
    icon: <XCircle className="w-4 h-4" />,
  },
};

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

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const appointmentId = Number(id);
      if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
        if (mounted) {
          setError('Appointment ID is invalid.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const detail = await getAppointmentDetails(appointmentId);
        if (!mounted) return;
        setAppointment(detail);

        try {
          const propertyData = await getProperty(detail.property);
          if (mounted) setProperty(propertyData);
        } catch {
          if (mounted) setProperty(null);
        }
      } catch {
        if (mounted) {
          setError('Cannot load appointment details from server.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
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

  const mapLat = toNumber(property?.latitude);
  const mapLng = toNumber(property?.longitude);

  const statusInfo = appointment ? statusMeta[appointment.status] : null;

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    try {
      setIsCancelling(true);
      await cancelAppointment(appointment.id);
      setAppointment({ ...appointment, status: 'cancelled' });
    } catch {
      setError('Cannot cancel this appointment. It may already be processed.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/appointment/${appointment?.id ?? id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: appointment?.property_title ?? 'Viewing appointment', url });
        setShareMessage('Appointment link shared.');
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage('Appointment link copied.');
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setShareMessage('Cannot share this appointment right now.');
      }
    } finally {
      window.setTimeout(() => setShareMessage(''), 2400);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9]">
        <Header />
        <div className="pt-28 pb-16 max-w-[1440px] mx-auto px-4 md:px-8 text-center text-slate-500">
          Loading appointment details...
        </div>
        <Footer />
      </div>
    );
  }

  if (!appointment || error) {
    return (
      <div className="min-h-screen bg-[#F6F7F9]">
        <Header />
        <div className="pt-28 pb-16 max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <XCircle className="w-14 h-14 text-red-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Appointment Not Found</h1>
            <p className="text-slate-500 mb-6">{error || 'This appointment is no longer available.'}</p>
            <Button onClick={() => navigate('/profile?tab=buy')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Buy Tab
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />

      <main className="pt-28 pb-16 max-w-[1440px] mx-auto px-4 md:px-8">
        <button
          onClick={() => navigate('/profile?tab=buy')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile (Buy Tab)
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="relative h-[360px] md:h-[460px] w-full bg-gray-100">
              <img
                src={galleryImages[activeImage]}
                alt={property?.title || appointment.property_title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-all text-gray-600"
                  aria-label="Share appointment"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <Link
                  to={property ? `/property/${property.id}` : '/listings'}
                  className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-all text-red-500"
                  aria-label="Open property"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </Link>
              </div>
            </div>

            <div className="p-4 flex gap-2 border-b border-slate-100">
              {galleryImages.slice(0, 4).map((image, index) => (
                <button
                  key={image + index}
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    'h-16 flex-1 rounded-lg overflow-hidden border',
                    activeImage === index ? 'border-teal-500' : 'border-transparent'
                  )}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground leading-tight mb-2">
                    {property?.title || appointment.property_title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-lg">{property?.address || appointment.property_address}</span>
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#0F766E] whitespace-nowrap">
                  {formatVndPrice(property?.price)}
                </div>
              </div>

              {property && (
                <div className="flex flex-wrap items-center gap-4 text-base mb-8 pb-8 border-b border-border">
                  <div className="bg-secondary/50 px-4 py-2 rounded-xl flex items-center gap-2 border border-border">
                    <Bed className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{property.bedrooms ?? 0} Beds</span>
                  </div>
                  <div className="bg-secondary/50 px-4 py-2 rounded-xl flex items-center gap-2 border border-border">
                    <Bath className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{property.bathrooms ?? 0} Baths</span>
                  </div>
                  <div className="bg-secondary/50 px-4 py-2 rounded-xl flex items-center gap-2 border border-border">
                    <Maximize className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{property.area} m²</span>
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold mb-4">Property Overview</h3>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                {property?.description || 'No additional property description is currently available.'}
              </p>

              {mapLat !== null && mapLng !== null ? (
                <>
                  <h3 className="text-xl font-bold mb-4">Location</h3>
                  <div className="h-72 w-full rounded-xl overflow-hidden border border-border mb-8">
                    <Map
                      viewport={{ center: [mapLng, mapLat], zoom: 13, bearing: 0, pitch: 0 }}
                    className="w-full h-full"
                  >
                    <MapMarker longitude={mapLng} latitude={mapLat}>
                      <MarkerContent>
                        <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
                      </MarkerContent>
                    </MapMarker>
                      <MapControls position="bottom-right" />
                    </Map>
                  </div>
                </>
              ) : (
                <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  Exact map coordinates are not available for this property.
                </div>
              )}

              <h3 className="text-xl font-bold mb-4">Listing Contact</h3>
              <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-gray-50/50">
                <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {(property?.owner_name || appointment.property_owner)
                      .split(' ')
                      .filter(Boolean)
                      .map((name) => name[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-lg font-bold text-foreground">
                    {property?.owner_name || appointment.property_owner}
                  </h4>
                  <p className="text-sm text-gray-500 mb-1">Property Owner / Broker</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Current appointment status: {statusInfo?.label}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[380px] flex-shrink-0">
            <div className="sticky top-28 bg-white rounded-2xl shadow-lg border border-border p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Viewing Schedule</h3>
                <div
                  className={cn(
                    'p-4 rounded-xl border transition-colors mb-4',
                    statusInfo?.badge
                  )}
                >
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Status
                  </div>
                  <div className="text-lg font-bold flex items-center gap-2">
                    {statusInfo?.icon}
                    {statusInfo?.label}
                  </div>
                  <div className="mt-3 font-medium">
                    Time: {appointment.time}, {new Date(appointment.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-3">
                  {shareMessage && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                      {shareMessage}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-12 text-base font-bold transition-all',
                      !['pending', 'confirmed'].includes(appointment.status)
                        ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                        : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                    )}
                    onClick={handleCancelAppointment}
                    disabled={!['pending', 'confirmed'].includes(appointment.status) || isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        Cancel Appointment
                      </>
                    )}
                  </Button>

                  {property && (
                    <Link to={`/property/${property.id}`}>
                      <Button className="w-full h-12 text-base font-bold bg-[#0F766E] hover:bg-[#0F766E]/90">
                        View Property Detail
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <hr className="border-border" />

              <div>
                <h3 className="text-lg font-bold mb-3">Your Contact Info</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Name:</span> {appointment.name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span> {appointment.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Message:</span>{' '}
                    {appointment.message || 'No extra message'}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppointmentDetail;

