import { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v5.0-HMS — Sri Surya Eye Care | Enterprise Ophthalmology ERP Engine
// ════════════════════════════════════════════════════════════════════════
const APP_VER = "5.0-HMS";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const DEPARTMENTS = [
  "OP Registration", "K-Sheet Triage Room", "Optometrist Station", 
  "Ophthalmologist Consultation", "Counseling Suite", "Opticals Dept", 
  "Pharmacy Dept", "MD/Admin Dashboard"
];

// Master Visibility Schema mapped directly to physical K-Sheet subdivisions
const DEFAULT_FIELD_VISIBILITY = {
  opRegistration: ["mrNo", "patientId", "name", "phone", "age", "gender", "address", "referral", "fee", "payMode"],
  triageHistory: ["chiefComplaint", "pastHistoryChecklist", "htn", "dm", "cad", "asthmatic", "allergies", "others"],
  visualAcuity: ["vaOD", "vaOS", "cPGP_OD", "cPGP_OS", "phOD", "phOS", "nvOD", "nvOS"],
  refractionGrid: ["arOD", "arOS", "acceptOD", "acceptOS", "dilArOD", "dilArOS", "iopOD", "iopOS", "bp", "rbs", "ducts"],
  slitLampExam: ["eyelids", "conjunctiva", "cornea", "anteriorChamber", "iris", "pupil", "lens", "fundus", "ocularMovements"]
};

const DEFAULT_ACCOUNTS = [
  { id: "owner", name: "MD Admin Account", role: "owner", branch: "All", department: "MD/Admin Dashboard", password: "owner123", perms: {} },
  { id: "op_staff", name: "Ravi (Front Desk)", role: "staff", branch: "JPT Branch", department: "OP Registration", password: "op123", perms: {} },
  { id: "optom_staff", name: "Dr. Anjali (Optometrist)", role: "staff", branch: "JPT Branch", department: "Optometrist Station", password: "opt123", perms: {} },
  { id: "doctor_staff", name: "Dr. Vikram (Ophthalmologist)", role: "staff", branch: "JPT Branch", department: "Ophthalmologist Consultation", password: "doc123", perms: {} }
];

const INITIAL_MASTER_DATA = {
  patients: [
    { mrNo: "MR-1001", patientId: "PID-88291", name: "Ramesh Kumar", phone: "9848022338", address: "Kakinada", gender: "Male", age: 54, referral: "Camp Drive", branch: "JPT Branch", fee: 250, payMode: "Cash", txRef: "TXN-9921", remarks: "Progressive distance blurring", patientType: "New Patient", timestamp: "16/06/2026 09:00:00", date: "2026-06-16", time: "09:00", visitCount: 1, currentStage: "K-Sheet Triage Room" }
  ],
  clinicalRecords: [
    { id: "CR-1001", mrNo: "MR-1001", patientId: "PID-88291", chiefComplaint: "Diminished vision in both eyes since 6 months.", htn: true, dm: true, cad: false, asthmatic: false, allergies: "Sulfa Drugs", others: "", vaOD: "6/18", vaOS: "6/12", cPGP_OD: "6/9", cPGP_OS: "6/6", phOD: "6/12", phOS: "6/6", nvOD: "N6", nvOS: "N6", arOD: "-1.75 SPH / -0.50 CYL x 90", arOS: "-1.25 SPH", acceptOD: "-1.50 SPH / -0.50 CYL x 90", acceptOS: "-1.00 SPH", dilArOD: "", dilArOS: "", iopOD: "16", iopOS: "15", bp: "130/80", rbs: "142 mg/dl", ducts: "Patent", lidsOD: "Normal", lidsOS: "Normal", conjOD: "Clear", conjOS: "Clear", cornOD: "Clear", cornOS: "Clear", acOD: "Deep", acOS: "Deep", irisOD: "Normal", irisOS: "Normal", pupilOD: "Reactive", pupilOS: "Reactive", lensOD: "NS Grade II", lensOS: "NS Grade I", fundusOD: "Mild NPDR", fundusOS: "Normal Disc", movements: "Full", diagnosis: "Immature Cataract OD", advice: "Cataract Phacoemulsification OD", prescription: "Lubricating Drops 4x/day", graphData: null, timestamp: "16/06/2026 10:15:00" }
  ],
  inventory: [
    { id: "inv-1", sku: "LNS-SV-A1", name: "Single Vision Anti-Reflective", category: "Lenses", brand: "Essilor", qty: 45, reorder: 10, cost: 450, price: 1200, power: "-1.50", lensType: "Single Vision", boxNo: "B-02", expiryDate: "" },
    { id: "inv-2", sku: "MED-MOX-01", name: "Moxifloxacin Eye Drops", category: "Medicines", brand: "Cipla", qty: 12, reorder: 15, cost: 45, price: 110, boxNo: "Pharma Rack 2", expiryDate: "2027-04-12" }
  ],
  opticalsSales: [],
  counseling: [],
  surgeries: [],
  reminders: [],
  tasks: []
};

// ════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT PERSISTENCE OVERWRITES
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
  sess: (v) => { try { if (v) sessionStorage.setItem("hms_sess", JSON.stringify(v)); else sessionStorage.removeItem("hms_sess"); } catch {} },
  getSess: () => { try { return JSON.parse(sessionStorage.getItem("hms_sess")); } catch { return null; } },
};

