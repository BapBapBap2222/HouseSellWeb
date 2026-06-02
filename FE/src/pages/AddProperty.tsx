import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Info } from 'lucide-react';

import PropertyEditorFields from '@/components/properties/PropertyEditorFields';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  EMPTY_PROPERTY_FORM,
  PropertyFormState,
  PropertyTypeValue,
  applyPropertyTypeRules,
  buildPropertyPayload,
} from '@/lib/propertyForm';
import {
  createProperty,
  deleteProperty,
  uploadPropertyImages,
} from '@/lib/propertiesApi';

type LocalImage = {
  id: string;
  file: File;
  preview: string;
  caption: string;
  isPrimary: boolean;
};

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
  return 'Could not create the property listing. Please try again.';
};

const AddProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<PropertyFormState>(EMPTY_PROPERTY_FORM);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryImageId = useMemo(() => images.find((img) => img.isPrimary)?.id, [images]);

  const updateField = (field: keyof PropertyFormState, value: string) => {
    setForm((prev) => {
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
    setForm((prev) => ({ ...prev, [field]: checked }));
  };

  const updatePropertyType = (value: PropertyTypeValue) => {
    setForm((prev) => applyPropertyTypeRules(value, prev));
  };

  const handleSelectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setImages((prev) => {
      const next = [...prev];
      files.forEach((file) => {
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
        next.push({
          id,
          file,
          preview: URL.createObjectURL(file),
          caption: '',
          isPrimary: next.length === 0,
        });
      });
      return next;
    });

    event.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const toRemove = prev.find((item) => item.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.preview);
      const next = prev.filter((item) => item.id !== id);
      if (next.length > 0 && !next.some((item) => item.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const handleSetPrimary = (id: string) => {
    setImages((prev) => prev.map((item) => ({ ...item, isPrimary: item.id === id })));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setImages((prev) => prev.map((item) => (item.id === id ? { ...item, caption } : item)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (images.length < 4) {
        throw new Error('Please upload at least 4 images: 1 primary image and 3 supporting images.');
      }

      if (!images.some((image) => image.isPrimary)) {
        throw new Error('Please select one primary image.');
      }

      const missingCaption = images.find((image) => !image.caption.trim());
      if (missingCaption) {
        throw new Error('Every image must include a subtitle before creating the property.');
      }

      const payload = buildPropertyPayload(form);
      const created = await createProperty(payload);

      try {
        for (let index = 0; index < images.length; index += 1) {
          const image = images[index];
          await uploadPropertyImages(created.id, [image.file], {
            caption: image.caption.trim(),
            isPrimary: image.isPrimary,
            order: index,
          });
        }
      } catch (uploadError) {
        await deleteProperty(created.id);
        throw uploadError;
      }

      toast({
        title: 'Property created',
        description: 'The listing has been created successfully.',
      });
      navigate(`/manage-property/${created.id}`);
    } catch (error) {
      toast({
        title: 'Cannot create property',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 md:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex flex-col gap-3">
            <h1 className="text-4xl font-bold text-slate-900">Create a Sell Listing</h1>
            <p className="max-w-3xl text-slate-500">
              This is the seller workspace. Fill in the public listing information, property details and images so the property can appear correctly in listing detail pages.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <PropertyEditorFields
              form={form}
              onTextChange={updateField}
              onBooleanChange={updateBooleanField}
              onPropertyTypeChange={updatePropertyType}
              disabled={isSubmitting}
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
                      Upload at least 4 images for the listing. One image must be the main cover, and every image needs a subtitle.
                    </p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Select images
                  <input className="hidden" type="file" accept="image/*" multiple onChange={handleSelectImages} />
                </label>
              </div>

              {images.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
                  Add at least 4 images before creating the listing. The first image becomes the cover automatically unless you choose another primary image.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {images.map((image) => (
                  <div key={image.id} className="space-y-3 rounded-[24px] border border-slate-200 p-4">
                    <img src={image.preview} alt={image.file.name} className="h-44 w-full rounded-2xl object-cover" />
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                      placeholder="Image subtitle *"
                      value={image.caption}
                      onChange={(event) => handleCaptionChange(image.id, event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant={image.isPrimary ? 'default' : 'outline'} onClick={() => handleSetPrimary(image.id)}>
                        {primaryImageId === image.id ? 'Primary image' : 'Set primary'}
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => handleRemoveImage(image.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-[20px] bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                You can upload more than 4 images, but every image must have its own subtitle.
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/profile?tab=sell')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Property'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddProperty;
