import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, Plus, Search, AlertTriangle, 
  History, Edit2, Trash2, X, Save, 
  ArrowUp, ArrowDown, Layers
} from "lucide-react";
import { InventoryItem } from "../types";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Materials",
    quantity: "",
    unit: "grams",
    min_stock_level: ""
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load inventory");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
    const method = editingItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success(editingItem ? "Item updated" : "Item added");
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ item_name: "", category: "Materials", quantity: "", unit: "grams", min_stock_level: "" });
      fetchInventory();
    }
  };

  const updateQuantity = async (id: number, newQty: number) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty })
    });
    if (res.ok) {
      fetchInventory();
    }
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Inventory Management</h1>
          <p className="text-zinc-500 mt-1">Track lab materials and receive low stock alerts.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setFormData({ item_name: "", category: "Materials", quantity: "", unit: "grams", min_stock_level: "" });
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} className="mr-2" /> Add Item
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Search inventory by item name or category..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isLowStock = item.quantity <= item.min_stock_level;
          return (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white p-6 rounded-3xl border transition-all group relative overflow-hidden ${
                isLowStock ? 'border-amber-200 shadow-amber-100/50' : 'border-zinc-100 shadow-sm'
              }`}
            >
              {isLowStock && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center">
                  <AlertTriangle size={12} className="mr-1" /> LOW STOCK
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                  isLowStock ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Package size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</p>
                  <p className="text-sm font-bold text-zinc-900">{item.category}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-zinc-900 mb-4">{item.item_name}</h3>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-500">Current Stock</span>
                  <span className={`text-lg font-bold ${isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((item.quantity / (item.min_stock_level * 2)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">Min. Level: {item.min_stock_level} {item.unit}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center"
                >
                  <Plus size={14} className="mr-1" /> Add
                </button>
                <button 
                  onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center"
                >
                  <ArrowDown size={14} className="mr-1" /> Use
                </button>
                <button 
                  onClick={() => {
                    setEditingItem(item);
                    setFormData({
                      item_name: item.item_name,
                      category: item.category,
                      quantity: item.quantity.toString(),
                      unit: item.unit,
                      min_stock_level: item.min_stock_level.toString()
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-zinc-50 text-zinc-400 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
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
                  {editingItem ? "Edit Item" : "Add New Material"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Item Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    placeholder="e.g. Zirconia Disk A1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Materials</option>
                      <option>Tools</option>
                      <option>Implants</option>
                      <option>Packaging</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Unit</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option>grams</option>
                      <option>pieces</option>
                      <option>ml</option>
                      <option>packs</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Initial Quantity</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Min. Stock Level</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Save Item</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
