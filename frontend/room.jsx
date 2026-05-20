/* global React */
const { useMemo } = React;

// ============================================================
// COZY ROOM — wide layout (1800×1000)
// Nightstand in left corner, bed flush against back wall,
// big window centered, desk flush against wall on right with
// HALF-HEIGHT monitor showing a mini desktop.
// ============================================================

// -- character --
function Sleeper({ visible }) {
  if (!visible) return null;
  // Simple dome-shaped head poking out from under the covers,
  // black hair cap on top.
  return (
    <g className="breath">
      {/* face / back of head */}
      <rect x="68" y="540" width="56" height="34" fill="#b07d5e" />
      <rect x="64" y="546" width="4"  height="22" fill="#b07d5e" />
      <rect x="124" y="546" width="4" height="22" fill="#b07d5e" />
      {/* black hair cap — only covers the left side of the top now */}
      <rect x="68" y="540" width="30" height="14" fill="#0e0a08" />
      <rect x="72" y="536" width="22" height="4"  fill="#0e0a08" />
      {/* extended hair down the left side of the head */}
      <rect x="58" y="546" width="10" height="22" fill="#0e0a08" />
      <rect x="62" y="540" width="6"  height="6"  fill="#0e0a08" />
      {/* small closed eye */}
      <rect x="92" y="560" width="8" height="2" fill="#0e0a08" />
      {/* small mouth */}
      <rect x="94" y="568" width="6" height="2" fill="#3a1818" />
      <text className="sleep-z z1" x="110" y="515" fontFamily="'Press Start 2P', monospace" fontSize="14" fill="#fff">z</text>
      <text className="sleep-z z2" x="110" y="515" fontFamily="'Press Start 2P', monospace" fontSize="14" fill="#fff">z</text>
    </g>
  );
}

// Chair is always visible regardless of scene; lives in its own component
// so the seat persists when the worker is away.
function Chair() {
  return (
    <g transform="translate(-19 -106)">
      {/* chair back */}
      <rect x="1404" y="508" width="100" height="170" fill="#2a2118" />
      <rect x="1404" y="508" width="100" height="6" fill="#3a2e22" />
      <rect x="1398" y="638" width="112" height="14" fill="#1a140e" />
      <rect x="1446" y="652" width="14" height="44" fill="#2a2118" />
      <rect x="1414" y="696" width="78" height="10" fill="#2a2118" />
    </g>
  );
}

function Worker({ visible }) {
  if (!visible) return null;
  // head is exactly centered to the monitor
  return (
    <g transform="translate(-19 -106)">
      {/* body (hoodie) — narrowed to fit within the chair back */}
      <rect x="1406" y="528" width="96" height="120" fill="#2f4d6e" />
      <rect x="1406" y="528" width="96" height="8" fill="#1f3a55" />
      <rect x="1406" y="640" width="96" height="8" fill="#1f3a55" />
      {/* neck — ~1/2 head width, centered */}
      <rect x="1442" y="500" width="24" height="28" fill="#8a5a38" />
      <rect x="1442" y="500" width="24" height="3" fill="#6a4228" />
      {/* back of head — black hair down to the ear-bottom line */}
      <rect x="1429" y="440" width="50" height="44" fill="#0e0a08" />
      {/* exposed skin below the main hairline */}
      <rect x="1429" y="484" width="50" height="16" fill="#8a5a38" />
      {/* centered tuft below the ears — 2/3 width of the hair above */}
      <rect x="1437" y="484" width="34" height="9" fill="#0e0a08" />
      {/* hair extending past the sides, above and below the ears */}
      <rect x="1421" y="450" width="8" height="18" fill="#0e0a08" />
      <rect x="1479" y="450" width="8" height="18" fill="#0e0a08" />
      {/* ears — skin, poking through gaps in the side hair */}
      <rect x="1423" y="468" width="6" height="10" fill="#8a5a38" />
      <rect x="1479" y="468" width="6" height="10" fill="#8a5a38" />
      {/* hands on keys — animated up/down (rendered first so sleeves cover them) */}
      <g className="typing-arm-l">
        <rect x="1350" y="546" width="22" height="16" fill="#8a5a38" />
        <rect x="1350" y="546" width="22" height="3" fill="#6a4228" />
      </g>
      <g className="typing-arm-r">
        <rect x="1536" y="546" width="22" height="16" fill="#8a5a38" />
        <rect x="1536" y="546" width="22" height="3" fill="#6a4228" />
      </g>
      {/* sleeves (arms) — rendered after hands so they overlap from behind */}
      <rect x="1366" y="544" width="40" height="20" fill="#2f4d6e" />
      <rect x="1502" y="544" width="40" height="20" fill="#2f4d6e" />
    </g>
  );
}

