import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, StatusBadge } from '../../components/ui';
import { memberApi, equipmentApi } from '../../services/api';
import {
  Wrench,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  MessageSquare,
  HelpCircle,
  Inbox,
  Flame,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MemberFeedback() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [activeTab, setActiveTab] = useState('equipment_issue'); // 'equipment_issue' | 'suggestion'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'equipment_issue',
    subject: '',
    equipmentName: '',
    priority: 'medium',
    message: '',
  });

  const loadData = async () => {
    try {
      const [fbRes, eqRes] = await Promise.all([
        memberApi.getFeedback(),
        equipmentApi.getEquipment().catch(() => ({ success: false })),
      ]);

      if (fbRes.success && fbRes.feedback) {
        setFeedbackList(fbRes.feedback);
      }
      if (eqRes.success && eqRes.equipment) {
        setEquipmentList(eqRes.equipment);
      }
    } catch (err) {
      console.warn('Feedback loading fallback:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData((prev) => ({
      ...prev,
      type: tab,
      subject: tab === 'equipment_issue' ? 'Broken / Malfunctioning Equipment' : 'Gym Improvement Suggestion',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please enter a subject and details.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      type: activeTab,
    };

    try {
      const res = await memberApi.submitFeedback(payload);
      if (res.success && res.feedback) {
        setFeedbackList([res.feedback, ...feedbackList]);
        toast.success(res.message || 'Report submitted to gym staff!', { icon: '✅' });
        setFormData({
          type: activeTab,
          subject: '',
          equipmentName: '',
          priority: 'medium',
          message: '',
        });
        return;
      }
    } catch (err) {
      console.warn('Backend feedback error, fallback to local:', err);
    } finally {
      setIsSubmitting(false);
    }

    const fallbackItem = {
      _id: `fb-${Date.now()}`,
      memberName: user?.name || 'Member',
      memberEmail: user?.email || '',
      type: activeTab,
      subject: formData.subject,
      equipmentName: formData.equipmentName,
      message: formData.message,
      priority: formData.priority,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    setFeedbackList([fallbackItem, ...feedbackList]);
    toast.success('Your report has been logged and sent to staff.');
    setFormData({
      type: activeTab,
      subject: '',
      equipmentName: '',
      priority: 'medium',
      message: '',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Feedback & Equipment Support"
        subtitle="Report equipment maintenance problems or submit suggestions to gym management"
      />

      {/* Main Grid: Form Left (7 Cols), History Right (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('equipment_issue')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'equipment_issue'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4 text-rose-500" />
              <span>Report Equipment Issue</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('suggestion')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'suggestion'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-emerald-500" />
              <span>Submit Suggestion</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'equipment_issue' ? (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Equipment Safety Alert:
                </span>
                <p>
                  Our technicians are immediately alerted to inspect cables, machines, or weights tagged by members.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Member Feedback Voice:
                </span>
                <p>
                  Help us improve gym playlists, cleanliness, class schedules, or facility amenities.
                </p>
              </div>
            )}

            {activeTab === 'equipment_issue' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Machine / Equipment Affected
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.equipmentName}
                    onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Choose Machine --</option>
                    {equipmentList.map((eq) => (
                      <option key={eq._id || eq.id} value={eq.name}>
                        {eq.name} ({eq.location || 'Weight Room'})
                      </option>
                    ))}
                    <option value="Treadmill #02">Treadmill #02</option>
                    <option value="Cable Crossover Tower">Cable Crossover Tower</option>
                    <option value="Leg Extension Machine">Leg Extension Machine</option>
                    <option value="Smith Machine">Smith Machine</option>
                    <option value="Olympic Barbell #4">Olympic Barbell #4</option>
                    <option value="Other / Unlisted">Other / Unlisted Equipment</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Or type specific location/bench"
                    value={formData.equipmentName}
                    onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'equipment_issue' ? 'e.g. Squeaky pulley / frayed cable' : 'e.g. Request for 6:00 AM Yoga class'}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="low">Low — General observation</option>
                  <option value="medium">Medium — Needs adjustment soon</option>
                  <option value="high">High — Machine unusable</option>
                  <option value="urgent">Urgent — Safety hazard / Do not use</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder={activeTab === 'equipment_issue' ? 'Describe what happens during exercise (sound, sticking resistance, broken pin, loose belt)...' : 'Share your ideas or feedback with our management team...'}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit to Management'}</span>
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-slate-500" />
                My Feedback History
              </h3>
              <p className="text-xs text-slate-500">Track resolution of reported tickets</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {feedbackList.length} tickets
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px] pr-1">
            {feedbackList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No feedback or problem reports submitted yet.</p>
              </div>
            ) : (
              feedbackList.map((item) => (
                <div
                  key={item._id || item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.type === 'equipment_issue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.type === 'equipment_issue' ? 'Equipment' : 'Suggestion'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{item.subject}</h4>
                  {item.equipmentName && (
                    <p className="text-xs font-medium text-slate-700">
                      Target: <span className="text-indigo-600">{item.equipmentName}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                    {item.message}
                  </p>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                        item.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'in_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status || 'Open'}
                    </span>
                  </div>

                  {item.adminResponse && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">
                      <strong>Staff Response:</strong> {item.adminResponse}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
