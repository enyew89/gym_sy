import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  DollarSign,
  CalendarCheck,
  CalendarDays,
  UserPlus,
  CreditCard,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Shield,
  Briefcase,
  Key,
  PlusCircle,
  Sparkles,
  PieChart as PieIcon,
  Clock,
  Layers,
  Flame,
  Check
} from 'lucide-react';
import {
  dashboardStats,
  payments as defaultPayments,
  plans as defaultPlans
} from '../../data/mockData';
import { StatCard, StatusBadge, Modal } from '../../components/ui';
import { adminApi, plansApi } from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Live database stats
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    totalTrainers: 0,
    totalReceptionists: 0,
    totalStaff: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    unpaidAmount: 0,
    unpaidCount: 0,
    todayAttendance: 0,
    avgDailyAttendance: 0,
    equipmentHealthPercentage: 100,
    workingUnits: 0,
    totalEquipmentUnits: 0,
    totalClasses: 0,
  });

  const [membershipDistribution, setMembershipDistribution] = useState([]);

  const [recentPayments, setRecentPayments] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);

  // Create Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'trainer', // Strictly trainer or receptionist
    specialization: 'Strength & Conditioning',
    certifications: 'NASM-CPT, CSCS',
    password: 'password123',
  });

  // Fetch live stats on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminApi.getOverview();
        if (res.success && res.stats) {
          setStats((prev) => ({
            ...prev,
            ...res.stats,
          }));
          if (Array.isArray(res.membershipDistribution)) {
            setMembershipDistribution(res.membershipDistribution);
          }
          if (Array.isArray(res.recentPayments)) {
            setRecentPayments(res.recentPayments);
          }
          if (Array.isArray(res.recentMembers)) {
            setRecentMembers(res.recentMembers);
          }
        }
      } catch (err) {
        // Keep initial state
      }
    }
    fetchStats();
  }, []);

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password) {
      toast.error('Please fill in Name, Email, and Temporary Password');
      return;
    }

    setIsSubmittingStaff(true);
    try {
      const res = await adminApi.createStaff({
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        specialization: staffForm.role === 'trainer' ? staffForm.specialization : undefined,
        certifications: staffForm.role === 'trainer' ? staffForm.certifications : undefined,
        password: staffForm.password,
      });

      toast.success(res.message || `${staffForm.role} account created successfully!`);
      setIsStaffModalOpen(false);

      // Refresh overview
      const overviewRes = await adminApi.getOverview().catch(() => null);
      if (overviewRes?.stats) {
        setStats((prev) => ({ ...prev, ...overviewRes.stats }));
      }

      // Reset form
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        role: 'trainer',
        specialization: 'Strength & Conditioning',
        certifications: 'NASM-CPT, CSCS',
        password: 'password123',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create staff account');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gym Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live dashboard for members, revenue streams, attendance check-ins, and facility metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            Add Staff
          </button>
          <Link
            to="/admin/members"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            Members Directory
          </Link>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            Reports
          </Link>
        </div>
      </div>

      {/* 4 Clean Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.activeMembers} active (${stats.expiredMembers || 0} expired)`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Staff Team"
          value={stats.totalStaff}
          subtitle={`${stats.totalTrainers} trainers, ${stats.totalReceptionists} front desk`}
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Monthly Revenue"
          value={`${Number(stats.monthlyRevenue).toLocaleString()} ETB`}
          subtitle={`Total: ${Number(stats.totalRevenue).toLocaleString()} ETB`}
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="Daily Check-ins"
          value={stats.avgDailyAttendance}
          subtitle={`Today: ${stats.todayAttendance} visits`}
          icon={CalendarCheck}
          color="sky"
        />
      </div>

      {/* Admin Quick Action Hub */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/admin/members"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center mr-3 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                Member Directory
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">Manage & verify accounts</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/admin/payments"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mr-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                Revenue & Payments
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">Chapa logs & desk income</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center mr-3 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                Add Staff Member
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">Create trainer or front desk</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            to="/admin/equipment"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center mr-3 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                Equipment & Health
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">{stats.workingUnits}/{stats.totalEquipmentUnits} units operational</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Operational Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Membership Breakdown Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Members by Subscription Plan</h2>
                <p className="text-xs text-zinc-500">Distribution across active subscription tiers</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                {stats.totalMembers} Members Total
              </span>
            </div>

            <div className="space-y-2.5 mt-3">
              {membershipDistribution.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                      {tier.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{tier.name} Plan</p>
                      <p className="text-xs text-zinc-500">{tier.count} enrolled members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-900">{tier.value}%</span>
                    <p className="text-[11px] text-zinc-500">share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
            <span>Active Subscription Rate: <strong>{stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}%</strong></span>
            <Link to="/admin/plans" className="text-zinc-900 font-semibold hover:underline">
              Manage Plans &rarr;
            </Link>
          </div>
        </div>

        {/* Quick Operations & Facility Status Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1 pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Facility Operations & Shortcuts</h2>
                <p className="text-xs text-zinc-500">Administrative tools and facility readiness</p>
              </div>
              <span className="text-xs font-medium text-zinc-500">Fast Access</span>
            </div>

            <div className="space-y-2.5 mt-3">
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Provision Staff Account</p>
                    <p className="text-xs text-zinc-500">Create trainer or receptionist credentials</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/admin/staff')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Staff Management</p>
                    <p className="text-xs text-zinc-500">Manage trainers & receptionists</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/admin/trainers')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Assign Members to Trainers</p>
                    <p className="text-xs text-zinc-500">Manage athlete coaching loads</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Facility Status Grid */}
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
            <p className="text-xs font-semibold text-zinc-700">Gym Equipment & Schedule Health</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="text-zinc-500 text-[11px]">Class Timetable</span>
                <p className="font-semibold text-zinc-900 mt-0.5">{stats.totalClasses} Active Classes</p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="text-zinc-500 text-[11px]">Equipment Operational</span>
                <p className="font-semibold text-emerald-600 mt-0.5">
                  {stats.workingUnits} of {stats.totalEquipmentUnits} units ({stats.equipmentHealthPercentage}%)
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ADMIN-ONLY CREATE STAFF MODAL */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title="Admin Staff Provisioning"
      >
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Staff Security Policy:</span> Trainers and Receptionists do not register publicly.
            As Gym Administrator, you provision their official credentials directly.
          </p>
        </div>

        <form onSubmit={handleCreateStaffSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Staff Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStaffForm((prev) => ({ ...prev, role: 'trainer' }))}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  staffForm.role === 'trainer'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-sm">Trainer</p>
                  <p className="text-[10px] text-slate-400">Workouts & Athletes</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStaffForm((prev) => ({ ...prev, role: 'receptionist' }))}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  staffForm.role === 'receptionist'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
                <div>
                  <p className="text-sm">Receptionist</p>
                  <p className="text-[10px] text-slate-400">Front Desk & POS</p>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={staffForm.name}
              onChange={handleStaffFormChange}
              placeholder="e.g. Dawit Alemu"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Grid: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email *
              </label>
              <input
                type="email"
                name="email"
                value={staffForm.email}
                onChange={handleStaffFormChange}
                placeholder="staff@gympro.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={staffForm.phone}
                onChange={handleStaffFormChange}
                placeholder="+251 9XX XXX XXX"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Trainer specific: Specialization & Certifications */}
          {staffForm.role === 'trainer' && (
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Trainer Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={staffForm.specialization}
                  onChange={handleStaffFormChange}
                  placeholder="e.g. Strength & Conditioning, HIIT"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  name="certifications"
                  value={staffForm.certifications}
                  onChange={handleStaffFormChange}
                  placeholder="NASM-CPT, CSCS, CrossFit L1"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Temporary Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Temporary Password *
            </label>
            <input
              type="text"
              name="password"
              value={staffForm.password}
              onChange={handleStaffFormChange}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The staff member will use this password to sign in on the shared login page.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingStaff}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmittingStaff ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Create {staffForm.role === 'trainer' ? 'Trainer' : 'Receptionist'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
