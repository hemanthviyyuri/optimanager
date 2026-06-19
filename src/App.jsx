import React, { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v4.9 — Ophthalmology HMS | Fixed Permissions Bug · Staff Editing
// ════════════════════════════════════════════════════════════════════════
const APP_VER  = "4.10";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const SECTIONS = ["patients","patientBill","optometrist","opticals","inventory","invoices","alerts"];
const SECTION_LABELS = { patients:"OP Registration", patientBill:"K Sheet Entry", optometrist:"Optometrist", opticals:"Opticals", inventory:"Inventory", invoices:"Sales & Invoices", alerts:"Low Stock Alerts" };
const LENS_TYPES     = ["Single Vision","Bifocal","Progressive","Anti-Reflective","Photochromic","Blue Cut","UV400","Polarized","High Index 1.60","High Index 1.67","High Index 1.74","Trivex","Polycarbonate","Toric (Contact)","Multifocal (Contact)"];
const DELIVERY_STATUS= ["Delivered","Not Ready","Fixing Completed But Not Delivered"];
const DESIGNATIONS   = ["FRONT DESK STAFF", "OPTOM", "OPTOMOLOGIST", "MD", "COUNSELLING ROOM", "DEVELOPER"];
// Privileged designations: equal to MD/Owner access (Counselling Room excludes Manage Staff + Audit Log)
const hasMDAccess = (s) => !!s && (s.role === "owner" || s.designation === "MD" || s.designation === "COUNSELLING ROOM");
const isCounselling = (s) => !!s && s.designation === "COUNSELLING ROOM";

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
  counselling: "counselling",
};

const K_SHEET_PACK_PREFIX = "\n\n__K_SHEET_FULL__:";
const K_SHEET_DIRECT_FIELDS = new Set(["id","timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory","branch","status","createdBy","createdByName","createdAt"]);
const K_SHEET_INTERNAL_FIELDS = new Set(["_lookup"]);

function unpackKSheetRow(row) {
  const text = typeof row?.pastHistory === "string" ? row.pastHistory : "";
  const idx = text.indexOf(K_SHEET_PACK_PREFIX);
  if (idx < 0) return row;
  try {
    const extra = JSON.parse(decodeURIComponent(text.slice(idx + K_SHEET_PACK_PREFIX.length).trim()));
    return { ...row, ...extra, pastHistory: text.slice(0, idx).trimEnd() };
  } catch { return row; }
}

function packKSheetForLegacyTable(row) {
  const packed = {};
  K_SHEET_DIRECT_FIELDS.forEach(k => { if (row[k] !== undefined) packed[k] = row[k]; });
  const extra = {};
  Object.entries(row || {}).forEach(([k, v]) => {
    if (!K_SHEET_DIRECT_FIELDS.has(k) && !K_SHEET_INTERNAL_FIELDS.has(k) && v !== undefined && v !== null && v !== "") extra[k] = v;
  });
  if (Object.keys(extra).length) {
    const cleanPastHistory = String(row.pastHistory || "").split(K_SHEET_PACK_PREFIX)[0].trimEnd();
    packed.pastHistory = `${cleanPastHistory}${K_SHEET_PACK_PREFIX}${encodeURIComponent(JSON.stringify(extra))}`;
  }
  return packed;
}

const missingColumnFromError = (txt) => String(txt || "").match(/'([^']+)' column/)?.[1] || null;

function sbHeaders() { return { "Content-Type": "application/json", "apikey": _sb.key, "Authorization": `Bearer ${_sb.key}` }; }

async function sbPostPayload(table, payload, prefer) {
  const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
    method: "POST", headers: { ...sbHeaders(), "Prefer": prefer }, body: JSON.stringify(payload),
  });
  if (r.ok) return { ok: true, error: null };
  const errBody = await r.text().catch(() => "");
  return { ok: false, error: `HTTP ${r.status}: ${errBody.slice(0, 300)}`, raw: errBody };
}

async function sbPostPayloadPruned(table, payload, prefer) {
  let nextPayload = payload;
  const removed = new Set();
  for (let i = 0; i < 20; i += 1) {
    const result = await sbPostPayload(table, nextPayload, prefer);
    if (result.ok) return result;
    const col = missingColumnFromError(result.raw);
    if (!col || removed.has(col)) return result;
    removed.add(col);
    const prune = row => { const copy = { ...(row || {}) }; delete copy[col]; return copy; };
    nextPayload = Array.isArray(nextPayload) ? nextPayload.map(prune) : prune(nextPayload);
  }
  return { ok: false, error: "Too many missing database columns." };
}

