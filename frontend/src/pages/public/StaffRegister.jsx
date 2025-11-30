import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Shield, User, Mail, Lock, Briefcase, Key, Loader2, Phone, MapPin, GraduationCap } from 'lucide-react';

const StaffRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '',
    department: '', position: '',
    phone: '', address: '', qualification: '', gender: '',
    adminToken: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sends data to backend
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" icon={<User size={18}/>} value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} placeholder="John Doe" />
            <InputField label="Email Address" icon={<Mail size={18}/>} type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="staff@merit.edu.ng" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Phone Number" icon={<Phone size={18}/>} type="tel" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+234..." />
            <div className="relative">
                <label className="label-text">Gender</label>
                <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
          </div>

          <InputField label="Residential Address" icon={<MapPin size={18}/>} value={formData.address} onChange={v => setFormData({...formData, address: v})} placeholder="Full Address" />

          {/* Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Department" icon={<Briefcase size={18}/>} value={formData.department} onChange={v => setFormData({...formData, department: v})} placeholder="e.g. Science" />
            <InputField label="Position" icon={<User size={18}/>} value={formData.position} onChange={v => setFormData({...formData, position: v})} placeholder="e.g. Teacher" />
            <InputField label="Qualification" icon={<GraduationCap size={18}/>} value={formData.qualification} onChange={v => setFormData({...formData, qualification: v})} placeholder="e.g. B.Sc" />
          </div>

          <InputField label="Password" icon={<Lock size={18}/>} type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} placeholder="••••••••" />
          
          <div className="pt-4 border-t border-slate-100">
            <label className="label-text text-red-600 flex items-center gap-1">
                <Key size={14}/> Admin Token
            </label>
            <input 
                type="password" 
                className="input-field border-red-200 focus:ring-red-200 bg-red-50" 
                placeholder="Ask Admin for Key"
                value={formData.adminToken}
                onChange={e => setFormData({...formData, adminToken: e.target.value})}
                required
            />
          </div>

          <button disabled={loading} className="w-full btn-primary bg-slate-900 hover:bg-slate-800 mt-4">
            {loading ? <Loader2 className="animate-spin"/> : 'Create Staff Account'}
          </button>
        </form>
        
        <button onClick={() => navigate('/auth/staff')} className="w-full mt-4 text-sm text-slate-500 hover:underline">
            Already have an account? Login
        </button>
      </div>
    </div>
  );
};

const InputField = ({ label, type="text", value, onChange, icon, placeholder }) => (
    <div>
        <label className="label-text">{label}</label>
        <div className="relative">
            <input type={type} className="input-field pl-10" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required />
            <div className="absolute left-3 top-3.5 text-slate-400">{icon}</div>
        </div>
    </div>
);

export default StaffRegister;