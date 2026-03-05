import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Plus, Search, Phone, Briefcase, 
  MoreVertical, Edit2, Trash2, X, Save, 
  CheckCircle2, AlertCircle
} from "lucide-react";
import { Technician } from "../types";
import { toast } from "react-hot-toast";

export default function Technicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialization: "Ceramist",
    phone: "",
    status: "Active"
  });

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await fetch("/api/technicians");
      const data = await res.json();
      setTechnicians(data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load technicians");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTech ? `/api/technicians/${editingTech.id}` : "/api/technicians";
    const method = editingTech ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success(editingTech ? "Technician updated" : "Technician added");
      setIsModalOpen(false);
      setEditingTech(null);
      setFormData({ name: "", specialization: "Ceramist", phone: "", status: "Active" });
      fetchTechnicians();
    }
  };

  const filteredTechs = technicians.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Lab Technicians</h1>
          <p className="text-zinc-500 mt-1">Manage your lab staff and their specializations.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTech(null);
            setFormData({ name: "", specialization: "Ceramist", phone: "", status: "Active" });
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} className="mr-2" /> Add Technician
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Search technicians by name or specialty..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((tech) => (
          <motion.div 
            key={tech.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                {tech.name.charAt(0)}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                tech.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100'
              }`}>
                {tech.status}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-zinc-900 mb-1">{tech.name}</h3>
            <p className="text-sm text-zinc-500 flex items-center mb-4">
              <Briefcase size={14} className="mr-1.5 text-zinc-400" /> {tech.specialization}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-zinc-600">
                <Phone size={14} className="mr-2 text-zinc-400" /> {tech.phone || "No phone"}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-zinc-50">
              <button 
                onClick={() => {
                  setEditingTech(tech);
                  setFormData({
                    name: tech.name,
                    specialization: tech.specialization,
                    phone: tech.phone,
                    status: tech.status
                  });
                  setIsModalOpen(true);
                }}
                className="flex-1 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center"
              >
                <Edit2 size={14} className="mr-1.5" /> Edit
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900">
                  {editingTech ? "Edit Technician" : "Add New Technician"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Specialization</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    >
                      <option>Ceramist</option>
                      <option>Metal Tech</option>
                      <option>Model Tech</option>
                      <option>CAD/CAM Tech</option>
                      <option>Polisher</option>
                      <option>Denture Tech</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Status</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {editingTech ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
