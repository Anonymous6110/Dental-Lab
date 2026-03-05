import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Search, Mail, Phone, MapPin, Building2, X, Save, 
  Trash2, Edit3, Camera, Upload, User, Stethoscope,
  FileText, Key, MessageCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Doctor } from "../types";
import { toast } from "react-hot-toast";

const INITIAL_DOCTOR_STATE = {
  name: "",
  clinic_name: "",
  phone: "",
  email: "",
  address: "",
  specialization: "",
  image_url: ""
};

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState(INITIAL_DOCTOR_STATE);
  const [userFormData, setUserFormData] = useState({ username: "", password: "" });
  const [doctorUser, setDoctorUser] = useState<any>(null);

  const fetchDoctors = () => {
    fetch("/api/doctors")
      .then(res => res.json())
      .then(data => setDoctors(data));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleOpenModal = (doctor: Doctor | null = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        clinic_name: doctor.clinic_name,
        phone: doctor.phone,
        email: doctor.email,
        address: doctor.address,
        specialization: doctor.specialization || "",
        image_url: doctor.image_url || ""
      });
    } else {
      setEditingDoctor(null);
      setFormData(INITIAL_DOCTOR_STATE);
    }
    setIsModalOpen(true);
  };

  const handleOpenUserModal = async (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setUserFormData({ username: doctor.email || doctor.name.toLowerCase().replace(/\s/g, ''), password: "password123" });
    const res = await fetch(`/api/doctors/${doctor.id}/user`);
    const data = await res.json();
    setDoctorUser(data);
    setIsUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    const res = await fetch("/api/users/doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...userFormData, doctor_id: editingDoctor.id })
    });

    if (res.ok) {
      toast.success("Doctor user created successfully");
      const userData = await res.json();
      setDoctorUser({ ...userFormData, id: userData.id, role: 'Doctor' });
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create user");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : "/api/doctors";
    const method = editingDoctor ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success(editingDoctor ? "Doctor updated successfully" : "Doctor added successfully");
      setIsModalOpen(false);
      fetchDoctors();
    } else {
      toast.error("Failed to save doctor");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;

    const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Doctor deleted successfully");
      fetchDoctors();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete doctor");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.clinic_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization && d.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 font-sans">Doctor Management</h1>
          <p className="text-zinc-500 mt-1">Manage your dentist clients, their specializations, and contact details.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} className="mr-2" /> Add Doctor
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, clinic, or specialization..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor, i) => (
          <motion.div
            key={doctor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                {doctor.image_url ? (
                  <img 
                    src={doctor.image_url} 
                    alt={doctor.name} 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-50 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 border-2 border-zinc-50">
                    <User size={32} />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                  <Stethoscope size={14} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-zinc-900 truncate">{doctor.name}</h3>
                <p className="text-emerald-600 font-medium text-sm truncate">{doctor.clinic_name}</p>
                {doctor.specialization && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {doctor.specialization}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-zinc-500 mb-6">
              <div className="flex items-center">
                <Phone size={16} className="mr-3 text-zinc-400" /> {doctor.phone || 'No phone'}
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-3 text-zinc-400" /> {doctor.email || 'No email'}
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-3 text-zinc-400" /> {doctor.address || 'No address'}
              </div>
            </div>

            {doctor.portal_username && (
              <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Portal Access</p>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Enabled</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <User size={14} className="text-zinc-400" />
                  <span className="font-bold text-zinc-700">{doctor.portal_username}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-zinc-50">
              <button 
                onClick={() => navigate(`/doctors/${doctor.id}/ledger`)}
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                title="Ledger"
              >
                <FileText size={16} />
              </button>
              <button 
                onClick={() => handleOpenModal(doctor)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10"
                title="Edit Profile"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button 
                onClick={() => handleOpenUserModal(doctor)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors"
                title="Portal Access"
              >
                <Key size={14} /> Access
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/${doctor.phone.replace(/\D/g, '')}`, '_blank')}
                className="p-2.5 bg-green-50 text-green-600 rounded-xl font-bold text-xs hover:bg-green-100 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
              <button 
                onClick={() => handleDelete(doctor.id)}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                title="Delete Doctor"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</h2>
                  <p className="text-sm text-zinc-500 mt-1">Enter the doctor's professional and contact details.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="relative group">
                      <div className={`w-32 h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative transition-all ${
                        formData.image_url ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:border-emerald-300'
                      }`}>
                        {formData.image_url ? (
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera size={32} className="text-zinc-300 mb-2" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Photo</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                        />
                      </div>
                      {formData.image_url && (
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image_url: ""})}
                          className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow-lg border border-zinc-100 hover:bg-red-50 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Profile Image</p>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Clinic Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                        placeholder="Smile Dental Clinic"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Specialization</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        placeholder="Orthodontics, Implantology..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="doctor@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Address</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Medical Center St."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] px-6 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center"
                  >
                    <Save size={20} className="mr-2" /> {editingDoctor ? "Update Doctor" : "Save Doctor"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserModalOpen && editingDoctor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Lab Access</h2>
                  <p className="text-sm text-zinc-500 mt-1">Manage portal login for {editingDoctor.name}</p>
                </div>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                {doctorUser ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Current Credentials</p>
                      <div className="space-y-2">
                        <p className="text-sm text-zinc-700 font-bold flex justify-between">
                          <span>Username:</span>
                          <span className="text-emerald-700">{doctorUser.username}</span>
                        </p>
                        <p className="text-sm text-zinc-700 font-bold flex justify-between">
                          <span>Password:</span>
                          <span className="text-emerald-700">{doctorUser.password}</span>
                        </p>
                        <p className="text-sm text-zinc-700 font-bold flex justify-between">
                          <span>Role:</span>
                          <span className="text-emerald-700">{doctorUser.role}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 text-center italic">
                      Doctors can use these credentials to log in to the Doctor Portal and track their cases.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Portal Username</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Initial Password</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full px-6 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Enable Portal Access
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
