import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings as SettingsIcon, Users, Database, 
  Tag, Palette, Save, Download, Upload, 
  Plus, Trash2, Shield, Bell, Globe,
  RefreshCw, HardDrive, ShieldCheck
} from "lucide-react";
import { User, RateList, Shade } from "../types";
import { toast } from "react-hot-toast";

export default function Settings() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') as any;
  
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'rates' | 'shades'>(
    (initialTab && ['general', 'users', 'rates', 'shades'].includes(initialTab)) ? initialTab : 'general'
  );
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [rates, setRates] = useState<RateList[]>([]);
  const [shades, setShades] = useState<Shade[]>([]);
  const [appSettings, setAppSettings] = useState<any>({});

  // Form states
  const [userForm, setUserForm] = useState({ username: "", password: "", role: "Staff" });
  const [rateForm, setRateForm] = useState({ case_type: "", material: "", price: "" });
  const [shadeForm, setShadeForm] = useState({ name: "" });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const tab = queryParams.get('tab') as any;
    if (tab && ['general', 'users', 'rates', 'shades'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchData = async () => {
    try {
      const [usersRes, ratesRes, shadesRes, settingsRes] = await Promise.all([
        fetch("/api/users").then(res => res.json()),
        fetch("/api/rate-list").then(res => res.json()),
        fetch("/api/shades").then(res => res.json()),
        fetch("/api/settings").then(res => res.json())
      ]);
      setUsers(usersRes);
      setRates(ratesRes);
      setShades(shadesRes);
      setAppSettings(settingsRes);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load settings");
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    const updated = { ...appSettings, ...newSettings };
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      setAppSettings(updated);
      toast.success("Settings updated");
    }
  };

  const handleBackup = async () => {
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dentallab_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success("Backup downloaded successfully");
    } catch (err) {
      toast.error("Backup failed");
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          toast.success("Database restored successfully");
          window.location.reload();
        } else {
          toast.error("Restore failed");
        }
      } catch (err) {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm)
    });
    if (res.ok) {
      toast.success("User added");
      setUserForm({ username: "", password: "", role: "Staff" });
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to add user");
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/rate-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rateForm)
    });
    if (res.ok) {
      toast.success("Rate added");
      setRateForm({ case_type: "", material: "", price: "" });
      fetchData();
    }
  };

  const handleAddShade = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/shades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shadeForm)
    });
    if (res.ok) {
      toast.success("Shade added");
      setShadeForm({ name: "" });
      fetchData();
    }
  };

  const handleDelete = async (type: 'users' | 'rate-list' | 'shades', id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const res = await fetch(`/api/${type}/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted successfully");
      fetchData();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your lab configuration, users, and data backups.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Database size={20} className="mr-3" /> General & Backup
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Users size={20} className="mr-3" /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('rates')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'rates' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Tag size={20} className="mr-3" /> Rate List
          </button>
          <button 
            onClick={() => setActiveTab('shades')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'shades' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Palette size={20} className="mr-3" /> Shade Management
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                <section className="space-y-6">
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                    <RefreshCw size={24} className="mr-3 text-emerald-500" /> Backup Preferences
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900">Auto-Backup</p>
                        <p className="text-xs text-zinc-500">Automatically backup data daily</p>
                      </div>
                      <button 
                        onClick={() => handleSaveSettings({ auto_backup: appSettings.auto_backup === 'true' ? 'false' : 'true' })}
                        className={`w-12 h-6 rounded-full transition-all relative ${appSettings.auto_backup === 'true' ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.auto_backup === 'true' ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900">Backup on Exit</p>
                        <p className="text-xs text-zinc-500">Prompt for backup when closing app</p>
                      </div>
                      <button 
                        onClick={() => handleSaveSettings({ backup_on_exit: appSettings.backup_on_exit === 'true' ? 'false' : 'true' })}
                        className={`w-12 h-6 rounded-full transition-all relative ${appSettings.backup_on_exit === 'true' ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.backup_on_exit === 'true' ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-8 border-t border-zinc-100">
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                    <HardDrive size={24} className="mr-3 text-emerald-500" /> Data Management
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handleBackup}
                      className="flex items-center px-6 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
                    >
                      <Download size={20} className="mr-2" /> Download Backup (.json)
                    </button>
                    <label className="flex items-center px-6 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-50 transition-all cursor-pointer shadow-sm">
                      <Upload size={20} className="mr-2 text-emerald-500" /> 
                      Restore from Backup
                      <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                  </div>
                  <p className="text-xs text-zinc-400 italic">
                    * Restoring a backup will overwrite all current data in the database. Please be careful.
                  </p>
                </section>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900">User Accounts</h2>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{users.length} Total Users</span>
                </div>

                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <input 
                    required
                    placeholder="Username"
                    className="px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  />
                  <input 
                    required
                    type="password"
                    placeholder="Password"
                    className="px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  />
                  <select 
                    className="px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                  >
                    <option>Staff</option>
                    <option>Admin</option>
                  </select>
                  <button type="submit" className="bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center">
                    <Plus size={20} className="mr-2" /> Add User
                  </button>
                </form>

                <div className="overflow-hidden rounded-2xl border border-zinc-100">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-900">{user.username}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDelete('users', user.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              disabled={user.username === 'admin'}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'rates' && (
              <motion.div 
                key="rates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900">Rate List</h2>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{rates.length} Items</span>
                </div>

                <form onSubmit={handleAddRate} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <input 
                    required
                    placeholder="Case Type (e.g. Crown)"
                    className="px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={rateForm.case_type}
                    onChange={(e) => setRateForm({...rateForm, case_type: e.target.value})}
                  />
                  <input 
                    required
                    placeholder="Material (e.g. Zirconia)"
                    className="px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={rateForm.material}
                    onChange={(e) => setRateForm({...rateForm, material: e.target.value})}
                  />
                  <input 
                    required
                    type="number"
                    placeholder="Price ($)"
                    className="px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={rateForm.price}
                    onChange={(e) => setRateForm({...rateForm, price: e.target.value})}
                  />
                  <button type="submit" className="bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center">
                    <Plus size={20} className="mr-2" /> Add Rate
                  </button>
                </form>

                <div className="overflow-hidden rounded-2xl border border-zinc-100">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Case Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {rates.map(rate => (
                        <tr key={rate.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-900">{rate.case_type}</td>
                          <td className="px-6 py-4 text-zinc-600">{rate.material}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">${rate.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDelete('rate-list', rate.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'shades' && (
              <motion.div 
                key="shades"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900">Available Shades</h2>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{shades.length} Shades</span>
                </div>

                <form onSubmit={handleAddShade} className="flex gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <input 
                    required
                    placeholder="Shade Name (e.g. A1, B2)"
                    className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={shadeForm.name}
                    onChange={(e) => setShadeForm({...shadeForm, name: e.target.value})}
                  />
                  <button type="submit" className="px-8 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center">
                    <Plus size={20} className="mr-2" /> Add Shade
                  </button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {shades.map(shade => (
                    <div key={shade.id} className="group relative p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                      <span className="font-bold text-zinc-900">{shade.name}</span>
                      <button 
                        onClick={() => handleDelete('shades', shade.id)}
                        className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
