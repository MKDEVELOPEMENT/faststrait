/* The explainer: one short animated scene per customer type, drawn in SVG and driven by GSAP. */
(() => {
  "use strict";

  const root = document.getElementById("film");
  if (!root) return;

  const stage = document.getElementById("film-stage");
  const cap = document.getElementById("film-cap");
  const bar = document.getElementById("film-progress");
  const playBtn = document.getElementById("film-play");
  const badge = document.getElementById("film-badge");
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]static=1/.test(location.search);
  const hasGsap = typeof window.gsap !== "undefined";

  const C = { ink: "#0C1B2A", ink2: "#2E3F4E", soft: "#475866", teal: "#3CE0B5", tealInk: "#0A6E5C", water: "#D6EAE5", floor: "#C6DED7", land: "#EFE2BF", paper: "#F1F6F4", sand: "#B9A779" };

  /* ---------- People ---------- */

  const PEOPLE = {
    kloof:    { skin: "#8D5524", shirt: C.tealInk, hair: "short", hairCol: "#1B1B1B" },
    kloofCT:  { skin: "#C68642", shirt: C.tealInk, hair: "bun", hairCol: "#1B1B1B" },
    northwind:{ skin: "#F1C27D", shirt: C.soft, hair: "long", hairCol: "#5A3A24" },
    corrie:   { skin: "#E0AC69", shirt: C.sand, hair: "short", hairCol: "#5A3A24" },
    lerato:   { skin: "#6B3E26", shirt: C.sand, hair: "curly", hairCol: "#141414", phones: true },
    halden:   { skin: "#F1C27D", shirt: C.ink2, hair: "short", hairCol: "#7A5A3A" },
    nkosi:    { skin: "#8D5524", shirt: C.soft, hair: "bun", hairCol: "#222" },
  };

  // A seated person at a desk with a laptop, facing right. Origin is the floor under the chair.
  const person = (p) => {
    const hairBack = {
      curly: `<circle cx="-6" cy="-194" r="30" fill="${p.hairCol}"/>`,
      long: `<path d="M-30,-188 Q-32,-216 -3,-214 Q24,-212 22,-190 L22,-182 Q8,-196 -10,-194 L-14,-148 L-32,-150 Z" fill="${p.hairCol}"/>`,
      bun: `<circle cx="-24" cy="-206" r="12" fill="${p.hairCol}"/>`,
      short: "",
    }[p.hair];
    const hairFront = {
      short: `<path d="M-27,-186 Q-29,-212 -2,-211 Q23,-210 21,-191 Q8,-200 -6,-198 Q-18,-196 -23,-178 Z" fill="${p.hairCol}"/>`,
      bun: `<path d="M-27,-186 Q-29,-211 -2,-210 Q22,-209 20,-193 Q6,-201 -8,-199 Q-20,-196 -24,-180 Z" fill="${p.hairCol}"/>`,
      long: `<path d="M-27,-188 Q-28,-211 -2,-210 Q22,-209 20,-193 Q6,-201 -8,-199 Q-20,-196 -24,-180 Z" fill="${p.hairCol}"/>`,
      curly: "",
    }[p.hair];
    const phones = p.phones ? `<path d="M-26,-186 Q-24,-216 -2,-214 Q20,-214 20,-190" fill="none" stroke="${C.ink}" stroke-width="5"/><rect x="-32" y="-192" width="12" height="18" rx="5" fill="${C.ink}"/>` : "";
    return `
      <g class="chair">
        <rect x="-64" y="-150" width="14" height="96" rx="7" fill="${C.soft}"/>
        <rect x="-64" y="-64" width="84" height="12" rx="6" fill="${C.soft}"/>
        <rect x="-28" y="-52" width="8" height="48" fill="${C.soft}"/>
        <rect x="-52" y="-6" width="56" height="6" rx="3" fill="${C.soft}"/>
      </g>
      <path d="M-22,-60 L38,-60 L38,-6" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="30" y="-10" width="30" height="10" rx="5" fill="${C.ink}"/>
      <path d="M-40,-58 L-37,-128 Q-35,-150 -10,-150 L6,-150 Q27,-150 27,-128 L23,-58 Z" fill="${p.shirt}"/>
      <rect x="-10" y="-164" width="14" height="16" fill="${p.skin}"/>
      ${hairBack}
      <circle cx="-3" cy="-184" r="24" fill="${p.skin}"/>
      ${hairFront}
      ${phones}
      <ellipse class="eye" cx="12" cy="-186" rx="2.8" ry="2.8" fill="${C.ink}"/>
      <path class="mouth" d="M7,-173 Q13,-168 19,-174" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>
      <g transform="translate(58,-108)">
        <rect x="0" y="0" width="152" height="10" rx="3" fill="${C.ink}"/>
        <rect x="132" y="10" width="8" height="98" fill="${C.ink2}"/>
        <rect x="10" y="10" width="8" height="98" fill="${C.ink2}"/>
        <rect x="16" y="-6" width="80" height="6" rx="2" fill="${C.ink2}"/>
        <g transform="rotate(16 92 -2)"><rect x="88" y="-62" width="8" height="60" rx="3" fill="${C.ink2}"/><circle class="glow" cx="92" cy="-32" r="4" fill="${C.teal}" opacity="0.35"/></g>
      </g>
      <g transform="translate(6,-138)"><g class="arm">
        <path d="M0,0 L36,30 L72,26" fill="none" stroke="${p.shirt}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="76" cy="26" r="8.5" fill="${p.skin}"/>
      </g></g>`;
  };

  // The university building, for the individuals scene. Origin is the floor at its centre.
  const building = () => `
    <rect x="-120" y="-24" width="240" height="24" fill="${C.ink2}"/>
    <rect x="-108" y="-176" width="216" height="152" fill="${C.paper}"/>
    ${[-84, -42, 0, 42, 84].map((x) => `<rect x="${x - 9}" y="-168" width="18" height="140" rx="3" fill="${C.land}"/>`).join("")}
    <path d="M-128,-176 L0,-236 L128,-176 Z" fill="${C.soft}"/>
    <rect x="-128" y="-184" width="256" height="10" fill="${C.ink2}"/>
    <rect x="-16" y="-80" width="32" height="56" rx="16" fill="${C.ink2}"/>`;

  // A container ship, facing right. Origin is the waterline at its centre.
  const ship = () => {
    const box = (x, y, c) => `<rect x="${x}" y="${y}" width="24" height="15" rx="2" fill="${c}"/>`;
    const cols = [C.tealInk, C.sand, C.soft, C.teal, C.sand, C.tealInk];
    return `
      <path d="M-92,-2 L96,-2 L80,22 L-80,22 Z" fill="${C.ink}"/>
      <rect x="-92" y="-2" width="188" height="5" fill="#B6463A"/>
      ${cols.map((c, i) => box(-58 + i * 26, -18, c)).join("")}
      ${cols.slice(1, 5).map((c, i) => box(-32 + i * 26, -34, cols[(i + 3) % 6])).join("")}
      <rect x="-86" y="-48" width="22" height="46" rx="2" fill="${C.paper}"/>
      <rect x="-82" y="-42" width="14" height="6" rx="1" fill="${C.ink2}"/>
      <rect x="-80" y="-60" width="8" height="14" fill="${C.ink2}"/>`;
  };

  // An artboard that draws itself: Lerato's design work.
  const artboard = () => `
    <rect width="210" height="150" rx="14" fill="#fff" filter="url(#fs-shadow)"/>
    <text x="16" y="26" font-size="12.5" font-weight="700" fill="${C.ink}">Halden_brand_v3</text>
    <rect x="16" y="38" width="178" height="96" rx="8" fill="${C.paper}"/>
    <g class="shape"><circle cx="52" cy="76" r="20" fill="${C.teal}"/></g>
    <g class="shape"><rect x="84" y="58" width="92" height="12" rx="6" fill="${C.ink}"/></g>
    <g class="shape"><rect x="84" y="78" width="66" height="8" rx="4" fill="${C.soft}"/></g>
    <g class="shape"><rect x="32" y="108" width="72" height="16" rx="8" fill="${C.sand}"/></g>
    <g class="shape"><path d="M120,112 l14,-14 l14,14 l14,-10 l14,10" fill="none" stroke="${C.tealInk}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`;

  // A banknote. Rand in green, pound in purple.
  const banknote = (sym, amount, col) => `
    <rect x="-46" y="-26" width="92" height="52" rx="6" fill="${col}" stroke="${C.ink}" stroke-width="2.5"/>
    <rect x="-40" y="-20" width="80" height="40" rx="3" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="1.5"/>
    <circle cx="22" cy="0" r="12" fill="#fff" fill-opacity="0.22"/>
    <text x="-30" y="9" font-size="24" font-weight="800" fill="#fff">${sym}</text>
    <text x="34" y="-10" text-anchor="end" font-size="9" font-weight="700" fill="#fff" fill-opacity="0.9">${amount}</text>`;

  /* ---------- Chapters ---------- */

  const CHAPTERS = [
    {
      payer: "left",
      left: { who: PEOPLE.kloof, name: "Kloof Trading", place: "Durban, South Africa" },
      right: { who: PEOPLE.northwind, name: "Northwind Components", place: "Dayton, Ohio" },
      invoice: ["Invoice 4471", "$ 14,932.61"],
      ui: { title: "Pay Northwind Components", rows: [["You send", "R 250,000.00", 250000, "R "], ["They receive", "$ 14,932.61"], ["Fee", "R 1,500.00"]], button: "Confirm and send" },
      route: ["DUR", "DAY"], shipRoute: ["NYC", "DUR"], boxLabel: "TO DURBAN", bal: ["$ ", 82410.2, 97342.81], phone: "Northwind · Business account",
      compare: [["Money", "4 min", 1], ["Goods by sea", "Day 1 of 21", 0.05]],
      token: ["R", "$"], clock: 252, prop: "shipIn", shipTag: ["Your goods: 21 days at sea", "Money: arrived. Goods: still at sea"],
      note: ["Payment received", "$ 14,932.61", "from Kloof Trading"],
      caps: ["Northwind in Ohio sends Kloof an invoice for $14,932.",
             "Kloof pays it in rand. The rate and the fee are on screen first.",
             "FastStrait converts the rand to dollars and sends it straight through.",
             "Northwind is paid in dollars, into its own bank. Four minutes."],
    },
    {
      payer: "right",
      left: { who: PEOPLE.kloofCT, name: "Kloof Trading", place: "Cape Town, South Africa" },
      right: { who: PEOPLE.corrie, name: "Corrie Studio", place: "London, UK" },
      invoice: ["Invoice KT-0931", "£ 6,250.00"],
      ui: { title: "Pay Kloof Trading", rows: [["Sort code", "23-14-70"], ["Account", "•••• 9023"], ["Amount", "£ 6,250.00", 6250, "£ "]], button: "Send payment" },
      route: ["LON", "CPT"], shipRoute: ["CPT", "LON"], boxLabel: "TO LONDON", bal: ["R ", 1138402.11, 1283632.3], phone: "Kloof Trading · Business account",
      compare: [["Money", "4 min", 1], ["Goods by sea", "Day 1 of 18", 0.06]],
      token: ["£", "R"], clock: 228, prop: "shipOut", shipTag: ["Kloof's goods: 18 days to London", "Money: home. Goods: still at sea"],
      note: ["Payment received", "R 145,230.19", "from Corrie Studio, London"],
      caps: ["Kloof invoices a client in London, with a local UK account to pay into.",
             "The client pays from their own bank, like paying anyone in the UK.",
             "FastStrait converts the pounds to rand as soon as they land.",
             "Kloof receives rand in Cape Town, at the rate it was shown."],
    },
    {
      payer: "right",
      left: { who: PEOPLE.lerato, name: "Lerato, designer", place: "Johannesburg, South Africa" },
      right: { who: PEOPLE.halden, name: "Halden Digital", place: "New York, US" },
      invoice: ["Invoice 0112", "$ 4,800.00"],
      ui: { title: "Pay Lerato M.", rows: [["Routing", "026073150"], ["Account", "•••• 4471"], ["Amount", "$ 4,800.00", 4800, "$ "]], button: "Send payment" },
      route: ["NYC", "JNB"], bal: ["R ", 23410.55, 102910.55], phone: "Lerato M. · Account",
      compare: [["FastStrait", "4 min", 1], ["Bank wire", "Day 1 of 5", 0.2]],
      token: ["$", "R"], clock: 236, prop: "design",
      note: ["Payment received", "R 79,500.00", "from Halden Digital, New York"],
      caps: ["Lerato finishes a brand design for a New York startup and bills them $4,800.",
             "Her client pays a US account in her name, the way they pay anyone local.",
             "FastStrait turns the dollars into rand within minutes.",
             "Lerato gets R 79,500 in her South African account, fee shown upfront."],
    },
    {
      payer: "left", soon: true,
      left: { who: PEOPLE.nkosi, name: "The Nkosi family", place: "Pretoria, South Africa" },
      right: { building: true, name: "University of Manchester", place: "Manchester, UK" },
      invoice: ["Tuition invoice", "£ 3,650.00"],
      ui: { title: "Pay University of Manchester", rows: [["You send", "R 85,000.00", 85000, "R "], ["They receive", "£ 3,650.00"], ["Fee", "R 510.00"]], button: "Confirm and send" },
      route: ["PTA", "MAN"], bal: ["£ ", 1204880, 1208530], phone: "University of Manchester · Fees",
      compare: [["FastStrait", "4 min", 1], ["Bank wire", "Day 1 of 5", 0.2]],
      token: ["R", "£"], clock: 248, prop: "notes",
      note: ["Tuition received", "£ 3,650.00", "from the Nkosi family"],
      caps: ["The university in Manchester sends a tuition invoice for £3,650.",
             "The Nkosi family pays it in rand from Pretoria.",
             "FastStrait changes the rand into pounds and sends it on.",
             "Tuition paid in minutes. Coming to individuals after business payments."],
    },
  ];

  /* ---------- Scene ---------- */

  const card = (x, y, w, h, inner, cls) => `
    <g class="${cls}" transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="16" fill="#fff" filter="url(#fs-shadow)"/>
      ${inner}
    </g>`;

  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const scene = (d) => {
    const L = d.left, R = d.right;
    const payerX = d.payer === "left" ? 40 : 650, recvX = d.payer === "left" ? 650 : 40;
    const uiRows = d.ui.rows.map((r, i) => `
      <text x="18" y="${64 + i * 30}" font-size="13" fill="${C.soft}">${esc(r[0])}</text>
      <text class="${r[2] ? "count" : ""}" x="252" y="${64 + i * 30}" text-anchor="end" font-size="16" font-weight="700" fill="${C.ink}">${esc(r[1])}</text>`).join("");
    const ui = card(payerX, 36, 270, 200, `
      <text x="18" y="32" font-size="15" font-weight="700" fill="${C.ink}">${esc(d.ui.title)}</text>
      ${uiRows}
      <g class="btn"><rect x="18" y="148" width="234" height="36" rx="10" fill="${C.ink}"/>
      <text class="btn-t" x="135" y="171" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${esc(d.ui.button)}</text></g>`, "ui");
    const inv = card(0, 0, 176, 74, `
      <rect x="14" y="14" width="22" height="28" rx="3" fill="${C.water}"/><rect x="18" y="20" width="14" height="3" fill="${C.soft}"/><rect x="18" y="27" width="10" height="3" fill="${C.soft}"/>
      <text x="46" y="28" font-size="12.5" fill="${C.soft}">${esc(d.invoice[0])}</text>
      <text x="46" y="52" font-size="18" font-weight="700" fill="${C.ink}">${esc(d.invoice[1])}</text>`, "inv");
    const note = card(recvX, 46, 270, 92, `
      <circle cx="26" cy="30" r="8" fill="${C.teal}"/>
      <text x="44" y="35" font-size="14" font-weight="700" fill="${C.tealInk}">${esc(d.note[0])}</text>
      <text x="18" y="64" font-size="22" font-weight="800" fill="${C.ink}">${esc(d.note[1])}</text>
      <text x="18" y="82" font-size="12" fill="${C.soft}">${esc(d.note[2])}</text>`, "note");
    const right = R.building
      ? `<g class="right" transform="translate(790,440)">${building()}</g>`
      : `<g class="right" transform="translate(810,440) scale(-1,1)">${person(R.who)}</g>`;
    return `
      <defs><filter id="fs-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0C1B2A" flood-opacity="0.18"/></filter></defs>
      <rect width="960" height="540" fill="${C.water}"/>
      <path d="M0,520 C 140,470 260,500 380,470 S 620,480 720,450 S 900,470 960,440 L960,540 L0,540 Z" fill="${C.land}" opacity="0.55"/>
      <rect y="440" width="960" height="100" fill="${C.floor}"/>
      ${d.prop === "shipIn" || d.prop === "shipOut" ? `
      <rect y="380" width="960" height="60" fill="#B8D6CE"/>
      <path d="M0,392 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/>
      <g class="ship-wrap"><g class="ship-body">${ship()}</g>
        <g class="ship-tag" transform="translate(0,-82)"><rect class="ship-tag-bg" x="-120" y="-16" width="240" height="32" rx="16" fill="${C.ink}"/><text class="ship-tag-t" y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${esc(d.shipTag[0])}</text></g>
      </g>` : ""}
      <path class="arc" d="M300,300 Q480,-10 660,300" fill="none" stroke="${C.ink}" stroke-opacity="0.3" stroke-width="2.5" stroke-dasharray="6 8"/>
      <path class="trail" d="M300,300 Q480,-10 660,300" fill="none" stroke="${C.tealInk}" stroke-width="4" stroke-linecap="round"/>
      <g class="clock" transform="translate(420,92)"><rect width="120" height="38" rx="19" fill="${C.ink}"/><text class="clock-t" x="60" y="25" text-anchor="middle" font-size="17" font-weight="700" fill="${C.teal}">0:00</text></g>
      <g class="left" transform="translate(150,440)">${person(L.who)}</g>
      ${right}
      <text x="230" y="486" text-anchor="middle" font-size="19" font-weight="700" fill="${C.ink}">${esc(L.name)}</text>
      <text x="230" y="510" text-anchor="middle" font-size="14" fill="${C.soft}">${esc(L.place)}</text>
      <text x="730" y="486" text-anchor="middle" font-size="19" font-weight="700" fill="${C.ink}">${esc(R.name)}</text>
      <text x="730" y="510" text-anchor="middle" font-size="14" fill="${C.soft}">${esc(R.place)}</text>
      ${ui}
      ${note}
      ${d.prop === "design" ? `<g class="art">${artboard()}</g>` : ""}
      <g class="inv-wrap">${inv}</g>
      ${d.prop === "notes"
        ? `<g class="token"><g class="flip"><g class="face-a">${banknote("R", "R 85,000", "#2E7D5B")}</g><g class="face-b" opacity="0">${banknote("£", "£ 3,650", "#6E4C8C")}</g></g></g>`
        : `<g class="token"><circle r="22" fill="${C.teal}" stroke="${C.ink}" stroke-width="3"/><text class="token-t" y="7" text-anchor="middle" font-size="20" font-weight="800" fill="${C.ink}">${esc(d.token[0])}</text></g>`}
      <g class="tick"><circle r="20" fill="${C.tealInk}"/><path d="M-8,0 L-2,7 L9,-6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  };

  /* ---------- Playback ---------- */

  let tl = null, idx = 0, userPaused = false, inView = false;
  // Debug: ?seek=8.2 jumps the first chapter's timeline to that second and holds it, for capturing frames.
  const SEEK = parseFloat(new URLSearchParams(location.search).get("seek"));
  let seekUsed = false;
  const applySeek = () => { if (!seekUsed && Number.isFinite(SEEK) && tl) { seekUsed = true; userPaused = true; tl.seek(SEEK, false).pause(); } };
  const q = (s) => stage.querySelector(s);
  const setRot = (el, a) => el && el.setAttribute("transform", `rotate(${a})`);

  const build = (n) => {
    idx = n;
    const d = CHAPTERS[n];
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === n)); t.tabIndex = k === n ? 0 : -1; });
    badge.hidden = !d.soon;
    stage.innerHTML = scene(d);
    if (tl) tl.kill();

    const arc = q(".arc"), trail = q(".trail"), len = arc.getTotalLength();
    const fwd = d.payer === "left"; // token travels left to right when the payer is on the left
    const at = (t) => arc.getPointAtLength(len * (fwd ? t : 1 - t));
    const ui = q(".ui"), note = q(".note"), invWrap = q(".inv-wrap"), token = q(".token"), tokenT = q(".token-t"), tick = q(".tick"), clock = q(".clock"), clockT = q(".clock-t");
    const payerSide = q(fwd ? ".left" : ".right"), recvSide = q(fwd ? ".right" : ".left");
    const payArm = payerSide && payerSide.querySelector(".arm"), recvArm = recvSide && recvSide.querySelector(".arm");
    const glow = payerSide && payerSide.querySelector(".glow");
    const btn = q(".btn rect"), btnT = q(".btn-t"), count = q(".count");
    const countRow = d.ui.rows.find((r) => r[2]);
    const recvHead = fwd ? [813, 220] : [147, 220];
    trail.style.strokeDasharray = `${len}`; trail.style.strokeDashoffset = `${fwd ? len : -len}`;
    tick.setAttribute("transform", `translate(${recvHead[0]},${recvHead[1]}) scale(0)`);
    const place = (el, p) => el.setAttribute("transform", `translate(${p.x},${p.y})`);
    const placeInv = (t) => { const p = arc.getPointAtLength(len * (fwd ? 1 - t : t)); invWrap.setAttribute("transform", `translate(${p.x - 88},${p.y - 120})`); };
    const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

    // Story props
    const shipWrap = q(".ship-wrap"), shipBody = q(".ship-body"), shipTagT = q(".ship-tag-t");
    const shipFrom = d.prop === "shipIn" ? 516 : 444, shipTo = d.prop === "shipIn" ? 444 : 516;
    const placeShip = (x) => shipWrap && shipWrap.setAttribute("transform", `translate(${x},404)`);
    if (shipBody && d.prop === "shipIn") shipBody.setAttribute("transform", "scale(-1,1)");
    placeShip(shipFrom);
    const art = q(".art"), shapes = art ? Array.from(art.querySelectorAll(".shape")) : [];
    const artStart = { x: 46, y: 40 };
    const placeArt = (t, sc) => {
      if (!art) return;
      if (t <= 0) { art.setAttribute("transform", `translate(${artStart.x},${artStart.y}) scale(${sc})`); return; }
      const p = arc.getPointAtLength(len * t);
      art.setAttribute("transform", `translate(${p.x - 105 * sc},${p.y - 75 * sc - 40}) scale(${sc})`);
    };
    placeArt(0, 1);
    const flip = q(".flip"), faceA = q(".face-a"), faceB = q(".face-b");
    const setFlip = (sx) => flip && flip.setAttribute("transform", `scale(${Math.max(0.02, Math.abs(sx))},1)`);

    const showFinal = () => {
      [ui, note].forEach((el) => (el.style.opacity = 1));
      invWrap.style.opacity = 0; clock.style.opacity = 1; clockT.textContent = fmtClock(d.clock);
      place(token, at(1)); if (tokenT) tokenT.textContent = d.token[1]; token.style.opacity = 1;
      if (faceA) { faceA.setAttribute("opacity", 0); faceB.setAttribute("opacity", 1); }
      placeShip(shipTo); if (shipTagT) shipTagT.textContent = d.shipTag[1];
      if (art) art.style.opacity = 0;
      trail.style.strokeDashoffset = "0";
      btn.setAttribute("fill", C.teal); btnT.setAttribute("fill", C.ink); btnT.textContent = "Sent";
      tick.setAttribute("transform", `translate(${recvHead[0]},${recvHead[1]}) scale(1)`);
      setRot(recvArm, -68);
      cap.textContent = d.caps[3];
      bar.style.transform = "scaleX(1)";
    };

    if (!hasGsap || reduce) { showFinal(); return; }

    [ui, note, invWrap, token, clock].forEach((el) => (el.style.opacity = 0));
    placeInv(0);
    place(token, at(0));

    tl = gsap.timeline({
      paused: userPaused || !inView,
      onUpdate: () => { bar.style.transform = `scaleX(${tl.progress()})`; },
      onComplete: () => { if (!userPaused) run((idx + 1) % CHAPTERS.length); },
    });

    // Characters settle in
    tl.fromTo([q(".left"), q(".right")], { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.1 }, 0);

    // 1. The invoice crosses from the recipient to the payer
    tl.call(() => (cap.textContent = d.caps[0]), null, 0.2);
    const invAt = art ? 1.25 : 0.8, invDur = art ? 1.35 : 1.7;
    if (art) {
      tl.fromTo(art, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.1);
      tl.fromTo(shapes, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.25, stagger: 0.12, ease: "back.out(2)" }, 0.25);
      const av = { t: 0, s: 1 };
      tl.to(av, { t: 1, s: 0.5, duration: 1.35, ease: "power2.inOut", onUpdate: () => placeArt(Math.max(av.t, 0.0001), av.s) }, 1.05);
      tl.to(art, { opacity: 0, duration: 0.25 }, 2.35);
    }
    tl.fromTo(invWrap, { opacity: 0 }, { opacity: 1, duration: 0.35 }, invAt - 0.3);
    const iv = { t: 0 };
    tl.to(iv, { t: 1, duration: invDur, ease: "power2.inOut", onUpdate: () => placeInv(iv.t) }, invAt);
    tl.to(invWrap, { opacity: 0, duration: 0.3 }, 2.7);
    if (shipWrap) {
      const sv = { x: shipFrom };
      tl.to(sv, { x: shipTo, duration: 10.6, ease: "none", onUpdate: () => placeShip(sv.x) }, 0);
    }

    // 2. The payer fills in the payment and confirms
    tl.call(() => (cap.textContent = d.caps[1]), null, 2.8);
    tl.fromTo(ui, { opacity: 0, scale: 0.88, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, 2.85);
    if (glow) tl.to(glow, { opacity: 1, duration: 0.3 }, 2.9);
    const arm = { a: 0 };
    tl.to(arm, { a: -7, duration: 0.14, repeat: 9, yoyo: true, ease: "sine.inOut", onUpdate: () => setRot(payArm, arm.a) }, 3.0);
    if (count && countRow) {
      const c = { v: 0 };
      tl.to(c, { v: countRow[2], duration: 1.1, ease: "power2.out", onUpdate: () => (count.textContent = countRow[3] + c.v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) }, 3.0);
    }
    tl.to(q(".btn"), { scale: 0.94, transformOrigin: "50% 50%", duration: 0.12, yoyo: true, repeat: 1 }, 4.5);
    tl.call(() => { btn.setAttribute("fill", C.teal); btnT.setAttribute("fill", C.ink); btnT.textContent = "Sent"; }, null, 4.62);

    // 3. The money crosses and converts
    tl.call(() => (cap.textContent = d.caps[2]), null, 5.1);
    tl.to(ui, { opacity: 0.25, duration: 0.4 }, 5.2);
    tl.to(clock, { opacity: 1, duration: 0.3 }, 5.2);
    tl.to(token, { opacity: 1, duration: 0.2 }, 5.3);
    const tk = { t: 0 };
    tl.to(tk, { t: 1, duration: 2.3, ease: "power1.inOut", onUpdate: () => {
      place(token, at(tk.t));
      trail.style.strokeDashoffset = `${(fwd ? 1 : -1) * len * (1 - tk.t)}`;
      clockT.textContent = fmtClock(tk.t * d.clock);
    } }, 5.4);
    if (flip) {
      const fv = { s: 1 };
      tl.to(fv, { s: -1, duration: 0.5, ease: "power2.inOut", onUpdate: () => {
        setFlip(fv.s);
        const b = fv.s < 0; faceA.setAttribute("opacity", b ? 0 : 1); faceB.setAttribute("opacity", b ? 1 : 0);
      } }, 6.3);
    } else {
      tl.call(() => (tokenT.textContent = d.token[1]), null, 6.55);
      tl.fromTo(token, { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, transformOrigin: "50% 50%" }, 6.45);
    }

    // 4. Received
    tl.call(() => (cap.textContent = d.caps[3]), null, 7.8);
    if (shipTagT) tl.call(() => (shipTagT.textContent = d.shipTag[1]), null, 8.0);
    tl.fromTo(note, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 7.8);
    const ra = { a: 0 };
    tl.to(ra, { a: -68, duration: 0.45, ease: "back.out(2)", onUpdate: () => setRot(recvArm, ra.a) }, 8.0);
    const tc = { s: 0 };
    tl.to(tc, { s: 1, duration: 0.4, ease: "back.out(2.5)", onUpdate: () => tick.setAttribute("transform", `translate(${recvHead[0]},${recvHead[1]}) scale(${tc.s})`) }, 8.1);
    tl.to({}, { duration: 2.6 }, 8.6); // hold
    applySeek();
  };


  /* ---------- Scenes version: four shots per customer ---------- */

  const chip = (n, label) => `<g transform="translate(24,22)"><rect width="${label.length * 8.6 + 52}" height="34" rx="17" fill="${C.ink}"/><text x="16" y="22" font-size="14" font-weight="800" fill="${C.teal}">${n}</text><text x="34" y="22" font-size="14" font-weight="600" fill="#fff">${esc(label)}</text></g>`;

  const crate = (x, y, w, h, c, label) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}"/><rect x="${x}" y="${y + h / 2 - 3}" width="${w}" height="6" fill="#000" opacity="0.12"/>${label ? `<text x="${x + w / 2}" y="${y + h / 2 - 10}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" opacity="0.9">${label}</text>` : ""}</g>`;

  const shotsMarkup = (d) => {
    const payerIsLeft = d.payer === "left";
    const req = payerIsLeft ? d.right : d.left;     // the one getting paid, who sends the invoice
    const pay = payerIsLeft ? d.left : d.right;
    const bigReq = req.building
      ? `<g class="s1-who" transform="translate(250,476) scale(1.15)">${building()}</g>`
      : `<g class="s1-who" transform="translate(220,500) scale(1.42)">${person(req.who)}</g>`;
    const bigRecv = req.building
      ? `<g class="s4-who" transform="translate(260,476) scale(1.15)">${building()}</g>`
      : `<g class="s4-who" transform="translate(220,500) scale(1.42)">${person(req.who)}</g>`;

    let backdrop = "", propFx = "";
    if (d.prop === "shipIn" || d.prop === "shipOut") {
      backdrop = `
        <g transform="translate(280,70)"><rect width="260" height="140" rx="12" fill="${C.ink2}"/><rect x="10" y="10" width="240" height="120" rx="6" fill="#BFE0F0"/>
          <rect x="10" y="84" width="240" height="46" fill="#8CC3D6"/>
          <g class="s1-ship" transform="translate(130,92) scale(0.52)">${ship()}</g></g>
        ${crate(640, 330, 110, 140, C.tealInk, d.boxLabel)}${crate(756, 370, 120, 100, C.sand, "")}${crate(700, 250, 96, 80, C.soft, "")}`;
    } else if (d.prop === "design") {
      propFx = `<g class="s1-art" transform="translate(560,60) scale(1.5)">${artboard()}</g>`;
    }
    const invY = d.prop === "design" ? 300 : 70;
    const inv = card(560, invY, 330, d.prop === "design" ? 170 : 200, `
      <text x="22" y="36" font-size="15" fill="${C.soft}">${esc(d.invoice[0])}</text>
      <text x="22" y="60" font-size="14" fill="${C.soft}">To ${esc(pay.name)}</text>
      <text x="22" y="${d.prop === "design" ? 100 : 108}" font-size="34" font-weight="800" fill="${C.ink}">${esc(d.invoice[1])}</text>
      <g class="s1-btn"><rect x="22" y="${d.prop === "design" ? 118 : 140}" width="286" height="40" rx="10" fill="${C.ink}"/><text x="165" y="${d.prop === "design" ? 144 : 166}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">Send invoice</text></g>`, "s1-inv");

    const rows = d.ui.rows.map((r, i) => `
      <text x="210" y="${206 + i * 50}" font-size="18" fill="${C.soft}">${esc(r[0])}</text>
      <text class="${r[2] ? "s2-count" : ""}" x="750" y="${206 + i * 50}" text-anchor="end" font-size="28" font-weight="800" fill="${C.ink}">${esc(r[1])}</text>`).join("");

    const cmp = d.compare.map((r, i) => `
      <text x="20" y="${34 + i * 50}" font-size="14" font-weight="700" fill="${C.ink}">${esc(r[0])}</text>
      <text class="s3-v${i}" x="340" y="${34 + i * 50}" text-anchor="end" font-size="14" font-weight="800" fill="${i === 0 ? C.tealInk : C.soft}">${esc(r[1])}</text>
      <rect x="20" y="${44 + i * 50}" width="320" height="10" rx="5" fill="${C.water}"/>
      <rect class="s3-b${i}" x="20" y="${44 + i * 50}" width="320" height="10" rx="5" fill="${i === 0 ? C.tealInk : C.soft}"/>`).join("");

    return `
      <defs><filter id="fs-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0C1B2A" flood-opacity="0.18"/></filter>
        <clipPath id="phone-screen"><rect x="572" y="52" width="236" height="446" rx="26"/></clipPath></defs>

      <g class="shot s1">
        <rect width="960" height="540" fill="#E4EFEB"/>
        ${backdrop}
        <rect y="470" width="960" height="70" fill="${C.floor}"/>
        ${bigReq}
        ${propFx}
        ${inv}
        ${chip("1", "The invoice")}
      </g>

      <g class="shot s2">
        <rect width="960" height="540" fill="${C.water}"/>
        <rect x="150" y="34" width="660" height="420" rx="24" fill="${C.ink}"/>
        <rect x="168" y="52" width="624" height="384" rx="10" fill="${C.paper}"/>
        <path d="M104,454 L856,454 L826,486 L134,486 Z" fill="${C.ink2}"/>
        <g transform="translate(192,74)"><rect width="30" height="30" rx="7" fill="${C.ink}"/><path d="M6,10 h14 l-3,4 h-11z" fill="${C.teal}"/><path d="M24,20 h-14 l3,-4 h11z" fill="#fff"/>
          <text x="40" y="21" font-size="16" font-weight="800" fill="${C.ink}">FastStrait</text>
          <text x="576" y="21" text-anchor="end" font-size="14" fill="${C.soft}">${esc(pay.name)}</text></g>
        <text x="210" y="150" font-size="26" font-weight="800" fill="${C.ink}">${esc(d.ui.title)}</text>
        ${rows}
        <g class="s2-btn"><rect class="s2-btn-r" x="210" y="360" width="540" height="54" rx="12" fill="${C.ink}"/><text class="s2-btn-t" x="480" y="394" text-anchor="middle" font-size="19" font-weight="800" fill="#fff">${esc(d.ui.button)}</text></g>
        <g class="s2-cursor" transform="translate(760,470)"><path d="M0,0 L0,30 L8,22 L14,36 L20,33 L14,20 L25,20 Z" fill="${C.ink}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></g>
        <g transform="translate(24,494)"><rect width="${pay.name.length * 9 + 40 + ("pays from " + pay.place.split(",")[0]).length * 7.2}" height="32" rx="16" fill="#fff"/><text x="16" y="21" font-size="14" font-weight="700" fill="${C.ink}">${esc(pay.name)}</text><text x="${pay.name.length * 9 + 24}" y="21" font-size="13" fill="${C.soft}">pays from ${esc(pay.place.split(",")[0])}</text></g>
        ${chip("2", "The payment")}
      </g>

      <g class="shot s3">
        <g transform="translate(400,24)"><rect width="160" height="44" rx="22" fill="${C.ink}"/><text class="s3-clock" x="80" y="29" text-anchor="middle" font-size="20" font-weight="800" fill="${C.teal}">0:00</text></g>
        <g transform="translate(24,384)"><rect width="360" height="124" rx="16" fill="#fff" filter="url(#fs-shadow)"/>${cmp}</g>
        ${chip("3", "The journey")}
      </g>

      <g class="shot s4">
        <rect width="960" height="540" fill="#E2F2EC"/>
        <rect y="470" width="960" height="70" fill="${C.floor}"/>
        ${bigRecv}
        <g class="s4-tick" transform="translate(214,150) scale(0)"><circle r="26" fill="${C.tealInk}"/><path d="M-11,0 L-3,9 L12,-8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
        <rect x="560" y="40" width="260" height="470" rx="36" fill="${C.ink}"/>
        <rect x="572" y="52" width="236" height="446" rx="26" fill="${C.paper}"/>
        <g clip-path="url(#phone-screen)">
          <text x="590" y="186" font-size="12.5" fill="${C.soft}">${esc(d.phone)}</text>
          <text class="s4-bal" x="590" y="222" font-size="26" font-weight="800" fill="${C.ink}">${esc(d.bal[0])}0</text>
          <rect x="590" y="246" width="200" height="2" fill="${C.water}"/>
          <text x="590" y="276" font-size="12" font-weight="700" fill="${C.soft}">Today</text>
          <g class="s4-row" opacity="0"><circle cx="604" cy="308" r="12" fill="${C.teal}"/><text x="624" y="302" font-size="12.5" font-weight="700" fill="${C.ink}">${esc((() => { const n = d.note[2].replace(/^from /, "").split(",")[0]; return n.charAt(0).toUpperCase() + n.slice(1); })())}</text><text x="624" y="320" font-size="12" fill="${C.soft}">Received</text><text x="790" y="320" text-anchor="end" font-size="13" font-weight="800" fill="${C.tealInk}">+${esc(d.note[1])}</text></g>
          <g class="s4-note"><rect x="582" y="62" width="216" height="88" rx="16" fill="#fff" filter="url(#fs-shadow)"/><circle cx="602" cy="86" r="7" fill="${C.teal}"/><text x="616" y="91" font-size="12.5" font-weight="800" fill="${C.tealInk}">${esc(d.note[0])}</text><text x="596" y="120" font-size="21" font-weight="800" fill="${C.ink}">${esc(d.note[1])}</text><text x="596" y="139" font-size="11" fill="${C.soft}">${esc(d.note[2])}</text></g>
        </g>
        <rect x="660" y="60" width="60" height="8" rx="4" fill="${C.ink}"/>
        ${d.shipTag ? `<g transform="translate(24,494)"><rect width="330" height="32" rx="16" fill="${C.ink}"/><text x="165" y="21" text-anchor="middle" font-size="13.5" font-weight="700" fill="#fff">${esc(d.shipTag[1])}</text></g>` : ""}
        ${chip("4", "Received")}
      </g>`;
  };

  let mapApi = null;
  const buildShots = (n) => {
    idx = n;
    const d = CHAPTERS[n];
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === n)); t.tabIndex = k === n ? 0 : -1; });
    badge.hidden = !d.soon;
    stage.innerHTML = shotsMarkup(d);
    if (tl) tl.kill();
    const shot = (k) => q(`.s${k}`);
    [1, 2, 3, 4].forEach((k) => (shot(k).style.opacity = k === 1 ? 1 : 0));

    // The real corridor map sits behind the stage and shows through scene 3.
    const old = root.querySelector(".film-map");
    const mapEl = old.cloneNode(false); old.replaceWith(mapEl);
    mapEl.style.opacity = 0;
    if (mapApi) mapApi.destroy();
    let overlay = null;
    const hasMap = typeof window.FSChart === "function" && typeof window.d3 !== "undefined";
    if (hasMap) {
      mapApi = FSChart(mapEl, { routes: [d.route], sail: false, staticWake: false, labels: true, extent: (W, H) => [16, Math.round(H * 0.16), W - 16, H - 12] });
      overlay = d3.select(mapEl).append("g");
    }
    const geo = (k) => { const p = mapApi.port(k); return [p.lon, p.lat]; };
    const drawJourney = (t, ts) => {
      if (!overlay) return;
      overlay.selectAll("*").remove();
      const money = d3.geoInterpolate(geo(d.route[0]), geo(d.route[1]));
      const pts = d3.range(0, 1.0001, 1 / 60).map((u) => mapApi.project(...money(u * t)));
      overlay.append("path").attr("d", d3.line()(pts)).attr("fill", "none").attr("stroke", C.tealInk).attr("stroke-width", 4).attr("stroke-linecap", "round");
      const [x, y] = mapApi.project(...money(t));
      if (d.prop === "notes") {
        const flipped = t > 0.5, sx = Math.max(0.05, Math.abs(Math.cos(Math.min(1, Math.max(0, (t - 0.4) / 0.2)) * Math.PI)));
        overlay.append("g").attr("transform", `translate(${x},${y}) scale(${0.62 * sx},0.62)`).html(flipped ? banknote("£", "£ 3,650", "#6E4C8C") : banknote("R", "R 85,000", "#2E7D5B"));
      } else {
        const g = overlay.append("g").attr("transform", `translate(${x},${y})`);
        g.append("circle").attr("r", 16).attr("fill", C.teal).attr("stroke", C.ink).attr("stroke-width", 3);
        g.append("text").attr("y", 6).attr("text-anchor", "middle").attr("font-size", 16).attr("font-weight", 800).attr("fill", C.ink).attr("font-family", "Archivo, sans-serif").text(t < 0.5 ? d.token[0] : d.token[1]);
      }
      if (d.shipRoute) {
        const sea = d3.geoInterpolate(geo(d.shipRoute[0]), geo(d.shipRoute[1]));
        const [sx, sy] = mapApi.project(...sea(0.02 + ts * 0.04));
        const flip = d.shipRoute[1] === "DUR" ? 1 : -1;
        overlay.append("g").attr("transform", `translate(${sx},${sy}) scale(${0.3 * flip},0.3)`).html(ship());
      }
    };

    const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
    const cntRow = d.ui.rows.find((r) => r[2]);
    const money = (pre, v) => pre + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const arm4 = q(".s4-who .arm"), recvTick = q(".s4-tick");

    const finalFrame = () => {
      [1, 2, 3].forEach((k) => (shot(k).style.opacity = 0)); shot(4).style.opacity = 1;
      q(".s4-bal").textContent = money(d.bal[0], d.bal[2]); q(".s4-row").setAttribute("opacity", 1);
      if (arm4) setRot(arm4, -68); recvTick.setAttribute("transform", "translate(214,150) scale(1)");
      cap.textContent = d.caps[3]; bar.style.transform = "scaleX(1)";
    };
    if (!hasGsap || reduce) { finalFrame(); return; }

    tl = gsap.timeline({
      paused: userPaused || !inView,
      onUpdate: () => { bar.style.transform = `scaleX(${tl.progress()})`; },
      onComplete: () => { if (!userPaused) run((idx + 1) % CHAPTERS.length); },
    });
    const cut = (from, to, at) => {
      tl.to(shot(from), { opacity: 0, x: -50, duration: 0.35, ease: "power2.in" }, at);
      tl.fromTo(shot(to), { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, at + 0.2);
    };

    // 1. The invoice: the longest shot, so the person and their world can be read
    tl.call(() => (cap.textContent = d.caps[0]), null, 0);
    tl.fromTo(q(".s1-who"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
    const s1ship = q(".s1-ship");
    if (s1ship) { const b = { y: 0 }; tl.to(b, { y: 4, duration: 0.9, repeat: 7, yoyo: true, ease: "sine.inOut", onUpdate: () => s1ship.setAttribute("transform", `translate(130,${92 + b.y}) scale(0.52)`) }, 0); }
    const art = q(".s1-art");
    let invIn = 1.0;
    if (art) {
      tl.fromTo(art, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.2);
      tl.fromTo(art.querySelectorAll(".shape"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.28, ease: "back.out(2)" }, 0.5);
      invIn = 2.5;
    }
    const arm1 = q(".s1-who .arm");
    if (arm1) { const a1 = { a: 0 }; tl.to(a1, { a: -7, duration: 0.16, repeat: Math.round((invIn + 0.6) / 0.16), yoyo: true, ease: "sine.inOut", onUpdate: () => setRot(arm1, a1.a) }, 0.3); }
    tl.fromTo(q(".s1-inv"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, invIn);
    tl.to(q(".s1-btn"), { scale: 0.95, transformOrigin: "50% 50%", duration: 0.14, yoyo: true, repeat: 1 }, invIn + 1.8);
    tl.to(q(".s1-inv"), { x: -260, y: -180, scale: 0.4, opacity: 0, duration: 0.8, ease: "power2.in" }, invIn + 2.5);

    // 2. The payment
    const t2 = invIn + 3.6;
    cut(1, 2, t2);
    tl.call(() => (cap.textContent = d.caps[1]), null, t2 + 0.2);
    const cntEl = q(".s2-count");
    if (cntEl && cntRow) { const c = { v: 0 }; tl.to(c, { v: cntRow[2], duration: 1.4, ease: "power2.out", onUpdate: () => (cntEl.textContent = money(cntRow[3], c.v)) }, t2 + 0.7); }
    const cur = q(".s2-cursor"), cp = { x: 760, y: 470 };
    tl.to(cp, { x: 655, y: 386, duration: 1.2, ease: "power2.inOut", onUpdate: () => cur.setAttribute("transform", `translate(${cp.x},${cp.y})`) }, t2 + 2.0);
    tl.to(q(".s2-btn"), { scale: 0.97, transformOrigin: "50% 50%", duration: 0.12, yoyo: true, repeat: 1 }, t2 + 3.35);
    tl.call(() => { q(".s2-btn-r").setAttribute("fill", C.teal); const bt = q(".s2-btn-t"); bt.setAttribute("fill", C.ink); bt.textContent = "Sent"; }, null, t2 + 3.5);

    // 3. The journey
    const t3 = t2 + 4.6;
    cut(2, 3, t3);
    tl.to(mapEl, { opacity: 1, duration: 0.5 }, t3 + 0.2);
    tl.call(() => (cap.textContent = d.caps[2]), null, t3 + 0.2);
    const jr = { t: 0 };
    tl.to(jr, { t: 1, duration: 3.2, ease: "power1.inOut", onUpdate: () => {
      drawJourney(Math.max(jr.t, 0.001), jr.t);
      q(".s3-clock").textContent = fmtClock(jr.t * d.clock);
    } }, t3 + 0.7);
    tl.fromTo(q(".s3-b0"), { scaleX: 0 }, { scaleX: 1, duration: 3.2, ease: "power1.inOut", transformOrigin: "0% 50%" }, t3 + 0.7);
    tl.fromTo(q(".s3-b1"), { scaleX: 0 }, { scaleX: d.compare[1][2], duration: 3.2, ease: "none", transformOrigin: "0% 50%" }, t3 + 0.7);

    // 4. Received: held long enough to read the phone and the caption
    const t4 = t3 + 4.8;
    tl.to(mapEl, { opacity: 0, duration: 0.4 }, t4);
    cut(3, 4, t4);
    tl.call(() => (cap.textContent = d.caps[3]), null, t4 + 0.2);
    tl.fromTo(q(".s4-note"), { y: -110 }, { y: 0, duration: 0.6, ease: "back.out(1.4)" }, t4 + 0.7);
    const bl = { v: d.bal[1] };
    q(".s4-bal").textContent = money(d.bal[0], d.bal[1]);
    tl.to(bl, { v: d.bal[2], duration: 1.4, ease: "power2.out", onUpdate: () => (q(".s4-bal").textContent = money(d.bal[0], bl.v)) }, t4 + 1.4);
    tl.call(() => q(".s4-row").setAttribute("opacity", 1), null, t4 + 1.6);
    const ra = { a: 0 };
    if (arm4) tl.to(ra, { a: -68, duration: 0.55, ease: "back.out(2)", onUpdate: () => setRot(arm4, ra.a) }, t4 + 1.5);
    const tc = { s: 0 };
    tl.to(tc, { s: 1, duration: 0.45, ease: "back.out(2.5)", onUpdate: () => recvTick.setAttribute("transform", `translate(214,150) scale(${tc.s})`) }, t4 + 1.7);
    tl.to({}, { duration: 3.6 }, t4 + 2.4);
    applySeek();
  };

  const setPaused = (p) => {
    userPaused = p;
    playBtn.classList.toggle("paused", p);
    playBtn.setAttribute("aria-label", p ? "Play" : "Pause");
    if (!tl) return;
    if (p) tl.pause(); else if (inView) tl.play();
  };

  const run = (n) => (root.dataset.mode === "scenes" ? buildShots(n) : build(n));

  playBtn.addEventListener("click", () => {
    if (tl && tl.progress() === 1) { setPaused(false); run(idx); return; }
    setPaused(!userPaused);
  });
  tabs.forEach((t, k) => {
    t.addEventListener("click", () => run(k));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = (k + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      run(n); tabs[n].focus();
    });
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      inView = e.isIntersecting;
      if (!tl) return;
      if (inView && !userPaused) tl.play(); else tl.pause();
    }), { threshold: 0.35 }).observe(root);
  } else inView = true;

  const startAt = Math.min(CHAPTERS.length - 1, Math.max(0, parseInt(new URLSearchParams(location.search).get("chapter") || "0", 10) || 0));
  run(startAt);
  if (reduce) { playBtn.hidden = true; }
})();
