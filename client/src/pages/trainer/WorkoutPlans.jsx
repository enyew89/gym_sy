import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workoutPlans as initialPlans } from '../../data/mockData';
import { PageHeader, SearchBar, StatusBadge } from '../../components/ui';
import { workoutsApi } from '../../services/api';
import {
  ClipboardList,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Trash2,
  Printer,
  Copy,
  Layers,
  Flame,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkoutPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPlanIds, setExpandedPlanIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load plans from backend
  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await workoutsApi.getWorkouts();
      if (res.success && Array.isArray(res.workoutPlans)) {
        setPlans(res.workoutPlans);
        if (res.workoutPlans[0]) {
          setExpandedPlanIds([res.workoutPlans[0]._id || res.workoutPlans[0].id]);
        }
      }
    } catch (err) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Search and filter
  const filteredPlans = plans.filter((plan) => {
    const name = plan.name || '';
    const memberName = plan.memberName || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : (plan.status || 'active').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (planId) => {
    setExpandedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleExpandAll = () => {
    if (expandedPlanIds.length === filteredPlans.length) {
      setExpandedPlanIds([]);
    } else {
      setExpandedPlanIds(filteredPlans.map((p) => p._id || p.id));
    }
  };

  const handleDuplicatePlan = async (e, plan) => {
    e.stopPropagation();
    try {
      const clonedData = {
        name: `${plan.name} (Copy)`,
        memberId: plan.memberId || '',
        memberName: plan.memberName || 'Athlete',
        days: plan.days || [],
        notes: plan.notes || '',
      };

      const res = await workoutsApi.createWorkout(clonedData);
      toast.success(`Plan duplicated as "${clonedData.name}"`);
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to duplicate plan');
    }
  };

  const handleDeletePlan = async (e, plan) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete workout routine "${plan.name}"?`)) {
      return;
    }

    try {
      const id = plan._id || plan.id;
      await workoutsApi.deleteWorkout(id);
      toast.success(`Workout plan "${plan.name}" deleted successfully`);
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan');
    }
  };

  const handlePrint = (e, plan) => {
    e.stopPropagation();
    toast.success(`Preparing print sheet for ${plan.name}...`);
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Workout Plans & Routine Splits"
        subtitle="Design, oversee, and assign multi-day exercise mesocycles to personal training athletes."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadPlans}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExpandAll}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              {expandedPlanIds.length === filteredPlans.length ? 'Collapse All' : 'Expand All'}
            </button>
            <Link
              to="/trainer/workouts/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Workout Routine</span>
            </Link>
          </div>
        }
      />

      {/* Search and Filter */}
      <SearchBar
        placeholder="Search workout plans by title, muscle focus, or athlete name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      >
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Plans</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </SearchBar>

      {/* Plans List */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => {
          const planId = plan._id || plan.id;
          const isExpanded = expandedPlanIds.includes(planId);
          const totalExercises = (plan.days || []).reduce(
            (acc, curr) => acc + (curr.exercises ? curr.exercises.length : 0),
            0
          );

          return (
            <div
              key={planId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Header Accordion */}
              <div
                onClick={() => toggleExpand(planId)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                      <StatusBadge status={plan.status || 'active'} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Assigned: {plan.memberName || 'Unassigned'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {(plan.days || []).length} Days Split
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Created: {plan.createdDate || 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => handleDuplicatePlan(e, plan)}
                    className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title="Duplicate Template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handlePrint(e, plan)}
                    className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title="Print Routine Sheet"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeletePlan(e, plan)}
                    className="p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
                    title="Delete Workout Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1.5 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                  {plan.notes && (
                    <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                      <strong className="text-slate-900">Coach's Guidance:</strong> {plan.notes}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(plan.days || []).map((day, idx) => (
                      <div
                        key={day._id || day.id || idx}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                      >
                        <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
                          <span>{day.day}</span>
                          <span className="text-zinc-300 font-normal">{day.focus}</span>
                        </div>

                        <div className="p-3 divide-y divide-slate-100">
                          {(day.exercises || []).map((ex, exIdx) => (
                            <div key={ex._id || ex.id || exIdx} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-slate-900">{ex.name}</p>
                                <p className="text-[11px] text-slate-400">Rest: {ex.rest || '60s'}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-800">
                                  {ex.sets} sets × {ex.reps} reps
                                </span>
                                <p className="text-[11px] text-slate-500 font-medium">Load: {ex.weight || 'BW'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
