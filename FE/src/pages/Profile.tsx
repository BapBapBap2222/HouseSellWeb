import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerificationRequestModal } from "@/components/profile/VerificationRequestModal";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  Save,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShoppingCart,
  Star,
  TrendingUp,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/authApi";
import { AgentReview, getMyAgentReviews } from "@/lib/agentsApi";
import { getMyAppointments, getOwnerAppointments, Appointment } from "@/lib/appointmentsApi";
import {
  FavoriteItem,
  deleteProperty,
  getFavorites,
  getImageUrl,
  getMyProperties,
  normalizeListResponse,
  toggleFavorite,
  updateProperty,
} from "@/lib/propertiesApi";
import { getUserDisplayName, getUserInitials } from "@/lib/userProfile";
import { createVerificationRequest } from "@/lib/verificationApi";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600";
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type SellItem = {
  id: number;
  title: string;
  price: string;
  rawPrice: number;
  address: string;
  city: string;
  status: string;
  rawStatus: "active" | "inactive" | "sold" | "rented";
  isActive: boolean;
  daysListed: number;
  newAppointments: number;
  image: string;
  createdAt: string;
  listingType: "sale" | "rent";
  listingTypeLabel: string;
};

type TabKey = "profile" | "buy" | "sell" | "favorites" | "ratings";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <Home className="w-4 h-4" /> },
  { key: "buy", label: "Buy", icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "sell", label: "Sell", icon: <BadgeDollarSign className="w-4 h-4" /> },
  { key: "favorites", label: "Favorites", icon: <Heart className="w-4 h-4" /> },
  { key: "ratings", label: "Ratings", icon: <Star className="w-4 h-4" /> },
];

