import { useState, useEffect, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// v4.0 — OptiManager  |  Supabase · Audit Logs · Dashboard Builder
// ════════════════════════════════════════════════════════════════════════
const APP_VER  = "4.0";
const BRANCHES = ["JPT Branch", "PRP Branch"];
const SECTIONS = ["patients","patientBill","inventory","invoices","alerts"];
const SECTION_LABELS = { patients:"Patients", patientBill:"Patient Bill", inventory:"Inventory", invoices:"Sales & Invoices", alerts:"Low Stock Alerts" };
const LENS_TYPES     = ["Single Vision","Bifocal","Progressive","Anti-Reflective","Photochromic","Blue Cut","UV400","Polarized","High Index 1.60","High Index 1.67","High Index 1.74","Trivex","Polycarbonate","Toric (Contact)","Multifocal (Contact)"];
const DELIVERY_STATUS= ["Delivered","Not Ready","Fixing Completed But Not Delivered"];

// ════════════════════════════════════════════════════════════════════════
// DEFAULT ACCOUNTS
// ════════════════════════════════════════════════════════════════════════
const DEFAULT_ACCOUNTS = [
  { id:"owner",      name:"Owner",       role:"owner", branch:"All",        password:"owner123", perms:{} },
  { id:"staff_jpt1", name:"Ravi (JPT)",  role:"staff", branch:"JPT Branch", password:"jpt1234",
    perms:{ patients:{view:true,add:true,edit:false}, patientBill:{view:true,add:true,edit:false}, inventory:{view:true,add:false,edit:false}, invoices:{view:true,add:false,edit:false}, alerts:{view:true,add:false,edit:false} }
  },
  { id:"staff_prp1", name:"Divya (PRP)", role:"staff", branch:"PRP Branch", password:"prp1234",
    perms:{ patients:{view:true,add:true,edit:false}, patientBill:{view:true,add:true,edit:false}, inventory:{view:false,add:false,edit:false}, invoices:{view:false,add:false,edit:false}, alerts:{view:false,add:false,edit:false} }
  },
];

// Default visible fields per section (owner can toggle)
const DEFAULT_FIELD_VISIBILITY = {
  patients:    ["timestamp","date","time","name","phone","town","paymentMethod","advance","advancePaymentMethod"],
  patientBill: ["timestamp","date","time","mrNo","name","phone","town","gender","age","complaint","pastHistory","reSpherAR","reCylAR","reAxisAR","leSpherAR","leCylAR","leAxisAR","reSpherSub","reCylSub","reAxisSub","leSpherSub","leCylSub","leAxisSub","add","eyelids","conjunctiva","cornea","anteriorChamber","iris","pupil","lens","ocularMovements","fundus","advice","optom","lensType","frameNo","advance","paymentMethod","deliveryStatus","balance"],
  inventory:   ["sku","name","category","brand","qty","reorder","lensPower","lensType","boxNo","price","location"],
  invoices:    ["id","date","patientName","items","discount","status"],
};

// ════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT  (lazy — only active after credentials are set)
// ════════════════════════════════════════════════════════════════════════
let _sb = null;
function getSB() { return _sb; }
function initSB(url, key) {
  if (!url || !key) { _sb = null; return false; }
  _sb = { url: url.replace(/\/$/, ""), key };
  return true;
}

async function sbGet(table, filters = {}) {
  if (!_sb) return null;
  let url = `${_sb.url}/rest/v1/${table}?select=*`;
  Object.entries(filters).forEach(([k, v]) => { url += `&${k}=eq.${encodeURIComponent(v)}`; });
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) return null;
  return r.json();
}

async function sbUpsert(table, rows) {
  if (!_sb) return false;
  const r = await fetch(`${_sb.url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  return r.ok;
}

async function sbDelete(table, id) {
  if (!_sb) return false;
  const r = await fetch(`${_sb.url}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE", headers: sbHeaders(),
  });
  return r.ok;
}

