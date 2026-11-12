import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Flame, CalendarCheck, Clock, ArrowRight,
  Sparkles, QrCode, CheckCircle2, ChevronRight, Activity,
  Calendar, UserCheck, Trophy, Target, ShieldCheck, Loader2,
  Zap, CreditCard
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { members, workoutPlans, classes, attendance } from '../../data/mockData';
import { StatCard, StatusBadge, PageHeader, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { memberApi } from '../../services/api';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Live state
  const [liveMembership, setLiveMembership] = useState(null);
  const [liveWorkoutPlan, setLiveWorkoutPlan] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live dashboard summary
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [memRes, wpRes, clsRes, logRes, attRes] = await Promise.allSettled([
          memberApi.getMembership(),
          memberApi.getWorkouts(),
          memberApi.getClasses(),
          memberApi.getWorkoutHistory(),
          memberApi.getAttendance(),
        ]);

        if (!isMounted) return;

        if (memRes.status === 'fulfilled' && memRes.value?.success) {
          setLiveMembership(memRes.value.membership);
        }
        if (wpRes.status === 'fulfilled' && wpRes.value?.success && wpRes.value.workoutPlan) {
          setLiveWorkoutPlan(wpRes.value.workoutPlan);
        }
        if (clsRes.status === 'fulfilled' && clsRes.value?.success && Array.isArray(clsRes.value.classes)) {
          setLiveClasses(clsRes.value.classes);
        }
        if (logRes.status === 'fulfilled' && logRes.value?.success && Array.isArray(logRes.value.logs)) {
          setLiveLogs(logRes.value.logs);
        }
        if (attRes.status === 'fulfilled' && attRes.value?.success && Array.isArray(attRes.value.attendance)) {
          setLiveAttendance(attRes.value.attendance);
        }
      } catch (err) {
        console.warn('Dashboard live sync fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Member workout plan and active day
  const memberPlan = liveWorkoutPlan || null;
  const activeWorkoutDay = memberPlan?.days?.[selectedDayIndex] || memberPlan?.days?.[0] || null;

  // Calculate days remaining until expiry
  const currentPlanName = liveMembership?.plan || user?.plan || 'None';
  const daysRemaining = liveMembership?.daysRemaining !== undefined
    ? liveMembership.daysRemaining
    : (() => {
        try {
          const expiryDate = new Date(user?.planExpiryDate || Date.now());
          const today = new Date();
          const timeDiff = expiryDate.getTime() - today.getTime();
          return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        } catch {
          return 0;
        }
      })();

  // Member QR token safe string
  const memberIdTag = String(user?._id || user?.id || 'none');
  const memberQrCode = `GYM-PASS:${memberIdTag}:${user?.email || 'none'}`;

  // Dynamic Gym Visits this month
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const monthlyVisits = liveAttendance.filter((a) => (a.date || '').startsWith(currentMonthStr));
  const visitsCount = monthlyVisits.length;

  // Dynamic Current Streak calculation
  const calculateStreak = (records) => {
    if (!records || records.length === 0) return 0;
    const uniqueDates = Array.from(new Set(records.map((r) => r.date).filter(Boolean))).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let currDate = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
      const d = new Date(uniqueDates[i]);
      const diff = Math.round((currDate - d) / (1000 * 3600 * 24));
      if (diff <= 1) {
        streak++;
        currDate = d;
      } else {
        break;
      }
    }
    return streak;
  };
  const currentStreak = calculateStreak(liveAttendance);

  // Dynamic Next Class
  const bookedClasses = (liveClasses || []).filter((c) => c.isEnrolled);
  const nextBookedClass = bookedClasses[0] || null;
  const upcomingClasses = liveClasses.slice(0, 3);

  // Dynamic Recent Activity Timeline
  const recentActivities = [
    ...liveAttendance.map((a) => ({
      id: `att-${a._id || a.id || a.checkIn}`,
      title: 'Gym Check-in',
      description: `${a.method || 'QR'} Scan at turnstile • Check-in: ${a.checkIn}${a.checkOut ? ` - Check-out: ${a.checkOut}` : ' (Active now)'}`,
      time: a.date,
      dateObj: new Date(a.date || a.createdAt || Date.now()),
      type: 'checkin',
      icon: UserCheck,
      color: 'text-zinc-900 bg-zinc-100 border-zinc-200',
    })),
    ...liveLogs.map((log) => ({
      id: `log-${log._id || log.id}`,
      title: log.workoutName || 'Workout Completed',
      description: `${log.dayTitle || 'Session'} • ${log.exercisesCompleted?.length || 0} exercises completed (${log.durationMinutes || 45} mins)`,
      time: log.date || new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      dateObj: new Date(log.date || log.createdAt || Date.now()),
      type: 'workout',
      icon: Dumbbell,
      color: 'text-zinc-900 bg-zinc-100 border-zinc-200',
    })),
  ].sort((a, b) => b.dateObj - a.dateObj).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-900 border border-orange-200">
              {currentPlanName} Plan
            </span>
            <span className="text-xs text-zinc-500 font-medium">• {daysRemaining} days remaining</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Welcome back, {user?.name || 'Member'}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Your personal member portal. Select an action below to get started.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/member/payments"
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-white rounded-xl font-medium text-sm transition-colors shadow-xs ${
              daysRemaining <= 7
                ? 'bg-orange-600 hover:bg-orange-500'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {daysRemaining <= 7 ? (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Renew with Chapa</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Billing & Receipts</span>
              </>
            )}
          </Link>
          <button
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium text-sm transition-colors shadow-xs cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>My QR Pass</span>
          </button>
        </div>
      </div>

      {/* 4 Super Easy Quick Action Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: QR Pass */}
        <div
          onClick={() => setShowQRModal(true)}
          className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              Entry Pass
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
              My Gym QR Pass
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tap to display scannable pass for front desk check-in
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900">
            <span>Show QR code</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Chapa Payment & Subscription Status */}
        <Link
          to="/member/payments"
          className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-emerald-600 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-emerald-600" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              daysRemaining <= 7
                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {daysRemaining <= 7 ? 'Renewal Due' : 'Active Plan'}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-zinc-900 text-sm group-hover:text-emerald-700 transition-colors">
              {daysRemaining <= 7 ? 'Renew Membership' : 'Membership Active'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {daysRemaining <= 7
                ? `Expires in ${daysRemaining} days. Renew via Telebirr or CBE Birr.`
                : `${currentPlanName} Plan (${daysRemaining} days remaining). Duplicate pay locked.`}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>{daysRemaining <= 7 ? 'Renew with Chapa' : 'View Billing & Receipts'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Today's Routine */}
        <Link
          to="/member/workouts"
          className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              Workout
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors">
              Today's Workout
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeWorkoutDay ? `${activeWorkoutDay.focus} (${activeWorkoutDay.exercises?.length || 0} exercises)` : 'No assigned plan yet'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900">
            <span>{activeWorkoutDay ? 'Start routine' : 'Explore plans'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Book Classes */}
        <Link
          to="/member/classes"
          className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              Schedule
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-zinc-900 text-sm group-hover:text-violet-600 transition-colors">
              Book Group Classes
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {nextBookedClass ? `Booked: ${nextBookedClass.name} (${nextBookedClass.time})` : 'Browse fitness classes & reserve spots'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900">
            <span>Browse schedule</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Chapa Payment Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-white to-white border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <Zap className="w-5 h-5 fill-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">Chapa Payment Gateway Active</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Telebirr • CBE Birr • Cards
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan: <strong className="text-slate-800">{currentPlanName}</strong> • {daysRemaining} days remaining on your subscription pass
            </p>
          </div>
        </div>
        <Link
          to="/member/payments"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs active:scale-95 whitespace-nowrap"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pay & Settle Online</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Gym Visits This Month"
          value={visitsCount.toString()}
          subtitle={visitsCount > 0 ? `${visitsCount} turnstile check-in${visitsCount > 1 ? 's' : ''}` : 'No visits recorded this month'}
          icon={CalendarCheck}
          color="primary"
        />
        <StatCard
          title="Current Streak"
          value={currentStreak > 0 ? `${currentStreak} Day${currentStreak > 1 ? 's' : ''}` : '0 Days'}
          subtitle={currentStreak > 0 ? 'Consecutive workout days' : 'Start your gym streak today!'}
          icon={Flame}
          color="primary"
        />
        <StatCard
          title="Workouts Completed"
          value={liveLogs.length.toString()}
          subtitle={liveLogs.length > 0 ? `${liveLogs.length} logged routine session${liveLogs.length > 1 ? 's' : ''}` : 'No workouts logged yet'}
          icon={Dumbbell}
          color="primary"
        />
        <StatCard
          title="Next Class"
          value={nextBookedClass ? nextBookedClass.name : 'None Booked'}
          subtitle={nextBookedClass ? `${nextBookedClass.schedule} • ${nextBookedClass.time}` : 'Explore group classes below'}
          icon={Clock}
          color="primary"
        />
      </div>

      {/* Main Grid: Workout Preview & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout Preview (2 cols on large) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-900" />
                  <h2 className="text-lg font-bold text-zinc-900">Today's Workout Plan</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Assigned routine: {memberPlan?.name || 'No Plan Assigned Yet'}
                </p>
              </div>
              <Link
                to="/member/workouts"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline"
              >
                <span>View Full Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!memberPlan || !memberPlan.days || memberPlan.days.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-zinc-500 border border-zinc-200">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-zinc-900 text-sm">No Custom Workout Assigned Yet</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Your fitness coach will design a routine tailored to your fitness goals, or you can explore routine templates.
                </p>
                <Link
                  to="/member/workouts"
                  className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Browse Workouts</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Day selector tabs */}
                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 border-b border-zinc-100">
                  {memberPlan.days.map((dayObj, index) => (
                    <button
                      key={dayObj.day || index}
                      onClick={() => setSelectedDayIndex(index)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedDayIndex === index
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {dayObj.day} ({dayObj?.focus ? dayObj.focus.split('&')[0].trim() : 'Focus'})
                    </button>
                  ))}
                </div>

                {/* Selected day summary */}
                {activeWorkoutDay && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-zinc-500">
                          Target Focus
                        </span>
                        <h3 className="text-base font-bold text-zinc-900">{activeWorkoutDay.focus}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-500">Exercises</span>
                        <p className="text-sm font-bold text-zinc-900">
                          {activeWorkoutDay.exercises?.length || 0} items
                        </p>
                      </div>
                    </div>

                    {/* Exercises list */}
                    <div className="space-y-2.5">
                      {activeWorkoutDay.exercises?.map((exercise, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 bg-white hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold text-xs border border-zinc-200">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{exercise.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                                <span>{exercise.sets} sets × {exercise.reps} reps</span>
                                <span>•</span>
                                <span className="font-medium text-zinc-800">{exercise.weight}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700">
                              {exercise.rest} rest
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-zinc-700" />
                        <span>Always warm up 5-10 minutes before starting</span>
                      </div>
                      <Link
                        to="/member/workouts"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Start This Workout</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Upcoming Classes Section */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Upcoming Group Classes</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Booked & recommended sessions for this week
                </p>
              </div>
              <Link
                to="/member/classes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {upcomingClasses.map((cls) => {
                const spotsLeft = cls.capacity - cls.enrolled;
                const isNext = cls.id === 'c2'; // HIIT Blast
                return (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isNext
                        ? 'border-zinc-900 bg-zinc-50/70 ring-1 ring-zinc-900/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                        {cls.room}
                      </span>
                      {isNext ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white">
                          Enrolled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-500">
                          {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-zinc-900 text-sm">{cls.name}</h4>
                    <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                      <span>Trainer: {cls.trainerName}</span>
                    </p>
                    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                      <span>{cls.schedule}</span>
                      <span className="font-medium text-zinc-800">{cls.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity & Quick Profile Widget */}
        <div className="space-y-6">
          {/* Quick Check-in Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs text-center">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-3 border border-zinc-200">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base">Digital Gym Pass</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Member ID: <span className="font-mono font-semibold text-zinc-800">{memberIdTag.slice(-8).toUpperCase()}</span>
            </p>
            <div className="my-4 p-3 bg-zinc-50 rounded-lg inline-block border border-zinc-200">
              <div className="w-32 h-32 bg-white p-2 rounded border border-zinc-200 flex flex-col items-center justify-center relative shadow-xs">
                <QRCodeSVG
                  value={memberQrCode}
                  size={112}
                  level="H"
                  includeMargin={true}
                  className="w-full h-full"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Tap below to view full-screen QR pass for quick entry at front desk
            </p>
            <button
              onClick={() => setShowQRModal(true)}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Open Full Screen Pass
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-base">Recent Activity</h3>
              <Activity className="w-4 h-4 text-zinc-400" />
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-zinc-400">
                  No activity records yet. Turnstile check-ins and completed workouts will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-4 flow-root">
                <ul className="-mb-6">
                  {recentActivities.map((activity, idx) => {
                    const Icon = activity.icon;
                    const isLast = idx === recentActivities.length - 1;
                    return (
                      <li key={activity.id}>
                        <div className="relative pb-6">
                          {!isLast && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex items-start space-x-3">
                            <div
                              className={`relative w-8 h-8 rounded-full border flex items-center justify-center ${activity.color}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-zinc-900">{activity.title}</p>
                                <span className="text-[10px] text-zinc-400">{activity.time}</span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-2 pt-3 border-t border-zinc-100 text-center">
              <Link
                to="/member/progress"
                className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
              >
                <span>View Full History & Progress</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Full Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Member Entry Pass"
        size="sm"
      >
        <div className="text-center p-4">
          <div className="w-14 h-14 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-zinc-200">
            <QrCode className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-zinc-900">{user?.name || 'Gym Member'}</h4>
          <p className="text-xs text-zinc-500">{currentPlanName} Membership • {liveMembership?.status || 'Active'}</p>

          <div className="my-6 p-4 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-52 h-52 bg-white p-3 rounded-xl border border-zinc-200 shadow flex flex-col items-center justify-center">
              <QRCodeSVG
                value={memberQrCode}
                size={180}
                level="H"
                includeMargin={true}
                className="w-full h-full"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PASS ID: {memberIdTag.slice(-8).toUpperCase()}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">
              Show this code to the front desk scanner for access
            </p>
          </div>

          <div className="bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium">
            Status: {liveMembership?.isExpired ? 'Expired — Renewal Required' : 'Active Access • Entry Granted'}
          </div>

          <button
            onClick={() => setShowQRModal(false)}
            className="w-full mt-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Pass
          </button>
        </div>
      </Modal>
    </div>
  );
}
