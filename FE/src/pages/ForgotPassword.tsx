import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { isAxiosError } from "axios";
import logo from "@/assets/images/logo.png";
import { requestPasswordReset } from "@/lib/authApi";

const ForgotPassword = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await requestPasswordReset({
        username: username.trim(),
        email: email.trim(),
      });
      setSuccessMessage(response.message);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to send the password reset email right now.";
        setError(detail);
      } else {
        setError("Unable to send the password reset email right now.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F6F7F9]">
      <div className="hidden lg:flex w-[60%] relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Modern interior"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/25 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
          <h1 className="text-5xl font-bold mb-4 leading-tight text-white">Reset your password</h1>
          <p className="text-lg text-slate-300 font-normal">
            Enter your username and the email linked to your account.
            <br />
            We will send you a secure link to set a new password.
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
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Forgot your password?</h2>
            <p className="text-slate-500">We will email you a reset link if the account matches.</p>
          </div>

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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg shadow-slate-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-accent hover:text-accent-hover transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

