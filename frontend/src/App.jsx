import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth Pages
import LoginSelection from './pages/auth/LoginSelection';
import StudentLogin from './pages/auth/StudentLogin';
import StaffLogin from './pages/auth/StaffLogin';
import AdminLogin from './pages/auth/AdminLogin';
import ParentLogin from './pages/auth/ParentLogin';

// Registration Pages
import StudentRegister from './pages/public/StudentRegister';
import StaffRegister from './pages/public/StaffRegister';

// Dashboards
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';

// Shared
import LandingPage from './pages/public/LandingPage';
import NotFound from './pages/public/NotFound';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/auth" element={<LoginSelection />} />
        <Route path="/auth/student" element={<StudentLogin />} />
        <Route path="/auth/staff" element={<StaffLogin />} />
        <Route path="/auth/admin" element={<AdminLogin />} />
        <Route path="/auth/parent" element={<ParentLogin />} />
        
        {/* Registration Routes */}
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/register/staff" element={<StaffRegister />} />

        {/* Protected Dashboards */}
        <Route path="/student/*" element={<StudentDashboard />} />
        <Route path="/parent/*" element={<ParentDashboard />} />
        <Route path="/schmngt/*" element={<AdminDashboard />} />
        <Route path="/staff/*" element={<StaffDashboard />} />

        {/* 404 Handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
