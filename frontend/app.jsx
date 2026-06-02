/* global React, ReactDOM, Room, Terminal, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakSlider */
const { useState, useEffect, useMemo, useRef } = React;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scene": "auto",
  "showHud": true,
  "timeSource": "Live",
  "customHour": 12
}/*EDITMODE-END*/;
function sceneFromHour(h) {
  if (h >= 23 || h < 7) return "night";
  if (h >= 7 && h < 8) return "alarm";
  if (h >= 12 && h < 13) return "lunch";
  if (h >= 20 && h < 21) return "dinner";
  return "work";
}
// Build a Date "today at hour H" (fractional hours OK)
function dateAtHour(h) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + h * 3600000);
}
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [now, setNow] = useState(() => new Date());
  // simulated time for the window/clock — independent of real now
  const [simTime, setSimTime] = useState(() => new Date());
  const cycleAnchor = useRef({ real: Date.now(), sim: Date.now() });
  const [snoozedUntil, setSnoozedUntil] = useState(null);
  const initialOpen = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("open");
  }, []);
  const [terminalOpen, setTerminalOpen] = useState(() => initialOpen === "projects");
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);
  // re-anchor cycle whenever source or customHour changes
  useEffect(() => {
    if (t.timeSource === "Cycle") {
      cycleAnchor.current = { real: Date.now(), sim: dateAtHour(t.customHour).getTime() };
    }
  }, [t.timeSource, t.customHour]);
  // drive simTime
  useEffect(() => {
    if (t.timeSource === "Live") {
      const id = setInterval(() => setSimTime(new Date()), 5000);
      setSimTime(new Date());
      return () => clearInterval(id);
    }
    if (t.timeSource === "Set") {
      setSimTime(dateAtHour(t.customHour));
      return;
    }
    if (t.timeSource === "Cycle") {
      // 1 day of sim time per 3 min of real time = 480x
      const speed = 480;
      const id = setInterval(() => {
        const a = cycleAnchor.current;
        setSimTime(new Date(a.sim + (Date.now() - a.real) * speed));
      }, 200);
      return () => clearInterval(id);
    }
  }, [t.timeSource, t.customHour]);
  const autoScene = sceneFromHour(simTime.getHours());
  const scene = t.scene === "auto" ? autoScene : t.scene;
  // Smooth fade transition when scene changes
  const [displayScene, setDisplayScene] = useState(scene);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (scene === displayScene) return;
    setFading(true);
    const id = setTimeout(() => {
      setDisplayScene(scene);
      setFading(false);
    }, 350);
    return () => clearTimeout(id);
  }, [scene, displayScene]);
  const snoozed = snoozedUntil && now < snoozedUntil;
  const lampOn = false;
  const handlePhoneClick = () => {
    if (scene !== "alarm") return;
    setSnoozedUntil(new Date(Date.now() + 5 * 60 * 1000));
  };
  const sceneLabel =
    displayScene === "night" ? "- ASLEEP" :
    displayScene === "alarm" ? (snoozed ? "ALARM — SNOOZED" : "ALARM — 7:XX AM") :
    displayScene === "lunch" ? "LUNCH BREAK" :
    displayScene === "dinner" ? "DINNER BREAK" :
    " — WORKING";
    
  const dotCls = displayScene === "night" ? "dot night" : displayScene === "alarm" && !snoozed ? "dot alarm" : "dot";
  return (
    <div className="stage">
      <div className={`hud${fading ? " fading" : ""}`}>
        {t.showHud && (
          <>
            <span className="name">Saaket Kulkarni</span>
            <span>{sceneLabel}</span> 
          </>
        )}
      </div>
      <div className="hud-right">
        {t.showHud && (
          <>
            <div style={{opacity:0.7}}>click the monitor</div>
          </>
        )}
      </div>
      <div className={`room-wrap${fading ? " fading" : ""}`} data-screen-label="01 Room">
        <Room
          scene={displayScene}
          time={simTime}
          lampOn={lampOn}
          monitorOn={displayScene === "work"}
          snoozed={snoozed}
          onPhoneClick={handlePhoneClick}
          onMonitorClick={() => setTerminalOpen(true)}
        />
      </div>
      {terminalOpen && <Terminal initialFolder={initialOpen === "projects" ? ["projects/"] : null} onClose={() => setTerminalOpen(false)} />}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Scene">
          <TweakRadio
            label="Time of day"
            value={t.scene}
            onChange={(v) => setTweak("scene", v)}
            options={[
              { value: "auto", label: "Auto" },
              { value: "night", label: "Night" },
              { value: "alarm", label: "Alarm" },
              { value: "work", label: "Work" },
              { value: "lunch", label: "Lunch" },
              { value: "dinner", label: "Dinner" },
            ]}
          />
        </TweakSection>
        <TweakSection label="Window time">
          <TweakRadio
            label="Source"
            value={t.timeSource}
            onChange={(v) => setTweak("timeSource", v)}
            options={[
              { value: "Live", label: "Live" },
              { value: "Cycle", label: "Cycle" },
              { value: "Set", label: "Set" },
            ]}
          />
          {(t.timeSource === "Set" || t.timeSource === "Cycle") && (
            <TweakSlider
              label={t.timeSource === "Set" ? "Hour" : "Start hour"}
              value={t.customHour}
              min={0}
              max={23.5}
              step={0.5}
              unit="h"
              onChange={(v) => setTweak("customHour", v)}
            />
          )}
        </TweakSection>
        <TweakSection label="Display">
          <TweakToggle
            label="Show HUD overlay"
            value={t.showHud}
            onChange={(v) => setTweak("showHud", v)}
          />
        </TweakSection>
        <TweakSection label="Try">
          <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.8 }}>
            · Click the monitor to open the terminal<br/>
            · Set scene → Alarm, then click the phone to snooze<br/>
            · Try <code>ls</code>, <code>cat about_me</code>, <code>tree</code>
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
