/* global React, ReactDOM, Room, Terminal, PortfolioPage, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakSlider */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scene": "auto",
  "showHud": true,
  "timeSource": "Live",
  "customHour": 12
}/*EDITMODE-END*/;

function sceneFromHour(hour) {
  if (hour >= 23 || hour < 7) return "night";
  if (hour >= 7 && hour < 8) return "alarm";
  if (hour >= 12 && hour < 13) return "lunch";
  if (hour >= 20 && hour < 21) return "dinner";
  return "work";
}

function dateAtHour(hour) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return new Date(date.getTime() + hour * 3600000);
}

function SiteHeader({ activeView, onViewChange }) {
  return (
    <header className={`site-header${activeView === "room" ? " site-header--room" : ""}`}>
      <button className="site-brand" type="button" onClick={() => onViewChange("portfolio")} aria-label="Open portfolio home">
        <span className="site-brand-mark" aria-hidden="true">SK</span>
        <span className="site-brand-copy"><strong>Saaket Kulkarni</strong><small>CS + systems</small></span>
      </button>

      <div className="view-switcher" role="tablist" aria-label="Site view">
        <button type="button" role="tab" aria-selected={activeView === "portfolio"} onClick={() => onViewChange("portfolio")}>Portfolio</button>
        <button type="button" role="tab" aria-selected={activeView === "room"} onClick={() => onViewChange("room")}><i aria-hidden="true" /> Room</button>
      </div>
    </header>
  );
}

function RoomView({ onTerminalStateChange }) {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [now, setNow] = React.useState(() => new Date());
  const [simTime, setSimTime] = React.useState(() => new Date());
  const [snoozedUntil, setSnoozedUntil] = React.useState(null);
  const [terminalOpen, setTerminalOpen] = React.useState(false);
  const cycleAnchor = React.useRef({ real: Date.now(), sim: Date.now() });

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (t.timeSource === "Cycle") {
      cycleAnchor.current = { real: Date.now(), sim: dateAtHour(t.customHour).getTime() };
    }
  }, [t.timeSource, t.customHour]);

  React.useEffect(() => {
    if (t.timeSource === "Live") {
      setSimTime(new Date());
      const id = setInterval(() => setSimTime(new Date()), 5000);
      return () => clearInterval(id);
    }
    if (t.timeSource === "Set") {
      setSimTime(dateAtHour(t.customHour));
      return undefined;
    }
    const speed = 480;
    const id = setInterval(() => {
      const anchor = cycleAnchor.current;
      setSimTime(new Date(anchor.sim + (Date.now() - anchor.real) * speed));
    }, 200);
    return () => clearInterval(id);
  }, [t.timeSource, t.customHour]);

  const selectedScene = t.scene === "auto" ? sceneFromHour(simTime.getHours()) : t.scene;
  const [displayScene, setDisplayScene] = React.useState(selectedScene);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    if (selectedScene === displayScene) return undefined;
    setFading(true);
    const id = setTimeout(() => {
      setDisplayScene(selectedScene);
      setFading(false);
    }, 300);
    return () => clearTimeout(id);
  }, [selectedScene, displayScene]);

  const snoozed = Boolean(snoozedUntil && now < snoozedUntil);
  const handlePhoneClick = () => {
    if (displayScene === "alarm") setSnoozedUntil(new Date(Date.now() + 5 * 60 * 1000));
  };
  const sceneLabel =
    displayScene === "night" ? "— ASLEEP" :
    displayScene === "alarm" ? (snoozed ? "ALARM — SNOOZED" : "ALARM — 7:XX AM") :
    displayScene === "lunch" ? "— LUNCH BREAK" :
    displayScene === "dinner" ? "— DINNER BREAK" :
    "— WORKING";

  return (
    <main className="room-page">
      <div className="stage">
        <div className={`hud${fading ? " fading" : ""}`}>
          {t.showHud && <><span className="name">Saaket Kulkarni</span><span>{sceneLabel}</span></>}
        </div>
        <div className="hud-right">
          {t.showHud && <><div>interactive room</div><div style={{ opacity: 0.48 }}>click the monitor</div></>}
        </div>
        <div className={`room-wrap${fading ? " fading" : ""}`} data-screen-label="Room">
          <Room
            scene={displayScene}
            time={simTime}
            lampOn={false}
            monitorOn={displayScene === "work"}
            snoozed={snoozed}
            onPhoneClick={handlePhoneClick}
            onMonitorClick={() => {
              setTerminalOpen(true);
              onTerminalStateChange(true);
            }}
          />
        </div>

        {terminalOpen && <Terminal onClose={() => {
          setTerminalOpen(false);
          onTerminalStateChange(false);
        }} />}

        <TweaksPanel title="Room settings">
          <TweakSection label="Scene">
            <TweakRadio
              label="Time of day"
              value={t.scene}
              onChange={(value) => setTweak("scene", value)}
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
              onChange={(value) => setTweak("timeSource", value)}
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
                onChange={(value) => setTweak("customHour", value)}
              />
            )}
          </TweakSection>
          <TweakSection label="Display">
            <TweakToggle label="Show HUD overlay" value={t.showHud} onChange={(value) => setTweak("showHud", value)} />
          </TweakSection>
        </TweaksPanel>
      </div>
    </main>
  );
}

function App() {
  const [activeView, setActiveView] = React.useState(() => window.location.hash === "#room" ? "room" : "portfolio");
  const [roomTerminalOpen, setRoomTerminalOpen] = React.useState(false);

  const changeView = (nextView) => {
    setActiveView(nextView);
    setRoomTerminalOpen(false);
    window.history.replaceState(null, "", nextView === "room" ? "#room" : window.location.pathname);
    window.requestAnimationFrame(() => document.querySelector(".portfolio-page")?.scrollTo(0, 0));
  };

  React.useEffect(() => {
    const onHashChange = () => setActiveView(window.location.hash === "#room" ? "room" : "portfolio");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className={`site-app site-app--${activeView}`}>
      {!roomTerminalOpen && <SiteHeader activeView={activeView} onViewChange={changeView} />}
      {activeView === "portfolio" ? <PortfolioPage /> : <RoomView onTerminalStateChange={setRoomTerminalOpen} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
