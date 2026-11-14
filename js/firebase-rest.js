/* ============ Conexión con Firebase (por su API web, sin librerías) ============
   Lo usan la tienda (solo lectura) y el panel admin.html (lectura y escritura).
   Los datos de conexión se cargan en js/config.js → firebase: { projectId, apiKey }.
*/
(() => {
  "use strict";
  const cfg = () => (window.BUNNY && window.BUNNY.firebase) || {};
  const enabled = () => !!(cfg().projectId && cfg().apiKey);
  const base = () => `${cfg().host || "https://firestore.googleapis.com"}/v1/projects/${cfg().projectId}/databases/(default)/documents`;

  /* ---- conversión de valores de Firestore ---- */
  const enc = v => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === "string") return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  };
  const dec = v => {
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(dec);
    if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
    return null;
  };
  const decDoc = d => ({ id: decodeURIComponent(d.name.split("/").pop()), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, x]) => [k, dec(x)])) });

  /* ---- sesión de la dueña (email + contraseña) ---- */
  const KEY = "bunnyclub-admin-session";
  let session = null;                         // { email, idToken, refreshToken, exp }
  try { session = JSON.parse(localStorage.getItem("bunnyclub-admin-session") || "null"); } catch (e) {}
  const saveSession = () => { try { session ? localStorage.setItem(KEY, JSON.stringify(session)) : localStorage.removeItem(KEY); } catch (e) {} };
  const authErr = code => {
    const c = String(code || "");
    if (/EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS|USER_NOT_FOUND/.test(c)) return "El email o la contraseña no son correctos.";
    if (/TOO_MANY_ATTEMPTS/.test(c)) return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
    if (/USER_DISABLED/.test(c)) return "Esa cuenta está deshabilitada.";
    if (/INVALID_EMAIL/.test(c)) return "El email no es válido.";
    return "No pude iniciar sesión (" + c + ").";
  };
  const identity = (path, body) => fetch(`${cfg().authHost || "https://identitytoolkit.googleapis.com"}/v1/${path}?key=${cfg().apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(authErr(j.error && j.error.message)); return j; });

  async function signIn(email, password) {
    const j = await identity("accounts:signInWithPassword", { email, password, returnSecureToken: true });
    session = { email: j.email || email, idToken: j.idToken, refreshToken: j.refreshToken, exp: Date.now() + (Number(j.expiresIn) || 3600) * 1000 };
    saveSession(); return session;
  }
  async function refresh() {
    if (!session || !session.refreshToken) throw new Error("Sesión vencida.");
    const r = await fetch(`${cfg().tokenHost || "https://securetoken.googleapis.com"}/v1/token?key=${cfg().apiKey}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}` });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { session = null; saveSession(); throw new Error("Tu sesión venció. Volvé a entrar."); }
    session = { email: session.email, idToken: j.id_token, refreshToken: j.refresh_token || session.refreshToken, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
    saveSession();
  }
  async function token() {
    if (!session) throw new Error("Tenés que entrar primero.");
    if (Date.now() > session.exp - 60000) await refresh();
    return session.idToken;
  }
  const signOut = () => { session = null; saveSession(); };
  const resetPassword = email => identity("accounts:sendOobCode", { requestType: "PASSWORD_RESET", email });

  /* ---- base de datos ---- */
  async function call(method, url, body, auth) {
    const headers = {}; if (body) headers["Content-Type"] = "application/json";
    if (auth) headers.Authorization = "Bearer " + await token();
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 404 && method === "GET") return null;
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error((j.error && j.error.message) || ("Error " + r.status)); e.status = r.status; throw e; }
    return method === "DELETE" ? {} : r.json();
  }
  async function list(col, auth) {
    const out = []; let pageToken = "";
    do {
      const j = await call("GET", `${base()}/${col}?pageSize=300&key=${cfg().apiKey}${pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : ""}`, null, auth);
      if (!j) break; (j.documents || []).forEach(d => out.push(decDoc(d))); pageToken = j.nextPageToken || "";
    } while (pageToken);
    return out;
  }
  async function get(col, id, auth) { const j = await call("GET", `${base()}/${col}/${encodeURIComponent(id)}?key=${cfg().apiKey}`, null, auth); return j ? decDoc(j) : null; }
  const set = (col, id, data) => call("PATCH", `${base()}/${col}/${encodeURIComponent(id)}?key=${cfg().apiKey}`, { fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, enc(v)])) }, true);
  const del = (col, id) => call("DELETE", `${base()}/${col}/${encodeURIComponent(id)}?key=${cfg().apiKey}`, null, true);

  window.BunnyDB = { enabled, list, get, set, del, signIn, signOut, resetPassword, refresh, token, session: () => session, hasSession: () => !!session };
})();
