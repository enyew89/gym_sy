import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifications } from '../data/mockData';
import { memberApi } from '../services/api';
import toast from 'react-hot-toast';
import GymLogo from './GymLogo';
import {
  LayoutDashboard, Users, CreditCard, Dumbbell, CalendarDays, ClipboardList,
  Settings, LogOut, Menu, X, Bell, ChevronDown, UserCircle, QrCode,
  UserPlus, BookOpen, BarChart3, Wrench, GraduationCap, Bot,
  TrendingUp, ScanLine, Receipt, CalendarCheck, History, MessageSquare,
  MessageSquarePlus, ShieldCheck, CheckCircle2, Sparkles, Loader2
} from 'lucide-react';

const groupedNavigation = {
  admin: [
    {
      section: 'Core Management',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Members Directory', path: '/admin/members', icon: Users },
        { name: 'Staff Team', path: '/admin/staff', icon: GraduationCap },
      ],
    },
    {
      section: 'Finance & Plans',
      items: [
        { name: 'Membership Plans', path: '/admin/plans', icon: CreditCard },
        { name: 'Payments & Revenue', path: '/admin/payments', icon: Receipt },
      ],
    },
    {
      section: 'Operations & Facilities',
      items: [
        { name: 'Classes & Schedule', path: '/admin/classes', icon: CalendarDays },
        { name: 'Equipment Health', path: '/admin/equipment', icon: Wrench },
        { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
      ],
    },
  ],
  trainer: [
    {
      section: 'Coaching Hub',
      items: [
        { name: 'Trainer Dashboard', path: '/trainer', icon: LayoutDashboard },
        { name: 'My Assigned Members', path: '/trainer/members', icon: Users },
        { name: 'Workout Programs', path: '/trainer/workouts', icon: ClipboardList },
      ],
    },
    {
      section: 'Schedule & Progress',
      items: [
        { name: 'Member Progress Logs', path: '/trainer/progress', icon: TrendingUp },
        { name: 'Class & PT Timetable', path: '/trainer/schedule', icon: CalendarDays },
      ],
    },
    {
      section: 'Assistance & Chat',
      items: [
        { name: 'Client Messages', path: '/trainer/communication', icon: MessageSquare },
        { name: 'AI Workout Assistant', path: '/trainer/ai-assistant', icon: Bot },
      ],
    },
  ],
  receptionist: [
    {
      section: 'Front Desk Access',
      items: [
        { name: 'Reception Dashboard', path: '/receptionist', icon: LayoutDashboard },
        { name: 'Fast QR Check-in', path: '/receptionist/checkin', icon: ScanLine },
        { name: 'Register Walk-in', path: '/receptionist/register', icon: UserPlus },
      ],
    },
    {
      section: 'Billing & Records',
      items: [
        { name: 'Payments & Cash Desk', path: '/receptionist/payments', icon: Receipt },
        { name: 'Class Bookings', path: '/receptionist/bookings', icon: CalendarCheck },
        { name: 'Attendance History', path: '/receptionist/attendance', icon: History },
      ],
    },
  ],
  member: [
    {
      section: 'My Fitness Hub',
      items: [
        { name: 'Member Dashboard', path: '/member', icon: LayoutDashboard },
        { name: 'Today\'s Workouts', path: '/member/workouts', icon: Dumbbell },
        { name: 'Book Classes', path: '/member/classes', icon: CalendarDays },
        { name: 'My Fitness Progress', path: '/member/progress', icon: TrendingUp },
      ],
    },
    {
      section: 'Billing & Pass',
      items: [
        { name: 'Membership', path: '/member/membership', icon: CreditCard },
        { name: 'Payment Receipts', path: '/member/payments', icon: Receipt },
        { name: 'My Profile', path: '/member/profile', icon: UserCircle },
      ],
    },
    {
      section: 'Smart Support',
      items: [
        { name: 'AI Fitness Coach', path: '/member/ai-assistant', icon: Bot },
        { name: 'Help & Equipment Feedback', path: '/member/feedback', icon: MessageSquarePlus },
      ],
    },
  ],
};

const roleLabels = {
  admin: 'Administrator',
  trainer: 'Trainer Coach',
  receptionist: 'Front Desk',
  member: 'Gym Member',
};

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'member') {
      memberApi.getNotifications()
        .then((res) => {
          if (res.success && res.notifications?.length > 0) {
            setNotifList(res.notifications);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifList.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifList(notifList.map((n) => ({ ...n, read: true })));
  };

  const navGroups = groupedNavigation[user?.role] || [];

  // Find current active item title
  let currentTitle = 'Dashboard';
  for (const group of navGroups) {
    const found = group.items.find((item) => item.path === location.pathname);
    if (found) {
      currentTitle = found.name;
      break;
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0c] text-zinc-300 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
          <Link to={`/${user?.role || 'member'}`} className="flex items-center gap-2">
            <GymLogo size="sm" />
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/30">
              {roleLabels[user?.role] || 'Staff'}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-zinc-800 rounded text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {group.section}
              </p>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-orange-600/20 text-white border-l-2 border-orange-500 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User info & quick switch at bottom */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-800 text-orange-500 border border-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email || 'Logged In'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-zinc-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                    <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={markAllRead}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifList.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                            !n.read ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.type === 'warning' ? 'bg-amber-500' :
                            n.type === 'error' ? 'bg-rose-500' :
                            n.type === 'success' ? 'bg-emerald-500' : 'bg-orange-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {profileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                        {roleLabels[user?.role] || user?.role}
                      </span>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

