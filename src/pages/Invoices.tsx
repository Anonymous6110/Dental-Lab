import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Plus, Search, Filter, Download, Printer, CheckCircle, Clock, AlertCircle, ChevronRight, MoreVertical, X, MessageCircle } from "lucide-react";
import { Invoice, Doctor, DentalCase } from "../types";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: "Cash",
    reference_no: "",
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ""
  });
  const [newInvoice, setNewInvoice] = useState({
    doctor_id: "",
    due_date: format(new Date(), 'yyyy-MM-dd'),
    items: [] as any[]
  });
  const [availableCases, setAvailableCases] = useState<DentalCase[]>([]);

  useEffect(() => {
    fetchData();
  }, [statusFilter, doctorFilter, startDate, endDate, invoiceNoFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (doctorFilter !== "All") params.append("doctor_id", doctorFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (invoiceNoFilter) params.append("invoice_no", invoiceNoFilter);

      const [invRes, docRes] = await Promise.all([
        fetch(`/api/invoices?${params.toString()}`),
        fetch("/api/doctors")
      ]);
      setInvoices(await invRes.json());
      setDoctors(await docRes.json());
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.doctor_id || newInvoice.items.length === 0) {
      toast.error("Please select a doctor and at least one case");
      return;
    }

    const totalAmount = newInvoice.items.reduce((acc, item) => acc + item.amount, 0);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newInvoice,
          amount: totalAmount
        })
      });

      if (res.ok) {
        toast.success("Invoice created successfully");
        setShowNewModal(false);
        setNewInvoice({
          doctor_id: "",
          due_date: format(new Date(), 'yyyy-MM-dd'),
          items: []
        });
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to create invoice");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success("Status updated");
        fetchData();
        if (selectedInvoice?.id === id) {
          fetchInvoiceDetails(id);
        }
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/invoices/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status })
      });
      if (res.ok) {
        toast.success(`Updated ${selectedIds.length} invoices`);
        setSelectedIds([]);
        fetchData();
      }
    } catch (error) {
      toast.error("Bulk update failed");
    }
  };

  const handleBulkRemind = async (type: 'email' | 'whatsapp') => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/invoices/bulk-remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, type })
      });
      if (res.ok) {
        toast.success(`Reminders sent to ${selectedIds.length} doctors`);
        setSelectedIds([]);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to send reminders");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentData,
          doctor_id: selectedInvoice.doctor_id,
          invoice_id: selectedInvoice.id
        })
      });
      if (res.ok) {
        toast.success("Payment recorded successfully");
        setShowPaymentModal(false);
        setPaymentData({
          amount: 0,
          payment_method: "Cash",
          reference_no: "",
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          notes: ""
        });
        fetchInvoiceDetails(selectedInvoice.id);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const fetchInvoiceDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error("Failed to load invoice details");
    }
  };

  const fetchDoctorCases = async (doctorId: string) => {
    if (!doctorId) return;
    try {
      const res = await fetch(`/api/doctors/${doctorId}/cases?uninvoiced=true`);
      const data = await res.json();
      // Only show completed/delivered cases
      setAvailableCases(data.filter((c: any) => c.status === 'Completed' || c.status === 'Delivered'));
    } catch (error) {
      toast.error("Failed to load doctor cases");
    }
  };

  const handleSelectAll = () => {
    const allItems = availableCases.map(c => ({
      case_id: c.id,
      description: `${c.case_type} - ${c.patient_name}`,
      amount: c.cost
    }));
    setNewInvoice({ ...newInvoice, items: allItems });
  };

  const handleDeselectAll = () => {
    setNewInvoice({ ...newInvoice, items: [] });
  };
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_no.toString().includes(searchQuery) || 
                         inv.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Partial': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <>
      <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Invoices</h1>
          <p className="text-zinc-500 mt-1">Manage billing and payments for doctors.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} className="mr-2" /> Create Invoice
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-sm font-medium">Total Outstanding</span>
            <AlertCircle size={20} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            ${invoices.reduce((acc, inv) => inv.status !== 'Paid' ? acc + inv.amount : acc, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-sm font-medium">Paid This Month</span>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            ${invoices.reduce((acc, inv) => inv.status === 'Paid' ? acc + inv.amount : acc, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-sm font-medium">Pending Invoices</span>
            <Clock size={20} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {invoices.filter(inv => inv.status !== 'Paid').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                placeholder="Search by invoice # or doctor..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Unpaid', 'Partial', 'Paid'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                    statusFilter === status 
                      ? "bg-zinc-900 text-white border-zinc-900" 
                      : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full flex gap-4">
              <select 
                className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
              >
                <option value="All">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input 
                  type="text"
                  placeholder="Inv #"
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                  value={invoiceNoFilter}
                  onChange={(e) => setInvoiceNoFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="date"
                className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
              />
              <span className="text-zinc-400 text-xs font-bold uppercase">to</span>
              <input 
                type="date"
                className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
              />
              {(startDate || endDate || doctorFilter !== "All" || statusFilter !== "All") && (
                <button 
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDoctorFilter("All");
                    setStatusFilter("All");
                  }}
                  className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Clear Filters"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-4 bg-zinc-900 text-white flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-zinc-700" />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkStatus('Paid')}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold transition-colors"
                >
                  Mark as Paid
                </button>
                <button 
                  onClick={() => handleBulkRemind('email')}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Send Email Reminder
                </button>
                <button 
                  onClick={() => handleBulkRemind('whatsapp')}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Send WhatsApp Reminder
                </button>
              </div>
            </div>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className={cn(
                  "hover:bg-zinc-50/50 transition-colors group",
                  selectedIds.includes(inv.id) && "bg-emerald-50/30"
                )}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                      checked={selectedIds.includes(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center font-bold text-zinc-900">
                      <FileText size={16} className="mr-2 text-zinc-400" />
                      {`INV-${inv.invoice_no}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-medium">{inv.doctor_name}</td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{format(new Date(inv.created_at), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">${inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", getStatusColor(inv.status))}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => fetchInvoiceDetails(inv.id)}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className="p-12 text-center">
              <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-zinc-300" />
              </div>
              <p className="text-zinc-500 font-medium">No invoices found.</p>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="text-xl font-bold text-zinc-900">Create New Invoice</h3>
                <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateInvoice} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Select Doctor</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={newInvoice.doctor_id}
                      onChange={(e) => {
                        setNewInvoice({...newInvoice, doctor_id: e.target.value, items: []});
                        fetchDoctorCases(e.target.value);
                      }}
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.clinic_name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Due Date</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                      Select Cases to Invoice
                      <span className="text-[10px] text-zinc-400 font-normal">Only completed/delivered cases are listed</span>
                    </label>
                    {availableCases.length > 0 && (
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={handleSelectAll}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-300">|</span>
                        <button 
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-[10px] font-bold text-zinc-400 hover:text-zinc-500 uppercase tracking-wider"
                        >
                          Deselect
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {availableCases.length > 0 ? availableCases.map(c => {
                      const isSelected = newInvoice.items.some(item => item.case_id === c.id);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => {
                            if (isSelected) {
                              setNewInvoice({
                                ...newInvoice,
                                items: newInvoice.items.filter(item => item.case_id !== c.id)
                              });
                            } else {
                              setNewInvoice({
                                ...newInvoice,
                                items: [...newInvoice.items, {
                                  case_id: c.id,
                                  description: `${c.case_type} - ${c.patient_name}`,
                                  amount: c.cost
                                }]
                              });
                            }
                          }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                            isSelected ? "bg-emerald-50 border-emerald-200" : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                          )}
                        >
                          <div>
                            <p className="font-bold text-zinc-900">{c.patient_name}</p>
                            <p className="text-xs text-zinc-500">{c.case_type} • {format(new Date(c.created_at), 'MMM dd')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-zinc-900">${c.cost.toLocaleString()}</p>
                            <div className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                              isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300"
                            )}>
                              {isSelected && <CheckCircle size={14} />}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                        <p className="text-sm text-zinc-400 italic">No billable cases found for this doctor.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Amount</p>
                    <p className="text-2xl font-black text-zinc-900">
                      ${newInvoice.items.reduce((acc, item) => acc + item.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={newInvoice.items.length === 0}
                      className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Invoice
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Invoice {`INV-${selectedInvoice.invoice_no}`}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Created on {format(new Date(selectedInvoice.created_at), 'MMMM dd, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const text = `Hello Doctor, here is your invoice INV-${selectedInvoice.invoice_no} for the amount of $${selectedInvoice.amount.toLocaleString()}. Status: ${selectedInvoice.status}.`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="p-2 hover:bg-green-100 text-green-600 rounded-full transition-colors" 
                    title="Share via WhatsApp"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <button className="p-2 hover:bg-zinc-200 rounded-full transition-colors" title="Print">
                    <Printer size={20} />
                  </button>
                  <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Billed To</p>
                    <p className="font-bold text-zinc-900 text-lg">{selectedInvoice.doctor_name}</p>
                    <p className="text-zinc-600">{selectedInvoice.clinic_name}</p>
                    <p className="text-zinc-500 text-sm mt-1">{selectedInvoice.address}</p>
                    <p className="text-zinc-500 text-sm">{selectedInvoice.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Invoice Status</p>
                    <div className="flex justify-end mb-4">
                      <select 
                        value={selectedInvoice.status}
                        onChange={(e) => handleUpdateStatus(selectedInvoice.id, e.target.value)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border focus:outline-none transition-all",
                          getStatusColor(selectedInvoice.status)
                        )}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Due Date</p>
                    <p className="font-bold text-zinc-900">{selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy') : '-'}</p>
                  </div>
                </div>

                <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedInvoice.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-zinc-900">{item.description}</p>
                            <p className="text-[10px] text-zinc-400">Case ID: #{item.case_id}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-zinc-900">
                            ${item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-50/50">
                        <td className="px-6 py-4 font-bold text-zinc-900">Total</td>
                        <td className="px-6 py-4 text-right text-xl font-black text-emerald-600">
                          ${selectedInvoice.amount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2">
                  {selectedInvoice.status !== 'Paid' && (
                    <>
                      <button 
                        onClick={() => {
                          setPaymentData({
                            ...paymentData,
                            amount: selectedInvoice.amount - (selectedInvoice.total_paid || 0)
                          });
                          setShowPaymentModal(true);
                        }}
                        className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                      >
                        <CheckCircle size={18} /> Record Payment
                      </button>
                      <button 
                        onClick={() => handleBulkRemind('email')}
                        className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
                      >
                        <AlertCircle size={18} /> Send Reminder
                      </button>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="text-xl font-bold text-zinc-900">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Remaining balance: ${(selectedInvoice.amount - (selectedInvoice.total_paid || 0)).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Method</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={paymentData.payment_method}
                      onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Date</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Reference #</label>
                  <input 
                    type="text"
                    placeholder="Check # or Transaction ID"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={paymentData.reference_no}
                    onChange={(e) => setPaymentData({...paymentData, reference_no: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Notes</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none h-20"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
