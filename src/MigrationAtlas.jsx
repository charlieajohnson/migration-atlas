import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Constants ──
const MAP_BOUNDS = { minLat: 8, maxLat: 70, minLon: -20, maxLon: 45 };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];

const SEASON_COLORS = { Spring: "#7ecf8b", Summer: "#e8c36a", Autumn: "#d4845a", Winter: "#6ba3cf" };

const SPECIES = [
  {
    name: "Barn Swallow", color: "#7ecf8b",
    routes: [
      { waypoints: [[0,8],[0,15],[-5,25],[-5,35],[-2,38],[0,42],[2,46],[5,50],[10,55],[12,58],[15,62]], spread: 7, count: 200 },
      { waypoints: [[10,8],[12,15],[12,25],[10,32],[12,38],[12,42],[10,46],[12,50],[13,52],[12,55]], spread: 5, count: 160 },
      { waypoints: [[28,8],[28,15],[28,25],[25,32],[24,37],[23,40],[22,44],[22,48],[21,52],[20,55]], spread: 6, count: 130 },
    ],
    migrationStart: 60, migrationEnd: 150, returnStart: 220, returnEnd: 300,
  },
  {
    name: "White Stork", color: "#e8c36a",
    routes: [
      { waypoints: [[-5,12],[-5,20],[-5,28],[-5,35],[-3,38],[-2,40],[0,43],[2,47],[4,50],[5,52]], spread: 4, count: 90 },
      { waypoints: [[32,8],[33,15],[34,25],[35,32],[35,36],[33,39],[30,41],[28,43],[25,47],[22,50],[20,53],[18,55]], spread: 5, count: 140 },
    ],
    migrationStart: 50, migrationEnd: 130, returnStart: 230, returnEnd: 310,
  },
  {
    name: "Arctic Tern", color: "#6ba3cf",
    routes: [
      { waypoints: [[-15,10],[-15,18],[-12,28],[-8,35],[-5,42],[-2,48],[0,52],[3,56],[5,60],[8,65],[10,68]], spread: 9, count: 110 },
      { waypoints: [[-10,10],[-5,18],[0,28],[5,35],[5,42],[2,48],[5,55],[10,60],[15,65],[20,68]], spread: 7, count: 90 },
    ],
    migrationStart: 90, migrationEnd: 170, returnStart: 210, returnEnd: 290,
  },
  {
    name: "European Bee-eater", color: "#d4845a",
    routes: [
      { waypoints: [[0,10],[0,18],[-3,28],[-5,34],[-2,37],[0,40],[2,43],[3,45]], spread: 4, count: 100 },
      { waypoints: [[15,10],[14,18],[12,28],[10,34],[11,38],[12,42],[11,44],[11,46]], spread: 3, count: 80 },
      { waypoints: [[25,10],[26,18],[25,28],[24,33],[23,37],[22,40],[21,42],[21,44]], spread: 3, count: 70 },
    ],
    migrationStart: 100, migrationEnd: 160, returnStart: 240, returnEnd: 310,
  },
  {
    name: "Common Crane", color: "#b58fc2",
    routes: [
      { waypoints: [[-3,36],[-1,38],[0,42],[2,46],[5,50],[8,53],[12,56],[15,60],[18,64]], spread: 4, count: 80 },
      { waypoints: [[30,37],[27,40],[24,43],[22,46],[20,50],[18,53],[16,56],[15,59],[16,62]], spread: 4, count: 70 },
    ],
    migrationStart: 45, migrationEnd: 120, returnStart: 250, returnEnd: 320,
  },
];

const COUNTRY_LABELS = [
  ["NORWAY",64,12,10],["SWEDEN",62,16,10],["FINLAND",63,27,10],
  ["UNITED KINGDOM",54,-2,9],["IRELAND",53.5,-8,8],
  ["FRANCE",46.5,2.5,11],["SPAIN",40,-3.5,11],["PORTUGAL",39.5,-8,8],
  ["ITALY",42.5,12,9],["GERMANY",51,10,10],["POLAND",52,19.5,10],
  ["ROMANIA",45.5,25,9],["GREECE",39,22,8],["TURKEY",39,33,10],
  ["MOROCCO",32,-6,10],["ALGERIA",28,3,10],["LIBYA",27,17,10],
  ["EGYPT",27,30,10],["MALI",17,-2,9],["NIGER",17,9,9],
  ["NIGERIA",11,8,9],["CHAD",15,19,9],["SUDAN",16,30,9],
  ["DENMARK",56.5,10,7],["NETHERLANDS",52.5,5.5,7],["UKRAINE",49,32,9],
];

