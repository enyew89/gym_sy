import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, Dumbbell, Shield,
  Award, Edit3, Save, X, CheckCircle2, HeartPulse,
  Ruler, Scale, Target, Sparkles, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { members, staff } from '../../data/mockData';
import { StatusBadge, PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { memberApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function MemberProfile() {
  const { user } = useAuth();
  const rawMember = user || {};
  const trainer = {
    name: user?.trainerName || 'Not Assigned',
    specialization: 'General Fitness',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states initialized with member data
  const [formData, setFormData] = useState({
    firstName: (user?.name || rawMember?.name || 'Member').split(' ')[0] || '',
    lastName: (user?.name || rawMember?.name || '').split(' ').slice(1).join(' ') || '',
    gender: user?.gender || rawMember?.gender || 'Not Specified',
    age: user?.age || rawMember?.age || '',
    dateOfBirth: '',
    email: user?.email || rawMember?.email || '',
    phone: user?.phone || rawMember?.phone || '',
    address: '',
    city: 'Addis Ababa',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    // Fitness goals
    primaryGoal: user?.fitnessGoal || 'General Fitness',
    activityLevel: 'General Fitness',
    preferredTime: 'Morning',
    dietaryPreference: 'Balanced',
    medicalNotes: 'None',
    // Body measurements
    height: '',
    weight: '',
    targetWeight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    arms: '',
  });

  const [tempData, setTempData] = useState({ ...formData });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await memberApi.getProfile();
        if (res.success && res.member) {
          const m = res.member;
          const nameParts = (m.name || '').split(' ');
          const updated = {
            ...formData,
            firstName: nameParts[0] || formData.firstName,
            lastName: nameParts.slice(1).join(' ') || formData.lastName,
            email: m.email || formData.email,
            phone: m.phone || formData.phone,
            gender: m.gender || formData.gender,
            age: m.age || formData.age,
            primaryGoal: m.fitnessGoal || formData.primaryGoal,
          };
          setFormData(updated);
          setTempData(updated);
        }
      } catch (err) {}
    }
    loadProfile();
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel
      setTempData({ ...formData });
      setIsEditing(false);
    } else {
      setTempData({ ...formData });
      setIsEditing(true);
      setSaveSuccess(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const fullName = `${tempData.firstName} ${tempData.lastName}`.trim();

    try {
      const res = await memberApi.updateProfile({
        name: fullName,
        phone: tempData.phone,
        gender: tempData.gender,
        age: tempData.age,
        fitnessGoal: tempData.primaryGoal,
        address: tempData.address,
        emergencyContactName: tempData.emergencyContact,
        emergencyContactPhone: tempData.emergencyPhone,
      });

      if (res.success) {
        setFormData({ ...tempData });
        setIsEditing(false);
        setSaveSuccess(true);
        toast.success('Profile details updated successfully!');
        setTimeout(() => setSaveSuccess(false), 4000);
        return;
      }
    } catch (err) {
      console.warn('Backend profile update fallback:', err);
    } finally {
      setIsSaving(false);
    }

    setFormData({ ...tempData });
    setIsEditing(false);
    setSaveSuccess(true);
    toast.success('Profile updated locally!');
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  const handleChange = (field, value) => {
    setTempData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate BMI safely
  const currentHeightVal = parseFloat(isEditing ? tempData.height : formData.height);
  const currentWeightVal = parseFloat(isEditing ? tempData.weight : formData.weight);
  const targetWeightVal = parseFloat(isEditing ? tempData.targetWeight : formData.targetWeight);

  const heightInMeters = currentHeightVal > 0 ? currentHeightVal / 100 : 0;
  const bmi = heightInMeters > 0 && currentWeightVal > 0
    ? (currentWeightVal / (heightInMeters * heightInMeters)).toFixed(1)
    : '--';
  const weightDiff = currentWeightVal > 0 && targetWeightVal > 0
    ? (currentWeightVal - targetWeightVal).toFixed(1)
    : '--';

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, body metrics, and training preferences"
        action={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEditToggle}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        }
      />

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 transition-all animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Your profile changes have been successfully saved!</p>
        </div>
      )}

      {/* Profile Overview Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar placeholder with initials */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold shadow-md border-4 border-white uppercase">
              {formData.firstName?.charAt(0) || user?.name?.charAt(0) || 'M'}
              {formData.lastName?.charAt(0) || ''}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full text-white border-2 border-white shadow-sm" title="Active Account">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          {/* Member Main Meta */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-bold text-slate-900">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : user?.name || 'Member'}
              </h2>
              <StatusBadge status={user?.membershipStatus || 'active'} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200">
                {user?.plan || rawMember?.plan || 'Standard'} Member
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {formData.email || user?.email || 'No email registered'}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                {formData.phone || user?.phone || 'No phone set'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
              </span>
            </div>

            <p className="text-xs text-slate-500 pt-1">
              Assigned Personal Trainer:{' '}
              <span className="font-semibold text-slate-800">{trainer.name}</span>{' '}
              ({trainer.specialization})
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex md:flex-col gap-3 w-full md:w-auto justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-400 font-medium uppercase">Current Weight</p>
              <p className="text-xl font-bold text-slate-900">{formData.weight ? `${formData.weight} kg` : '--'}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-400 font-medium uppercase">Body Fat</p>
              <p className="text-xl font-bold text-violet-600">{formData.bodyFat ? `${formData.bodyFat}%` : '--'}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-400 font-medium uppercase">Calculated BMI</p>
              <p className="text-xl font-bold text-emerald-600">{bmi}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Personal Info & Contact Info & Fitness Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Personal Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <User className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                {isEditing ? (
                  <select
                    value={tempData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.gender}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Age / Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={tempData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.age} years old ({formData.dateOfBirth})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Emergency Contact Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.emergencyContact}
                    onChange={(e) => handleChange('emergencyContact', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.emergencyContact} ({formData.emergencyRelation})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Emergency Phone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.emergencyPhone}
                    onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.emergencyPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Mail className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={tempData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.phone}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Residential Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.address}, {formData.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Fitness Goals & Preferences */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Target className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-900">Fitness Goals & Training</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Primary Fitness Goal
                </label>
                {isEditing ? (
                  <select
                    value={tempData.primaryGoal}
                    onChange={(e) => handleChange('primaryGoal', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="Muscle Building & Hypertrophy">Muscle Building & Hypertrophy</option>
                    <option value="Fat Loss & Toning">Fat Loss & Toning</option>
                    <option value="Strength & Powerlifting">Strength & Powerlifting</option>
                    <option value="Cardio Endurance">Cardio Endurance</option>
                    <option value="Flexibility & Mobility">Flexibility & Mobility</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.primaryGoal}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Activity Frequency
                </label>
                {isEditing ? (
                  <select
                    value={tempData.activityLevel}
                    onChange={(e) => handleChange('activityLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="Beginner (1-2 times/week)">Beginner (1-2 times/week)</option>
                    <option value="Intermediate (3-4 times/week)">Intermediate (3-4 times/week)</option>
                    <option value="Advanced (5+ times/week)">Advanced (5+ times/week)</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.activityLevel}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Preferred Workout Time
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.preferredTime}
                    onChange={(e) => handleChange('preferredTime', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.preferredTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nutrition / Diet Focus
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.dietaryPreference}
                    onChange={(e) => handleChange('dietaryPreference', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.dietaryPreference}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Health Restrictions / Medical History
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={tempData.medicalNotes}
                    onChange={(e) => handleChange('medicalNotes', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.medicalNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Body Measurements & Membership Info */}
        <div className="space-y-6">
          {/* Section 4: Body Measurements */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Body Measurements</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Updated Oct 1
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Height</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tempData.height}
                      onChange={(e) => handleChange('height', Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs text-slate-500">cm</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">{formData.height} cm</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Current Weight</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      value={tempData.weight}
                      onChange={(e) => handleChange('weight', Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs text-slate-500">kg</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">{formData.weight} kg</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Target Weight</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      value={tempData.targetWeight}
                      onChange={(e) => handleChange('targetWeight', Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs text-slate-500">kg</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-emerald-600">{formData.targetWeight} kg</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Body Fat %</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={tempData.bodyFat}
                      onChange={(e) => handleChange('bodyFat', Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900">{formData.bodyFat}%</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Chest</p>
                  <p className="text-xs font-bold text-slate-800">{formData.chest} cm</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Waist</p>
                  <p className="text-xs font-bold text-slate-800">{formData.waist} cm</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Arms</p>
                  <p className="text-xs font-bold text-slate-800">{formData.arms} cm</p>
                </div>
              </div>
            </div>

            {/* Target Weight Status */}
            <div className="mt-4 p-3 bg-violet-50 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-violet-900">Goal Distance</span>
                <span className="font-bold text-violet-700">
                  {weightDiff !== '--' ? `${Math.abs(weightDiff)} kg away` : 'Set target weight'}
                </span>
              </div>
              <div className="w-full bg-violet-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-violet-600 h-full rounded-full transition-all"
                  style={{ width: weightDiff !== '--' ? '65%' : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Membership Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Membership Summary</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Current Plan</span>
                <span className="font-bold text-slate-900">{user?.plan || rawMember?.plan || 'Standard'} Pass</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={user?.membershipStatus || 'active'} />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Member ID</span>
                <span className="font-mono font-bold text-slate-800">
                  {user?.memberId || (user?._id ? `MEM-${user._id.slice(-6).toUpperCase()}` : 'MEM-001')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Expiry Date</span>
                <span className="font-semibold text-slate-900">
                  {user?.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Locker</span>
                <span className="font-bold text-indigo-600">{user?.assignedLocker || 'Standard Access'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Access Key</span>
                <span className="font-semibold text-slate-700">Digital QR Pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
