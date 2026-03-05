import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, PlusCircle, History, Menu, X, ChevronRight, Settings, UserCog, Wallet, Package, FileText, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "react-hot-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Pages (to be implemented)
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Cases from "./pages/Cases";
import NewCase from "./pages/NewCase";
import CaseDetails from "./pages/CaseDetails";
import Reports from "./pages/Reports";
import Technicians from "./pages/Technicians";
import Financials from "./pages/Financials";
import Inventory from "./pages/Inventory";
import DoctorLedger from "./pages/DoctorLedger";
import SettingsPage from "./pages/Settings";
import Invoices from "./pages/Invoices";
import DoctorPortal from "./pages/DoctorPortal";
import Login from "./pages/Login";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(setSettings);
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (settings.backup_on_exit === 'true') {
        e.preventDefault();
        e.returnValue = 'Don\'t forget to backup your data before exiting!';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [settings]);

  const navItems: { path: string; icon: any; label: string; tab?: string }[] = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/cases", icon: Briefcase, label: "Cases" },
    { path: "/doctors", icon: Users, label: "Doctors" },
    { path: "/technicians", icon: UserCog, label: "Technicians" },
    { path: "/financials", icon: Wallet, label: "Financials" },
    { path: "/invoices", icon: FileText, label: "Invoices" },
    { path: "/inventory", icon: Package, label: "Inventory" },
    { path: "/reports", icon: History, label: "Reports" },
  ];

  const filteredItems = user?.role === 'Admin' 
    ? [...navItems, { path: "/settings", icon: Shield, label: "User Management", tab: "users" }]
    : navItems;

  return (
    <div className={cn("bg-zinc-950 text-zinc-400 h-screen transition-all duration-300 flex flex-col border-r border-zinc-800 relative overflow-hidden", isOpen ? "w-64" : "w-20")}>
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      
      <div className="p-6 flex items-center justify-between relative z-10">
        {isOpen && (
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white font-black text-xl tracking-tighter flex items-center"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg mr-2 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <PlusCircle size={18} />
            </div>
            DENTAL<span className="text-emerald-500">LAB</span>
          </motion.h1>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-500 hover:text-white">
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path + (item.tab ? `?tab=${item.tab}` : '')}
            className={cn(
              "flex items-center p-3 rounded-xl transition-all group",
              location.pathname === item.path 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "hover:bg-zinc-900 hover:text-white"
            )}
          >
            <item.icon size={20} className={cn("min-w-[20px]", location.pathname === item.path ? "text-emerald-500" : "group-hover:text-white")} />
            {isOpen && <span className="ml-4 font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        <Link 
          to="/settings"
          className={cn(
            "flex items-center p-3 rounded-xl transition-all cursor-pointer", 
            location.pathname === "/settings" ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-zinc-900 hover:text-white",
            !isOpen && "justify-center"
          )}
        >
          <Settings size={20} />
          {isOpen && <span className="ml-4 font-medium">Settings</span>}
        </Link>
        <button 
          onClick={onLogout}
          className={cn(
            "w-full flex items-center p-3 rounded-xl transition-all cursor-pointer text-rose-500 hover:bg-rose-500/10",
            !isOpen && "justify-center"
          )}
        >
          <X size={20} />
          {isOpen && <span className="ml-4 font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) return null;

  // If it's the doctor portal, don't show the main sidebar/layout
  const isDoctorPortal = window.location.pathname === '/doctor-portal';

  if (!user && !isDoctorPortal) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/doctor-portal" element={<DoctorPortal />} />
          <Route path="*" element={<Login onLogin={setUser} />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      {isDoctorPortal ? (
        <Routes>
          <Route path="/doctor-portal" element={<DoctorPortal />} />
        </Routes>
      ) : (
        <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/doctors/:id/ledger" element={<DoctorLedger />} />
                <Route path="/technicians" element={<Technicians />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/new-case" element={<NewCase />} />
                <Route path="/cases/:id" element={<CaseDetails />} />
                <Route path="/financials" element={<Financials />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/doctor-portal" element={<DoctorPortal />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      )}
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
