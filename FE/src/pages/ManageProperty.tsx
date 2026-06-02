import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, ImagePlus, Info, RotateCcw, Save } from 'lucide-react';
import { addDays, format } from 'date-fns';

import PropertyEditorFields from '@/components/properties/PropertyEditorFields';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Appointment, getOwnerAppointments, updateAppointmentStatus } from '@/lib/appointmentsApi';
import {
  PropertyFormState,
  PropertyTypeValue,
  applyPropertyTypeRules,
  buildPropertyPayload,
  mapPropertyToForm,
} from '@/lib/propertyForm';
import { cn } from '@/lib/utils';
import {
  Property,
  PropertyAvailabilityDay,
  deletePropertyImage,
  getImageUrl,
  getProperty,
  updateProperty,
  uploadPropertyImages,
} from '@/lib/propertiesApi';

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const candidate = error as { response?: { data?: unknown } };
  const data = candidate?.response?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const firstEntry = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(firstEntry) && firstEntry.length > 0) return String(firstEntry[0]);
    if (typeof firstEntry === 'string') return firstEntry;
  }
  return 'An unexpected error occurred.';
};

type AvailabilitySchedule = PropertyAvailabilityDay[];

const DEFAULT_AVAILABILITY_SCHEDULE: AvailabilitySchedule = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((dayOfWeek) => ({
  dayOfWeek,
  enabled: false,
  slots: [],
}));

const TIME_OPTIONS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

