import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, Loader2, Printer
} from 'lucide-react';
import { api } from '../../lib/api';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    surname: '', middleName: '', lastName: '',
    gender: '', dateOfBirth: '',
    stateOfOrigin: '', lga: '', permanentAddress: '',
    parentsPhone: '', studentPhone: '', email: '',
    password: '', confirmPassword: '',
    programme: '', 
    department: '',
    subjects: [],
    university: '', course: '', 
    photoPreview: null,
    signature: '',
    termsAccepted: false,
    location: null
  });

  const [errors, setErrors] = useState({});

  // Capture Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({ 
          ...prev, 
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
        })),
        (err) => console.log('Location denied')
      );
    }
  }, []);

  // Print Handler - FIXED
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${formData.surname}_${formData.lastName}_Registration_Form`,
  });

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000 * 1024) { 
      setErrors(prev => ({ ...prev, photo: 'Image is too large (Max 2MB)' }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photoPreview: reader.result }));
      setErrors(prev => ({ ...prev, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Subject Pools by Department and Programme
  const getSubjectsByDepartment = () => {
    const isALevel = formData.programme === 'A-Level';
    
    const subjects = {
      Science: isALevel 
        ? ["Mathematics", "Physics", "Chemistry", "Biology", "Further Mathematics", "Computing", "Environmental Science"]
        : ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Maths", "Agric Science", "Geography", "Civic Education"],
      
      Art: isALevel
        ? ["Literature in English", "History", "Government", "Economics", "Geography", "Sociology", "Law"]
        : ["English Language", "Literature", "Government", "CRS", "IRS", "History", "Geography", "Civic Education", "Fine Arts"],
      
      Commercial: isALevel
        ? ["Accounting", "Business Management", "Economics", "Marketing", "Commerce", "Business Studies", "Law"]
        : ["English Language", "Mathematics", "Economics", "Accounting", "Commerce", "Marketing", "Business Studies", "Civic Education", "Commerce"]
    };

    return subjects[formData.department] || [];
  };

  // Subject Toggle Handler
  const handleSubjectToggle = (subject) => {
    const max = formData.programme === 'O-Level' ? 9 : 
                formData.programme === 'JAMB' ? 4 : 3;
    
    setFormData(prev => {
      const exists = prev.subjects.includes(subject);
      if (exists) return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      if (prev.subjects.length >= max) return prev; 
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.surname) newErrors.surname = "Surname is Required";
      if (!formData.lastName) newErrors.lastName = "Last Name is Required";
      if (!formData.email) newErrors.email = "Email is Required";
      if (!formData.studentPhone) newErrors.studentPhone = "Phone Number is Required";
      if (!formData.photoPreview) newErrors.photo = "Passport photo required";
      
      if (!formData.password) newErrors.password = "Create a password";
      if (formData.password.length < 6) newErrors.password = "Min 6 characters";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    if (step === 2) {
      if (!formData.programme) newErrors.programme = "Select a programme";
      if (!formData.department) newErrors.department = "Select a department"; // NEW VALIDATION
      const max = formData.programme === 'O-Level' ? 9 : formData.programme === 'JAMB' ? 4 : 3;
      if (formData.subjects.length !== max) newErrors.subjects = `Select exactly ${max} subjects`;
      if (formData.programme === 'A-Level' && !formData.university) newErrors.university = "Required for A-Level";
    }
    if (step === 3) {
      if (!formData.termsAccepted) newErrors.terms = "You must accept terms";
      if (!formData.signature) newErrors.signature = "Digital signature required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(p => p + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);

    try {
      const payload = {
        ...formData,
        role: 'student',
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null, 
      };

      const response = await api.post('/students/register', payload);
      
      alert(`Registration Successful!\n\nStudent ID: ${response.studentId}\n\nPlease login with your Student ID and Password.`);
      navigate('/auth/student');
    } catch (error) {
      console.error(error);
      alert(`Registration Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary-900 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Student Registration</h1>
            <p className="text-primary-100 text-sm">Merit College of Advanced Studies</p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-primary-200">Session</div>
            <div className="font-mono font-bold text-lg text-accent-500">2025/2026</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex border-b border-slate-100">
          {[1, 2, 3].map(step => (
            <div key={step} className={`flex-1 py-4 text-center text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              currentStep >= step ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= step ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{step}</span>
              <span className="hidden sm:inline">{step === 1 ? 'Personal' : step === 2 ? 'Academic' : 'Finish'}</span>
            </div>
          ))}
        </div>

        <div className="p-8">
          {/* STEP 1: PERSONAL */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Photo */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                {formData.photoPreview ? (
                  <div className="relative group">
                    <img src={formData.photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
                    <button onClick={() => setFormData(p => ({...p, photoPreview: null}))} className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600"><X size={16}/></button>
                  </div>
                ) : (
                  <div className="text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3"><Upload size={24} /></div>
                    <p className="text-sm font-bold text-primary-900">Upload Passport</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                {errors.photo && <p className="text-red-500 text-xs mt-2 font-medium">{errors.photo}</p>}
              </div>

              {/* Personal Fields */}
              <div className="grid md:grid-cols-3 gap-4">
                <InputField label="Surname" value={formData.surname} onChange={v => setFormData({...formData, surname: v})} error={errors.surname} />
                <InputField label="First Name" value={formData.middleName} onChange={v => setFormData({...formData, middleName: v})} />
                <InputField label="Last Name" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} error={errors.lastName}/>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <InputField label="Email Address" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} error={errors.email} placeholder="student@example.com" />
                <InputField label="Phone Number" type="tel" value={formData.studentPhone} onChange={v => setFormData({...formData, studentPhone: v})} error={errors.studentPhone} placeholder="+234..." />
              </div>

              {/* Password Section */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2"><User size={16}/> Account Security</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                        <InputField label="Create Password" type={showPassword ? "text" : "password"} value={formData.password} onChange={v => setFormData({...formData, password: v})} error={errors.password} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                    <InputField label="Confirm Password" type="password" value={formData.confirmPassword} onChange={v => setFormData({...formData, confirmPassword: v})} error={errors.confirmPassword} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <InputField label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={v => setFormData({...formData, dateOfBirth: v})} />
                 <InputField label="State of Origin" value={formData.stateOfOrigin} onChange={v => setFormData({...formData, stateOfOrigin: v})} />
              </div>
              <InputField label="Address" value={formData.permanentAddress} onChange={v => setFormData({...formData, permanentAddress: v})} />
            </div>
          )}

          {/* STEP 2: ACADEMIC */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Programme Selection */}
              <div>
                <label className="label-text">Select Programme</label>
                <div className="grid grid-cols-3 gap-4">
                  {['O-Level', 'A-Level', 'JAMB'].map(prog => (
                    <div key={prog} onClick={() => setFormData({...formData, programme: prog, subjects: []})} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${formData.programme === prog ? 'border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-100' : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50'}`}>
                      <div className="font-bold text-lg mb-1">{prog}</div>
                      <div className="text-xs text-slate-500">{prog === 'O-Level' ? '9 Subjects' : prog === 'JAMB' ? '4 Subjects' : '3 Subjects'}</div>
                    </div>
                  ))}
                </div>
                {errors.programme && <p className="text-red-500 text-xs mt-2 font-medium">{errors.programme}</p>}
              </div>

              {/* Department Selection - NEW */}
              {formData.programme && (
                <div>
                  <label className="label-text">Select Department</label>
                  <select 
                    className="input-field w-full" 
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value, subjects: []})}
                  >
                    <option value="">Choose Department</option>
                    <option value="Science">Science</option>
                    <option value="Art">Art</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-2 font-medium">{errors.department}</p>}
                </div>
              )}

              {/* A-Level Details */}
              {formData.programme === 'A-Level' && formData.department && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-3 text-sm">A-Level Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Intended University" value={formData.university} onChange={v => setFormData({...formData, university: v})} error={errors.university} />
                    <InputField label="Desired Course" value={formData.course} onChange={v => setFormData({...formData, course: v})} />
                    </div>
                </div>
              )}

              {/* Subject Selection - Only shows after department is selected */}
              {formData.programme && formData.department && (
                <div>
                   <label className="label-text mb-3 block">Select Subjects ({formData.subjects.length} Selected)</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {getSubjectsByDepartment().map(sub => (
                        <div key={sub} onClick={() => handleSubjectToggle(sub)} className={`text-xs p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${formData.subjects.includes(sub) ? 'bg-primary-900 text-white border-primary-900' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'}`}>
                          {formData.subjects.includes(sub) ? <CheckCircle size={14} className="text-accent-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          {sub}
                        </div>
                      ))}
                   </div>
                   {errors.subjects && <p className="text-red-500 text-xs mt-2 font-medium">{errors.subjects}</p>}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: AGREEMENT & PREVIEW */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-64 overflow-y-auto text-sm text-slate-600 shadow-inner">
                <h3 className="font-bold text-slate-900 mb-4 sticky top-0 bg-slate-50 pb-2 border-b border-slate-200">Terms & Conditions</h3>
                <p className="mb-2">1. All fees are non-refundable.</p>
                <p className="mb-2">2. Zero tolerance for examination malpractice.</p>
                <p>3. Admission is provisional until payment is confirmed.</p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
                <input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} className="w-5 h-5 mt-0.5 accent-primary-600 cursor-pointer"/>
                <div>
                    <label className="text-sm font-bold text-primary-900 block cursor-pointer" onClick={() => setFormData({...formData, termsAccepted: !formData.termsAccepted})}>I accept the terms and conditions</label>
                </div>
              </div>
              {errors.terms && <p className="text-red-500 text-xs font-medium">{errors.terms}</p>}

              <div className="pt-4 border-t border-slate-100">
                <InputField label="Digital Signature (Type Name)" value={formData.signature} onChange={v => setFormData({...formData, signature: v})} error={errors.signature} placeholder="e.g. John Doe" />
              </div>

              {/* Preview Button */}
              <button 
                onClick={() => setShowPreview(true)} 
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Eye size={18} /> Preview Form
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {currentStep > 1 ? <button onClick={() => setCurrentStep(p => p - 1)} className="btn-secondary"><ChevronLeft size={16} /> Previous</button> : <button onClick={() => navigate('/')} className="text-slate-500 font-medium hover:text-slate-800 px-4">Cancel</button>}
            {currentStep < 3 ? <button onClick={handleNext} className="btn-primary">Next Step <ChevronRight size={16} /></button> : <button onClick={handleSubmit} disabled={loading} className="btn-accent min-w-[180px]">{loading ? <Loader2 className="animate-spin" /> : 'Submit Application'}</button>}
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Form Preview</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                  <Printer size={18} /> Print
                </button>
                <button onClick={() => setShowPreview(false)} className="btn-secondary">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Form */}
            <div ref={printRef} className="p-8">
              <FormPreview formData={formData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Preview Component
const FormPreview = ({ formData }) => (
  <div className="bg-white p-8 font-sans text-sm">
    {/* Header */}
    <div className="flex items-start justify-between mb-6 border-b-2 border-slate-800 pb-4">
      <img src="/meritlogo.jpg" alt="Merit College" className="w-20 h-20 object-contain" />
      <div className="text-center flex-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide">MERIT COLLEGE OF ADVANCED STUDIES</h1>
        <p className="text-xs text-slate-600 mt-1 font-semibold">KNOWLEDGE FOR ADVANCEMENT</p>
        <p className="text-xs text-slate-500 mt-2">Office address: 32, Ansarul Ogidi, beside conoil filling station, Ilorin kwara state.</p>
        <p className="text-xs text-slate-500">Contact: +2348166985866 | Email: olayayemi@gmail.com</p>
      </div>
    </div>

    <h2 className="text-center font-bold text-lg mb-6 underline">EXAMINATION ENTRY DETAILS</h2>

    {/* Personal Details */}
    <div className="mb-6">
      <h3 className="font-bold text-base mb-3 underline">(A) PERSONAL DETAILS</h3>
      <div className="flex gap-6">
        {/* Photo */}
        {formData.photoPreview && (
          <div className="flex-shrink-0">
            <img src={formData.photoPreview} alt="Student" className="w-32 h-32 object-cover border-2 border-slate-800" />
          </div>
        )}
        
        {/* Details */}
        <div className="flex-1 space-y-2">
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">Name:</span>
            <span className="flex-1">{formData.surname} {formData.middleName} {formData.lastName}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">Sex:</span>
            <span className="flex-1">{formData.gender || '_______'}</span>
            <span className="font-semibold ml-8">Date of birth:</span>
            <span className="flex-1">{formData.dateOfBirth || '_______'}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">State of origin:</span>
            <span className="flex-1">{formData.stateOfOrigin || '_______'}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">L.G.A:</span>
            <span className="flex-1">{formData.lga || '_______'}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">Permanent Home Address:</span>
            <span className="flex-1">{formData.permanentAddress || '_______'}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">Parents Phone Number:</span>
            <span className="flex-1">{formData.parentsPhone || '_______'}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">Student phone number:</span>
            <span className="flex-1">{formData.studentPhone}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Programme & Department */}
    <div className="mb-6">
      <h3 className="font-bold text-base mb-3 underline">(C) PREFERRED SUBJECT ALL THE PROGRAMS (UTME, JAMB, A-LEVELS, O-LEVEL)</h3>
      <div className="space-y-2">
        <div className="flex border-b border-slate-300 pb-1">
          <span className="font-semibold w-32">Programme:</span>
          <span className="flex-1">{formData.programme}</span>
        </div>
        <div className="flex border-b border-slate-300 pb-1">
          <span className="font-semibold w-32">Department:</span>
          <span className="flex-1">{formData.department}</span>
        </div>
      </div>
    </div>

    {/* Subjects */}
    <div className="mb-6">
      <h3 className="font-bold text-base mb-3">AVAILABLE SUBJECTS</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        {formData.subjects.map((subject, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-slate-800 flex items-center justify-center">
              <CheckCircle size={16} className="text-slate-800" />
            </div>
            <span>{subject}</span>
          </div>
        ))}
      </div>
    </div>

    {/* A-Level Details */}
    {formData.programme === 'A-Level' && (
      <div className="mb-6">
        <h3 className="font-bold text-base mb-3 underline">(D) CHOICE OF INSTITUTION</h3>
        <div className="space-y-2">
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">University:</span>
            <span className="flex-1">{formData.university}</span>
          </div>
          <div className="flex border-b border-slate-300 pb-1">
            <span className="font-semibold w-32">Course:</span>
            <span className="flex-1">{formData.course}</span>
          </div>
        </div>
      </div>
    )}

    {/* Attestation */}
    <div className="mb-6">
      <h3 className="font-bold text-base mb-3 underline">(D) ATTESTATION</h3>
      <p className="text-xs mb-4">I _________________________________ Confirmed</p>
      <p className="text-xs mb-4">That all details supplied above are correct and shall be liable to any changes after submission</p>
    </div>

    {/* Signature */}
    <div className="flex justify-between items-end mt-12">
      <div>
        <p className="text-sm mb-2">Student Signature:</p>
        <p className="font-bold text-lg border-b-2 border-slate-800 pb-1 min-w-[200px]">{formData.signature}</p>
      </div>
      <div className="text-right">
        <p className="text-sm mb-2">Coordinators Signature & Date</p>
        <div className="border-b-2 border-slate-800 pb-1 min-w-[200px]"></div>
      </div>
    </div>
  </div>
);

// Input Field Component
const InputField = ({ label, value, onChange, type="text", error, placeholder }) => (
  <div className="w-full">
    <label className="label-text">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`input-field ${error ? 'border-red-500 focus:ring-red-200 bg-red-50' : ''}`} placeholder={placeholder} />
    {error && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle size={10}/>{error}</p>}
  </div>
);

export default StudentRegister;