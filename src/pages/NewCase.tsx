import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Briefcase, User, Calendar, FileText, Save, X, ChevronLeft, Upload, Camera, LayoutGrid, Users, DollarSign, Clock } from "lucide-react";
import { Doctor, Technician, Shade, RateList } from "../types";
import { toast } from "react-hot-toast";
import ToothChart from "../components/ToothChart";
import { format } from "date-fns";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function NewCase() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [shades, setShades] = useState<Shade[]>([]);
  const [rates, setRates] = useState<RateList[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    doctor_id: "",
    technician_id: "",
    patient_name: "",
    case_type: "",
    material: "",
    shade: "",
    priority: "Normal",
    receiving_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: "",
    cost: "0",
    notes: "",
    image_url: "",
    selected_teeth: "",
    preparation_type: ""
  });
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/doctors").then(res => res.json()),
      fetch("/api/technicians").then(res => res.json()),
      fetch("/api/shades").then(res => res.json()),
      fetch("/api/rate-list").then(res => res.json())
    ]).then(([docs, techs, shadesData, ratesData]) => {
      setDoctors(docs);
      setTechnicians(techs);
      setShades(shadesData);
      setRates(ratesData);
      
      // Set defaults if data exists
      if (ratesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          case_type: ratesData[0].case_type,
          material: ratesData[0].material,
          cost: ratesData[0].price.toString()
        }));
      }
      if (shadesData.length > 0) {
        setFormData(prev => ({ ...prev, shade: shadesData[0].name }));
      }
      
      setLoading(false);
    });
  }, []);

  // Auto-update cost when case_type or material changes
  useEffect(() => {
    const rate = rates.find(r => r.case_type === formData.case_type && r.material === formData.material);
    if (rate) {
      setFormData(prev => ({ ...prev, cost: rate.price.toString() }));
    }
  }, [formData.case_type, formData.material, rates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor_id) {
      toast.error("Please select a doctor");
      return;
    }
    
    const finalData = {
      ...formData,
      selected_teeth: selectedTeeth.join(',')
    };

    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData)
    });
    if (res.ok) {
      toast.success("Case created successfully");
      navigate("/cases");
    }
  };

  const toggleTooth = (num: number) => {
    setSelectedTeeth(prev => 
      prev.includes(num) ? prev.filter(t => t !== num) : [...prev, num]
    );
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

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 px-4 md:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-full mr-4 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">New Dental Case</h1>
            <p className="text-zinc-500 mt-1">Fill in the details for the new restoration job.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
            <div className="flex items-center text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">
              <User size={18} className="mr-2" /> Patient & Doctor
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Patient Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Doctor / Clinic</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                >
                  <option value="">Select a doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.clinic_name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Assigned Technician</label>
                <select 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={formData.technician_id}
                  onChange={(e) => setFormData({...formData, technician_id: e.target.value})}
                >
                  <option value="">Select a technician</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Case Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal', 'High', 'Urgent'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.priority === p 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' 
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-emerald-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2 pt-4">
              <Briefcase size={18} className="mr-2" /> Case Specifications
            </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-700">Case Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from(new Set(rates.map(r => r.case_type))).length > 0 ? (
                    Array.from(new Set(rates.map(r => r.case_type))).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, case_type: type, material: ""})}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left group",
                          formData.case_type === type 
                            ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10" 
                            : "bg-zinc-50 border-zinc-100 hover:border-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                          formData.case_type === type ? "bg-emerald-500 text-white" : "bg-white text-zinc-400 group-hover:text-emerald-500"
                        )}>
                          <Briefcase size={20} />
                        </div>
                        <p className={cn("font-bold text-sm", formData.case_type === type ? "text-emerald-900" : "text-zinc-600")}>{type}</p>
                      </button>
                    ))
                  ) : (
                    ['Crown', 'Bridge', 'Implant', 'Veneer', 'Denture'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, case_type: type, material: ""})}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left group",
                          formData.case_type === type 
                            ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10" 
                            : "bg-zinc-50 border-zinc-100 hover:border-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                          formData.case_type === type ? "bg-emerald-500 text-white" : "bg-white text-zinc-400 group-hover:text-emerald-500"
                        )}>
                          <Briefcase size={20} />
                        </div>
                        <p className={cn("font-bold text-sm", formData.case_type === type ? "text-emerald-900" : "text-zinc-600")}>{type}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-700">Material</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {rates.filter(r => r.case_type === formData.case_type).length > 0 ? (
                    rates.filter(r => r.case_type === formData.case_type).map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setFormData({...formData, material: r.material})}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left group",
                          formData.material === r.material 
                            ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10" 
                            : "bg-zinc-50 border-zinc-100 hover:border-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors",
                          formData.material === r.material ? "bg-emerald-500 text-white" : "bg-white text-zinc-400 group-hover:text-emerald-500"
                        )}>
                          <LayoutGrid size={16} />
                        </div>
                        <p className={cn("font-bold text-xs", formData.material === r.material ? "text-emerald-900" : "text-zinc-600")}>{r.material}</p>
                        <p className="text-[10px] text-zinc-400 mt-1 font-bold">${r.price.toLocaleString()}</p>
                      </button>
                    ))
                  ) : (
                    ['Zirconia', 'PFM', 'E-Max', 'Gold', 'Acrylic'].map(mat => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setFormData({...formData, material: mat})}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left group",
                          formData.material === mat 
                            ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10" 
                            : "bg-zinc-50 border-zinc-100 hover:border-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors",
                          formData.material === mat ? "bg-emerald-500 text-white" : "bg-white text-zinc-400 group-hover:text-emerald-500"
                        )}>
                          <LayoutGrid size={16} />
                        </div>
                        <p className={cn("font-bold text-xs", formData.material === mat ? "text-emerald-900" : "text-zinc-600")}>{mat}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-700">Preparation Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Shoulder', 'Chamfer', 'Knife Edge', 'Feather Edge'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, preparation_type: type})}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-xs font-bold",
                        formData.preparation_type === type 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" 
                          : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-emerald-200"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-700">Shade</label>
                <div className="flex flex-wrap gap-2">
                  {shades.length > 0 ? shades.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({...formData, shade: s.name})}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 transition-all text-xs font-bold",
                        formData.shade === s.name 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                          : "bg-white border-zinc-100 text-zinc-500 hover:border-emerald-200 hover:text-emerald-500"
                      )}
                    >
                      {s.name}
                    </button>
                  )) : (
                    ['A1', 'A2', 'A3', 'B1', 'B2', 'C1'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({...formData, shade: s})}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 transition-all text-xs font-bold",
                          formData.shade === s 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                            : "bg-white border-zinc-100 text-zinc-500 hover:border-emerald-200 hover:text-emerald-500"
                        )}
                      >
                        {s}
                      </button>
                    ))
                  )}
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Receiving Date</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    required
                    type="date" 
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.receiving_date}
                    onChange={(e) => setFormData({...formData, receiving_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    required
                    type="date" 
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Case Cost ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    required
                    type="number" 
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-bold text-zinc-700">Additional Notes</label>
              <textarea 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all h-32 resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Specific instructions, margin details, etc."
              />
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <div className="flex items-center text-emerald-600 font-bold text-sm uppercase tracking-wider mb-6">
                <LayoutGrid size={18} className="mr-2" /> Tooth Selection
              </div>
              <ToothChart 
                selectedTeeth={selectedTeeth}
                onToggleTooth={toggleTooth}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center">
              <Camera size={20} className="mr-2 text-emerald-500" /> Case Image
            </h3>
            <div className="space-y-4">
              <div 
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all overflow-hidden relative ${
                  formData.image_url ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:border-emerald-300'
                }`}
              >
                {formData.image_url ? (
                  <>
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image_url: ""})}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-zinc-400 mb-2" />
                    <p className="text-xs font-bold text-zinc-500 text-center">Upload impression photo or X-ray</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 text-center italic">
                Images can be edited later using AI tools.
              </p>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center group"
          >
            <Save size={24} className="mr-3 group-hover:scale-110 transition-transform" /> Create Case
          </button>
          
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
