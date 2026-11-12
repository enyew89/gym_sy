# GymPro — Gym & Fitness Management System (Full MERN Stack)

A complete, production-grade **MERN Stack Gym & Fitness Management System** with role-based authentication powered by **`express-session`**, **`passport`**, **`passport-local`**, and **`passport-local-mongoose`**, connected to **MongoDB Atlas**.

---

## 🏛️ System Architecture

### 1. Unified Shared Login Page (`/login`)
- **Single access point** for all four roles:
  - 👑 **Admin** ➔ [`/admin`](file:///c:/Users/hp/Documents/Enyew/projects/gym_sy/client/src/pages/admin/AdminDashboard.jsx)
  - 🏋️ **Trainer** ➔ [`/trainer`](file:///c:/Users/hp/Documents/Enyew/projects/gym_sy/client/src/pages/trainer/TrainerDashboard.jsx)
  - 📋 **Receptionist** ➔ [`/receptionist`](file:///c:/Users/hp/Documents/Enyew/projects/gym_sy/client/src/pages/receptionist/ReceptionistDashboard.jsx)
  - 🏃 **Member** ➔ [`/member`](file:///c:/Users/hp/Documents/Enyew/projects/gym_sy/client/src/pages/member/MemberDashboard.jsx)
- **Automatic Dynamic Redirection**: Evaluates the authenticated session and routes users to their role-specific dashboard.
- **1-Click Demo Quick-Fill**: Easy-testing chips to instantly populate credentials for any role.
- **Forgot Password**: Password reset request modal.

### 2. Public Member Registration (`/register`)
- **Open to the Public**: For anyone joining the gym.
- **Fields**: Full Name, Email, Phone Number, Password, Password Confirmation, and Terms & Conditions acceptance.
- 🛡️ **Enforced Backend Role Security**: In `/api/auth/register-member`, the backend forcefully stamps `role: 'member'`. Any attempt to supply `admin`, `trainer`, or `receptionist` is blocked on the server side.
- **Plan Selection & Payment**: Immediately after registration, the member selects a tier (**Basic**, **Standard**, **Premium**, or **Annual VIP**) and completes mock payment to receive their digital access pass.

### 3. Admin-Only Staff Account Creation (`/admin` & `/admin/staff`)
- **Restricted Access**: Trainers and Receptionists do **not** use the public registration form.
- The Admin provisions staff accounts directly from the **Admin Dashboard** or **Staff Directory**.
- Fields: Staff Role (strictly `trainer` or `receptionist`), Name, Email, Phone, Temporary Password, Specialization, and Certifications.
- Provisioned staff can immediately sign in on the shared login page.

### 4. Role-Specific Dashboards & Features
- **Admin**:
  - Live revenue trends, membership growth metrics, and weekly check-in charts.
  - Staff provisioning, member management, pricing plan creation, equipment inventory, class schedules, and financial reports.
- **Trainer**:
  - Assigned member athlete rosters and coaching observations.
  - Custom Workout Plan Creator (split routines, exercises, sets, reps, weight, rest intervals).
  - Client strength progress tracking (bench press, squat, deadlift) and biometric history.
  - AI Fitness Coach for automated split generation and biomechanical cues.
- **Receptionist**:
  - Interactive Turnstile QR Check-In system with status validation (detects active vs. expired memberships).
  - Walk-in member registration and POS payment collection.
  - Class booking desk and daily attendance logs.
- **Member**:
  - Personal training dashboard with digital QR membership card.
  - Active subscription details, tier upgrade options, and payment receipts.
  - Daily assigned workout routine checklist.
  - AI Assistant for personalized nutrition, macro targets, and recovery tips.

---

## 🔑 Pre-Seeded Test Credentials

| Role | Email | Password | Assigned Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gympro.com` | `password123` | `/admin` |
| **Trainer** | `kassa@gympro.com` | `password123` | `/trainer` |
| **Receptionist** | `kidist@gympro.com` | `password123` | `/receptionist` |
| **Member** | `yonas@email.com` | `password123` | `/member` |

---

## 📡 REST API Endpoints

- **Auth**: `/api/auth/login`, `/api/auth/register-member`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/forgot-password`
- **Admin**: `/api/admin/overview`, `/api/admin/create-staff`, `/api/admin/staff`, `/api/admin/members`
- **Plans**: `/api/plans`
- **Members**: `/api/member/choose-plan`
- **Classes**: `/api/classes`, `/api/classes/:id/enroll`
- **Equipment**: `/api/equipment`, `/api/equipment/:id`
- **Payments**: `/api/payments`, `/api/payments/stats`
- **Attendance**: `/api/attendance`, `/api/attendance/checkin`, `/api/attendance/:id/checkout`
- **Workouts**: `/api/workouts`, `/api/workouts/:id`
- **Progress**: `/api/progress/:memberId`, `/api/progress`
- **AI Coach**: `/api/ai/chat`

---

## 🚀 How to Run

1. **Start the Backend Server**:
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm run dev
   # Client runs on http://localhost:5173
   ```

3. **Run System Verification Tests**:
   ```bash
   node server/test_full_system.js
   ```
