import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Wrench,
  Plus,
  CheckCircle,
  AlertTriangle,
  Activity,
  MapPin,
  Package,
  Calendar,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  MessageSquare,
  User,
  Mail,
  Send,
  AlertOctagon,
  Flame,
  Check
} from 'lucide-react';
import { StatCard, StatusBadge, PageHeader, SearchBar, DataTable, Modal } from '../../components/ui';
import { equipmentApi, adminApi } from '../../services/api';

export default function EquipmentPage() {
  // Navigation Tabs: 'inventory' | 'complaints'
  const [activeMainTab, setActiveMainTab] = useState('inventory');

  // --- Inventory State ---
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- Complaints State ---
  const [complaintsList, setComplaintsList] = useState([]);
  const [complaintsStats, setComplaintsStats] = useState({
    total: 0,
    open: 0,
    inReview: 0,
    resolved: 0,
    urgent: 0,
  });
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Load Equipment Inventory
  const loadEquipment = async () => {
    try {
      const res = await equipmentApi.getEquipment();
      if (res && res.success && Array.isArray(res.equipment)) {
        setEquipmentList(res.equipment);
      }
    } catch (err) {
      console.warn('Equipment inventory load fallback:', err);
    }
  };

  // Load Member Complaints & Feedback
  const loadComplaints = async () => {
    try {
      const res = await adminApi.getFeedback();
      if (res && res.success) {
        setComplaintsList(res.feedback || []);
        if (res.stats) {
          setComplaintsStats(res.stats);
        }
      }
    } catch (err) {
      console.warn('Complaints load fallback:', err);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadComplaints();
  }, []);

  // New Equipment Form
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    brand: '',
    quantity: 1,
    location: 'Cardio Zone',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  // Calculate inventory stats
  const stats = useMemo(() => {
    const totalCategories = equipmentList.length;
    const totalUnits = equipmentList.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const totalWorking = equipmentList.reduce((acc, curr) => acc + (Number(curr.working) || 0), 0);
    const totalMaintenance = equipmentList.reduce((acc, curr) => acc + (Number(curr.maintenance) || 0), 0);
    const healthPercentage = totalUnits > 0 ? Math.round((totalWorking / totalUnits) * 100) : 100;

    return { totalCategories, totalUnits, totalWorking, totalMaintenance, healthPercentage };
  }, [equipmentList]);

  // Filtered equipment inventory
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const name = item.name || '';
      const brand = item.brand || '';
      const location = item.location || '';

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [equipmentList, searchQuery, locationFilter, statusFilter]);

  // Filtered member complaints
  const filteredComplaints = useMemo(() => {
    return complaintsList.filter((item) => {
      const term = complaintSearch.toLowerCase();
      const matchesSearch =
        (item.equipmentName || '').toLowerCase().includes(term) ||
        (item.memberName || '').toLowerCase().includes(term) ||
        (item.memberEmail || '').toLowerCase().includes(term) ||
        (item.subject || '').toLowerCase().includes(term) ||
        (item.message || '').toLowerCase().includes(term);

      const matchesStatus =
        complaintStatusFilter === 'all' || item.status === complaintStatusFilter;
      const matchesPriority =
        complaintPriorityFilter === 'all' || item.priority === complaintPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaintsList, complaintSearch, complaintStatusFilter, complaintPriorityFilter]);

  // Handle Add Equipment Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newEquipment.name || !newEquipment.brand) {
      toast.error('Please fill in Equipment Name and Brand');
      return;
    }

    const qty = Number(newEquipment.quantity) || 1;

    try {
      const res = await equipmentApi.addEquipment({
        name: newEquipment.name,
        brand: newEquipment.brand,
        quantity: qty,
        location: newEquipment.location,
        status: 'good',
      });

      toast.success(res.message || `Added ${newEquipment.name} to gym inventory!`);
      setIsAddModalOpen(false);
      setNewEquipment({
        name: '',
        brand: '',
        quantity: 1,
        location: 'Cardio Zone',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
      loadEquipment();
    } catch (err) {
      toast.error(err.message || 'Failed to add equipment');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem({
      _id: item._id || item.id,
      id: item._id || item.id,
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      working: item.working,
      maintenance: item.maintenance,
      location: item.location,
      status: item.status || 'good',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem.name) {
      toast.error('Equipment Name is required');
      return;
    }

    try {
      const id = editingItem._id || editingItem.id;
      const qty = Number(editingItem.quantity);
      const maint = Number(editingItem.maintenance);
      const working = Math.max(0, qty - maint);

      await equipmentApi.updateEquipment(id, {
        name: editingItem.name,
        brand: editingItem.brand,
        quantity: qty,
        working,
        maintenance: maint,
        location: editingItem.location,
        status: maint > 0 ? (working === 0 ? 'maintenance' : 'partial') : 'good',
      });

      toast.success(`Equipment "${editingItem.name}" updated successfully!`);
      setIsEditModalOpen(false);
      loadEquipment();
    } catch (err) {
      toast.error(err.message || 'Failed to update equipment');
    }
  };

  // Handle Toggle Maintenance in DB
  const handleToggleMaintenance = async (item) => {
    const id = item._id || item.id;
    try {
      if (item.maintenance > 0) {
        // Restore all units to working
        await equipmentApi.updateEquipment(id, {
          working: item.quantity,
          maintenance: 0,
          status: 'good',
        });
        toast.success(`All units of ${item.name} marked as fully operational!`);
      } else {
        // Flag 1 unit for maintenance
        if (item.working <= 0) return;
        const newWorking = item.working - 1;
        const newMaint = item.maintenance + 1;
        const newStatus = newWorking === 0 ? 'maintenance' : 'partial';

        await equipmentApi.updateEquipment(id, {
          working: newWorking,
          maintenance: newMaint,
          status: newStatus,
        });
        toast.error(`1 unit of ${item.name} flagged for maintenance inspection`);
      }
      loadEquipment();
    } catch (err) {
      toast.error(err.message || 'Failed to update maintenance status');
    }
  };

  // Delete Equipment
  const handleDeleteEquipment = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from inventory?`)) {
      return;
    }

    try {
      const id = item._id || item.id;
      await equipmentApi.deleteEquipment(id);
      toast.success(`Equipment "${item.name}" removed from inventory`);
      loadEquipment();
    } catch (err) {
      toast.error(err.message || 'Failed to delete equipment');
    }
  };

  // --- Complaint Management Handlers ---
  const handleUpdateComplaintStatus = async (id, newStatus, responseNote = '') => {
    try {
      const res = await adminApi.updateFeedbackStatus(id, {
        status: newStatus,
        adminResponse: responseNote,
      });
      toast.success(res.message || `Status updated to ${newStatus.replace('_', ' ')}!`);
      loadComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to update report status');
    }
  };

  // Flag machine from complaint
  const handleFlagMachineFromComplaint = async (complaint) => {
    const eqName = complaint.equipmentName;
    if (!eqName) {
      toast.error('No equipment specified on this ticket.');
      return;
    }

    // Try to find matching inventory item
    const matched = equipmentList.find(
      (e) => e.name.toLowerCase() === eqName.toLowerCase() ||
             e.name.toLowerCase().includes(eqName.toLowerCase()) ||
             eqName.toLowerCase().includes(e.name.toLowerCase())
    );

    if (matched) {
      await handleToggleMaintenance(matched);
      await handleUpdateComplaintStatus(complaint._id, 'in_review', `Flagged ${matched.name} for hardware maintenance inspection.`);
    } else {
      toast(`Machine "${eqName}" not found in inventory list. Updated complaint to In Progress.`);
      await handleUpdateComplaintStatus(complaint._id, 'in_review', 'Inspection dispatched.');
    }
  };

  // Open Response Modal
  const handleOpenResponseModal = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.adminResponse || '');
    setIsResponseModalOpen(true);
  };

  // Submit Response Note
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsSubmittingResponse(true);

    try {
      await adminApi.updateFeedbackStatus(selectedComplaint._id, {
        status: 'resolved',
        adminResponse: responseText.trim(),
      });
      toast.success('Complaint resolved with staff response recorded!');
      setIsResponseModalOpen(false);
      setSelectedComplaint(null);
      setResponseText('');
      loadComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve ticket');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id) => {
    if (!window.confirm('Delete this member complaint ticket?')) return;
    try {
      await adminApi.deleteFeedback(id);
      toast.success('Ticket removed');
      loadComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to delete ticket');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent Hazard',
          classes: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          icon: Flame,
        };
      case 'high':
        return {
          label: 'High Priority',
          classes: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
          icon: AlertTriangle,
        };
      case 'medium':
        return {
          label: 'Medium',
          classes: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
          icon: Clock,
        };
      case 'low':
      default:
        return {
          label: 'Low',
          classes: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
          icon: null,
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return {
          label: 'Resolved',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        };
      case 'in_review':
        return {
          label: 'In Progress',
          classes: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        };
      case 'open':
      default:
        return {
          label: 'Open Ticket',
          classes: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        };
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Equipment & Brand',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.brand || 'Standard Gym Grade'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
          <MapPin className="w-3 h-3 text-slate-400" />
          {row.location}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Total Units',
      render: (row) => <span className="font-bold text-slate-900 text-sm">{row.quantity}</span>,
    },
    {
      key: 'status_counts',
      label: 'Working / In Repair',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
            {row.working} OK
          </span>
          {row.maintenance > 0 ? (
            <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
              {row.maintenance} Repair
            </span>
          ) : (
            <span className="text-slate-400">0 Repair</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Health Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Maintenance & Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMaintenance(row);
            }}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              row.maintenance > 0
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
            title="Toggle Maintenance Status"
          >
            <Wrench className="w-3 h-3" />
            {row.maintenance > 0 ? 'Fix Unit' : 'Report Issue'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Equipment"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteEquipment(row);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Equipment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Equipment Inventory & Maintenance"
        subtitle="Track gym machinery, operational health status, scheduled maintenance, and hardware service history"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadEquipment();
                loadComplaints();
                toast.success('Inventory & complaints refreshed!');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {activeMainTab === 'inventory' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Equipment
              </button>
            )}
          </div>
        }
      />

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab('inventory')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeMainTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Hardware Fleet Inventory</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              activeMainTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {equipmentList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('complaints')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeMainTab === 'complaints'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Member Complaints & Issues</span>
          {complaintsStats.open > 0 ? (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeMainTab === 'complaints'
                  ? 'bg-white text-rose-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {complaintsStats.open} Open
            </span>
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeMainTab === 'complaints' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {complaintsList.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================
          VIEW 1: HARDWARE FLEET INVENTORY
          ============================================================ */}
      {activeMainTab === 'inventory' && (
        <div className="space-y-6">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Hardware Units"
              value={stats.totalUnits}
              subtitle={`${stats.totalCategories} categories tracked`}
              icon={Package}
              color="primary"
            />
            <StatCard
              title="Fully Operational"
              value={stats.totalWorking}
              subtitle={`${stats.healthPercentage}% equipment readiness`}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Under Maintenance"
              value={stats.totalMaintenance}
              subtitle="Flagged for technician inspection"
              icon={AlertTriangle}
              color="rose"
            />
            <StatCard
              title="Fleet Health Score"
              value={`${stats.healthPercentage}%`}
              subtitle="Target threshold: >95%"
              icon={Activity}
              color="primary"
            />
          </div>

          {/* Search and Filter */}
          <SearchBar
            placeholder="Search equipment by name, brand, or studio room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          >
            <div className="flex gap-2 flex-wrap">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Gym Zones</option>
                <option value="Cardio Zone">Cardio Zone</option>
                <option value="Free Weights">Free Weights</option>
                <option value="Studio A">Studio A</option>
                <option value="Studio B">Studio B</option>
                <option value="Functional Area">Functional Area</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Operational Statuses</option>
                <option value="good">100% Operational</option>
                <option value="partial">Partially Servicing</option>
                <option value="maintenance">Under Repair</option>
              </select>
            </div>
          </SearchBar>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredEquipment}
            onRowClick={(row) => handleOpenEdit(row)}
          />
        </div>
      )}

      {/* ============================================================
          VIEW 2: MEMBER COMPLAINTS & ISSUES
          ============================================================ */}
      {activeMainTab === 'complaints' && (
        <div className="space-y-6">
          {/* Complaints Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Reported Issues"
              value={complaintsStats.total || complaintsList.length}
              subtitle="All member feedback submitted"
              icon={Package}
              color="primary"
            />
            <StatCard
              title="Open Complaints"
              value={complaintsStats.open}
              subtitle="Requiring staff attention"
              icon={AlertOctagon}
              color="rose"
            />
            <StatCard
              title="In Progress"
              value={complaintsStats.inReview}
              subtitle="Being inspected / repaired"
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Resolved"
              value={complaintsStats.resolved}
              subtitle="Successfully addressed"
              icon={CheckCircle2}
              color="emerald"
            />
          </div>

          {/* Complaints Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search complaints by member, machine name, or problem keyword..."
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Ticket Statuses</option>
                <option value="open">Open Tickets</option>
                <option value="in_review">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={complaintPriorityFilter}
                onChange={(e) => setComplaintPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Complaints List */}
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
              <h4 className="font-bold text-slate-800 text-base">No Matching Complaints</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No equipment issues or member reports match your current filters. All machinery is operating smoothly!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredComplaints.map((item) => {
                const priorityBadge = getPriorityBadge(item.priority);
                const statusBadge = getStatusBadge(item.status);
                const isResolved = item.status === 'resolved';
                const isInProgress = item.status === 'in_review';

                return (
                  <div
                    key={item._id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-3 ${
                      item.priority === 'urgent' && !isResolved
                        ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Machine name, Urgency, Status & Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="p-2 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <span>{item.equipmentName || 'General Facility / Hardware'}</span>
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">
                            {item.subject}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${priorityBadge.classes}`}
                        >
                          {priorityBadge.icon && <priorityBadge.icon className="w-3 h-3" />}
                          <span>{priorityBadge.label}</span>
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full border ${statusBadge.classes}`}
                        >
                          {statusBadge.label}
                        </span>

                        {/* Date */}
                        <span className="text-xs text-slate-400 font-medium pl-1">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>

                    {/* Member Details & Problem Description */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.memberName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {item.memberEmail}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed">
                        <p className="whitespace-pre-wrap">{item.message}</p>
                      </div>

                      {/* Staff Resolution Note (if present) */}
                      {item.adminResponse && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Staff Resolution Note:</span>{' '}
                            <span>{item.adminResponse}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick Mark In Progress */}
                        {!isInProgress && !isResolved && (
                          <button
                            onClick={() =>
                              handleUpdateComplaintStatus(item._id, 'in_review', 'Maintenance team dispatched.')
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark In Progress</span>
                          </button>
                        )}

                        {/* Quick Mark as Resolved */}
                        {!isResolved ? (
                          <button
                            onClick={() =>
                              handleUpdateComplaintStatus(
                                item._id,
                                'resolved',
                                'Equipment inspected and verified fully operational.'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as Resolved</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateComplaintStatus(item._id, 'open', '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Re-open Ticket</span>
                          </button>
                        )}

                        {/* Respond / Add Note Modal */}
                        <button
                          onClick={() => handleOpenResponseModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.adminResponse ? 'Edit Note' : 'Add Staff Note'}</span>
                        </button>

                        {/* Flag corresponding inventory unit for maintenance */}
                        {item.equipmentName && !isResolved && (
                          <button
                            onClick={() => handleFlagMachineFromComplaint(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition"
                            title="Flag machine in fleet inventory table"
                          >
                            <Wrench className="w-3.5 h-3.5 text-rose-600" />
                            <span>Flag for Repair</span>
                          </button>
                        )}
                      </div>

                      {/* Delete Ticket */}
                      <button
                        onClick={() => handleDeleteComplaint(item._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          MODALS
          ============================================================ */}

      {/* Staff Response / Resolution Modal */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Resolve Ticket & Add Staff Note"
        size="md"
      >
        {selectedComplaint && (
          <form onSubmit={handleSubmitResponse} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                Machine: {selectedComplaint.equipmentName || 'General Facility'}
              </p>
              <p className="text-slate-600">
                Reported by: {selectedComplaint.memberName} ({selectedComplaint.memberEmail})
              </p>
              <p className="text-slate-700 italic mt-1">"{selectedComplaint.message}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Resolution Note for Member & Staff Log
              </label>
              <textarea
                rows={4}
                required
                placeholder="e.g. Technician replaced pulley cable and lubricated guide rods. Machine is now 100% operational."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResponseModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingResponse}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingResponse ? 'Saving...' : 'Resolve & Save Note'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Equipment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Equipment to Inventory"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Equipment Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newEquipment.name}
              onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
              placeholder="e.g. Olympic Incline Bench"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Manufacturer / Brand <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newEquipment.brand}
                onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                placeholder="Life Fitness, Hammer Strength"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={newEquipment.quantity}
                onChange={(e) => setNewEquipment({ ...newEquipment, quantity: e.target.value })}
                placeholder="4"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Facility Location</label>
            <select
              value={newEquipment.location}
              onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Cardio Zone">Cardio Zone</option>
              <option value="Free Weights">Free Weights</option>
              <option value="Functional Area">Functional Area</option>
              <option value="Studio A">Studio A</option>
              <option value="Studio B">Studio B</option>
            </select>
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
              Save Equipment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Equipment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Equipment Details"
        size="md"
      >
        {editingItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Equipment Name</label>
              <input
                type="text"
                required
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={editingItem.brand}
                  onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Total Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Units in Maintenance</label>
                <input
                  type="number"
                  min="0"
                  max={editingItem.quantity}
                  value={editingItem.maintenance}
                  onChange={(e) => setEditingItem({ ...editingItem, maintenance: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                <select
                  value={editingItem.location}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Cardio Zone">Cardio Zone</option>
                  <option value="Free Weights">Free Weights</option>
                  <option value="Functional Area">Functional Area</option>
                  <option value="Studio A">Studio A</option>
                  <option value="Studio B">Studio B</option>
                </select>
              </div>
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
