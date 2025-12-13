import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- AUTH PAGES (Login) ---
// Location: src/pages/auth/
import LoginSelection from './pages/auth/LoginSelection';
import AdminLogin from './pages/auth/AdminLogin';
import StudentLogin from './pages/auth/StudentLogin';
import StaffLogin from './pages/auth/StaffLogin';
import ParentLogin from './pages/auth/ParentLogin';

// --- PUBLIC PAGES (Registration & Landing) ---
// Location: src/pages/public/  <--- THIS WAS THE VERCEL ERROR SOURCE
import LandingPage from './pages/public/LandingPage';
import StudentRegister from './pages/public/StudentRegister';
import StaffRegister from './pages/public/StaffRegister';
import NotFound from './pages/public/NotFound'; // Assuming you have this, or use fallback below

// --- PROTECTED DASHBOARDS ---
// Location: src/pages/[role]/
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

// --- STORE ---
import { useAuthStore } from './store/authStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, token } = useAuthStore();
  
  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRole && role !== allowedRole) {
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
        <Route path="/auth" element={<LoginSelection />} />
        
        {/* Registration */}
        <Route path="/auth/student/register" element={<StudentRegister />} />
        <Route path="/auth/staff/register" element={<StaffRegister />} />

        {/* Login Routes */}
        <Route path="/auth/admin" element={<AdminLogin />} />
        <Route path="/auth/student" element={<StudentLogin />} />
        <Route path="/auth/staff" element={<StaffLogin />} />
        <Route path="/auth/parent" element={<ParentLogin />} />

        {/* --- PROTECTED DASHBOARDS --- */}
        
        {/* Admin Dashboard */}
        <Route 
          path="/auth/admin/dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Student Dashboard */}
        <Route 
          path="/auth/student/dashboard" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Staff Dashboard */}
        <Route 
          path="/auth/staff/dashboard" 
          element={
            <ProtectedRoute allowedRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Parent Dashboard (Less strict role check usually) */}
        <Route 
          path="/auth/parent/dashboard" 
          element={
            <ParentDashboard /> 
          } 
        />

        {/* 404 Fallback - Catches any unknown URL */}
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
            <h1 className="text-6xl font-black text-slate-200">404</h1>
            <p className="text-xl font-bold mt-2">Page Not Found</p>
            <p className="text-slate-500 mt-1">The page you are looking for doesn't exist.</p>
            <a href="/" className="mt-6 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition">
              Go Home
            </a>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
