import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, TrendingUp } from 'lucide-react';

const ParentDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) navigate('/auth/parent');
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-teal-50 font-sans">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-teal-900">Parent Portal</h1>
        <button onClick={() => {logout(); navigate('/');}} className="text-red-600 flex gap-2 items-center"><LogOut size={18}/> Logout</button>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white p-6 rounded-xl shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><User className="text-teal-600"/> Ward: {user?.full_name || 'Student'}</h2>
          <p className="text-slate-500 mt-1">Student ID: {user?.student_id}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-soft border-t-4 border-teal-500">
            <h3 className="font-bold mb-2 flex items-center gap-2"><TrendingUp size={20}/> Academic Status</h3>
            <p className="text-slate-600">Enrolled Programme: {user?.program_type || 'N/A'}</p>
            <p className="text-slate-600">Department: {user?.department || 'Science'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-soft border-t-4 border-orange-500">
            <h3 className="font-bold mb-2">Financial Status</h3>
            <p className="text-slate-600">Current Session: 2025/2026</p>
            <p className="text-orange-600 font-medium">Fees Status: Check with Admin</p>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ParentDashboard;