// ---------- time-of-day helpers ----------
function _hex(h) { return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
function _mix(c1, c2, f) {
  const a = _hex(c1), b = _hex(c2);
  const r = Math.round(a[0] + (b[0]-a[0])*f);
  const g = Math.round(a[1] + (b[1]-a[1])*f);
  const bl = Math.round(a[2] + (b[2]-a[2])*f);
  return `rgb(${r},${g},${bl})`;
}
function skyAt(t) {
  // t = hours float 0..24. Returns {top, mid, bot} colors.
  const stops = [
    [0,    ["#050a1c", "#08122a", "#0a1730"]], // deep night
    [4.5,  ["#0a1a3a", "#1a2a4c", "#2a2a48"]], // pre-dawn (sky getting lighter at horizon)
    [5.5,  ["#2a2350", "#5a3a6a", "#a06a70"]], // dawn purple/pink
    [6.5,  ["#ff8a5c", "#ffb47a", "#ffd9a8"]], // sunrise orange
    [7.5,  ["#8fc6e5", "#bbe0f0", "#dceef5"]], // morning
    [12,   ["#5fb6e8", "#8fcaea", "#bee7f5"]], // midday
    [16.5, ["#7fc0e0", "#cfe0ea", "#ffd6a8"]], // afternoon -> golden
    [18.5, ["#ff7a5c", "#ff9a6a", "#ffc890"]], // sunset orange
    [19.5, ["#4a3270", "#8a4a72", "#c06a78"]], // dusk purple/pink
    [20.5, ["#1a2150", "#1a2348", "#2a2a4a"]], // nightfall
    [22,   ["#0a1340", "#0a1730", "#0e1a36"]],
    [24,   ["#050a1c", "#08122a", "#0a1730"]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i+1][0]) {
      const span = stops[i+1][0] - stops[i][0];
      const f = span === 0 ? 0 : (t - stops[i][0]) / span;
      return {
        top: _mix(stops[i][1][0], stops[i+1][1][0], f),
        mid: _mix(stops[i][1][1], stops[i+1][1][1], f),
        bot: _mix(stops[i][1][2], stops[i+1][1][2], f),
      };
    }
  }
  return { top: stops[0][1][0], mid: stops[0][1][1], bot: stops[0][1][2] };
}
function sunArc(t) {
  // Sun's full trajectory spans 4.5..20.5 (16h), with edges offscreen.
  // Visible window roughly 5..20.
  if (t < 4.5 || t > 20.5) return null;
  const frac = (t - 4.5) / 16;
  return { frac };
}
function moonArc(t) {
  // Moon's full trajectory spans 18..7 (next day), 13h.
  let frac;
  if (t >= 18) frac = (t - 18) / 13;
  else if (t <= 7) frac = (t + 6) / 13;
  else return null;
  return { frac };
}
function nightAmount(t) {
  // 1 = fully dark, 0 = fully bright. Smooth transitions at dawn/dusk.
  // Easing: morning brightens slowly until ~8 AM, then steady through the day.
  const ease = (x) => x * x * (3 - 2 * x); // smoothstep
  if (t <= 4.5) return 1;
  if (t < 8.0) return 1 - ease((t - 4.5) / 3.5);   // 4.5..8 -> 1..0 (eased)
  if (t <= 18) return 0;
  if (t < 20.5) return ease((t - 18) / 2.5);        // 18..20.5 -> 0..1
  return 1;
}

function shootingStar(t, w, h, night) {
  // Shooting stars only happen between 11 PM and 3 AM.
  const hour = ((t % 24) + 24) % 24;
  if (!(hour >= 23 || hour < 3)) return null;
  if (night < 0.4) return null;
  // One streak every 5 sim-minutes (1/12 hour), but visible only for a brief flash.
  const slot = Math.floor(t * 12);
  const phase = (t * 12) - slot; // 0..1 of the 5-minute slot
  const VIS = 0.025; // ~7.5 sim-seconds of streak per slot
  if (phase > VIS) return null;
  const rand = (s) => { const v = Math.sin(s * 9301 + 49297) * 233280; return v - Math.floor(v); };
  const startX = 20 + rand(slot) * (w - 160);
  const startY = 20 + rand(slot + 7) * (h * 0.45);
  const dx = 140 + rand(slot + 13) * 120;
  const dy = 80 + rand(slot + 19) * 60;
  const p = phase / VIS;
  return {
    x1: startX, y1: startY,
    x2: startX + dx * p, y2: startY + dy * p,
    opacity: Math.sin(p * Math.PI) * Math.min(1, (night - 0.4) / 0.4),
  };
}

