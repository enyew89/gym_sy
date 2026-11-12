import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { plansApi, chapaApi } from '../services/api';
import toast from 'react-hot-toast';
import GymLogo from '../components/GymLogo';
import {
  Dumbbell,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  Flame,
  CheckCircle2,
  Building2,
  QrCode
} from 'lucide-react';

export default function MemberRegistrationPage() {
  const navigate = useNavigate();
  const { registerMember } = useAuth();

  // Registration step: 1 = Fast Form, 2 = Success / Welcome Badge
  const [step, setStep] = useState(1);

  // Form fields with sensible, frictionless defaults
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    fitnessGoal: 'Hypertrophy & Strength',
    plan: 'Standard',
    paymentMethod: 'chapa', // 'chapa' by default!
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payingWithChapa, setPayingWithChapa] = useState(false);
  const [plans, setPlans] = useState([]);
  const [createdUser, setCreatedUser] = useState(null);

  // Fetch plans on mount
  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await plansApi.getPlans();
        if (res.success && res.plans?.length > 0) {
          setPlans(res.plans);
        }
      } catch (err) {
        setPlans([
          {
            name: 'Basic',
            price: 500,
            currency: 'ETB',
            durationDays: 30,
            features: ['Gym floor access', 'Standard weights', 'Locker access'],
          },
          {
            name: 'Standard',
            price: 1000,
            currency: 'ETB',
            durationDays: 30,
            isPopular: true,
            features: ['Full gym & cardio', 'Group fitness classes', 'Sauna access'],
          },
          {
            name: 'Premium',
            price: 2000,
            currency: 'ETB',
            durationDays: 30,
            features: ['All Standard features', 'Personal Trainer', 'AI fitness coach'],
          },
        ]);
      }
    }
    loadPlans();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePayWithChapaNow = async () => {
    setPayingWithChapa(true);
    const matchedPlan = plans.find((p) => p.name.toLowerCase() === formData.plan.toLowerCase());
    const amount = matchedPlan ? matchedPlan.price : 1000;
    const returnUrl = `${window.location.origin}/member/payments?chapa_status=verify`;

    try {
      const chapaRes = await chapaApi.initialize({
        planName: formData.plan,
        amount,
        returnUrl,
        phoneNumber: formData.phone || '0911000000',
      });

      if (chapaRes.success && chapaRes.checkoutUrl) {
        toast.success('Redirecting to Chapa checkout...', { icon: '💳' });
        window.location.href = chapaRes.checkoutUrl;
      } else {
        toast.error(chapaRes.message || 'Could not connect to Chapa gateway');
      }
    } catch (err) {
      toast.error(err.message || 'Chapa gateway error. You can also pay from the dashboard.');
    } finally {
      setPayingWithChapa(false);
    }
  };

  // Submit Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!formData.password) {
      toast.error('Please enter a password');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. Create the Member Account
      const registered = await registerMember({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.password, // Keep matching without forcing user to retype
        acceptTerms: true,
        fitnessGoal: formData.fitnessGoal,
        plan: formData.plan,
      });

      setCreatedUser(registered);

      // 2. If Chapa payment selected, initialize gateway checkout
      if (formData.paymentMethod === 'chapa') {
        const matchedPlan = plans.find((p) => p.name.toLowerCase() === formData.plan.toLowerCase());
        const amount = matchedPlan ? matchedPlan.price : 1000;
        const returnUrl = `${window.location.origin}/member/payments?chapa_status=verify`;

        try {
          const chapaRes = await chapaApi.initialize({
            planName: formData.plan,
            amount,
            returnUrl,
            phoneNumber: formData.phone || '0911000000',
          });

          if (chapaRes.success && chapaRes.checkoutUrl) {
            toast.success('Redirecting to Chapa secure checkout...', { icon: '💳' });
            window.location.href = chapaRes.checkoutUrl;
            return;
          }
        } catch (chapaErr) {
          console.warn('Chapa redirect error, falling back to instant dashboard:', chapaErr);
        }
      }

      // 3. Regular registration with active access
      toast.success(`Welcome to GymPro, ${registered.name}! Your account is active.`, {
        icon: '🎉',
        duration: 4000,
      });
      setStep(2); // Show digital pass & welcome badge
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fitnessGoalsList = [
    { id: 'Hypertrophy & Strength', label: 'Muscle & Strength', icon: Dumbbell },
    { id: 'Weight Loss & Fat Burn', label: 'Fat Loss & Tone', icon: Flame },
    { id: 'Cardio & Endurance', label: 'Cardio & Stamina', icon: Zap },
    { id: 'Flexibility & Yoga', label: 'Mobility & Posture', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background mood glow */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/85 to-[#0a0a0c]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        {/* Navigation & Header */}
        <div className="mb-5 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </Link>
          <span className="text-[11px] font-bold text-orange-500 tracking-widest uppercase">
            FAST ATHLETE SIGN-UP
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="mb-2 flex justify-center">
            <GymLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            {step === 1 ? 'Join The Gym Community' : 'Welcome To The Floor!'}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {step === 1
              ? 'Complete this quick 30-second form to get your digital gym pass.'
              : 'Your digital membership pass is ready. Show it at the front desk to enter!'}
          </p>
        </div>

        {/* STEP 1: Quick & Easy Form */}
        {step === 1 && (
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Full Name <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Yonas Tadesse"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Email Address <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="athlete@gympro.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-zinc-500 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0911 234 567"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Create Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters (e.g. password123)"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#0a0a0c] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Membership Plan Selector (Clean Cards) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Select Membership Tier
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { name: 'Basic', price: '500', desc: 'Standard Floor' },
                    { name: 'Standard', price: '1,000', desc: 'Floor + Classes + Sauna', popular: true },
                    { name: 'Premium', price: '2,000', desc: 'All-Access + Trainer' },
                  ].map((p) => {
                    const isSelected = formData.plan.toLowerCase() === p.name.toLowerCase();
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, plan: p.name })}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-950/20 ring-1 ring-orange-500/50'
                            : 'border-zinc-800 bg-[#0d0d10] hover:border-zinc-700'
                        }`}
                      >
                        {p.popular && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-orange-600 text-white">
                            POPULAR
                          </span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{p.name}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{p.desc}</p>
                        </div>
                        <div className="mt-2 text-sm font-black text-orange-400">
                          {p.price} <span className="text-[10px] text-zinc-400 font-normal">ETB/mo</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Channel Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Payment Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'desk' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      formData.paymentMethod === 'desk'
                        ? 'border-orange-500 bg-orange-950/20 text-white ring-1 ring-orange-500/50'
                        : 'border-zinc-800 bg-[#0d0d10] text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 ${formData.paymentMethod === 'desk' ? 'text-orange-500' : 'text-zinc-500'}`} />
                      <div>
                        <p className="font-bold text-white text-[11px]">Pay at Reception Desk</p>
                        <p className="text-[10px] text-zinc-400">Cash / Mobile Transfer in person</p>
                      </div>
                    </div>
                    {formData.paymentMethod === 'desk' && <Check className="w-3.5 h-3.5 text-orange-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'chapa' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      formData.paymentMethod === 'chapa'
                        ? 'border-orange-500 bg-orange-950/20 text-white ring-1 ring-orange-500/50'
                        : 'border-zinc-800 bg-[#0d0d10] text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${formData.paymentMethod === 'chapa' ? 'text-orange-500' : 'text-zinc-500'}`} />
                      <div>
                        <p className="font-bold text-white text-[11px]">Pay Online via Chapa</p>
                        <p className="text-[10px] text-zinc-400">Telebirr, CBE, Visa/Mastercard</p>
                      </div>
                    </div>
                    {formData.paymentMethod === 'chapa' && <Check className="w-3.5 h-3.5 text-orange-500" />}
                  </button>
                </div>
              </div>

              {/* Fitness Goal Pills */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Primary Fitness Focus
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {fitnessGoalsList.map((g) => {
                    const isSelected = formData.fitnessGoal === g.id;
                    const Icon = g.icon;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, fitnessGoal: g.id })}
                        className={`p-2 rounded-lg border text-center text-[11px] font-medium transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-950/30 text-white font-semibold'
                            : 'border-zinc-800 bg-[#0d0d10] text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-500' : 'text-zinc-500'}`} />
                        <span className="truncate">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Friendly terms notice */}
              <p className="text-[11px] text-zinc-400 text-center pt-1">
                By clicking below, you agree to gym safety rules and terms of access.
              </p>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50 text-xs active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>
                      {formData.paymentMethod === 'chapa'
                        ? `Proceed to Chapa Payment (${formData.plan} Plan)`
                        : `Activate Account & Get Gym Pass`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link to Login */}
            <div className="text-center pt-3 border-t border-zinc-800 text-xs text-zinc-400">
              Already a gym member?{' '}
              <Link to="/login" className="text-orange-500 hover:text-orange-400 font-bold uppercase tracking-wider">
                Sign in here
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: Instant Welcome Card & QR Pass */}
        {step === 2 && (
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center backdrop-blur-sm space-y-5 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                Welcome, {createdUser?.name || formData.name}!
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Your athlete profile is registered with the{' '}
                <span className="text-orange-500 font-bold uppercase">{formData.plan}</span> plan.
              </p>
            </div>

            {/* Digital Pass Preview */}
            <div className="max-w-xs mx-auto p-4 rounded-2xl bg-[#0a0a0c] border border-zinc-800 shadow-xl text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center border border-orange-500/30">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Gym Pass Ready</p>
                    <p className="text-[9px] text-zinc-500">Scan at entrance scanner</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white">
                  Active
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-[11px]">Member:</span>
                  <span className="font-semibold text-white">{createdUser?.name || formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-[11px]">Plan:</span>
                  <span className="font-semibold text-orange-400">{formData.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-[11px]">Valid Until:</span>
                  <span className="font-semibold text-zinc-300">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Chapa Payment Action & Dashboard Entry */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handlePayWithChapaNow}
                disabled={payingWithChapa}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all text-xs shadow-lg shadow-emerald-600/30 active:scale-98 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {payingWithChapa
                    ? 'Connecting to Chapa...'
                    : `Pay Online via Chapa (${formData.plan} Plan)`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/member')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase tracking-wider rounded-xl transition-all text-xs cursor-pointer"
              >
                <span>Enter Member Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-500">
              You can also renew or settle payment anytime from your member portal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
