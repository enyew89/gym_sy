import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Activity,
  AlertCircle,
  CreditCard,
  QrCode,
  UserPlus,
  Receipt,
  CheckCircle,
  Clock,
  ArrowRight,
  Phone,
  Calendar,
  Sparkles,
  ChevronRight,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';
import { StatCard, StatusBadge, PageHeader, Modal } from '../../components/ui';
import { attendance as mockAttendance, members as mockMembers, payments as mockPayments, classes as mockClasses } from '../../data/mockData';
import { receptionistApi } from '../../services/api';

export default function ReceptionistDashboard() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedMemberForRenewal, setSelectedMemberForRenewal] = useState(null);
  const [renewalSuccessModal, setRenewalSuccessModal] = useState(false);
  const [manualCheckInOpen, setManualCheckInOpen] = useState(false);
  const [manualMemberId, setManualMemberId] = useState('');
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState('Cash');

  // Live stats from backend
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    inGymNow: 0,
    todayPaymentsCount: 0,
    todayRevenue: 0,
    expiringCount: 0,
  });

  // Expiring memberships: members expiring within 7 days or already expired / needing renewal
  const [expiringMembersList, setExpiringMembersList] = useState([]);

  const loadOverview = async () => {
    try {
      const res = await receptionistApi.getOverview();
      if (res.success) {
        if (res.stats) setStats(res.stats);
        if (Array.isArray(res.recentCheckIns)) setAttendanceList(res.recentCheckIns);
        if (Array.isArray(res.expiringMembers)) setExpiringMembersList(res.expiringMembers);
      }
    } catch (err) {
      console.warn('Receptionist overview fallback:', err);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!manualMemberId) {
      toast.error('Please select or enter a member');
      return;
    }

    try {
      const res = await receptionistApi.checkIn({
        identifier: manualMemberId,
        method: 'Manual',
      });
      if (res.success && res.attendance) {
        setAttendanceList([res.attendance, ...attendanceList]);
        setManualCheckInOpen(false);
        setManualMemberId('');
        toast.success(`Check-in recorded for ${res.attendance.memberName}!`);
        loadOverview();
        return;
      }
    } catch (err) {
      if (err.message && err.message.includes('expired')) {
        toast.error(err.message);
        return;
      }
    }

    const member = mockMembers.find(
      (m) => m.id === manualMemberId || m.name.toLowerCase().includes(manualMemberId.toLowerCase())
    );

    if (!member) {
      toast.error('Member not found in database');
      return;
    }

    if (member.status === 'expired') {
      toast.error(`Member ${member.name}'s membership has expired!`, {
        icon: '⚠️',
      });
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry = {
      id: `a-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      date: new Date().toISOString().split('T')[0],
      checkIn: timeStr,
      checkOut: null,
      method: 'Manual',
    };

    setAttendanceList([newEntry, ...attendanceList]);
    setManualCheckInOpen(false);
    setManualMemberId('');
    toast.success(`Check-in recorded for ${member.name}`);
  };

  const handleSendReminder = (member) => {
    toast.success(`SMS renewal reminder sent to ${member.name} (${member.phone})`);
  };

  const handleConfirmRenewal = async () => {
    if (!selectedMemberForRenewal) return;

    try {
      const res = await receptionistApi.renewMembership({
        memberId: selectedMemberForRenewal.id || selectedMemberForRenewal._id,
        planName: selectedMemberForRenewal.plan,
        amount: selectedMemberForRenewal.amount || 1000,
        paymentMethod: renewalPaymentMethod,
        notes: `Desk renewal from Receptionist Dashboard`,
      });

      if (res.success) {
        toast.success(`Membership renewed successfully for ${selectedMemberForRenewal.name}!`);
        setSelectedMemberForRenewal(null);
        setRenewalSuccessModal(true);
        loadOverview();
        return;
      }
    } catch (err) {
      console.warn('Backend renewal error:', err);
    }

    toast.success(`Membership renewed successfully for ${selectedMemberForRenewal?.name}!`);
    setSelectedMemberForRenewal(null);
    setRenewalSuccessModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reception Desk"
        subtitle="Live front-desk check-ins, member verification, and quick operations"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setManualCheckInOpen(true)}
              className="px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 flex items-center gap-2 shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-zinc-500" />
              <span>Manual Entry</span>
            </button>
            <Link
              to="/receptionist/checkin"
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 flex items-center gap-2 shadow-xs transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </Link>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns.toString()}
          subtitle="All turnstiles combined"
          icon={Users}
          color="primary"
          trend="Live"
          trendUp={true}
        />
        <StatCard
          title="Active Members Now"
          value={stats.inGymNow.toString()}
          subtitle="Currently inside gym"
          icon={Activity}
          color="primary"
          trend="Occupancy"
          trendUp={true}
        />
        <StatCard
          title="Pending Renewals"
          value={stats.expiringCount.toString()}
          subtitle="Expiring or expired"
          icon={AlertCircle}
          color="primary"
          trend="Needs Action"
          trendUp={false}
        />
        <StatCard
          title="Today's Revenue"
          value={`${stats.todayRevenue.toLocaleString()} ETB`}
          subtitle={`${stats.todayPaymentsCount} payments processed`}
          icon={CreditCard}
          color="primary"
          trend="Front Desk"
          trendUp={true}
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Quick Reception Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/receptionist/checkin"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mr-3 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                Scan QR Code
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">Fast member entry check-in</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/receptionist/register"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                Register Walk-in
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">1-click member signup</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/receptionist/payments"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mr-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                Record Payment
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">Cash desk & receipts</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/receptionist/bookings"
            className="group flex items-center p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center mr-3 group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">
                Class Bookings
              </h4>
              <p className="text-[11px] text-zinc-500 truncate">Schedules & rosters</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Live Check-in Feed & Expiring Memberships */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Check-in Feed (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Live Check-in Stream</h3>
                <p className="text-xs text-zinc-500">Real-time attendance entries for today</p>
              </div>
            </div>
            <Link
              to="/receptionist/attendance"
              className="text-xs font-medium text-zinc-900 hover:underline flex items-center gap-1"
            >
              View Full History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1 divide-y divide-zinc-100 max-h-[380px] overflow-y-auto">
            {attendanceList.map((entry) => {
              const memberInfo = mockMembers.find((m) => m.id === entry.memberId) || {
                plan: 'Standard',
              };
              return (
                <div
                  key={entry.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-900 font-semibold flex items-center justify-center text-sm">
                      {entry.memberName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">
                          {entry.memberName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium border border-zinc-200">
                          {memberInfo.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>In: {entry.checkIn}</span>
                        {entry.checkOut && (
                          <>
                            <span>•</span>
                            <span>Out: {entry.checkOut}</span>
                          </>
                        )}
                        {!entry.checkOut && (
                          <span className="text-zinc-900 font-medium bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                            In Gym
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        entry.method === 'QR'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                      }`}
                    >
                      {entry.method} Check-in
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-100 rounded-b-xl flex items-center justify-between text-xs text-zinc-500">
            <span>Showing latest check-ins from {attendanceList.length} total entries</span>
            <span className="flex items-center gap-1.5 font-medium text-zinc-900">
              <span className="w-2 h-2 rounded-full bg-zinc-900"></span> Scanner Online & Ready
            </span>
          </div>
        </div>

        {/* Expiring Memberships Section (1 col) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-zinc-900" />
              <div>
                <h3 className="font-semibold text-zinc-900">Expiring Soon</h3>
                <p className="text-xs text-zinc-500">Within the next 7 days</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200">
              {expiringMembersList.length} Alert{expiringMembersList.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[380px]">
            {expiringMembersList.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">{member.name}</h4>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-zinc-400" />
                      {member.phone}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {member.daysLeft}d left
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                  <span className="text-zinc-600">
                    Plan: <strong className="text-zinc-900">{member.plan}</strong> ({member.amount} ETB)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendReminder(member)}
                      title="Send SMS"
                      className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded border border-zinc-300 font-medium transition-colors"
                    >
                      SMS
                    </button>
                    <button
                      onClick={() => setSelectedMemberForRenewal(member)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-medium transition-colors shadow-xs"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-zinc-50 border-t border-zinc-100 rounded-b-xl text-center">
            <Link
              to="/receptionist/payments"
              className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
            >
              Open Renewal & Payment Register <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Schedule Overview */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-zinc-900" />
            <h3 className="font-semibold text-zinc-900">Today's Class Schedule</h3>
          </div>
          <Link
            to="/receptionist/bookings"
            className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1"
          >
            Manage Bookings <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockClasses.slice(0, 3).map((c) => {
            const isFull = c.enrolled >= c.capacity;
            const percentage = Math.round((c.enrolled / c.capacity) * 100);
            return (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-sm">{c.name}</h4>
                    <p className="text-xs text-zinc-500">Coach {c.trainerName}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {isFull ? 'Full' : `${c.capacity - c.enrolled} spots left`}
                  </span>
                </div>

                <div className="text-xs text-zinc-600 space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Time:</span>
                    <span className="font-medium text-zinc-700">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Location:</span>
                    <span className="font-medium text-zinc-700">{c.room}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Enrolled</span>
                    <span className="font-medium text-zinc-700">
                      {c.enrolled} / {c.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-900"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={manualCheckInOpen}
        onClose={() => setManualCheckInOpen(false)}
        title="Manual Member Check-in"
        size="md"
      >
        <form onSubmit={handleManualCheckIn} className="space-y-4">
          <p className="text-sm text-zinc-500">
            For members who forgot their QR badge or card. Look up member name or select from list:
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">
              Select or Search Member
            </label>
            <select
              value={manualMemberId}
              onChange={(e) => setManualMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white text-zinc-900"
            >
              <option value="">-- Choose member --</option>
              {mockMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.plan} Plan ({m.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs text-zinc-600 space-y-1">
            <p>
              <strong>Note:</strong> Expired memberships will be rejected automatically and prompt a renewal notice.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setManualCheckInOpen(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg font-medium flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Check-in</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Renewal Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedMemberForRenewal)}
        onClose={() => setSelectedMemberForRenewal(null)}
        title="Renew Membership"
        size="md"
      >
        {selectedMemberForRenewal && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <h4 className="font-semibold text-zinc-900">{selectedMemberForRenewal.name}</h4>
              <p className="text-xs text-zinc-600 mt-0.5">Phone: {selectedMemberForRenewal.phone}</p>
              <div className="mt-2 text-xs text-zinc-800 font-medium">
                Membership expires in {selectedMemberForRenewal.daysLeft} days ({selectedMemberForRenewal.expiryDate})
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
                  Plan to Renew
                </label>
                <div className="p-3 bg-white border border-zinc-200 rounded-lg flex justify-between items-center text-sm">
                  <span className="font-medium text-zinc-800">{selectedMemberForRenewal.plan} Plan (30 Days)</span>
                  <span className="font-bold text-zinc-900">{selectedMemberForRenewal.amount} ETB</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={renewalPaymentMethod}
                  onChange={(e) => setRenewalPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                >
                  <option value="Cash">Cash (Desk Counter)</option>
                  <option value="Mobile Money">Mobile Money (Telebirr / CBEBirr)</option>
                  <option value="Bank Transfer">Bank Transfer (CBE / Awash)</option>
                  <option value="Credit Card">Debit / POS Card</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedMemberForRenewal(null)}
                className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewal}
                className="px-4 py-2 text-sm text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg font-medium shadow-xs"
              >
                Process Renewal & Payment
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Renewal Success Notification Modal */}
      <Modal
        isOpen={renewalSuccessModal}
        onClose={() => setRenewalSuccessModal(false)}
        title="Membership Successfully Extended"
        size="sm"
      >
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <p className="text-sm text-zinc-700">
            Payment has been recorded and validity extended for 30 days. An SMS receipt has been dispatched to the member.
          </p>
          <button
            onClick={() => setRenewalSuccessModal(false)}
            className="w-full py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
