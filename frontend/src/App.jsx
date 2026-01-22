import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- AUTH PAGES (Login) --- 
import LoginSelection from './pages/auth/LoginSelection';
import AdminLogin from './pages/auth/AdminLogin';
import StudentLogin from './pages/auth/StudentLogin';
import StaffLogin from './pages/auth/StaffLogin';
import ParentLogin from './pages/auth/ParentLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// --- PUBLIC PAGES (Registration & Landing) ---
import LandingPage from './pages/public/LandingPage';
import StudentRegister from './pages/public/StudentRegister';
import StaffRegister from './pages/public/StaffRegister';
import NotFound from './pages/public/NotFound';

// --- PROTECTED DASHBOARDS ---
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import StudentCbt from './pages/student/StudentCbt';
import StudentQuiz from './pages/student/StudentQuiz';
import StudentChat from './pages/student/StudentChat';

// --- CBT PAGES ---
import CbtSetup from './pages/student/cbt/CbtSetup';
import CbtExam from './pages/student/cbt/CbtExam';
import CbtResult from './pages/student/cbt/CbtResult';

// --- STORE ---
import { useAuthStore } from './store/authStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If Admin tries to access Student dashboard, redirect to Admin dashboard
    if (role === 'admin') return <Navigate to="/auth/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Selection */}
        <Route path="/auth" element={<LoginSelection />} />

        {/* --- REGISTRATION ROUTES (Fixed to match your Buttons) --- */}
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/register/staff" element={<StaffRegister />} />

        {/* --- LOGIN ROUTES --- */}
        <Route path="/auth/admin" element={<AdminLogin />} />
        <Route path="/auth/student" element={<StudentLogin />} />
        <Route path="/auth/staff" element={<StaffLogin />} />
        <Route path="/auth/parent" element={<ParentLogin />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* --- PROTECTED DASHBOARDS --- */}
        <Route
          path="/auth/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/cbt"
          element={
            <ProtectedRoute allowedRole="student">
              <CbtSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/cbt/exam"
          element={
            <ProtectedRoute allowedRole="student">
              <CbtExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/cbt/result"
          element={
            <ProtectedRoute allowedRole="student">
              <CbtResult />
            </ProtectedRoute>
          }
        />
        <Route path="/student/quiz" element={<ProtectedRoute allowedRole="student"><StudentQuiz /></ProtectedRoute>} />
        <Route path="/student/chat" element={<ProtectedRoute allowedRole="student"><StudentChat /></ProtectedRoute>} />

        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/dashboard"
          element={
            <ParentDashboard />
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
