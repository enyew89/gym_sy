import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { classes, members } from '../../data/mockData';
import { PageHeader, Modal, StatusBadge } from '../../components/ui';
import { trainerApi } from '../../services/api';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  CheckCircle2,
  Filter,
  User,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrainerSchedule() {
  const { user } = useAuth();
  const trainerId = user?.id || 't1';

  // State
  const [selectedType, setSelectedType] = useState('all'); // all | class | pt
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);

  // New session form state
  const [newSessionDay, setNewSessionDay] = useState('Monday');
  const [newSessionTime, setNewSessionTime] = useState('14:00');
  const [newSessionMemberId, setNewSessionMemberId] = useState('m1');
  const [newSessionTitle, setNewSessionTitle] = useState('1-on-1 PT Session');

  // Days of the week
  const weekDays = [
    { key: 'Mon', full: 'Monday', date: 'Oct 19' },
    { key: 'Tue', full: 'Tuesday', date: 'Oct 20' },
    { key: 'Wed', full: 'Wednesday', date: 'Oct 21' },
    { key: 'Thu', full: 'Thursday', date: 'Oct 22' },
    { key: 'Fri', full: 'Friday', date: 'Oct 23' },
    { key: 'Sat', full: 'Saturday', date: 'Oct 24' },
    { key: 'Sun', full: 'Sunday', date: 'Oct 25' },
  ];

  // We highlight current day (e.g. today is Sunday or Monday)
  const currentDayKey = 'Sun';

  // Hours range: 6:00 AM to 9:00 PM (21:00)
  const timeSlots = [
    { hour: 6, label: '06:00 AM' },
    { hour: 7, label: '07:00 AM' },
    { hour: 8, label: '08:00 AM' },
    { hour: 9, label: '09:00 AM' },
    { hour: 10, label: '10:00 AM' },
    { hour: 11, label: '11:00 AM' },
    { hour: 12, label: '12:00 PM' },
    { hour: 13, label: '01:00 PM' },
    { hour: 14, label: '02:00 PM' },
    { hour: 15, label: '03:00 PM' },
    { hour: 16, label: '04:00 PM' },
    { hour: 17, label: '05:00 PM' },
    { hour: 18, label: '06:00 PM' },
    { hour: 19, label: '07:00 PM' },
    { hour: 20, label: '08:00 PM' },
    { hour: 21, label: '09:00 PM' },
  ];

  // Scheduled Sessions data
  const [sessions, setSessions] = useState([]);

  // Assigned members for the PT booking dropdown
  const [assignedMembersList, setAssignedMembersList] = useState([]);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await trainerApi.getAssignedMembers();
        if (res.success && res.members?.length > 0) {
          setAssignedMembersList(res.members);
          setNewSessionMemberId(res.members[0]._id || res.members[0].id);
        }
      } catch (err) {}
    }
    loadMembers();
  }, []);

  // Filter sessions by selected type
  const filteredSessions = sessions.filter((s) => {
    if (selectedType === 'all') return true;
    return s.type === selectedType;
  });

  const handleOpenDetail = (session) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  const handleCancelSession = (sessionId) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    setIsDetailModalOpen(false);
    toast.success('Session cancelled from schedule.');
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    const selectedMember = assignedMembersList.find((m) => (m._id || m.id) === newSessionMemberId);
    const dayKey = weekDays.find((d) => d.full === newSessionDay)?.key || 'Mon';
    const hourNum = parseInt(newSessionTime.split(':')[0], 10);

    const newSess = {
      id: `pt-${Date.now()}`,
      day: dayKey,
      startHour: hourNum,
      endHour: hourNum + 1,
      time: `${hourNum < 10 ? '0' + hourNum : hourNum}:00 - ${hourNum + 1 < 10 ? '0' + (hourNum + 1) : hourNum + 1}:00`,
      title: `PT: ${selectedMember ? selectedMember.name : 'Athlete'}`,
      type: 'pt',
      clientName: selectedMember ? selectedMember.name : 'Athlete',
      memberCount: '1-on-1',
      room: 'Weight Room - Coaching Zone',
      focus: newSessionTitle,
      description: 'Custom 1-on-1 personal training workout session.',
    };

    setSessions([...sessions, newSess]);
    setIsAddSessionModalOpen(false);
    toast.success(`PT session booked with ${newSess.clientName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Trainer Schedule"
        subtitle="Manage your weekly group classes, private coaching sessions, and court availability."
        action={
          <button
            onClick={() => setIsAddSessionModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book PT Session</span>
          </button>
        }
      />

      {/* Schedule Controls & Legend Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Week Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-bold text-slate-900">
            Week of Oct 19 – Oct 25, 2026
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Current Week
          </span>
        </div>

        {/* Filters and Legend */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setSelectedType('class')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedType === 'class'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => setSelectedType('pt')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedType === 'pt'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Personal Training
            </button>
          </div>

          {/* Color Legend */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 border-l border-slate-200 pl-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Classes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Personal Training
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span> Open Slot
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Calendar Table Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            {/* Header: Days of the week */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="w-24 p-3.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200">
                  Time
                </th>
                {weekDays.map((d) => {
                  const isToday = d.key === currentDayKey;
                  return (
                    <th
                      key={d.key}
                      className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                        isToday ? 'bg-emerald-50/60 ring-2 ring-emerald-500 ring-inset' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          {d.key}
                        </span>
                        <span
                          className={`text-sm font-bold mt-0.5 ${
                            isToday ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {d.date}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.2 rounded-full mt-1">
                            Today
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Calendar Rows */}
            <tbody className="divide-y divide-slate-100">
              {timeSlots.map((slot) => (
                <tr key={slot.hour} className="h-20 hover:bg-slate-50/40 transition-colors">
                  {/* Time label column */}
                  <td className="p-2 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 bg-slate-50/40 select-none align-top pt-3">
                    {slot.label}
                  </td>

                  {/* 7 Day columns */}
                  {weekDays.map((d) => {
                    const isToday = d.key === currentDayKey;

                    // Find if any session starts in this hour slot
                    const sessionInSlot = filteredSessions.find(
                      (s) => s.day === d.key && Math.floor(s.startHour) === slot.hour
                    );

                    return (
                      <td
                        key={`${slot.hour}-${d.key}`}
                        className={`p-1.5 border-r border-slate-100 last:border-r-0 align-top relative ${
                          isToday ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {sessionInSlot ? (
                          <div
                            onClick={() => handleOpenDetail(sessionInSlot)}
                            className={`h-full w-full p-2 rounded-lg border text-left cursor-pointer transition-all shadow-2xs hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${
                              sessionInSlot.type === 'class'
                                ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100/70'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                    sessionInSlot.type === 'class'
                                      ? 'bg-blue-200/60 text-blue-800'
                                      : 'bg-emerald-200/60 text-emerald-800'
                                  }`}
                                >
                                  {sessionInSlot.type === 'class' ? 'Class' : '1-on-1 PT'}
                                </span>
                                <span className="text-[10px] font-semibold opacity-75">
                                  {sessionInSlot.time}
                                </span>
                              </div>
                              <p className="text-xs font-bold mt-1 line-clamp-1">
                                {sessionInSlot.title}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-black/5 opacity-80">
                              <span className="truncate max-w-[80px]">
                                {sessionInSlot.room.split(' - ')[0]}
                              </span>
                              <span className="font-semibold shrink-0">
                                {sessionInSlot.type === 'class'
                                  ? `${sessionInSlot.enrolled}/${sessionInSlot.capacity}`
                                  : sessionInSlot.memberCount}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setNewSessionDay(d.full);
                              setNewSessionTime(`${slot.hour < 10 ? '0' + slot.hour : slot.hour}:00`);
                              setIsAddSessionModalOpen(true);
                            }}
                            className="h-full w-full rounded-md border border-dashed border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-center cursor-pointer group opacity-40 hover:opacity-100"
                            title="Click to schedule PT session"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedSession ? selectedSession.title : 'Session Details'}
        size="md"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  selectedSession.type === 'class'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedSession.type === 'class' ? 'Group Fitness Class' : 'Personal Training'}
              </span>
              <span className="text-xs text-slate-500 font-medium">{selectedSession.time}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Location / Studio:</span>
                <span className="font-semibold text-slate-800">{selectedSession.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Participant Count:</span>
                <span className="font-semibold text-slate-800">
                  {selectedSession.type === 'class'
                    ? `${selectedSession.enrolled} Enrolled (Max ${selectedSession.capacity})`
                    : '1 Athlete (Dedicated)'}
                </span>
              </div>
              {selectedSession.clientName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Athlete:</span>
                  <span className="font-semibold text-emerald-700">{selectedSession.clientName}</span>
                </div>
              )}
              {selectedSession.focus && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Session Focus:</span>
                  <span className="font-semibold text-indigo-700">{selectedSession.focus}</span>
                </div>
              )}
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Overview & Equipment Notes
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {selectedSession.description}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {selectedSession.type === 'pt' && (
                <button
                  type="button"
                  onClick={() => handleCancelSession(selectedSession.id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel Booking
                </button>
              )}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  toast.success(`Check-in initiated for ${selectedSession.title}`);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
              >
                Start Session
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Book PT Session Modal */}
      <Modal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        title="Schedule Personal Training Slot"
        size="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Athlete *
            </label>
            <select
              value={newSessionMemberId}
              onChange={(e) => setNewSessionMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {assignedMembersList.map((m) => {
                const idVal = m._id || m.id;
                return (
                  <option key={idVal} value={idVal}>
                    {m.name} ({m.plan || 'Standard'} Plan)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Day of Week
              </label>
              <select
                value={newSessionDay}
                onChange={(e) => setNewSessionDay(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {weekDays.map((d) => (
                  <option key={d.key} value={d.full}>
                    {d.full} ({d.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <select
                value={newSessionTime}
                onChange={(e) => setNewSessionTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {timeSlots.map((slot) => (
                  <option
                    key={slot.hour}
                    value={`${slot.hour < 10 ? '0' + slot.hour : slot.hour}:00`}
                  >
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Session Objective / Focus Area
            </label>
            <input
              type="text"
              placeholder="e.g. Squat Technique & Core Stability"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSessionModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
