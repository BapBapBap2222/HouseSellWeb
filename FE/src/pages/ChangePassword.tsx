import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { VIETNAM_ADMINISTRATIVE_UNITS } from "@/data/vietnamAdministrative";
import { useToast } from "@/hooks/use-toast";
import { changePassword, updateProfile } from "@/lib/authApi";
import { getUserDisplayName, getUserInitials } from "@/lib/userProfile";

type Section = "personal" | "contact" | "security";

const SIDEBAR_ITEMS: { key: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "personal", label: "Personal Info", icon: <User className="w-4 h-4" />, desc: "Name and profile intro" },
  { key: "contact", label: "Contact", icon: <Phone className="w-4 h-4" />, desc: "Email, phone, address" },
  { key: "security", label: "Security", icon: <ShieldCheck className="w-4 h-4" />, desc: "Change password" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#14B8A6] transition-colors bg-[#F8FAFB] disabled:text-gray-400 disabled:bg-gray-50";
const labelClass = "text-sm font-semibold text-gray-700 mb-2 block";

const parseStoredAddress = (rawAddress: string | null | undefined) => {
  const normalized = rawAddress?.trim() ?? "";
  if (!normalized) {
    return {
      city: "",
      district: "",
      ward: "",
      addressLine: "",
    };
  }

  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const matchedCity = VIETNAM_ADMINISTRATIVE_UNITS.find((item) => item.name === parts[parts.length - 1]);
  if (!matchedCity) {
    return {
      city: "",
      district: "",
      ward: "",
      addressLine: normalized,
    };
  }

  const maybeDistrict = parts[parts.length - 2] ?? "";
  const matchedDistrict = matchedCity.districts.find((item) => item.name === maybeDistrict);
  const maybeWard = matchedDistrict ? parts[parts.length - 3] ?? "" : "";
  const matchedWard = matchedDistrict?.wards.find((item) => item.name === maybeWard);
  const detailParts = matchedWard ? parts.slice(0, -3) : matchedDistrict ? parts.slice(0, -2) : parts.slice(0, -1);

  return {
    city: matchedCity.name,
    district: matchedDistrict?.name ?? "",
    ward: matchedWard?.name ?? "",
    addressLine: detailParts.join(", "),
  };
};

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, refreshUser } = useAuth();

  const [section, setSection] = useState<Section>("personal");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    shortIntro: "",
  });

  const [contact, setContact] = useState({
    email: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    addressLine: "",
  });

  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  useEffect(() => {
    if (!user) return;
    setPersonal({
      firstName: user.first_name ?? "",
      lastName: user.last_name ?? "",
      bio: user.bio ?? "",
      shortIntro: user.short_intro ?? "",
    });
    setContact({
      email: user.email ?? "",
      phone: user.phone ?? "",
      ...parseStoredAddress(user.address),
    });
  }, [user]);

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";
  const districtOptions = VIETNAM_ADMINISTRATIVE_UNITS.find((item) => item.name === contact.city)?.districts ?? [];
  const wardOptions = districtOptions.find((item) => item.name === contact.district)?.wards ?? [];

  const handleSavePersonal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSavingPersonal(true);
    try {
      await updateProfile({
        first_name: personal.firstName.trim(),
        last_name: personal.lastName.trim(),
        bio: personal.bio.trim(),
        short_intro: personal.shortIntro.trim(),
      });
      await refreshUser();
      toast({
        title: "Personal info updated",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { short_intro?: string[]; detail?: string } } }).response?.data?.short_intro?.[0] ||
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
        "Could not save personal information.";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSavingContact(true);
    try {
      const combinedAddress = [contact.addressLine.trim(), contact.ward.trim(), contact.district.trim(), contact.city.trim()]
        .filter(Boolean)
        .join(", ");

      await updateProfile({
        phone: contact.phone.trim(),
        address: combinedAddress,
      });
      await refreshUser();
      toast({
        title: "Contact updated",
        description: "Your contact information has been saved.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save contact information.",
        variant: "destructive",
      });
    } finally {
      setSavingContact(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!pw.current || !pw.newPw || !pw.confirm) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (pw.newPw.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (pw.newPw !== pw.confirm) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm the new password again.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        old_password: pw.current,
        new_password: pw.newPw,
        new_password_confirm: pw.confirm,
      });
      setPw({ current: "", newPw: "", confirm: "" });
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      const payload = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
      const firstValue = payload ? Object.values(payload)[0] : null;
      const message =
        typeof firstValue === "string"
          ? firstValue
          : Array.isArray(firstValue) && typeof firstValue[0] === "string"
            ? firstValue[0]
            : "Could not change password.";
      toast({
        title: "Password change failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFB]">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10" style={{ paddingTop: "140px" }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-gray-500">
            Loading account settings...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Header />

      <main style={{ paddingTop: "140px" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Account Settings</h1>
          <p className="text-sm text-gray-400 mb-8">Manage the real account information for the current signed-in user</p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-36">
                <div className="flex items-center gap-3 p-4 mb-2">
                  <Avatar className="w-12 h-12 border-2 border-white shadow flex-shrink-0 aspect-square">
                    <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-teal-50 text-teal-700 text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{displayName}</div>
                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                  </div>
                </div>
                <div className="px-4 pb-3 text-xs text-gray-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {createdAt}
                </div>
                <div className="space-y-1">
                  {SIDEBAR_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSection(item.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                        section === item.key
                          ? "bg-[#F0FDFA] text-[#0F766E] border border-[#14B8A6]/20"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          section === item.key ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-[11px] text-gray-400 truncate">{item.desc}</div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 ${section === item.key ? "text-[#0F766E]" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                {section === "personal" && (
                  <form onSubmit={handleSavePersonal} className="animate-[fadeIn_0.2s_ease]">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#0F766E]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                        <p className="text-xs text-gray-400">These fields now use your real account profile</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>First Name</label>
                        <input
                          type="text"
                          value={personal.firstName}
                          onChange={(event) => setPersonal({ ...personal, firstName: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name</label>
                        <input
                          type="text"
                          value={personal.lastName}
                          onChange={(event) => setPersonal({ ...personal, lastName: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Short Intro</label>
                        <input
                          type="text"
                          value={personal.shortIntro}
                          onChange={(event) => setPersonal({ ...personal, shortIntro: event.target.value })}
                          className={inputClass}
                          placeholder="Up to 50 words"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>About Me</label>
                        <textarea
                          value={personal.bio}
                          onChange={(event) => setPersonal({ ...personal, bio: event.target.value })}
                          rows={4}
                          className={`${inputClass} resize-none`}
                          placeholder="Tell people a bit more about yourself"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        type="submit"
                        disabled={savingPersonal}
                        className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white rounded-xl px-8 h-11 font-semibold cursor-pointer"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {savingPersonal ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {section === "contact" && (
                  <form onSubmit={handleSaveContact} className="animate-[fadeIn_0.2s_ease]">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#0F766E]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
                        <p className="text-xs text-gray-400">Email comes from your account. Phone and address can be updated here.</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className={labelClass}>Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="email" value={contact.email} className={`${inputClass} pl-10`} disabled />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(event) => setContact({ ...contact, phone: event.target.value })}
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Address</label>
                        <div className="space-y-4">
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={contact.city}
                              onChange={(event) =>
                                setContact({
                                  ...contact,
                                  city: event.target.value,
                                  district: "",
                                  ward: "",
                                })
                              }
                              className={`${inputClass} pl-10 cursor-pointer`}
                            >
                              <option value="">Select Province / City</option>
                              {VIETNAM_ADMINISTRATIVE_UNITS.map((item) => (
                                <option key={item.code} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={contact.district}
                              onChange={(event) => setContact({ ...contact, district: event.target.value, ward: "" })}
                              className={`${inputClass} pl-10 cursor-pointer`}
                              disabled={!contact.city}
                            >
                              <option value="">Select District</option>
                              {districtOptions.map((district) => (
                                <option key={district.code} value={district.name}>
                                  {district.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={contact.ward}
                              onChange={(event) => setContact({ ...contact, ward: event.target.value })}
                              className={`${inputClass} pl-10 cursor-pointer`}
                              disabled={!contact.district}
                            >
                              <option value="">Select Ward</option>
                              {wardOptions.map((ward) => (
                                <option key={ward.code} value={ward.name}>
                                  {ward.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative">
                            <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                            <textarea
                              value={contact.addressLine}
                              onChange={(event) => setContact({ ...contact, addressLine: event.target.value })}
                              rows={3}
                              className={`${inputClass} pl-10 resize-none`}
                              placeholder="Street, building, alley, apartment number..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        type="submit"
                        disabled={savingContact}
                        className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white rounded-xl px-8 h-11 font-semibold cursor-pointer"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {savingContact ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {section === "security" && (
                  <form onSubmit={handleChangePassword} className="animate-[fadeIn_0.2s_ease]">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                        <p className="text-xs text-gray-400">This section now uses the real password change API</p>
                      </div>
                    </div>

                    <div className="space-y-5 max-w-md">
                      <div>
                        <label className={labelClass}>Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPw.current ? "text" : "password"}
                            value={pw.current}
                            onChange={(event) => setPw({ ...pw, current: event.target.value })}
                            placeholder="Enter current password"
                            className={`${inputClass} pl-10 pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                          >
                            {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPw.newPw ? "text" : "password"}
                            value={pw.newPw}
                            onChange={(event) => setPw({ ...pw, newPw: event.target.value })}
                            placeholder="At least 6 characters"
                            className={`${inputClass} pl-10 pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw({ ...showPw, newPw: !showPw.newPw })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                          >
                            {showPw.newPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPw.confirm ? "text" : "password"}
                            value={pw.confirm}
                            onChange={(event) => setPw({ ...pw, confirm: event.target.value })}
                            placeholder="Re-enter new password"
                            className={`${inputClass} pl-10 pr-10 ${pw.confirm && pw.confirm !== pw.newPw ? "border-red-300" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                          >
                            {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        type="submit"
                        disabled={savingPassword}
                        className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white rounded-xl px-8 h-11 font-semibold cursor-pointer"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {savingPassword ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ChangePasswordPage;
