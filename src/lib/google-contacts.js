// src/lib/google-contacts.js
// Browser-only Google Contacts sync for OpticalShopManager.
// - No backend required. OAuth happens client-side via Google Identity Services (GIS).
// - One-way: app -> Google People API (create/update only, never reads or deletes).
// - One shared shop Google account: whoever clicks "Connect to Google" becomes
//   the destination account for ALL patients on this device.
//
// Storage keys (localStorage):
//   gc_cfg      -> { clientId, autoSync }
//   gc_token    -> { access_token, expires_at }
//   gc_sync_map -> { [patientId]: googleResourceName }
//
// Required Google Cloud setup (tell the user):
//   1. Create OAuth 2.0 Client ID (type: Web application) in Google Cloud Console
//   2. Enable "People API" for the project
//   3. Add your app origin (e.g. https://yourapp.com, http://localhost:5173)
//      under "Authorized JavaScript origins"
//   4. Paste the Client ID into the app's Google Contacts settings screen

const SCOPES = "https://www.googleapis.com/auth/contacts";
const PEOPLE_API = "https://people.googleapis.com/v1";
const GIS_SRC = "https://accounts.google.com/gsi/client";

const LS = {
  cfg:   "gc_cfg",
  token: "gc_token",
  map:   "gc_sync_map",
};

// ---------- localStorage helpers ----------
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ---------- Config ----------
export function getConfig() {
  return readJSON(LS.cfg, { clientId: "", autoSync: false });
}
export function setConfig(patch) {
  const next = { ...getConfig(), ...patch };
  writeJSON(LS.cfg, next);
  return next;
}

// ---------- Sync map (patientId -> Google resourceName) ----------
export function getSyncMap() { return readJSON(LS.map, {}); }
export function clearSyncMap() { localStorage.removeItem(LS.map); }
function setMapEntry(patientId, resourceName) {
  const m = getSyncMap();
  m[patientId] = resourceName;
  writeJSON(LS.map, m);
}

// ---------- Token ----------
function getToken() {
  const t = readJSON(LS.token, null);
  if (!t || !t.access_token) return null;
  if (Date.now() > (t.expires_at || 0) - 30_000) return null; // expired / about to expire
  return t;
}
function saveToken(tokenResponse) {
  const expires_at = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
  writeJSON(LS.token, { access_token: tokenResponse.access_token, expires_at });
}
export function isConnected() { return !!getToken(); }
export function signOut() {
  const t = readJSON(LS.token, null);
  localStorage.removeItem(LS.token);
  if (t?.access_token && window.google?.accounts?.oauth2?.revoke) {
    try { window.google.accounts.oauth2.revoke(t.access_token, () => {}); } catch {}
  }
}

// ---------- Load GIS script once ----------
let gisPromise = null;
function loadGIS() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new Error("Failed to load Google Identity Services")); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

// ---------- Sign in ----------
export async function signIn() {
  const { clientId } = getConfig();
  if (!clientId) throw new Error("Google OAuth Client ID is not set. Paste it in the Google Contacts settings.");
  await loadGIS();
  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        prompt: "consent",
        callback: (resp) => {
          if (resp.error) return reject(new Error(resp.error_description || resp.error));
          if (!resp.access_token) return reject(new Error("No access token returned by Google"));
          saveToken(resp);
          resolve(true);
        },
      });
      client.requestAccessToken();
    } catch (e) {
      reject(e);
    }
  });
}

async function ensureToken() {
  const t = getToken();
  if (t) return t.access_token;
  // Try silent re-auth (no consent screen)
  await loadGIS();
  const { clientId } = getConfig();
  if (!clientId) throw new Error("Not connected to Google.");
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      prompt: "",
      callback: (resp) => {
        if (resp.error || !resp.access_token) return reject(new Error("Google session expired. Click Connect to Google again."));
        saveToken(resp);
        resolve(resp.access_token);
      },
    });
    try { client.requestAccessToken(); } catch (e) { reject(e); }
  });
}

// ---------- People API ----------
function patientToPerson(p) {
  const fullName = (p.name || "").trim();
  const [givenName, ...rest] = fullName.split(/\s+/);
  const familyName = rest.join(" ");

  const person = {
    names: fullName ? [{ givenName: givenName || fullName, familyName: familyName || "" }] : [],
    phoneNumbers: p.phone ? [{ value: String(p.phone), type: "mobile" }] : [],
    emailAddresses: p.email ? [{ value: String(p.email), type: "other" }] : [],
    biographies: [{
      value: [
        p.mrNo   ? `MR No: ${p.mrNo}` : null,
        p.age    ? `Age: ${p.age}`    : null,
        p.gender ? `Gender: ${p.gender}` : null,
        p.branch ? `Branch: ${p.branch}` : null,
        p.address? `Address: ${p.address}` : null,
      ].filter(Boolean).join("\n"),
      contentType: "TEXT_PLAIN",
    }],
    userDefined: [
      { key: "PatientID", value: String(p.id || "") },
      p.mrNo ? { key: "MRNo", value: String(p.mrNo) } : null,
    ].filter(Boolean),
  };
  return person;
}

async function peopleFetch(path, { method = "GET", token, body, params } = {}) {
  const url = new URL(PEOPLE_API + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Google People API ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

async function createContact(patient, token) {
  const body = patientToPerson(patient);
  const data = await peopleFetch("/people:createContact", { method: "POST", token, body });
  return data.resourceName; // e.g. "people/c1234567890"
}

async function updateContact(resourceName, patient, token) {
  // Fetch existing to get etag (People API requires it for updates)
  const existing = await peopleFetch(`/${resourceName}`, {
    token,
    params: { personFields: "names,phoneNumbers,emailAddresses,biographies,userDefined,metadata" },
  }).catch(() => null);

  const body = { ...patientToPerson(patient) };
  if (existing?.etag) body.etag = existing.etag;

  const updatePersonFields = "names,phoneNumbers,emailAddresses,biographies,userDefined";
  try {
    const data = await peopleFetch(`/${resourceName}:updateContact`, {
      method: "PATCH", token, body, params: { updatePersonFields },
    });
    return data.resourceName;
  } catch (e) {
    // Contact may have been deleted in Google; fall back to create.
    if (String(e.message).includes("404")) return createContact(patient, token);
    throw e;
  }
}

// ---------- Public sync API ----------
export async function syncOne(patient) {
  if (!patient || !patient.id) throw new Error("Invalid patient");
  const token = await ensureToken();
  const map = getSyncMap();
  const existingRN = map[patient.id];
  const resourceName = existingRN
    ? await updateContact(existingRN, patient, token)
    : await createContact(patient, token);
  setMapEntry(patient.id, resourceName);
  return resourceName;
}

// Auto-sync hook for OP Registration (only runs if autoSync + connected).
export async function autoSyncIfEnabled(patient) {
  try {
    const { autoSync } = getConfig();
    if (!autoSync || !isConnected()) return false;
    await syncOne(patient);
    return true;
  } catch (e) {
    console.warn("[google-contacts] autoSync failed:", e);
    return false;
  }
}

export async function syncMany(patients, onProgress) {
  const total = patients.length;
  let ok = 0;
  const errors = [];
  for (let i = 0; i < total; i++) {
    const p = patients[i];
    try {
      await syncOne(p);
      ok++;
    } catch (e) {
      errors.push({ id: p.id, name: p.name, error: e.message });
    }
    if (onProgress) onProgress({ done: i + 1, total, ok, errors: errors.length });
    // Gentle pacing to stay under People API per-minute quota
    await new Promise(r => setTimeout(r, 120));
  }
  return { ok, total, errors };
}
