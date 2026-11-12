import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Check,
  Sparkles,
  Users,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  Shield,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { plans as initialPlans } from '../../data/mockData';
import { PageHeader, Modal, StatusBadge } from '../../components/ui';
import { plansApi, adminApi } from '../../services/api';

export default function PlansPage() {
  const [plansList, setPlansList] = useState([]);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'renewals'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [renewalsList, setRenewalsList] = useState([]);
  const [isLoadingRenewals, setIsLoadingRenewals] = useState(false);

  // Load plans from MongoDB
  const loadPlans = async () => {
    try {
      const res = await plansApi.getPlans();
      if (res.success && Array.isArray(res.plans)) {
        setPlansList(res.plans);
      }
    } catch (err) {
      // Fallback
    }
  };

  // Load renewals from MongoDB
  const loadRenewals = async () => {
    setIsLoadingRenewals(true);
    try {
      const res = await adminApi.getRenewals();
      if (res.success && res.renewals) {
        setRenewalsList(res.renewals);
      }
    } catch (err) {
      // Fallback
    } finally {
      setIsLoadingRenewals(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadRenewals();
  }, []);

  // Form state for Create Plan
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency: 'ETB',
    durationDays: 30,
    features: 'Gym access\nLocker usage\nShower access',
    color: 'blue',
    isPopular: false,
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please enter plan name and price');
      return;
    }

    try {
      const res = await plansApi.createPlan({
        name: formData.name,
        price: Number(formData.price),
        currency: 'ETB',
        durationDays: Number(formData.durationDays) || 30,
        features: formData.features,
        color: formData.color,
        isPopular: formData.isPopular,
      });

      toast.success(res.message || `Plan "${formData.name}" created successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        price: '',
        currency: 'ETB',
        durationDays: 30,
        features: 'Gym access\nLocker usage\nShower access',
        color: 'blue',
        isPopular: false,
      });
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to create plan');
    }
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlanForEdit({
      _id: plan._id || plan.id,
      id: plan._id || plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency || 'ETB',
      durationDays: plan.durationDays || plan.duration || 30,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || '',
      color: plan.color || 'blue',
      isPopular: !!plan.isPopular,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanForEdit?.name || selectedPlanForEdit?.price === undefined) {
      toast.error('Please enter plan name and price');
      return;
    }

    try {
      const id = selectedPlanForEdit._id || selectedPlanForEdit.id;
      await plansApi.updatePlan(id, {
        name: selectedPlanForEdit.name,
        price: Number(selectedPlanForEdit.price),
        currency: selectedPlanForEdit.currency,
        durationDays: Number(selectedPlanForEdit.durationDays),
        features: selectedPlanForEdit.features,
        color: selectedPlanForEdit.color,
        isPopular: selectedPlanForEdit.isPopular,
      });

      toast.success(`Plan "${selectedPlanForEdit.name}" updated successfully!`);
      setIsEditModalOpen(false);
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete plan "${plan.name}"?`)) {
      return;
    }

    try {
      const id = plan._id || plan.id || plan.planId;
      await plansApi.deletePlan(id);
      toast.success(`Plan "${plan.name}" deleted successfully`);
      loadPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan');
    }
  };

  const handleRenewMember = async (member) => {
    try {
      const id = member._id || member.id;
      const res = await adminApi.renewMember(id, {
        plan: member.plan || 'Standard',
        durationDays: member.plan?.toLowerCase().includes('annual') ? 365 : 30,
      });
      toast.success(res.message || `Membership for ${member.name} renewed!`);
      loadRenewals();
    } catch (err) {
      toast.error(err.message || 'Failed to renew membership');
    }
  };

  const getColorClasses = (color, isPopular) => {
    if (isPopular) {
      return {
        cardBorder: 'border-2 border-slate-900 shadow-lg relative',
        badge: 'bg-slate-900 text-white',
        priceColor: 'text-slate-900',
        button: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
        accentBg: 'bg-slate-50',
      };
    }

    switch (color) {
      case 'amber':
        return {
          cardBorder: 'border border-amber-200 shadow-sm hover:border-amber-300',
          badge: 'bg-amber-100 text-amber-800',
          priceColor: 'text-amber-700',
          button: 'bg-slate-900 hover:bg-slate-800 text-white',
          accentBg: 'bg-amber-50',
        };
      case 'emerald':
        return {
          cardBorder: 'border border-emerald-200 shadow-sm hover:border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800',
          priceColor: 'text-emerald-600',
          button: 'bg-slate-900 hover:bg-slate-800 text-white',
          accentBg: 'bg-emerald-50',
        };
      default:
        return {
          cardBorder: 'border border-slate-200 shadow-sm hover:border-slate-300',
          badge: 'bg-blue-100 text-blue-800',
          priceColor: 'text-slate-900',
          button: 'bg-slate-900 hover:bg-slate-800 text-white',
          accentBg: 'bg-blue-50',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Membership & Subscription Management"
        subtitle="Create packages, configure pricing tiers, and manage upcoming member renewals"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pricing Plans ({plansList.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('renewals');
            loadRenewals();
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'renewals'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Manage Renewals ({renewalsList.length})
        </button>
      </div>

      {activeTab === 'plans' ? (
        /* Grid of Pricing Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {plansList.map((plan) => {
            const isPopular = plan.isPopular || plan.name?.toLowerCase().includes('premium');
            const style = getColorClasses(plan.color, isPopular);
            const duration = plan.durationDays || plan.duration || 30;

            return (
              <div
                key={plan._id || plan.id || plan.planId}
                className={`bg-white rounded-2xl flex flex-col justify-between p-6 transition-all duration-200 ${style.cardBorder}`}
              >
                {/* Highlight badge for Popular */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Featured Tier
                  </div>
                )}

                <div>
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {duration >= 365 ? '12 Months Annual Pass' : `${duration} Days Membership`}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                      {duration >= 365 ? 'Annual' : 'Monthly'}
                    </span>
                  </div>

                  {/* Price Display */}
                  <div className="my-5 pb-5 border-b border-slate-100 flex items-baseline gap-1.5">
                    <span className={`text-4xl font-extrabold tracking-tight ${style.priceColor}`}>
                      {Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      {plan.currency || 'ETB'} / {duration >= 365 ? 'year' : 'month'}
                    </span>
                  </div>

                  {/* Active Subscribers */}
                  <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      Active Members: <strong className="text-slate-900">{plan.activeSubscribers || plan.memberCount || 0}</strong>
                    </span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Features Included</p>
                    <ul className="space-y-2.5 text-sm text-slate-600">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Set Price & Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Renewals Management Tab */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Expiring & Expired Subscriptions</h2>
              <p className="text-xs text-slate-500">Monitor members approaching expiration or past due, and execute one-click plan renewal</p>
            </div>
            <button
              onClick={loadRenewals}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isLoadingRenewals ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading renewals...</div>
          ) : renewalsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All member subscriptions are currently active and up to date!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {renewalsList.map((m) => (
                <div key={m._id || m.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">
                      {m.name ? m.name.charAt(0) : 'M'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.email} • {m.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {m.plan || 'Standard'}
                      </span>
                      <p className={`text-xs mt-1 font-medium ${m.status === 'expired' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {m.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRenewMember(m)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renew 30 Days
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Membership Plan"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Student Flex Pass"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Price (ETB) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1500"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Days)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                placeholder="30"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Color Theme</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="blue">Blue / Slate</option>
                <option value="emerald">Emerald Green</option>
                <option value="amber">Amber Gold</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs font-medium text-slate-700">Mark as Featured Tier</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Features (One per line)
            </label>
            <textarea
              rows={4}
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="Gym floor access&#10;Locker usage&#10;Shower facilities"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              Create Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Plan Configuration & Pricing"
        size="md"
      >
        {selectedPlanForEdit && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Plan Name</label>
              <input
                type="text"
                required
                value={selectedPlanForEdit.name}
                onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Price (ETB)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={selectedPlanForEdit.price}
                  onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, price: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={selectedPlanForEdit.durationDays}
                  onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, durationDays: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Color Theme</label>
                <select
                  value={selectedPlanForEdit.color}
                  onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, color: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="blue">Blue / Slate</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="amber">Amber Gold</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlanForEdit.isPopular}
                    onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, isPopular: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-medium text-slate-700">Featured Tier</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Features (One per line)</label>
              <textarea
                rows={4}
                value={selectedPlanForEdit.features}
                onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, features: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
