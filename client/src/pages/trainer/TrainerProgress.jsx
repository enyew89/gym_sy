import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { members as mockMembers, progressData as mockProgress } from '../../data/mockData';
import { PageHeader, StatCard, Modal } from '../../components/ui';
import { progressApi, trainerApi } from '../../services/api';
import {
  TrendingUp,
  Dumbbell,
  Scale,
  Calendar,
  Plus,
  FileText,
  User,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
  ArrowUpRight,
  ClipboardCheck,
  Sliders,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrainerProgress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const trainerId = user?.id || user?._id || 't1';

  // Members state
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // New log form state
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    arms: '',
    benchPress: '',
    squat: '',
    deadlift: '',
    notes: '',
  });

  // Trainer notes state
  const [trainerNotes, setTrainerNotes] = useState([]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'General',
    adjustmentSuggested: '',
  });
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // 1. Fetch assigned members on mount
  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await trainerApi.getAssignedMembers();
        if (res.success && Array.isArray(res.members)) {
          setAssignedMembers(res.members);
          if (res.members.length > 0) {
            const firstId = res.members[0]._id || res.members[0].id;
            setSelectedMemberId(firstId);
          }
        }
      } catch (err) {
        console.error('Failed to load assigned members:', err);
      }
    }
    loadMembers();
  }, []);

  // 2. Load progress & notes whenever selectedMemberId changes
  useEffect(() => {
    if (!selectedMemberId) return;

    async function loadMemberData() {
      setIsLoadingProgress(true);
      try {
        // Fetch progress records
        const pRes = await progressApi.getProgress(selectedMemberId);
        if (pRes.success && Array.isArray(pRes.progress)) {
          setHistory(pRes.progress);
        } else {
          setHistory([]);
        }

        // Fetch coaching notes
        const nRes = await trainerApi.getNotes(selectedMemberId);
        if (nRes.success && nRes.notes?.length > 0) {
          setTrainerNotes(nRes.notes);
        }
      } catch (err) {
        console.error('Failed loading member data:', err);
      } finally {
        setIsLoadingProgress(false);
      }
    }

    loadMemberData();
  }, [selectedMemberId]);

  const selectedMember = assignedMembers.find(
    (m) => (m._id || m.id) === selectedMemberId
  ) || assignedMembers[0] || {};

  const latestStats = history[history.length - 1] || {};
  const firstStats = history[0] || {};

  const weightDelta = (Number(latestStats.weight || 0) - Number(firstStats.weight || 0)).toFixed(1);
  const fatDelta = (Number(latestStats.bodyFat || 0) - Number(firstStats.bodyFat || 0)).toFixed(1);
  const totalLifts = (Number(latestStats.benchPress || 0) + Number(latestStats.squat || 0) + Number(latestStats.deadlift || 0));
  const initialLifts = (Number(firstStats.benchPress || 0) + Number(firstStats.squat || 0) + Number(firstStats.deadlift || 0));
  const strengthGain = totalLifts - initialLifts;

  // Add Progress Assessment
  const handleAddLog = async (e) => {
    e.preventDefault();
    const entry = {
      memberId: selectedMemberId,
      date: newLog.date,
      weight: parseFloat(newLog.weight),
      bodyFat: parseFloat(newLog.bodyFat) || 0,
      chest: parseFloat(newLog.chest) || 0,
      waist: parseFloat(newLog.waist) || 0,
      arms: parseFloat(newLog.arms) || 0,
      benchPress: parseFloat(newLog.benchPress) || 0,
      squat: parseFloat(newLog.squat) || 0,
      deadlift: parseFloat(newLog.deadlift) || 0,
      notes: newLog.notes || '',
    };

    try {
      const res = await progressApi.logProgress(entry);
      if (res.success && res.progress) {
        setHistory([...history, res.progress]);
      } else {
        setHistory([...history, entry]);
      }
      setIsLogModalOpen(false);
      toast.success('Member progress assessment logged successfully!');
    } catch (err) {
      setHistory([...history, entry]);
      setIsLogModalOpen(false);
      toast.success('Assessment logged locally!');
    }
  };

  // Add Coaching Observation Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error('Please enter a note title and observation content.');
      return;
    }

    const payload = {
      memberId: selectedMemberId,
      memberName: selectedMember?.name || 'Athlete',
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      category: newNote.category,
      adjustmentSuggested: newNote.adjustmentSuggested.trim(),
    };

    try {
      const res = await trainerApi.createNote(payload);
      if (res.success && res.note) {
        setTrainerNotes([res.note, ...trainerNotes]);
      } else {
        setTrainerNotes([
          {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            trainerName: user?.name || 'Coach',
            ...payload,
          },
          ...trainerNotes,
        ]);
      }
      setNewNote({ title: '', content: '', category: 'General', adjustmentSuggested: '' });
      setIsNoteModalOpen(false);
      toast.success('Coaching observation recorded!');
    } catch (err) {
      setTrainerNotes([
        {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          trainerName: user?.name || 'Coach',
          ...payload,
        },
        ...trainerNotes,
      ]);
      setNewNote({ title: '', content: '', category: 'General', adjustmentSuggested: '' });
      setIsNoteModalOpen(false);
      toast.success('Note saved successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Client Progress & Analytics"
        subtitle="Review physical evaluations, compound strength milestones, and clinical coaching notes"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg text-sm font-medium shadow-xs transition"
            >
              <FileText className="w-4 h-4 text-zinc-500" />
              Add Progress Note
            </button>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Log Assessment
            </button>
          </div>
        }
      />

      {/* Member Selector Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 font-semibold flex items-center justify-center border border-zinc-200 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Selected Athlete</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="font-bold text-zinc-900 text-base bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
              >
                {assignedMembers.length === 0 ? (
                  <option value="">No members assigned yet</option>
                ) : (
                  assignedMembers.map((m) => {
                    const mId = m._id || m.id;
                    return (
                      <option key={mId} value={mId}>
                        {m.name} — {m.plan || 'Standard'} Plan ({m.fitnessGoal || 'Strength & Conditioning'})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
            <span className="text-zinc-500 text-xs">Primary Goal: </span>
            <span className="font-semibold text-zinc-900 text-xs sm:text-sm">
              {selectedMember.fitnessGoal || 'Muscle Hypertrophy & Strength'}
            </span>
          </div>
          <Link
            to={`/trainer/workouts/create?memberId=${selectedMemberId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            Adjust Workout Plan
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Weight"
          value={`${latestStats.weight || 0} kg`}
          subtitle={`${Number(weightDelta) > 0 ? '+' : ''}${weightDelta} kg since start`}
          icon={Scale}
          trend={`${Math.abs(weightDelta)} kg`}
          trendUp={Number(weightDelta) < 0}
          color="primary"
        />
        <StatCard
          title="Body Fat Ratio"
          value={`${latestStats.bodyFat || 0}%`}
          subtitle={`${fatDelta}% total shift`}
          icon={Flame}
          trend={`${Math.abs(fatDelta)}%`}
          trendUp={Number(fatDelta) < 0}
          color="primary"
        />
        <StatCard
          title="3-Lift Total"
          value={`${totalLifts} kg`}
          subtitle={`Squat + Bench + Deadlift`}
          icon={Dumbbell}
          trend={`+${strengthGain} kg`}
          trendUp={strengthGain >= 0}
          color="primary"
        />
        <StatCard
          title="Workout Adherence"
          value="94%"
          subtitle="24 of 26 sessions completed"
          icon={ClipboardCheck}
          trend="Consistent"
          trendUp={true}
          color="primary"
        />
      </div>

      {/* Historical Measurements Table & Coaching Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table - 2 Columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900">Biometric & Performance Records</h3>
              <p className="text-xs text-zinc-500">Chronological physical evaluations & compound 1RMs</p>
            </div>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Weight</th>
                  <th className="px-4 py-3 font-semibold">Body Fat</th>
                  <th className="px-4 py-3 font-semibold">Chest</th>
                  <th className="px-4 py-3 font-semibold">Waist</th>
                  <th className="px-4 py-3 font-semibold">Arms</th>
                  <th className="px-4 py-3 font-semibold">Bench</th>
                  <th className="px-4 py-3 font-semibold">Squat</th>
                  <th className="px-4 py-3 font-semibold">Deadlift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-400 text-sm">
                      No assessment records found for this member. Click &quot;Log Assessment&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  history.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition">
                      <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {row.date}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{row.weight} kg</td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{row.bodyFat}%</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{row.chest || '-'} cm</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{row.waist || '-'} cm</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{row.arms || '-'} cm</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{row.benchPress || 0} kg</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{row.squat || 0} kg</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{row.deadlift || 0} kg</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trainer Progress Notes */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
            <div>
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-900" />
                Coaching Observations
              </h3>
              <p className="text-xs text-zinc-500">Observations & routine adjustments</p>
            </div>
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-900"
              title="Add Progress Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {trainerNotes.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                No coaching observations recorded yet.
              </div>
            ) : (
              trainerNotes.map((note) => (
                <div key={note.id || note._id} className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-white">
                      {note.category}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {note.date ? note.date.split('T')[0] : 'Recent'}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-900">{note.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{note.content}</p>

                  {note.adjustmentSuggested && (
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-800">
                      <span className="font-semibold block mb-0.5">Recommended Adjustment:</span>
                      {note.adjustmentSuggested}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>By {note.trainerName || note.author || 'Trainer'}</span>
                    <Link
                      to={`/trainer/workouts/create?memberId=${selectedMemberId}`}
                      className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" /> Adjust Routine
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Log Assessment */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={`Log Fitness & Strength Assessment for ${selectedMember?.name || 'Athlete'}`}
        size="lg"
      >
        <form onSubmit={handleAddLog} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Evaluation Date</label>
              <input
                type="date"
                required
                value={newLog.date}
                onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Body Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={newLog.weight}
                onChange={(e) => setNewLog({ ...newLog, weight: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                value={newLog.bodyFat}
                onChange={(e) => setNewLog({ ...newLog, bodyFat: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Circumference (cm)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Chest</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLog.chest}
                  onChange={(e) => setNewLog({ ...newLog, chest: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Waist</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLog.waist}
                  onChange={(e) => setNewLog({ ...newLog, waist: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Arms</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLog.arms}
                  onChange={(e) => setNewLog({ ...newLog, arms: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Tested 1RM Strength (kg)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Bench Press</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLog.benchPress}
                  onChange={(e) => setNewLog({ ...newLog, benchPress: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Back Squat</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLog.squat}
                  onChange={(e) => setNewLog({ ...newLog, squat: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Deadlift</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLog.deadlift}
                  onChange={(e) => setNewLog({ ...newLog, deadlift: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium shadow-xs"
            >
              Save Assessment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Progress Note */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={`Add Coaching Observation Note for ${selectedMember?.name || 'Athlete'}`}
        size="md"
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Category</label>
            <select
              value={newNote.category}
              onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white text-zinc-900"
            >
              <option value="General">General Observation</option>
              <option value="Technique">Technique / Form Correction</option>
              <option value="Milestone">Milestone Achieved</option>
              <option value="Recovery">Recovery & Fatigue</option>
              <option value="Injury Prevention">Injury Prevention & Mobility</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Subject / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Squat bar path correction"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Observation Details *</label>
            <textarea
              rows={3}
              required
              placeholder="Record cues, changes in workload, fatigue levels, or instructions for next session..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              Adjust Workout Plan (Actionable Recommendation)
            </label>
            <input
              type="text"
              placeholder="e.g. Deload deadlifts by 10% and add 3 sets of pause squats"
              value={newNote.adjustmentSuggested}
              onChange={(e) => setNewNote({ ...newNote, adjustmentSuggested: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Provides the reason and direction for adjusting the athlete&apos;s workout plan.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium shadow-xs"
            >
              Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
