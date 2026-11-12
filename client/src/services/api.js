/**
 * Centralized API service with credentials enabled for express-session cookie handling
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Crucial for session cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication API
export const authApi = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registerMember: (formData) =>
    apiRequest('/auth/register-member', {
      method: 'POST',
      body: JSON.stringify(formData),
    }),

  checkMe: () =>
    apiRequest('/auth/me', {
      method: 'GET',
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  resetPassword: (email, newPassword) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),
};

// Admin API
export const adminApi = {
  createStaff: (staffData) =>
    apiRequest('/admin/create-staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }),

  getStaff: () =>
    apiRequest('/admin/staff', {
      method: 'GET',
    }),

  updateStaff: (id, staffData) =>
    apiRequest(`/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    }),

  updateStaffStatus: (id, status) =>
    apiRequest(`/admin/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteStaff: (id) =>
    apiRequest(`/admin/staff/${id}`, {
      method: 'DELETE',
    }),

  getMembers: () =>
    apiRequest('/admin/members', {
      method: 'GET',
    }),

  createMember: (memberData) =>
    apiRequest('/admin/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    }),

  updateMember: (id, memberData) =>
    apiRequest(`/admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    }),

  updateMemberStatus: (id, status) =>
    apiRequest(`/admin/members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteMember: (id) =>
    apiRequest(`/admin/members/${id}`, {
      method: 'DELETE',
    }),

  assignTrainer: ({ memberId, trainerId }) =>
    apiRequest('/admin/assign-trainer', {
      method: 'POST',
      body: JSON.stringify({ memberId, trainerId }),
    }),

  unassignTrainer: (memberId) =>
    apiRequest('/admin/unassign-trainer', {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    }),

  getRenewals: () =>
    apiRequest('/admin/renewals', {
      method: 'GET',
    }),

  renewMember: (id, renewData = {}) =>
    apiRequest(`/admin/members/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(renewData),
    }),

  getOverview: () =>
    apiRequest('/admin/overview', {
      method: 'GET',
    }),

  getReports: () =>
    apiRequest('/admin/reports', {
      method: 'GET',
    }),

  getFeedback: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/feedback${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  updateFeedbackStatus: (id, { status, adminResponse } = {}) =>
    apiRequest(`/admin/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminResponse }),
    }),

  deleteFeedback: (id) =>
    apiRequest(`/admin/feedback/${id}`, {
      method: 'DELETE',
    }),
};

// Plans API
export const plansApi = {
  getPlans: () =>
    apiRequest('/plans', {
      method: 'GET',
    }),

  createPlan: (planData) =>
    apiRequest('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),

  updatePlan: (id, planData) =>
    apiRequest(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    }),

  deletePlan: (id) =>
    apiRequest(`/plans/${id}`, {
      method: 'DELETE',
    }),
};

// Member API
export const memberApi = {
  getProfile: () =>
    apiRequest('/member/profile', {
      method: 'GET',
    }),

  updateProfile: (profileData) =>
    apiRequest('/member/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  getMembership: () =>
    apiRequest('/member/membership', {
      method: 'GET',
    }),

  choosePlan: (planName, paymentMethod, durationDays = 30) =>
    apiRequest('/member/choose-plan', {
      method: 'POST',
      body: JSON.stringify({ planName, paymentMethod, durationDays }),
    }),

  payOnline: (paymentData) =>
    apiRequest('/member/pay-online', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  payWithChapa: (chapaData) =>
    apiRequest('/payments/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify(chapaData),
    }),

  verifyChapaPayment: (tx_ref) =>
    apiRequest(`/payments/chapa/verify/${encodeURIComponent(tx_ref)}`, {
      method: 'GET',
    }),

  getPayments: () =>
    apiRequest('/member/payments', {
      method: 'GET',
    }),

  getAttendance: () =>
    apiRequest('/member/attendance', {
      method: 'GET',
    }),

  getWorkouts: () =>
    apiRequest('/member/workouts', {
      method: 'GET',
    }),

  logWorkout: (logData) =>
    apiRequest('/member/workouts/log', {
      method: 'POST',
      body: JSON.stringify(logData),
    }),

  getWorkoutHistory: () =>
    apiRequest('/member/workouts/history', {
      method: 'GET',
    }),

  getProgress: () =>
    apiRequest('/member/progress', {
      method: 'GET',
    }),

  logProgress: (progressData) =>
    apiRequest('/member/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    }),

  getClasses: () =>
    apiRequest('/member/classes', {
      method: 'GET',
    }),

  enrollClass: (id) =>
    apiRequest(`/member/classes/${id}/enroll`, {
      method: 'POST',
    }),

  cancelClass: (id) =>
    apiRequest(`/member/classes/${id}/cancel`, {
      method: 'POST',
    }),

  getNotifications: () =>
    apiRequest('/member/notifications', {
      method: 'GET',
    }),

  getFeedback: () =>
    apiRequest('/member/feedback', {
      method: 'GET',
    }),

  submitFeedback: (feedbackData) =>
    apiRequest('/member/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    }),
};

// Classes API
export const classesApi = {
  getClasses: () =>
    apiRequest('/classes', {
      method: 'GET',
    }),

  createClass: (classData) =>
    apiRequest('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    }),

  enrollClass: (id, memberId) =>
    apiRequest(`/classes/${id}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    }),

  updateClass: (id, updateData) =>
    apiRequest(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  deleteClass: (id) =>
    apiRequest(`/classes/${id}`, {
      method: 'DELETE',
    }),
};

// Equipment API
export const equipmentApi = {
  getEquipment: () =>
    apiRequest('/equipment', {
      method: 'GET',
    }),

  addEquipment: (itemData) =>
    apiRequest('/equipment', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  updateEquipment: (id, updateData) =>
    apiRequest(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  deleteEquipment: (id) =>
    apiRequest(`/equipment/${id}`, {
      method: 'DELETE',
    }),
};

// Payments API
export const paymentsApi = {
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/payments${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  createPayment: (paymentData) =>
    apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  updatePayment: (id, updateData) =>
    apiRequest(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  deletePayment: (id) =>
    apiRequest(`/payments/${id}`, {
      method: 'DELETE',
    }),

  getStats: () =>
    apiRequest('/payments/stats', {
      method: 'GET',
    }),
};

// Chapa Payment Gateway API
export const chapaApi = {
  getConfig: () =>
    apiRequest('/payments/chapa/config', {
      method: 'GET',
    }),

  initialize: ({ planName, amount, returnUrl, phoneNumber }) =>
    apiRequest('/payments/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify({ planName, amount, returnUrl, phoneNumber }),
    }),

  verify: (tx_ref) =>
    apiRequest(`/payments/chapa/verify/${encodeURIComponent(tx_ref)}`, {
      method: 'GET',
    }),
};

// Attendance API (QR & Manual Check-ins)
export const attendanceApi = {
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendance${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  checkIn: ({ memberId, memberEmail, memberName, method = 'QR' }) =>
    apiRequest('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ memberId, memberEmail, memberName, method }),
    }),

  checkOut: (id) =>
    apiRequest(`/attendance/${id}/checkout`, {
      method: 'POST',
    }),
};

// Workout Plans API
export const workoutsApi = {
  getWorkouts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/workouts${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  getWorkoutById: (id) =>
    apiRequest(`/workouts/${id}`, {
      method: 'GET',
    }),

  createWorkout: (workoutData) =>
    apiRequest('/workouts', {
      method: 'POST',
      body: JSON.stringify(workoutData),
    }),

  updateWorkout: (id, updateData) =>
    apiRequest(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  deleteWorkout: (id) =>
    apiRequest(`/workouts/${id}`, {
      method: 'DELETE',
    }),
};

// Progress API
export const progressApi = {
  getProgress: (memberId) =>
    apiRequest(`/progress/${memberId}`, {
      method: 'GET',
    }),

  logProgress: (progressData) =>
    apiRequest('/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    }),
};

// AI Fitness Coach API
export const aiApi = {
  chat: ({ message, fitnessGoal, experienceLevel }) =>
    apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, fitnessGoal, experienceLevel }),
    }),
};

// Trainer Portal API
export const trainerApi = {
  getOverview: () =>
    apiRequest('/trainer/overview', {
      method: 'GET',
    }),

  getAssignedMembers: () =>
    apiRequest('/trainer/members', {
      method: 'GET',
    }),

  getNotes: (memberId) =>
    apiRequest(`/trainer/notes/${memberId}`, {
      method: 'GET',
    }),

  createNote: (noteData) =>
    apiRequest('/trainer/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    }),

  deleteNote: (id) =>
    apiRequest(`/trainer/notes/${id}`, {
      method: 'DELETE',
    }),
};

// Messages & Communication API
export const messagesApi = {
  getMessages: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/messages${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  sendMessage: (messageData) =>
    apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),

  markAsRead: (id) =>
    apiRequest(`/messages/${id}/read`, {
      method: 'PATCH',
    }),

  deleteMessage: (id) =>
    apiRequest(`/messages/${id}`, {
      method: 'DELETE',
    }),
};

// Receptionist API
export const receptionistApi = {
  getOverview: () =>
    apiRequest('/receptionist/overview', {
      method: 'GET',
    }),

  registerMember: (memberData) =>
    apiRequest('/receptionist/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    }),

  verifyMember: (query) =>
    apiRequest(`/receptionist/verify/${encodeURIComponent(query)}`, {
      method: 'GET',
    }),

  checkIn: (data) =>
    apiRequest('/receptionist/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkOut: (id) =>
    apiRequest(`/receptionist/attendance/${id}/checkout`, {
      method: 'POST',
    }),

  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/receptionist/attendance${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  recordPayment: (paymentData) =>
    apiRequest('/receptionist/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  renewMembership: (renewalData) =>
    apiRequest('/receptionist/renew', {
      method: 'POST',
      body: JSON.stringify(renewalData),
    }),

  getClasses: () =>
    apiRequest('/receptionist/classes', {
      method: 'GET',
    }),

  bookClass: (classId, memberId, notes = '') =>
    apiRequest(`/receptionist/classes/${classId}/book`, {
      method: 'POST',
      body: JSON.stringify({ memberId, notes }),
    }),

  getMembers: (search = '') =>
    apiRequest(`/receptionist/members${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
      method: 'GET',
    }),
};
