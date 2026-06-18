import React, { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v4.11 — Ophthalmology HMS | Fixed Schema Cache Error (_lookup strip)
// ════════════════════════════════════════════════════════════════════════
const APP_VER  = "4.11";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const SECTIONS = ["patients","patientBill","optometrist","opticals","inventory","invoices","alerts"];
const SECTION_LABELS = { patients:"OP Registration", patientBill:"K Sheet Entry", optometrist:"Optometrist", opticals:"Opticals", inventory:"Inventory", invoices:"Sales & Invoices", alerts:"Low Stock Alerts" };
const LENS_TYPES     = ["Single Vision","Bifocal","Progressive","Anti-Reflective","Photochromic","Blue Cut","UV400","Polarized","High Index 1.60","High Index 1.67","High Index 1.74","Trivex","Polycarbonate","Toric (Contact)","Multifocal (Contact)"];
const DELIVERY_STATUS= ["Delivered","Not Ready","Fixing Completed But Not Delivered"];
const DESIGNATIONS   = ["FRONT DESK STAFF", "OPTOM", "OPTOMOLOGIST", "MD", "DEVELOPER"];

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

const DEFAULT_ACCOUNTS = [
  { id:"owner",      name:"Owner",       role:"owner", designation: "MD", branch:"All",        password:"owner123", perms:{} },
  { id:"staff_jpt1", name:"Ravi (JPT)",  role:"staff", designation: "FRONT DESK STAFF", branch:"JPT Branch", password:"jpt1234",
    perms:{ patients:{view:true,add:true,edit:false}, patientBill:{view:true,add:true,edit:false}, optometrist:{view:true,add:true,edit:false}, opticals:{view:true,add:true,edit:false}, inventory:{view:true,add:false,edit:false}, invoices:{view:true,add:false,edit:false}, alerts:{view:true,add:false,edit:false} }
  },
];

const DEFAULT_FIELD_VISIBILITY = {
  patients:     ["timestamp","date","time","mrNo","patientId","name","phone","address","ref","paymentAmount","paymentMode","paymentRefNo","branch","remarks","visitType"],
  patientBill:  ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory"],
  optometrist:  ["timestamp","mrNo","patientId","name","complaint","pastHistory"],
  opticals:     ["timestamp","mrNo","patientId","name","phone","address","totalPrice","advance","advancePaymentMethod","transactionId","balance","optomName"],
  inventory:    ["sku","name","category","brand","qty","reorder","lensPower","lensType","boxNo","price","location"],
  invoices:     ["id","date","patientName","items","discount","status"],
};

let _sb = null;
function initSB(url, key) {
  if (!url || !key) { _sb = null; return false; }
  _sb = { url: url.replace(/\/$/, ""), key };
  return true;
}
function sbReady() { return _sb !== null; }

const SB_TABLES = {
  patients: "patients", patientBill: "patientBill", optometrist: "optometrist", opticals: "opticals",
  stock: "stock", invoices: "invoices", accounts: "accounts", audit_log: "audit_log", tasks: "tasks", reminders: "reminders",
};

function sbHeaders() { return { "Content-Type": "application/json", "apikey": _sb.key, "Authorization": `Bearer ${_sb.key}` }; }

async function sbGet(table) {
  if (!_sb) return null;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}?select=*`, { headers: sbHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) ? d : null;
  } catch(e) { return null; }
}

async function sbUpsertOne(table, row) {
  if (!_sb) return { ok: false, error: "Not connected" };
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
      method: "POST", headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      console.error(`sbUpsertOne [${table}] HTTP ${r.status}:`, errBody);
      return { ok: false, error: `HTTP ${r.status}: ${errBody.slice(0, 300)}` };
    }
    return { ok: true, error: null };
  } catch(e) { return { ok: false, error: String(e) }; }
}

async function sbUpsertMany(table, rows) {
  if (!_sb) return { ok: false, error: "Not connected" };
  if (!rows.length) return { ok: true, error: null };
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
      method: "POST", headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn(`sbUpsertMany ${table} HTTP ${r.status}:`, t);
      return { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true, error: null };
  } catch(e) { return { ok: false, error: String(e) }; }
}

async function sbDelete(table, id) {
  if (!_sb) return false;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: sbHeaders() });
    return r.ok;
  } catch(e) { return false; }
}

async function sbInsert(table, row) {
  if (!_sb) return false;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
      method: "POST", headers: { ...sbHeaders(), "Prefer": "return=minimal" }, body: JSON.stringify(row),
    });
    return r.ok;
  } catch { return false; }
}

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

const validate = {
  phone:     v => { const s = String(v || "").trim(); return s.length === 10 && s[0] !== "0" && /^\d+$/.test(s); },
  town:      v => { const s = String(v || "").trim(); return s.length > 0 && !/\d/.test(s); },
  sphereCyl: v => { const n = parseFloat(v); return !isNaN(n) && n >= -6 && n <= 6 && Math.round(Math.abs(n) * 100) % 25 === 0; },
  axis:      v => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 180 && n === Math.round(n); },
  add:       v => { const n = parseFloat(v); if (isNaN(n)) return false; if (n === 0) return true; return n >= 0.75 && n <= 3.00 && Math.round(n * 100) % 25 === 0; },
};

const vStyle = (val, fn, touched) => !touched ? {} : fn(val) ? { borderColor: "#16a34a" } : { borderColor: "#dc2626" };
const vMsg   = (val, fn, touched, msg) => (!touched || fn(val)) ? null : <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{msg}</div>;

const LS = {
  get:  (k, def) => { try { const val = JSON.parse(localStorage.getItem(k)); return val !== null ? val : def; } catch { return def; } },
  set:  (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  sess: (v)      => { try { if (v) sessionStorage.setItem("opti_sess", JSON.stringify(v)); else sessionStorage.removeItem("opti_sess"); } catch {} },
  getSess: ()    => { try { return JSON.parse(sessionStorage.getItem("opti_sess")); } catch { return null; } },
};

const SEED_DATA = { patients: [], patientBill: [], optometrist: [], opticals: [], stock: [], invoices: [], tasks: [], reminders: [] };
const safeArray = (arr, fallback = []) => Array.isArray(arr) ? arr : fallback;

export default function App() {
  const [session,  setSession]  = useState(() => LS.getSess());
  const [accounts, setAccounts] = useState(() => safeArray(LS.get("opti_accounts", DEFAULT_ACCOUNTS), DEFAULT_ACCOUNTS));
  const accountsWriteInFlight = useRef(false);
  const [data,     setData]     = useState(() => { const d = LS.get("opti_data_v4", SEED_DATA); return d && typeof d === 'object' ? d : SEED_DATA; });
  const [auditLog, setAuditLog] = useState(() => safeArray(LS.get("opti_audit", [])));
  const [fieldVis, setFieldVis] = useState(() => LS.get("opti_fields", DEFAULT_FIELD_VISIBILITY) || DEFAULT_FIELD_VISIBILITY);
  const [sbCreds,  setSbCreds]  = useState(() => LS.get("opti_sb", { url: "", key: "" }));
  
  const [sbStatus, setSbStatus] = useState("idle");
  const [view,     setView]     = useState("dashboard");
  const [lastSync, setLastSync] = useState(null);
  const [syncing,  setSyncing]  = useState(false);

  useEffect(() => { LS.set("opti_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("opti_data_v4",  data);     }, [data]);
  useEffect(() => { LS.set("opti_audit",    auditLog); }, [auditLog]);
  useEffect(() => { LS.set("opti_fields",   fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("opti_sb",       sbCreds);  }, [sbCreds]);

  const syncFromCloud = async (url, key) => {
    if (!url || !key) return;
    initSB(url, key);
    if (!sbReady() || syncing) return;
    setSyncing(true);
    try {
      const [pts, bills, optom, optcl, stk, inv, accs, tsks, rems] = await Promise.all([
        sbGet("patients"), sbGet("patientBill"), sbGet("optometrist"), sbGet("opticals"), sbGet("stock"), sbGet("invoices"), sbGet("accounts"), sbGet("tasks"), sbGet("reminders"),
      ]);

      setData(d => ({
        ...d,
        patients:    Array.isArray(pts)   ? pts   : safeArray(d.patients),
        patientBill: Array.isArray(bills) ? bills : safeArray(d.patientBill),
        optometrist: Array.isArray(optom) ? optom : safeArray(d.optometrist),
        opticals:    Array.isArray(optcl) ? optcl : safeArray(d.opticals),
        stock:       Array.isArray(stk)   ? stk   : safeArray(d.stock),
        invoices:    Array.isArray(inv)   ? inv   : safeArray(d.invoices),
        tasks:       Array.isArray(tsks)  ? tsks  : safeArray(d.tasks),
        reminders:   Array.isArray(rems)  ? rems  : safeArray(d.reminders),
      }));

      if (Array.isArray(accs) && accs.length > 0 && !accountsWriteInFlight.current) { setAccounts(accs); LS.set("opti_accounts", accs); }
      setLastSync(new Date()); setSbStatus("ok");
    } catch(e) { setSbStatus("error"); }
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
  }, [sbCreds.url, sbCreds.key]);

  const connectSupabase = async (url, key) => {
    setSbStatus("testing");
    const cleanUrl = url.replace(/\/$/, "");
    initSB(cleanUrl, key);
    try {
      const r = await fetch(`${cleanUrl}/rest/v1/patients?select=id&limit=1`, { headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } });
      if (r.status < 500) {
        setSbCreds({ url: cleanUrl, key }); setSbStatus("ok");
        await sbUpsertMany("accounts", accounts); await syncFromCloud(cleanUrl, key); return true;
      }
      setSbStatus("error"); _sb = null; return false;
    } catch(e) {
      if (cleanUrl.includes("supabase.co") && key.length > 100) {
        initSB(cleanUrl, key); setSbCreds({ url: cleanUrl, key }); setSbStatus("ok");
        await sbUpsertMany("accounts", accounts).catch(() => {}); await syncFromCloud(cleanUrl, key); return true;
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
        sbUpsertMany("patients", safeArray(data.patients)), sbUpsertMany("patientBill", safeArray(data.patientBill)),
        sbUpsertMany("optometrist", safeArray(data.optometrist)), sbUpsertMany("opticals", safeArray(data.opticals)),
        sbUpsertMany("stock", safeArray(data.stock)), sbUpsertMany("invoices", safeArray(data.invoices)),
        sbUpsertMany("accounts", safeArray(accounts)), sbUpsertMany("tasks", safeArray(data.tasks)), sbUpsertMany("reminders", safeArray(data.reminders)),
      ]);
      setSbStatus("ok"); await syncFromCloud(sbCreds.url, sbCreds.key);
    } catch { setSbStatus("error"); }
  };

  const audit = useCallback((action, detail = {}) => {
    if (!session) return;
    const entry = { id: uid(), action, detail, userId: session.id, userName: session.name, branch: session.branch || "All", at: ts() };
    setAuditLog(a => [entry, ...safeArray(a)].slice(0, 500));
    sbInsert("audit_log", entry).catch(() => {});
  }, [session]);

  const mutate = useCallback((key, fn, newRecord) => {
    setData(d => {
      const updated = typeof fn === "function" ? fn(safeArray(d[key])) : fn;
      if (sbReady()) {
        if (newRecord) {
          sbUpsertOne(key, newRecord).then(result => {
            if (!result.ok) {
              alert(`Warning: This record could not be saved to the cloud.\n\nReason: ${result.error}\n\nIt is only stored on this device for now. This is usually caused by a missing column in the Supabase "${SB_TABLES[key] || key}" table.`);
            }
          });
        }
        else if (Array.isArray(updated)) sbUpsertMany(key, updated).catch(() => {});
      }
      return { ...d, [key]: updated };
    });
  }, []);

  // Surfaces real Supabase errors so a failed write never looks like
  // "data got wiped" — the user is told exactly what happened.
  const updateAccounts = useCallback((updater) => {
    setAccounts(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const cleanNext = safeArray(next, DEFAULT_ACCOUNTS);
      if (sbReady()) {
        accountsWriteInFlight.current = true;
        sbUpsertMany("accounts", cleanNext).then(result => {
          accountsWriteInFlight.current = false;
          if (!result.ok) {
            alert(`Warning: Staff changes could not be saved to the cloud.\n\nReason: ${result.error}\n\nYour change is only stored on this device for now and may be lost on next sync. This is usually caused by a missing column in the Supabase "accounts" table — ask your admin to check the database schema.`);
          }
        });
      }
      return cleanNext;
    });
  }, []);

  const login = useCallback(async (acc) => {
    const s = { ...acc, loginTime: ts() };
    LS.sess(s); setSession(s); setView("dashboard");
    audit("LOGIN", {});
    if (sbCreds.url && sbCreds.key) syncFromCloud(sbCreds.url, sbCreds.key);
  }, [sbCreds, audit]);

  const logout = useCallback(() => { audit("LOGOUT", {}); LS.sess(null); setSession(null); setView("dashboard"); }, [audit]);

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
      if (Array.isArray(accs) && accs.length > 0) { setLoginAccounts(accs); setAccounts(accs); LS.set("opti_accounts", accs); }
      else { setLoginAccounts(accounts); }
    }).catch(() => setLoginAccounts(accounts));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <LoginScreen accounts={loginAccounts} onLogin={login} sbCreds={sbCreds} setSbCreds={setSbCreds} />;

  const sharedProps = { session, data, mutate, can, audit, fieldVis, onSync: () => syncFromCloud(sbCreds.url, sbCreds.key), syncing };

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

function LoginScreen({ accounts, onLogin, sbCreds, setSbCreds }) {
  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [branch,   setBranch]   = useState(BRANCHES[0]);
  const [err,      setErr]      = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [liveAccs, setLiveAccs] = useState(safeArray(accounts, DEFAULT_ACCOUNTS));
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
        LS.set("opti_sb", { url: cleanUrl, key: cloudKey }); LS.set("opti_accounts", accs);
        setCloudMsg("Connected ✓ — accounts loaded from cloud."); setShowCloud(false);
      } else {
        setSbCreds({ url: cleanUrl, key: cloudKey }); LS.set("opti_sb", { url: cleanUrl, key: cloudKey });
        setCloudMsg("Connected ✓ (no accounts in cloud yet — using defaults)."); setShowCloud(false);
      }
    } catch(e) { setCloudMsg("Connection failed. Check URL and key."); }
    setLoading(false);
  };

  const doLogin = () => {
    const all = safeArray(liveAccs, DEFAULT_ACCOUNTS);
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
          <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 3 }}>v{APP_VER} · Ophthalmology HMS</div>
        </div>
        <div style={{ marginBottom: 18, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sbCreds?.url ? "#16a34a" : "#d97706" }}>{sbCreds?.url ? "☁ Cloud Connected" : "☁ Cloud Not Connected"}</div>
            <button style={{ fontSize: 11, background: "none", border: "none", color: "#6b5e52", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowCloud(s => !s)}>{showCloud ? "Hide" : "Configure"}</button>
          </div>
          {showCloud && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#9b8e82" }}>Enter your Supabase credentials to sync data.</div>
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
            <input type="text" placeholder="owner / staff_jpt1" value={userId} onChange={e => { setUserId(e.target.value); setErr(""); }} />
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
      </div>
    </div>
  );
}

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
          <div style={{ fontSize: 10, color: "#9b8e82", marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>v{APP_VER} <span style={{ width: 7, height: 7, borderRadius: "50%", background: sbDot, display: "inline-block" }} title={`Supabase: ${sbStatus}`} /></div>
        </div>
        <div style={{ margin: "0 4px 12px", background: "#f0ede8", borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{session.name}</div>
          <div style={{ fontSize: 11, color: "#9b8e82", marginTop: 2 }}>{session.designation || (isOwner ? "Owner" : "Staff")} · {isOwner ? "All Branches" : session.branch}</div>
          {isOwner && <span style={{ display: "inline-block", marginTop: 4, background: "#1a1714", color: "#f0ede8", borderRadius: 20, fontSize: 10, padding: "1px 8px", fontWeight: 700 }}>OWNER</span>}
        </div>
        {NAV.filter(n => n.id === "divider" || n.show).map(n =>
          n.id === "divider" ? <div key="div" style={{ margin: "6px 8px", borderTop: "1px solid #f0ede8" }} /> : 
          <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
            <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
            {n.badge > 0 && <span className="badge" style={{ marginLeft: "auto", background: n.badgeColor || "#e55e3a" }}>{n.badge}</span>}
          </button>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f0ede8" }}>
          <button className="btn btn-outline btn-sm" style={{ width: "100%", marginBottom: 8 }} onClick={onManualSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync Now"}</button>
          {lastSync && <div style={{ fontSize: 10, color: "#b5a99e", textAlign: "center", marginBottom: 8 }}>Last sync: {lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>}
          <button className="btn btn-outline btn-sm" style={{ width: "100%" }} onClick={onLogout}>🔒 Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "26px 30px", overflowY: "auto", maxWidth: "calc(100vw - 236px)" }}>{children}</main>
    </div>
  );
}

function Dashboard({ session, data, setView, auditLog }) {
  const isOwner = session.role === "owner";
  const myBranch = session.branch;
  const flt = arr => isOwner ? safeArray(arr) : safeArray(arr).filter(x => x.branch === myBranch);

  const pts   = flt(data.patients).filter(x => x.status === "approved");
  const bills = flt(data.patientBill).filter(x => x.status === "approved");
  const invs  = flt(data.invoices).filter(x => x.approvalStatus === "approved" && x.status === "Paid");
  const rev   = invs.reduce((s, i) => s + safeArray(i.items).reduce((a, x) => a + x.qty * x.price, 0) - (i.discount || 0), 0);

  const stats = [
    { label: "Patients",          value: pts.length,    color: "#1a1714" },
    { label: "Patient Bills",     value: bills.length,  color: "#1d4ed8" },
    { label: "Revenue (Paid)",    value: currency(rev), color: "#16a34a" },
  ];

  const recentAudit = safeArray(auditLog).slice(0, 8);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700 }}>Welcome, {session.name} 👋</div>
        <div style={{ fontSize: 13, color: "#9b8e82", marginTop: 3 }}>{isOwner ? "All Branches" : myBranch} · {ts()}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ cursor: "default" }}>
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
              const bPts   = safeArray(data.patients).filter(x => x.branch === br && x.status === "approved");
              const bBills = safeArray(data.patientBill).filter(x => x.branch === br && x.status === "approved");
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
                  <span style={{ fontWeight: 700, marginRight: 6, color: { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", ADD: "#16a34a", DELETE: "#dc2626", EDIT: "#d97706" }[a.action] || "#1a1714" }}>{a.action}</span>
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

function AuditLogSection({ auditLog, accounts }) {
  const [filter, setFilter] = useState("ALL");
  const [userF,  setUserF]  = useState("ALL");
  const actions = ["ALL", "LOGIN", "LOGOUT", "ADD", "EDIT", "DELETE"];
  const filtered = safeArray(auditLog).filter(a => filter === "ALL" || a.action === filter).filter(a => userF  === "ALL" || a.userId === userF);
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
          {safeArray(accounts).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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
    setFieldVis(fv => { const cur = fv[sec] || []; return { ...fv, [sec]: cur.includes(field) ? cur.filter(f => f !== field) : [...cur, field] }; });
  };

  const staff = safeArray(accounts).filter(a => a.role === "staff");
  const togglePerm = (id, sec, action) => {
    setAccounts(prev => safeArray(prev).map(a => {
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
                <div key={field} onClick={() => toggleField(section, field)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${on ? "#1a1714" : "#e2ddd8"}`, background: on ? "#1a1714" : "#fff", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? "#f0ede8" : "#1a1714" }}>{field}</span><span style={{ fontSize: 18 }}>{on ? "✓" : "○"}</span>
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
                            <button onClick={() => togglePerm(acc.id, sec, action)} style={{ width: 36, height: 28, borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: acc.perms?.[sec]?.[action] ? "#dcfce7" : "#fee2e2", color: acc.perms?.[sec]?.[action] ? "#16a34a" : "#dc2626" }}>
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

function PatientsSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner  = session.role === "owner";
  const branch   = session.branch || "JPT Branch";
  const rows = safeArray(data.patients).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [msg,   setMsg]   = useState("");
  const [search,setSearch]= useState("");
  const [dupWarning, setDupWarning] = useState(null);

  const nextPatientId = () => {
    const all = safeArray(data.patients);
    const nums = all.map(p => parseInt((p.patientId || "").replace(/\D/g,""))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `PT-${String(next).padStart(4,"0")}`;
  };

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(), mrNo: "", patientId: nextPatientId(),
    name: "", phone: "", address: "", ref: "", paymentAmount: "", paymentMode: "Cash", paymentRefNo: "",
    branch: isOwner ? "JPT Branch" : branch, remarks: "", visitType: "New Patient", visitCount: 1,
  });

  const F = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setDupWarning(null); };
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  const handlePhoneBlur = () => {
    setTouch(t => ({ ...t, phone: true }));
    const match = safeArray(data.patients).find(p => p.phone === form.phone && p.id !== form.id);
    if (match && form.phone && form.phone.length === 10) {
      const newCount = (match.visitCount || 1) + 1;
      setDupWarning({ msg: `⚠ Existing patient found: ${match.name} (${match.patientId}) — Visit #${newCount}`, patient: match, visitCount: newCount });
      setForm(f => ({ ...f, visitType: newCount === 2 ? "2nd Visit" : newCount === 3 ? "3rd Visit" : `${newCount}th Visit`, visitCount: newCount }));
    }
  };

  const submit = () => {
    setTouch({ phone: true, name: true, address: true, mrNo: true });
    if (!validate.phone(form.phone) || !form.name.trim() || !form.address.trim() || !form.mrNo.trim()) { setMsg("Fill required fields correctly."); return; }
    const record = { id: uid(), ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patients", arr => [...arr, record], record);
    audit("ADD", { type: "patients", name: form.name });
    setModal(false); setMsg("Patient registered successfully.");
  };

  const del = id => { if (confirm("Delete patient?")) { mutate("patients", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type: "patients", id }); } };

  const filtered = rows.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) || r.patientId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="OP Registration" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "op_registration.csv")} onAdd={can("patients","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setDupWarning(null); setModal(true); } : null} msg={msg} />
      <div style={{ marginBottom: 12 }}>
        <input type="text" placeholder="🔍 Search by name, phone, MR No, Patient ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", maxWidth: 420, borderRadius: 10, border: "1px solid #e8e2db", padding: "8px 14px", fontSize: 13 }} />
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Payment</th><th>Amount</th><th>Ref/Camp</th><th>Visit</th><th>Branch</th><th>Remarks</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11, whiteSpace:"nowrap", color:"#9b8e82" }}>{r.timestamp}</td>
              <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo}</td>
              <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{r.patientId}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone}</td>
              <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.address}</td>
              <td><span className="tag tag-blue">{r.paymentMode}</span></td>
              <td style={{ fontWeight:600 }}>{r.paymentAmount ? `₹${r.paymentAmount}` : "—"}</td>
              <td style={{ fontSize:12, color:"#9b8e82" }}>{r.ref || "—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.visitType || "New Patient"}</span></td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              <td style={{ fontSize:12, color:"#9b8e82", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>{r.remarks || "—"}</td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="OP Registration" onClose={() => setModal(false)} onSave={submit} saveLabel="Save Registration" wide>
          {dupWarning && <div style={{ marginBottom:14, background:"#fef9c3", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#a16207", fontWeight:600 }}>{dupWarning.msg}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <div><label>Timestamp (Auto)</label><input type="text" value={form.timestamp} readOnly /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
            <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
            <div><label>MR No (Manual) *</label><input type="text" placeholder="Enter MR Number" value={form.mrNo} onChange={F("mrNo")} onBlur={T("mrNo")} style={{ ...vStyle(form.mrNo, v => v.trim().length > 0, touch.mrNo), fontWeight: 700 }} />{vMsg(form.mrNo, v => v.trim().length > 0, touch.mrNo, "Required.")}</div>
            <div><label>Patient ID (Auto Generated)</label><input type="text" value={form.patientId} readOnly style={{ fontWeight: 700 }} /></div>
            <div><label>Visit Type</label><select value={form.visitType} onChange={F("visitType")}>{["New Patient","2nd Visit","3rd Visit","4th Visit","5th Visit","Review"].map(v => <option key={v}>{v}</option>)}</select></div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} onBlur={T("name")} style={vStyle(form.name, v => v.trim().length > 0, touch.name)} />{vMsg(form.name, v => v.trim().length > 0, touch.name, "Required.")}</div>
            <div><label>Phone * (10 digits)</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={handlePhoneBlur} style={vStyle(form.phone, validate.phone, touch.phone)} />{vMsg(form.phone, validate.phone, touch.phone, "10 digits, not starting 0.")}</div>
            <div style={{ gridColumn:"span 2" }}><label>Address *</label><input type="text" value={form.address} onChange={F("address")} onBlur={T("address")} style={vStyle(form.address, v => v.trim().length > 0, touch.address)} />{vMsg(form.address, v => v.trim().length > 0, touch.address, "Required.")}</div>
            <div><label>Ref / Camp</label><input type="text" placeholder="Camp name or referrer" value={form.ref} onChange={F("ref")} /></div>
            <div><label>Payment Amount (₹)</label><input type="number" value={form.paymentAmount} onChange={F("paymentAmount")} /></div>
            <div><label>Payment Mode</label><select value={form.paymentMode} onChange={F("paymentMode")}>{["Cash","UPI","Card","Cheque","Free","Camp"].map(m => <option key={m}>{m}</option>)}</select></div>
            {(form.paymentMode === "UPI" || form.paymentMode === "Card" || form.paymentMode === "Cheque") && (<div><label>Payment Ref No</label><input type="text" placeholder="Transaction / Cheque No" value={form.paymentRefNo} onChange={F("paymentRefNo")} /></div>)}
            {isOwner && (<div><label>Branch</label><select value={form.branch} onChange={F("branch")}>{["JPT Branch","PRP Branch"].map(b => <option key={b}>{b}</option>)}</select></div>)}
            <div style={{ gridColumn:"1/-1" }}><label>Remarks</label><textarea rows={2} value={form.remarks} onChange={F("remarks")} placeholder="Any remarks…" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PatientBillSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = safeArray(data.patientBill).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [tab,   setTab]   = useState("basic");
  const [msg,   setMsg]   = useState("");
  const [search,setSearch]= useState("");
  const [mrLookup, setMrLookup] = useState("");

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (found) {
      setForm(f => ({ ...f, mrNo: found.mrNo || f.mrNo, patientId: found.patientId || f.patientId, name: found.name, phone: found.phone, address: found.address || found.town || "" }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else { setMrLookup("No match found in OP Registration."); }
  };

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(), mrNo: "", patientId: "", name: "", phone: "", address: "", gender: "Male", age: "", complaint: "", pastHistory: "",
    htn:"", htnRx:"", dm:"", dmRx:"", cad:"", cadRx:"", asthmatic:"", asthmaticRx:"", allergies:"", allergiesRx:"", others:"", othersRx:"",
    pgOd:"", pgOdAdd:"", pgOs:"", pgOsAdd:"", vaOd:"", odCpgp:"", odPh:"", odNv:"", odPgp:"", vaOs:"", osCpgp:"", osPh:"", osPv:"", osPgp:"", retinoscopyOd:"", retinoscopyOs:"",
    reSpherAR:"", reCylAR:"", reAxisAR:"", leSpherAR:"", leCylAR:"", leAxisAR:"", reSpherSub:"", reCylSub:"", reAxisSub:"", leSpherSub:"", leCylSub:"", leAxisSub:"", add:"",
    iop:"", bp:"", ducts:"", rbs:"", dilatedWith:"", dilatedContinuee:"", optom:"",
    eyelids:"", conjunctiva:"", cornea:"", anteriorChamber:"", iris:"", pupil:"", lens:"", ocularMovements:"", fundus:"", advice:"", ophthalmologist:"",
  });

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  const rxField = (label, key, validator, msg2) => (
    <div key={key}><label>{label}</label><input type="number" step="0.25" value={form[key]||""} onChange={F(key)} onBlur={T(key)} style={vStyle(form[key], validator, touch[key])} />{vMsg(form[key], validator, touch[key], msg2)}</div>
  );

  const submit = () => {
    const { _lookup, ...cleanForm } = form; // Strip out the temporary search field
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...cleanForm, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patientBill", arr => [...arr, record], record); 
    audit("ADD",{type:"patientBill",name:cleanForm.name}); 
    setModal(false); setMsg("K Sheet saved successfully.");
  };

  const del = id => { if (confirm("Delete K Sheet?")) { mutate("patientBill", arr => arr.filter(x => x.id!==id)); audit("DELETE",{type:"patientBill",id}); } };

  // ── Designation-based tab access control ─────────────────────────────
  const ALL_TABS = [
    { id:"basic",  label:"1. Patient Info" },
    { id:"vitals", label:"2. History & Vitals (Optom)" },
    { id:"acuity", label:"3. Acuity & Retinoscopy" },
    { id:"ar",     label:"4. AR & Subjective" },
    { id:"eye",    label:"5. Eye Exam (MD)" },
  ];
  const desig = session.designation || "";
  const TABS = (session.role === "owner" || desig === "MD" || desig === "DEVELOPER" || desig === "OPTOMOLOGIST")
    ? ALL_TABS
    : desig === "OPTOM"
      ? ALL_TABS.filter(t => t.id !== "eye")
      : ALL_TABS.filter(t => t.id === "basic"); // FRONT DESK STAFF → patient info only
  const filtered = rows.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) || r.patientId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="K Sheet Entry" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({id,...r})=>r), "k_sheet.csv")} onAdd={can("patientBill","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setTab("basic"); setMrLookup(""); setModal(true); } : null} msg={msg} />
      <div style={{ marginBottom:12 }}><input type="text" placeholder="🔍 Search by name, phone, MR No, Patient ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", maxWidth:420, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} /></div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>Age</th><th>Complaint</th><th>IOP</th><th>Optom</th><th>By</th><th>Branch</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11, color:"#9b8e82", whiteSpace:"nowrap" }}>{r.timestamp}</td>
              <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo}</td><td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{r.patientId || "—"}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone}</td><td>{r.gender}</td><td>{r.age}</td>
              <td style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.complaint || "—"}</td>
              <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.iop || "—"}</td>
              <td style={{ fontSize:12, color:"#9b8e82" }}>{r.optom || "—"}</td>
              <td style={{ fontSize:11, color:"#9b8e82" }}>{r.createdByName||"—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="K Sheet Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save K Sheet" xl>
          <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>{TABS.map(t => <button key={t.id} className={`btn btn-sm ${tab===t.id?"btn-dark":"btn-outline"}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
          
          {tab==="basic" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1", background:"#f0ede8", borderRadius:10, padding:"12px 14px" }}><label style={{ fontWeight:700 }}>🔗 Link to OP Registration</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button></div>{mrLookup && <div style={{ fontSize:12, marginTop:6, color: mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
              <div><label>MR No (Read Only)</label><input type="text" value={form.mrNo} readOnly style={{ fontWeight: 700 }} /></div>
              <div><label>Patient ID (Read Only)</label><input type="text" value={form.patientId} readOnly style={{ fontWeight: 700 }} /></div>
              <div><label>Timestamp (Auto)</label><input type="text" value={form.timestamp} readOnly /></div>
              <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
              <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
              <div style={{ gridColumn:"span 3" }}></div>
              <div style={{ gridColumn:"span 2" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} style={vStyle(form.name, v=>v.trim().length>0, touch.name)} onBlur={T("name")} /></div>
              <div><label>Phone *</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} style={vStyle(form.phone, validate.phone, touch.phone)} onBlur={T("phone")} /></div>
              <div style={{ gridColumn:"1/-1" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
              <div><label>Gender</label><select value={form.gender} onChange={F("gender")}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label>Age</label><input type="number" value={form.age} onChange={F("age")} /></div>
            </div>
          )}

          {tab==="vitals" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ gridColumn:"1/-1" }}><label>Complaint</label><textarea rows={2} value={form.complaint} onChange={F("complaint")} /></div>
              <div style={{ gridColumn:"1/-1" }}><label>Past History</label><textarea rows={2} value={form.pastHistory} onChange={F("pastHistory")} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Medical History & Rx</div>
                <div><label>HTN</label><input type="text" value={form.htn} onChange={F("htn")} /></div><div><label>Rx</label><input type="text" value={form.htnRx} onChange={F("htnRx")} /></div>
                <div><label>DM</label><input type="text" value={form.dm} onChange={F("dm")} /></div><div><label>Rx</label><input type="text" value={form.dmRx} onChange={F("dmRx")} /></div>
                <div><label>CAD</label><input type="text" value={form.cad} onChange={F("cad")} /></div><div><label>Rx</label><input type="text" value={form.cadRx} onChange={F("cadRx")} /></div>
                <div><label>Asthmatic</label><input type="text" value={form.asthmatic} onChange={F("asthmatic")} /></div><div><label>Rx</label><input type="text" value={form.asthmaticRx} onChange={F("asthmaticRx")} /></div>
                <div><label>Allergies To</label><input type="text" value={form.allergies} onChange={F("allergies")} /></div><div><label>Rx</label><input type="text" value={form.allergiesRx} onChange={F("allergiesRx")} /></div>
                <div><label>Others</label><input type="text" value={form.others} onChange={F("others")} /></div><div><label>Rx</label><input type="text" value={form.othersRx} onChange={F("othersRx")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Vitals & Dilation</div>
                <div><label>IOP</label><input type="text" value={form.iop} onChange={F("iop")} /></div><div><label>BP</label><input type="text" value={form.bp} onChange={F("bp")} /></div>
                <div><label>Ducts</label><input type="text" value={form.ducts} onChange={F("ducts")} /></div><div><label>RBS</label><input type="text" value={form.rbs} onChange={F("rbs")} /></div>
                <div style={{ gridColumn:"span 2" }}><label>Dilated with (D/T/H/C)</label><input type="text" value={form.dilatedWith} onChange={F("dilatedWith")} /></div>
                <div style={{ gridColumn:"span 2" }}><label>Dilated Continuee</label><input type="text" value={form.dilatedContinuee} onChange={F("dilatedContinuee")} /></div>
                <div style={{ gridColumn:"span 2" }}><label>Optom Name</label><input type="text" value={form.optom} onChange={F("optom")} /></div>
              </div>
            </div>
          )}

          {tab==="acuity" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>PG</div>
                <div><label>PG.OD</label><input type="text" value={form.pgOd} onChange={F("pgOd")} /></div><div><label>Add+</label><input type="text" value={form.pgOdAdd} onChange={F("pgOdAdd")} /></div>
                <div><label>OS</label><input type="text" value={form.pgOs} onChange={F("pgOs")} /></div><div><label>Add</label><input type="text" value={form.pgOsAdd} onChange={F("pgOsAdd")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Visual Acuity OD</div>
                <div><label>VA OD</label><input type="text" value={form.vaOd} onChange={F("vaOd")} /></div><div><label>OD cPGP</label><input type="text" value={form.odCpgp} onChange={F("odCpgp")} /></div>
                <div><label>OD PH</label><input type="text" value={form.odPh} onChange={F("odPh")} /></div><div><label>OD NV</label><input type="text" value={form.odNv} onChange={F("odNv")} /></div><div><label>OD PGP-</label><input type="text" value={form.odPgp} onChange={F("odPgp")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Visual Acuity OS</div>
                <div><label>VA OS</label><input type="text" value={form.vaOs} onChange={F("vaOs")} /></div><div><label>OS cPGP</label><input type="text" value={form.osCpgp} onChange={F("osCpgp")} /></div>
                <div><label>OS PH</label><input type="text" value={form.osPh} onChange={F("osPh")} /></div><div><label>OS PV / NV</label><input type="text" value={form.osPv} onChange={F("osPv")} /></div><div><label>OS PGP-</label><input type="text" value={form.osPgp} onChange={F("osPgp")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label>Retinoscopy OD</label><input type="text" value={form.retinoscopyOd} onChange={F("retinoscopyOd")} /></div><div><label>Retinoscopy OS</label><input type="text" value={form.retinoscopyOs} onChange={F("retinoscopyOs")} /></div>
              </div>
            </div>
          )}

          {tab==="ar" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Right Eye (RE) — AR</div>
                {rxField("Spherical","reSpherAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Cylinder","reCylAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Axis","reAxisAR",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Left Eye (LE) — AR</div>
                {rxField("Spherical","leSpherAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Cylinder","leCylAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Axis","leAxisAR",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Right Eye (RE) — Subjective</div>
                {rxField("Spherical","reSpherSub",validate.sphereCyl,"-6 to +6")}{rxField("Cylinder","reCylSub",validate.sphereCyl,"-6 to +6")}{rxField("Axis","reAxisSub",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Left Eye (LE) — Subjective</div>
                {rxField("Spherical","leSpherSub",validate.sphereCyl,"-6 to +6")}{rxField("Cylinder","leCylSub",validate.sphereCyl,"-6 to +6")}{rxField("Axis","leAxisSub",validate.axis,"0–180")}
              </div>
              <div style={{ maxWidth:220 }}>
                <label>ADD (Subjective)</label><input type="number" step="0.25" value={form.add||""} onChange={F("add")} onBlur={T("add")} style={vStyle(form.add,v=>!v||validate.add(v),touch.add)} />{vMsg(form.add,v=>!v||validate.add(v),touch.add,"0 or 0.75–3.00 in steps 0.25")}
              </div>
            </div>
          )}

          {tab==="eye" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Eye Examination (Ophthalmologist)</div>
              {["eyelids","conjunctiva","cornea","anteriorChamber","iris","pupil","lens","ocularMovements","fundus"].map(k => (
                <div key={k}><label>{k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</label><input type="text" value={form[k]||""} onChange={F(k)} /></div>
              ))}
              <div style={{ gridColumn:"1/-1" }}><label>Advice</label><textarea rows={2} value={form.advice} onChange={F("advice")} /></div>
              <div style={{ gridColumn:"span 2" }}><label>Ophthalmologist Name</label><input type="text" value={form.ophthalmologist} onChange={F("ophthalmologist")} /></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function OptometristSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = safeArray(data.optometrist).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [mrLookup, setMrLookup] = useState("");
  const [search, setSearch] = useState("");

  const blank = () => ({ timestamp: ts(), date: todayStr(), time: timeStr(), mrNo:"", patientId:"", name:"", phone:"", complaint:"", pastHistory:"", optomName: session.name });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (found) {
      const ksheet = safeArray(data.patientBill).find(b => b.mrNo === found.mrNo || b.patientId === found.patientId);
      setForm(f => ({ ...f, mrNo: found.mrNo || "", patientId: found.patientId || "", name: found.name, phone: found.phone, complaint: ksheet?.complaint || f.complaint, pastHistory: ksheet?.pastHistory || f.pastHistory }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else { setMrLookup("No match found."); }
  };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name required."); return; }
    const { _lookup, ...cleanForm } = form; // Strip out the temporary search field
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...cleanForm, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("optometrist", arr=>[...arr, record], record); setModal(false); setMsg("Saved.");
  };

  const del = id => { if (confirm("Delete?")) { mutate("optometrist", arr=>arr.filter(x=>x.id!==id)); audit("DELETE",{type:"optometrist",id}); } };
  const filtered = rows.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) || r.patientId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Optometrist" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({id,...r})=>r),"optometrist.csv")} onAdd={can("optometrist","add") ? () => { setForm(blank()); setMsg(""); setMrLookup(""); setModal(true); } : null} msg={msg} />
      <div style={{ marginBottom:12 }}><input type="text" placeholder="🔍 Search by name, MR No, Patient ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", maxWidth:420, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} /></div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Complaint</th><th>Past History</th><th>Optometrist</th><th>Branch</th>{isOwner&&<th></th>}</tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11,color:"#9b8e82",whiteSpace:"nowrap" }}>{r.timestamp}</td><td style={{ fontWeight:700,fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontFamily:"monospace",color:"#1d4ed8" }}>{r.patientId||"—"}</td><td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone}</td>
              <td style={{ maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.complaint||"—"}</td><td style={{ maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.pastHistory||"—"}</td>
              <td style={{ fontSize:12,color:"#9b8e82" }}>{r.optomName||"—"}</td><td><span className="tag" style={{ background:"#f0ede8",color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Optometrist Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save">
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}><label style={{ fontWeight:700 }}>🔗 Look Up Patient</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button></div>{mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo} onChange={F("mrNo")} /></div><div><label>Patient ID</label><input type="text" value={form.patientId} onChange={F("patientId")} /></div>
            <div><label>Name *</label><input type="text" value={form.name} onChange={F("name")} /></div><div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Complaint</label><textarea rows={3} value={form.complaint} onChange={F("complaint")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Past History</label><textarea rows={3} value={form.pastHistory} onChange={F("pastHistory")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Optometrist Name</label><input type="text" value={form.optomName} onChange={F("optomName")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OpticalsSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = safeArray(data.opticals).filter(x => (isOwner || x.branch === branch));

  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [msg,      setMsg]      = useState("");
  const [rxPreview,setRxPreview]= useState(null);
  const [mrLookup, setMrLookup] = useState("");
  const [search,   setSearch]   = useState("");

  const blank = () => ({ timestamp: ts(), date: todayStr(), time: timeStr(), mrNo:"", patientId:"", name:"", phone:"", address:"", lensType:"Single Vision", frameNo:"", totalPrice:"", advance:"", advancePaymentMethod:"Cash", transactionId:"", balance:"", deliveryStatus:"Not Ready", optomName: session.name });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const foundOp = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (!foundOp) { setMrLookup("No patient found."); return; }
    const ksheet = safeArray(data.patientBill).find(b => b.mrNo === foundOp.mrNo || b.patientId === foundOp.patientId);
    setForm(f => ({ ...f, mrNo: foundOp.mrNo || "", patientId: foundOp.patientId || "", name: foundOp.name, phone: foundOp.phone, address: foundOp.address || "" }));
    if (ksheet) {
      setRxPreview({ RE: `${ksheet.reSpherSub||"—"} / ${ksheet.reCylSub||"—"} × ${ksheet.reAxisSub||"—"}`, LE: `${ksheet.leSpherSub||"—"} / ${ksheet.leCylSub||"—"} × ${ksheet.leAxisSub||"—"}`, ADD: ksheet.add || "—", lensType: ksheet.lensType || "—", frameNo: ksheet.frameNo || "—" });
      setMrLookup(`✓ Found: ${foundOp.name} (${foundOp.patientId}) — K Sheet loaded`);
    } else { setRxPreview(null); setMrLookup(`✓ Found: ${foundOp.name} — No K Sheet found yet`); }
  };

  const calcBalance = () => { setForm(f => ({ ...f, balance: String(Math.max(0, (parseFloat(f.totalPrice)||0) - (parseFloat(f.advance)||0))) })); };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name required."); return; }
    const { _lookup, ...cleanForm } = form; // Strip out the temporary search field
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...cleanForm, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("opticals", arr=>[...arr, record], record); setModal(false); setMsg("Opticals saved.");
  };

  const del = id => { if (confirm("Delete?")) { mutate("opticals", arr=>arr.filter(x=>x.id!==id)); audit("DELETE",{type:"opticals",id}); } };
  const filtered = rows.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) || r.patientId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Opticals" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({id,...r})=>r),"opticals.csv")} onAdd={can("opticals","add") ? () => { setForm(blank()); setMsg(""); setRxPreview(null); setMrLookup(""); setModal(true); } : null} msg={msg} />
      <div style={{ marginBottom:12 }}><input type="text" placeholder="🔍 Search by name, MR No, Patient ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", maxWidth:420, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} /></div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr>
            <th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th>
            <th>Lens Type</th><th>Frame No</th><th>Total Price</th><th>Advance</th><th>Balance</th>
            <th>Delivery</th><th>Adv. Method</th><th>Txn ID</th><th>Rep</th><th>Branch</th>{isOwner&&<th></th>}
          </tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11,color:"#9b8e82",whiteSpace:"nowrap" }}>{r.timestamp}</td><td style={{ fontWeight:700,fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontFamily:"monospace",color:"#1d4ed8" }}>{r.patientId||"—"}</td><td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone}</td>
              <td><span className="tag tag-blue" style={{ fontSize:10 }}>{r.lensType||"—"}</span></td>
              <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.frameNo||"—"}</td>
              <td style={{ fontWeight:700 }}>{r.totalPrice?`₹${r.totalPrice}`:"—"}</td><td>{r.advance?`₹${r.advance}`:"—"}</td>
              <td style={{ fontWeight:700,color:parseFloat(r.balance)>0?"#dc2626":"#16a34a" }}>{r.balance?`₹${r.balance}`:"—"}</td>
              <td><span className={`tag ${r.deliveryStatus==="Delivered"?"tag-green":r.deliveryStatus==="Not Ready"?"tag-red":"tag-yellow"}`} style={{ fontSize:10 }}>{r.deliveryStatus==="Fixing Completed But Not Delivered"?"Fixing Done":(r.deliveryStatus||"—")}</span></td>
              <td><span className="tag tag-blue">{r.advancePaymentMethod||"—"}</span></td><td style={{ fontSize:11,fontFamily:"monospace",color:"#9b8e82" }}>{r.transactionId||"—"}</td>
              <td style={{ fontSize:11,color:"#9b8e82" }}>{r.optomName||"—"}</td><td><span className="tag" style={{ background:"#f0ede8",color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Opticals Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save Entry" wide>
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}><label style={{ fontWeight:700 }}>🔗 Link to Patient</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up & Fill</button></div>{mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
          {rxPreview && (<div style={{ background:"#e0f2fe",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13 }}><div style={{ fontWeight:700,marginBottom:8,color:"#0369a1" }}>📋 Prescription from K Sheet</div><div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, fontFamily:"monospace" }}><div><span style={{ color:"#9b8e82",fontSize:11 }}>RE</span><br/>{rxPreview.RE}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>LE</span><br/>{rxPreview.LE}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>ADD</span><br/>{rxPreview.ADD}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>Lens Type</span><br/>{rxPreview.lensType}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>Frame No</span><br/>{rxPreview.frameNo}</div></div></div>)}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo} onChange={F("mrNo")} /></div><div><label>Patient ID</label><input type="text" value={form.patientId} onChange={F("patientId")} /></div><div></div>
            <div style={{ gridColumn:"span 2" }}><label>Name</label><input type="text" value={form.name} onChange={F("name")} /></div><div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Lens Type</label><select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><label>Frame No</label><input type="text" placeholder="e.g. FR-A12" value={form.frameNo} onChange={F("frameNo")} /></div>
            <div><label>Total Price (₹) *</label><input type="number" value={form.totalPrice} onChange={F("totalPrice")} onBlur={calcBalance} /></div><div><label>Advance (₹)</label><input type="number" value={form.advance} onChange={F("advance")} onBlur={calcBalance} /></div><div><label>Balance (₹)</label><input type="number" value={form.balance} readOnly style={{ background:"#f0ede8" }} /></div>
            <div><label>Advance Payment Method</label><select value={form.advancePaymentMethod} onChange={F("advancePaymentMethod")}>{["Cash","UPI","Card","Cheque","NA"].map(m=><option key={m}>{m}</option>)}</select></div>
            {(form.advancePaymentMethod==="UPI"||form.advancePaymentMethod==="Card"||form.advancePaymentMethod==="Cheque") && (<div><label>Txn ID / Ref No</label><input type="text" value={form.transactionId} onChange={F("transactionId")} /></div>)}
            <div style={{ gridColumn:"1/-1" }}><label>Delivery Status</label><select value={form.deliveryStatus} onChange={F("deliveryStatus")}>{DELIVERY_STATUS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label>Representative Name</label><input type="text" value={form.optomName} onChange={F("optomName")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InventorySection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = safeArray(data.stock).filter(x => isOwner || x.branch === branch);
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
    if (modal === "add") { mutate("stock", arr => [...arr, { id: uid(), ...item, createdBy: session.id, createdByName: session.name }], { id: uid(), ...item, createdBy: session.id, createdByName: session.name }); audit("ADD", { type: "stock", sku: item.sku }); }
    else { mutate("stock", arr => arr.map(x => x.id === modal.id ? { ...modal, ...item } : x), { ...modal, ...item }); audit("EDIT", { type: "stock", id: modal.id }); }
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
              <td style={{ fontFamily: "monospace", fontSize: 11 }}>{s.sku}</td><td style={{ fontWeight: 600 }}>{s.name}</td><td><span className="tag tag-blue">{s.category}</span></td>
              <td><span style={{ fontWeight: 700, color: s.qty <= s.reorder ? "#dc2626" : "#16a34a" }}>{s.qty}</span></td><td style={{ fontFamily: "monospace" }}>{s.lensPower || "—"}</td>
              <td>{s.lensType && s.category === "Lenses" ? <span className="tag tag-blue">{s.lensType}</span> : "—"}</td><td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.boxNo || "—"}</td>
              <td style={{ fontWeight: 600 }}>{currency(s.price)}</td><td style={{ fontSize: 12, color: "#9b8e82" }}>{s.location}</td>
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{s.branch}</span></td><td style={{ fontSize: 11, color: "#9b8e82" }}>{s.createdByName || "—"}</td>
              {(can("inventory", "edit") || isOwner) && (<td style={{ display: "flex", gap: 5 }}><button className="btn btn-outline btn-sm" onClick={() => open(s)}>Edit</button>{isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) { mutate("stock", arr => arr.filter(x => x.id !== s.id)); audit("DELETE", { type: "stock", id: s.id }); } }}>✕</button>}</td>)}
            </tr>
          ))}</tbody>
        </table>
