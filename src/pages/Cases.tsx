import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Plus, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DentalCase } from "../types";
import { format } from "date-fns";

export default function Cases() {
  const [cases, setCases] = useState<DentalCase[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/cases")
      .then(res => res.json())
      .then(data => setCases(data));
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.patient_name.toLowerCase().includes(search.toLowerCase()) || 
      c.doctor_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Shipped': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const statusIcons = {
    'Pending': Clock,
    'In Progress': AlertCircle,
    'Completed': CheckCircle2,
    'Shipped': Truck
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dental Cases</h1>
          <p className="text-zinc-500 mt-1">Track all active and completed restoration jobs.</p>
        </div>
        <Link 
          to="/new-case"
          className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} className="mr-2" /> New Case
        </Link>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="text" 
            placeholder="Search patient or doctor..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto">
          {['All', 'Pending', 'In Progress', 'Completed', 'Shipped'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === f ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-5 font-bold">Patient</th>
                <th className="px-6 py-5 font-bold">Doctor</th>
                <th className="px-6 py-5 font-bold">Type/Material</th>
                <th className="px-6 py-5 font-bold">Status</th>
                <th className="px-6 py-5 font-bold">Due Date</th>
                <th className="px-6 py-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCases.map((c, i) => {
                const StatusIcon = statusIcons[c.status as keyof typeof statusIcons] || Clock;
                return (
                  <motion.tr 
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold mr-3">
                          {c.patient_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{c.patient_name}</p>
                          <p className="text-xs text-zinc-400">ID: #{c.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-zinc-700">{c.doctor_name}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900">{c.case_type}</span>
                        <span className="text-xs text-zinc-500">{c.material} • Shade {c.shade}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[c.status as keyof typeof statusColors]}`}>
                        <StatusIcon size={14} className="mr-2" />
                        {c.status}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-zinc-600">
                        {c.due_date ? format(new Date(c.due_date), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-zinc-400 group-hover:text-emerald-500 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <Briefcase size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">No cases found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
