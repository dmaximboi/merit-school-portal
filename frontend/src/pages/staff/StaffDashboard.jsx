import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Bell, LogOut, 
  Menu, X, Send, ExternalLink, FileCheck
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

  // Results Management State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scoreData, setScoreData] = useState({ subject: '', ca: '', exam: '' });

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

  // Results Management Function
  const uploadResult = async () => {
    if(!selectedStudent || !scoreData.subject) return alert("Select student and subject");
    try {
      await api.post('/results/upload', {
        student_id: selectedStudent.id,
        subject: scoreData.subject,
        ca: scoreData.ca,
        exam: scoreData.exam,
        term: 'First Term',
        session: '2025/2026'
      }, token);
      alert("Result Saved Successfully!");
      setScoreData({ subject: '', ca: '', exam: '' });
    } catch(err) {
      alert(err.message || "Failed to upload result");
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
          <TabBtn icon={<FileCheck/>} label="Results Entry" active={activeTab==='results'} onClick={()=>setActiveTab('results')} />
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
                          {s.surname} {s.first_name}
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

        {/* RESULTS ENTRY TAB */}
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Student List */}
            <div className="bg-white p-6 rounded-xl shadow-sm h-96 overflow-y-auto">
              <h3 className="font-bold mb-4 text-lg text-slate-800">Select Student</h3>
              <div className="space-y-2">
                {myStudents.map(s => (
                  <div 
                    key={s.id} 
                    onClick={()=>setSelectedStudent(s)} 
                    className={`p-3 border-b cursor-pointer hover:bg-blue-50 transition-colors rounded-lg ${
                      selectedStudent?.id === s.id 
                      ? 'bg-blue-100 border-blue-500 border-l-4' 
                      : 'border-slate-100'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{s.surname} {s.first_name}</div>
                    <div className="text-xs text-slate-500">{s.student_id_text} • {s.program_type}</div>
                    <div className="text-xs text-slate-400">{s.department}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-slate-800">
                Enter Scores for: <span className="text-blue-600">{selectedStudent?.surname || 'Select Student'}</span>
              </h3>
              <div className="space-y-4">
                <select 
                  className="input-field w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={scoreData.subject} 
                  onChange={e=>setScoreData({...scoreData, subject: e.target.value})}
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Economics">Economics</option>
                  <option value="Government">Government</option>
                  <option value="Literature">Literature</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    className="input-field p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="CA (40)" 
                    min="0"
                    max="40"
                    value={scoreData.ca} 
                    onChange={e=>setScoreData({...scoreData, ca: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    className="input-field p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Exam (60)" 
                    min="0"
                    max="60"
                    value={scoreData.exam} 
                    onChange={e=>setScoreData({...scoreData, exam: e.target.value})} 
                  />
                </div>
                <button 
                  onClick={uploadResult} 
                  disabled={!selectedStudent || !scoreData.subject}
                  className={`w-full p-3 rounded-lg font-bold transition ${
                    !selectedStudent || !scoreData.subject
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Save Result
                </button>
                
                {scoreData.ca && scoreData.exam && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Total Score:</span>
                      <span className="font-bold text-blue-700 text-lg">
                        {(parseFloat(scoreData.ca || 0) + parseFloat(scoreData.exam || 0)).toFixed(1)}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-700">Grade:</span>
                      <span className="font-bold text-lg">
                        {calculateGrade(parseFloat(scoreData.ca || 0) + parseFloat(scoreData.exam || 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

// Grade calculation helper function
const calculateGrade = (total) => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

export default StaffDashboard;