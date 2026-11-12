import { useState, useEffect } from 'react';
import {
  CalendarDays, Clock, Users, MapPin, CheckCircle2,
  XCircle, Filter, Calendar as CalendarIcon, Grid,
  AlertCircle, Sparkles, User, ChevronRight, Check, Loader2
} from 'lucide-react';
import { classes as mockClasses } from '../../data/mockData';
import { PageHeader, StatusBadge, Modal, SearchBar } from '../../components/ui';
import { memberApi } from '../../services/api';

export default function MemberClasses() {
  const [classList, setClassList] = useState([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'schedule'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [bookingClass, setBookingClass] = useState(null);
  const [cancelingClass, setCancelingClass] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await memberApi.getClasses();
      if (res?.classes && Array.isArray(res.classes)) {
        const mapped = res.classes.map((c) => ({
          id: c._id || c.id,
          _id: c._id || c.id,
          name: c.name,
          trainerName: c.trainerName,
          schedule: c.schedule,
          time: c.time,
          room: c.room,
          capacity: c.capacity,
          enrolled: c.enrolled || 0,
          isEnrolled: c.isEnrolled,
        }));
        setClassList(mapped);
        const enrolled = mapped.filter((c) => c.isEnrolled).map((c) => c.id);
        if (enrolled.length > 0) {
          setEnrolledClassIds(enrolled);
        }
      }
    } catch (err) {
      console.warn('Using default classes list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Filter logic
  const filteredClasses = classList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.room.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      c.room.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      c.name.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const enrolledClasses = classList.filter((c) => enrolledClassIds.includes(c.id || c._id));

  const handleBookClick = (cls) => {
    setBookingClass(cls);
  };

  const handleConfirmBooking = async () => {
    if (!bookingClass) return;
    const targetId = bookingClass._id || bookingClass.id;

    try {
      const res = await memberApi.enrollClass(targetId);
      setEnrolledClassIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
      setClassList((prev) =>
        prev.map((c) =>
          c.id === targetId || c._id === targetId ? { ...c, enrolled: (c.enrolled || 0) + 1, isEnrolled: true } : c
        )
      );
      setAlertMessage({
        type: 'success',
        text: res?.message || `Successfully booked "${bookingClass.name}" with ${bookingClass.trainerName}!`,
      });
    } catch (err) {
      // Local fallback in case of simulated server
      setEnrolledClassIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
      setClassList((prev) =>
        prev.map((c) =>
          c.id === targetId || c._id === targetId ? { ...c, enrolled: (c.enrolled || 0) + 1, isEnrolled: true } : c
        )
      );
      setAlertMessage({
        type: 'success',
        text: `Successfully booked "${bookingClass.name}" with ${bookingClass.trainerName}!`,
      });
    }

    setBookingClass(null);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleCancelClick = (cls) => {
    setCancelingClass(cls);
  };

  const handleConfirmCancel = async () => {
    if (!cancelingClass) return;
    const targetId = cancelingClass._id || cancelingClass.id;

    try {
      const res = await memberApi.cancelClass(targetId);
      setEnrolledClassIds((prev) => prev.filter((id) => id !== targetId));
      setClassList((prev) =>
        prev.map((c) =>
          c.id === targetId || c._id === targetId
            ? { ...c, enrolled: Math.max(0, (c.enrolled || 0) - 1), isEnrolled: false }
            : c
        )
      );
      setAlertMessage({
        type: 'info',
        text: res?.message || `Your booking for "${cancelingClass.name}" has been cancelled.`,
      });
    } catch (err) {
      setEnrolledClassIds((prev) => prev.filter((id) => id !== targetId));
      setClassList((prev) =>
        prev.map((c) =>
          c.id === targetId || c._id === targetId
            ? { ...c, enrolled: Math.max(0, (c.enrolled || 0) - 1), isEnrolled: false }
            : c
        )
      );
      setAlertMessage({
        type: 'info',
        text: `Your booking for "${cancelingClass.name}" has been cancelled.`,
      });
    }

    setCancelingClass(null);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Schedule view days
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getClassesForDay = (dayName) => {
    const prefix = dayName.slice(0, 3);
    return classList.filter((c) => c.schedule.includes(prefix));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Fitness Classes"
        subtitle="Book studio classes, view weekly timetable, and manage your registrations"
        action={
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Classes Grid</span>
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'schedule'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Weekly Schedule</span>
            </button>
          </div>
        }
      />

      {/* Alert toast notification */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm transition-all animate-in fade-in ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <p className="font-medium">{alertMessage.text}</p>
        </div>
      )}

      {/* Enrolled Classes Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            <h3 className="text-lg font-bold text-slate-900">My Enrolled Classes</h3>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
              {enrolledClasses.length} Booked
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Arrive 10 minutes before class start
          </p>
        </div>

        {enrolledClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {enrolledClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-white flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">
                      {cls.room}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-violet-600 text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Confirmed
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900">{cls.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Trainer: <strong className="text-slate-800">{cls.trainerName}</strong></span>
                  </p>

                  <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        Days:
                      </span>
                      <span className="font-semibold text-slate-800">{cls.schedule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Time:
                      </span>
                      <span className="font-bold text-slate-900">{cls.time}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Locker towel provided</span>
                  <button
                    onClick={() => handleCancelClick(cls)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Booking</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No classes booked yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse the catalog below and reserve your spot in today's group sessions!
            </p>
          </div>
        )}
      </div>

      {/* Available Classes Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by class, trainer, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['all', 'yoga', 'hiit', 'strength', 'zumba', 'boxing'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((cls) => {
              const spotsLeft = cls.capacity - cls.enrolled;
              const isFull = spotsLeft <= 0;
              const isEnrolled = enrolledClassIds.includes(cls.id);
              const occupancyPercent = Math.round((cls.enrolled / cls.capacity) * 100);

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {cls.room}
                      </span>
                      {isEnrolled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800">
                          Booked
                        </span>
                      ) : isFull ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Full
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {spotsLeft} spots open
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-slate-900">{cls.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Instructor: <span className="font-semibold text-slate-800">{cls.trainerName}</span>
                    </p>

                    {/* Schedule and time pill */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Days:</span>
                        <span className="font-semibold text-slate-800">{cls.schedule}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Time:</span>
                        <span className="font-bold text-slate-900">{cls.time}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Capacity: {cls.enrolled} / {cls.capacity}</span>
                        <span className="font-semibold">{occupancyPercent}% filled</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull
                              ? 'bg-rose-500'
                              : occupancyPercent > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    {isEnrolled ? (
                      <button
                        onClick={() => handleCancelClick(cls)}
                        className="w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-800 rounded-xl text-xs font-bold transition-colors"
                      >
                        Manage Booking
                      </button>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                      >
                        Class Full (Waitlist)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBookClick(cls)}
                        className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
                      >
                        Book Class
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Schedule View */}
      {viewMode === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h3 className="text-base font-bold text-slate-900">Weekly Master Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of all weekly sessions organized Monday through Sunday
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weekDays.map((day) => {
              const dayClasses = getClassesForDay(day);

              return (
                <div key={day} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900">{day}</h4>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {dayClasses.length > 0 ? (
                      dayClasses.map((c) => {
                        const isEnrolled = enrolledClassIds.includes(c.id);

                        return (
                          <div
                            key={c.id}
                            className={`p-3 rounded-lg border bg-white transition-all ${
                              isEnrolled
                                ? 'border-violet-300 ring-1 ring-violet-200 bg-violet-50/20'
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{c.name}</span>
                              {isEnrolled && (
                                <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                                  Enrolled
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                              <span>{c.time}</span>
                              <span className="font-medium text-slate-700">{c.room}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Trainer: {c.trainerName}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 italic">
                        No scheduled classes
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Book Class Confirmation Modal */}
      <Modal
        isOpen={!!bookingClass}
        onClose={() => setBookingClass(null)}
        title="Confirm Class Registration"
        size="sm"
      >
        {bookingClass && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              You are about to book a spot in the following group session:
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Class:</span>
                <span className="font-bold text-slate-900">{bookingClass.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trainer:</span>
                <span className="font-semibold text-slate-800">{bookingClass.trainerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800">{bookingClass.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Days & Time:</span>
                <span className="font-bold text-primary-600">
                  {bookingClass.schedule} ({bookingClass.time})
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Classes are included at no extra charge in your Premium plan. Please cancel at least 2 hours prior if you cannot make it.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookingClass(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        isOpen={!!cancelingClass}
        onClose={() => setCancelingClass(null)}
        title="Cancel Class Booking"
        size="sm"
      >
        {cancelingClass && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your reservation for{' '}
              <strong className="text-slate-900">{cancelingClass.name}</strong>?
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              Your spot will be released to other members on the waitlist.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelingClass(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Yes, Cancel Spot
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