const SEA_LABELS = [
  ["ATLANTIC\nOCEAN",38,-16,13],["NORTH\nSEA",57,3,10],
  ["MEDITERRANEAN SEA",35.5,12,11],["BALTIC\nSEA",58.5,20,9],
  ["BLACK SEA",43.5,34,9],["SAHARA",23,5,13],
];

const BOTTLENECKS = [
  ["Strait of Gibraltar",36,-5.5],["Bosphorus",41.1,29],
  ["Strait of Messina",38.2,15.6],["Falsterbo",55.4,12.8],
];

const CITIES = [
  ["London",51.5,-0.1],["Paris",48.85,2.35],["Madrid",40.4,-3.7],
  ["Rome",41.9,12.5],["Berlin",52.5,13.4],["Stockholm",59.3,18.1],
  ["Istanbul",41,29],["Cairo",30.05,31.2],["Lagos",6.5,3.4],
];

const FALLBACK_COASTS = [
  [[-9.5,37],[-9,38.7],[-8.5,40],[-8.8,41.8],[-9.3,43],[-7.5,43.5],[-5,43.5],[-3.5,43.3],[-2,43.5],[-1.5,43.3],[0.5,42.5],[1.5,42.5],[3.2,42.5],[3.2,41.5],[2.5,41],[1,41],[-0.5,39.5],[0,38.5],[-0.5,38],[-1,37.5],[-2,36.7],[-5.3,36],[-5.6,36],[-7,37],[-8.5,37],[-9.5,37]],
  [[3.2,42.5],[3.5,43.2],[4.2,43.5],[5,43.3],[6.2,43],[7.5,43.7],[7.5,44.2],[6.8,45.8],[6,46.3],[6.2,47],[7,47.5],[7.5,48],[6.5,49],[3,50.5],[2,51],[1.5,50.5],[1,49.5],[-1,48.6],[-2,48.5],[-3.5,48.5],[-4.5,48.3],[-4.7,48],[-4,47.8],[-3,47.5],[-2.5,47.2],[-1,46.5],[-1.2,45.5],[-1,44.5],[-1.5,43.3]],
  [[7.5,43.7],[8.2,44],[9,44.1],[9.5,44.3],[10,44.2],[11,44],[12,44],[13.5,43.5],[14.5,42],[15,41],[16,40],[16,39],[15.6,38.5],[15.6,38],[16,37.5],[15.3,37],[13,37.5],[12.5,38],[13,38.7],[12.5,39.5],[12,40],[10.5,42.3],[10,43],[9.5,44.3]],
  [[-5.5,50],[-3.5,50.3],[-1,50.8],[1.5,51],[1.7,52.5],[0.5,53],[-0.5,53.5],[-1,54.5],[-3,54.5],[-3.2,55.5],[-5,56],[-5.5,57.5],[-5,58.5],[-3,58.7],[-2,57.7],[-1.5,57],[-2,56],[-3.5,56],[-5,56],[-5.5,55],[-4.5,54],[-3,53.5],[-4.5,53],[-3,51.5],[-4.5,51.5],[-5.5,50]],
  [[-6,52],[-6,53],[-7,53.5],[-8,53.5],[-10,53],[-10.5,52],[-9.5,51.5],[-8,51.5],[-6.5,51.8],[-6,52]],
  [[5,58],[7,58],[8,57.5],[10,57.5],[11,58],[12,56],[13,55.5],[14,55.5],[14.5,56],[15,56.5],[16,56],[18,56],[19,57.5],[18.5,59],[18,59.5],[16.5,59],[17,60.5],[18.5,63],[17,65],[15,67],[14,68],[16,69],[20,69.5],[22,70],[25,71],[28,71],[30,70],[29,69],[26,68],[24,66],[24,65],[25.5,63],[25,61.5],[22.5,60],[21,60.5],[21,61.5],[20.5,63],[21.5,64],[24,65],[23.5,60],[20,59.5],[19,57.5]],
  [[-5.6,36],[-2,35.5],[0,35.5],[2,35],[3,37],[5,36.5],[7,37],[8.5,37],[9.5,37],[10,37],[10.5,36.5],[11,33],[10,31],[9,31],[8,34],[5,36],[3,36.5],[1,35],[0,35.5]],
  [[20,40],[21,38.5],[22,38],[23,37.5],[24,38],[24,39],[23.5,40],[24,40.5],[26,41.5],[28,41],[29,41.5],[28,43],[27,44],[23,44],[22,44.5],[20,44],[19,43],[19,42],[20,42],[19.5,41],[20,40]],
  [[26,41],[27,41.5],[29,41.5],[29,41],[30,40.5],[28,40],[27,40.5],[26,40],[26,39],[27,38.5],[27,37],[28,36.5],[29,36.5],[30,37],[32,36.5],[35,36.5],[36,37],[36,38],[35,39],[33,40],[32,41],[30,41],[29,41.5]],
];

