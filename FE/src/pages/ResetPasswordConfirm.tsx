import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { isAxiosError } from "axios";
import logo from "@/assets/images/logo.png";
import { confirmPasswordReset, validatePasswordResetToken } from "@/lib/authApi";

const ResetPasswordConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = useMemo(() => (searchParams.get("uid") || "").trim(), [searchParams]);
  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      if (!uid || !token) {
        setError("This reset link is incomplete.");
        setIsChecking(false);
        return;
      }

      try {
        await validatePasswordResetToken(uid, token);
        setIsValidLink(true);
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          setError(err.response?.data?.detail || "This reset link is invalid or has expired.");
        } else {
          setError("This reset link is invalid or has expired.");
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkToken();
  }, [token, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLink) return;

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await confirmPasswordReset({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setSuccessMessage(response.message);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail =
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Unable to reset your password.";
        setError(detail);
      } else {
        setError("Unable to reset your password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F6F7F9]">
      <div className="hidden lg:flex w-[60%] relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Luxury property exterior"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
          <h1 className="text-5xl font-bold mb-4 leading-tight text-white">Choose a new password</h1>
          <p className="text-lg text-slate-300 font-normal">
            Create a new password for your Blue Sky account.
            <br />
            This reset link is checked securely before you can continue.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8 relative">
        <motion.div
          className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl p-8 md:p-10 relative overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-blue-300" />

          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src={logo} alt="Blue Sky Logo" className="h-32 w-auto object-contain scale-125" />
            </Link>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Set a new password</h2>
            <p className="text-slate-500">Your reset link must be valid before we accept a new password.</p>
          </div>

          {isChecking ? (
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              Verifying your reset link...
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {isValidLink && (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        placeholder="Enter your new password again"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg shadow-slate-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving new password..." : "Save new password"}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Return to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirm;

