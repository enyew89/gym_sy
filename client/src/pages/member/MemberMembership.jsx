import { useState, useEffect } from 'react';
import {
  CreditCard, QrCode, Check, ShieldCheck, Sparkles,
  Clock, Calendar, RefreshCw, ArrowUpRight, CheckCircle2,
  AlertCircle, ChevronRight, Download, Zap
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { plans, members, payments } from '../../data/mockData';
import { StatusBadge, PageHeader, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { memberApi, plansApi, chapaApi, paymentsApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function MemberMembership() {
  const { user } = useAuth();
  const rawMember = members.find((m) => m.id === (user?.id || user?._id || 'm1')) || members[0] || user || {};
  const [membershipData, setMembershipData] = useState({
    plan: user?.plan || rawMember?.plan || 'None',
    status: user?.status || 'active',
    planExpiryDate: user?.planExpiryDate || null,
    daysRemaining: 0,
    isExpired: false,
    trainerName: user?.trainerName || 'Not Assigned',
  });
  const [availablePlansList, setAvailablePlansList] = useState(plans);
  const [paymentHistoryList, setPaymentHistoryList] = useState([]);

  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePaymentMethod, setUpgradePaymentMethod] = useState('Chapa');
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [qrCodeTimestamp, setQrCodeTimestamp] = useState(Date.now());
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);

  const loadMembership = async () => {
    try {
      const [memRes, plansRes, payRes] = await Promise.all([
        memberApi.getMembership(),
        plansApi.getPlans(),
        memberApi.getPayments(),
      ]);

      if (memRes.success && memRes.membership) {
        setMembershipData(memRes.membership);
      }
      if (plansRes.success && plansRes.plans?.length > 0) {
        setAvailablePlansList(plansRes.plans);
      }
      if (payRes.success && payRes.payments?.length > 0) {
        setPaymentHistoryList(payRes.payments);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadMembership();
  }, []);

  const currentPlan = availablePlansList.find(
    (p) => p.name.toLowerCase() === (membershipData.plan || 'premium').toLowerCase()
  ) || availablePlansList[0] || plans[2];

  const daysRemaining = membershipData.daysRemaining || 0;
  const percentageRemaining = Math.min(100, Math.round((daysRemaining / 30) * 100));

  const handleRefreshQR = () => {
    setIsRefreshingQR(true);
    setTimeout(() => {
      setQrCodeTimestamp(Date.now());
      setIsRefreshingQR(false);
    }, 600);
  };

  const handleOpenUpgrade = (plan) => {
    setSelectedPlanToUpgrade(plan);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanToUpgrade) return;
    setIsProcessingUpgrade(true);

    if (upgradePaymentMethod === 'Chapa') {
      try {
        const returnUrl = `${window.location.origin}/member/payments?chapa_status=verify`;
        const res = await chapaApi.initialize({
          planName: selectedPlanToUpgrade.name,
          amount: selectedPlanToUpgrade.price,
          returnUrl,
          phoneNumber: user?.phone || '0911000000',
        });

        if (res.success && res.checkoutUrl) {
          toast.success('Redirecting to Chapa secure checkout...', { icon: '💳' });
          setShowUpgradeModal(false);
          window.location.href = res.checkoutUrl;
          return;
        } else {
          toast.error(res.message || 'Chapa initialization failed');
        }
      } catch (err) {
        toast.error(err.message || 'Chapa Gateway Error');
      } finally {
        setIsProcessingUpgrade(false);
      }
      return;
    }

    try {
      const res = await memberApi.payOnline({
        planName: selectedPlanToUpgrade.name,
        amount: selectedPlanToUpgrade.price,
        paymentMethod: upgradePaymentMethod,
      });

      if (res.success) {
        setShowUpgradeModal(false);
        setUpgradeSuccess(true);
        toast.success(`Upgraded to ${selectedPlanToUpgrade.name} Plan! Receipt: ${res.receiptNo}`);
        loadMembership();
        setTimeout(() => setUpgradeSuccess(false), 4500);
        return;
      }
    } catch (err) {
      console.warn('Online upgrade fallback:', err);
    } finally {
      setIsProcessingUpgrade(false);
    }

    setShowUpgradeModal(false);
    setUpgradeSuccess(true);
    toast.success(`Plan change requested!`);
    setTimeout(() => setUpgradeSuccess(false), 4500);
  };

  const pendingPayment = paymentHistoryList.find((p) => p.status === 'pending');

  const handleVerifyPendingChapa = async (txRef) => {
    if (!txRef) return;
    const loadingToast = toast.loading('Verifying pending payment with Chapa...');
    try {
      const res = await chapaApi.verify(txRef);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success(res.message || 'Payment successfully verified!', { icon: '🎉' });
        loadMembership();
      } else {
        toast.error(res.message || 'Payment verification failed');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Verification error');
    }
  };

  const handleCancelPending = async (paymentId) => {
    if (!paymentId) return;
    const loadingToast = toast.loading('Cancelling pending payment...');
    try {
      const res = await paymentsApi.deletePayment(paymentId);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success('Pending payment cancelled. You can now select a plan.');
        loadMembership();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Could not cancel payment');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership & Access"
        subtitle="Review your active plan, digital check-in code, and upgrade options"
      />

      {/* Pending Payment Notification Banner */}
      {pendingPayment && (
        <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
              <Clock className="w-5 h-5 animate-pulse text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-950 text-sm">Payment Pending Verification</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                  Ref: {pendingPayment.receiptNo || pendingPayment.tx_ref?.slice(-8)}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Your payment of <strong className="font-semibold text-amber-950">{pendingPayment.amount} ETB</strong> for the <strong className="font-semibold text-amber-950">{pendingPayment.plan} Plan</strong> ({pendingPayment.method}) is awaiting confirmation. Duplicate payments are blocked until cleared.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingPayment.tx_ref && (
              <button
                type="button"
                onClick={() => handleVerifyPendingChapa(pendingPayment.tx_ref)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Verify Now</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCancelPending(pendingPayment._id || pendingPayment.id)}
              className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {upgradeSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">
            Plan change request submitted! Our reception desk will verify your upgrade shortly.
          </p>
        </div>
      )}

      {/* Top Section: Current Plan & Digital QR Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Active Plan (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-violet-500/30 p-6 sm:p-7 shadow-sm relative overflow-hidden flex flex-col justify-between">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-violet-100 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Active Subscription
                </span>
              </div>
              <StatusBadge status="active" />
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {currentPlan.name} Membership
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Full facility privileges • Dedicated personal trainer included
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black text-violet-700">
                  {currentPlan.price} <span className="text-sm font-semibold text-slate-500">{currentPlan.currency}/mo</span>
                </p>
              </div>
            </div>

            {/* Expiry Countdown & Progress Bar */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-violet-600" />
                  Expires: <span className="text-slate-900 font-bold">
                    {membershipData.planExpiryDate ? new Date(membershipData.planExpiryDate).toLocaleDateString() : 'No active expiry'}
                  </span>
                </span>
                <span className="text-violet-700 font-bold">{daysRemaining} days remaining</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentageRemaining}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Renew before expiry to keep your current locker reservation and trainer schedule.
              </p>
            </div>

            {/* Included Features List */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Included with your plan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Auto-renews: <span className="font-semibold text-slate-700">Manual payment required</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenUpgrade(plans.find((p) => p.name === 'Annual Premium') || currentPlan)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Renew / Extend Plan
              </button>
            </div>
          </div>
        </div>

        {/* Right: Digital QR Code Pass Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Gym Check-in Pass
              </span>
              <button
                onClick={handleRefreshQR}
                disabled={isRefreshingQR}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                title="Refresh token"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQR ? 'animate-spin text-violet-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="mt-5">
              <h3 className="font-bold text-slate-900 text-lg">Show this code at the front desk</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hold your device screen near the turnstile optical scanner
              </p>
            </div>
          </div>

          {/* Large Stylized QR Code Box */}
          <div className="my-6 p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 relative group">
            <div className="w-52 h-52 bg-white p-3 rounded-xl border border-slate-200 shadow-md flex flex-col items-center justify-center">
              <QRCodeSVG
                value={`GYM-PASS:${user?._id || user?.id || 'none'}:${user?.email || 'none'}`}
                size={170}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PASS ID: {(user?._id || user?.id || 'M-NEW').toString().slice(-8).toUpperCase()}</span>
            </div>
          </div>

          <div className="w-full">
            <div className="p-3 bg-violet-50 rounded-xl text-left border border-violet-100 mb-3">
              <div className="flex items-center justify-between text-xs font-semibold text-violet-900">
                <span>Member: {user?.name || 'Member'}</span>
                <span>Status: {membershipData.status || 'Active'}</span>
              </div>
              <p className="text-[11px] text-violet-700 mt-1">
                Valid for gym entrance turnstile and facility privileges
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Pass is strictly non-transferable.
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            Upgrade Options
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
            Available Membership Plans
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Choose the membership tier that fits your workout lifestyle and goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlansList.map((plan) => {
            const planKey = (plan.name || '').toLowerCase();
            const currentPlanKey = (membershipData.plan || user?.plan || '').toLowerCase();
            const isCurrent = planKey === currentPlanKey;
            const isPendingThisPlan = pendingPayment && (pendingPayment.plan || '').toLowerCase() === planKey;

            // Normalize features into array
            const features = Array.isArray(plan.features)
              ? plan.features
              : typeof plan.features === 'string'
              ? plan.features.split(/\r?\n|•|,|\./).map((f) => f.trim()).filter((f) => f.length > 2)
              : ['Full gym access', 'Standard equipment', 'Locker access'];

            return (
              <div
                key={plan._id || plan.id || plan.name}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  isPendingThisPlan
                    ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/30 shadow-xs'
                    : isCurrent
                    ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {plan.durationDays ? `${plan.durationDays} Days` : '30 Days'}
                    </span>
                    {isPendingThisPlan ? (
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Current Plan
                      </span>
                    ) : null}
                  </div>

                  <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                  <div className="my-3">
                    <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500 font-medium"> {plan.currency || 'ETB'}</span>
                  </div>

                  <ul className="space-y-2 my-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    {features.slice(0, 4).map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isPendingThisPlan ? (
                    <div className="space-y-1">
                      <button
                        disabled
                        className="w-full py-2 bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Payment Pending</span>
                      </button>
                      <p className="text-[10px] text-amber-700 text-center font-medium">Awaiting verification</p>
                    </div>
                  ) : isCurrent ? (
                    daysRemaining > 7 && !membershipData.isExpired ? (
                      <div className="space-y-1">
                        <button
                          disabled
                          className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active ({daysRemaining}d left)</span>
                        </button>
                        <p className="text-[10px] text-slate-500 text-center font-medium">Already paid & active</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenUpgrade(plan)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Renew Plan ({daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d left`})</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleOpenUpgrade(plan)}
                      className="w-full py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 hover:border-slate-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Select / Switch to {plan.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Renewal History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Renewal History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your previous subscription payments and invoices
            </p>
          </div>
          <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date Paid</th>
                <th className="py-3 px-4">Plan / Period</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paymentHistoryList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No payment receipts found yet. Once you renew or pay online, your official receipt records will appear here.
                  </td>
                </tr>
              ) : (
                paymentHistoryList.map((item) => (
                  <tr key={item._id || item.id || item.receiptNo} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {item.receiptNo || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">{item.date}</td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className="text-slate-900">{item.plan}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {Number(item.amount || 0).toLocaleString()} {item.currency || 'ETB'}
                    </td>
                    <td className="py-3.5 px-4">{item.method}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Confirm Plan Change"
        size="md"
      >
        {selectedPlanToUpgrade && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You are requesting to change your membership to the{' '}
              <strong className="text-slate-900">{selectedPlanToUpgrade.name}</strong> plan.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Rate:</span>
                <span className="font-bold text-slate-900">
                  {selectedPlanToUpgrade.price} {selectedPlanToUpgrade.currency} / {selectedPlanToUpgrade.duration} {selectedPlanToUpgrade.durationUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Plan Credit:</span>
                <span className="font-semibold text-emerald-600">Prorated on check-in</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Term:</span>
                <span className="font-semibold text-slate-700">Online Direct Settlement</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Online Payment Channel
              </label>
              <select
                value={upgradePaymentMethod}
                onChange={(e) => setUpgradePaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-600 font-medium"
              >
                <option value="Chapa">⚡ Chapa Gateway (Telebirr, CBE Birr, Amole, Visa, Mastercard)</option>
                <option value="Mobile Money">Direct Telebirr / CBE Birr (USSD / QR)</option>
                <option value="Bank Transfer">CBE / Awash Mobile Banking</option>
                <option value="Credit Card">Direct Debit / Visa / Mastercard Online</option>
              </select>
            </div>

            <p className="text-xs text-slate-500">
              Upon confirmation, your membership plan is immediately updated and an official receipt is issued to your account.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingUpgrade}
                onClick={handleConfirmUpgrade}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                {isProcessingUpgrade ? 'Processing...' : 'Confirm & Pay Online'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