// ---------- window contents ----------
function WindowView({ time, x, y, w, h }) {
  const t = time.getHours() + time.getMinutes()/60 + time.getSeconds()/3600;
  const sky = skyAt(t);
  const sun = sunArc(t);
  const moon = moonArc(t);
  const night = nightAmount(t);

  // Sun/moon positions: parabolic arc that extends beyond the window frame on both sides,
  // so the bodies slide on from the left and off to the right.
  const arcX = (frac) => x - 70 + frac * (w + 100);
  const arcY = (frac) => y + 200 - Math.sin(Math.max(0, Math.min(1, frac)) * Math.PI) * 170;
  const clipId = `winclip-${x}-${y}-${w}-${h}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      {/* sky gradient via stacked rects */}
      <rect x={x} y={y} width={w} height={h} fill={sky.bot} />
      <rect x={x} y={y} width={w} height={Math.round(h*0.66)} fill={sky.mid} />
      <rect x={x} y={y} width={w} height={Math.round(h*0.33)} fill={sky.top} />

      {/* stars (visible at night, fade with night amount) */}
      {night > 0.15 && [
        [40, 30], [80, 80], [140, 50], [200, 110], [240, 40],
        [60, 160], [110, 200], [180, 230], [330, 150], [370, 90],
        [380, 200], [50, 240], [220, 260], [320, 230], [120, 130],
        [260, 70], [400, 50], [100, 280], [350, 280], [430, 170],
        [410, 240], [160, 290], [70, 320], [280, 310], [400, 320],
      ].filter(([dx, dy]) => dx < w - 8 && dy < h - 60).map(([dx, dy], i) => {
        const cls = "star" + (i % 4 === 0 ? "" : i % 4 === 1 ? " s2" : i % 4 === 2 ? " s3" : " s4");
        const sz = i % 5 === 0 ? 4 : 3;
        return <rect key={i} className={cls} x={x + dx} y={y + dy} width={sz} height={sz} fill="#fff" opacity={Math.min(1, (night - 0.15) / 0.7)} />;
      })}

      {/* shooting star — one every 5 sim minutes at night */}
      {(() => {
        const s = shootingStar(t, w, h, night);
        if (!s) return null;
        return (
          <g clipPath={`url(#${clipId})`} opacity={s.opacity}>
            <line x1={x + s.x1} y1={y + s.y1} x2={x + s.x2} y2={y + s.y2} stroke="#fff" strokeWidth="2" opacity="0.85" />
            <line x1={x + s.x1} y1={y + s.y1} x2={x + (s.x1 + s.x2)/2} y2={y + (s.y1 + s.y2)/2} stroke="#cfe8ff" strokeWidth="4" opacity="0.35" />
            <rect x={x + s.x2 - 2} y={y + s.y2 - 2} width="4" height="4" fill="#fff" style={{ filter: "drop-shadow(0 0 6px #cfe8ff) drop-shadow(0 0 12px #cfe8ff)" }} />
          </g>
        );
      })()}

      {/* moon */}
      {moon && (() => {
        const mx = arcX(moon.frac), my = arcY(moon.frac);
        return (
          <g clipPath={`url(#${clipId})`}>
            <rect x={mx} y={my} width="40" height="40" fill="#f0e6c0" />
            <rect x={mx - 6} y={my + 6} width="48" height="28" fill="#f0e6c0" />
            <rect x={mx + 6} y={my - 6} width="28" height="52" fill="#f0e6c0" />
            <rect x={mx + 16} y={my} width="24" height="40" fill={sky.top} />
          </g>
        );
      })()}

      {/* sun */}
      {sun && (() => {
        const sx = arcX(sun.frac), sy = arcY(sun.frac);
        // sun color: orange near horizon, yellow when high
        const high = Math.sin(Math.max(0, Math.min(1, sun.frac)) * Math.PI);
        const sunCore = _mix("#ff7a3a", "#ffd000", high);
        const sunRim = _mix("#ffb070", "#ffe14a", high);
        return (
          <g clipPath={`url(#${clipId})`} style={{ filter: `drop-shadow(0 0 12px ${sunRim})` }}>
            <rect x={sx} y={sy} width="44" height="44" fill={sunRim} />
            <rect x={sx - 4} y={sy + 6} width="52" height="32" fill={sunRim} />
            <rect x={sx + 6} y={sy - 4} width="32" height="52" fill={sunRim} />
            <rect x={sx + 10} y={sy + 4} width="24" height="36" fill={sunCore} />
          </g>
        );
      })()}

      {/* clouds (drift with simulated time, loop in from left & off to right) */}
      {(() => {
        const cloudDefs = [
          { yOff: 130, w1: 60, w2: 44, period: 10, phase: 0.10 },
          { yOff: 200, w1: 80, w2: 56, period: 14, phase: 0.55 },
          { yOff: 80,  w1: 50, w2: 36, period: 12, phase: 0.30 },
          { yOff: 250, w1: 46, w2: 30, period: 16, phase: 0.75 },
        ];
        const cloudOpacity = 0.85 - night * 0.75;
        if (cloudOpacity <= 0.05) return null;
        return (
          <g clipPath={`url(#${clipId})`} opacity={cloudOpacity}>
            {cloudDefs.map((c, i) => {
              const frac = ((t / c.period + c.phase) % 1 + 1) % 1; // 0..1 looping
              const cx = x - 100 + frac * (w + 200);
              const cy = y + c.yOff;
              return (
                <g key={i} fill="#fff">
                  <rect x={cx} y={cy} width={c.w1} height="12" />
                  <rect x={cx + 8} y={cy - 8} width={c.w2} height="12" />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* distant city silhouette (always present, darker at night) */}
      <rect x={x} y={y + h - 50} width={w} height="50" fill={night > 0.5 ? "#0a1020" : "#3a5a3a"} />
      <rect x={x + 60} y={y + h - 80} width="40" height="30" fill={night > 0.5 ? "#0e1a30" : "#2a4a2a"} />
      <rect x={x + 110} y={y + h - 100} width="30" height="50" fill={night > 0.5 ? "#0e1a30" : "#2a4a2a"} />
      <rect x={x + 150} y={y + h - 75} width="60" height="25" fill={night > 0.5 ? "#0e1a30" : "#2a4a2a"} />
      <rect x={x + 220} y={y + h - 90} width="36" height="40" fill={night > 0.5 ? "#0e1a30" : "#2a4a2a"} />
      <rect x={x + 280} y={y + h - 70} width="50" height="20" fill={night > 0.5 ? "#0e1a30" : "#2a4a2a"} />
      <rect x={x + 340} y={y + h - 95} width="44" height="45" fill={night > 0.5 ? "#0e1a30" : "#2a4a2a"} />
      {/* lit city windows fade in at night */}
      {night > 0.3 && (
        <g opacity={Math.min(1, (night - 0.3) / 0.5)}>
          <rect x={x + 124} y={y + h - 88} width="3" height="3" fill="#ffd966" />
          <rect x={x + 130} y={y + h - 80} width="3" height="3" fill="#ffd966" />
          <rect x={x + 232} y={y + h - 78} width="3" height="3" fill="#ffd966" />
          <rect x={x + 354} y={y + h - 80} width="3" height="3" fill="#ffd966" />
        </g>
      )}
    </g>
  );
}

// ---------- digital wall clock ----------
function DigitalClock({ time, x = 395, y = 160, mealLabel = null, showTime = false, onToggle }) {
  const hours = time.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hh = String(hours % 12 || 12).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const displayMeal = mealLabel && !showTime;
  const label = displayMeal ? mealLabel : `${hh}:${mm} ${ampm}`;
  const fontSize = displayMeal ? 46 : 42;

  return (
    <g style={{ cursor: mealLabel ? "pointer" : "default" }} onClick={mealLabel ? onToggle : undefined}>
      <rect x={x} y={y} width="148" height="80" fill="#1a1a1a" />
      <rect x={x} y={y} width="148" height="5" fill="#2c2c2c" />
      <rect x={x} y={y + 75} width="148" height="5" fill="#0a0a0a" />
      <rect x={x + 8} y={y + 8} width="132" height="64" fill="#240a0a" />
      <text
        x={x + 74} y={y + 58}
        fontFamily="'VT323', monospace"
        fontSize={fontSize}
        fill="#ff5050"
        textAnchor="middle"
        style={{ filter: "drop-shadow(0 0 0.6px #ff8080)", textRendering: "geometricPrecision" }}
      >
        {label}
      </text>
      <rect x={x + 72} y={y - 6} width="4" height="6" fill="#777" />
    </g>
  );
}

// ---------- pixel desk lamp (gooseneck/hooded — sits on nightstand) ----------
// FIX: Removed duplicate state. This is now a "dumb" component that just listens to the Room.
function DeskLamp({ on, onClick }) {
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick}>
      {/* base — heavy disc */}
      <rect x="118" y="472" width="40" height="10" fill="#1a140e" />
      <rect x="122" y="466" width="32" height="6" fill="#2a2118" />
      <rect x="130" y="462" width="16" height="4" fill="#3a2e22" />
      
      {/* stem — vertical */}
      <rect x="136" y="378" width="4" height="84" fill="#1a140e" />
      
      {/* bend — curved elbow */}
      <rect x="136" y="374" width="14" height="4" fill="#1a140e" />
      <rect x="148" y="374" width="4" height="6" fill="#1a140e" />
      <rect x="148" y="378" width="6" height="4" fill="#1a140e" />
      
      {/* short neck angled down-right */}
      <polygon points="148,378 152,378 158,388 152,390" fill="#1a140e" />
      
      {/* hood — angled down and right */}
      <polygon points="148,388 162,382 182,404 160,416" fill="#1a140e" />
      {/* hood top rim */}
      <polygon points="148,388 162,382 160,386 150,390" fill="#3a2e22" />
      {/* hood bottom opening */}
      <polygon points="160,416 182,404 179,402 159,413" fill="#0a0a0a" />

      {/* Inner bulb filament (stays here to sit physically inside the hood) */}
      {on && (
        <ellipse cx="171" cy="410" rx="6" ry="3" transform="rotate(-40 171 410)" fill="#ffffff" />
      )}
    </g>
  );
}

// ---------- ROOM ----------
function Room({ scene, time, lampOn, monitorOn, snoozed, onPhoneClick, onMonitorClick, onLampClick }) {
  const isNight = scene === "night";
  const isAlarm = scene === "alarm";
  const isWork = scene === "work";
  const isLunch = scene === "lunch";
  const isDinner = scene === "dinner";
  const mealLabel = isLunch ? "LUNCH" : isDinner ? "DINNER" : null;
  const [showTimeOverride, setShowTimeOverride] = React.useState(false);
  // when meal scene changes, reset the toggle so we default to showing the meal label
  React.useEffect(() => { setShowTimeOverride(false); }, [mealLabel]);

  const [localLamp, setLocalLamp] = React.useState(lampOn);
  React.useEffect(() => { setLocalLamp(lampOn); }, [lampOn]);

  const handleLampToggle = (e) => {
    setLocalLamp(!localLamp);
    if (onLampClick) onLampClick(e);
  };

  const winX = 600, winY = 90, winW = 480, winH = 380;

  return (
    <svg className="room-svg" viewBox="0 0 1800 868" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* FIX: ALL gradients are now permanently defined here at the top so the browser never loses them */}
        <linearGradient id="lampBeam" x1="170" y1="410" x2="320" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="15%" stopColor="#ffee88" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#ffcc00" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffaa00" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd58a" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#ffb84d" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#ff9430" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ff9430" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampHotspot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff5d8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff5d8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="monGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#cccccc" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#cccccc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="floorGrain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b7b50" />
          <stop offset="100%" stopColor="#6e5635" />
        </linearGradient>
        <pattern id="floorBoards" x="0" y="0" width="180" height="44" patternUnits="userSpaceOnUse">
          <rect width="180" height="44" fill="url(#floorGrain)" />
          <rect x="0" y="0" width="180" height="2" fill="#5a4528" opacity="0.55" />
          <rect x="0" y="42" width="180" height="2" fill="#5a4528" opacity="0.55" />
          <rect x="86" y="0" width="2" height="44" fill="#5a4528" opacity="0.45" />
        </pattern>
        <pattern id="wallBlocks" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
          <rect width="120" height="60" fill="var(--wall)" />
          <rect x="0" y="0" width="120" height="1" fill="#000" opacity="0.06" />
          <rect x="0" y="59" width="120" height="1" fill="#000" opacity="0.06" />
          <rect x="0" y="0" width="1" height="60" fill="#000" opacity="0.05" />
        </pattern>
      </defs>

      {/* ===== WALL ===== */}
      <rect x="0" y="0" width="1800" height="560" fill="url(#wallBlocks)" />
      <rect x="0" y="548" width="1800" height="14" fill="var(--wall-trim)" />
      <rect x="0" y="546" width="1800" height="2" fill="#000" opacity="0.15" />

      {/* ===== FLOOR ===== */}
      <rect x="0" y="560" width="1800" height="440" fill="url(#floorBoards)" />
      <rect x="0" y="560" width="1800" height="6" fill="#a48560" opacity="0.4" />

      {/* rug — shifted up one more floor-plank band (now y=604 to y=824) */}
      <g>
        <ellipse cx="885" cy="788" rx="430" ry="18" fill="#000" opacity="0.1" />
        {/* base */}
        <rect x="460" y="604" width="850" height="176" fill="#7a3838" />
        {/* outer light & dark trims */}
        <rect x="460" y="604" width="850" height="6" fill="#9a4848" />
        <rect x="460" y="774" width="850" height="6" fill="#5a2828" />
        <rect x="460" y="604" width="6" height="176" fill="#9a4848" opacity="0.7" />
        <rect x="1304" y="604" width="6" height="176" fill="#5a2828" opacity="0.7" />
        {/* pattern wrapped in a vertical-compress transform so it reads as angling
            back toward the window wall (away from the viewer). Rug base, outer trims,
            and shadow ellipse are UNCHANGED — only the gold pattern is reoriented. */}
        <g transform="matrix(1 0 0 0.82 0 107)">
          {/* inner double-border (gold) */}
          <rect x="478" y="620" width="814" height="2" fill="#c08b3e" opacity="0.75" />
          <rect x="478" y="806" width="814" height="2" fill="#c08b3e" opacity="0.75" />
          <rect x="478" y="620" width="2" height="188" fill="#c08b3e" opacity="0.65" />
          <rect x="1290" y="620" width="2" height="188" fill="#c08b3e" opacity="0.65" />
          <rect x="486" y="628" width="798" height="1" fill="#c08b3e" opacity="0.35" />
          <rect x="486" y="799" width="798" height="1" fill="#c08b3e" opacity="0.35" />
          {/* central field accent stripes (top + bottom of medallion) */}
          <rect x="500" y="648" width="770" height="2" fill="#c08b3e" opacity="0.45" />
          <rect x="500" y="778" width="770" height="2" fill="#c08b3e" opacity="0.45" />
          {/* centered diamond medallion */}
          <g transform="translate(885 714)">
            <rect x="-60" y="-2" width="120" height="2" fill="#c08b3e" opacity="0.5" />
            <rect x="-60" y="0" width="120" height="2" fill="#c08b3e" opacity="0.5" />
            <polygon points="0,-26 26,0 0,26 -26,0" fill="none" stroke="#c08b3e" strokeWidth="2" opacity="0.6" />
            <rect x="-3" y="-3" width="6" height="6" fill="#c08b3e" opacity="0.7" />
          </g>
          {/* corner anchors */}
          <rect x="478" y="620" width="6" height="6" fill="#c08b3e" opacity="0.55" />
          <rect x="1286" y="620" width="6" height="6" fill="#c08b3e" opacity="0.55" />
          <rect x="478" y="802" width="6" height="6" fill="#c08b3e" opacity="0.55" />
          <rect x="1286" y="802" width="6" height="6" fill="#c08b3e" opacity="0.55" />
        </g>
      </g>

      {/* ===== MAP POSTER ===== */}
      <g>
        <rect x="200" y="80" width="160" height="200" fill="#f6efde" />
        <rect x="200" y="80" width="160" height="6" fill="#5a3a22" />
        <rect x="200" y="274" width="160" height="6" fill="#5a3a22" />
        <rect x="200" y="80" width="6" height="200" fill="#5a3a22" />
        <rect x="354" y="80" width="6" height="200" fill="#5a3a22" />
        <rect x="220" y="120" width="50" height="20" fill="#3a2614" opacity="0.7" />
        <rect x="240" y="140" width="80" height="40" fill="#3a2614" opacity="0.7" />
        <rect x="260" y="180" width="60" height="30" fill="#3a2614" opacity="0.7" />
        <rect x="226" y="220" width="40" height="20" fill="#3a2614" opacity="0.7" />
        <rect x="300" y="230" width="30" height="20" fill="#3a2614" opacity="0.7" />
      </g>

      {/* ===== NIGHTSTAND (behind bed) ===== */}
      <g>
        <ellipse cx="138" cy="610" rx="58" ry="8" fill="#000" opacity="0.2" />
        <rect x="94" y="480" width="90" height="120" fill="#6a4a30" />
        <rect x="94" y="480" width="90" height="10" fill="#8a6a4a" />
        <rect x="94" y="480" width="6" height="120" fill="#3a2614" />
        <rect x="178" y="480" width="6" height="120" fill="#3a2614" />
        <rect x="94" y="590" width="90" height="10" fill="#3a2614" />
        <rect x="102" y="504" width="74" height="40" fill="#5a3a22" />
        <rect x="102" y="504" width="74" height="3" fill="#7a5a3a" />
        <rect x="96" y="600" width="10" height="14" fill="#3a2614" />
        <rect x="172" y="600" width="10" height="14" fill="#3a2614" />

        <g className={isAlarm && !snoozed ? "phone-shaking" : "phone-still"} onClick={isAlarm ? onPhoneClick : undefined} style={{ cursor: isAlarm ? "pointer" : "default" }}>
          <rect x="96" y="466" width="32" height="14" fill="#0a0a0a" />
          <rect x="98" y="468" width="28" height="10" fill={isAlarm && !snoozed ? "#ff5f5f" : "#1a1a1a"} />
          <rect x="96" y="466" width="32" height="2" fill="#2c2c2c" />
        </g>

        {/* Lamp click successfully bound here */}
        <g transform="translate(19 0)">
          <DeskLamp on={localLamp} onClick={handleLampToggle} />
        </g>
        
      </g>

      {/* ===== BED (base — rendered before sleeper so blanket can go on top) ===== */}
      <g>
        <ellipse cx="272" cy="800" rx="320" ry="14" fill="#000" opacity="0.18" />
        <polygon points="0,420 38,420 48,408 0,408" fill="#5a3a22" />
        <polygon points="38,420 48,408 48,748 38,760" fill="#2a1810" />
        <rect x="0" y="420" width="38" height="340" fill="#3a2614" />
        <rect x="38" y="560" width="500" height="160" fill="#f0e6c8" />
        <rect x="38" y="560" width="500" height="6" fill="#fff8e0" />
        <rect x="38" y="714" width="500" height="6" fill="#c4b594" />
        <polygon points="38,560 538,560 528,548 48,548" fill="#fff8e0" />
        <rect x="52" y="540" width="160" height="42" fill="#fff" />
        <rect x="52" y="540" width="160" height="6" fill="#e8e0c4" />
        <rect x="38" y="720" width="20" height="40" fill="#3a2614" />
        <rect x="518" y="720" width="20" height="36" fill="#3a2614" />
      </g>
      <Sleeper visible={isNight || isAlarm} />
      {/* blanket rendered AFTER sleeper so it layers on top of the head */}
      <g>
        <rect x="124" y="534" width="414" height="186" fill="#5a7a3a" />
        <rect x="124" y="534" width="414" height="10" fill="#7a9a4a" />
        <rect x="124" y="710" width="414" height="10" fill="#3a5a22" />
        <rect x="144" y="586" width="374" height="2" fill="#7a9a4a" opacity="0.6" />
        <rect x="144" y="630" width="374" height="2" fill="#7a9a4a" opacity="0.6" />
        <rect x="144" y="678" width="374" height="2" fill="#7a9a4a" opacity="0.6" />
        {(isNight || isAlarm) && <rect x="124" y="522" width="316" height="20" fill="#5a7a3a" />}
      </g>

      {/* ===== WINDOW ===== */}
      <g>
        <rect x={winX - 16} y={winY - 16} width={winW + 32} height={winH + 32} fill="#3a2614" />
        <rect x={winX} y={winY} width={winW} height={winH} fill="#1a0e08" />
        <rect x={winX - 22} y={winY + winH} width={winW + 44} height="18" fill="#3a2614" />
        <rect x={winX - 22} y={winY + winH + 16} width={winW + 44} height="6" fill="#2a1810" />
        <WindowView time={time} x={winX} y={winY} w={winW} h={winH} />
        <rect x={winX + winW / 3 - 3} y={winY} width="6" height={winH} fill="#3a2614" />
        <rect x={winX + (2 * winW) / 3 - 3} y={winY} width="6" height={winH} fill="#3a2614" />
        <rect x={winX} y={winY + winH / 2 - 3} width={winW} height="6" fill="#3a2614" />
        <rect x={winX - 36} y={winY - 26} width={winW + 72} height="6" fill="#5a3a22" />
        <rect x={winX - 40} y={winY - 30} width="10" height="14" fill="#5a3a22" />
        <rect x={winX + winW + 30} y={winY - 30} width="10" height="14" fill="#5a3a22" />
      </g>

      {/* ===== SMALL PICTURE FRAME ===== */}
      <g>
        <rect x="1140" y="200" width="100" height="74" fill="#3a2614" />
        <rect x="1148" y="208" width="84" height="58" fill="#f6efde" />
        <polygon points="1158,258 1178,230 1194,242 1208,218 1224,258" fill="#3a6088" />
        <rect x="1172" y="220" width="4" height="4" fill="#ffd000" />
      </g>

      {/* ===== DESK ===== */}
      <g transform="translate(-8 0)">
        <rect x="1520" y="440" width="160" height="160" fill="#5a3a22" />
        <rect x="1520" y="440" width="160" height="6" fill="#7a5a3a" />
        <rect x="1520" y="440" width="6" height="160" fill="#3a2614" />
        <rect x="1674" y="440" width="6" height="160" fill="#3a2614" />
        <rect x="1520" y="594" width="160" height="6" fill="#3a2614" />
        <rect x="1532" y="458" width="138" height="58" fill="#6a4a30" />
        <rect x="1532" y="458" width="138" height="3" fill="#8a6a4a" />
        <rect x="1590" y="482" width="22" height="6" fill="#d4a83a" />
        <rect x="1532" y="526" width="138" height="58" fill="#6a4a30" />
        <rect x="1532" y="526" width="138" height="3" fill="#8a6a4a" />
        <rect x="1590" y="550" width="22" height="6" fill="#d4a83a" />
        <rect x="1260" y="432" width="420" height="14" fill="#9a7a4a" />
        <rect x="1260" y="446" width="420" height="6" fill="#7a5a3a" />
        <rect x="1260" y="452" width="420" height="4" fill="#3a2614" />
        <rect x="1272" y="456" width="14" height="140" fill="#3a2614" />
        <rect x="1272" y="594" width="14" height="6" fill="#2a1810" />

        {/* Monitor - Always On */}
        <g className="monitor-on" onClick={onMonitorClick} style={{ cursor: "pointer" }}>
          <rect x="1428" y="412" width="60" height="20" fill="#1a1a1a" />
          <rect x="1416" y="422" width="84" height="10" fill="#0a0a0a" />
          <rect x="1450" y="392" width="16" height="22" fill="#1a1a1a" />
          <rect x="1320" y="252" width="296" height="146" fill="#0a0a0a" />
          <rect x="1320" y="252" width="296" height="8" fill="#2c2c2c" />
          <rect x="1320" y="394" width="296" height="4" fill="#1a1a1a" />
          {/* Screen background is permanently dark blue-grey */}
          <rect x="1328" y="260" width="280" height="130" fill="#1a1b1e" />
          {/* MiniDesktop renders unconditionally */}
          <MiniDesktop time={time} />
          {/* Power LED is permanently white */}
          <rect x="1602" y="392" width="4" height="4" fill="#ffffff" />
        </g>
        
        <rect x="1325" y="437" width="170" height="10" fill="#1a1a1a" />
        <rect x="1325" y="437" width="170" height="2" fill="#3a3a3a" />
        {[0, 1].map((r) => <rect key={r} x="1325" y={437 + r * 3} width="170" height="2" fill="#5a5a5a" opacity="0.7" />)}
        
        <ellipse cx="1535" cy="439" rx="12" ry="7" fill="#1a1a1a" />
        <rect x="1535" y="434" width="2" height="5" fill="#666" />

        <g>
          <rect x="1281" y="398" width="30" height="38" fill="#c25d4a" />
          <rect x="1281" y="398" width="30" height="6" fill="#3a2118" />
          <rect x="1285" y="404" width="22" height="6" fill="#5a2a1a" />
          <rect x="1311" y="406" width="6" height="20" fill="#c25d4a" />
        </g>

        {/* PC Tower - Always On */}
        <g>
          <rect x="1310" y="480" width="58" height="120" fill="#2c2c2c" />
          <rect x="1310" y="480" width="58" height="4" fill="#4a4a4a" />
          <rect x="1320" y="494" width="38" height="3" fill="#1a1a1a" />
          <rect x="1320" y="502" width="28" height="3" fill="#1a1a1a" />
          {/* Opacity is permanently 1 */}
          <rect x="1356" y="592" width="6" height="6" fill="#ffffff" opacity={1} />
        </g>
      </g>



      {/* ===== BOOKSHELF ===== */}
      <g>
        <rect x="1680" y="200" width="120" height="400" fill="#5a3a22" />
        <rect x="1680" y="200" width="120" height="10" fill="#3a2614" />
        <rect x="1680" y="200" width="10" height="400" fill="#3a2614" />
        {[244, 320, 396, 472].map((y, i) => (
          <g key={y}>
            <rect x="1690" y={y + 56} width="108" height="6" fill="#3a2614" />
            <BookRow y={y} idx={i} />
          </g>
        ))}
        <rect x="1712" y="180" width="40" height="20" fill="#4a7a4a" />
        <rect x="1710" y="178" width="44" height="4" fill="#3a5a3a" />
        <rect x="1768" y="160" width="14" height="40" fill="#c25d4a" />
      </g>

      {/* ===== POTTED PLANT ===== */}
      <g>
        <ellipse cx="1690" cy="900" rx="44" ry="6" fill="#000" opacity="0.25" />
        <rect x="1660" y="830" width="60" height="70" fill="#3a4a3a" />
        <rect x="1660" y="830" width="60" height="8" fill="#5a6a5a" />
        <rect x="1660" y="892" width="60" height="8" fill="#1a2a1a" />
        <ellipse cx="1690" cy="816" rx="40" ry="32" fill="#3a6a3a" />
        <ellipse cx="1676" cy="800" rx="18" ry="16" fill="#4a7a4a" />
        <ellipse cx="1704" cy="804" rx="20" ry="18" fill="#4a7a4a" />
        <ellipse cx="1690" cy="788" rx="14" ry="12" fill="#5a8a4a" />
        <rect x="1688" y="790" width="2" height="32" fill="#2a4a2a" opacity="0.7" />
      </g>

      {/* ===== INTERIOR BRIGHTNESS =====
          Driven entirely by the window time (simulated). Scene state no longer
          forces a fixed darkness — the room dims/brightens with the sky. */}
      {(() => {
        const tHr = time.getHours() + time.getMinutes()/60 + time.getSeconds()/3600;
        const overlayOpacity = nightAmount(tHr) * 0.55;
        return (
          <rect x="0" y="0" width="1800" height="1000" fill="#0a1c36" opacity={overlayOpacity} style={{ mixBlendMode: "multiply", pointerEvents: "none" }} />
        );
      })()}
      {isAlarm && <rect x="0" y="0" width="1800" height="1000" fill="#ffb084" opacity="0.07" style={{ mixBlendMode: "screen", pointerEvents: "none" }} />}
      
      {/* ===== LIGHTING OVERLAYS (Rendered AFTER night overlay to bypass the darkness) ===== */}
      {/* FIX: Now successfully using the resolved url links from the top defs block */}
      {localLamp && (
        <g style={{ mixBlendMode: "screen", pointerEvents: "none" }} transform="translate(19 0)">
          <ellipse cx="154" cy="420" rx="200" ry="140" fill="url(#lampGlow)" opacity="0.95" />
          <polygon points="160,416 182,404 420,560 220,680" fill="url(#lampBeam)" />
          <ellipse cx="170" cy="410" rx="24" ry="16" fill="url(#lampHotspot)" />
        </g>
      )}

      {monitorOn && (
        <g style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
          <ellipse cx="1470" cy="446" rx="300" ry="240" fill="url(#monGlow)" opacity="0.85" />
        </g>
      )}

      {/* ===== MONITOR GLOW (Always On) ===== */}
      <g style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
        <ellipse cx="1470" cy="446" rx="300" ry="240" fill="url(#monGlow)" opacity="0.85" />
      </g>

      {/* Chair + Worker rendered AFTER the monitor glow so the seat sits on top of the light.
          When working, the chair renders AFTER the worker so the chair-back covers his back.
          During meals (lunch/dinner), the worker is away — only the chair remains. */}
      {isWork ? (
        <>
          <Worker visible={true} />
          <Chair />
        </>
      ) : (
        <Chair />
      )}

      {/* ===== CLOCK (rendered last so its red drop-shadow glow sits ON TOP of the night overlay) ===== */}
      <DigitalClock
        time={time}
        x={395}
        y={140}
        mealLabel={mealLabel}
        showTime={showTimeOverride}
        onToggle={() => mealLabel && setShowTimeOverride((v) => !v)}
      />
    </svg>
  );
}



// Mini desktop UI rendered inside the monitor screen.
// Screen rect: x=1328 y=376 w=280 h=130
function MiniDesktop({ time }) {
  const SX = 1328, SY = 260, SW = 280, SH = 130;
  const hours = time.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hh = String(hours % 12 || 12).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  // file icons on the left, terminal panel on the right
  const icons = [
    { y: 0, label: "about_me" },
    { y: 1, label: "projects" },
    { y: 2, label: "tools" },
    { y: 3, label: "books" },
  ];
  return (
    <g>
      {/* desktop background \u2014 teal like maximized */}
      <rect x={SX} y={SY} width={SW} height={SH} fill="#2d6e8a" />
      {/* menubar (light grey) */}
      <rect x={SX} y={SY} width={SW} height={9} fill="#d4d0c8" />
      <rect x={SX} y={SY + 8} width={SW} height={1} fill="#5a564f" />
      <rect x={SX + 3} y={SY + 2} width={5} height={5} fill="#c25d4a" />
      <text x={SX + 12} y={SY + 7} fontFamily="'VT323', monospace" fontSize="8" fill="#1a1a1a">RoomOS</text>
      <text x={SX + SW - 4} y={SY + 7} fontFamily="'VT323', monospace" fontSize="8" fill="#1a1a1a" textAnchor="end">{hh}:{mm} {ampm}</text>
      {/* left icon column \u2014 yellow folders matching maximized */}
      {icons.map((ic, i) => {
        const isAbout = ic.label === "about_me";
        const isFile = isAbout || ic.label === "README_txt";
        const iy = SY + 14 + i * 24;
        return (
          <g key={i}>
            {isAbout ? (
              <g>
                {/* mini headshot icon: parchment bg, head + shirt */}
                <rect x={SX + 7} y={iy} width="13" height="13" fill="#f0e6c8" stroke="#2a2118" strokeWidth="0.6" />
                <rect x={SX + 11} y={iy + 3} width="5" height="5" fill="#b07d5e" />
                <rect x={SX + 11} y={iy + 3} width="5" height="2" fill="#3a2a1f" />
                <rect x={SX + 9} y={iy + 9} width="9" height="4" fill="#2f4d6e" />
              </g>
            ) : isFile ? (
              <g>
                <rect x={SX + 7} y={iy} width="11" height="13" fill="#ffffff" stroke="#2a2118" strokeWidth="0.6" />
                <polygon points={`${SX+14},${iy} ${SX+18},${iy+4} ${SX+14},${iy+4}`} fill="#c8c4b8" stroke="#2a2118" strokeWidth="0.6" />
                <rect x={SX + 9} y={iy + 6} width="7" height="1" fill="#5a564f" />
                <rect x={SX + 9} y={iy + 9} width="7" height="1" fill="#5a564f" />
              </g>
            ) : (
              <g>
                <rect x={SX + 6} y={iy} width="14" height="11" fill="#e8d28a" />
                <rect x={SX + 6} y={iy} width="6" height="3" fill="#b89d56" />
                <rect x={SX + 6} y={iy} width="14" height="11" fill="none" stroke="#2a2118" strokeWidth="0.6" />
              </g>
            )}
            <text x={SX + 24} y={SY + 23 + i * 24} fontFamily="'VT323', monospace" fontSize="8" fill="#ffffff">
              {ic.label}
            </text>
          </g>
        );
      })}
      {/* terminal window on the right */}
      <rect x={SX + 110} y={SY + 16} width={SW - 116} height={SH - 28} fill="#d4d0c8" stroke="#1a1a1a" strokeWidth="0.6" />
      {/* classic blue title bar */}
      <rect x={SX + 110} y={SY + 16} width={SW - 116} height={9} fill="#000080" />
      <rect x={SX + 113} y={SY + 18} width={5} height={5} fill="#5cf08a" stroke="#1a4a1a" strokeWidth="0.4" />
      <text x={SX + 121} y={SY + 23} fontFamily="'VT323', monospace" fontSize="7" fill="#ffffff">~/term</text>
      <rect x={SX + SW - 12} y={SY + 18} width={5} height={5} fill="#d4d0c8" stroke="#1a1a1a" strokeWidth="0.4" />
      {/* terminal body (dark) */}
      <rect x={SX + 111} y={SY + 25} width={SW - 118} height={SH - 38} fill="#0b0f0a" />
      <text x={SX + 114} y={SY + 36} fontFamily="'VT323', monospace" fontSize="9" fill="#8de8a3">$ ls</text>
      <text x={SX + 114} y={SY + 47} fontFamily="'VT323', monospace" fontSize="9" fill="#cfe6cf">about projects</text>
      <text x={SX + 114} y={SY + 58} fontFamily="'VT323', monospace" fontSize="9" fill="#cfe6cf">books tools</text>
      <text x={SX + 114} y={SY + 72} fontFamily="'VT323', monospace" fontSize="9" fill="#8de8a3">$ whoami</text>
      <text x={SX + 114} y={SY + 83} fontFamily="'VT323', monospace" fontSize="9" fill="#cfe6cf">saaket@njit</text>
      <text x={SX + 114} y={SY + 97} fontFamily="'VT323', monospace" fontSize="9" fill="#8de8a3">$ _</text>
      {/* taskbar (light grey) */}
      <rect x={SX} y={SY + SH - 9} width={SW} height={9} fill="#d4d0c8" />
      <rect x={SX} y={SY + SH - 9} width={SW} height={1} fill="#5a564f" />
      <rect x={SX + 3} y={SY + SH - 7} width={16} height={5} fill="#d4d0c8" stroke="#1a1a1a" strokeWidth="0.4" />
      <text x={SX + SW - 4} y={SY + SH - 2} fontFamily="'VT323', monospace" fontSize="8" fill="#1a1a1a" textAnchor="end">
        {hh}:{mm} {ampm}
      </text>
    </g>
  );
}

function BookRow({ y, idx }) {
  const palettes = [
    ["#8b3a3a", "#2f5d8a", "#4a7a4a", "#c08b3e", "#6b4a8a", "#3a2614", "#c25d4a"],
    ["#2f5d8a", "#c08b3e", "#8b3a3a", "#4a7a4a", "#6b4a8a", "#c25d4a", "#3a2614"],
    ["#4a7a4a", "#6b4a8a", "#c08b3e", "#2f5d8a", "#8b3a3a", "#c25d4a"],
    ["#c08b3e", "#3a2614", "#2f5d8a", "#4a7a4a", "#8b3a3a", "#6b4a8a"],
  ];
  const widths = [
    [16, 14, 18, 14, 16, 14, 18, 14, 16],
    [18, 14, 18, 16, 14, 18, 18, 14, 16],
    [16, 14, 18, 14, 18, 16, 14, 14, 16],
    [14, 18, 14, 18, 18, 14, 18, 16, 14],
  ];
  const pal = palettes[idx % palettes.length];
  const ws = widths[idx % widths.length];
  let x = 1696;
  const items = [];
  let i = 0;
  while (x < 1796 && i < ws.length) {
    const w = ws[i];
    if (x + w > 1796) break;
    const c = pal[i % pal.length];
    const h = 60 + ((i * 7) % 12) - 4;
    items.push(
      <g key={i}>
        <rect x={x} y={y + 56 - h + 6} width={w} height={h} fill={c} />
        <rect x={x} y={y + 56 - h + 6} width={2} height={h} fill="#000" opacity="0.25" />
        <rect x={x + w - 2} y={y + 56 - h + 6} width={2} height={h} fill="#fff" opacity="0.18" />
        <rect x={x + 2} y={y + 56 - h + 18} width={w - 4} height={2} fill="#fff" opacity="0.35" />
      </g>
    );
    x += w + 1;
    i++;
  }
  return <g>{items}</g>;
}

window.Room = Room;

