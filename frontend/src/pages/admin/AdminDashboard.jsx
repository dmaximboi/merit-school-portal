import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import {
  LayoutDashboard, Users, DollarSign, LogOut, Bell,
  CheckCircle, XCircle, Printer, Lock, Unlock, Shield, Key, Laptop,
  Loader2, AlertTriangle, Book, FileCheck, Search, Activity, Trash2, Edit,
  Menu, X, RefreshCw, Save, Send, CreditCard, BrainCircuit, FileText, Download
} from 'lucide-react';
import AdmissionLetter from '../../components/shared/AdmissionLetter';
import LibraryView from '../../components/shared/LibraryView';
import AdminENotesView from './AdminENotesView';
import ChatInterface from '../../components/shared/ChatInterface';
import FormPreview from '../../components/FormPreview';
import AdminPriceControls from '../../components/admin/AdminPriceControls';
import AdminCbtPanel from '../../components/admin/AdminCbtPanel';
import StudentExport from '../../components/admin/StudentExport';
import { SUBJECTS_LIST } from '../../lib/constants';

const AdminDashboard = () => {
  const { user, token, role, logout } = useAuthStore();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- DATA STATES ---
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [fees, setFees] = useState([]);
  const [staffList, setStaffList] = useState([]); // ADDED STAFF STATE
  const [transactionLogs, setTransactionLogs] = useState([]); // NEW: Transactions
  const [cbtQuestions, setCbtQuestions] = useState([]); // NEW: CBT Questions (fetched lazily or initialized)

  // --- BROADCAST STATE ---
  const [broadcastList, setBroadcastList] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', target: 'all' });
  const [isEditingBroadcast, setIsEditingBroadcast] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showExport, setShowExport] = useState(false);

  // --- RESULT UPLOAD STATES ---
  const [selectedStudentForResults, setSelectedStudentForResults] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [scoreData, setScoreData] = useState({ subject: '', ca: '', exam: '' });

  // --- PRINTING UTILS ---
  const printRef = useRef();
  const [printData, setPrintData] = useState(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // --- FORM PRINTING ---
  const formPrintRef = useRef();
  const [printingStudent, setPrintingStudent] = useState(null);
  const handleFormPrint = useReactToPrint({
    contentRef: formPrintRef,
    onAfterPrint: () => setPrintingStudent(null)
  });

  useEffect(() => {
    if (printingStudent) {
      handleFormPrint();
    }
  }, [printingStudent]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!token || !user) {
      navigate('/auth/admin');
      return;
    }

    if (role !== 'admin') {
      alert("Access Denied: You are not an administrator.");
      logout();
      navigate('/auth/admin');
      return;
    }

    loadInitialData(token);
  }, [token, user, role, navigate, logout]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredStudents(students.filter(s =>
        s.surname?.toLowerCase().includes(lower) ||
        s.first_name?.toLowerCase().includes(lower) ||
        s.student_id_text?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower)
      ));
    }
  }, [searchTerm, students]);

  // --- DATA LOADING ---
  const loadInitialData = async (authToken) => {
    setRefreshing(true);
    try {
      console.log("Fetching Admin Data...");

      // ADDED '/schmngt/staff' to the fetch list
      const [studentsData, statsData, settingsData, logsData, msgsData, staffData, transData] = await Promise.all([
        api.get('/schmngt/students', authToken),
        api.get('/schmngt/dashboard-stats', authToken),
        api.get('/schmngt/settings', authToken),
        api.get('/activity-logs/all', authToken),
        api.get('/students/announcements', authToken),
        api.get('/schmngt/staff', authToken),
        api.get('/schmngt/transactions', authToken)
      ]);

      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);
      setTransactionLogs(transData || []);
      setStats(statsData);
      setFees(settingsData || []);
      setActivityLogs(logsData || []);
      setBroadcastList(msgsData || []);
      setStaffList(staffData || []); // SET STAFF DATA

    } catch (err) {
      console.error("Admin Data Load Error:", err);
      if (err.message && err.message.includes('401')) {
        logout();
        navigate('/auth/admin');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- STUDENT ACTIONS ---

  const toggleStudentStatus = async (id, action, currentValue, student = null) => {
    // LOCK PROTECTION: Prevent locking if paid
    if (action === 'validate' && currentValue === true) {
      if (student && student.payment_status === 'paid') {
        alert("ACTION DENIED: You cannot Lock/Deactivate a student who has already paid.");
        return;
      }
    }

    const actionName = action === 'validate' ? (currentValue ? 'Lock' : 'Activate') :
      action === 'parent_access' ? (currentValue ? 'Disable Parent' : 'Enable Parent') : 'Update';

    if (!confirm(`Are you sure you want to ${actionName} this student?`)) return;

    try {
      await api.post('/schmngt/update-student', { studentId: id, action, value: !currentValue }, token);
      setStudents(prev => prev.map(s => {
        if (s.id !== id) return s;
        if (action === 'validate') return { ...s, is_validated: !currentValue };
        if (action === 'parent_access') return { ...s, is_parent_access_enabled: !currentValue };
        return s;
      }));
    } catch (err) { alert('Failed to update status'); }
  };

  // --- PAYMENT BYPASS ---
  const bypassPayment = async (student) => {
    const confirmMsg = `MANUAL VERIFICATION\n\nAre you sure you want to mark ${student.surname}'s payment as COMPLETE (Paid)?\n\nThis will unlock their portal immediately.`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.post('/schmngt/update-student', {
        studentId: student.id,
        action: 'payment_status',
        value: 'paid'
      }, token);

      alert("Success: Payment Manually Verified.");

      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, payment_status: 'paid' } : s));
    } catch (err) {
      alert("Failed to bypass payment: " + err.message);
    }
  };

  const deleteStudent = async (id) => {
    const confirmMsg = "⚠️ DANGER: This will PERMANENTLY DELETE the student and ALL their records (Results, Payments, etc).\n\nAre you absolutely sure?";
    if (!confirm(confirmMsg)) return;

    try {
      await api.delete(`/schmngt/students/${id}`, token);
      alert("Student Deleted Successfully");
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  // Admin CBT Bypass - Grant 1 month free access
  const bypassCbt = async (student) => {
    const confirmMsg = `Grant ${student.surname} ${student.first_name} 1 MONTH free CBT access?\n\nThis bypasses the ₦2,000 subscription.`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.post('/subscriptions/cbt/bypass', { student_id: student.id }, token);
      alert(`✅ CBT Access Granted!\n\n${student.surname} now has 1 month free CBT access.`);

      // Update local state
      setStudents(prev => prev.map(s =>
        s.id === student.id
          ? { ...s, cbt_subscription_active: true }
          : s
      ));
    } catch (err) {
      alert("Failed to bypass CBT: " + err.message);
    }
  };

  const preparePrint = (student) => {
    setPrintData(student);
    setTimeout(() => handlePrint(), 500);
  };

  const prepareRegistrationPrint = (s) => {
    // Map DB student to FormPreview structure
    const formData = {
      surname: s.surname, middleName: s.first_name, lastName: s.last_name,
      gender: s.gender, dateOfBirth: s.dob,
      stateOfOrigin: s.state_of_origin, lga: s.lga, permanentAddress: s.address,
      parentsPhone: s.parents_phone, studentPhone: s.phone_number, email: s.email,
      programme: s.program_type, department: s.department,
      subjects: typeof s.subjects === 'string' ? JSON.parse(s.subjects) : (s.subjects || []),
      university: s.university_choice, course: s.course_choice,
      photoPreview: s.photo_url,
      signature: `${s.surname} ${s.first_name}` // Proxy signature
    };
    setPrintingStudent(formData);
    // Print triggers via useEffect
  };

  // --- FEE MANAGEMENT ---

  const updateFees = async () => {
    if (!confirm("This will update the school fees for ALL students immediately. Proceed?")) return;

    try {
      const updates = fees.map(f => ({ key: f.key, value: f.value.toString() }));
      await api.post('/schmngt/settings', { updates }, token);

      alert('Fees Updated Successfully');
      const newSettings = await api.get('/schmngt/settings', token);
      setFees(newSettings || []);
    } catch (err) {
      alert('Failed to update fees');
    }
  };

  // --- RESULT UPLOAD ---

  const handleStudentSelectForResult = (student) => {
    setSelectedStudentForResults(student);

    let subs = [];
    if (Array.isArray(student.subjects)) {
      subs = student.subjects;
    } else if (typeof student.subjects === 'string') {
      try {
        subs = JSON.parse(student.subjects);
      } catch (e) {
        subs = [];
      }
    }

    setStudentSubjects(subs);
    setScoreData({ subject: '', ca: '', exam: '' });
  };

  const uploadResult = async () => {
    if (!selectedStudentForResults || !scoreData.subject) return alert("Select student and subject");

    try {
      await api.post('/results/upload', {
        student_id: selectedStudentForResults.id,
        subject: scoreData.subject,
        ca: scoreData.ca,
        exam: scoreData.exam,
        term: 'First Term',
        session: '2025/2026'
      }, token);

      alert(`Result for ${scoreData.subject} Saved Successfully!`);
      setScoreData({ subject: '', ca: '', exam: '' });
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  // --- STAFF & BROADCAST ---

  const generateStaffCode = async () => {
    try {
      const res = await api.post('/schmngt/generate-code', {}, token);
      navigator.clipboard.writeText(res.code);
      alert(`NEW TOKEN GENERATED: ${res.code}\n\n(Copied to clipboard)`);
    } catch (err) { alert('Failed to generate code'); }
  };

  const handleBroadcastSubmit = async () => {
    if (!broadcast.title || !broadcast.message) return alert("Fill all fields");

    try {
      if (isEditingBroadcast && editingId) {
        await api.put(`/schmngt/broadcast/${editingId}`, broadcast, token);
        alert('Broadcast Updated Successfully!');
      } else {
        await api.post('/schmngt/broadcast', broadcast, token);
        alert('Broadcast Sent Successfully!');
      }

      setBroadcast({ title: '', message: '', target: 'all' });
      setIsEditingBroadcast(false);
      setEditingId(null);
      const msgs = await api.get('/students/announcements', token);
      setBroadcastList(msgs || []);

    } catch (err) { alert('Failed to process broadcast: ' + err.message); }
  };

  const prepareEditBroadcast = (msg) => {
    setBroadcast({ title: msg.title, message: msg.message, target: msg.target_audience });
    setEditingId(msg.id);
    setIsEditingBroadcast(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBroadcast = async (id) => {
    if (!confirm("Delete this broadcast? It will be removed from all student/staff dashboards.")) return;
    try {
      await api.delete(`/schmngt/broadcast/${id}`, token);
      setBroadcastList(prev => prev.filter(b => b.id !== id));
      alert("Broadcast deleted successfully.");
    } catch (err) { alert("Failed to delete"); }
  };

  // --- RENDER LOADERS ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-900 mb-4" />
        <p className="text-slate-600 font-medium">Loading Management Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 relative">

      {/* --- SIDEBAR --- */}
      <aside className={`
        bg-slate-900 text-white flex flex-col fixed h-full z-30 shadow-2xl transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className={`flex items-center gap-3 transition-opacity ${!sidebarOpen && 'opacity-0 hidden'}`}>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img src="/meritlogo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">MERIT</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} className="mx-auto" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto mt-4 custom-scrollbar">
          <TabBtn icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} expanded={sidebarOpen} onClick={() => setActiveTab('overview')} />
          <TabBtn icon={<Users />} label="Students" active={activeTab === 'students'} expanded={sidebarOpen} onClick={() => setActiveTab('students')} />
          <TabBtn icon={<FileCheck />} label="Results Mgt" active={activeTab === 'results'} expanded={sidebarOpen} onClick={() => setActiveTab('results')} />
          <TabBtn icon={<Activity />} label="Activity Log" active={activeTab === 'logs'} expanded={sidebarOpen} onClick={() => setActiveTab('logs')} />
          <TabBtn icon={<FileText />} label="E-Notes Approval" active={activeTab === 'enotes'} expanded={sidebarOpen} onClick={() => setActiveTab('enotes')} />
          <TabBtn icon={<Book />} label="Library" active={activeTab === 'library'} expanded={sidebarOpen} onClick={() => setActiveTab('library')} />
          <TabBtn icon={<Bell />} label="Broadcasts" active={activeTab === 'broadcast'} expanded={sidebarOpen} onClick={() => setActiveTab('broadcast')} />
          <TabBtn icon={<Shield />} label="Staff" active={activeTab === 'staff'} expanded={sidebarOpen} onClick={() => setActiveTab('staff')} />
          <TabBtn icon={<CreditCard />} label="Transactions" active={activeTab === 'transactions'} expanded={sidebarOpen} onClick={() => setActiveTab('transactions')} />
          <TabBtn icon={<BrainCircuit />} label="CBT & Quiz" active={activeTab === 'cbt'} expanded={sidebarOpen} onClick={() => setActiveTab('cbt')} />
          <TabBtn icon={<Send />} label="Chat" active={activeTab === 'chat'} expanded={sidebarOpen} onClick={() => setActiveTab('chat')} />
          <TabBtn icon={<DollarSign />} label="Settings" active={activeTab === 'settings'} expanded={sidebarOpen} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className={`flex items-center gap-3 text-red-300 hover:text-white hover:bg-slate-800 transition w-full p-2 rounded ${!sidebarOpen && 'justify-center'}`}
            title="Logout"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 capitalize tracking-tight flex items-center gap-3">
              {activeTab === 'overview' ? 'Dashboard' : activeTab}
              {refreshing && <Loader2 className="animate-spin text-slate-400" size={20} />}
            </h2>
            <p className="text-slate-500 font-medium mt-1">Academic Session: <span className="text-blue-600 font-bold">2025/2026</span></p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user?.email || "Admin User"}</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-slate-500 font-medium">Super Admin</p>
              </div>
            </div>
            <button onClick={() => loadInitialData(token)} className="p-2 hover:bg-slate-100 rounded-full transition" title="Refresh Data">
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* ======================= TAB CONTENT ======================= */}

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Students" value={stats?.totalStudents} icon={<Users />} color="blue" />
              <StatCard label="Total Revenue" value={`₦${stats?.totalRevenue?.toLocaleString()}`} icon={<DollarSign />} color="green" />
              <StatCard label="Staff Count" value={stats?.totalStaff} icon={<Shield />} color="purple" />
              <StatCard label="Pending Approval" value={stats?.pendingValidation} icon={<AlertTriangle />} color="orange" />
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ActionButton onClick={() => setActiveTab('students')} icon={<Users />} label="Manage Students" color="blue" />
                <ActionButton onClick={() => setActiveTab('results')} icon={<FileCheck />} label="Upload Results" color="purple" />
                <ActionButton onClick={() => setActiveTab('broadcast')} icon={<Bell />} label="Send Alert" color="orange" />
                <ActionButton onClick={generateStaffCode} icon={<Key />} label="Generate Token" color="green" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-6 text-slate-800">Enrollment Breakdown</h3>
                <div className="space-y-6">
                  <ProgressBar label="JAMB Students" count={stats?.breakdown?.jamb} total={stats?.totalStudents} color="bg-blue-500" />
                  <ProgressBar label="A-Level Students" count={stats?.breakdown?.alevel} total={stats?.totalStudents} color="bg-purple-500" />
                  <ProgressBar label="O-Level Students" count={stats?.breakdown?.olevel} total={stats?.totalStudents} color="bg-orange-500" />
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h3 className="font-bold text-2xl text-slate-900 mb-2">System Healthy</h3>
                <p className="text-slate-500">All services (Database, Auth, Payments) are operational.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  placeholder="Search students by name, ID, or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="px-4 py-3 bg-slate-100 rounded-lg text-sm font-bold text-slate-600 flex items-center">
                {filteredStudents.length} Students
              </div>
              <button
                onClick={() => setShowExport(true)}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
              >
                <Download size={18} />
                Export
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="p-5">Student Identity</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Program</th>
                      <th className="p-5">Access Control</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan="5" className="p-10 text-center text-slate-500 italic">No students found matching your search.</td></tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="p-5">
                            <div className="font-bold text-slate-900 text-base">{s.surname} {s.first_name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">{s.student_id_text}</div>
                          </td>
                          <td className="p-5">
                            {s.payment_status === 'paid' ?
                              <span className="inline-flex items-center gap-1.5 text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full text-xs">
                                <CheckCircle size={14} /> PAID
                              </span> :
                              <button
                                onClick={() => bypassPayment(s)}
                                className="inline-flex items-center gap-1.5 text-red-700 font-bold bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full text-xs transition border border-red-200"
                                title="Click to Manually Approve Payment (Bypass)"
                              >
                                <XCircle size={14} /> PENDING (Approve)
                              </button>
                            }
                          </td>
                          <td className="p-5">
                            <span className="font-medium text-slate-700">{s.program_type}</span>
                            <p className="text-xs text-slate-400">{s.department}</p>
                          </td>
                          <td className="p-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleStudentStatus(s.id, 'validate', s.is_validated, s)}
                                disabled={s.payment_status === 'paid' && s.is_validated}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${s.is_validated
                                  ? (s.payment_status === 'paid' ? 'bg-green-100 text-green-700 opacity-50 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                title={s.payment_status === 'paid' && s.is_validated ? "Cannot Lock Paid Student" : "Toggle Access"}
                              >
                                {s.is_validated ? (s.payment_status === 'paid' ? 'Unlocked (Paid)' : 'Active') : 'Locked'}
                              </button>
                              <button
                                onClick={() => toggleStudentStatus(s.id, 'parent_access', s.is_parent_access_enabled)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${s.is_parent_access_enabled ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                Parents
                              </button>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => bypassCbt(s)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition" title="Grant 1 Month CBT Access"><Laptop size={18} /></button>
                              <button onClick={() => prepareRegistrationPrint(s)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition" title="Print Registration Form"><FileText size={18} /></button>
                              <button onClick={() => preparePrint(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Print Admission Letter"><Printer size={18} /></button>
                              <button onClick={() => deleteStudent(s.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Delete Student"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STAFF SECTION FIXED */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Staff Management</h3>
              <button onClick={generateStaffCode} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition">
                + Generate Reg Token
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr><th className="p-5">Name</th><th className="p-5">Email</th><th className="p-5">Role</th><th className="p-5">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">No staff members found.</td></tr> :
                  staffList.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="p-5 font-medium">{st.full_name}</td>
                      <td className="p-5 text-slate-500">{st.email}</td>
                      <td className="p-5"><span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Staff</span></td>
                      <td className="p-5"><span className="text-green-600 font-bold text-xs">Active</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-800">Transaction Logs</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-5">Date</th>
                  <th className="p-5">Student</th>
                  <th className="p-5">Ref / Info</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactionLogs.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">No transactions recorded.</td></tr> :
                  transactionLogs.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-5 text-slate-600">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="p-5 font-bold">{tx.students ? `${tx.students.surname} ${tx.students.first_name}` : 'Unknown'}</td>
                      <td className="p-5 font-mono text-xs">{tx.transaction_ref || tx.reference}</td>
                      <td className="p-5">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tx.status === 'approved' ? 'bg-green-100 text-green-700' : tx.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        {tx.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                if (!confirm('Approve this transaction? Student payment will be marked PAID.')) return;
                                await api.post('/schmngt/transactions/update', { id: tx.id, status: 'approved' }, token);
                                setTransactionLogs(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'approved' } : t));
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700"
                            >Approve</button>
                            <button
                              onClick={async () => {
                                if (!confirm('Reject this transaction?')) return;
                                await api.post('/schmngt/transactions/update', { id: tx.id, status: 'rejected' }, token);
                                setTransactionLogs(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'rejected' } : t));
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                            >Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}



        {/* CBT MANAGEMENT TAB */}
        {activeTab === 'cbt' && (
          <div className="animate-fadeIn">
            <AdminCbtPanel />
          </div>
        )}

        {activeTab === 'results' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
              <h3 className="font-bold mb-4 text-lg border-b pb-4 flex items-center gap-2"><Users size={20} /> Select Student</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input className="w-full pl-9 p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white transition" placeholder="Search for result upload..." onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleStudentSelectForResult(s)}
                    className={`p-4 rounded-xl cursor-pointer transition border ${selectedStudentForResults?.id === s.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                  >
                    <div className="font-bold text-slate-900">{s.surname} {s.first_name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{s.student_id_text} • {s.department}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-8">
              <h3 className="font-bold mb-6 text-lg border-b pb-4 flex items-center gap-2"><FileCheck size={20} /> Enter Scores</h3>
              <div className="space-y-6">

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Selected Student</label>
                  <div className="font-bold text-lg text-slate-800">
                    {selectedStudentForResults ? `${selectedStudentForResults.surname} ${selectedStudentForResults.first_name}` : <span className="text-slate-400 italic">None Selected</span>}
                  </div>
                </div>

                <div>
                  <label className="label-text">Subject</label>
                  <select
                    className="input-field w-full"
                    value={scoreData.subject}
                    onChange={e => setScoreData({ ...scoreData, subject: e.target.value })}
                    disabled={!selectedStudentForResults}
                  >
                    <option value="">-- Choose Subject --</option>
                    {studentSubjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                    {studentSubjects.length === 0 && (
                      <>
                        <option value="Mathematics">Mathematics</option>
                        <option value="English Language">English Language</option>
                        <option value="General Paper">General Paper</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label-text">CA Score (40)</label>
                    <input type="number" className="input-field w-full text-center font-mono font-bold" max="40" value={scoreData.ca} onChange={e => setScoreData({ ...scoreData, ca: e.target.value })} disabled={!selectedStudentForResults} />
                  </div>
                  <div>
                    <label className="label-text">Exam Score (60)</label>
                    <input type="number" className="input-field w-full text-center font-mono font-bold" max="60" value={scoreData.exam} onChange={e => setScoreData({ ...scoreData, exam: e.target.value })} disabled={!selectedStudentForResults} />
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100">
                  <div>
                    <span className="text-slate-500 text-sm">Total Score</span>
                    <div className="font-black text-3xl text-blue-900">{(Number(scoreData.ca) + Number(scoreData.exam)) || 0}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-sm">Grade</span>
                    <div className="font-black text-3xl text-blue-900">{calculateGrade(Number(scoreData.ca) + Number(scoreData.exam))}</div>
                  </div>
                </div>

                <button
                  onClick={uploadResult}
                  disabled={!selectedStudentForResults || !scoreData.subject}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${!selectedStudentForResults || !scoreData.subject ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1'}`}
                >
                  Upload Result to Portal
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-800">System Activity Log</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr><th className="p-5">Time</th><th className="p-5">User</th><th className="p-5">Action</th><th className="p-5">Metadata</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityLogs.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">No activity recorded yet.</td></tr> :
                  activityLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-5 text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-5 font-medium">{log.student_name}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${log.action.includes('payment') ? 'bg-green-100 text-green-700' :
                          log.action.includes('register') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-slate-400 font-mono truncate max-w-[200px]">{log.device_info || log.ip_address}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="animate-fadeIn">
            <LibraryView user={{ id: 'admin', email: user?.email, full_name: 'Administrator' }} role="admin" isAdmin={true} token={token} />
          </div>
        )}

        {/* E-NOTES APPROVAL TAB */}
        {activeTab === 'enotes' && (
          <div className="animate-fadeIn">
            <AdminENotesView user={user} token={token} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-200 animate-fadeIn">
            <h3 className="font-bold text-2xl mb-8 text-slate-900 border-b pb-4">Fee Structure Configuration</h3>
            <div className="space-y-6">
              {fees.map((fee, idx) => (
                <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition">
                  <div>
                    <p className="font-bold text-slate-700 capitalize text-lg">{fee.key.replace('fee_', '')} Fee</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">{fee.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-lg">₦</span>
                    <input
                      type="number"
                      className="border border-slate-300 p-3 rounded-lg w-40 font-mono font-bold text-right focus:ring-2 focus:ring-blue-500 outline-none"
                      value={fee.value}
                      onChange={(e) => {
                        const newFees = [...fees];
                        newFees[idx].value = e.target.value;
                        setFees(newFees);
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-6">
                <button onClick={updateFees} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Save size={20} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-2xl mb-8 text-slate-900 border-b pb-4 flex items-center gap-2">
                <Bell size={24} /> {isEditingBroadcast ? 'Edit Broadcast' : 'Send Broadcast'}
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="label-text">Message Title</label>
                  <input className="input-field w-full" placeholder="e.g. Resumption Date" value={broadcast.title} onChange={e => setBroadcast({ ...broadcast, title: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Message Body</label>
                  <textarea className="input-field w-full h-40 resize-none p-4" placeholder="Type your announcement here..." value={broadcast.message} onChange={e => setBroadcast({ ...broadcast, message: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Target Audience</label>
                  <select className="input-field w-full" value={broadcast.target} onChange={e => setBroadcast({ ...broadcast, target: e.target.value })}>
                    <option value="all">Everyone (Staff & Students)</option>
                    <option value="student">Students Only</option>
                    <option value="staff">Staff Only</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleBroadcastSubmit} className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    {isEditingBroadcast ? 'Update Message' : 'Send Broadcast'} <Send size={18} />
                  </button>
                  {isEditingBroadcast && (
                    <button onClick={() => { setIsEditingBroadcast(false); setBroadcast({ title: '', message: '', target: 'all' }); }} className="px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
              <h3 className="font-bold text-xl mb-6 text-slate-900">Recent Broadcasts</h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {!broadcastList || broadcastList.length === 0 ? <p className="text-slate-400 text-center py-10">No broadcasts found.</p> :
                  broadcastList.map(msg => (
                    <div key={msg.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{msg.title}</h4>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-1 rounded border">{msg.target_audience}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4">{msg.message}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => prepareEditBroadcast(msg)} className="text-blue-600 font-bold hover:underline flex items-center gap-1"><Edit size={12} /> Edit</button>
                          <button onClick={() => deleteBroadcast(msg.id)} className="text-red-500 font-bold hover:underline flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Send className="text-purple-600" /> Institution Chat
              </h2>
              <p className="text-slate-500 mb-6">Communicate with students and staff in real-time.</p>
              <ChatInterface user={user} token={token} role={role} />
            </div>
          </div>
        )}

      </main>

      <div style={{ display: "none" }}>
        <AdmissionLetter ref={printRef} student={printData} />
        {printingStudent && (
          <div ref={formPrintRef}>
            <FormPreview formData={printingStudent} />
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && <StudentExport onClose={() => setShowExport(false)} />}
    </div>
  );
};

const TabBtn = ({ icon, label, active, expanded, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-4 px-4 py-3 rounded-xl w-full text-left transition-all duration-200
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
      ${!expanded && 'justify-center px-2'}
    `}
    title={!expanded ? label : ''}
  >
    <div className={active ? 'text-white' : ''}>{icon}</div>
    {expanded && <span className="font-semibold text-sm tracking-wide">{label}</span>}
  </button>
);

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100'
  };
  return (
    <div className={`p-6 rounded-2xl shadow-sm border ${colors[color].replace('bg-', 'border-').split(' ')[2]} bg-white flex items-center justify-between group hover:shadow-md transition-all`}>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value || 0}</p>
      </div>
      <div className={`p-4 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
  );
};

const ActionButton = ({ onClick, icon, label, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white',
    green: 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${colors[color]} shadow-sm hover:shadow-lg`}>
      <div className="mb-3 transform scale-125">{icon}</div>
      <span className="font-bold text-xs uppercase tracking-wide text-center">{label}</span>
    </button>
  );
};

const ProgressBar = ({ label, count, total, color }) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="text-xs font-bold text-slate-400">{count || 0} Students</span>
    </div>
    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${total ? (count / total) * 100 : 0}%` }}></div>
    </div>
  </div>
);

const calculateGrade = (total) => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

export default AdminDashboard;
