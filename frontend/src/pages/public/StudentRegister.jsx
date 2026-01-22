import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, CheckCircle, User, Book, FileText, Eye, EyeOff,
  ChevronRight, ChevronLeft, Loader2, Printer, AlertTriangle,
  ChevronDown, ChevronUp, Lock, Image as ImageIcon, File
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { api } from '../../lib/api';

// --- COMPONENTS ---
import FormPreview from '../../components/FormPreview';

const InputField = ({ label, value, onChange, type = "text", error, onBlur, placeholder }) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
    {error && <span className="text-red-500 text-xs font-bold mt-1 block">{error}</span>}
  </div>
);

const AccordionItem = ({ isOpen, title, icon: Icon, onToggle, children }) => {
  return (
    <div className={`border-b border-slate-200 transition-all ${isOpen ? 'bg-white' : 'bg-slate-50'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-6 text-left focus:outline-none ${isOpen ? 'text-blue-900' : 'text-slate-600'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
            <Icon size={20} />
          </div>
          <span className="font-bold text-lg">{title}</span>
        </div>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>
      {isOpen && <div className="p-6 pt-0 animate-fadeIn">{children}</div>}
    </div>
  );
};



// --- MAIN COMPONENT ---
const StudentRegister = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [botField, setBotField] = useState('');

  const fileInputRef = useRef(null);
  const printRef = useRef(null); // Reference for the A4 container

  const [formData, setFormData] = useState({
    surname: '', middleName: '', lastName: '',
    gender: '', dateOfBirth: '',
    stateOfOrigin: '', lga: '', permanentAddress: '',
    parentsPhone: '', studentPhone: '', email: '',
    password: '', confirmPassword: '',
    programme: '', department: '',
    subjects: [],
    university: '', course: '',
    photoPreview: null,
    signature: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});

  // --- PASSWORD STRENGTH CHECKER ---
  const checkStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const passwordScore = checkStrength(formData.password);

  const getStrengthColor = (s) => {
    if (s < 2) return 'bg-red-500';
    if (s < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (s) => {
    if (s < 2) return 'Weak';
    if (s < 4) return 'Medium';
    return 'Strong';
  };

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

  const validatePhone = (phone) => /^0\d{10}$/.test(phone);

  // STRICT GMAIL VALIDATION
  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

  const handleEmailBlur = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      if (formData.email && !validateEmail(formData.email)) {
        setErrors(prev => ({ ...prev, email: "Only @gmail.com addresses are allowed." }));
      }
      return;
    }

    try {
      const res = await api.post('/auth/check-email', { email: formData.email });
      if (res.exists) {
        setErrors(prev => ({ ...prev, email: "This email is already registered." }));
      } else {
        setErrors(prev => ({ ...prev, email: null }));
      }
    } catch (err) {
      console.error("Email check failed:", err);
    }
  };

  const validatePersonal = () => {
    const newErrors = {};
    if (!formData.surname) newErrors.surname = "Surname is required";
    if (!formData.lastName) newErrors.lastName = "First Name is required";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Only valid @gmail.com addresses allowed";
    else if (errors.email) newErrors.email = errors.email;

    if (!formData.studentPhone) newErrors.studentPhone = "Student Phone is required";
    else if (!validatePhone(formData.studentPhone)) newErrors.studentPhone = "Invalid Phone (Must be 11 digits)";

    if (!formData.parentsPhone) newErrors.parentsPhone = "Parent Phone is required";
    else if (!validatePhone(formData.parentsPhone)) newErrors.parentsPhone = "Invalid Phone (Must be 11 digits)";

    if (formData.studentPhone && formData.parentsPhone && formData.studentPhone === formData.parentsPhone) {
      newErrors.parentsPhone = "Parent phone cannot be the same as Student phone";
    }

    if (!formData.photoPreview) newErrors.photo = "Passport Photo is required";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "DOB is required";
    if (!formData.stateOfOrigin) newErrors.stateOfOrigin = "State is required";
    if (!formData.lga) newErrors.lga = "LGA is required";
    if (!formData.permanentAddress) newErrors.permanentAddress = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAcademic = () => {
    const newErrors = {};
    if (!formData.programme) newErrors.programme = "Select a programme";
    if (!formData.department) newErrors.department = "Select a department";
    if (formData.subjects.length === 0) newErrors.subjects = "Select subjects";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024) {
      setErrors(p => ({
        ...p,
        photo: (
          <span>
            Photo must be less than 50KB.
            <a href="https://image.pi7.org/compress-image-to-50kb" target="_blank" rel="noreferrer" className="text-blue-600 underline ml-1">
              Compress here
            </a>
          </span>
        )
      }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(p => ({ ...p, photoPreview: reader.result }));
      setErrors(p => ({ ...p, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  // --- EXPANDED SUBJECTS LIST ---
  const getSubjectsByDepartment = () => {
    const isALevel = formData.programme === 'A-Level';

    const subjects = {
      Science: isALevel
        ? ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science", "Computer Science", "Geography", "Statistics", "Economics"]
        : ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Computer Studies", "Geography", "Civic Education", "Economics", "Marketing", "Data Processing", "Technical Drawing", "Animal Husbandry", "Fisheries", "Dyeing & Bleaching", "Catering Craft"],

      Art: isALevel
        ? ["Government", "History", "Literature in English", "Religious Studies (CRS/IRS)", "Yoruba", "Hausa", "Igbo", "French", "Economics", "Sociology", "Philosophy"]
        : ["English Language", "Mathematics", "Literature in English", "Government", "History", "Civic Education", "CRS", "IRS", "Yoruba", "Hausa", "Igbo", "French", "Fine Arts", "Music", "Economics", "Commerce", "Marketing", "Computer Studies", "Theatre Arts"],

      Commercial: isALevel
        ? ["Economics", "Accounting", "Business Management", "Government", "Mathematics", "Sociology", "Geography"]
        : ["English Language", "Mathematics", "Economics", "Commerce", "Financial Accounting", "Book Keeping", "Office Practice", "Marketing", "Business Studies", "Civic Education", "Computer Studies", "Government", "Insurance", "Store Management"]
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
      if (exists && isCompulsory) return prev;
      if (exists) return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      if (prev.subjects.length >= max) return prev;
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  const handleSubmit = async () => {
    if (botField !== '') return;

    if (!formData.termsAccepted) return alert("Please accept terms and conditions");
    if (!formData.signature) return alert("Please provide your digital signature");

    if (passwordScore < 2) {
      return alert("Password is too weak! Please add numbers, uppercase letters, or use more characters.");
    }

    if (!validatePersonal() || !validateAcademic()) {
      return alert("Please correct the errors in the form before submitting.");
    }

    setLoading(true);

    try {
      const response = await api.post('/students/register', {
        ...formData,
        role: 'student'
      });
      alert(`Success! Your Student ID: ${response.studentId}`);
      navigate('/auth/student');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: HIGH QUALITY PRINT/DOWNLOAD LOGIC ---
  const downloadAsJPG = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 3, useCORS: true });
      const image = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `${formData.surname}_Registration_Form.jpg`;
      link.click();
    } catch (err) {
      alert("Error generating image. Please try again.");
    }
  };

  const downloadAsPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${formData.surname}_Registration_Form.pdf`);
    } catch (err) {
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-blue-900 px-8 py-8 text-white text-center">
          <img src="/meritlogo.jpg" alt="MCAS" className="w-20 h-20 rounded-full bg-white p-1 shadow-lg mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-black tracking-tight">STUDENT REGISTRATION</h1>
          <p className="text-blue-200 text-sm font-medium mt-1">Merit College of Advanced Studies • 2025/2026</p>
        </div>

        <div className="border-t border-slate-200">

          {/* 1. PERSONAL INFORMATION */}
          <AccordionItem
            isOpen={activeSection === 'personal'}
            title="Personal Information"
            icon={User}
            onToggle={() => setActiveSection(activeSection === 'personal' ? '' : 'personal')}
          >
            <div className="space-y-6 mt-4">
              <div className="flex flex-col items-center mb-6">
                <div
                  className={`w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative group ${errors.photo ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50 hover:border-blue-500'}`}
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <Upload className="text-slate-400 group-hover:text-blue-500" size={28} />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-bold">Tap to Upload Passport</p>
                {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <InputField label="Surname" value={formData.surname} onChange={v => setFormData({ ...formData, surname: v })} error={errors.surname} />
                <InputField label="First Name" value={formData.lastName} onChange={v => setFormData({ ...formData, lastName: v })} error={errors.lastName} />
                <InputField label="Middle Name" value={formData.middleName} onChange={v => setFormData({ ...formData, middleName: v })} />

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="">Select</option><option>Male</option><option>Female</option>
                  </select>
                  {errors.gender && <span className="text-red-500 text-xs">{errors.gender}</span>}
                </div>

                <InputField label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={v => setFormData({ ...formData, dateOfBirth: v })} error={errors.dateOfBirth} />
                <InputField
                  label="Email Address"
                  type="email"
                  placeholder="student@gmail.com"
                  value={formData.email}
                  onChange={v => setFormData({ ...formData, email: v })}
                  onBlur={handleEmailBlur}
                  error={errors.email}
                />

                <InputField label="Student Phone" type="tel" value={formData.studentPhone} onChange={v => setFormData({ ...formData, studentPhone: v })} error={errors.studentPhone} />
                <InputField label="Parent Phone" type="tel" value={formData.parentsPhone} onChange={v => setFormData({ ...formData, parentsPhone: v })} error={errors.parentsPhone} />

                <InputField label="State of Origin" value={formData.stateOfOrigin} onChange={v => setFormData({ ...formData, stateOfOrigin: v })} error={errors.stateOfOrigin} />
                <InputField label="LGA" value={formData.lga} onChange={v => setFormData({ ...formData, lga: v })} error={errors.lga} />
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-slate-700 mb-2">Permanent Address</label>
                <textarea className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition h-20 resize-none" value={formData.permanentAddress} onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })} />
                {errors.permanentAddress && <span className="text-red-500 text-xs">{errors.permanentAddress}</span>}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="text-blue-900" size={18} />
                  <h3 className="font-bold text-slate-800">Account Password</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-3 pr-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-11 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    {formData.password && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex gap-1 h-2 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= passwordScore ? getStrengthColor(passwordScore) : 'bg-slate-200'}`}></div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">Strength:</span>
                          <span className={`text-xs font-bold ${passwordScore < 2 ? 'text-red-600' : passwordScore < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {getStrengthLabel(passwordScore)}
                          </span>
                        </div>
                      </div>
                    )}
                    {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                    />
                    {errors.confirmPassword && <span className="text-red-500 text-xs mt-1 block">{errors.confirmPassword}</span>}
                  </div>
                </div>
              </div>

              <input
                type="text"
                name="website_url_check"
                tabIndex="-1"
                style={{ position: 'absolute', left: '-9999px' }}
                value={botField}
                onChange={(e) => setBotField(e.target.value)}
              />

              <button
                onClick={() => { if (validatePersonal()) setActiveSection('academic'); }}
                className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold mt-4 hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                Save & Continue <ChevronRight size={18} />
              </button>
            </div>
          </AccordionItem>

          {/* 2. ACADEMIC DETAILS */}
          <AccordionItem
            isOpen={activeSection === 'academic'}
            title="Academic Programme"
            icon={Book}
            onToggle={() => {
              if (!validatePersonal()) return alert("Please complete Personal Info first.");
              setActiveSection(activeSection === 'academic' ? '' : 'academic');
            }}
          >
            <div className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Programme</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" value={formData.programme} onChange={e => setFormData({ ...formData, programme: e.target.value, subjects: [] })}>
                    <option value="">Select Programme</option>
                    <option value="JAMB">JAMB (Max 4)</option>
                    <option value="O-Level">O-Level (Max 9)</option>
                    <option value="A-Level">A-Level (Max 3)</option>
                  </select>
                  {errors.programme && <span className="text-red-500 text-xs">{errors.programme}</span>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value, subjects: [] })}>
                    <option value="">Select Department</option>
                    <option value="Science">Science</option>
                    <option value="Art">Arts</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  {errors.department && <span className="text-red-500 text-xs">{errors.department}</span>}
                </div>
              </div>

              {formData.department && (
                <div className="bg-slate-50 p-5 rounded-xl border-2 border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    Select Subjects ({formData.subjects.length}/{getMaxSubjects()} selected)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getSubjectsByDepartment().map(sub => {
                      const isSel = formData.subjects.includes(sub);
                      const isComp = (formData.programme === 'O-Level' || formData.programme === 'JAMB') && sub === 'English Language';
                      return (
                        <button
                          key={sub}
                          onClick={() => handleSubjectToggle(sub)}
                          disabled={!isSel && formData.subjects.length >= getMaxSubjects()}
                          className={`p-3 text-xs font-bold rounded-lg border-2 text-left transition ${isSel ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                            } ${!isSel && formData.subjects.length >= getMaxSubjects() ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {isSel && '✓ '}{sub} {isComp && '(Required)'}
                        </button>
                      );
                    })}
                  </div>
                  {errors.subjects && <p className="text-red-500 text-xs mt-2">{errors.subjects}</p>}
                </div>
              )}

              {formData.programme === 'A-Level' && (
                <div className="grid md:grid-cols-2 gap-5">
                  <InputField label="Preferred University" value={formData.university} onChange={v => setFormData({ ...formData, university: v })} />
                  <InputField label="Preferred Course" value={formData.course} onChange={v => setFormData({ ...formData, course: v })} />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setActiveSection('personal')} className="flex-1 py-4 border-2 border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
                  <ChevronLeft className="inline mr-1" size={18} /> Back
                </button>
                <button onClick={() => { if (validateAcademic()) setActiveSection('review'); }} className="flex-1 bg-blue-900 text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
                  Continue <ChevronRight className="inline ml-1" size={18} />
                </button>
              </div>
            </div>
          </AccordionItem>

          {/* 3. REVIEW & SUBMIT */}
          <AccordionItem
            isOpen={activeSection === 'review'}
            title="Review & Submit"
            icon={FileText}
            onToggle={() => {
              if (!validatePersonal() || !validateAcademic()) return alert("Please complete previous sections.");
              setActiveSection(activeSection === 'review' ? '' : 'review');
            }}
          >
            <div className="space-y-6 mt-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 shrink-0 mt-1" size={20} />
                  <div className="text-sm text-yellow-900">
                    <p className="font-bold mb-1">Important Notice</p>
                    <p>You MUST download or print your form before submitting. Use the preview button below.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-40 overflow-y-auto text-xs text-slate-700 leading-relaxed">
                <p className="font-bold mb-3 text-base text-slate-900">TERMS & CONDITIONS</p>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>All fees paid are non-refundable under any circumstances.</li>
                  <li>Zero tolerance policy for examination malpractice.</li>
                  <li>Minimum 75% class attendance is mandatory for all students.</li>
                  <li>Proper school uniform and dressing code must be maintained.</li>
                  <li>Respect for school authority and staff is compulsory.</li>
                  <li>Any form of indiscipline may lead to suspension or expulsion.</li>
                </ol>
              </div>

              <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })} className="w-5 h-5 accent-blue-900" />
                <span className="text-sm font-bold text-slate-800">I have read and accept all Terms & Conditions</span>
              </label>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Digital Signature</label>
                <input
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition text-2xl text-blue-900"
                  style={{ fontFamily: 'Brush Script MT, cursive' }}
                  placeholder="Type Your Full Name"
                  value={formData.signature}
                  onChange={e => setFormData({ ...formData, signature: e.target.value })}
                />
              </div>

              <button onClick={() => setShowPreview(true)} className="w-full py-4 border-2 border-slate-800 text-slate-800 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 hover:text-white transition">
                <Eye size={20} /> Preview Form & Download
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !formData.termsAccepted}
                className="w-full bg-green-600 text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:bg-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={22} />}
                Submit Application
              </button>
            </div>
          </AccordionItem>

        </div>
      </div>

      {/* FIXED PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-start z-50 overflow-hidden pt-4">

          <div className="bg-slate-800 text-white p-2 rounded-xl flex flex-wrap justify-center gap-4 mb-4 shadow-xl z-50 shrink-0">
            <button onClick={downloadAsPDF} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition text-sm">
              <File size={16} /> PDF
            </button>
            <button onClick={downloadAsJPG} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition text-sm">
              <ImageIcon size={16} /> JPG
            </button>
            <button onClick={() => setShowPreview(false)} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition text-sm">
              Close
            </button>
          </div>

          {/* A4 CONTAINER - SCROLLABLE WRAPPER */}
          <div className="w-full h-full overflow-auto flex justify-center items-start pb-20 px-4">
            <div
              ref={printRef}
              className="bg-white shadow-2xl shrink-0 origin-top"
              style={{ width: '210mm', minWidth: '210mm', minHeight: '297mm', padding: '15mm' }}
            >
              <FormPreview formData={formData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegister;
