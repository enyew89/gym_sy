import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import MemberRegistrationPage from './pages/MemberRegistrationPage';
import HomePage from './pages/HomePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MembersPage from './pages/admin/MembersPage';
import StaffPage from './pages/admin/StaffPage';
import PlansPage from './pages/admin/PlansPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import TrainersPage from './pages/admin/TrainersPage';
import ClassesPage from './pages/admin/ClassesPage';
import EquipmentPage from './pages/admin/EquipmentPage';
import ReportsPage from './pages/admin/ReportsPage';

// Trainer pages
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerMembers from './pages/trainer/TrainerMembers';
import WorkoutPlans from './pages/trainer/WorkoutPlans';
import CreateWorkout from './pages/trainer/CreateWorkout';
import TrainerProgress from './pages/trainer/TrainerProgress';
import TrainerSchedule from './pages/trainer/TrainerSchedule';
import TrainerCommunication from './pages/trainer/TrainerCommunication';
import TrainerAI from './pages/trainer/TrainerAI';

// Receptionist pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import QRCheckin from './pages/receptionist/QRCheckin';
import MemberRegistration from './pages/receptionist/MemberRegistration';
import ReceptionistPayments from './pages/receptionist/ReceptionistPayments';
import ClassBookings from './pages/receptionist/ClassBookings';
import AttendanceRecords from './pages/receptionist/AttendanceRecords';

// Member pages
import MemberDashboard from './pages/member/MemberDashboard';
import MemberProfile from './pages/member/MemberProfile';
import MemberMembership from './pages/member/MemberMembership';
import MemberWorkouts from './pages/member/MemberWorkouts';
import MemberProgress from './pages/member/MemberProgress';
import MemberClasses from './pages/member/MemberClasses';
import MemberPayments from './pages/member/MemberPayments';
import MemberFeedback from './pages/member/MemberFeedback';
import MemberAI from './pages/member/MemberAI';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<MemberRegistrationPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/members" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><MembersPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><StaffPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><PlansPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><PaymentsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/trainers" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><TrainersPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><ClassesPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/equipment" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><EquipmentPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>} />

      {/* Trainer routes */}
      <Route path="/trainer" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><TrainerDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/members" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><TrainerMembers /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/workouts" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><WorkoutPlans /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/workouts/create" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><CreateWorkout /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/progress" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><TrainerProgress /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/schedule" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><TrainerSchedule /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/communication" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><TrainerCommunication /></DashboardLayout></ProtectedRoute>} />
      <Route path="/trainer/ai-assistant" element={<ProtectedRoute allowedRoles={['trainer']}><DashboardLayout><TrainerAI /></DashboardLayout></ProtectedRoute>} />

      {/* Receptionist routes */}
      <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout><ReceptionistDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/receptionist/checkin" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout><QRCheckin /></DashboardLayout></ProtectedRoute>} />
      <Route path="/receptionist/register" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout><MemberRegistration /></DashboardLayout></ProtectedRoute>} />
      <Route path="/receptionist/payments" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout><ReceptionistPayments /></DashboardLayout></ProtectedRoute>} />
      <Route path="/receptionist/bookings" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout><ClassBookings /></DashboardLayout></ProtectedRoute>} />
      <Route path="/receptionist/attendance" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout><AttendanceRecords /></DashboardLayout></ProtectedRoute>} />

      {/* Member routes */}
      <Route path="/member" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/profile" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberProfile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/membership" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberMembership /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/workouts" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberWorkouts /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/progress" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberProgress /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/classes" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberClasses /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/payments" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberPayments /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/feedback" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberFeedback /></DashboardLayout></ProtectedRoute>} />
      <Route path="/member/ai-assistant" element={<ProtectedRoute allowedRoles={['member']}><DashboardLayout><MemberAI /></DashboardLayout></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-slate-300">404</h1>
            <p className="text-slate-500 mt-2">Page not found</p>
            <a href="/login" className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              Go to Login
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
        }} />
      </Router>
    </AuthProvider>
  );
}
