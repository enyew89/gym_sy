import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import GymLogo from '../components/GymLogo';
import {
  Dumbbell,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Shield,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Users
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);

      // Dynamic redirect based on assigned role returned by backend
      switch (loggedInUser.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'trainer':
          navigate('/trainer');
          break;
        case 'receptionist':
          navigate('/receptionist');
          break;
        case 'member':
          navigate('/member');
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setForgotSubmitting(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      toast.success(res.message || 'Password reset request submitted successfully.', { duration: 6000 });
      setForgotModalOpen(false);
      setForgotEmail('');
    } catch (err) {
      toast.error(err.message || 'Error processing request');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle moody gym background image and gradient overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-[#0a0a0c]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back to Home link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Gym Website</span>
          </Link>
          <span className="text-[11px] font-bold text-orange-500 tracking-widest uppercase">
            MEMBER & STAFF ACCESS
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center">
            <GymLogo size="lg" />
          </div>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">
            FITNESS & GYM MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-white">Sign In</h2>
            <p className="text-xs text-zinc-400 mt-1">
              One shared login for Admin, Trainer, Receptionist, and Member accounts.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gympro.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider py-3 px-4 rounded-xl shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50 text-xs active:scale-98"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Member Registration Callout */}
          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Want to join the gym as a new athlete?
            </p>
            <Link
              to="/register"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
            >
              <span>Create Member Account & Pick Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-zinc-500 text-[11px]">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            Express-Session + Passport
          </span>
          <span>•</span>
          <span>Role-Based Dashboards</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter your registered email address to submit a password reset request to gym administration.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@gympro.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white"
                >
                  {forgotSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