async function sbGet(table) {
  if (!_sb) return null;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}?select=*`, { headers: sbHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    if (!Array.isArray(d)) return null;
    return table === "patientBill" ? d.map(unpackKSheetRow) : d;
  } catch(e) { return null; }
}

async function sbUpsertOne(table, row) {
  if (!_sb) return { ok: false, error: "Not connected" };
  try {
    const payload = table === "patientBill" ? packKSheetForLegacyTable(row) : row;
    let result = await sbPostPayload(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) result = await sbPostPayloadPruned(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) console.error(`sbUpsertOne [${table}]:`, result.error);
    return result;
  } catch(e) { return { ok: false, error: String(e) }; }
}

function normalizeRowKeys(rows) {
  // PostgREST PGRST102 "All object keys must match" — every row in a bulk
  // upsert must have the exact same set of keys. Union all keys and fill
  // missing ones with null.
  const keySet = new Set();
  for (const r of rows) if (r && typeof r === "object") for (const k of Object.keys(r)) keySet.add(k);
  const keys = Array.from(keySet);
  return rows.map(r => {
    const out = {};
    for (const k of keys) out[k] = (r && k in r) ? r[k] : null;
    return out;
  });
}

async function sbUpsertMany(table, rows) {
  if (!_sb) return { ok: false, error: "Not connected" };
  if (!rows.length) return { ok: true, error: null };
  try {
    const packed = table === "patientBill" ? rows.map(packKSheetForLegacyTable) : rows;
    const payload = normalizeRowKeys(packed);
    let result = await sbPostPayload(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) result = await sbPostPayloadPruned(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) console.warn(`sbUpsertMany ${table}:`, result.error);
    return result;
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

const SEED_DATA = { patients: [], patientBill: [], optometrist: [], opticals: [], stock: [], invoices: [], tasks: [], reminders: [], counselling: [] };
const safeArray = (arr, fallback = []) => Array.isArray(arr) ? arr : fallback;

// ── Dashboard CMS defaults (editable in DashboardCMS view) ──────────────
const DEFAULT_DASH_CMS = {
  blocks: {
    opReg:   { title: "OP Registration (Today)", sub: "New patients today",     bg: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e", icon: "◉",  enabled: true, order: 1, link: "patients"    },
    revisit: { title: "Revisit / Review / Camp", sub: "Returning today",        bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1e3a8a", icon: "↻",  enabled: true, order: 2, link: "patients"    },
    ksheet:  { title: "K Sheets (Today)",        sub: "K Sheet entries today",  bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#14532d", icon: "📋", enabled: true, order: 3, link: "patientBill" },
    revenue: { title: "Revenue (Today)",         sub: "Paid invoices today",    bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", color: "#9d174d", icon: "₹",  enabled: true, order: 4, link: "invoices"    },
  },
  panels: {
    tasks:          { title: "📌 Today's Tasks",          accent: "#d97706", enabled: true, order: 1 },
    reminders:      { title: "🔔 Today's Reminders",      accent: "#1d4ed8", enabled: true, order: 2 },
    advice:         { title: "💊 K Sheet Advice (Today)", accent: "#7c3aed", enabled: true, order: 3, ownerOnly: true },
    branchOverview: { title: "🏥 Branch Overview (Today)",accent: "#16a34a", enabled: true, order: 4, ownerOnly: true },
    activity:       { title: "⚡ Today's Activity",       accent: "#9d174d", enabled: true, order: 5, ownerOnly: true },
  },
};

// ── Patient status (computed from cross-section lookup) ─────────────────
const PATIENT_STATUS = {
  OUT:          { key: "OUT",          label: "Patient Out",          bg: "#e5e7eb", color: "#374151" },
  OPTICALS:     { key: "OPTICALS",     label: "At Opticals",          bg: "#fce7f3", color: "#9d174d" },
  OPTOMOLOGIST: { key: "OPTOMOLOGIST", label: "With Optomologist",    bg: "#ede9fe", color: "#5b21b6" },
  OPTOM:        { key: "OPTOM",        label: "With Optom",           bg: "#dbeafe", color: "#1e3a8a" },
  OP_REG:       { key: "OP_REG",       label: "OP Registered",        bg: "#fef3c7", color: "#92400e" },
  NONE:         { key: "NONE",         label: "Not Registered",       bg: "#f0ede8", color: "#6b5e52" },
};

function getPatientStatus(p, data) {
  if (!p) return PATIENT_STATUS.NONE;
  const mr  = String(p.mrNo || "").toLowerCase();
  const pid = String(p.patientId || "").toLowerCase();
  const nm  = String(p.name || "").toLowerCase();
  const match = (r) => (mr && String(r.mrNo || "").toLowerCase() === mr) || (pid && String(r.patientId || "").toLowerCase() === pid);
  const inv = safeArray(data.invoices).find(i => i.status === "Paid" && (String(i.patientName || "").toLowerCase() === nm || match(i)));
  if (inv) return PATIENT_STATUS.OUT;
  const optl = safeArray(data.opticals).find(match);
  if (optl) return PATIENT_STATUS.OPTICALS;
  const ks = safeArray(data.patientBill).find(match);
  if (ks) {
    if (ks.ophthalmologist || ks.advice || ks.fundus || ks.iris || ks.lens) return PATIENT_STATUS.OPTOMOLOGIST;
    return PATIENT_STATUS.OPTOM;
  }
  if (safeArray(data.patients).find(match)) return PATIENT_STATUS.OP_REG;
  return PATIENT_STATUS.NONE;
}

// ── Task / Reminder color rule: done=green, pending+not overdue=yellow, overdue=red ──
function deadlineColor(item, dateField = "deadline") {
  if (!item) return { bg: "#fef9c3", color: "#a16207", border: "#eab308", label: "Pending" };
  if (item.status === "done") return { bg: "#dcfce7", color: "#14532d", border: "#16a34a", label: "Completed" };
  const dl = item[dateField];
  if (dl) {
    const dlDate = new Date(dl);
    if (!isNaN(dlDate.getTime()) && dlDate < new Date(todayStr())) return { bg: "#fee2e2", color: "#7f1d1d", border: "#dc2626", label: "Overdue" };
  }
  return { bg: "#fef9c3", color: "#854d0e", border: "#eab308", label: "Pending" };
}

export default function App() {
  const [session,  setSession]  = useState(() => LS.getSess());
  const [accounts, setAccounts] = useState(() => safeArray(LS.get("opti_accounts", DEFAULT_ACCOUNTS), DEFAULT_ACCOUNTS));
  const accountsWriteInFlight = useRef(false);
  const [data,     setData]     = useState(() => { const d = LS.get("opti_data_v4", SEED_DATA); return d && typeof d === 'object' ? d : SEED_DATA; });
  const [auditLog, setAuditLog] = useState(() => safeArray(LS.get("opti_audit", [])));
  const [fieldVis, setFieldVis] = useState(() => LS.get("opti_fields", DEFAULT_FIELD_VISIBILITY) || DEFAULT_FIELD_VISIBILITY);
  const [dashCms,  setDashCms]  = useState(() => {
    const v = LS.get("opti_dash_cms", DEFAULT_DASH_CMS);
    return v && v.blocks && v.panels ? v : DEFAULT_DASH_CMS;
  });
  const [sbCreds,  setSbCreds]  = useState(() => LS.get("opti_sb", { url: "", key: "" }));
  
  const [sbStatus, setSbStatus] = useState("idle");
  const [view,     setView]     = useState("dashboard");
  const [lastSync, setLastSync] = useState(null);
  const [syncing,  setSyncing]  = useState(false);

  useEffect(() => { LS.set("opti_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("opti_data_v4",  data);     }, [data]);
  useEffect(() => { LS.set("opti_audit",    auditLog); }, [auditLog]);
  useEffect(() => { LS.set("opti_fields",   fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("opti_dash_cms", dashCms);  }, [dashCms]);
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
    const id = setInterval(() => syncRef.current(sbCreds.url, sbCreds.key), 4000);
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
      {view === "dashboard"    && <Dashboard session={session} data={data} setView={setView} auditLog={auditLog} dashCms={dashCms} />}
      {view === "patientStatus"&& <PatientStatusSection session={session} data={data} onSync={() => syncFromCloud(sbCreds.url, sbCreds.key)} syncing={syncing} />}
      {view === "counselling"  && hasMDAccess(session) && <CounsellingSection {...sharedProps} />}
      {view === "dashcms"      && session.role === "owner" && <DashboardCMS dashCms={dashCms} setDashCms={setDashCms} />}
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
    
    { id: "opticals",     label: "Opticals",         icon: "🔭", show: can("opticals", "view") },
    { id: "inventory",    label: "Inventory",        icon: "▦", show: can("inventory", "view") },
    { id: "invoices",     label: "Sales & Invoices", icon: "◆", show: can("invoices", "view") },
    { id: "alerts",       label: "Low Stock Alerts", icon: "▲", show: can("alerts", "view") },
    { id: "tasks",        label: "Tasks",            icon: "📌", show: true },
    { id: "reminders",    label: "Reminders",        icon: "🔔", show: true },
    { id: "patientStatus",label: "Patient Status",   icon: "🚦", show: true },
    { id: "counselling",  label: "Counselling Room", icon: "💬", show: hasMDAccess(session) },
    { id: "divider" },
    { id: "auditlog",    label: "Audit Log",        icon: "📋", show: isOwner },
    { id: "dashbuilder", label: "Dashboard Builder",icon: "🏗", show: isOwner },
    { id: "dashcms",     label: "Dashboard CMS",    icon: "🎨", show: isOwner },
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

function Dashboard({ session, data, setView, auditLog, dashCms }) {
  const isOwner = session.role === "owner";
  const myBranch = session.branch;
  const cms = dashCms || DEFAULT_DASH_CMS;
  const flt = arr => isOwner ? safeArray(arr) : safeArray(arr).filter(x => x.branch === myBranch);
  const today = todayStr();

  // Live clock — re-renders every second so the dashboard always reflects "now".
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);

  const isToday = (d) => {
    if (!d) return false;
    if (typeof d === "string" && d.startsWith(today)) return true;
    try {
      const parts = String(d).split(/[\s/,-]/).filter(Boolean);
      if (parts.length >= 3) {
        const [dd, mm, yyyy] = parts;
        const iso = `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
        if (iso === today) return true;
      }
    } catch {}
    return false;
  };

  const ptsToday    = flt(data.patients).filter(x => x.status === "approved" && isToday(x.date));
  const billsToday  = flt(data.patientBill).filter(x => x.status === "approved" && isToday(x.date));
  const invsToday   = flt(data.invoices).filter(x => x.approvalStatus === "approved" && x.status === "Paid" && isToday(x.date));
  const revToday    = invsToday.reduce((s, i) => s + safeArray(i.items).reduce((a, x) => a + x.qty * x.price, 0) - (i.discount || 0), 0);
  const revisitToday = ptsToday.filter(x => {
    const v = (x.visitType || "").toLowerCase();
    return v && v !== "new patient" && (v.includes("visit") || v.includes("review") || v.includes("camp"));
  });
  const newRegToday = ptsToday.filter(x => !revisitToday.includes(x));

  const tasksToday = flt(data.tasks).filter(t => isToday(t.deadline) || isToday(t.completedAt) || isToday(t.createdAt));
  const remToday   = flt(data.reminders).filter(r => isToday(r.reminderDate) || isToday(r.completedAt) || isToday(r.createdAt));
  const auditToday = safeArray(auditLog).filter(a => isToday(a.at)).slice(0, 12);

  const blockValues = { opReg: newRegToday.length, revisit: revisitToday.length, ksheet: billsToday.length, revenue: currency(revToday) };
  const blockLinks  = { opReg: "patients", revisit: "patients", ksheet: "patientBill", revenue: "invoices" };
  const blocks = Object.entries(cms.blocks || {})
    .filter(([, b]) => b.enabled !== false)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
    .map(([key, b]) => ({ key, ...b, value: blockValues[key] ?? 0, click: () => setView(b.link || blockLinks[key] || "dashboard") }));

  const sortedPanels = Object.entries(cms.panels || {})
    .filter(([, p]) => p.enabled !== false && (!p.ownerOnly || isOwner))
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  // Today's K Sheets with advice (owner view)
  const adviceToday = billsToday
    .filter(k => (k.advice || k.ophthalmologist || k.fundus))
    .map(k => ({ ...k, _status: getPatientStatus(k, data) }));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 22, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700 }}>Welcome, {session.name} 👋</div>
          <div style={{ fontSize: 13, color: "#9b8e82", marginTop: 3 }}>{isOwner ? "All Branches" : myBranch} · Live · {ts()}</div>
        </div>
        {isOwner && (
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setView("dashcms")}>🎨 Edit Dashboard (CMS)</button>
            <button className="btn btn-outline btn-sm" onClick={() => setView("dashbuilder")}>⚙ Field Builder</button>
          </div>
        )}
      </div>

      {hasMDAccess(session) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 22 }}>
          {blocks.map(b => (
            <div key={b.key} onClick={b.click} style={{ cursor:"pointer", borderRadius: 14, padding: "16px 18px", background: b.bg, color: b.color, boxShadow: "0 2px 8px rgba(0,0,0,.05)", transition:"transform .15s", border:"1px solid rgba(255,255,255,.5)" }}
                 onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform=""}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>{b.title}</div>
                <div style={{ fontSize: 20 }}>{b.icon}</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 800 }}>{b.value}</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: .8 }}>{b.sub}</div>
            </div>
          ))}
        </div>
      )}

      {hasMDAccess(session) && (
        <div className="card" style={{ marginBottom: 18, borderTop: "4px solid #5b21b6" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#5b21b6" }}>🚦 Patient Status (Today)</div>
            <button className="btn btn-outline btn-sm" onClick={() => setView("patientStatus")}>Open Full View</button>
          </div>
          {(() => {
            const todayPts = flt(data.patients).filter(x => isToday(x.date)).map(p => ({ ...p, _status: getPatientStatus(p, data) }));
            if (!todayPts.length) return <div style={{ fontSize:12, color:"#9b8e82" }}>No patients registered today.</div>;
            return (
              <div style={{ overflowX:"auto" }}>
                <table>
                  <thead><tr><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Status</th></tr></thead>
                  <tbody>
                    {todayPts.slice(0, 12).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily:"monospace", fontWeight:700 }}>{p.mrNo || "—"}</td>
                        <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{p.patientId || "—"}</td>
                        <td style={{ fontWeight:600 }}>{p.name}</td>
                        <td>{p.phone}</td>
                        <td><span className="tag" style={{ background:p._status.bg, color:p._status.color }}>{p._status.label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}




      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 18, marginBottom: 18 }}>
        {sortedPanels.map(([key, panel]) => {
          if (key === "tasks") {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: panel.accent }}>{panel.title}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setView("tasks")}>View all</button>
                </div>
                {tasksToday.length === 0 && <div style={{ fontSize:12, color:"#9b8e82" }}>No tasks for today.</div>}
                {tasksToday.map(t => {
                  const c = deadlineColor(t, "deadline");
                  return (
                    <div key={t.id} style={{ padding:"8px 10px", borderRadius:8, background:c.bg, marginBottom:6, borderLeft:`4px solid ${c.border}` }}>
                      <div style={{ fontWeight:700, fontSize:13, color:c.color, textDecoration: t.status==="done" ? "line-through" : "none" }}>{t.title}</div>
                      <div style={{ fontSize:11, color:c.color, opacity:.85 }}>{c.label} · Due {t.deadline} · {t.priority}</div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (key === "reminders") {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: panel.accent }}>{panel.title}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setView("reminders")}>View all</button>
                </div>
                {remToday.length === 0 && <div style={{ fontSize:12, color:"#9b8e82" }}>No reminders for today.</div>}
                {remToday.map(r => {
                  const c = deadlineColor(r, "reminderDate");
                  return (
                    <div key={r.id} style={{ padding:"8px 10px", borderRadius:8, background:c.bg, marginBottom:6, borderLeft:`4px solid ${c.border}` }}>
                      <div style={{ fontWeight:700, fontSize:13, color:c.color, textDecoration: r.status==="done" ? "line-through" : "none" }}>{r.name} <span style={{ fontWeight:400, fontSize:11, opacity:.8 }}>({r.reminderType})</span></div>
                      <div style={{ fontSize:11, color:c.color, opacity:.85 }}>{c.label} · Due {r.reminderDate} · {r.phone || "—"}</div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (key === "advice" && isOwner) {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}`, gridColumn: "1 / -1" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: panel.accent }}>{panel.title}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setView("patientBill")}>Open K Sheets</button>
                </div>
                {adviceToday.length === 0 && <div style={{ fontSize:12, color:"#9b8e82" }}>No K Sheet advice today.</div>}
                {adviceToday.length > 0 && (
                  <div style={{ overflowX:"auto" }}>
                    <table>
                      <thead><tr><th>MR No</th><th>Name</th><th>Patient Status</th><th>Advice</th><th>Ophthalmologist</th></tr></thead>
                      <tbody>
                        {adviceToday.map(k => (
                          <tr key={k.id}>
                            <td style={{ fontFamily:"monospace", fontWeight:700 }}>{k.mrNo || "—"}</td>
                            <td style={{ fontWeight:600 }}>{k.name}</td>
                            <td><span className="tag" style={{ background: k._status.bg, color: k._status.color }}>{k._status.label}</span></td>
                            <td style={{ fontSize:12, color:"#1a1714", maxWidth: 360, whiteSpace:"pre-wrap" }}>{k.advice || "—"}</td>
                            <td style={{ fontSize:12, color:"#6b5e52" }}>{k.ophthalmologist || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          }
          if (key === "branchOverview" && isOwner) {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: panel.accent }}>{panel.title}</div>
                {BRANCHES.map(br => {
                  const bPts   = safeArray(data.patients).filter(x => x.branch === br && x.status === "approved" && isToday(x.date));
                  const bBills = safeArray(data.patientBill).filter(x => x.branch === br && x.status === "approved" && isToday(x.date));
                  const bRev   = safeArray(data.invoices).filter(x => x.branch === br && x.approvalStatus === "approved" && x.status === "Paid" && isToday(x.date));
                  return (
                    <div key={br} style={{ padding: "10px 0", borderBottom: "1px solid #f0ede8" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{br}</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {[["OP Reg", bPts.length, "#92400e", "#fef3c7"], ["K Sheets", bBills.length, "#14532d", "#dcfce7"], ["Invoices", bRev.length, "#9d174d", "#fce7f3"]].map(([l, v, c, bg]) => (
                          <div key={l} style={{ flex: 1, background: bg, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: c, fontWeight: 700 }}>{l}</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (key === "activity" && isOwner) {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: panel.accent }}>{panel.title}</div>
                {auditToday.length === 0 && <div style={{ fontSize: 13, color: "#9b8e82" }}>No activity today.</div>}
                {auditToday.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0ede8", fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, marginRight: 6, color: { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", ADD: "#16a34a", DELETE: "#dc2626", EDIT: "#d97706", TASK_ASSIGN:"#d97706", TASK_COMPLETE:"#16a34a", REMINDER_ADD:"#1d4ed8" }[a.action] || "#1a1714" }}>{a.action}</span>
                      <span style={{ color: "#6b5e52" }}>{a.userName}</span>
                      {a.branch !== "All" && <span style={{ color: "#b5a99e", marginLeft: 5 }}>· {a.branch}</span>}
                    </div>
                    <div style={{ color: "#b5a99e", fontSize: 11 }}>{a.at}</div>
                  </div>
                ))}
              </div>
            );
          }
          return null;
        })}
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
    if (form.visitType === "Camp" && !String(form.ref || "").trim()) { setMsg("Ref/Camp is required when Visit Type is Camp."); return; }
    if (form.id) {
      const updated = { ...form, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
      mutate("patients", arr => arr.map(x => x.id === form.id ? { ...x, ...updated } : x), updated);
      audit("EDIT", { type: "patients", id: form.id, name: form.name });
      setModal(false); setMsg("Patient updated.");
      return;
    }
    const record = { id: uid(), ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patients", arr => [...arr, record], record);
    audit("ADD", { type: "patients", name: form.name });
    setModal(false); setMsg("Patient registered successfully.");
  };

  const del = id => { if (confirm("Delete patient?")) { mutate("patients", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type: "patients", id }); } };
  const openEdit = (row) => { setForm({ ...row }); setTouch({}); setMsg(""); setDupWarning(null); setModal(true); };
  const canEdit = isOwner || can("patients", "edit");

  const filtered = rows.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search) || r.mrNo?.toLowerCase().includes(search.toLowerCase()) || r.patientId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="OP Registration" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "op_registration.csv")} onAdd={can("patients","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setDupWarning(null); setModal(true); } : null} msg={msg} />
      <div style={{ marginBottom: 12 }}>
        <input type="text" placeholder="🔍 Search by name, phone, MR No, Patient ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", maxWidth: 420, borderRadius: 10, border: "1px solid #e8e2db", padding: "8px 14px", fontSize: 13 }} />
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Payment</th><th>Amount</th><th>Ref/Camp</th><th>Visit</th><th>Branch</th><th>Remarks</th><th></th></tr></thead>
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
              <td><span className="tag" style={{ background:r.visitType === "Camp" ? "#fef3c7" : "#f0ede8", color:r.visitType === "Camp" ? "#92400e" : "#6b5e52" }}>{r.visitType || "New Patient"}</span></td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              <td style={{ fontSize:12, color:"#9b8e82", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>{r.remarks || "—"}</td>
              <td style={{ display:"flex", gap:5 }}>
                <button className="btn btn-outline btn-sm" disabled={!canEdit} style={!canEdit ? { opacity:.35, cursor:"not-allowed" } : {}} onClick={() => canEdit && openEdit(r)}>Edit</button>
                {isOwner && <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button>}
              </td>
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
            <div><label>Visit Type</label><select value={form.visitType} onChange={F("visitType")}>{["New Patient","2nd Visit","3rd Visit","4th Visit","5th Visit","Review","Camp"].map(v => <option key={v}>{v}</option>)}</select></div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} onBlur={T("name")} style={vStyle(form.name, v => v.trim().length > 0, touch.name)} />{vMsg(form.name, v => v.trim().length > 0, touch.name, "Required.")}</div>
            <div><label>Phone * (10 digits)</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={handlePhoneBlur} style={vStyle(form.phone, validate.phone, touch.phone)} />{vMsg(form.phone, validate.phone, touch.phone, "10 digits, not starting 0.")}</div>
            <div style={{ gridColumn:"span 2" }}><label>Address *</label><input type="text" value={form.address} onChange={F("address")} onBlur={T("address")} style={vStyle(form.address, v => v.trim().length > 0, touch.address)} />{vMsg(form.address, v => v.trim().length > 0, touch.address, "Required.")}</div>
            <div><label>Ref / Camp {form.visitType === "Camp" ? "*" : ""}</label><input type="text" placeholder={form.visitType === "Camp" ? "Camp name (required)" : "Camp name or referrer"} value={form.ref} onChange={F("ref")} style={form.visitType === "Camp" && !form.ref ? { borderColor: "#dc2626" } : {}} /></div>
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
    const q = query.toLowerCase();
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === q || p.patientId?.toLowerCase() === q || p.phone === query);
    if (found) {
      // Pull most recent existing K Sheet for this patient (if any) so optometrist's saved data is preserved
      const priorSheets = safeArray(data.patientBill).map(unpackKSheetRow).filter(k =>
        (found.mrNo && k.mrNo?.toLowerCase() === found.mrNo.toLowerCase()) ||
        (found.patientId && k.patientId?.toLowerCase() === found.patientId.toLowerCase()) ||
        (found.phone && k.phone === found.phone)
      );
      const prior = priorSheets.sort((a,b) => (b.timestamp||"").localeCompare(a.timestamp||""))[0];
      setForm(f => {
        const base = { ...f, mrNo: found.mrNo || f.mrNo, patientId: found.patientId || f.patientId, name: found.name, phone: found.phone, address: found.address || found.town || "" };
        if (!prior) return base;
        // Merge prior K Sheet fields (skip identifiers/timestamps and internal/meta keys)
        const skip = new Set(["id","timestamp","date","time","by","branch","status","createdBy","createdByName","createdAt","_lookup"]);
        const merged = { ...prior, ...base };
        Object.keys(prior).forEach(k => {
          if (skip.has(k)) return;
          if (base[k] === "" || base[k] === undefined || base[k] === null) {
            merged[k] = prior[k];
          }
        });
        return merged;
      });
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})${prior ? " — prior K Sheet loaded" : ""}`);
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
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patientBill", arr => [...arr, record], record); 
    audit("ADD",{type:"patientBill",name:form.name}); 
    setModal(false); setMsg("K Sheet saved successfully. Full optom details are packed for lookup sync.");
  };

  const del = id => { if (confirm("Delete K Sheet?")) { mutate("patientBill", arr => arr.filter(x => x.id!==id)); audit("DELETE",{type:"patientBill",id}); } };

  // ── Designation-based tab access control ─────────────────────────────
  // Owner / MD / DEVELOPER / OPTOMOLOGIST → all 5 clinical tabs
  // OPTOM → tabs 1–4 (no eye exam / MD tab)
  // FRONT DESK STAFF → tab 1 only (patient info)
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
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
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
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
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
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Stock" : "Edit Stock"} onClose={() => setModal(null)} onSave={save} saveLabel="Save Inventory">
          <div className="form-grid">
            <div><label>SKU</label><input type="text" value={form.sku} onChange={F("sku")} /></div><div><label>Category</label><select value={form.category} onChange={F("category")}>{["Frames", "Contact Lenses", "Lenses", "Accessories"].map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="full"><label>Name</label><input type="text" value={form.name} onChange={F("name")} /></div>
            <div><label>Brand</label><input type="text" value={form.brand} onChange={F("brand")} /></div><div><label>Location</label><input type="text" value={form.location} onChange={F("location")} /></div>
            <div><label>Qty</label><input type="number" value={form.qty} onChange={F("qty")} /></div><div><label>Reorder At</label><input type="number" value={form.reorder} onChange={F("reorder")} /></div>
            <div><label>Cost (₹)</label><input type="number" value={form.cost} onChange={F("cost")} /></div><div><label>Price (₹)</label><input type="number" value={form.price} onChange={F("price")} /></div>
            {form.category === "Lenses" && <><div><label>Lens Power</label><input type="text" placeholder="-2.50" value={form.lensPower} onChange={F("lensPower")} /></div><div><label>Lens Type</label><select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l => <option key={l}>{l}</option>)}</select></div><div><label>Box Number</label><input type="text" placeholder="B-14" value={form.boxNo} onChange={F("boxNo")} /></div></>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function InvoicesSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = safeArray(data.invoices).filter(x => (isOwner || x.branch === branch));
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ patientName: "", date: todayStr(), items: [], discount: 0 });
  const [lN, setLN] = useState(""); const [lQ, setLQ] = useState(1); const [lP, setLP] = useState(0);
  const [msg, setMsg] = useState("");
  
  const addLine = () => { if (!lN.trim()) return; setForm(f => ({ ...f, items: [...f.items, { name: lN, qty: Number(lQ), price: Number(lP) }] })); setLN(""); setLQ(1); setLP(0); };
  const sub = safeArray(form.items).reduce((s, l) => s + l.qty * l.price, 0);
  
  const save = () => {
    if (!form.patientName || !form.items.length) return;
    const record = { id: `INV-${uid().slice(0, 6).toUpperCase()}`, branch: isOwner ? "JPT Branch" : branch, ...form, discount: Number(form.discount), approvalStatus: "approved", status: "Pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("invoices", arr => [...arr, record], record); audit("ADD", { type: "invoices" }); setModal(false);
  };
  const total = inv => safeArray(inv.items).reduce((s, i) => s + i.qty * i.price, 0) - (inv.discount || 0);
  
  return (
    <div>
      <SectionHeader title="Sales & Invoices" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows, "invoices.csv")} onAdd={can("invoices", "add") ? () => { setForm({ patientName: "", date: todayStr(), items: [], discount: 0 }); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table><thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Total</th><th>Status</th><th>By</th><th>Branch</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{rows.map(inv => (
            <tr key={inv.id}>
              <td style={{ fontWeight: 700 }}>{inv.id}</td><td>{inv.date}</td><td>{inv.patientName}</td><td style={{ fontWeight: 700 }}>{currency(total(inv))}</td>
              <td><span className={`tag ${inv.status === "Paid" ? "tag-green" : "tag-yellow"}`}>{inv.status}</span></td><td style={{ fontSize: 11, color: "#9b8e82" }}>{inv.createdByName || "—"}</td><td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{inv.branch}</span></td>
              <td style={{ display: "flex", gap: 5 }}>
                {(isOwner || can("invoices", "edit")) && inv.status === "Pending" && <button className="btn btn-sm" style={{ background: "#dcfce7", color: "#16a34a", border: "none", fontWeight: 700 }} onClick={() => mutate("invoices", arr => arr.map(i => i.id === inv.id ? { ...i, status: "Paid" } : i))}>✓ Paid</button>}
                {isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) mutate("invoices", arr => arr.filter(i => i.id !== inv.id)); }}>✕</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="New Invoice" onClose={() => setModal(false)} onSave={save} saveLabel="Create Invoice" wide>
          <div className="form-grid" style={{ marginBottom: 14 }}><div><label>Patient Name</label><input type="text" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} /></div><div><label>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div></div>
          <label>Add Item</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input type="text" placeholder="Item name" value={lN} onChange={e => setLN(e.target.value)} style={{ flex: 2 }} /><input type="number" placeholder="Qty" value={lQ} onChange={e => setLQ(e.target.value)} style={{ width: 60 }} /><input type="number" placeholder="₹" value={lP} onChange={e => setLP(e.target.value)} style={{ width: 90 }} /><button className="btn btn-dark btn-sm" onClick={addLine}>Add</button></div>
          {form.items.length > 0 && <div style={{ background: "#faf9f7", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>{form.items.map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{l.name} × {l.qty}</span><span style={{ fontWeight: 600 }}>{currency(l.qty * l.price)}</span></div>)}<div style={{ borderTop: "1px solid #e8e2db", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Sub</span><span>{currency(sub)}</span></div></div>}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><div style={{ flex: 1 }}><label>Discount (₹)</label><input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 11, color: "#9b8e82" }}>TOTAL</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>{currency(sub - Number(form.discount))}</div></div></div>
        </Modal>
      )}
    </div>
  );
}

function AlertsSection({ session, data, mutate, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const low     = safeArray(data.stock).filter(s => (isOwner || s.branch === branch) && s.qty <= s.reorder);
  const [modal, setModal] = useState(null); const [qty, setQty] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="section-title">Low Stock Alerts</div>
        <div style={{ display: "flex", gap: 10 }}>{onSync && <button className="btn btn-outline btn-sm" onClick={onSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync"}</button>}<button className="btn btn-outline btn-sm" onClick={() => exportCSV(low.map(({ id, ...r }) => r), "low_stock.csv")}>⬇ CSV</button></div>
      </div>
      {low.length === 0 ? <div className="card" style={{ textAlign: "center", padding: 48, color: "#9b8e82" }}><div style={{ fontSize: 36, marginBottom: 10 }}>✓</div><div style={{ fontWeight: 600 }}>All stock levels healthy</div></div> : low.map(s => (
        <div key={s.id} style={{ background: "#fff9f5", border: "1.5px solid #fed7aa", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 12, color: "#9b8e82", marginTop: 2 }}>{s.sku} · {s.branch} · Box: {s.boxNo || "—"}</div></div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}><div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#9b8e82" }}>Stock / Reorder</div><div><span style={{ fontWeight: 700, color: "#dc2626", fontSize: 16 }}>{s.qty}</span><span style={{ color: "#9b8e82" }}> / {s.reorder}</span></div></div>{isOwner && <button className="btn btn-dark btn-sm" onClick={() => { setModal(s); setQty(s.reorder - s.qty + 10); }}>+ Restock</button>}</div>
        </div>
      ))}
      {modal && <Modal title="Restock" onClose={() => setModal(null)} onSave={() => { mutate("stock", p => p.map(s => s.id === modal.id ? { ...s, qty: s.qty + Number(qty) } : s)); setModal(null); }} saveLabel="Update" width={360}><div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 12 }}>{modal.name}</div><label>Units to Add</label><input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} /><div style={{ fontSize: 13, color: "#9b8e82", marginTop: 8 }}>New total: {modal.qty + Number(qty)}</div></Modal>}
    </div>
  );
}

function TasksSection({ session, data, mutate, audit, accounts, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const allTasks = safeArray(data.tasks);
  const rows = isOwner ? allTasks : allTasks.filter(t => t.assignedTo === session.id);
  const [modal, setModal] = useState(false); const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState(""); const [filter,setFilter]= useState("all"); 
  const staffList = safeArray(accounts).filter(a => a.role === "staff");
  const blank = () => ({ title: "", description: "", assignedTo: staffList[0]?.id || "", deadline: todayStr(), priority: "Medium" });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) { setMsg("Task title required."); return; }
    const record = { id: uid(), ...form, status: "pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("tasks", arr => [...arr, record], record); audit("TASK_ASSIGN", { title: form.title, assignedTo: form.assignedTo }); setModal(false); setMsg("Task assigned.");
  };

  const markDone = (task) => {
    const updated = { ...task, status: "done", completedAt: ts() };
    mutate("tasks", arr => arr.map(x => x.id === task.id ? updated : x), updated); audit("TASK_COMPLETE", { title: task.title });
  };
  const del = id => { if (confirm("Delete task?")) { mutate("tasks", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type:"tasks", id }); } };
  const isOverdue = t => t.status === "pending" && new Date(t.deadline) < new Date(todayStr());
  const filtered = rows.filter(t => { if (filter === "pending") return t.status === "pending" && !isOverdue(t); if (filter === "done") return t.status === "done"; if (filter === "overdue") return isOverdue(t); return true; });
  const staffName = id => staffList.find(s => s.id === id)?.name || id;
  const priorityColor = p => ({ High:"#dc2626", Medium:"#d97706", Low:"#16a34a" }[p] || "#9b8e82");

  return (
    <div>
      <SectionHeader title="Tasks" onSync={onSync} syncing={syncing} onAdd={isOwner ? () => { setForm(blank()); setMsg(""); setModal(true); } : null} msg={msg} />
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>{["all","pending","overdue","done"].map(f => (<button key={f} className={`btn btn-sm ${filter===f?"btn-dark":"btn-outline"}`} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>))}</div>
      <div style={{ display:"grid", gap:10 }}>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No tasks here.</div>}
        {filtered.map(t => (
          <div key={t.id} className="card" style={{ padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14, borderLeft: `4px solid ${t.status==="done" ? "#16a34a" : isOverdue(t) ? "#dc2626" : priorityColor(t.priority)}` }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}><div style={{ fontWeight:700, fontSize:15, textDecoration: t.status==="done" ? "line-through" : "none", color: t.status==="done" ? "#9b8e82" : "#1a1714" }}>{t.title}</div><span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:`${priorityColor(t.priority)}20`, color:priorityColor(t.priority) }}>{t.priority}</span>{isOverdue(t) && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:"#fee2e2", color:"#dc2626" }}>⚠ Overdue</span>}{t.status==="done" && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:"#dcfce7", color:"#16a34a" }}>✓ Done</span>}</div>
              {t.description && <div style={{ fontSize:13, color:"#6b5e52", marginBottom:6 }}>{t.description}</div>}
              <div style={{ fontSize:12, color:"#9b8e82", display:"flex", gap:14 }}><span>👤 {staffName(t.assignedTo)}</span><span>📅 Due {t.deadline}</span></div>
            </div>
            <div style={{ display:"flex", gap:8 }}>{t.status === "pending" && (!isOwner ? t.assignedTo === session.id : true) && (<button className="btn btn-outline btn-sm" onClick={()=>markDone(t)}>Mark Done</button>)}{isOwner && <button className="btn btn-danger btn-sm" onClick={()=>del(t.id)}>✕</button>}</div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="Assign Task" onClose={()=>setModal(false)} onSave={submit} saveLabel="Assign Task">
          <div style={{ display:"grid", gap:14 }}>
            <div><label>Title *</label><input type="text" value={form.title} onChange={F("title")} /></div><div><label>Description</label><textarea rows={3} value={form.description} onChange={F("description")} /></div>
            <div><label>Assign To</label><select value={form.assignedTo} onChange={F("assignedTo")}>{staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}</select></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}><div><label>Deadline</label><input type="date" value={form.deadline} onChange={F("deadline")} /></div><div><label>Priority</label><select value={form.priority} onChange={F("priority")}><option>Low</option><option>Medium</option><option>High</option></select></div></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RemindersSection({ session, data, mutate, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const allReminders = safeArray(data.reminders);
  const rows = isOwner ? allReminders : allReminders.filter(r => r.branch === branch);

  const [modal, setModal] = useState(false); const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState(""); const [mrLookup, setMrLookup] = useState("");
  const [filter, setFilter] = useState("upcoming");

  const blank = () => ({ mrNo: "", patientId: "", name: "", phone: "", reminderType: "Lens Delivery", reminderDate: todayStr(), notes: "", branch: isOwner ? "JPT Branch" : branch });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (found) { setForm(f => ({ ...f, mrNo: found.mrNo||"", patientId: found.patientId||"", name: found.name, phone: found.phone })); setMrLookup(`✓ Found: ${found.name} (${found.patientId})`); } else { setMrLookup("No match found."); }
  };

  const submit = () => {
    if (!form.name.trim() || !form.reminderDate) { setMsg("Name and reminder date required."); return; }
    const record = { id: uid(), ...form, status: "pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("reminders", arr => [...arr, record], record); audit("REMINDER_ADD", { name: form.name, type: form.reminderType }); setModal(false); setMsg("Reminder set.");
  };

  const markDone = (rem) => { const updated = { ...rem, status: "done", completedAt: ts() }; mutate("reminders", arr => arr.map(x => x.id === rem.id ? updated : x), updated); };
  const del = id => { if (confirm("Delete reminder?")) { mutate("reminders", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type:"reminders", id }); } };
  const isOverdue = r => r.status === "pending" && new Date(r.reminderDate) < new Date(todayStr());
  const isToday    = r => r.reminderDate === todayStr();
  const filtered = rows.filter(r => { if (filter === "upcoming") return r.status === "pending"; if (filter === "done") return r.status === "done"; return true; }).sort((a,b) => new Date(a.reminderDate) - new Date(b.reminderDate));
  const typeIcon = t => ({ "Lens Delivery":"🕶", "Follow-up Visit":"🔁", "Payment Due":"💰", "Review":"📋" }[t] || "🔔");

  return (
    <div>
      <SectionHeader title="Reminders" onSync={onSync} syncing={syncing} onAdd={() => { setForm(blank()); setMsg(""); setMrLookup(""); setModal(true); }} msg={msg} />
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>{["upcoming","done","all"].map(f => (<button key={f} className={`btn btn-sm ${filter===f?"btn-dark":"btn-outline"}`} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>))}</div>
      <div style={{ display:"grid", gap:10 }}>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No reminders here.</div>}
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, borderLeft: `4px solid ${r.status==="done" ? "#16a34a" : isOverdue(r) ? "#dc2626" : isToday(r) ? "#d97706" : "#9b8e82"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}><div style={{ fontSize:22 }}>{typeIcon(r.reminderType)}</div><div><div style={{ fontWeight:700, fontSize:14, textDecoration: r.status==="done"?"line-through":"none", color: r.status==="done"?"#9b8e82":"#1a1714" }}>{r.name} <span style={{ fontWeight:400, color:"#9b8e82", fontSize:12 }}>({r.mrNo || r.patientId || "—"})</span></div><div style={{ fontSize:12, color:"#6b5e52" }}>{r.reminderType} · {r.phone}</div>{r.notes && <div style={{ fontSize:12, color:"#9b8e82", marginTop:2 }}>{r.notes}</div>}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontWeight:700, fontSize:13, color: isOverdue(r)?"#dc2626":isToday(r)?"#d97706":"#1a1714" }}>{r.reminderDate}</div>{isOverdue(r) && <div style={{ fontSize:10, color:"#dc2626", fontWeight:700 }}>OVERDUE</div>}{isToday(r) && <div style={{ fontSize:10, color:"#d97706", fontWeight:700 }}>TODAY</div>}</div>
            <div style={{ display:"flex", gap:6 }}>{r.status === "pending" && <button className="btn btn-outline btn-sm" onClick={()=>markDone(r)}>Done</button>}<button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="Set Reminder" onClose={()=>setModal(false)} onSave={submit} saveLabel="Set Reminder">
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}><label style={{ fontWeight:700 }}>🔗 Look Up Patient</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button></div>{mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div><div><label>Patient ID</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} /></div><div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div><label>Reminder Type</label><select value={form.reminderType} onChange={F("reminderType")}>{["Lens Delivery","Follow-up Visit","Payment Due","Review"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label>Reminder Date *</label><input type="date" value={form.reminderDate} onChange={F("reminderDate")} /></div><div style={{ gridColumn:"1/-1" }}><label>Notes</label><textarea rows={2} value={form.notes} onChange={F("notes")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UsersSection({ accounts, setAccounts, audit }) {
  const staff = safeArray(accounts).filter(a => a.role === "staff");
  const [modal, setModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", designation: DESIGNATIONS[0], branch: BRANCHES[0], password: "" });
  
  const openAdd = () => { setForm({ id: "", name: "", designation: DESIGNATIONS[0], branch: BRANCHES[0], password: "" }); setEditMode(false); setModal(true); };
  const openEdit = (acc) => { setForm({ ...acc }); setEditMode(true); setModal(true); };

  const saveStaff = () => {
    if (!form.id || !form.name || !form.password) { alert("Fill all fields."); return; }
    if (editMode) {
      setAccounts(p => safeArray(p).map(a => a.id === form.id ? { ...a, ...form } : a));
      audit("EDIT_STAFF", { userId: form.id, name: form.name });
    } else {
      if (safeArray(accounts).find(a => a.id === form.id)) { alert("User ID already exists."); return; }
      const perms = {}; SECTIONS.forEach(s => { perms[s] = { view: false, add: false, edit: false }; });
      setAccounts(p => [...safeArray(p), { ...form, role: "staff", perms }]);
      audit("CREATE_STAFF", { userId: form.id, name: form.name });
    }
    setModal(false);
  };
  
  const delStaff = id => { if (confirm("Delete staff?")) { setAccounts(p => safeArray(p).filter(a => a.id !== id)); audit("DELETE_STAFF", { userId: id }); } };
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="section-title">Manage Staff</div><button className="btn btn-dark btn-sm" onClick={openAdd}>+ Add Staff</button>
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: "#9b8e82" }}>Use <strong>Dashboard Builder</strong> to control field visibility and section permissions per staff member.</div>
      {staff.map(acc => (
        <div key={acc.id} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name} <span style={{ fontSize: 12, fontWeight: 400, color: "#6b5e52", background: "#f0ede8", padding: "2px 8px", borderRadius: 12, marginLeft: 6 }}>{acc.designation}</span></div><div style={{ fontSize: 12, color: "#9b8e82", marginTop: 4 }}>ID: <code style={CS}>{acc.id}</code> · {acc.branch} · Password: <code style={CS}>{acc.password}</code></div></div>
            <div style={{ display: "flex", gap: 8 }}><button className="btn btn-outline btn-sm" onClick={() => openEdit(acc)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => delStaff(acc.id)}>Delete</button></div>
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
      {modal && (
        <Modal title={editMode ? "Edit Staff" : "Add New Staff"} onClose={() => setModal(false)} onSave={saveStaff} saveLabel={editMode ? "Update Account" : "Create Account"}>
          <div className="form-grid">
            <div><label>User ID (login)</label><input type="text" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} readOnly={editMode} style={editMode ? { background: "#f0ede8", color: "#9b8e82" } : {}} /></div>
            <div><label>Name</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label>Designation</label><select value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>{DESIGNATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label>Branch</label><select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select></div>
            <div><label>Password</label><input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SupabaseSection({ sbCreds, sbStatus, onConnect, onSync, onPush }) {
  const [url, setUrl]   = useState(sbCreds.url || "");
  const [key, setKey]   = useState(sbCreds.key || "");
  const [msg, setMsg]   = useState("");
  const connect = async () => { setMsg("Testing connection…"); const ok = await onConnect(url, key); setMsg(ok ? "✅ Connected!" : "❌ Invalid URL or key format."); };
  const statusColor = { ok: "#16a34a", error: "#dc2626", testing: "#d97706", pushing: "#1d4ed8", syncing: "#7c3aed", idle: "#9b8e82" };

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Cloud Sync</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor[sbStatus] || "#9b8e82", display: "inline-block" }} />Status: <strong>{sbStatus}</strong></div>
          <div style={{ display: "grid", gap: 12 }}><div><label>Supabase URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} /></div><div><label>Anon Key</label><input type="text" value={key} onChange={e => setKey(e.target.value)} /></div></div>
          {msg && <div style={{ marginTop: 10, fontSize: 13 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button className="btn btn-dark btn-sm" onClick={connect}>🔌 Connect & Test</button><button className="btn btn-outline btn-sm" onClick={onSync}>⬇ Pull from DB</button><button className="btn btn-outline btn-sm" onClick={onPush}>⬆ Push to DB</button></div>
        </div>
      </div>
    </div>
  );
}

function LaunchGuide() { return <div style={{ padding: 20 }}>See previous instructions for launch steps.</div>; }

function SectionHeader({ title, onAdd, onExport, onSync, syncing, msg }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div className="section-title">{title}</div><div style={{ display: "flex", gap: 10 }}>{onSync && <button className="btn btn-outline btn-sm" onClick={onSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync"}</button>}{onExport && <button className="btn btn-outline btn-sm" onClick={onExport}>⬇ CSV</button>}{onAdd && <button className="btn btn-dark btn-sm" onClick={onAdd}>+ Add</button>}</div></div>
      {msg && <div style={{ marginTop: 8, fontSize: 13, padding: "8px 14px", borderRadius: 8, background: "#dcfce7", color: "#16a34a" }}>{msg}</div>}
    </div>
  );
}

function Modal({ title, children, onClose, onSave, saveLabel = "Save", wide, xl, width }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: xl ? "min(920px,96vw)" : wide ? "min(700px,96vw)" : width ? width : "min(560px,96vw)" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{title}</div>{children}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-dark" onClick={onSave}>{saveLabel}</button></div>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════════
// Patient Status — cross-section lookup of every patient's current stage
// ════════════════════════════════════════════════════════════════════════
function PatientStatusSection({ session, data, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("ALL");
  const [todayOnly, setTodayOnly] = useState(false);

  const today = todayStr();
  const isToday = (d) => {
    if (!d) return false;
    if (typeof d === "string" && d.startsWith(today)) return true;
    try {
      const parts = String(d).split(/[\s/,-]/).filter(Boolean);
      if (parts.length >= 3) {
        const [dd, mm, yyyy] = parts;
        const iso = `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
        if (iso === today) return true;
      }
    } catch {}
    return false;
  };

  const all = safeArray(data.patients).filter(p => isOwner || p.branch === branch);
  const enriched = all.map(p => ({ ...p, _status: getPatientStatus(p, data) }));
  const filtered = enriched.filter(p => {
    if (statusF !== "ALL" && p._status.key !== statusF) return false;
    if (todayOnly && !isToday(p.date)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.mrNo || "").toLowerCase().includes(q) || (p.patientId || "").toLowerCase().includes(q) || (p.phone || "").includes(q);
  });

  const tally = Object.values(PATIENT_STATUS).map(s => ({ ...s, count: enriched.filter(p => p._status.key === s.key).length }));

  return (
    <div>
      <SectionHeader title="Patient Status" onSync={onSync} syncing={syncing} onExport={() => exportCSV(filtered.map(p => ({ mrNo:p.mrNo, patientId:p.patientId, name:p.name, phone:p.phone, branch:p.branch, status:p._status.label })), "patient_status.csv")} msg="" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginBottom:16 }}>
        {tally.map(t => (
          <div key={t.key} onClick={() => setStatusF(s => s === t.key ? "ALL" : t.key)} style={{ cursor:"pointer", padding:"12px 14px", borderRadius:12, background:t.bg, color:t.color, border: statusF === t.key ? `2px solid ${t.color}` : "2px solid transparent" }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".06em", opacity:.85 }}>{t.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800 }}>{t.count}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        <input type="text" placeholder="🔍 Search name / MR / Patient ID / phone…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:360 }} />
        <button className={`btn btn-sm ${todayOnly?"btn-dark":"btn-outline"}`} onClick={()=>setTodayOnly(t=>!t)}>{todayOnly?"📅 Today only ✓":"📅 Today only"}</button>
        <button className={`btn btn-sm ${statusF==="ALL"?"btn-dark":"btn-outline"}`} onClick={()=>setStatusF("ALL")}>All Statuses</button>
        <div style={{ fontSize:12, color:"#9b8e82", marginLeft:"auto" }}>{filtered.length} patient(s)</div>
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Branch</th><th>Registered</th><th>Current Status</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center", color:"#9b8e82", padding:24 }}>No patients match.</td></tr>}
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily:"monospace", fontWeight:700 }}>{p.mrNo || "—"}</td>
                <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{p.patientId || "—"}</td>
                <td style={{ fontWeight:600 }}>{p.name}</td>
                <td>{p.phone}</td>
                <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{p.branch}</span></td>
                <td style={{ fontSize:11, color:"#9b8e82" }}>{p.date}</td>
                <td><span className="tag" style={{ background:p._status.bg, color:p._status.color }}>{p._status.label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Dashboard CMS — edit blocks (title, color, icon, order, enabled) + panels
// ════════════════════════════════════════════════════════════════════════
function DashboardCMS({ dashCms, setDashCms }) {
  const cms = dashCms || DEFAULT_DASH_CMS;
  const [tab, setTab] = useState("blocks");

  const updBlock = (key, patch) => setDashCms(c => ({ ...c, blocks: { ...c.blocks, [key]: { ...c.blocks[key], ...patch } } }));
  const updPanel = (key, patch) => setDashCms(c => ({ ...c, panels: { ...c.panels, [key]: { ...c.panels[key], ...patch } } }));
  const reset = () => { if (confirm("Reset dashboard to defaults?")) setDashCms(DEFAULT_DASH_CMS); };

  const PALETTES = [
    { label: "Amber",  bg: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e" },
    { label: "Blue",   bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1e3a8a" },
    { label: "Green",  bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#14532d" },
    { label: "Pink",   bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", color: "#9d174d" },
    { label: "Purple", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", color: "#5b21b6" },
    { label: "Teal",   bg: "linear-gradient(135deg,#ccfbf1,#99f6e4)", color: "#115e59" },
    { label: "Slate",  bg: "linear-gradient(135deg,#e2e8f0,#cbd5e1)", color: "#1e293b" },
    { label: "Orange", bg: "linear-gradient(135deg,#ffedd5,#fed7aa)", color: "#9a3412" },
  ];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700 }}>🎨 Dashboard CMS</div>
          <div style={{ fontSize:13, color:"#9b8e82", marginTop:4 }}>Edit titles, colors, icons, order and visibility of every dashboard block. Saved to this device.</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={reset}>↺ Reset to Defaults</button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        <button className={`btn btn-sm ${tab==="blocks"?"btn-dark":"btn-outline"}`} onClick={()=>setTab("blocks")}>📊 Stat Blocks</button>
        <button className={`btn btn-sm ${tab==="panels"?"btn-dark":"btn-outline"}`} onClick={()=>setTab("panels")}>🗂 Panels</button>
      </div>

      {tab === "blocks" && (
        <div style={{ display:"grid", gap:14 }}>
          {Object.entries(cms.blocks).sort((a,b) => (a[1].order||0)-(b[1].order||0)).map(([key, b]) => (
            <div key={key} className="card" style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:18 }}>
              <div style={{ borderRadius:14, padding:"16px 18px", background:b.bg, color:b.color, opacity: b.enabled === false ? .4 : 1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em" }}>{b.title}</div>
                  <div style={{ fontSize:20 }}>{b.icon}</div>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800 }}>0</div>
                <div style={{ fontSize:11, marginTop:4, opacity:.8 }}>{b.sub}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ gridColumn:"1/-1", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#1a1714" }}>{key.toUpperCase()}</div>
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, margin:0, textTransform:"none", letterSpacing:0 }}>
                    <input type="checkbox" checked={b.enabled !== false} onChange={e => updBlock(key, { enabled: e.target.checked })} /> Visible
                  </label>
                </div>
                <div><label>Title</label><input type="text" value={b.title} onChange={e=>updBlock(key,{ title: e.target.value })} /></div>
                <div><label>Subtitle</label><input type="text" value={b.sub || ""} onChange={e=>updBlock(key,{ sub: e.target.value })} /></div>
                <div><label>Icon (emoji / char)</label><input type="text" value={b.icon} onChange={e=>updBlock(key,{ icon: e.target.value })} /></div>
                <div><label>Order</label><input type="number" value={b.order || 0} onChange={e=>updBlock(key,{ order: parseInt(e.target.value)||0 })} /></div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label>Color Palette</label>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {PALETTES.map(p => (
                      <button key={p.label} onClick={()=>updBlock(key,{ bg: p.bg, color: p.color })} style={{ border: b.bg === p.bg ? "2px solid #1a1714" : "1.5px solid #e2ddd8", background:p.bg, color:p.color, borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700 }}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div><label>Background CSS</label><input type="text" value={b.bg} onChange={e=>updBlock(key,{ bg: e.target.value })} /></div>
                <div><label>Text Color</label><input type="text" value={b.color} onChange={e=>updBlock(key,{ color: e.target.value })} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "panels" && (
        <div style={{ display:"grid", gap:12 }}>
          {Object.entries(cms.panels).sort((a,b) => (a[1].order||0)-(b[1].order||0)).map(([key, p]) => (
            <div key={key} className="card" style={{ borderLeft:`4px solid ${p.accent}` }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 80px 80px", gap:12, alignItems:"end" }}>
                <div><label>{key} — Title</label><input type="text" value={p.title} onChange={e=>updPanel(key,{ title: e.target.value })} /></div>
                <div><label>Accent Color</label><input type="text" value={p.accent} onChange={e=>updPanel(key,{ accent: e.target.value })} /></div>
                <div><label>Order</label><input type="number" value={p.order||0} onChange={e=>updPanel(key,{ order: parseInt(e.target.value)||0 })} /></div>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, textTransform:"none", letterSpacing:0 }}>
                  <input type="checkbox" checked={p.enabled !== false} onChange={e => updPanel(key, { enabled: e.target.checked })} /> Show
                </label>
                {p.ownerOnly !== undefined && (
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, textTransform:"none", letterSpacing:0 }}>
                    <input type="checkbox" checked={!!p.ownerOnly} onChange={e => updPanel(key, { ownerOnly: e.target.checked })} /> Owner
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Counselling Room — patient lookup with advice & remarks
// Accessible to MD, Owner, and COUNSELLING ROOM staff
// ════════════════════════════════════════════════════════════════════════
function CounsellingSection({ session, data, mutate, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows = safeArray(data.counselling).filter(x => (isOwner || hasMDAccess(session) || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [mrLookup, setMrLookup] = useState("");
  const [search, setSearch] = useState("");

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo: "", patientId: "", name: "", phone: "",
    advice: "", remarks: "",
    counsellor: session.name, branch: isOwner ? "JPT Branch" : branch,
  });

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const found = safeArray(data.patients).find(p =>
      p.mrNo?.toLowerCase() === q || p.patientId?.toLowerCase() === q || p.phone === query
    );
    if (found) {
      setForm(f => ({ ...f, mrNo: found.mrNo || "", patientId: found.patientId || "", name: found.name, phone: found.phone }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else {
      setMrLookup("No patient found in OP Registration.");
    }
  };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name is required."); return; }
    if (!form.advice.trim() && !form.remarks.trim()) { setMsg("Enter advice or remarks."); return; }
    if (form.id) {
      const updated = { ...form, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
      mutate("counselling", arr => safeArray(arr).map(x => x.id === form.id ? { ...x, ...updated } : x), updated);
      audit("EDIT", { type: "counselling", id: form.id, name: form.name });
      setModal(false); setMsg("Counselling entry updated.");
      return;
    }
    const record = { id: uid(), ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("counselling", arr => [...safeArray(arr), record], record);
    audit("ADD", { type: "counselling", name: form.name });
    setModal(false); setMsg("Counselling entry saved.");
  };

  const del = id => { if (confirm("Delete counselling entry?")) { mutate("counselling", arr => safeArray(arr).filter(x => x.id !== id)); audit("DELETE", { type: "counselling", id }); } };
  const openEdit = (row) => { setForm({ ...row }); setMrLookup(""); setMsg(""); setModal(true); };

  const filtered = rows.filter(r => !search
    || r.name?.toLowerCase().includes(search.toLowerCase())
    || r.mrNo?.toLowerCase().includes(search.toLowerCase())
    || r.patientId?.toLowerCase().includes(search.toLowerCase())
    || r.phone?.includes(search)
  );

  return (
    <div>
      <SectionHeader title="Counselling Room" onSync={onSync} syncing={syncing}
        onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "counselling.csv")}
        onAdd={() => { setForm(blank()); setMrLookup(""); setMsg(""); setModal(true); }} msg={msg} />

      <div style={{ marginBottom: 12 }}>
        <input type="text" placeholder="🔍 Search by name, MR No, Patient ID, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", maxWidth: 420, borderRadius: 10, border: "1px solid #e8e2db", padding: "8px 14px", fontSize: 13 }} />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Advice (Counselling Room)</th><th>Remarks</th><th>Counsellor</th><th>Branch</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} style={{ color: "#9b8e82", textAlign: "center", padding: 24 }}>No counselling entries yet.</td></tr>}
            {filtered.map(r => (
              <tr key={r.id}>
                <td style={{ fontSize: 11, color: "#9b8e82", whiteSpace: "nowrap" }}>{r.timestamp}</td>
                <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{r.mrNo || "—"}</td>
                <td style={{ fontFamily: "monospace", color: "#1d4ed8" }}>{r.patientId || "—"}</td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.phone}</td>
                <td style={{ fontSize: 12, maxWidth: 280, whiteSpace: "pre-wrap" }}>{r.advice || "—"}</td>
                <td style={{ fontSize: 12, color: "#6b5e52", maxWidth: 220, whiteSpace: "pre-wrap" }}>{r.remarks || "—"}</td>
                <td style={{ fontSize: 12, color: "#9b8e82" }}>{r.counsellor || r.createdByName || "—"}</td>
                <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{r.branch}</span></td>
                <td style={{ display: "flex", gap: 5 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button>
                  {isOwner && <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={form.id ? "Edit Counselling Entry" : "New Counselling Entry"} onClose={() => setModal(false)} onSave={submit} saveLabel={form.id ? "Update Entry" : "Save Entry"} wide>
          <div style={{ background: "#f0ede8", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <label style={{ fontWeight: 700 }}>🔗 Look Up Patient</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input type="text" placeholder="Enter MR No, Patient ID or phone…" value={form._lookup || ""} onChange={e => setForm(f => ({ ...f, _lookup: e.target.value }))} style={{ flex: 1 }} />
              <button className="btn btn-dark btn-sm" onClick={() => lookupPatient(form._lookup || "")}>Look Up</button>
            </div>
            {mrLookup && <div style={{ fontSize: 12, marginTop: 6, color: mrLookup.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{mrLookup}</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo || ""} onChange={F("mrNo")} /></div>
            <div><label>Patient ID</label><input type="text" value={form.patientId || ""} onChange={F("patientId")} /></div>
            <div><label>Name *</label><input type="text" value={form.name || ""} onChange={F("name")} /></div>
            <div><label>Phone</label><input type="text" maxLength={10} value={form.phone || ""} onChange={F("phone")} /></div>
            <div style={{ gridColumn: "1/-1" }}><label>Advice (Counselling Room)</label><textarea rows={4} value={form.advice || ""} onChange={F("advice")} placeholder="Counselling advice given to patient…" /></div>
            <div style={{ gridColumn: "1/-1" }}><label>Remarks</label><textarea rows={3} value={form.remarks || ""} onChange={F("remarks")} placeholder="Internal notes / remarks…" /></div>
            <div><label>Counsellor</label><input type="text" value={form.counsellor || ""} onChange={F("counsellor")} /></div>
            {isOwner && <div><label>Branch</label><select value={form.branch} onChange={F("branch")}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select></div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