const CHART_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const statusColor = (status: string) => {
  if (status === "Confirmed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Pending" || status === "Negotiating") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "For Sale") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Sold" || status === "Rented") return "bg-sky-50 text-sky-700 border-sky-200";
  if (status === "Inactive") return "bg-gray-50 text-gray-500 border-gray-200";
  if (status === "New") return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-teal-50 text-teal-700 border-teal-200";
};

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8 pb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onPageChange(Math.max(1, currentPage - 1));
          window.scrollTo({ top: 400, behavior: "smooth" });
        }}
        disabled={currentPage === 1}
        className="text-gray-500 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
      </Button>

      <div className="text-sm font-medium text-gray-600 px-4">
        Page {currentPage} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onPageChange(Math.min(totalPages, currentPage + 1));
          window.scrollTo({ top: 400, behavior: "smooth" });
        }}
        disabled={currentPage === totalPages}
        className="text-gray-500 cursor-pointer"
      >
        Next <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const initialTab = (searchParams.get("tab") as TabKey) || "profile";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [buyPage, setBuyPage] = useState(1);
  const [sellPage, setSellPage] = useState(1);
  const [favoritePage, setFavoritePage] = useState(1);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [sellListings, setSellListings] = useState<SellItem[]>([]);
  const [loadingSellListings, setLoadingSellListings] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [removingFavoriteId, setRemovingFavoriteId] = useState<number | null>(null);
  const [ratings, setRatings] = useState<AgentReview[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [processingSellListingId, setProcessingSellListingId] = useState<number | null>(null);
  const [selectedRevenueYear, setSelectedRevenueYear] = useState(new Date().getFullYear());
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingIntro, setEditingIntro] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingIntro, setSavingIntro] = useState(false);
  const [profileVisible, setProfileVisible] = useState(user?.profile_visible ?? true);
  const [activityVisible, setActivityVisible] = useState(user?.activity_visible ?? true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [introError, setIntroError] = useState("");
  const [verificationRequestOpen, setVerificationRequestOpen] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const buyItemsPerPage = 5;
  const sellItemsPerPage = 9;
  const favoriteItemsPerPage = 9;
  const displayName = getUserDisplayName(user);
  const displayInitials = getUserInitials(user);
  const verificationStatus = user?.verification_status ?? null;
  const verificationMessage = user?.verification_message ?? "";

  const [infoData, setInfoData] = useState({
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    location: user?.address ?? "",
  });
  const [bioData, setBioData] = useState({
    bio: user?.bio ?? "",
    firstName: user?.first_name ?? "",
    lastName: user?.last_name ?? "",
  });
  const [introData, setIntroData] = useState(user?.short_intro ?? "");
  const introWordCount = countWords(introData);

  useEffect(() => {
    if (!user || activeTab !== "buy") return;

    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const response = await getMyAppointments();
        if ("results" in response && Array.isArray(response.results)) {
          setAppointments(response.results as Appointment[]);
        } else if (Array.isArray(response)) {
          setAppointments(response);
        }
      } catch (error) {
        console.error("Failed to load appointments:", error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [activeTab, user]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabKey | null;
    if (tabFromUrl && TABS.some((tab) => tab.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user || activeTab !== "favorites") return;

    const fetchFavorites = async () => {
      setLoadingFavorites(true);
      try {
        const response = await getFavorites();
        setFavorites(normalizeListResponse(response).filter((item) => Boolean(item.property)));
      } catch (error) {
        console.error("Failed to load favorite listings:", error);
        setFavorites([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || activeTab !== "ratings") return;

    const fetchRatings = async () => {
      setLoadingRatings(true);
      try {
        const response = await getMyAgentReviews();
        setRatings(response);
      } catch (error) {
        console.error("Failed to load profile ratings:", error);
        setRatings([]);
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchRatings();
  }, [activeTab, user]);

  useEffect(() => {
    if (!user) return;

    const fetchSellListings = async () => {
      setLoadingSellListings(true);
      try {
        const [response, ownerAppointmentsResponse] = await Promise.all([
          getMyProperties(),
          getOwnerAppointments(),
        ]);
        const properties = normalizeListResponse(response);
        const ownerAppointments = Array.isArray(ownerAppointmentsResponse)
          ? ownerAppointmentsResponse
          : ownerAppointmentsResponse.results;
        const mapped: SellItem[] = properties.map((item) => {
          const createdAt = item.created_at ? new Date(item.created_at) : new Date();
          const elapsedDays = Math.max(
            1,
            Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          );
          const numericPrice = Number(item.price || 0);

          return {
            id: item.id,
            title: item.title,
            price: `${new Intl.NumberFormat("vi-VN").format(numericPrice)} VND`,
            rawPrice: numericPrice,
            address: [item.address, item.district, item.city].filter(Boolean).join(", "),
            city: item.city || "",
            status: item.status_display || item.status || "For Sale",
            rawStatus: item.status,
            isActive: Boolean(item.is_active),
            daysListed: elapsedDays,
            newAppointments: ownerAppointments.filter((appointment) => appointment.property === item.id).length,
            image: item.primary_image ? getImageUrl(item.primary_image) : FALLBACK_PROPERTY_IMAGE,
            createdAt: item.created_at || createdAt.toISOString(),
            listingType: item.listing_type,
            listingTypeLabel: item.listing_type_display || "For sale",
          };
        });
        setSellListings(mapped);
      } catch (error) {
        console.error("Failed to load sell listings:", error);
        setSellListings([]);
      } finally {
        setLoadingSellListings(false);
      }
    };

    fetchSellListings();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setInfoData({
      email: user.email,
      phone: user.phone ?? "",
      location: user.address ?? "",
    });
    setBioData({
      bio: user.bio ?? "",
      firstName: user.first_name ?? "",
      lastName: user.last_name ?? "",
    });
    setIntroData(user.short_intro ?? "");
    setProfileVisible(user.profile_visible ?? true);
    setActivityVisible(user.activity_visible ?? true);
  }, [user]);

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      await updateProfile({
        phone: infoData.phone,
        address: infoData.location,
      });
      await refreshUser();
      setEditingInfo(false);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await updateProfile({
        first_name: bioData.firstName,
        last_name: bioData.lastName,
        bio: bioData.bio,
      });
      await refreshUser();
      setEditingBio(false);
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveIntro = async () => {
    const trimmedIntro = introData.trim();
    const wordCount = countWords(trimmedIntro);

    if (wordCount > 50) {
      setIntroError("Short intro must be 50 words or fewer.");
      return;
    }

    setSavingIntro(true);
    setIntroError("");

    try {
      await updateProfile({
        short_intro: trimmedIntro,
      });
      await refreshUser();
      setEditingIntro(false);
    } catch (error) {
      console.error("Failed to update short intro:", error);
      setIntroError("Could not update the short intro. Please try again.");
    } finally {
      setSavingIntro(false);
    }
  };

  const handleAvatarButtonClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Please choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    setAvatarError("");
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await updateProfile(formData);
      await refreshUser();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setAvatarError("Could not update avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleVerificationSubmit = async (payload: Parameters<typeof createVerificationRequest>[0]) => {
    setSubmittingVerification(true);
    setVerificationError("");

    try {
      await createVerificationRequest(payload);
      await refreshUser();
      setVerificationRequestOpen(false);
    } catch (error) {
      console.error("Failed to submit verification request:", error);
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setVerificationError(detail || "Could not submit verification request.");
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleToggleActivityVisibility = async () => {
    const nextValue = !activityVisible;
    setActivityVisible(nextValue);

    try {
      await updateProfile({
        activity_visible: nextValue,
      });
      await refreshUser();
    } catch (error) {
      console.error("Failed to update activity visibility:", error);
      setActivityVisible(!nextValue);
    }
  };

  const handleToggleProfileVisibility = async () => {
    const nextValue = !profileVisible;
    setProfileVisible(nextValue);

    try {
      await updateProfile({
        profile_visible: nextValue,
      });
      await refreshUser();
    } catch (error) {
      console.error("Failed to update profile visibility:", error);
      setProfileVisible(!nextValue);
    }
  };

  const handleRemoveFavorite = async (propertyId: number) => {
    setRemovingFavoriteId(propertyId);
    try {
      const result = await toggleFavorite(propertyId);
      if (!result.is_favorited) {
        setFavorites((current) => current.filter((item) => item.property_id !== propertyId));
      }
    } catch (error) {
      console.error("Failed to remove favorite listing:", error);
    } finally {
      setRemovingFavoriteId(null);
    }
  };

  const handleSellStatusChange = async (
    propertyId: number,
    nextStatus: SellItem["rawStatus"],
    nextIsActive: boolean,
  ) => {
    setProcessingSellListingId(propertyId);
    try {
      const updated = await updateProperty(propertyId, {
        status: nextStatus,
        is_active: nextIsActive,
      });
      setSellListings((current) =>
        current.map((item) =>
          item.id === propertyId
            ? {
                ...item,
                status: updated.status_display || updated.status,
                rawStatus: updated.status,
                isActive: Boolean(updated.is_active),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update listing status:", error);
    } finally {
      setProcessingSellListingId(null);
    }
  };

  const handleDeleteSellListing = async (propertyId: number) => {
    const confirmed = window.confirm("Delete this listing permanently? This action cannot be undone.");
    if (!confirmed) return;

    setProcessingSellListingId(propertyId);
    try {
      await deleteProperty(propertyId);
      setSellListings((current) => current.filter((item) => item.id !== propertyId));
    } catch (error) {
      console.error("Failed to delete listing:", error);
    } finally {
      setProcessingSellListingId(null);
    }
  };

  const displayBuyList = appointments.map((appointment) => ({
    id: appointment.id,
    property: appointment.property_title,
    seller: appointment.property_owner,
    date: `${appointment.time}, ${new Date(appointment.date).toLocaleDateString()}`,
    status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
    price: "—",
    image: FALLBACK_PROPERTY_IMAGE,
  }));

  const paginatedBuy = displayBuyList.slice((buyPage - 1) * buyItemsPerPage, buyPage * buyItemsPerPage);
  const totalBuyPages = Math.max(1, Math.ceil(displayBuyList.length / buyItemsPerPage));

  const paginatedSell = sellListings.slice((sellPage - 1) * sellItemsPerPage, sellPage * sellItemsPerPage);
  const totalSellPages = Math.max(1, Math.ceil(sellListings.length / sellItemsPerPage));
  const paginatedFavorites = favorites.slice(
    (favoritePage - 1) * favoriteItemsPerPage,
    favoritePage * favoriteItemsPerPage,
  );
  const totalFavoritePages = Math.max(1, Math.ceil(favorites.length / favoriteItemsPerPage));
  const totalSellValue = sellListings.reduce((sum, item) => sum + item.rawPrice, 0);
  const revenueYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...sellListings.map((item) => new Date(item.createdAt).getFullYear()).filter((year) => Number.isFinite(year)),
    ]),
  ).sort((a, b) => b - a);
  const revenueByMonth = CHART_LABELS.map((_, monthIndex) => {
    const monthValue = sellListings
      .filter((item) => {
        const createdAt = new Date(item.createdAt);
        return createdAt.getFullYear() === selectedRevenueYear && createdAt.getMonth() === monthIndex;
      })
      .reduce((sum, item) => sum + item.rawPrice, 0);
    return Number((monthValue / 1_000_000_000).toFixed(2));
  });
  const latestActivities = [...sellListings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
  const profileStats = {
    totalValue: sellListings.length ? `${new Intl.NumberFormat("vi-VN").format(totalSellValue)} VND` : "—",
    properties: sellListings.length,
    appointments: appointments.length,
    favorites: favorites.length,
  };

  useEffect(() => {
    setFavoritePage((current) => Math.min(current, totalFavoritePages));
  }, [totalFavoritePages]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans">
      <Header />

      <main className="pt-[140px]">
        <div className="relative bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 pt-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end">
              <div className="relative z-10 w-fit">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl bg-white">
                  <AvatarImage src={user?.avatar ?? undefined} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-teal-50 text-teal-700">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />

                <button
                  type="button"
                  onClick={handleAvatarButtonClick}
                  disabled={uploadingAvatar}
                  className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow border border-gray-200 cursor-pointer hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Change avatar"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </button>

                {avatarError && <p className="mt-3 text-sm text-red-600 max-w-48">{avatarError}</p>}
              </div>

              <div className="flex-1 pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{displayName}</h1>
                <div className="mt-2 pl-1 max-w-2xl">
                  {!editingIntro ? (
                    <div className="flex items-start gap-3">
                      <p className="text-gray-500 text-sm leading-6">
                        {user?.short_intro?.trim() || "Add a short introduction about yourself in up to 50 words."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIntro(true);
                          setIntroError("");
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0"
                        title="Edit short intro"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={introData}
                        onChange={(event) => {
                          setIntroData(event.target.value);
                          if (introError) {
                            setIntroError("");
                          }
                        }}
                        rows={2}
                        className="w-full max-w-xl rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#14B8A6] transition-colors resize-none"
                        placeholder="Write a short introduction about yourself."
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-xs ${introWordCount > 50 ? "text-red-600" : "text-gray-400"}`}>
                          {introWordCount}/50 words
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIntroData(user?.short_intro ?? "");
                            setEditingIntro(false);
                            setIntroError("");
                          }}
                          className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveIntro}
                          disabled={savingIntro}
                          className="p-2 rounded-lg bg-[#0F766E] hover:bg-[#0F766E]/90 transition-colors cursor-pointer disabled:opacity-60"
                          title="Save"
                        >
                          {savingIntro ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                      {introError && <p className="text-sm text-red-600">{introError}</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-8 pb-3">
                {[
                  { label: "Total Value", value: profileStats.totalValue, icon: <TrendingUp className="w-4 h-4" /> },
                  { label: "Active Listings", value: profileStats.properties, icon: <Building2 className="w-4 h-4" /> },
                  { label: "Appointments", value: profileStats.appointments, icon: <Calendar className="w-4 h-4" /> },
                  { label: "Saved", value: profileStats.favorites, icon: <Heart className="w-4 h-4" /> },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                      {stat.icon}
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-1 mt-10 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    navigate(`/profile?tab=${tab.key}`, { replace: true });
                  }}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer rounded-t-lg ${
                    activeTab === tab.key
                      ? "text-[#0F766E] border-b-2 border-[#0F766E] bg-white"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-[fadeIn_0.3s_ease]">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl pt-3 px-4 pb-6 border border-gray-100 shadow-sm relative">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Info</h3>

                  <div className="absolute top-3 right-3">
                    {!editingInfo ? (
                      <button
                        onClick={() => setEditingInfo(true)}
                        className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingInfo(false)}
                          className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={handleSaveInfo}
                          disabled={savingInfo}
                          className="p-2 rounded-lg bg-[#0F766E] hover:bg-[#0F766E]/90 transition-colors cursor-pointer disabled:opacity-60"
                          title="Save"
                        >
                          {savingInfo ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: <Mail className="w-4 h-4 text-[#0F766E]" />, label: "EMAIL", key: "email" as const, editable: false },
                      { icon: <Phone className="w-4 h-4 text-[#0F766E]" />, label: "PHONE", key: "phone" as const, editable: true },
                      { icon: <MapPin className="w-4 h-4 text-[#0F766E]" />, label: "LOCATION", key: "location" as const, editable: true },
                    ].map((info) => (
                      <div key={info.label} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F0FDFA] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {info.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {info.label}
                          </div>
                          {editingInfo && info.editable ? (
                            <input
                              type="text"
                              value={infoData[info.key]}
                              onChange={(event) => setInfoData({ ...infoData, [info.key]: event.target.value })}
                              className="text-sm text-gray-700 font-medium w-full border border-gray-200 rounded-lg px-3 py-1.5 mt-1 outline-none focus:border-[#14B8A6] transition-colors"
                            />
                          ) : (
                            <div className="text-sm text-gray-700 font-medium">
                              {infoData[info.key] || <span className="text-gray-400">Not updated yet</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Biography</h3>

                  <div className="absolute top-3 right-3">
                    {!editingBio ? (
                      <button
                        onClick={() => setEditingBio(true)}
                        className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingBio(false)}
                          className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={handleSaveBio}
                          disabled={savingBio}
                          className="p-2 rounded-lg bg-[#0F766E] hover:bg-[#0F766E]/90 transition-colors cursor-pointer disabled:opacity-60"
                          title="Save"
                        >
                          {savingBio ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm text-gray-700 mb-2">About Me</h4>
                  {editingBio ? (
                    <textarea
                      value={bioData.bio}
                      onChange={(event) => setBioData({ ...bioData, bio: event.target.value })}
                      rows={3}
                      className="text-sm text-gray-500 leading-relaxed mb-5 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#14B8A6] transition-colors resize-none"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">
                      {bioData.bio || <span className=" text-gray-400">No introduction yet.</span>}
                    </p>
                  )}

                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    {[
                      { label: "First Name", editKey: "firstName" as const, display: bioData.firstName, editable: true },
                      { label: "Last Name", editKey: "lastName" as const, display: bioData.lastName, editable: true },
                      { label: "Username", editKey: null, display: user?.username, editable: false },
                      { label: "Email", editKey: null, display: user?.email, editable: false },
                    ].map((detail) => (
                      <div key={detail.label} className="flex items-center text-sm">
                        <span className="text-gray-400 w-28 flex-shrink-0">{detail.label}:</span>
                        {editingBio && detail.editable && detail.editKey ? (
                          <input
                            type="text"
                            value={bioData[detail.editKey]}
                            onChange={(event) =>
                              setBioData({ ...bioData, [detail.editKey]: event.target.value })
                            }
                            className="font-medium text-gray-700 flex-1 border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#14B8A6] transition-colors"
                          />
                        ) : (
                          <span className="font-medium text-gray-700">
                            {detail.display || <span className=" text-gray-400">—</span>}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                {!user?.is_staff && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {user?.agent_is_verified ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          ) : verificationStatus === "denied" ? (
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                          ) : (
                            <ShieldQuestion className="w-5 h-5 text-amber-600" />
                          )}
                          <h3 className="text-lg font-bold text-gray-900">Agent Verification</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {user?.agent_is_verified
                            ? "Your agent account is verified and visible as trusted."
                            : "Submit identity documents so an admin can review your agent profile."}
                        </p>
                      </div>

                      {!user?.agent_is_verified && (
                        <Button
                          type="button"
                          onClick={() => setVerificationRequestOpen(true)}
                          disabled={verificationStatus === "pending"}
                          className="rounded-full bg-[#0369A1] hover:bg-[#0369A1]/90 text-white px-6 cursor-pointer disabled:opacity-60"
                        >
                          {verificationStatus === "pending" ? "Pending review" : "Verify"}
                        </Button>
                      )}
                    </div>

                    {verificationStatus === "denied" && (
                      <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
                        {verificationMessage || "Your verification request was denied. Please review your details and submit again."}
                      </div>
                    )}

                    {verificationStatus === "pending" && (
                      <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
                        Your verification request is waiting for admin approval.
                      </div>
                    )}

                    {verificationError && (
                      <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
                        {verificationError}
                      </div>
                    )}
                  </div>
                )}

                {!user?.is_staff && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {profileVisible ? (
                            <Eye className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-slate-500" />
                          )}
                          <h3 className="text-lg font-bold text-gray-900">Public Profile</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {profileVisible
                            ? "Your agent profile can appear in Agents and can be opened by visitors."
                            : "Your agent profile is private and hidden from Agents/public profile pages."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleProfileVisibility}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                          profileVisible
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                        title={profileVisible ? "Profile is public" : "Profile is private"}
                      >
                        {profileVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {profileVisible ? "Public" : "Private"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Revenue</h3>
                    <select
                      value={selectedRevenueYear}
                      onChange={(event) => setSelectedRevenueYear(Number(event.target.value))}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 cursor-pointer outline-none focus:border-[#14B8A6] transition-colors"
                    >
                      {revenueYears.map((year) => (
                        <option key={year} value={year}>Year {year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="h-64">
                    <Line
                      data={{
                        labels: CHART_LABELS,
                        datasets: [
                          {
                            label: "Revenue (Billion VND)",
                            data: revenueByMonth,
                            borderColor: "#14B8A6",
                            backgroundColor: "rgba(20, 184, 166, 0.12)",
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointBackgroundColor: "#fff",
                            pointBorderColor: "#14B8A6",
                            pointBorderWidth: 2.5,
                            pointHoverRadius: 7,
                            pointHoverBackgroundColor: "#14B8A6",
                            pointHoverBorderColor: "#fff",
                            borderWidth: 2.5,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: "index", intersect: false },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: "#1F2937",
                            titleFont: { family: "Inter", size: 13 },
                            bodyFont: { family: "Inter", size: 12 },
                            padding: 12,
                            cornerRadius: 10,
                            callbacks: {
                              label: (context) => ` Revenue: ${context.parsed.y} Billion VND`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: { font: { family: "Inter", size: 11 }, color: "#9CA3AF" },
                          },
                          y: {
                            grid: { color: "#F3F4F6" },
                            ticks: {
                              font: { family: "Inter", size: 11 },
                              color: "#9CA3AF",
                              callback: (value) => `${value}B`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl pt-3 px-4 pb-6 border border-gray-100 shadow-sm relative">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Latest Activity</h3>
                    <button
                      onClick={handleToggleActivityVisibility}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        activityVisible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                      title={activityVisible ? "Visible to others" : "Hidden from others"}
                    >
                      {activityVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {activityVisible ? "Public" : "Hidden"}
                    </button>
                  </div>

                  {latestActivities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestActivities.map((activity) => (
                        <div
                          key={activity.id}
                          onClick={() => navigate(`/manage-property/${activity.id}`)}
                          className="border border-gray-100 rounded-xl p-4 hover:border-[#14B8A6]/30 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-emerald-600">{activity.listingTypeLabel}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 group-hover:text-[#0F766E] transition-colors">
                            {activity.title}
                          </h4>
                          <div className="flex items-start gap-1.5 text-xs text-gray-400 mb-3">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{activity.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={user?.avatar ?? undefined} alt={displayName} />
                              <AvatarFallback>{displayInitials}</AvatarFallback>
                            </Avatar>
                            {displayName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                            <Clock className="w-3 h-3" /> {new Date(activity.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 px-5 py-12 text-center">
                      <p className="text-sm font-medium text-gray-500">No recent activity yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "buy" && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Viewing Appointments</h2>
                  <p className="text-sm text-gray-400 mt-1">Properties you are interested in and scheduled to visit</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loadingAppointments ? (
                  <div className="py-10 text-center text-gray-500">Loading appointments...</div>
                ) : displayBuyList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">No viewing appointments yet</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      When you book a property viewing, it will appear here automatically.
                    </p>
                  </div>
                ) : (
                  paginatedBuy.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => navigate(`/appointment/${appointment.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-center gap-5 cursor-pointer group"
                    >
                      <img
                        src={appointment.image}
                        alt={appointment.property}
                        className="w-full md:w-28 h-28 rounded-xl object-cover flex-shrink-0 group-hover:scale-[1.02] transition-transform"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#0F766E] transition-colors truncate">
                          {appointment.property}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          Meeting with: <span className="font-semibold text-gray-600">{appointment.seller}</span>
                        </p>
                        <div className="text-xl font-bold text-[#0F766E] mt-2">{appointment.price}</div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#F8FAFB] px-4 py-3 rounded-xl border border-gray-100 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[#14B8A6]" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Time</div>
                          <div className="text-sm font-semibold text-gray-700">{appointment.date}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor(appointment.status)}`}
                        >
                          {appointment.status === "Confirmed" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {appointment.status}
                        </span>

                        <Link to={`/appointment/${appointment.id}`} onClick={(event) => event.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-gray-200 text-gray-600 hover:border-[#14B8A6] hover:text-[#0F766E] cursor-pointer"
                          >
                            Details <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <PaginationControls currentPage={buyPage} totalPages={totalBuyPages} onPageChange={setBuyPage} />
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Saved Listings</h2>
                  <p className="text-sm text-gray-400 mt-1">Properties you saved from listings and detail pages</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-gray-200 text-gray-600 hover:border-[#14B8A6] hover:text-[#0F766E] cursor-pointer"
                  onClick={() => navigate("/listings")}
                >
                  Browse Listings <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {loadingFavorites ? (
                <div className="py-10 text-center text-gray-500">Loading saved listings...</div>
              ) : favorites.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No saved listings yet</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Tap the heart button on any property to keep it here for later.
                  </p>
                  <Button
                    className="mt-4 bg-[#0369A1] hover:bg-[#0369A1]/90 text-white rounded-full px-6 cursor-pointer"
                    onClick={() => navigate("/listings")}
                  >
                    Browse Listings
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedFavorites.map((favorite) => {
                      const property = favorite.property;
                      const price = `${new Intl.NumberFormat("vi-VN").format(Number(property.price || 0))} VND`;
                      const image = property.primary_image ? getImageUrl(property.primary_image) : FALLBACK_PROPERTY_IMAGE;
                      const address = [property.address, property.ward, property.district, property.city]
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <div
                          key={favorite.id}
                          onClick={() => navigate(`/property/${property.id}`)}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer group"
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={image}
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveFavorite(property.id);
                              }}
                              disabled={removingFavoriteId === property.id}
                              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 text-rose-500 shadow-sm flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-70"
                              aria-label="Remove saved listing"
                              title="Remove saved listing"
                            >
                              {removingFavoriteId === property.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                              {property.listing_type_display || property.listing_type}
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor(
                                  property.status_display || property.status || "Active",
                                )}`}
                              >
                                {property.status_display || property.status}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-400">
                                Saved {new Date(favorite.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#0F766E] transition-colors line-clamp-2 min-h-[56px]">
                              {property.title}
                            </h4>
                            <div className="flex items-start gap-1.5 text-gray-400 text-xs mt-1.5 min-h-[34px]">
                              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{address || property.city}</span>
                            </div>
                            <div className="text-2xl font-bold text-[#0F766E] mt-4 mb-4">{price}</div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{property.property_type_display || property.property_type}</span>
                              <span>{property.bedrooms ?? 0} beds · {property.bathrooms ?? 0} baths</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <PaginationControls
                    currentPage={favoritePage}
                    totalPages={totalFavoritePages}
                    onPageChange={setFavoritePage}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === "ratings" && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ratings & Comments</h2>
                <p className="text-sm text-gray-400 mt-1">Feedback visitors left on your public seller profile</p>
              </div>

              {loadingRatings ? (
                <div className="py-10 text-center text-gray-500">Loading ratings...</div>
              ) : ratings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No ratings yet</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    When buyers or renters rate your public profile, their comments will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">{rating.reviewer_name}</div>
                          <div className="text-xs text-gray-400">@{rating.reviewer_username}</div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {rating.rating}/5
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-600">
                        {rating.comment || "No comment provided."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sell" && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
                  <p className="text-sm text-gray-400 mt-1">Manage listing status, buyer requests, and property details</p>
                </div>
                <Button
                  className="bg-[#0369A1] hover:bg-[#0369A1]/90 text-white rounded-full px-6 cursor-pointer"
                  onClick={() => navigate("/add-property")}
                >
                  + Add Property
                </Button>
              </div>

              {loadingSellListings ? (
                <div className="py-10 text-center text-gray-500">Loading properties...</div>
              ) : sellListings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">No active listings yet</h3>
                  <p className="text-sm text-gray-500 mt-2">Add your first property to start receiving buyer requests.</p>
                  <Button
                    className="mt-4 bg-[#0369A1] hover:bg-[#0369A1]/90 text-white rounded-full px-6 cursor-pointer"
                    onClick={() => navigate("/add-property")}
                  >
                    + Add Property
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedSell.map((item) => {
                      const finalStatus = item.listingType === "rent" ? "rented" : "sold";
                      const finalStatusLabel = item.listingType === "rent" ? "Mark rented" : "Mark sold";
                      const processing = processingSellListingId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigate(`/manage-property/${item.id}`)}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer group"
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {item.newAppointments > 0 && (
                              <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 rounded flex items-center gap-1 shadow-md animate-pulse">
                                <span className="relative flex h-2 w-2 mr-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                {item.newAppointments} New Appointments
                              </div>
                            )}
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                              {item.daysListed} days
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor(item.status)}`}>
                                {item.status}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                  item.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 bg-gray-50 text-gray-500"
                                }`}
                              >
                                {item.isActive ? "Public" : "Hidden"}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#0F766E] transition-colors truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-start gap-1.5 text-gray-400 text-xs mt-1.5">
                              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{item.address}</span>
                            </div>
                            <div className="text-2xl font-bold text-[#0F766E] mt-4 mb-4">{item.price}</div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs"
                                disabled={processing}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleSellStatusChange(item.id, item.isActive ? "inactive" : "active", !item.isActive);
                                }}
                              >
                                {item.isActive ? (
                                  <PauseCircle className="mr-1 h-3.5 w-3.5" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                )}
                                {item.isActive ? "Pause" : "Activate"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full border-sky-200 text-xs text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                                disabled={processing || item.rawStatus === finalStatus}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleSellStatusChange(item.id, finalStatus, false);
                                }}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                {finalStatusLabel}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="col-span-2 rounded-full text-xs"
                                disabled={processing}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDeleteSellListing(item.id);
                                }}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                {processing ? "Processing..." : "Delete listing"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <PaginationControls currentPage={sellPage} totalPages={totalSellPages} onPageChange={setSellPage} />
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {!user?.is_staff && !user?.agent_is_verified && (
        <VerificationRequestModal
          isOpen={verificationRequestOpen}
          onClose={() => setVerificationRequestOpen(false)}
          onSubmit={handleVerificationSubmit}
          initialFullName={displayName}
          initialAddress={infoData.location}
          submitting={submittingVerification}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Profile;

