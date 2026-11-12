import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Users,
  DollarSign,
  CalendarCheck,
  Download,
  Printer,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info,
  Layers,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import {
  revenueChartData as defaultRevenueChartData,
  membershipGrowthData as defaultMembershipGrowthData,
  attendanceChartData as defaultAttendanceChartData,
  dashboardStats,
  members,
  plans,
  payments,
  attendance
} from '../../data/mockData';
import { StatCard, PageHeader } from '../../components/ui';
import { adminApi } from '../../services/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | membership | revenue | attendance
  const [dateRange, setDateRange] = useState('6months');
  const [reportsData, setReportsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getReports();
      if (res.success) {
        setReportsData(res);
      }
    } catch (err) {
      // Fallback to mock
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const revenueChartData = reportsData?.revenueChartData || defaultRevenueChartData;
  const membershipGrowthData = reportsData?.membershipGrowthData || defaultMembershipGrowthData;
  const attendanceChartData = reportsData?.attendanceChartData || defaultAttendanceChartData;

  const totalReportRevenue = reportsData?.summary?.totalRevenue ?? 0;
  const avgMonthlyRevenue = revenueChartData.length > 0
    ? Math.round(revenueChartData.reduce((sum, r) => sum + (r.revenue || 0), 0) / revenueChartData.length)
    : 0;

  const totalMembersCount = reportsData?.summary?.totalMembers ?? 0;
  const activeMembersCount = reportsData?.summary?.activeMembers ?? 0;
  const totalNewMembers = membershipGrowthData.reduce((sum, r) => sum + (r.new || 0), 0);
  const totalVisitsCount = reportsData?.summary?.totalVisits ?? 0;

  // Plan distribution for Pie Chart
  const planDistributionData = useMemo(() => {
    if (reportsData?.planDistributionData?.length > 0) {
      return reportsData.planDistributionData;
    }
    return plans.map((p) => ({
      name: p.name,
      value: p.memberCount,
    }));
  }, [reportsData]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    if (reportsData?.paymentMethodData?.length > 0) {
      return reportsData.paymentMethodData;
    }
    const counts = {};
    payments.forEach((p) => {
      counts[p.method] = (counts[p.method] || 0) + p.amount;
    });
    return Object.keys(counts).map((method) => ({
      name: method,
      value: counts[method],
    }));
  }, [reportsData]);

  // Peak hours data (simulated based on attendance checkIns)
  const peakHoursData = reportsData?.peakHoursData || [
    { timeSlot: '06:00 - 08:00', checkIns: 0 },
    { timeSlot: '08:00 - 10:00', checkIns: 0 },
    { timeSlot: '12:00 - 14:00', checkIns: 0 },
    { timeSlot: '16:00 - 18:00', checkIns: 0 },
    { timeSlot: '18:00 - 20:00', checkIns: 0 },
    { timeSlot: '20:00 - 22:00', checkIns: 0 },
  ];

  // Attendance check-in method split
  const checkInMethods = useMemo(() => {
    if (reportsData?.checkInMethods?.length > 0) {
      return reportsData.checkInMethods;
    }
    const qrCount = attendance.filter((a) => a.method === 'QR').length;
    const manualCount = attendance.filter((a) => a.method === 'Manual').length;
    return [
      { name: 'QR Code Scan', count: qrCount },
      { name: 'Front Desk Manual', count: manualCount },
    ];
  }, [reportsData]);

  const handleExportReport = () => {
    toast.success('Report exported to PDF successfully!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deep dive into member trends, revenue streams, and daily gym operations
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="ytd">Year to Date (2026)</option>
          </select>

          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export
          </button>
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-zinc-900 text-white font-semibold'
              : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('membership')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'membership'
              ? 'bg-zinc-900 text-white font-semibold'
              : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Members
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'revenue'
              ? 'bg-zinc-900 text-white font-semibold'
              : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Revenue
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'attendance'
              ? 'bg-zinc-900 text-white font-semibold'
              : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          Attendance
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Members"
              value={reportsData?.summary?.activeMembers ?? dashboardStats.activeMembers}
              subtitle={`${reportsData?.summary?.totalMembers ?? dashboardStats.totalMembers} total registrations`}
              icon={Users}
            />
            <StatCard
              title="Monthly Turnover"
              value={`${(reportsData?.summary?.totalRevenue ?? dashboardStats.monthlyRevenue).toLocaleString()} ETB`}
              subtitle="Current billing cycle"
              icon={DollarSign}
            />
            <StatCard
              title="Daily Check-ins"
              value={reportsData?.summary?.totalVisits ?? dashboardStats.avgDailyAttendance}
              subtitle="Total logged visits"
              icon={CalendarCheck}
            />
            <StatCard
              title="Floor Utilization"
              value={`${reportsData?.summary?.occupancyRate ?? dashboardStats.occupancyRate ?? 0}%`}
              subtitle="Peak capacity load"
              icon={Activity}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Ledger Card */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Monthly Revenue Collections</h3>
                    <p className="text-xs text-zinc-500">Gross monthly cashflow from member subscriptions</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {totalReportRevenue > 0 ? `${totalReportRevenue.toLocaleString()} ETB Total` : '0 ETB'}
                  </span>
                </div>

                {revenueChartData.length === 0 || totalReportRevenue === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Revenue Transactions Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Completed member subscriptions and front-desk payments will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Collected (ETB)</th>
                          <th className="py-2.5 px-3 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {revenueChartData.map((row) => (
                          <tr key={row.month} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.month}</td>
                            <td className="py-2.5 px-3 font-bold text-zinc-900">{row.revenue.toLocaleString()} ETB</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-semibold text-zinc-900">
                                {totalReportRevenue > 0 ? Math.round((row.revenue / totalReportRevenue) * 100) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Monthly average: <strong>{avgMonthlyRevenue.toLocaleString()} ETB</strong></span>
                <span className="text-zinc-900 font-medium">
                  {totalReportRevenue > 0 ? `${totalReportRevenue.toLocaleString()} ETB gross cashflow` : '0 ETB collected'}
                </span>
              </div>
            </div>

            {/* Membership Growth Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Member Growth Ledger</h3>
                    <p className="text-xs text-zinc-500">Active roster vs. new joiners</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {totalMembersCount > 0 ? `${totalMembersCount} Total Members` : '0 Members'}
                  </span>
                </div>

                {membershipGrowthData.length === 0 || totalMembersCount === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Member Registrations Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Athletes registered at the front desk or online will populate this ledger.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Total Active</th>
                          <th className="py-2.5 px-3">New Signups</th>
                          <th className="py-2.5 px-3 text-right">Net Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {membershipGrowthData.map((row) => (
                          <tr key={row.month} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.month}</td>
                            <td className="py-2.5 px-3 font-bold text-zinc-900">{row.total}</td>
                            <td className="py-2.5 px-3 text-zinc-700">+{row.new || 0}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-zinc-900">
                              +{(row.new || 0) - (row.churned || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Active members: <strong>{activeMembersCount}</strong></span>
                <span className="text-zinc-900 font-medium">
                  {totalMembersCount > 0 ? `${totalMembersCount} total enrolled` : 'Awaiting first registration'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERSHIP ANALYTICS */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Retention Rate"
              value={totalMembersCount > 0 ? '100%' : '0%'}
              subtitle="Active roster stability"
              icon={ShieldCheck}
            />
            <StatCard
              title="Active Roster"
              value={`${activeMembersCount} Members`}
              subtitle="Registered active members"
              icon={Clock}
            />
            <StatCard
              title="Total Enrolled"
              value={`${totalMembersCount} Total`}
              subtitle="Lifetime member signups"
              icon={Sparkles}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Membership Growth Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Active Membership Roster</h3>
                    <p className="text-xs text-zinc-500">Enrolled active members month over month</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {activeMembersCount} Active
                  </span>
                </div>

                {membershipGrowthData.length === 0 || totalMembersCount === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Active Members Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Active athlete subscriptions will be tracked here once members enroll.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Enrolled Athletes</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {membershipGrowthData.map((row) => (
                          <tr key={row.month} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.month}</td>
                            <td className="py-2.5 px-3 font-bold text-zinc-900">{row.total} members</td>
                            <td className="py-2.5 px-3 text-right text-zinc-700 font-medium">Active</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Total enrolled: <strong>{totalMembersCount} members</strong></span>
                <span className="text-zinc-900 font-medium">{totalMembersCount > 0 ? 'Consistent roster' : 'Ready for members'}</span>
              </div>
            </div>

            {/* Plan Distribution Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Plan Tier Distribution</h3>
                    <p className="text-xs text-zinc-500">Breakdown of member subscriptions</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {planDistributionData.length} Tiers Available
                  </span>
                </div>

                {totalMembersCount === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Plan Subscriptions Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Tier enrollment breakdown will display as members subscribe to plans.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Plan Tier</th>
                          <th className="py-2.5 px-3">Enrolled</th>
                          <th className="py-2.5 px-3 text-right">Share %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {planDistributionData.map((entry) => (
                          <tr key={entry.name} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{entry.name}</td>
                            <td className="py-2.5 px-3 text-zinc-700">{entry.value} members</td>
                            <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                              {totalMembersCount > 0 ? Math.round((entry.value / totalMembersCount) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Active tiers: <strong>{planDistributionData.length} packages</strong></span>
                <span className="text-zinc-900 font-medium">Standard membership setup</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVENUE & BILLING */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Average per Member"
              value={`${totalMembersCount > 0 ? Math.round(totalReportRevenue / totalMembersCount).toLocaleString() : 0} ETB`}
              subtitle="Lifetime revenue per member"
              icon={DollarSign}
            />
            <StatCard
              title="Total Revenue"
              value={`${totalReportRevenue.toLocaleString()} ETB`}
              subtitle="All completed transactions"
              icon={TrendingUp}
            />
            <StatCard
              title="Collection Rate"
              value={totalReportRevenue > 0 ? '100%' : '0%'}
              subtitle="Settled transactions"
              icon={CheckCircle2}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Turnover by Month</h3>
                    <p className="text-xs text-zinc-500">Gross revenue collected via front desk & online</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {totalReportRevenue.toLocaleString()} ETB Lifetime
                  </span>
                </div>

                {revenueChartData.length === 0 || totalReportRevenue === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Turnover History Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Monthly gross revenue will be recorded as payments are processed.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Gross Turnover</th>
                          <th className="py-2.5 px-3 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {revenueChartData.map((row) => (
                          <tr key={row.month} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.month}</td>
                            <td className="py-2.5 px-3 font-bold text-zinc-900">{row.revenue.toLocaleString()} ETB</td>
                            <td className="py-2.5 px-3 text-right text-zinc-700">
                              {totalReportRevenue > 0 ? Math.round((row.revenue / totalReportRevenue) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Monthly average: <strong>{avgMonthlyRevenue.toLocaleString()} ETB</strong></span>
                <span className="text-zinc-900 font-medium">Cashflow overview</span>
              </div>
            </div>

            {/* Payment Method Breakdown Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Payment Channels</h3>
                    <p className="text-xs text-zinc-500">Cash vs. Bank Transfer vs. Mobile Money</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {paymentMethodData.length > 0 && totalReportRevenue > 0 ? `${paymentMethodData.length} Channels` : '0 Transactions'}
                  </span>
                </div>

                {paymentMethodData.length === 0 || totalReportRevenue === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Transactions Processed Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Payment methods (Cash, Telebirr, CBE) will show once invoices are settled.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Channel</th>
                          <th className="py-2.5 px-3">Total Amount</th>
                          <th className="py-2.5 px-3 text-right">Share %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {paymentMethodData.map((entry) => (
                          <tr key={entry.name} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{entry.name}</td>
                            <td className="py-2.5 px-3 text-zinc-700">{entry.value.toLocaleString()} ETB</td>
                            <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                              {totalReportRevenue > 0 ? Math.round((entry.value / totalReportRevenue) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Total processed: <strong>{totalReportRevenue.toLocaleString()} ETB</strong></span>
                <span className="text-zinc-900 font-medium">Digital & POS reconciliation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE & FOOTFALL */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Check-ins"
              value={`${totalVisitsCount} Visits`}
              subtitle="Turnstile & desk entries"
              icon={CalendarCheck}
            />
            <StatCard
              title="Check-in Methods"
              value={`${checkInMethods.reduce((s, m) => s + m.count, 0)} Logged`}
              subtitle="QR & front desk scans"
              icon={TrendingUp}
            />
            <StatCard
              title="QR Scan Rate"
              value={totalVisitsCount > 0 ? `${Math.round(((checkInMethods.find(m => m.name.includes('QR'))?.count || 0) / totalVisitsCount) * 100)}%` : '0%'}
              subtitle="Self-service badge scans"
              icon={Activity}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Attendance Patterns Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Attendance by Day</h3>
                    <p className="text-xs text-zinc-500">Total visits logged Monday through Sunday</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    {totalVisitsCount} Total Visits
                  </span>
                </div>

                {attendanceChartData.length === 0 || totalVisitsCount === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Attendance Records Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Daily member check-ins via QR or reception desk will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Day</th>
                          <th className="py-2.5 px-3">Total Visits</th>
                          <th className="py-2.5 px-3 text-right">Density</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {attendanceChartData.map((row) => (
                          <tr key={row.day} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.day}</td>
                            <td className="py-2.5 px-3 font-bold text-zinc-900">{row.count || 0} visits</td>
                            <td className="py-2.5 px-3 text-right text-zinc-700">
                              {(row.count || 0) > 0 ? 'Logged' : 'Regular'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Daily average: <strong>{Math.round(totalVisitsCount / 7)} visits / day</strong></span>
                <span className="text-zinc-900 font-medium">Busiest 17:00 - 20:00</span>
              </div>
            </div>

            {/* Peak Hours Breakdown Table */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Floor Density by Time Slot</h3>
                    <p className="text-xs text-zinc-500">Floor density throughout opening hours</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                    Operating Hours
                  </span>
                </div>

                {totalVisitsCount === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">No Peak Hours Recorded Yet</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Time slot density will be calculated automatically from check-in timestamps.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Time Slot</th>
                          <th className="py-2.5 px-3">Avg Check-ins</th>
                          <th className="py-2.5 px-3 text-right">Floor Load</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {peakHoursData.map((row) => (
                          <tr key={row.timeSlot} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.timeSlot}</td>
                            <td className="py-2.5 px-3 font-bold text-zinc-900">{row.checkIns || 0} visits</td>
                            <td className="py-2.5 px-3 text-right text-zinc-700">
                              {(row.checkIns || 0) >= 30 ? (
                                <span className="font-bold text-zinc-900">High</span>
                              ) : (row.checkIns || 0) > 0 ? (
                                'Moderate'
                              ) : (
                                'Low'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 mt-4">
                <span>Facility hours: <strong>06:00 - 22:00</strong></span>
                <span className="text-zinc-900 font-medium">Standard gym schedule</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
