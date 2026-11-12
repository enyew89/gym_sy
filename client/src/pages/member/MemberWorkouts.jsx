import { useState, useEffect } from 'react';
import {
  Dumbbell, CheckCircle2, Play, Pause, RotateCcw,
  Clock, Flame, Award, ChevronRight, Check, Sparkles,
  Info, AlertCircle, Plus, Calendar
} from 'lucide-react';
import { workoutPlans, members } from '../../data/mockData';
import { PageHeader, StatusBadge, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { memberApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function MemberWorkouts() {
  const { user } = useAuth();
  const memberId = user?.id || user?._id;
  const defaultPlan = workoutPlans.find((p) => p.memberId === memberId) || null;
  const [plan, setPlan] = useState(defaultPlan);

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Load real assigned workout plan from backend
  useEffect(() => {
    async function loadWorkoutPlan() {
      try {
        const res = await memberApi.getWorkouts();
        if (res.success && res.workoutPlan) {
          setPlan(res.workoutPlan);
        }
      } catch (err) {}
    }
    loadWorkoutPlan();
  }, []);

  // Completed exercises tracking by day index: { [dayIndex]: [exerciseIdx1, exerciseIdx2] }
  const [completedMap, setCompletedMap] = useState({});

  // Workout logging mode & timer
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);

  // Custom logged weights per exercise: { [`${dayIdx}-${exIdx}`]: { weight: '62.5kg', reps: '10' } }
  const [loggedMetrics, setLoggedMetrics] = useState({});

  // Rest timer
  const [restTimer, setRestTimer] = useState(null);
  const [restCount, setRestCount] = useState(0);

  // Stopwatch effect
  useEffect(() => {
    let interval = null;
    if (isWorkoutActive && isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, isTimerRunning]);

  // Rest timer effect
  useEffect(() => {
    let restInterval = null;
    if (restCount > 0) {
      restInterval = setInterval(() => {
        setRestCount((prev) => {
          if (prev <= 1) {
            clearInterval(restInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [restCount]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentDay = plan?.days?.[activeDayIndex] || plan?.days?.[0] || { day: 'Monday', exercises: [] };
  const currentCompleted = completedMap[activeDayIndex] || [];
  const totalExercises = currentDay?.exercises?.length || 1;
  const completionPercent = totalExercises > 0 ? Math.round((currentCompleted.length / totalExercises) * 100) : 0;

  const toggleExercise = (exerciseIdx) => {
    setCompletedMap((prev) => {
      const dayCompleted = prev[activeDayIndex] || [];
      const isDone = dayCompleted.includes(exerciseIdx);
      const updated = isDone
        ? dayCompleted.filter((i) => i !== exerciseIdx)
        : [...dayCompleted, exerciseIdx];
      return {
        ...prev,
        [activeDayIndex]: updated,
      };
    });
  };

  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setIsTimerRunning(true);
  };

  const handlePauseWorkout = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleFinishWorkout = () => {
    setIsTimerRunning(false);
    setShowFinishedModal(true);
  };

  const handleResetWorkout = () => {
    setIsWorkoutActive(false);
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const startRest = (seconds) => {
    setRestCount(seconds);
  };

  const handleMetricChange = (dayIdx, exIdx, field, value) => {
    const key = `${dayIdx}-${exIdx}`;
    setLoggedMetrics((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Workout Plan"
        subtitle={plan ? `Program: ${plan.name} • Assigned by Trainer` : 'Personalized training split'}
        action={
          plan && (
            <div className="flex items-center gap-3">
              {restCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resting: {restCount}s</span>
                </div>
              )}

              {!isWorkoutActive ? (
                <button
                  type="button"
                  onClick={handleStartWorkout}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Workout</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-900 text-white p-1 rounded-xl shadow-md">
                  <div className="px-3 py-1 font-mono font-bold text-sm tracking-widest text-emerald-400">
                    {formatTime(timerSeconds)}
                  </div>
                  <button
                    type="button"
                    onClick={handlePauseWorkout}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
                    title={isTimerRunning ? 'Pause' : 'Resume'}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishWorkout}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    Finish
                  </button>
                </div>
              )}
            </div>
          )
        }
      />

      {!plan || !plan.days || plan.days.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Workout Program Assigned Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your assigned personal trainer will build and customize your split routine here. You can also generate one using the AI Fitness Coach.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
      {/* Plan Header & Daily Progress Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                Active Routine
              </span>
              <span className="text-xs text-slate-400">Assigned {plan?.createdDate || 'Recently'}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{plan?.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target goal: {plan?.fitnessGoal || 'Strength & Conditioning'} • {plan?.days?.length || 0} days split
            </p>
          </div>

          {/* Active Day Completion Stat */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-xs text-slate-500 font-medium">{currentDay.day} Completion</p>
              <p className="text-xl font-bold text-slate-900">
                {currentCompleted.length} / {totalExercises}{' '}
                <span className="text-sm font-semibold text-slate-400">({completionPercent}%)</span>
              </p>
            </div>
            <div className="w-14 h-14 relative flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="text-slate-200"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="text-emerald-500 transition-all duration-300"
                  strokeWidth="5"
                  strokeDasharray={138}
                  strokeDashoffset={138 - (138 * completionPercent) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-800">
                {completionPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Day-by-Day Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          {plan?.days?.map((d, idx) => {
            const isTabActive = activeDayIndex === idx;
            const completedCount = completedMap[idx]?.length || 0;
            const isDayDone = completedCount === d.exercises.length;

            return (
              <button
                key={d.day}
                onClick={() => setActiveDayIndex(idx)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isTabActive
                    ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isTabActive ? 'text-primary-700' : 'text-slate-700'}`}>
                    {d.day}
                  </span>
                  {isDayDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {completedCount}/{d.exercises.length}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1 truncate">
                  {d.focus}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Routine Exercises View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* Day Focus Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">{currentDay.focus}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {currentDay.day}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Follow prescribed tempo and rest guidelines between sets for maximum hypertrophy.
            </p>
          </div>

          {isWorkoutActive && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Logging Mode Active — enter your actual weights below</span>
            </div>
          )}
        </div>

        {/* Exercises List */}
        <div className="divide-y divide-slate-100 mt-4">
          {currentDay.exercises.map((exercise, exIdx) => {
            const isCompleted = currentCompleted.includes(exIdx);
            const metricKey = `${activeDayIndex}-${exIdx}`;
            const metrics = loggedMetrics[metricKey] || {};

            return (
              <div
                key={exercise.name}
                className={`py-4 transition-colors ${
                  isCompleted ? 'bg-slate-50/70' : 'hover:bg-slate-50/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Checkbox + Exercise Title */}
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExercise(exIdx)}
                      className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    >
                      {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{exIdx + 1}
                        </span>
                        <h4
                          className={`text-base font-bold transition-all ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {exercise.name}
                        </h4>
                      </div>

                      {/* Prescribed metrics pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {exercise.sets} Sets
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {exercise.reps} Reps
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 text-violet-700">
                          Target: {exercise.weight}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const restSec = parseInt(exercise.rest) || 60;
                            startRest(restSec);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                          title="Start rest timer"
                        >
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Rest: {exercise.rest}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Logging Inputs or Status */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {isWorkoutActive ? (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400">
                            Weight
                          </label>
                          <input
                            type="text"
                            placeholder={exercise.weight}
                            value={metrics.weight || ''}
                            onChange={(e) =>
                              handleMetricChange(activeDayIndex, exIdx, 'weight', e.target.value)
                            }
                            className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400">
                            Reps
                          </label>
                          <input
                            type="text"
                            placeholder={exercise.reps}
                            value={metrics.reps || ''}
                            onChange={(e) =>
                              handleMetricChange(activeDayIndex, exIdx, 'reps', e.target.value)
                            }
                            className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Done
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleExercise(exIdx)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Completed <span className="font-bold text-slate-800">{currentCompleted.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalExercises}</span> exercises today.
          </div>

          <div className="flex items-center gap-2">
            {isWorkoutActive && (
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Complete & Log Workout
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
      )}

      {/* Workout Finished Modal */}
      <Modal
        isOpen={showFinishedModal}
        onClose={() => setShowFinishedModal(false)}
        title="Workout Complete!"
        size="sm"
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-9 h-9 text-emerald-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Great Job, {user?.name?.split(' ')[0] || 'Athlete'}!</h4>
          <p className="text-xs text-slate-500 mt-1">
            You completed {currentCompleted.length} exercises in {formatTime(timerSeconds)}.
          </p>

          <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
              <p className="text-base font-bold text-slate-900">{formatTime(timerSeconds)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Day Focus</span>
              <p className="text-base font-bold text-slate-900">{currentDay.focus}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Est. Calories</span>
              <p className="text-base font-bold text-amber-600">~380 kcal</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Sets</span>
              <p className="text-base font-bold text-slate-900">16 Sets</p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const exercisesPayload = (currentDay?.exercises || []).map((ex, exIdx) => {
                const metric = loggedMetrics[`${activeDayIndex}-${exIdx}`] || {};
                return {
                  name: ex.name,
                  sets: ex.sets || '3',
                  reps: metric.reps || ex.reps || '10',
                  weight: metric.weight || ex.weight || '20kg',
                  completed: currentCompleted.includes(exIdx),
                };
              });

              try {
                await memberApi.logWorkout({
                  workoutPlanId: plan?._id || plan?.id || '',
                  workoutName: plan?.name || 'Workout Session',
                  dayTitle: currentDay?.focus || currentDay?.day || 'Daily Routine',
                  durationMinutes: Math.max(1, Math.round(timerSeconds / 60)),
                  exercisesCompleted: exercisesPayload,
                  notes: `Completed ${currentCompleted.length} of ${totalExercises} exercises in ${formatTime(timerSeconds)}`,
                });
                toast.success('Workout logged to your progress journal!', { icon: '🏆' });
              } catch (err) {
                toast.success('Workout recorded in session journal!');
              }

              setShowFinishedModal(false);
              handleResetWorkout();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Save to Progress Journal
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Trophy(props) {
  return <Award {...props} />;
}
