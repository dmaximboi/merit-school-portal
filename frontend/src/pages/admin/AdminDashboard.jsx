import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, Users, Settings, LogOut, Bell, DollarSign, 
  CheckCircle, XCircle, Printer, Lock, Unlock, Shield, Key, Loader2, AlertTriangle
} from 'lucide-react';
import AdmissionLetter from '../../components/shared/AdmissionLetter';

// Initialize Supabase locally to grab the session
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AdminDashboard = () => {
  const { login, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  
  // Data States
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', target: 'all' });
  
  // Print Logic
 const printRef = useRef();
const [printData, setPrintData] = useState(null);
const handlePrint = useReactToPrint({ contentRef: printRef });

  // Load Initial Data Function - SINGLE DECLARATION
  const loadInitialData = async (token) => {
    setLoading(true);
    try {
      console.log("Fetching Admin Data..."); // Debug Log
      
      // 1. Get All Students directly first to verify DB connection
      const studentsData = await api.get('/schmngt/students', token);
      console.log("Students Received:", studentsData); // CHECK THIS IN CONSOLE
      setStudents(studentsData || []);

      // 2. Get Stats & Settings
      const statsData = await api.get('/schmngt/dashboard-stats', token);
      const settingsData = await api.get('/schmngt/settings', token);
      
      setStats(statsData);
      setFees(settingsData || []);
      
    } catch (err) {
      console.error("Admin Data Load Error:", err);
      // alert("Failed to load student data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // 1. CRITICAL FIX: Get Session from Supabase on Mount
  useEffect(() => {
    const initAdmin = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error("No Admin Session:", error);
          navigate('/auth/admin');
          return;
        }

        // Save to local state & Store
        const token = session.access_token;
        setAdminToken(token);
        setAdminEmail(session.user.email);
        login(session.user, token, 'admin');

        // Now load data with the token
        await loadInitialData(token);
      } catch (err) {
        console.error("Admin Init Failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initAdmin();
  }, [navigate]);

  // --- Feature Actions ---

  const toggleStudentStatus = async (id, action, currentValue) => {
    if (!confirm(`Are you sure you want to ${action} this student?`)) return;
    try {
      await api.post('/schmngt/update-student', { studentId: id, action, value: !currentValue }, adminToken);
      loadInitialData(adminToken); // Refresh
    } catch (err) { alert('Failed to update status'); }
  };

  const sendBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return alert("Fill all fields");
    try {
      await api.post('/schmngt/broadcast', broadcast, adminToken);
      alert('Broadcast Sent Successfully!');
      setBroadcast({ title: '', message: '', target: 'all' });
    } catch (err) { alert('Failed to send broadcast'); }
  };

  const updateFees = async () => {
    try {
      // Map fees back to array format
      const updates = fees.map(f => ({ key: f.key, value: f.value }));
      await api.post('/schmngt/settings', { updates }, adminToken);
      alert('Fees Updated Successfully');
    } catch (err) { alert('Failed to update fees'); }
  };

  const generateStaffCode = async () => {
    try {
      const res = await api.post('/schmngt/generate-code', {}, adminToken);
      alert(`NEW STAFF CODE: ${res.code}\n\nCopy this and give it to the staff member.`);
    } catch (err) { alert('Failed to generate code'); }
  };

  const preparePrint = (student) => {
    setPrintData(student);
    setTimeout(() => handlePrint(), 500); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-900 mb-4"/>
        <p className="text-slate-600">Verifying Admin Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col p-4 fixed h-full z-20 shadow-xl">
        <div className="text-2xl font-bold mb-8 pl-2 border-b border-blue-800 pb-4">Admin Portal</div>
        <nav className="space-y-2 flex-1">
          <TabBtn icon={<LayoutDashboard/>} label="Overview" active={activeTab==='overview'} onClick={()=>setActiveTab('overview')} />
          <TabBtn icon={<Users/>} label="Students" active={activeTab==='students'} onClick={()=>setActiveTab('students')} />
          <TabBtn icon={<Shield/>} label="Staff Codes" active={activeTab==='staff'} onClick={()=>setActiveTab('staff')} />
          <TabBtn icon={<DollarSign/>} label="Fees & Settings" active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} />
          <TabBtn icon={<Bell/>} label="Broadcasts" active={activeTab==='broadcast'} onClick={()=>setActiveTab('broadcast')} />
        </nav>
        <div className="mt-auto pt-4 border-t border-blue-800">
          <p className="text-xs text-blue-300 mb-2 truncate">{adminEmail}</p>
          <button onClick={()=>{logout(); navigate('/');}} className="flex items-center gap-2 text-red-300 p-2 hover:bg-blue-800 rounded w-full transition">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold capitalize text-slate-800">{activeTab} Dashboard</h1>
            <p className="text-sm text-slate-500">Control Panel</p>
          </div>
          <div className="text-sm bg-blue-50 text-blue-800 px-4 py-2 rounded-full font-bold border border-blue-100">
            Session: 2025/2026
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Students" value={stats?.totalStudents} color="blue" icon={<Users/>} />
              <StatCard label="Pending Approval" value={stats?.pendingValidation} color="orange" icon={<AlertTriangle/>} />
              <StatCard label="Revenue (Paid)" value={`₦${stats?.totalRevenue?.toLocaleString() || 0}`} color="green" icon={<DollarSign/>} />
              <StatCard label="Active Staff" value={stats?.totalStaff} color="purple" icon={<Shield/>} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-soft">
                    <h3 className="font-bold text-slate-700 mb-4">Student Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2"><span>JAMB</span> <b>{stats?.breakdown?.jamb || 0}</b></div>
                        <div className="flex justify-between border-b pb-2"><span>O-Level</span> <b>{stats?.breakdown?.olevel || 0}</b></div>
                        <div className="flex justify-between"><span>A-Level</span> <b>{stats?.breakdown?.alevel || 0}</b></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft">
                    <h3 className="font-bold text-slate-700 mb-4">System Health</h3>
                    <div className="flex items-center gap-2 text-green-600 mb-2"><CheckCircle size={16}/> Database Connected</div>
                    <div className="flex items-center gap-2 text-green-600"><CheckCircle size={16}/> Flutterwave API Ready</div>
                </div>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                    <tr>
                    <th className="p-4">Student Info</th>
                    <th className="p-4">Program</th>
                    <th className="p-4">Portal Access</th>
                    <th className="p-4">Parent Mode</th>
                    <th className="p-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                    {students.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-500">No students registered yet.</td></tr>
                    ) : students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                        <div className="font-bold text-slate-900">{s.surname} {s.first_name}</div>
                        <div className="text-xs text-slate-500">{s.student_id_text}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                        </td>
                        <td className="p-4">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{s.program_type}</span>
                        </td>
                        <td className="p-4">
                        <button 
                            onClick={() => toggleStudentStatus(s.id, 'validate', s.is_validated)}
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition ${s.is_validated ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'}`}
                        >
                            {s.is_validated ? <CheckCircle size={12}/> : <Lock size={12}/>}
                            {s.is_validated ? 'Active' : 'Locked'}
                        </button>
                        </td>
                        <td className="p-4">
                        <button 
                            onClick={() => toggleStudentStatus(s.id, 'parent_access', s.is_parent_access_enabled)}
                            className={`text-xs font-medium px-2 py-1 rounded border ${s.is_parent_access_enabled ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-400 border-slate-200'}`}
                        >
                            {s.is_parent_access_enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        </td>
                        <td className="p-4 flex gap-2">
                        <button onClick={() => preparePrint(s)} title="Print Letter" className="p-2 bg-slate-100 rounded hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition"><Printer size={16}/></button>
                        <button onClick={() => toggleStudentStatus(s.id, 'suspend', s.is_suspended)} title="Ban/Unban User" className={`p-2 rounded transition ${s.is_suspended ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500'}`}>
                            {s.is_suspended ? <Lock size={16}/> : <Unlock size={16}/>}
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-soft text-center animate-fadeIn mt-10">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Key size={32}/>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Generate Staff Token</h2>
                <p className="text-slate-500 mb-8">
                    Create a secure, one-time token for a new staff member to register on the portal.
                </p>
                <button onClick={generateStaffCode} className="bg-purple-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-800 transition shadow-lg flex items-center justify-center gap-2 mx-auto w-full sm:w-auto">
                    Generate New Token
                </button>
            </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-xl shadow-soft max-w-3xl mx-auto animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4"><DollarSign/> Manage School Fees</h2>
            <div className="space-y-6">
              {fees.map((fee, idx) => (
                <div key={fee.key || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <label className="font-medium capitalize text-slate-700">{fee.description || fee.key}</label>
                  <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">₦</span>
                      <input 
                        type="number" 
                        className="border border-slate-300 p-2 rounded w-40 focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
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
              <button onClick={updateFees} className="bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 mt-4 w-full font-bold shadow-md">Save Changes</button>
            </div>
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <div className="bg-white p-8 rounded-xl shadow-soft max-w-3xl mx-auto animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4"><Bell/> Send Broadcast Message</h2>
            <div className="space-y-4">
              <div>
                  <label className="label-text">Message Title</label>
                  <input className="input-field" placeholder="e.g. Resumption Date Update" value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})} />
              </div>
              <div>
                  <label className="label-text">Content</label>
                  <textarea className="input-field h-32 resize-none" placeholder="Type your message here..." value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})}></textarea>
              </div>
              <div>
                  <label className="label-text">Target Audience</label>
                  <select className="input-field" value={broadcast.target} onChange={e => setBroadcast({...broadcast, target: e.target.value})}>
                    <option value="all">All Users (Students & Staff)</option>
                    <option value="student">Students Only</option>
                    <option value="staff">Staff Only</option>
                  </select>
              </div>
              <button onClick={sendBroadcast} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 w-full shadow-md flex items-center justify-center gap-2">
                  <Bell size={18}/> Send Broadcast
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Hidden Print Component */}
      <div style={{ display: "none" }}>
        <AdmissionLetter ref={printRef} student={printData} />
      </div>
    </div>
  );
};

// --- Sub Components ---

const TabBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all duration-200 ${active ? 'bg-blue-700 text-white shadow-inner' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
    {icon} <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, color, icon }) => {
  const colors = { 
      blue: "bg-blue-50 text-blue-700 border-blue-100", 
      orange: "bg-orange-50 text-orange-700 border-orange-100", 
      green: "bg-green-50 text-green-700 border-green-100", 
      purple: "bg-purple-50 text-purple-700 border-purple-100" 
  };
  return (
    <div className={`p-6 rounded-xl border shadow-sm flex items-center justify-between ${colors[color]}`}>
      <div>
        <div className="text-xs opacity-80 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-black mt-1">{value || 0}</div>
      </div>
      <div className="opacity-80">{icon}</div>
    </div>
  );
};

export default AdminDashboard;