{
type: "file_content_replacement",
fileName: "uhhghhujbh/merit-school-portal/merit-school-portal-a4a74196d9139b068ba5538c081690a51cba6ee2/frontend/src/pages/student/StudentDashboard.jsx",
fullContent: `import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { 
  LayoutDashboard, BookOpen, CreditCard, User, LogOut, 
  Bell, Calendar, Lock, AlertCircle, CheckCircle, ExternalLink, 
  Printer, ChevronRight, Shield, Menu, X, FileText, Book, FileCheck, Download, Share2, AlertTriangle, Loader2
} from 'lucide-react';
import AdmissionLetter from '../../components/shared/AdmissionLetter';
import LibraryView from '../../components/shared/LibraryView';
import ReportCard from '../../components/shared/ReportCard';

const StudentDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [fees, setFees] = useState({ fee_jamb: 0, fee_alevel: 0, fee_olevel: 0 });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- REFS FOR PRINTING ---
  const admissionPrintRef = useRef();
  const reportPrintRef = useRef();
  
  // --- PRINT HANDLERS ---
  const handleAdmissionPrint = useReactToPrint({ 
    contentRef: admissionPrintRef,
    documentTitle: \`Admission_Letter_\${profile?.surname || 'Student'}\`,
    pageStyle: \`@page { size: A4; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; } }\`
  });

  const handleReportPrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: \`Report_Card_\${profile?.surname || 'Student'}\`,
    pageStyle: \`@page { size: A4; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } }\`
  });

  // --- DOWNLOAD HANDLERS ---
  const handleDownload = async (ref, filename) => {
    try {
      if(!ref.current) return;
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 850 });
      const link = document.createElement('a');
      link.download = \`\${filename}.png\`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { alert('Download failed. Please try Printing to PDF instead.'); }
  };

  const handleShare = async (ref, title) => {
    try {
      if(!ref.current) return;
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], \`\${title}.png\`, { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: title });
        } else { alert('Share not supported on this device.'); }
      });
    } catch (err) { alert('Share failed.'); }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!token) { navigate('/auth/student'); return; }
    loadDashboardData();
  }, [user, token, navigate]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      if (user?.id) {
        // Parallel Fetch for Speed
        const [profileData, msgData, feeData, resultsData] = await Promise.all([
          api.get(\`/students/profile/\${user.id}\`, token),
          api.get(\`/students/announcements\`, token),
          api.get(\`/students/fees\`, token),
          api.get(\`/results/\${user.id}\`, token)
        ]);
        
        setProfile(profileData);
        setAnnouncements(msgData || []);
        setFees(feeData || { fee_jamb: 15000, fee_alevel: 27500, fee_olevel: 10000 });
        setResults(resultsData || []);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- PAYMENT LOGIC ---
  const getFeeAmount = () => {
    const prog = profile?.program_type;
    if (prog === 'JAMB') return fees.fee_jamb;
    if (prog === 'A-Level') return fees.fee_alevel;
    return fees.fee_olevel;
  };

  const amount = profile ? getFeeAmount() : 0;

  const flutterwaveConfig = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: \`MCAS-\${Date.now()}-\${user?.id}\`,
    amount: amount,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      name: \`\${profile?.surname || ''} \${profile?.first_name || ''}\`,
    },
    customizations: {
      title: 'Merit College Tuition',
      description: \`\${profile?.program_type} Tuition Fee\`,
      logo: 'https://meritcollege.vercel.app/meritlogo.jpg',
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const initiatePayment = () => {
    if (!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) return alert("Payment system not configured.");
    
    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        
        // DEBUGGING: Log the entire response to see what's happening
        console.log("Full Payment Response:", JSON.stringify(response));

        // CRITICAL FIX: TRUST THE TRANSACTION ID, IGNORE THE STATUS STRING
        // If we have a transaction_id (or id), we send it to the backend for verification.
        const txId = response.transaction_id || response.id;
        
        if (txId) {
            try {
              console.log("Sending for verification:", txId);
              await api.post('/students/verify-payment', {
                transaction_id: txId,
                student_id: user.id
              }, token);
              
              alert("Payment Verified! Dashboard Refreshing...");
              loadDashboardData(); 
            } catch (err) {
              console.error("Verification Error:", err);
              alert(\`Payment recorded but verification pending. ID: \${txId}\`);
            }
        } else {
            // Only fail if we completely lack an ID
            console.error("Missing Transaction ID", response);
            alert("Payment processed but no Transaction ID returned. Contact Admin.");
        }
      },
      onClose: () => {
        console.log("Payment modal closed by user");
      },
    });
  };

  // --- HELPERS ---
  const openTimetable = () => window.open('https://meritstudenttimetable.vercel.app', '_blank');
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) { logout(); navigate('/'); }
  };

  // --- LOCK LOGIC ---
  const isAccountLocked = !profile?.is_validated;
  const isPaymentLocked = profile?.payment_status !== 'paid';
  const isFeatureLocked = isAccountLocked || isPaymentLocked; 

  // --- DATA PROCESSING ---
  const groupedResults = results.reduce((groups, r) => {
    const key = \`\${r.session} - \${r.term}\`; // e.g. "2025/2026 - First Term"
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
    return groups;
  }, {});

  const calculateAverage = () => {
    if (!results || results.length === 0) return 0;
    const total = results.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0);
    return (total / results.length).toFixed(1);
  };

  // --- RENDER ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin w-12 h-12 text-blue-900 mb-4"/>
      <p className="text-slate-600 font-medium animate-pulse">Loading Student Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* --- SIDEBAR --- */}
      <aside className={\`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-blue-900 text-white shadow-2xl 
        transform transition-transform duration-300 ease-in-out 
        \${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col
      \`}>
        {/* Header */}
        <div className="p-6 border-b border-blue-800 flex items-center gap-3 bg-blue-950">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-200">
             <img src="/meritlogo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">MCAS PORTAL</h1>
            <p className="text-[10px] text-blue-300 uppercase tracking-widest">Student Access</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-blue-300"><X/></button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={<LayoutDashboard size={20}/>} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} 
          />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Academics</p>
            <SidebarItem 
              icon={<BookOpen size={20}/>} 
              label="My Courses" 
              active={activeTab === 'courses'} 
              onClick={() => !isFeatureLocked && setActiveTab('courses')} 
              locked={isFeatureLocked}
            />
            <SidebarItem 
              icon={<Calendar size={20}/>} 
              label="Timetable" 
              active={activeTab === 'timetable'} 
              onClick={openTimetable} 
              locked={isFeatureLocked}
            />
            <SidebarItem 
              icon={<FileCheck size={20}/>} 
              label="Report Card" 
              active={activeTab === 'report'} 
              onClick={() => !isFeatureLocked && setActiveTab('report')} 
              locked={isFeatureLocked}
            />
            <SidebarItem 
              icon={<Book size={20}/>} 
              label="Library" 
              active={activeTab === 'library'} 
              onClick={() => !isFeatureLocked && setActiveTab('library')} 
              locked={isFeatureLocked}
            />
          </div>

          <div className="pt-2">
            <p className="px-4 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Finance</p>
            <SidebarItem 
              icon={<CreditCard size={20}/>} 
              label="Tuition & Fees" 
              active={activeTab === 'payments'} 
              onClick={() => setActiveTab('payments')} 
            />
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-blue-800 bg-blue-950">
           <div className="flex items-center gap-3 mb-4 p-2 bg-blue-900 rounded-xl border border-blue-800">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-700 overflow-hidden">
                 {/* USE SUPABASE IMAGE OR FALLBACK */}
                 {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    profile?.surname?.charAt(0)
                 )}
              </div>
              <div className="overflow-hidden">
                 <p className="font-bold text-sm truncate w-32">{profile?.surname} {profile?.first_name}</p>
                 <p className="text-[10px] text-blue-300 font-mono truncate">{profile?.student_id_text}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-200 hover:text-white w-full p-2 rounded-lg hover:bg-red-900/30 transition border border-transparent hover:border-red-800">
              <LogOut size={16} /> Sign Out
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 overflow-y-auto h-screen bg-slate-50">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 w-full bg-blue-900 text-white z-30 flex justify-between items-center p-4 shadow-md">
           <div className="flex items-center gap-2">
              <img src="/meritlogo.jpg" className="w-8 h-8 rounded-full bg-white p-0.5" />
              <span className="font-bold">MCAS</span>
           </div>
           <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu/></button>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-end mb-10 border-b border-slate-200 pb-6">
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                 {activeTab === 'overview' ? \`Hello, \${profile?.first_name}!\` : 
                  activeTab === 'courses' ? 'My Registered Courses' :
                  activeTab === 'report' ? 'Academic Results' :
                  activeTab === 'payments' ? 'Financial Center' : 'Digital Library'}
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Session: <span className="text-blue-600 font-bold">2025/2026</span></p>
           </div>
           <div className="flex gap-3">
              <StatusBadge icon={isAccountLocked ? Lock : Shield} label={isAccountLocked ? "Unverified" : "Verified"} color={isAccountLocked ? "orange" : "green"} />
              <StatusBadge icon={CreditCard} label={isPaymentLocked ? "Unpaid" : "Paid"} color={isPaymentLocked ? "red" : "blue"} />
           </div>
        </header>

        {/* === TAB CONTENT === */}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
              <div className="lg:col-span-2 space-y-8">
                 
                 {/* Lock Warning */}
                 {isFeatureLocked && (
                    <div className="bg-orange-50 border-l-8 border-orange-500 p-6 rounded-r-xl shadow-sm flex gap-4 items-start">
                       <Lock className="text-orange-500 shrink-0 mt-1" size={24}/>
                       <div>
                          <h3 className="font-bold text-orange-900 text-lg">Portal Access Restricted</h3>
                          <p className="text-orange-800 text-sm mt-1">
                             Your access to academic features (Results, Library, Admission Letter) is currently locked. 
                             Please complete your <strong>Tuition Payment</strong> and wait for <strong>Admin Validation</strong>.
                          </p>
                          <button onClick={() => setActiveTab('payments')} className="mt-3 text-xs font-bold bg-orange-200 text-orange-800 px-3 py-1.5 rounded hover:bg-orange-300 transition">
                             Go to Payments &rarr;
                          </button>
                       </div>
                    </div>
                 )}

                 {/* Admission Letter Card */}
                 <div className={\`bg-white p-8 rounded-2xl shadow-soft border border-slate-200 relative overflow-hidden \${isFeatureLocked ? 'opacity-60 pointer-events-none grayscale' : ''}\`}>
                    <div className="absolute top-0 right-0 p-6 opacity-5"><FileText size={120}/></div>
                    <h3 className="font-bold text-xl text-slate-900 mb-2">Admission Letter</h3>
                    <p className="text-slate-500 mb-6 max-w-md">Download your official provisional admission letter for the 2025/2026 academic session.</p>
                    <div className="flex flex-wrap gap-3">
                       <button onClick={handleAdmissionPrint} className="btn-primary flex items-center gap-2"><Printer size={18}/> Print PDF</button>
                       <button onClick={() => handleDownload(admissionPrintRef, \`Admission_\${profile?.surname}\`)} className="btn-secondary flex items-center gap-2"><Download size={18}/> Download</button>
                    </div>
                 </div>

                 {/* Announcements */}
                 <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2"><Bell className="text-blue-600" size={18}/> Announcements</h3>
                       <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{announcements.length} New</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto custom-scrollbar">
                       {announcements.length === 0 ? <p className="p-6 text-center text-slate-400">No news yet.</p> : 
                        announcements.map(msg => (
                           <div key={msg.id} className="p-6 hover:bg-slate-50 transition">
                              <h4 className="font-bold text-slate-900 text-sm">{msg.title}</h4>
                              <p className="text-slate-600 text-xs mt-1 line-clamp-2">{msg.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2">{new Date(msg.created_at).toLocaleDateString()}</p>
                           </div>
                        ))
                       }
                    </div>
                 </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-900 to-blue-800 h-24 relative">
                       <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                          <div className="w-20 h-20 bg-white p-1 rounded-full shadow-lg flex items-center justify-center overflow-hidden">
                             {/* PROFILE IMAGE OR DEFAULT */}
                             {profile?.photo_url ? (
                                <img src={profile.photo_url} className="w-full h-full object-cover" />
                             ) : (
                                <img src="/meritlogo.jpg" className="w-full h-full object-cover opacity-50" />
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="pt-12 pb-6 px-6 text-center">
                       <h2 className="font-bold text-lg text-slate-900">{profile?.surname} {profile?.first_name}</h2>
                       <p className="text-slate-500 text-xs">{profile?.email}</p>
                       <div className="mt-6 grid grid-cols-2 gap-4 text-left text-xs border-t pt-4">
                          <div><p className="text-slate-400 uppercase">Matric No</p><p className="font-bold">{profile?.student_id_text}</p></div>
                          <div><p className="text-slate-400 uppercase">Dept</p><p className="font-bold">{profile?.department}</p></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* 2. COURSES TAB */}
        {activeTab === 'courses' && (
           <div className="animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-200">
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-blue-600"/> Registered Courses</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(profile?.subjects || []).map((sub, i) => (
                       <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-blue-500 hover:shadow-md transition flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border rounded-lg flex items-center justify-center text-blue-600 font-bold">{i+1}</div>
                          <span className="font-bold text-slate-700">{sub}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* 3. REPORT CARD TAB (Session Grouped) */}
        {activeTab === 'report' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h2 className="font-bold text-lg flex items-center gap-2"><FileCheck className="text-green-600"/> Academic Records</h2>
                 <div className="flex gap-2">
                    <button onClick={handleReportPrint} disabled={results.length===0} className="btn-primary text-sm flex items-center gap-2 py-2"><Printer size={16}/> Print Report</button>
                    <button onClick={() => handleDownload(reportPrintRef, \`Report_\${profile?.surname}\`)} disabled={results.length===0} className="btn-secondary text-sm flex items-center gap-2 py-2"><Download size={16}/> Save Image</button>
                 </div>
              </div>

              {results.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <FileCheck size={48} className="mx-auto text-slate-300 mb-4"/>
                    <p className="text-slate-500">No results uploaded yet.</p>
                 </div>
              ) : (
                 Object.entries(groupedResults).map(([sessionTitle, sessionResults]) => (
                    <div key={sessionTitle} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center">
                          <h3 className="font-bold">{sessionTitle}</h3>
                          <span className="text-xs bg-slate-700 px-3 py-1 rounded-full">{sessionResults.length} Courses</span>
                       </div>
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 font-bold border-b text-slate-600">
                             <tr>
                                <th className="p-4">Subject</th>
                                <th className="p-4 text-center">CA</th>
                                <th className="p-4 text-center">Exam</th>
                                <th className="p-4 text-center">Total</th>
                                <th className="p-4 text-center">Grade</th>
                                <th className="p-4 text-center">Remark</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {sessionResults.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                   <td className="p-4 font-bold text-slate-800">{r.subject}</td>
                                   <td className="p-4 text-center text-slate-500">{r.ca_score}</td>
                                   <td className="p-4 text-center text-slate-500">{r.exam_score}</td>
                                   <td className="p-4 text-center font-black text-slate-900">{r.total_score}</td>
                                   <td className="p-4 text-center"><span className={\`px-2 py-1 rounded text-xs font-bold \${['F'].includes(r.grade) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}\`}>{r.grade}</span></td>
                                   <td className="p-4 text-center text-xs text-slate-500 italic">{r.grade === 'F' ? 'Fail' : 'Pass'}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 ))
              )}
           </div>
        )}

        {/* 4. PAYMENTS TAB */}
        {activeTab === 'payments' && (
           <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden animate-fadeIn">
              <div className="p-10 text-center">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard size={40}/>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Tuition Payment</h2>
                 <p className="text-slate-500 mb-8 text-sm">Session 2025/2026 • {profile?.program_type}</p>
                 
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                    <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Total Fee</p>
                    <p className="text-4xl font-black text-slate-900">₦{amount.toLocaleString()}</p>
                    <div className={\`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold \${isPaymentLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}\`}>
                       {isPaymentLocked ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
                       {isPaymentLocked ? 'PAYMENT PENDING' : 'CLEARED'}
                    </div>
                 </div>

                 {isPaymentLocked ? (
                    <button onClick={initiatePayment} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 shadow-lg transition transform hover:-translate-y-1">
                       Pay Now with Flutterwave
                    </button>
                 ) : (
                    <div className="text-green-600 font-bold flex items-center justify-center gap-2">
                       <CheckCircle size={20}/> Payment Complete. Access Granted.
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* 5. LIBRARY TAB */}
        {activeTab === 'library' && (
           <div className="animate-fadeIn">
              <LibraryView user={profile} role="student" isAdmin={false} token={token} />
           </div>
        )}

      </main>

      {/* --- HIDDEN PRINT COMPONENTS --- */}
      {!isFeatureLocked && (
         <>
           <div style={{ display: "none" }}>
             <AdmissionLetter ref={admissionPrintRef} student={profile} />
           </div>
           <div style={{ display: "none" }}>
             <ReportCard ref={reportPrintRef} student={profile} results={results} />
           </div>
         </>
      )}
    </div>
  );
};

// --- SUB COMPONENTS ---

const SidebarItem = ({ icon, label, active, onClick, locked }) => (
  <button 
    onClick={onClick} 
    disabled={locked}
    className={\`
      flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-all duration-200 mb-1 group
      \${active ? 'bg-blue-500 text-white shadow-lg' : 'text-blue-100 hover:bg-blue-800 hover:text-white'}
      \${locked ? 'opacity-50 cursor-not-allowed' : ''}
    \`}
  >
    <div className={\`transition-transform \${active ? 'scale-110' : 'group-hover:scale-110'}\`}>{icon}</div>
    <span className="font-medium text-sm flex-1">{label}</span>
    {locked && <Lock size={14} className="text-blue-300"/>}
    {active && !locked && <ChevronRight size={16} className="opacity-50"/>}
  </button>
);

const StatusBadge = ({ icon: Icon, label, color }) => {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200'
  };
  return (
    <div className={\`px-4 py-2 rounded-xl border flex items-center gap-2 \${colors[color]}\`}>
      <Icon size={16} />
      <div>
        <span className="block text-[10px] uppercase font-bold opacity-70">Status</span>
        <span className="block text-xs font-bold">{label}</span>
      </div>
    </div>
  );
};

export default StudentDashboard;
`
}
