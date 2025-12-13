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
    adminToken: '', signature: '', termsAccepted: false
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Staff_Registration_${formData.fullName}`,
    pageStyle: `@page { size: A4; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } }`
  });

  const handleDownloadImage = async () => {
    if(!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 850 });
      const link = document.createElement('a');
      link.download = `Staff_Reg_${formData.fullName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { alert('Download failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) return alert("Accept Code of Conduct.");
    if (!formData.signature) return alert("Sign the form.");
    setLoading(true);
    try {
      await api.post('/staff/register', formData);
      alert('Registration Successful!');
      navigate('/auth/staff');
    } catch (err) { alert(err.message); } 
    finally { setLoading(false); }
  };

  // ... (Render Input Form - Keep your existing JSX for the inputs) ...
  // JUST REPLACING THE PREVIEW MODAL LOGIC BELOW

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-2xl p-8 rounded-2xl shadow-soft border-t-4 border-slate-800">
         {/* ... Your Existing Form Inputs ... */}
         {/* ... Include the Terms Checkbox and Signature Input ... */}
         <div className="text-center mb-8"><h1 className="text-2xl font-bold">Staff Registration</h1></div>
         
         <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
               <input className="input-field" placeholder="Full Name" value={formData.fullName} onChange={e=>setFormData({...formData, fullName:e.target.value})}/>
               <input className="input-field" placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
               <input className="input-field" placeholder="Phone" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/>
               <select className="input-field" value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option value="">Gender</option><option>Male</option><option>Female</option></select>
            </div>
            <input className="input-field w-full" placeholder="Address" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/>
            <div className="grid md:grid-cols-3 gap-4">
               <select className="input-field" value={formData.department} onChange={e=>setFormData({...formData, department:e.target.value})}><option value="">Dept</option><option value="Science">Science</option><option value="Art">Art</option><option value="Commercial">Commercial</option></select>
               <input className="input-field" placeholder="Position" value={formData.position} onChange={e=>setFormData({...formData, position:e.target.value})}/>
               <input className="input-field" placeholder="Qualification" value={formData.qualification} onChange={e=>setFormData({...formData, qualification:e.target.value})}/>
            </div>
            <input className="input-field w-full" type="password" placeholder="Password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/>
            <input className="input-field w-full border-red-200" type="password" placeholder="Admin Token" value={formData.adminToken} onChange={e=>setFormData({...formData, adminToken:e.target.value})}/>
            
            <div className="bg-slate-50 p-4 h-32 overflow-y-auto text-xs border rounded">
               <h4 className="font-bold">Code of Conduct</h4>
               <ol className="list-decimal ml-4"><li>Punctuality.</li><li>Professional Dressing.</li><li>No Phones in Class.</li><li>Submit Lesson Notes.</li><li>Confidentiality.</li></ol>
            </div>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={formData.termsAccepted} onChange={e=>setFormData({...formData, termsAccepted:e.target.checked})}/> Agree to Code of Conduct</label>
            <input className="input-field w-full" placeholder="Digital Signature" value={formData.signature} onChange={e=>setFormData({...formData, signature:e.target.value})}/>

            <div className="flex gap-4">
               <button type="button" onClick={()=>setShowPreview(true)} className="flex-1 bg-slate-200 py-3 rounded">Preview</button>
               <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-slate-900 text-white py-3 rounded">Register</button>
            </div>
         </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl my-8">
             <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                <h2 className="font-bold">Staff Form Preview</h2>
                <div className="flex gap-2">
                   <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1 rounded">Print</button>
                   <button onClick={handleDownloadImage} className="bg-green-600 text-white px-3 py-1 rounded">Download</button>
                   <button onClick={()=>setShowPreview(false)} className="bg-slate-200 px-3 py-1 rounded">Close</button>
                </div>
             </div>
             <div className="overflow-auto bg-slate-100 p-8 flex justify-center">
                <div ref={printRef} className="bg-white shadow-lg text-slate-900" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                   <StaffFormPreview formData={formData} />
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffFormPreview = ({ formData }) => (
  <div className="font-serif text-sm leading-relaxed">
    <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6">
       <img src="/meritlogo.jpg" alt="Logo" className="w-20 h-20 object-contain"/>
       <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
          <p className="text-xs font-bold tracking-widest mt-1">KNOWLEDGE FOR ADVANCEMENT</p>
          <p className="text-xs mt-2">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
       </div>
    </div>
    <h2 className="text-center font-bold text-lg underline mb-8">STAFF EMPLOYMENT FORM</h2>
    
    <div className="space-y-4 border border-slate-300 p-6 rounded-sm break-inside-avoid">
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Full Name:</span> {formData.fullName}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Email:</span> {formData.email}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Phone:</span> {formData.phone}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Gender:</span> {formData.gender}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Address:</span> {formData.address}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Department:</span> {formData.department}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Position:</span> {formData.position}</div>
       <div className="flex border-b border-dotted border-slate-400 pb-2"><span className="font-bold w-40">Qualification:</span> {formData.qualification}</div>
    </div>

    <div className="mt-8 border border-slate-300 p-6 rounded-sm break-inside-avoid">
       <h3 className="font-bold bg-slate-100 p-1 mb-4">ATTESTATION</h3>
       <p className="text-justify">I, <strong>{formData.fullName}</strong>, hereby attest that the information provided is true. I agree to abide by the staff code of conduct.</p>
       <div className="mt-12 text-center">
          <div className="font-script text-2xl border-b border-slate-800 pb-1 inline-block min-w-[200px]">{formData.signature}</div>
          <p className="text-xs font-bold mt-1">Staff Signature</p>
       </div>
    </div>
  </div>
);

export default StaffRegister;
