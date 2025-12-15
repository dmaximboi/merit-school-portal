import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, 
  Loader2, Printer, Download, Share2, AlertTriangle
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${formData.surname}_Registration_Form`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none; }
      }
    `
  });

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 850
      });
      const link = document.createElement('a');
      link.download = `Registration_${formData.surname}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Download failed. Try using the Print option.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { 
      setErrors(p => ({...p, photo: 'Photo must be less than 200KB'})); 
      return; 
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(p => ({ ...p, photoPreview: reader.result }));
      setErrors(p => ({ ...p, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const getSubjectsByDepartment = () => {
    const isALevel = formData.programme === 'A-Level';
    const isOLevel = formData.programme === 'O-Level';
    const isJAMB = formData.programme === 'JAMB';
    
    const subjects = {
      Science: isALevel 
        ? ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science", "Computer Science / ICT", "Statistics"]
        : ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Computer Studies / ICT", "Geography", "Civic Education", "Religious Studies"],
      
      Art: isALevel
        ? ["Government", "History", "Geography", "Literature in English", "Religious Studies (CRS / IRS)", "Philosophy", "Sociology", "Languages (Yoruba, Hausa, Igbo, French)"]
        : ["English Language", "Government", "History", "Geography", "Literature in English", "Civic Education", "Social Studies", "Religious Studies", "Yoruba", "Fine Arts / Visual Arts", "Music", "Home Economics"],
      
      Commercial: isALevel
        ? ["Economics", "Business Studies", "Accounting", "Commerce", "Marketing", "Entrepreneurship", "Banking and Finance"]
        : ["English Language", "Mathematics", "Economics", "Commerce", "Financial Accounting", "Business Studies", "Office Practice", "Marketing", "Civic Education", "Computer Studies", "Religious Studies", "Yoruba"]
    };
    
    return subjects[formData.department] || [];
  };

  const getMaxSubjects = () => {
    if (formData.programme === 'O-Level') return 9;
    if (formData.programme === 'JAMB') return 4;
    if (formData.programme === 'A-Level') return 3;
    return 0;
  };

  const handleSubjectToggle = (subject) => {
    const max = getMaxSubjects();
    const isCompulsory = (formData.programme === 'O-Level' || formData.programme === 'JAMB') && subject === 'English Language';
    
    setFormData(prev => {
      const exists = prev.subjects.includes(subject);
      
      // Don't allow removing English for O-Level/JAMB
      if (exists && isCompulsory) {
        return prev;
      }
      
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      }
      
      if (prev.subjects.length >= max) {
        return prev;
      }
      
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  // Auto-add English Language when program/department is selected
  useEffect(() => {
    if ((formData.programme === 'O-Level' || formData.programme === 'JAMB') && 
        formData.department && 
        !formData.subjects.includes('English Language')) {
      setFormData(prev => ({
        ...prev,
        subjects: ['English Language', ...prev.subjects]
      }));
    }
  }, [formData.programme, formData.department]);

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.surname) newErrors.surname = "Required";
      if (!formData.lastName) newErrors.lastName = "Required";
      if (!formData.email) newErrors.email = "Required";
      if (!formData.studentPhone) newErrors.studentPhone = "Required";
      if (!formData.photoPreview) newErrors.photo = "Photo Required";
      if (!formData.password) newErrors.password = "Required";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    }
    if (step === 2) {
      if (!formData.programme) newErrors.programme = "Select a programme";
      if (!formData.department) newErrors.department = "Select a department";
      if (formData.subjects.length === 0) newErrors.subjects = "Select at least one subject";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { 
    if (validateStep(currentStep)) setCurrentStep(p => p + 1); 
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) return alert("Please accept terms and conditions");
    if (!formData.signature) return alert("Please provide your digital signature");
    
    setLoading(true);
    try {
      const payload = { ...formData, role: 'student' };
      const response = await api.post('/students/register', payload);
      alert(`Success! Student ID: ${response.studentId}`);
      navigate('/auth/student');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-blue-900 px-8 py-6 text-white">
          <div className="flex items-center justify-center gap-4">
            <img src="/meritlogo.jpg" alt="MCAS Logo" className="w-16 h-16 rounded-full bg-white p-1 shadow-lg" />
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight">MCAS STUDENT REGISTRATION</h1>
              <p className="text-blue-200 text-sm font-medium mt-1">Merit College of Advanced Studies • Session 2025/2026</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Personal Info' },
              { num: 2, label: 'Academic Details' },
              { num: 3, label: 'Review & Submit' }
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    currentStep >= step.num 
                      ? 'bg-blue-900 text-white shadow-lg scale-110' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {currentStep > step.num ? <CheckCircle size={24}/> : step.num}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${currentStep >= step.num ? 'text-blue-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${currentStep > step.num ? 'bg-blue-900' : 'bg-slate-200'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 md:p-12">
          
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Personal Information</h2>
                <p className="text-slate-500">Please provide accurate details as they will appear on your documents</p>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-8">
                <div 
                  className="w-40 h-40 bg-slate-100 rounded-2xl border-4 border-dashed border-slate-300 hover:border-blue-500 flex items-center justify-center cursor-pointer overflow-hidden transition-all group relative" 
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Preview"/>
                  ) : (
                    <div className="text-center">
                      <Upload className="text-slate-400 group-hover:text-blue-500 mx-auto mb-2" size={32}/>
                      <p className="text-xs text-slate-500 font-medium">Click to Upload</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium">
                  <AlertCircle size={12} className="inline mr-1"/> Passport Photo • Max 200KB • JPG/PNG
                </p>
                {errors.photo && <p className="text-red-600 text-sm font-bold mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.photo}</p>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Surname *</label>
                  <input 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="Enter surname" 
                    value={formData.surname} 
                    onChange={e=>setFormData({...formData, surname:e.target.value})}
                  />
                  {errors.surname && <p className="text-red-600 text-xs mt-1">{errors.surname}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                  <input 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="Enter first name" 
                    value={formData.lastName} 
                    onChange={e=>setFormData({...formData, lastName:e.target.value})}
                  />
                  {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Middle Name</label>
                  <input 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="Enter middle name (optional)" 
                    value={formData.middleName} 
                    onChange={e=>setFormData({...formData, middleName:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gender *</label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    value={formData.gender} 
                    onChange={e=>setFormData({...formData, gender:e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth *</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    value={formData.dateOfBirth} 
                    onChange={e=>setFormData({...formData, dateOfBirth:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address *</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="your.email@example.com" 
                    value={formData.email} 
                    onChange={e=>setFormData({...formData, email:e.target.value})}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Student Phone *</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="080XXXXXXXX" 
                    value={formData.studentPhone} 
                    onChange={e=>setFormData({...formData, studentPhone:e.target.value})}
                  />
                  {errors.studentPhone && <p className="text-red-600 text-xs mt-1">{errors.studentPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Parent/Guardian Phone *</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="080XXXXXXXX" 
                    value={formData.parentsPhone} 
                    onChange={e=>setFormData({...formData, parentsPhone:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">State of Origin *</label>
                  <input 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="e.g. Lagos" 
                    value={formData.stateOfOrigin} 
                    onChange={e=>setFormData({...formData, stateOfOrigin:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">LGA *</label>
                  <input 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="Local Government Area" 
                    value={formData.lga} 
                    onChange={e=>setFormData({...formData, lga:e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Permanent Address *</label>
                <input 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                  placeholder="Full residential address" 
                  value={formData.permanentAddress} 
                  onChange={e=>setFormData({...formData, permanentAddress:e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base pr-12" 
                      placeholder="Create password" 
                      value={formData.password} 
                      onChange={e=>setFormData({...formData, password:e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password *</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                    placeholder="Re-enter password" 
                    value={formData.confirmPassword} 
                    onChange={e=>setFormData({...formData, confirmPassword:e.target.value})}
                  />
                  {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Academic Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Academic Programme</h2>
                <p className="text-slate-500">Select your programme, department and subjects</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Programme *</label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base font-medium" 
                    value={formData.programme} 
                    onChange={e=>setFormData({...formData, programme:e.target.value, subjects: []})}
                  >
                    <option value="">Select Programme</option>
                    <option value="JAMB">JAMB (Max 4 Subjects)</option>
                    <option value="O-Level">O-Level (Max 9 Subjects)</option>
                    <option value="A-Level">A-Level (Max 3 Subjects)</option>
                  </select>
                  {errors.programme && <p className="text-red-600 text-xs mt-1">{errors.programme}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Department *</label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base font-medium" 
                    value={formData.department} 
                    onChange={e=>setFormData({...formData, department:e.target.value, subjects: []})}
                  >
                    <option value="">Select Department</option>
                    <option value="Science">Science</option>
                    <option value="Art">Arts / Humanities</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  {errors.department && <p className="text-red-600 text-xs mt-1">{errors.department}</p>}
                </div>
              </div>

              {/* Subject Selection Alert */}
              {formData.programme && formData.department && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20}/>
                    <div className="text-sm">
                      <p className="font-bold text-blue-900 mb-1">Subject Selection Guidelines:</p>
                      <ul className="text-blue-800 space-y-1 list-disc ml-4">
                        {(formData.programme === 'O-Level' || formData.programme === 'JAMB') && (
                          <li><strong>English Language</strong> is compulsory and automatically selected</li>
                        )}
                        <li>Maximum subjects: <strong>{getMaxSubjects()}</strong></li>
                        <li>Currently selected: <strong>{formData.subjects.length}</strong> / {getMaxSubjects()}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject Grid */}
              {formData.department && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Select Subjects ({formData.subjects.length} / {getMaxSubjects()})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getSubjectsByDepartment().map(sub => {
                      const isSelected = formData.subjects.includes(sub);
                      const isCompulsory = (formData.programme === 'O-Level' || formData.programme === 'JAMB') && sub === 'English Language';
                      const isDisabled = !isSelected && formData.subjects.length >= getMaxSubjects();
                      
                      return (
                        <button
                          key={sub}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSubjectToggle(sub)}
                          className={`
                            p-3 rounded-xl border-2 text-sm font-medium transition-all text-left relative
                            ${isSelected 
                              ? 'bg-blue-900 text-white border-blue-900 shadow-lg' 
                              : isDisabled
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                            }
                          `}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected ? 'bg-white text-blue-900' : 'bg-slate-200'
                            }`}>
                              {isSelected && <CheckCircle size={16}/>}
                            </div>
                            <span className="flex-1">{sub}</span>
                          </div>
                          {isCompulsory && (
                            <span className="absolute top-1 right-1 text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                              Required
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.subjects && <p className="text-red-600 text-sm mt-2 font-bold flex items-center gap-1"><AlertCircle size={14}/>{errors.subjects}</p>}
                </div>
              )}

              {/* A-Level Additional Info */}
              {formData.programme === 'A-Level' && (
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Preferred University</label>
                    <input 
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                      placeholder="e.g. University of Lagos" 
                      value={formData.university} 
                      onChange={e=>setFormData({...formData, university:e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Course</label>
                    <input 
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base" 
                      placeholder="e.g. Medicine & Surgery" 
                      value={formData.course} 
                      onChange={e=>setFormData({...formData, course:e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Submit</h2>
                <p className="text-slate-500">Please review your information and accept the terms</p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24}/>
                  <div>
                    <p className="font-bold text-yellow-900 text-lg mb-1">IMPORTANT NOTICE</p>
                    <p className="text-yellow-800 text-sm">
                      You <strong>MUST</strong> download or print your registration form before submitting. 
                      This form will be required during physical verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">Terms & Conditions</h3>
                </div>
                <div className="h-64 overflow-y-auto p-5 bg-white text-sm leading-relaxed">
                  <ol className="list-decimal ml-5 space-y-2 text-slate-700">
                    <li>All tuition fees are non-refundable once paid.</li>
                    <li>The college maintains zero tolerance for examination malpractice.</li>
                    <li>Students must maintain a minimum of 75% attendance.</li>
                    <li>Decent and appropriate dressing is mandatory at all times.</li>
                    <li>Student ID cards must be worn during school hours.</li>
                    <li>Any form of cultism or violence will lead to immediate expulsion.</li>
                    <li>Students are liable for any damage to school property.</li>
                    <li>Forgery of documents will result in automatic expulsion.</li>
                    <li>All students must observe resumption dates strictly.</li>
                    <li>Respect for school authority and staff is compulsory.</li>
                  </ol>
                </div>
              </div>

              {/* Accept Terms */}
              <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={formData.termsAccepted} 
                  onChange={e=>setFormData({...formData, termsAccepted:e.target.checked})}
                  className="mt-1 w-5 h-5 text-blue-900 border-2 border-slate-300 rounded focus:ring-2 focus:ring-blue-100"
                />
                <span className="text-sm text-slate-700">
                  I have read and accept the terms and conditions stated above. I understand that providing false information may lead to disqualification.
                </span>
              </label>

              {/* Digital Signature */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Digital Signature *</label>
                <input 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-base font-script text-2xl text-blue-900" 
                  placeholder="Type your full name as signature" 
                  value={formData.signature} 
                  onChange={e=>setFormData({...formData, signature:e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-2">This will appear as your signature on the registration form</p>
              </div>

              {/* Preview Button */}
              <button 
                onClick={() => setShowPreview(true)} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Eye size={22}/> Preview Registration Form
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
            {currentStep > 1 && (
              <button 
                onClick={()=>setCurrentStep(p=>p-1)} 
                className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2"
              >
                <ChevronLeft size={20}/> Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button 
                onClick={handleNext} 
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition flex items-center gap-2 ml-auto shadow-lg"
              >
                Continue <ChevronRight size={20}/>
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={loading || !formData.termsAccepted} 
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition flex items-center gap-2 ml-auto shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin"/> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20}/> Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl my-8">
            <div className="sticky top-0 bg-white border-b-2 border-slate-200 p-5 flex justify-between items-center z-10 rounded-t-2xl">
               <h2 className="font-bold text-xl text-slate-900">Registration Form Preview</h2>
               <div className="flex gap-3">
                  <button 
                    onClick={handlePrint} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md"
                  >
                    <Printer size={18}/> Print PDF
                  </button>
                  <button 
                    onClick={handleDownloadImage} 
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md"
                  >
                    <Download size={18}/> Save Image
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)} 
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition"
                  >
                    <X size={20}/>
                  </button>
               </div>
            </div>
            
            <div className="overflow-auto bg-slate-100 p-4 md:p-8 flex justify-center">
                <div ref={printRef} className="bg-white shadow-lg text-slate-900" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                   <FormPreview formData={formData} />
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// FORM PREVIEW COMPONENT - UNCHANGED AS REQUESTED
const FormPreview = ({ formData }) => (
  <div className="font-serif text-sm leading-relaxed">
    {/* Header */}
    <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6">
       <img src="/meritlogo.jpg" alt="Logo" className="w-20 h-20 object-contain"/>
       <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
          <p className="text-xs font-bold tracking-widest mt-1">KNOWLEDGE FOR ADVANCEMENT</p>
          <p className="text-xs mt-2">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
          <p className="text-xs">Tel: +234 816 698 5866 | Email: olayayemi@gmail.com</p>
       </div>
    </div>

    <h2 className="text-center font-bold text-lg underline mb-6">STUDENT REGISTRATION FORM</h2>

    {/* Personal Details - FIXED GRID (No Responsive Classes) */}
    <div className="mb-6 border border-slate-300 p-4 rounded-sm break-inside-avoid">
       <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">A. PERSONAL DETAILS</h3>
       <div className="flex gap-6">
          <div className="w-32 h-32 bg-slate-200 border border-slate-400 flex-shrink-0">
             {formData.photoPreview && <img src={formData.photoPreview} className="w-full h-full object-cover"/>}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
             <div className="col-span-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">Full Name:</span> {formData.surname} {formData.middleName} {formData.lastName}
             </div>
             <div className="border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">Gender:</span> {formData.gender}
             </div>
             <div className="border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">DOB:</span> {formData.dateOfBirth}
             </div>
             <div className="border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">State:</span> {formData.stateOfOrigin}
             </div>
             <div className="border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">LGA:</span> {formData.lga}
             </div>
             <div className="col-span-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">Address:</span> {formData.permanentAddress}
             </div>
             <div className="border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">Phone:</span> {formData.studentPhone}
             </div>
             <div className="border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold w-24 inline-block">Parent Ph:</span> {formData.parentsPhone}
             </div>
          </div>
       </div>
    </div>

    {/* Academic Details - FIXED GRID */}
    <div className="mb-6 border border-slate-300 p-4 rounded-sm break-inside-avoid">
       <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">B. ACADEMIC PROGRAM</h3>
       <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border-b border-dotted border-slate-400 pb-1">
             <span className="font-bold w-28 inline-block">Programme:</span> {formData.programme}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
             <span className="font-bold w-28 inline-block">Department:</span> {formData.department}
          </div>
          {formData.programme === 'A-Level' && (
             <>
               <div className="border-b border-dotted border-slate-400 pb-1">
                  <span className="font-bold w-28 inline-block">University:</span> {formData.university}
               </div>
               <div className="border-b border-dotted border-slate-400 pb-1">
                  <span className="font-bold w-28 inline-block">Course:</span> {formData.course}
               </div>
             </>
          )}
       </div>
       
       <div>
          <span className="font-bold block mb-2">Selected Subjects:</span>
          <div className="grid grid-cols-3 gap-2">
             {formData.subjects.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                   <div className="w-4 h-4 border border-slate-800 flex items-center justify-center">✓</div> {sub}
                </div>
             ))}
          </div>
       </div>
    </div>

    {/* Declaration - FIXED LAYOUT */}
    <div className="border border-slate-300 p-4 rounded-sm break-inside-avoid">
       <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">C. DECLARATION</h3>
       <p className="text-justify mb-8">
          I, <strong>{formData.surname} {formData.middleName} {formData.lastName}</strong>, hereby declare that the information provided is true and correct. 
          I agree to abide by the rules and regulations of Merit College. I understand that any false information may lead to disqualification.
       </p>
       
       <div className="flex justify-between items-end mt-12">
          <div className="text-center">
             <div className="font-script text-2xl mb-1 text-blue-900 border-b border-slate-800 min-w-[200px] pb-1">{formData.signature}</div>
             <p className="text-xs font-bold">Applicant Signature</p>
          </div>
          <div className="text-center">
             <div className="border-b border-slate-800 min-w-[200px] mb-6"></div>
             <p className="text-xs font-bold">Registrar / Official Stamp</p>
          </div>
       </div>
    </div>
    
    <div className="text-center text-[10px] mt-8 text-slate-400">
       Printed on {new Date().toLocaleString()} | Merit College Portal
    </div>
  </div>
);

export default StudentRegister;
