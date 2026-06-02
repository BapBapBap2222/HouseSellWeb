import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle2, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAxiosError } from 'axios';
import logo from '@/assets/images/logo.png';
import { useAuth } from '@/contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | Record<string, string[]>>('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getFieldErrors = (field: string): string | undefined => {
    if (typeof error === 'object' && error[field]) {
      return error[field][0];
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      setError('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object' && !data.detail) {
          setError(data as Record<string, string[]>);
        } else {
          setError(data.detail || 'Registration failed. Please try again.');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field?: string) =>
    `w-full px-4 py-3 pl-10 rounded-lg border ${
      getFieldErrors(field || '') ? 'border-red-400' : 'border-slate-200'
    } focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-slate-900 placeholder:text-slate-400`;

  return (
    <div className="flex min-h-screen w-full bg-[#F6F7F9]">
      <div className="hidden lg:flex w-[60%] relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Modern Luxury Home"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-16 text-white w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-4 leading-tight text-white">Join us today</h1>
            <p className="text-lg text-slate-300 font-normal">
              Create your account to access exclusive listings and personalized market insights.
              <br />
              Your property journey starts here.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8 relative overflow-y-auto">
        <motion.div
          className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl p-8 md:p-10 relative overflow-hidden my-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-blue-300" />

          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src={logo} alt="Blue Sky Logo" className="h-32 w-auto object-contain scale-125" />
            </Link>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Create your account</h2>
            <p className="text-slate-500">Start your real estate journey with Blue Sky</p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Registration successful. Redirecting to sign in...
            </motion.div>
          )}

          {typeof error === 'string' && error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-2 gap-3">
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">First name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={inputClass('first_name')}
                    placeholder="Nguyen"
                    required
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {getFieldErrors('first_name') && <p className="text-xs text-red-600 mt-1">{getFieldErrors('first_name')}</p>}
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={inputClass('last_name')}
                    placeholder="Van A"
                    required
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {getFieldErrors('last_name') && <p className="text-xs text-red-600 mt-1">{getFieldErrors('last_name')}</p>}
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={inputClass('username')}
                  placeholder="username"
                  autoComplete="username"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              {getFieldErrors('username') && <p className="text-xs text-red-600 mt-1">{getFieldErrors('username')}</p>}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass('email')}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              {getFieldErrors('email') && <p className="text-xs text-red-600 mt-1">{getFieldErrors('email')}</p>}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass('password')}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {getFieldErrors('password') && <p className="text-xs text-red-600 mt-1">{getFieldErrors('password')}</p>}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className={inputClass('password_confirm')}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              {getFieldErrors('password_confirm') && (
                <p className="text-xs text-red-600 mt-1">{getFieldErrors('password_confirm')}</p>
              )}
            </motion.div>

            <motion.div className="flex items-start gap-2 pt-2" variants={itemVariants}>
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                I agree to the{' '}
                <Link to="/terms" className="text-accent hover:text-accent-hover">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-accent hover:text-accent-hover">
                  Privacy Policy
                </Link>
              </label>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg shadow-slate-900/20 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              variants={itemVariants}
              whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </motion.button>
          </motion.form>

          <div className="text-center text-sm mt-8">
            <span className="text-slate-500">Already have an account? </span>
            <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Sign in
            </Link>
          </div>

          <div className="mt-8 flex justify-center gap-6 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Secure registration</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>Verified access</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

