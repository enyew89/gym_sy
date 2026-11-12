import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Plus,
  Clock,
  Users,
  MapPin,
  User,
  LayoutGrid,
  List,
  Sparkles,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { classes as initialClasses, staff as initialStaff } from '../../data/mockData';
import { PageHeader, StatusBadge, Modal } from '../../components/ui';
import { classesApi, adminApi } from '../../services/api';

export default function ClassesPage() {
  const [classList, setClassList] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'grid'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [roomFilter, setRoomFilter] = useState('all');

  // Load real classes and trainers from backend
  const loadData = async () => {
    try {
      const [classesRes, staffRes] = await Promise.allSettled([
        classesApi.getClasses(),
        adminApi.getStaff(),
      ]);

      if (classesRes.status === 'fulfilled' && classesRes.value?.success && Array.isArray(classesRes.value.classes)) {
        setClassList(classesRes.value.classes);
      }
      if (staffRes.status === 'fulfilled' && staffRes.value?.success && Array.isArray(staffRes.value.staff)) {
        const coachList = staffRes.value.staff.filter((s) => s.role === 'trainer');
        setTrainers(coachList);
      }
    } catch (err) {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form state for Create Class
  const [newClass, setNewClass] = useState({
    name: '',
    trainerId: '',
    schedule: 'Mon, Wed, Fri',
    time: '08:00 - 09:00',
    capacity: 20,
    room: 'Studio A',
  });

  // Filtered classes
  const filteredClasses = useMemo(() => {
    if (roomFilter === 'all') return classList;
    return classList.filter((c) => c.room === roomFilter);
  }, [classList, roomFilter]);

  // Handle Create Class
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newClass.name || !newClass.trainerId) {
      toast.error('Please fill in Class Name and select an Instructor');
      return;
    }

    const trainer = trainers.find((t) => (t._id || t.id) === newClass.trainerId);
    const trainerName = trainer ? trainer.name : 'Staff Coach';

    try {
      const res = await classesApi.createClass({
        name: newClass.name,
        trainerId: newClass.trainerId,
        trainerName,
        schedule: newClass.schedule,
        time: newClass.time,
        capacity: Number(newClass.capacity) || 20,
        room: newClass.room,
      });

      toast.success(res.message || `Class "${newClass.name}" added to the schedule!`);
      setIsCreateModalOpen(false);
      setNewClass({
        name: '',
        trainerId: '',
        schedule: 'Mon, Wed, Fri',
        time: '08:00 - 09:00',
        capacity: 20,
        room: 'Studio A',
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create class');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (cls) => {
    setEditingClass({
      _id: cls._id || cls.id,
      id: cls._id || cls.id,
      name: cls.name,
      trainerId: cls.trainerId || '',
      trainerName: cls.trainerName || '',
      schedule: cls.schedule || 'Mon, Wed, Fri',
      time: cls.time || '08:00 - 09:00',
      capacity: cls.capacity || 20,
      room: cls.room || 'Studio A',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingClass.name) {
      toast.error('Class Name is required');
      return;
    }

    const trainer = trainers.find((t) => (t._id || t.id) === editingClass.trainerId);
    const trainerName = trainer ? trainer.name : editingClass.trainerName || 'Coach';

    try {
      const id = editingClass._id || editingClass.id;
      await classesApi.updateClass(id, {
        name: editingClass.name,
        trainerId: editingClass.trainerId,
        trainerName,
        schedule: editingClass.schedule,
        time: editingClass.time,
        capacity: Number(editingClass.capacity),
        room: editingClass.room,
      });

      toast.success(`Class "${editingClass.name}" schedule updated!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update class');
    }
  };

  // Handle Delete Class
  const handleDeleteClass = async (cls) => {
    if (!window.confirm(`Are you sure you want to remove class "${cls.name}"?`)) {
      return;
    }

    try {
      const id = cls._id || cls.id;
      await classesApi.deleteClass(id);
      toast.success(`Class "${cls.name}" removed from schedule`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete class');
    }
  };

  const getCapacityColor = (enrolled, capacity) => {
    const ratio = (enrolled || 0) / (capacity || 20);
    if (ratio >= 1) return 'bg-rose-500';
    if (ratio >= 0.8) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Group Classes & Timetable"
        subtitle="Manage fitness sessions, recurring time slots, studio rooms, and enrollment limits"
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Class
          </button>
        }
      />

      {/* Filter and View Toggle Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filter Studio:
          </label>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Gym Studios</option>
            <option value="Studio A">Studio A</option>
            <option value="Studio B">Studio B</option>
            <option value="Main Floor">Main Floor</option>
            <option value="Cardio Deck">Cardio Deck</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg text-sm transition-colors ${
              viewMode === 'cards'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const enrolled = cls.enrolled || 0;
            const capacity = cls.capacity || 20;
            const percent = Math.min(100, Math.round((enrolled / capacity) * 100));
            const isFull = enrolled >= capacity;

            return (
              <div
                key={cls._id || cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {cls.room || 'Studio A'}
                      </span>
                    </div>
                    <StatusBadge status={isFull ? 'full' : cls.status || 'active'} />
                  </div>

                  <div className="space-y-2.5 py-3 border-y border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Instructor
                      </span>
                      <span className="font-semibold text-slate-800">{cls.trainerName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" /> Schedule
                      </span>
                      <span className="font-medium text-slate-700">{cls.schedule}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Time Slot
                      </span>
                      <span className="font-bold text-slate-900">{cls.time}</span>
                    </div>
                  </div>

                  {/* Enrollment Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Class Capacity</span>
                      <span className="font-bold text-slate-900">
                        {enrolled} / {capacity} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getCapacityColor(
                          enrolled,
                          capacity
                        )}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">{cls.room}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Class Name</th>
                <th className="px-5 py-3.5">Instructor</th>
                <th className="px-5 py-3.5">Days</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Studio</th>
                <th className="px-5 py-3.5">Enrolled</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.map((cls) => (
                <tr key={cls._id || cls.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{cls.name}</td>
                  <td className="px-5 py-3.5">{cls.trainerName}</td>
                  <td className="px-5 py-3.5">{cls.schedule}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{cls.time}</td>
                  <td className="px-5 py-3.5">{cls.room}</td>
                  <td className="px-5 py-3.5">
                    {cls.enrolled || 0} / {cls.capacity || 20}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="text-rose-500 hover:text-rose-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Class Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Class"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Class Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              placeholder="e.g. Pilates Core Strength"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assign Instructor / Coach <span className="text-rose-500">*</span>
            </label>
            <select
              value={newClass.trainerId}
              onChange={(e) => setNewClass({ ...newClass, trainerId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">-- Select Instructor --</option>
              {trainers.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.name} ({t.specialization || 'Coach'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Weekly Days</label>
              <input
                type="text"
                required
                value={newClass.schedule}
                onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                placeholder="Mon, Wed, Fri"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
              <input
                type="text"
                required
                value={newClass.time}
                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                placeholder="06:00 - 07:00"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max Capacity</label>
              <input
                type="number"
                required
                min="1"
                value={newClass.capacity}
                onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                placeholder="20"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Studio Room</label>
              <select
                value={newClass.room}
                onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Studio A">Studio A</option>
                <option value="Studio B">Studio B</option>
                <option value="Main Floor">Main Floor</option>
                <option value="Cardio Deck">Cardio Deck</option>
              </select>
            </div>
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
              Schedule Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Class Schedule"
        size="md"
      >
        {editingClass && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Class Name</label>
              <input
                type="text"
                required
                value={editingClass.name}
                onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Instructor</label>
              <select
                value={editingClass.trainerId}
                onChange={(e) => setEditingClass({ ...editingClass, trainerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {trainers.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {t.name} ({t.specialization || 'Coach'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Weekly Days</label>
                <input
                  type="text"
                  required
                  value={editingClass.schedule}
                  onChange={(e) => setEditingClass({ ...editingClass, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                <input
                  type="text"
                  required
                  value={editingClass.time}
                  onChange={(e) => setEditingClass({ ...editingClass, time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editingClass.capacity}
                  onChange={(e) => setEditingClass({ ...editingClass, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Studio Room</label>
                <select
                  value={editingClass.room}
                  onChange={(e) => setEditingClass({ ...editingClass, room: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Studio A">Studio A</option>
                  <option value="Studio B">Studio B</option>
                  <option value="Main Floor">Main Floor</option>
                  <option value="Cardio Deck">Cardio Deck</option>
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
