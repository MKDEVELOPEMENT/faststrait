(() => {
  "use strict";

  // Where the forms post. Leave empty to fall back to opening an email.
  const FORM_ENDPOINT = "";
  const FALLBACK_EMAIL = "info@faststrait.com";
  // Indicative fee shown in the send panel. Change when pricing is final.
  const FEE_RATE = 0.006;
  const FALLBACK_RATES = { USD: 0.0572, GBP: 0.0428, EUR: 0.0495 }; // per 1 ZAR

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]static=1/.test(location.search);
  const hasGsap = typeof window.gsap !== "undefined";
  const hasD3 = typeof window.d3 !== "undefined" && typeof window.topojson !== "undefined" && typeof window.FSChart === "function";

  document.documentElement.classList.add("js");

  /* Header */
  const header = $(".header");
  const onScroll = () => header.classList.toggle("solid", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $(".burger");
  if (burger) {
    const set = (open) => { document.body.classList.toggle("menu-open", open); burger.setAttribute("aria-expanded", String(open)); };
    burger.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
    $$(".nav a").forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && set(false));
  }
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Hero chart with ETA readout */
  const heroSvg = $("#hero-chart");
  if (heroSvg && hasD3) {
    const clock = $("#eta-clock"), from = $("#eta-from"), to = $("#eta-to");
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const verb = $("#eta-verb");
    FSChart(heroSvg, {
      sail: !reduce,
      labels: true,
      extent: (W, H) => {
        if (W < 900) return [16, 16, W - 16, H - 16];
        const col = Math.min(W * 0.4, 520);
        return [Math.max(24, W * 0.03), 92, W - col - 24, H - 84];
      },
      avoid: () => [$(".eta"), $(".hero-copy .display"), $(".hero-copy .lead"), $(".send")].filter(Boolean).map((el) => el.getBoundingClientRect()),
      onLeg: (a, b) => { if (from) from.textContent = a.name; if (to) to.textContent = b.name; if (verb) verb.textContent = "arriving in"; },
      onTick: (e) => {
        if (clock) clock.textContent = fmt((1 - e) * 252); // 4 min 12 s per crossing, counting down
        if (verb && e >= 1) { verb.textContent = "arrived in"; clock.textContent = "4:12"; }
      },
    });
    if (reduce) { if (clock) clock.textContent = "4:12"; if (verb) verb.textContent = "arrived in"; }
  }
  // Smaller charts (partners page)
  $$("[data-chart]").forEach((el) => {
    if (!hasD3) return;
    const routes = JSON.parse(el.dataset.chart);
    const sec = el.closest(".page-hero");
    FSChart(el, { routes, sail: !reduce, labels: el.dataset.labels !== "off", avoid: sec ? () => [sec.querySelector(".container").getBoundingClientRect()] : null, legMs: 5000, restMs: 1500 });
  });

  /* Week timeline */
  const week = $("#week");
  if (week) {
    const bankFill = $("#week-bank-fill"), fsFill = $("#week-fs-fill"), hops = $$(".week-hops span", week), mark = $("#week-fs-mark");
    const bankTime = $("#week-bank-time"), fsTime = $("#week-fs-time"), bankStatus = $("#week-bank-status");
    const DUR = 7000; let start = null, running = false;
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const frame = (now) => {
      if (!start) start = now;
      const t = Math.min((now - start) / DUR, 1);
      bankFill.style.transform = `scaleX(${t})`;
      hops.forEach((h, i) => h.classList.toggle("on", t > [0.04, 0.26, 0.52, 0.76][i] + 0.02));
      const days = t * 5;
      bankTime.textContent = days < 1 ? "Day 1" : `${Math.min(5, Math.ceil(days))} days`;
      bankStatus.textContent = t < 1 ? `Still moving · ${dayNames[Math.min(4, Math.floor(days))]}` : "Arrived Friday 15:10";
      const tf = Math.min((now - start) / 900, 1);
      fsFill.style.transform = `scaleX(${tf})`;
      const sec = Math.round(tf * 252);
      fsTime.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
      mark.classList.toggle("on", tf >= 1);
      $("#week-fs-status").textContent = tf < 1 ? "Converting" : "Arrived Monday 09:45";
      if (t < 1) requestAnimationFrame(frame);
      else setTimeout(() => { start = null; hops.forEach((h) => h.classList.remove("on")); mark.classList.remove("on"); requestAnimationFrame(frame); }, 4000);
    };
    const go = () => { if (running) return; running = true; requestAnimationFrame(frame); };
    if (reduce) {
      bankFill.style.transform = "scaleX(1)"; fsFill.style.transform = "scaleX(1)"; hops.forEach((h) => h.classList.add("on")); mark.classList.add("on");
      bankTime.textContent = "5 days"; fsTime.textContent = "4:12"; bankStatus.textContent = "Arrived Friday 15:10"; $("#week-fs-status").textContent = "Arrived Monday 09:45";
    } else if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && go()), { threshold: 0.4 }).observe(week);
    else go();
  }

  /* Three steps: rail fills as you scroll, the step in the middle of the screen lights up */
  const wireSteps = () => {
    if (!hasGsap || reduce) { $$(".how-dark .step").forEach((st) => st.classList.add("active")); $$(".how-dark .rail i").forEach((r) => (r.style.transform = "scaleY(1)")); return; }
    $$(".how-dark .steps").forEach((panel) => {
      if (panel.dataset.wired) return; panel.dataset.wired = "1";
      const fillEl = panel.querySelector(".rail i");
      gsap.to(fillEl, { scaleY: 1, ease: "none", scrollTrigger: { trigger: panel, start: "top 60%", end: "bottom 60%", scrub: 0.4 } });
      $$(".step", panel).forEach((st) => ScrollTrigger.create({ trigger: st, start: "top 62%", end: "bottom 38%", toggleClass: "active" }));
    });
  };
  if (typeof ScrollTrigger !== "undefined" || reduce) wireSteps();

  /* How it works: direction toggle */
  const seg = $(".seg");
  if (seg) {
    const panels = { out: $("#steps-out"), in: $("#steps-in") };
    const leads = { out: "No new bank, no foreign account, nothing to learn. Here's Kloof Trading, a Durban importer, paying its supplier in Ohio.", in: "Local account details abroad, in your name. Here's Kloof Trading being paid by a client in New York." };
    $$("button", seg).forEach((b) => b.addEventListener("click", () => {
      const dir = b.dataset.dir;
      $$("button", seg).forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      Object.entries(panels).forEach(([k, p]) => { p.hidden = k !== dir; p.classList.toggle("swap-in", k === dir); });
      $("#how-lead").textContent = leads[dir];
      if (typeof ScrollTrigger !== "undefined") { wireSteps(); ScrollTrigger.refresh(); }
    }));
  }

  /* Money counters */
  if (hasGsap && !reduce) {
    $$("[data-money]").forEach((el) => {
      const end = +el.dataset.money; const obj = { v: 0 };
      gsap.to(obj, { v: end, duration: 1.3, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%", once: true }, onUpdate: () => (el.textContent = "R " + Math.round(obj.v).toLocaleString("en-US")) });
    });
  }

  /* Send panel */
  let rates = { ...FALLBACK_RATES }, live = false, direction = "out", foreign = "USD";
  const send = $("#send");
  const num = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sym = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };
  const parse = (s) => { const n = parseFloat(String(s).replace(/[^0-9.]/g, "")); return Number.isFinite(n) ? n : 0; };

  const badge = (code, pick) => {
    const opts = ["USD", "GBP", "EUR"].map((k) => `<option value="${k}"${k === code ? " selected" : ""}>${k}</option>`).join("");
    return pick ? `<i>${sym[code]}</i><select aria-label="Currency">${opts}</select>` : `<i>${sym[code]}</i>${code}`;
  };
  const calc = () => {
    if (!send) return;
    const amount = parse($("#amt").value);
    const r = rates[foreign];
    const fee = amount * FEE_RATE;
    const net = Math.max(amount - fee, 0);
    const sendCode = direction === "out" ? "ZAR" : foreign;
    const out = direction === "out" ? net * r : net / r;
    $("#recv").textContent = num(out);
    $("#q-rate").textContent = `1 ${foreign} = R ${(1 / r).toFixed(4)}`;
    $("#q-fee").textContent = `${sym[sendCode]} ${num(fee)}`;
    $("#rate-src").textContent = live ? "Live mid-market rate" : "Indicative rate";
  };
  const renderSend = () => {
    if (!send) return;
    const sendWrap = $("#send-ccy"), recvWrap = $("#recv-ccy");
    const sendCode = direction === "out" ? "ZAR" : foreign, recvCode = direction === "out" ? foreign : "ZAR";
    sendWrap.classList.toggle("pick", direction === "in"); recvWrap.classList.toggle("pick", direction === "out");
    sendWrap.innerHTML = badge(sendCode, direction === "in"); recvWrap.innerHTML = badge(recvCode, direction === "out");
    const sel = $("select", sendWrap) || $("select", recvWrap);
    sel.addEventListener("change", (e) => { foreign = e.target.value; renderSend(); });
    $("#send-title").textContent = direction === "out" ? "Pay a supplier abroad" : "Get paid from abroad";
    $("#send-lbl").textContent = direction === "out" ? "You send" : "Your client sends";
    $("#recv-lbl").textContent = direction === "out" ? "They receive" : "You receive";
    calc();
  };
  if (send) {
    const input = $("#amt");
    input.addEventListener("input", () => {
      const raw = input.value.replace(/[^0-9.]/g, "");
      const [whole, dec] = raw.split(".");
      const grouped = (whole || "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      input.value = dec !== undefined ? `${grouped}.${dec.slice(0, 2)}` : grouped;
      calc();
    });
    $("#swap").addEventListener("click", () => {
      direction = direction === "out" ? "in" : "out";
      input.value = direction === "in" ? "15,000" : "250,000";
      renderSend();
    });
    // Last good rate from this browser, so a failed fetch still shows something recent.
    try {
      const saved = JSON.parse(localStorage.getItem("fs-rates") || "null");
      if (saved && saved.USD && saved.GBP && saved.EUR) rates = saved;
    } catch (_) {}
    renderSend();
    // Two free rate sources; the second is used when the first fails or is blocked.
    const SOURCES = [
      ["https://api.frankfurter.dev/v1/latest?base=ZAR&symbols=USD,GBP,EUR", (d) => d && d.rates],
      ["https://open.er-api.com/v6/latest/ZAR", (d) => d && d.result === "success" && d.rates],
    ];
    const tryRates = (i) => {
      if (i >= SOURCES.length) return;
      const [url, pick] = SOURCES[i];
      fetch(url, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const r = pick(d);
          if (!r || !r.USD || !r.GBP || !r.EUR) throw new Error("no rates");
          rates = { USD: r.USD, GBP: r.GBP, EUR: r.EUR }; live = true; calc();
          try { localStorage.setItem("fs-rates", JSON.stringify(rates)); } catch (_) {}
        })
        .catch(() => tryRates(i + 1));
    };
    tryRates(0);
  }

  /* Motion */
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    if ($(".hero-copy")) gsap.fromTo(".hero-copy > *", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 });
    if ($(".eta")) gsap.fromTo(".eta", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.8 });
    if ($(".page-hero")) gsap.fromTo(".page-hero .container > *", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.15 });

    $$(".rv").forEach((el) => gsap.fromTo(el, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
    $$("[data-stagger]").forEach((g) => gsap.fromTo(g.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: g, start: "top 85%", once: true } }));

    // Voyage scale bars
    $$(".bar").forEach((b) => gsap.to(b, { scaleX: 1, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: b, start: "top 85%", once: true } }));
    // Cost stacks
    $$(".cost-stack").forEach((st) => gsap.to(st.querySelectorAll("i"), { scaleX: 1, duration: 1.2, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: st, start: "top 85%", once: true } }));
  } else {
    $$(".rv, [data-stagger] > *, .hero-copy > *, .eta").forEach((el) => (el.style.opacity = 1));
    $$(".bar, .cost-stack i").forEach((el) => (el.style.transform = "none"));
  }

  /* Step 3 tracker loop */
  $$(".track-loop").forEach((track) => {
    const stages = $$(".stage", track);
    let i = 0;
    const run = () => {
      stages.forEach((s, k) => { s.classList.toggle("done", k < i); s.classList.toggle("now", k === i); });
      i += 1;
      if (i < stages.length) setTimeout(run, 1300); else setTimeout(() => { i = 0; run(); }, 4000);
    };
    setTimeout(run, reduce ? 0 : 800);
  });

  /* Forms */
  $$("form[data-lead]").forEach((form) => {
    const status = $(".form-status", form);
    const show = (msg, err) => { status.textContent = msg; status.classList.toggle("error", !!err); status.hidden = false; };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get("company_website")) return;
      const missing = $$("[required]", form).find((el) => !el.value.trim());
      if (missing) { show("Please fill in the required fields.", true); missing.focus(); return; }
      const email = $("[type=email]", form);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { show("That email address doesn't look right.", true); email.focus(); return; }
      const payload = {};
      fd.forEach((v, k) => { if (k !== "company_website") payload[k] = payload[k] ? `${payload[k]}, ${v}` : v; });
      if (!FORM_ENDPOINT) {
        const subject = encodeURIComponent(`${form.dataset.lead}: ${payload.company || payload.email || ""}`);
        const body = encodeURIComponent(Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join("\n"));
        window.location.href = `mailto:${form.dataset.email || FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
        show("Your email app should open with the details filled in. If it doesn't, write to us directly.");
        return;
      }
      const btn = $("button[type=submit]", form); btn.disabled = true;
      try {
        const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
        form.reset(); show("Thanks. We'll be in touch within one business day.");
      } catch (_) { show(`Something went wrong. Please email ${FALLBACK_EMAIL}.`, true); }
      finally { btn.disabled = false; }
    });
  });
})();