// ── Helpers ──
function latLonToXY(lat, lon, w, h) {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * (w * 0.88) + w * 0.06;
  const latRad = lat * Math.PI / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const minMerc = Math.log(Math.tan(Math.PI / 4 + (MAP_BOUNDS.minLat * Math.PI / 180) / 2));
  const maxMerc = Math.log(Math.tan(Math.PI / 4 + (MAP_BOUNDS.maxLat * Math.PI / 180) / 2));
  const y = (1 - (mercN - minMerc) / (maxMerc - minMerc)) * (h * 0.82) + h * 0.06;
  return { x, y };
}

function hexRGB(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function dayToDate(day) {
  let d = ((day % 365) + 365) % 365;
  let m = 0;
  while (d >= MONTH_DAYS[m] && m < 11) { d -= MONTH_DAYS[m]; m++; }
  return { month: MONTHS[m], day: Math.floor(d) + 1 };
}

function getSeason(day) {
  const d = ((day % 365) + 365) % 365;
  if (d < 80 || d >= 355) return "Winter";
  if (d < 172) return "Spring";
  if (d < 264) return "Summer";
  return "Autumn";
}

function getDirection(day) {
  const d = ((day % 365) + 365) % 365;
  if (d > 50 && d < 170) return "↑ Northbound";
  if (d > 210 && d < 320) return "↓ Southbound";
  return "· Settled";
}

function catmullRom(wp, t, lonOff, latOff) {
  const ct = Math.max(0, Math.min(1, t));
  const ts = wp.length - 1;
  const sf = ct * ts;
  const s = Math.min(Math.floor(sf), ts - 1);
  const st = sf - s;
  const p0 = wp[Math.max(0, s - 1)] || wp[s];
  const p1 = wp[s];
  const p2 = wp[Math.min(ts, s + 1)];
  const p3 = wp[Math.min(ts, s + 2)] || p2;
  const t2 = st * st, t3 = t2 * st;
  return {
    lat: 0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*st + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3) + latOff,
    lon: 0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*st + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3) + lonOff,
  };
}

function decodeTopojson(obj, arcs, transform) {
  const sc = transform?.scale || [1, 1];
  const tr = transform?.translate || [0, 0];
  const decoded = arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(p => { x += p[0]; y += p[1]; return [x * sc[0] + tr[0], y * sc[1] + tr[1]]; });
  });
  const polys = [];
  obj.geometries.forEach(geom => {
    const rings = [];
    const aa = geom.type === "Polygon" ? [geom.arcs] : geom.type === "MultiPolygon" ? geom.arcs : [];
    aa.forEach(poly => poly.forEach(ring => {
      const coords = [];
      ring.forEach(idx => {
        const rev = idx < 0;
        const arc = decoded[rev ? ~idx : idx];
        const pts = rev ? [...arc].reverse() : arc;
        pts.forEach((p, i) => { if (i === 0 && coords.length > 0) return; coords.push(p); });
      });
      rings.push(coords);
    }));
    if (rings.length) polys.push({ rings, id: geom.id });
  });
  return polys;
}

