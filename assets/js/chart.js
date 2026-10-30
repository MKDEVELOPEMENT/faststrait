/* Nautical chart renderer: real coastlines (Natural Earth, via world-atlas), great-circle routes, a sailing marker. */
(() => {
  "use strict";

  const PORTS = {
    CPT: { name: "Cape Town", lon: 18.42, lat: -33.92, dx: -14, dy: 5, anchor: "end" },
    JNB: { name: "Johannesburg", lon: 28.05, lat: -26.2, dx: 12, dy: 4 },
    NYC: { name: "New York", lon: -74.0, lat: 40.71, dx: -14, dy: -12, anchor: "end" },
    LON: { name: "London", lon: -0.12, lat: 51.5, dx: -12, dy: -12, anchor: "end" },
    RTM: { name: "Rotterdam", lon: 4.48, lat: 51.92, dx: 12, dy: 16 },
    FRA: { name: "Frankfurt", lon: 8.68, lat: 50.11, dx: 12, dy: 6 },
    DUR: { name: "Durban", lon: 31.03, lat: -29.86, dx: 12, dy: 5 },
    PTA: { name: "Pretoria", lon: 28.19, lat: -25.75, dx: 12, dy: 5 },
    DAY: { name: "Dayton", lon: -84.19, lat: 39.76, dx: -12, dy: -12, anchor: "end" },
    MAN: { name: "Manchester", lon: -2.24, lat: 53.48, dx: -12, dy: -10, anchor: "end" },
  };

  const LAND_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json";
  let landPromise = null;
  const loadLand = () => {
    if (!landPromise) {
      landPromise = fetch(LAND_URL).then((r) => r.json()).then((t) => topojson.feature(t, t.objects.land)).catch(() => null);
    }
    return landPromise;
  };

  // Deterministic pseudo-random for soundings so the chart is stable between renders.
  const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  window.FSChart = function (svgEl, opts) {
    const o = Object.assign({
      routes: [["CPT", "NYC"], ["CPT", "LON"], ["CPT", "RTM"]],
      sail: true,
      bounds: [[-100, -45], [45, 62]],
      soundings: 0,
      grid: false,
      rose: false,
      labels: true,
      onLeg: null,
      onTick: null,
      legMs: 7000,
      restMs: 2200,
      reserveRight: 0,   // px kept clear on the right (the send panel) when fitting
      avoid: null,       // () => [DOMRect] regions where soundings are culled
    }, opts || {});

    const svg = d3.select(svgEl);
    const projection = d3.geoMercator();
    const path = d3.geoPath(projection);
    let W = 0, H = 0, sailTimer = null, raf = null;

    const g = svg.append("g");
    const gWater = g.append("g");
    const gLand = g.append("g");
    const gRoutes = g.append("g");
    const gPorts = g.append("g");
    const gShip = g.append("g");

    const fit = () => {
      const rect = svgEl.getBoundingClientRect();
      W = Math.max(rect.width, 1); H = Math.max(rect.height, 1);
      svg.attr("viewBox", `0 0 ${W} ${H}`);
      // Corridor fit: keep lat [-41, 58] and a 120° lon band (New York to Cape Town) inside the
      // extent box, scaled by whichever axis is tighter. Land outside the box still draws, so the
      // chart stays full-bleed while the routes sit where the extent puts them.
      const ex = (o.extent && o.extent(W, H)) || [0, 0, W, H];
      const EW = Math.max(ex[2] - ex[0], 1), EH = Math.max(ex[3] - ex[1], 1);
      const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
      const latSpan = merc(58) - merc(-41);
      const lonSpan = (120 * Math.PI) / 180;
      const k = Math.min(EH / latSpan, EW / lonSpan);
      projection.scale(k).center([-27, 0]).translate([ex[0] + EW / 2, ex[1] + EH / 2 + (k * (merc(58) + merc(-41))) / 2]);
    };

    const routeGeo = (a, b) => ({ type: "LineString", coordinates: [[PORTS[a].lon, PORTS[a].lat], [PORTS[b].lon, PORTS[b].lat]] });

    const draw = (land) => {
      gWater.selectAll("*").remove(); gLand.selectAll("*").remove(); gRoutes.selectAll("*").remove(); gPorts.selectAll("*").remove(); gShip.selectAll("*").remove();

      // Graticule
      if (o.grid) gWater.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule().step([10, 10])()));

      // Soundings: scattered depth numerals, the chart's own texture
      const r = rnd(42);
      const s = gWater.append("g");
      const rects = (o.avoid && o.avoid()) || [];
      const svgBox = svgEl.getBoundingClientRect();
      const blocked = (x, y) => rects.some((rc) => x > rc.left - svgBox.left - 8 && x < rc.right - svgBox.left + 8 && y > rc.top - svgBox.top - 8 && y < rc.bottom - svgBox.top + 8);
      const count = W > 900 ? o.soundings : Math.min(o.soundings, 30);
      for (let i = 0; i < count; i++) {
        const lon = o.bounds[0][0] + r() * (o.bounds[1][0] - o.bounds[0][0]);
        const lat = o.bounds[0][1] + r() * (o.bounds[1][1] - o.bounds[0][1]);
        const p = projection([lon, lat]);
        if (!p || blocked(p[0], p[1])) continue;
        s.append("text").attr("class", "sounding").attr("x", p[0]).attr("y", p[1]).text(Math.round(800 + r() * 5200));
      }

      if (land) gLand.append("path").attr("class", "land").attr("d", path(land));

      // Compass rose
      if (o.rose && W > 1080) {
        const cx = (W - (W > 1080 ? Math.min(o.reserveRight, W * 0.4) : 0)) * 0.72, cy = H * 0.86, rr = Math.min(W, H) * 0.07;
        const rose = gWater.append("g").attr("class", "rose-g").attr("transform", `translate(${cx},${cy})`);
        rose.append("circle").attr("class", "rose").attr("r", rr);
        rose.append("circle").attr("class", "rose").attr("r", rr * 0.72);
        for (let a = 0; a < 360; a += 10) {
          const len = a % 90 === 0 ? rr * 0.28 : a % 30 === 0 ? rr * 0.16 : rr * 0.08;
          const rad = (a * Math.PI) / 180;
          rose.append("line").attr("class", "rose").attr("x1", Math.sin(rad) * (rr - len)).attr("y1", -Math.cos(rad) * (rr - len)).attr("x2", Math.sin(rad) * rr).attr("y2", -Math.cos(rad) * rr);
        }
        rose.append("line").attr("class", "rose").attr("x1", 0).attr("y1", -rr * 1.25).attr("x2", 0).attr("y2", rr * 0.72).attr("stroke-width", 1.5);
        rose.append("text").attr("class", "rose-n").attr("x", 0).attr("y", -rr * 1.32).attr("text-anchor", "middle").text("N");
      }

      // Routes
      o.routes.forEach(([a, b]) => {
        gRoutes.append("path").attr("class", "route").attr("d", path(routeGeo(a, b)));
      });

      // Ports
      const seen = new Set();
      o.routes.flat().forEach((k) => {
        if (seen.has(k)) return; seen.add(k);
        const pt = PORTS[k]; const p = projection([pt.lon, pt.lat]); if (!p) return;
        gPorts.append("circle").attr("class", "port-ring").attr("cx", p[0]).attr("cy", p[1]).attr("r", 9);
        gPorts.append("circle").attr("class", "port").attr("cx", p[0]).attr("cy", p[1]).attr("r", 4);
        if (o.labels && W > 360 && !blocked(p[0], p[1])) {
          // Preferred placement, then below the point, then above; skip if all collide with copy.
          const tries = [[p[0] + (pt.dx || 10), p[1] + (pt.dy || 4), pt.anchor || "start"], [p[0], p[1] + 24, "middle"], [p[0], p[1] - 16, "middle"]];
          const spot = tries.find(([x, y]) => !blocked(x, y) && !blocked(x - 40, y) && !blocked(x + 40, y));
          if (spot) gPorts.append("text").attr("class", "label").attr("x", spot[0]).attr("y", spot[1]).attr("text-anchor", spot[2]).text(pt.name.toUpperCase());
        }
      });
    };

    // Sailing: a marker runs each route in turn, leaving a solid wake.
    let legIndex = 0;
    const sail = () => {
      if (!o.sail) return;
      const [a, b] = o.routes[legIndex % o.routes.length];
      const interp = d3.geoInterpolate([PORTS[a].lon, PORTS[a].lat], [PORTS[b].lon, PORTS[b].lat]);
      gShip.selectAll("*").remove();
      const wake = gShip.append("path").attr("class", "wake");
      const ship = gShip.append("circle").attr("class", "ship").attr("r", 7);
      const start = performance.now();
      if (o.onLeg) o.onLeg(PORTS[a], PORTS[b]);
      const frame = (now) => {
        const t = Math.min((now - start) / o.legMs, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in-out
        const pts = [];
        const n = 48;
        for (let i = 0; i <= n; i++) pts.push(interp((i / n) * e));
        wake.attr("d", path({ type: "LineString", coordinates: pts }));
        const p = projection(interp(e));
        ship.attr("cx", p[0]).attr("cy", p[1]);
        if (o.onTick) o.onTick(e, PORTS[a], PORTS[b]);
        if (t < 1) raf = requestAnimationFrame(frame);
        else { legIndex += 1; sailTimer = setTimeout(sail, o.restMs); }
      };
      raf = requestAnimationFrame(frame);
    };

    let land = null;
    const render = () => { fit(); draw(land); };
    render();
    loadLand().then((l) => { land = l; render(); });

    let ro = null;
    if ("ResizeObserver" in window) {
      let last = 0;
      ro = new ResizeObserver(() => {
        const w = svgEl.getBoundingClientRect().width;
        if (Math.abs(w - last) < 2) return; last = w;
        render();
      });
      ro.observe(svgEl);
    }
    if (o.sail) sailTimer = setTimeout(sail, 900);
    else if (o.staticWake !== false) {
      // Static: show the first route fully sailed.
      const [a, b] = o.routes[0];
      const drawStatic = () => {
        gShip.selectAll("*").remove();
        gShip.append("path").attr("class", "wake").attr("d", path(routeGeo(a, b)));
        const p = projection([PORTS[b].lon, PORTS[b].lat]);
        gShip.append("circle").attr("class", "ship").attr("r", 7).attr("cx", p[0]).attr("cy", p[1]);
      };
      drawStatic();
      loadLand().then(drawStatic);
      if (o.onLeg) o.onLeg(PORTS[a], PORTS[b]);
    }

    return {
      destroy() { if (raf) cancelAnimationFrame(raf); if (sailTimer) clearTimeout(sailTimer); if (ro) ro.disconnect(); },
      // For overlays that animate on top of the chart (the explainer's journey scene).
      project: (lon, lat) => projection([lon, lat]),
      port: (k) => PORTS[k],
      refit: render,
      ready: loadLand(),
    };
  };
})();
