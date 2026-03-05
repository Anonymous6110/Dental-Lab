export interface Doctor {
  id: number;
  name: string;
  clinic_name: string;
  phone: string;
  email: string;
  address: string;
  specialization: string;
  image_url: string;
  portal_username?: string;
  created_at: string;
}

export interface DentalCase {
  id: number;
  doctor_id: number;
  technician_id?: number;
  doctor_name?: string;
  technician_name?: string;
  patient_name: string;
  case_type: string;
  material: string;
  shade: string;
  selected_teeth: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Trial' | 'Completed' | 'Delivered' | 'Returned';
  receiving_date: string;
  due_date: string;
  delivery_date?: string;
  cost: number;
  notes: string;
  image_url: string;
  preparation_type?: string;
  created_at: string;
}

export interface Technician {
  id: number;
  name: string;
  specialization: string;
  phone: string;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface Payment {
  id: number;
  doctor_id: number;
  invoice_id?: number;
  doctor_name?: string;
  amount: number;
  payment_method: string;
  reference_no: string;
  payment_date: string;
  notes: string;
  created_at: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock_level: number;
  last_updated: string;
}

export interface CaseHistory {
  id: number;
  case_id: number;
  status: string;
  comment: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  role: 'Admin' | 'Staff';
  created_at: string;
}

export interface RateList {
  id: number;
  case_type: string;
  material: string;
  price: number;
  created_at: string;
}

export interface Shade {
  id: number;
  name: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  doctor_id: number;
  doctor_name?: string;
  doctor_email?: string;
  doctor_phone?: string;
  clinic_name?: string;
  address?: string;
  phone?: string;
  invoice_no: number;
  amount: number;
  total_paid?: number;
  status: 'Unpaid' | 'Partial' | 'Paid';
  due_date: string;
  last_reminder_sent_at?: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  case_id: number;
  patient_name?: string;
  case_type?: string;
  description: string;
  amount: number;
}

export interface CaseTask {
  id: number;
  case_id: number;
  task_name: string;
  technician_id: number;
  technician_name?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completed_at?: string;
  created_at: string;
}