const addOneHour = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return `${String(hour + 1).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const normalizeSchedule = (schedule: AvailabilitySchedule): AvailabilitySchedule =>
  DEFAULT_AVAILABILITY_SCHEDULE.map((defaultDay) => {
    const existing = schedule.find((day) => day.dayOfWeek === defaultDay.dayOfWeek);
    return {
      dayOfWeek: defaultDay.dayOfWeek,
      enabled: Boolean(existing?.enabled && existing.slots?.length),
      slots: [...(existing?.slots ?? [])].sort((a, b) => a.start.localeCompare(b.start)),
    };
  });

const ManageProperty = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<PropertyFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [markNextPrimary, setMarkNextPrimary] = useState(false);
  const [availabilitySchedule, setAvailabilitySchedule] = useState<AvailabilitySchedule>(DEFAULT_AVAILABILITY_SCHEDULE);
  const [selectedAvailabilityIndex, setSelectedAvailabilityIndex] = useState(0);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [ownerAppointments, setOwnerAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [processingAppointmentId, setProcessingAppointmentId] = useState<number | null>(null);

  const next7Days = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => addDays(new Date(), index)),
    [],
  );

  const gallery = useMemo(() => property?.images ?? [], [property]);
  const propertyAppointments = useMemo(
    () => ownerAppointments.filter((appointment) => appointment.property === propertyId),
    [ownerAppointments, propertyId],
  );
  const selectedAvailabilityDate = next7Days[selectedAvailabilityIndex];
  const selectedAvailabilityDayName = format(selectedAvailabilityDate, 'EEEE');
  const selectedAvailabilityDay =
    availabilitySchedule.find((day) => day.dayOfWeek === selectedAvailabilityDayName) ??
    DEFAULT_AVAILABILITY_SCHEDULE.find((day) => day.dayOfWeek === selectedAvailabilityDayName) ??
    DEFAULT_AVAILABILITY_SCHEDULE[0];

  const refreshProperty = async () => {
    const fresh = await getProperty(propertyId);
    setProperty(fresh);
    setForm(mapPropertyToForm(fresh));
    setAvailabilitySchedule(
      normalizeSchedule(
        ((fresh.availability_schedule as PropertyAvailabilityDay[] | undefined) ?? DEFAULT_AVAILABILITY_SCHEDULE) as AvailabilitySchedule,
      ),
    );
  };

  useEffect(() => {
    if (!Number.isFinite(propertyId)) {
      navigate('/profile?tab=sell');
      return;
    }

    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const fetched = await getProperty(propertyId);
        if (!mounted) return;
        setProperty(fetched);
        setForm(mapPropertyToForm(fetched));
        setAvailabilitySchedule(
          normalizeSchedule(
            ((fetched.availability_schedule as PropertyAvailabilityDay[] | undefined) ?? DEFAULT_AVAILABILITY_SCHEDULE) as AvailabilitySchedule,
          ),
        );
      } catch (error) {
        if (!mounted) return;
        toast({
          title: 'Cannot load property',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
        navigate('/profile?tab=sell');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [propertyId, navigate, toast]);

  useEffect(() => {
    let mounted = true;

    const fetchOwnerRequests = async () => {
      setLoadingAppointments(true);
      try {
        const response = await getOwnerAppointments();
        if (!mounted) return;
        setOwnerAppointments(Array.isArray(response) ? response : response.results);
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load owner appointments:', error);
        setOwnerAppointments([]);
      } finally {
        if (mounted) setLoadingAppointments(false);
      }
    };

    fetchOwnerRequests();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof PropertyFormState, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'city') {
        next.district = '';
        next.ward = '';
      }
      if (field === 'district') {
        next.ward = '';
      }
      return next;
    });
  };

  const updateBooleanField = (field: keyof PropertyFormState, checked: boolean) => {
    setForm((prev) => (prev ? { ...prev, [field]: checked } : prev));
  };

  const updatePropertyType = (value: PropertyTypeValue) => {
    setForm((prev) => (prev ? applyPropertyTypeRules(value, prev) : prev));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !property || saving) return;

    try {
      setSaving(true);
      await updateProperty(property.id, buildPropertyPayload(form));
      await refreshProperty();
      toast({ title: 'Changes saved' });
    } catch (error) {
      toast({
        title: 'Cannot save property',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!property) return;
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    event.target.value = '';

    if (!uploadCaption.trim()) {
      toast({
        title: 'Subtitle required',
        description: 'Please enter a subtitle before uploading new property images.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const startOrder = gallery.length;
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        await uploadPropertyImages(property.id, [file], {
          caption: uploadCaption.trim(),
          isPrimary: markNextPrimary && index === 0,
          order: startOrder + index,
        });
      }
      setUploadCaption('');
      setMarkNextPrimary(false);
      await refreshProperty();
      toast({ title: 'Images uploaded' });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!property) return;
    try {
      await deletePropertyImage(imageId);
      await refreshProperty();
      toast({ title: 'Image deleted' });
    } catch (error) {
      toast({
        title: 'Cannot delete image',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleSaveAvailability = async (schedule: AvailabilitySchedule) => {
    if (!property) return;

    try {
      setSavingAvailability(true);
      await updateProperty(property.id, { availability_schedule: schedule });
      setAvailabilitySchedule(schedule);
      await refreshProperty();
      toast({ title: 'Availability updated' });
    } catch (error) {
      toast({
        title: 'Cannot update availability',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSavingAvailability(false);
    }
  };

  const toggleAvailabilityTimeSlot = (time: string) => {
    setAvailabilitySchedule((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== selectedAvailabilityDayName) return day;

        const nextSlot = { start: time, end: addOneHour(time) };
        const exists = day.slots.some((slot) => slot.start === nextSlot.start && slot.end === nextSlot.end);
        const nextSlots = exists
          ? day.slots.filter((slot) => !(slot.start === nextSlot.start && slot.end === nextSlot.end))
          : [...day.slots, nextSlot].sort((a, b) => a.start.localeCompare(b.start));

        return {
          ...day,
          enabled: nextSlots.length > 0,
          slots: nextSlots,
        };
      }),
    );
  };

  const resetSelectedAvailabilityDay = () => {
    setAvailabilitySchedule((current) =>
      current.map((day) =>
        day.dayOfWeek === selectedAvailabilityDayName
          ? {
              ...day,
              enabled: false,
              slots: [],
            }
          : day,
      ),
    );
  };

  const hasAvailabilitySlot = (time: string) =>
    selectedAvailabilityDay.slots.some((slot) => slot.start === time && slot.end === addOneHour(time));

  const handleAppointmentDecision = async (
    appointmentId: number,
    status: 'confirmed' | 'rejected',
  ) => {
    try {
      setProcessingAppointmentId(appointmentId);
      const response = await updateAppointmentStatus(appointmentId, { status });
      const updatedAppointment = response.data;
      setOwnerAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? updatedAppointment : appointment,
        ),
      );
      toast({
        title: status === 'confirmed' ? 'Appointment accepted' : 'Appointment rejected',
      });
    } catch (error) {
      toast({
        title: 'Cannot update appointment',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-[#F6F7F9]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 md:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">Loading property...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />
      <main className="mx-auto max-w-[1520px] px-4 pb-16 pt-28 md:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Manage Listing #{propertyId}</h1>
              <p className="mt-2 max-w-3xl text-slate-500">
                Update the sell listing information, details and image gallery from one place.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/profile?tab=sell')}>
              Back to Sell tab
            </Button>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_540px] xl:items-start">
            <form className="space-y-8" onSubmit={handleSave}>
              <PropertyEditorFields
                form={form}
                onTextChange={updateField}
                onBooleanChange={updateBooleanField}
                onPropertyTypeChange={updatePropertyType}
                disabled={saving}
              />

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Property Images</h2>
                      <p className="text-sm text-slate-500">
                        Upload more photos, update the primary cover and remove outdated media from the listing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {gallery.map((image) => (
                    <div key={image.id} className="space-y-3 rounded-[24px] border border-slate-200 p-4">
                      <img src={getImageUrl(image.image)} alt={`Property ${image.id}`} className="h-44 w-full rounded-2xl object-cover" />
                      <div className="text-sm text-slate-600">
                        {image.caption || 'No caption'}
                        {image.is_primary ? ' · Primary image' : ''}
                      </div>
                      <Button variant="destructive" type="button" onClick={() => handleDeleteImage(image.id)}>
                        Delete image
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Caption for new images</label>
                      <input
                        className="w-full rounded-[20px] border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                        placeholder="Subtitle for the uploaded images *"
                        value={uploadCaption}
                        onChange={(event) => setUploadCaption(event.target.value)}
                      />
                    </div>
                    <label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      {uploading ? 'Uploading...' : 'Upload images'}
                      <input className="hidden" type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} />
                    </label>
                  </div>

                  <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={markNextPrimary}
                      onChange={(event) => setMarkNextPrimary(event.target.checked)}
                    />
                    Set the first newly uploaded image as primary
                  </label>

                  <div className="mt-4 flex items-start gap-2 rounded-[18px] bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    Every newly uploaded image will use this subtitle, so fill it in before uploading.
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>

            <aside className="space-y-6 self-start xl:sticky xl:top-28">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Viewing Availability</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Configure the exact day and 1-hour slots buyers can choose for this property.
                  </p>
                </div>

                <div className="max-h-[520px] overflow-y-auto overscroll-contain pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="font-semibold text-[1rem] text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Select a Day (Next 7 Days)
                  </h3>

                  <div className="grid grid-cols-7 gap-2 pb-1">
                    {next7Days.map((date, index) => {
                      const weekday = format(date, 'EEEE');
                      const scheduleDay = availabilitySchedule.find((day) => day.dayOfWeek === weekday);
                      const isSelected = selectedAvailabilityIndex === index;

                      return (
                        <button
                          key={`${weekday}-${format(date, 'yyyy-MM-dd')}`}
                          type="button"
                          onClick={() => setSelectedAvailabilityIndex(index)}
                          className={cn(
                            'flex min-h-[88px] flex-col items-center justify-center rounded-[20px] border-2 px-1.5 py-3 transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary'
                              : scheduleDay?.enabled
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                                : 'border-white bg-white text-slate-600 hover:border-slate-200',
                          )}
                        >
                          <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em]">
                            {format(date, 'EEE')}
                          </span>
                          <span className="text-[1.5rem] font-bold leading-none">{format(date, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[1rem] text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Available Times
                    </h3>

                    <button
                      type="button"
                      onClick={resetSelectedAvailabilityDay}
                      className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear day
                    </button>
                  </div>

                  <p className="mt-2 mb-4 text-sm text-slate-400">
                    Click each 1-hour slot to mark when buyers are allowed to book this property.
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {TIME_OPTIONS.map((time) => {
                      const selected = hasAvailabilitySlot(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleAvailabilityTimeSlot(time)}
                          className={cn(
                            'rounded-xl border px-3 py-3 text-sm font-semibold transition-all',
                            selected
                              ? 'border-primary bg-primary text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary',
                          )}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-500">
                  {selectedAvailabilityDay.enabled && selectedAvailabilityDay.slots.length > 0
                    ? `${selectedAvailabilityDay.dayOfWeek}: ${selectedAvailabilityDay.slots.map((slot) => slot.start).join(', ')}`
                    : `No time slot selected for ${selectedAvailabilityDay.dayOfWeek}.`}
                </div>

                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={() => void handleSaveAvailability(availabilitySchedule)}
                  disabled={savingAvailability}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingAvailability ? 'Saving...' : 'Save Availability Settings'}
                </Button>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Appointment Requests</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Short view of buyers who booked this property.
                  </p>
                </div>

                <div className="max-h-[260px] overflow-y-auto overscroll-contain pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {loadingAppointments ? (
                  <div className="text-sm text-slate-500">Loading requests...</div>
                ) : propertyAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    No viewing requests for this property yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {propertyAppointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-800">{appointment.name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {appointment.date} · {appointment.time}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">{appointment.status}</div>
                        {appointment.status === 'pending' && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              className="h-9 flex-1"
                              disabled={processingAppointmentId === appointment.id}
                              onClick={() => void handleAppointmentDecision(appointment.id, 'confirmed')}
                            >
                              {processingAppointmentId === appointment.id ? 'Processing...' : 'Đồng ý'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={processingAppointmentId === appointment.id}
                              onClick={() => void handleAppointmentDecision(appointment.id, 'rejected')}
                            >
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ManageProperty;
