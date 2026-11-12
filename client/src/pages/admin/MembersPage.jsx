import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Dumbbell,
  Shield,
  Eye,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { members as initialMembers, staff as initialStaff, plans as initialPlans } from '../../data/mockData';
import { PageHeader, SearchBar, DataTable, StatusBadge, Modal } from '../../components/ui';
import { adminApi, plansApi } from '../../services/api';

export default function MembersPage() {
  const [membersList, setMembersList] = useState([]);
  const [trainersList, setTrainersList] = useState(initialStaff.filter((s) => s.role === 'trainer'));
  const [availablePlans, setAvailablePlans] = useState(initialPlans);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Load members, trainers, plans from MongoDB
  const loadData = async () => {
    try {
      const [membersRes, staffRes, plansRes] = await Promise.allSettled([
        adminApi.getMembers(),
        adminApi.getStaff(),
        plansApi.getPlans(),
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value?.success && Array.isArray(membersRes.value.members)) {
        setMembersList(membersRes.value.members);
      }
      if (staffRes.status === 'fulfilled' && staffRes.value?.success && Array.isArray(staffRes.value.staff)) {
        setTrainersList(staffRes.value.staff.filter((s) => s.role === 'trainer'));
      }
      if (plansRes.status === 'fulfilled' && plansRes.value?.success && Array.isArray(plansRes.value.plans)) {
        setAvailablePlans(plansRes.value.plans);
      }
    } catch (err) {
      // Keep fallbacks
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    age: '25',
    plan: 'Standard',
    trainerId: '',
    status: 'active',
    password: 'password123',
  });

  // Filtered members
  const filteredMembers = useMemo(() => {
    return membersList.filter((m) => {
      const name = m.name || '';
      const email = m.email || '';
      const phone = m.phone || '';

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [membersList, searchQuery, statusFilter]);

  // Dynamic stats calculation
  const stats = useMemo(() => {
    const total = membersList.length;
    const active = membersList.filter((m) => m.status === 'active').length;
    const expired = membersList.filter((m) => m.status === 'expired').length;
    const inactive = membersList.filter((m) => m.status === 'inactive' || m.status === 'suspended').length;
    return { total, active, expired, inactive };
  }, [membersList]);

  // Handle register member
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) {
      toast.error('Please enter Member Name and Email');
      return;
    }

    try {
      const res = await adminApi.createMember({
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        gender: newMember.gender,
        age: Number(newMember.age) || 25,
        plan: newMember.plan,
        trainerId: newMember.trainerId || null,
        status: newMember.status,
        password: newMember.password || 'password123',
      });

      toast.success(res.message || `Member "${newMember.name}" registered successfully!`);
      setIsAddModalOpen(false);
      setNewMember({
        name: '',
        email: '',
        phone: '',
        gender: 'Male',
        age: '25',
        plan: 'Standard',
        trainerId: '',
        status: 'active',
        password: 'password123',
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to register member');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (member) => {
    setEditingMember({
      _id: member._id || member.id,
      id: member._id || member.id,
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || 'Male',
      age: member.age || 25,
      plan: member.plan || 'Standard',
      trainerId: member.trainerId?._id || member.trainerId || '',
      status: member.status || 'active',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember.name) {
      toast.error('Name is required');
      return;
    }

    try {
      const id = editingMember._id || editingMember.id;
      await adminApi.updateMember(id, {
        name: editingMember.name,
        phone: editingMember.phone,
        gender: editingMember.gender,
        age: Number(editingMember.age),
        plan: editingMember.plan,
        trainerId: editingMember.trainerId || null,
        status: editingMember.status,
      });

      toast.success(`Member "${editingMember.name}" updated successfully!`);
      setIsEditModalOpen(false);
      if (selectedMember && (selectedMember._id === id || selectedMember.id === id)) {
        setSelectedMember(null);
      }
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update member');
    }
  };

  // Toggle Member Status (Active / Inactive)
  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      const id = member._id || member.id;
      await adminApi.updateMemberStatus(id, newStatus);
      toast.success(`Member status set to "${newStatus}"`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update member status');
    }
  };

  // Renew Member
  const handleRenewMember = async (member) => {
    try {
      const id = member._id || member.id;
      const res = await adminApi.renewMember(id, {
        plan: member.plan || 'Standard',
        durationDays: member.plan?.toLowerCase().includes('annual') ? 365 : 30,
      });
      toast.success(res.message || `Membership for ${member.name} renewed!`);
      setSelectedMember(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to renew membership');
    }
  };

  // Delete Member
  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to delete member "${member.name}"?`)) {
      return;
    }
    try {
      const id = member._id || member.id;
      await adminApi.deleteMember(id);
      toast.success(`Member "${member.name}" deleted successfully`);
      if (selectedMember && (selectedMember._id === id || selectedMember.id === id)) {
        setSelectedMember(null);
      }
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete member');
    }
  };

  const getTrainerName = (row) => {
    if (row.trainerName && row.trainerName !== 'None assigned') return row.trainerName;
    if (row.trainerId?.name) return row.trainerId.name;
    const t = trainersList.find((tr) => (tr._id || tr.id) === row.trainerId);
    return t ? t.name : 'None assigned';
  };

  const formatExpiry = (dateVal) => {
    if (!dateVal) return 'N/A';
    if (typeof dateVal === 'string' && dateVal.length <= 10) return dateVal;
    try {
      return new Date(dateVal).toISOString().split('T')[0];
    } catch {
      return 'N/A';
    }
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 font-semibold flex items-center justify-center text-sm flex-shrink-0">
            {row.name ? row.name.charAt(0) : 'M'}
          </div>
          <div>
            <p className="font-medium text-slate-900 hover:text-slate-700 transition-colors">{row.name}</p>
            <p className="text-xs text-slate-400">{row.gender || 'Member'}, {row.age || 25} yrs</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-slate-700">{row.email}</p>
          <p className="text-xs text-slate-400">{row.phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          row.plan === 'Premium' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          row.plan === 'Standard' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
          'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          {row.plan || 'Standard'}
        </span>
      ),
    },
    {
      key: 'trainer',
      label: 'Assigned Trainer',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {getTrainerName(row)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'expiryDate',
      label: 'Expiry Date',
      render: (row) => (
        <span className={`text-xs font-medium ${row.status === 'expired' ? 'text-rose-600' : 'text-slate-600'}`}>
          {formatExpiry(row.planExpiryDate || row.expiryDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMember(row);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Member"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'active'
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMember(row);
            }}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Member Management"
        subtitle={`Directory of all gym members (${membersList.length} total registered)`}
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Register Member
          </button>
        }
      />

      {/* Stats Summary Above Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Members</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Subscriptions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.active}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expired Memberships</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.expired}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inactive / Suspended</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.inactive}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchBar
        placeholder="Search member by name, email, or phone..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      >
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </SearchBar>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        onRowClick={(row) => setSelectedMember(row)}
      />

      {/* Member Details Modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Member Details"
        size="md"
      >
        {selectedMember && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 font-bold text-xl flex items-center justify-center">
                {selectedMember.name ? selectedMember.name.charAt(0) : 'M'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedMember.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedMember.status} />
                  <span className="text-xs text-slate-500">ID: {selectedMember._id || selectedMember.id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Email Address</p>
                  <p className="font-medium text-slate-800">{selectedMember.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Phone Number</p>
                  <p className="font-medium text-slate-800">{selectedMember.phone || 'None'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Current Plan</p>
                  <p className="font-medium text-slate-800">{selectedMember.plan || 'Standard'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Expiry Date</p>
                  <p className="font-medium text-slate-800">
                    {formatExpiry(selectedMember.planExpiryDate || selectedMember.expiryDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Dumbbell className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Assigned Coach</p>
                  <p className="font-medium text-slate-800">{getTrainerName(selectedMember)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Age & Gender</p>
                  <p className="font-medium text-slate-800">{selectedMember.gender || 'Male'}, {selectedMember.age || 25} yrs</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  handleOpenEdit(selectedMember);
                  setSelectedMember(null);
                }}
                className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Member
              </button>
              <button
                onClick={() => handleRenewMember(selectedMember)}
                className="px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Renew Plan
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(selectedMember);
                  setSelectedMember(null);
                }}
                className="px-3.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Power className="w-3.5 h-3.5" />
                {selectedMember.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setSelectedMember(null)}
                className="ml-auto px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Gym Member"
        size="lg"
      >
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="e.g. Almaz Ayana"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="almaz@email.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder="+251 911 234 567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={newMember.gender}
                onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="14"
                max="90"
                value={newMember.age}
                onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Membership Plan</label>
              <select
                value={newMember.plan}
                onChange={(e) => setNewMember({ ...newMember, plan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
              >
                {availablePlans.map((p) => (
                  <option key={p.planId || p.id || p.name} value={p.name}>
                    {p.name} ({p.price} ETB)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assign Trainer (Optional)</label>
              <select
                value={newMember.trainerId}
                onChange={(e) => setNewMember({ ...newMember, trainerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
              >
                <option value="">-- No Trainer Assigned --</option>
                {trainersList.map((tr) => (
                  <option key={tr._id || tr.id} value={tr._id || tr.id}>
                    {tr.name} ({tr.specialization || 'Coach'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Default Password</label>
            <input
              type="text"
              value={newMember.password}
              onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Register Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Member Profile"
        size="lg"
      >
        {editingMember && (
          <form onSubmit={handleEditMemberSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={editingMember.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={editingMember.gender}
                  onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min="14"
                  max="90"
                  value={editingMember.age}
                  onChange={(e) => setEditingMember({ ...editingMember, age: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subscription Plan</label>
                <select
                  value={editingMember.plan}
                  onChange={(e) => setEditingMember({ ...editingMember, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                >
                  {availablePlans.map((p) => (
                    <option key={p.planId || p.id || p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Trainer</label>
                <select
                  value={editingMember.trainerId}
                  onChange={(e) => setEditingMember({ ...editingMember, trainerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                >
                  <option value="">-- No Trainer Assigned --</option>
                  {trainersList.map((tr) => (
                    <option key={tr._id || tr.id} value={tr._id || tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editingMember.status}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
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
