import { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v4.5 — Ophthalmology HMS  |  Supabase · Direct Entry · Role Based
// ════════════════════════════════════════════════════════════════════════
const APP_VER  = "4.5";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const SECTIONS = ["patients","patientBill","optometrist","opticals","inventory","invoices","alerts"];
const SECTION_LABELS = { patients:"OP Registration", patientBill:"K Sheet Entry", optometrist:"Optometrist", opticals:"Opticals", inventory:"Inventory", invoices:"Sales & Invoices", alerts:"Low Stock Alerts" };
const LENS_TYPES     = ["Single Vision","Bifocal","Progressive","Anti-Reflective","Photochromic","Blue Cut","UV400","Polarized","High Index 1.60","High Index 1.67","High Index 1.74","Trivex","Polycarbonate","Toric (Contact)","Multifocal (Contact)"];
const DELIVERY_STATUS= ["Delivered","Not Ready","Fixing Completed But Not Delivered"];

// ════════════════════════════════════════════════════════════════════════
// DEFAULT ACCOUNTS
// ════════════════════════════════════════════════════════════════════════
const DEFAULT_ACCOUNTS = [
  { id:"owner",      name:"Owner",       role:"owner", designation: "Hospital Administrator", branch:"All",        password:"owner123", perms:{} },
  { id:"staff_jpt1", name:"Ravi (JPT)",  role:"staff", designation: "Receptionist",           branch:"JPT Branch", password:"jpt1234",
    perms:{ patients:{view:true,add:true,edit:false}, patientBill:{view:true,add:true,edit:false}, optometrist:{view:true,add:true,edit:false}, opticals:{view:true,add:true,edit:false}, inventory:{view:true,add:false,edit:false}, invoices:{view:true,add:false,edit:false}, alerts:{view:true,add:false,edit:false} }
  },
  { id:"staff_prp1", name:"Divya (PRP)", role:"staff", designation: "Optometrist",            branch:"PRP Branch", password:"prp1234",
    perms:{ patients:{view:true,add:true,edit:false}, patientBill:{view:true,add:true,edit:false}, optometrist:{view:true,add:true,edit:false}, opticals:{view:true,add:true,edit:false}, inventory:{view:false,add:false,edit:false}, invoices:{view:false,add:false,edit:false}, alerts:{view:false,add:false,edit:false} }
  },
];

// Default visible fields per section (owner can toggle)
const DEFAULT_FIELD_VISIBILITY = {
  patients:     ["timestamp","date","time","mrNo","patientId","name","phone","address","ref","paymentAmount","paymentMode","paymentRefNo","branch","remarks","visitType"],
  patientBill:  ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory"],
  optometrist:  ["timestamp","mrNo","patientId","name","complaint","pastHistory"],
  opticals:     ["timestamp","mrNo","patientId","name","phone","address","totalPrice","advance","advancePaymentMethod","transactionId","balance","optomName"],
  inventory:    ["sku","name","category","brand","qty","reorder","lensPower","lensType","boxNo","price","location"],
  invoices:     ["id","date","patientName","items","discount","status"],
};

// ════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// Supabase is the SINGLE SOURCE OF TRUTH.
// localStorage is only a display-cache — ALWAYS overwritten by Supabase.
// ════════════════════════════════════════════════════════════════════════
let _sb = null;
function initSB(url, key) {
  if (!url || !key) { _sb = null; return false; }
  _sb = { url: url.replace(/\/$/, ""), key };
  return true;
}
function sbReady() { return _sb !== null; }

const SB_TABLES = {
  patients:      "patients",
  patientBill:   "patientBill",
  optometrist:   "optometrist",
  opticals:      "opticals",
  stock:         "stock",
  invoices:      "invoices",
  accounts:      "accounts",
  audit_log:     "audit_log",
  tasks:         "tasks",
  reminders:     "reminders",
};

function sbHeaders() {
  return { "Content-Type": "application/json", "apikey": _sb.key, "Authorization": `Bearer ${_sb.key}` };
}

// GET all rows from a table — returns [] on empty, null on error
async function sbGet(table) {
  if (!_sb) return null;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}?select=*`, { headers: sbHeaders() });
    if (!r.ok) { console.warn(`sbGet ${table} HTTP ${r.status}`); return null; }
    const d = await r.json();
    return Array.isArray(d) ? d : null;
  } catch(e) { console.warn(`sbGet ${table}:`, e); return null; }
}

// UPSERT a single record
async function sbUpsertOne(table, row) {
  if (!_sb) return { ok: false, error: "Not connected to Supabase" };
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}`, {
      method: "POST",
      headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const t = await r.text();
      console.warn(`sbUpsertOne ${table} HTTP ${r.status}:`, t);
      return { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true, error: null };
  } catch(e) {
    console.warn(`sbUpsertOne ${table}:`, e);
    return { ok: false, error: e.message || String(e) };
  }
}

