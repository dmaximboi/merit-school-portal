import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, 
  Loader2, Printer, Download, Share2, AlertTriangle, Info
} from 'lucide-react';

const StudentRegister = () => {
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

  // Auto-add English when programme/department changes for O-Level and JAMB
  useEffect(() => {
    if ((formData.programme === 'O-Level' || formData.programme === 'JAMB') && formData.department) {
      if (!formData.subjects.includes('English Language')) {
        setFormData(prev => ({ ...prev, subjects: ['English Language', ...prev.subjects.filter(s => s !== 'English Language')] }));
      }
    }
  }, [formData.programme, formData.department]);

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

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
      setErrors(p => ({...p, photo: 'Image size must not exceed 200KB. Please compress your image.'})); 
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
        : ["Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Computer Studies / ICT", "Geography", "Civic Education", "Economics"],
      
      Commercial: isALevel
        ? ["Economics", "Business Studies", "Accounting", "Commerce", "Marketing", "Statistics"]
        : ["Mathematics", "Economics", "Commerce", "Financial Accounting", "Business Studies", "Marketing", "Computer Studies / ICT", "Civic Education", "Geography"],
      
      Art: isALevel
        ? ["Government", "History", "Geography", "Literature in English", "Religious Studies (CRS / IRS)", "Economics", "Sociology"]
        : ["Literature in English", "Government", "History", "Geography", "Religious Studies (CRS / IRS)", "Civic Education", "Economics", "Fine Arts / Visual Arts", "Yoruba"]
    };
    
    const baseSubjects = subjects[formData.department] || [];
    
    // Add English Language first for O-Level and JAMB
    if (isOLevel || isJAMB) {
      return ["English Language", ...baseSubjects.filter(s => s !== "English Language")];
    }
    
    return baseSubjects;
  };

  const getMaxSubjects = () => {
    if (formData.programme === 'O-Level') return 9;
    if (formData.programme === 'JAMB') return 4;
    if (formData.programme === 'A-Level') return 3;
    return 0;
  };

  const handleSubjectToggle = (subject) => {
    // Prevent removing English for O-Level and JAMB
    if (subject === 'English Language' && (formData.programme === 'O-Level' || formData.programme === 'JAMB')) {
      return;
    }

    const max = getMaxSubjects();
    setFormData(prev => {
      const exists = prev.subjects.includes(subject);
      if (exists) return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      if (prev.subjects.length >= max) return prev; 
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.surname) newErrors.surname = "Surname is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.studentPhone) newErrors.studentPhone = "Phone number is required";
      if (!formData.photoPreview) newErrors.photo = "Passport photograph is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    }
    if (step === 2) {
      if (!formData.programme) newErrors.programme = "Programme is required";
      if (!formData.department) newErrors.department = "Department is required";
      if (formData.subjects.length === 0) newErrors.subjects = "Please select at least one subject";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) return alert("Please accept the terms and conditions");
    if (!formData.signature) return alert("Please provide your digital signature");
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const studentId = 'MCAS' + Math.random().toString(36).substr(2, 9).toUpperCase();
      alert(`Registration Successful!\n\nYour Student ID: ${studentId}\n\nPlease save your registration form for future reference.`);
      // In real implementation: navigate('/auth/student');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary-900 px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <img src="/meritlogo.jpg" alt="MCAS Logo" className="w-16 h-16 object-contain bg-white rounded-lg p-1" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">MCAS Student Registration</h1>
              <p className="text-sm text-slate-200 mt-1">Merit College of Advanced Studies</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-slate-100 px-8 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Personal Details' },
              { num: 2, label: 'Academic Program' },
              { num: 3, label: 'Review & Submit' }
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= step.num ? 'bg-primary-900 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {currentStep > step.num ? <CheckCircle size={20} /> : step.num}
                  </div>
                  <span className="text-xs mt-2 font-medium hidden md:block">{step.label}</span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-1 mx-2 ${currentStep > step.num ? 'bg-primary-900' : 'bg-slate-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Personal Information</h2>
                <p className="text-sm text-slate-600">Please provide your accurate personal details</p>
              </div>

              {/* Image Upload */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-32 h-32 bg-slate-100 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary-900 transition-all relative group"
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <Upload className="text-slate-400 mx-auto mb-1" size={24} />
                      <span className="text-xs text-slate-500">Upload Photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="text-white" size={24} />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <p className="text-xs text-slate-500 mt-2">Max file size: 200KB (JPG, PNG)</p>
                {errors.photo && <p className="text-xs text-red-600 mt-1 font-medium">{errors.photo}</p>}
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Surname *</label>
                  <input 
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.surname ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Enter surname" 
                    value={formData.surname} 
                    onChange={e=>setFormData({...formData, surname:e.target.value})}
                  />
                  {errors.surname && <p className="text-xs text-red-600 mt-1">{errors.surname}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input 
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Enter first name" 
                    value={formData.lastName} 
                    onChange={e=>setFormData({...formData, lastName:e.target.value})}
                  />
                  {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                  <input 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                    placeholder="Enter middle name" 
                    value={formData.middleName} 
                    onChange={e=>setFormData({...formData, middleName:e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="example@email.com" 
                    value={formData.email} 
                    onChange={e=>setFormData({...formData, email:e.target.value})}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Phone *</label>
                  <input 
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.studentPhone ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="08012345678" 
                    value={formData.studentPhone} 
                    onChange={e=>setFormData({...formData, studentPhone:e.target.value})}
                  />
                  {errors.studentPhone && <p className="text-xs text-red-600 mt-1">{errors.studentPhone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Phone</label>
                  <input 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                    placeholder="08012345678" 
                    value={formData.parentsPhone} 
                    onChange={e=>setFormData({...formData, parentsPhone:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                  <input 
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.dateOfBirth} 
                    onChange={e=>setFormData({...formData, dateOfBirth:e.target.value})}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select 
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.gender ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.gender} 
                    onChange={e=>setFormData({...formData, gender:e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State of Origin</label>
                  <input 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                    placeholder="e.g., Lagos" 
                    value={formData.stateOfOrigin} 
                    onChange={e=>setFormData({...formData, stateOfOrigin:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">LGA</label>
                  <input 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                    placeholder="Local Government" 
                    value={formData.lga} 
                    onChange={e=>setFormData({...formData, lga:e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                  placeholder="Enter full residential address" 
                  rows="2"
                  value={formData.permanentAddress} 
                  onChange={e=>setFormData({...formData, permanentAddress:e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Create Password *</label>
                  <input 
                    type="password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Minimum 6 characters" 
                    value={formData.password} 
                    onChange={e=>setFormData({...formData, password:e.target.value})}
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                  <input 
                    type="password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Re-enter password" 
                    value={formData.confirmPassword} 
                    onChange={e=>setFormData({...formData, confirmPassword:e.target.value})}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Program */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Academic Program</h2>
                <p className="text-sm text-slate-600">Select your programme and subjects</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Programme *</label>
                  <select 
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.programme ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.programme} 
                    onChange={e=>setFormData({...formData, programme:e.target.value, subjects: [], department: ''})}
                  >
                    <option value="">Select Programme</option>
                    <option value="JAMB">JAMB (Max 4 subjects)</option>
                    <option value="O-Level">O-Level (Max 9 subjects)</option>
                    <option value="A-Level">A-Level (Max 3 subjects)</option>
                  </select>
                  {errors.programme && <p className="text-xs text-red-600 mt-1">{errors.programme}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <select 
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent ${errors.department ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.department} 
                    onChange={e=>setFormData({...formData, department:e.target.value, subjects: []})}
                    disabled={!formData.programme}
                  >
                    <option value="">Select Department</option>
                    <option value="Science">Science</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Art">Arts/Humanities</option>
                  </select>
                  {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
                </div>
              </div>

              {/* Subject Selection */}
              {formData.department && (
                <div className="mt-6">
                  {/* Selection Status Banner */}
                  <div className={`p-4 rounded-lg mb-4 border-l-4 ${
                    formData.subjects.length >= getMaxSubjects() 
                      ? 'bg-red-50 border-red-500' 
                      : formData.subjects.length > 0 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-slate-50 border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Info size={20} className={formData.subjects.length >= getMaxSubjects() ? 'text-red-600' : 'text-blue-600'} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {formData.subjects.length} of {getMaxSubjects()} subjects selected
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {(formData.programme === 'O-Level' || formData.programme === 'JAMB') && 
                            <span className="font-medium text-green-700">✓ English Language is compulsory</span>
                          }
                          {formData.subjects.length >= getMaxSubjects() && 
                            <span className="text-red-600 font-medium"> • Maximum limit reached</span>
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-slate-700 mb-3">Select Subjects *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getSubjectsByDepartment().map(sub => {
                      const isSelected = formData.subjects.includes(sub);
                      const isCompulsory = sub === 'English Language' && (formData.programme === 'O-Level' || formData.programme === 'JAMB');
                      const isDisabled = !isSelected && formData.subjects.length >= getMaxSubjects();

                      return (
                        <div 
                          key={sub}
                          onClick={() => !isDisabled && handleSubjectToggle(sub)}
                          className={`p-3 border-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-primary-900 text-white border-primary-900' 
                              : isDisabled
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-primary-900 hover:bg-slate-50'
                          } ${isCompulsory ? 'ring-2 ring-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{sub}</span>
                            {isSelected && <CheckCircle size={14} />}
                            {isCompulsory && <span className="text-[10px] bg-green-500 text-white px-1 rounded">Required</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.subjects && <p className="text-xs text-red-600 mt-2">{errors.subjects}</p>}
                </div>
              )}

              {/* A-Level University Choice */}
              {formData.programme === 'A-Level' && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">University & Course Preference</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Preferred University</label>
                      <input 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent text-sm"
                        placeholder="e.g., University of Lagos" 
                        value={formData.university} 
                        onChange={e=>setFormData({...formData, university:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Course</label>
                      <input 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent text-sm"
                        placeholder="e.g., Computer Science" 
                        value={formData.course} 
                        onChange={e=>setFormData({...formData, course:e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Review & Submit</h2>
                <p className="text-sm text-slate-600">Please review all information before submission</p>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">IMPORTANT NOTICE</h4>
                    <p className="text-sm text-amber-800 mt-1">
                      You MUST download or print your registration form before submitting. This form serves as your proof of registration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b">
                  <h4 className="font-bold text-sm text-slate-800">Terms & Conditions</h4>
                </div>
                <div className="h-48 overflow-y-auto bg-white p-4">
                  <div className="text-xs text-slate-700 space-y-2">
                    <ol className="list-decimal ml-4 space-y-2">
                      <li><strong>Fees Policy:</strong> All fees paid are non-refundable under any circumstances.</li>
                      <li><strong>Academic Integrity:</strong> Zero tolerance for examination malpractice. Offenders will be expelled.</li>
                      <li><strong>Attendance:</strong> Minimum 75% attendance required for examination eligibility.</li>
                      <li><strong>Dress Code:</strong> Decent and appropriate dressing is mandatory at all times.</li>
                      <li><strong>Identification:</strong> Student ID cards must be worn and visible on campus.</li>
                      <li><strong>Conduct:</strong> Cultism, violence, or disruptive behavior leads to immediate expulsion.</li>
                      <li><strong>Property Damage:</strong> Students are liable for any damage to school property.</li>
                      <li><strong>Documentation:</strong> Falsification of documents results in automatic expulsion.</li>
                      <li><strong>Punctuality:</strong> Students must observe all resumption and examination dates.</li>
                      <li><strong>Authority:</strong> Respect for school management and staff is mandatory.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Acceptance */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-100">
                <input 
                  type="checkbox" 
                  checked={formData.termsAccepted} 
                  onChange={e=>setFormData({...formData, termsAccepted:e.target.checked})}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700">
                  I have read and accept all terms and conditions stated above. I understand that violation of these rules may result in disciplinary action including expulsion.
                </span>
              </label>

              {/* Digital Signature */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Digital Signature *</label>
                <input 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent font-script text-lg"
                  placeholder="Type your full name as signature" 
                  value={formData.signature} 
                  onChange={e=>setFormData({...formData, signature:e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">This will appear as your signature on the registration form</p>
              </div>
               
              {/* Preview Button */}
              <button 
                onClick={() => setShowPreview(true)} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Eye size={20}/> Preview & Download Form
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            {currentStep > 1 && (
              <button 
                onClick={()=>setCurrentStep(p=>p-1)} 
                className="px-6 py-2 border-2 border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button 
                onClick={handleNext} 
                className="px-6 py-2 bg-primary-900 hover:bg-primary-800 text-white rounded-lg font-medium ml-auto transition-colors flex items-center gap-2"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={loading || !formData.termsAccepted || !formData.signature} 
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium ml-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <>Submit Application <CheckCircle size={18} /></>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl my-8">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10 rounded-t-xl">
               <h2 className="font-bold text-lg">Registration Form Preview</h2>
               <div className="flex gap-2">
                  <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center text-sm font-medium transition-colors">
                    <Printer size={18}/> Print
                  </button>
                  <button onClick={handleDownloadImage} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center text-sm font-medium transition-colors">
                    <Download size={18}/> Download
                  </button>
                  <button onClick={() => setShowPreview(false)} className="bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-lg transition-colors">
                    <X size={18}/>
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

// PREVIEW COMPONENT - UNCHANGED
const FormPreview = ({ formData }) => (
  <div className="font-serif text-sm leading-relaxed">
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
