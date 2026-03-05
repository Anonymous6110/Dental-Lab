import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("dentallab.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    clinic_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    specialization TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active', -- Active, Inactive
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    technician_id INTEGER,
    patient_name TEXT NOT NULL,
    case_type TEXT NOT NULL, -- Crown, Bridge, Implant, etc.
    material TEXT,
    shade TEXT,
    selected_teeth TEXT,
    priority TEXT DEFAULT 'Normal', -- Normal, High, Urgent
    status TEXT DEFAULT 'Pending', -- Pending, In Progress, Trial, Completed, Delivered, Returned
    receiving_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    delivery_date DATE,
    cost REAL DEFAULT 0,
    notes TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (technician_id) REFERENCES technicians(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    invoice_id INTEGER,
    amount REAL NOT NULL,
    payment_method TEXT, -- Cash, Bank Transfer, Check
    reference_no TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, -- Materials, Salaries, Rent, Utilities, Maintenance, Other
    amount REAL NOT NULL,
    description TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT, -- grams, pieces, ml
    min_stock_level REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS case_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    status TEXT,
    comment TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Staff', -- Admin, Staff, Doctor
    doctor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  -- Add columns if they don't exist
  try { db.exec("ALTER TABLE cases ADD COLUMN preparation_type TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN doctor_id INTEGER;"); } catch (e) {}

  CREATE TABLE IF NOT EXISTS rate_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_type TEXT NOT NULL,
    material TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_cases_doctor_id ON cases(doctor_id);
  CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_doctor_id ON invoices(doctor_id);
  CREATE INDEX IF NOT EXISTS idx_users_doctor_id ON users(doctor_id);

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    invoice_no INTEGER UNIQUE NOT NULL,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Unpaid', -- Unpaid, Partial, Paid
    due_date DATE,
    last_reminder_sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    case_id INTEGER,
    description TEXT,
    amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (case_id) REFERENCES cases(id)
  );

  CREATE TABLE IF NOT EXISTS case_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    task_name TEXT NOT NULL,
    technician_id INTEGER,
    status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (technician_id) REFERENCES technicians(id)
  );

  -- Insert default admin if not exists
  INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'Admin');
  
  -- Insert default shades if not exists
  INSERT OR IGNORE INTO shades (name) VALUES ('A1'), ('A2'), ('A3'), ('A3.5'), ('A4'), ('B1'), ('B2'), ('B3'), ('B4'), ('C1'), ('C2'), ('C3'), ('C4'), ('D2'), ('D3'), ('D4'), ('BL1'), ('BL2'), ('BL3'), ('BL4');