// UPSERT multiple records
async function sbUpsertMany(table, rows) {
  if (!_sb || !rows.length) return true;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}`, {
      method: "POST",
      headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!r.ok) { const t = await r.text(); console.warn(`sbUpsertMany ${table} HTTP ${r.status}:`, t); }
    return r.ok;
  } catch(e) { console.warn(`sbUpsertMany ${table}:`, e); return false; }
}

// DELETE by id
async function sbDelete(table, id) {
  if (!_sb) return false;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE", headers: sbHeaders(),
    });
    return r.ok;
  } catch(e) { console.warn(`sbDelete ${table}:`, e); return false; }
}

// INSERT one row (audit log, fire-and-forget)
async function sbInsert(table, row) {
  if (!_sb) return false;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}`, {
      method: "POST",
      headers: { ...sbHeaders(), "Prefer": "return=minimal" },
      body: JSON.stringify(row),
    });
    return r.ok;
  } catch { return false; }
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════
const now      = () => new Date();
const ts       = (d = now()) => `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
const todayStr = () => now().toISOString().split("T")[0];
const timeStr  = () => now().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;
const uid      = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: filename }).click();
}

// Validators
const validate = {
  phone:     v => { const s = String(v || "").trim(); return s.length === 10 && s[0] !== "0" && /^\d+$/.test(s); },
  town:      v => { const s = String(v || "").trim(); return s.length > 0 && !/\d/.test(s); },
  sphereCyl: v => { const n = parseFloat(v); return !isNaN(n) && n >= -6 && n <= 6 && Math.round(Math.abs(n) * 100) % 25 === 0; },
  axis:      v => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 180 && n === Math.round(n); },
  add:       v => { const n = parseFloat(v); if (isNaN(n)) return false; if (n === 0) return true; return n >= 0.75 && n <= 3.00 && Math.round(n * 100) % 25 === 0; },
};

const vStyle = (val, fn, touched) => !touched ? {} : fn(val) ? { borderColor: "#16a34a" } : { borderColor: "#dc2626" };
const vMsg   = (val, fn, touched, msg) => (!touched || fn(val)) ? null : <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{msg}</div>;

// ════════════════════════════════════════════════════════════════════════
// LOCAL PERSISTENCE  (fallback when Supabase not configured)
// ════════════════════════════════════════════════════════════════════════
const LS = {
  get:  (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set:  (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  sess: (v)      => { try { if (v) sessionStorage.setItem("opti_sess", JSON.stringify(v)); else sessionStorage.removeItem("opti_sess"); } catch {} },
  getSess: ()    => { try { return JSON.parse(sessionStorage.getItem("opti_sess")); } catch { return null; } },
};

const SEED_DATA = {
  patients: [
    { id:"p1", branch:"JPT Branch", timestamp:"29/05/2026 09:00:00", date:"2026-05-29", time:"09:00",
      mrNo:"MR-001", patientId:"PT-001", name:"Sarah Mitchell", phone:"9876543210", address:"Kakinada",
      ref:"", paymentAmount:200, paymentMode:"Cash", paymentRefNo:"", remarks:"", visitType:"New Patient",
      visitCount:1, status:"approved", createdBy:"owner", createdByName:"Owner" },
  ],
  patientBill: [],
  optometrist: [],
  opticals: [],
  stock: [
    { id:"s1", branch:"JPT Branch", sku:"FR-001", name:"Ray-Ban Aviator Gold", category:"Frames",  brand:"Ray-Ban",  qty:8,  reorder:5,  cost:2000, price:8000,  location:"A1", lensPower:"",      lensType:"",               boxNo:"",     createdBy:"owner", createdByName:"Owner" },
    { id:"s2", branch:"JPT Branch", sku:"LN-001", name:"Essilor Varilux",      category:"Lenses",  brand:"Essilor", qty:15, reorder:6,  cost:2500, price:9000,  location:"D1", lensPower:"-2.50", lensType:"Progressive",     boxNo:"B-14", createdBy:"owner", createdByName:"Owner" },
  ],
  invoices: [],
  tasks:     [],
  reminders: [],
};

// ════════════════════════════════════════════════════════════════════════
// PRINT HELPERS
// ════════════════════════════════════════════════════════════════════════
function printInvoice(inv) {
  const total = (inv.items || []).reduce((s, i) => s + i.qty * i.price, 0) - (inv.discount || 0);
  const win = window.open("", "_blank", "width=800,height=900");
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.id}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;padding:48px;max-width:700px;margin:0 auto}
  .hdr{display:flex;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #1a1714;margin-bottom:28px}
  table{width:100%;border-collapse:collapse}th{text-align:left;padding:10px;font-size:11px;text-transform:uppercase;color:#9b8e82;border-bottom:2px solid #e8e2db}
  td{padding:10px;border-bottom:1px solid #f0ede8;font-size:13px}.tot{font-weight:700;border-top:2px solid #1a1714}
  .foot{margin-top:40px;font-size:11px;color:#9b8e82;text-align:center}@media print{body{padding:24px}}</style></head><body>
  <div class="hdr"><div><h2>👁 OptiManager</h2><div style="color:#9b8e82">${inv.branch}</div></div>
  <div style="text-align:right"><h3>${inv.id}</h3><div>Date: ${inv.date}</div><div style="margin-top:6px;background:${inv.status === "Paid" ? "#dcfce7" : "#fef9c3"};color:${inv.status === "Paid" ? "#16a34a" : "#a16207"};display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700">${inv.status}</div></div></div>
  <p style="margin-bottom:20px"><strong>Billed To:</strong> ${inv.patientName}</p>
  <table><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead><tbody>
  ${(inv.items || []).map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td style="text-align:right">₹${Number(i.price).toFixed(2)}</td><td style="text-align:right">₹${(i.qty * i.price).toFixed(2)}</td></tr>`).join("")}
  ${inv.discount > 0 ? `<tr><td colspan="3" style="text-align:right;color:#9b8e82">Discount</td><td style="text-align:right;color:#dc2626">-₹${Number(inv.discount).toFixed(2)}</td></tr>` : ""}
  <tr class="tot"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">₹${Number(total).toFixed(2)}</td></tr>
  </tbody></table>
  <div class="foot">OptiManager · ${inv.branch} · Generated ${new Date().toLocaleString("en-IN")}</div>
  <script>window.onload=()=>{window.print()}<\/script></body></html>`);
  win.document.close();
}

// ════════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session,  setSession]  = useState(() => LS.getSess());
  const [accounts, setAccounts] = useState(() => LS.get("opti_accounts", DEFAULT_ACCOUNTS));
  const [data,     setData]     = useState(() => LS.get("opti_data_v4",  SEED_DATA));
  const [auditLog, setAuditLog] = useState(() => LS.get("opti_audit",    []));
  const [fieldVis, setFieldVis] = useState(() => LS.get("opti_fields",   DEFAULT_FIELD_VISIBILITY));
  const [sbCreds,  setSbCreds]  = useState(() => LS.get("opti_sb",       { url: "", key: "" }));
  const [sbStatus, setSbStatus] = useState("idle");
  const [view,     setView]     = useState("dashboard");
  const [lastSync, setLastSync] = useState(null);
  const [syncing,  setSyncing]  = useState(false);

  // ── localStorage persistence (write-through cache only) ──────────
  useEffect(() => { LS.set("opti_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("opti_data_v4",  data);     }, [data]);
  useEffect(() => { LS.set("opti_audit",    auditLog); }, [auditLog]);
  useEffect(() => { LS.set("opti_fields",   fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("opti_sb",       sbCreds);  }, [sbCreds]);

  // ── Core sync: pull everything from Supabase ──────────────────────
  const syncFromCloud = async (url, key) => {
    if (!url || !key) return;
    initSB(url, key);
    if (!sbReady()) return;
    if (syncing) return;
    setSyncing(true);
    try {
      const [pts, bills, optom, optcl, stk, inv, accs, tsks, rems] = await Promise.all([
        sbGet("patients"),
        sbGet("patientBill"),
        sbGet("optometrist"),
        sbGet("opticals"),
        sbGet("stock"),
        sbGet("invoices"),
        sbGet("accounts"),
        sbGet("tasks"),
        sbGet("reminders"),
      ]);

      setData(d => ({
        ...d,
        patients:    Array.isArray(pts)   ? pts   : d.patients,
        patientBill: Array.isArray(bills) ? bills : d.patientBill,
        optometrist: Array.isArray(optom) ? optom : d.optometrist,
        opticals:    Array.isArray(optcl) ? optcl : d.opticals,
        stock:       Array.isArray(stk)   ? stk   : d.stock,
        invoices:    Array.isArray(inv)   ? inv   : d.invoices,
        tasks:       Array.isArray(tsks)  ? tsks  : (d.tasks || []),
        reminders:   Array.isArray(rems)  ? rems  : (d.reminders || []),
      }));

      if (Array.isArray(accs) && accs.length > 0) {
        setAccounts(accs);
        LS.set("opti_accounts", accs);
      }

      setLastSync(new Date());
      setSbStatus("ok");
    } catch(e) {
      console.warn("Cloud sync failed:", e);
      setSbStatus("error");
    }
    setSyncing(false);
  };

  const syncRef = useRef(syncFromCloud);
  useEffect(() => { syncRef.current = syncFromCloud; });

  useEffect(() => {
    if (!sbCreds.url || !sbCreds.key) return;
    initSB(sbCreds.url, sbCreds.key);
    syncRef.current(sbCreds.url, sbCreds.key);
    const id = setInterval(() => syncRef.current(sbCreds.url, sbCreds.key), 10000);
    return () => clearInterval(id);
  }, [sbCreds.url, sbCreds.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase connect / test ──────────────────────────────────────
  const connectSupabase = async (url, key) => {
    setSbStatus("testing");
    const cleanUrl = url.replace(/\/$/, "");
    initSB(cleanUrl, key);
    try {
      const r = await fetch(`${cleanUrl}/rest/v1/patients?select=id&limit=1`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      });
      if (r.status < 500) {
        setSbCreds({ url: cleanUrl, key });
        setSbStatus("ok");
        await sbUpsertMany("accounts", accounts);
        await syncFromCloud(cleanUrl, key);
        return true;
      }
      setSbStatus("error"); _sb = null; return false;
    } catch(e) {
      if (cleanUrl.includes("supabase.co") && key.startsWith("eyJ") && key.length > 100) {
        initSB(cleanUrl, key);
        setSbCreds({ url: cleanUrl, key });
        setSbStatus("ok");
        await sbUpsertMany("accounts", accounts).catch(() => {});
        await syncFromCloud(cleanUrl, key);
        return true;
      }
      setSbStatus("error"); _sb = null; return false;
    }
  };

  const syncFromSupabase = async () => syncFromCloud(sbCreds.url, sbCreds.key);

  const pushToSupabase = async () => {
    if (!sbReady()) return;
    setSbStatus("pushing");
    try {
      await Promise.all([
        sbUpsertMany("patients",      data.patients    || []),
        sbUpsertMany("patientBill",   data.patientBill || []),
        sbUpsertMany("optometrist",   data.optometrist || []),
        sbUpsertMany("opticals",      data.opticals    || []),
        sbUpsertMany("stock",         data.stock       || []),
        sbUpsertMany("invoices",      data.invoices    || []),
        sbUpsertMany("accounts",      accounts),
        sbUpsertMany("tasks",         data.tasks       || []),
        sbUpsertMany("reminders",     data.reminders   || []),
      ]);
      setSbStatus("ok");
      await syncFromCloud(sbCreds.url, sbCreds.key);
    } catch { setSbStatus("error"); }
  };

  // ── Audit log ────────────────────────────────────────────────────
  const audit = useCallback((action, detail = {}) => {
    if (!session) return;
    const entry = { id: uid(), action, detail, userId: session.id, userName: session.name, branch: session.branch || "All", at: ts() };
    setAuditLog(a => [entry, ...a].slice(0, 500));
    sbInsert("audit_log", entry).catch(() => {});
  }, [session]);

  // ── Data mutations (Direct Writes for Everyone) ──────────────────
  const mutate = useCallback((key, fn, newRecord) => {
    setData(d => {
      const updated = typeof fn === "function" ? fn(d[key] || []) : fn;
      if (sbReady()) {
        if (newRecord) {
          sbUpsertOne(key, newRecord).catch(() => {});
        } else if (Array.isArray(updated)) {
          sbUpsertMany(key, updated).catch(() => {});
        }
      }
      return { ...d, [key]: updated };
    });
  }, []);

  const updateAccounts = useCallback(async (newAccounts) => {
    setAccounts(newAccounts);
    if (sbReady()) { await sbUpsertMany("accounts", newAccounts).catch(() => {}); }
  }, []);

  // ── Login / Logout ───────────────────────────────────────────────
  const login = useCallback(async (acc) => {
    const s = { ...acc, loginTime: ts() };
    LS.sess(s);
    setSession(s);
    setView("dashboard");
    const entry = { id: uid(), action: "LOGIN", detail: {}, userId: acc.id, userName: acc.name, branch: acc.branch || "All", at: ts() };
    setAuditLog(a => [entry, ...a].slice(0, 500));
    sbInsert("audit_log", entry).catch(() => {});
    if (sbCreds.url && sbCreds.key) { syncFromCloud(sbCreds.url, sbCreds.key); }
  }, [sbCreds]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(() => {
    audit("LOGOUT", {});
    LS.sess(null);
    setSession(null);
    setView("dashboard");
  }, [audit]);

  const can = useCallback((section, action) => {
    if (!session) return false;
    if (session.role === "owner") return true;
    return session.perms?.[section]?.[action] === true;
  }, [session]);

  const [loginAccounts, setLoginAccounts] = useState(accounts);
  useEffect(() => {
    if (!sbCreds.url || !sbCreds.key) { setLoginAccounts(accounts); return; }
    initSB(sbCreds.url, sbCreds.key);
    sbGet("accounts").then(accs => {
      if (Array.isArray(accs) && accs.length > 0) {
        setLoginAccounts(accs); setAccounts(accs); LS.set("opti_accounts", accs);
      } else { setLoginAccounts(accounts); }
    }).catch(() => setLoginAccounts(accounts));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <LoginScreen accounts={loginAccounts} onLogin={login} sbCreds={sbCreds} setSbCreds={setSbCreds} />;

  const sharedProps = {
    session, data, mutate, can, audit, fieldVis,
    onSync: () => syncFromCloud(sbCreds.url, sbCreds.key),
    syncing,
  };

  return (
    <Shell session={session} onLogout={logout} view={view} setView={setView} can={can} sbStatus={sbStatus} syncing={syncing} lastSync={lastSync} onManualSync={() => syncFromCloud(sbCreds.url, sbCreds.key)}>
      {view === "dashboard"    && <Dashboard session={session} data={data} setView={setView} auditLog={auditLog} />}
      {view === "patients"     && <PatientsSection     {...sharedProps} />}
      {view === "patientBill"  && <PatientBillSection  {...sharedProps} />}
      {view === "optometrist"  && <OptometristSection  {...sharedProps} />}
      {view === "opticals"     && <OpticalsSection     {...sharedProps} />}
      {view === "inventory"    && <InventorySection    {...sharedProps} />}
      {view === "invoices"     && <InvoicesSection     {...sharedProps} />}
      {view === "alerts"       && <AlertsSection       {...sharedProps} />}
      {view === "tasks"        && <TasksSection        {...sharedProps} accounts={accounts} />}
      {view === "reminders"    && <RemindersSection    {...sharedProps} />}
      {view === "auditlog"     && session.role === "owner" && <AuditLogSection auditLog={auditLog} accounts={accounts} />}
      {view === "dashbuilder"  && session.role === "owner" && <DashboardBuilder fieldVis={fieldVis} setFieldVis={setFieldVis} accounts={accounts} setAccounts={updateAccounts} />}
      {view === "users"        && session.role === "owner" && <UsersSection accounts={accounts} setAccounts={updateAccounts} audit={audit} />}
      {view === "supabase"     && session.role === "owner" && <SupabaseSection sbCreds={sbCreds} sbStatus={sbStatus} onConnect={connectSupabase} onSync={syncFromSupabase} onPush={pushToSupabase} />}
      {view === "launchguide"  && <LaunchGuide />}
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════════════════
function LoginScreen({ accounts, onLogin, sbCreds, setSbCreds }) {
  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [branch,   setBranch]   = useState(BRANCHES[0]);
  const [err,      setErr]      = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [liveAccs, setLiveAccs] = useState(accounts);
  const [loading,  setLoading]  = useState(false);

  const [showCloud, setShowCloud] = useState(!sbCreds?.url);
  const [cloudUrl,  setCloudUrl]  = useState(sbCreds?.url  || "");
  const [cloudKey,  setCloudKey]  = useState(sbCreds?.key  || "");
  const [cloudMsg,  setCloudMsg]  = useState("");

  const connectCloud = async () => {
    if (!cloudUrl || !cloudKey) { setCloudMsg("Enter both URL and API key."); return; }
    setLoading(true); setCloudMsg("Connecting…");
    const cleanUrl = cloudUrl.replace(/\/$/, "");
    initSB(cleanUrl, cloudKey);
    try {
      const accs = await sbGet("accounts");
      if (Array.isArray(accs) && accs.length > 0) {
        setLiveAccs(accs); setSbCreds({ url: cleanUrl, key: cloudKey });
        LS.set("opti_sb", { url: cleanUrl, key: cloudKey });
        LS.set("opti_accounts", accs);
        setCloudMsg("Connected ✓ — accounts loaded from cloud."); setShowCloud(false);
      } else {
        setSbCreds({ url: cleanUrl, key: cloudKey });
        LS.set("opti_sb", { url: cleanUrl, key: cloudKey });
        setCloudMsg("Connected ✓ (no accounts in cloud yet — using defaults)."); setShowCloud(false);
      }
    } catch(e) { setCloudMsg("Connection failed. Check URL and key."); }
    setLoading(false);
  };

  const doLogin = () => {
    const all = [...liveAccs];
    const acc = all.find(a => a.id === userId.trim() && a.password === password);
    if (!acc) { setErr("Invalid user ID or password."); return; }
    if (acc.role === "staff" && branch && acc.branch !== branch) { setErr(`This account belongs to ${acc.branch}.`); return; }
    onLogin(acc);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{GCSS}</style>
      <div style={{ width: 420, background: "#fff", borderRadius: 24, padding: "42px 38px", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, background: "#1a1714", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 28 }}>👁</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700 }}>OptiManager</div>
          <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 3 }}>v{APP_VER} · Multi-Branch Optical Suite</div>
        </div>

        <div style={{ marginBottom: 18, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sbCreds?.url ? "#16a34a" : "#d97706" }}>{sbCreds?.url ? "☁ Cloud Connected" : "☁ Cloud Not Connected"}</div>
            <button style={{ fontSize: 11, background: "none", border: "none", color: "#6b5e52", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowCloud(s => !s)}>{showCloud ? "Hide" : "Configure"}</button>
          </div>
          {showCloud && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#9b8e82" }}>Enter your Supabase credentials to sync data across devices.</div>
              <input type="text" placeholder="https://xxxx.supabase.co" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} style={{ fontSize: 12 }} />
              <input type="password" placeholder="anon public key (eyJ…)" value={cloudKey} onChange={e => setCloudKey(e.target.value)} style={{ fontSize: 12 }} />
              <button className="btn btn-dark btn-sm" onClick={connectCloud} disabled={loading}>{loading ? "Connecting…" : "Connect to Cloud"}</button>
              {cloudMsg && <div style={{ fontSize: 11, color: cloudMsg.includes("✓") ? "#16a34a" : "#dc2626" }}>{cloudMsg}</div>}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div><label>Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">— Owner Login (no branch) —</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label>User ID</label>
            <input type="text" placeholder="owner / staff_jpt1 / staff_prp1" value={userId} onChange={e => { setUserId(e.target.value); setErr(""); }} />
          </div>
          <div><label>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && doLogin()} style={{ paddingRight: 42 }} />
              <button onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9b8e82", fontSize: 16 }}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>
        </div>
        {err && <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "8px 12px", borderRadius: 8 }}>{err}</div>}
        <button className="btn btn-dark" style={{ width: "100%", marginTop: 18, padding: 12 }} onClick={doLogin}>Login</button>
        <div style={{ marginTop: 18, background: "#faf9f7", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#9b8e82", lineHeight: 1.9 }}>
          <strong style={{ color: "#6b5e52" }}>Demo:</strong> <code style={CS}>owner</code>/<code style={CS}>owner123</code> · <code style={CS}>staff_jpt1</code>/<code style={CS}>jpt1234</code>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHELL
// ════════════════════════════════════════════════════════════════════════
function Shell({ session, onLogout, view, setView, can, sbStatus, syncing, lastSync, onManualSync, children }) {
  const isOwner = session.role === "owner";
  const NAV = [
    { id: "dashboard",    label: "Dashboard",        icon: "⬡", show: true },
    { id: "patients",     label: "OP Registration",  icon: "◉", show: can("patients", "view") },
    { id: "patientBill",  label: "K Sheet Entry",    icon: "🧾", show: can("patientBill", "view") },
    { id: "optometrist",  label: "Optometrist",      icon: "👁", show: can("optometrist", "view") },
    { id: "opticals",     label: "Opticals",         icon: "🔭", show: can("opticals", "view") },
    { id: "inventory",    label: "Inventory",        icon: "▦", show: can("inventory", "view") },
    { id: "invoices",     label: "Sales & Invoices", icon: "◆", show: can("invoices", "view") },
    { id: "alerts",       label: "Low Stock Alerts", icon: "▲", show: can("alerts", "view") },
    { id: "tasks",        label: "Tasks",            icon: "📌", show: true },
    { id: "reminders",    label: "Reminders",        icon: "🔔", show: true },
    { id: "divider" },
    { id: "auditlog",    label: "Audit Log",        icon: "📋", show: isOwner },
    { id: "dashbuilder", label: "Dashboard Builder",icon: "🏗", show: isOwner },
    { id: "users",       label: "Manage Staff",     icon: "👥", show: isOwner },
    { id: "supabase",    label: "Cloud Sync",       icon: "☁", show: isOwner, badge: sbStatus === "error" ? "!" : 0, badgeColor: "#dc2626" },
    { id: "launchguide", label: "Launch Guide",     icon: "🚀", show: true },
  ];

  const sbDot = { ok: "#16a34a", error: "#dc2626", testing: "#d97706", pushing: "#d97706", syncing: "#d97706" }[sbStatus] || "#9b8e82";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f0ede8", color: "#1a1714" }}>
      <style>{GCSS}</style>
      <aside style={{ width: 236, background: "#fff", borderRight: "1px solid #e8e2db", padding: "18px 10px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "0 8px 14px", borderBottom: "1px solid #f0ede8", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>👁 OptiManager</div>
          <div style={{ fontSize: 10, color: "#9b8e82", marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
            v{APP_VER} <span style={{ width: 7, height: 7, borderRadius: "50%", background: sbDot, display: "inline-block" }} title={`Supabase: ${sbStatus}`} />
          </div>
        </div>
        <div style={{ margin: "0 4px 12px", background: "#f0ede8", borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{session.name}</div>
          <div style={{ fontSize: 11, color: "#9b8e82", marginTop: 2 }}>{session.designation || (isOwner ? "Owner" : "Staff")} · {isOwner ? "All Branches" : session.branch}</div>
          {isOwner && <span style={{ display: "inline-block", marginTop: 4, background: "#1a1714", color: "#f0ede8", borderRadius: 20, fontSize: 10, padding: "1px 8px", fontWeight: 700 }}>OWNER</span>}
        </div>
        {NAV.filter(n => n.id === "divider" || n.show).map(n =>
          n.id === "divider"
            ? <div key="div" style={{ margin: "6px 8px", borderTop: "1px solid #f0ede8" }} />
            : <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
                <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
                {n.badge > 0 && <span className="badge" style={{ marginLeft: "auto", background: n.badgeColor || "#e55e3a" }}>{n.badge}</span>}
              </button>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f0ede8" }}>
          <button className="btn btn-outline btn-sm" style={{ width: "100%", marginBottom: 8 }} onClick={onManualSync} disabled={syncing}>
            {syncing ? "⟳ Syncing…" : "⟳ Sync Now"}
          </button>
          {lastSync && <div style={{ fontSize: 10, color: "#b5a99e", textAlign: "center", marginBottom: 8 }}>
            Last sync: {lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>}
          <button className="btn btn-outline btn-sm" style={{ width: "100%" }} onClick={onLogout}>🔒 Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "26px 30px", overflowY: "auto", maxWidth: "calc(100vw - 236px)" }}>{children}</main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════
function Dashboard({ session, data, setView, auditLog }) {
  const isOwner = session.role === "owner";
  const myBranch = session.branch;
  const flt = arr => isOwner ? arr : arr.filter(x => x.branch === myBranch);

  const pts   = flt(data.patients    || []).filter(x => x.status === "approved");
  const bills = flt(data.patientBill || []).filter(x => x.status === "approved");
  const invs  = flt(data.invoices    || []).filter(x => x.approvalStatus === "approved" && x.status === "Paid");
  const rev   = invs.reduce((s, i) => s + (i.items || []).reduce((a, x) => a + x.qty * x.price, 0) - (i.discount || 0), 0);

  const stats = [
    { label: "Patients",          value: pts.length,    color: "#1a1714" },
    { label: "Patient Bills",     value: bills.length,  color: "#1d4ed8" },
    { label: "Revenue (Paid)",    value: currency(rev), color: "#16a34a" },
  ];

  const recentAudit = auditLog.slice(0, 8);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700 }}>Welcome, {session.name} 👋</div>
        <div style={{ fontSize: 13, color: "#9b8e82", marginTop: 3 }}>{isOwner ? "All Branches" : myBranch} · {ts()}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" onClick={s.action} style={{ cursor: s.action ? "pointer" : "default" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9b8e82", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>{s.label}</div>
            <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isOwner ? "1fr 1fr" : "1fr", gap: 18 }}>
        {isOwner && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Branch Overview</div>
            {BRANCHES.map(br => {
              const bPts   = (data.patients    || []).filter(x => x.branch === br && x.status === "approved");
              const bBills = (data.patientBill || []).filter(x => x.branch === br && x.status === "approved");
              return (
                <div key={br} style={{ padding: "10px 0", borderBottom: "1px solid #f0ede8" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{br}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["Patients", bPts.length, "#1a1714"], ["Bills", bBills.length, "#1d4ed8"]].map(([l, v, c]) => (
                      <div key={l} style={{ flex: 1, background: "#f0ede8", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#9b8e82", fontWeight: 600 }}>{l}</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {isOwner && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Recent Activity</div>
            {recentAudit.length === 0 && <div style={{ fontSize: 13, color: "#9b8e82" }}>No activity yet.</div>}
            {recentAudit.map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0ede8", fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, marginRight: 6, color: { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", ADD: "#16a34a", DELETE: "#dc2626" }[a.action] || "#1a1714" }}>{a.action}</span>
                  <span style={{ color: "#6b5e52" }}>{a.userName}</span>
                  {a.branch !== "All" && <span style={{ color: "#b5a99e", marginLeft: 5 }}>· {a.branch}</span>}
                </div>
                <div style={{ color: "#b5a99e", fontSize: 11 }}>{a.at}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════
// AUDIT LOG  (Owner only)
// ════════════════════════════════════════════════════════════════════════
function AuditLogSection({ auditLog, accounts }) {
  const [filter, setFilter] = useState("ALL");
  const [userF,  setUserF]  = useState("ALL");
  const actions = ["ALL", "LOGIN", "LOGOUT", "ADD", "EDIT", "DELETE"];
  const filtered = auditLog
    .filter(a => filter === "ALL" || a.action === filter)
    .filter(a => userF  === "ALL" || a.userId === userF);

  const actionColor = { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", ADD: "#16a34a", EDIT: "#d97706", DELETE: "#dc2626" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="section-title">Audit Log</div>
        <button className="btn btn-outline btn-sm" onClick={() => exportCSV(filtered.map(({ id, ...r }) => r), "audit_log.csv")}>⬇ CSV</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {actions.map(a => <button key={a} className={`btn btn-sm ${filter === a ? "btn-dark" : "btn-outline"}`} onClick={() => setFilter(a)}>{a}</button>)}
        </div>
        <select value={userF} onChange={e => setUserF(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="ALL">All Users</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Branch</th><th>Detail</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ color: "#9b8e82", textAlign: "center", padding: 24 }}>No entries.</td></tr>}
            {filtered.map(a => (
              <tr key={a.id}>
                <td style={{ fontSize: 11, whiteSpace: "nowrap", color: "#9b8e82" }}>{a.at}</td>
                <td><span style={{ background: `${actionColor[a.action] || "#9b8e82"}20`, color: actionColor[a.action] || "#9b8e82", borderRadius: 20, fontSize: 11, padding: "2px 9px", fontWeight: 700 }}>{a.action}</span></td>
                <td style={{ fontWeight: 600 }}>{a.userName}</td>
                <td style={{ fontSize: 12, color: "#9b8e82" }}>{a.branch}</td>
                <td style={{ fontSize: 12, color: "#6b5e52" }}>{Object.entries(a.detail || {}).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DASHBOARD BUILDER  (Owner controls field visibility + staff perms)
// ════════════════════════════════════════════════════════════════════════
function DashboardBuilder({ fieldVis, setFieldVis, accounts, setAccounts }) {
  const [tab, setTab] = useState("fields");
  const [section, setSection] = useState("patients");

  const ALL_FIELDS = {
    patients:    ["timestamp","date","time","mrNo","patientId","name","phone","address","ref","paymentAmount","paymentMode","paymentRefNo","branch","remarks","visitType"],
    patientBill: ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory"],
    optometrist: ["timestamp","mrNo","patientId","name","complaint","pastHistory"],
    opticals:    ["timestamp","mrNo","patientId","name","phone","address","totalPrice","advance","advancePaymentMethod","transactionId","balance","optomName"],
    inventory:   ["sku","name","category","brand","qty","reorder","lensPower","lensType","boxNo","cost","price","location"],
    invoices:    ["id","date","patientName","items","discount","status"],
  };

  const toggleField = (sec, field) => {
    setFieldVis(fv => {
      const cur = fv[sec] || [];
      return { ...fv, [sec]: cur.includes(field) ? cur.filter(f => f !== field) : [...cur, field] };
    });
  };

  const staff = accounts.filter(a => a.role === "staff");
  const togglePerm = (id, sec, action) => {
    setAccounts(prev => prev.map(a => {
      if (a.id !== id) return a;
      return { ...a, perms: { ...a.perms, [sec]: { ...a.perms[sec], [action]: !a.perms[sec]?.[action] } } };
    }));
  };

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dashboard Builder</div>
      <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 20 }}>Control which fields and sections each staff member can access.</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[{ id: "fields", label: "🔲 Field Visibility" }, { id: "perms", label: "🔐 Staff Permissions" }].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? "btn-dark" : "btn-outline"}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "fields" && (
        <div className="card">
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {Object.keys(ALL_FIELDS).map(s => <button key={s} className={`btn btn-sm ${section === s ? "btn-dark" : "btn-outline"}`} onClick={() => setSection(s)}>{SECTION_LABELS[s]}</button>)}
          </div>
          <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 14 }}>Toggle which fields are <strong>visible in forms and tables</strong> for the <strong>{SECTION_LABELS[section]}</strong> section. Disabled fields are hidden from staff.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
            {(ALL_FIELDS[section] || []).map(field => {
              const on = (fieldVis[section] || []).includes(field);
              return (
                <div key={field} onClick={() => toggleField(section, field)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${on ? "#1a1714" : "#e2ddd8"}`, background: on ? "#1a1714" : "#fff", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? "#f0ede8" : "#1a1714" }}>{field}</span>
                  <span style={{ fontSize: 18 }}>{on ? "✓" : "○"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "perms" && (
        <div>
          {staff.length === 0 && <div className="card" style={{ color: "#9b8e82", textAlign: "center", padding: 32 }}>No staff accounts yet. Add staff in Manage Staff.</div>}
          {staff.map(acc => (
            <div key={acc.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name} <span style={{ fontSize: 12, fontWeight: 400, color: "#6b5e52", background: "#f0ede8", padding: "2px 8px", borderRadius: 12, marginLeft: 6 }}>{acc.designation}</span></div>
                  <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 4 }}>{acc.id} · {acc.branch}</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead><tr><th>Section</th><th style={{ textAlign: "center" }}>👁 View</th><th style={{ textAlign: "center" }}>➕ Add</th><th style={{ textAlign: "center" }}>✏️ Edit</th></tr></thead>
                  <tbody>
                    {SECTIONS.map(sec => (
                      <tr key={sec}>
                        <td style={{ fontWeight: 600 }}>{SECTION_LABELS[sec]}</td>
                        {["view", "add", "edit"].map(action => (
                          <td key={action} style={{ textAlign: "center" }}>
                            <button onClick={() => togglePerm(acc.id, sec, action)}
                              style={{ width: 36, height: 28, borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: acc.perms?.[sec]?.[action] ? "#dcfce7" : "#fee2e2", color: acc.perms?.[sec]?.[action] ? "#16a34a" : "#dc2626" }}>
                              {acc.perms?.[sec]?.[action] ? "✓" : "✗"}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// OP REGISTRATION  (was "Patients")
// MR No and Patient ID are Auto-Generated and Read-Only.
// Direct writes to database for any user with 'add' permission.
// ════════════════════════════════════════════════════════════════════════
function PatientsSection({ session, data, mutate, can, audit, fieldVis, onSync, syncing }) {
  const isOwner  = session.role === "owner";
  const branch   = session.branch || "JPT Branch";

  const rows = (data.patients || []).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [msg,   setMsg]   = useState("");
  const [search,setSearch]= useState("");
  const [dupWarning, setDupWarning] = useState(null);

  // Generate next sequential MR No and Patient ID
  const nextMrNo = () => {
    const all = data.patients || [];
    const nums = all.map(p => parseInt((p.mrNo || "").replace(/\D/g,""))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `MR-${String(next).padStart(3,"0")}`;
  };
  const nextPatientId = () => {
    const all = data.patients || [];
    const nums = all.map(p => parseInt((p.patientId || "").replace(/\D/g,""))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `PT-${String(next).padStart(4,"0")}`;
  };

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo: nextMrNo(), patientId: nextPatientId(),
    name: "", phone: "", address: "",
    ref: "", paymentAmount: "", paymentMode: "Cash", paymentRefNo: "",
    branch: isOwner ? "JPT Branch" : branch,
    remarks: "", visitType: "New Patient", visitCount: 1,
  });

  const F = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setDupWarning(null); };
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  // Duplicate detection
  const checkDuplicate = (f) => {
    const all = data.patients || [];
    if (f.phone && f.phone.length === 10) {
      const match = all.find(p => p.phone === f.phone && p.id !== f.id);
      if (match) return { patient: match, reason: `Phone ${f.phone} already registered` };
    }
    return null;
  };

  const handlePhoneBlur = () => {
    setTouch(t => ({ ...t, phone: true }));
    const dup = checkDuplicate(form);
    if (dup) {
      const p = dup.patient;
      const newCount = (p.visitCount || 1) + 1;
      setDupWarning({ msg: `⚠ Existing patient found: ${p.name} (${p.patientId || p.mrNo}) — Visit #${newCount}`, patient: p, visitCount: newCount });
      setForm(f => ({ ...f, visitType: newCount === 2 ? "2nd Visit" : newCount === 3 ? "3rd Visit" : `${newCount}th Visit`, visitCount: newCount }));
    }
  };

  const submit = () => {
    setTouch({ phone: true, name: true, address: true });
    if (!validate.phone(form.phone) || !form.name.trim() || !form.address.trim()) { setMsg("Fill required fields correctly."); return; }
    
    // Direct submission for all allowed roles
    const record = { id: uid(), ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patients", arr => [...arr, record], record);
    audit("ADD", { type: "patients", name: form.name });
    setModal(false);
    setMsg("Patient registered successfully.");
  };

  const del = id => { if (confirm("Delete patient?")) { mutate("patients", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type: "patients", id }); } };

  const filtered = rows.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  const visitColor = v => ({ "New Patient":"#16a34a","2nd Visit":"#1d4ed8","3rd Visit":"#7c3aed" }[v] || "#d97706");

  return (
    <div>
      <SectionHeader title="OP Registration" onSync={onSync} syncing={syncing}
        onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "op_registration.csv")}
        onAdd={can("patients","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setDupWarning(null); setModal(true); } : null}
        msg={msg} />

      {/* Search bar */}
      <div style={{ marginBottom: 12 }}>
        <input type="text" placeholder="🔍 Search by name, phone, MR No, Patient ID…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: 420, borderRadius: 10, border: "1px solid #e8e2db", padding: "8px 14px", fontSize: 13 }} />
      </div>

      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr>
            <th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th>
            <th>Address</th><th>Payment</th><th>Amount</th><th>Ref/Camp</th>
            <th>Visit</th><th>Branch</th><th>Remarks</th>
            {isOwner && <th></th>}
          </tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11, whiteSpace:"nowrap", color:"#9b8e82" }}>{r.timestamp}</td>
              <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo}</td>
              <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{r.patientId}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td>
              <td>{r.phone}</td>
              <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.address}</td>
              <td><span className="tag tag-blue">{r.paymentMode}</span></td>
              <td style={{ fontWeight:600 }}>{r.paymentAmount ? `₹${r.paymentAmount}` : "—"}</td>
              <td style={{ fontSize:12, color:"#9b8e82" }}>{r.ref || "—"}</td>
              <td><span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, fontWeight:700, background:`${visitColor(r.visitType)}20`, color:visitColor(r.visitType) }}>{r.visitType || "New Patient"}</span></td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              <td style={{ fontSize:12, color:"#9b8e82", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>{r.remarks || "—"}</td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modal && (
        <Modal title="OP Registration" onClose={() => setModal(false)} onSave={submit}
          saveLabel="Save Registration" wide>
          {dupWarning && (
            <div style={{ marginBottom:14, background:"#fef9c3", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#a16207", fontWeight:600 }}>
              {dupWarning.msg}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <div><label>Timestamp (Auto)</label><input type="text" value={form.timestamp} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
            <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
            <div><label>MR No (Auto Generated)</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82", fontWeight: 700 }} /></div>
            <div><label>Patient ID (Auto Generated)</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82", fontWeight: 700 }} /></div>
            <div><label>Visit Type</label>
              <select value={form.visitType} onChange={F("visitType")}>
                {["New Patient","2nd Visit","3rd Visit","4th Visit","5th Visit","Review"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label>
              <input type="text" value={form.name} onChange={F("name")} onBlur={T("name")}
                style={vStyle(form.name, v => v.trim().length > 0, touch.name)} />
              {vMsg(form.name, v => v.trim().length > 0, touch.name, "Required.")}
            </div>
            <div><label>Phone * (10 digits)</label>
              <input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={handlePhoneBlur}
                style={vStyle(form.phone, validate.phone, touch.phone)} />
              {vMsg(form.phone, validate.phone, touch.phone, "10 digits, not starting 0.")}
            </div>
            <div style={{ gridColumn:"span 2" }}><label>Address *</label>
              <input type="text" value={form.address} onChange={F("address")} onBlur={T("address")}
                style={vStyle(form.address, v => v.trim().length > 0, touch.address)} />
              {vMsg(form.address, v => v.trim().length > 0, touch.address, "Required.")}
            </div>
            <div><label>Ref / Camp</label><input type="text" placeholder="Camp name or referrer" value={form.ref} onChange={F("ref")} /></div>
            <div><label>Payment Amount (₹)</label><input type="number" value={form.paymentAmount} onChange={F("paymentAmount")} /></div>
            <div><label>Payment Mode</label>
              <select value={form.paymentMode} onChange={F("paymentMode")}>
                {["Cash","UPI","Card","Cheque","Free","Camp"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {(form.paymentMode === "UPI" || form.paymentMode === "Card" || form.paymentMode === "Cheque") && (
              <div><label>Payment Ref No</label><input type="text" placeholder="Transaction / Cheque No" value={form.paymentRefNo} onChange={F("paymentRefNo")} /></div>
            )}
            {isOwner && (
              <div><label>Branch</label>
                <select value={form.branch} onChange={F("branch")}>
                  {["JPT Branch","PRP Branch"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn:"1/-1" }}><label>Remarks</label>
              <textarea rows={2} value={form.remarks} onChange={F("remarks")} placeholder="Any remarks…" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// K SHEET ENTRY  (was "Patient Bill")
// MR No and Patient ID are read-only and must be populated via lookup.
// Direct writes to database.
// ════════════════════════════════════════════════════════════════════════
function PatientBillSection({ session, data, mutate, can, audit, fieldVis, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.patientBill || []).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [tab,   setTab]   = useState("basic");
  const [msg,   setMsg]   = useState("");
  const [search,setSearch]= useState("");
  const [mrLookup, setMrLookup] = useState("");

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const found = (data.patients || []).find(p =>
      p.mrNo?.toLowerCase() === query.toLowerCase() ||
      p.patientId?.toLowerCase() === query.toLowerCase() ||
      p.phone === query
    );
    if (found) {
      setForm(f => ({
        ...f,
        mrNo: found.mrNo || f.mrNo,
        patientId: found.patientId || f.patientId,
        name: found.name,
        phone: found.phone,
        address: found.address || found.town || "",
      }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else {
      setMrLookup("No match found in OP Registration.");
    }
  };

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo: "", patientId: "",
    name: "", phone: "", address: "", gender: "Male", age: "",
    complaint: "", pastHistory: "",
    reSpherAR:"", reCylAR:"", reAxisAR:"", leSpherAR:"", leCylAR:"", leAxisAR:"",
    reSpherSub:"", reCylSub:"", reAxisSub:"", leSpherSub:"", leCylSub:"", leAxisSub:"",
    add:"", eyelids:"", conjunctiva:"", cornea:"", anteriorChamber:"", iris:"", pupil:"",
    lens:"", ocularMovements:"", fundus:"", advice:"", optom:"",
    lensType:"Single Vision", frameNo:"", advance:"", paymentMethod:"Cash",
    deliveryStatus:"Not Ready", balance:"",
  });

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  const rxField = (label, key, validator, msg2) => (
    <div key={key}><label>{label}</label>
      <input type="number" step="0.25" value={form[key]||""} onChange={F(key)} onBlur={T(key)}
        style={vStyle(form[key], validator, touch[key])} />
      {vMsg(form[key], validator, touch[key], msg2)}
    </div>
  );

  const submit = () => {
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form,
      status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patientBill", arr => [...arr, record], record); 
    audit("ADD",{type:"patientBill",name:form.name}); 
    setModal(false); setMsg("K Sheet saved successfully.");
  };

  const del = id => { if (confirm("Delete K Sheet?")) { mutate("patientBill", arr => arr.filter(x => x.id!==id)); audit("DELETE",{type:"patientBill",id}); } };

  const TABS = [
    { id:"basic",   label:"Patient Info" },
    { id:"ar",      label:"AR Readings" },
    { id:"sub",     label:"Subjective" },
    { id:"eye",     label:"Eye Exam" },
    { id:"billing", label:"Billing" },
  ];

  const filtered = rows.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader title="K Sheet Entry" onSync={onSync} syncing={syncing}
        onExport={() => exportCSV(rows.map(({id,...r})=>r), "k_sheet.csv")}
        onAdd={can("patientBill","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setTab("basic"); setMrLookup(""); setModal(true); } : null}
        msg={msg} />
      <div style={{ marginBottom:12 }}>
        <input type="text" placeholder="🔍 Search by name, phone, MR No, Patient ID…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:"100%", maxWidth:420, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} />
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr>
            <th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th>
            <th>Gender</th><th>Age</th><th>Lens Type</th><th>Delivery</th><th>Balance</th><th>By</th><th>Branch</th>
            {isOwner && <th></th>}
          </tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11, color:"#9b8e82", whiteSpace:"nowrap" }}>{r.timestamp}</td>
              <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo}</td>
              <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{r.patientId || "—"}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td>
              <td>{r.phone}</td>
              <td>{r.gender}</td>
              <td>{r.age}</td>
              <td><span className="tag tag-blue">{r.lensType}</span></td>
              <td><span className={`tag ${r.deliveryStatus==="Delivered"?"tag-green":r.deliveryStatus==="Not Ready"?"tag-red":"tag-yellow"}`}>
                {r.deliveryStatus==="Fixing Completed But Not Delivered"?"Fixing Done":r.deliveryStatus}
              </span></td>
              <td style={{ fontWeight:700 }}>{currency(r.balance)}</td>
              <td style={{ fontSize:11, color:"#9b8e82" }}>{r.createdByName||"—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="K Sheet Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save K Sheet" xl>
          <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
            {TABS.map(t => <button key={t.id} className={`btn btn-sm ${tab===t.id?"btn-dark":"btn-outline"}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
          </div>
          {tab==="basic" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1", background:"#f0ede8", borderRadius:10, padding:"12px 14px" }}>
                <label style={{ fontWeight:700 }}>🔗 Link to OP Registration (MR No / Patient ID / Phone)</label>
                <div style={{ display:"flex", gap:8, marginTop:6 }}>
                  <input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""}
                    onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} />
                  <button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button>
                </div>
                {mrLookup && <div style={{ fontSize:12, marginTop:6, color: mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}
              </div>
              <div><label>MR No (Read Only)</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82", fontWeight: 700 }} /></div>
              <div><label>Patient ID (Read Only)</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82", fontWeight: 700 }} /></div>
              <div><label>Timestamp (Auto)</label><input type="text" value={form.timestamp} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
              <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
              <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
              <div style={{ gridColumn:"span 3" }}></div>
              <div style={{ gridColumn:"span 2" }}><label>Name *</label>
                <input type="text" value={form.name} onChange={F("name")} onBlur={T("name")}
                  style={vStyle(form.name, v=>v.trim().length>0, touch.name)} />
                {vMsg(form.name,v=>v.trim().length>0,touch.name,"Required.")}
              </div>
              <div><label>Phone * (10 digits)</label>
                <input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={T("phone")}
                  style={vStyle(form.phone, validate.phone, touch.phone)} />
                {vMsg(form.phone,validate.phone,touch.phone,"10 digits.")}
              </div>
              <div style={{ gridColumn:"1/-1" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
              <div><label>Gender</label>
                <select value={form.gender} onChange={F("gender")}><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
              <div><label>Age</label><input type="number" value={form.age} onChange={F("age")} /></div>
              <div></div>
              <div style={{ gridColumn:"span 2" }}><label>Complaint</label><textarea rows={2} value={form.complaint} onChange={F("complaint")} /></div>
              <div style={{ gridColumn:"1/-1" }}><label>Past History</label><textarea rows={2} value={form.pastHistory} onChange={F("pastHistory")} /></div>
            </div>
          )}
          {tab==="ar" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Right Eye (RE) — AR</div>
                {rxField("Spherical","reSpherAR",validate.sphereCyl,"-6 to +6, steps 0.25")}
                {rxField("Cylinder","reCylAR",validate.sphereCyl,"-6 to +6, steps 0.25")}
                {rxField("Axis","reAxisAR",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Left Eye (LE) — AR</div>
                {rxField("Spherical","leSpherAR",validate.sphereCyl,"-6 to +6, steps 0.25")}
                {rxField("Cylinder","leCylAR",validate.sphereCyl,"-6 to +6, steps 0.25")}
                {rxField("Axis","leAxisAR",validate.axis,"0–180")}
              </div>
            </div>
          )}
          {tab==="sub" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Right Eye (RE) — Subjective</div>
                {rxField("Spherical","reSpherSub",validate.sphereCyl,"-6 to +6")}
                {rxField("Cylinder","reCylSub",validate.sphereCyl,"-6 to +6")}
                {rxField("Axis","reAxisSub",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Left Eye (LE) — Subjective</div>
                {rxField("Spherical","leSpherSub",validate.sphereCyl,"-6 to +6")}
                {rxField("Cylinder","leCylSub",validate.sphereCyl,"-6 to +6")}
                {rxField("Axis","leAxisSub",validate.axis,"0–180")}
              </div>
              <div style={{ maxWidth:220 }}>
                <label>ADD (Subjective)</label>
                <input type="number" step="0.25" value={form.add||""} onChange={F("add")} onBlur={T("add")}
                  style={vStyle(form.add,v=>!v||validate.add(v),touch.add)} />
                {vMsg(form.add,v=>!v||validate.add(v),touch.add,"0 or 0.75–3.00 in steps 0.25")}
              </div>
            </div>
          )}
          {tab==="eye" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              {["eyelids","conjunctiva","cornea","anteriorChamber","iris","pupil","lens","ocularMovements","fundus"].map(k => (
                <div key={k}><label>{k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</label>
                  <input type="text" value={form[k]||""} onChange={F(k)} /></div>
              ))}
              <div style={{ gridColumn:"1/-1" }}><label>Advice</label><textarea rows={2} value={form.advice} onChange={F("advice")} /></div>
              <div style={{ gridColumn:"span 2" }}><label>Optometrist / Ophthalmologist</label><input type="text" value={form.optom} onChange={F("optom")} /></div>
            </div>
          )}
          {tab==="billing" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1" }}><label>Lens Type</label>
                <select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l=><option key={l}>{l}</option>)}</select>
              </div>
              <div><label>Frame No</label><input type="text" value={form.frameNo} onChange={F("frameNo")} /></div>
              <div><label>Advance (₹)</label><input type="number" value={form.advance} onChange={F("advance")} /></div>
              <div><label>Payment Method</label>
                <select value={form.paymentMethod} onChange={F("paymentMethod")}><option>Cash</option><option>UPI</option><option>Card</option></select>
              </div>
              <div style={{ gridColumn:"1/-1" }}><label>Delivery Status</label>
                <select value={form.deliveryStatus} onChange={F("deliveryStatus")}>{DELIVERY_STATUS.map(d=><option key={d}>{d}</option>)}</select>
              </div>
              <div><label>Balance (₹)</label><input type="number" value={form.balance} onChange={F("balance")} /></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// OPTOMETRIST / OPTOM SECTION
// ════════════════════════════════════════════════════════════════════════
function OptometristSection({ session, data, mutate, can, audit, fieldVis, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.optometrist || []).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [mrLookup, setMrLookup] = useState("");
  const [search, setSearch] = useState("");

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo:"", patientId:"", name:"", phone:"",
    complaint:"", pastHistory:"",
    optomName: session.name,
  });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    const found = (data.patients || []).find(p =>
      p.mrNo?.toLowerCase() === query.toLowerCase() ||
      p.patientId?.toLowerCase() === query.toLowerCase() ||
      p.phone === query
    );
    if (found) {
      const ksheet = (data.patientBill || []).find(b =>
        b.mrNo === found.mrNo || b.patientId === found.patientId
      );
      setForm(f => ({ ...f,
        mrNo: found.mrNo || "", patientId: found.patientId || "",
        name: found.name, phone: found.phone,
        complaint: ksheet?.complaint || f.complaint,
        pastHistory: ksheet?.pastHistory || f.pastHistory,
      }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else {
      setMrLookup("No match found.");
    }
  };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name required."); return; }
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form,
      status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("optometrist", arr=>[...arr, record], record); 
    setModal(false); setMsg("Saved successfully.");
  };

  const del = id => { if (confirm("Delete?")) { mutate("optometrist", arr=>arr.filter(x=>x.id!==id)); audit("DELETE",{type:"optometrist",id}); } };

  const filtered = rows.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.mrNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader title="Optometrist" onSync={onSync} syncing={syncing}
        onExport={() => exportCSV(rows.map(({id,...r})=>r),"optometrist.csv")}
        onAdd={can("optometrist","add") ? () => { setForm(blank()); setMsg(""); setMrLookup(""); setModal(true); } : null}
        msg={msg} />
      <div style={{ marginBottom:12 }}>
        <input type="text" placeholder="🔍 Search by name, MR No, Patient ID…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:"100%", maxWidth:420, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} />
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Complaint</th><th>Past History</th><th>Optometrist</th><th>Branch</th>{isOwner&&<th></th>}</tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11,color:"#9b8e82",whiteSpace:"nowrap" }}>{r.timestamp}</td>
              <td style={{ fontWeight:700,fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontFamily:"monospace",color:"#1d4ed8" }}>{r.patientId||"—"}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td>
              <td>{r.phone}</td>
              <td style={{ maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.complaint||"—"}</td>
              <td style={{ maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.pastHistory||"—"}</td>
              <td style={{ fontSize:12,color:"#9b8e82" }}>{r.optomName||"—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8",color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Optometrist Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save Entry">
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
            <label style={{ fontWeight:700 }}>🔗 Look Up Patient (MR No / Patient ID / Phone)</label>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""}
                onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} />
              <button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button>
            </div>
            {mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><label>MR No (Read Only)</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div><label>Patient ID (Read Only)</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div><label>Name *</label><input type="text" value={form.name} onChange={F("name")} /></div>
            <div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Complaint</label><textarea rows={3} value={form.complaint} onChange={F("complaint")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Past History</label><textarea rows={3} value={form.pastHistory} onChange={F("pastHistory")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Optometrist Name</label><input type="text" value={form.optomName} onChange={F("optomName")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// OPTICALS SECTION
// ════════════════════════════════════════════════════════════════════════
function OpticalsSection({ session, data, mutate, can, audit, fieldVis, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.opticals || []).filter(x => (isOwner || x.branch === branch));

  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [msg,      setMsg]      = useState("");
  const [rxPreview,setRxPreview]= useState(null);
  const [mrLookup, setMrLookup] = useState("");
  const [search,   setSearch]   = useState("");

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo:"", patientId:"", name:"", phone:"", address:"",
    totalPrice:"", advance:"", advancePaymentMethod:"Cash",
    transactionId:"", balance:"",
    optomName: session.name,
  });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const foundOp = (data.patients || []).find(p =>
      p.mrNo?.toLowerCase() === query.toLowerCase() ||
      p.patientId?.toLowerCase() === query.toLowerCase() ||
      p.phone === query
    );
    if (!foundOp) { setMrLookup("No patient found in OP Registration."); return; }

    const ksheet = (data.patientBill || []).find(b =>
      b.mrNo === foundOp.mrNo || b.patientId === foundOp.patientId
    );

    setForm(f => ({ ...f,
      mrNo: foundOp.mrNo || "", patientId: foundOp.patientId || "",
      name: foundOp.name, phone: foundOp.phone, address: foundOp.address || "",
    }));

    if (ksheet) {
      setRxPreview({
        RE: `${ksheet.reSpherSub||"—"} / ${ksheet.reCylSub||"—"} × ${ksheet.reAxisSub||"—"}`,
        LE: `${ksheet.leSpherSub||"—"} / ${ksheet.leCylSub||"—"} × ${ksheet.leAxisSub||"—"}`,
        ADD: ksheet.add || "—",
        lensType: ksheet.lensType || "—",
        frameNo: ksheet.frameNo || "—",
      });
      setMrLookup(`✓ Found: ${foundOp.name} (${foundOp.patientId}) — K Sheet loaded`);
    } else {
      setRxPreview(null);
      setMrLookup(`✓ Found: ${foundOp.name} — No K Sheet found yet`);
    }
  };

  const calcBalance = () => {
    const total = parseFloat(form.totalPrice) || 0;
    const adv   = parseFloat(form.advance)    || 0;
    setForm(f => ({ ...f, balance: String(Math.max(0, total - adv)) }));
  };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name required."); return; }
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form,
      status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("opticals", arr=>[...arr, record], record); 
    setModal(false); setMsg("Opticals saved successfully.");
  };

  const del = id => { if (confirm("Delete?")) { mutate("opticals", arr=>arr.filter(x=>x.id!==id)); audit("DELETE",{type:"opticals",id}); } };

  const filtered = rows.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.mrNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader title="Opticals" onSync={onSync} syncing={syncing}
        onExport={() => exportCSV(rows.map(({id,...r})=>r),"opticals.csv")}
        onAdd={can("opticals","add") ? () => { setForm(blank()); setMsg(""); setRxPreview(null); setMrLookup(""); setModal(true); } : null}
        msg={msg} />
      <div style={{ marginBottom:12 }}>
        <input type="text" placeholder="🔍 Search by name, MR No, Patient ID…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:"100%", maxWidth:420, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} />
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr>
            <th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th>
            <th>Total Price</th><th>Advance</th><th>Balance</th><th>Adv. Method</th><th>Txn ID</th>
            <th>Rep</th><th>Branch</th>{isOwner&&<th></th>}
          </tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11,color:"#9b8e82",whiteSpace:"nowrap" }}>{r.timestamp}</td>
              <td style={{ fontWeight:700,fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontFamily:"monospace",color:"#1d4ed8" }}>{r.patientId||"—"}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td>
              <td>{r.phone}</td>
              <td style={{ fontWeight:700 }}>{r.totalPrice?`₹${r.totalPrice}`:"—"}</td>
              <td>{r.advance?`₹${r.advance}`:"—"}</td>
              <td style={{ fontWeight:700,color:parseFloat(r.balance)>0?"#dc2626":"#16a34a" }}>{r.balance?`₹${r.balance}`:"—"}</td>
              <td><span className="tag tag-blue">{r.advancePaymentMethod||"—"}</span></td>
              <td style={{ fontSize:11,fontFamily:"monospace",color:"#9b8e82" }}>{r.transactionId||"—"}</td>
              <td style={{ fontSize:11,color:"#9b8e82" }}>{r.optomName||"—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8",color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Opticals Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save Entry" wide>
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
            <label style={{ fontWeight:700 }}>🔗 Link to Patient (MR No / Patient ID / Phone)</label>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""}
                onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} />
              <button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up & Fill</button>
            </div>
            {mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}
          </div>
          {rxPreview && (
            <div style={{ background:"#e0f2fe",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13 }}>
              <div style={{ fontWeight:700,marginBottom:8,color:"#0369a1" }}>📋 Prescription from K Sheet (auto-filled)</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, fontFamily:"monospace" }}>
                <div><span style={{ color:"#9b8e82",fontSize:11 }}>RE</span><br/>{rxPreview.RE}</div>
                <div><span style={{ color:"#9b8e82",fontSize:11 }}>LE</span><br/>{rxPreview.LE}</div>
                <div><span style={{ color:"#9b8e82",fontSize:11 }}>ADD</span><br/>{rxPreview.ADD}</div>
                <div><span style={{ color:"#9b8e82",fontSize:11 }}>Lens Type</span><br/>{rxPreview.lensType}</div>
                <div><span style={{ color:"#9b8e82",fontSize:11 }}>Frame No</span><br/>{rxPreview.frameNo}</div>
              </div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <div><label>MR No (Read Only)</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div><label>Patient ID (Read Only)</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div></div>
            <div style={{ gridColumn:"span 2" }}><label>Name</label><input type="text" value={form.name} onChange={F("name")} /></div>
            <div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
            <div><label>Total Price (₹) *</label><input type="number" value={form.totalPrice} onChange={F("totalPrice")} onBlur={calcBalance} /></div>
            <div><label>Advance (₹)</label><input type="number" value={form.advance} onChange={F("advance")} onBlur={calcBalance} /></div>
            <div><label>Balance (₹) (auto)</label><input type="number" value={form.balance} readOnly style={{ background:"#f0ede8" }} /></div>
            <div><label>Advance Payment Method</label>
              <select value={form.advancePaymentMethod} onChange={F("advancePaymentMethod")}>
                {["Cash","UPI","Card","Cheque","NA"].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            {(form.advancePaymentMethod==="UPI"||form.advancePaymentMethod==="Card"||form.advancePaymentMethod==="Cheque") && (
              <div><label>Transaction ID / Ref No</label><input type="text" placeholder="Txn / Cheque ref" value={form.transactionId} onChange={F("transactionId")} /></div>
            )}
            <div><label>Representative Name</label><input type="text" value={form.optomName} onChange={F("optomName")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════════════════════════════════
function InventorySection({ session, data, mutate, can, audit, fieldVis, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.stock || []).filter(x => isOwner || x.branch === branch);
  const [search, setSearch] = useState(""); const [cat, setCat] = useState("All");
  const [modal,  setModal]  = useState(null); const [msg, setMsg] = useState("");
  const blank = { sku: "", name: "", category: "Frames", brand: "", qty: 0, reorder: 5, cost: 0, price: 0, location: "", lensPower: "", lensType: "Single Vision", boxNo: "" };
  const [form, setForm] = useState(blank);
  const cats = ["All", "Frames", "Contact Lenses", "Lenses", "Accessories"];
  const filtered = rows.filter(s => (cat === "All" || s.category === cat) && (s.name.toLowerCase().includes(search.toLowerCase()) || s.sku.toLowerCase().includes(search.toLowerCase())));
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  
  const open = s => { setForm(s ? { ...s } : { ...blank, branch: isOwner ? "JPT Branch" : branch }); setModal(s || "add"); };
  
  const save = () => {
    const item = { ...form, qty: Number(form.qty), reorder: Number(form.reorder), cost: Number(form.cost), price: Number(form.price) };
    if (modal === "add") {
      const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...item, createdBy: session.id, createdByName: session.name };
      mutate("stock", arr => [...arr, record], record); 
      audit("ADD", { type: "stock", sku: item.sku }); 
    } else {
      const updated = { ...modal, ...item }; 
      mutate("stock", arr => arr.map(x => x.id === modal.id ? updated : x), updated); 
      audit("EDIT", { type: "stock", id: modal.id }); 
    }
    setModal(null);
  };
  
  return (
    <div>
      <SectionHeader title="Inventory" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "inventory.csv")} onAdd={can("inventory", "add") ? () => open(null) : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{cats.map(c => <button key={c} className={`btn btn-sm ${cat === c ? "btn-dark" : "btn-outline"}`} onClick={() => setCat(c)}>{c}</button>)}</div>
        </div>
        <table><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Qty</th><th>Lens Power</th><th>Lens Type</th><th>Box No</th><th>Price</th><th>Location</th><th>Branch</th><th>By</th>{(can("inventory", "edit") || isOwner) && <th></th>}</tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id}>
              <td style={{ fontFamily: "monospace", fontSize: 11 }}>{s.sku}</td>
              <td style={{ fontWeight: 600 }}>{s.name}</td>
              <td><span className="tag tag-blue">{s.category}</span></td>
              <td><span style={{ fontWeight: 700, color: s.qty <= s.reorder ? "#dc2626" : "#16a34a" }}>{s.qty}</span></td>
              <td style={{ fontFamily: "monospace" }}>{s.lensPower || "—"}</td>
              <td>{s.lensType && s.category === "Lenses" ? <span className="tag tag-blue">{s.lensType}</span> : "—"}</td>
              <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.boxNo || "—"}</td>
              <td style={{ fontWeight: 600 }}>{currency(s.price)}</td>
              <td style={{ fontSize: 12, color: "#9b8e82" }}>{s.location}</td>
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{s.branch}</span></td>
              <td style={{ fontSize: 11, color: "#9b8e82" }}>{s.createdByName || "—"}</td>
              {(can("inventory", "edit") || isOwner) && (
                <td style={{ display: "flex", gap: 5 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => open(s)}>Edit</button>
                  {isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) { mutate("stock", arr => arr.filter(x => x.id !== s.id)); audit("DELETE", { type: "stock", id: s.id }); } }}>✕</button>}
                </td>
              )}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Stock Item" : "Edit Stock Item"} onClose={() => setModal(null)} onSave={save} saveLabel="Save Inventory">
          <div className="form-grid">
            <div><label>SKU</label><input type="text" value={form.sku} onChange={F("sku")} /></div>
            <div><label>Category</label><select value={form.category} onChange={F("category")}>{["Frames", "Contact Lenses", "Lenses", "Accessories"].map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="full"><label>Name</label><input type="text" value={form.name} onChange={F("name")} /></div>
            <div><label>Brand</label><input type="text" value={form.brand} onChange={F("brand")} /></div>
            <div><label>Location</label><input type="text" value={form.location} onChange={F("location")} /></div>
            <div><label>Qty</label><input type="number" value={form.qty} onChange={F("qty")} /></div>
            <div><label>Reorder At</label><input type="number" value={form.reorder} onChange={F("reorder")} /></div>
            <div><label>Cost (₹)</label><input type="number" value={form.cost} onChange={F("cost")} /></div>
            <div><label>Price (₹)</label><input type="number" value={form.price} onChange={F("price")} /></div>
            {form.category === "Lenses" && <>
              <div><label>Lens Power</label><input type="text" placeholder="-2.50" value={form.lensPower} onChange={F("lensPower")} /></div>
              <div><label>Lens Type</label><select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l => <option key={l}>{l}</option>)}</select></div>
              <div><label>Box Number</label><input type="text" placeholder="B-14" value={form.boxNo} onChange={F("boxNo")} /></div>
            </>}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INVOICES
// ════════════════════════════════════════════════════════════════════════
function InvoicesSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.invoices || []).filter(x => (isOwner || x.branch === branch));
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ patientName: "", date: todayStr(), items: [], discount: 0 });
  const [lN, setLN] = useState(""); const [lQ, setLQ] = useState(1); const [lP, setLP] = useState(0);
  const [msg, setMsg] = useState("");
  
  const addLine = () => { if (!lN.trim()) return; setForm(f => ({ ...f, items: [...f.items, { name: lN, qty: Number(lQ), price: Number(lP) }] })); setLN(""); setLQ(1); setLP(0); };
  const sub = (form.items || []).reduce((s, l) => s + l.qty * l.price, 0);
  
  const save = () => {
    if (!form.patientName || !form.items.length) return;
    const record = { id: `INV-${uid().slice(0, 6).toUpperCase()}`, branch: isOwner ? "JPT Branch" : branch, ...form, discount: Number(form.discount), approvalStatus: "approved", status: "Pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("invoices", arr => [...arr, record], record); 
    audit("ADD", { type: "invoices" }); 
    setModal(false);
  };
  
  const total = inv => (inv.items || []).reduce((s, i) => s + i.qty * i.price, 0) - (inv.discount || 0);
  
  return (
    <div>
      <SectionHeader title="Sales & Invoices" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows, "invoices.csv")} onAdd={can("invoices", "add") ? () => { setForm({ patientName: "", date: todayStr(), items: [], discount: 0 }); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table><thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Total</th><th>Status</th><th>By</th><th>Branch</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{rows.map(inv => (
            <tr key={inv.id}>
              <td style={{ fontWeight: 700 }}>{inv.id}</td><td>{inv.date}</td><td>{inv.patientName}</td>
              <td style={{ fontWeight: 700 }}>{currency(total(inv))}</td>
              <td><span className={`tag ${inv.status === "Paid" ? "tag-green" : "tag-yellow"}`}>{inv.status}</span></td>
              <td style={{ fontSize: 11, color: "#9b8e82" }}>{inv.createdByName || "—"}</td>
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{inv.branch}</span></td>
              <td style={{ display: "flex", gap: 5 }}>
                <button className="btn btn-sm" style={{ background: "#f0ede8", color: "#1a1714", border: "none", fontWeight: 600 }} onClick={() => printInvoice(inv)}>🖨 Print</button>
                {(isOwner || can("invoices", "edit")) && inv.status === "Pending" && <button className="btn btn-sm" style={{ background: "#dcfce7", color: "#16a34a", border: "none", fontWeight: 700 }} onClick={() => mutate("invoices", arr => arr.map(i => i.id === inv.id ? { ...i, status: "Paid" } : i))}>✓ Paid</button>}
                {isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) mutate("invoices", arr => arr.filter(i => i.id !== inv.id)); }}>✕</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="New Invoice" onClose={() => setModal(false)} onSave={save} saveLabel="Create Invoice" wide>
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div><label>Patient Name</label><input type="text" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <label>Add Item</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="text" placeholder="Item name" value={lN} onChange={e => setLN(e.target.value)} style={{ flex: 2 }} />
            <input type="number" placeholder="Qty" value={lQ} onChange={e => setLQ(e.target.value)} style={{ width: 60 }} />
            <input type="number" placeholder="₹" value={lP} onChange={e => setLP(e.target.value)} style={{ width: 90 }} />
            <button className="btn btn-dark btn-sm" onClick={addLine}>Add</button>
          </div>
          {form.items.length > 0 && <div style={{ background: "#faf9f7", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            {form.items.map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{l.name} × {l.qty}</span><span style={{ fontWeight: 600 }}>{currency(l.qty * l.price)}</span></div>)}
            <div style={{ borderTop: "1px solid #e8e2db", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Sub</span><span>{currency(sub)}</span></div>
          </div>}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}><label>Discount (₹)</label><input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: "#9b8e82" }}>TOTAL</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>{currency(sub - Number(form.discount))}</div></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ALERTS
// ════════════════════════════════════════════════════════════════════════
function AlertsSection({ session, data, mutate, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const low     = (data.stock || []).filter(s => (isOwner || s.branch === branch) && s.qty <= s.reorder);
  const [modal, setModal] = useState(null); const [qty, setQty] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="section-title">Low Stock Alerts</div>
        <div style={{ display: "flex", gap: 10 }}>
          {onSync && <button className="btn btn-outline btn-sm" onClick={onSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync"}</button>}
          <button className="btn btn-outline btn-sm" onClick={() => exportCSV(low.map(({ id, ...r }) => r), "low_stock.csv")}>⬇ CSV</button>
        </div>
      </div>
      {low.length === 0
        ? <div className="card" style={{ textAlign: "center", padding: 48, color: "#9b8e82" }}><div style={{ fontSize: 36, marginBottom: 10 }}>✓</div><div style={{ fontWeight: 600 }}>All stock levels healthy</div></div>
        : low.map(s => (
          <div key={s.id} style={{ background: "#fff9f5", border: "1.5px solid #fed7aa", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 2 }}>{s.sku} · {s.branch} · Box: {s.boxNo || "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#9b8e82" }}>Stock / Reorder</div><div><span style={{ fontWeight: 700, color: "#dc2626", fontSize: 16 }}>{s.qty}</span><span style={{ color: "#9b8e82" }}> / {s.reorder}</span></div></div>
              {isOwner && <button className="btn btn-dark btn-sm" onClick={() => { setModal(s); setQty(s.reorder - s.qty + 10); }}>+ Restock</button>}
            </div>
          </div>
        ))
      }
      {modal && <Modal title="Restock" onClose={() => setModal(null)} onSave={() => { mutate("stock", p => p.map(s => s.id === modal.id ? { ...s, qty: s.qty + Number(qty) } : s)); setModal(null); }} saveLabel="Update" width={360}>
        <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 12 }}>{modal.name}</div>
        <label>Units to Add</label><input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} />
        <div style={{ fontSize: 13, color: "#9b8e82", marginTop: 8 }}>New total: {modal.qty + Number(qty)}</div>
      </Modal>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════════════════════════════════
function TasksSection({ session, data, mutate, audit, accounts, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const allTasks = data.tasks || [];
  const rows = isOwner ? allTasks : allTasks.filter(t => t.assignedTo === session.id);

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [filter,setFilter]= useState("all"); 

  const staffList = (accounts || []).filter(a => a.role === "staff");

  const blank = () => ({
    title: "", description: "", assignedTo: staffList[0]?.id || "",
    deadline: todayStr(), priority: "Medium",
  });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) { setMsg("Task title required."); return; }
    const record = {
      id: uid(), ...form, status: "pending",
      createdBy: session.id, createdByName: session.name, createdAt: ts(),
    };
    mutate("tasks", arr => [...arr, record], record);
    audit("TASK_ASSIGN", { title: form.title, assignedTo: form.assignedTo });
    setModal(false); setMsg("Task assigned.");
  };

  const markDone = (task) => {
    const updated = { ...task, status: "done", completedAt: ts() };
    mutate("tasks", arr => arr.map(x => x.id === task.id ? updated : x), updated);
    audit("TASK_COMPLETE", { title: task.title });
  };

  const del = id => { if (confirm("Delete task?")) { mutate("tasks", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type:"tasks", id }); } };

  const isOverdue = t => t.status === "pending" && new Date(t.deadline) < new Date(todayStr());

  const filtered = rows.filter(t => {
    if (filter === "pending") return t.status === "pending" && !isOverdue(t);
    if (filter === "done")    return t.status === "done";
    if (filter === "overdue") return isOverdue(t);
    return true;
  });

  const staffName = id => staffList.find(s => s.id === id)?.name || id;

  const priorityColor = p => ({ High:"#dc2626", Medium:"#d97706", Low:"#16a34a" }[p] || "#9b8e82");

  return (
    <div>
      <SectionHeader title="Tasks" onSync={onSync} syncing={syncing}
        onAdd={isOwner ? () => { setForm(blank()); setMsg(""); setModal(true); } : null}
        msg={msg} />

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["all","pending","overdue","done"].map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?"btn-dark":"btn-outline"}`} onClick={()=>setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gap:10 }}>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No tasks here.</div>}
        {filtered.map(t => (
          <div key={t.id} className="card" style={{ padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14,
            borderLeft: `4px solid ${t.status==="done" ? "#16a34a" : isOverdue(t) ? "#dc2626" : priorityColor(t.priority)}` }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ fontWeight:700, fontSize:15, textDecoration: t.status==="done" ? "line-through" : "none", color: t.status==="done" ? "#9b8e82" : "#1a1714" }}>{t.title}</div>
                <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:`${priorityColor(t.priority)}20`, color:priorityColor(t.priority) }}>{t.priority}</span>
                {isOverdue(t) && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:"#fee2e2", color:"#dc2626" }}>⚠ Overdue</span>}
                {t.status==="done" && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:"#dcfce7", color:"#16a34a" }}>✓ Done</span>}
              </div>
              {t.description && <div style={{ fontSize:13, color:"#6b5e52", marginBottom:6 }}>{t.description}</div>}
              <div style={{ fontSize:12, color:"#9b8e82", display:"flex", gap:14 }}>
                <span>👤 {staffName(t.assignedTo)}</span>
                <span>📅 Due {t.deadline}</span>
                <span>By {t.createdByName}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {t.status === "pending" && (!isOwner ? t.assignedTo === session.id : true) && (
                <button className="btn btn-outline btn-sm" onClick={()=>markDone(t)}>Mark Done</button>
              )}
              {isOwner && <button className="btn btn-danger btn-sm" onClick={()=>del(t.id)}>✕</button>}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Assign Task" onClose={()=>setModal(false)} onSave={submit} saveLabel="Assign Task">
          <div style={{ display:"grid", gap:14 }}>
            <div><label>Title *</label><input type="text" value={form.title} onChange={F("title")} /></div>
            <div><label>Description</label><textarea rows={3} value={form.description} onChange={F("description")} /></div>
            <div><label>Assign To</label>
              <select value={form.assignedTo} onChange={F("assignedTo")}>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div><label>Deadline</label><input type="date" value={form.deadline} onChange={F("deadline")} /></div>
              <div><label>Priority</label>
                <select value={form.priority} onChange={F("priority")}><option>Low</option><option>Medium</option><option>High</option></select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REMINDERS
// ════════════════════════════════════════════════════════════════════════
function RemindersSection({ session, data, mutate, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const allReminders = data.reminders || [];
  const rows = isOwner ? allReminders : allReminders.filter(r => r.branch === branch);

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [mrLookup, setMrLookup] = useState("");
  const [filter, setFilter] = useState("upcoming");

  const blank = () => ({
    mrNo: "", patientId: "", name: "", phone: "",
    reminderType: "Lens Delivery", reminderDate: todayStr(), notes: "",
    branch: isOwner ? "JPT Branch" : branch,
  });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    const found = (data.patients || []).find(p =>
      p.mrNo?.toLowerCase() === query.toLowerCase() ||
      p.patientId?.toLowerCase() === query.toLowerCase() ||
      p.phone === query
    );
    if (found) {
      setForm(f => ({ ...f, mrNo: found.mrNo||"", patientId: found.patientId||"", name: found.name, phone: found.phone }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else {
      setMrLookup("No match found.");
    }
  };

  const submit = () => {
    if (!form.name.trim() || !form.reminderDate) { setMsg("Name and reminder date required."); return; }
    const record = { id: uid(), ...form, status: "pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("reminders", arr => [...arr, record], record);
    audit("REMINDER_ADD", { name: form.name, type: form.reminderType });
    setModal(false); setMsg("Reminder set.");
  };

  const markDone = (rem) => {
    const updated = { ...rem, status: "done", completedAt: ts() };
    mutate("reminders", arr => arr.map(x => x.id === rem.id ? updated : x), updated);
  };

  const del = id => { if (confirm("Delete reminder?")) { mutate("reminders", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type:"reminders", id }); } };

  const isOverdue = r => r.status === "pending" && new Date(r.reminderDate) < new Date(todayStr());
  const isToday    = r => r.reminderDate === todayStr();

  const filtered = rows.filter(r => {
    if (filter === "upcoming") return r.status === "pending";
    if (filter === "done")     return r.status === "done";
    return true;
  }).sort((a,b) => new Date(a.reminderDate) - new Date(b.reminderDate));

  const typeIcon = t => ({ "Lens Delivery":"🕶", "Follow-up Visit":"🔁", "Payment Due":"💰", "Review":"📋" }[t] || "🔔");

  return (
    <div>
      <SectionHeader title="Reminders" onSync={onSync} syncing={syncing}
        onAdd={() => { setForm(blank()); setMsg(""); setMrLookup(""); setModal(true); }}
        msg={msg} />

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["upcoming","done","all"].map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?"btn-dark":"btn-outline"}`} onClick={()=>setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gap:10 }}>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No reminders here.</div>}
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14,
            borderLeft: `4px solid ${r.status==="done" ? "#16a34a" : isOverdue(r) ? "#dc2626" : isToday(r) ? "#d97706" : "#9b8e82"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
              <div style={{ fontSize:22 }}>{typeIcon(r.reminderType)}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, textDecoration: r.status==="done"?"line-through":"none", color: r.status==="done"?"#9b8e82":"#1a1714" }}>
                  {r.name} <span style={{ fontWeight:400, color:"#9b8e82", fontSize:12 }}>({r.mrNo || r.patientId || "—"})</span>
                </div>
                <div style={{ fontSize:12, color:"#6b5e52" }}>{r.reminderType} · {r.phone}</div>
                {r.notes && <div style={{ fontSize:12, color:"#9b8e82", marginTop:2 }}>{r.notes}</div>}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:700, fontSize:13, color: isOverdue(r)?"#dc2626":isToday(r)?"#d97706":"#1a1714" }}>{r.reminderDate}</div>
              {isOverdue(r) && <div style={{ fontSize:10, color:"#dc2626", fontWeight:700 }}>OVERDUE</div>}
              {isToday(r) && <div style={{ fontSize:10, color:"#d97706", fontWeight:700 }}>TODAY</div>}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {r.status === "pending" && <button className="btn btn-outline btn-sm" onClick={()=>markDone(r)}>Done</button>}
              <button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Set Reminder" onClose={()=>setModal(false)} onSave={submit} saveLabel="Set Reminder">
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
            <label style={{ fontWeight:700 }}>🔗 Look Up Patient (MR No / Patient ID / Phone)</label>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""}
                onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} />
              <button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button>
            </div>
            {mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><label>MR No (Read Only)</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div><label>Patient ID (Read Only)</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} /></div>
            <div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div><label>Reminder Type</label>
              <select value={form.reminderType} onChange={F("reminderType")}>
                {["Lens Delivery","Follow-up Visit","Payment Due","Review"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label>Reminder Date *</label><input type="date" value={form.reminderDate} onChange={F("reminderDate")} /></div>
            <div></div>
            <div style={{ gridColumn:"1/-1" }}><label>Notes</label><textarea rows={2} value={form.notes} onChange={F("notes")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MANAGE STAFF (Users)
// Added Designation (Role)
// ════════════════════════════════════════════════════════════════════════
function UsersSection({ accounts, setAccounts, audit }) {
  const staff = accounts.filter(a => a.role === "staff");
  const [addModal, setAddModal] = useState(false);
  const [newUser, setNewUser]   = useState({ id: "", name: "", designation: "Staff", branch: BRANCHES[0], password: "" });
  
  const addStaff = () => {
    if (!newUser.id || !newUser.name || !newUser.password) { alert("Fill all fields."); return; }
    if (accounts.find(a => a.id === newUser.id)) { alert("User ID already exists."); return; }
    const perms = {}; SECTIONS.forEach(s => { perms[s] = { view: false, add: false, edit: false }; });
    setAccounts(p => [...p, { ...newUser, role: "staff", perms }]);
    audit("ADD", { userId: newUser.id, name: newUser.name });
    setAddModal(false); setNewUser({ id: "", name: "", designation: "Staff", branch: BRANCHES[0], password: "" });
  };
  
  const delStaff = id => { if (confirm("Delete staff account?")) { setAccounts(p => p.filter(a => a.id !== id)); audit("DELETE", { userId: id }); } };
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="section-title">Manage Staff</div>
        <button className="btn btn-dark btn-sm" onClick={() => setAddModal(true)}>+ Add Staff</button>
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: "#9b8e82" }}>Use <strong>Dashboard Builder</strong> to control field visibility and section permissions per staff member.</div>
      {staff.map(acc => (
        <div key={acc.id} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name} <span style={{ fontSize: 12, fontWeight: 400, color: "#6b5e52", background: "#f0ede8", padding: "2px 8px", borderRadius: 12, marginLeft: 6 }}>{acc.designation}</span></div>
              <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 4 }}>ID: <code style={CS}>{acc.id}</code> · {acc.branch} · Password: <code style={CS}>{acc.password}</code></div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => delStaff(acc.id)}>Delete</button>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SECTIONS.map(s => (
              <div key={s} style={{ fontSize: 11, background: "#f0ede8", borderRadius: 20, padding: "2px 10px" }}>
                {SECTION_LABELS[s]}: {["view", "add", "edit"].filter(a => acc.perms?.[s]?.[a]).join("/") || "none"}
              </div>
            ))}
          </div>
        </div>
      ))}
      {addModal && (
        <Modal title="Add New Staff" onClose={() => setAddModal(false)} onSave={addStaff} saveLabel="Create Account">
          <div className="form-grid">
            <div><label>User ID (login)</label><input type="text" placeholder="staff_jpt2" value={newUser.id} onChange={e => setNewUser(f => ({ ...f, id: e.target.value }))} /></div>
            <div><label>Display Name</label><input type="text" value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label>Designation (Role)</label><input type="text" placeholder="e.g. Optometrist" value={newUser.designation} onChange={e => setNewUser(f => ({ ...f, designation: e.target.value }))} /></div>
            <div><label>Branch</label><select value={newUser.branch} onChange={e => setNewUser(f => ({ ...f, branch: e.target.value }))}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select></div>
            <div><label>Password</label><input type="text" value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SUPABASE SECTION
// ════════════════════════════════════════════════════════════════════════
function SupabaseSection({ sbCreds, sbStatus, onConnect, onSync, onPush }) {
  const [url, setUrl]   = useState(sbCreds.url || "");
  const [key, setKey]   = useState(sbCreds.key || "");
  const [msg, setMsg]   = useState("");

  const connect = async () => {
    setMsg("Testing connection…");
    const ok = await onConnect(url, key);
    setMsg(ok ? "✅ Credentials saved! Push to DB to sync your data. (Note: live sync works best from your Vercel URL)" : "❌ Invalid URL or key format.");
  };

  const statusColor = { ok: "#16a34a", error: "#dc2626", testing: "#d97706", pushing: "#1d4ed8", syncing: "#7c3aed", idle: "#9b8e82" };

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Cloud Sync — Supabase</div>
      <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 22 }}>Connect a free Supabase database to sync all data across devices and branches.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Connection</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor[sbStatus] || "#9b8e82", display: "inline-block" }} />
            Status: <strong>{sbStatus}</strong>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div><label>Supabase Project URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></div>
            <div><label>Anon / Public Key</label><input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGci…" /></div>
          </div>
          {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.startsWith("✅") ? "#16a34a" : msg.startsWith("❌") ? "#dc2626" : "#d97706" }}>{msg}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-dark btn-sm" onClick={connect}>🔌 Connect & Test</button>
            <button className="btn btn-outline btn-sm" onClick={onSync}>⬇ Pull from DB</button>
            <button className="btn btn-outline btn-sm" onClick={onPush}>⬆ Push to DB</button>
          </div>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Note regarding Pending Queue</div>
          <div style={{ fontSize: 13, color: "#6b5e52", lineHeight: 1.8 }}>
            The Approval Queue system has been completely removed. Based on your SQL query, the `pending_queue` table may still exist in your Supabase project, but it is no longer used or required by this app. Staff submissions with "Add" permissions now save directly to the respective live tables.
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LAUNCH GUIDE
// ════════════════════════════════════════════════════════════════════════
function LaunchGuide() {
  const [step, setStep] = useState(0);

  const STEPS = [
    {
      title: "Overview — What You Need",
      icon: "📋",
      content: (
        <div>
          <p style={{ marginBottom: 14 }}>To launch OptiManager you need 3 free tools:</p>
          {[
            ["💻", "GitHub", "Stores your app code — free", "https://github.com"],
            ["🟢", "Vercel", "Hosts your app online, gives you a URL — free", "https://vercel.com"],
            ["☁",  "Supabase", "Your cloud database — free (500MB)", "https://supabase.com"],
          ].map(([icon, title, desc, url]) => (
            <div key={title} style={{ display:"flex", gap:14, padding:"12px 0", borderBottom:"1px solid #f0ede8" }}>
              <div style={{ fontSize:24 }}>{icon}</div>
              <div>
                <div style={{ fontWeight:700 }}>{title} — <a href={url} target="_blank" rel="noreferrer" style={{ color:"#1d4ed8" }}>{url}</a></div>
                <div style={{ fontSize:13, color:"#6b5e52", marginTop:2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Step 1 — Set Up Supabase",
      icon: "☁",
      content: (
        <div style={{ display:"grid", gap:14 }}>
          {[
            ["Go to supabase.com", "Click Start your project → sign in with GitHub (free)."],
            ["Create a new project", "Click New Project. Name: optimanager. Pick region: ap-south-1 (Mumbai). Set a DB password. Click Create."],
            ["Get your credentials", "After 60 seconds → Project Settings → API. Copy the Project URL and anon/public key."],
            ["Run SQL tables", "Go to SQL Editor → New Query → paste the supabase setup sql you provided → click Run."],
            ["Connect in app", "Open OptiManager → Cloud Sync → paste URL and key → Connect and Test → Push to DB."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display:"flex", gap:14 }}>
              <div style={{ width:28, height:28, minWidth:28, background:"#1a1714", color:"#f0ede8", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{i+1}</div>
              <div><div style={{ fontWeight:700, fontSize:14 }}>{t}</div><div style={{ fontSize:13, color:"#6b5e52", marginTop:3, lineHeight:1.7 }}>{d}</div></div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Step 2 — Vercel & Direct Access",
      icon: "👥",
      content: (
        <div style={{ display:"grid", gap:14 }}>
          {[
            ["Share the URL with staff", "Send the Vercel URL to your team on WhatsApp. They open it in Chrome on phone or computer."],
            ["Each person uses their login", "Go to Manage Staff to create IDs, passwords, and Designations. Share privately."],
            ["Direct Additions", "Staff additions go straight into the live system. There is no approval queue. Ensure the permissions are correct in the Dashboard Builder."],
            ["Dashboard Builder", "Toggle which fields appear per section and which actions each staff member can do."],
            ["Audit Log", "Every login, addition, edit, and deletion is recorded with name and timestamp."],
            ["Cloud Sync", "Data saves directly to Supabase. Use Pull from DB to sync latest from the cloud if required."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display:"flex", gap:14 }}>
              <div style={{ width:28, height:28, minWidth:28, background:"#7c3aed", color:"#fff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{i+1}</div>
              <div><div style={{ fontWeight:700, fontSize:14 }}>{t}</div><div style={{ fontSize:13, color:"#6b5e52", marginTop:3, lineHeight:1.7 }}>{d}</div></div>
            </div>
          ))}
        </div>
      )
    }
  ];

    return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>🚀 Launch Guide</div>
      <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 22 }}>Step-by-step: from this app to a live URL your staff can open on any phone.</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        {STEPS.map((s, i) => (
          <button key={i} className={`btn btn-sm ${step === i ? "btn-dark" : "btn-outline"}`} onClick={() => setStep(i)}>
            {s.icon} {i === 0 ? "Overview" : `Step ${i}`}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{STEPS[step].title}</div>
        {STEPS[step].content}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Previous</button>
          <button className="btn btn-dark btn-sm" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>Next →</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════════════
function SectionHeader({ title, onAdd, onExport, onSync, syncing, msg }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title">{title}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {onSync && (
            <button className="btn btn-outline btn-sm" onClick={onSync} disabled={syncing} title="Pull latest data from cloud">
              {syncing ? "⟳ Syncing…" : "⟳ Sync"}
            </button>
          )}
          {onExport && <button className="btn btn-outline btn-sm" onClick={onExport}>⬇ CSV</button>}
          {onAdd    && <button className="btn btn-dark btn-sm"    onClick={onAdd}>+ Add</button>}
        </div>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 13, padding: "8px 14px", borderRadius: 8, background: msg.includes("approval") ? "#fef9c3" : "#dcfce7", color: msg.includes("approval") ? "#a16207" : "#16a34a" }}>{msg}</div>}
    </div>
  );
}

function Modal({ title, children, onClose, onSave, saveLabel = "Save", wide, xl, width }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: xl ? "min(920px,96vw)" : wide ? "min(700px,96vw)" : width ? width : "min(560px,96vw)" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{title}</div>
        {children}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-dark" onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════
const CS = { background: "#f0ede8", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 };

const GCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#c8bfb0;border-radius:3px}
input,select,textarea,button{font-family:inherit}button{cursor:pointer}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 13px;border-radius:9px;font-size:13px;font-weight:500;color:#6b5e52;border:none;background:none;width:100%;text-align:left;transition:all .18s}
.nav-item:hover{background:#e8e2db;color:#1a1714}.nav-item.active{background:#1a1714;color:#f0ede8}
.badge{background:#e55e3a;color:#fff;border-radius:20px;font-size:11px;padding:1px 7px;font-weight:600}
.card{background:#fff;border-radius:16px;padding:22px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.btn{padding:9px 18px;border-radius:9px;font-size:13px;font-weight:600;border:none;transition:all .15s}
.btn-dark{background:#1a1714;color:#f0ede8}.btn-dark:hover{background:#2e2820}.btn-dark:disabled{opacity:.5;cursor:not-allowed}
.btn-outline{background:transparent;border:1.5px solid #c8bfb0;color:#1a1714}.btn-outline:hover{background:#f0ede8}.btn-outline:disabled{opacity:.5}
.btn-danger{background:#fee2e2;color:#dc2626}.btn-danger:hover{background:#fecaca}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:7px}
input[type=text],input[type=number],input[type=date],input[type=time],input[type=email],input[type=tel],input[type=password],select,textarea{width:100%;padding:8px 11px;border:1.5px solid #e2ddd8;border-radius:8px;font-size:13px;background:#faf9f7;transition:border .15s;outline:none}
input:focus,select:focus,textarea:focus{border-color:#1a1714;background:#fff}
input[readonly]{background:#f0ede8;color:#9b8e82;border-color:#e2ddd8}
label{font-size:11px;font-weight:700;color:#6b5e52;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;padding:9px 12px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9b8e82;border-bottom:1.5px solid #e8e2db;white-space:nowrap}
td{padding:10px 12px;border-bottom:1px solid #f0ede8;vertical-align:middle}
tr:last-child td{border-bottom:none}tr:hover td{background:#faf9f7}
.tag{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.tag-green{background:#dcfce7;color:#16a34a}.tag-yellow{background:#fef9c3;color:#a16207}
.tag-red{background:#fee2e2;color:#dc2626}.tag-blue{background:#dbeafe;color:#1d4ed8}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.modal{background:#fff;border-radius:20px;padding:28px;max-height:93vh;overflow-y:auto;box-shadow:0 24px 70px rgba(0,0,0,.25)}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-grid .full{grid-column:1/-1}
.stat-card{background:#fff;border-radius:14px;padding:20px 22px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.stat-num{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;line-height:1}
.section-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;margin-bottom:18px}
p{line-height:1.7}
@media(max-width:768px){.form-grid{grid-template-columns:1fr}}
`;
