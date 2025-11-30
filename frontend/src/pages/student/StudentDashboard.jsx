import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { 
  LayoutDashboard, BookOpen, CreditCard, User, LogOut, 
  Bell, Calendar, Lock, AlertCircle, CheckCircle, ExternalLink, 
  Printer, Shield, Menu, X, FileText, ChevronRight 
} from 'lucide-react';
import AdmissionLetter from '../../components/shared/AdmissionLetter';

const StudentDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // --- State Management ---
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Printing Logic ---
 const printRef = useRef();
const handlePrint = useReactToPrint({ 
  contentRef: printRef,
  documentTitle: `Admission_Letter_${profile?.surname || 'Student'}`
});

  // --- 1. Fetch Data on Mount ---
  useEffect(() => {
    if (!token) {
      navigate('/auth/student');
      return;
    }
    
    const initDashboard = async () => {
      try {
        if (user?.id) {
          // Fetch Profile & Broadcasts in parallel
          const [profileData, msgData] = await Promise.all([
            api.get(`/students/profile/${user.id}`, token),
            api.get(`/students/announcements`, token)
          ]);
          
          setProfile(profileData);
          setAnnouncements(msgData || []);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    initDashboard();
  }, [user, token, navigate]);

  // --- 2. FLUTTERWAVE PAYMENT INTEGRATION ---
  
  // Calculate fee based on program type
  const getFeeAmount = () => {
    const prog = profile?.program_type;
    if (prog === 'JAMB') return 15000;
    if (prog === 'A-Level') return 27500;
    return 10000; 
  };

  const amount = profile ? getFeeAmount() : 0;

  // Flutterwave Configuration
  const flutterwaveConfig = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-your-public-key-here',
    tx_ref: `MCAS-${Date.now()}-${user?.id}`,
    amount: amount,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      name: `${profile?.surname || ''} ${profile?.first_name || ''}`,
    },
    customizations: {
      title: 'Merit College Tuition Payment',
      description: `${profile?.program_type || 'Student'} Programme Fee`,
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  // Payment Handler
  const initiatePayment = () => {
    handleFlutterPayment({
      callback: async (response) => {
        console.log('Flutterwave Response:', response);
        closePaymentModal(); // Close the payment modal
        
        if (response.status === "successful") {
          try {
            // Verify payment on backend
            await api.post('/students/verify-payment', {
              transaction_id: response.transaction_id,
              student_id: user.id,
              amount: response.amount,
              currency: response.currency
            }, token);
            
            alert("✅ Payment Successful! Your account has been updated. Page will refresh...");
            setTimeout(() => window.location.reload(), 1500);
          } catch (err) {
            console.error('Payment verification error:', err);
            alert("⚠️ Payment completed but verification failed. Please contact admin with this transaction ID: " + response.transaction_id);
          }
        } else {
          alert("❌ Payment was not successful. Please try again.");
        }
      },
      onClose: () => {
        console.log('Payment modal closed');
      },
    });
  };

  // --- 3. Action Handlers ---

  const openTimetable = () => {
    window.open('https://meritstudenttimetable.vercel.app', '_blank');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  // --- 4. Security & Lock Logic ---
  
  // Locked if Admin has NOT validated the account yet
  const isAccountLocked = !profile?.is_validated;
  
  // Locked if Fees are NOT paid (prevents printing letter/viewing timetable)
  const isPaymentLocked = profile?.payment_status !== 'paid';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-900 mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Loading Student Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed w-full bg-blue-900 text-white z-50 flex justify-between items-center p-4 shadow-md">
        <div className="font-bold text-lg tracking-wide">MCAS Portal</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-800 rounded">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-2xl`}>
        
        <div className="p-6 text-2xl font-bold border-b border-blue-800 flex items-center gap-3 bg-blue-950">
          <div className="w-10 h-10 bg-white text-blue-900 rounded-full flex items-center justify-center text-sm font-black">MC</div>
          <div className="flex flex-col">
            <span>MCAS</span>
            <span className="text-xs text-blue-300 font-normal uppercase tracking-wider">Student Portal</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <SidebarItem 
            icon={<LayoutDashboard size={20}/>} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} 
          />
          
          <SidebarItem 
            icon={<BookOpen size={20}/>} 
            label="My Courses" 
            active={activeTab === 'courses'} 
            onClick={() => !isAccountLocked && setActiveTab('courses')} 
            locked={isAccountLocked}
          />
          
          <SidebarItem 
            icon={<CreditCard size={20}/>} 
            label="Tuition & Fees" 
            active={activeTab === 'payments'} 
            onClick={() => !isAccountLocked && setActiveTab('payments')} 
            locked={isAccountLocked}
          />
          
          {/* TIMETABLE LINK */}
          <button 
            onClick={openTimetable}
            disabled={isAccountLocked || isPaymentLocked}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200 group ${
              (isAccountLocked || isPaymentLocked) 
                ? 'text-blue-400 cursor-not-allowed bg-blue-900/50' 
                : 'text-blue-100 hover:bg-blue-800 hover:text-white hover:shadow-lg'
            }`}
          >
            <Calendar size={20} className="group-hover:scale-110 transition-transform"/> 
            <span className="font-medium flex-1">Timetable</span>
            {(isAccountLocked || isPaymentLocked) 
              ? <Lock size={16} className="text-blue-400"/> 
              : <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
            }
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-800 bg-blue-950">
           <div className="flex items-center gap-3 mb-4 p-2 bg-blue-900 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                {profile?.surname?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{profile?.surname} {profile?.first_name}</p>
                <p className="text-xs text-blue-300 truncate">{profile?.student_id_text}</p>
              </div>
           </div>
           <button 
             onClick={handleLogout} 
             className="flex items-center justify-center gap-2 text-red-200 hover:text-white w-full p-2.5 rounded-lg hover:bg-red-900/50 transition-colors border border-transparent hover:border-red-800"
           >
             <LogOut size={18} /> Sign Out
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 overflow-y-auto h-screen bg-slate-50">
        
        {/* Top Status Bar */}
        <header className="flex flex-col md:flex-row justify-between md:items-end mb-10 border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'overview' ? `Welcome back, ${profile?.surname}!` : 
               activeTab === 'courses' ? 'Academic Courses' : 'Financial Status'}
            </h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Session 2025/2026</span>
              <span>•</span>
              <span>{profile?.program_type} Programme</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
             {/* Account Validation Badge */}
             <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border shadow-sm ${isAccountLocked ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
               {isAccountLocked ? <Lock size={16}/> : <Shield size={16}/>}
               <div>
                 <span className="block text-[10px] uppercase tracking-wider opacity-80">Account Status</span>
                 {isAccountLocked ? 'Pending Validation' : 'Active & Verified'}
               </div>
             </div>

             {/* Payment Badge */}
             <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border shadow-sm ${isPaymentLocked ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
               <CreditCard size={16}/>
               <div>
                 <span className="block text-[10px] uppercase tracking-wider opacity-80">Tuition Fee</span>
                 {isPaymentLocked ? 'Payment Pending' : 'Payment Complete'}
               </div>
             </div>
          </div>
        </header>

        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left Column: Alerts & Broadcasts */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Critical Alert: Account Locked */}
              {isAccountLocked && (
                <div className="bg-orange-50 border-l-8 border-orange-500 p-6 rounded-r-xl shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                  <div className="p-4 bg-orange-100 text-orange-600 rounded-full shrink-0">
                    <Lock size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-900 mb-2">Admission Under Review</h3>
                    <p className="text-orange-800 text-sm leading-relaxed mb-4">
                      Your registration has been received and is currently being reviewed by the Merit College Administration. 
                      While under review, access to course materials, payments, and your admission letter is restricted.
                    </p>
                    <div className="text-xs font-bold text-orange-900 bg-orange-100 inline-block px-3 py-1 rounded">
                      Expected Resolution: 24-48 Hours
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Admission Letter Card (Visible only if Active) */}
              {!isAccountLocked && (
                <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileText size={150}/>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-bold text-xl text-slate-900 mb-2 flex items-center gap-2">
                      <FileText className="text-blue-600"/> Admission Letter
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-lg">
                      {isPaymentLocked 
                        ? "Your admission letter is generated but locked. Please complete your tuition payment to unlock and download it."
                        : "Your official Merit College admission letter is ready. You can download and print it for your records."}
                    </p>
                    
                    <button 
                      onClick={handlePrint}
                      disabled={isPaymentLocked}
                      className={`px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition-all transform active:scale-95 ${
                        isPaymentLocked 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-200'
                      }`}
                    >
                      {isPaymentLocked ? <Lock size={18}/> : <Printer size={18}/>}
                      {isPaymentLocked ? 'Unlock via Payment' : 'Print Official Letter'}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Broadcast Messages */}
              <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="text-blue-600 fill-current" size={18}/> Campus Announcements
                  </h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    {announcements.length} New
                  </span>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {announcements.length > 0 ? (
                    announcements.map((msg) => (
                      <div key={msg.id} className="p-6 hover:bg-blue-50/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{msg.title}</h4>
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center flex flex-col items-center text-slate-400">
                      <Bell size={40} className="mb-3 opacity-20"/>
                      <p>No announcements have been posted yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Profile Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                <div className="bg-blue-900 h-24 relative">
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                    <div className="w-24 h-24 bg-white p-1 rounded-full shadow-lg">
                      <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-4xl font-bold text-blue-700">
                        {profile?.surname?.charAt(0)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-12 pb-6 px-6 text-center">
                  <h2 className="text-xl font-bold text-slate-900">{profile?.surname} {profile?.first_name}</h2>
                  <p className="text-slate-500 text-sm mb-6">{profile?.email}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-left text-sm border-t border-slate-100 pt-6">
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Student ID</span>
                      <span className="font-semibold text-slate-800 block bg-slate-50 p-2 rounded border border-slate-100">{profile?.student_id_text}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Department</span>
                      <span className="font-semibold text-slate-800 block bg-slate-50 p-2 rounded border border-slate-100">{profile?.department}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Parent Access</span>
                      <div className={`p-2 rounded border flex items-center justify-between ${profile?.is_parent_access_enabled ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <span className="font-bold">{profile?.is_parent_access_enabled ? 'Enabled' : 'Disabled'}</span>
                        {profile?.is_parent_access_enabled ? <CheckCircle size={16}/> : <X size={16}/>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* === COURSES TAB === */}
        {activeTab === 'courses' && !isAccountLocked && (
          <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-200 animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
              <BookOpen className="text-blue-600"/> Registered Subjects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile?.subjects?.map((sub, idx) => (
                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-blue-500 hover:shadow-md transition-all group flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === PAYMENTS TAB === */}
        {activeTab === 'payments' && !isAccountLocked && (
          <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CreditCard size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tuition & Fee Payment</h2>
              <p className="text-slate-500 mb-4 max-w-md mx-auto">
                Securely pay your acceptance fees and tuition using Flutterwave.
              </p>
              
              {/* Payment Amount Display */}
              <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-sm text-slate-600 mb-2">Programme Fee ({profile?.program_type})</div>
                <div className="text-4xl font-black text-blue-900">₦{amount.toLocaleString()}</div>
                <div className="text-sm text-slate-500 mt-2">
                  Status: <span className={`font-bold ${isPaymentLocked ? 'text-red-500' : 'text-green-600'}`}>
                    {isPaymentLocked ? 'UNPAID' : 'PAID'}
                  </span>
                </div>
              </div>
              
              {isPaymentLocked ? (
                <button 
                  onClick={initiatePayment}
                  className="bg-blue-900 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Pay ₦{amount.toLocaleString()} via Flutterwave
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-800 px-8 py-4 rounded-xl inline-flex items-center gap-3 font-bold">
                  <CheckCircle size={24}/> Payment Complete. Thank you!
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Hidden Print Component - Rendered but invisible until Print triggered */}
      {!isPaymentLocked && (
        <div style={{ display: "none" }}>
          <AdmissionLetter ref={printRef} student={profile} />
        </div>
      )}
    </div>
  );
};

// --- Reusable Sidebar Item ---
const SidebarItem = ({ icon, label, active, onClick, locked }) => (
  <button 
    onClick={onClick}
    disabled={locked}
    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200 group mb-1 ${
      locked ? 'text-blue-400 cursor-not-allowed opacity-60' :
      active ? 'bg-blue-500 text-white shadow-lg' : 
      'text-blue-100 hover:bg-blue-800 hover:text-white'
    }`}
  >
    <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon} 
    </div>
    <span className="font-medium flex-1">{label}</span>
    {locked && <Lock size={14} className="text-blue-400"/>}
    {active && !locked && <ChevronRight size={16} className="opacity-50"/>}
  </button>
);

export default StudentDashboard;