`);

// Migration: Ensure specialization column exists
const runMigrations = () => {
  try {
    // Doctors migrations
    const doctorsInfo = db.prepare("PRAGMA table_info(doctors)").all() as any[];
    if (doctorsInfo.length > 0) {
      const doctorCols = [
        { name: 'specialization', type: 'TEXT' },
        { name: 'image_url', type: 'TEXT' }
      ];
      for (const col of doctorCols) {
        if (!doctorsInfo.some(c => c.name === col.name)) {
          try {
            db.exec(`ALTER TABLE doctors ADD COLUMN ${col.name} ${col.type};`);
            console.log(`Added ${col.name} column to doctors table`);
          } catch (e) {
            console.error(`Failed to add ${col.name} to doctors:`, e);
          }
        }
      }
    }

    // Cases migrations
    const casesInfo = db.prepare("PRAGMA table_info(cases)").all() as any[];
    if (casesInfo.length > 0) {
      const columnsToAdd = [
        { name: 'technician_id', type: 'INTEGER' },
        { name: 'priority', type: "TEXT DEFAULT 'Normal'" },
        { name: 'receiving_date', type: "DATE DEFAULT CURRENT_DATE" },
        { name: 'delivery_date', type: 'DATE' },
        { name: 'cost', type: 'REAL DEFAULT 0' },
        { name: 'selected_teeth', type: 'TEXT' },
        { name: 'image_url', type: 'TEXT' },
        { name: 'preparation_type', type: 'TEXT' }
      ];

      for (const col of columnsToAdd) {
        if (!casesInfo.some(c => c.name === col.name)) {
          try {
            db.exec(`ALTER TABLE cases ADD COLUMN ${col.name} ${col.type};`);
            console.log(`Added ${col.name} column to cases table`);
          } catch (e) {
            console.error(`Failed to add ${col.name} to cases:`, e);
          }
        }
      }
    }

    // Users migrations
    const usersInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    if (usersInfo.length > 0) {
      if (!usersInfo.some(c => c.name === 'doctor_id')) {
        db.exec("ALTER TABLE users ADD COLUMN doctor_id INTEGER;");
        console.log("Added doctor_id column to users table");
      }
    }

    // Invoices migrations
    const invoicesInfo = db.prepare("PRAGMA table_info(invoices)").all() as any[];
    if (invoicesInfo.length > 0) {
      if (!invoicesInfo.some(c => c.name === 'last_reminder_sent_at')) {
        db.exec("ALTER TABLE invoices ADD COLUMN last_reminder_sent_at DATETIME;");
        console.log("Added last_reminder_sent_at column to invoices table");
      }
    }

    // Payments migrations
    const paymentsInfo = db.prepare("PRAGMA table_info(payments)").all() as any[];
    if (paymentsInfo.length > 0) {
      if (!paymentsInfo.some(c => c.name === 'invoice_id')) {
        db.exec("ALTER TABLE payments ADD COLUMN invoice_id INTEGER;");
        console.log("Added invoice_id column to payments table");
      }
    }
  } catch (err) {
    console.error("Migration check failed:", err);
  }
};

runMigrations();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/users/doctor", (req, res) => {
    const { username, password, doctor_id } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (username, password, role, doctor_id) VALUES (?, ?, 'Doctor', ?)")
        .run(username, password, doctor_id);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.get("/api/doctors/:id/user", (req, res) => {
    const user = db.prepare("SELECT id, username, password, role FROM users WHERE doctor_id = ?").get(req.params.id);
    res.json(user || null);
  });

  app.get("/api/doctors", (req, res) => {
    const doctors = db.prepare(`
      SELECT doctors.*, 
      (SELECT username FROM users WHERE users.doctor_id = doctors.id LIMIT 1) as portal_username
      FROM doctors 
      ORDER BY name ASC
    `).all();
    res.json(doctors);
  });

  app.post("/api/doctors", (req, res) => {
    const { name, clinic_name, phone, email, address, specialization, image_url } = req.body;
    const info = db.prepare(
      "INSERT INTO doctors (name, clinic_name, phone, email, address, specialization, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(name, clinic_name, phone, email, address, specialization, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/doctors/:id", (req, res) => {
    const { name, clinic_name, phone, email, address, specialization, image_url } = req.body;
    db.prepare(`
      UPDATE doctors 
      SET name = ?, clinic_name = ?, phone = ?, email = ?, address = ?, specialization = ?, image_url = ?
      WHERE id = ?
    `).run(name, clinic_name, phone, email, address, specialization, image_url, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/doctors/:id", (req, res) => {
    // Check if doctor has cases
    const casesCount = db.prepare("SELECT COUNT(*) as count FROM cases WHERE doctor_id = ?").get(req.params.id) as { count: number };
    if (casesCount.count > 0) {
      return res.status(400).json({ error: "Cannot delete doctor with existing cases" });
    }
    db.prepare("DELETE FROM doctors WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/cases", (req, res) => {
    const cases = db.prepare(`
      SELECT cases.*, doctors.name as doctor_name, technicians.name as technician_name 
      FROM cases 
      LEFT JOIN doctors ON cases.doctor_id = doctors.id 
      LEFT JOIN technicians ON cases.technician_id = technicians.id
      ORDER BY cases.created_at DESC
    `).all();
    res.json(cases);
  });

  app.get("/api/cases/:id", (req, res) => {
    const dentalCase = db.prepare(`
      SELECT cases.*, doctors.name as doctor_name, technicians.name as technician_name 
      FROM cases 
      LEFT JOIN doctors ON cases.doctor_id = doctors.id 
      LEFT JOIN technicians ON cases.technician_id = technicians.id
      WHERE cases.id = ?
    `).get(req.params.id);
    res.json(dentalCase);
  });

  app.post("/api/cases", (req, res) => {
    const { 
      doctor_id, technician_id, patient_name, case_type, material, 
      shade, selected_teeth, priority, due_date, receiving_date, 
      delivery_date, cost, notes, image_url, preparation_type 
    } = req.body;
    
    const info = db.prepare(`
      INSERT INTO cases (
        doctor_id, technician_id, patient_name, case_type, material, 
        shade, selected_teeth, priority, due_date, receiving_date, 
        delivery_date, cost, notes, image_url, preparation_type
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      doctor_id, technician_id, patient_name, case_type, material, 
      shade, selected_teeth, priority, due_date, receiving_date, 
      delivery_date, cost, notes, image_url, preparation_type
    );
    
    // Add initial history
    db.prepare("INSERT INTO case_history (case_id, status, comment) VALUES (?, ?, ?)")
      .run(info.lastInsertRowid, 'Pending', 'Case created');
      
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/cases/:id", (req, res) => {
    const { 
      status, technician_id, patient_name, case_type, material, 
      shade, selected_teeth, priority, due_date, receiving_date, 
      delivery_date, cost, notes, image_url, preparation_type, comment 
    } = req.body;
    const id = req.params.id;

    try {
      db.prepare(`
        UPDATE cases 
        SET status = COALESCE(?, status), 
            technician_id = COALESCE(?, technician_id),
            patient_name = COALESCE(?, patient_name),
            case_type = COALESCE(?, case_type),
            material = COALESCE(?, material),
            shade = COALESCE(?, shade),
            selected_teeth = COALESCE(?, selected_teeth),
            priority = COALESCE(?, priority),
            due_date = COALESCE(?, due_date),
            receiving_date = COALESCE(?, receiving_date),
            delivery_date = COALESCE(?, delivery_date),
            cost = COALESCE(?, cost),
            notes = COALESCE(?, notes),
            image_url = COALESCE(?, image_url),
            preparation_type = COALESCE(?, preparation_type)
        WHERE id = ?
      `).run(
        status, technician_id, patient_name, case_type, material, 
        shade, selected_teeth, priority, due_date, receiving_date, 
        delivery_date, cost, notes, image_url, preparation_type,
        id
      );

      if (status) {
        db.prepare("INSERT INTO case_history (case_id, status, comment) VALUES (?, ?, ?)")
          .run(id, status, comment || `Status updated to ${status}`);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update case" });
    }
  });

  app.get("/api/cases/:id/history", (req, res) => {
    const history = db.prepare("SELECT * FROM case_history WHERE case_id = ? ORDER BY updated_at DESC").all(req.params.id);
    res.json(history);
  });

  // Technician Endpoints
  app.put("/api/doctors/:id", (req, res) => {
    const { name, clinic_name, phone, email, address, specialization } = req.body;
    const id = req.params.id;
    try {
      db.prepare(`
        UPDATE doctors 
        SET name = ?, clinic_name = ?, phone = ?, email = ?, address = ?, specialization = ?
        WHERE id = ?
      `).run(name, clinic_name, phone, email, address, specialization, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update doctor" });
    }
  });

  app.get("/api/technicians", (req, res) => {
    const technicians = db.prepare("SELECT * FROM technicians ORDER BY name ASC").all();
    res.json(technicians);
  });

  app.post("/api/technicians", (req, res) => {
    const { name, specialization, phone, status } = req.body;
    const info = db.prepare(
      "INSERT INTO technicians (name, specialization, phone, status) VALUES (?, ?, ?, ?)"
    ).run(name, specialization, phone, status || 'Active');
    res.json({ id: info.lastInsertRowid });
  });

  // Financial Endpoints
  app.get("/api/payments", (req, res) => {
    const payments = db.prepare(`
      SELECT payments.*, doctors.name as doctor_name, invoices.invoice_no
      FROM payments 
      LEFT JOIN doctors ON payments.doctor_id = doctors.id 
      LEFT JOIN invoices ON payments.invoice_id = invoices.id
      ORDER BY payment_date DESC
    `).all();
    res.json(payments);
  });

  app.post("/api/payments", (req, res) => {
    const { doctor_id, invoice_id, amount, payment_method, reference_no, payment_date, notes } = req.body;
    
    try {
      const result = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO payments (doctor_id, invoice_id, amount, payment_method, reference_no, payment_date, notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(doctor_id, invoice_id, amount, payment_method, reference_no, payment_date, notes);

        if (invoice_id) {
          // Update invoice status
          const invoice = db.prepare(`
            SELECT 
              (SELECT SUM(amount) FROM invoice_items WHERE invoice_id = ?) as total_amount,
              (SELECT SUM(amount) FROM payments WHERE invoice_id = ?) as total_paid
          `).get(invoice_id, invoice_id) as any;

          let newStatus = 'Unpaid';
          if (invoice.total_paid >= invoice.total_amount) {
            newStatus = 'Paid';
          } else if (invoice.total_paid > 0) {
            newStatus = 'Partial';
          }

          db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(newStatus, invoice_id);
        }

        return { id: info.lastInsertRowid };
      })();
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  app.get("/api/invoices/:id/payments", (req, res) => {
    const payments = db.prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC").all(req.params.id);
    res.json(payments);
  });

  app.post("/api/invoices/bulk-status", (req, res) => {
    const { ids, status } = req.body;
    const stmt = db.prepare("UPDATE invoices SET status = ? WHERE id = ?");
    const transaction = db.transaction((invoiceIds) => {
      for (const id of invoiceIds) {
        stmt.run(status, id);
      }
    });
    transaction(ids);
    res.json({ success: true });
  });

  app.post("/api/invoices/bulk-remind", (req, res) => {
    const { ids, type } = req.body; // type: 'email' | 'whatsapp'
    const now = new Date().toISOString();
    const stmt = db.prepare("UPDATE invoices SET last_reminder_sent_at = ? WHERE id = ?");
    
    const transaction = db.transaction((invoiceIds) => {
      for (const id of invoiceIds) {
        stmt.run(now, id);
        // In a real app, you would trigger email/whatsapp sending here
        console.log(`Sending ${type} reminder for invoice ${id}`);
      }
    });
    
    transaction(ids);
    res.json({ success: true });
  });

  app.get("/api/expenses", (req, res) => {
    const expenses = db.prepare("SELECT * FROM expenses ORDER BY expense_date DESC").all();
    res.json(expenses);
  });

  app.post("/api/expenses", (req, res) => {
    const { category, amount, description, expense_date } = req.body;
    const info = db.prepare(`
      INSERT INTO expenses (category, amount, description, expense_date) 
      VALUES (?, ?, ?, ?)
    `).run(category, amount, description, expense_date);
    res.json({ id: info.lastInsertRowid });
  });

  // Inventory Endpoints
  app.get("/api/inventory", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory ORDER BY item_name ASC").all();
    res.json(items);
  });

  app.post("/api/inventory", (req, res) => {
    const { item_name, category, quantity, unit, min_stock_level } = req.body;
    const info = db.prepare(`
      INSERT INTO inventory (item_name, category, quantity, unit, min_stock_level) 
      VALUES (?, ?, ?, ?, ?)
    `).run(item_name, category, quantity, unit, min_stock_level);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/inventory/:id", (req, res) => {
    const { quantity } = req.body;
    db.prepare("UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?")
      .run(quantity, req.params.id);
    res.json({ success: true });
  });

  // Enhanced Report Endpoints
  app.get("/api/doctors/:id/payments", (req, res) => {
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM payments WHERE doctor_id = ?";
    const params: any[] = [req.params.id];
    
    if (startDate) {
      query += " AND payment_date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND payment_date <= ?";
      params.push(endDate);
    }
    
    query += " ORDER BY payment_date DESC";
    const payments = db.prepare(query).all(...params);
    res.json(payments);
  });

  app.get("/api/doctors/:id/balance", (req, res) => {
    const totalInvoiced = db.prepare("SELECT SUM(amount) as total FROM invoices WHERE doctor_id = ?").get(req.params.id) as { total: number };
    const totalPaid = db.prepare("SELECT SUM(amount) as total FROM payments WHERE doctor_id = ?").get(req.params.id) as { total: number };
    
    res.json({
      total_invoiced: totalInvoiced.total || 0,
      total_paid: totalPaid.total || 0,
      outstanding_balance: (totalInvoiced.total || 0) - (totalPaid.total || 0)
    });
  });

  app.get("/api/doctors/:id/portal-data", (req, res) => {
    const doctorId = req.params.id;
    const { startDate, endDate } = req.query;

    const cases = db.prepare(`
      SELECT cases.*, doctors.name as doctor_name 
      FROM cases 
      LEFT JOIN doctors ON cases.doctor_id = doctors.id 
      WHERE cases.doctor_id = ?
      ORDER BY created_at DESC
    `).all(doctorId);

    let paymentQuery = "SELECT * FROM payments WHERE doctor_id = ?";
    const paymentParams: any[] = [doctorId];
    if (startDate) {
      paymentQuery += " AND payment_date >= ?";
      paymentParams.push(startDate);
    }
    if (endDate) {
      paymentQuery += " AND payment_date <= ?";
      paymentParams.push(endDate);
    }
    paymentQuery += " ORDER BY payment_date DESC";
    const payments = db.prepare(paymentQuery).all(...paymentParams);

    const totalInvoiced = db.prepare("SELECT SUM(amount) as total FROM invoices WHERE doctor_id = ?").get(doctorId) as { total: number };
    const totalPaid = db.prepare("SELECT SUM(amount) as total FROM payments WHERE doctor_id = ?").get(doctorId) as { total: number };

    res.json({
      cases,
      payments,
      balance: {
        total_invoiced: totalInvoiced.total || 0,
        total_paid: totalPaid.total || 0,
        outstanding_balance: (totalInvoiced.total || 0) - (totalPaid.total || 0)
      }
    });
  });

  app.get("/api/reports/financial-summary", (req, res) => {
    const revenue = db.prepare("SELECT SUM(cost) as total FROM cases WHERE status != 'Returned'").get() as { total: number };
    const payments = db.prepare("SELECT SUM(amount) as total FROM payments").get() as { total: number };
    const expenses = db.prepare("SELECT SUM(amount) as total FROM expenses").get() as { total: number };
    
    res.json({
      total_revenue: revenue.total || 0,
      total_payments: payments.total || 0,
      total_expenses: expenses.total || 0,
      net_profit: (revenue.total || 0) - (expenses.total || 0)
    });
  });

  app.put("/api/invoices/:id/status", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/doctors/:id/cases", (req, res) => {
    const uninvoiced = req.query.uninvoiced === 'true';
    let query = `
      SELECT cases.*, doctors.name as doctor_name 
      FROM cases 
      LEFT JOIN doctors ON cases.doctor_id = doctors.id 
      WHERE cases.doctor_id = ?
    `;
    
    if (uninvoiced) {
      query += ` AND cases.id NOT IN (SELECT case_id FROM invoice_items WHERE case_id IS NOT NULL)`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const cases = db.prepare(query).all(req.params.id);
    res.json(cases);
  });

  app.get("/api/reports/doctor-stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        doctors.id, 
        doctors.name, 
        doctors.clinic_name,
        COUNT(cases.id) as total_cases,
        SUM(CASE WHEN cases.status = 'Completed' OR cases.status = 'Delivered' THEN 1 ELSE 0 END) as completed_cases,
        SUM(CASE WHEN cases.status = 'Pending' OR cases.status = 'In Progress' OR cases.status = 'Trial' THEN 1 ELSE 0 END) as active_cases
      FROM doctors
      LEFT JOIN cases ON doctors.id = cases.doctor_id
      GROUP BY doctors.id
      ORDER BY total_cases DESC
    `).all();
    res.json(stats);
  });

  app.get("/api/reports/doctor-ledger/:id", (req, res) => {
    const doctorId = req.params.id;
    const cases = db.prepare(`
      SELECT 
        COUNT(*) as total_cases,
        SUM(CASE WHEN status = 'Pending' OR status = 'In Progress' THEN 1 ELSE 0 END) as pending_cases,
        SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_cases,
        SUM(cost) as total_bill
      FROM cases 
      WHERE doctor_id = ?
    `).get(doctorId) as any;

    const payments = db.prepare("SELECT SUM(amount) as total FROM payments WHERE doctor_id = ?").get(doctorId) as { total: number };

    res.json({
      ...cases,
      total_paid: payments.total || 0,
      outstanding_balance: (cases.total_bill || 0) - (payments.total || 0)
    });
  });

  app.get("/api/reports/daily-stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM cases
      WHERE created_at >= date('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();
    res.json(stats);
  });

  app.get("/api/reports/type-stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        case_type,
        COUNT(*) as count
      FROM cases
      GROUP BY case_type
      ORDER BY count DESC
    `).all();
    res.json(stats);
  });

  // Settings, Users, Rate List, Shades Endpoints
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, created_at FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/rate-list", (req, res) => {
    const rates = db.prepare("SELECT * FROM rate_list ORDER BY case_type ASC").all();
    res.json(rates);
  });

  app.post("/api/rate-list", (req, res) => {
    const { case_type, material, price } = req.body;
    const info = db.prepare("INSERT INTO rate_list (case_type, material, price) VALUES (?, ?, ?)").run(case_type, material, price);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/rate-list/:id", (req, res) => {
    db.prepare("DELETE FROM rate_list WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/shades", (req, res) => {
    const shades = db.prepare("SELECT * FROM shades ORDER BY name ASC").all();
    res.json(shades);
  });

  app.post("/api/shades", (req, res) => {
    const { name } = req.body;
    try {
      const info = db.prepare("INSERT INTO shades (name) VALUES (?)").run(name);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      res.status(400).json({ error: "Shade already exists" });
    }
  });

  app.delete("/api/shades/:id", (req, res) => {
    db.prepare("DELETE FROM shades WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        stmt.run(key, String(value));
      }
    });
    transaction(settings);
    res.json({ success: true });
  });

  app.get("/api/backup", (req, res) => {
    const tables = ['doctors', 'technicians', 'cases', 'payments', 'expenses', 'inventory', 'case_history', 'users', 'rate_list', 'shades', 'settings', 'invoices', 'invoice_items', 'case_tasks'];
    const backup: any = {};
    for (const table of tables) {
      backup[table] = db.prepare(`SELECT * FROM ${table}`).all();
    }
    res.json(backup);
  });

  app.post("/api/restore", (req, res) => {
    const backup = req.body;
    try {
      const transaction = db.transaction((data) => {
        for (const [table, rows] of Object.entries(data)) {
          db.prepare(`DELETE FROM ${table}`).run();
          if (Array.isArray(rows) && rows.length > 0) {
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(',');
            const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);
            for (const row of rows as any[]) {
              stmt.run(Object.values(row));
            }
          }
        }
      });
      transaction(backup);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Restore failed" });
    }
  });

  // Invoices Endpoints
  app.get("/api/invoices", (req, res) => {
    const { status, doctor_id, startDate, endDate, invoice_no } = req.query;
    let query = `
      SELECT 
        invoices.*, 
        doctors.name as doctor_name,
        doctors.email as doctor_email,
        doctors.phone as doctor_phone,
        (SELECT SUM(amount) FROM invoice_items WHERE invoice_id = invoices.id) as calculated_amount,
        (SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id) as total_paid
      FROM invoices 
      LEFT JOIN doctors ON invoices.doctor_id = doctors.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += " AND invoices.status = ?";
      params.push(status);
    }
    if (doctor_id && doctor_id !== 'All') {
      query += " AND invoices.doctor_id = ?";
      params.push(doctor_id);
    }
    if (startDate) {
      query += " AND DATE(invoices.created_at) >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND DATE(invoices.created_at) <= ?";
      params.push(endDate);
    }
    if (invoice_no) {
      query += " AND invoices.invoice_no LIKE ?";
      params.push(`%${invoice_no}%`);
    }

    query += " ORDER BY invoices.created_at DESC";
    
    const invoices = db.prepare(query).all(...params);
    // Use calculated_amount if available, otherwise fallback to amount column
    const processedInvoices = invoices.map((inv: any) => ({
      ...inv,
      amount: inv.calculated_amount !== null ? inv.calculated_amount : inv.amount,
      total_paid: inv.total_paid || 0
    }));
    res.json(processedInvoices);
  });

  app.get("/api/invoices/:id", (req, res) => {
    const invoice = db.prepare(`
      SELECT 
        invoices.*, 
        doctors.name as doctor_name, 
        doctors.clinic_name, 
        doctors.address, 
        doctors.phone,
        (SELECT SUM(amount) FROM invoice_items WHERE invoice_id = invoices.id) as calculated_amount
      FROM invoices 
      LEFT JOIN doctors ON invoices.doctor_id = doctors.id 
      WHERE invoices.id = ?
    `).get(req.params.id) as any;
    
    if (invoice) {
      const items = db.prepare(`
        SELECT invoice_items.*, cases.patient_name, cases.case_type
        FROM invoice_items 
        LEFT JOIN cases ON invoice_items.case_id = cases.id
        WHERE invoice_id = ?
      `).all(req.params.id);
      
      res.json({ 
        ...invoice, 
        amount: invoice.calculated_amount !== null ? invoice.calculated_amount : invoice.amount,
        items 
      });
    } else {
      res.status(404).json({ error: "Invoice not found" });
    }
  });

  app.post("/api/invoices", (req, res) => {
    const { doctor_id, due_date, items } = req.body;
    
    try {
      const result = db.transaction(() => {
        // Get next invoice number
        const nextNo = (db.prepare("SELECT COALESCE(MAX(invoice_no), 0) + 1 as nextNo FROM invoices").get() as any).nextNo;
        
        // Calculate total amount from items
        const amount = items.reduce((acc: number, item: any) => acc + (item.amount || 0), 0);

        const info = db.prepare(`
          INSERT INTO invoices (doctor_id, invoice_no, amount, due_date) 
          VALUES (?, ?, ?, ?)
        `).run(doctor_id, nextNo, amount, due_date);
        
        const invoice_id = info.lastInsertRowid;
        
        const stmt = db.prepare(`
          INSERT INTO invoice_items (invoice_id, case_id, description, amount) 
          VALUES (?, ?, ?, ?)
        `);
        
        for (const item of items) {
          stmt.run(invoice_id, item.case_id, item.description, item.amount);
        }
        
        return { id: invoice_id, invoice_no: nextNo };
      })();
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Case Tasks Endpoints
  app.get("/api/cases/:id/tasks", (req, res) => {
    const tasks = db.prepare(`
      SELECT case_tasks.*, technicians.name as technician_name 
      FROM case_tasks 
      LEFT JOIN technicians ON case_tasks.technician_id = technicians.id 
      WHERE case_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);
    res.json(tasks);
  });

  app.post("/api/cases/:id/tasks", (req, res) => {
    const { task_name, technician_id } = req.body;
    const info = db.prepare(`
      INSERT INTO case_tasks (case_id, task_name, technician_id) 
      VALUES (?, ?, ?)
    `).run(req.params.id, task_name, technician_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/tasks/:id", (req, res) => {
    const { status } = req.body;
    const completed_at = status === 'Completed' ? new Date().toISOString() : null;
    db.prepare("UPDATE case_tasks SET status = ?, completed_at = ? WHERE id = ?")
      .run(status, completed_at, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
