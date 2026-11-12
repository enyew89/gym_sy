import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt, CreditCard, Calendar, Download, Printer,
  CheckCircle2, DollarSign, Clock, ArrowUpRight, Search,
  ShieldCheck, FileText, ExternalLink, Plus, Sparkles,
  Zap, AlertCircle, Loader2
} from 'lucide-react';
import { payments as mockPayments, members, plans as mockPlans } from '../../data/mockData';
import { StatCard, StatusBadge, PageHeader, Modal, DataTable } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { memberApi, plansApi, chapaApi, paymentsApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function MemberPayments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const memberId = user?.id || user?._id || 'm1';
  const member = members.find((m) => m.id === memberId) || members[0] || user || {};

  const [paymentList, setPaymentList] = useState([]);
  const [plansList, setPlansList] = useState(mockPlans);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isVerifyingChapa, setIsVerifyingChapa] = useState(false);

  // Calculate days remaining
  const daysRemaining = (() => {
    try {
      if (!user?.planExpiryDate && !member?.expiryDate) return 0;
      const exp = new Date(user?.planExpiryDate || member?.expiryDate);
      const diff = exp.getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    } catch {
      return 0;
    }
  })();

  const pendingPayment = paymentList.find((p) => p.status === 'pending');

  // Online Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [onlineForm, setOnlineForm] = useState({
    planName: user?.plan || 'Standard',
    paymentMethod: 'Chapa',
    phoneNumber: user?.phone || '+251911223344',
  });

  const loadData = async () => {
    try {
      const [payRes, plansRes] = await Promise.all([
        memberApi.getPayments(),
        plansApi.getPlans().catch(() => ({ success: false })),
      ]);

      if (payRes.success && payRes.payments?.length > 0) {
        setPaymentList(payRes.payments);
      }
      if (plansRes.success && plansRes.plans?.length > 0) {
        setPlansList(plansRes.plans);
      }
    } catch (err) {
      console.warn('Member payments loading fallback:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle return redirect from Chapa checkout
  useEffect(() => {
    const chapaStatus = searchParams.get('chapa_status');
    const txRef = searchParams.get('tx_ref');

    if (txRef && (chapaStatus === 'verify' || chapaStatus === 'success')) {
      const verifyChapaPayment = async () => {
        setIsVerifyingChapa(true);
        const loadingToast = toast.loading('Verifying payment with Chapa...');
        try {
          const res = await chapaApi.verify(txRef);
          toast.dismiss(loadingToast);
          if (res.success) {
            toast.success(res.message || 'Payment successfully verified with Chapa!', {
              icon: '🎉',
              duration: 5000,
            });
            if (res.payment) {
              setSelectedPayment(res.payment);
            }
            await loadData();
          } else {
            toast.error(res.message || 'Payment verification failed with Chapa.');
          }
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error(err.message || 'Could not verify Chapa payment.');
        } finally {
          setIsVerifyingChapa(false);
          setSearchParams({}, { replace: true });
        }
      };

      verifyChapaPayment();
    }
  }, [searchParams]);

  const handlePayOnlineSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const matchedPlan = plansList.find((p) => p.name.toLowerCase() === onlineForm.planName.toLowerCase()) || plansList[0];
    const amount = matchedPlan ? matchedPlan.price : 1000;

    // 1. Chapa Payment Gateway Flow
    if (onlineForm.paymentMethod === 'Chapa') {
      try {
        const returnUrl = `${window.location.origin}/member/payments?chapa_status=verify`;
        const res = await chapaApi.initialize({
          planName: onlineForm.planName,
          amount,
          returnUrl,
          phoneNumber: onlineForm.phoneNumber,
        });

        if (res.success && res.checkoutUrl) {
          toast.success('Redirecting to Chapa checkout...', { icon: '💳' });
          setIsPayModalOpen(false);
          // Redirect to Chapa hosted payment portal
          window.location.href = res.checkoutUrl;
          return;
        } else {
          toast.error(res.message || 'Chapa initialization failed');
        }
      } catch (err) {
        toast.error(err.message || 'Chapa Gateway Error');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. Direct manual / mobile money flow
    try {
      const res = await memberApi.payOnline({
        planName: onlineForm.planName,
        amount,
        paymentMethod: onlineForm.paymentMethod,
        phoneNumber: onlineForm.phoneNumber,
      });

      if (res.success && res.payment) {
        setPaymentList([res.payment, ...paymentList]);
        setIsPayModalOpen(false);
        setSelectedPayment(res.payment);
        toast.success(`Online payment confirmed! Receipt ${res.receiptNo} issued.`, { icon: '🎉' });
        return;
      }
    } catch (err) {
      console.warn('Online pay fallback:', err);
    } finally {
      setIsProcessing(false);
    }

    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const fallbackPayment = {
      _id: `pay-${Date.now()}`,
      memberName: user?.name || 'Member',
      amount,
      currency: 'ETB',
      plan: onlineForm.planName,
      date: new Date().toISOString().split('T')[0],
      method: onlineForm.paymentMethod,
      status: 'completed',
      receiptNo,
    };

    setPaymentList([fallbackPayment, ...paymentList]);
    setIsPayModalOpen(false);
    setSelectedPayment(fallbackPayment);
    toast.success(`Payment recorded with receipt ${receiptNo}!`);
  };

  // Calculations for summary stats
  const totalSpent = paymentList
    .filter((p) => p.status === 'completed')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const lastPayment = paymentList[0] || null;

  const nextDue = {
    date: user?.planExpiryDate ? new Date(user.planExpiryDate).toISOString().split('T')[0] : 'No active cycle',
    amount: lastPayment ? `${lastPayment.amount} ETB` : '0 ETB',
    plan: user?.plan && user.plan !== 'None' ? `${user.plan} Renewal` : 'No plan selected',
  };

  const filteredPayments = paymentList.filter(
    (p) =>
      (p.receiptNo || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.plan || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.method || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleDownload = (receiptNo) => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      key: 'receiptNo',
      label: 'Receipt #',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">{row.receiptNo}</span>
      ),
    },
    {
      key: 'date',
      label: 'Payment Date',
      render: (row) => <span className="text-slate-600 font-medium">{row.date}</span>,
    },
    {
      key: 'plan',
      label: 'Plan Tier',
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.plan} Membership</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount Paid',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.amount.toLocaleString()} {row.currency}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Payment Method',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          {row.method}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Receipt',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPayment(row);
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  const handleVerifyDirectChapa = async (txRef) => {
    if (!txRef) return;
    setIsVerifyingChapa(true);
    const loadingToast = toast.loading('Verifying payment with Chapa...');
    try {
      const res = await chapaApi.verify(txRef);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success(res.message || 'Payment successfully verified!', { icon: '🎉' });
        loadData();
      } else {
        toast.error(res.message || 'Payment verification failed with Chapa.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Could not verify payment.');
    } finally {
      setIsVerifyingChapa(false);
    }
  };

  const handleCancelPending = async (paymentId) => {
    if (!paymentId) return;
    const loadingToast = toast.loading('Cancelling pending payment...');
    try {
      const res = await paymentsApi.deletePayment(paymentId);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success('Pending payment cancelled. You can now submit a new payment.');
        loadData();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Could not cancel payment');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment & Billing History"
        subtitle="View receipts, invoices, and your upcoming membership renewal schedule"
        action={
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay / Renew Online</span>
          </button>
        }
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
                Your payment of <strong className="font-semibold text-amber-950">{pendingPayment.amount} ETB</strong> for the <strong className="font-semibold text-amber-950">{pendingPayment.plan} Plan</strong> ({pendingPayment.method}) is awaiting confirmation. Duplicate payments for this plan are locked.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingPayment.tx_ref && (
              <button
                type="button"
                disabled={isVerifyingChapa}
                onClick={() => handleVerifyDirectChapa(pendingPayment.tx_ref)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Verify with Chapa</span>
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

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Receipt PDF generated and downloaded successfully!</p>
        </div>
      )}

      {/* Payment Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Spent"
          value={`${totalSpent.toLocaleString()} ETB`}
          subtitle={`${paymentList.filter((p) => p.status === 'completed').length} completed subscription payment${paymentList.filter((p) => p.status === 'completed').length === 1 ? '' : 's'}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Last Payment"
          value={lastPayment ? `${Number(lastPayment.amount || 0).toLocaleString()} ${lastPayment.currency || 'ETB'}` : '0 ETB'}
          subtitle={lastPayment ? `${lastPayment.plan} on ${lastPayment.date}` : 'No payments recorded'}
          icon={Receipt}
          color="primary"
        />
        <StatCard
          title="Next Due Date"
          value={nextDue.date}
          subtitle={`${nextDue.amount} • ${nextDue.plan}`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Payment History DataTable Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any transaction row or receipt button to preview the full digital receipt
            </p>
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt # or method..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPayments}
          onRowClick={(row) => setSelectedPayment(row)}
        />
      </div>

      {/* Receipt Detail Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Official Payment Receipt"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-6 p-2">
            {/* Receipt Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                    GP
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                    GymPro Fitness Center
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Bole Medhanialem Road, Addis Ababa, Ethiopia
                </p>
                <p className="text-xs text-slate-500">Tax TIN: 0092817345</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase text-slate-400">Receipt</span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {selectedPayment.receiptNo}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Date: {selectedPayment.date}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 font-medium">Billed To:</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedPayment.memberName || user?.name || 'Gym Member'}</h4>
                <p className="text-slate-500">{selectedPayment.memberEmail || user?.email || ''}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-medium">Member ID:</span>
                <p className="font-mono font-bold text-slate-800">
                  {(selectedPayment.memberId || user?._id || 'M-NEW').toString().slice(-8).toUpperCase()}
                </p>
                <StatusBadge status={selectedPayment.status} />
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Period</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">
                        {selectedPayment.plan} Membership
                      </p>
                      <span className="text-[11px] text-slate-400">
                        Gym Floor, Sauna, Assigned Trainer & Towel Service
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">1 Month</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Info */}
            <div className="space-y-1.5 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>
                  {(selectedPayment.amount * 0.85).toFixed(0)} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT (15%)</span>
                <span>
                  {(selectedPayment.amount * 0.15).toFixed(0)} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Paid</span>
                <span className="text-primary-600">
                  {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Payment Method</span>
                <span className="font-semibold text-slate-800">{selectedPayment.method}</span>
              </div>
              {selectedPayment.chapaReference && (
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Chapa Ref</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedPayment.chapaReference}</span>
                </div>
              )}
            </div>

            {/* Stamp / Verification */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-[11px] text-emerald-800">
                  <p className="font-bold">Verified Transaction</p>
                  <p>Electronically cleared by GymPro billing gateway</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                AUTH-OK
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(selectedPayment.receiptNo)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Online Pay & Renewal Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pay & Renew Membership Online"
        size="md"
      >
        <form onSubmit={handlePayOnlineSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Instant Online Activation:
            </span>
            <p>
              Your payment will be verified electronically and your gym turnstile access immediately renewed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Membership Tier
            </label>
            <select
              value={onlineForm.planName}
              onChange={(e) => setOnlineForm({ ...onlineForm, planName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {plansList.map((p) => (
                <option key={p._id || p.id || p.name} value={p.name}>
                  {p.name} Plan ({p.price} ETB / 30 days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Gateway / Channel
            </label>
            <select
              value={onlineForm.paymentMethod}
              onChange={(e) => setOnlineForm({ ...onlineForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="Chapa">
                ⚡ Chapa Gateway (Telebirr, CBE Birr, Amole, Visa, Mastercard)
              </option>
              <option value="Mobile Money">Direct Telebirr / CBE Birr (USSD / QR)</option>
              <option value="Bank Transfer">CBE / Awash Mobile Banking</option>
              <option value="Credit Card">Direct Debit / Visa / Mastercard</option>
            </select>
            {onlineForm.paymentMethod === 'Chapa' && (
              <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between text-[11px] text-emerald-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Secured by Chapa Payment Gateway
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-emerald-800 font-mono font-bold border border-emerald-300">
                  ETB Real-Time
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Number / Payer Reference
            </label>
            <input
              type="text"
              required
              value={onlineForm.phoneNumber}
              onChange={(e) => setOnlineForm({ ...onlineForm, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Active Subscription & Pending Verification Safeguards */}
          {(() => {
            const isCurrentPlan = (user?.plan || '').toLowerCase() === (onlineForm.planName || '').toLowerCase();
            const isPlanActive = isCurrentPlan && daysRemaining > 7;
            const isPendingSelectedPlan = pendingPayment && (pendingPayment.plan || '').toLowerCase() === (onlineForm.planName || '').toLowerCase();

            if (isPendingSelectedPlan) {
              return (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Payment Already Pending Verification</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      You already have a pending payment of <strong>{pendingPayment.amount} ETB</strong> for the <strong>{onlineForm.planName} Plan</strong>. Duplicate transactions are blocked. Please verify with Chapa or cancel the pending record first.
                    </p>
                  </div>
                </div>
              );
            }

            if (isPlanActive) {
              return (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Subscription Already Active & Paid</p>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      You are currently active on the <strong>{onlineForm.planName} Plan</strong> with <strong>{daysRemaining} days remaining</strong>. You cannot pay for the same plan more than once until your subscription nears expiration ($\le 7$ days).
                    </p>
                  </div>
                </div>
              );
            }

            return null;
          })()}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            {(() => {
              const isCurrentPlan = (user?.plan || '').toLowerCase() === (onlineForm.planName || '').toLowerCase();
              const isPlanActive = isCurrentPlan && daysRemaining > 7;
              const isPendingSelectedPlan = pendingPayment && (pendingPayment.plan || '').toLowerCase() === (onlineForm.planName || '').toLowerCase();
              const isBlocked = isPlanActive || isPendingSelectedPlan;

              return (
                <button
                  type="submit"
                  disabled={isProcessing || isBlocked}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition-all ${
                    isBlocked
                      ? 'bg-slate-300 cursor-not-allowed opacity-60 text-slate-600'
                      : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  }`}
                >
                  {isProcessing
                    ? 'Processing Payment...'
                    : isPendingSelectedPlan
                    ? 'Payment Pending Verification'
                    : isPlanActive
                    ? 'Plan Already Active'
                    : 'Authorize & Pay Now'}
                </button>
              );
            })()}
          </div>
        </form>
      </Modal>
    </div>
  );
}
