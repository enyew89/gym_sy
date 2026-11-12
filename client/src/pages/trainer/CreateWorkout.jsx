import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { members, workoutPlans } from '../../data/mockData';
import { PageHeader, Modal } from '../../components/ui';
import { workoutsApi, trainerApi } from '../../services/api';
import {
  Dumbbell,
  Plus,
  Trash2,
  Eye,
  Save,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateWorkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trainerId = user?.id || 't1';

  // Filter members assigned to this trainer (or fallback to all active members)
  const myMembers = members.filter((m) => m.trainerId === trainerId);
  const eligibleMembers = myMembers.length > 0 ? myMembers : members;

  // Initial state setup
  const preselectedMember = searchParams.get('memberId') || (eligibleMembers[0]?.id ?? '');

  const [assignedMembersList, setAssignedMembersList] = useState(eligibleMembers);
  const [memberId, setMemberId] = useState(preselectedMember);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await trainerApi.getAssignedMembers();
        if (res.success && res.members?.length > 0) {
          setAssignedMembersList(res.members);
          if (!searchParams.get('memberId')) {
            setMemberId(res.members[0]._id || res.members[0].id);
          }
        }
      } catch (err) {}
    }
    loadMembers();

    // Check for AI-imported plan
    const savedAiPlan = sessionStorage.getItem('ai_imported_plan');
    if (savedAiPlan) {
      try {
        const parsed = JSON.parse(savedAiPlan);
        if (parsed.name) setPlanName(parsed.name);
        if (parsed.days && parsed.days.length > 0) {
          const formattedDays = parsed.days.map((d, dIdx) => ({
            id: `d-ai-${dIdx + 1}`,
            day: d.day,
            focus: d.focus || 'AI Structured Routine',
            exercises: (d.exercises || []).map((ex, exIdx) => ({
              id: `ex-ai-${dIdx}-${exIdx}`,
              name: ex.name,
              sets: String(ex.sets || 3),
              reps: String(ex.reps || '10-12'),
              weight: String(ex.weight || '20kg'),
              rest: String(ex.rest || '60s'),
            })),
          }));
          setDays(formattedDays);
        }
        sessionStorage.removeItem('ai_imported_plan');
        toast.success(`Loaded AI Workout Routine: "${parsed.name}"`);
      } catch (err) {}
    }
  }, []);

  const [planName, setPlanName] = useState('');
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState([
    {
      id: 'd-1',
      day: 'Monday',
      focus: 'Chest & Triceps Hypertrophy',
      exercises: [
        { id: 'ex-1', name: 'Barbell Bench Press', sets: '4', reps: '8-10', weight: '60kg', rest: '90s' },
        { id: 'ex-2', name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', weight: '22kg', rest: '60s' },
        { id: 'ex-3', name: 'Cable Flyes', sets: '3', reps: '12-15', weight: '15kg', rest: '60s' },
        { id: 'ex-4', name: 'Tricep Rope Pushdowns', sets: '3', reps: '12-15', weight: '20kg', rest: '60s' },
      ],
    },
    {
      id: 'd-2',
      day: 'Wednesday',
      focus: 'Back & Biceps Pull',
      exercises: [
        { id: 'ex-5', name: 'Deadlift', sets: '4', reps: '5', weight: '100kg', rest: '150s' },
        { id: 'ex-6', name: 'Lat Pulldowns', sets: '3', reps: '10-12', weight: '50kg', rest: '60s' },
        { id: 'ex-7', name: 'Barbell Bicep Curls', sets: '3', reps: '10-12', weight: '25kg', rest: '60s' },
      ],
    },
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Quick exercise suggestions
  const exerciseSuggestions = [
    'Barbell Bench Press',
    'Barbell Back Squat',
    'Conventional Deadlift',
    'Overhead Barbell Press',
    'Dumbbell Incline Press',
    'Pull-ups / Chin-ups',
    'Barbell Bent-over Row',
    'Romanian Deadlift',
    'Leg Press',
    'Leg Extension',
    'Hamstring Curl',
    'Lateral Raises',
    'Cable Face Pulls',
    'Bicep Dumbbell Curls',
    'Tricep Pushdowns',
    'Plank',
  ];

  // Templates
  const handleApplyTemplate = (type) => {
    if (type === 'ppl') {
      setPlanName('Push / Pull / Legs Hypertrophy');
      setDays([
        {
          id: 'd-1',
          day: 'Day 1 - Push',
          focus: 'Chest, Shoulders & Triceps',
          exercises: [
            { id: 'ex-1', name: 'Barbell Bench Press', sets: '4', reps: '8', weight: '65kg', rest: '90s' },
            { id: 'ex-2', name: 'Overhead Press', sets: '3', reps: '8-10', weight: '40kg', rest: '90s' },
            { id: 'ex-3', name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', weight: '24kg', rest: '60s' },
            { id: 'ex-4', name: 'Tricep Pushdowns', sets: '3', reps: '12-15', weight: '22kg', rest: '60s' },
          ],
        },
        {
          id: 'd-2',
          day: 'Day 2 - Pull',
          focus: 'Back, Rear Delts & Biceps',
          exercises: [
            { id: 'ex-5', name: 'Barbell Bent-over Row', sets: '4', reps: '8', weight: '55kg', rest: '90s' },
            { id: 'ex-6', name: 'Lat Pulldowns', sets: '3', reps: '10-12', weight: '50kg', rest: '60s' },
            { id: 'ex-7', name: 'Face Pulls', sets: '3', reps: '15', weight: '15kg', rest: '60s' },
            { id: 'ex-8', name: 'Barbell Bicep Curls', sets: '3', reps: '10', weight: '25kg', rest: '60s' },
          ],
        },
        {
          id: 'd-3',
          day: 'Day 3 - Legs',
          focus: 'Quads, Hamstrings & Calves',
          exercises: [
            { id: 'ex-9', name: 'Barbell Back Squat', sets: '4', reps: '6-8', weight: '85kg', rest: '120s' },
            { id: 'ex-10', name: 'Romanian Deadlift', sets: '3', reps: '10', weight: '70kg', rest: '90s' },
            { id: 'ex-11', name: 'Leg Press', sets: '3', reps: '12', weight: '130kg', rest: '90s' },
            { id: 'ex-12', name: 'Calf Raises', sets: '4', reps: '15', weight: '40kg', rest: '60s' },
          ],
        },
      ]);
      toast.success('Applied Push / Pull / Legs template');
    } else if (type === 'fatloss') {
      setPlanName('HIIT & Metabolic Conditioning');
      setDays([
        {
          id: 'd-1',
          day: 'Day 1 - Upper HIIT',
          focus: 'High Intensity Upper Circuit',
          exercises: [
            { id: 'ex-1', name: 'Push-ups', sets: '4', reps: '15', weight: 'BW', rest: '30s' },
            { id: 'ex-2', name: 'Dumbbell Clean & Press', sets: '4', reps: '12', weight: '14kg', rest: '45s' },
            { id: 'ex-3', name: 'Battle Ropes', sets: '4', reps: '30s', weight: 'Heavy', rest: '30s' },
          ],
        },
        {
          id: 'd-2',
          day: 'Day 2 - Lower HIIT',
          focus: 'Metabolic Legs & Core',
          exercises: [
            { id: 'ex-4', name: 'Goblet Squats', sets: '4', reps: '15', weight: '20kg', rest: '45s' },
            { id: 'ex-5', name: 'Kettlebell Swings', sets: '4', reps: '20', weight: '16kg', rest: '30s' },
            { id: 'ex-6', name: 'Box Jumps', sets: '3', reps: '12', weight: '24 inch', rest: '45s' },
          ],
        },
      ]);
      toast.success('Applied Metabolic Conditioning template');
    }
  };

  // Day builder handlers
  const handleAddDay = () => {
    const newDayNumber = days.length + 1;
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const suggestedName = dayNames[days.length % 7] || `Day ${newDayNumber}`;

    const newDay = {
      id: `d-${Date.now()}`,
      day: suggestedName,
      focus: 'General Conditioning',
      exercises: [
        { id: `ex-${Date.now()}`, name: '', sets: '3', reps: '10-12', weight: 'Moderate', rest: '60s' },
      ],
    };
    setDays([...days, newDay]);
  };

  const handleRemoveDay = (dayId) => {
    if (days.length <= 1) {
      toast.error('Workout plan must contain at least one day.');
      return;
    }
    setDays(days.filter((d) => d.id !== dayId));
  };

  const handleDayFieldChange = (dayId, field, value) => {
    setDays(
      days.map((d) => (d.id === dayId ? { ...d, [field]: value } : d))
    );
  };

  // Exercise builder handlers
  const handleAddExercise = (dayId) => {
    setDays(
      days.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: [
              ...d.exercises,
              {
                id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: '',
                sets: '3',
                reps: '10-12',
                weight: '20kg',
                rest: '60s',
              },
            ],
          };
        }
        return d;
      })
    );
  };

  const handleRemoveExercise = (dayId, exId) => {
    setDays(
      days.map((d) => {
        if (d.id === dayId) {
          if (d.exercises.length <= 1) {
            toast.error('Each day must have at least one exercise.');
            return d;
          }
          return {
            ...d,
            exercises: d.exercises.filter((ex) => ex.id !== exId),
          };
        }
        return d;
      })
    );
  };

  const handleExerciseChange = (dayId, exId, field, value) => {
    setDays(
      days.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: d.exercises.map((ex) =>
              ex.id === exId ? { ...ex, [field]: value } : ex
            ),
          };
        }
        return d;
      })
    );
  };

  const handleSavePlan = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!memberId) newErrors.memberId = 'Please select a member.';
    if (!planName.trim()) newErrors.planName = 'Please enter a workout plan name.';

    // Validate days
    let hasEmptyExercise = false;
    days.forEach((day) => {
      day.exercises.forEach((ex) => {
        if (!ex.name.trim()) hasEmptyExercise = true;
      });
    });

    if (hasEmptyExercise) {
      toast.error('Please enter a name for all exercises.');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please complete all required fields.');
      return;
    }

    const selectedMember = assignedMembersList.find((m) => (m._id || m.id) === memberId);

    const newPlan = {
      name: planName,
      trainerId: user?.id || user?._id || 't1',
      trainerName: user?.name || 'Coach',
      memberId,
      memberName: selectedMember ? selectedMember.name : 'Athlete',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
      notes,
      days,
    };

    // Save to backend database
    workoutsApi.createWorkout(newPlan)
      .then((res) => {
        if (res?.workout) {
          workoutPlans.unshift(res.workout);
        } else {
          workoutPlans.unshift({ id: `wp-${Date.now()}`, ...newPlan });
        }
      })
      .catch(() => {
        workoutPlans.unshift({ id: `wp-${Date.now()}`, ...newPlan });
      })
      .finally(() => {
        toast.success(`Workout plan "${planName}" assigned to ${newPlan.memberName}!`);
        navigate('/trainer/workouts');
      });
  };

  const selectedMemberObj = assignedMembersList.find((m) => (m._id || m.id) === memberId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header with back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/trainer/workouts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workout Plans
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create Workout Plan</h1>
          <p className="text-sm text-slate-500">
            Construct tailored multi-day routines with progressive overload parameters.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={handleSavePlan}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save & Assign</span>
          </button>
        </div>
      </div>

      {/* Preset Templates Quick Select */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-950">Kickstart with Proven Templates</p>
            <p className="text-[11px] text-emerald-800">
              Load expert split structures and customize sets/reps as needed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyTemplate('ppl')}
            className="px-3 py-1.5 bg-white text-slate-700 hover:text-emerald-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all"
          >
            Push / Pull / Legs
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('fatloss')}
            className="px-3 py-1.5 bg-white text-slate-700 hover:text-emerald-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all"
          >
            Metabolic HIIT
          </button>
        </div>
      </div>

      {/* Primary Plan Information Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-emerald-600" />
          1. Athlete & Plan Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Assigned Athlete *
            </label>
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                setErrors({ ...errors, memberId: '' });
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">-- Choose Member --</option>
              {assignedMembersList.map((m) => {
                const idVal = m._id || m.id;
                return (
                  <option key={idVal} value={idVal}>
                    {m.name} ({m.plan || 'Standard'} Plan - {m.fitnessGoal || m.status || 'Active'})
                  </option>
                );
              })}
            </select>
            {errors.memberId && (
              <p className="text-xs text-rose-600 mt-1">{errors.memberId}</p>
            )}

            {selectedMemberObj && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <span>Goal: <strong className="text-slate-900">{selectedMemberObj.fitnessGoal || 'Strength'}</strong></span>
                <span>Plan: <strong className="text-indigo-600">{selectedMemberObj.plan}</strong></span>
              </div>
            )}
          </div>

          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Plan Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Muscle Building Phase 1, Hypertrophy Meso"
              value={planName}
              onChange={(e) => {
                setPlanName(e.target.value);
                setErrors({ ...errors, planName: '' });
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {errors.planName && (
              <p className="text-xs text-rose-600 mt-1">{errors.planName}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              A distinctive name helps the athlete identify their active training mesocycle.
            </p>
          </div>
        </div>

        {/* Coaching Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Trainer Coaching Notes & Hydration Instructions (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g., Focus on 2-second eccentric control on all compound exercises. Warm up with 5 mins bike and shoulder dislocations."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Dynamic Day Builder Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              2. Weekly Workout Schedule Builder
            </h2>
            <p className="text-xs text-slate-500">
              Configure daily target muscle groups and assign detailed lift sets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddDay}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Training Day
          </button>
        </div>

        {/* Days List */}
        <div className="space-y-6">
          {days.map((dayItem, dIndex) => (
            <div
              key={dayItem.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Day Card Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    D{dIndex + 1}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-w-lg">
                    <input
                      type="text"
                      placeholder="Day Name (e.g. Monday / Day 1)"
                      value={dayItem.day}
                      onChange={(e) => handleDayFieldChange(dayItem.id, 'day', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Focus Area (e.g. Chest & Triceps)"
                      value={dayItem.focus}
                      onChange={(e) => handleDayFieldChange(dayItem.id, 'focus', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleAddExercise(dayItem.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Exercise
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(dayItem.id)}
                    title="Delete Day"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exercises Table / Form Rows */}
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="pb-2 pl-2 w-8">#</th>
                      <th className="pb-2">Exercise Name *</th>
                      <th className="pb-2 w-20 text-center">Sets</th>
                      <th className="pb-2 w-28 text-center">Reps</th>
                      <th className="pb-2 w-28 text-center">Target Weight</th>
                      <th className="pb-2 w-24 text-center">Rest Time</th>
                      <th className="pb-2 w-10 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dayItem.exercises.map((ex, exIndex) => (
                      <tr key={ex.id} className="group hover:bg-slate-50/50">
                        <td className="py-2 pl-2 text-slate-400 font-medium">{exIndex + 1}</td>
                        <td className="py-2 pr-3">
                          <div className="relative">
                            <input
                              type="text"
                              list={`exercise-list-${dayItem.id}-${ex.id}`}
                              placeholder="e.g. Bench Press"
                              value={ex.name}
                              onChange={(e) =>
                                handleExerciseChange(dayItem.id, ex.id, 'name', e.target.value)
                              }
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <datalist id={`exercise-list-${dayItem.id}-${ex.id}`}>
                              {exerciseSuggestions.map((sug, i) => (
                                <option key={i} value={sug} />
                              ))}
                            </datalist>
                          </div>
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="text"
                            placeholder="4"
                            value={ex.sets}
                            onChange={(e) =>
                              handleExerciseChange(dayItem.id, ex.id, 'sets', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="text"
                            placeholder="8-10"
                            value={ex.reps}
                            onChange={(e) =>
                              handleExerciseChange(dayItem.id, ex.id, 'reps', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="text"
                            placeholder="60kg"
                            value={ex.weight}
                            onChange={(e) =>
                              handleExerciseChange(dayItem.id, ex.id, 'weight', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded-md text-xs font-medium text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="text"
                            placeholder="90s"
                            value={ex.rest}
                            onChange={(e) =>
                              handleExerciseChange(dayItem.id, ex.id, 'rest', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 text-right pr-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(dayItem.id, ex.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                            title="Remove Exercise"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>
            {days.length} Days planned with{' '}
            {days.reduce((acc, d) => acc + d.exercises.length, 0)} total exercises.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Review Full Preview
          </button>
          <button
            type="button"
            onClick={handleSavePlan}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Save Workout Plan
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Workout Plan Delivery Preview"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{planName || 'Untitled Workout Plan'}</h3>
              <p className="text-xs text-slate-600 mt-1">
                Athlete: <strong>{selectedMemberObj?.name || 'Unassigned'}</strong> • Assigned by:{' '}
                <strong>{user?.name || 'Kassa Mekonnen'}</strong>
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md">
              Active
            </span>
          </div>

          {notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <strong className="block text-slate-900 mb-0.5">Trainer Notes:</strong>
              {notes}
            </div>
          )}

          <div className="space-y-4">
            {days.map((dayItem, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-100 font-bold text-xs text-slate-800 flex justify-between">
                  <span>
                    {dayItem.day} — Focus: {dayItem.focus}
                  </span>
                  <span className="text-slate-500 font-normal">
                    {dayItem.exercises.length} exercises
                  </span>
                </div>
                <div className="p-3">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-medium">
                        <th className="pb-1.5">Exercise</th>
                        <th className="pb-1.5 text-center">Sets</th>
                        <th className="pb-1.5 text-center">Reps</th>
                        <th className="pb-1.5 text-center">Weight</th>
                        <th className="pb-1.5 text-center">Rest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dayItem.exercises.map((ex, i) => (
                        <tr key={i}>
                          <td className="py-1.5 font-medium text-slate-800">
                            {ex.name || 'Untitled Exercise'}
                          </td>
                          <td className="py-1.5 text-center">{ex.sets}</td>
                          <td className="py-1.5 text-center">{ex.reps}</td>
                          <td className="py-1.5 text-center text-emerald-700 font-semibold">{ex.weight}</td>
                          <td className="py-1.5 text-center text-slate-500">{ex.rest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Back to Editing
            </button>
            <button
              onClick={(e) => {
                setIsPreviewOpen(false);
                handleSavePlan(e);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
            >
              Confirm & Save Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
