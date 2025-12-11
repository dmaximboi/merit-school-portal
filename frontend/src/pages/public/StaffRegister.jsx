import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { api } from '../../lib/api';
import { Shield, User, Mail, Lock, Key, Loader2, Phone, MapPin, GraduationCap, Eye, X, Printer, Download, Share2, AlertTriangle, CheckCircle } from 'lucide-react';

const StaffRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef();
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '',
    department: '', position: '',
    phone: '', address: '', qualification: '', gender: '',
    adminToken: '',
    signature: '',
    termsAccepted: false
  });

  // Desktop Print (PDF)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Staff_Registration_${formData.fullName.replace(/\s+/g, '_')}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  });

  // Mobile Download as Image
  const handleDownloadImage = async () => {
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `Staff_Registration_${formData.fullName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Failed to download. Please try print instead.');
    }
  };

  // Mobile Share
  const handleShare = async () => {
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Staff_Registration_${formData.fullName}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Staff Registration Form',
            text: 'Merit College Staff Registration'
          });
        } else {
          alert('Share not supported on this device. Use Download instead.');
        }
      });
    } catch (err) {
      alert('Failed to share. Please try download instead.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) return alert("You must accept the Staff Code of Conduct.");
    if (!formData.signature) return alert("Please sign the form digitally.");

    setLoading(true);
    try {
      await api.post('/staff/register', formData);
      alert('Registration Successful! You can now login.');
      navigate('/auth/staff');
    } catch (err) {
      alert(err.message || 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-2xl p-8 rounded-2xl shadow-soft border-t-4 border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <Shield className="text-slate-800"/> Staff Registration
          </h1>
          <p className="text-slate-500 text-sm mt-1">Requires Administrator Validation Token</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Full Name" 
              icon={<User size={18}/>} 
              value={formData.fullName} 
              onChange={v => setFormData({...formData, fullName: v})} 
              placeholder="John Doe" 
            />
            <InputField 
              label="Email Address" 
              icon={<Mail size={18}/>} 
              type="email" 
              value={formData.email} 
              onChange={v => setFormData({...formData, email: v})} 
              placeholder="staff@merit.edu.ng" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Phone Number" 
              icon={<Phone size={18}/>} 
              type="tel" 
              value={formData.phone} 
              onChange={v => setFormData({...formData, phone: v})} 
              placeholder="+234..." 
            />
            <div>
              <label className="label-text">Gender</label>
              <select 
                className="input-field" 
                value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value})}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <InputField 
            label="Residential Address" 
            icon={<MapPin size={18}/>} 
            value={formData.address} 
            onChange={v => setFormData({...formData, address: v})} 
            placeholder="Full Address" 
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Department</label>
              <select 
                className="input-field" 
                value={formData.department} 
                onChange={e => setFormData({...formData, department: e.target.value})}
                required
              >
                <option value="">Select Department</option>
                <option value="Science">Science (SCI)</option>
                <option value="Commercial">Business (BUS)</option>
                <option value="Art">Art and Humanities (ART)</option>
              </select>
            </div>
            <InputField 
              label="Position" 
              icon={<User size={18}/>} 
              value={formData.position} 
              onChange={v => setFormData({...formData, position: v})} 
              placeholder="e.g. Teacher" 
            />
            <InputField 
              label="Qualification" 
              icon={<GraduationCap size={18}/>} 
              value={formData.qualification} 
              onChange={v => setFormData({...formData, qualification: v})} 
              placeholder="e.g. B.Sc" 
            />
          </div>

          <InputField 
            label="Create Password" 
            icon={<Lock size={18}/>} 
            type="password" 
            value={formData.password} 
            onChange={v => setFormData({...formData, password: v})} 
            placeholder="••••••••" 
          />
          
          <div className="pt-4 border-t border-slate-100">
            <label className="label-text text-red-600 flex items-center gap-1">
              <Key size={14}/> Admin Token (Required)
            </label>
            <input 
              type="password" 
              className="input-field border-red-200 focus:ring-red-200 bg-red-50" 
              placeholder="Enter Key provided by Admin"
              value={formData.adminToken}
              onChange={e => setFormData({...formData, adminToken: e.target.value})}
              required
            />
          </div>

          {/* New Sections Start */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={24}/>
              <div>
                <h3 className="font-bold text-amber-900">IMPORTANT NOTICE</h3>
                <p className="text-amber-800 text-sm mt-1">
                  You are required to download/print this form after filling. It serves as your temporary staff ID until a permanent one is issued.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-64 overflow-y-auto text-sm text-slate-600 shadow-inner mt-4">
            <h3 className="font-bold text-slate-900 mb-4 sticky top-0 bg-slate-50 pb-2 border-b border-slate-200">Staff Code of Conduct</h3>
            <ol className="list-decimal ml-4 space-y-2">
              <li>Punctuality is mandatory. Staff must clock in by 7:30 AM daily.</li>
              <li>Dress code must be professional and corporate at all times within the school premises.</li>
              <li>Use of mobile phones during active class hours is strictly prohibited.</li>
              <li>Staff must submit lesson notes and diaries to the VP Academics every Friday.</li>
              <li>Corporal punishment is regulated; staff must adhere to the school's disciplinary policy.</li>
              <li>Confidentiality of students' records and school data must be maintained.</li>
              <li>Private paid tutorials for students within the school premises are not allowed without management approval.</li>
              <li>Staff must participate actively in all school extracurricular activities and meetings.</li>
              <li>Any form of examination malpractice facilitation will lead to immediate dismissal and prosecution.</li>
              <li>One month notice is required before resignation, in accordance with labor laws.</li>
            </ol>
          </div>

          <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100 mt-4">
            <input 
              type="checkbox" 
              checked={formData.termsAccepted} 
              onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} 
              className="w-5 h-5 mt-0.5 accent-primary-600 cursor-pointer"
            />
            <label className="text-sm font-bold text-primary-900 block cursor-pointer" onClick={() => setFormData({...formData, termsAccepted: !formData.termsAccepted})}>
              I have read and agree to abide by the Staff Code of Conduct.
            </label>
          </div>

          <div className="pt-2">
            <InputField 
              label="Digital Signature (Type Full Name)" 
              value={formData.signature} 
              onChange={v => setFormData({...formData, signature: v})} 
              placeholder="e.g. John Doe" 
            />
          </div>
          {/* New Sections End */}

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setShowPreview(true)} 
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
              disabled={!formData.fullName || !formData.department}
            >
              <Eye size={18}/> Preview Form
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="flex-1 btn-primary bg-slate-900 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="animate-spin"/> : 'Submit Application'}
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/auth/staff')} 
          className="w-full mt-4 text-sm text-slate-500 hover:underline"
        >
          Already have an account? Login
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">Registration Preview</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint} 
                  className="hidden md:flex btn-primary items-center gap-2"
                >
                  <Printer size={18} /> Print PDF
                </button>
                <button 
                  onClick={handleDownloadImage} 
                  className="btn-primary flex items-center gap-2"
                >
                  <Download size={18} /> Download
                </button>
                <button 
                  onClick={handleShare} 
                  className="md:hidden btn-secondary flex items-center gap-2"
                >
                  <Share2 size={18} /> Share
                </button>
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="btn-secondary"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div ref={printRef} className="p-8">
              <StaffFormPreview formData={formData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffFormPreview = ({ formData }) => (
  <div className="bg-white p-8 font-sans text-sm">
    <div className="flex items-start justify-between mb-6 border-b-2 border-slate-800 pb-4">
      <img src="/meritlogo.jpg" alt="Merit College" className="w-20 h-20 object-contain" />
      <div className="text-center flex-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide">MERIT COLLEGE OF ADVANCED STUDIES</h1>
        <p className="text-xs text-slate-600 mt-1 font-semibold">KNOWLEDGE FOR ADVANCEMENT</p>
        <p className="text-xs text-slate-500 mt-2">Office address: 32, Ansarul Ogidi, beside conoil filling station, Ilorin kwara state.</p>
        <p className="text-xs text-slate-500">Contact: +2348166985866 | Email: olayayemi@gmail.com</p>
      </div>
    </div>

    <h2 className="text-center font-bold text-lg mb-6 underline uppercase">Staff Employment & Registration Form</h2>

    <div className="space-y-4">
      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Full Name:</span>
        <span className="flex-1 font-bold">{formData.fullName || '_______'}</span>
      </div>
      
      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Email:</span>
        <span className="flex-1">{formData.email || '_______'}</span>
      </div>

      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Phone Number:</span>
        <span className="flex-1">{formData.phone || '_______'}</span>
      </div>

      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Gender:</span>
        <span className="flex-1">{formData.gender || '_______'}</span>
      </div>

      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Address:</span>
        <span className="flex-1">{formData.address || '_______'}</span>
      </div>

      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Department:</span>
        <span className="flex-1 font-bold">{formData.department || '_______'}</span>
      </div>

      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Position:</span>
        <span className="flex-1">{formData.position || '_______'}</span>
      </div>

      <div className="flex border-b border-slate-300 pb-2">
        <span className="font-semibold w-40">Qualification:</span>
        <span className="flex-1">{formData.qualification || '_______'}</span>
      </div>
    </div>

    <div className="mb-6 mt-8">
      <h3 className="font-bold text-base mb-3 underline">(B) ATTESTATION & OATH</h3>
      <p className="text-sm mb-4 leading-relaxed text-justify">
        I, <strong>{formData.fullName}</strong>, hereby attest that the information provided above is true and accurate. 
        I agree to abide by the rules, regulations, and code of conduct of Merit College of Advanced Studies. 
        I understand that any breach of conduct may lead to disciplinary action or termination of appointment.
      </p>
    </div>

    <div className="flex justify-between items-end mt-16 pt-4">
      <div>
        <p className="text-xs mb-1 uppercase font-bold text-slate-500">Staff Signature:</p>
        <div className="font-script text-2xl text-blue-900 border-b-2 border-slate-800 pb-1 min-w-[200px]" style={{fontFamily: 'cursive'}}>
          {formData.signature}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <p className="text-xs mb-8 uppercase font-bold text-slate-500">Management Approval:</p>
        <div className="border-b-2 border-slate-800 pb-1 min-w-[200px]"></div>
        <p className="text-[10px] text-slate-400 mt-1">Official Stamp & Date</p>
      </div>
    </div>
  </div>
);

const InputField = ({ label, type="text", value, onChange, icon, placeholder }) => (
  <div>
    <label className="label-text">{label}</label>
    <div className="relative">
      <input 
        type={type} 
        className="input-field pl-10" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        required 
      />
      {icon && <div className="absolute left-3 top-3.5 text-slate-400">{icon}</div>}
    </div>
  </div>
);

export default StaffRegister;
