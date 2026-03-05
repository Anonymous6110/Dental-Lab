import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DollarSign, Plus, Search, Calendar, 
  TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, Filter,
  CreditCard, Banknote, Receipt, X
} from "lucide-react";
import { Payment, Expense, Doctor } from "../types";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function Financials() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [summary, setSummary] = useState({ total_revenue: 0, total_payments: 0, total_expenses: 0, net_profit: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    doctor_id: "",
    invoice_id: "",
    amount: "",
    payment_method: "Cash",
    reference_no: "",
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "Materials",
    amount: "",
    description: "",
    expense_date: format(new Date(), 'yyyy-MM-dd')
  });

  const [doctorInvoices, setDoctorInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (paymentForm.doctor_id) {
      fetch(`/api/invoices?doctor_id=${paymentForm.doctor_id}&status=Unpaid`)
        .then(res => res.json())
        .then(data => setDoctorInvoices(data));
    } else {
      setDoctorInvoices([]);
    }
  }, [paymentForm.doctor_id]);

  const fetchData = async () => {
    try {
      const [payRes, expRes, docRes, sumRes] = await Promise.all([
        fetch("/api/payments").then(res => res.json()),
        fetch("/api/expenses").then(res => res.json()),
        fetch("/api/doctors").then(res => res.json()),
        fetch("/api/reports/financial-summary").then(res => res.json())
      ]);
      setPayments(payRes);
      setExpenses(expRes);
      setDoctors(docRes);
      setSummary(sumRes);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load financial data");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm)
    });
    if (res.ok) {
      toast.success("Payment recorded");
      setIsModalOpen(false);
      fetchData();
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseForm)
    });
    if (res.ok) {
      toast.success("Expense recorded");
      setIsModalOpen(false);
      fetchData();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Financial Management</h1>
          <p className="text-zinc-500 mt-1">Track payments, expenses, and overall lab profitability.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setActiveTab('payments');
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} className="mr-2" /> Record Payment
          </button>
          <button 
            onClick={() => {
              setActiveTab('expenses');
              setIsModalOpen(true);
            }}
            className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
          >
            <Plus size={20} className="mr-2" /> Record Expense
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Total Revenue</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900">${(summary.total_revenue || 0).toLocaleString()}</h3>
          <p className="text-xs text-zinc-400 mt-1">Total billed to doctors</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Payments Received</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900">${(summary.total_payments || 0).toLocaleString()}</h3>
          <p className="text-xs text-zinc-400 mt-1">Cash flow into lab</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-wider">Total Expenses</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900">${(summary.total_expenses || 0).toLocaleString()}</h3>
          <p className="text-xs text-zinc-400 mt-1">Materials, rent, salaries</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl shadow-zinc-900/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Net Profit</span>
          </div>
          <h3 className="text-2xl font-bold text-white">${(summary.net_profit || 0).toLocaleString()}</h3>
          <p className="text-xs text-zinc-500 mt-1">Revenue minus expenses</p>
        </div>
      </div>

      {/* Tabs and Tables */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-100">
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'payments' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Payments History
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'expenses' ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50/30' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Expenses Breakdown
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'payments' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-50">
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Doctor</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Invoice</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Method</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ref No</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 text-sm font-medium text-zinc-600">{format(new Date(p.payment_date), 'MMM d, yyyy')}</td>
                        <td className="py-4 text-sm font-bold text-zinc-900">{p.doctor_name}</td>
                        <td className="py-4 text-sm text-zinc-500">
                          {p.invoice_no ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <Receipt size={12} />
                              INV-{p.invoice_no}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md uppercase">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-zinc-500 font-mono">{p.reference_no || "-"}</td>
                      <td className="py-4 text-sm font-bold text-emerald-600 text-right">${(p.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-50">
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {expenses.map((e) => (
                    <tr key={e.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 text-sm font-medium text-zinc-600">{format(new Date(e.expense_date), 'MMM d, yyyy')}</td>
                      <td className="py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded-md uppercase border border-rose-100">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-zinc-500">{e.description}</td>
                      <td className="py-4 text-sm font-bold text-rose-600 text-right">${(e.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
                  {activeTab === 'payments' ? "Record Doctor Payment" : "Record Lab Expense"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              {activeTab === 'payments' ? (
                <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Select Doctor</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={paymentForm.doctor_id}
                      onChange={(e) => setPaymentForm({...paymentForm, doctor_id: e.target.value})}
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.clinic_name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Link to Invoice (Optional)</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={paymentForm.invoice_id}
                      onChange={(e) => {
                        const invId = e.target.value;
                        const selectedInv = doctorInvoices.find(i => i.id.toString() === invId);
                        setPaymentForm({
                          ...paymentForm, 
                          invoice_id: invId,
                          amount: selectedInv ? (selectedInv.amount - (selectedInv.total_paid || 0)).toString() : paymentForm.amount
                        });
                      }}
                    >
                      <option value="">No link</option>
                      {doctorInvoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          INV-{inv.invoice_no} (${(inv.amount - (inv.total_paid || 0)).toLocaleString()} remaining)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Amount ($)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Method</label>
                      <select 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                      >
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                        <option>Check</option>
                        <option>Online</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Ref No</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={paymentForm.reference_no}
                        onChange={(e) => setPaymentForm({...paymentForm, reference_no: e.target.value})}
                        placeholder="Check # or TXN ID"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Save Payment</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                    >
                      <option>Materials</option>
                      <option>Salaries</option>
                      <option>Rent</option>
                      <option>Utilities</option>
                      <option>Maintenance</option>
                      <option>Marketing</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Amount ($)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={expenseForm.expense_date}
                        onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Description</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all h-24 resize-none"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      placeholder="What was this expense for?"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20">Save Expense</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
