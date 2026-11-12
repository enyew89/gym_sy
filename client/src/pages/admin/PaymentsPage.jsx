import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
  Smartphone,
  Banknote,
  Search,
  Eye,
  Trash2,
  Check
} from 'lucide-react';
import { payments as initialPayments } from '../../data/mockData';
import { StatCard, StatusBadge, PageHeader, SearchBar, DataTable, Modal } from '../../components/ui';
import { paymentsApi } from '../../services/api';

export default function PaymentsPage() {
  const [paymentsList, setPaymentsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Load payments from backend
  const loadPayments = async () => {
    try {
      const res = await paymentsApi.getPayments();
      if (res.success && Array.isArray(res.payments)) {
        setPaymentsList(res.payments);
      }
    } catch (err) {
      // Fallback
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    memberName: '',
    memberEmail: '',
    amount: '',
    plan: 'Standard',
    method: 'Cash',
    status: 'completed',
    notes: '',
  });

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return paymentsList.filter((item) => {
      const name = item.memberName || '';
      const receipt = item.receiptNo || '';
      const plan = item.plan || '';

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || item.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [paymentsList, searchQuery, statusFilter, methodFilter]);

  // Derived live statistics
  const stats = useMemo(() => {
    const completedPayments = paymentsList.filter((p) => p.status === 'completed');
    const pendingPayments = paymentsList.filter((p) => p.status === 'pending');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const thisMonthPayments = completedPayments.filter((p) => {
      const d = new Date(p.date || p.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const monthlyRevenue = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalRevenue,
      monthlyRevenue,
      pendingCount: pendingPayments.length,
      pendingAmount,
    };
  }, [paymentsList]);

  // Handle record payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.memberName || !newPayment.amount) {
      toast.error('Please fill in Member Name and Amount');
      return;
    }

    try {
      const res = await paymentsApi.createPayment({
        memberName: newPayment.memberName,
        memberEmail: newPayment.memberEmail,
        amount: Number(newPayment.amount),
        currency: 'ETB',
        plan: newPayment.plan,
        method: newPayment.method,
        status: newPayment.status,
        notes: newPayment.notes,
      });

      toast.success(res.message || 'Payment recorded successfully!');
      setIsRecordModalOpen(false);
      setNewPayment({
        memberName: '',
        memberEmail: '',
        amount: '',
        plan: 'Standard',
        method: 'Cash',
        status: 'completed',
        notes: '',
      });
      loadPayments();
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  // Mark pending payment as completed
  const handleMarkPaid = async (payment) => {
    try {
      const id = payment._id || payment.id;
      await paymentsApi.updatePayment(id, { status: 'completed' });
      toast.success(`Payment for ${payment.memberName} marked as completed!`);
      loadPayments();
    } catch (err) {
      toast.error(err.message || 'Failed to update payment status');
    }
  };

  // Delete payment record
  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Are you sure you want to delete payment record for ${payment.memberName}?`)) {
      return;
    }
    try {
      const id = payment._id || payment.id;
      await paymentsApi.deletePayment(id);
      toast.success('Payment record deleted successfully');
      loadPayments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete payment');
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'Chapa':
        return <Zap className="w-3.5 h-3.5 text-orange-500" />;
      case 'Bank Transfer':
        return <Building className="w-3.5 h-3.5 text-blue-500" />;
      case 'Mobile Money':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Banknote className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const columns = [
    {
      key: 'receiptNo',
      label: 'Receipt #',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-zinc-800">
          {row.receiptNo || `REC-${(row._id || row.id || '').slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: 'memberName',
      label: 'Member',
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-900">{row.memberName}</p>
          <p className="text-xs text-zinc-400">{row.memberEmail || row.memberId || 'Walk-in'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount (ETB)',
      render: (row) => (
        <span className="font-bold text-zinc-900 text-sm">
          {Number(row.amount).toLocaleString()} {row.currency || 'ETB'}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Subscription',
      render: (row) => (
        <span className="text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
          {row.plan || 'Standard'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="text-xs text-zinc-600">
          {row.date || (row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'Today')}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-700">
          {getMethodIcon(row.method)}
          <span>{row.method || 'Cash'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReceipt(row);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-black hover:bg-zinc-100 px-2 py-1 rounded-lg transition-colors"
            title="View Receipt"
          >
            <Receipt className="w-3.5 h-3.5" /> Receipt
          </button>
          {row.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPaid(row);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
              title="Mark as Paid"
            >
              <Check className="w-3.5 h-3.5" /> Mark Paid
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePayment(row);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Payment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Revenue & Payment Transactions"
        subtitle="Monitor lifetime revenue, unpaid balances, POS transactions, and issue digital receipts"
        action={
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        }
      />

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Lifetime Revenue"
          value={`${stats.totalRevenue.toLocaleString()} ETB`}
          subtitle="All completed transactions"
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Monthly Revenue"
          value={`${stats.monthlyRevenue.toLocaleString()} ETB`}
          subtitle="Collected this calendar month"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Unpaid / Pending Fees"
          value={`${stats.pendingAmount.toLocaleString()} ETB`}
          subtitle={`${stats.pendingCount} unpaid transactions`}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Search and Filters */}
      <SearchBar
        placeholder="Search payments by member, receipt number, plan..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      >
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending (Unpaid)</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">All Payment Methods</option>
            <option value="Chapa">Chapa Gateway</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Money">Mobile Money (Telebirr)</option>
          </select>
        </div>
      </SearchBar>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        onRowClick={(row) => setSelectedReceipt(row)}
      />

      {/* Digital Receipt Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Digital Payment Receipt"
        size="md"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50 space-y-4">
              <div className="flex items-start justify-between pb-4 border-b border-zinc-200">
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">GYMPRO FITNESS</h3>
                  <p className="text-xs text-zinc-500">Official Payment Voucher</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-semibold text-zinc-700">
                    {selectedReceipt.receiptNo || `REC-${(selectedReceipt._id || selectedReceipt.id || '').slice(-6).toUpperCase()}`}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedReceipt.date || (selectedReceipt.createdAt ? new Date(selectedReceipt.createdAt).toISOString().split('T')[0] : 'Today')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400">Billed To:</span>
                  <p className="font-semibold text-zinc-900 text-sm mt-0.5">{selectedReceipt.memberName}</p>
                  <p className="text-zinc-500">{selectedReceipt.memberEmail || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">Payment Channel:</span>
                  <p className="font-semibold text-zinc-900 text-sm mt-0.5">{selectedReceipt.method || 'Cash'}</p>
                  <StatusBadge status={selectedReceipt.status} />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-zinc-600">{selectedReceipt.plan} Subscription</span>
                  <span className="font-bold text-zinc-900">
                    {Number(selectedReceipt.amount).toLocaleString()} {selectedReceipt.currency || 'ETB'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-3 border-t border-zinc-200">
                  <span>Total Amount</span>
                  <span>{Number(selectedReceipt.amount).toLocaleString()} {selectedReceipt.currency || 'ETB'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                <Printer className="w-4 h-4 text-zinc-500" /> Print
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Member Payment"
        size="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Member Name <span className="text-zinc-900">*</span>
            </label>
            <input
              type="text"
              required
              value={newPayment.memberName}
              onChange={(e) => setNewPayment({ ...newPayment, memberName: e.target.value })}
              placeholder="e.g. Sara Mulatu"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Member Email</label>
            <input
              type="email"
              value={newPayment.memberEmail}
              onChange={(e) => setNewPayment({ ...newPayment, memberEmail: e.target.value })}
              placeholder="sara@email.com"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Amount (ETB) <span className="text-zinc-900">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="1000"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Membership Plan</label>
              <select
                value={newPayment.plan}
                onChange={(e) => setNewPayment({ ...newPayment, plan: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white text-zinc-900"
              >
                <option value="Basic">Basic (500 ETB)</option>
                <option value="Standard">Standard (1,000 ETB)</option>
                <option value="Premium">Premium (2,000 ETB)</option>
                <option value="Annual Pass">Annual Pass (18,000 ETB)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Payment Method</label>
              <select
                value={newPayment.method}
                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white text-zinc-900"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (CBE / Awash)</option>
                <option value="Mobile Money">Mobile Money (Telebirr)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Payment Status</label>
              <select
                value={newPayment.status}
                onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white text-zinc-900"
              >
                <option value="completed">Completed (Paid)</option>
                <option value="pending">Pending (Unpaid)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Notes / Reference</label>
            <input
              type="text"
              value={newPayment.notes}
              onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
              placeholder="e.g. Telebirr Txn #123456"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
