/* ============ BUNNY CLUB — lógica ============ */
(() => {
  "use strict";
  const CFG = Object.assign({ whatsapp: "", instagram: "", productos: "data/productos.csv", carpetaImagenes: "img/", estiloBoton: 1, decoraciones: [] }, window.BUNNY || {});
  const $ = (s, r = document) => r.querySelector(s);
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const slugify = s => (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const money = n => "$" + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);

  /* ---------- CSV (acepta , o ; y comillas — como lo exporta Excel) ---------- */
  function parseCSV(text) {
    text = text.replace(/^﻿/, "");
    const first = text.split(/\r?\n/)[0] || "";
    const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += c;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    const head = rows.shift().map(h => slugify(h).replace(/-/g, ""));
    return rows.filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }
  const list = s => (s || "").split(/[|,]/).map(x => x.trim()).filter(Boolean);
  const num = s => { s = (s || "").replace(/[^\d.,]/g, ""); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else s = s.replace(/[.,]/g, ""); return Number(s) || 0; };
  const isTrue = s => /^(si|sí|s|x|1|true|agotado|yes)$/i.test((s || "").trim());

  let PRODUCTS = [];
  async function loadProducts() {
    try {
      let text = null;
      try {                                                    // online: se lee la planilla actual
        if (location.protocol === "file:") throw new Error("sin servidor");
        const res = await fetch(CFG.productos, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status);
        text = await res.text();
      } catch (err) {                                          // abierto con doble clic: copia en data/productos.js
        if (typeof window.BUNNY_CSV !== "string") throw err;
        text = window.BUNNY_CSV;
      }
      PRODUCTS = parseCSV(text).map((r, i) => {
        const imgs = list(r.imagenes || r.imagen).map(f => /^(https?:)?\/\//.test(f) || f.startsWith("/") ? f : CFG.carpetaImagenes + f);
        return {
          id: i, nombre: r.nombre, precio: num(r.precio),
          cat: slugify(r.categoria), catLabel: r.categoria,
          sub: slugify(r.subcategoria), subLabel: r.subcategoria,
          imgs, desc: r.descripcion, talles: list(r.talles), colores: list(r.colores), agotado: isTrue(r.agotado),
        };
      }).filter(p => p.nombre);
    } catch (e) {
      console.error("No pude leer los productos:", e);
      PRODUCTS = [];
      $("#empty").textContent = "No pude cargar los productos. Revisá data/productos.csv (ver README).";
    }
  }

  /* ---------- aleatorio estable (misma disposición cada vez) ---------- */
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const between = (r, a, b) => a + r() * (b - a);

  /* ---------- catálogo ---------- */
  const catalog = $("#catalog"), empty = $("#empty");

  const SIZES = [470, 330, 380, 290, 440, 320, 480, 295, 400, 400];
  function renderCatalog() {
    const items = PRODUCTS;
    empty.hidden = items.length > 0;
    catalog.innerHTML = "";
    items.forEach((p, i) => {
      const r = rng(p.id * 7919 + 13);
      const li = document.createElement("li");
      li.className = "item" + (SIZES[i % SIZES.length] >= 380 ? " big" : "") + (i % 2 ? " flip" : "") + (p.agotado ? " is-sold" : "");
      const w = SIZES[i % SIZES.length];                     // algunos grandes, otros chicos
      li.style.cssText = `--w:${w}px;--k:${(w / 10).toFixed(1)};--r:${between(r, -5, 5).toFixed(1)}deg;--dy:${Math.round(between(r, 0, 26))}px;--dx:${Math.round(between(r, -10, 10))}px;--delay:${(0.4 + Math.min(i, 9) * 0.2).toFixed(2)}s;--out:${(i * 0.05).toFixed(2)}s;--fd:${between(r, 7, 12).toFixed(1)}s;--fdl:${(-between(r, 0, 8)).toFixed(1)}s`;
      const alt = p.imgs[1];
      li.innerHTML = `
        <button class="item-btn" data-id="${p.id}" aria-label="Ver ${p.nombre}">
          <div class="float"><div class="tilt">
            <div class="pic${alt ? " has-alt" : ""}${p.imgs.length ? "" : " empty"}">
              <span class="badge">${i + 1}</span>
              ${p.agotado ? '<span class="sold">Agotado</span>' : ""}
              ${p.imgs[0] ? `<img class="main" src="${p.imgs[0]}" alt="${p.nombre}" loading="lazy">` : ""}
              ${alt ? `<img class="alt" src="${alt}" alt="" loading="lazy">` : ""}
            </div>
            <div class="cap"><span class="name">${p.nombre}</span><span class="price">${money(p.precio)}</span></div>
          </div></div>
        </button>`;
      catalog.appendChild(li);
    });
  }

  /* ---------- modal de producto ---------- */
  const modal = $("#modal");
  const COLORES = { rosa: "#f2b5d4", rosita: "#f6c9df", negro: "#1a1016", blanco: "#ffffff", lila: "#d8b7e8", violeta: "#a67bd0", celeste: "#b8dcf2", azul: "#4a6fbf", rojo: "#d13a4f", bordo: "#7a1f3d", gris: "#b9b4b8", plateado: "#cfd0d6", dorado: "#e4b95a", crema: "#f6ecd9", beige: "#e3cfb4", verde: "#9fcfa7", amarillo: "#f5e08a", marron: "#7b5546", naranja: "#f2a65a", fucsia: "#e0489b" };
  let cur = null, curImg = 0, selTalle = null, selColor = null, lastFocus = null;

  function chips(el, values, kind) {
    el.innerHTML = values.map(v => {
      const c = kind === "color" ? COLORES[slugify(v)] : null;
      return `<button type="button" class="chip" role="radio" aria-checked="false" data-v="${v}">${c ? `<span class="dot" style="--c:${c}"></span>` : ""}${v}</button>`;
    }).join("");
  }
  function showImg(i, animate = true) {
    const img = $("#m-img"); $(".m-stage").classList.toggle("empty", !cur.imgs.length); img.hidden = !cur.imgs.length;
    if (!cur.imgs.length) return;
    curImg = (i + cur.imgs.length) % cur.imgs.length;
    const set = () => { img.src = cur.imgs[curImg]; img.alt = cur.nombre; img.classList.remove("swap"); };
    if (animate && !REDUCED) { img.classList.add("swap"); setTimeout(set, 250); } else set();
    document.querySelectorAll("#m-thumbs button").forEach((b, k) => b.setAttribute("aria-current", k === curImg));
  }
  function updateBuy() {
    const a = $("#m-buy"), p = cur;
    if (!p.agotado) { a.href = "#"; return; }                    // disponible: se agrega al carrito
    const parts = [`Hola Bunny Club! 🐰 Quería consultar si van a reponer: ${p.nombre} (${money(p.precio)})`];
    if (selTalle) parts.push(`Talle: ${selTalle}`);
    if (selColor) parts.push(`Color: ${selColor}`);
    a.href = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(parts.join("\n"))}`;
  }
  function openModal(id) {
    cur = PRODUCTS.find(p => p.id === id); if (!cur) return;
    selTalle = selColor = null; lastFocus = document.activeElement;
    $("#m-cat").textContent = "";
    $("#m-name").textContent = cur.nombre; $("#m-price").textContent = money(cur.precio);
    $("#m-desc").textContent = cur.desc || ""; $("#m-hint").textContent = "";
    $("#m-sold").hidden = !cur.agotado;
    const buy = $("#m-buy"); buy.classList.toggle("is-sold", cur.agotado);
    buy.firstElementChild.textContent = cur.agotado ? "Consultar reposición" : "Agregar al carrito";
    $("#m-talles-wrap").hidden = !cur.talles.length; chips($("#m-talles"), cur.talles, "talle");
    $("#m-colores-wrap").hidden = !cur.colores.length; chips($("#m-colores"), cur.colores, "color");
    $(".m-stage").classList.toggle("single", cur.imgs.length < 2);
    $("#m-thumbs").innerHTML = cur.imgs.length > 1 ? cur.imgs.map((s, k) => `<button type="button" aria-label="Foto ${k + 1}"><img src="${s}" alt=""></button>`).join("") : "";
    showImg(0, false); updateBuy();
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".modal-card").focus({ preventScroll: true }), 50);
  }
  function closeModal() {
    modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  modal.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) return closeModal();
    const chip = e.target.closest(".chip");
    if (chip) {
      const group = chip.parentElement; const on = chip.getAttribute("aria-checked") === "true";
      group.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-checked", "false"));
      chip.setAttribute("aria-checked", String(!on));
      const v = on ? null : chip.dataset.v;
      if (group.id === "m-talles") selTalle = v; else selColor = v;
      $("#m-hint").textContent = ""; updateBuy(); return;
    }
    const th = e.target.closest("#m-thumbs button");
    if (th) return showImg([...th.parentElement.children].indexOf(th));
    if (e.target.closest(".m-arrow.prev")) return showImg(curImg - 1);
    if (e.target.closest(".m-arrow.next")) return showImg(curImg + 1);
    if (e.target.closest("#m-buy")) {
      const missing = [];
      if (!cur.agotado && cur.talles.length && !selTalle) missing.push(["talle", $("#m-talles")]);
      if (!cur.agotado && cur.colores.length && !selColor) missing.push(["color", $("#m-colores")]);
      if (missing.length) {
        e.preventDefault();
        $("#m-hint").textContent = `Elegí ${missing.map(m => m[0]).join(" y ")} primero ♡`;
        missing.forEach(([, el]) => { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); });
      } else if (!cur.agotado) {
        e.preventDefault();
        addToCart(cur, selTalle, selColor);
        $("#m-hint").textContent = "¡Agregado al carrito! ♡";
        setTimeout(closeModal, 750);
      }
    }
  });
  catalog.addEventListener("click", e => { const b = e.target.closest(".item-btn"); if (b) openModal(Number(b.dataset.id)); });
  document.addEventListener("keydown", e => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight" && cur.imgs.length > 1) showImg(curImg + 1);
    if (e.key === "ArrowLeft" && cur.imgs.length > 1) showImg(curImg - 1);
  });
  // swipe en la galería
  (() => { let x0 = null; const st = $(".m-stage");
    st.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
    st.addEventListener("touchend", e => { if (x0 == null || cur.imgs.length < 2) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) showImg(curImg + (dx < 0 ? 1 : -1)); x0 = null; });
  })();

  /* ---------- carrito ---------- */
  const cartEl = $("#cart"), cartBtn = $("#cart-btn"), cartList = $("#cart-list");
  let CART = [];
  try { CART = JSON.parse(localStorage.getItem("bunnyclub-cart") || "[]") || []; } catch (e) { CART = []; }
  const saveCart = () => { try { localStorage.setItem("bunnyclub-cart", JSON.stringify(CART)); } catch (e) {} };
  const sameItem = (i, p, t, c) => i.nombre === p.nombre && (i.talle || "") === (t || "") && (i.color || "") === (c || "");
  function addToCart(p, talle, color) {
    const it = CART.find(i => sameItem(i, p, talle, color));
    if (it) it.qty++; else CART.push({ nombre: p.nombre, precio: p.precio, img: p.imgs[0] || "", talle: talle || "", color: color || "", qty: 1 });
    saveCart(); renderCart();
    cartBtn.classList.remove("bump"); void cartBtn.offsetWidth; cartBtn.classList.add("bump");
  }
  function renderCart() {
    const count = CART.reduce((n, i) => n + i.qty, 0), total = CART.reduce((n, i) => n + i.qty * i.precio, 0);
    const badge = $("#cart-count"); badge.textContent = count; badge.hidden = !count;
    cartEl.classList.toggle("has-items", count > 0);
    cartList.innerHTML = CART.map((i, k) => `
      <li class="ci">
        <div class="ci-pic${i.img ? "" : " empty"}">${i.img ? `<img src="${i.img}" alt="">` : ""}</div>
        <div class="ci-info"><span class="ci-name">${i.nombre}</span>${i.talle || i.color ? `<span class="ci-opt">${[i.talle && "Talle " + i.talle, i.color].filter(Boolean).join(" · ")}</span>` : ""}<span class="ci-price">${money(i.precio * i.qty)}</span></div>
        <div class="ci-qty"><button type="button" data-act="dec" data-k="${k}" aria-label="Menos">−</button><span>${i.qty}</span><button type="button" data-act="inc" data-k="${k}" aria-label="Más">+</button></div>
        <button type="button" class="ci-del" data-act="del" data-k="${k}">Quitar</button>
      </li>`).join("");
    $("#cart-total").textContent = money(total);
    const lines = CART.map(i => `• ${i.qty} x ${i.nombre}${i.talle || i.color ? " (" + [i.talle && "Talle " + i.talle, i.color].filter(Boolean).join(", ") + ")" : ""} - ${money(i.precio * i.qty)}`);
    $("#cart-buy").href = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(`Hola Bunny Club! 🐰 Quiero hacer este pedido:\n\n${lines.join("\n")}\n\nTotal: ${money(total)}`)}`;
  }
  const openCart = () => { cartEl.classList.add("open"); cartEl.setAttribute("aria-hidden", "false"); };
  const closeCart = () => { cartEl.classList.remove("open"); cartEl.setAttribute("aria-hidden", "true"); };
  cartBtn.addEventListener("click", openCart);
  cartEl.addEventListener("click", e => {
    if (e.target.closest("[data-cart-close]")) return closeCart();
    if (e.target.closest("#cart-clear")) { CART = []; saveCart(); return renderCart(); }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const k = Number(b.dataset.k), it = CART[k]; if (!it) return;
    if (b.dataset.act === "inc") it.qty++;
    if (b.dataset.act === "dec") it.qty--;
    if (b.dataset.act === "del" || it.qty < 1) CART.splice(k, 1);
    saveCart(); renderCart();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && cartEl.classList.contains("open")) closeCart(); });

  /* ---------- cursor de conejito ---------- */
  function setCursors() {
    const bunny = fill => `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 36 36'><g fill='${fill}' stroke='white' stroke-width='1.5' stroke-linejoin='round'><ellipse cx='12' cy='9' rx='3.2' ry='8' transform='rotate(-8 12 9)'/><ellipse cx='24' cy='9' rx='3.2' ry='8' transform='rotate(8 24 9)'/><ellipse cx='18' cy='23' rx='10' ry='9'/></g><ellipse cx='12' cy='9' rx='1.2' ry='5' fill='%23e9a9cb' transform='rotate(-8 12 9)'/><ellipse cx='24' cy='9' rx='1.2' ry='5' fill='%23e9a9cb' transform='rotate(8 24 9)'/><circle cx='14.2' cy='22' r='1.4' fill='white'/><circle cx='21.8' cy='22' r='1.4' fill='white'/><path d='M16.6 25.4q1.4 1.3 2.8 0' stroke='white' fill='none' stroke-width='1.1' stroke-linecap='round'/><path d='M18 29.5l-5.5-3v6zM18 29.5l5.5-3v6z' fill='%23e9a9cb' stroke='white' stroke-width='.9' stroke-linejoin='round'/></svg>`;
    const url = svg => `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;
    const root = document.documentElement.style;
    root.setProperty("--cursor", `${url(bunny("%231a1016"))} 12 4, auto`);
    root.setProperty("--cursor-hover", `${url(bunny("%23b8588b"))} 12 4, pointer`);
  }

  /* ---------- brillitos, notitas, decoraciones ---------- */
  const STAR = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.8 6.600 4.400 10.200 12 12-7.600 1.800-11.200 5.400-12 12-.8-6.600-4.400-10.200-12-12C7.600 10.200 11.200 6.600 12 0z"/></svg>`;
  function sparkles() {
    const box = $("#sparkles"), r = rng(42);
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span"); s.className = "spark"; s.innerHTML = STAR;
      s.style.cssText = `left:${between(r, 2, 96).toFixed(1)}%;top:${between(r, 2, 96).toFixed(1)}%;--s:${Math.round(between(r, 10, 26))}px;--d:${between(r, 4, 8).toFixed(1)}s;--dl:${between(r, 0, 8).toFixed(1)}s`;
      box.appendChild(s);
    }
  }
  function decorations() {
    const box = $("#decor");
    (CFG.decoraciones || []).forEach(d => {
      const el = document.createElement("div"); el.className = "deco";
      el.style.cssText = `${d.lado === "derecha" ? "right" : "left"}:${d.margen ?? "1%"};top:${d.top || "30%"};width:${d.ancho || 120}px;rotate:${d.rotacion || 0}deg`;
      el.innerHTML = `<img src="${d.src}" alt="">`; box.appendChild(el);
    });
  }

  /* ---------- pie ---------- */
  function footer() {
    $("#f-wa").href = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent("Hola Bunny Club! 🐰")}`;
    if (CFG.instagram) { const ig = $("#f-ig"); ig.href = `https://instagram.com/${CFG.instagram.replace(/^@/, "")}`; ig.hidden = false; }
  }

  /* ---------- arranque ---------- */
  function watchScroll() {
    const sentinel = $("#menu-sentinel"); let tick = false;
    const check = () => { tick = false; document.body.classList.toggle("is-stuck", sentinel.getBoundingClientRect().top < -2); };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  }

  function revealOnView() {
    const el = $(".corner-orn--br"); if (!el) return;
    if (!("IntersectionObserver" in window) || REDUCED) return el.classList.add("in");
    new IntersectionObserver((es, ob) => { if (es.some(e => e.isIntersecting)) { el.classList.add("in"); ob.disconnect(); } }, { threshold: 0.15 }).observe(el);
  }

  async function init() {
    revealOnView();
    document.body.dataset.btn = String(CFG.estiloBoton || 1); setCursors(); renderCart(); sparkles(); decorations(); footer(); watchScroll();
    await loadProducts();
    renderCatalog();
  }
  init();
})();
