import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { members as defaultMembers } from '../../data/mockData';
import { PageHeader, SearchBar, StatusBadge, Modal } from '../../components/ui';
import { trainerApi, messagesApi } from '../../services/api';
import {
  Users,
  Dumbbell,
  AlertTriangle,
  Mail,
  Phone,
  Target,
  Clock,
  TrendingUp,
  Edit,
  Activity,
  Calendar,
  CheckCircle,
  FileText,
  UserCheck,
  MessageSquare,
  Send,
  Eye,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrainerMembers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Message form state
  const [messageForm, setMessageForm] = useState({
    type: 'instruction',
    subject: '',
    content: '',
  });

  // Load assigned members from backend
  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const res = await trainerApi.getAssignedMembers();
      if (res.success && Array.isArray(res.members)) {
        setAssignedMembers(res.members);
      }
    } catch (err) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Stats
  const totalAssigned = assignedMembers.length;
  const activeCount = assignedMembers.filter((m) => m.status === 'active').length;
  const expiredCount = assignedMembers.filter((m) => m.status === 'expired' || m.status === 'inactive').length;

  // Search & Filter
  const filteredMembers = assignedMembers.filter((m) => {
    const name = m.name || '';
    const email = m.email || '';
    const goal = m.fitnessGoal || '';
    const plan = m.plan || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenMessageModal = (member) => {
    setSelectedMember(member);
    setMessageForm({
      type: 'instruction',
      subject: `Training Instruction for ${member.name}`,
      content: '',
    });
    setIsMessageModalOpen(true);
  };

  const handleSendMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageForm.content.trim()) {
      toast.error('Please enter your message or instruction');
      return;
    }

    try {
      const memberId = selectedMember._id || selectedMember.id;
      await messagesApi.sendMessage({
        recipientId: memberId,
        recipientName: selectedMember.name,
        type: messageForm.type,
        subject: messageForm.subject,
        content: messageForm.content,
      });

      toast.success(`${messageForm.type.charAt(0).toUpperCase() + messageForm.type.slice(1)} sent to ${selectedMember.name}!`);
      setIsMessageModalOpen(false);
      setMessageForm({ type: 'instruction', subject: '', content: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Assigned Athletes & Fitness Goals"
        subtitle="Manage your personal training roster, view member fitness milestones, and assign customized workout plans"
        action={
          <div className="flex gap-2">
            <button
              onClick={loadMembers}
              className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/trainer/workouts/create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
            >
              <Dumbbell className="w-4 h-4" />
              Assign New Workout
            </button>
          </div>
        }
      />

      {/* Member Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Assigned Athletes</p>
            <p className="text-2xl font-bold text-zinc-900">{totalAssigned}</p>
            <p className="text-xs text-zinc-500">Under direct personal coaching</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Subscriptions</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-zinc-500">In good standing and active</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Needs Attention</p>
            <p className="text-2xl font-bold text-amber-600">{expiredCount}</p>
            <p className="text-xs text-zinc-500">Expired subscription or inactive</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchBar
        placeholder="Search athletes by name, email, fitness goal, or plan..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      >
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Members</option>
            <option value="expired">Expired Memberships</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </SearchBar>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member._id || member.id}
            className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:border-zinc-300 transition-colors flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white font-bold text-base flex items-center justify-center shrink-0">
                    {member.name ? member.name.charAt(0) : 'M'}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">{member.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {member.gender || 'Athlete'} • {member.age || 25} yrs • {member.plan || 'Standard'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={member.status || 'active'} />
              </div>

              {/* Fitness Goal Highlight */}
              <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                  <Target className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Target Fitness Goal:</span>
                </div>
                <p className="text-sm font-bold text-zinc-900 pl-5">
                  {member.fitnessGoal || 'General Strength & Hypertrophy'}
                </p>
              </div>

              {/* Details List */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{member.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Assigned Routine: <strong>{member.activeWorkoutPlan || 'PPL Split Routine'}</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedMember(member);
                  setIsDetailModalOpen(true);
                }}
                className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> View Goals
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenMessageModal(member)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  title="Send instructions, reminders, or feedback"
                >
                  <MessageSquare className="w-3 h-3" /> Message
                </button>
                <button
                  onClick={() => navigate(`/trainer/workouts/create?memberId=${member._id || member.id}`)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                >
                  <Dumbbell className="w-3 h-3" /> Assign Workout
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Member Goals & Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Athlete Fitness Goals & Profile"
        size="md"
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white font-bold text-xl flex items-center justify-center">
                {selectedMember.name ? selectedMember.name.charAt(0) : 'M'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{selectedMember.name}</h3>
                <p className="text-xs text-zinc-500">{selectedMember.email} • {selectedMember.phone || 'No phone'}</p>
                <div className="mt-1">
                  <StatusBadge status={selectedMember.status || 'active'} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                <Target className="w-4 h-4 text-zinc-900" /> Primary Fitness Goal
              </div>
              <p className="text-base font-extrabold text-zinc-900">
                {selectedMember.fitnessGoal || 'General Strength & Hypertrophy'}
              </p>
              <p className="text-xs text-zinc-500">
                Focused on progressive overload, compound lift biomechanics, and body recomposition.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-zinc-200">
                <span className="text-zinc-400">Membership Tier</span>
                <p className="font-semibold text-zinc-900 mt-0.5">{selectedMember.plan || 'Standard'}</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200">
                <span className="text-zinc-400">Assigned Routine</span>
                <p className="font-semibold text-zinc-900 mt-0.5">{selectedMember.activeWorkoutPlan || 'Active Split'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate(`/trainer/progress?memberId=${selectedMember._id || selectedMember.id}`);
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" /> View Progress History
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenMessageModal(selectedMember);
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Send Instructions
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Message / Instruction / Reminder Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`Send Communication to ${selectedMember?.name || 'Athlete'}`}
        size="md"
      >
        <form onSubmit={handleSendMessageSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Communication Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'instruction', label: 'Instruction' },
                { type: 'reminder', label: 'Reminder' },
                { type: 'feedback', label: 'Feedback' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setMessageForm({ ...messageForm, type: opt.type })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    messageForm.type === opt.type
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={messageForm.subject}
              onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
              placeholder="e.g. Form adjustment on Bench Press"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Message Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={messageForm.content}
              onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
              placeholder="Write workout instructions, nutrition advice, session reminder, or form feedback..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsMessageModalOpen(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send Message
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
