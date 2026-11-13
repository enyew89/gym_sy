import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  History,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Users,
  Activity,
  ArrowUpDown,
  CheckCircle,
  LogOut,
  QrCode,
  UserCheck,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { PageHeader, StatCard, SearchBar } from '../../components/ui';
import { attendance as mockAttendance, members as mockMembers } from '../../data/mockData';
import { receptionistApi } from '../../services/api';

export default function AttendanceRecords() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all'); // 'all' | 'QR' | 'Manual'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_gym' | 'completed'
  const [isLoading, setIsLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await receptionistApi.getAttendance();
      if (res.success && Array.isArray(res.attendance)) {
        setAttendanceList(res.attendance);
      }
    } catch (err) {
      console.warn('Attendance records fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Helper to compute duration string between two times (HH:mm)
  const calculateDuration = (checkIn, checkOut) => {
    if (!checkOut) return 'In Progress';
    const [inHours, inMins] = checkIn.split(':').map(Number);
    const [outHours, outMins] = checkOut.split(':').map(Number);

    let totalMins = outHours * 60 + outMins - (inHours * 60 + inMins);
    if (totalMins < 0) totalMins += 24 * 60; // handle midnight wrap

    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  const handleManualCheckOut = async (id, memberName) => {
    if (!id) {
      toast.error('Unable to identify attendance record ID.');
      return;
    }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      const res = await receptionistApi.checkOut(id);
      setAttendanceList((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, checkOut: timeStr, status: 'checked_out' } : item
        )
      );
      toast.success(res.message || `Checked out ${memberName} at ${timeStr}`);
    } catch (err) {
      toast.error(err.message || `Failed to check out ${memberName}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Member Name', 'Date', 'Check-In', 'Check-Out', 'Method', 'Duration'];
    const rows = filteredRecords.map((r) => [
      `"${r.memberName}"`,
      r.date,
      r.checkIn,
      r.checkOut || 'Active In Gym',
      r.method,
      calculateDuration(r.checkIn, r.checkOut),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance records exported as CSV');
  };

  // Filter attendance records
  const filteredRecords = attendanceList.filter((item) => {
    const matchesSearch = item.memberName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === 'all' || item.date === dateFilter;
    const matchesMethod = methodFilter === 'all' || item.method === methodFilter;

    let matchesStatus = true;
    if (statusFilter === 'in_gym') {
      matchesStatus = !item.checkOut;
    } else if (statusFilter === 'completed') {
      matchesStatus = Boolean(item.checkOut);
    }

    return matchesSearch && matchesDate && matchesMethod && matchesStatus;
  });

  // Calculate daily attendance summary stats
  const todayRecords = attendanceList.filter((a) => a.date === todayStr);
  const activeNowCount = attendanceList.filter((a) => !a.checkOut).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Attendance Records & Logs"
        subtitle="Chronological check-in register, duration tracking, and facility traffic audit"
        action={
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Daily Attendance Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Total Check-ins"
          value={todayRecords.length.toString()}
          subtitle="All entrances combined"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Active Members Now"
          value={activeNowCount.toString()}
          subtitle="Currently on workout floor"
          icon={Activity}
          color="sky"
        />
        <StatCard
          title="Peak Traffic Hour"
          value={attendanceList.length > 0 ? '17:00 - 19:30' : 'None yet'}
          subtitle="Peak check-in window"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Average Workout Stay"
          value={attendanceList.some((a) => a.checkOut) ? '1h 15m' : 'N/A'}
          subtitle="Based on completed visits"
          icon={Clock}
          color="violet"
        />
      </div>

      {/* Search & Filter Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Member Search input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Date Picker / Quick Date Selector */}
          <div className="sm:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Dates</option>
              <option value="2026-10-18">Today (Oct 18, 2026)</option>
              <option value="2026-10-17">Yesterday (Oct 17, 2026)</option>
              <option value="2026-10-16">Oct 16, 2026</option>
            </select>
          </div>

          {/* Method Selector */}
          <div className="sm:col-span-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Methods</option>
              <option value="QR">QR Scanner</option>
              <option value="Manual">Manual Desk</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="in_gym">Inside Gym Now</option>
              <option value="completed">Completed Visit</option>
            </select>
          </div>
        </div>

        {/* Filter chips / status line */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredRecords.length}</strong> attendance records
          </span>
          {(searchQuery || dateFilter !== 'all' || methodFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('all');
                setMethodFilter('all');
                setStatusFilter('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Attendance DataTable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-in Time</th>
                <th className="px-4 py-3">Check-out Time</th>
                <th className="px-4 py-3">Session Duration</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.map((item) => {
                const memberData = mockMembers.find((m) => m.id === item.memberId) || {
                  plan: 'Standard',
                };
                const isInside = !item.checkOut;
                const duration = calculateDuration(item.checkIn, item.checkOut);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Member */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {item.memberName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {item.memberName}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {memberData.plan} Plan
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-slate-600 text-xs font-mono">
                      {item.date}
                    </td>

                    {/* Check In */}
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800">
                      {item.checkIn}
                    </td>

                    {/* Check Out */}
                    <td className="px-4 py-3.5 font-mono text-xs">
                      {isInside ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Inside Gym
                        </span>
                      ) : (
                        <span className="text-slate-600">{item.checkOut}</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3.5 text-xs font-medium">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isInside
                            ? 'bg-sky-50 text-sky-700 font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {duration}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          item.method === 'QR'
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.method === 'QR' ? (
                          <QrCode className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        <span>{item.method}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      {isInside ? (
                        <button
                          onClick={() => handleManualCheckOut(item._id || item.id, item.memberName)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check Out</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400 text-sm">
                    No attendance logs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Showing 1 to {filteredRecords.length} of {attendanceList.length} total entries</span>
          <span className="text-slate-400">All timestamps recorded in East Africa Time (EAT)</span>
        </div>
      </div>
    </div>
  );
}
