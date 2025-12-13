import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, Users, FileCheck, LogOut, Search, 
  Menu, X, Loader2, Save, BookOpen, RefreshCw, 
  Calendar, Bell, Send, ExternalLink, CheckCircle, AlertTriangle
} from 'lucide-react';

const StaffDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- DATA ---
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [currentSession, setCurrentSession] = useState('2025/2026');
  const [searchTerm, setSearchTerm] = useState('');

  // --- RESULT MANAGEMENT STATE ---
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]); // <--- NEW: To show history
  const [scoreData, setScoreData] = useState({
    subject: '',
    ca: '',
    exam: '',
    term: 'First Term'
  });

  // --- BROADCAST STATE ---
  const [newMsg, setNewMsg] = useState({ title: '', message: '' });

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!user) { navigate('/auth/staff'); return; }
    loadInitialData();
  }, [user, navigate]);

  // Search Logic
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredStudents(students.filter(s => 
        s.surname?.toLowerCase().includes(lower) || 
        s.first_name?.toLowerCase().includes(lower) || 
        s.student_id_text?.toLowerCase().includes(lower)
      ));
    }
  }, [searchTerm, students]);

  // --- DATA FETCHING ---
  const loadInitialData = async () => {
    setRefreshing(true);
    try {
      console.log("Fetching Staff Data...");
      
      // 1. Fetch Students (Using the admin endpoint for now, or specific staff endpoint)
      // Note: If this fails with 403, we need to ensure the backend route allows staff
      const studentsData = await api.get('/schmngt/students'); 
      
      // 2. Fetch Settings (For Session)
      const settings = await api.get('/schmngt/settings');
      const session = settings.find(s => s.key === 'current_session')?.value || '2025/2026';

      // 3. Fetch Broadcasts
      const msgs = await api.get('/students/announcements');

      // Filter students by Staff Department (if applicable)
      // If user.department is "General", show all. Else filter.
      const myStudents = (user.department && user.department !== 'General')
        ? studentsData.filter(s => s.department === user.department || s.department === 'General')
        : studentsData;

      setStudents(myStudents || []);
      setFilteredStudents(myStudents || []);
      setCurrentSession(session);
      setBroadcasts(msgs || []);

    } catch (err) {
      console.error("Staff Data Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- RESULT FUNCTIONS ---

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setScoreData({ subject: '', ca: '', exam: '', term: 'First Term' }); // Reset form
    fetchStudentResults(student.id); // Load history
  };

  const fetchStudentResults = async (studentId) => {
    try {
      const data = await api.get(`/results/${studentId}`);
      setStudentResults(data || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert("Please select a student first.");
    if (!scoreData.subject) return alert("Please select a subject.");

    setUploading(true);
    try {
      await api.post('/results/upload', {
        student_id: selectedStudent.id,
        subject: scoreData.subject,
        ca: scoreData.ca,
        exam: scoreData.exam,
        term: scoreData.term,
        session: currentSession
      });
      
      alert(`Result for ${scoreData.subject} saved successfully!`);
      
      // Refresh the history table immediately
      await fetchStudentResults(selectedStudent.id);
      
      // Clear scores for next entry, keep subject/term for speed
      setScoreData(prev => ({ ...prev, ca: '', exam: '' }));

    } catch (err) {
      alert("Upload Failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditResult = (result) => {
    // Load data back into form
    setScoreData({
      subject: result.subject,
      ca: result.ca_score,
      exam: result.exam_score,
      term: result.term
    });
    // Scroll to top of form
    document.getElementById('result-form').scrollIntoView({ behavior: 'smooth' });
  };

  // --- BROADCAST FUNCTIONS ---
  const sendBroadcast = async () => {
    if (!newMsg.title || !newMsg.message) return alert("Fill all fields");
    try {
      await api.post('/schmngt/broadcast', { ...newMsg, target: 'student' });
      alert("Message Sent to Students!");
      setNewMsg({ title: '', message: '' });
      loadInitialData(); // Refresh list
    } catch (err) {
      alert("Failed to send: " + err.message);
    }
  };

  // --- RENDER ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-purple-700 mb-4"/>
      <p className="text-slate-600 font-medium">Loading Staff Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar */}
      <aside className={`bg-purple-900 text-white flex flex-col fixed h-full z-30 shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-purple-800 flex items-center justify-between">
           <div className={`flex items-center gap-3 transition-opacity ${!sidebarOpen && 'opacity-0 hidden'}`}>
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-900 font-bold">S</div>
             <div>
               <h1 className="font-bold tracking-tight">STAFF</h1>
               <p className="text-[10px] text-purple-300">{user?.department || 'Staff'}</p>
             </div>
           </div>
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-purple-300 hover:text-white p-1">
             {sidebarOpen ? <X size={20} /> : <Menu size={20} className="mx-auto" />}
           </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          <TabBtn icon={<LayoutDashboard/>} label="Overview" active={activeTab==='overview'} expanded={sidebarOpen} onClick={()=>setActiveTab('overview')} />
          <TabBtn icon={<Users/>} label="My Students" active={activeTab==='students'} expanded={sidebarOpen} onClick={()=>setActiveTab('students')} />
          <TabBtn icon={<FileCheck/>} label="Results Entry" active={activeTab==='results'} expanded={sidebarOpen} onClick={()=>setActiveTab('results')} />
          <TabBtn icon={<Calendar/>} label="Timetable" active={activeTab==='timetable'} expanded={sidebarOpen} onClick={()=>setActiveTab('timetable')} />
          <TabBtn icon={<Bell/>} label="Broadcasts" active={activeTab==='broadcast'} expanded={sidebarOpen} onClick={()=>setActiveTab('broadcast')} />
        </nav>

        <div className="p-4 border-t border-purple-800">
          <button onClick={() => {logout(); navigate('/');}} className={`flex items-center gap-3 text-red-300 hover:text-white transition w-full p-2 rounded ${!sidebarOpen && 'justify-center'}`}>
            <LogOut size={20}/> {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 capitalize flex items-center gap-3">
              {activeTab} {refreshing && <Loader2 className="animate-spin text-slate-400" size={20}/>}
            </h1>
            <p className="text-slate-500 mt-1">Session: <span className="font-bold text-purple-700">{currentSession}</span></p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border shadow-sm text-sm font-bold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {user?.full_name}
          </div>
        </header>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Users size={24}/></div>
                   <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">My Students</p>
                      <h3 className="text-2xl font-black text-slate-900">{students.length}</h3>
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><BookOpen size={24}/></div>
                   <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Department</p>
                      <h3 className="text-lg font-bold text-slate-900">{user?.department || 'General'}</h3>
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer" onClick={()=>setActiveTab('results')}>
                <div className="flex items-center justify-between">
                   <h3 className="font-bold text-purple-700">Upload Results</h3>
                   <FileCheck size={24} className="text-purple-400"/>
                </div>
                <p className="text-slate-500 text-sm mt-2">Enter CA and Exam scores for students.</p>
             </div>
          </div>
        )}

        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
             {/* Search */}
             <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1">
                   <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                   <input 
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" 
                      placeholder="Search your students..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                   />
                </div>
             </div>

             {/* Table */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                         <th className="p-5">Name</th>
                         <th className="p-5">Student ID</th>
                         <th className="p-5">Program</th>
                         <th className="p-5">Phone</th>
                         <th className="p-5">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                         <tr><td colSpan="5" className="p-8 text-center text-slate-500">No students found.</td></tr>
                      ) : (
                         filteredStudents.map(s => (
                            <tr key={s.id} className="hover:bg-purple-50 transition-colors">
                               <td className="p-5 font-bold text-slate-900">{s.surname} {s.first_name}</td>
                               <td className="p-5 font-mono text-xs text-slate-500">{s.student_id_text}</td>
                               <td className="p-5 text-slate-700">{s.program_type}</td>
                               <td className="p-5 text-slate-600">{s.phone_number}</td>
                               <td className="p-5">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {s.payment_status || 'Pending'}
                                  </span>
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- RESULTS ENTRY TAB (ROBUST) --- */}
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fadeIn">
            
            {/* 1. Student Selector (Left Side) */}
            <div className="xl:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[700px] flex flex-col">
              <h3 className="font-bold mb-4 text-lg border-b pb-4 text-slate-800">1. Select Student</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-400" size={16}/>
                <input 
                  className="w-full pl-9 p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white transition outline-none focus:ring-2 focus:ring-purple-500" 
                  placeholder="Filter students..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => handleSelectStudent(s)} 
                    className={`p-3 rounded-xl cursor-pointer transition border ${selectedStudent?.id === s.id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                  >
                    <div className="font-bold text-slate-900">{s.surname} {s.first_name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{s.student_id_text} • {s.program_type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Upload Form & History (Right Side) */}
            <div className="xl:col-span-8 space-y-6">
               
               {/* Upload Form */}
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200" id="result-form">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><FileCheck size={20}/> 2. Enter Scores</h3>
                     {selectedStudent ? (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Selected: {selectedStudent.surname} {selectedStudent.first_name}</span>
                     ) : (
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">No Student Selected</span>
                     )}
                  </div>

                  <form onSubmit={handleUpload} className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="label-text">Term / Semester</label>
                           <select className="input-field w-full" value={scoreData.term} onChange={e => setScoreData({...scoreData, term: e.target.value})}>
                              <option>First Term</option>
                              <option>Second Term</option>
                              <option>Third Term</option>
                           </select>
                        </div>
                        <div>
                           <label className="label-text">Subject</label>
                           <select 
                              className="input-field w-full" 
                              value={scoreData.subject} 
                              onChange={e => setScoreData({...scoreData, subject: e.target.value})} 
                              required
                              disabled={!selectedStudent}
                           >
                              <option value="">-- Select Subject --</option>
                              {/* Merge student registered subjects with common ones */}
                              {(selectedStudent?.subjects || []).map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                              <option disabled>──────────</option>
                              <option>Mathematics</option>
                              <option>English Language</option>
                              <option>Biology</option>
                              <option>Economics</option>
                              <option>Physics</option>
                              <option>Chemistry</option>
                              <option>Government</option>
                              <option>Literature</option>
                              <option>CRS/IRS</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="label-text">CA Score (Max 40)</label>
                           <input type="number" max="40" min="0" className="input-field w-full text-lg font-mono" value={scoreData.ca} onChange={e => setScoreData({...scoreData, ca: e.target.value})} required disabled={!selectedStudent} />
                        </div>
                        <div>
                           <label className="label-text">Exam Score (Max 60)</label>
                           <input type="number" max="60" min="0" className="input-field w-full text-lg font-mono" value={scoreData.exam} onChange={e => setScoreData({...scoreData, exam: e.target.value})} required disabled={!selectedStudent} />
                        </div>
                     </div>

                     <button type="submit" disabled={uploading || !selectedStudent} className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-xl transition flex justify-center gap-2 shadow-lg">
                        {uploading ? <Loader2 className="animate-spin"/> : <><Save size={20}/> Save Result to Database</>}
                     </button>
                  </form>
               </div>

               {/* History Table (NEW FEATURE) */}
               {selectedStudent && (
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                       <span>Uploaded Results for {selectedStudent.first_name}</span>
                       <button onClick={() => fetchStudentResults(selectedStudent.id)} className="text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-100 transition"><RefreshCw size={16}/></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                        <thead className="bg-white text-slate-500 font-bold border-b sticky top-0">
                            <tr>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Term</th>
                                <th className="p-4 text-center">Total</th>
                                <th className="p-4 text-center">Grade</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {studentResults.length === 0 ? <tr><td colSpan="5" className="p-6 text-center text-slate-400">No results found yet.</td></tr> :
                            studentResults.map(res => (
                                <tr key={res.id} className="hover:bg-purple-50 transition">
                                    <td className="p-4 font-medium">{res.subject}</td>
                                    <td className="p-4 text-slate-500 text-xs">{res.term}</td>
                                    <td className="p-4 text-center font-bold">{res.total_score}</td>
                                    <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{res.grade}</span></td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleEditResult(res)} className="text-blue-600 hover:underline text-xs font-bold border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
               )}

            </div>
          </div>
        )}

        {/* --- TIMETABLE TAB --- */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Official Timetable</h3>
                <p className="text-sm text-slate-500 mt-1">External Schedule View</p>
              </div>
              <a href="https://meritstudenttimetable.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
                <ExternalLink size={18}/> Open Full Site
              </a>
            </div>
            <div className="relative" style={{ height: '700px' }}>
              <iframe src="https://meritstudenttimetable.vercel.app" className="w-full h-full border-0" title="Timetable" />
            </div>
          </div>
        )}

        {/* --- BROADCASTS TAB --- */}
        {activeTab === 'broadcast' && (
          <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Send size={20} className="text-purple-600"/> Send New Announcement</h3>
                <div className="space-y-4">
                   <div>
                      <label className="label-text">Title</label>
                      <input className="input-field w-full" placeholder="e.g. Test Tomorrow" value={newMsg.title} onChange={e => setNewMsg({...newMsg, title: e.target.value})} />
                   </div>
                   <div>
                      <label className="label-text">Message</label>
                      <textarea className="input-field w-full h-40 resize-none p-3" placeholder="Type your message to students..." value={newMsg.message} onChange={e => setNewMsg({...newMsg, message: e.target.value})} />
                   </div>
                   <button onClick={sendBroadcast} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">Post Announcement</button>
                </div>
             </div>

             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Bell size={20} className="text-orange-600"/> Recent Broadcasts</h3>
                {broadcasts.length === 0 ? (
                   <div className="text-center py-10 text-slate-400">No broadcasts sent yet.</div>
                ) : (
                   <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {broadcasts.map(msg => (
                         <div key={msg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-purple-200 transition">
                            <h4 className="font-bold text-slate-800">{msg.title}</h4>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{msg.message}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                               <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                               <span>•</span>
                               <span className="uppercase font-bold text-purple-400">{msg.target_audience}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

// Sub-components
const TabBtn = ({ icon, label, active, expanded, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full text-left transition-all ${active ? 'bg-purple-800 text-white shadow-lg' : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'} ${!expanded && 'justify-center px-2'}`} title={!expanded ? label : ''}>
    <div>{icon}</div> {expanded && <span className="font-medium text-sm">{label}</span>}
  </button>
);

export default StaffDashboard;
