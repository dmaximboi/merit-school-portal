import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  LogOut, User, TrendingUp, BookOpen, Lock,
  CheckCircle, XCircle, LayoutDashboard, FileText, Settings,
  Menu, X, Loader2, Bell, BrainCircuit, Book
} from 'lucide-react';

const ParentDashboard = () => {
  const { user, token, logout } = useAuthStore(); // 'user' here is the student object passed from login
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // New State
  const [announcements, setAnnouncements] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loadingNew, setLoadingNew] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/parent');
      return;
    }
    // Fetch results when tab changes to results
    if (activeTab === 'results') fetchResults();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'assessments') fetchAssessments();
    if (activeTab === 'library') fetchLibrary();
  }, [user, navigate, activeTab]);

  const fetchAnnouncements = async () => {
    setLoadingNew(true);
    try { const data = await api.get('/parents/announcements', token); setAnnouncements(data || []); }
    catch (e) { console.error(e); } finally { setLoadingNew(false); }
  };

  const fetchAssessments = async () => {
    setLoadingNew(true);
    try { const data = await api.get('/parents/assessments', token); setAssessments(data || []); }
    catch (e) { console.error(e); } finally { setLoadingNew(false); }
  };

  const fetchLibrary = async () => {
    setLoadingNew(true);
    try { const data = await api.get('/parents/library', token); setLibrary(data || []); }
    catch (e) { console.error(e); } finally { setLoadingNew(false); }
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const data = await api.get(`/results/${user.id}`, token);
      setResults(data || []);
    } catch (err) {
      console.error("Failed to fetch results", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new.length < 6) return alert("Password must be at least 6 characters");
    if (passwordData.new !== passwordData.confirm) return alert("Passwords do not match");

    setPassLoading(true);
    try {
      await api.post('/parents/update-password', {
        studentId: user.id,
        newPassword: passwordData.new
      });
      alert("Password updated successfully! Please login with the new password next time.");
      setPasswordData({ new: '', confirm: '' });
    } catch (err) {
      alert(err.message || "Failed to update password");
    } finally {
      setPassLoading(false);
    }
  };

  // Helper to group results by Session -> Term
  const groupResults = () => {
    const grouped = {};
    results.forEach(r => {
      const key = `${r.session} - ${r.term}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    return grouped;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">

      {/* Sidebar */}
      <aside className={`bg-teal-900 text-white flex flex-col fixed h-full z-30 shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-teal-800 flex items-center justify-between">
          <div className={`flex items-center gap-3 transition-opacity ${!sidebarOpen && 'opacity-0 hidden'}`}>
            <User className="w-8 h-8 bg-teal-700 p-1.5 rounded-full" />
            <div>
              <h1 className="font-bold tracking-tight">PARENT PORTAL</h1>
              <p className="text-[10px] text-teal-300">Merit College</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-teal-300 hover:text-white">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} className="mx-auto" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <TabBtn icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} expanded={sidebarOpen} onClick={() => setActiveTab('overview')} />
          <TabBtn icon={<Bell />} label="Announcements" active={activeTab === 'announcements'} expanded={sidebarOpen} onClick={() => setActiveTab('announcements')} />
          <TabBtn icon={<FileText />} label="Academic Results" active={activeTab === 'results'} expanded={sidebarOpen} onClick={() => setActiveTab('results')} />
          <TabBtn icon={<BrainCircuit />} label="Assessment History" active={activeTab === 'assessments'} expanded={sidebarOpen} onClick={() => setActiveTab('assessments')} />
          <TabBtn icon={<Book />} label="Library" active={activeTab === 'library'} expanded={sidebarOpen} onClick={() => setActiveTab('library')} />
          <TabBtn icon={<Settings />} label="Account Settings" active={activeTab === 'settings'} expanded={sidebarOpen} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-teal-800">
          <button onClick={() => { logout(); navigate('/'); }} className={`flex items-center gap-3 text-red-300 hover:text-white transition w-full p-2 rounded ${!sidebarOpen && 'justify-center'}`}>
            <LogOut size={20} /> {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>

        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-slate-500">Welcome, Guardian of <span className="font-bold text-teal-700">{user.full_name}</span></p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border shadow-sm text-sm font-bold text-slate-600">
            ID: {user.student_id}
          </div>
        </header>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Profile Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-10 -mt-10"></div>
              <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-2 relative z-10"><User className="text-teal-600" /> Student Profile</h3>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold">{user.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Program</span>
                  <span className="font-bold">{user.program_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Department</span>
                  <span className="font-bold">{user.department}</span>
                </div>
              </div>
            </div>

            {/* Financial Status */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10"></div>
              <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-2 relative z-10"><TrendingUp className="text-orange-600" /> Financial Status</h3>

              <div className="flex flex-col items-center justify-center h-40 relative z-10">
                {user.payment_status === 'paid' ? (
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                    <h4 className="text-2xl font-bold text-green-700">Fees Paid</h4>
                    <p className="text-green-600 text-sm">No outstanding payments.</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                    <h4 className="text-2xl font-bold text-red-700">Payment Pending</h4>
                    <p className="text-red-600 text-sm">Please contact the admin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- RESULTS TAB --- */}
        {activeTab === 'results' && (
          <div className="space-y-8 animate-fadeIn">
            {loadingResults ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600 w-10 h-10" /></div>
            ) : Object.keys(groupResults()).length === 0 ? (
              <div className="bg-white p-10 text-center rounded-2xl shadow-sm border border-dashed border-slate-300">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-500">No Results Found</h3>
                <p className="text-slate-400">Results have not been uploaded for this student yet.</p>
              </div>
            ) : (
              Object.entries(groupResults()).map(([sessionTerm, sessionResults]) => (
                <div key={sessionTerm} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-teal-900 text-white p-4 px-6 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{sessionTerm}</h3>
                    <span className="bg-teal-800 text-xs px-3 py-1 rounded-full">{sessionResults.length} Subjects</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 font-bold border-b text-slate-700">
                        <tr>
                          <th className="p-4">Subject</th>
                          <th className="p-4 text-center">CA (40)</th>
                          <th className="p-4 text-center">Exam (60)</th>
                          <th className="p-4 text-center">Total (100)</th>
                          <th className="p-4 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sessionResults.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-4 font-medium">{r.subject}</td>
                            <td className="p-4 text-center text-slate-500">{r.ca_score}</td>
                            <td className="p-4 text-center text-slate-500">{r.exam_score}</td>
                            <td className="p-4 text-center font-bold">{r.total_score}</td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${['A', 'B'].includes(r.grade) ? 'bg-green-100 text-green-700' :
                                ['C', 'D'].includes(r.grade) ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {r.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- ANNOUNCEMENTS TAB --- */}
        {
          activeTab === 'announcements' && (
            <div className="space-y-4 animate-fadeIn">
              {loadingNew ? <Loader2 className="animate-spin text-teal-600" /> : announcements.length === 0 ? <p>No announcements yet.</p> : announcements.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">{a.title}</h3>
                  <p className="text-slate-600">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-4">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )
        }

        {/* --- ASSESSMENTS TAB --- */}
        {
          activeTab === 'assessments' && (
            <div className="space-y-4 animate-fadeIn">
              {loadingNew ? <Loader2 className="animate-spin text-teal-600" /> : assessments.length === 0 ? <p>No quiz history found.</p> : assessments.map((a, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{a.quizzes?.title || 'Unknown Quiz'}</h3>
                    <p className="text-sm text-slate-500">{a.quizzes?.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-teal-700">{Math.round((a.score / a.total) * 100)}%</span>
                    <span className="text-xs text-slate-400">{a.score}/{a.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* --- LIBRARY TAB --- */}
        {
          activeTab === 'library' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              {loadingNew ? <Loader2 className="animate-spin text-teal-600" /> : library.length === 0 ? <p>Library is empty.</p> : library.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden">
                    {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Book size={40} /></div>}
                  </div>
                  <h3 className="font-bold truncate">{b.title}</h3>
                  <p className="text-sm text-slate-500 mb-2">{b.author}</p>
                  {b.drive_link && <a href={b.drive_link} target="_blank" rel="noreferrer" className="mt-auto block text-center py-2 bg-teal-50 text-teal-700 rounded-lg font-bold text-sm hover:bg-teal-100">Read Book</a>}
                </div>
              ))}
            </div>
          )
        }

        {/* --- SETTINGS TAB --- */}
        {
          activeTab === 'settings' && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fadeIn">
              <h3 className="font-bold text-xl mb-6 text-slate-900 border-b pb-4 flex items-center gap-2"><Lock className="text-teal-600" /> Security Settings</h3>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4 border border-blue-100">
                  <p>By default, your password is the student's <strong>Surname</strong>. You can change it here to something more secure.</p>
                </div>

                <div>
                  <label className="label-text">New Password</label>
                  <input
                    type="password"
                    className="input-field w-full"
                    placeholder="••••••••"
                    value={passwordData.new}
                    onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Confirm Password</label>
                  <input
                    type="password"
                    className="input-field w-full"
                    placeholder="••••••••"
                    value={passwordData.confirm}
                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2"
                >
                  {passLoading && <Loader2 className="animate-spin w-4 h-4" />} Update Password
                </button>
              </form>
            </div>
          )
        }

      </main >
    </div >
  );
};

// Sub-component
const TabBtn = ({ icon, label, active, expanded, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full text-left transition-all ${active ? 'bg-teal-800 text-white shadow-lg' : 'text-teal-200 hover:bg-teal-800/50 hover:text-white'} ${!expanded && 'justify-center px-2'}`} title={!expanded ? label : ''}>
    <div>{icon}</div> {expanded && <span className="font-medium text-sm">{label}</span>}
  </button>
);

export default ParentDashboard;
