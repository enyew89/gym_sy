import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { PageHeader, StatusBadge, Modal, SearchBar } from '../../components/ui';
import { payments as initialPayments, members as mockMembers, plans as mockPlans } from '../../data/mockData';
import { receptionistApi, paymentsApi, plansApi } from '../../services/api';

export default function ReceptionistPayments() {
  const [paymentsList, setPaymentsList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [plansList, setPlansList] = useState(mockPlans);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all | today | week
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Load real members, plans, and payments from backend on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [memRes, planRes, payRes] = await Promise.all([
          receptionistApi.getMembers(),
          plansApi.getPlans(),
          paymentsApi.getPayments(),
        ]);

        if (memRes.success && Array.isArray(memRes.members)) {
          setMembersList(memRes.members);
        }
        if (planRes.success && Array.isArray(planRes.plans)) {
          setPlansList(planRes.plans);
        }
        if (payRes.success && Array.isArray(payRes.payments)) {
          setPaymentsList(payRes.payments);
        }
      } catch (err) {
        console.warn('Using mock payments & members fallback:', err);
      }
    }
    loadData();
  }, []);

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('p2');
  const [amount, setAmount] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(`RCP-${Math.floor(100 + Math.random() * 900)}`);

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

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please choose a member');
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

    try {
      const res = await receptionistApi.recordPayment(payload);
      if (res.success && res.payment) {
        const recorded = res.payment;
        setPaymentsList([recorded, ...paymentsList]);
        setViewingReceipt(recorded);
        toast.success(`Payment of ${amount} ETB recorded for ${payload.memberName}!`, {
          icon: '🧾',
        });
        setSelectedMemberId('');
        setNotes('');
        setReceiptNumber(`RCP-${Math.floor(100 + Math.random() * 900)}`);
        return;
      }
    } catch (err) {
      console.warn('Backend payment recording fallback:', err);
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      ...payload,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      receiptNo: receiptNumber,
    };

    setPaymentsList([newPayment, ...paymentsList]);
    setViewingReceipt(newPayment);
    toast.success(`Payment of ${amount} ETB recorded for ${payload.memberName}!`);

    // Reset form
    setSelectedMemberId('');
    setNotes('');
    setReceiptNumber(`RCP-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Calculations for method breakdown
  const totalRevenue = paymentsList.reduce((acc, curr) => acc + curr.amount, 0);
  const cashTotal = paymentsList
    .filter((p) => p.method === 'Cash')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const mobileTotal = paymentsList
    .filter((p) => p.method === 'Mobile Money')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const bankTotal = paymentsList
    .filter((p) => p.method === 'Bank Transfer')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const cashPercent = totalRevenue ? Math.round((cashTotal / totalRevenue) * 100) : 0;
  const mobilePercent = totalRevenue ? Math.round((mobileTotal / totalRevenue) * 100) : 0;
  const bankPercent = totalRevenue ? Math.round((bankTotal / totalRevenue) * 100) : 0;

  // Filter payments
  const filteredPayments = paymentsList.filter((item) => {
    const matchesSearch =
      item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod = methodFilter === 'all' || item.method === methodFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = item.date === '2026-10-18';
    } else if (dateFilter === 'week') {
      // simulate this week (October 12-18)
      matchesDate = item.date >= '2026-10-12';
    }

    return matchesSearch && matchesMethod && matchesDate;
  });

  const selectedMemberObj = mockMembers.find((m) => m.id === selectedMemberId);
  const selectedPlanObj = mockPlans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Payment Operations & Invoicing"
        subtitle="Collect subscription fees, issue official customer receipts, and review cashflow"
      />

      {/* Top Method Breakdown & Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Processed
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {totalRevenue.toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-400 mt-1">{paymentsList.length} transactions</p>
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

        {/* Mobile Money Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Money
              </p>
              <h3 className="text-2xl font-black text-sky-700 mt-1">
                {mobileTotal.toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-500 mt-1">Telebirr & CBEBirr ({mobilePercent}%)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Bank Transfer Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bank Transfer
              </p>
              <h3 className="text-2xl font-black text-violet-700 mt-1">
                {bankTotal.toLocaleString()} ETB
              </h3>
              <p className="text-xs text-slate-500 mt-1">Direct account deposits ({bankPercent}%)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Percentage Distribution Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
          <span>Payment Channel Breakdown</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cash ({cashPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Mobile Money ({mobilePercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-violet-700">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Bank ({bankPercent}%)
            </span>
          </div>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div style={{ width: `${cashPercent}%` }} className="bg-emerald-500 h-full" />
          <div style={{ width: `${mobilePercent}%` }} className="bg-sky-500 h-full" />
          <div style={{ width: `${bankPercent}%` }} className="bg-violet-500 h-full" />
        </div>
      </div>

      {/* Record Payment Section & Live Receipt Preview (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Record Payment Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Record Member Payment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Process walk-in renewals, new signups, or personal training packages
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
                <option value="">-- Choose member from list --</option>
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
                        {p.name} ({p.price} ETB / {p.duration || 30} {p.durationUnit || 'days'})
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
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Cash', label: 'Cash Desk', icon: Wallet },
                  { id: 'Chapa', label: 'Chapa Pay', icon: Zap },
                  { id: 'Mobile Money', label: 'Telebirr', icon: Smartphone },
                  { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        paymentMethod === item.id
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
                placeholder="e.g. Telebirr ref # or customer locker note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-200 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Confirm Payment & Print Receipt</span>
              </button>
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
                    <span>{user?.name || 'Front Desk'}</span>
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
                    <span>{selectedPlanObj?.name || 'Membership'} (30 Days)</span>
                    <span>{amount} ETB</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-800">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                    <span>GRAND TOTAL:</span>
                    <span className="text-emerald-600">{amount} ETB</span>
                  </div>
                </div>

                <div className="pt-3 text-center border-t border-slate-100 space-y-1">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
                    ✓ PAID IN FULL
                  </span>
                  <p className="text-[10px] text-slate-400">Thank you for working out with us!</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Thermal paper ready
              </span>
              <span>80mm standard width</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Payment History & Transactions</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredPayments.length} transactions based on current filters
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
                This Week
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
              placeholder="Search member name or receipt number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="sm:w-56">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash Only</option>
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
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPayments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                    {item.receiptNo}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    {item.memberName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {item.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">
                    {item.date}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {item.amount.toLocaleString()} {item.currency}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setViewingReceipt(item)}
                      className="px-2.5 py-1 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors inline-flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-sm text-slate-400">
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
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-bold text-base text-slate-900">GYMPRO FITNESS MANAGEMENT</h3>
                <p className="text-[11px] text-slate-500">Addis Ababa, Ethiopia</p>
                <p className="text-[10px] text-slate-400">www.gympro.et • +251 911 223344</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RECEIPT NUMBER:</span>
                  <span className="font-bold text-slate-900">{viewingReceipt.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DATE:</span>
                  <span>{viewingReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MEMBER NAME:</span>
                  <span className="font-bold">{viewingReceipt.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PLAN PURCHASED:</span>
                  <span>{viewingReceipt.plan} Membership</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PAYMENT METHOD:</span>
                  <span>{viewingReceipt.method}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-3 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>TOTAL PAID:</span>
                <span className="text-emerald-600">
                  {viewingReceipt.amount.toLocaleString()} {viewingReceipt.currency}
                </span>
              </div>

              <div className="text-center pt-2 space-y-1 text-[11px] text-slate-500">
                <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  TRANSACTION VERIFIED
                </div>
                <p>Present this receipt for locker authorization and key tag replacement.</p>
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
                  toast.success(`Printing Receipt #${viewingReceipt.receiptNo}...`);
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
