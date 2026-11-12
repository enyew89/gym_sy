import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Modal, StatusBadge } from '../../components/ui';
import { messagesApi, trainerApi } from '../../services/api';
import {
  MessageSquare,
  Send,
  Bell,
  CheckCircle,
  Clock,
  Trash2,
  Plus,
  User,
  Filter,
  Sparkles,
  Inbox,
  SendHorizontal,
  MailCheck,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrainerCommunication() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | instruction | reminder | feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose form
  const [composeForm, setComposeForm] = useState({
    recipientId: '',
    type: 'instruction',
    subject: '',
    content: '',
  });

  // Load messages and assigned members
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [msgRes, memRes] = await Promise.all([
        messagesApi.getMessages(),
        trainerApi.getAssignedMembers(),
      ]);

      if (msgRes.success) {
        setMessages(msgRes.messages || []);
      }
      if (memRes.success && memRes.members?.length > 0) {
        setAssignedMembers(memRes.members);
        setComposeForm((prev) => ({
          ...prev,
          recipientId: memRes.members[0]._id || memRes.members[0].id,
        }));
      }
    } catch (err) {
      console.error('Error fetching communications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick message template filler
  const handleApplyTemplate = (type) => {
    if (type === 'instruction') {
      setComposeForm((prev) => ({
        ...prev,
        type: 'instruction',
        subject: 'Workout Instruction: Progressive Overload This Week',
        content: 'Hi! For this week’s sessions, remember to focus on a 3-second eccentric tempo on all squat and bench press working sets. Keep your core braced before each repetition.',
      }));
    } else if (type === 'reminder') {
      setComposeForm((prev) => ({
        ...prev,
        type: 'reminder',
        subject: 'Session Reminder: Tomorrow at 10:00 AM',
        content: 'Reminder that we have our 1-on-1 personal training session scheduled for tomorrow. Please hydrate well and aim for 7-8 hours of sleep tonight.',
      }));
    } else if (type === 'feedback') {
      setComposeForm((prev) => ({
        ...prev,
        type: 'feedback',
        subject: 'Post-Workout Feedback & Recovery Plan',
        content: 'Excellent effort on your deadlift sets today! Your hip hinge was much cleaner. Spend 10 minutes stretching hamstrings and foam rolling your lower back tonight.',
      }));
    }
  };

  // Submit send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeForm.subject.trim() || !composeForm.content.trim()) {
      toast.error('Please enter a subject and message content.');
      return;
    }

    const recipient = assignedMembers.find(
      (m) => (m._id || m.id) === composeForm.recipientId
    );

    const payload = {
      recipientId: composeForm.recipientId,
      recipientName: recipient?.name || 'Athlete',
      type: composeForm.type,
      subject: composeForm.subject.trim(),
      content: composeForm.content.trim(),
    };

    try {
      const res = await messagesApi.sendMessage(payload);
      if (res.success && res.message) {
        setMessages([res.message, ...messages]);
      } else {
        setMessages([
          {
            _id: `msg-${Date.now()}`,
            senderName: user?.name || 'Coach',
            senderRole: 'trainer',
            recipientName: recipient?.name || 'Athlete',
            createdAt: new Date().toISOString(),
            isRead: false,
            ...payload,
          },
          ...messages,
        ]);
      }
      toast.success(`${composeForm.type.toUpperCase()} sent to ${payload.recipientName}!`);
      setIsComposeOpen(false);
      setComposeForm({
        recipientId: assignedMembers[0]?._id || assignedMembers[0]?.id || '',
        type: 'instruction',
        subject: '',
        content: '',
      });
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  // Delete message
  const handleDelete = async (id) => {
    try {
      await messagesApi.deleteMessage(id);
      setMessages(messages.filter((m) => (m._id || m.id) !== id));
      toast.success('Message deleted.');
    } catch (err) {
      setMessages(messages.filter((m) => (m._id || m.id) !== id));
      toast.success('Message removed.');
    }
  };

  // Mark read
  const handleMarkRead = async (id) => {
    try {
      await messagesApi.markAsRead(id);
      setMessages(
        messages.map((m) =>
          (m._id || m.id) === id ? { ...m, isRead: true } : m
        )
      );
    } catch (err) {}
  };

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'all') return true;
    return m.type === activeTab;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'instruction':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Instruction
          </span>
        );
      case 'reminder':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Reminder
          </span>
        );
      case 'feedback':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Feedback
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            General
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Trainer Communication Center"
        subtitle="Dispatch structured workout instructions, schedule reminders, and progress feedback to athletes"
        action={
          <button
            onClick={() => setIsComposeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send Communication</span>
          </button>
        }
      />

      {/* Filter Tabs and Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Messages ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('instruction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'instruction'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Instructions ({messages.filter((m) => m.type === 'instruction').length})
          </button>
          <button
            onClick={() => setActiveTab('reminder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reminder'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Reminders ({messages.filter((m) => m.type === 'reminder').length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'feedback'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Feedback ({messages.filter((m) => m.type === 'feedback').length})
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <MailCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time delivery to athlete member portal</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-500" />
            Communication Log
          </h3>
          <span className="text-xs text-slate-400">
            Showing {filteredMessages.length} communication entries
          </span>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600">No communication entries in this category.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Send Communication&quot; to dispatch workout instructions, reminders, or feedback.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMessages.map((msg) => {
              const msgId = msg._id || msg.id;
              const dateStr = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Just now';

              return (
                <div
                  key={msgId}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(msg.type)}
                      <span className="text-xs font-semibold text-slate-900">
                        To: {msg.recipientName || 'Athlete'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                      {msg.isRead && (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Read
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {msg.subject}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {msg.content}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDelete(msgId)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Communication Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Send Communication to Athlete"
        size="lg"
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          {/* Quick Template Fillers */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Quick Communication Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyTemplate('instruction')}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-blue-400 text-blue-700 rounded-md font-medium transition"
              >
                + Workout Instruction
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('reminder')}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-amber-400 text-amber-700 rounded-md font-medium transition"
              >
                + Session Reminder
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('feedback')}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-emerald-400 text-emerald-700 rounded-md font-medium transition"
              >
                + Form Feedback
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Recipient (Assigned Athlete) *
              </label>
              <select
                value={composeForm.recipientId}
                onChange={(e) =>
                  setComposeForm({ ...composeForm, recipientId: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {assignedMembers.map((m) => {
                  const mId = m._id || m.id;
                  return (
                    <option key={mId} value={mId}>
                      {m.name} ({m.plan || 'Standard'} Plan)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Communication Category *
              </label>
              <select
                value={composeForm.type}
                onChange={(e) =>
                  setComposeForm({ ...composeForm, type: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="instruction">Workout Instruction</option>
                <option value="reminder">Training Reminder</option>
                <option value="feedback">Coaching Feedback</option>
                <option value="general">General Message</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Squat bar path correction & mobility cues"
              value={composeForm.subject}
              onChange={(e) =>
                setComposeForm({ ...composeForm, subject: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Message Content *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Type your instruction, reminder, or post-session feedback here..."
              value={composeForm.content}
              onChange={(e) =>
                setComposeForm({ ...composeForm, content: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
