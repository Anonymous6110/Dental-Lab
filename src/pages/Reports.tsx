import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { 
  Calendar, Users, Briefcase, FileText, Download, Filter, 
  ChevronDown, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 
} from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DentalCase, Doctor } from "../types";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function Reports() {
  const [cases, setCases] = useState<DentalCase[]>([]);
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [typeStats, setTypeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedDoctor, setSelectedDoctor] = useState<string>("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesRes, docRes, dailyRes, typeRes] = await Promise.all([
        fetch("/api/cases").then(res => res.json()),
        fetch("/api/reports/doctor-stats").then(res => res.json()),
        fetch("/api/reports/daily-stats").then(res => res.json()),
        fetch("/api/reports/type-stats").then(res => res.json())
      ]);
      
      setCases(casesRes);
      setDoctorStats(docRes);
      setDailyStats(dailyRes);
      setTypeStats(typeRes);
    } catch (err) {
      console.error("Failed to fetch report data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const caseDate = new Date(c.created_at);
    const inRange = isWithinInterval(caseDate, {
      start: startOfDay(new Date(dateRange.start)),
      end: endOfDay(new Date(dateRange.end))
    });
    const matchesDoctor = selectedDoctor === "All" || c.doctor_id.toString() === selectedDoctor;
    return inRange && matchesDoctor;
  });

  const summary = {
    total: filteredCases.length,
    completed: filteredCases.filter(c => c.status === 'Completed' || c.status === 'Delivered').length,
    active: filteredCases.filter(c => c.status === 'Pending' || c.status === 'In Progress' || c.status === 'Trial').length,
  };

  const doctorPerformance = doctorStats.map(doc => {
    const docCases = filteredCases.filter(c => c.doctor_id === doc.id);
    const periodTotal = docCases.length;
    const periodCompleted = docCases.filter(c => c.status === 'Completed' || c.status === 'Delivered').length;
    const periodActive = docCases.filter(c => c.status === 'Pending' || c.status === 'In Progress' || c.status === 'Trial').length;
    const rate = periodTotal > 0 ? Math.round((periodCompleted / periodTotal) * 100) : 0;

    return {
      ...doc,
      periodTotal,
      periodCompleted,
      periodActive,
      rate
    };
  }).sort((a, b) => b.periodTotal - a.periodTotal);

  const tableTotals = {
    cases: doctorPerformance.reduce((sum, d) => sum + d.periodTotal, 0),
    active: doctorPerformance.reduce((sum, d) => sum + d.periodActive, 0),
    completed: doctorPerformance.reduce((sum, d) => sum + d.periodCompleted, 0),
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading reports...</div>;

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Analytics & Reports</h1>
          <p className="text-zinc-500 mt-1">Comprehensive insights into your lab's performance and case distribution.</p>
        </div>
        <button className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10">
          <Download size={20} className="mr-2" /> Export PDF
        </button>
      </header>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-wrap gap-6 items-end">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Doctor</label>
          <select 
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none min-w-[200px]"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="All">All Doctors</option>
            {doctorStats.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={fetchData}
          className="px-6 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors text-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <Briefcase size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg flex items-center">
              <ArrowUpRight size={14} className="mr-1" /> 12%
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-500">Total Cases (Period)</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg flex items-center">
              <ArrowUpRight size={14} className="mr-1" /> 8%
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-500">Completed Cases</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">{summary.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg flex items-center">
              <ArrowDownRight size={14} className="mr-1" /> 3%
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-500">Active / Pending</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">{summary.active}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Trend Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-900 mb-8">Daily Case Volume</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}}
                  activeDot={{r: 6, strokeWidth: 0}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Type Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-900 mb-8">Case Type Distribution</h2>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="case_type"
                >
                  {typeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor-wise Performance */}
      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-8 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-900">Doctor-wise Performance</h2>
          <p className="text-sm text-zinc-500 mt-1">Breakdown of case volume and completion rates per doctor.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-8 py-5 font-bold">Doctor / Clinic</th>
                <th className="px-8 py-5 font-bold">Total Cases</th>
                <th className="px-8 py-5 font-bold">Active</th>
                <th className="px-8 py-5 font-bold">Completed</th>
                <th className="px-8 py-5 font-bold">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {doctorPerformance.map((stat) => (
                <tr key={stat.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-zinc-900">{stat.name}</p>
                    <p className="text-xs text-zinc-500">{stat.clinic_name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <span className="font-bold text-zinc-900 mr-2">{stat.periodTotal}</span>
                      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">Cases</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">{stat.periodActive}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">{stat.periodCompleted}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{width: `${stat.rate}%`}}
                        />
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{stat.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50/50 border-t border-zinc-100">
              <tr>
                <td className="px-8 py-4 font-bold text-zinc-900">Grand Total</td>
                <td className="px-8 py-4 font-bold text-zinc-900">{tableTotals.cases}</td>
                <td className="px-8 py-4 font-bold text-amber-700">{tableTotals.active}</td>
                <td className="px-8 py-4 font-bold text-emerald-700">{tableTotals.completed}</td>
                <td className="px-8 py-4 font-bold text-zinc-900">
                  {tableTotals.cases > 0 ? Math.round((tableTotals.completed / tableTotals.cases) * 100) : 0}% Avg
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detailed Case Report */}
      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Detailed Case Log</h2>
            <p className="text-sm text-zinc-500 mt-1">Full list of cases within the selected filters.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-400">
            <Filter size={16} /> {filteredCases.length} Results
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-8 py-5 font-bold">Case ID</th>
                <th className="px-8 py-5 font-bold">Patient</th>
                <th className="px-8 py-5 font-bold">Doctor</th>
                <th className="px-8 py-5 font-bold">Type</th>
                <th className="px-8 py-5 font-bold">Created</th>
                <th className="px-8 py-5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-mono text-zinc-400">#{c.id.toString().padStart(4, '0')}</td>
                  <td className="px-8 py-5 font-bold text-zinc-900">{c.patient_name}</td>
                  <td className="px-8 py-5 text-sm text-zinc-600">{c.doctor_name}</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">{c.case_type}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-zinc-500">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      c.status === 'Delivered' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      c.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      c.status === 'Trial' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      c.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
