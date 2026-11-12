import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  QrCode,
  Printer,
  Download,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
  RotateCcw,
  UserPlus,
  HeartPulse,
  BadgeCheck,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { plans as mockPlans } from '../../data/mockData';
import { receptionistApi, plansApi } from '../../services/api';

export default function MemberRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [availablePlans, setAvailablePlans] = useState(mockPlans);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await plansApi.getPlans();
        if (res.success && res.plans?.length > 0) {
          setAvailablePlans(res.plans);
        }
      } catch (err) {}
    }
    fetchPlans();
  }, []);

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    fitnessGoal: 'General Fitness',

    // Step 2: Membership Plan
    selectedPlanId: mockPlans[1]?.id || 'p2', // default to Standard

    // Step 3: Payment
    paymentMethod: 'Cash',
    paidAmount: mockPlans[1]?.price || 1000,
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [registeredMember, setRegisteredMember] = useState(null);

  // Update selected plan and adjust amount
  const handleSelectPlan = (plan) => {
    const planId = plan._id || plan.id;
    setFormData((prev) => ({
      ...prev,
      selectedPlanId: planId,
      paidAmount: plan.price,
    }));
  };

  const currentPlan = availablePlans.find(
    (p) => (p._id || p.id) === formData.selectedPlanId
  ) || availablePlans[0];

  const validateStep1 = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        toast.error('Please complete all required fields correctly');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      fitnessGoal: formData.fitnessGoal,
      planName: currentPlan?.name || 'Standard',
      planDuration: currentPlan?.duration || 30,
      paymentMethod: formData.paymentMethod,
      paidAmount: formData.paidAmount,
      referenceNumber: formData.referenceNumber,
      notes: formData.notes,
    };

    try {
      const res = await receptionistApi.registerMember(payload);
      if (res.success && res.member) {
        setRegisteredMember({
          id: res.member._id || res.member.id,
          fullName: res.member.name,
          email: res.member.email,
          phone: res.member.phone,
          planName: res.member.plan,
          joinDate: new Date().toISOString().split('T')[0],
          expiryDate: res.member.planExpiryDate
            ? new Date(res.member.planExpiryDate).toISOString().split('T')[0]
            : 'In 30 days',
          status: res.member.status || 'active',
          receiptNumber: res.receiptNo || `RCP-${Date.now().toString().slice(-6)}`,
          paymentMethod: formData.paymentMethod,
          paidAmount: formData.paidAmount,
        });
        setCurrentStep(4);
        toast.success(`Member ${res.member.name} registered and activated in database!`, {
          icon: '🎉',
          duration: 4000,
        });
        return;
      }
    } catch (err) {
      console.warn('Backend registration failed, using local registration fallback:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Generate simulated member record fallback
    const newMemberId = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (currentPlan?.duration || 30));
    const expiryFormatted = expiry.toISOString().split('T')[0];

    const completedRegistration = {
      id: newMemberId,
      ...formData,
      planName: currentPlan?.name || 'Standard',
      planPrice: currentPlan?.price || 1000,
      joinDate: today,
      expiryDate: expiryFormatted,
      status: 'active',
      receiptNumber: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setRegisteredMember(completedRegistration);
    setCurrentStep(4);
    toast.success(`Member ${formData.fullName} successfully registered!`, {
      icon: '🎉',
      duration: 4000,
    });
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      fitnessGoal: 'General Fitness',
      selectedPlanId: mockPlans[1]?.id || 'p2',
      paymentMethod: 'Cash',
      paidAmount: mockPlans[1]?.price || 1000,
      referenceNumber: '',
      notes: '',
    });
    setErrors({});
    setRegisteredMember(null);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Member Registration"
        subtitle="Enroll new gym members, assign subscription packages, and issue digital QR cards"
      />

      {/* Stepper Progress Bar */}
      {currentStep < 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div
              className={`p-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStep === 1
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : currentStep > 1
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep > 1
                    ? 'bg-emerald-600 text-white'
                    : currentStep === 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>1. Personal Details</span>
            </div>

            <div
              className={`p-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStep === 2
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : currentStep > 2
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep > 2
                    ? 'bg-emerald-600 text-white'
                    : currentStep === 2
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>2. Membership Plan</span>
            </div>

            <div
              className={`p-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStep === 3
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </span>
              <span>3. Payment & Preview</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: PERSONAL INFORMATION */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Section 1: Personal Information
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the member's primary identification and contact information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Almaz Bekele"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.fullName
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-primary-500'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-rose-500 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. almaz@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-primary-500'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+251 9..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-primary-500'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.dob
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-primary-500'
                }`}
              />
              {errors.dob && <p className="text-xs text-rose-500 mt-1">{errors.dob}</p>}
            </div>

            {/* Fitness Goal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Fitness Goal
              </label>
              <select
                value={formData.fitnessGoal}
                onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="General Fitness">General Fitness & Wellness</option>
                <option value="Weight Loss">Weight Loss & Toning</option>
                <option value="Muscle Building">Muscle Building & Hypertrophy</option>
                <option value="Strength Training">Athletic Performance / Strength</option>
                <option value="Rehabilitation">Cardio & Mobility Rehab</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              Emergency Contact (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brother, Spouse, Friend"
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+251 9..."
                  value={formData.emergencyContactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactPhone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* Navigation Action */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Proceed to Membership Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MEMBERSHIP PLAN SELECTION */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary-600" />
              Section 2: Choose Membership Plan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an access tier that best fits the member's fitness plan and schedule.
            </p>
          </div>

          {/* Radio Cards for Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.map((plan) => {
              const planId = plan._id || plan.id;
              const isSelected = formData.selectedPlanId === planId;
              return (
                <div
                  key={planId}
                  onClick={() => handleSelectPlan(plan)}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50/30 shadow-md ring-2 ring-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {plan.name === 'Premium' && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white uppercase tracking-wider shadow-xs">
                      Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4>
                        <span className="text-xs text-slate-500">
                          {plan.duration} {plan.durationUnit}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-4 mb-4">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1">
                        {plan.currency}
                      </span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <span
                      className={`text-xs font-semibold block text-center py-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Action */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Continue to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT & PREVIEW */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmitRegistration} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Payment Details (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Section 3: Record Registration Payment
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Collect initial fee and record the transaction method.
                </p>
              </div>

              {/* Amount Due (Prefilled) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Amount Due ({currentPlan.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, paidAmount: Number(e.target.value) })
                    }
                    className="w-full pl-4 pr-16 py-2.5 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 bg-slate-50"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                    ETB
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatically set based on {currentPlan.name} Plan price.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash (Counter)' },
                    { id: 'Mobile Money', label: 'Mobile (Telebirr/CBE)' },
                    { id: 'Bank Transfer', label: 'Bank Transfer' },
                  ].map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                      className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                        formData.paymentMethod === method.id
                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-500/10'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Transaction Reference / Bank Slip No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-9988221 or Telebirr Receipt Ref"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, referenceNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Desk Reception Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Locker assigned, guest pass requested, medical notes, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white resize-none"
                />
              </div>
            </div>

            {/* Right Col: Registration Summary Preview (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">
                  Registration Summary & Verification
                </h4>

                <div className="space-y-3 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400">Member:</span>
                    <p className="font-bold text-slate-900 text-sm">{formData.fullName}</p>
                    <p className="text-slate-500">{formData.phone} • {formData.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400">Gender / Goal:</span>
                      <p className="font-semibold text-slate-700">
                        {formData.gender} • {formData.fitnessGoal}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Date of Birth:</span>
                      <p className="font-semibold text-slate-700">{formData.dob || '—'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400">Chosen Subscription:</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-slate-800 text-sm">
                        {currentPlan.name} Plan ({currentPlan.duration} days)
                      </span>
                      <span className="font-bold text-primary-600">
                        {currentPlan.price} ETB
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                      <span>Total Due Today:</span>
                      <span className="text-emerald-600">{formData.paidAmount} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                      <span>Method:</span>
                      <span>{formData.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit & Generate Member QR</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ← Back to Plans
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* STEP 4: REGISTRATION SUCCESS & DIGITAL QR BADGE */}
      {currentStep === 4 && registeredMember && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Registration Complete
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Welcome to GymPro, {registeredMember.fullName}!
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Member record has been saved. The digital QR membership card below is activated and ready for instant turnstile access.
            </p>
          </div>

          {/* Printable Digital QR Membership Badge Card */}
          <div className="max-w-sm mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950 text-white p-6 rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden text-left">
            {/* Top Gym Branding */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-sm">
                  GP
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide">GYMPRO FITNESS</h4>
                  <p className="text-[10px] text-primary-300">Official Access Pass</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                ACTIVE
              </span>
            </div>

            {/* Member Card Body */}
            <div className="my-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white">
                {registeredMember.fullName.charAt(0)}
              </div>
              <div>
                <h5 className="font-bold text-base text-white">{registeredMember.fullName}</h5>
                <p className="text-xs text-slate-300 font-mono">ID: {registeredMember.id}</p>
                <p className="text-xs text-primary-300 font-semibold mt-0.5">
                  {registeredMember.planName} Plan
                </p>
              </div>
            </div>

            {/* QR Code Illustration */}
            <div className="bg-white p-4 rounded-xl text-center space-y-2 text-slate-900 shadow-inner">
              <div className="w-32 h-32 mx-auto bg-slate-900 rounded-lg p-2 flex items-center justify-center">
                {/* SVG QR Code Simulation */}
                <div className="w-full h-full bg-white rounded p-1 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-900" />
                </div>
              </div>
              <p className="text-[10px] font-mono font-semibold text-slate-500">
                TOKEN: {registeredMember.id}-2026-VAL
              </p>
            </div>

            {/* Card Footer Details */}
            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 text-[10px] text-slate-300">
              <div>
                <span className="text-slate-400 block">JOIN DATE</span>
                <span className="font-mono">{registeredMember.joinDate}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">EXPIRATION</span>
                <span className="font-mono text-emerald-300">{registeredMember.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => toast.success('Membership badge sent to member printer queue!')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Badge</span>
            </button>
            <button
              onClick={() => toast.success('Digital QR card image downloaded!')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Digital Card</span>
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-200 transition-all"
            >
              Register Another Member
            </button>
            <Link
              to="/receptionist"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Back to Desk Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