// ── Generate flock particles (stable across renders) ──
function generateFlocks() {
  const flocks = [];
  SPECIES.forEach((sp, si) => {
    sp.routes.forEach(route => {
      for (let i = 0; i < route.count; i++) {
        flocks.push({
          si,
          waypoints: route.waypoints,
          offset: (Math.random() - 0.5) * 35,
          latOff: (Math.random() - 0.5) * route.spread,
          lonOff: (Math.random() - 0.5) * route.spread,
          size: 1 + Math.random() * 1.8,
          speedVar: 0.85 + Math.random() * 0.3,
          opacity: 0,
        });
      }
    });
  });
  return flocks;
}

// ── Map cache renderer ──
function renderMapCache(geoData, w, h, dpr) {
  const mc = document.createElement("canvas");
  mc.width = w * dpr;
  mc.height = h * dpr;
  const m = mc.getContext("2d");
  m.setTransform(dpr, 0, 0, dpr, 0, 0);

  m.fillStyle = "#0b1018";
  m.fillRect(0, 0, w, h);

  const og = m.createRadialGradient(w * 0.4, h * 0.45, 0, w * 0.4, h * 0.45, w * 0.7);
  og.addColorStop(0, "rgba(15,22,35,0.5)");
  og.addColorStop(1, "rgba(10,14,20,0)");
  m.fillStyle = og;
  m.fillRect(0, 0, w, h);

  const drawPolys = (data) => {
    data.forEach(country => {
      country.rings.forEach(ring => {
        if (!ring.some(p => p[0] >= MAP_BOUNDS.minLon - 15 && p[0] <= MAP_BOUNDS.maxLon + 15 && p[1] >= MAP_BOUNDS.minLat - 10 && p[1] <= MAP_BOUNDS.maxLat + 10)) return;
        m.beginPath();
        ring.forEach((p, i) => { const xy = latLonToXY(p[1], p[0], w, h); i === 0 ? m.moveTo(xy.x, xy.y) : m.lineTo(xy.x, xy.y); });
        m.closePath();
        m.fillStyle = "rgba(20,26,36,0.95)";
        m.fill();
        m.strokeStyle = "rgba(255,255,255,0.13)";
        m.lineWidth = 0.7;
        m.stroke();
      });
    });
  };

  if (geoData) {
    drawPolys(geoData);
  } else {
    FALLBACK_COASTS.forEach(coast => {
      m.beginPath();
      coast.forEach((p, i) => { const xy = latLonToXY(p[1], p[0], w, h); i === 0 ? m.moveTo(xy.x, xy.y) : m.lineTo(xy.x, xy.y); });
      m.closePath();
      m.fillStyle = "rgba(20,26,36,0.95)";
      m.fill();
      m.strokeStyle = "rgba(255,255,255,0.13)";
      m.lineWidth = 0.7;
      m.stroke();
    });
  }

  // Grid
  m.strokeStyle = "rgba(255,255,255,0.025)";
  m.lineWidth = 0.5;
  for (let lat = 10; lat <= 70; lat += 10) {
    m.beginPath();
    const a = latLonToXY(lat, MAP_BOUNDS.minLon, w, h);
    const b = latLonToXY(lat, MAP_BOUNDS.maxLon, w, h);
    m.moveTo(a.x, a.y); m.lineTo(b.x, b.y); m.stroke();
    m.font = "8px 'DM Sans', sans-serif";
    m.fillStyle = "rgba(255,255,255,0.07)";
    m.textAlign = "right";
    m.fillText(lat + "°N", a.x - 4, a.y + 3);
  }
  for (let lon = -20; lon <= 40; lon += 10) {
    m.beginPath();
    const a = latLonToXY(MAP_BOUNDS.maxLat, lon, w, h);
    const b = latLonToXY(MAP_BOUNDS.minLat, lon, w, h);
    m.moveTo(a.x, a.y); m.lineTo(b.x, b.y); m.stroke();
  }

  // Country labels
  m.textAlign = "center"; m.textBaseline = "middle";
  COUNTRY_LABELS.forEach(([name, lat, lon, sz]) => {
    const xy = latLonToXY(lat, lon, w, h);
    if (xy.x < -20 || xy.x > w + 20 || xy.y < -20 || xy.y > h + 20) return;
    m.font = `${sz}px 'DM Sans', sans-serif`;
    m.fillStyle = "rgba(255,255,255,0.09)";
    const lines = name.split("\n");
    lines.forEach((l, i) => m.fillText(l, xy.x, xy.y + i * (sz + 2) - (lines.length - 1) * (sz + 2) / 2));
  });

  // Sea labels
  SEA_LABELS.forEach(([name, lat, lon, sz]) => {
    const xy = latLonToXY(lat, lon, w, h);
    if (xy.x < -20 || xy.x > w + 20 || xy.y < -20 || xy.y > h + 20) return;
    m.font = `italic ${sz}px 'Cormorant Garamond', serif`;
    m.fillStyle = "rgba(80,110,150,0.18)";
    const lines = name.split("\n");
    lines.forEach((l, i) => m.fillText(l, xy.x, xy.y + i * (sz + 4) - (lines.length - 1) * (sz + 4) / 2));
  });

  // Bottlenecks
  BOTTLENECKS.forEach(([name, lat, lon]) => {
    const xy = latLonToXY(lat, lon, w, h);
    if (xy.x < 0 || xy.x > w || xy.y < 0 || xy.y > h) return;
    m.save(); m.translate(xy.x, xy.y); m.rotate(Math.PI / 4);
    m.strokeStyle = "rgba(232,195,106,0.4)";
    m.lineWidth = 1;
    m.strokeRect(-3, -3, 6, 6);
    m.restore();
    m.beginPath(); m.arc(xy.x, xy.y, 8, 0, Math.PI * 2);
    m.strokeStyle = "rgba(232,195,106,0.12)";
    m.lineWidth = 0.5; m.stroke();
    m.font = "9px 'DM Sans', sans-serif";
    m.fillStyle = "rgba(232,195,106,0.4)";
    m.textAlign = "left";
    m.fillText(name, xy.x + 12, xy.y + 3);
    m.textAlign = "center";
  });

  // Cities
  CITIES.forEach(([name, lat, lon]) => {
    const xy = latLonToXY(lat, lon, w, h);
    if (xy.x < 0 || xy.x > w || xy.y < 0 || xy.y > h) return;
    m.beginPath(); m.arc(xy.x, xy.y, 2, 0, Math.PI * 2);
    m.fillStyle = "rgba(255,255,255,0.15)"; m.fill();
    m.font = "8px 'DM Sans', sans-serif";
    m.fillStyle = "rgba(255,255,255,0.18)";
    m.textAlign = "left";
    m.fillText(name, xy.x + 5, xy.y + 3);
    m.textAlign = "center";
  });

  return mc;
}

