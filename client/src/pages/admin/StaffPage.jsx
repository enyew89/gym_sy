import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Users,
  Dumbbell,
  Shield,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Power,
  Briefcase
} from 'lucide-react';
import { staff as initialStaff } from '../../data/mockData';
import { PageHeader, DataTable, StatusBadge, Modal } from '../../components/ui';
import { adminApi } from '../../services/api';

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | trainer | receptionist | admin
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Load real staff from backend
  const loadStaff = async () => {
    try {
      const res = await adminApi.getStaff();
      if (res.success && Array.isArray(res.staff)) {
        setStaffList(res.staff);
      }
    } catch (err) {
      // Keep fallback
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // Add staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'trainer',
    specialization: '',
    certifications: '',
    password: 'password123',
    status: 'active',
  });

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (activeTab === 'all') return staffList;
    return staffList.filter((s) => s.role === activeTab);
  }, [staffList, activeTab]);

  // Counts for tabs and stats
  const stats = useMemo(() => {
    const total = staffList.length;
    const trainers = staffList.filter((s) => s.role === 'trainer').length;
    const receptionists = staffList.filter((s) => s.role === 'receptionist').length;
    const active = staffList.filter((s) => s.status === 'active').length;
    return { total, trainers, receptionists, active };
  }, [staffList]);

  // Handle Add Staff
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.phone) {
      toast.error('Please fill in required fields (Name, Email, Phone)');
      return;
    }

    try {
      const res = await adminApi.createStaff({
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        specialization: newStaff.specialization,
        certifications: newStaff.certifications,
        password: newStaff.password || 'password123',
        status: newStaff.status,
      });

      toast.success(res.message || `Staff member "${newStaff.name}" added successfully!`);
      setIsAddModalOpen(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        role: 'trainer',
        specialization: '',
        certifications: '',
        password: 'password123',
        status: 'active',
      });
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to create staff account');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (staffMember) => {
    setEditingStaff({
      _id: staffMember._id || staffMember.id,
      id: staffMember._id || staffMember.id,
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role,
      specialization: staffMember.specialization || '',
      certifications: Array.isArray(staffMember.certifications)
        ? staffMember.certifications.join(', ')
        : staffMember.certifications || '',
      status: staffMember.status || 'active',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff.name) {
      toast.error('Name is required');
      return;
    }

    try {
      const id = editingStaff._id || editingStaff.id;
      await adminApi.updateStaff(id, {
        name: editingStaff.name,
        phone: editingStaff.phone,
        role: editingStaff.role,
        specialization: editingStaff.specialization,
        certifications: editingStaff.certifications,
        status: editingStaff.status,
      });

      toast.success(`Staff member "${editingStaff.name}" updated successfully!`);
      setIsEditModalOpen(false);
      if (selectedStaff && (selectedStaff._id === id || selectedStaff.id === id)) {
        setSelectedStaff(null);
      }
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to update staff member');
    }
  };

  // Toggle staff status (Active / Inactive)
  const handleToggleStatus = async (staffMember) => {
    const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    try {
      const id = staffMember._id || staffMember.id;
      await adminApi.updateStaffStatus(id, newStatus);
      toast.success(`${staffMember.name}'s account is now ${newStatus}`);
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffMember) => {
    if (staffMember.role === 'admin') {
      toast.error('Cannot delete administrator accounts');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove staff member "${staffMember.name}"?`)) {
      return;
    }

    try {
      const id = staffMember._id || staffMember.id;
      await adminApi.deleteStaff(id);
      toast.success(`Staff member "${staffMember.name}" deleted successfully`);
      if (selectedStaff && (selectedStaff._id === id || selectedStaff.id === id)) {
        setSelectedStaff(null);
      }
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to delete staff member');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Admin
          </span>
        );
      case 'trainer':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Trainer
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Receptionist
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-sm flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.phone || 'No phone'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-sm text-slate-600">{row.email}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => getRoleBadge(row.role),
    },
    {
      key: 'specialization',
      label: 'Details / Specialization',
      render: (row) => {
        if (row.role === 'trainer') {
          return (
            <div>
              <p className="text-xs font-medium text-slate-800">{row.specialization || 'Fitness Coach'}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {row.certifications?.map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        if (row.role === 'receptionist') {
          return <span className="text-xs text-slate-500">Front Desk & POS Ops</span>;
        }
        return <span className="text-xs text-purple-600 font-medium">System Manager</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStaff(row);
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
            title="Edit Staff"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {row.role !== 'admin' && (
            <>
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
                title={row.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                <Power className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStaff(row);
                }}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Staff"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Staff Directory & Management"
        subtitle="Provision and manage trainer and receptionist accounts with role-based access"
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Staff</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fitness Coaches</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.trainers}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reception Desk</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-sky-600 mt-2">{stats.receptionists}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.active}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {['all', 'trainer', 'receptionist', 'admin'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
          </button>
        ))}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredStaff}
        onRowClick={(row) => setSelectedStaff(row)}
      />

      {/* View Staff Modal */}
      <Modal
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title="Staff Account Details"
        size="md"
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 font-bold text-xl flex items-center justify-center">
                {selectedStaff.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedStaff.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(selectedStaff.role)}
                  <StatusBadge status={selectedStaff.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-slate-800">{selectedStaff.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-800">{selectedStaff.phone || 'None'}</p>
                </div>
              </div>
            </div>

            {selectedStaff.role === 'trainer' && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 mb-1">Certifications & Specialties</p>
                <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-sm">
                  <p className="text-slate-800 font-medium">{selectedStaff.specialization || 'General Fitness'}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedStaff.certifications?.map((c, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-600">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedStaff);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
                {selectedStaff.role !== 'admin' && (
                  <button
                    onClick={() => {
                      handleToggleStatus(selectedStaff);
                      setSelectedStaff(null);
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    {selectedStaff.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        size="md"
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              placeholder="e.g. Dawit Tadesse"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="dawit@gympro.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="+251 911 234 567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Staff Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
              >
                <option value="trainer">Fitness Trainer / Coach</option>
                <option value="receptionist">Receptionist / Front Desk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Status</label>
              <select
                value={newStaff.status}
                onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {newStaff.role === 'trainer' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={newStaff.specialization}
                  onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                  placeholder="e.g. Strength & Conditioning, CrossFit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  value={newStaff.certifications}
                  onChange={(e) => setNewStaff({ ...newStaff, certifications: e.target.value })}
                  placeholder="NASM-CPT, CSCS, CPR/AED"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Temporary Password</label>
            <input
              type="text"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              placeholder="password123"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              Add Staff Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member"
        size="md"
      >
        {editingStaff && (
          <form onSubmit={handleEditStaffSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editingStaff.name}
                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={editingStaff.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="trainer">Trainer</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editingStaff.status}
                  onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {editingStaff.role === 'trainer' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={editingStaff.specialization}
                    onChange={(e) => setEditingStaff({ ...editingStaff, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Certifications (comma-separated)</label>
                  <input
                    type="text"
                    value={editingStaff.certifications}
                    onChange={(e) => setEditingStaff({ ...editingStaff, certifications: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </>
            )}

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
