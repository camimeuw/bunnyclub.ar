/* ============ PANEL DE LA TIENDA ============ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const DB = window.BunnyDB;
  const money = n => "$" + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SUBS = ["Partes de arriba", "Partes de abajo", "Vestidos"];
  const MAX_FOTOS = 8;
  let PRODS = [], CODES = [], editing = null;

  /* ---------- avisos ---------- */
  let toastTimer;
  function toast(msg, err) {
    const t = $("#ad-toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), err ? 5200 : 2600);
  }
  const niceErr = e => {
    const m = (e && e.message) || "error";
    if (e && (e.status === 403 || /permission|PERMISSION/.test(m))) return "No tenés permiso para guardar. Entrá con el email de la dueña.";
    if (e && e.status === 401) return "Tu sesión venció. Volvé a entrar.";
    return "No se pudo guardar: " + m;
  };
  const busy = (btn, on) => { btn.disabled = on; btn.setAttribute("aria-busy", String(on)); };

  /* ---------- pantallas ---------- */
  function show(which) { ["ad-setup", "ad-login", "ad-app"].forEach(id => $("#" + id).hidden = id !== which); }
  async function start() {
    if (!DB || !DB.enabled()) return show("ad-setup");
    if (DB.hasSession()) {
      try { await DB.token(); enter(); return; } catch (e) { DB.signOut(); }
    }
    show("ad-login");
  }
  async function enter() {
    show("ad-app"); $("#ad-user").textContent = (DB.session() || {}).email || "";
    try { await Promise.all([loadProds(), loadCodes()]); }
    catch (e) { toast("No pude cargar los datos: " + e.message, true); }
  }
  $("#ad-login-form").addEventListener("submit", async e => {
    e.preventDefault(); const msg = $("#ad-login-msg"), btn = e.submitter || $("#ad-login-form button[type=submit]");
    msg.classList.remove("ok"); msg.textContent = ""; busy(btn, true);
    try { await DB.signIn($("#ad-email").value.trim(), $("#ad-pass").value); $("#ad-pass").value = ""; enter(); }
    catch (err) { msg.textContent = err.message; }
    busy(btn, false);
  });
  $("#ad-forgot").addEventListener("click", async () => {
    const msg = $("#ad-login-msg"), email = $("#ad-email").value.trim();
    if (!email) { msg.classList.remove("ok"); msg.textContent = "Escribí tu email arriba y volvé a tocar este botón."; return; }
    try { await DB.resetPassword(email); msg.classList.add("ok"); msg.textContent = "Te mandamos un mail para cambiar la contraseña."; }
    catch (err) { msg.classList.remove("ok"); msg.textContent = err.message; }
  });
  $("#ad-out").addEventListener("click", () => { DB.signOut(); show("ad-login"); });
  document.querySelectorAll(".ad-tabs button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".ad-tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    $("#tab-productos").hidden = b.dataset.tab !== "productos"; $("#tab-codigos").hidden = b.dataset.tab !== "codigos";
  }));

  /* ================= PRODUCTOS ================= */
  async function loadProds() {
    PRODS = (await DB.list("productos")).sort((a, b) => (a.orden || 0) - (b.orden || 0));
    renderProds();
  }
  function renderProds() {
    $("#ad-empty").hidden = PRODS.length > 0;
    $("#ad-count").textContent = PRODS.length ? `${PRODS.length} producto${PRODS.length === 1 ? "" : "s"}` : "";
    $("#ad-list").innerHTML = PRODS.map((p, i) => `
      <li class="ad-item" data-i="${i}">
        <div class="ad-thumb">${(p.thumbs || [])[0] ? `<img src="${p.thumbs[0]}" alt="">` : ""}</div>
        <div class="ad-info"><span class="ad-name">${esc(p.nombre)}</span><span class="ad-price">${money(p.precio || 0)}</span>
          <span class="ad-sub">${esc([p.categoria, p.subcategoria].filter(Boolean).join(" · "))}</span>${p.agotado ? '<span class="ad-tag">Agotado</span>' : ""}</div>
        <div class="ad-acts">
          <button type="button" data-a="up" class="sq" aria-label="Subir" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" data-a="down" class="sq" aria-label="Bajar" ${i === PRODS.length - 1 ? "disabled" : ""}>▼</button>
          <button type="button" data-a="edit">Editar</button>
        </div>
      </li>`).join("");
  }
  $("#ad-list").addEventListener("click", async e => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const i = Number(b.closest(".ad-item").dataset.i);
    if (b.dataset.a === "edit") return openEditor(PRODS[i]);
    const j = b.dataset.a === "up" ? i - 1 : i + 1; if (j < 0 || j >= PRODS.length) return;
    [PRODS[i], PRODS[j]] = [PRODS[j], PRODS[i]]; renderProds();
    try { for (let k = 0; k < PRODS.length; k++) if (PRODS[k].orden !== k) { PRODS[k].orden = k; await saveDoc(PRODS[k]); } toast("Orden guardado ♡"); }
    catch (err) { toast(niceErr(err), true); loadProds(); }
  });
  const saveDoc = p => DB.set("productos", p.id, { nombre: p.nombre, precio: p.precio, categoria: p.categoria || "", subcategoria: p.subcategoria || "", descripcion: p.descripcion || "", talles: p.talles || "", colores: p.colores || "", agotado: !!p.agotado, imagenes: p.imagenes || [], thumbs: p.thumbs || [], orden: p.orden || 0 });

  /* ---------- editor ---------- */
  const listText = s => String(s || "").split(/[|,]/).map(x => x.trim()).filter(Boolean);
  function syncSub() { $("#ed-sub-wrap").hidden = $("#ed-cat").value !== "Indumentaria"; }
  $("#ed-cat").addEventListener("change", syncSub);
  function openEditor(p) {
    const nuevo = !p;
    editing = nuevo ? { id: "p" + Date.now().toString(36), orden: PRODS.length ? Math.max(...PRODS.map(x => x.orden || 0)) + 1 : 0, fotos: [], originales: [], nuevo: true }
      : { id: p.id, orden: p.orden || 0, nuevo: false, originales: (p.imagenes || []).slice(), fotos: (p.imagenes || []).map((id, k) => ({ id, thumb: (p.thumbs || [])[k] || "", nuevo: false })) };
    $("#ed-title").textContent = nuevo ? "Nuevo producto" : "Editar producto";
    $("#ed-nombre").value = p ? p.nombre || "" : ""; $("#ed-precio").value = p ? p.precio || "" : "";
    $("#ed-cat").value = p && p.categoria ? p.categoria : "Indumentaria";
    $("#ed-sub").value = p && SUBS.includes(p.subcategoria) ? p.subcategoria : SUBS[0]; syncSub();
    $("#ed-desc").value = p ? p.descripcion || "" : "";
    $("#ed-talles").value = p ? listText(p.talles).join(", ") : ""; $("#ed-colores").value = p ? listText(p.colores).join(", ") : "";
    $("#ed-agotado").checked = !!(p && p.agotado); $("#ed-delete").hidden = nuevo;
    $("#ed-msg").textContent = ""; $("#ed-photo-msg").textContent = ""; renderFotos();
    $("#ad-editor").hidden = false; document.body.style.overflow = "hidden"; $("#ad-editor").scrollTop = 0; $("#ed-nombre").focus({ preventScroll: true });
  }
  function closeEditor() { $("#ad-editor").hidden = true; document.body.style.overflow = ""; editing = null; }
  $("#ad-new").addEventListener("click", () => openEditor(null));
  $("#ed-close").addEventListener("click", closeEditor); $("#ed-cancel").addEventListener("click", closeEditor);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#ad-editor").hidden) closeEditor(); });

  function renderFotos() {
    const f = editing.fotos;
    $("#ed-fotos").innerHTML = f.map((x, k) => `
      <li class="ad-foto" data-k="${k}">
        ${k === 0 ? '<span class="main">Principal</span>' : ""}
        <div class="ph">${x.thumb ? `<img src="${x.thumb}" alt="">` : ""}</div>
        <div class="acts"><button type="button" data-a="l" aria-label="Mover a la izquierda" ${k === 0 ? "disabled" : ""}>←</button><button type="button" data-a="r" aria-label="Mover a la derecha" ${k === f.length - 1 ? "disabled" : ""}>→</button><button type="button" class="rm" data-a="x" aria-label="Quitar foto">✕</button></div>
      </li>`).join("");
  }
  $("#ed-fotos").addEventListener("click", e => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const k = Number(b.closest(".ad-foto").dataset.k), f = editing.fotos;
    if (b.dataset.a === "x") f.splice(k, 1);
    else { const j = b.dataset.a === "l" ? k - 1 : k + 1; if (j >= 0 && j < f.length) [f[k], f[j]] = [f[j], f[k]]; }
    renderFotos();
  });
  $("#ed-file").addEventListener("change", async e => {
    const files = [...e.target.files]; e.target.value = ""; const msg = $("#ed-photo-msg"); msg.classList.remove("ok");
    for (let n = 0; n < files.length; n++) {
      if (editing.fotos.length >= MAX_FOTOS) { msg.textContent = `Máximo ${MAX_FOTOS} fotos por producto.`; break; }
      msg.textContent = `Preparando foto ${n + 1} de ${files.length}…`;
      try { const r = await procesarFoto(files[n], $("#ed-cut").checked); editing.fotos.push({ id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), thumb: r.thumb, data: r.data, nuevo: true }); renderFotos(); }
      catch (err) { msg.textContent = "No pude usar esa foto: " + err.message; return; }
    }
    msg.classList.add("ok"); msg.textContent = files.length ? "Listo ♡" : "";
  });

  $("#ad-form").addEventListener("submit", async e => {
    e.preventDefault(); const msg = $("#ed-msg"), btn = $("#ed-save"); msg.classList.remove("ok"); msg.textContent = "";
    const nombre = $("#ed-nombre").value.trim(), precio = Math.round(Number($("#ed-precio").value));
    if (!nombre) { msg.textContent = "Escribí el nombre del producto."; return; }
    if (!(precio >= 0)) { msg.textContent = "Escribí un precio válido."; return; }
    busy(btn, true); msg.textContent = "Guardando…";
    try {
      const ids = [], thumbs = [];
      for (const f of editing.fotos) { if (f.nuevo) await DB.set("fotos", f.id, { data: f.data }); ids.push(f.id); thumbs.push(f.thumb); }
      for (const id of editing.originales) if (!ids.includes(id)) { try { await DB.del("fotos", id); } catch (er) {} }
      const cat = $("#ed-cat").value;
      await saveDoc({ id: editing.id, nombre, precio, categoria: cat, subcategoria: cat === "Indumentaria" ? $("#ed-sub").value : "", descripcion: $("#ed-desc").value.trim(),
        talles: listText($("#ed-talles").value).join("|"), colores: listText($("#ed-colores").value).join("|"), agotado: $("#ed-agotado").checked, imagenes: ids, thumbs, orden: editing.orden });
      await loadProds(); closeEditor(); toast("Producto guardado ♡");
    } catch (err) { msg.textContent = niceErr(err); }
    busy(btn, false);
  });
  $("#ed-delete").addEventListener("click", async () => {
    if (!editing || !confirm("¿Eliminar este producto? No se puede deshacer.")) return;
    try {
      for (const id of editing.originales) { try { await DB.del("fotos", id); } catch (er) {} }
      await DB.del("productos", editing.id); await loadProds(); closeEditor(); toast("Producto eliminado");
    } catch (err) { $("#ed-msg").textContent = niceErr(err); }
  });

  /* ---------- fotos: tamaño, WebP y recorte de fondo blanco ---------- */
  const blobToURL = b => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); });
  const encode = async (canvas, q) => blobToURL(await new Promise(r => canvas.toBlob(r, "image/webp", q)));
  function scaled(src, max) {
    const s = Math.min(1, max / Math.max(src.width, src.height)), w = Math.max(1, Math.round(src.width * s)), h = Math.max(1, Math.round(src.height * s));
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(src, 0, 0, w, h); return c;
  }
  function tieneAlfa(c) { const d = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 12) if (d[i] < 250) return true; return false; }
  function morph(src, w, h, iters, grow) {
    let a = src;
    for (let t = 0; t < iters; t++) {
      const out = new Uint8Array(a.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let v = grow ? 0 : 1;
        for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) { if (!grow) v = 0; continue; }
          for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) { if (!grow) v = 0; continue; } const s = a[yy * w + xx]; if (grow) { if (s) v = 1; } else if (!s) v = 0; } }
        out[y * w + x] = v;
      }
      a = out;
    }
    return a;
  }
  function mayor(fg, w, h) {                       // se queda solo con la prenda más grande (saca motas y marcas de agua)
    const n = w * h, lab = new Int32Array(n), q = new Int32Array(n); let best = 0, bestSize = 0, id = 0;
    for (let s = 0; s < n; s++) {
      if (!fg[s] || lab[s]) continue; id++; let qs = 0, qe = 0; q[qe++] = s; lab[s] = id;
      while (qs < qe) { const i = q[qs++], x = i % w, y = (i / w) | 0;
        if (x > 0 && fg[i - 1] && !lab[i - 1]) { lab[i - 1] = id; q[qe++] = i - 1; } if (x < w - 1 && fg[i + 1] && !lab[i + 1]) { lab[i + 1] = id; q[qe++] = i + 1; }
        if (y > 0 && fg[i - w] && !lab[i - w]) { lab[i - w] = id; q[qe++] = i - w; } if (y < h - 1 && fg[i + w] && !lab[i + w]) { lab[i + w] = id; q[qe++] = i + w; } }
      if (qe > bestSize) { bestSize = qe; best = id; }
    }
    const out = new Uint8Array(n); for (let i = 0; i < n; i++) out[i] = lab[i] === best ? 1 : 0; return out;
  }
  function quitarFondo(c) {
    const w = c.width, h = c.height, n = w * h, ctx = c.getContext("2d", { willReadFrequently: true }), im = ctx.getImageData(0, 0, w, h), d = im.data;
    let bar = new Uint8Array(n); for (let i = 0; i < n; i++) { const o = i * 4; bar[i] = Math.min(d[o], d[o + 1], d[o + 2]) < 250 ? 1 : 0; }
    bar = morph(bar, w, h, 2, true);               // cierra los huequitos del borde
    const bg = new Uint8Array(n), q = new Int32Array(n); let qs = 0, qe = 0;
    const push = i => { if (!bar[i] && !bg[i]) { bg[i] = 1; q[qe++] = i; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (qs < qe) { const i = q[qs++], x = i % w, y = (i / w) | 0; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w); }
    let fg = new Uint8Array(n); for (let i = 0; i < n; i++) fg[i] = bg[i] ? 0 : 1;
    fg = mayor(morph(fg, w, h, 2, false), w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {                 // borde suave
      let s = 0, k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < w && yy >= 0 && yy < h) { s += fg[yy * w + xx]; k++; } }
      d[(y * w + x) * 4 + 3] = Math.round(Math.min(1, Math.max(0, (s / k - 0.15) / 0.7)) * 255);
    }
    ctx.putImageData(im, 0, 0);
    // recorta los bordes transparentes
    let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return c;
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04), cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2, o = document.createElement("canvas"); o.width = cw; o.height = ch;
    o.getContext("2d").drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1); return o;
  }
  async function procesarFoto(file, cortar) {
    const bmp = await createImageBitmap(file).catch(() => { throw new Error("no es una imagen válida"); });
    let c = scaled(bmp, 900);
    if (cortar && !tieneAlfa(c)) c = quitarFondo(c);
    let data = "", max = 900;
    for (let t = 0; t < 4; t++) { const cc = t === 0 ? c : scaled(c, max); data = await encode(cc, 0.86); if (data.length < 800000) break; max = Math.round(max * 0.8); }
    if (data.length >= 1000000) throw new Error("la foto es demasiado pesada");
    const thumb = await encode(scaled(c, 480), 0.8);
    return { data, thumb };
  }

  /* ---------- traer los productos que ya están en la tienda ---------- */
  function parseCSV(text) {
    text = text.replace(/^﻿/, ""); const first = text.split(/\r?\n/)[0] || "";
    const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === delim) { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c; }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
    const head = rows.shift().map(norm); return rows.filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }
  $("#ad-import").addEventListener("click", async e => {
    const btn = e.currentTarget, msg = $("#ad-import-msg"); msg.classList.remove("ok");
    if (typeof window.BUNNY_CSV !== "string") { msg.textContent = "No encontré el catálogo actual (data/productos.js)."; return; }
    const rows = parseCSV(window.BUNNY_CSV).filter(r => r.nombre); if (!rows.length) { msg.textContent = "El catálogo actual está vacío."; return; }
    busy(btn, true);
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]; msg.textContent = `Trayendo ${i + 1} de ${rows.length}: ${r.nombre}…`;
        const ids = [], thumbs = [];
        for (const f of listText(r.imagenes || r.imagen)) {
          try { const res = await fetch((window.BUNNY.carpetaImagenes || "img/") + f); if (!res.ok) throw 0; const p = await procesarFoto(await res.blob(), false);
            const id = "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await DB.set("fotos", id, { data: p.data }); ids.push(id); thumbs.push(p.thumb); } catch (er) {}
        }
        const precio = Math.round(Number(String(r.precio).replace(/[^\d]/g, "")) || 0);
        await saveDoc({ id: "p" + Date.now().toString(36) + i, nombre: r.nombre, precio, categoria: r.categoria, subcategoria: r.subcategoria, descripcion: r.descripcion, talles: listText(r.talles).join("|"), colores: listText(r.colores).join("|"),
          agotado: /^(si|sí|s|x|1|true|agotado)$/i.test(r.agotado || ""), imagenes: ids, thumbs, orden: i });
      }
      await loadProds(); toast("Productos traídos ♡");
    } catch (err) { msg.textContent = niceErr(err); }
    busy(btn, false);
  });

  /* ================= CÓDIGOS DE DESCUENTO ================= */
  async function loadCodes() { CODES = (await DB.list("codigos")).sort((a, b) => a.id.localeCompare(b.id)); renderCodes(); }
  function renderCodes() {
    $("#cd-list").innerHTML = CODES.map((c, i) => `
      <li class="cd-item" data-i="${i}">
        <div class="${c.activo === false ? "cd-off" : ""}"><div class="cd-code">${esc(c.id)}</div>
          <div class="cd-detail">${Number(c.porcentaje) || 0}% de descuento · ${c.vence ? "vence el " + esc(c.vence.split("-").reverse().join("/")) : "sin vencimiento"}${c.activo === false ? " · apagado" : ""}</div></div>
        <div class="cd-acts"><button type="button" class="switch" role="switch" aria-checked="${c.activo !== false}" aria-label="Activar o apagar ${esc(c.id)}" data-a="t"></button>
          <button type="button" class="ad-link danger" data-a="d">Eliminar</button></div>
      </li>`).join("");
    const cfgCodes = (window.BUNNY && window.BUNNY.codigos) || [];
    $("#cd-import").hidden = !(cfgCodes.length && !CODES.length);
  }
  const codeDoc = c => DB.set("codigos", c.id, { porcentaje: Number(c.porcentaje) || 0, activo: c.activo !== false, vence: c.vence || "" });
  $("#cd-list").addEventListener("click", async e => {
    const b = e.target.closest("button[data-a]"); if (!b) return; const c = CODES[Number(b.closest(".cd-item").dataset.i)];
    try {
      if (b.dataset.a === "t") { c.activo = c.activo === false; await codeDoc(c); renderCodes(); toast(c.activo ? "Código activado" : "Código apagado"); }
      else if (confirm(`¿Eliminar el código ${c.id}?`)) { await DB.del("codigos", c.id); await loadCodes(); toast("Código eliminado"); }
    } catch (err) { toast(niceErr(err), true); loadCodes(); }
  });
  $("#ad-code-form").addEventListener("submit", async e => {
    e.preventDefault(); const msg = $("#cd-msg"), btn = e.submitter || $("#ad-code-form button[type=submit]"); msg.classList.remove("ok"); msg.textContent = "";
    const id = $("#cd-name").value.trim().toUpperCase().replace(/\s+/g, ""), pct = Math.round(Number($("#cd-pct").value));
    if (!/^[A-Z0-9_-]{3,24}$/.test(id)) { msg.textContent = "El código debe tener entre 3 y 24 letras o números, sin espacios ni tildes."; return; }
    if (!(pct >= 1 && pct <= 99)) { msg.textContent = "El descuento tiene que estar entre 1% y 99%."; return; }
    busy(btn, true);
    try { await codeDoc({ id, porcentaje: pct, activo: true, vence: $("#cd-date").value }); await loadCodes(); $("#ad-code-form").reset(); toast(`Código ${id} creado ♡`); }
    catch (err) { msg.textContent = niceErr(err); }
    busy(btn, false);
  });
  $("#cd-import-btn").addEventListener("click", async () => {
    try { for (const c of window.BUNNY.codigos || []) await codeDoc({ id: String(c.codigo).toUpperCase().replace(/\s+/g, ""), porcentaje: c.porcentaje, activo: c.activo !== false, vence: c.vence || "" }); await loadCodes(); toast("Códigos traídos ♡"); }
    catch (err) { toast(niceErr(err), true); }
  });

  start();
})();