// ══════════════════════════════════════
// Component
// ══════════════════════════════════════
export default function MigrationAtlas() {
  const canvasRef = useRef(null);
  const mapCacheRef = useRef(null);
  const geoDataRef = useRef(null);
  const flocksRef = useRef(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const animRef = useRef({ dayOfYear: 60, lastTime: 0 });

  const [showIntro, setShowIntro] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeSpecies, setActiveSpecies] = useState(() => new Set(SPECIES.map((_, i) => i)));
  const [dayOfYear, setDayOfYear] = useState(60);
  const [activeCount, setActiveCount] = useState(0);
  const [tooltip, setTooltip] = useState(null);

  // Derived
  const season = getSeason(dayOfYear);
  const date = dayToDate(dayOfYear);
  const direction = getDirection(dayOfYear);

  // Generate flocks once
  if (!flocksRef.current) {
    flocksRef.current = generateFlocks();
  }

  // Load geo data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(topo => {
        geoDataRef.current = decodeTopojson(topo.objects.countries, topo.arcs, topo.transform);
        mapCacheRef.current = null; // invalidate
      })
      .catch(() => console.warn("Map load failed, using fallback"));
  }, []);

  // Resize handler
  useEffect(() => {
    const onResize = () => { mapCacheRef.current = null; };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const render = (time) => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        mapCacheRef.current = null;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const anim = animRef.current;
      const dt = Math.min((time - anim.lastTime) / 1000, 0.1);
      anim.lastTime = time;

      if (playing) {
        anim.dayOfYear += dt * speed * 8;
        if (anim.dayOfYear > 365) anim.dayOfYear -= 365;
        setDayOfYear(anim.dayOfYear);
      }

      const currentDay = anim.dayOfYear;

      // Map cache
      if (!mapCacheRef.current) {
        mapCacheRef.current = renderMapCache(geoDataRef.current, w, h, dpr);
      }
      ctx.drawImage(mapCacheRef.current, 0, 0, w * dpr, h * dpr, 0, 0, w, h);

      // Flyway paths
      SPECIES.forEach((sp, si) => {
        if (!activeSpecies.has(si)) return;
        const [r, g, b] = hexRGB(sp.color);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.05)`;
        ctx.lineWidth = 1.5;
        sp.routes.forEach(route => {
          ctx.beginPath();
          for (let t = 0; t <= 1; t += 0.02) {
            const p = catmullRom(route.waypoints, t, 0, 0);
            const xy = latLonToXY(p.lat, p.lon, w, h);
            t === 0 ? ctx.moveTo(xy.x, xy.y) : ctx.lineTo(xy.x, xy.y);
          }
          ctx.stroke();
        });
      });

      // Birds
      let count = 0;
      let closest = null;
      let closestDist = 25;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      flocksRef.current.forEach(f => {
        const sp = SPECIES[f.si];
        const day = ((currentDay % 365) + 365) % 365;
        const ms = sp.migrationStart + f.offset;
        const me = sp.migrationEnd + f.offset;
        const rs = sp.returnStart + f.offset;
        const re = sp.returnEnd + f.offset;

        let t, isMig = false;
        if (day >= ms && day <= me) { t = (day - ms) / (me - ms); isMig = true; }
        else if (day >= rs && day <= re) { t = 1 - (day - rs) / (re - rs); isMig = true; }
        else if (day > me && day < rs) { t = 0.95 + Math.sin(day * 0.1 + f.offset) * 0.04; }
        else { t = 0.05 + Math.sin(day * 0.1 + f.offset) * 0.04; }

        t = Math.max(0, Math.min(1, t * f.speedVar));
        const pos = catmullRom(f.waypoints, t, f.lonOff, f.latOff);
        const xy = latLonToXY(pos.lat, pos.lon, w, h);

        const tgt = activeSpecies.has(f.si) ? (isMig ? 0.7 : 0.18) : 0;
        f.opacity += (tgt - f.opacity) * 0.08;
        if (f.opacity < 0.015) return;

        count++;
        const [r, g, b] = hexRGB(sp.color);

        const gs = f.size * (isMig ? 5 : 2.5);
        const grd = ctx.createRadialGradient(xy.x, xy.y, 0, xy.x, xy.y, gs);
        grd.addColorStop(0, `rgba(${r},${g},${b},${f.opacity * 0.5})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(xy.x, xy.y, gs, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = `rgba(${r},${g},${b},${f.opacity})`;
        ctx.beginPath(); ctx.arc(xy.x, xy.y, f.size * 0.5, 0, Math.PI * 2); ctx.fill();

        const dx = mx - xy.x, dy = my - xy.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = { name: sp.name, pos, xy, isMig, t };
        }
      });

      setActiveCount(count);

      if (closest) {
        const status = closest.isMig ? "In flight" : (closest.t > 0.5 ? "Breeding grounds" : "Wintering");
        const lat = closest.pos.lat.toFixed(1);
        const lon = closest.pos.lon.toFixed(1);
        setTooltip({
          x: Math.min(closest.xy.x + 16, w - 230),
          y: Math.min(closest.xy.y - 10, h - 80),
          name: closest.name,
          detail: `${status} · ${Math.abs(lat)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon)}°${lon >= 0 ? "E" : "W"}`,
        });
      } else {
        setTooltip(null);
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, activeSpecies]);

  // Sync slider -> anim ref
  const handleSlider = useCallback((e) => {
    const v = parseFloat(e.target.value);
    animRef.current.dayOfYear = v;
    setDayOfYear(v);
  }, []);

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -100, y: -100 };
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current = { x: -100, y: -100 };
  }, []);

  const toggleSpecies = useCallback((idx) => {
    setActiveSpecies(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        if (next.size > 1) next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const startVisualization = useCallback(() => {
    setShowIntro(false);
    setPlaying(true);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#0a0e14",
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 300,
      color: "#c8cdd5",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "24px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        pointerEvents: "none", zIndex: 10,
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
            fontSize: 24, letterSpacing: 3, textTransform: "uppercase",
            color: "#e0e4ea", lineHeight: 1, margin: 0,
          }}>
            Migration Atlas
          </h1>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4a5060", marginTop: 5 }}>
            European Flyways · Simulated Data
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: "italic",
            fontSize: 36, lineHeight: 1, color: SEASON_COLORS[season],
            transition: "color 0.8s ease",
          }}>
            {season}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#4a5060", marginTop: 3 }}>
            {date.month} {date.day}
          </div>
        </div>
      </div>

      {/* Legend panel */}
      <div style={{
        position: "absolute", bottom: 120, left: 20, zIndex: 10,
      }}>
        <div style={{
          background: "rgba(10,14,20,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
          padding: "16px 18px", minWidth: 170,
        }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 400,
            fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
            color: "#4a5060", marginBottom: 10, margin: "0 0 10px 0",
          }}>
            Species
          </h3>
          {SPECIES.map((sp, i) => (
            <div
              key={sp.name}
              onClick={() => toggleSpecies(i)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 7, cursor: "pointer", fontSize: 12,
                opacity: activeSpecies.has(i) ? 1 : 0.25,
                transition: "opacity 0.3s",
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: sp.color, flexShrink: 0 }} />
              <span>{sp.name}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a5060", marginBottom: 4 }}>
              <span>Active flocks</span>
              <span style={{ color: "#c8cdd5", fontWeight: 400 }}>{activeCount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a5060" }}>
              <span>Direction</span>
              <span style={{ color: "#c8cdd5", fontWeight: 400 }}>{direction}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline controls */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 20px", zIndex: 10 }}>
        <div style={{
          background: "rgba(10,14,20,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
          padding: "14px 20px 10px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <button
              onClick={() => setPlaying(p => !p)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)",
                color: "#c8cdd5", width: 30, height: 30, borderRadius: "50%",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11,
              }}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <div style={{ display: "flex", gap: 5 }}>
              {[0.5, 1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    background: "none",
                    border: `1px solid ${speed === s ? "rgba(232,195,106,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: speed === s ? "#e8c36a" : "#4a5060",
                    padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                    fontSize: 10, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min="0" max="365" step="0.5"
            value={dayOfYear}
            onChange={handleSlider}
            style={{
              width: "100%", WebkitAppearance: "none", appearance: "none",
              height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)",
              outline: "none", cursor: "pointer",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {MONTH_SHORT.map(m => (
              <div key={m} style={{
                fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase",
                color: "#4a5060", width: "calc(100%/12)", textAlign: "center",
              }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute", left: tooltip.x, top: tooltip.y,
          pointerEvents: "none", zIndex: 20,
          background: "rgba(10,14,20,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
          padding: "10px 14px", maxWidth: 220,
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: 15, color: "#e0e4ea", marginBottom: 4,
          }}>
            {tooltip.name}
          </div>
          <div style={{ color: "#4a5060", fontSize: 11, lineHeight: 1.5 }}>
            {tooltip.detail}
          </div>
        </div>
      )}

      {/* Intro overlay */}
      {showIntro && (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "rgba(10,14,20,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 440, padding: 20 }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
              fontSize: 34, color: "#e0e4ea", marginBottom: 14, letterSpacing: 2,
            }}>
              Migration Atlas
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: "#4a5060", marginBottom: 24 }}>
              Watch birds flow across Europe's ancient flyways. Each glowing dot is a flock
              following routes carved over millennia — north in spring, south in autumn.
              <br /><br />
              Scrub through the year, click species to filter, hover to explore.
            </p>
            <button
              onClick={startVisualization}
              style={{
                background: "none", border: "1px solid #e8c36a", color: "#e8c36a",
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2,
                textTransform: "uppercase", padding: "10px 32px", borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Begin
            </button>
          </div>
        </div>
      )}

      {/* Custom slider thumb style */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #e8c36a;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(232,195,106,0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #e8c36a;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(232,195,106,0.4);
        }
      `}</style>
    </div>
  );
}
