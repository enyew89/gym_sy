import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Users,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  Flame,
  Dumbbell,
  ChevronRight,
  Filter,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { PageHeader, Modal, StatusBadge } from '../../components/ui';
import { classes as mockClasses, members as mockMembers } from '../../data/mockData';
import { receptionistApi } from '../../services/api';

export default function ClassBookings() {
  const [classList, setClassList] = useState(mockClasses);
  const [membersList, setMembersList] = useState([]);
  const [selectedClassForBooking, setSelectedClassForBooking] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [rosterModalClass, setRosterModalClass] = useState(null);
  const [filterRoom, setFilterRoom] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [clsRes, memRes] = await Promise.all([
          receptionistApi.getClasses(),
          receptionistApi.getMembers(),
        ]);
        if (clsRes.success && Array.isArray(clsRes.classes) && clsRes.classes.length > 0) {
          setClassList(clsRes.classes);
        }
        if (memRes.success && Array.isArray(memRes.members)) {
          setMembersList(memRes.members);
        }
      } catch (err) {}
    }
    loadData();
  }, []);

  // Enrolled rosters for viewing class rosters
  const [classRosters, setClassRosters] = useState({});

  const handleOpenBookingModal = (classItem) => {
    setSelectedClassForBooking(classItem);
    setSelectedMemberId('');
    setBookingNotes('');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please select a member to book');
      return;
    }

    const member = membersList.find((m) => (m._id || m.id) === selectedMemberId);
    if (!member) return;

    if (member.status === 'expired') {
      toast.error(`Cannot book: ${member.name}'s membership is expired! Please renew first.`);
      return;
    }

    // Check if Basic plan has access
    if (member.plan === 'Basic') {
      toast.error(`${member.name} has Basic plan. Group classes require Standard or Premium plan.`, {
        icon: '⚠️',
      });
      return;
    }

    const classId = selectedClassForBooking._id || selectedClassForBooking.id;

    try {
      const res = await receptionistApi.bookClass(classId, member._id || member.id, bookingNotes);
      if (res.success) {
        toast.success(`Booked ${member.name} into ${selectedClassForBooking.name}!`, {
          icon: '🎉',
        });
        // Update local class count
        setClassList((prev) =>
          prev.map((c) =>
            (c._id || c.id) === classId
              ? { ...c, enrolled: Math.min(c.capacity, (c.enrolled || 0) + 1) }
              : c
          )
        );
        setClassRosters((prev) => ({
          ...prev,
          [classId]: [...(prev[classId] || []), member.name],
        }));
        setSelectedClassForBooking(null);
        return;
      }
    } catch (err) {
      if (err.message) {
        toast.error(err.message);
        return;
      }
    }

    // Increment enrolled count fallback
    setClassList((prev) =>
      prev.map((c) =>
        (c._id || c.id) === classId
          ? { ...c, enrolled: Math.min(c.capacity, (c.enrolled || 0) + 1) }
          : c
      )
    );

    // Add to roster
    setClassRosters((prev) => ({
      ...prev,
      [classId]: [
        ...(prev[classId] || []),
        member.name,
      ],
    }));

    toast.success(`Booked ${member.name} into ${selectedClassForBooking.name}!`, {
      icon: '🎉',
    });

    setSelectedClassForBooking(null);
  };

  // Filtered classes by room
  const filteredClasses = classList.filter(
    (c) => filterRoom === 'all' || c.room.toLowerCase().includes(filterRoom.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Group Class Schedule & Bookings"
        subtitle="Manage member enrollments, view session capacity, and assist walk-in attendees"
        action={
          <button
            onClick={() => handleOpenBookingModal(classList[0])}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Book for Member</span>
          </button>
        }
      />

      {/* Today's Schedule Timeline Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Today's Session Timeline (Sunday, Oct 18)
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            5 Classes Scheduled Today
          </span>
        </div>

        {/* Timeline visualization cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {classList.map((c, index) => {
            const isFull = c.enrolled >= c.capacity;
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-primary-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-1">
                    <span>{c.time.split(' - ')[0]}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-sans ${
                        isFull
                          ? 'bg-rose-100 text-rose-700 font-bold'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isFull ? 'Full' : 'Open'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate">{c.name}</h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.room}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Coach {c.trainerName.split(' ')[0]}</span>
                  <span className="font-semibold text-slate-700">
                    {c.enrolled}/{c.capacity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Class Grid Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Available Group Classes</h3>
          <p className="text-xs text-slate-500">
            Select a class below to check remaining slots or enroll a member.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Room:</span>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Studio Rooms</option>
            <option value="Studio A">Studio A (Yoga & Dance)</option>
            <option value="Main Floor">Main Floor (HIIT)</option>
            <option value="Weight Room">Weight Room</option>
            <option value="Boxing Ring">Boxing Ring</option>
          </select>
        </div>
      </div>

      {/* Available Classes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((item) => {
          const isFull = item.enrolled >= item.capacity;
          const spotsRemaining = item.capacity - item.enrolled;
          const fillPercentage = Math.round((item.enrolled / item.capacity) * 100);

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {item.schedule}
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg mt-1">{item.name}</h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      isFull
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : spotsRemaining <= 3
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isFull ? 'FULL' : `${spotsRemaining} spots left`}
                  </span>
                </div>

                {/* Trainer & Room info */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      {item.trainerName.charAt(0)}
                    </div>
                    <span>
                      Trainer: <strong className="text-slate-800">{item.trainerName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{item.time}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{item.room}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Capacity Occupancy</span>
                    <span className="font-bold text-slate-800">
                      {item.enrolled} / {item.capacity} ({fillPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        fillPercentage >= 100
                          ? 'bg-rose-500'
                          : fillPercentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRosterModalClass(item)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex-1"
                >
                  View Roster ({item.enrolled})
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBookingModal(item)}
                  disabled={isFull}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 ${
                    isFull
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isFull ? 'Full' : 'Book Spot'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Book for Member Modal */}
      <Modal
        isOpen={Boolean(selectedClassForBooking)}
        onClose={() => setSelectedClassForBooking(null)}
        title="Book Member into Class"
        size="md"
      >
        {selectedClassForBooking && (
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {/* Selected class banner */}
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
                  Target Class
                </span>
                <h4 className="font-bold text-slate-900 text-base">
                  {selectedClassForBooking.name}
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedClassForBooking.schedule} • {selectedClassForBooking.time} ({selectedClassForBooking.room})
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-primary-700 bg-white px-2.5 py-1 rounded-lg border border-primary-200 shadow-2xs">
                  {selectedClassForBooking.capacity - selectedClassForBooking.enrolled} slots open
                </span>
              </div>
            </div>

            {/* Member selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Member to Enroll <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">-- Choose member --</option>
                {membersList.map((m) => {
                  const mId = m._id || m.id;
                  return (
                    <option key={mId} value={mId}>
                      {m.name} — {m.plan || 'Standard'} Plan ({(m.status || 'active').toUpperCase()})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Eligibility Note */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" /> Plan Eligibility:
              </p>
              <p>
                Standard and Premium membership plans include free admission to all group classes.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Booking / Attendance Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. First time attending, requested front row spot"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClassForBooking(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-bold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Reservation</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Class Roster Modal */}
      <Modal
        isOpen={Boolean(rosterModalClass)}
        onClose={() => setRosterModalClass(null)}
        title={`Class Roster — ${rosterModalClass?.name}`}
        size="md"
      >
        {rosterModalClass && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span>Trainer: {rosterModalClass.trainerName}</span>
              <span>
                Enrolled: {rosterModalClass.enrolled} / {rosterModalClass.capacity}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(classRosters[rosterModalClass.id] || []).map((name, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px]">
                      {name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setRosterModalClass(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
