import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Cpu, Sparkles, ChevronDown, RotateCcw, Search,
  Home, Layers, BedDouble, Bath, ArrowRight, CheckCircle2,
  AlertCircle, Loader2, Navigation, Building2, LayoutGrid
} from 'lucide-react';
import { Map, MapMarker, MarkerContent, MapControls, useMap } from '@/components/ui/map';
import api from '@/lib/api';
import { VIETNAM_ADMINISTRATIVE_UNITS } from '@/data/vietnamAdministrative';

// Types
interface Province {
  code: number;
  name: string;
  districts: District[];
}
interface District {
  code: number;
  name: string;
  wards: Ward[];
}
interface Ward {
  code: number;
  name: string;
}
interface PredictionResult {
  estimated_price: number;
  price_min: number;
  price_max: number;
  confidence: number;
  price_per_m2: number;
}
type MapClickEvent = {
  lngLat: {
    lat: number;
    lng: number;
  };
};
type PredictionApiError = {
  response?: {
    data?: {
      error?: unknown;
    };
  };
};

function normalizeApiErrorMessage(errorValue: unknown): string {
  if (typeof errorValue === 'string') {
    return errorValue;
  }

  if (Array.isArray(errorValue)) {
    const parts = errorValue
      .map((item) => normalizeApiErrorMessage(item))
      .filter((msg) => Boolean(msg.trim()));
    return parts.join('; ');
  }

  if (errorValue && typeof errorValue === 'object') {
    const entries = Object.entries(errorValue as Record<string, unknown>);
    const parts = entries
      .map(([field, value]) => {
        const message = normalizeApiErrorMessage(value);
        if (!message) return '';
        return `${field}: ${message}`;
      })
      .filter(Boolean);
    return parts.join(' | ');
  }

  return '';
}

// Constants
const PROPERTY_TYPE_OPTIONS = [
  { value: 'Nhà', label: 'Nhà' },
  { value: 'Đất', label: 'Đất' },
  { value: 'Căn hộ chung cư', label: 'Căn hộ chung cư' },
  { value: 'Biệt thự/Nhà liền kề', label: 'Biệt thự/Nhà liền kề' },
  { value: 'Shophouse', label: 'Shophouse' },
];

