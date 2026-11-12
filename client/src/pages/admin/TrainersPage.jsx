import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Dumbbell,
  Users,
  Award,
  Star,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle,
  Clock,
  Sparkles,
  Calendar,
  Activity,
  UserMinus,
  RefreshCw
} from 'lucide-react';
import { staff as initialStaff, members as initialMembers } from '../../data/mockData';
import { PageHeader, StatusBadge, Modal } from '../../components/ui';
import { adminApi } from '../../services/api';

export default function TrainersPage() {
  const [trainersList, setTrainersList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [expandedTrainerId, setExpandedTrainerId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrainerForAssign, setSelectedTrainerForAssign] = useState(null);
  const [selectedMemberIdToAssign, setSelectedMemberIdToAssign] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load real trainers and members from MongoDB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, membersRes] = await Promise.allSettled([
        adminApi.getStaff(),
        adminApi.getMembers(),
      ]);

      if (staffRes.status === 'fulfilled' && staffRes.value?.success && Array.isArray(staffRes.value.staff)) {
        const coaches = staffRes.value.staff.filter((s) => s.role === 'trainer');
        setTrainersList(coaches);
      }
      if (membersRes.status === 'fulfilled' && membersRes.value?.success && Array.isArray(membersRes.value.members)) {
        setMembersList(membersRes.value.members);
      }
    } catch (err) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Performance metrics configuration for trainers
  const trainerPerformance = {
    rating: 4.9,
    weeklySessions: 24,
    retentionRate: '96%',
  };

  const toggleTrainerExpand = (id) => {
    setExpandedTrainerId(expandedTrainerId === id ? null : id);
  };

  // Get members assigned to a specific trainer
  const getAssignedMembers = (trainerId) => {
    return membersList.filter((m) => {
      const tId = m.trainerId?._id || m.trainerId;
      return tId === trainerId || (m.trainerName && m.trainerName === trainerId);
    });
  };

  // Unassigned members for dropdown
  const unassignedMembers = useMemo(() => {
    return membersList.filter((m) => !m.trainerId || m.trainerId === '' || m.trainerId === 'None assigned');
  }, [membersList]);

  // Handle assign member submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberIdToAssign || !selectedTrainerForAssign) {
      toast.error('Please choose a member to assign');
      return;
    }

    try {
      const trainerId = selectedTrainerForAssign._id || selectedTrainerForAssign.id;
      const res = await adminApi.assignTrainer({
        memberId: selectedMemberIdToAssign,
        trainerId,
      });

      const memberName = membersList.find((m) => (m._id || m.id) === selectedMemberIdToAssign)?.name || 'Member';
      toast.success(res.message || `${memberName} assigned to Coach ${selectedTrainerForAssign.name}!`);
      setIsAssignModalOpen(false);
      setSelectedMemberIdToAssign('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign trainer');
    }
  };

  // Handle unassigning member
  const handleUnassign = async (member) => {
    const memberId = member._id || member.id;
    if (!window.confirm(`Remove ${member.name} from this trainer?`)) return;

    try {
      const res = await adminApi.unassignTrainer(memberId);
      toast.success(res.message || `Removed ${member.name} from trainer assignment`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to unassign trainer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Trainer & Athlete Management"
        subtitle="Manage fitness coaches, monitor client rosters, and assign gym members to personal trainers"
        action={
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Overview Metric Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/10 rounded-lg">
                <Dumbbell className="w-5 h-5 text-white" />
              </span>
              <h2 className="text-xl font-bold">Trainer Coaching Staff</h2>
            </div>
            <p className="text-slate-400 text-sm">
              All personal trainers are certified with high member retention scores.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-slate-400 text-xs font-medium">Active Coaches</p>
              <p className="text-2xl font-extrabold text-white">{trainersList.length}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-slate-400 text-xs font-medium">Assigned Clients</p>
              <p className="text-2xl font-extrabold text-white">
                {membersList.filter((m) => m.trainerId && m.trainerId !== 'None assigned').length}
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-slate-400 text-xs font-medium">Avg Satisfaction</p>
              <p className="text-2xl font-extrabold text-white">4.88 ★</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trainers Cards List */}
      <div className="space-y-4">
        {trainersList.map((trainer) => {
          const tId = trainer._id || trainer.id;
          const assigned = getAssignedMembers(tId);
          const isExpanded = expandedTrainerId === tId;

          return (
            <div
              key={tId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
            >
              {/* Trainer Header Card */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 font-bold text-xl flex items-center justify-center flex-shrink-0">
                    {trainer.name ? trainer.name.charAt(0) : 'T'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{trainer.name}</h3>
                      <StatusBadge status={trainer.status || 'active'} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {trainer.specialization || 'Personal Trainer & Conditioning Coach'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {trainer.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {trainer.phone || 'No phone'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedTrainerForAssign(trainer);
                      setIsAssignModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Member
                  </button>

                  <button
                    onClick={() => toggleTrainerExpand(tId)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                    title={isExpanded ? 'Hide Client Roster' : 'View Client Roster'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Client Roster */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between py-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Assigned Athletes ({assigned.length})
                    </h4>
                    <span className="text-xs text-slate-500">Active Personal Training Roster</span>
                  </div>

                  {assigned.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No members currently assigned to {trainer.name}. Click "Assign Member" above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {assigned.map((member) => (
                        <div
                          key={member._id || member.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.plan || 'Standard'} • {member.gender || 'Member'}</p>
                          </div>
                          <button
                            onClick={() => handleUnassign(member)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Unassign Member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign Member Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Member to Coach ${selectedTrainerForAssign?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Choose an unassigned gym member to assign to this coach for personal workout scheduling and progress tracking.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Member *
            </label>
            <select
              value={selectedMemberIdToAssign}
              onChange={(e) => setSelectedMemberIdToAssign(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">-- Choose Member --</option>
              {unassignedMembers.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.name} ({m.plan || 'Standard'} - {m.email})
                </option>
              ))}
            </select>
            {unassignedMembers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">All registered members currently have an assigned coach!</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedMemberIdToAssign}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