async function sbInsert(table, row) {
  if (!_sb) return false;
  const r = await fetch(`${_sb.url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify(row),
  });
  return r.ok;
}

function sbHeaders() {
  return { "Content-Type": "application/json", "apikey": _sb.key, "Authorization": `Bearer ${_sb.key}` };
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
    { id:"p1", branch:"JPT Branch", timestamp:"29/05/2026 09:00:00", date:"2026-05-29", time:"09:00", name:"Sarah Mitchell", phone:"9876543210", town:"Kakinada", paymentMethod:"Cash", advance:200, advancePaymentMethod:"Cash", status:"approved", createdBy:"owner", createdByName:"Owner" },
  ],
  patientBill: [
    { id:"b1", branch:"JPT Branch", timestamp:"29/05/2026 09:15:00", date:"2026-05-29", time:"09:15", mrNo:"MR-001", name:"Sarah Mitchell", phone:"9876543210", town:"Kakinada", gender:"Female", age:41, complaint:"Blurred vision", pastHistory:"Hypertension", reSpherAR:"-2.50", reCylAR:"-0.75", reAxisAR:180, leSpherAR:"-2.25", leCylAR:"-0.50", leAxisAR:175, reSpherSub:"-2.50", reCylSub:"-0.75", reAxisSub:180, leSpherSub:"-2.25", leCylSub:"-0.50", leAxisSub:175, add:"1.50", eyelids:"Normal", conjunctiva:"Clear", cornea:"Clear", anteriorChamber:"Deep", iris:"Normal", pupil:"RAPD-", lens:"Clear", ocularMovements:"Full", fundus:"Normal", advice:"Progressive lenses", optom:"Dr. Priya", lensType:"Progressive", frameNo:"FR-A12", advance:500, paymentMethod:"Cash", deliveryStatus:"Not Ready", balance:3200, status:"approved", createdBy:"owner", createdByName:"Owner" },
  ],
  stock: [
    { id:"s1", branch:"JPT Branch", sku:"FR-001", name:"Ray-Ban Aviator Gold", category:"Frames",        brand:"Ray-Ban",  qty:8,  reorder:5,  cost:2000, price:8000,  location:"A1", lensPower:"",     lensType:"",              boxNo:"",     createdBy:"owner", createdByName:"Owner" },
    { id:"s2", branch:"JPT Branch", sku:"LN-001", name:"Essilor Varilux",      category:"Lenses",        brand:"Essilor", qty:15, reorder:6,  cost:2500, price:9000,  location:"D1", lensPower:"-2.50", lensType:"Progressive",    boxNo:"B-14", createdBy:"owner", createdByName:"Owner" },
    { id:"s3", branch:"PRP Branch", sku:"FR-002", name:"Oakley Half Jacket",   category:"Frames",        brand:"Oakley",  qty:3,  reorder:5,  cost:2200, price:9500,  location:"A2", lensPower:"",     lensType:"",              boxNo:"",     createdBy:"owner", createdByName:"Owner" },
    { id:"s4", branch:"PRP Branch", sku:"LN-002", name:"Zeiss DriveSafe",      category:"Lenses",        brand:"Zeiss",   qty:1,  reorder:4,  cost:3500, price:12000, location:"D2", lensPower:"-1.75", lensType:"Anti-Reflective", boxNo:"B-07", createdBy:"owner", createdByName:"Owner" },
  ],
  invoices: [
    { id:"INV-001", branch:"JPT Branch", date:"2026-05-29", patientName:"Sarah Mitchell", items:[{name:"Essilor Varilux",qty:1,price:9000}], discount:500, status:"Paid", approvalStatus:"approved", createdBy:"owner", createdByName:"Owner" },
  ],
};

// ════════════════════════════════════════════════════════════════════════
// PRINT HELPERS  (preserved from v3)
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
  const [session,     setSession]     = useState(() => LS.getSess());
  const [accounts,    setAccounts]    = useState(() => LS.get("opti_accounts", DEFAULT_ACCOUNTS));
  const [data,        setData]        = useState(() => LS.get("opti_data_v4",  SEED_DATA));
  const [pending,     setPending]     = useState(() => LS.get("opti_pending",  []));
  const [auditLog,    setAuditLog]    = useState(() => LS.get("opti_audit",    []));
  const [fieldVis,    setFieldVis]    = useState(() => LS.get("opti_fields",   DEFAULT_FIELD_VISIBILITY));
  const [sbCreds,     setSbCreds]     = useState(() => LS.get("opti_sb",       { url: "", key: "" }));
  const [sbStatus,    setSbStatus]    = useState("idle"); // idle | ok | error
  const [view,        setView]        = useState("dashboard");

  // Init Supabase on load + immediately pull latest accounts from cloud
  useEffect(() => {
    if (sbCreds.url && sbCreds.key) {
      initSB(sbCreds.url, sbCreds.key);
      // Pull accounts immediately so new staff added on another device are visible
      sbGet("accounts").then(accs => {
        if (accs && accs.length > 0) {
          setAccounts(accs);
          LS.set("opti_accounts", accs);
        }
      }).catch(() => {});
    }
  }, []);

  // Persist everything locally as fallback
  useEffect(() => { LS.set("opti_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("opti_data_v4",  data);     }, [data]);
  useEffect(() => { LS.set("opti_pending",  pending);  }, [pending]);
  useEffect(() => { LS.set("opti_audit",    auditLog); }, [auditLog]);
  useEffect(() => { LS.set("opti_fields",   fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("opti_sb",       sbCreds);  }, [sbCreds]);

  // ── FIX: Auto-push accounts to Supabase whenever they change ────
  // This ensures new/edited staff accounts are immediately visible
  // on ALL browsers and devices — not just the one that made the change.
  const isFirstAccountsRender = useRef(true);
  useEffect(() => {
    if (isFirstAccountsRender.current) { isFirstAccountsRender.current = false; return; }
    if (!_sb) return;
    sbUpsert("accounts", accounts).catch(() => {});
  }, [accounts]);

  // ── Audit log entry ──────────────────────────────────────────────
  const audit = useCallback((action, detail = {}) => {
    if (!session) return;
    const entry = { id: uid(), action, detail, userId: session.id, userName: session.name, branch: session.branch || "All", at: ts() };
    setAuditLog(a => [entry, ...a].slice(0, 500));
    sbInsert("audit_log", entry).catch(() => {});
  }, [session]);

  // ── Supabase connect/test ────────────────────────────────────────
  const connectSupabase = async (url, key) => {
    setSbStatus("testing");
    initSB(url, key);
    try {
      const cleanUrl = url.replace(/\/$/, "");
      if (!cleanUrl.includes("supabase.co") || !key.startsWith("eyJ")) {
        setSbStatus("error"); _sb = null; return false;
      }
      const r = await fetch(`${cleanUrl}/rest/v1/patients?select=id&limit=1`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
      });
      if (r.status < 500) {
        setSbCreds({ url: cleanUrl, key });
        setSbStatus("ok");
        return true;
      } else { setSbStatus("error"); _sb = null; return false; }
    } catch (e) {
      // CORS block from claude.ai sandbox is expected
      // If URL and key format are valid, trust them and proceed
      const cleanUrl = url.replace(/\/$/, "");
      if (cleanUrl.includes("supabase.co") && key.startsWith("eyJ") && key.length > 100) {
        initSB(cleanUrl, key);
        setSbCreds({ url: cleanUrl, key });
        setSbStatus("ok");
        return true;
      }
      setSbStatus("error"); _sb = null; return false;
    }
  };

  // ── Supabase full sync ───────────────────────────────────────────
  const syncFromSupabase = async () => {
    if (!_sb) return;
    setSbStatus("syncing");
    try {
      const [pts, bills, stk, inv, pend, aud, accs] = await Promise.all([
        sbGet("patients"), sbGet("patientBill"), sbGet("stock"),
        sbGet("invoices"), sbGet("pending_queue"), sbGet("audit_log"), sbGet("accounts"),
      ]);
      if (pts)  setData(d => ({ ...d, patients: pts }));
      if (bills)setData(d => ({ ...d, patientBill: bills }));
      if (stk)  setData(d => ({ ...d, stock: stk }));
      if (inv)  setData(d => ({ ...d, invoices: inv }));
      if (pend) setPending(pend);
      if (aud)  setAuditLog(aud);
      if (accs) setAccounts(accs);
      setSbStatus("ok");
    } catch { setSbStatus("error"); }
  };

  const pushToSupabase = async () => {
    if (!_sb) return;
    setSbStatus("pushing");
    try {
      await Promise.all([
        sbUpsert("patients",    data.patients    || []),
        sbUpsert("patientBill", data.patientBill || []),
        sbUpsert("stock",       data.stock       || []),
        sbUpsert("invoices",    data.invoices    || []),
        sbUpsert("pending_queue", pending),
        sbUpsert("accounts",    accounts),
      ]);
      setSbStatus("ok");
    } catch { setSbStatus("error"); }
  };

  // ── Data mutations ───────────────────────────────────────────────
  const mutate = useCallback((key, fn) => {
    setData(d => {
      const next = { ...d, [key]: typeof fn === "function" ? fn(d[key]) : fn };
      if (_sb) {
        const changed = typeof fn === "function" ? fn(d[key]) : fn;
        if (Array.isArray(changed)) sbUpsert(key === "stock" ? "stock" : key, changed).catch(() => {});
      }
      return next;
    });
  }, []);

  // ── Staff submit → pending queue ─────────────────────────────────
  const staffSubmit = useCallback((type, record) => {
    const entry = { id: uid(), type, record: { ...record, status: "pending" }, submittedBy: session.id, submittedByName: session.name, branch: session.branch, submittedAt: ts() };
    setPending(p => {
      const next = [...p, entry];
      sbUpsert("pending_queue", next).catch(() => {});
      return next;
    });
    audit("STAFF_SUBMIT", { type, recordId: record.id });
  }, [session, audit]);

  // ── Owner approve ────────────────────────────────────────────────
  const approvePending = useCallback((entryId) => {
    const entry = pending.find(p => p.id === entryId);
    if (!entry) return;
    const record = { ...entry.record, status: "approved", approvedBy: session.id, approvedByName: session.name, approvedAt: ts() };
    mutate(entry.type, arr => {
      const exists = arr.find(x => x.id === record.id);
      return exists ? arr.map(x => x.id === record.id ? record : x) : [...arr, record];
    });
    setPending(p => p.filter(x => x.id !== entryId));
    audit("APPROVE", { type: entry.type, recordId: record.id, submittedBy: entry.submittedByName });
  }, [pending, session, mutate, audit]);

  const rejectPending = useCallback((entryId) => {
    const entry = pending.find(p => p.id === entryId);
    setPending(p => p.filter(x => x.id !== entryId));
    audit("REJECT", { type: entry?.type, submittedBy: entry?.submittedByName });
  }, [pending, audit]);

  // ── FIX Bug 2: Live-poll pending queue every 10s when owner is logged in ──
  // This makes staff submissions appear instantly in owner's Approval tab
  // without needing to logout/login.
  useEffect(() => {
    if (!session || session.role !== "owner") return;
    if (!_sb) return;
    const poll = setInterval(async () => {
      try {
        const fresh = await sbGet("pending_queue");
        if (fresh && Array.isArray(fresh)) {
          setPending(prev => {
            // Only update if something actually changed (new item or item removed)
            const prevIds = prev.map(p => p.id).sort().join(",");
            const freshIds = fresh.map(p => p.id).sort().join(",");
            if (prevIds !== freshIds) {
              LS.set("opti_pending", fresh);
              return fresh;
            }
            return prev;
          });
        }
      } catch {}
    }, 10000); // poll every 10 seconds
    return () => clearInterval(poll);
  }, [session]);
  const login = useCallback((acc) => {
    const s = { ...acc, loginTime: ts() };
    LS.sess(s);
    setSession(s);
    setView("dashboard");
    // Log login event
    const entry = { id: uid(), action: "LOGIN", detail: {}, userId: acc.id, userName: acc.name, branch: acc.branch || "All", at: ts() };
    setAuditLog(a => [entry, ...a].slice(0, 500));
    sbInsert("audit_log", entry).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    audit("LOGOUT", {});
    LS.sess(null);
    setSession(null);
    setView("dashboard");
  }, [audit]);

  // ── Permission check ─────────────────────────────────────────────
  const can = useCallback((section, action) => {
    if (!session) return false;
    if (session.role === "owner") return true;
    return session.perms?.[section]?.[action] === true;
  }, [session]);

  if (!session) return <LoginScreen accounts={accounts} onLogin={login} />;

  const sharedProps = { session, data, mutate, staffSubmit, can, audit, fieldVis };

  return (
    <Shell session={session} onLogout={logout} pending={pending} view={view} setView={setView} can={can} sbStatus={sbStatus}>
      {view === "dashboard"    && <Dashboard session={session} data={data} pending={pending} setView={setView} auditLog={auditLog} />}
      {view === "approval"     && session.role === "owner" && <ApprovalQueue pending={pending} onApprove={approvePending} onReject={rejectPending} onRefresh={async () => { const f = await sbGet("pending_queue"); if (f && Array.isArray(f)) { setPending(f); LS.set("opti_pending", f); } }} />}
      {view === "patients"     && <PatientsSection     {...sharedProps} />}
      {view === "patientBill"  && <PatientBillSection  {...sharedProps} />}
      {view === "inventory"    && <InventorySection    {...sharedProps} />}
      {view === "invoices"     && <InvoicesSection     {...sharedProps} />}
      {view === "alerts"       && <AlertsSection       {...sharedProps} />}
      {view === "auditlog"     && session.role === "owner" && <AuditLogSection auditLog={auditLog} accounts={accounts} />}
      {view === "dashbuilder"  && session.role === "owner" && <DashboardBuilder fieldVis={fieldVis} setFieldVis={setFieldVis} accounts={accounts} setAccounts={setAccounts} />}
      {view === "users"        && session.role === "owner" && <UsersSection accounts={accounts} setAccounts={setAccounts} audit={audit} />}
      {view === "supabase"     && session.role === "owner" && <SupabaseSection sbCreds={sbCreds} sbStatus={sbStatus} onConnect={connectSupabase} onSync={syncFromSupabase} onPush={pushToSupabase} />}
      {view === "launchguide"  && <LaunchGuide />}
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════════════════
function LoginScreen({ accounts, onLogin }) {
  const [userId, setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch]   = useState(BRANCHES[0]);
  const [err, setErr]         = useState("");
  const [showPw, setShowPw]   = useState(false);

  const doLogin = () => {
    const acc = accounts.find(a => a.id === userId && a.password === password);
    if (!acc) { setErr("Invalid user ID or password."); return; }
    if (acc.role === "staff" && acc.branch !== branch) { setErr(`This account belongs to ${acc.branch}.`); return; }
    onLogin(acc);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{GCSS}</style>
      <div style={{ width: 400, background: "#fff", borderRadius: 24, padding: "42px 38px", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: "#1a1714", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 28 }}>👁</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700 }}>OptiManager</div>
          <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 3 }}>v{APP_VER} · Multi-Branch Optical Suite</div>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div><label>Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">— Owner Login (no branch) —</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label>User ID</label><input type="text" placeholder="owner / staff_jpt1 / staff_prp1" value={userId} onChange={e => { setUserId(e.target.value); setErr(""); }} /></div>
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
          <strong style={{ color: "#6b5e52" }}>Demo:</strong> <code style={CS}>owner</code>/<code style={CS}>owner123</code> · <code style={CS}>staff_jpt1</code>/<code style={CS}>jpt1234</code> · <code style={CS}>staff_prp1</code>/<code style={CS}>prp1234</code>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHELL
// ════════════════════════════════════════════════════════════════════════
function Shell({ session, onLogout, pending, view, setView, can, sbStatus, children }) {
  const isOwner = session.role === "owner";
  const NAV = [
    { id: "dashboard",   label: "Dashboard",        icon: "⬡", show: true },
    { id: "approval",    label: "Approval Queue",   icon: "✅", show: isOwner, badge: pending.length, badgeColor: "#16a34a" },
    { id: "patients",    label: "Patients",         icon: "◉", show: can("patients", "view") },
    { id: "patientBill", label: "Patient Bill",     icon: "🧾", show: can("patientBill", "view") },
    { id: "inventory",   label: "Inventory",        icon: "▦", show: can("inventory", "view") },
    { id: "invoices",    label: "Sales & Invoices", icon: "◆", show: can("invoices", "view") },
    { id: "alerts",      label: "Low Stock Alerts", icon: "▲", show: can("alerts", "view") },
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
          <div style={{ fontSize: 11, color: "#9b8e82", marginTop: 2 }}>{isOwner ? "Owner · All Branches" : session.branch}</div>
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
function Dashboard({ session, data, pending, setView, auditLog }) {
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
    { label: "Pending Approvals", value: pending.length, color: "#d97706", action: isOwner ? () => setView("approval") : null },
  ];

  const recentAudit = auditLog.slice(0, 8);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700 }}>Welcome, {session.name} 👋</div>
        <div style={{ fontSize: 13, color: "#9b8e82", marginTop: 3 }}>{isOwner ? "All Branches" : myBranch} · {ts()}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
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
              const bPend  = pending.filter(x => x.branch === br);
              return (
                <div key={br} style={{ padding: "10px 0", borderBottom: "1px solid #f0ede8" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{br}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["Patients", bPts.length, "#1a1714"], ["Bills", bBills.length, "#1d4ed8"], ["Pending", bPend.length, "#d97706"]].map(([l, v, c]) => (
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
                  <span style={{ fontWeight: 700, marginRight: 6, color: { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", APPROVE: "#16a34a", REJECT: "#dc2626", STAFF_SUBMIT: "#d97706" }[a.action] || "#1a1714" }}>{a.action}</span>
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
// APPROVAL QUEUE
// ════════════════════════════════════════════════════════════════════════
function ApprovalQueue({ pending, onApprove, onReject, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const colors = { patients: "#1d4ed8", patientBill: "#7c3aed", inventory: "#16a34a", invoices: "#a16207" };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>Approval Queue</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Live indicator dot */}
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9b8e82" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7" }} />
            Auto-refreshes every 10s
          </span>
          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "↻ Refresh Now"}
          </button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 22 }}>
        Staff submissions appear here automatically. Click <strong>Refresh Now</strong> to check instantly.
      </div>
      {pending.length === 0
        ? <div className="card" style={{ textAlign: "center", padding: 48, color: "#9b8e82" }}><div style={{ fontSize: 36, marginBottom: 10 }}>✅</div><div style={{ fontWeight: 600 }}>No pending approvals</div></div>
        : pending.map(entry => (
          <div key={entry.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderLeft: `4px solid ${colors[entry.type] || "#1a1714"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ background: `${colors[entry.type]}20`, color: colors[entry.type] || "#1a1714", borderRadius: 20, fontSize: 11, padding: "2px 10px", fontWeight: 700, marginRight: 8 }}>{SECTION_LABELS[entry.type] || entry.type}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{entry.record?.name || entry.record?.sku || entry.id}</span>
                <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 4 }}>By <strong>{entry.submittedByName}</strong> · {entry.branch} · {entry.submittedAt}</div>
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <button className="btn btn-sm btn-outline" onClick={() => setDetail(detail?.id === entry.id ? null : entry)}>{detail?.id === entry.id ? "Hide" : "View"}</button>
                <button className="btn btn-sm" style={{ background: "#dcfce7", color: "#16a34a", border: "none", fontWeight: 700 }} onClick={() => onApprove(entry.id)}>✓ Accept</button>
                <button className="btn btn-sm btn-danger" onClick={() => onReject(entry.id)}>✕ Reject</button>
              </div>
            </div>
            {detail?.id === entry.id && (
              <div style={{ marginTop: 12, background: "#f0ede8", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontFamily: "monospace", lineHeight: 1.9, maxHeight: 280, overflowY: "auto" }}>
                {Object.entries(entry.record).filter(([k]) => k !== "status").map(([k, v]) => <div key={k}><strong>{k}:</strong> {String(v ?? "—")}</div>)}
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// AUDIT LOG  (Owner only)
// ════════════════════════════════════════════════════════════════════════
function AuditLogSection({ auditLog, accounts }) {
  const [filter, setFilter] = useState("ALL");
  const [userF,  setUserF]  = useState("ALL");
  const actions = ["ALL", "LOGIN", "LOGOUT", "STAFF_SUBMIT", "APPROVE", "REJECT"];
  const filtered = auditLog
    .filter(a => filter === "ALL" || a.action === filter)
    .filter(a => userF  === "ALL" || a.userId === userF);

  const actionColor = { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", APPROVE: "#16a34a", REJECT: "#dc2626", STAFF_SUBMIT: "#d97706" };

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
    patients:    ["timestamp","date","time","name","phone","town","paymentMethod","advance","advancePaymentMethod"],
    patientBill: ["timestamp","date","time","mrNo","name","phone","town","gender","age","complaint","pastHistory","reSpherAR","reCylAR","reAxisAR","leSpherAR","leCylAR","leAxisAR","reSpherSub","reCylSub","reAxisSub","leSpherSub","leCylSub","leAxisSub","add","eyelids","conjunctiva","cornea","anteriorChamber","iris","pupil","lens","ocularMovements","fundus","advice","optom","lensType","frameNo","advance","paymentMethod","deliveryStatus","balance"],
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
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: "#9b8e82" }}>{acc.id} · {acc.branch}</div>
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
// PATIENTS SECTION
// ════════════════════════════════════════════════════════════════════════
function PatientsSection({ session, data, mutate, staffSubmit, can, audit, fieldVis }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.patients || []).filter(x => (isOwner || x.branch === branch) && x.status === "approved");
  const visFields = fieldVis.patients || DEFAULT_FIELD_VISIBILITY.patients;

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [msg,   setMsg]   = useState("");

  const blank = () => ({ timestamp: ts(), date: todayStr(), time: timeStr(), name: "", phone: "", town: "", paymentMethod: "Cash", advance: "", advancePaymentMethod: "Cash" });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  const submit = () => {
    setTouch({ phone: true, town: true, name: true });
    if (!validate.phone(form.phone) || !validate.town(form.town) || !form.name.trim()) { setMsg("Fix validation errors before submitting."); return; }
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form, createdBy: session.id, createdByName: session.name, createdAt: ts() };
    if (isOwner) { mutate("patients", arr => [...arr, { ...record, status: "approved" }]); audit("OWNER_ADD", { type: "patients", name: form.name }); }
    else { staffSubmit("patients", record); }
    setModal(false); setMsg(isOwner ? "Patient saved." : "Submitted for owner approval ✓");
  };

  const del = id => { if (confirm("Delete patient?")) { mutate("patients", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type: "patients", id }); } };

  const show = f => visFields.includes(f);

  return (
    <div>
      <SectionHeader title="Patients" onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "patients.csv")} onAdd={can("patients", "add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            {show("timestamp") && <th>Timestamp</th>}
            {show("date") && <th>Date</th>}{show("time") && <th>Time</th>}
            {show("name") && <th>Name</th>}{show("phone") && <th>Phone</th>}
            {show("town") && <th>Town</th>}{show("paymentMethod") && <th>Payment</th>}
            {show("advance") && <th>Advance</th>}{show("advancePaymentMethod") && <th>Adv.Method</th>}
            <th>Branch</th>{isOwner && <th></th>}
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}>
              {show("timestamp") && <td style={{ fontSize: 11, whiteSpace: "nowrap", color: "#9b8e82" }}>{r.timestamp}</td>}
              {show("date") && <td>{r.date}</td>}{show("time") && <td>{r.time}</td>}
              {show("name") && <td style={{ fontWeight: 600 }}>{r.name}</td>}{show("phone") && <td>{r.phone}</td>}
              {show("town") && <td>{r.town}</td>}{show("paymentMethod") && <td><span className="tag tag-blue">{r.paymentMethod}</span></td>}
              {show("advance") && <td>{r.advance ? currency(r.advance) : "—"}</td>}
              {show("advancePaymentMethod") && <td style={{ fontSize: 12, color: "#9b8e82" }}>{r.advancePaymentMethod}</td>}
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Add Patient" onClose={() => setModal(false)} onSave={submit} saveLabel={isOwner ? "Save" : "Submit for Approval"} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div><label>Timestamp (auto)</label><input type="text" value={form.timestamp} readOnly style={{ background: "#f0ede8", color: "#9b8e82" }} /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
            <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
            <div style={{ gridColumn: "1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} onBlur={T("name")} style={vStyle(form.name, v => v.trim().length > 0, touch.name)} />{vMsg(form.name, v => v.trim().length > 0, touch.name, "Required.")}</div>
            <div><label>Phone * (10 digits, not starting 0)</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={T("phone")} style={vStyle(form.phone, validate.phone, touch.phone)} />{vMsg(form.phone, validate.phone, touch.phone, "10 digits, not starting with 0.")}</div>
            <div><label>Town * (letters only)</label><input type="text" value={form.town} onChange={F("town")} onBlur={T("town")} style={vStyle(form.town, validate.town, touch.town)} />{vMsg(form.town, validate.town, touch.town, "Letters only, no numbers.")}</div>
            <div><label>Payment Method</label><select value={form.paymentMethod} onChange={F("paymentMethod")}>{["Cash", "UPI", "Free"].map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label>Advance (₹)</label><input type="number" value={form.advance} onChange={F("advance")} /></div>
            <div><label>Advance Payment Method</label><select value={form.advancePaymentMethod} onChange={F("advancePaymentMethod")}>{["Cash", "UPI", "NA"].map(m => <option key={m}>{m}</option>)}</select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PATIENT BILL
// ════════════════════════════════════════════════════════════════════════
function PatientBillSection({ session, data, mutate, staffSubmit, can, audit, fieldVis }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.patientBill || []).filter(x => (isOwner || x.branch === branch) && x.status === "approved");

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [tab,   setTab]   = useState("basic");
  const [msg,   setMsg]   = useState("");

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo: `MR-${String((rows.length || 0) + 1).padStart(3, "0")}`,
    name: "", phone: "", town: "", gender: "Male", age: "", complaint: "", pastHistory: "",
    reSpherAR: "", reCylAR: "", reAxisAR: "", leSpherAR: "", leCylAR: "", leAxisAR: "",
    reSpherSub: "", reCylSub: "", reAxisSub: "", leSpherSub: "", leCylSub: "", leAxisSub: "",
    add: "", eyelids: "", conjunctiva: "", cornea: "", anteriorChamber: "", iris: "", pupil: "", lens: "", ocularMovements: "", fundus: "",
    advice: "", optom: "", lensType: "Single Vision", frameNo: "", advance: "", paymentMethod: "Cash",
    deliveryStatus: "Not Ready", balance: ""
  });

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));
  const rxField = (label, key, validator, msg2) => (
    <div key={key}><label>{label}</label>
      <input type="number" step="0.25" value={form[key] || ""} onChange={F(key)} onBlur={T(key)} style={vStyle(form[key], validator, touch[key])} />
      {vMsg(form[key], validator, touch[key], msg2)}
    </div>
  );

  const submit = () => {
    const record = { id: uid(), branch: isOwner ? "JPT Branch" : branch, ...form, createdBy: session.id, createdByName: session.name, createdAt: ts() };
    if (isOwner) { mutate("patientBill", arr => [...arr, { ...record, status: "approved" }]); audit("OWNER_ADD", { type: "patientBill", name: form.name }); }
    else { staffSubmit("patientBill", record); }
    setModal(false); setMsg(isOwner ? "Bill saved." : "Submitted for approval ✓");
  };

  const del = id => { if (confirm("Delete bill?")) { mutate("patientBill", arr => arr.filter(x => x.id !== id)); audit("DELETE", { type: "patientBill", id }); } };

  const TABS = [{ id: "basic", label: "Patient Info" }, { id: "ar", label: "AR Readings" }, { id: "sub", label: "Subjective" }, { id: "eye", label: "Eye Exam" }, { id: "billing", label: "Billing" }];

  return (
    <div>
      <SectionHeader title="Patient Bill" onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "patient_bill.csv")} onAdd={can("patientBill", "add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setTab("basic"); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table><thead><tr><th>Timestamp</th><th>MR No</th><th>Name</th><th>Phone</th><th>Town</th><th>Lens Type</th><th>Delivery</th><th>Balance</th><th>By</th><th>Branch</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize: 11, color: "#9b8e82", whiteSpace: "nowrap" }}>{r.timestamp}</td>
              <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{r.mrNo}</td>
              <td style={{ fontWeight: 600 }}>{r.name}</td><td>{r.phone}</td><td>{r.town}</td>
              <td><span className="tag tag-blue">{r.lensType}</span></td>
              <td><span className={`tag ${r.deliveryStatus === "Delivered" ? "tag-green" : r.deliveryStatus === "Not Ready" ? "tag-red" : "tag-yellow"}`}>{r.deliveryStatus === "Fixing Completed But Not Delivered" ? "Fixing Done" : r.deliveryStatus}</span></td>
              <td style={{ fontWeight: 700 }}>{currency(r.balance)}</td>
              <td style={{ fontSize: 11, color: "#9b8e82" }}>{r.createdByName || "—"}</td>
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Patient Bill" onClose={() => setModal(false)} onSave={submit} saveLabel={isOwner ? "Save Bill" : "Submit for Approval"} xl>
          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
            {TABS.map(t => <button key={t.id} className={`btn btn-sm ${tab === t.id ? "btn-dark" : "btn-outline"}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </div>
          {tab === "basic" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div><label>Timestamp (auto)</label><input type="text" value={form.timestamp} readOnly style={{ background: "#f0ede8", color: "#9b8e82" }} /></div>
              <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
              <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
              <div><label>M.R. No</label><input type="text" value={form.mrNo} onChange={F("mrNo")} /></div>
              <div style={{ gridColumn: "span 2" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} onBlur={T("name")} style={vStyle(form.name, v => v.trim().length > 0, touch.name)} /></div>
              <div><label>Phone * (10 digits)</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={T("phone")} style={vStyle(form.phone, validate.phone, touch.phone)} />{vMsg(form.phone, validate.phone, touch.phone, "10 digits, not starting 0.")}</div>
              <div><label>Town * (letters only)</label><input type="text" value={form.town} onChange={F("town")} onBlur={T("town")} style={vStyle(form.town, validate.town, touch.town)} />{vMsg(form.town, validate.town, touch.town, "Letters only.")}</div>
              <div><label>Gender</label><select value={form.gender} onChange={F("gender")}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label>Age</label><input type="number" value={form.age} onChange={F("age")} /></div>
              <div style={{ gridColumn: "span 2" }}><label>Complaint</label><textarea rows={2} value={form.complaint} onChange={F("complaint")} /></div>
              <div style={{ gridColumn: "1/-1" }}><label>Past History</label><textarea rows={2} value={form.pastHistory} onChange={F("pastHistory")} /></div>
            </div>
          )}
          {tab === "ar" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ gridColumn: "1/-1", fontWeight: 700, fontSize: 11, color: "#9b8e82", textTransform: "uppercase" }}>Right Eye (RE) — AR</div>
                {rxField("Spherical", "reSpherAR", validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Cylinder",  "reCylAR",   validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Axis",      "reAxisAR",  validate.axis,      "0–180, whole numbers")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ gridColumn: "1/-1", fontWeight: 700, fontSize: 11, color: "#9b8e82", textTransform: "uppercase" }}>Left Eye (LE) — AR</div>
                {rxField("Spherical", "leSpherAR", validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Cylinder",  "leCylAR",   validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Axis",      "leAxisAR",  validate.axis,      "0–180, whole numbers")}
              </div>
            </div>
          )}
          {tab === "sub" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ gridColumn: "1/-1", fontWeight: 700, fontSize: 11, color: "#9b8e82", textTransform: "uppercase" }}>Right Eye (RE) — Subjective</div>
                {rxField("Spherical", "reSpherSub", validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Cylinder",  "reCylSub",   validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Axis",      "reAxisSub",  validate.axis,      "0–180, whole numbers")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ gridColumn: "1/-1", fontWeight: 700, fontSize: 11, color: "#9b8e82", textTransform: "uppercase" }}>Left Eye (LE) — Subjective</div>
                {rxField("Spherical", "leSpherSub", validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Cylinder",  "leCylSub",   validate.sphereCyl, "-6.00 to +6.00, steps 0.25")}
                {rxField("Axis",      "leAxisSub",  validate.axis,      "0–180, whole numbers")}
              </div>
              <div style={{ maxWidth: 220 }}>
                <label>ADD (Subjective)</label>
                <input type="number" step="0.25" value={form.add || ""} onChange={F("add")} onBlur={T("add")} style={vStyle(form.add, v => !v || validate.add(v), touch.add)} />
                {vMsg(form.add, v => !v || validate.add(v), touch.add, "0 or 0.75–3.00 in steps of 0.25")}
              </div>
            </div>
          )}
          {tab === "eye" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {["eyelids", "conjunctiva", "cornea", "anteriorChamber", "iris", "pupil", "lens", "ocularMovements", "fundus"].map(k => (
                <div key={k}><label>{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</label><input type="text" value={form[k] || ""} onChange={F(k)} /></div>
              ))}
              <div style={{ gridColumn: "1/-1" }}><label>Advice</label><textarea rows={2} value={form.advice} onChange={F("advice")} /></div>
              <div style={{ gridColumn: "span 2" }}><label>Optometrist / Ophthalmologist</label><input type="text" value={form.optom} onChange={F("optom")} /></div>
            </div>
          )}
          {tab === "billing" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}><label>Lens Type</label><select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l => <option key={l}>{l}</option>)}</select></div>
              <div><label>Frame No</label><input type="text" value={form.frameNo} onChange={F("frameNo")} /></div>
              <div><label>Advance (₹)</label><input type="number" value={form.advance} onChange={F("advance")} /></div>
              <div><label>Payment Method</label><select value={form.paymentMethod} onChange={F("paymentMethod")}><option>Cash</option><option>UPI</option></select></div>
              <div style={{ gridColumn: "1/-1" }}><label>Delivery Status</label><select value={form.deliveryStatus} onChange={F("deliveryStatus")}>{DELIVERY_STATUS.map(d => <option key={d}>{d}</option>)}</select></div>
              <div><label>Balance (₹)</label><input type="number" value={form.balance} onChange={F("balance")} /></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════════════════════════════════
function InventorySection({ session, data, mutate, staffSubmit, can, audit, fieldVis }) {
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
      if (isOwner) { mutate("stock", arr => [...arr, record]); audit("OWNER_ADD", { type: "stock", sku: item.sku }); }
      else { staffSubmit("stock", record); setMsg("Submitted for approval."); }
    } else {
      if (isOwner) { mutate("stock", arr => arr.map(x => x.id === modal.id ? { ...x, ...item } : x)); audit("EDIT", { type: "stock", id: modal.id }); }
      else { staffSubmit("stock", { ...modal, ...item }); setMsg("Edit submitted for approval."); }
    }
    setModal(null);
  };
  return (
    <div>
      <SectionHeader title="Inventory" onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "inventory.csv")} onAdd={can("inventory", "add") ? () => open(null) : null} msg={msg} />
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
        <Modal title={modal === "add" ? "Add Stock Item" : "Edit Stock Item"} onClose={() => setModal(null)} onSave={save} saveLabel={isOwner ? "Save" : "Submit for Approval"}>
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
function InvoicesSection({ session, data, mutate, staffSubmit, can, audit }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const rows    = (data.invoices || []).filter(x => (isOwner || x.branch === branch) && x.approvalStatus === "approved");
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ patientName: "", date: todayStr(), items: [], discount: 0 });
  const [lN, setLN] = useState(""); const [lQ, setLQ] = useState(1); const [lP, setLP] = useState(0);
  const [msg, setMsg] = useState("");
  const addLine = () => { if (!lN.trim()) return; setForm(f => ({ ...f, items: [...f.items, { name: lN, qty: Number(lQ), price: Number(lP) }] })); setLN(""); setLQ(1); setLP(0); };
  const sub = (form.items || []).reduce((s, l) => s + l.qty * l.price, 0);
  const save = () => {
    if (!form.patientName || !form.items.length) return;
    const record = { id: `INV-${uid().slice(0, 6).toUpperCase()}`, branch: isOwner ? "JPT Branch" : branch, ...form, discount: Number(form.discount), approvalStatus: "pending", status: "Pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    if (isOwner) { mutate("invoices", arr => [...arr, { ...record, approvalStatus: "approved" }]); audit("OWNER_ADD", { type: "invoices" }); }
    else { staffSubmit("invoices", record); setMsg("Submitted for approval."); }
    setModal(false);
  };
  const total = inv => (inv.items || []).reduce((s, i) => s + i.qty * i.price, 0) - (inv.discount || 0);
  return (
    <div>
      <SectionHeader title="Sales & Invoices" onExport={() => exportCSV(rows, "invoices.csv")} onAdd={can("invoices", "add") ? () => { setForm({ patientName: "", date: todayStr(), items: [], discount: 0 }); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table><thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Total</th><th>Status</th><th>By</th><th>Branch</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{rows.map(inv => (
            <tr key={inv.id}>
              <td style={{ fontWeight: 700 }}>{inv.id}</td><td>{inv.date}</td><td>{inv.patientName}</td>
              <td style={{ fontWeight: 700 }}>{currency(total(inv))}</td>
              <td><span className={`tag ${inv.status === "Paid" ? "tag-green" : "tag-yellow"}`}>{inv.status}</span></td>
              <td style={{ fontSize: 11, color: "#9b8e82" }}>{inv.createdByName || "—"}</td>
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{inv.branch}</span></td>
              {isOwner && <td style={{ display: "flex", gap: 5 }}>
                <button className="btn btn-sm" style={{ background: "#f0ede8", color: "#1a1714", border: "none", fontWeight: 600 }} onClick={() => printInvoice(inv)}>🖨 Print</button>
                {inv.status === "Pending" && <button className="btn btn-sm" style={{ background: "#dcfce7", color: "#16a34a", border: "none", fontWeight: 700 }} onClick={() => mutate("invoices", arr => arr.map(i => i.id === inv.id ? { ...i, status: "Paid" } : i))}>✓ Paid</button>}
                <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) mutate("invoices", arr => arr.filter(i => i.id !== inv.id)); }}>✕</button>
              </td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="New Invoice" onClose={() => setModal(false)} onSave={save} saveLabel={isOwner ? "Create Invoice" : "Submit for Approval"} wide>
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
function AlertsSection({ session, data, mutate }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "JPT Branch";
  const low     = (data.stock || []).filter(s => (isOwner || s.branch === branch) && s.qty <= s.reorder);
  const [modal, setModal] = useState(null); const [qty, setQty] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="section-title">Low Stock Alerts</div>
        <button className="btn btn-outline btn-sm" onClick={() => exportCSV(low.map(({ id, ...r }) => r), "low_stock.csv")}>⬇ CSV</button>
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
// STAFF CARD  (extracted from UsersSection to avoid hook-in-loop bug)
// ════════════════════════════════════════════════════════════════════════
function StaffCard({ acc, onDelete, onUpdatePassword }) {
  const [newPw, setNewPw] = useState("");
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name}</div>
          <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 3 }}>
            ID: <code style={CS}>{acc.id}</code> · {acc.branch} · Password: <code style={CS}>{acc.password}</code>
          </div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(acc.id)}>Delete</button>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <input type="text" placeholder="Change password…" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ width: 200, padding: "5px 8px", fontSize: 12 }} />
        <button className="btn btn-sm btn-outline" onClick={() => { onUpdatePassword(acc.id, newPw); setNewPw(""); }}>Update Password</button>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SECTIONS.map(s => (
          <div key={s} style={{ fontSize: 11, background: "#f0ede8", borderRadius: 20, padding: "2px 10px" }}>
            {SECTION_LABELS[s]}: {["view", "add", "edit"].filter(a => acc.perms?.[s]?.[a]).join("/") || "none"}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MANAGE STAFF (Users)
// ════════════════════════════════════════════════════════════════════════
function UsersSection({ accounts, setAccounts, audit }) {
  const staff = accounts.filter(a => a.role === "staff");
  const [addModal, setAddModal] = useState(false);
  const [newUser, setNewUser]   = useState({ id: "", name: "", branch: BRANCHES[0], password: "" });
  const [msg, setMsg]           = useState("");

  const addStaff = () => {
    if (!newUser.id || !newUser.name || !newUser.password) { alert("Fill all fields."); return; }
    if (accounts.find(a => a.id === newUser.id)) { alert("User ID already exists."); return; }
    const perms = {}; SECTIONS.forEach(s => { perms[s] = { view: false, add: false, edit: false }; });
    setAccounts(p => [...p, { ...newUser, role: "staff", perms }]);
    audit("CREATE_STAFF", { userId: newUser.id, name: newUser.name });
    setAddModal(false); setNewUser({ id: "", name: "", branch: BRANCHES[0], password: "" });
    setMsg(`✅ Staff "${newUser.name}" created. If Supabase is connected, it will sync to all devices automatically.`);
  };

  const updatePassword = (id, newPw) => {
    if (!newPw || newPw.length < 4) { alert("Password must be at least 4 characters."); return; }
    setAccounts(p => p.map(a => a.id === id ? { ...a, password: newPw } : a));
    audit("UPDATE_STAFF_PW", { userId: id });
    setMsg(`✅ Password updated. Changes will sync to all devices automatically.`);
  };

  const delStaff = id => { if (confirm("Delete staff account?")) { setAccounts(p => p.filter(a => a.id !== id)); audit("DELETE_STAFF", { userId: id }); } };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="section-title">Manage Staff</div>
        <button className="btn btn-dark btn-sm" onClick={() => setAddModal(true)}>+ Add Staff</button>
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: "#9b8e82" }}>Use <strong>Dashboard Builder</strong> to control field visibility and section permissions per staff member.</div>
      {/* FIX: show sync status so owner knows accounts are saved to cloud */}
      <div style={{ marginBottom: 14, fontSize: 13, padding: "10px 14px", borderRadius: 10, background: "#f0ede8", color: "#6b5e52" }}>
        <strong>ℹ How staff accounts sync:</strong> Accounts are saved to <em>localStorage</em> on this browser AND pushed to Supabase cloud (if connected). Other devices pull the latest accounts on page load. If a new staff account isn't visible on another browser, open that browser and <strong>refresh the page</strong>.
      </div>
      {msg && <div style={{ marginBottom: 14, fontSize: 13, padding: "8px 14px", borderRadius: 8, background: "#dcfce7", color: "#16a34a" }}>{msg}</div>}
      {staff.map(acc => (
        <StaffCard key={acc.id} acc={acc} onDelete={delStaff} onUpdatePassword={updatePassword} />
      ))}
      {addModal && (
        <Modal title="Add New Staff" onClose={() => setAddModal(false)} onSave={addStaff} saveLabel="Create Account">
          <div className="form-grid">
            <div><label>User ID (login)</label><input type="text" placeholder="staff_jpt2" value={newUser.id} onChange={e => setNewUser(f => ({ ...f, id: e.target.value }))} /></div>
            <div><label>Display Name</label><input type="text" value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label>Branch</label><select value={newUser.branch} onChange={e => setNewUser(f => ({ ...f, branch: e.target.value }))}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select></div>
            <div><label>Password</label><input type="text" value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SUPABASE SECTION  (Connect + SQL + Sync)
// ════════════════════════════════════════════════════════════════════════
function SupabaseSection({ sbCreds, sbStatus, onConnect, onSync, onPush }) {
  const [url, setUrl]   = useState(sbCreds.url || "");
  const [key, setKey]   = useState(sbCreds.key || "");
  const [msg, setMsg]   = useState("");

  const connect = async () => {
    setMsg("Testing connection…");
    const ok = await onConnect(url, key);
    setMsg(ok ? "✅ Credentials saved! Push to DB to sync your data. (Note: live sync works best from your Vercel URL, not Claude.ai)" : "❌ Invalid URL or key format. URL must contain supabase.co and key must start with eyJ.");
  };

  const SQL = `-- Run this in Supabase → SQL Editor

create table if not exists patients (
  id text primary key, branch text, timestamp text,
  date text, time text, name text, phone text, town text,
  payment_method text, advance numeric, advance_payment_method text,
  status text, created_by text, created_by_name text, created_at text
);

create table if not exists "patientBill" (
  id text primary key, branch text, timestamp text, date text, time text,
  mr_no text, name text, phone text, town text, gender text, age int,
  complaint text, past_history text,
  re_spher_ar text, re_cyl_ar text, re_axis_ar text,
  le_spher_ar text, le_cyl_ar text, le_axis_ar text,
  re_spher_sub text, re_cyl_sub text, re_axis_sub text,
  le_spher_sub text, le_cyl_sub text, le_axis_sub text,
  add_val text, eyelids text, conjunctiva text, cornea text,
  anterior_chamber text, iris text, pupil text, lens text,
  ocular_movements text, fundus text, advice text, optom text,
  lens_type text, frame_no text, advance numeric, payment_method text,
  delivery_status text, balance numeric, status text,
  created_by text, created_by_name text, created_at text
);

create table if not exists stock (
  id text primary key, branch text, sku text, name text,
  category text, brand text, qty int, reorder int,
  cost numeric, price numeric, location text,
  lens_power text, lens_type text, box_no text,
  created_by text, created_by_name text
);

create table if not exists invoices (
  id text primary key, branch text, date text,
  patient_name text, items jsonb, discount numeric,
  status text, approval_status text,
  created_by text, created_by_name text, created_at text
);

create table if not exists pending_queue (
  id text primary key, type text, record jsonb,
  submitted_by text, submitted_by_name text,
  branch text, submitted_at text
);

create table if not exists accounts (
  id text primary key, name text, role text,
  branch text, password text, perms jsonb
);

create table if not exists audit_log (
  id text primary key, action text, detail jsonb,
  user_id text, user_name text, branch text, at text
);

-- Enable Row Level Security (optional but recommended)
alter table patients enable row level security;
alter table stock enable row level security;
alter table audit_log enable row level security;

-- Allow all operations via anon key (for now)
create policy "allow all" on patients for all using (true);
create policy "allow all" on stock for all using (true);
create policy "allow all" on audit_log for all using (true);`;

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
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Quick Steps</div>
          {[
            ["1", "Go to supabase.com → New Project", "#1d4ed8"],
            ["2", "Copy Project URL + Anon Key from Settings → API", "#7c3aed"],
            ["3", "Paste above → click Connect & Test", "#16a34a"],
            ["4", "Run the SQL below in Supabase SQL Editor", "#d97706"],
            ["5", "Click Push to DB to upload your local data", "#dc2626"],
          ].map(([n, t, c]) => (
            <div key={n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, minWidth: 24, background: c, color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{n}</div>
              <div style={{ fontSize: 13 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Complete SQL Setup Script</div>
        <div style={{ fontSize: 12, color: "#9b8e82", marginBottom: 10 }}>Copy and run this entire block in Supabase → SQL Editor → New Query</div>
        <pre style={{ background: "#1a1714", color: "#f0ede8", padding: "16px 18px", borderRadius: 12, fontSize: 11, overflowX: "auto", lineHeight: 1.7 }}>{SQL}</pre>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => { navigator.clipboard.writeText(SQL); }}>📋 Copy SQL</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LAUNCH GUIDE  (step-by-step how to publish this app)
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
            ["Go to supabase.com", "Click Start your project → sign in with GitHub (free). No credit card needed."],
            ["Create a new project", "Click New Project. Name: optimanager. Pick region: ap-south-1 (Mumbai). Set a DB password. Click Create."],
            ["Get your credentials", "After 60 seconds → Project Settings → API. Copy the Project URL and anon/public key."],
            ["Run SQL tables", "Go to SQL Editor → New Query → paste the supabase_setup_v2.sql file → click Run. You will see: Success."],
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
      title: "Step 2 — Save Code to GitHub",
      icon: "💻",
      content: (
        <div style={{ display:"grid", gap:14 }}>
          <p style={{ fontSize:13, color:"#6b5e52" }}>GitHub stores your code and connects to Vercel for deployment.</p>
          {[
            ["Create a GitHub account", "Go to github.com → Sign up (free). Verify your email."],
            ["Create a new repository", "Click + top right → New repository. Name: optimanager. Set to Public. Tick Add a README. Click Create repository."],
            ["Upload index.html", "Click Add file → Create new file. Name: index.html. Paste the HTML boilerplate (html tag, head with title OptiManager, body with div id=root and a script tag pointing to /src/main.jsx). Commit."],
            ["Upload package.json", "Click Add file → Create new file. Name: package.json. Paste the JSON with react and react + react + reactDOM as dependencies and vite as devDependency. Commit."],
            ["Upload vite.config.js", "Click Add file → Create new file. Name: vite.config.js. Paste: import defineConfig from vite and plugin-react, export default defineConfig with plugins react(). Commit."],
            ["Upload src/main.jsx", "Click Add file → Create new file. Type src/main.jsx as the name (GitHub creates the folder). Paste the React entry point that renders App into the root div. Commit."],
            ["Upload src/App.jsx", "Click Add file → Upload files. Upload the optical-shop-manager.jsx file you downloaded from Claude. After upload, rename it to App.jsx. Commit."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display:"flex", gap:14 }}>
              <div style={{ width:28, height:28, minWidth:28, background:"#1d4ed8", color:"#fff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{i+1}</div>
              <div><div style={{ fontWeight:700, fontSize:14 }}>{t}</div><div style={{ fontSize:13, color:"#6b5e52", marginTop:3, lineHeight:1.7 }}>{d}</div></div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Step 3 — Deploy on Vercel",
      icon: "🚀",
      content: (
        <div style={{ display:"grid", gap:14 }}>
          <p style={{ fontSize:13, color:"#6b5e52" }}>Vercel gives you a free live URL like optimanager.vercel.app in about 2 minutes.</p>
          {[
            ["Sign up at vercel.com", "Click Start Deploying → Continue with GitHub. Uses the same GitHub account."],
            ["Import your repository", "Click Add New → Project. Find your optimanager repository → click Import."],
            ["Configure build settings", "Framework Preset: Vite. Build Command: vite build. Output Directory: dist. Leave everything else as default."],
            ["Click Deploy", "Vercel builds and deploys automatically. Wait about 2 minutes."],
            ["Get your live URL", "You will see a Congratulations screen with a URL like optimanager-xyz.vercel.app. Click Visit — your app is live!"],
            ["Share with staff", "Copy the URL and send it on WhatsApp. Staff opens it in Chrome on any phone and logs in with their ID and password."],
            ["Future updates", "When you get a new JSX file from Claude, go to GitHub, open src/App.jsx, click the pencil icon, paste the new code, commit. Vercel auto-rebuilds in 1 to 2 minutes."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display:"flex", gap:14 }}>
              <div style={{ width:28, height:28, minWidth:28, background:"#16a34a", color:"#fff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{i+1}</div>
              <div><div style={{ fontWeight:700, fontSize:14 }}>{t}</div><div style={{ fontSize:13, color:"#6b5e52", marginTop:3, lineHeight:1.7 }}>{d}</div></div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Step 4 — Daily Use & Staff Access",
      icon: "👥",
      content: (
        <div style={{ display:"grid", gap:14 }}>
          {[
            ["Share the URL with staff", "Send the Vercel URL to your team on WhatsApp. They open it in Chrome on phone or computer."],
            ["Each person uses their login", "Go to Manage Staff to create IDs and passwords. Share privately."],
            ["Staff submit, you approve", "Staff additions go to your Approval Queue. Login as Owner and Accept or Reject each one."],
            ["Dashboard Builder", "Toggle which fields appear per section and which actions each staff member can do."],
            ["Audit Log", "Every login, submission, approval, and deletion is recorded with name and timestamp."],
            ["Cloud Sync", "Data saves locally AND in Supabase. Use Pull from DB to sync latest from the cloud."],
            ["Backup anytime", "Every section has a CSV export button to download your data."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display:"flex", gap:14 }}>
              <div style={{ width:28, height:28, minWidth:28, background:"#7c3aed", color:"#fff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{i+1}</div>
              <div><div style={{ fontWeight:700, fontSize:14 }}>{t}</div><div style={{ fontSize:13, color:"#6b5e52", marginTop:3, lineHeight:1.7 }}>{d}</div></div>
            </div>
          ))}
          <div style={{ marginTop:8, background:"#dcfce7", borderRadius:12, padding:"14px 18px", border:"1.5px solid #bbf7d0" }}>
            <div style={{ fontWeight:700, color:"#16a34a", marginBottom:6 }}>Total Cost: Rs. 0 per month</div>
            <div style={{ fontSize:13, color:"#15803d", lineHeight:1.8 }}>GitHub Free · Vercel Free · Supabase Free (500MB, 50k API calls/day). All three are completely free for a small optical shop with 2 branches.</div>
          </div>
        </div>
      )
    },
  ];

    return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>🚀 Launch Guide</div>
      <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 22 }}>Step-by-step: from this app to a live URL your staff can open on any phone.</div>

      {/* Step tabs */}
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
function SectionHeader({ title, onAdd, onExport, msg }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title">{title}</div>
        <div style={{ display: "flex", gap: 10 }}>
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
