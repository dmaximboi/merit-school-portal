import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Bell, LogOut, 
  Menu, X, Send, ExternalLink 
} from 'lucide-react';

const StaffDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [myStudents, setMyStudents] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newMsg, setNewMsg] = useState({ title: '', message: '' });

  useEffect(() => {
    if (!token) navigate('/auth/staff');
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      // Get Students in MY Department
      const students = await api.get(`/staff/my-students`, token);
      setMyStudents(students || []);
      
      // Get Broadcasts
      const msgs = await api.get(`/students/announcements`, token);
      setBroadcasts(msgs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!newMsg.title || !newMsg.message) return alert("Fill all fields");
    try {
      await api.post('/schmngt/broadcast', { ...newMsg, target: 'student' }, token);
      alert("Message Sent to Students!");
      setNewMsg({ title: '', message: '' });
      fetchDashboardData();
    } catch (err) {
      alert("Failed to send");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading Staff Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">Staff Portal</h1>
          <p className="text-xs text-slate-400 mt-1">{user?.department} Department</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <TabBtn icon={<LayoutDashboard/>} label="Overview" active={activeTab==='overview'} onClick={()=>setActiveTab('overview')} />
          <TabBtn icon={<Users/>} label="My Students" active={activeTab==='students'} onClick={()=>setActiveTab('students')} />
          <TabBtn icon={<Calendar/>} label="Timetable" active={activeTab==='timetable'} onClick={()=>setActiveTab('timetable')} />
          <TabBtn icon={<Bell/>} label="Broadcasts" active={activeTab==='broadcast'} onClick={()=>setActiveTab('broadcast')} />
        </nav>
        <button onClick={() => {logout(); navigate('/');}} className="p-4 text-red-400 flex items-center gap-2 hover:bg-slate-800 transition-colors">
          <LogOut size={18}/> Logout
        </button>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="md:hidden mb-4 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <Menu size={24} className="text-slate-700"/>
        </button>
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 capitalize">{activeTab}</h1>
          <p className="text-slate-500 mt-1">Welcome, {user?.full_name}</p>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <h3 className="text-slate-500 text-sm font-bold uppercase">My Students</h3>
              <p className="text-4xl font-black text-slate-900 mt-2">{myStudents.length}</p>
              <p className="text-xs text-slate-400 mt-1">In {user?.department}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
              <h3 className="text-slate-500 text-sm font-bold uppercase">Department</h3>
              <p className="text-2xl font-bold text-slate-900 mt-2">{user?.department}</p>
              <p className="text-xs text-slate-400 mt-1">Your assigned department</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <h3 className="text-slate-500 text-sm font-bold uppercase">Position</h3>
              <p className="text-xl font-bold text-slate-900 mt-2">{user?.position || 'Staff'}</p>
              <p className="text-xs text-slate-400 mt-1">Your role</p>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {myStudents.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={48} className="mx-auto text-slate-300 mb-4"/>
                <h3 className="text-lg font-bold text-slate-600">No Students Yet</h3>
                <p className="text-slate-400 mt-2">Students in your department will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-4 font-bold">Name</th>
                      <th className="p-4 font-bold">Student ID</th>
                      <th className="p-4 font-bold">Programme</th>
                      <th className="p-4 font-bold">Phone</th>
                      <th className="p-4 font-bold">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          {s.surname} {s.first_name} {s.last_name}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">{s.student_id_text}</td>
                        <td className="p-4 text-slate-700">{s.program_type}</td>
                        <td className="p-4 text-slate-600">{s.phone_number}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            s.payment_status === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {s.payment_status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <div className="bg-white p-6 rounded-xl shadow-sm max-w-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Send size={20} className="text-primary-600"/> Send Announcement
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
                <input 
                  className="input-field" 
                  placeholder="e.g. Important Notice" 
                  value={newMsg.title} 
                  onChange={e => setNewMsg({...newMsg, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Message</label>
                <textarea 
                  className="input-field h-32 resize-none" 
                  placeholder="Type your message to all students..." 
                  value={newMsg.message} 
                  onChange={e => setNewMsg({...newMsg, message: e.target.value})} 
                />
              </div>
              <button onClick={sendBroadcast} className="btn-primary w-full">
                <Send size={18}/> Post Message
              </button>
            </div>

            {/* Recent Broadcasts */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h4 className="font-bold text-slate-700 mb-4">Recent Announcements</h4>
              {broadcasts.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No broadcasts yet</p>
              ) : (
                <div className="space-y-3">
                  {broadcasts.slice(0, 5).map(msg => (
                    <div key={msg.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h5 className="font-bold text-slate-900">{msg.title}</h5>
                      <p className="text-sm text-slate-600 mt-1">{msg.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* TIMETABLE TAB */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Timetable</h3>
                <p className="text-sm text-slate-500 mt-1">View the official class schedule</p>
              </div>
              <a 
                href="https://meritstudenttimetable.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2"
              >
                <ExternalLink size={18}/> Open Full Site
              </a>
            </div>
            <div className="relative" style={{ height: '600px' }}>
              <iframe 
                src="https://meritstudenttimetable.vercel.app"
                className="w-full h-full border-0"
                title="Merit Student Timetable"
              />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const TabBtn = ({icon, label, active, onClick}) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon} <span className="font-medium">{label}</span>
  </button>
);

export default StaffDashboard;