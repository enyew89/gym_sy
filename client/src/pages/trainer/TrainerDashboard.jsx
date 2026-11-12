import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { members as defaultMembers, workoutPlans as defaultPlans, classes as defaultClasses } from '../../data/mockData';
import { StatCard, StatusBadge } from '../../components/ui';
import { trainerApi } from '../../services/api';
import {
  Users,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Activity,
  Flame,
  Award,
  MessageSquare
} from 'lucide-react';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const trainerName = user?.name || 'Coach';

  // Live overview state
  const [stats, setStats] = useState({
    assignedMembersCount: 0,
    activePlansCount: 0,
    totalClassesCount: 0,
    todaySessionsCount: 0,
  });
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Load real data from backend
  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await trainerApi.getOverview();
        if (res.success) {
          if (res.stats) setStats(res.stats);
          if (Array.isArray(res.assignedMembers)) setAssignedMembers(res.assignedMembers);
          if (Array.isArray(res.todaySessions)) setTodaySessions(res.todaySessions);
          if (Array.isArray(res.recentActivity)) setRecentActivities(res.recentActivity);
        }
      } catch (err) {
        // Fallback
      }
    }
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Trainer Coaching Hub</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Welcome back, {trainerName}. You have {stats.todaySessionsCount} training sessions scheduled today.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/trainer/workouts/create"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl text-sm shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Workout</span>
          </Link>
          <Link
            to="/trainer/communication"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl text-sm border border-zinc-200 shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            <span>Messages & Feedback</span>
          </Link>
          <Link
            to="/trainer/schedule"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl text-sm border border-zinc-200 shadow-xs transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-zinc-500" />
            <span>Timetable</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Members"
          value={stats.assignedMembersCount}
          subtitle="Athletes under direct coaching"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Active Workout Plans"
          value={stats.activePlansCount}
          subtitle="Personalized training splits"
          icon={Dumbbell}
          color="emerald"
        />
        <StatCard
          title="Assigned Classes"
          value={stats.totalClassesCount}
          subtitle="Weekly timetable sessions"
          icon={CalendarDays}
          color="sky"
        />
        <StatCard
          title="Client Adherence"
          value="94%"
          subtitle="Target: >85% consistency"
          icon={TrendingUp}
          trend="+5%"
          trendUp={true}
          color="amber"
        />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 px-1">
          Coaching Shortcuts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/trainer/workouts/create')}
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Create Workout</p>
              <p className="text-xs text-zinc-500">Design custom routine</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/trainer/members')}
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">My Members</p>
              <p className="text-xs text-zinc-500">{stats.assignedMembersCount} assigned athletes</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/trainer/progress')}
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Track Progress</p>
              <p className="text-xs text-zinc-500">Logs & observations</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/trainer/communication')}
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Communication</p>
              <p className="text-xs text-zinc-500">Instructions & reminders</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Today's Coaching Schedule</h2>
                <p className="text-xs text-zinc-500">Group classes and 1-on-1 personal training</p>
              </div>
              <Link to="/trainer/schedule" className="text-xs font-semibold text-zinc-900 hover:underline">
                Full Timetable &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {todaySessions.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="font-semibold text-zinc-600">No Sessions Scheduled Today</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Sessions and classes will appear here once scheduled.</p>
                </div>
              ) : (
                todaySessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {sess.type === 'class' ? <CalendarDays className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{sess.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {sess.time}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {sess.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      sess.status === 'completed'
                        ? 'bg-zinc-200 text-zinc-800'
                        : sess.status === 'in-progress'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {sess.status === 'in-progress' ? 'Active Now' : sess.status === 'completed' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Athlete Activity (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Athlete Activity</h2>
                <p className="text-xs text-zinc-500">Milestones, logs, and updates</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                Live Feed
              </span>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="font-semibold text-zinc-600">No Activity Recorded</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Athlete workouts and lift logs will stream here live.</p>
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-900">{act.member}</span>
                      <span className="text-[10px] text-zinc-400">{act.time}</span>
                    </div>
                    <p className="text-zinc-600">{act.action}</p>
                    {act.detail && (
                      <p className="text-[11px] text-zinc-400 mt-1 italic">{act.detail}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 mt-4">
            <Link
              to="/trainer/members"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
            >
              <span>View All Assigned Athletes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