// Select Component
function FormSelect({
  label, id, value, onChange, children, icon: Icon, disabled, placeholder,
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; children: React.ReactNode;
  icon?: React.ElementType; disabled?: boolean; placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-teal-600" />}
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border transition-all duration-200 text-sm font-medium outline-none
            ${disabled ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 cursor-pointer'}`}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// Number Input Component
function FormInput({
  label, id, value, onChange, icon: Icon, placeholder, unit, min,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  icon?: React.ElementType; placeholder?: string; unit?: string; min?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-teal-600" />}
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min ?? 0}
          step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium outline-none transition-all duration-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-400"
          style={unit ? { paddingRight: `${unit.length * 10 + 20}px` } : undefined}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}

// Step Indicator
function StepCard({ num, title, desc, icon: Icon }: { num: number; title: string; desc: string; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: num * 0.12 }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center gap-3 px-4"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-100 flex items-center justify-center shadow-sm">
          <Icon className="w-7 h-7 text-teal-600" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 text-white text-xs font-bold flex items-center justify-center shadow">
          {num}
        </span>
      </div>
      <h3 className="font-bold text-slate-800 text-base">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Map Component (using ui/map)
function MapClickListener({ onCoordChange }: { onCoordChange: (lat: string, lng: string) => void }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const handleClick = (e: MapClickEvent) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      onCoordChange(clickLat.toFixed(6), clickLng.toFixed(6));
    };
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, isLoaded, onCoordChange]);
  return null;
}

function MapPanel({
  lat, lng, onCoordChange,
}: {
  lat: string; lng: string; onCoordChange: (lat: string, lng: string) => void;
}) {
  const markerSet = lat !== '' && lng !== '';

  const handleReset = () => {
    onCoordChange('', '');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-700">Chọn vị trí trên bản đồ</span>
        </div>
        {markerSet && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-red-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
          </button>
        )}
      </div>

      <div className="flex-1 min-h-[280px] rounded-xl overflow-hidden border border-slate-200 cursor-crosshair relative">
        <Map
          viewport={{ center: [105.8542, 21.0285], zoom: 5 }}
        >
          <MapClickListener onCoordChange={onCoordChange} />
          {markerSet && (
            <MapMarker longitude={parseFloat(lng)} latitude={parseFloat(lat)}>
              <MarkerContent>
                <div style={{ transform: 'translateY(-20px)' }}>
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="40" fill="none">
                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0F766E"/>
                     <circle cx="12" cy="9" r="2.5" fill="white"/>
                   </svg>
                </div>
              </MarkerContent>
            </MapMarker>
          )}
          <MapControls position="bottom-right" showZoom showLocate />
        </Map>
      </div>

      {/* Coordinates display */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Vĩ độ (Latitude)</span>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-mono text-slate-700 min-h-[36px]">
            {lat || <span className="text-slate-400 text-xs">Chưa chọn</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Kinh độ (Longitude)</span>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-mono text-slate-700 min-h-[36px]">
            {lng || <span className="text-slate-400 text-xs">Chưa chọn</span>}
          </div>
        </div>
      </div>

      {!markerSet && (
        <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
          <Navigation className="w-3.5 h-3.5" />
          Nhấp vào bản đồ để chọn vị trí chính xác
        </p>
      )}
    </div>
  );
}

// Result Card
function ResultCard({ result }: { result: PredictionResult }) {
  const formatPrice = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} tỷ`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} triệu`;
    return `${val.toLocaleString()} VND`;
  };
  const barWidth = Math.min(Math.round(result.confidence * 100), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden"
    >
      {/* top gradient strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-sky-500 to-blue-500" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 text-teal-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Kết quả dự đoán</h3>
            <p className="text-xs text-slate-500 font-medium">Powered by AI model</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Thành công</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Main price */}
          <div className="md:col-span-1 bg-gradient-to-br from-teal-500 to-sky-600 rounded-xl p-5 text-white flex flex-col justify-center">
            <p className="text-sm font-semibold text-teal-100 mb-1">Giá ước tính</p>
            <p className="text-2xl md:text-3xl font-bold leading-tight">{formatPrice(result.estimated_price)}</p>
          </div>

          {/* Min/Max */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">Giá thấp nhất</p>
              <p className="text-xl font-bold text-slate-800">{formatPrice(result.price_min)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">Giá cao nhất</p>
              <p className="text-xl font-bold text-slate-800">{formatPrice(result.price_max)}</p>
            </div>
            {/* Confidence */}
            <div className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500">Độ tin cậy</p>
                <p className="text-sm font-bold text-teal-600">{barWidth}%</p>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center">
          * Đây là kết quả dự đoán từ mô hình AI, không phải định giá chính thức. Giá thực tế có thể biến động tùy thị trường.
        </p>
      </div>
    </motion.div>
  );
}

// Main Page
const PricePrediction = () => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Province/District/Ward state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const currentProvinceObj = provinces.find(p => String(p.code) === selectedProvince);
  const currentDistrictObj = currentProvinceObj?.districts.find(d => String(d.code) === selectedDistrict);

  // Property form state
  const [propertyTypeName, setPropertyTypeName] = useState('');
  const [area, setArea] = useState('');
  const [floorCount, setFloorCount] = useState('');
  const [bedroomCount, setBedroomCount] = useState('');
  const [bathroomCount, setBathroomCount] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  // Load provinces
  useEffect(() => {
    const predictionProvinces = VIETNAM_ADMINISTRATIVE_UNITS;

    setProvinces(predictionProvinces);
    setSelectedProvince(String(predictionProvinces[0]?.code ?? ''));
    setSelectedDistrict(String(predictionProvinces[0]?.districts[0]?.code ?? ''));
    setSelectedWard(String(predictionProvinces[0]?.districts[0]?.wards[0]?.code ?? ''));
    setLoadingProvinces(false);
  }, []);

  const handleCoordChange = useCallback((newLat: string, newLng: string) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleProvinceChange = (val: string) => {
    setSelectedProvince(val);
    const nextProvince = provinces.find((province) => String(province.code) === val);
    const nextDistrict = nextProvince?.districts[0];
    setSelectedDistrict(String(nextDistrict?.code ?? ''));
    setSelectedWard(String(nextDistrict?.wards[0]?.code ?? ''));
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    const nextDistrict = currentProvinceObj?.districts.find((district) => String(district.code) === val);
    setSelectedWard(String(nextDistrict?.wards[0]?.code ?? ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyTypeName || !area || !floorCount || !bedroomCount || !bathroomCount) {
      setError('Vui lòng nhập đầy đủ thông tin bất động sản bắt buộc.');
      return;
    }
    if (!lat || !lng) {
      setError('Vui lòng nhấp vào bản đồ để chọn vị trí bất động sản.');
      return;
    }

    setError('');
    setResult(null);
    setIsLoading(true);

    const payload = {
      province_name: currentProvinceObj?.name || "Hà Nội",
      district_name: currentDistrictObj?.name || "",
      ward_name: selectedWard ? (currentDistrictObj?.wards.find(w => String(w.code) === selectedWard)?.name || "") : "",
      property_type_name: propertyTypeName,
      area: parseFloat(area),
      floor_count: parseFloat(floorCount),
      bedroom_count: parseFloat(bedroomCount),
      bathroom_count: parseFloat(bathroomCount),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    try {
      const res = await api.post('/api/prediction/', payload);
      const data: PredictionResult = res.data;
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: unknown) {
      const apiError = err as PredictionApiError;
      if (apiError.response?.data?.error !== undefined) {
        const message = normalizeApiErrorMessage(apiError.response.data.error);
        setError(message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else {
        setError('Không thể kết nối máy chủ dự đoán giá. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!propertyTypeName && !!area && !!floorCount && !!bedroomCount && !!bathroomCount && !!lat && !!lng;

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />

      <main className="pt-28 pb-16">

        {/* HERO */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl p-10 md:p-16"
            style={{ background: 'linear-gradient(135deg, #0F2744 0%, #0F766E 55%, #0369A1 100%)' }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-16 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-white/[0.02] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                    <Cpu className="w-5 h-5 text-teal-300" />
                  </div>
                  <span className="text-sm font-bold text-teal-300 tracking-wide">AI-Powered · Real Estate</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                  Dự đoán giá nhà<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-300">bằng trí tuệ nhân tạo</span>
                </h1>
                <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl">
                  Chọn khu vực, ghim vị trí trên bản đồ và nhập thông tin bất động sản. Mô hình AI của chúng tôi sẽ dự đoán giá chính xác trong vài giây.
                </p>
              </div>
              <div className="flex-shrink-0 hidden md:flex">
                <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-14 h-14 text-teal-300" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Cách thức hoạt động</h2>
              <p className="text-sm text-slate-500 font-medium">3 bước đơn giản để có kết quả dự đoán</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* connector lines on desktop */}
              <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-teal-200 to-sky-200" />

              <StepCard num={1} icon={MapPin} title="Chọn vị trí"
                desc="Chọn tỉnh thành, quận huyện, phường xã và ghim vị trí chính xác trên bản đồ." />
              <StepCard num={2} icon={Home} title="Nhập thông tin"
                desc="Điền diện tích, số tầng, phòng ngủ và các đặc điểm của bất động sản." />
              <StepCard num={3} icon={Sparkles} title="Nhận kết quả"
                desc="Mô hình AI phân tích và trả về giá ước tính cùng khoảng dao động trong vài giây." />
            </div>
          </div>
        </section>

        {/* FORM + MAP */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* Left: Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 text-teal-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Thông tin bất động sản</h2>
                    <p className="text-xs text-slate-500 font-medium">Điền đầy đủ để có kết quả chính xác nhất</p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" /> Địa chỉ
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormSelect
                      label="Tỉnh / Thành phố *"
                      id="province"
                      value={selectedProvince}
                      onChange={handleProvinceChange}
                      placeholder={loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh / thành'}
                      disabled={false}
                    >
                      {provinces.map(p => (
                        <option key={p.code} value={String(p.code)}>{p.name}</option>
                      ))}
                    </FormSelect>

                    <FormSelect
                      label="Quận / Huyện *"
                      id="district"
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                      placeholder="Chọn quận / huyện"
                      disabled={false}
                    >
                      {(currentProvinceObj?.districts ?? []).map(d => (
                        <option key={d.code} value={String(d.code)}>{d.name}</option>
                      ))}
                    </FormSelect>

                    <FormSelect
                      label="Phường / Xã"
                      id="ward"
                      value={selectedWard}
                      onChange={setSelectedWard}
                      placeholder="Chọn phường / xã"
                      disabled={false}
                    >
                      {(currentDistrictObj?.wards ?? []).map(w => (
                        <option key={w.code} value={String(w.code)}>{w.name}</option>
                      ))}
                    </FormSelect>
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-500" /> Thông tin bất động sản
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FormSelect
                        label="Loại bất động sản *"
                        id="propertyTypeName"
                        value={propertyTypeName}
                        onChange={setPropertyTypeName}
                        placeholder="Chọn loại bất động sản"
                        icon={LayoutGrid}
                      >
                        {PROPERTY_TYPE_OPTIONS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </FormSelect>
                    </div>

                    <FormInput label="Diện tích *" id="area" value={area} onChange={setArea}
                      icon={Layers} placeholder="Ví dụ: 80" min={1} unit="m²" />
                    <FormInput label="Số tầng *" id="floorCount" value={floorCount} onChange={setFloorCount}
                      icon={Building2} placeholder="Ví dụ: 4" min={0} />
                    <FormInput label="Số phòng ngủ *" id="bedroomCount" value={bedroomCount} onChange={setBedroomCount}
                      icon={BedDouble} placeholder="Ví dụ: 3" min={0} />
                    <FormInput label="Số phòng tắm *" id="bathroomCount" value={bathroomCount} onChange={setBathroomCount}
                      icon={Bath} placeholder="Ví dụ: 3" min={0} />
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base transition-all duration-200 cursor-pointer
                    ${!isLoading && isFormValid
                      ? 'bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white shadow-lg hover:shadow-xl hover:shadow-teal-500/25'
                      : !isLoading
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-none'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang dự đoán...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Dự đoán giá nhà
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  * Trường bắt buộc. Càng nhiều thông tin → kết quả càng chính xác.
                </p>
              </motion.div>

              {/* Right: Map */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col"
                style={{ minHeight: 480 }}
              >
                <MapPanel lat={lat} lng={lng} onCoordChange={handleCoordChange} />
              </motion.div>
            </div>
          </form>
        </section>

        {/* RESULT */}
        <section ref={resultRef} className="max-w-[1440px] mx-auto px-4 md:px-8">
          <AnimatePresence>
            {result && <ResultCard result={result} />}
          </AnimatePresence>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default PricePrediction;

