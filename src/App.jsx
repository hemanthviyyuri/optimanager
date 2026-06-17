import { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v4.7 — Ophthalmology HMS  |  Manual MR No · Auto Patient ID · K Sheet Exp
// ════════════════════════════════════════════════════════════════════════
const APP_VER  = "4.7";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const SECTIONS = ["patients","patientBill","optometrist","opticals","inventory","invoices","alerts"];
const SECTION_LABELS = { patients:"OP Registration", patientBill:"K Sheet Entry", optometrist:"Optometrist", opticals:"Opticals", inventory:"Inventory", invoices:"Sales & Invoices", alerts:"Low Stock Alerts" };
const LENS_TYPES     = ["Single Vision","Bifocal","Progressive","Anti-Reflective","Photochromic","Blue Cut","UV400","Polarized","High Index 1.60","High Index 1.67","High Index 1.74","Trivex","Polycarbonate","Toric (Contact)","Multifocal (Contact)"];
const DELIVERY_STATUS= ["Delivered","Not Ready","Fixing Completed But Not Delivered"];

const DESIGNATIONS   = ["FRONT DESK STAFF", "OPTOM", "OPTOMOLOGIST", "MD", "DEVELOPER"];

// ════════════════════════════════════════════════════════════════════════
// STYLES & CONSTANTS (Moved to top to prevent rendering crashes)
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

// ════════════════════════════════════════════════════════════════════════
// DEFAULT ACCOUNTS
// ════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
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

async function sbGet(table) {
  if (!_sb) return null;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}?select=*`, { headers: sbHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) ? d : null;
  } catch(e) { return null; }
}

async function sbUpsertOne(table, row) {
  if (!_sb) return { ok: false, error: "Not connected to Supabase" };
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}`, {
      method: "POST",
      headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    return { ok: true, error: null };
  } catch(e) {
    return { ok: false, error: String(e) };
  }
}

async function sbUpsertMany(table, rows) {
  if (!_sb || !rows.length) return true;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}`, {
      method: "POST",
      headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    return r.ok;
  } catch(e) { return false; }
}

async function sbDelete(table, id) {
  if (!_sb) return false;
  const tbl = SB_TABLES[table] || table;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(tbl)}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE", headers: sbHeaders(),
    });
    return r.ok;
  } catch(e) { return false; }
}

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
// LOCAL PERSISTENCE
// ════════════════════════════════════════════════════════════════════════
const LS = {
  get:  (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set:  (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  sess: (v)      => { try { if (v) sessionStorage.setItem("opti_sess", JSON.stringify(v)); else sessionStorage.removeItem("opti_sess"); } catch {} },
  getSess: ()    => { try { return JSON.parse(sessionStorage.getItem("opti_sess")); } catch { return null; } },
};

const SEED_DATA = {
  patients: [], patientBill: [], optometrist: [], opticals: [], stock: [], invoices: [], tasks: [], reminders: [],
};

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

  useEffect(() => { LS.set("opti_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("opti_data_v4",  data);     }, [data]);
  useEffect(() => { LS.set("opti_audit",    auditLog); }, [auditLog]);
  useEffect(() => { LS.set("opti_fields",   fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("opti_sb",       sbCreds);  }, [sbCreds]);

  const syncFromCloud = async (url, key) => {
    if (!url || !key) return;
    initSB(url, key);
    if (!sbReady()) return;
    if (syncing) return;
    setSyncing(true);
    try {
      const [pts, bills, optom, optcl, stk, inv, accs, tsks, rems] = await Promise.all([
        sbGet("patients"), sbGet("patientBill"), sbGet("optometrist"), sbGet("opticals"), sbGet("stock"), sbGet("invoices"), sbGet("accounts"), sbGet("tasks"), sbGet("reminders"),
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

      if (Array.isArray(acc