// ════════════════════════════════════════════════════════════════════════
// MASTER ENTRYPOINT
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
  const [branding, setBranding] = useState(() => LS.get("hms_branding", { name: "Sri Surya Eye Care", logo: "👁️", theme: "#1e3a8a" }));

  // Write-Through Data Layer Synced to Cloud Tables
  const mutate = useCallback((key, updatedArray, mutatedRecord = null) => {
    setDb(prev => ({ ...prev, [key]: updatedArray }));
    if (_sb && mutatedRecord) {
      sbUpsertOne(key, mutatedRecord).catch(() => {});
    }
  }, []);

  const audit = useCallback((action, detail = {}) => {
    if (!session) return;
    const log = { id: uid(), action, detail, userId: session.id, userName: session.name, dept: session.department, at: ts() };
    setAuditLog(a => [log, ...a].slice(0, 500));
  }, [session]);

  const syncFromCloud = async () => {
    if (!sbCreds.url || !sbCreds.key) return;
    initSB(sbCreds.url, sbCreds.key);
    setSbStatus("syncing");
    try {
      const [pts, records, inv] = await Promise.all([
        sbGet("patients"),
        sbGet("clinicalRecords"),
        sbGet("inventory")
      ]);
      setDb(d => ({
        ...d,
        patients: Array.isArray(pts) ? pts : d.patients,
        clinicalRecords: Array.isArray(records) ? records : d.clinicalRecords,
        inventory: Array.isArray(inv) ? inv : d.inventory
      }));
      setSbStatus("ok");
    } catch { setSbStatus("error"); }
  };

  useEffect(() => {
    if (sbCreds.url && sbCreds.key) {
      initSB(sbCreds.url, sbCreds.key);
      syncFromCloud();
      const interval = setInterval(syncFromCloud, 10000); // 10s write-through background polling
      return () => clearInterval(interval);
    }
  }, [sbCreds]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (acc, branchOverride) => {
    const s = { ...acc, branch: branchOverride || acc.branch, loginTime: ts() };
    LS.sess(s); setSession(s); setView("dashboard");
  };

  const logout = () => { LS.sess(null); setSession(null); };

  if (!session) return <LoginScreen accounts={accounts} onLogin={login} branding={branding} sbCreds={sbCreds} setSbCreds={setSbCreds} />;

  return (
    <DashboardShell session={session} onLogout={logout} view={view} setView={setView} branding={branding}>
      {view === "dashboard" && <AnalyticsDashboard db={db} auditLog={auditLog} session={session} />}
      {view === "opRegistration" && <OpRegistrationModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "kSheet" && <KSheetModule db={db} mutate={mutate} session={session} audit={audit} fieldVis={fieldVis} />}
      {view === "inventory" && <InventoryModule db={db} mutate={mutate} session={session} audit={audit} />}
      {view === "governance" && session.role === "owner" && <MDGovernanceSection accounts={accounts} setAccounts={setAccounts} fieldVis={fieldVis} setFieldVis={setFieldVis} branding={branding} setBranding={setBranding} auditLog={auditLog} />}
    </DashboardShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DYNAMIC NAVIGATION CORE SHELL
// ════════════════════════════════════════════════════════════════════════
function DashboardShell({ session, onLogout, view, setView, branding, children }) {
  const menu = [
    { id: "dashboard", label: "Dashboard Hub", icon: "📊", show: true },
    { id: "opRegistration", label: "OP Registration", icon: "📝", show: session.role === "owner" || session.department === "OP Registration" },
    { id: "kSheet", label: "Clinical Exam Chart", icon: "📋", show: session.role === "owner" || ["K-Sheet Triage Room", "Optometrist Station", "Ophthalmologist Consultation"].includes(session.department) },
    { id: "inventory", label: "HMS Supply Inventory", icon: "📦", show: session.role === "owner" || ["Lens Stock Control", "Pharmacy Dept"].includes(session.department) },
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
            <div style={{ fontSize: 11, opacity: 0.7 }}>HMS Central Node</div>
          </div>
        </div>
        <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{session.name}</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{session.department}</div>
          <div style={{ fontSize: 10, color: "#a3cfbb", marginTop: 4 }}>📍 Station: {session.branch}</div>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {menu.filter(m => m.show).map(m => (
            <button key={m.id} className={`sidebar-btn ${view === m.id ? "active" : ""}`} onClick={() => setView(m.id)}>
              <span style={{ marginRight: 8 }}>{m.icon}</span> {m.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={onLogout}>🔒 Terminate Node Session</button>
      </aside>
      <main style={{ flex: 1, padding: 24, overflowY: "auto", maxWidth: "calc(100vw - 260px)" }}>{children}</main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL ENTRY NODE GATEWAY (LOGIN WITH BACKEND CONFIG SUPPORT)
// ════════════════════════════════════════════════════════════════════════
function LoginScreen({ accounts, onLogin, branding, sbCreds, setSbCreds }) {
  const [uidStr, setUidStr] = useState("");
  const [pwd, setPwd] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [showConfig, setShowConfig] = useState(false);
  const [url, setUrl] = useState(sbCreds.url || "");
  const [key, setKey] = useState(sbCreds.key || "");

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40 }}>{branding.logo}</div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1f2937" }}>{branding.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Terminal Authorization Node</p>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={LBL}>Operational Branch Hub Location</label>
            <select value={branch} onChange={e => setBranch(e.target.value)} style={INP}>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Operator System Key ID</label>
            <input type="text" value={uidStr} onChange={e => setUidStr(e.target.value)} placeholder="e.g. op_staff" style={INP} />
          </div>
          <div>
            <label style={LBL}>Access Credentials Security Passkey</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" style={INP} onKeyDown={e => e.key === "Enter" && onLogin(accounts.find(a => a.id === uidStr.trim() && a.password === pwd), branch)} />
          </div>

          <button onClick={() => {
            const matched = accounts.find(a => a.id === uidStr.trim() && a.password === pwd);
            if (matched) onLogin(matched, matched.role === "owner" ? "All Branches" : branch);
            else alert("Authentication Failed: Security Handshake Terminated.");
          }} style={{ background: branding.theme, color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Verify Terminal Identity</button>

          <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: 8, paddingTop: 10, textAlign: "center" }}>
            <button onClick={() => setShowConfig(!showConfig)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>⚙️ Infrastructure Database Node Config</button>
          </div>

          {showConfig && (
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", display: "grid", gap: 8 }}>
              <input type="text" placeholder="Supabase Project Endpoint URL" value={url} onChange={e => setUrl(e.target.value)} style={INP} />
              <input type="password" placeholder="Anon Cryptographic Public Token Key" value={key} onChange={e => setKey(e.target.value)} style={INP} />
              <button onClick={() => {
                setSbCreds({ url, key });
                alert("Infrastructure Targets Committed to Local System Memory Layer.");
                setShowConfig(false);
              }} style={{ background: "#475569", color: "#fff", border: "none", padding: "6px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Bind Cloud Endpoints</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL ANALYTICS DASHBOARD
// ════════════════════════════════════════════════════════════════════════
function AnalyticsDashboard({ db, auditLog, session }) {
  const pts = session.role === "owner" ? db.patients : db.patients.filter(x => x.branch === session.branch);
  const lowStock = db.inventory.filter(i => i.qty <= i.reorder).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Operational Performance Matrix</h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Real-time core parameters streaming loop from database nodes.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="analytics-card"><div className="title">Active Daily Intake Records</div><div className="value">{pts.length} Cases</div></div>
        <div className="analytics-card" style={{ borderLeftColor: "#10b981" }}><div className="title">Triage Operations Queue</div><div className="value">{pts.filter(p => p.currentStage === "K-Sheet Triage Room").length} Patients</div></div>
        <div className="analytics-card" style={{ borderLeftColor: "#ef4444" }}><div className="title">Critical Supply SKU Disruptions</div><div className="value">{lowStock} Alerts</div></div>
      </div>

      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h3 style={{ margin: "0 0 16px" }}>Active Patient Path Tracking Control</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: 10 }}>Master MR No</th>
              <th style={{ padding: 10 }}>Patient Legal Identity</th>
              <th style={{ padding: 10 }}>Branch Hub Address</th>
              <th style={{ padding: 10 }}>Current Live Department Node Tracking Location</th>
            </tr>
          </thead>
          <tbody>
            {pts.slice(-5).reverse().map(p => (
              <tr key={p.mrNo} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: 10, fontWeight: 700, color: "#1e3a8a" }}>{p.mrNo}</td>
                <td style={{ padding: 10 }}>{p.name} ({p.age} / {p.gender})</td>
                <td style={{ padding: 10 }}>{p.branch}</td>
                <td style={{ padding: 10 }}><span style={{ padding: "4px 10px", background: "#dbeafe", color: "#1e40af", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{p.currentStage}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// OP REGISTRATION (WITH DUPLICATE VALIDATION ENGINE ARCHITECTURE)
// ════════════════════════════════════════════════════════════════════════
function OpRegistrationModule({ db, mutate, session, audit }) {
  const [form, setForm] = useState({ name: "", phone: "", age: "", gender: "Male", address: "", referral: "", fee: "250", payMode: "Cash", remarks: "" });
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  const processPatientRegistration = (bypassChecks = false) => {
    if (!form.name || !form.phone || !form.age) {
      alert("Validation Constraint Violation: Mandatory identifiers absent.");
      return;
    }

    if (!bypassChecks) {
      const existingMatch = db.patients.find(p => p.phone === form.phone.trim() || (p.name.toLowerCase() === form.name.toLowerCase().trim() && Number(p.age) === Number(form.age)));
      if (existingMatch) {
        setDuplicateMatch(existingMatch);
        return;
      }
    }

    const assignedMr = `MR-${1000 + db.patients.length + 1}`;
    const assignedPid = `PID-${Math.floor(10000 + Math.random() * 90000)}`;
    const record = {
      ...form, mrNo: assignedMr, patientId: assignedPid,
      branch: session.branch === "All" ? "JPT Branch" : session.branch,
      timestamp: ts(), date: new Date().toISOString().split("T")[0], time: new Date().toLocaleTimeString("en-IN"),
      visitCount: 1, currentStage: "K-Sheet Triage Room"
    };

    const nextCollection = [...db.patients, record];
    mutate("patients", nextCollection, record);
    audit("PATIENT_REGISTRATION_RECORDED", { mrNo: assignedMr, name: form.name });
    alert(`Success: Identity Track Initialized. Patient Master Record Allocated under ${assignedMr}`);
    setForm({ name: "", phone: "", age: "", gender: "Male", address: "", referral: "", fee: "250", payMode: "Cash", remarks: "" });
    setDuplicateMatch(null);
  };

  const captureRevisitIncrementLoop = (target) => {
    const updatedCollection = db.patients.map(p => p.mrNo === target.mrNo ? { ...p, visitCount: (p.visitCount || 1) + 1, currentStage: "K-Sheet Triage Room", timestamp: ts() } : p);
    mutate("patients", updatedCollection, { ...target, visitCount: (target.visitCount || 1) + 1, currentStage: "K-Sheet Triage Room", timestamp: ts() });
    audit("PATIENT_REVISIT_LOGGED", { mrNo: target.mrNo });
    alert(`Revisit Registered: Execution path returned to Triage Room under existing ${target.mrNo}`);
    setDuplicateMatch(null);
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <h2>OP Out-Patient Registration & Demographics Capture Node</h2>
      
      {duplicateMatch && (
        <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h4 style={{ color: "#c2410c", margin: "0 0 4px" }}>⚠️ INTEGRITY SAFEDOCK WARNING: EXISTING RECORD MATCHING CURRENT IDENTITY KEYPATHS</h4>
          <p style={{ margin: "0 0 12px", fontSize: 13 }}>Database contains a direct tracking node correlation: <strong>{duplicateMatch.name} ({duplicateMatch.mrNo})</strong>, Phone: {duplicateMatch.phone}, Age: {duplicateMatch.age}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => captureRevisitIncrementLoop(duplicateMatch)} style={{ background: "#ea580c", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Log Revisit (Increment Loop Count)</button>
            <button onClick={() => processPatientRegistration(true)} style={{ background: "#475569", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}>Bypass Safeguard & Force Separate File</button>
            <button onClick={() => setDuplicateMatch(null)} style={{ background: "#cbd5e1", color: "#1f2937", padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}>Abort Commit</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14 }}>
        <div><label style={LBL}>Patient Full Legal Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Contact Mobile Sequence *</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Biological Age Metric *</label><input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Gender Check</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} style={INP}><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div><label style={LBL}>Demographic Core Address</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Referral S/O W/O D/O Mapping Pathway</label><input type="text" value={form.referral} onChange={e => setForm({...form, referral: e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Registration Fee Assessed (INR)</label><input type="number" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Payment Mode</label><select value={form.payMode} onChange={e => setForm({...form, payMode: e.target.value})} style={INP}><option>Cash</option><option>UPI Network</option><option>Waiver Card</option></select></div>
      </div>
      <button onClick={() => processPatientRegistration(false)} style={{ marginTop: 16, background: "#1e3a8a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Commit Master Entry & Disperse Route Token</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CLINICAL TRIAGE & MULTI-ROOM SCANNING WORKSPACE (THE K-SHEET MATRIX)
// ════════════════════════════════════════════════════════════════════════
function KSheetModule({ db, mutate, session, audit, fieldVis }) {
  const [activeMr, setActiveMr] = useState("");
  const [panelTab, setPanelTab] = useState("triage");
  const canvasRef = useRef(null);
  const [drawingState, setDrawingState] = useState(false);

  const [clinicalForm, setClinicalForm] = useState({
    chiefComplaint: "", htn: false, dm: false, cad: false, asthmatic: false, allergies: "", others: "",
    vaOD: "", vaOS: "", cPGP_OD: "", cPGP_OS: "", phOD: "", phOS: "", nvOD: "", nvOS: "",
    arOD: "", arOS: "", acceptOD: "", acceptOS: "", dilArOD: "", dilArOS: "", iopOD: "", iopOS: "", bp: "", rbs: "", ducts: "",
    lidsOD: "Normal", lidsOS: "Normal", conjOD: "Clear", conjOS: "Clear", cornOD: "Clear", cornOS: "Clear", acOD: "Deep", acOS: "Deep", irisOD: "Normal", irisOS: "Normal", pupilOD: "Reactive", pupilOS: "Reactive", lensOD: "Clear", lensOS: "Clear",
    fundusOD: "Normal Disc & Macula", fundusOS: "Normal Disc & Macula", movements: "Full & Free", diagnosis: "", advice: "", prescription: ""
  });

  const selectedPatientData = db.patients.find(p => p.mrNo === activeMr);

  const syncActivePatientSelection = (mr) => {
    setActiveMr(mr);
    const existingClinicalRecord = db.clinicalRecords.find(c => c.mrNo === mr);
    if (existingClinicalRecord) {
      setClinicalForm(prev => ({ ...prev, ...existingClinicalRecord }));
    } else {
      setClinicalForm({
        chiefComplaint: "", htn: false, dm: false, cad: false, asthmatic: false, allergies: "", others: "",
        vaOD: "", vaOS: "", cPGP_OD: "", cPGP_OS: "", phOD: "", phOS: "", nvOD: "", nvOS: "",
        arOD: "", arOS: "", acceptOD: "", acceptOS: "", dilArOD: "", dilArOS: "", iopOD: "", iopOS: "", bp: "", rbs: "", ducts: "",
        lidsOD: "Normal", lidsOS: "Normal", conjOD: "Clear", conjOS: "Clear", cornOD: "Clear", cornOS: "Clear", acOD: "Deep", acOS: "Deep", irisOD: "Normal", irisOS: "Normal", pupilOD: "Reactive", pupilOS: "Reactive", lensOD: "Clear", lensOS: "Clear",
        fundusOD: "Normal Disc & Macula", fundusOS: "Normal Disc & Macula", movements: "Full & Free", diagnosis: "", advice: "", prescription: ""
      });
    }
  };

  useEffect(() => {
    if (panelTab === "sketch" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 500, 160);
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.5;
      // Right Eye Ring Layout
      ctx.beginPath(); ctx.arc(120, 80, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.font = "11px sans-serif"; ctx.fillStyle = "#64748b"; ctx.fillText("Oculus Dexter (OD)", 70, 145);
      // Left Eye Ring Layout
      ctx.beginPath(); ctx.arc(380, 80, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.fillText("Oculus Sinister (OS)", 330, 145);
    }
  }, [panelTab, activeMr]);

  const commitWorkflowStageUpdate = (targetNextStage) => {
    if (!activeMr) return;
    const array = [...db.clinicalRecords];
    const idx = array.findIndex(c => c.mrNo === activeMr);
    
    const vectorStringData = canvasRef.current ? canvasRef.current.toDataURL() : clinicalForm.graphData;
    const finalRecord = {
      ...(idx > -1 ? array[idx] : {}),
      ...clinicalForm, id: idx > -1 ? array[idx].id : `CR-${Date.now()}`,
      mrNo: activeMr, patientId: selectedPatientData.patientId, graphData: vectorStringData, timestamp: ts()
    };

    if (idx > -1) array[idx] = finalRecord;
    else array.push(finalRecord);

    const activePatientCollection = db.patients.map(p => p.mrNo === activeMr ? { ...p, currentStage: targetNextStage } : p);

    mutate("clinicalRecords", array, finalRecord);
    mutate("patients", activePatientCollection, { ...selectedPatientData, currentStage: targetNextStage });
    audit("CLINICAL_RECORD_WORKFLOW_COMMITTED", { mrNo: activeMr, destinationNode: targetNextStage });
    alert(`Data Synchronized Successfully to Core Cloud Storage Tables. Triage Node Set: ${targetNextStage}`);
    setActiveMr("");
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Sri Surya Digital Triage & Ophthalmic K-Sheet Workstation</h2>
        <select value={activeMr} onChange={e => syncActivePatientSelection(e.target.value)} style={{ ...INP, width: 300, borderColor: "#1e3a8a", fontWeight: 700 }}>
          <option value="">-- Direct query active room diagnostic targets --</option>
          {db.patients.map(p => (<option key={p.mrNo} value={p.mrNo}>{p.mrNo} : {p.name} ({p.currentStage})</option>))}
        </select>
      </div>

      {selectedPatientData && (
        <div>
          <div style={{ display: "flex", gap: 14, background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500, color: "#334155" }}>
            <div><strong>MR Number Field:</strong> {selectedPatientData.mrNo}</div>
            <div>| <strong>Legal Name:</strong> {selectedPatientData.name}</div>
            <div>| <strong>Age/Gender Axis:</strong> {selectedPatientData.age} Years / {selectedPatientData.gender}</div>
            <div>| <strong>System Loop Tracker Counter:</strong> Visit #{selectedPatientData.visitCount || 1}</div>
            <div style={{ marginLeft: "auto", background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 4 }}>Current Active Node: {session.department}</div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <button className={`tab-btn ${panelTab === "triage" ? "active" : ""}`} onClick={() => setPanelTab("triage")}>1. Chief Complaints & History</button>
            <button className={`tab-btn ${panelTab === "va" ? "active" : ""}`} onClick={() => setPanelTab("va")}>2. Visual Acuity (VA) Form Matrix</button>
            <button className={`tab-btn ${panelTab === "refraction" ? "active" : ""}`} onClick={() => setPanelTab("refraction")}>3. Objective Retinoscopy & Refraction</button>
            <button className={`tab-btn ${panelTab === "slit" ? "active" : ""}`} onClick={() => setPanelTab("slit")}>4. Biomicroscopy Slit Lamp OD/OS</button>
            <button className={`tab-btn ${panelTab === "sketch" ? "active" : ""}`} onClick={() => setPanelTab("sketch")}>5. Vector Sketchpad Marks</button>
          </div>

          {/* Sub-panel 1: Chief Complaints Mapping */}
          {panelTab === "triage" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={LBL}>Chief Patient Symptomatology Complaint Presentation</label>
                <textarea value={clinicalForm.chiefComplaint} onChange={e => setClinicalForm({ ...clinicalForm, chiefComplaint: e.target.value })} rows={3} style={INP} />
              </div>
              <div style={{ background: "#fffbeb", padding: 16, borderRadius: 8, border: "1px solid #fef3c7" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309", display: "block", marginBottom: 8 }}>PAST HISTORY CO-MORBIDITIES PROTOCOL CHECKLIST</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {["htn", "dm", "cad", "asthmatic"].map(field => (
                    <label key={field} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, textTransform: "uppercase" }}>
                      <input type="checkbox" checked={clinicalForm[field]} onChange={e => setClinicalForm({ ...clinicalForm, [field]: e.target.checked })} /> {field}
                    </label>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div><label style={LBL}>Allergies To Parameters</label><input type="text" value={clinicalForm.allergies} onChange={e => setClinicalForm({ ...clinicalForm, allergies: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>Other Pathology Interventions</label><input type="text" value={clinicalForm.others} onChange={e => setClinicalForm({ ...clinicalForm, others: e.target.value })} style={INP} /></div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-panel 2: Visual Acuity Framework Mapping */}
          {panelTab === "va" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={SECT_BOX}>
                <h4 style={SECT_TTL}>OCULUS DEXTER (OD / RIGHT EYE) METRIC FIELDS</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  <div><label style={LBL}>Visual Acuity (VA Base)</label><input type="text" value={clinicalForm.vaOD} onChange={e => setClinicalForm({ ...clinicalForm, vaOD: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>With Glasses Line (cPGP)</label><input type="text" value={clinicalForm.cPGP_OD} onChange={e => setClinicalForm({ ...clinicalForm, cPGP_OD: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>Pin-Hole Matrix Line (PH)</label><input type="text" value={clinicalForm.phOD} onChange={e => setClinicalForm({ ...clinicalForm, phOD: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>Near Vision Focus Metric (NV)</label><input type="text" value={clinicalForm.nvOD} onChange={e => setClinicalForm({ ...clinicalForm, nvOD: e.target.value })} style={INP} /></div>
                </div>
              </div>
              <div style={SECT_BOX}>
                <h4 style={SECT_TTL}>OCULUS SINISTER (OS / LEFT EYE) METRIC FIELDS</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  <div><label style={LBL}>Visual Acuity (VA Base)</label><input type="text" value={clinicalForm.vaOS} onChange={e => setClinicalForm({ ...clinicalForm, vaOS: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>With Glasses Line (cPGP)</label><input type="text" value={clinicalForm.cPGP_OS} onChange={e => setClinicalForm({ ...clinicalForm, cPGP_OS: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>Pin-Hole Matrix Line (PH)</label><input type="text" value={clinicalForm.phOS} onChange={e => setClinicalForm({ ...clinicalForm, phOS: e.target.value })} style={INP} /></div>
                  <div><label style={LBL}>Near Vision Focus Metric (NV)</label><input type="text" value={clinicalForm.nvOS} onChange={e => setClinicalForm({ ...clinicalForm, nvOS: e.target.value })} style={INP} /></div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-panel 3: Refraction Mapping Fields Grid */}
          {panelTab === "refraction" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={LBL}>Objective Auto-Refraction Vector (AR OD)</label><input type="text" value={clinicalForm.arOD} onChange={e => setClinicalForm({ ...clinicalForm, arOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Objective Auto-Refraction Vector (AR OS)</label><input type="text" value={clinicalForm.arOS} onChange={e => setClinicalForm({ ...clinicalForm, arOS: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Subjective Acceptance Trial (Accept OD)</label><input type="text" value={clinicalForm.acceptOD} onChange={e => setClinicalForm({ ...clinicalForm, acceptOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Subjective Acceptance Trial (Accept OS)</label><input type="text" value={clinicalForm.acceptOS} onChange={e => setClinicalForm({ ...clinicalForm, acceptOS: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Cycloplegic Dilated Refraction Vector (Dil AR OD)</label><input type="text" value={clinicalForm.dilArOD} onChange={e => setClinicalForm({ ...clinicalForm, dilArOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Cycloplegic Dilated Refraction Vector (Dil AR OS)</label><input type="text" value={clinicalForm.dilArOS} onChange={e => setClinicalForm({ ...clinicalForm, dilArOS: e.target.value })} style={INP} /></div>
              </div>
              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 12, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                <div><label style={LBL}>IOP Right (OD)</label><input type="text" placeholder="mmHg" value={clinicalForm.iopOD} onChange={e => setClinicalForm({ ...clinicalForm, iopOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>IOP Left (OS)</label><input type="text" placeholder="mmHg" value={clinicalForm.iopOS} onChange={e => setClinicalForm({ ...clinicalForm, iopOS: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Systemic BP</label><input type="text" value={clinicalForm.bp} onChange={e => setClinicalForm({ ...clinicalForm, bp: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Blood Sugar (RBS)</label><input type="text" value={clinicalForm.rbs} onChange={e => setClinicalForm({ ...clinicalForm, rbs: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Lacrimal Ducts Assessment</label><input type="text" value={clinicalForm.ducts} onChange={e => setClinicalForm({ ...clinicalForm, ducts: e.target.value })} style={INP} /></div>
              </div>
            </div>
          )}

          {/* Sub-panel 4: Biomicroscopy Slit Lamp Structural Configuration Data */}
          {panelTab === "slit" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={SECT_BOX}>
                <h4 style={SECT_TTL}>ANTERIOR BIOMICROSCOPY SPLIT VALUES - OD</h4>
                {["lids", "conj", "corn", "ac", "iris", "pupil", "lens"].map(field => (
                  <div key={field} style={{ marginBottom: 6 }}><label style={LBL}>{field} Attribute</label><input type="text" value={clinicalForm[`${field}OD`] || ""} onChange={e => setClinicalForm({ ...clinicalForm, [`${field}OD`]: e.target.value })} style={INP} /></div>
                ))}
              </div>
              <div style={SECT_BOX}>
                <h4 style={SECT_TTL}>ANTERIOR BIOMICROSCOPY SPLIT VALUES - OS</h4>
                {["lids", "conj", "corn", "ac", "iris", "pupil", "lens"].map(field => (
                  <div key={field} style={{ marginBottom: 6 }}><label style={LBL}>{field} Attribute</label><input type="text" value={clinicalForm[`${field}OS`] || ""} onChange={e => setClinicalForm({ ...clinicalForm, [`${field}OS`]: e.target.value })} style={INP} /></div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-panel 5: Vector Sketchpad Graphic Markup Engine */}
          {panelTab === "sketch" && (
            <div style={SECT_BOX}>
              <h4 style={SECT_TTL}>REALTIME BIOMICROSCOPY SKETCHPAD ENGINE MARKER OVERLAY</h4>
              <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 8, display: "flex", justifyContent: "center" }}>
                <canvas ref={canvasRef} width={500} height={160} onMouseDown={(e) => {
                  const r = canvasRef.current.getBoundingClientRect();
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3; ctx.beginPath();
                  ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
                  setDrawingState(true);
                }} onMouseMove={(e) => {
                  if (!drawingState) return;
                  const r = canvasRef.current.getBoundingClientRect();
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
                }} onMouseUp={() => setDrawingState(false)} onMouseLeave={() => setDrawingState(false)} style={{ background: "#fff", border: "1px dashed #64748b", cursor: "crosshair" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div><label style={LBL}>Posterior Segment Ophthalmoscopy Fundus Log</label><input type="text" value={clinicalForm.fundusOD} onChange={e => setClinicalForm({ ...clinicalForm, fundusOD: e.target.value })} style={INP} /></div>
                <div><label style={LBL}>Functional Eom Ocular Movements Assessment</label><input type="text" value={clinicalForm.movements} onChange={e => setClinicalForm({ ...clinicalForm, movements: e.target.value })} style={INP} /></div>
              </div>
            </div>
          )}

          <div style={{ borderTop: "2px solid #e2e8f0", marginTop: 16, paddingTop: 16 }}>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>Primary Clinical Diagnostic Conclusion *</label><input type="text" value={clinicalForm.diagnosis} onChange={e => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })} style={INP} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={LBL}>Clinical Advice Protocol / Management Intent</label><textarea value={clinicalForm.advice} onChange={e => setClinicalForm({ ...clinicalForm, advice: e.target.value })} rows={2} style={INP} /></div>
              <div><label style={LBL}>Rx Pharmaceutical Formulations Sheet</label><textarea value={clinicalForm.prescription} onChange={e => setClinicalForm({ ...clinicalForm, prescription: e.target.value })} rows={2} style={INP} /></div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
              <button onClick={() => commitWorkflowStageUpdate("Optometrist Station")} style={{ background: "#475569", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Route to Optometrist Workspace</button>
              <button onClick={() => commitWorkflowStageUpdate("Ophthalmologist Consultation")} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Route to MD Consultation Node</button>
              <button onClick={() => commitWorkflowStageUpdate("Pharmacy Dept")} style={{ background: "#059669", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Route to Pharma / Desk Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CENTRAL MEDICAL & CONSUMABLE INVENTORY CONTROL
// ════════════════════════════════════════════════════════════════════════
function InventoryModule({ db, mutate, session, audit }) {
  const [skuForm, setSkuForm] = useState({ sku: "", name: "", category: "Lenses", brand: "", qty: "", reorder: "5", cost: "", price: "", expiryDate: "" });

  const commitAssetToInventory = () => {
    if (session.role !== "owner") {
      alert("Privilege Constraint Violation: Modification pathways locked to MD level.");
      return;
    }
    if (!skuForm.sku || !skuForm.name) return;
    const array = [...db.inventory, {
      ...skuForm, id: `inv-${Date.now()}`, qty: Number(skuForm.qty || 0), reorder: Number(skuForm.reorder || 5), cost: Number(skuForm.cost || 0), price: Number(skuForm.price || 0)
    }];
    mutate("inventory", array, array[array.length - 1]);
    audit("INVENTORY_SKU_PROVISIONED", { sku: skuForm.sku });
    setSkuForm({ sku: "", name: "", category: "Lenses", brand: "", qty: "", reorder: "5", cost: "", price: "", expiryDate: "" });
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {session.role === "owner" && (
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3>MD Supply Chain Logistics Node Allocation Ingestion Panel</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
            <input type="text" placeholder="SKU Reference Token" value={skuForm.sku} onChange={e => setSkuForm({ ...skuForm, sku: e.target.value })} style={INP} />
            <input type="text" placeholder="Asset Name / Label" value={skuForm.name} onChange={e => setSkuForm({ ...skuForm, name: e.target.value })} style={INP} />
            <select value={skuForm.category} onChange={e => setSkuForm({ ...skuForm, category: e.target.value })} style={INP}><option>Lenses</option><option>Frames</option><option>Medicines</option></select>
            <input type="number" placeholder="Ingested Qty" value={skuForm.qty} onChange={e => setSkuForm({ ...skuForm, qty: e.target.value })} style={INP} />
            <input type="number" placeholder="Threshold Price" value={skuForm.price} onChange={e => setSkuForm({ ...skuForm, price: e.target.value })} style={INP} />
            <input type="date" value={skuForm.expiryDate} onChange={e => setSkuForm({ ...skuForm, expiryDate: e.target.value })} style={INP} />
          </div>
          <button onClick={commitAssetToInventory} style={{ marginTop: 12, background: "#1e40af", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Commit Inventory Vector</button>
        </div>
      )}

      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h3>HMS Central Warehouse Registry Records Ledger</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: 10 }}>SKU Token ID</th>
              <th style={{ padding: 10 }}>Asset Name</th>
              <th style={{ padding: 10 }}>Category</th>
              <th style={{ padding: 10 }}>Available Volume</th>
              <th style={{ padding: 10 }}>Unit Value</th>
              <th style={{ padding: 10 }}>Expiry Lifecycle</th>
            </tr>
          </thead>
          <tbody>
            {db.inventory.map(i => (
              <tr key={i.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: 10, fontFamily: "monospace", fontWeight: 700 }}>{i.sku}</td>
                <td style={{ padding: 10 }}>{i.name}</td>
                <td style={{ padding: 10 }}>{i.category}</td>
                <td style={{ padding: 10, fontWeight: 700, color: i.qty <= i.reorder ? "#dc2626" : "#16a34a" }}>{i.qty} units</td>
                <td style={{ padding: 10 }}>{currency(i.price)}</td>
                <td style={{ padding: 10, fontSize: 12, color: "#64748b" }}>{i.expiryDate || "Indefinite Run Target"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADMIN GOVERNANCE CONTROL CENTER Panel
// ════════════════════════════════════════════════════════════════════════
function MDGovernanceSection({ accounts, setAccounts, fieldVis, setFieldVis, branding, setBranding }) {
  const [staffForm, setStaffForm] = useState({ id: "", name: "", role: "staff", branch: "JPT Branch", department: "OP Registration", password: "" });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h3>Hospital Identification Customization & Branding Engine</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 10 }}>
          <div><label style={LBL}>Hospital System Display Name</label><input type="text" value={branding.name} onChange={e => setBranding({ ...branding, name: e.target.value })} style={INP} /></div>
          <div><label style={LBL}>Visual Icon Stamp</label><input type="text" value={branding.logo} onChange={e => setBranding({ ...branding, logo: e.target.value })} style={INP} /></div>
          <div><label style={LBL}>Dashboard Primary Theme Color Hex</label><input type="color" value={branding.theme} onChange={e => setBranding({ ...branding, theme: e.target.value })} style={{ ...INP, padding: 2, height: 38 }} /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3>Staff RBAC User Node Provisioning Matrix</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <input type="text" placeholder="Unique Operator Login ID Token" value={staffForm.id} onChange={e => setStaffForm({ ...staffForm, id: e.target.value })} style={INP} />
            <input type="text" placeholder="Staff Legal Name" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} style={INP} />
            <input type="text" placeholder="Security Handshake Authentication Passkey" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} style={INP} />
            <select value={staffForm.branch} onChange={e => setStaffForm({ ...staffForm, branch: e.target.value })} style={INP}>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
            <select value={staffForm.department} onChange={e => setStaffForm({ ...staffForm, department: e.target.value })} style={INP}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={() => {
              if (!staffForm.id || !staffForm.name || !staffForm.password) return;
              setAccounts([...accounts, staffForm]);
              alert("System Identity Token Generated Successfully.");
              setStaffForm({ id: "", name: "", role: "staff", branch: "JPT Branch", department: "OP Registration", password: "" });
            }} style={{ background: "#059669", color: "#fff", border: "none", padding: "10px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Generate Security Token Access Profile</button>
          </div>
        </div>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", maxHeight: 340, overflowY: "auto" }}>
          <h3>Active Role-Based Infrastructure Nodes Registry</h3>
          {accounts.map(a => (
            <div key={a.id} style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 0", fontSize: 13 }}>
              <strong>{a.name}</strong> (Identity Tag: <code>{a.id}</code>)
              <div style={{ color: "#64748b", fontSize: 11 }}>Module Core Deployment Room: {a.department} | Station: {a.branch}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STYLES INJECTION OVERLAYS
// ════════════════════════════════════════════════════════════════════════
const LBL = { display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.03em" };
const INP = { width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", fontSize: "13px", outline: "none", boxSizing: "border-box" };
const SECT_BOX = { background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" };
const SECT_TTL = { margin: "0 0 10px 0", fontSize: "12px", textTransform: "uppercase", color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", letterSpacing: "0.05em" };

const SHELL_CSS = `
  .sidebar-btn { display: flex; align-items: center; width: 100%; padding: 10px 12px; background: transparent; border: none; border-radius: 6px; color: rgba(255,255,255,0.8); text-align: left; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .sidebar-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .sidebar-btn.active { background: rgba(255,255,255,0.2); color: #fff; font-weight: 700; }
  .logout-btn { width: 100%; padding: 10px; border-radius: 6px; background: #b91c1c; color: #fff; border: none; font-weight: 600; font-size: 12px; cursor: pointer; margin-top: auto; }
  .tab-btn { padding: 6px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; }
  .tab-btn.active { background: #1e3a8a; color: #fff; border-color: #1e3a8a; }
  .analytics-card { background: #fff; padding: 16px; border-radius: 12px; border-left: 4px solid #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .analytics-card .title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
  .analytics-card .value { font-size: 22px; font-weight: 700; color: #111827; margin-top: 4px; }
`;

const ts = () => `${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}`;
const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;
const uid = () => "ID" + Math.random().toString(36).substring(2, 7).toUpperCase();
