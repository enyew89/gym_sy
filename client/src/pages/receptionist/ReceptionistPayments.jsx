import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  DollarSign,
  PlusCircle,
  Printer,
  Download,
  CheckCircle,
  Calendar,
  User,
  Clock,
  ArrowUpRight,
  Wallet,
  Smartphone,
  Building2,
  FileText,
  Zap,
  X,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Loader2
} from 'lucide-react';
import { PageHeader, StatusBadge, Modal } from '../../components/ui';
import { receptionistApi, paymentsApi, plansApi, chapaApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ReceptionistPayments() {
  const { user } = useAuth();

  const [paymentsList, setPaymentsList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all | today | week
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash | Chapa | Mobile Money | Bank Transfer
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(`RCP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chapa Online checkout state for Receptionist POS
  const [activeChapaSession, setActiveChapaSession] = useState(null);
  const [isGeneratingChapa, setIsGeneratingChapa] = useState(false);
  const [isVerifyingChapa, setIsVerifyingChapa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const chapaPollInterval = useRef(null);

  // Fetch all initial data
  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [memRes, planRes, payRes] = await Promise.all([
        receptionistApi.getMembers(),
        plansApi.getPlans(),
        paymentsApi.getPayments(),
      ]);

      if (memRes?.success && Array.isArray(memRes.members)) {
        setMembersList(memRes.members);
      }
      if (planRes?.success && Array.isArray(planRes.plans)) {
        setPlansList(planRes.plans);
        if (!selectedPlanId && planRes.plans.length > 0) {
          const defaultPlan = planRes.plans.find((p) => p.name === 'Standard') || planRes.plans[0];
          setSelectedPlanId(defaultPlan._id || defaultPlan.id);
          setAmount(defaultPlan.price);
        }
      }
      if (payRes?.success && Array.isArray(payRes.payments)) {
        setPaymentsList(payRes.payments);
      }
    } catch (err) {
      console.warn('Real-time payments data fetch:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Real-time background sync polling every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(true);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Handle member selection and autofill plan & price
  const handleMemberChange = (memberId) => {
    setSelectedMemberId(memberId);
    const member = membersList.find((m) => (m._id || m.id) === memberId);
    if (member && member.plan) {
      const plan = plansList.find(
        (p) => p.name.toLowerCase() === member.plan.toLowerCase()
      );
      if (plan) {
        setSelectedPlanId(plan._id || plan.id);
        setAmount(plan.price);
      }
    }
  };

  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    const plan = plansList.find((p) => (p._id || p.id) === planId);
    if (plan) {
      setAmount(plan.price);
    }
  };

  // Generate Online Chapa Payment session
  const handleInitiateChapa = async () => {
    if (!selectedMemberId) {
      toast.error('Please choose a member first');
      return;
    }

    const member = membersList.find((m) => (m._id || m.id) === selectedMemberId);
    const plan = plansList.find((p) => (p._id || p.id) === selectedPlanId);

    setIsGeneratingChapa(true);
    try {
      const returnUrl = `${window.location.origin}/receptionist/payments?chapa_status=verify`;
      const res = await chapaApi.initialize({
        planName: plan?.name || member?.plan || 'Standard',
        amount: Number(amount),
        memberId: member?._id || selectedMemberId,
        memberEmail: member?.email || '',
        phoneNumber: member?.phone || '0911000000',
        returnUrl,
      });

      if (res?.success && res.checkoutUrl) {
        setActiveChapaSession({
          checkoutUrl: res.checkoutUrl,
          tx_ref: res.tx_ref,
          payment: res.payment,
          memberName: member?.name || 'Walk-in Member',
          amount: Number(amount),
          plan: plan?.name || 'Standard',
        });
        toast.success('Chapa online checkout link generated!', { icon: '💳' });

        // Auto-poll verification every 4s while session is active
        startChapaPolling(res.tx_ref, member);
      } else {
        toast.error(res?.message || 'Could not initialize Chapa checkout');
      }
    } catch (err) {
      toast.error(err.message || 'Error connecting to Chapa payment gateway');
    } finally {
      setIsGeneratingChapa(false);
    }
  };

  const startChapaPolling = (tx_ref, member) => {
    if (chapaPollInterval.current) clearInterval(chapaPollInterval.current);

    chapaPollInterval.current = setInterval(async () => {
      try {
        const verifyRes = await chapaApi.verify(tx_ref);
        if (verifyRes?.success && verifyRes.payment) {
          clearInterval(chapaPollInterval.current);
          chapaPollInterval.current = null;
          setActiveChapaSession(null);
          toast.success(`Online payment of ${verifyRes.payment.amount} ETB verified via Chapa!`, {
            icon: '✅',
            duration: 6000,
          });
          setViewingReceipt(verifyRes.payment);
          fetchData(true);
          setSelectedMemberId('');
          setReceiptNumber(`RCP-${Math.floor(100000 + Math.random() * 900000)}`);
        }
      } catch {
        // Still pending
      }
    }, 4000);
  };

  const handleManualVerifyChapa = async () => {
    if (!activeChapaSession?.tx_ref) return;
    setIsVerifyingChapa(true);
    try {
      const verifyRes = await chapaApi.verify(activeChapaSession.tx_ref);
      if (verifyRes?.success && verifyRes.payment) {
        if (chapaPollInterval.current) clearInterval(chapaPollInterval.current);
        setActiveChapaSession(null);
        toast.success(`Payment verified successfully via Chapa!`, { icon: '✅' });
        setViewingReceipt(verifyRes.payment);
        fetchData(true);
        setSelectedMemberId('');
        setReceiptNumber(`RCP-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        toast('Payment not yet completed on Chapa. Awaiting member confirmation...', {
          icon: '⏳',
        });
      }
    } catch (err) {
      toast.error(err.message || 'Verification check failed');
    } finally {
      setIsVerifyingChapa(false);
    }
  };

  useEffect(() => {
    return () => {
      if (chapaPollInterval.current) clearInterval(chapaPollInterval.current);
    };
  }, []);

  // Record In-Person (Cash, Mobile POS, Bank Transfer) Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please choose a member');
      return;
    }

    if (paymentMethod === 'Chapa') {
      handleInitiateChapa();
      return;
    }

    const member = membersList.find((m) => (m._id || m.id) === selectedMemberId);
    const plan = plansList.find((p) => (p._id || p.id) === selectedPlanId);

    const payload = {
      memberId: member ? (member._id || member.id) : selectedMemberId,
      memberName: member ? member.name : 'Gym Member',
      memberEmail: member?.email || '',
      amount: Number(amount),
      currency: 'ETB',
      plan: plan?.name || 'Standard',
      method: paymentMethod,
      notes: notes || 'Front desk transaction',
    };

    setIsSubmitting(true);
    try {
      const res = await receptionistApi.recordPayment(payload);
      if (res?.success && res.payment) {
        const recorded = res.payment;
        setPaymentsList((prev) => [recorded, ...prev]);
        setViewingReceipt(recorded);
        toast.success(`Payment of ${amount} ETB recorded for ${payload.memberName}!`, {
          icon: '🧾',
        });
        setSelectedMemberId('');
        setNotes('');
        setReceiptNumber(`RCP-${Math.floor(100000 + Math.random() * 900000)}`);
        fetchData(true);
      } else {
        toast.error(res?.message || 'Failed to record payment');
      }
    } catch (err) {
      toast.error(err.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations for method breakdown
  const totalRevenue = paymentsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const cashTotal = paymentsList
    .filter((p) => p.method === 'Cash')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const chapaTotal = paymentsList
    .filter((p) => p.method === 'Chapa')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const mobileTotal = paymentsList
    .filter((p) => p.method === 'Mobile Money' || p.method === 'Telebirr')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const bankTotal = paymentsList
    .filter((p) => p.method === 'Bank Transfer' || p.method === 'Credit Card')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const cashPercent = totalRevenue ? Math.round((cashTotal / totalRevenue) * 100) : 0;
  const chapaPercent = totalRevenue ? Math.round((chapaTotal / totalRevenue) * 100) : 0;
  const mobilePercent = totalRevenue ? Math.round((mobileTotal / totalRevenue) * 100) : 0;
  const bankPercent = totalRevenue ? Math.round((bankTotal / totalRevenue) * 100) : 0;

  // Filter payments
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredPayments = paymentsList.filter((item) => {
    const memberNameStr = item.memberName || '';
    const receiptNoStr = item.receiptNo || item.tx_ref || '';
    const matchesSearch =
      memberNameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receiptNoStr.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod =
      methodFilter === 'all' ||
      item.method === methodFilter ||
      (methodFilter === 'Mobile Money' && item.method === 'Telebirr');

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = item.date === todayStr || (item.createdAt && item.createdAt.startsWith(todayStr));
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekStr = oneWeekAgo.toISOString().split('T')[0];
      matchesDate = item.date >= weekStr || (item.createdAt && item.createdAt >= weekStr);
    }

    return matchesSearch && matchesMethod && matchesDate;
  });

  const selectedMemberObj = membersList.find((m) => (m._id || m.id) === selectedMemberId);
  const selectedPlanObj = plansList.find((p) => (p._id || p.id) === selectedPlanId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Payment Operations & Real-time Desk"
          subtitle="Collect in-person cash & mobile transfers, issue Chapa online payments, and generate official receipts"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Live Sync</span>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh payments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Method Breakdown & Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {totalRevenue.toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-400 mt-1">{paymentsList.length} total payments</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Cash Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cash at Desk
              </p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {cashTotal.toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-500 mt-1">{cashPercent}% of total volume</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Chapa Online Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Chapa Online
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {chapaTotal.toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-500 mt-1">Gateway verified ({chapaPercent}%)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Mobile & Bank Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Telebirr & Bank
              </p>
              <h3 className="text-2xl font-black text-sky-700 mt-1">
                {(mobileTotal + bankTotal).toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-500 mt-1">Direct transfers ({mobilePercent + bankPercent}%)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Percentage Distribution Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
          <span>Payment Channel Distribution</span>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cash ({cashPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Chapa Online ({chapaPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Telebirr ({mobilePercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-violet-700">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Bank ({bankPercent}%)
            </span>
          </div>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div style={{ width: `${cashPercent}%` }} className="bg-emerald-500 h-full" title="Cash" />
          <div style={{ width: `${chapaPercent}%` }} className="bg-amber-500 h-full" title="Chapa Online" />
          <div style={{ width: `${mobilePercent}%` }} className="bg-sky-500 h-full" title="Telebirr" />
          <div style={{ width: `${bankPercent}%` }} className="bg-violet-500 h-full" title="Bank" />
        </div>
      </div>

      {/* Active Chapa Checkout Session Alert Banner (if generated) */}
      {activeChapaSession && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                  Live Chapa Session Active
                </span>
                <span className="text-xs text-slate-500 font-mono">Ref: {activeChapaSession.tx_ref}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Awaiting Payment of {activeChapaSession.amount} ETB from {activeChapaSession.memberName}
              </h4>
              <p className="text-xs text-slate-600">
                The member can complete checkout via Telebirr, CBEBirr, or Bank Card on Chapa. As soon as they pay, this will confirm automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={activeChapaSession.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Open Checkout</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeChapaSession.checkoutUrl);
                  setCopiedLink(true);
                  toast.success('Chapa payment link copied to clipboard!');
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualVerifyChapa}
                disabled={isVerifyingChapa}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                {isVerifyingChapa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Check Status</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (chapaPollInterval.current) clearInterval(chapaPollInterval.current);
                  setActiveChapaSession(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Section & Live Receipt Preview (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Record Payment Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Register Member Payment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Process walk-in cash, Telebirr POS, or generate instant Chapa online payment
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              {receiptNumber}
            </span>
          </div>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            {/* Member Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Member <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">-- Choose member from database --</option>
                {membersList.map((m) => {
                  const mId = m._id || m.id;
                  return (
                    <option key={mId} value={mId}>
                      {m.name} ({m.plan || 'Standard'} Plan • {(m.status || 'active').toUpperCase()})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Plan / Service
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {plansList.map((p) => {
                    const pId = p._id || p.id;
                    return (
                      <option key={pId} value={pId}>
                        {p.name} ({p.price} ETB / {p.durationDays || 30} days)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Amount to Charge (ETB)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-3 pr-12 py-2.5 border border-slate-300 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    ETB
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Radio Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Cash', label: 'Cash Desk', icon: Wallet, color: 'emerald' },
                  { id: 'Chapa', label: 'Chapa Online', icon: Zap, color: 'amber' },
                  { id: 'Mobile Money', label: 'Telebirr POS', icon: Smartphone, color: 'sky' },
                  { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2, color: 'violet' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes / Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Transaction Reference / Desk Notes (Optional)
              </label>
              <input
                type="text"
                placeholder={paymentMethod === 'Mobile Money' ? 'e.g. Telebirr Txn # / CBE ref' : 'Desk notes or customer locker authorization'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-2">
              {paymentMethod === 'Chapa' ? (
                <button
                  type="button"
                  onClick={handleInitiateChapa}
                  disabled={isGeneratingChapa}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all"
                >
                  {isGeneratingChapa ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
                  <span>Generate Chapa Online Payment ({amount} ETB)</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-200 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  <span>Confirm In-Person Payment & Issue Receipt</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Receipt Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex-1 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Receipt Preview
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {receiptNumber}
                </span>
              </div>

              {/* Receipt Paper Card */}
              <div className="mt-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 font-mono text-xs text-slate-700">
                <div className="text-center space-y-1 pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm tracking-wide text-slate-900">
                    GYMPRO FITNESS CENTER
                  </h4>
                  <p className="text-[11px] text-slate-500">Bole Atlas, Addis Ababa, Ethiopia</p>
                  <p className="text-[10px] text-slate-400">TIN: 0098442110 • Tel: +251 911 223344</p>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">RECEIPT NO:</span>
                    <span className="font-bold text-slate-800">{receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DATE:</span>
                    <span>{new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CASHIER:</span>
                    <span>{user?.name || 'Reception Desk'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MEMBER:</span>
                    <span className="font-bold text-slate-900">
                      {selectedMemberObj ? selectedMemberObj.name : '— Select Member —'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-200 py-2 space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>ITEM / SUBSCRIPTION</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{selectedPlanObj?.name || 'Membership'} ({selectedPlanObj?.durationDays || 30} Days)</span>
                    <span>{amount} ETB</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Channel:</span>
                    <span className="font-semibold text-slate-800">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                    <span>GRAND TOTAL:</span>
                    <span className="text-emerald-600">{amount} ETB</span>
                  </div>
                </div>

                <div className="pt-3 text-center border-t border-slate-100 space-y-1">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
                    ✓ OFFICIAL POS VOUCHER
                  </span>
                  <p className="text-[10px] text-slate-400">Valid for gym gate entry & locker assignment</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Thermal paper ready
              </span>
              <span>Standard 80mm ESC/POS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Payment History & Real-time Ledger</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredPayments.length} of {paymentsList.length} total transactions
            </p>
          </div>
          {/* Quick Date Filters */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  dateFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1 rounded-md transition-all ${
                  dateFilter === 'week'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-md transition-all ${
                  dateFilter === 'today'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Today Only
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar with Search and Method Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by member name, receipt number, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="sm:w-60">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Payment Channels</option>
              <option value="Cash">Cash Desk</option>
              <option value="Chapa">Chapa Online</option>
              <option value="Mobile Money">Mobile Money (Telebirr)</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Receipt / Ref</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPayments.map((item) => {
                const itemId = item._id || item.id || item.tx_ref;
                const isChapa = item.method === 'Chapa';
                return (
                  <tr key={itemId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                      {item.receiptNo || item.tx_ref || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div>{item.memberName || 'Member'}</div>
                      {item.memberEmail && (
                        <div className="text-xs text-slate-400 font-normal">{item.memberEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {item.plan || 'Standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">
                      {item.date || (item.createdAt ? item.createdAt.split('T')[0] : 'Today')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {(Number(item.amount) || 0).toLocaleString()} {item.currency || 'ETB'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          isChapa
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.method === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.method === 'Mobile Money' || item.method === 'Telebirr'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-violet-100 text-violet-800 border border-violet-200'
                        }`}
                      >
                        {isChapa && <Zap className="w-3 h-3 fill-amber-700 text-amber-700" />}
                        {item.method || 'Cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status || 'completed'} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setViewingReceipt(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-sm text-slate-400">
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View & Print Receipt Modal */}
      <Modal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        title="Official Transaction Receipt"
        size="md"
      >
        {viewingReceipt && (
          <div className="space-y-5">
            <div id="printable-receipt" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-bold text-base text-slate-900">GYMPRO FITNESS MANAGEMENT</h3>
                <p className="text-[11px] text-slate-500">Addis Ababa, Ethiopia</p>
                <p className="text-[10px] text-slate-400">www.gympro.et • +251 911 223344</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RECEIPT NUMBER:</span>
                  <span className="font-bold text-slate-900">{viewingReceipt.receiptNo || viewingReceipt.tx_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DATE:</span>
                  <span>{viewingReceipt.date || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MEMBER NAME:</span>
                  <span className="font-bold">{viewingReceipt.memberName}</span>
                </div>
                {viewingReceipt.memberEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">EMAIL:</span>
                    <span>{viewingReceipt.memberEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">PLAN PURCHASED:</span>
                  <span>{viewingReceipt.plan || 'Standard'} Membership</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PAYMENT METHOD:</span>
                  <span className="font-semibold text-slate-900">{viewingReceipt.method || 'Cash'}</span>
                </div>
                {viewingReceipt.chapaReference && (
                  <div className="flex justify-between text-amber-700">
                    <span>CHAPA REF:</span>
                    <span className="font-semibold">{viewingReceipt.chapaReference}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-3 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>TOTAL PAID:</span>
                <span className="text-emerald-600 font-black">
                  {(Number(viewingReceipt.amount) || 0).toLocaleString()} {viewingReceipt.currency || 'ETB'}
                </span>
              </div>

              <div className="text-center pt-2 space-y-1 text-[11px] text-slate-500">
                <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  ✓ OFFICIAL VERIFIED VOUCHER
                </div>
                <p>Present this voucher at the front desk for member card & locker key assignment.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
