import { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v5.0 — OptiManager Pro Max | Enterprise Ophthalmology ERP Engine
// ════════════════════════════════════════════════════════════════════════
const APP_VER = "5.0-ERP";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const DEPARTMENTS = [
  "OP Registration", "K-Sheet Room", "Optometrist-1", "Optometrist-2",
  "Ophthalmologist-1", "Ophthalmologist-2", "Counseling Room",
  "Opticals Dept", "Pharmacy Dept", "Lens Stock Control", "Frame Stock Control",
  "Surgery Department", "MD/Admin Dashboard"
];

const ROLES = ["owner", "staff"];

// Default visible field schemas for fine-grained governance configuration
const DEFAULT_FIELD_VISIBILITY = {
  opRegistration: ["mrNo", "patientId", "name", "phone", "town", "gender", "age", "referral", "fee", "payMode"],
  optometrist: ["visualAcuity", "retinoscopy", "arReading", "acceptance", "iop", "bp", "sugar", "dilatation"],
  ophthalmologist: ["eyelids", "conjunctiva", "cornea", "anteriorChamber", "iris", "pupil", "lens", "fundus", "movements", "diagnosis", "prescription"],
  opticals: ["frameSelected", "lensSelected", "totalAmount", "advance", "balance", "deliveryDate"],
  inventory: ["sku", "name", "category", "brand", "qty", "reorder", "cost", "price", "expiryDate"]
};

// Default system master accounts mapped directly to dedicated clinical checkpoints
const DEFAULT_ACCOUNTS = [
  { id: "owner", name: "MD Admin Account", role: "owner", branch: "All", department: "MD/Admin Dashboard", password: "owner123", perms: {} },
  { id: "op_staff", name: "Ravi (Front Desk)", role: "staff", branch: "JPT Branch", department: "OP Registration", password: "op123", perms: { opRegistration: { view: true, add: true, edit: true } } },
  { id: "optom_staff", name: "Dr. Anjali (Optometrist)", role: "staff", branch: "JPT Branch", department: "Optometrist-1", password: "opt123", perms: { optometrist: { view: true, add: true, edit: true } } },
  { id: "doctor_staff", name: "Dr. Vikram (Surgeon)", role: "staff", branch: "JPT Branch", department: "Ophthalmologist-1", password: "doc123", perms: { ophthalmologist: { view: true, add: true, edit: true } } },
  { id: "optical_staff", name: "Kiran (Opticals Manager)", role: "staff", branch: "JPT Branch", department: "Opticals Dept", password: "optdept123", perms: { opticals: { view: true, add: true, edit: true } } }
];

// Seed baseline operational database structures
const INITIAL_MASTER_DATA = {
  patients: [
    { mrNo: "MR-1001", patientId: "PID-92831", name: "Ramesh Kumar", phone: "9848022338", town: "Kakinada", gender: "Male", age: 54, referral: "Camp 02", branch: "JPT Branch", fee: 250, payMode: "Cash", txRef: "TXN-9921", remarks: "Complains of progressive distance blurring", patientType: "New Patient", timestamp: "15/06/2026 09:00:00", date: "2026-06-15", time: "09:00", visitCount: 1, currentStage: "Optometrist Room" }
  ],
  clinicalRecords: [
    { id: "CR-1001", mrNo: "MR-1001", patientId: "PID-92831", chiefComplaint: "Diminished vision in both eyes since 6 months, worse in right eye.", medicalHistory: "DM (Controlled), HTN (Controlled)", htn: true, dm: true, cad: false, asthma: false, allergies: false, visionOD: "6/18", visionOS: "6/12", retinoscopyOD: "-1.50 DS", retinoscopyOS: "-1.00 DS", arSpherOD: "-1.75", arCylOD: "-0.50", arAxisOD: "90", arSpherOS: "-1.25", arCylOS: "-0.25", arAxisOS: "85", accSpherOD: "-1.50", accCylOD: "-0.50", accAxisOD: "90", accSpherOS: "-1.00", accCylOS: "", accAxisOS: "", nearOD: "N6", nearOS: "N6", addVal: "+2.00", iopOD: "16", iopOS: "15", bp: "130/80", sugar: "142 mg/dl", dilatation: "Dilated", eyelids: "Normal", conjunctiva: "Clear", cornea: "Clear", anteriorChamber: "Deep & Quiet", iris: "Normal Pattern", pupil: "Round, Reactive", lens: "NS Grade II (OD), NS Grade I (OS)", fundus: "Mild Non-Proliferative Diabetic Retinopathy (NPDR)", ocularMovements: "Full & Free", diagnosis: "Immature Senile Cataract OD > OS, Mild NPDR", advice: "Right Eye Cataract Phacoemulsification with MICS surgery recommended.", prescription: "Tab Vitamin C once daily, Lubricating eye drops 1 drop 4 times daily", treatmentPlan: "Scheduled for Counseling & Intraocular Lens (IOL) selection.", graphData: null, timestamp: "15/06/2026 10:15:00" }
  ],
  inventory: [
    { id: "inv-1", sku: "LNS-SV-A1", name: "Single Vision Anti-Reflective", category: "Lenses", brand: "Essilor", qty: 45, reorder: 10, cost: 450, price: 1200, location: "Drawer A-1", lensPower: "-1.50", lensType: "Single Vision", boxNo: "B-02", expiryDate: "" },
    { id: "inv-2", sku: "FRM-RB-G2", name: "Ray-Ban Aviator Matte Grey", category: "Frames", brand: "Ray-Ban", qty: 4, reorder: 5, cost: 1800, price: 4500, location: "Display Rack 1", model: "RB-3025", boxNo: "", expiryDate: "" },
    { id: "inv-3", sku: "MED-MOX-01", name: "Moxifloxacin Eye Drops", category: "Medicines", brand: "Cipla", qty: 12, reorder: 15, cost: 45, price: 110, batchNo: "B-MX29", expiryDate: "2027-04-12" },
    { id: "inv-4", sku: "CNS-IOL-05", name: "Hydrophobic Foldable IOL", category: "Surgical Consumables", brand: "Alcon", qty: 25, reorder: 8, cost: 3200, price: 8500, boxNo: "OT-Box 4", expiryDate: "2029-10-01" }
  ],
  opticalsSales: [
    { id: "OPT-8273", mrNo: "MR-1001", patientId: "PID-92831", name: "Ramesh Kumar", phone: "9848022338", address: "Kakinada", acceptedPower: "OD: -1.50/-0.50x90, OS: -1.00 DS, Add: +2.00", frameSelected: "Ray-Ban Aviator Matte Grey", lensSelected: "Single Vision Anti-Reflective", totalAmount: 5700, advance: 1500, payMethod: "UPI", txId: "TXN-OPT-881", balance: 4200, deliveryDate: "2026-06-18", representative: "Kiran", status: "Not Ready", date: "2026-06-15" }
  ],
  counseling: [
    { id: "CNSL-01", mrNo: "MR-1001", treatmentRecommended: "Phacoemulsification with Hydrophobic IOL", opticalCounseling: "Progressive Lenses advised", costEstimate: 28000, patientDecision: "Agreed", remarks: "Patient chose premium hydrophobic lens option. Scheduled surgery for tomorrow morning.", nextFollowUp: "2026-06-22", surgeryDate: "2026-06-16" }
  ],
  surgeries: [
    { id: "SURG-4401", mrNo: "MR-1001", patientId: "PID-92831", name: "Ramesh Kumar", age: 54, gender: "Male", phone: "9848022338", surgeryType: "Phacoemulsification + IOL (OD)", surgeon: "Dr. Vikram", scheduledDate: "2026-06-16", status: "Scheduled", otNotes: "Prepare for premium foldable IOL implantation.", followUpDate: "2026-06-17", remarks: "Ensure cardiac fitness clearance is attached." }
  ],
  reminders: [
    { id: "rem-1", mrNo: "MR-1001", type: "Surgery Reminder", date: "2026-06-16", channel: "WhatsApp", status: "Pending", text: "Reminder: Your cataract surgery is scheduled for tomorrow at 08:00 AM." }
  ],
  tasks: [
    { id: "tsk-1", title: "Sterilize OT Equipment (Phaco Set)", priority: "High", deadline: "2026-06-15", assignedTo: "doctor_staff", status: "In Progress", createdBy: "owner" }
  ]
};

// ════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION INTERACTION SCHEMAS (SUPABASE SYNC INTERFACES)
// ════════════════════════════════════════════════════════════════════════
let _sb = null;
function initSB(url, key) {
  if (!url || !key) { _sb = null; return false; }
  _sb = { url: url.replace(/\/$/, ""), key };
  return true;
}
const SB_TABLES = {
  patients: "hms_patients",
  clinicalRecords: "hms_clinical_records",
  inventory: "hms_inventory",
  opticalsSales: "hms_opticals_sales",
  counseling: "hms_counseling",
  surgeries: "hms_surgeries",
  reminders: "hms_reminders",
  tasks: "hms_tasks",
  accounts: "hms_accounts",
  audit_log: "hms_audit_log"
};

function sbHeaders() {
  return { "Content-Type": "application/json", "apikey": _sb.key, "Authorization": `Bearer ${_sb.key}` };
}

async function sbGet(table) {
  if (!_sb) return null;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}?select=*`, { headers: sbHeaders() });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function sbUpsertOne(table, row) {
  if (!_sb) return false;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
      method: "POST",
      headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
    return r.ok;
  } catch { return false; }
}

const LS = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  sess: (v) => { try { if (v) sessionStorage.setItem("opti_hms_sess", JSON.stringify(v)); else sessionStorage.removeItem("opti_hms_sess"); } catch {} },
  getSess: () => { try { return JSON.parse(sessionStorage.getItem("opti_hms_sess")); } catch { return null; } },
};

const ts = () => `${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}`;
const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;
const uid = () => "ID" + Math.random().toString(36).substring(2, 7).toUpperCase();

// ════════════════════════════════════════════════════════════════════════
// CORE ROOT COMPONENT ENTRYPOINT
// ════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(() => LS.getSess());
  const [accounts, setAccounts] = useState(() => LS.get("hms_accounts", DEFAULT_ACCOUNTS));
  const [db, setDb] = useState(() => LS.get("hms_master_db", INITIAL_MASTER_DATA));
  const [auditLog, setAuditLog] = useState(() => LS.get("hms_audit", []));
  const [fieldVis, setFieldVis] = useState(() => LS.get("hms_fields", DEFAULT_FIELD_VISIBILITY));
  const [sbCreds, setSbCreds] = useState(() => LS.get("hms_sb_creds", { url: "", key: "" }));
  const [sbStatus, setSbStatus] = useState("idle");
  const [view, setView] = useState("dashboard");
  const [branding, setBranding] = useState(() => LS.get("hms_branding", { name: "OptiManager HMS Pro", logo: "👁", theme: "#1a1714" }));

  useEffect(() => { LS.set("hms_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("hms_master_db", db); }, [db]);
  useEffect(() => { LS.set("hms_audit", auditLog); }, [auditLog]);
  useEffect(() => { LS.set("hms_fields", fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("hms_sb_creds", sbCreds); }, [sbCreds]);
  useEffect(() => { LS.set("hms_branding", branding); }, [branding]);

  const audit = useCallback((action, detail = {}) => {
    if (!session) return;
    const log = { id: uid(), action, detail, userId: session.id, userName: session.name, dept: session.department, at: ts() };
    setAuditLog(a => [log, ...a].slice(0, 500));
  }, [session]);

  const mutate = useCallback((key, updatedArray, mutatedRecord = null) => {
    setDb(prev => ({ ...prev, [key]: updatedArray }));
    if (_sb && mutatedRecord) {
      sbUpsertOne(key, mutatedRecord).catch(() => {});
    }
  }, []);

  const login = useCallback((acc, branchOverride) => {
    const s = { ...acc, branch: branchOverride || acc.branch, loginTime: ts() };
    LS.sess(s);
    setSession(s);
    setView("dashboard");
    const log = { id: uid(), action: "USER_LOGIN", detail: { department: acc.department }, userId: acc.id, userName: acc.name, dept: acc.department, at: ts() };
    setAuditLog(a => [log, ...a]);
  }, []);

  const logout = useCallback(() => {
    audit("USER_LOGOUT");
    LS.sess(null);
    setSession(null);
  }, [audit]);

  if (!session) return <LoginScreen accounts={accounts} onLogin={login} branding={branding} />;

  return (
    <DashboardShell session={session} onLogout={logout} view={view} setView={setView} branding={branding}>
      {view === "dashboard" && <AnalyticsDashboard db={db} auditLog={auditLog} session={session} />}
      {view === "opRegistration" && <OpRegistrationModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "kSheet" && <KSheetModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "optometrist" && <OptometristModule db={db} mutate={mutate} session={session} audit={audit} fieldVis={fieldVis.optometrist} />}
      {view === "ophthalmologist" && <OphthalmologistModule db={db} mutate={mutate} session={session} audit={audit} fieldVis={fieldVis.ophthalmologist} />}
      {view === "counseling" && <CounselingModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "opticals" && <OpticalsModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "inventory" && <InventoryModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "surgery" && <SurgeryModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "reminders" && <ReminderSystem db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "tasks" && <TaskManagement db={db} mutate={mutate} session={session} audit={audit} accounts={accounts} />}
      {view === "governance" && session.role === "owner" && (
        <MDGovernanceSection
          accounts={accounts} setAccounts={setAccounts}
          fieldVis={fieldVis} setFieldVis={setFieldVis}
          branding={branding} setBranding={setBranding}
          auditLog={auditLog}
        />
      )}
    </DashboardShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MASTER WRAPPER/NAVIGATION SHELL FRAMEWORK
// ════════════════════════════════════════════════════════════════════════
function DashboardShell({ session, onLogout, view, setView, branding, children }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard Hub", icon: "📊", show: true },
    { id: "opRegistration", label: "OP Registration", icon: "📝", show: session.role === "owner" || session.department === "OP Registration" },
    { id: "kSheet", label: "K-Sheet Records", icon: "📋", show: session.role === "owner" || ["K-Sheet Room", "Optometrist-1", "Optometrist-2"].includes(session.department) },
    { id: "optometrist", label: "Optometrist Exam", icon: "👁️", show: session.role === "owner" || session.department.startsWith("Optometrist") },
    { id: "ophthalmologist", label: "Ophthalmologist Pro", icon: "🩺", show: session.role === "owner" || session.department.startsWith("Ophthalmologist") },
    { id: "counseling", label: "Counseling Suite", icon: "🤝", show: session.role === "owner" || session.department === "Counseling Room" },
    { id: "opticals", label: "Opticals & Billing", icon: "👓", show: session.role === "owner" || session.department === "Opticals Dept" },
    { id: "inventory", label: "HMS Central Inventory", icon: "📦", show: session.role === "owner" || ["Lens Stock Control", "Frame Stock Control", "Pharmacy Dept"].includes(session.department) },
    { id: "surgery", label: "Surgery & OT Control", icon: "✂️", show: session.role === "owner" || session.department === "Surgery Department" },
    { id: "reminders", label: "Reminders & Alerts", icon: "🔔", show: true },
    { id: "tasks", label: "Operational Tasks", icon: "✅", show: true },
    { id: "governance", label: "MD Control Center", icon: "🛡️", show: session.role === "owner" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa", fontFamily: "system-ui, sans-serif" }}>
      <style>{SHELL_CSS}</style>
      <aside style={{ width: 260, background: branding.theme, color: "#fff", display: "flex", flexDirection: "column", padding: "16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.15)", marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>{branding.logo}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{branding.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>v{APP_VER} ERP Platform</div>
          </div>
        </div>

        <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{session.name}</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{session.department}</div>
          <div style={{ fontSize: 10, color: "#a3cfbb", marginTop: 4 }}>📍 {session.branch}</div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {menuItems.filter(m => m.show).map(m => (
            <button key={m.id} className={`sidebar-btn ${view === m.id ? "active" : ""}`} onClick={() => setView(m.id)}>
              <span style={{ marginRight: 8 }}>{m.icon}</span> {m.label}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={onLogout} style={{ marginTop: "auto" }}>🔒 Terminate Session</button>
      </aside>
      <main style={{ flex: 1, padding: 24, overflowY: "auto", maxWidth: "calc(100vw - 260px)" }}>{children}</main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL ENGINE COMPONENT FOR SYSTEM LOGIN
// ════════════════════════════════════════════════════════════════════════
function LoginScreen({ accounts, onLogin, branding }) {
  const [uidStr, setUidStr] = useState("");
  const [pwd, setPwd] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [error, setError] = useState("");

  const executeLogin = () => {
    const matched = accounts.find(a => a.id === uidStr.trim() && a.password === pwd);
    if (!matched) {
      setError("Invalid Access System ID or Encryption Key Pathway.");
      return;
    }
    onLogin(matched, matched.role === "owner" ? "All Branches" : branch);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{branding.logo}</div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1f2937" }}>{branding.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Terminal Node Gateway Authentication</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>Operational Branch Base</label>
            <select value={branch} onChange={e => setBranch(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>Operator System ID ID</label>
            <input type="text" value={uidStr} onChange={e => setUidStr(e.target.value)} placeholder="e.g. op_staff" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>Security Passkey Credentials</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} onKeyDown={e => e.key === "Enter" && executeLogin()} />
          </div>
          {error && <div style={{ color: "#dc2626", fontSize: 12, background: "#fee2e2", padding: "8px 12px", borderRadius: 6 }}>{error}</div>}
          <button onClick={executeLogin} style={{ background: branding.theme, color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 600, cursor: "pointer", width: "100%" }}>Verify Node Credentials</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ANALYTICS & EXECUTIVE INSIGHTS MODULE
// ════════════════════════════════════════════════════════════════════════
function AnalyticsDashboard({ db, auditLog, session }) {
  const filterByBranch = (arr) => session.role === "owner" ? arr : arr.filter(x => x.branch === session.branch);

  const activePatients = filterByBranch(db.patients);
  const matchedSales = filterByBranch(db.opticalsSales);
  const activeSurg = filterByBranch(db.surgeries);

  const opCount = activePatients.length;
  const totalRev = matchedSales.reduce((acc, current) => acc + current.totalAmount, 0);
  const outstandingBal = matchedSales.reduce((acc, current) => acc + current.balance, 0);
  const pipelineSurg = activeSurg.filter(s => s.status === "Scheduled").length;
  const lowStockCount = db.inventory.filter(i => i.qty <= i.reorder).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>Operational Command Center</h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Real-time core hospital dashboard visualization matrix.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="analytics-card">
          <div className="title">Today's Active Patient Intake</div>
          <div className="value">{opCount} Patients</div>
        </div>
        <div className="analytics-card" style={{ borderLeft: "4px solid #16a34a" }}>
          <div className="title">Total Opticals Volume Revenue</div>
          <div className="value">{currency(totalRev)}</div>
        </div>
        <div className="analytics-card" style={{ borderLeft: "4px solid #dc2626" }}>
          <div className="title">Outstanding Patient Balances</div>
          <div className="value">{currency(outstandingBal)}</div>
        </div>
        <div className="analytics-card" style={{ borderLeft: "4px solid #9333ea" }}>
          <div className="title">Pending Scheduled Surgeries</div>
          <div className="value">{pipelineSurg} Cases</div>
        </div>
        <div className="analytics-card" style={{ borderLeft: "4px solid #ea580c" }}>
          <div className="title">Critical Low Stock SKU Warnings</div>
          <div className="value">{lowStockCount} Alerts</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 16px" }}>Clinical Patient Processing Queue Trace</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f3f4f6" }}>
                <th style={{ padding: 10 }}>MR Number</th>
                <th style={{ padding: 10 }}>Patient Identity</th>
                <th style={{ padding: 10 }}>Branch Station</th>
                <th style={{ padding: 10 }}>Current Triage Assignment Location</th>
              </tr>
            </thead>
            <tbody>
              {activePatients.slice(-5).reverse().map(p => (
                <tr key={p.mrNo} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 10, fontWeight: 700 }}>{p.mrNo}</td>
                  <td style={{ padding: 10 }}>{p.name} ({p.age}/{p.gender})</td>
                  <td style={{ padding: 10 }}>{p.branch}</td>
                  <td style={{ padding: 10 }}><span style={{ padding: "2px 8px", background: "#dbeafe", color: "#1e40af", borderRadius: 12, fontSize: 11 }}>{p.currentStage || "OP Registration"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 16px" }}>Security System Audit Pipeline Stream</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto" }}>
            {auditLog.slice(0, 10).map(l => (
              <div key={l.id} style={{ fontSize: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                  <span>{l.action}</span>
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>{l.at.split(" ")[1]}</span>
                </div>
                <div style={{ color: "#4b5563" }}>User: {l.userName} ({l.dept})</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// OP REGISTRATION MODULE (WITH ADVANCED MULTI-FIELD DUPLICATE SAFEGUARDS)
// ════════════════════════════════════════════════════════════════════════
function OpRegistrationModule({ db, mutate, session, audit }) {
  const [formData, setFormData] = useState({
    name: "", phone: "", address: "", gender: "Male", age: "", referral: "", fee: "250", payMode: "Cash", txRef: "", remarks: "", patientType: "New Patient"
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRegistrationSubmit = (bypassDuplicateCheck = false) => {
    if (!formData.name || !formData.phone || !formData.age) {
      alert("Error: Missing mandatory identity metrics parameters.");
      return;
    }

    if (!bypassDuplicateCheck) {
      const matchFound = db.patients.find(p => 
        p.phone === formData.phone || 
        (p.name.toLowerCase() === formData.name.toLowerCase() && Number(p.age) === Number(formData.age))
      );
      if (matchFound) {
        setDuplicateWarning(matchFound);
        return;
      }
    }

    const calculatedMrNo = `MR-${1000 + db.patients.length + 1}`;
    const calculatedPid = `PID-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPatient = {
      ...formData,
      mrNo: calculatedMrNo,
      patientId: calculatedPid,
      branch: session.branch === "All" ? "JPT Branch" : session.branch,
      timestamp: ts(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      visitCount: 1,
      currentStage: "K-Sheet Room"
    };

    const nextPatientCollection = [...db.patients, newPatient];
    mutate("patients", nextPatientCollection, newPatient);
    audit("PATIENT_REGISTRATION_RECORDED", { mrNo: calculatedMrNo, name: formData.name });
    alert(`Success: Patient Registered under Master ID Record ${calculatedMrNo}`);
    setFormData({ name: "", phone: "", address: "", gender: "Male", age: "", referral: "", fee: "250", payMode: "Cash", txRef: "", remarks: "", patientType: "New Patient" });
    setDuplicateWarning(null);
  };

  const processExistingPatientRecurrence = (matchedRecord) => {
    const nextPatients = db.patients.map(p => {
      if (p.mrNo === matchedRecord.mrNo) {
        return { ...p, visitCount: (p.visitCount || 1) + 1, currentStage: "K-Sheet Room", timestamp: ts() };
      }
      return p;
    });
    mutate("patients", nextPatients, { ...matchedRecord, visitCount: (matchedRecord.visitCount || 1) + 1, currentStage: "K-Sheet Room", timestamp: ts() });
    audit("PATIENT_REVISIT_LOGGED", { mrNo: matchedRecord.mrNo });
    alert(`Revisit Registered: Tracking loop incremented for ${matchedRecord.mrNo}`);
    setDuplicateWarning(null);
  };

  const filteredPatients = db.patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery) || p.mrNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: "0 0 16px" }}>OP Demographic Patient Onboarding Registration</h2>
        
        {duplicateWarning && (
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <h4 style={{ color: "#ea580c", margin: "0 0 8px" }}>⚠️ CRITICAL DUPLICATE INTEGRITY ALERT: MATCHING RECORD DETECTED</h4>
            <p style={{ margin: "0 0 12px", fontSize: 13 }}>An existing database match correlates with identity parameter targets: <strong>{duplicateWarning.name} ({duplicateWarning.mrNo})</strong>, Mobile: {duplicateWarning.phone}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => processExistingPatientRecurrence(duplicateWarning)} style={{ background: "#ea580c", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}>Log Revisit & Track Under Same MR No</button>
              <button onClick={() => handleRegistrationSubmit(true)} style={{ background: "#4b5563", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}>Bypass Check & Force Independent Entry</button>
              <button onClick={() => setDuplicateWarning(null)} style={{ background: "#e5e7eb", color: "#1f2937", padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel Process</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <div><label style={LBL}>Patient Full Legal Name *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={INP} /></div>
          <div><label style={LBL}>Contact Mobile Sequence *</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={INP} /></div>
          <div><label style={LBL}>Demographic Age Check *</label><input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} style={INP} /></div>
          <div><label style={LBL}>Biological Gender</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={INP}><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div><label style={LBL}>Geographic Address / Town</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={INP} /></div>
          <div><label style={LBL}>Referral Conduit Pipeline</label><input type="text" value={formData.referral} onChange={e => setFormData({...formData, referral: e.target.value})} placeholder="e.g. Free Camp, Eye Screening Drive" style={INP} /></div>
          <div><label style={LBL}>Collection Fee Assessed</label><input type="number" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} style={INP} /></div>
          <div><label style={LBL}>Assessed Payment Gateway Modality</label><select value={formData.payMode} onChange={e => setFormData({...formData, payMode: e.target.value})} style={INP}><option>Cash</option><option>UPI Payment Network</option><option>Corporate Waiver / Free</option></select></div>
          <div><label style={LBL}>Transaction Reference Identification Trace</label><input type="text" value={formData.txRef} onChange={e => setFormData({...formData, txRef: e.target.value})} style={INP} /></div>
        </div>
        <button onClick={() => handleRegistrationSubmit(false)} style={{ marginTop: 16, background: "#111827", color: "#fff", padding: "10px 20px", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Commit Complete Patient Registration Record</button>
      </div>

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Registered Core Intake Patient Roster</h3>
          <input type="text" placeholder="Filter roster index via search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#f3f4f6" }}>
              <th style={{ padding: 10 }}>Master MR No</th>
              <th style={{ padding: 10 }}>System Patient ID</th>
              <th style={{ padding: 10 }}>Demographic Roster Metrics</th>
              <th style={{ padding: 10 }}>Contact Link</th>
              <th style={{ padding: 10 }}>Visit Metric Iteration</th>
              <th style={{ padding: 10 }}>Current Triage Hub Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(p => (
              <tr key={p.mrNo} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 10, fontWeight: 700, color: "#1e40af" }}>{p.mrNo}</td>
                <td style={{ padding: 10, fontFamily: "monospace" }}>{p.patientId}</td>
                <td style={{ padding: 10 }}>{p.name} ({p.age}/{p.gender})</td>
                <td style={{ padding: 10 }}>{p.phone}</td>
                <td style={{ padding: 10 }}><span style={{ padding: "2px 8px", background: "#f3f4f6", borderRadius: 10, fontWeight: 600 }}>{p.visitCount || 1} Visits</span></td>
                <td style={{ padding: 10 }}><span style={{ padding: "4px 8px", background: "#e0f2fe", color: "#0369a1", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{p.currentStage}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL TRIAGE K-SHEET REGISTRATION MODULE
// ════════════════════════════════════════════════════════════════════════
function KSheetModule({ db, mutate, session, audit }) {
  const [selectedMr, setSelectedMr] = useState("");
  const [kData, setKData] = useState({ chiefComplaint: "", medicalHistory: "", notes: "" });

  const activeTargetPatient = db.patients.find(p => p.mrNo === selectedMr);

  const saveKSheetTriage = () => {
    if (!selectedMr) return;
    const existingClinicalIndex = db.clinicalRecords.findIndex(c => c.mrNo === selectedMr);
    const newRecordPayload = {
      id: `CR-${1000 + db.clinicalRecords.length + 1}`,
      mrNo: selectedMr,
      patientId: activeTargetPatient.patientId,
      chiefComplaint: kData.chiefComplaint,
      pastMedicalHistory: kData.medicalHistory,
      timestamp: ts()
    };

    let updatedClinicalCollection = [...db.clinicalRecords];
    if (existingClinicalIndex > -1) {
      updatedClinicalCollection[existingClinicalIndex] = { ...updatedClinicalCollection[existingClinicalIndex], ...newRecordPayload };
    } else {
      updatedClinicalCollection.push(newRecordPayload);
    }

    // Advance triage progression stage mapping to Optometrist Module
    const adjustedPatients = db.patients.map(p => p.mrNo === selectedMr ? { ...p, currentStage: "Optometrist Room" } : p);
    
    mutate("clinicalRecords", updatedClinicalCollection, newRecordPayload);
    mutate("patients", adjustedPatients, { ...activeTargetPatient, currentStage: "Optometrist Room" });
    
    audit("K_SHEET_TRIAGE_SAVED", { mrNo: selectedMr });
    alert("K-Sheet Triage Matrix successfully recorded; patient shifted to Optometrist workflow.");
    setSelectedMr("");
    setKData({ chiefComplaint: "", medicalHistory: "", notes: "" });
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <h2 style={{ margin: "0 0 16px" }}>Digital Clinical Triage K-Sheet Execution Node</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={LBL}>Select Target Processing Patient (Awaiting Triage)</label>
        <select value={selectedMr} onChange={e => {
          setSelectedMr(e.target.value);
          const historicalClinical = db.clinicalRecords.find(c => c.mrNo === e.target.value);
          if (historicalClinical) {
            setKData({ chiefComplaint: historicalClinical.chiefComplaint || "", medicalHistory: historicalClinical.pastMedicalHistory || "", notes: "" });
          }
        }} style={INP}>
          <option value="">-- Click to query patient triage vector pool --</option>
          {db.patients.filter(p => p.currentStage === "K-Sheet Room").map(p => (
            <option key={p.mrNo} value={p.mrNo}>{p.mrNo} - {p.name} ({p.phone})</option>
          ))}
        </select>
      </div>

      {activeTargetPatient && (
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 16, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#f9fafb", padding: 12, borderRadius: 8 }}>
            <div><strong>MR Number:</strong> {activeTargetPatient.mrNo}</div>
            <div><strong>Patient Identity:</strong> {activeTargetPatient.name}</div>
            <div><strong>Age/Gender:</strong> {activeTargetPatient.age} Yrs / {activeTargetPatient.gender}</div>
            <div><strong>Visit Iteration:</strong> Loop #{activeTargetPatient.visitCount || 1}</div>
          </div>

          <div>
            <label style={LBL}>Patient Chief Complaints Manifestation Description</label>
            <textarea value={kData.chiefComplaint} onChange={e => setKData({...kData, chiefComplaint: e.target.value})} rows={3} style={INP} placeholder="Document physical ophthalmic symptomatology trajectory..." />
          </div>

          <div>
            <label style={LBL}>Past Systematic Illness / Medical History Parameters</label>
            <textarea value={kData.medicalHistory} onChange={e => setKData({...kData, medicalHistory: e.target.value})} rows={2} style={INP} placeholder="Hypertension, Metabolic Dysregulation, Myocardial Infarction indicators..." />
          </div>

          <button onClick={saveKSheetTriage} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Commit Triage Routing Configuration</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL TRIAGE OPTOMETRIST REFRACTION ENGINE
// ════════════════════════════════════════════════════════════════════════
function OptometristModule({ db, mutate, session, audit, fieldVis }) {
  const [selectedMr, setSelectedMr] = useState("");
  const [optomData, setOptomData] = useState({
    htn: false, dm: false, cad: false, asthma: false, allergies: false, visionOD: "", visionOS: "", retinoscopyOD: "", retinoscopyOS: "",
    arSpherOD: "", arCylOD: "", arAxisOD: "", arSpherOS: "", arCylOS: "", arAxisOS: "", accSpherOD: "", accCylOD: "", accAxisOD: "",
    accSpherOS: "", accCylOS: "", accAxisOS: "", nearOD: "", nearOS: "", addVal: "", iopOD: "", iopOS: "", bp: "", sugar: "", dilatation: "Not Dilated"
  });

  const activePatient = db.patients.find(p => p.mrNo === selectedMr);

  const saveOptometristMetrics = () => {
    if (!selectedMr) return;
    const records = [...db.clinicalRecords];
    const idx = records.findIndex(c => c.mrNo === selectedMr);
    const updatedRecord = {
      ...(idx > -1 ? records[idx] : {}),
      ...optomData,
      mrNo: selectedMr,
      patientId: activePatient.patientId,
      timestamp: ts()
    };

    if (idx > -1) records[idx] = updatedRecord;
    else records.push(updatedRecord);

    const changedPatients = db.patients.map(p => p.mrNo === selectedMr ? { ...p, currentStage: "Ophthalmologist Consultation" } : p);
    
    mutate("clinicalRecords", records, updatedRecord);
    mutate("patients", changedPatients, { ...activePatient, currentStage: "Ophthalmologist Consultation" });
    
    audit("OPTOMETRIST_REFRACTION_RECORDED", { mrNo: selectedMr });
    alert("Refraction matrix synced. Patient state advanced to Ophthalmologist consulting node.");
    setSelectedMr("");
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <h2 style={{ margin: "0 0 16px" }}>Comprehensive Advanced Optometrist Diagnostics Engine</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={LBL}>Query Triage Vector Pool for Awaiting Refraction Patients</label>
        <select value={selectedMr} onChange={e => {
          setSelectedMr(e.target.value);
          const rec = db.clinicalRecords.find(c => c.mrNo === e.target.value);
          if (rec) setOptomData(prev => ({ ...prev, ...rec }));
        }} style={INP}>
          <option value="">-- Query incoming refraction target array --</option>
          {db.patients.filter(p => p.currentStage === "Optometrist Room").map(p => (
            <option key={p.mrNo} value={p.mrNo}>{p.mrNo} - {p.name} ({p.phone})</option>
          ))}
        </select>
      </div>

      {activePatient && (
        <div style={{ display: "grid", gap: 20, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
          <div style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, fontSize: 13 }}>
            <strong>Demographic Profiling Node Context:</strong> {activePatient.name} | Age: {activePatient.age} | Sex: {activePatient.gender}
          </div>

          <div style={{ display: "flex", gap: 16, background: "#fcf8f2", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, minWidth: 150 }}>Medical History Co-morbidities Checklist:</div>
            {["htn", "dm", "cad", "asthma", "allergies"].map(f => (
              <label key={f} style={{ display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", fontSize: 12, fontWeight: 600 }}>
                <input type="checkbox" checked={optomData[f]} onChange={e => setOptomData({ ...optomData, [f]: e.target.checked })} /> {f}
              </label>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={SECT_BOX}>
              <h4 style={SECT_TTL}>Visual Acuity Mapping Profile (Uncorrected/Pin-Hole)</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={LBL}>Oculus Dexter (OD / Right Eye)</label><input type="text" value={optomData.visionOD} onChange={e => setOptomData({ ...optomData, visionOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Oculus Sinister (OS / Left Eye)</label><input type="text" value={optomData.visionOS} onChange={e => setOptomData({ ...optomData, visionOS: e.target.value })} style={INP} /></div>
              </div>
            </div>

            <div style={SECT_BOX}>
              <h4 style={SECT_TTL}>Retinoscopy Assessment Diagnostics</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={LBL}>Retinoscopy OD Grid Matrix</label><input type="text" value={optomData.retinoscopyOD} onChange={e => setOptomData({ ...optomData, retinoscopyOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Retinoscopy OS Grid Matrix</label><input type="text" value={optomData.retinoscopyOS} onChange={e => setOptomData({ ...optomData, retinoscopyOS: e.target.value })} style={INP} /></div>
              </div>
            </div>
          </div>

          <div style={SECT_BOX}>
            <h4 style={SECT_TTL}>Automated Refraction (AR) Objective Data Stream</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a" }}>RIGHT EYE (OD) AR MATRIX BLOCK</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  <input type="text" placeholder="Sphere" value={optomData.arSpherOD} onChange={e => setOptomData({ ...optomData, arSpherOD: e.target.value })} style={INP} />
                  <input type="text" placeholder="Cylinder" value={optomData.arCylOD} onChange={e => setOptomData({ ...optomData, arCylOD: e.target.value })} style={INP} />
                  <input type="text" placeholder="Axis Orientation" value={optomData.arAxisOD} onChange={e => setOptomData({ ...optomData, arAxisOD: e.target.value })} style={INP} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a" }}>LEFT EYE (OS) AR MATRIX BLOCK</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  <input type="text" placeholder="Sphere" value={optomData.arSpherOS} onChange={e => setOptomData({ ...optomData, arSpherOS: e.target.value })} style={INP} />
                  <input type="text" placeholder="Cylinder" value={optomData.arCylOS} onChange={e => setOptomData({ ...optomData, arCylOS: e.target.value })} style={INP} />
                  <input type="text" placeholder="Axis Orientation" value={optomData.arAxisOS} onChange={e => setOptomData({ ...optomData, arAxisOS: e.target.value })} style={INP} />
                </div>
              </div>
            </div>
          </div>

          <div style={SECT_BOX}>
            <h4 style={SECT_TTL}>Subjective Acceptance & Vision Trial Core Values</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46" }}>SUBJECTIVE ACCEPTANCE VECTOR - OD</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  <input type="text" placeholder="Sphere" value={optomData.accSpherOD} onChange={e => setOptomData({ ...optomData, accSpherOD: e.target.value })} style={INP} />
                  <input type="text" placeholder="Cylinder" value={optomData.accCylOD} onChange={e => setOptomData({ ...optomData, accCylOD: e.target.value })} style={INP} />
                  <input type="text" placeholder="Axis" value={optomData.accAxisOD} onChange={e => setOptomData({ ...optomData, accAxisOD: e.target.value })} style={INP} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46" }}>SUBJECTIVE ACCEPTANCE VECTOR - OS</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  <input type="text" placeholder="Sphere" value={optomData.accSpherOS} onChange={e => setOptomData({ ...optomData, accSpherOS: e.target.value })} style={INP} />
                  <input type="text" placeholder="Cylinder" value={optomData.accCylOS} onChange={e => setOptomData({ ...optomData, accCylOS: e.target.value })} style={INP} />
                  <input type="text" placeholder="Axis" value={optomData.accAxisOS} onChange={e => setOptomData({ ...optomData, accAxisOS: e.target.value })} style={INP} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div><label style={LBL}>Near Vision Index OD</label><input type="text" value={optomData.nearOD} onChange={e => setOptomData({ ...optomData, nearOD: e.target.value })} style={INP} /></div>
              <div><label style={LBL}>Near Vision Index OS</label><input type="text" value={optomData.nearOS} onChange={e => setOptomData({ ...optomData, nearOS: e.target.value })} style={INP} /></div>
              <div><label style={LBL}>Reading ADD Factor Value</label><input type="text" value={optomData.addVal} onChange={e => setOptomData({ ...optomData, addVal: e.target.value })} style={INP} /></div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div><label style={LBL}>Intraocular Pressure (IOP) OD</label><input type="text" placeholder="mmHg" value={optomData.iopOD} onChange={e => setOptomData({ ...optomData, iopOD: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Intraocular Pressure (IOP) OS</label><input type="text" placeholder="mmHg" value={optomData.iopOS} onChange={e => setOptomData({ ...optomData, iopOS: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Systemic Blood Pressure Metrics</label><input type="text" value={optomData.bp} onChange={e => setOptomData({ ...optomData, bp: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Random Blood Sugar Parameters</label><input type="text" value={optomData.sugar} onChange={e => setOptomData({ ...optomData, sugar: e.target.value })} style={INP} /></div>
          </div>

          <div>
            <label style={LBL}>Pupillary Mydriasis Dilatation Tracking Loop</label>
            <select value={optomData.dilatation} onChange={e => setOptomData({ ...optomData, dilatation: e.target.value })} style={INP}>
              <option>Not Dilated</option>
              <option>Dilated (Tropicamide 1% Matrix Protocol)</option>
              <option>Dilated (Phenylephrine Co-infusion Scheme)</option>
            </select>
          </div>

          <button onClick={saveOptometristMetrics} style={{ background: "#059669", color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Authorize and Route Refraction Parameters to Master File</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL OPHTHALMOLOGIST CONSULTATION MODULE
// ════════════════════════════════════════════════════════════════════════
function OphthalmologistModule({ db, mutate, session, audit, fieldVis }) {
  const [selectedMr, setSelectedMr] = useState("");
  const [ophData, setOphData] = useState({
    eyelids: "Normal", conjunctiva: "Clear", cornea: "Clear", anteriorChamber: "Normal Depth", iris: "Normal Pattern", pupil: "Reactive", lens: "Clear", fundus: "Normal Disc & Macula", ocularMovements: "Full", diagnosis: "", advice: "", prescription: "", treatmentPlan: ""
  });
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const activePatient = db.patients.find(p => p.mrNo === selectedMr);
  const matchedClinicalProfile = db.clinicalRecords.find(c => c.mrNo === selectedMr);

  useEffect(() => {
    if (selectedMr && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 400, 150);
      // Render anatomical reference schema
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(100, 75, 45, 0, Math.PI * 2); ctx.stroke(); // OD Circle
      ctx.beginPath(); ctx.arc(300, 75, 45, 0, Math.PI * 2); ctx.stroke(); // OS Circle
      ctx.fillStyle = "#4b5563";
      ctx.font = "12px sans-serif";
      ctx.fillText("Oculus Dexter (OD)", 50, 140);
      ctx.fillText("Oculus Sinister (OS)", 250, 140);
    }
  }, [selectedMr]);

  const triggerStrokeStart = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawStrokeSegment = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const saveOphthalmologistConsultation = () => {
    if (!selectedMr) return;
    const records = [...db.clinicalRecords];
    const idx = records.findIndex(c => c.mrNo === selectedMr);
    
    const annotationDataUrl = canvasRef.current ? canvasRef.current.toDataURL() : null;

    const updatedRecord = {
      ...(idx > -1 ? records[idx] : {}),
      ...ophData,
      graphData: annotationDataUrl,
      timestamp: ts()
    };

    if (idx > -1) records[idx] = updatedRecord;
    else records.push(updatedRecord);

    const updatedPatients = db.patients.map(p => p.mrNo === selectedMr ? { ...p, currentStage: "Counseling Suite Corridor" } : p);

    mutate("clinicalRecords", records, updatedRecord);
    mutate("patients", updatedPatients, { ...activePatient, currentStage: "Counseling Suite Corridor" });
    
    audit("OPHTHALMOLOGIST_EXAM_COMMITTED", { mrNo: selectedMr, diagnosis: ophData.diagnosis });
    alert("Consultation files logged to central patient database structure.");
    setSelectedMr("");
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <h2 style={{ margin: "0 0 16px" }}>MD Ophthalmologist High-Definition Examination Station</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={LBL}>Query Consultation Array for Active Refracted Cases</label>
        <select value={selectedMr} onChange={e => {
          setSelectedMr(e.target.value);
          const exist = db.clinicalRecords.find(c => c.mrNo === e.target.value);
          if (exist) setOphData(prev => ({ ...prev, ...exist }));
        }} style={INP}>
          <option value="">-- Click to fetch triage candidates --</option>
          {db.patients.filter(p => p.currentStage === "Ophthalmologist Consultation").map(p => (
            <option key={p.mrNo} value={p.mrNo}>{p.mrNo} - {p.name} (Triage Vis: {db.clinicalRecords.find(c => c.mrNo === p.mrNo)?.visionOD || "N/A"})</option>
          ))}
        </select>
      </div>

      {activePatient && (
        <div style={{ display: "grid", gap: 20, borderTop: "2px solid #e5e7eb", paddingTop: 16 }}>
          {matchedClinicalProfile && (
            <div style={{ background: "#eff6ff", padding: 14, borderRadius: 8, fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <strong>Triaged Refraction Baseline Data Parameters:</strong>
                <div>OD visual field acuity line metric: {matchedClinicalProfile.visionOD} | Subjective Acceptance: {matchedClinicalProfile.accSpherOD} {matchedClinicalProfile.accCylOD}</div>
                <div>OS visual field acuity line metric: {matchedClinicalProfile.visionOS} | Subjective Acceptance: {matchedClinicalProfile.accSpherOS} {matchedClinicalProfile.accCylOS}</div>
              </div>
              <div>
                <strong>Vitals Track:</strong> IOP OD/OS: {matchedClinicalProfile.iopOD || "—"}/{matchedClinicalProfile.iopOS || "—"} mmHg | Systemic BP: {matchedClinicalProfile.bp || "—"} | Sugar status: {matchedClinicalProfile.sugar || "—"}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={SECT_BOX}>
              <h4 style={SECT_TTL}>Anterior Segment Structure Biomicroscopy Slit-Lamp Trace</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["eyelids", "conjunctiva", "cornea", "anteriorChamber", "iris", "pupil", "lens"].map(f => (
                  <div key={f}><label style={LBL}>{f}</label><input type="text" value={ophData[f]} onChange={e => setOphData({ ...ophData, [f]: e.target.value })} style={INP} /></div>
                ))}
              </div>
            </div>

            <div style={SECT_BOX}>
              <h4 style={SECT_TTL}>Anatomical Sketchpad & Ophthalmic Vector Marker Engine</h4>
              <div style={{ background: "#f3f4f6", borderRadius: 8, padding: 8, display: "flex", justifyContent: "center" }}>
                <canvas ref={canvasRef} width={400} height={150} onMouseDown={triggerStrokeStart} onMouseMove={drawStrokeSegment} onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)} style={{ background: "#fff", border: "1px dashed #9ca3af", cursor: "crosshair" }} />
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>Interact using mouse/stylus parameter overlays to generate precise spatial descriptions of clinical pathology markings directly on eye diagrams.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={LBL}>Posterior Segment Ophthalmoscopy (Fundus Macula/Disc Metrics)</label><input type="text" value={ophData.fundus} onChange={e => setOphData({ ...ophData, fundus: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Functional Assessment Extraocular Movements</label><input type="text" value={ophData.ocularMovements} onChange={e => setOphData({ ...ophData, ocularMovements: e.target.value })} style={INP} /></div>
          </div>

          <div style={{ borderTop: "1px dashed #ccc", paddingTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>Primary Diagnostic Summary Assessment *</label>
            <input type="text" value={ophData.diagnosis} onChange={e => setOphData({ ...ophData, diagnosis: e.target.value })} placeholder="e.g. Nuclear Sclerotic Grade III Cataract with Macular Edema trace..." style={INP} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={LBL}>Clinical Advice Protocol / Surgical Invocations</label><textarea value={ophData.advice} onChange={e => setOphData({ ...ophData, advice: e.target.value })} rows={3} style={INP} /></div>
            <div><label style={LBL}>Rx Pharmaceutical Prescription Sheet</label><textarea value={ophData.prescription} onChange={e => setOphData({ ...ophData, prescription: e.target.value })} rows={3} style={INP} placeholder="Specify drug nomenclature, concentrations, dosing intervals..." /></div>
          </div>

          <button onClick={saveOphthalmologistConsultation} style={{ background: "#991b1b", color: "#fff", border: "none", padding: "14px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Authorize Clinical Consultation Sign-off & Lock Files</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL SURGERY COUNSELING ENGINE
// ════════════════════════════════════════════════════════════════════════
function CounselingModule({ db, mutate, session, audit }) {
  const [selectedMr, setSelectedMr] = useState("");
  const [counsel, setCounsel] = useState({ treatmentRecommended: "", opticalCounseling: "", costEstimate: "", patientDecision: "Agreed", remarks: "", nextFollowUp: "", surgeryDate: "" });

  const activePatient = db.patients.find(p => p.mrNo === selectedMr);

  const saveCounselingRecord = () => {
    if (!selectedMr) return;
    const currentCounselingEntries = [...db.counseling];
    const newEntry = {
      id: `CNSL-${Math.floor(100 + Math.random() * 900)}`,
      mrNo: selectedMr,
      ...counsel,
      costEstimate: Number(counsel.costEstimate)
    };
    currentCounselingEntries.push(newEntry);

    let updatedSurgeries = [...db.surgeries];
    if (counsel.patientDecision === "Agreed" && counsel.surgeryDate) {
      updatedSurgeries.push({
        id: `SURG-${Math.floor(1000 + Math.random() * 9000)}`,
        mrNo: selectedMr,
        patientId: activePatient.patientId,
        name: activePatient.name,
        age: activePatient.age,
        gender: activePatient.gender,
        phone: activePatient.phone,
        surgeryType: counsel.treatmentRecommended || "Ophthalmic Surgery Case",
        surgeon: "Unassigned Staff",
        scheduledDate: counsel.surgeryDate,
        status: "Scheduled",
        otNotes: counsel.remarks,
        followUpDate: counsel.nextFollowUp
      });
    }

    const modifiedPatients = db.patients.map(p => p.mrNo === selectedMr ? { ...p, currentStage: "Opticals/Pharmacy Routing Hub" } : p);

    mutate("counseling", currentCounselingEntries, newEntry);
    mutate("surgeries", updatedSurgeries, updatedSurgeries[updatedSurgeries.length - 1]);
    mutate("patients", modifiedPatients, { ...activePatient, currentStage: "Opticals/Pharmacy Routing Hub" });

    audit("COUNSELING_DISPOSITION_ARRIVED", { mrNo: selectedMr, decision: counsel.patientDecision });
    alert("Counseling data committed. Surgery pipelines instantiated where applicable.");
    setSelectedMr("");
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <h2>Ophthalmology Financial Counseling & Surgical Planning Module</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={LBL}>Query Post-Consultation Pipeline Array</label>
        <select value={selectedMr} onChange={e => {
          setSelectedMr(e.target.value);
          const clinical = db.clinicalRecords.find(c => c.mrNo === e.target.value);
          if (clinical) setCounsel(prev => ({ ...prev, treatmentRecommended: clinical.advice || "" }));
        }} style={INP}>
          <option value="">-- Fetch patient financial scheduling nodes --</option>
          {db.patients.filter(p => p.currentStage === "Counseling Suite Corridor").map(p => (
            <option key={p.mrNo} value={p.mrNo}>{p.mrNo} - {p.name} ({p.phone})</option>
          ))}
        </select>
      </div>

      {activePatient && (
        <div style={{ display: "grid", gap: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={LBL}>Surgical Procedure Interventions Overview</label><input type="text" value={counsel.treatmentRecommended} onChange={e => setCounsel({ ...counsel, treatmentRecommended: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Refractive Optical Counseling Strategy</label><input type="text" value={counsel.opticalCounseling} onChange={e => setCounsel({ ...counsel, opticalCounseling: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Total Estimated Cost Structure Fee (INR)</label><input type="number" value={counsel.costEstimate} onChange={e => setCounsel({ ...counsel, costEstimate: e.target.value })} style={INP} /></div>
            <div>
              <label style={LBL}>Patient Financial Disposition Decision</label>
              <select value={counsel.patientDecision} onChange={e => setCounsel({ ...counsel, patientDecision: e.target.value })} style={INP}>
                <option>Agreed</option>
                <option>Under Consideration / Deferred</option>
                <option>Declined Financial Terms</option>
              </select>
            </div>
          </div>

          {counsel.patientDecision === "Agreed" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f0fdf4", padding: 12, borderRadius: 8 }}>
              <div><label style={LBL}>Target Scheduled Surgery Date</label><input type="date" value={counsel.surgeryDate} onChange={e => setCounsel({ ...counsel, surgeryDate: e.target.value })} style={INP} /></div>
              <div><label style={LBL}>Post-Operative Follow-Up Vector Date</label><input type="date" value={counsel.nextFollowUp} onChange={e => setCounsel({ ...counsel, nextFollowUp: e.target.value })} style={INP} /></div>
            </div>
          )}

          <div><label style={LBL}>Counseling Documentation Remarks</label><textarea value={counsel.remarks} onChange={e => setCounsel({ ...counsel, remarks: e.target.value })} rows={2} style={INP} /></div>
          <button onClick={saveCounselingRecord} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Finalize Financial Counselor Sign-off Matrix</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// OPTICALS INTERACTIVE DISPENSING & BILLING ENGINE
// ════════════════════════════════════════════════════════════════════════
function OpticalsModule({ db, mutate, session, audit }) {
  const [selectedMr, setSelectedMr] = useState("");
  const [sale, setSale] = useState({ frameSelected: "", lensSelected: "", totalAmount: "", advance: "", payMethod: "UPI", txId: "", deliveryDate: "" });

  const activePatient = db.patients.find(p => p.mrNo === selectedMr);
  const refractionProfile = db.clinicalRecords.find(c => c.mrNo === selectedMr);

  const executeOpticalBilling = () => {
    if (!selectedMr || !sale.totalAmount) return;
    const calculatedBalance = Number(sale.totalAmount) - Number(sale.advance || 0);
    const newInvoice = {
      id: `OPT-${Math.floor(1000 + Math.random() * 9000)}`,
      mrNo: selectedMr,
      patientId: activePatient.patientId,
      name: activePatient.name,
      phone: activePatient.phone,
      address: activePatient.address,
      acceptedPower: refractionProfile ? `OD: ${refractionProfile.accSpherOD || "0"} Sph / ${refractionProfile.accCylOD || "0"} Cyl x ${refractionProfile.accAxisOD || "0"}, OS: ${refractionProfile.accSpherOS || "0"} Sph / ${refractionProfile.accCylOS || "0"} Cyl x ${refractionProfile.accAxisOS || "0"} [Add: ${refractionProfile.addVal || "None"}]` : "Baseline Verification Pending",
      ...sale,
      totalAmount: Number(sale.totalAmount),
      advance: Number(sale.advance || 0),
      balance: calculatedBalance,
      representative: session.name,
      status: "Not Ready",
      date: new Date().toISOString().split("T")[0]
    };

    const nextSalesRecords = [...db.opticalsSales, newInvoice];
    mutate("opticalsSales", nextSalesRecords, newInvoice);
    audit("OPTICAL_SALE_INVOICED", { invoiceId: newInvoice.id, mrNo: selectedMr });
    alert(`Success: Invoice Generated ${newInvoice.id}. Due Balance: INR ${calculatedBalance}`);
    setSelectedMr("");
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <h2>Point of Sale (POS) Opticals Dispensing & Refraction Invoicing</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={LBL}>Fetch Active Optical Routing Channel Candidates</label>
        <select value={selectedMr} onChange={e => {
          setSelectedMr(e.target.value);
        }} style={INP}>
          <option value="">-- Match patient database indices --</option>
          {db.patients.map(p => (
            <option key={p.mrNo} value={p.mrNo}>{p.mrNo} - {p.name}</option>
          ))}
        </select>
      </div>

      {activePatient && (
        <div style={{ display: "grid", gap: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
          {refractionProfile && (
            <div style={{ background: "#fffbeb", padding: 12, borderRadius: 8, fontSize: 13, borderLeft: "4px solid #d97706" }}>
              <strong>Auto-Fetched Refraction Lens Power Vectors:</strong>
              <div>OD Acceptance Sphere/Cylinder/Axis Parameters: <span style={{ fontWeight: 700 }}>{refractionProfile.accSpherOD || "0.00"} DS / {refractionProfile.accCylOD || "0.00"} DC x {refractionProfile.accAxisOD || "0"}°</span> (Near: {refractionProfile.nearOD || "—"})</div>
              <div>OS Acceptance Sphere/Cylinder/Axis Parameters: <span style={{ fontWeight: 700 }}>{refractionProfile.accSpherOS || "0.00"} DS / {refractionProfile.accCylOS || "0.00"} DC x {refractionProfile.accAxisOS || "0"}°</span> (Near: {refractionProfile.nearOS || "—"})</div>
              {refractionProfile.addVal && <div>Reading Addition Assessment Metric: <span style={{ color: "#b45309", fontWeight: 700 }}>{refractionProfile.addVal} DS</span></div>}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={LBL}>Dispensed Frame SKU Matrix Selection</label><input type="text" value={sale.frameSelected} onChange={e => setSale({ ...sale, frameSelected: e.target.value })} placeholder="Query frame stock catalog..." style={INP} /></div>
            <div><label style={LBL}>Dispensed Lens Core Treatment Attribute Profile</label><input type="text" value={sale.lensSelected} onChange={e => setSale({ ...sale, lensSelected: e.target.value })} placeholder="Progressive, Polycarbonate, Blue-Cut, etc." style={INP} /></div>
            <div><label style={LBL}>Gross Transaction Bill Amount (INR) *</label><input type="number" value={sale.totalAmount} onChange={e => setSale({ ...sale, totalAmount: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Advance Security Deposit Deposited (INR)</label><input type="number" value={sale.advance} onChange={e => setSale({ ...sale, advance: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Payment Mode</label><select value={sale.payMethod} onChange={e => setSale({ ...sale, payMethod: e.target.value })} style={INP}><option>UPI</option><option>Cash Transaction</option><option>Credit/Debit Card Terminal</option></select></div>
            <div><label style={LBL}>Gateway Transaction Identification ID Hash</label><input type="text" value={sale.txId} onChange={e => setSale({ ...sale, txId: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Target Delivery Full Commitment Date</label><input type="date" value={sale.deliveryDate} onChange={e => setSale({ ...sale, deliveryDate: e.target.value })} style={INP} /></div>
          </div>

          <button onClick={executeOpticalBilling} style={{ background: "#d97706", color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Lock Invoicing Parameters and Terminate POS Sale</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ENTERPRISE MULTIPHASE CENTRAL INVENTORY ENGINE
// ════════════════════════════════════════════════════════════════════════
function InventoryModule({ db, mutate, session, audit }) {
  const [newItem, setNewItem] = useState({ sku: "", name: "", category: "Lenses", brand: "", qty: "", reorder: "5", cost: "", price: "", expiryDate: "" });
  const [filterCategory, setFilterCategory] = useState("All");

  const registerNewSkuItem = () => {
    if (session.role !== "owner") {
      alert("Security Violation: Inventory architecture modifications restricted to MD Admin Authority Level.");
      return;
    }
    if (!newItem.sku || !newItem.name || !newItem.price) return;
    const updatedCollection = [...db.inventory, {
      ...newItem,
      id: `inv-${Date.now()}`,
      qty: Number(newItem.qty || 0),
      reorder: Number(newItem.reorder || 5),
      cost: Number(newItem.cost || 0),
      price: Number(newItem.price || 0)
    }];
    mutate("inventory", updatedCollection, updatedCollection[updatedCollection.length - 1]);
    audit("INVENTORY_SKU_ADDED", { sku: newItem.sku, name: newItem.name });
    setNewItem({ sku: "", name: "", category: "Lenses", brand: "", qty: "", reorder: "5", cost: "", price: "", expiryDate: "" });
  };

  const executeRestockIncrement = (id, amount = 10) => {
    const nextInv = db.inventory.map(item => item.id === id ? { ...item, qty: item.qty + amount } : item);
    mutate("inventory", nextInv, nextInv.find(i => i.id === id));
    audit("INVENTORY_SKU_INCREMENTED", { itemId: id, added: amount });
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {session.role === "owner" && (
        <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 16px" }}>MD Admin Inventory Supply Chain Ingestion Pipeline</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div><label style={LBL}>Unique Item Code SKU *</label><input type="text" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Asset Descriptive Name *</label><input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={INP} /></div>
            <div>
              <label style={LBL}>Inventory Matrix Category</label>
              <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} style={INP}>
                <option>Lenses</option><option>Frames</option><option>Medicines</option><option>Surgical Consumables</option>
              </select>
            </div>
            <div><label style={LBL}>Manufacturer Brand Identity</label><input type="text" value={newItem.brand} onChange={e => setNewItem({ ...newItem, brand: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Ingested Stock Volume</label><input type="number" value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Reorder Threshold Bound</label><input type="number" value={newItem.reorder} onChange={e => setNewItem({ ...newItem, reorder: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Unit Purchase Cost (INR)</label><input type="number" value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Unit Base Sales Price (INR)</label><input type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Pharmaceutical Expiry</label><input type="date" value={newItem.expiryDate} onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })} style={INP} /></div>
          </div>
          <button onClick={registerNewSkuItem} style={{ marginTop: 12, background: "#1e40af", color: "#fff", padding: "10px 16px", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Commit Asset Allocation Vector to Warehousing Matrix</button>
        </div>
      )}

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Central Hospital Stock Ledger Index</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Lenses", "Frames", "Medicines", "Surgical Consumables"].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)} style={{ padding: "6px 12px", background: filterCategory === cat ? "#1f2937" : "#e5e7eb", color: filterCategory === cat ? "#fff" : "#1f2937", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{cat}</button>
            ))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: 10 }}>Unique SKU Code</th>
              <th style={{ padding: 10 }}>Asset Name / Descriptor</th>
              <th style={{ padding: 10 }}>Category Node</th>
              <th style={{ padding: 10 }}>On-Hand Quantity</th>
              <th style={{ padding: 10 }}>Unit Price Valuation</th>
              <th style={{ padding: 10 }}>Expiry Lifecycle Monitor</th>
              <th style={{ padding: 10 }}>Management Control Hooks</th>
            </tr>
          </thead>
          <tbody>
            {db.inventory.filter(i => filterCategory === "All" || i.category === filterCategory).map(item => {
              const requiresReorderTrigger = item.qty <= item.reorder;
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb", background: requiresReorderTrigger ? "#fef2f2" : "transparent" }}>
                  <td style={{ padding: 10, fontFamily: "monospace", fontWeight: 700 }}>{item.sku}</td>
                  <td style={{ padding: 10 }}><div>{item.name}</div><span style={{ fontSize: 11, color: "#6b7280" }}>Brand: {item.brand || "Generic Baseline"}</span></td>
                  <td style={{ padding: 10 }}><span style={{ fontSize: 11, background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{item.category}</span></td>
                  <td style={{ padding: 10, fontWeight: 700, color: requiresReorderTrigger ? "#dc2626" : "#16a34a" }}>{item.qty} units {requiresReorderTrigger && <span style={{ fontSize: 10, background: "#fee2e2", color: "#b91c1c", padding: "2px 4px", borderRadius: 4 }}>LOW STOCK THRESHOLD</span>}</td>
                  <td style={{ padding: 10 }}>{currency(item.price)}</td>
                  <td style={{ padding: 10, color: item.expiryDate ? "#b45309" : "#6b7280" }}>{item.expiryDate || "Indefinite Structural Lifecycle"}</td>
                  <td style={{ padding: 10 }}><button onClick={() => executeRestockIncrement(item.id, 25)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>⚡ Fast Replenish (+25)</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL SURGERY SCHEDULING & OT LOGGER
// ════════════════════════════════════════════════════════════════════════
function SurgeryModule({ db, mutate, session, audit }) {
  const updateSurgeryStateCode = (id, nextStatus) => {
    const list = db.surgeries.map(s => s.id === id ? { ...s, status: nextStatus } : s);
    mutate("surgeries", list, list.find(s => s.id === id));
    audit("SURGERY_STATUS_MUTATED", { surgeryId: id, state: nextStatus });
  };

  const writeOtNotes = (id, notesText) => {
    const list = db.surgeries.map(s => s.id === id ? { ...s, otNotes: notesText } : s);
    mutate("surgeries", list, list.find(s => s.id === id));
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <h2>Operating Theater (OT) Core Surgical Scheduler Engine</h2>
      <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>Track real-time perioperative workflows for cataract extraction, vitrectomies, and refractive surgeries.</p>
      
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Surgical Case ID</th>
            <th style={{ padding: 10 }}>Master MR No Reference</th>
            <th style={{ padding: 10 }}>Patient Demographics</th>
            <th style={{ padding: 10 }}>Procedure Target Context</th>
            <th style={{ padding: 10 }}>Target Execution Date</th>
            <th style={{ padding: 10 }}>Operating Room Notes Documentation Log</th>
            <th style={{ padding: 10 }}>Workflow Status Vector State</th>
          </tr>
        </thead>
        <tbody>
          {db.surgeries.map(s => (
            <tr key={s.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: 10, fontWeight: 700, fontFamily: "monospace" }}>{s.id}</td>
              <td style={{ padding: 10, fontWeight: 700, color: "#1e40af" }}>{s.mrNo}</td>
              <td style={{ padding: 10 }}>{s.name} ({s.age}Yrs/{s.gender})</td>
              <td style={{ padding: 10, fontWeight: 600, color: "#7c3aed" }}>{s.surgeryType}</td>
              <td style={{ padding: 10 }}>{s.scheduledDate}</td>
              <td style={{ padding: 10 }}>
                <textarea value={s.otNotes || ""} onChange={e => writeOtNotes(s.id, e.target.value)} placeholder="Append post-operative surgical observation parameters..." rows={1} style={{ ...INP, width: 200, fontSize: 12 }} />
              </td>
              <td style={{ padding: 10 }}>
                <select value={s.status} onChange={e => updateSurgeryStateCode(s.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, border: "1px solid #ccc", fontWeight: 600 }}>
                  <option>Scheduled</option><option>Confirmed Ready</option><option>Completed Successful</option><option>Postponed Case</option><option>Cancelled Structural Deviation</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REMINDER MODALITY ENGINE & COMMUNICATION INTEGRATION STREAMS
// ════════════════════════════════════════════════════════════════════════
function ReminderSystem({ db, mutate, session, audit }) {
  const [rem, setRem] = useState({ mrNo: "", type: "Follow-Up Visit", date: "", channel: "WhatsApp", text: "" });

  const buildReminderObject = () => {
    if (!rem.mrNo || !rem.date || !rem.text) return;
    const targets = [...db.reminders, { ...rem, id: uid(), status: "Pending" }];
    mutate("reminders", targets, targets[targets.length - 1]);
    audit("COMMUNICATION_REMINDER_PIPELINED", { targetPatient: rem.mrNo, classification: rem.type });
    setRem({ mrNo: "", type: "Follow-Up Visit", date: "", channel: "WhatsApp", text: "" });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Queue Automation Outbound Notification</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div><label style={LBL}>Patient MR Key Link *</label><input type="text" value={rem.mrNo} onChange={e => setRem({ ...rem, mrNo: e.target.value })} placeholder="e.g. MR-1001" style={INP} /></div>
          <div>
            <label style={LBL}>Notification Category Trigger</label>
            <select value={rem.type} onChange={e => setRem({ ...rem, type: e.target.value })} style={INP}>
              <option>Follow-Up Visit</option><option>Surgery Reminder</option><option>Optical Delivery Availability</option><option>Review Visit</option>
            </select>
          </div>
          <div><label style={LBL}>Scheduled Delivery Date</label><input type="date" value={rem.date} onChange={e => setRem({ ...rem, date: e.target.value })} style={INP} /></div>
          <div>
            <label style={LBL}>Outbound Channel API Vector</label>
            <select value={rem.channel} onChange={e => setRem({ ...rem, channel: e.target.value })} style={INP}>
              <option>WhatsApp Ready API Endpoint</option><option>SMS Gateways Pathway</option><option>Email SMTP Relay Node</option>
            </select>
          </div>
          <div><label style={LBL}>Notification Interfacing Message Text Payload</label><textarea value={rem.text} onChange={e => setRem({ ...rem, text: e.target.value })} rows={3} style={INP} /></div>
          <button onClick={buildReminderObject} style={{ background: "#0284c7", color: "#fff", padding: "10px", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Inject Communication Matrix Notification</button>
        </div>
      </div>

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Outbound Structural Dispatch Log</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: 8 }}>Target Patient</th>
              <th style={{ padding: 8 }}>Classification</th>
              <th style={{ padding: 8 }}>Gateway Channel</th>
              <th style={{ padding: 8 }}>Payload Summary Block</th>
              <th style={{ padding: 8 }}>Status Route</th>
            </tr>
          </thead>
          <tbody>
            {db.reminders.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee", fontSize: 13 }}>
                <td style={{ padding: 8, fontWeight: 700 }}>{r.mrNo}</td>
                <td style={{ padding: 8 }}>{r.type}</td>
                <td style={{ padding: 8 }}><span style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4 }}>{r.channel}</span></td>
                <td style={{ padding: 8, color: "#4b5563" }}>{r.text}</td>
                <td style={{ padding: 8 }}><span style={{ color: "#059669", fontWeight: 700 }}>✓ API_STABLE_{r.status.toUpperCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INTERNAL CLINICAL WORK TASK ALLOCATION ENGINE
// ════════════════════════════════════════════════════════════════════════
function TaskManagement({ db, mutate, session, audit, accounts }) {
  const [taskForm, setTaskForm] = useState({ title: "", priority: "Medium", deadline: "", assignedTo: "" });

  const allocateOperationalTask = () => {
    if (!taskForm.title || !taskForm.assignedTo) return;
    const taskSet = [...db.tasks, { ...taskForm, id: uid(), status: "Pending", createdBy: session.id }];
    mutate("tasks", taskSet, taskSet[taskSet.length - 1]);
    audit("OPERATIONAL_TASK_INJECTED", { title: taskForm.title, recipient: taskForm.assignedTo });
    setTaskForm({ title: "", priority: "Medium", deadline: "", assignedTo: "" });
  };

  const cycleStateIndex = (id) => {
    const list = db.tasks.map(t => t.id === id ? { ...t, status: t.status === "Pending" ? "In Progress" : t.status === "In Progress" ? "Completed" : "Pending" } : t);
    mutate("tasks", list, list.find(t => t.id === id));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Instantiate Task Mandate</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div><label style={LBL}>Task Action Mandate Statement *</label><input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={INP} /></div>
          <div>
            <label style={LBL}>Recipient Operational User Profile Node</label>
            <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} style={INP}>
              <option value="">-- Associate clinical identity node --</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.department})</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Priority Level Mapping</label>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={INP}><option>Low</option><option>Medium</option><option>High</option><option>Critical Urgency</option></select>
          </div>
          <div><label style={LBL}>Target Timeline Deadline</label><input type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} style={INP} /></div>
          <button onClick={allocateOperationalTask} style={{ background: "#111827", color: "#fff", padding: 10, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Delegate Mandate Vector</button>
        </div>
      </div>

      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Clinical Task Matrix Stream</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {db.tasks.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", padding: 12, borderRadius: 8, borderLeft: `4px solid ${t.priority === "High" || t.priority === "Critical Urgency" ? "#dc2626" : "#cbd5e1"}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Assigned To Node Instance: <strong>{accounts.find(a => a.id === t.assignedTo)?.name || t.assignedTo}</strong> | Deadline: {t.deadline || "Indefinite Timeline"}</div>
              </div>
              <button onClick={() => cycleStateIndex(t.id)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: t.status === "Completed" ? "#d1fae5" : t.status === "In Progress" ? "#fef3c7" : "#e5e7eb", color: t.status === "Completed" ? "#065f46" : t.status === "In Progress" ? "#92400e" : "#374151" }}>
                Status Token: {t.status.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MD CONTROL CENTER & SYSTEM GOVERNANCE PANEL (RBAC ENGINE)
// ════════════════════════════════════════════════════════════════════════
function MDGovernanceSection({ accounts, setAccounts, fieldVis, setFieldVis, branding, setBranding, auditLog }) {
  const [operator, setOperator] = useState({ id: "", name: "", role: "staff", branch: "JPT Branch", department: "OP Registration", password: "" });

  const provisionStaffNode = () => {
    if (!operator.id || !operator.name || !operator.password) return;
    if (accounts.some(a => a.id === operator.id)) {
      alert("Error Identity Target Conflict: Token profile key already assigned inside operational arrays.");
      return;
    }
    setAccounts([...accounts, { ...operator, perms: { view: true, add: true, edit: false } }]);
    alert("Success: Role-Based Account Vector initialized within secure tables.");
    setOperator({ id: "", name: "", role: "staff", branch: "JPT Branch", department: "OP Registration", password: "" });
  };

  const toggleVisibilitySchemaElement = (sectionKey, itemField) => {
    const sectionList = fieldVis[sectionKey] || [];
    const changedFields = sectionList.includes(itemField) ? sectionList.filter(f => f !== itemField) : [...sectionList, itemField];
    setFieldVis({ ...fieldVis, [sectionKey]: changedFields });
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Hospital Configuration Identity Customization & Branding Engine</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 12 }}>
          <div><label style={LBL}>Hospital System Display Name Descriptor</label><input type="text" value={branding.name} onChange={e => setBranding({ ...branding, name: e.target.value })} style={INP} /></div>
          <div><label style={LBL}>Logo Graphical Text Token Identifier</label><input type="text" value={branding.logo} onChange={e => setBranding({ ...branding, logo: e.target.value })} style={INP} /></div>
          <div><label style={LBL}>Interface Theme Chromatic Hex Value</label><input type="color" value={branding.theme} onChange={e => setBranding({ ...branding, theme: e.target.value })} style={{ ...INP, height: 38, padding: 2 }} /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3>Staff RBAC User Node Provisioning Matrix</h3>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <input type="text" placeholder="Unique Access Identity ID Code (e.g. jpt_opt_2)" value={operator.id} onChange={e => setOperator({ ...operator, id: e.target.value })} style={INP} />
            <input type="text" placeholder="Full Legal Display Name" value={operator.name} onChange={e => setOperator({ ...operator, name: e.target.value })} style={INP} />
            <input type="text" placeholder="Access Authentication Encryption Passkey String" value={operator.password} onChange={e => setOperator({ ...operator, password: e.target.value })} style={INP} />
            <select value={operator.branch} onChange={e => setOperator({ ...operator, branch: e.target.value })} style={INP}>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={operator.department} onChange={e => setOperator({ ...operator, department: e.target.value })} style={INP}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={provisionStaffNode} style={{ background: "#16a34a", color: "#fff", padding: 10, border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Authorize Operational Credentials Access Token</button>
          </div>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3>Active Role-Based System User Trace Roster</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 300, overflowY: "auto" }}>
            {accounts.map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", background: "#f9fafb", padding: 10, borderRadius: 6, fontSize: 13 }}>
                <div>
                  <strong>{a.name}</strong> <code style={{ fontSize: 11, background: "#e2e8f0", padding: "1px 4px" }}>{a.id}</code>
                  <div style={{ color: "#4b5563", fontSize: 11, marginTop: 2 }}>Dept: {a.department} | Base: {a.branch}</div>
                </div>
                <span style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: 12, alignSelf: "center", fontWeight: 700 }}>{a.role.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Granular Clinical Field Visibility Schema Configuration Governance Grid</h3>
        <p style={{ fontSize: 13, color: "#4b5563" }}>Configure explicit field visibility states across functional departments to enforce data segregation protocols.</p>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {Object.keys(DEFAULT_FIELD_VISIBILITY).map(sectionKey => (
            <div key={sectionKey} style={{ background: "#f8f9fa", padding: 14, borderRadius: 8 }}>
              <h5 style={{ margin: "0 0 8px", textTransform: "uppercase", color: "#1e3a8a", fontSize: 12 }}>Workflow Interface Array Module: {sectionKey}</h5>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DEFAULT_FIELD_VISIBILITY[sectionKey].map(itemField => {
                  const isActive = (fieldVis[sectionKey] || []).includes(itemField);
                  return (
                    <button key={itemField} onClick={() => toggleVisibilitySchemaElement(sectionKey, itemField)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid", borderColor: isActive ? "#1e40af" : "#cbd5e1", background: isActive ? "#eff6ff" : "#fff", color: isActive ? "#1e40af" : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {itemField} {isActive ? "[VISIBLE]" : "[HIDDEN BY OWNER]"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REUSABLE INTERFACES CSS STYLESHEETS CONFIGURATION
// ════════════════════════════════════════════════════════════════════════
const LBL = { display: "block", fontSize: "11px", fontWeight: "700", color: "#4b5563", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.03em" };
const INP = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fafafa", fontSize: "13px", outline: "none", boxSizing: "border-box" };
const SECT_BOX = { background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" };
const SECT_TTL = { margin: "0 0 12px 0", fontSize: "12px", textTransform: "uppercase", color: "#4b5563", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", letterSpacing: "0.05em" };

const SHELL_CSS = `
  .sidebar-btn {
    display: flex; align-items: center; width: 100%; padding: 10px 12px; background: transparent;
    border: none; border-radius: 6px; color: rgba(255,255,255,0.8); text-align: left;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .sidebar-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .sidebar-btn.active { background: rgba(255,255,255,0.2); color: #fff; font-weight: 700; }
  .logout-btn {
    width: 100%; padding: 10px; border-radius: 6px; background: #991b1b; color: #fff;
    border: none; font-weight: 600; font-size: 12px; cursor: pointer; transition: background 0.2s;
  }
  .logout-btn:hover { background: #7f1d1d; }
  .analytics-card {
    background: #fff; padding: 16px; border-radius: 12px; border-left: 4px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .analytics-card .title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
  .analytics-card .value { font-size: 22px; font-weight: 700; color: #111827; margin-top: 4px; }
`;
