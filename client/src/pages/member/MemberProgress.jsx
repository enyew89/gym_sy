import { useState, useEffect } from 'react';
import {
  TrendingUp, Scale, Flame, Dumbbell, Plus,
  Calendar, CheckCircle2, Award, Target, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { progressData } from '../../data/mockData';
import { StatCard, PageHeader, Modal } from '../../components/ui';
import { memberApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function MemberProgress() {
  const [dataList, setDataList] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load real progress from backend
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await memberApi.getProgress();
        if (res.success && Array.isArray(res.progress)) {
          setDataList(res.progress);
        }
      } catch (err) {}
    }
    loadProgress();
  }, []);

  // New log form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    arms: '',
    benchPress: '',
    squat: '',
    deadlift: '',
    notes: '',
  });

  const hasData = dataList.length > 0;
  const latest = dataList[dataList.length - 1] || {};
  const earliest = dataList[0] || {};
  const weightChange = hasData ? (Number(latest.weight || 0) - Number(earliest.weight || 0)).toFixed(1) : '0.0';
  const fatChange = hasData ? (Number(latest.bodyFat || 0) - Number(earliest.bodyFat || 0)).toFixed(1) : '0.0';
  const benchChange = hasData ? (Number(latest.benchPress || 0) - Number(earliest.benchPress || 0)) : 0;

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    const newEntry = {
      date: form.date,
      weight: parseFloat(form.weight) || latest.weight || 0,
      bodyFat: parseFloat(form.bodyFat) || latest.bodyFat || 0,
      chest: parseFloat(form.chest) || latest.chest || 0,
      waist: parseFloat(form.waist) || latest.waist || 0,
      arms: parseFloat(form.arms) || latest.arms || 0,
      benchPress: parseFloat(form.benchPress) || latest.benchPress || 0,
      squat: parseFloat(form.squat) || latest.squat || 0,
      deadlift: parseFloat(form.deadlift) || latest.deadlift || 0,
      notes: form.notes || '',
    };

    try {
      const res = await memberApi.logProgress(newEntry);
      if (res.success && res.progress) {
        setDataList((prev) => [...prev, res.progress]);
        setIsLogModalOpen(false);
        setSaveSuccess(true);
        toast.success('Measurement saved to your fitness profile!', { icon: '📊' });
        setTimeout(() => setSaveSuccess(false), 4000);
        return;
      }
    } catch (err) {}

    setDataList((prev) => [...prev, newEntry]);
    setIsLogModalOpen(false);
    setSaveSuccess(true);
    toast.success('Measurement logged locally!');
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness & Strength Progress"
        subtitle="Track your body composition changes and strength gains over time"
        action={
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Measurement</span>
          </button>
        }
      />

      {saveSuccess && (
        <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-xl flex items-center gap-3 text-zinc-900 transition-all">
          <CheckCircle2 className="w-5 h-5 text-zinc-900 flex-shrink-0" />
          <p className="text-sm font-medium">New measurement entry recorded to your progress history!</p>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Current Weight"
          value={latest.weight ? `${latest.weight} kg` : '--'}
          subtitle={hasData ? `Baseline: ${earliest.weight || latest.weight} kg` : 'No logs recorded yet'}
          icon={Scale}
          trend={hasData ? `${Math.abs(weightChange)} kg` : '--'}
          trendUp={false}
          color="primary"
        />
        <StatCard
          title="Body Fat"
          value={latest.bodyFat ? `${latest.bodyFat}%` : '--'}
          subtitle={hasData ? `Baseline: ${earliest.bodyFat || latest.bodyFat}%` : 'No logs recorded yet'}
          icon={Flame}
          trend={hasData ? `${Math.abs(fatChange)}%` : '--'}
          trendUp={false}
          color="primary"
        />
        <StatCard
          title="Bench Press 1RM"
          value={latest.benchPress ? `${latest.benchPress} kg` : '--'}
          subtitle={hasData ? `Baseline: ${earliest.benchPress || latest.benchPress} kg` : 'No logs recorded yet'}
          icon={Dumbbell}
          trend={hasData ? `${benchChange >= 0 ? '+' : ''}${benchChange} kg` : '--'}
          trendUp={true}
          color="primary"
        />
        <StatCard
          title="Deadlift 1RM"
          value={latest.deadlift ? `${latest.deadlift} kg` : '--'}
          subtitle={latest.squat ? `Squat: ${latest.squat} kg` : 'Power lifts tracking'}
          icon={Award}
          trend={latest.deadlift ? 'PR Record' : '--'}
          trendUp={true}
          color="primary"
        />
      </div>

      {/* Goal Progress Indicators */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
          <Target className="w-5 h-5 text-zinc-900" />
          <div>
            <h3 className="text-base font-bold text-zinc-900">Current Milestone Goals</h3>
            <p className="text-xs text-zinc-500">Track progress toward your target objectives</p>
          </div>
        </div>

        {!hasData ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No milestones calculated yet. Log your first measurement above to start tracking progress.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
            {/* Goal 1: Weight */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-700">Target Weight</span>
                <span className="font-bold text-zinc-900">
                  {latest.weight ? `${latest.weight}kg` : '--'}
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-zinc-900 h-full rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
                <span>Start: {earliest.weight || latest.weight}kg</span>
                <span className="font-semibold text-zinc-800">Current: {latest.weight}kg</span>
              </div>
            </div>

            {/* Goal 2: Body Fat */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-700">Body Fat</span>
                <span className="font-bold text-zinc-900">
                  {latest.bodyFat ? `${latest.bodyFat}%` : '--'}
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-zinc-700 h-full rounded-full" style={{ width: '70%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
                <span>Start: {earliest.bodyFat || latest.bodyFat}%</span>
                <span className="font-semibold text-zinc-800">Current: {latest.bodyFat}%</span>
              </div>
            </div>

            {/* Goal 3: Bench Press */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-700">Bench Press</span>
                <span className="font-bold text-zinc-900">
                  {latest.benchPress ? `${latest.benchPress}kg` : '--'}
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-zinc-600 h-full rounded-full" style={{ width: '65%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
                <span>Start: {earliest.benchPress || latest.benchPress}kg</span>
                <span className="font-semibold text-zinc-800">Current: {latest.benchPress}kg</span>
              </div>
            </div>

            {/* Goal 4: Deadlift */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-700">Deadlift</span>
                <span className="font-bold text-zinc-900">
                  {latest.deadlift ? `${latest.deadlift}kg` : '--'}
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-zinc-800 h-full rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
                <span>Start: {earliest.deadlift || latest.deadlift}kg</span>
                <span className="font-semibold text-zinc-800">Current: {latest.deadlift}kg</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Body Measurements History Table */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Historical Measurement Logs</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Verified metric records recorded with trainer assistance
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Body Fat</th>
                <th className="py-3 px-4">Chest</th>
                <th className="py-3 px-4">Waist</th>
                <th className="py-3 px-4">Arms</th>
                <th className="py-3 px-4">Bench 1RM</th>
                <th className="py-3 px-4">Squat 1RM</th>
                <th className="py-3 px-4">Deadlift 1RM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {dataList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-400 font-medium">
                    No measurement entries logged yet. Click "Log Measurement" above to record your first progress entry.
                  </td>
                </tr>
              ) : (
                dataList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">{row.date}</td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900">{row.weight} kg</td>
                    <td className="py-3.5 px-4 font-bold text-zinc-700">{row.bodyFat}%</td>
                    <td className="py-3.5 px-4">{row.chest} cm</td>
                    <td className="py-3.5 px-4">{row.waist} cm</td>
                    <td className="py-3.5 px-4">{row.arms} cm</td>
                    <td className="py-3.5 px-4 font-medium">{row.benchPress} kg</td>
                    <td className="py-3.5 px-4 font-medium">{row.squat} kg</td>
                    <td className="py-3.5 px-4 font-medium">{row.deadlift} kg</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Measurement Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log New Body Measurement"
        size="lg"
      >
        <form onSubmit={handleSaveLog} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Record your latest measurements and lift PRs to keep your training records current.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Log Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.bodyFat}
                onChange={(e) => handleInputChange('bodyFat', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Chest (cm)</label>
              <input
                type="number"
                step="0.5"
                value={form.chest}
                onChange={(e) => handleInputChange('chest', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Waist (cm)</label>
              <input
                type="number"
                step="0.5"
                value={form.waist}
                onChange={(e) => handleInputChange('waist', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Arms (cm)</label>
              <input
                type="number"
                step="0.5"
                value={form.arms}
                onChange={(e) => handleInputChange('arms', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-3">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
              Strength PRs (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Bench Press (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.benchPress}
                  onChange={(e) => handleInputChange('benchPress', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Squat (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.squat}
                  onChange={(e) => handleInputChange('squat', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Deadlift (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.deadlift}
                  onChange={(e) => handleInputChange('deadlift', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Personal Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="E.g. Great session today, increased weights on deadlifts"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Save Measurement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
