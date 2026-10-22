import React, { useEffect, useMemo, useRef, useState } from "react";

const ZONES = {
  A: { name: "Citadel Trench", color: "#d4a373", x: 24, y: 33 },
  B: { name: "Necropolis Sector", color: "#ff6b00", x: 72, y: 30 },
  C: { name: "Ceramic Kilns", color: "#6b705c", x: 47, y: 70 },
  BASE: { name: "Shade & Rest Hub", color: "#10b981", x: 15, y: 79 },
};

const INITIAL_WORKERS = [
  {
    id: "w-01",
    name: "Mara Voss",
    role: "Field Archaeologist",
    zone: "A",
    x: 24,
    y: 33,
    heartRate: 108,
    history: [91, 95, 97, 101, 99, 104, 108],
    heatIndex: 36.8,
    hydration: 78,
    durationMinutes: 29,
    maxDuration: 45,
    baselineBpm: 72,
    isResting: false,
  },
  {
    id: "w-02",
    name: "Jonas Reed",
    role: "Survey Technician",
    zone: "B",
    x: 72,
    y: 30,
    heartRate: 126,
    history: [100, 104, 110, 112, 119, 122, 126],
    heatIndex: 37.6,
    hydration: 62,
    durationMinutes: 38,
    maxDuration: 45,
    baselineBpm: 68,
    isResting: false,
  },
  {
    id: "w-03",
    name: "Amina Patel",
    role: "Conservator",
    zone: "C",
    x: 47,
    y: 70,
    heartRate: 82,
    history: [76, 78, 79, 80, 82, 81, 82],
    heatIndex: 34.2,
    hydration: 91,
    durationMinutes: 19,
    maxDuration: 45,
    baselineBpm: 70,
    isResting: false,
  },
  {
    id: "w-04",
    name: "Leo Okafor",
    role: "Excavation Lead",
    zone: "A",
    x: 29,
    y: 38,
    heartRate: 76,
    history: [74, 75, 72, 77, 78, 75, 76],
    heatIndex: 33.6,
    hydration: 96,
    durationMinutes: 43,
    maxDuration: 45,
    baselineBpm: 66,
    isResting: true,
  },
];

const INITIAL_ARTIFACTS = [
  {
    id: "APX-2026-041",
    fragments: "FRAG-3411 + FRAG-7720",
    type: "Attic black-figure pottery",
    confidence: 98.6,
    by: "Amina Patel",
    time: "09:42 UTC",
  },
  {
    id: "APX-2026-040",
    fragments: "FRAG-2148 + FRAG-9052",
    type: "Rim sherd · amphora",
    confidence: 91.3,
    by: "Mara Voss",
    time: "08:16 UTC",
  },
  {
    id: "APX-2026-039",
    fragments: "FRAG-1007 + FRAG-3319",
    type: "Hellenistic oil lamp",
    confidence: 96.1,
    by: "Jonas Reed",
    time: "07:28 UTC",
  },
];

const TABS = [
  ["overview", "⌖", "Overview"],
  ["crew", "◉", "Crew & health"],
  ["security", "◎", "Perimeter"],
  ["workbench", "◈", "Workbench"],
];

function Icon({ children, className = "" }) {
  return <span aria-hidden="true" className={`icon ${className}`}>{children}</span>;
}

function Sparkline({ values, color = "#00f0ff" }) {
  const points = values
    .map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${34 - ((value - 55) / 100) * 30}`)
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 38" preserveAspectRatio="none" role="img" aria-label="Recent heart rate trend">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ContourMap({ workers, onSelectWorker, selectedWorker }) {
  const contourPaths = [
    "M-20 45 C30 5 84 12 130 44 S230 78 298 31 S410 4 480 42 S590 80 690 24",
    "M-20 55 C35 18 82 23 128 53 S232 88 300 42 S410 16 478 52 S590 91 690 36",
    "M-20 65 C35 30 80 35 126 64 S235 99 302 54 S408 28 478 63 S590 102 690 48",
    "M-10 80 C40 46 90 46 140 75 S230 112 306 69 S415 42 480 78 S595 116 690 63",
    "M-20 98 C35 62 91 59 140 88 S236 128 305 85 S411 57 480 93 S590 132 690 79",
    "M-20 116 C30 82 88 77 142 105 S236 145 310 101 S415 73 482 110 S590 148 690 97",
    "M-20 138 C34 100 90 95 145 125 S240 165 312 123 S418 95 485 131 S595 169 690 116",
    "M-20 160 C36 120 92 116 148 145 S242 185 315 143 S420 116 487 152 S600 188 690 137",
    "M-20 184 C35 143 95 138 152 167 S246 208 320 165 S423 138 490 175 S602 210 690 159",
    "M-20 210 C35 168 98 163 155 193 S250 232 323 191 S428 162 495 198 S605 235 690 185",
    "M-20 237 C38 195 100 188 160 218 S255 260 328 217 S432 190 498 225 S610 261 690 211",
    "M-20 268 C40 221 103 215 165 245 S260 288 332 245 S438 219 505 252 S615 290 690 238",
  ];
  return (
    <div className="map-canvas">
      <svg className="contours" viewBox="0 0 680 300" preserveAspectRatio="none" aria-label="Topographic site map">
        <defs>
          <pattern id="mapGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(0,240,255,.12)" strokeWidth=".7" />
          </pattern>
        </defs>
        <rect width="680" height="300" fill="url(#mapGrid)" />
        {contourPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke={i % 3 === 0 ? "rgba(212,163,115,.34)" : "rgba(212,163,115,.17)"} strokeWidth={i % 3 === 0 ? "1.2" : ".8"} />
        ))}
        <path d="M90 110 C180 88 207 145 300 137 S443 99 568 124" fill="none" stroke="rgba(0,240,255,.28)" strokeDasharray="4 6" />
        <text x="328" y="24" fill="rgba(0,240,255,.56)" fontSize="8" fontFamily="monospace">N ↑  38° 14′ 22″ N / 23° 42′ 08″ E</text>
      </svg>
      {Object.entries(ZONES).map(([key, zone]) => (
        <div
          key={key}
          className="zone-label"
          style={{ left: `${zone.x}%`, top: `${zone.y}%`, "--zone-color": zone.color }}
        >
          <span className="zone-dot" />
          <span>{key === "BASE" ? "BASE CAMP" : `ZONE ${key}`}</span>
          <small>{zone.name}</small>
        </div>
      ))}
      {workers.map((worker) => {
        const color = worker.isResting ? ZONES.BASE.color : ZONES[worker.zone].color;
        return (
          <button
            key={worker.id}
            className={`worker-pin ${worker.isResting ? "resting" : ""} ${selectedWorker === worker.id ? "selected" : ""}`}
            style={{ left: `${worker.x}%`, top: `${worker.y}%`, "--pin-color": color }}
            onClick={() => onSelectWorker(worker.id)}
            title={`${worker.name} · ${worker.isResting ? "At base camp" : `Zone ${worker.zone}`}`}
            aria-label={`View ${worker.name}, ${worker.isResting ? "resting" : `Zone ${worker.zone}`}`}
          >
            <span>{worker.name.split(" ").map((part) => part[0]).join("")}</span>
          </button>
        );
      })}
      <div className="map-scale"><span /> 25 m <span /> 50 m</div>
    </div>
  );
}

function Modal({ title, eyebrow, children, onClose, wide = false, danger = false }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <div>
            {eyebrow && <div className={`eyebrow ${danger ? "text-alert" : ""}`}>{eyebrow}</div>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Metric({ label, value, detail, accent, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{label}</span><Icon>{icon}</Icon></div>
      <div className="metric-value" style={{ color: accent }}>{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function WorkerCard({ worker, onOffboard, onRest, onFocus }) {
  const isHot = worker.heatIndex > 38;
  const isElevated = worker.heartRate > 125;
  const elapsed = Math.floor(worker.durationMinutes);
  return (
    <article className={`worker-card ${worker.isResting ? "worker-resting" : ""}`}>
      <div className="worker-card-head">
        <div className="worker-avatar" style={{ "--avatar-color": worker.isResting ? ZONES.BASE.color : ZONES[worker.zone].color }}>
          {worker.name.split(" ").map((part) => part[0]).join("")}
        </div>
        <div className="worker-identity">
          <h3>{worker.name}</h3>
          <span>{worker.role}</span>
        </div>
        <span className={`status-pill ${worker.isResting ? "pill-green" : "pill-live"}`}>
          <i />{worker.isResting ? "RESTING" : "ON SHIFT"}
        </span>
      </div>
      {worker.isResting && <div className="rest-banner">SHADE STATION · RECOVERY IN PROGRESS</div>}
      <div className="card-location">
        <span className="mini-dot" style={{ background: worker.isResting ? ZONES.BASE.color : ZONES[worker.zone].color }} />
        {worker.isResting ? "Base Camp · Shade & Rest Hub" : `Zone ${worker.zone} · ${ZONES[worker.zone].name}`}
        <button className="text-link" onClick={() => onFocus(worker.id)}>Locate ↗</button>
      </div>
      <div className="pulse-block">
        <div className="pulse-title"><span>LIVE HEART RATE</span><b className={isElevated ? "text-orange" : ""}>{worker.heartRate} <small>BPM</small></b></div>
        <Sparkline values={worker.history} color={isElevated ? "#ff6b00" : "#00f0ff"} />
      </div>
      <div className="worker-stats">
        <div><span>HEAT INDEX</span><b className={isHot ? "text-alert" : ""}>{worker.heatIndex.toFixed(1)}°<small>C</small></b></div>
        <div><span>HYDRATION</span><b className={worker.hydration < 60 ? "text-orange" : ""}>{worker.hydration}<small>%</small></b></div>
        <div><span>SHIFT TIMER</span><b>{elapsed}<small> / {worker.maxDuration} min</small></b></div>
      </div>
      <div className="hydration-track"><span style={{ width: `${worker.hydration}%`, background: worker.hydration < 60 ? "#ff6b00" : "#10b981" }} /></div>
      <div className="worker-card-actions">
        {worker.isResting ? (
          <>
            <button className="button button-green button-grow" onClick={() => onRest(worker.id)}>End Rest & Return to Duty</button>
            <button className="button button-quiet" onClick={() => onOffboard(worker.id)}>Offboard Worker</button>
          </>
        ) : (
          <button className="button button-quiet button-grow" onClick={() => onOffboard(worker.id)}>Offboard Worker</button>
        )}
      </div>
    </article>
  );
}

export default function ApexDigCommandCenter() {
  const [tab, setTab] = useState("overview");
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  const [securityAlert, setSecurityAlert] = useState(false);
  const [heatAlert, setHeatAlert] = useState(false);
  const [fragmentsProcessed, setFragmentsProcessed] = useState(127);
  const [artifacts, setArtifacts] = useState(INITIAL_ARTIFACTS);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [simulation, setSimulation] = useState("");
  const [recording, setRecording] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [scansUploaded, setScansUploaded] = useState(0);
  const [broadcast, setBroadcast] = useState(false);
  const [confirmMatch, setConfirmMatch] = useState(false);
  const [sensorUrl, setSensorUrl] = useState("");
  const [sensorEndpoint, setSensorEndpoint] = useState("");
  const [sensorConnected, setSensorConnected] = useState(false);
  const [sensorReading, setSensorReading] = useState(null);
  const [sensorError, setSensorError] = useState("");
  const sensorBreachRef = useRef(false);
  const workersRef = useRef(workers);
  const toastTimer = useRef(null);
  const breachTimer = useRef(null);

  useEffect(() => { workersRef.current = workers; }, [workers]);

  const showToast = (message, kind = "success") => {
    setToast({ message, kind, nonce: Date.now() });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sensorConnected || !sensorEndpoint) return undefined;
    let active = true;
    let timeout;
    const poll = async () => {
      try {
        const response = await fetch(sensorEndpoint, { cache: "no-store" });
        if (!response.ok) throw new Error(`ESP32 returned HTTP ${response.status}`);
        const reading = await response.json();
        if (typeof reading.breach !== "boolean") throw new Error("ESP32 response is missing a boolean breach field");
        if (!active) return;
        setSensorReading(reading);
        setSensorError("");
        if (reading.breach && !sensorBreachRef.current) {
          sensorBreachRef.current = true;
          setSecurityAlert(true);
          setBroadcast(false);
          setModal({ type: "breach" });
          showToast(`Ultrasonic sensor detected an object at ${reading.distanceCm} cm.`, "danger");
        } else if (!reading.breach && sensorBreachRef.current) {
          sensorBreachRef.current = false;
          setSecurityAlert(false);
          showToast("Perimeter sensor is clear again.");
        }
      } catch (error) {
        if (!active) return;
        setSensorError(error instanceof Error ? error.message : "Unable to read the ESP32 sensor.");
      } finally {
        if (active) timeout = window.setTimeout(poll, 1000);
      }
    };
    poll();
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [sensorConnected, sensorEndpoint]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const restDispatches = [];
      setWorkers((current) => current.map((worker) => {
        if (worker.isResting) {
          const dx = (ZONES.BASE.x - worker.x) * 0.16;
          const dy = (ZONES.BASE.y - worker.y) * 0.16;
          return { ...worker, x: Math.abs(dx) < 0.4 ? ZONES.BASE.x : worker.x + dx, y: Math.abs(dy) < 0.4 ? ZONES.BASE.y : worker.y + dy };
        }
        const durationMinutes = worker.durationMinutes + 0.05;
        const heartRate = Math.max(worker.baselineBpm, Math.min(151, worker.heartRate + (Math.random() > 0.52 ? 1 : -1)));
        const heatIndex = Math.max(31, Math.min(41.5, worker.heatIndex + (Math.random() > 0.68 ? 0.1 : -0.04)));
        const hydration = Math.max(28, worker.hydration - (Math.random() > 0.72 ? 1 : 0));
        const history = [...worker.history.slice(-6), heartRate];
        const needsRest = durationMinutes > worker.maxDuration || heartRate > 135 || heatIndex > 38;
        if (needsRest) {
          restDispatches.push(worker.name);
          const dx = (ZONES.BASE.x - worker.x) * 0.16;
          const dy = (ZONES.BASE.y - worker.y) * 0.16;
          return { ...worker, durationMinutes, heartRate, heatIndex, hydration, history, isResting: true, x: worker.x + dx, y: worker.y + dy };
        }
        const direction = Math.random() > 0.5 ? 1 : -1;
        return {
          ...worker,
          durationMinutes,
          heartRate,
          heatIndex,
          hydration,
          history,
          x: Math.max(4, Math.min(94, worker.x + direction * (Math.random() * 0.5))),
          y: Math.max(8, Math.min(90, worker.y + (Math.random() - 0.5) * 0.55)),
        };
      }));
      [...new Set(restDispatches)].forEach((name) => showToast(`${name} has been routed to Base Camp for a recovery break.`, "warning"));
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    if (breachTimer.current) window.clearTimeout(breachTimer.current);
  }, []);

  const selectedWorkerData = useMemo(() => workers.find((worker) => worker.id === selectedWorker), [workers, selectedWorker]);
  const utcTime = clock.toISOString().slice(11, 19);

  function activateBreach() {
    setSecurityAlert(true);
    setBroadcast(false);
    setModal({ type: "breach" });
    showToast("Perimeter alert — the team has been notified to check Zone B.", "danger");
  }

  function connectSensor(event) {
    event.preventDefault();
    const endpoint = sensorUrl.trim();
    if (!endpoint) {
      setSensorError("Enter the ESP32 address, for example http://192.168.1.50/api/node");
      return;
    }
    setSensorError("");
    setSensorReading(null);
    sensorBreachRef.current = false;
    setSensorEndpoint(endpoint);
    setSensorConnected(true);
  }

  function disconnectSensor() {
    setSensorConnected(false);
    setSensorEndpoint("");
    setSensorReading(null);
    setSensorError("");
    sensorBreachRef.current = false;
    setSecurityAlert(false);
  }

  function simulate(value) {
    setSimulation("");
    if (value === "heat") {
      setHeatAlert(true);
      const worker = workersRef.current.find((person) => !person.isResting);
      if (worker) {
        setWorkers((current) => current.map((person) => person.id === worker.id ? { ...person, heatIndex: 39.2 } : person));
        showToast(`Heat alert simulated for ${worker.name}. Smart rest dispatch will engage.`, "warning");
      } else showToast("Heat alert is active. All crew are currently resting.", "warning");
    } else if (value === "breach") activateBreach();
    else if (value === "artifact") {
      setConfirmMatch(true);
      showToast("A new fragment scan is ready for reconstruction.", "success");
      setTab("workbench");
    }
  }

  function registerWorker(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    if (!name) return;
    const zone = String(data.get("zone"));
    const baselineBpm = Number(data.get("baselineBpm"));
    const worker = {
      id: `w-${Date.now()}`,
      name,
      role: String(data.get("role")),
      zone,
      x: ZONES[zone].x + (Math.random() - 0.5) * 6,
      y: ZONES[zone].y + (Math.random() - 0.5) * 6,
      heartRate: baselineBpm + 18,
      history: [baselineBpm + 8, baselineBpm + 10, baselineBpm + 14, baselineBpm + 12, baselineBpm + 16, baselineBpm + 17, baselineBpm + 18],
      heatIndex: 35.2,
      hydration: 100,
      durationMinutes: 0,
      maxDuration: Math.max(1, Number(data.get("maxDuration")) || 45),
      baselineBpm,
      isResting: false,
    };
    setWorkers((current) => [...current, worker]);
    setModal(null);
    showToast(`${name} is checked in and ready for the field.`);
  }

  function offboardWorker(id) {
    const worker = workers.find((person) => person.id === id);
    if (!worker) return;
    setWorkers((current) => current.filter((person) => person.id !== id));
    if (selectedWorker === id) setSelectedWorker(null);
    setModal(null);
    showToast(`${worker.name} has been safely offboarded.`);
  }

  function endRest(id) {
    const worker = workers.find((person) => person.id === id);
    setWorkers((current) => current.map((person) => person.id === id ? {
      ...person,
      isResting: false,
      durationMinutes: 0,
      heartRate: person.baselineBpm + 8,
      heatIndex: Math.min(person.heatIndex, 35.5),
      hydration: Math.max(person.hydration, 90),
      history: [...person.history.slice(-6), person.baselineBpm + 8],
    } : person));
    if (worker) showToast(`${worker.name} is refreshed and back on shift.`);
  }

  function catalogArtifact() {
    const record = {
      id: `APX-2026-${String(42 + artifacts.length - INITIAL_ARTIFACTS.length).padStart(3, "0")}`,
      fragments: "FRAG-8902 + FRAG-3411",
      type: "Decorated storage vessel",
      confidence: 94.2,
      by: workers[0]?.name || "Field team",
      time: new Date().toISOString().slice(11, 16) + " UTC",
    };
    setArtifacts((current) => [record, ...current]);
    setFragmentsProcessed((current) => current + 2);
    setConfirmMatch(false);
    showToast(`${record.id} cataloged. Two matched fragments added to today's total.`);
  }

  function resetSystem() {
    setWorkers(INITIAL_WORKERS.map((worker) => ({ ...worker })));
    setSecurityAlert(false);
    setHeatAlert(false);
    setBroadcast(false);
    setSelectedWorker(null);
    setModal(null);
    setFragmentsProcessed(127);
    setArtifacts(INITIAL_ARTIFACTS);
    showToast("Command center reset to the initial field simulation.");
  }

  function focusWorker(id) {
    setSelectedWorker(id);
    setTab("overview");
  }

  const registerForm = (
    <form className="form-grid" onSubmit={registerWorker}>
      <label className="field field-full">Full name<input name="name" placeholder="e.g. Sam Rivera" required autoFocus maxLength={64} /></label>
      <label className="field">Role<select name="role" defaultValue="Field Archaeologist"><option>Field Archaeologist</option><option>Survey Technician</option><option>Conservator</option><option>Excavation Lead</option><option>Site Medic</option><option>Research Assistant</option></select></label>
      <label className="field">Assigned zone<select name="zone" defaultValue="A"><option value="A">Zone A · Citadel Trench</option><option value="B">Zone B · Necropolis Sector</option><option value="C">Zone C · Ceramic Kilns</option></select></label>
      <label className="field">Max shift duration (min)<input name="maxDuration" type="number" min="1" max="720" defaultValue="45" required /></label>
      <label className="field">Baseline heart rate (BPM)<input name="baselineBpm" type="number" min="35" max="120" defaultValue="72" required /></label>
      <div className="modal-actions field-full"><button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button><button className="button button-primary">Register Team Member</button></div>
    </form>
  );

  return (
    <div className="apex-app">
      <style>{STYLES}</style>
      <div className="topo-texture" />
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark"><span>⌖</span></div>
          <div><div className="brand-name">APEX<span>DIG</span></div><div className="brand-caption">FIELD OPERATIONS / COMMAND CENTER</div></div>
        </div>
        <div className="header-right">
          <div className={`system-badge ${securityAlert ? "system-danger" : ""}`}>
            <i />{securityAlert ? "SECURITY ALERT" : "ALL SYSTEMS NOMINAL"}
          </div>
          <div className="utc-clock"><span>UTC</span><b>{utcTime}</b></div>
        </div>
      </header>

      <main className="main-shell">
        <section className="telemetry-grid" aria-label="Site telemetry">
          <Metric label="Active crew" value={workers.length.toString().padStart(2, "0")} detail="Registered field team" accent="#d4a373" icon="◉" />
          <Metric label="Ambient heat index" value="38.5°C" detail={<><span className="risk-indicator" />High risk · hydrate often</>} accent="#ff6b00" icon="♨" />
          <Metric label="Perimeter security" value={securityAlert ? "ALERT" : "NORMAL"} detail={securityAlert ? "Zone B · breach detected" : "8 boundary nodes online"} accent={securityAlert ? "#ff2a6d" : "#10b981"} icon="◎" />
          <Metric label="Fragments processed" value={fragmentsProcessed.toLocaleString()} detail="Today's catalog total" accent="#00f0ff" icon="◈" />
        </section>

        <section className="toolbar">
          <nav className="tab-nav" aria-label="Dashboard sections">
            {TABS.map(([id, icon, label]) => (
              <button key={id} className={`tab-button ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
                <Icon>{icon}</Icon>{label}{id === "security" && securityAlert && <i className="tab-alert-dot" />}
              </button>
            ))}
          </nav>
          <div className="toolbar-actions">
            <select aria-label="Simulation actions" value={simulation} onChange={(event) => event.target.value && simulate(event.target.value)}>
              <option value="">⌁ Simulate event</option>
              <option value="heat">Simulate Heat Alert</option>
              <option value="breach">Simulate Perimeter Breach</option>
              <option value="artifact">Simulate Artifact Match</option>
            </select>
            <button className="button button-quiet reset-button" onClick={resetSystem}>↻ System reset</button>
          </div>
        </section>

        {securityAlert && <div className="global-alert"><span className="alert-pulse">!</span><div><b>Perimeter breach detected in Zone B.</b><span>Follow emergency protocols and verify your crew's location.</span></div><button onClick={() => setModal({ type: "breach" })}>View protocol →</button></div>}
        {heatAlert && <div className="global-alert heat-global"><span className="alert-pulse">♨</span><div><b>Heat advisory active · 38.5°C ambient.</b><span>Smart rest is monitoring every worker. Keep water and shade close.</span></div><button onClick={() => setTab("crew")}>View crew →</button></div>}

        {tab === "overview" && (
          <section className="overview-layout">
            <div className="panel map-panel">
              <div className="panel-heading">
                <div><div className="eyebrow">LIVE SITE POSITIONING</div><h2>Excavation map <span className="live-dot">LIVE</span></h2></div>
                <div className="map-coordinates">GRID 38°14′N<br />DATUM · WGS 84</div>
              </div>
              <ContourMap workers={workers} selectedWorker={selectedWorker} onSelectWorker={(id) => setSelectedWorker(selectedWorker === id ? null : id)} />
              <div className="map-legend">
                {Object.entries(ZONES).map(([key, zone]) => <span key={key}><i style={{ background: zone.color }} />{key === "BASE" ? "Base Camp" : `Zone ${key}`}</span>)}
                <span className="legend-right"><i className="legend-ring" />Crew GPS</span>
              </div>
              {selectedWorkerData && <div className="map-worker-popover">
                <button className="popover-close" onClick={() => setSelectedWorker(null)} aria-label="Close worker details">×</button>
                <b>{selectedWorkerData.name}</b><span>{selectedWorkerData.isResting ? "At Base Camp · resting" : `Zone ${selectedWorkerData.zone} · ${ZONES[selectedWorkerData.zone].name}`}</span>
                <div><strong>{selectedWorkerData.heartRate} BPM</strong><small> · {selectedWorkerData.heatIndex.toFixed(1)}°C · {selectedWorkerData.hydration}% hydration</small></div>
                <button className="text-link" onClick={() => setTab("crew")}>Open health profile →</button>
              </div>}
            </div>
            <aside className="overview-side">
              <div className="panel field-conditions">
                <div className="panel-heading compact"><div><div className="eyebrow">FIELD CONDITIONS</div><h2>Site status</h2></div><span className="sun-icon">☼</span></div>
                <div className="condition-row"><span>Ambient temperature</span><b>34.8°C</b></div>
                <div className="condition-row"><span>Heat index</span><b className="text-orange">38.5°C <em>HIGH</em></b></div>
                <div className="condition-row"><span>Wind / humidity</span><b>8 km/h · 61%</b></div>
                <div className="condition-note">Peak heat expected at 14:00. Shade stations and water points are available at Base Camp.</div>
              </div>
              <div className="panel zone-panel">
                <div className="eyebrow">ACTIVE EXCAVATION ZONES</div>
                {["A", "B", "C"].map((zone) => {
                  const count = workers.filter((worker) => !worker.isResting && worker.zone === zone).length;
                  return <div className="zone-row" key={zone}><span className="zone-letter" style={{ "--zone-color": ZONES[zone].color }}>{zone}</span><div><b>{ZONES[zone].name}</b><small>Zone {zone} · {count} crew {count === 1 ? "member" : "members"}</small></div><span className="zone-arrow">↗</span></div>;
                })}
                <button className="button button-quiet button-full" onClick={() => setTab("crew")}>View crew health →</button>
              </div>
            </aside>
          </section>
        )}

        {tab === "crew" && (
          <section className="section-content">
            <div className="section-title">
              <div><div className="eyebrow">PEOPLE FIRST · FIELD HEALTH</div><h1>Crew & biometrics <span>{workers.length} registered</span></h1><p>Live readings support safer shifts. Rest dispatch is automatic when anyone needs a break.</p></div>
              <button className="button button-primary" onClick={() => setModal({ type: "register" })}><b>＋</b> Register New Worker</button>
            </div>
            {workers.length ? <div className="worker-grid">{workers.map((worker) => <WorkerCard key={worker.id} worker={worker} onOffboard={(id) => setModal({ type: "offboard", id })} onRest={endRest} onFocus={focusWorker} />)}</div> : (
              <div className="empty-state"><div>◉</div><h2>Your field roster is clear</h2><p>Register your first team member to start monitoring field health.</p><button className="button button-primary" onClick={() => setModal({ type: "register" })}>Register Team Member</button></div>
            )}
          </section>
        )}

        {tab === "security" && (
          <section className="security-layout">
            <div className="panel radar-panel">
              <div className="panel-heading"><div><div className="eyebrow">IOT RADAR NODE MONITOR</div><h2>Perimeter watch <span className="live-dot">{sensorConnected ? "ESP32 LINK" : "SIMULATED"}</span></h2></div><span className={`status-pill ${securityAlert ? "pill-alert" : sensorConnected && sensorReading ? "pill-green" : "pill-live"}`}><i />{securityAlert ? "BREACH" : sensorConnected && sensorReading ? "SENSOR ONLINE" : "8 NODES SIMULATED"}</span></div>
              <div className={`radar-wrap ${securityAlert ? "radar-breach" : ""}`}>
                <div className="radar-grid"><div className="radar-sweep" /><div className="radar-crosshair" />
                  {Array.from({ length: 8 }, (_, index) => {
                    const angle = (index * 45 - 90) * Math.PI / 180;
                    const sensorNode = sensorConnected && index === 0;
                    return <span key={index} className={`radar-node ${securityAlert && (sensorNode || !sensorConnected && index === 2) ? "node-alert" : ""}`} style={{ left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%` }}><i />NODE {String(index + 1).padStart(2, "0")}{sensorNode && sensorReading?.distanceCm != null ? ` · ${sensorReading.distanceCm} cm` : ""}</span>;
                  })}
                  {securityAlert && <div className="radar-blip">!</div>}
                </div>
              </div>
              <div className="radar-footer"><span><i className="node-key node-ok" />Active node</span><span><i className="node-key node-warn" />Unregistered signal</span><span>Range 500 m · Refresh 2.4 sec</span></div>
            </div>
            <aside className="security-side">
              <div className="panel sensor-connection-panel">
                <div className="eyebrow">HC-SR04 · ESP32 WIFI LINK</div>
                <h3>{sensorConnected ? "Ultrasonic sensor connection" : "Connect a perimeter sensor"}</h3>
                <p>Enter the ESP32 address shown in its Serial Monitor. The dashboard checks the sensor once per second.</p>
                <form className="sensor-connect-form" onSubmit={connectSensor}>
                  <label className="field">ESP32 endpoint<input type="url" value={sensorUrl} onChange={(event) => setSensorUrl(event.target.value)} placeholder="http://192.168.1.50/api/node" aria-label="ESP32 API endpoint" /></label>
                  {sensorConnected
                    ? <button type="button" className="button button-quiet button-full" onClick={disconnectSensor}>Disconnect sensor</button>
                    : <button type="submit" className="button button-primary button-full">Connect ultrasonic sensor</button>}
                </form>
                {sensorConnected && <div className={`sensor-reading ${sensorError ? "sensor-error" : sensorReading?.breach ? "sensor-breach" : ""}`}>
                  <span>{sensorError ? "CONNECTION ERROR" : sensorReading ? sensorReading.breach ? "OBJECT DETECTED" : "AREA CLEAR" : "CONNECTING…"}</span>
                  <b>{sensorError ? sensorError : sensorReading?.distanceCm != null ? `${sensorReading.distanceCm} cm` : "Waiting for reading"}</b>
                </div>}
                {!sensorConnected && sensorError && <div className="sensor-error-message">{sensorError}</div>}
              </div>
              <div className={`panel security-status ${securityAlert ? "security-status-alert" : ""}`}>
                <div className="eyebrow">SITE SECURITY STATUS</div><div className="security-state">{securityAlert ? "ATTENTION REQUIRED" : "ALL CLEAR"}</div>
                <p>{securityAlert ? "A signal outside the registered team has been detected near Zone B." : "Perimeter nodes are reporting normally. No unregistered movement detected."}</p>
                <button className={`button ${securityAlert ? "button-danger" : "button-quiet"} button-full`} onClick={activateBreach}>{securityAlert ? "Simulate Another Breach" : "Simulate Unregistered Entity Breach"}</button>
              </div>
              <div className="panel protocol-panel">
                <div className="eyebrow">FIELD RESPONSE PROTOCOL</div><h3>Stay calm. Stay together.</h3>
                <ol><li><span>01</span>Secure the artifact storage unit.</li><li><span>02</span>Lock perimeter gates and hold position.</li><li><span>03</span>Rally the team at Base Camp.</li></ol>
                <button className={`button ${broadcast ? "button-green" : "button-primary"} button-full`} onClick={() => { setBroadcast(true); showToast("Safety protocol broadcast to all field devices.", "warning"); }}>{broadcast ? "✓ Protocol broadcast to field" : "▰ Broadcast Safety Protocol"}</button>
              </div>
            </aside>
          </section>
        )}

        {tab === "workbench" && (
          <section className="section-content workbench-section">
            <div className="section-title">
              <div><div className="eyebrow">FIELD IMAGING · FRAGMENT ANALYSIS</div><h1>Reconstruction workbench <span>LAB 02</span></h1><p>Capture, compare, and catalog finds. Confirmed matches are added to today's site log.</p></div>
              <div className="scan-count"><span>CATALOGED TODAY</span><b>{artifacts.length + 8}</b></div>
            </div>
            <div className="workbench-top">
              <div className="panel camera-panel">
                <div className="panel-heading compact"><div><div className="eyebrow">HELMET CAM · FIELD UNIT 04</div><h2>Live camera feed <span className="live-dot">{recording ? "REC" : "PAUSED"}</span></h2></div><span className="signal-bars"><i /><i /><i /><i /></span></div>
                <div className="camera-feed">
                  <div className="camera-grain" />
                  <div className="camera-hud"><span>CAM 04 / FIELD LINK</span><b>{recording ? "● REC 00:14:32" : "Ⅱ PAUSED"}</b></div>
                  <div className="camera-reticle"><i /><i /><i /><i /><span>+</span></div>
                  <div className="camera-object"><div className="pottery-shape"><span /></div><div className="object-caption">FRAGMENT IN VIEW<br />ZONE C · 2.4 M</div></div>
                  <div className="camera-bottom-hud"><span>PITCH <b>+12.4°</b></span><span>ROLL <b>-02.1°</b></span><span>SIGNAL <b>94%</b></span><span>BATTERY <b>87%</b></span></div>
                </div>
                <div className="camera-controls">
                  <button className="button button-quiet" onClick={() => { setSnapshotCount((count) => count + 1); showToast(`Frame ${String(snapshotCount + 1).padStart(3, "0")} saved to field captures.`); }}>◎ Snapshot</button>
                  <button className="button button-quiet" onClick={() => { setScansUploaded((count) => count + 1); showToast(`Scan upload ${String(scansUploaded + 1).padStart(3, "0")} queued for analysis.`); }}>⇧ Upload scan</button>
                  <button className={`button ${recording ? "button-recording" : "button-green"}`} onClick={() => setRecording((value) => !value)}>{recording ? "Ⅱ Pause feed" : "▶ Resume feed"}</button>
                </div>
              </div>
              <div className="panel matcher-panel">
                <div className="panel-heading compact"><div><div className="eyebrow">GEOMETRIC FRACTURE MATCHER</div><h2>Fragment comparison</h2></div><span className="algorithm-status"><i />ALGORITHM READY</span></div>
                <div className="fragment-compare">
                  <div className="fragment-card"><div className="fragment-label">INCOMING FRAGMENT</div><div className="fragment-shape fragment-new"><span>FRAG<br />8902</span></div><b>Unmatched fragment</b><small>Zone C · scanned 10:24 UTC</small></div>
                  <div className="match-bridge"><span>94.2%</span><div>↔</div><small>MATCH</small></div>
                  <div className="fragment-card"><div className="fragment-label">CATALOG CANDIDATE</div><div className="fragment-shape fragment-catalog"><span>FRAG<br />3411</span></div><b>Catalog fragment</b><small>Storage · cataloged 08:17 UTC</small></div>
                </div>
                <div className="confidence-label"><span>GEOMETRIC MATCH CONFIDENCE</span><b>94.2%</b></div>
                <div className="confidence-track"><span /></div>
                <div className="match-metrics"><div><span>CURVE DEVIATION</span><b>0.18 mm</b></div><div><span>EDGE ALIGNMENT</span><b className="text-green">96.8%</b></div><div><span>STITCH POINTS</span><b>24 / 26</b></div></div>
                <div className="stitch-visual"><svg viewBox="0 0 500 56" preserveAspectRatio="none" aria-label="Wireframe edge stitching overlay"><path d="M0 40 C50 34 58 11 107 17 S172 53 230 28 S310 8 355 24 S430 45 500 14" fill="none" stroke="#d4a373" strokeWidth="1.4" strokeDasharray="5 4" /><path d="M0 44 C50 38 58 15 107 21 S172 49 230 32 S310 12 355 28 S430 41 500 18" fill="none" stroke="#00f0ff" strokeWidth="1.3" />{Array.from({ length: 10 }, (_, i) => <circle key={i} cx={i * 55 + 5} cy={34 - Math.sin(i * 1.8) * 13} r="2" fill="#00f0ff" />)}</svg><span>WIRE-FRAME EDGE STITCHING OVERLAY</span></div>
                <button className="button button-primary button-full catalog-button" onClick={catalogArtifact}>◈ &nbsp; Confirm Match & Catalog</button>
              </div>
            </div>
            <div className="panel history-panel">
              <div className="panel-heading compact"><div><div className="eyebrow">FIELD CATALOG · RECENT RESTORATIONS</div><h2>Reconstructed artifact history</h2></div><span className="history-total">{artifacts.length} records</span></div>
              <div className="history-table-wrap"><table className="history-table"><thead><tr><th>ARTIFACT ID</th><th>MATCHED FRAGMENTS</th><th>CLASSIFICATION / TYPE</th><th>CONFIDENCE</th><th>CONFIRMED BY</th><th>TIMESTAMP</th><th>STATUS</th></tr></thead>
                <tbody>{artifacts.map((record) => <tr key={record.id}><td><b>{record.id}</b></td><td>{record.fragments}</td><td>{record.type}</td><td><span className="confidence-value">{record.confidence.toFixed(1)}%</span></td><td>{record.by}</td><td>{record.time}</td><td><span className="status-pill pill-green"><i />CATALOGED</span></td></tr>)}</tbody>
              </table></div>
            </div>
          </section>
        )}

        <footer className="app-footer"><span>APEXDIG FIELD SYSTEMS <i>·</i> BUILD 2.6.04</span><span><i className="footer-online" /> FIELD LINK ACTIVE <i>·</i> DATA SYNCED {utcTime} UTC</span></footer>
      </main>

      {toast && <div className={`toast toast-${toast.kind}`} role="status" key={toast.nonce}><span>{toast.kind === "danger" ? "!" : toast.kind === "warning" ? "♨" : "✓"}</span><div>{toast.message}</div><button onClick={() => setToast(null)} aria-label="Dismiss notification">×</button></div>}

      {modal?.type === "register" && <Modal title="Welcome to the field team" eyebrow="NEW CREW REGISTRATION" onClose={() => setModal(null)}>{registerForm}</Modal>}
      {modal?.type === "offboard" && (() => {
        const worker = workers.find((person) => person.id === modal.id);
        return <Modal title="Offboard this team member?" eyebrow="SAFETY CONFIRMATION" danger onClose={() => setModal(null)}>
          <p className="modal-copy">This removes <b>{worker?.name || "this worker"}</b> from the live crew roster and site map. Their current shift monitoring will end immediately.</p>
          <div className="modal-actions"><button className="button button-quiet" onClick={() => setModal(null)}>Keep on roster</button><button className="button button-danger" onClick={() => offboardWorker(modal.id)}>Offboard Worker</button></div>
        </Modal>;
      })()}
      {modal?.type === "breach" && <Modal title="PERIMETER BREACH DETECTED — ZONE B" eyebrow="IMMEDIATE FIELD RESPONSE" danger onClose={() => setModal(null)} wide>
        <div className="breach-callout"><span className="breach-mark">!</span><p>An unregistered signal was detected at the Zone B boundary. Stay calm, remain with your team, and follow site protocol.</p></div>
        <div className="protocol-list"><div><b>01</b><span><strong>Secure storage unit</strong><small>Lock and verify the artifact storage area.</small></span><i>→</i></div><div><b>02</b><span><strong>Lock perimeter gates</strong><small>Hold position; do not investigate alone.</small></span><i>→</i></div><div><b>03</b><span><strong>Rally at Base Camp</strong><small>Account for your team at the shade station.</small></span><i>→</i></div></div>
        <div className="modal-actions"><button className="button button-quiet" onClick={() => setModal(null)}>Close alert</button><button className={`button ${broadcast ? "button-green" : "button-danger"}`} onClick={() => { setBroadcast(true); showToast("Emergency protocol broadcast. Keep your team together.", "danger"); }}>▰ {broadcast ? "Safety Protocol Broadcast" : "Broadcast Safety Protocol"}</button></div>
      </Modal>}

      {confirmMatch && <div className="confirm-float"><span>◈</span><div><b>Strong fragment match detected</b><small>FRAG-8902 ↔ FRAG-3411 · 94.2% confidence</small></div><button onClick={() => { setTab("workbench"); setConfirmMatch(false); }}>Review match →</button><button className="confirm-close" aria-label="Dismiss match notice" onClick={() => setConfirmMatch(false)}>×</button></div>}
    </div>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
:root{color-scheme:dark;--bg:#141512;--panel:rgba(30,30,26,.88);--line:#393932;--muted:#96958a;--sand:#d4a373;--cyan:#00f0ff;--orange:#ff6b00;--red:#ff2a6d;--green:#10b981}
*{box-sizing:border-box}
.apex-app{min-height:100vh;background:radial-gradient(ellipse at 52% -12%,#38372e 0,transparent 43%),#171815;color:#eee9dd;font-family:'Plus Jakarta Sans',system-ui,sans-serif;position:relative;overflow:hidden;padding-bottom:28px}
.topo-texture{position:absolute;inset:0;pointer-events:none;opacity:.16;background-image:repeating-radial-gradient(ellipse at 10% 10%,transparent 0 36px,rgba(212,163,115,.16) 37px 38px,transparent 39px 57px);mask-image:linear-gradient(to bottom,black,transparent 70%)}
.app-header,.main-shell{position:relative;z-index:1}
.app-header{height:76px;border-bottom:1px solid #37372f;background:rgba(18,19,16,.76);display:flex;align-items:center;justify-content:space-between;padding:0 max(calc((100vw - 1420px)/2),32px);backdrop-filter:blur(16px)}
.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:38px;height:38px;border:1px solid rgba(212,163,115,.65);border-radius:11px;display:grid;place-items:center;color:var(--sand);font-size:25px;background:rgba(212,163,115,.08)}.brand-name{font:500 18px 'DM Mono',monospace;letter-spacing:1.7px;color:#eee9dd}.brand-name span{color:var(--sand)}.brand-caption{font:9px 'DM Mono',monospace;color:#8c8b7e;letter-spacing:1.25px;margin-top:3px}
.header-right{display:flex;align-items:center;gap:27px}.system-badge,.status-pill{font:10px 'DM Mono',monospace;letter-spacing:.55px;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}.system-badge{color:#a9d7b9;border:1px solid rgba(16,185,129,.3);background:rgba(16,185,129,.08);border-radius:99px;padding:8px 12px}.system-badge i,.status-pill i{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 10px rgba(16,185,129,.7)}.system-danger{color:#ff91ad;background:rgba(255,42,109,.1);border-color:rgba(255,42,109,.46);animation:pulseBorder 1.2s infinite}.system-danger i{background:var(--red);box-shadow:0 0 12px var(--red)}
.utc-clock{display:flex;align-items:baseline;gap:8px;font:11px 'DM Mono',monospace;color:var(--muted)}.utc-clock b{color:#eee9dd;font-size:15px;letter-spacing:1px}
.main-shell{max-width:1420px;margin:auto;padding:25px 32px 0}.telemetry-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}.metric-card,.panel{border:1px solid var(--line);border-radius:15px;background:var(--panel);backdrop-filter:blur(12px)}.metric-card{padding:16px 18px 15px;min-height:110px}.metric-top{display:flex;justify-content:space-between;align-items:center;color:#a6a397;font:10px 'DM Mono',monospace;letter-spacing:.75px;text-transform:uppercase}.icon{color:#9c998c}.metric-top .icon{font-size:15px}.metric-value{font:500 27px 'DM Mono',monospace;margin:9px 0 4px;letter-spacing:.3px}.metric-detail{font-size:11px;color:#8d8c80;display:flex;align-items:center;gap:6px}.risk-indicator{width:6px;height:6px;background:var(--orange);border-radius:50%;box-shadow:0 0 8px var(--orange)}
.toolbar{display:flex;justify-content:space-between;align-items:center;margin:23px 0 18px;border-bottom:1px solid #37372f;gap:15px}.tab-nav{display:flex;gap:3px}.tab-button{position:relative;display:flex;align-items:center;gap:8px;border:0;background:transparent;color:#929187;padding:12px 15px 14px;font:500 12px 'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s}.tab-button:hover{color:#eee9dd}.tab-button.active{color:var(--sand)}.tab-button.active:after{position:absolute;content:'';height:2px;bottom:-1px;left:12px;right:12px;background:var(--sand);box-shadow:0 0 10px rgba(212,163,115,.34)}.tab-button .icon{font-size:15px}.tab-alert-dot{width:6px;height:6px;border-radius:50%;background:var(--red);position:absolute;top:9px;right:5px;box-shadow:0 0 8px var(--red)}.toolbar-actions{display:flex;gap:9px;align-items:center}.toolbar-actions select,.field input,.field select{font:11px 'DM Mono',monospace;color:#d5d1c4;background:#22231f;border:1px solid #45453c;border-radius:8px;padding:10px 12px;outline:none}.toolbar-actions select:focus,.field input:focus,.field select:focus{border-color:var(--sand)}.button{border-radius:8px;padding:10px 14px;font:600 11px 'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;border:1px solid transparent;display:inline-flex;align-items:center;justify-content:center;gap:7px}.button:hover{transform:scale(1.01);filter:brightness(1.12)}.button:active{transform:scale(.99)}.button-primary{background:#b87848;color:#17130f;border-color:#d49a6b}.button-quiet{color:#c1beaf;background:rgba(255,255,255,.025);border-color:#46463d}.button-danger{background:rgba(255,42,109,.15);border-color:rgba(255,42,109,.58);color:#ff90ab}.button-green{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.5);color:#71dfb3}.button-recording{background:rgba(255,42,109,.1);border-color:rgba(255,42,109,.35);color:#ff91ad}.button-full{width:100%}.button-grow{flex:1}.reset-button{padding:9px 11px}
.global-alert{display:flex;align-items:center;gap:13px;padding:12px 15px;margin:0 0 16px;border:1px solid rgba(255,42,109,.42);border-radius:11px;background:rgba(90,16,39,.27);animation:alertIn .25s ease-out}.global-alert>div{display:grid;gap:2px;flex:1}.global-alert b{font-size:12px;color:#ff9db5}.global-alert span:not(.alert-pulse){font-size:11px;color:#c9a7af}.global-alert>button{border:0;background:transparent;color:#ff99b2;font-size:11px;font-weight:700;cursor:pointer}.alert-pulse{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:rgba(255,42,109,.2);color:#ff668e;font-weight:800;animation:pulseBorder 1s infinite}.heat-global{border-color:rgba(255,107,0,.42);background:rgba(90,46,13,.24)}.heat-global .alert-pulse{color:#ff9a4c;background:rgba(255,107,0,.18)}.heat-global b,.heat-global>button{color:#ffb276}
.overview-layout{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(290px,.82fr);gap:15px}.panel{padding:18px}.map-panel{position:relative;min-height:485px}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.panel-heading h2{font-size:17px;letter-spacing:-.45px;margin:5px 0 0;font-weight:650}.panel-heading.compact{margin-bottom:12px}.eyebrow{font:9px 'DM Mono',monospace;letter-spacing:1.1px;color:#a7a193}.map-coordinates{text-align:right;color:#88887c;font:9px/1.7 'DM Mono',monospace}.live-dot{font:8px 'DM Mono',monospace;vertical-align:middle;color:#7de0ae;border:1px solid rgba(16,185,129,.3);border-radius:4px;padding:3px 5px;margin-left:5px;letter-spacing:.5px}.live-dot:before{content:'●';font-size:6px;margin-right:4px}
.map-canvas{height:360px;position:relative;overflow:hidden;border:1px solid rgba(212,163,115,.16);border-radius:11px;background:radial-gradient(ellipse at 42% 43%,rgba(96,83,56,.29),transparent 63%),#1e211d}.contours{position:absolute;inset:0;width:100%;height:100%}.zone-label{position:absolute;transform:translate(-8px,-9px);color:var(--zone-color);font:8px 'DM Mono',monospace;letter-spacing:.7px;text-shadow:0 2px 4px #161712;pointer-events:none}.zone-label small{display:block;margin:4px 0 0 13px;font:9px 'Plus Jakarta Sans',sans-serif;color:#c4bdab;letter-spacing:0}.zone-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--zone-color);margin-right:6px;box-shadow:0 0 8px var(--zone-color)}.worker-pin{position:absolute;transform:translate(-50%,-50%);width:30px;height:30px;border:1px solid var(--pin-color);border-radius:50%;padding:0;background:rgba(24,25,21,.9);color:#eee9dd;cursor:pointer;z-index:3;box-shadow:0 0 0 4px color-mix(in srgb,var(--pin-color) 20%,transparent),0 0 17px color-mix(in srgb,var(--pin-color) 30%,transparent);transition:left 2.8s linear,top 2.8s linear,transform .2s}.worker-pin:hover,.worker-pin.selected{transform:translate(-50%,-50%) scale(1.16);z-index:5}.worker-pin span{font:8px 'DM Mono',monospace}.worker-pin.resting{border-style:dashed;animation:restPulse 1.7s infinite}.map-scale{position:absolute;bottom:12px;right:14px;display:flex;align-items:center;gap:5px;font:8px 'DM Mono',monospace;color:#a5a392}.map-scale span{height:1px;width:22px;background:#d4a373}.map-scale span:last-of-type{margin-left:8px}.map-legend{display:flex;align-items:center;gap:18px;padding:14px 2px 0;font-size:10px;color:#a6a397}.map-legend>span{display:flex;align-items:center;gap:6px}.map-legend i{width:7px;height:7px;border-radius:50%;display:inline-block}.map-legend .legend-right{margin-left:auto}.legend-ring{background:transparent!important;border:1px solid #eee9dd;box-shadow:0 0 0 3px rgba(238,233,221,.12)}
.map-worker-popover{position:absolute;z-index:6;right:24px;bottom:56px;width:235px;padding:14px;border:1px solid #5e594c;border-radius:10px;background:rgba(23,24,20,.96);box-shadow:0 10px 32px #0009;display:grid;gap:6px}.map-worker-popover>b{font-size:13px}.map-worker-popover>span,.map-worker-popover small{color:#aaa696;font-size:10px}.map-worker-popover strong{font:12px 'DM Mono',monospace;color:var(--cyan)}.map-worker-popover .text-link{justify-self:start}.popover-close,.icon-button{border:0;background:transparent;color:#a8a596;cursor:pointer}.popover-close{position:absolute;right:10px;top:8px;font-size:19px}.overview-side{display:grid;gap:15px;align-content:start}.field-conditions{padding:18px}.sun-icon{font-size:22px;color:var(--sand)}.condition-row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #393932;padding:11px 0;color:#a9a697;font-size:10px}.condition-row b{color:#e3dece;font:11px 'DM Mono',monospace}.condition-row em{font:8px 'DM Mono',monospace;color:#ff9950;font-style:normal;margin-left:4px}.condition-note{border-radius:8px;background:rgba(212,163,115,.075);padding:10px;color:#b5a992;font-size:10px;line-height:1.6}.zone-panel{padding:18px}.zone-panel>.eyebrow{margin-bottom:12px}.zone-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #393932}.zone-letter{width:27px;height:27px;border:1px solid color-mix(in srgb,var(--zone-color) 55%,transparent);border-radius:8px;display:grid;place-items:center;color:var(--zone-color);font:12px 'DM Mono',monospace}.zone-row>div{display:grid;gap:3px;flex:1}.zone-row b{font-size:10px;font-weight:600}.zone-row small{font-size:9px;color:#989588}.zone-arrow{color:#828174}.zone-panel .button{margin-top:9px}
.section-content{padding:0 0 18px}.section-title{display:flex;justify-content:space-between;align-items:center;gap:20px;margin:25px 0 21px}.section-title h1{font-size:24px;margin:6px 0 5px;letter-spacing:-.7px}.section-title h1 span{font:10px 'DM Mono',monospace;color:#a8a496;border:1px solid #44443b;border-radius:6px;padding:5px 7px;vertical-align:middle;margin-left:5px;letter-spacing:0}.section-title p{font-size:11px;color:#9e9c90;margin:0}.section-title>.button{padding:12px 16px}.section-title>.button b{font-size:16px}.worker-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.worker-card{padding:17px;border:1px solid #3d3d35;border-radius:14px;background:linear-gradient(140deg,rgba(40,40,34,.96),rgba(26,27,23,.94));transition:border .2s}.worker-card:hover{border-color:#65604f}.worker-resting{border-color:rgba(16,185,129,.33)}.worker-card-head{display:flex;align-items:center;gap:11px}.worker-avatar{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--avatar-color);font:11px 'DM Mono',monospace;background:color-mix(in srgb,var(--avatar-color) 12%,#1e1e1a);border:1px solid color-mix(in srgb,var(--avatar-color) 34%,transparent)}.worker-identity{flex:1}.worker-identity h3{font-size:13px;margin:0 0 3px}.worker-identity>span{font-size:10px;color:#9a988b}.status-pill{font-size:8px;border:1px solid rgba(16,185,129,.3);padding:5px 7px;border-radius:99px;color:#8bdcb2;background:rgba(16,185,129,.06)}.status-pill i{width:5px;height:5px}.pill-live{color:#b8d3db;border-color:rgba(0,240,255,.25);background:rgba(0,240,255,.045)}.pill-live i{background:var(--cyan);box-shadow:0 0 8px var(--cyan)}.pill-alert{color:#ff90aa;border-color:rgba(255,42,109,.4);background:rgba(255,42,109,.1)}.pill-alert i{background:var(--red)}.rest-banner{margin:13px 0 -2px;border-radius:6px;padding:7px 9px;background:rgba(16,185,129,.1);color:#79dbb0;font:9px 'DM Mono',monospace;letter-spacing:.3px}.card-location{display:flex;align-items:center;gap:6px;margin:13px 0;color:#b2ae9f;font-size:10px}.mini-dot{width:6px;height:6px;border-radius:50%}.text-link{border:0;background:transparent;color:var(--cyan);font:10px 'Plus Jakarta Sans',sans-serif;cursor:pointer;margin-left:auto}.pulse-block{height:74px;position:relative;border-top:1px solid #3b3b33;border-bottom:1px solid #3b3b33;padding:9px 0}.pulse-title{display:flex;justify-content:space-between;position:relative;z-index:1;font:8px 'DM Mono',monospace;color:#929084;letter-spacing:.7px}.pulse-title b{font:12px 'DM Mono',monospace;color:var(--cyan)}.pulse-title b.text-orange{color:var(--orange)}.pulse-title small{font-size:8px;color:#8f8d81}.sparkline{position:absolute;bottom:6px;left:0;width:100%;height:38px;opacity:.85}.worker-stats{display:grid;grid-template-columns:repeat(3,1fr);padding:13px 0 10px}.worker-stats>div{display:grid;gap:7px;border-right:1px solid #3b3b33;padding-left:13px}.worker-stats>div:first-child{padding-left:0}.worker-stats>div:last-child{border-right:0}.worker-stats span{font:8px 'DM Mono',monospace;letter-spacing:.6px;color:#8e8c80}.worker-stats b{font:13px 'DM Mono',monospace;color:#e5dfd0}.worker-stats small{font-size:8px;color:#929084;font-weight:400}.text-alert{color:var(--red)!important}.text-orange{color:#ff9551!important}.text-green{color:#6be0b0!important}.hydration-track{height:3px;background:#34352e;border-radius:9px;overflow:hidden}.hydration-track span{display:block;height:100%;border-radius:9px;transition:width .4s}.worker-card-actions{display:flex;gap:8px;margin-top:13px}.worker-card-actions .button{padding:9px}.empty-state{text-align:center;padding:70px 20px;border:1px dashed #4b4a40;border-radius:14px;color:#aaa797}.empty-state>div{font-size:30px;color:var(--sand)}.empty-state h2{font-size:17px;color:#e4dece}.empty-state p{font-size:11px;margin-bottom:18px}
.security-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.8fr);gap:15px}.radar-panel{min-height:520px}.radar-wrap{display:grid;place-items:center;height:400px;background:radial-gradient(ellipse at center,rgba(0,240,255,.035),transparent 58%)}.radar-grid{height:min(360px,90vw);width:min(360px,90vw);max-width:100%;aspect-ratio:1;position:relative;border:1px solid rgba(0,240,255,.3);border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 45px,rgba(0,240,255,.13) 46px 47px,transparent 48px 90px),linear-gradient(90deg,transparent calc(50% - .5px),rgba(0,240,255,.12) 50%,transparent calc(50% + .5px)),linear-gradient(0deg,transparent calc(50% - .5px),rgba(0,240,255,.12) 50%,transparent calc(50% + .5px))}.radar-grid:before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0deg,rgba(0,240,255,.17) 39deg,transparent 64deg);animation:radarSweep 7s linear infinite}.radar-grid:after{content:'';position:absolute;inset:13%;border:1px dashed rgba(0,240,255,.14);border-radius:50%}.radar-crosshair{position:absolute;left:50%;top:50%;width:8px;height:8px;background:var(--cyan);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 14px var(--cyan)}.radar-node{position:absolute;z-index:2;transform:translate(-50%,-50%);display:flex;align-items:center;gap:4px;white-space:nowrap;color:#80b9b8;font:7px 'DM Mono',monospace}.radar-node i{width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 7px var(--green)}.radar-node.node-alert{color:#ff90aa}.radar-node.node-alert i{background:var(--red);box-shadow:0 0 9px var(--red);animation:restPulse 1s infinite}.radar-breach{filter:drop-shadow(0 0 5px rgba(255,42,109,.3))}.radar-blip{position:absolute;left:72%;top:30%;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:var(--red);color:white;font-weight:800;box-shadow:0 0 0 8px rgba(255,42,109,.15);animation:restPulse .8s infinite}.radar-footer{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #393932;padding-top:12px;color:#929084;font:8px 'DM Mono',monospace}.radar-footer span{display:flex;align-items:center;gap:5px}.node-key{display:inline-block;width:6px;height:6px;border-radius:50%}.node-ok{background:var(--green)}.node-warn{background:var(--red)}.security-side{display:grid;gap:15px;align-content:start}.sensor-connection-panel h3{font-size:13px;margin:9px 0 6px}.sensor-connection-panel>p{font-size:10px;line-height:1.55;color:#aaa696;margin:0 0 12px}.sensor-connect-form{display:grid;gap:9px}.sensor-connect-form .field input{font-size:10px}.sensor-reading{display:grid;gap:5px;margin-top:10px;padding:9px 10px;border-radius:7px;border:1px solid rgba(16,185,129,.25);background:rgba(16,185,129,.06)}.sensor-reading>span{font:8px 'DM Mono',monospace;color:#70dbaa}.sensor-reading>b{font:11px 'DM Mono',monospace;color:#e2dccb;overflow-wrap:anywhere}.sensor-reading.sensor-breach{border-color:rgba(255,42,109,.45);background:rgba(255,42,109,.08)}.sensor-reading.sensor-breach>span,.sensor-reading.sensor-error>span,.sensor-error-message{color:#ff91aa}.sensor-error-message{font-size:10px;margin-top:9px}.security-status{padding:20px}.security-status .eyebrow{margin-bottom:12px}.security-state{font:500 23px 'DM Mono',monospace;color:#75d9aa}.security-status-alert .security-state{color:var(--red);animation:pulseBorder 1s infinite}.security-status p{font-size:11px;line-height:1.6;color:#aaa696;margin:10px 0 17px}.protocol-panel h3{font-size:15px;margin:8px 0 13px}.protocol-panel ol{list-style:none;padding:0;margin:0 0 17px}.protocol-panel li{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #3b3b33;color:#d6d1c2;font-size:10px}.protocol-panel li span{font:9px 'DM Mono',monospace;color:#ff896f}.protocol-panel li:first-child{border-top:0}.protocol-panel .button{font-size:10px}
.scan-count{display:grid;text-align:right;gap:4px}.scan-count span{font:8px 'DM Mono',monospace;color:#999689;letter-spacing:.8px}.scan-count b{font:20px 'DM Mono',monospace;color:var(--sand)}.workbench-top{display:grid;grid-template-columns:minmax(320px,.85fr) minmax(0,1.3fr);gap:15px}.camera-panel,.matcher-panel{padding:16px}.camera-panel .panel-heading h2{font-size:14px}.signal-bars{display:flex;gap:3px;align-items:flex-end;height:15px}.signal-bars i{display:block;width:3px;background:var(--green);border-radius:2px}.signal-bars i:nth-child(1){height:5px}.signal-bars i:nth-child(2){height:8px}.signal-bars i:nth-child(3){height:11px}.signal-bars i:nth-child(4){height:14px}.camera-feed{height:244px;position:relative;overflow:hidden;border:1px solid rgba(0,240,255,.18);border-radius:8px;background:radial-gradient(ellipse at 50% 65%,#61523c 0,#35352b 24%,#20231f 67%,#141713 100%)}.camera-feed:before{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,240,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.035) 1px,transparent 1px);background-size:18px 18px;opacity:.7}.camera-grain{position:absolute;inset:0;opacity:.1;background:repeating-linear-gradient(0deg,transparent 0 3px,#fff 4px,transparent 5px);pointer-events:none}.camera-hud,.camera-bottom-hud{position:absolute;z-index:2;left:10px;right:10px;display:flex;justify-content:space-between;color:#bde4d5;font:8px 'DM Mono',monospace;text-shadow:0 1px 3px #000}.camera-hud{top:10px}.camera-hud b{color:#ff789a}.camera-bottom-hud{bottom:9px;gap:6px}.camera-bottom-hud b{color:#e2d8b9}.camera-reticle{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:68px;height:68px;color:var(--cyan);opacity:.75}.camera-reticle i{position:absolute;width:11px;height:11px;border-color:var(--cyan);border-style:solid}.camera-reticle i:nth-child(1){left:0;top:0;border-width:1px 0 0 1px}.camera-reticle i:nth-child(2){right:0;top:0;border-width:1px 1px 0 0}.camera-reticle i:nth-child(3){left:0;bottom:0;border-width:0 0 1px 1px}.camera-reticle i:nth-child(4){right:0;bottom:0;border-width:0 1px 1px 0}.camera-reticle span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:18px 'DM Mono',monospace}.camera-object{position:absolute;left:50%;top:53%;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:8px}.pottery-shape{position:relative;width:69px;height:84px;border-radius:22px 22px 28px 28px/18px 18px 14px 14px;background:linear-gradient(90deg,#6b4937,#bb8254 35%,#8d5c3d 65%,#654632);clip-path:polygon(22% 0,78% 0,88% 13%,82% 27%,100% 76%,88% 100%,12% 100%,0 76%,18% 27%,12% 13%);box-shadow:0 0 20px #000}.pottery-shape:after{content:'';position:absolute;left:10px;right:10px;top:38px;height:2px;background:#d5a271;box-shadow:0 6px 0 rgba(212,163,115,.6)}.pottery-shape span{position:absolute;left:17px;top:12px;width:35px;height:45px;border:1px dashed rgba(0,240,255,.75);border-radius:40%}.object-caption{text-align:center;color:#c9b89e;font:7px/1.5 'DM Mono',monospace}.camera-controls{display:flex;gap:7px;margin-top:11px}.camera-controls .button{flex:1;padding:8px 5px;font-size:9px}.algorithm-status{font:8px 'DM Mono',monospace;color:#75dcad}.algorithm-status i{display:inline-block;width:5px;height:5px;background:var(--green);border-radius:50%;margin-right:5px;box-shadow:0 0 7px var(--green)}.fragment-compare{display:grid;grid-template-columns:1fr 65px 1fr;align-items:center;gap:8px;padding:9px 0 13px}.fragment-card{display:grid;justify-items:center;gap:6px}.fragment-label{font:7px 'DM Mono',monospace;letter-spacing:.45px;color:#999689;text-align:center}.fragment-shape{height:80px;width:89px;display:grid;place-items:center;clip-path:polygon(15% 8%,69% 0,90% 19%,79% 42%,100% 68%,74% 93%,40% 80%,13% 100%,0 61%,18% 39%);font:8px/1.45 'DM Mono',monospace;text-align:center}.fragment-new{background:linear-gradient(135deg,#a97c53,#55402f 52%,#bb8a5a);color:#ead2b1;border:1px dashed var(--sand)}.fragment-catalog{background:linear-gradient(130deg,#7d644d,#bc946c 48%,#574432);color:#eee0c9;transform:scaleX(-1)}.fragment-catalog span{transform:scaleX(-1)}.fragment-card>b{font-size:9px;color:#d7d1c3}.fragment-card>small{font-size:8px;color:#8d8b80;text-align:center}.match-bridge{text-align:center;color:var(--cyan)}.match-bridge span{font:12px 'DM Mono',monospace}.match-bridge div{font-size:20px;margin:2px}.match-bridge small{font:7px 'DM Mono',monospace;color:#969588}.confidence-label{display:flex;justify-content:space-between;color:#9d9a8e;font:8px 'DM Mono',monospace;letter-spacing:.6px}.confidence-label b{font-size:12px;color:var(--cyan)}.confidence-track{height:5px;background:#3a3a32;border-radius:8px;margin:6px 0 12px}.confidence-track span{display:block;width:94.2%;height:100%;border-radius:8px;background:linear-gradient(90deg,#7a7c59,var(--cyan));box-shadow:0 0 8px rgba(0,240,255,.4)}.match-metrics{display:grid;grid-template-columns:repeat(3,1fr);padding-bottom:10px;border-bottom:1px solid #3b3b33}.match-metrics>div{display:grid;gap:6px;border-right:1px solid #3b3b33;padding-left:10px}.match-metrics>div:first-child{padding-left:0}.match-metrics>div:last-child{border:0}.match-metrics span{font:7px 'DM Mono',monospace;color:#8f8d81;letter-spacing:.4px}.match-metrics b{font:10px 'DM Mono',monospace}.stitch-visual{height:57px;position:relative;margin:8px 0 7px;background:linear-gradient(180deg,rgba(0,240,255,.03),transparent);border-radius:5px;overflow:hidden}.stitch-visual svg{width:100%;height:45px}.stitch-visual span{position:absolute;bottom:3px;left:0;font:6px 'DM Mono',monospace;color:#87867b;letter-spacing:.6px}.catalog-button{padding:11px}.history-panel{margin-top:15px;padding:16px 18px}.history-panel .panel-heading h2{font-size:14px}.history-total{font:9px 'DM Mono',monospace;color:#9e9b8e}.history-table-wrap{overflow-x:auto}.history-table{width:100%;border-collapse:collapse;min-width:870px}.history-table th{text-align:left;color:#858478;font:8px 'DM Mono',monospace;letter-spacing:.5px;padding:10px 9px;border-top:1px solid #3b3b33;border-bottom:1px solid #3b3b33}.history-table td{padding:11px 9px;border-bottom:1px solid rgba(59,59,51,.65);font-size:9px;color:#b6b1a2;white-space:nowrap}.history-table td:first-child b{font:9px 'DM Mono',monospace;color:#e2d9c7}.history-table tr:last-child td{border-bottom:0}.confidence-value{font:10px 'DM Mono',monospace;color:var(--cyan)}
.app-footer{display:flex;justify-content:space-between;padding:22px 2px 0;color:#77766b;font:8px 'DM Mono',monospace;letter-spacing:.55px}.app-footer i{font-style:normal;color:#514f45;margin:0 5px}.footer-online{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--green);margin-right:4px!important;box-shadow:0 0 6px var(--green)}
.toast{position:fixed;z-index:30;right:24px;bottom:24px;max-width:min(420px,calc(100vw - 32px));display:flex;align-items:center;gap:11px;padding:13px 14px;border-radius:11px;border:1px solid rgba(16,185,129,.4);background:rgba(27,31,26,.97);box-shadow:0 12px 38px #0009;animation:toastIn .24s ease-out}.toast>span{width:24px;height:24px;border-radius:50%;background:rgba(16,185,129,.14);display:grid;place-items:center;color:#70dfae;font-weight:800;flex:none}.toast div{font-size:11px;line-height:1.45;color:#e3decf}.toast button{border:0;background:transparent;color:#969487;font-size:18px;cursor:pointer;margin-left:5px}.toast-warning{border-color:rgba(255,107,0,.5)}.toast-warning>span{background:rgba(255,107,0,.16);color:#ffad6d}.toast-danger{border-color:rgba(255,42,109,.5)}.toast-danger>span{background:rgba(255,42,109,.16);color:#ff83a1}
.modal-backdrop{position:fixed;z-index:20;inset:0;background:rgba(5,6,5,.76);backdrop-filter:blur(7px);display:grid;place-items:center;padding:20px;animation:fadeIn .15s ease-out}.modal{width:min(520px,100%);max-height:90vh;overflow:auto;padding:22px;border:1px solid #514c40;border-radius:16px;background:#20211d;box-shadow:0 22px 80px #000b}.modal-wide{width:min(610px,100%)}.modal-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.modal-head h2{font-size:19px;line-height:1.35;margin:7px 0 0;letter-spacing:-.35px}.icon-button{font-size:24px;line-height:1;padding:0 2px}.modal-copy{font-size:12px;line-height:1.7;color:#b2ae9f}.modal-copy b{color:#eee9dd}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{display:grid;gap:7px;color:#a9a596;font:9px 'DM Mono',monospace;letter-spacing:.45px}.field-full{grid-column:1/-1}.field input,.field select{font:11px 'Plus Jakarta Sans',sans-serif;width:100%;padding:11px}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:17px}.modal-actions .button{min-width:110px}.breach-callout{display:flex;align-items:center;gap:13px;padding:12px;border:1px solid rgba(255,42,109,.3);border-radius:9px;background:rgba(255,42,109,.07)}.breach-mark{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(255,42,109,.18);color:var(--red);font-weight:800;font-size:18px;flex:none}.breach-callout p{font-size:11px;line-height:1.6;color:#d1b7bf;margin:0}.protocol-list{margin:14px 0}.protocol-list>div{display:flex;align-items:center;gap:12px;padding:13px 5px;border-bottom:1px solid #3b3b33}.protocol-list>div>b{font:10px 'DM Mono',monospace;color:#ff7d9c}.protocol-list>div>span{display:grid;gap:4px;flex:1}.protocol-list strong{font-size:11px}.protocol-list small{font-size:10px;color:#9f9b8f}.protocol-list>div>i{color:#ff7d9c;font-style:normal}.confirm-float{position:fixed;z-index:12;bottom:22px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid rgba(0,240,255,.4);border-radius:12px;background:rgba(22,28,28,.97);box-shadow:0 10px 30px #0008;max-width:calc(100vw - 32px)}.confirm-float>span{font-size:19px;color:var(--cyan)}.confirm-float>div{display:grid;gap:3px;white-space:nowrap}.confirm-float b{font-size:10px}.confirm-float small{font-size:9px;color:#aaa99d}.confirm-float>button:not(.confirm-close){border:0;background:transparent;color:var(--cyan);font:10px 'Plus Jakarta Sans',sans-serif;cursor:pointer;white-space:nowrap}.confirm-float .confirm-close{border:0;background:transparent;color:#999;font-size:17px;cursor:pointer}
@keyframes radarSweep{to{transform:rotate(360deg)}}@keyframes restPulse{50%{box-shadow:0 0 0 8px rgba(16,185,129,.04);opacity:.7}}@keyframes pulseBorder{50%{opacity:.65}}@keyframes toastIn{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes alertIn{from{transform:translateY(-4px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@media(max-width:1000px){.main-shell{padding-left:20px;padding-right:20px}.app-header{padding:0 20px}.overview-layout{grid-template-columns:1fr}.overview-side{grid-template-columns:1fr 1fr}.workbench-top{grid-template-columns:1fr}.camera-feed{height:280px}.security-layout{grid-template-columns:1fr}.radar-panel{min-height:auto}.radar-wrap{height:360px}}
@media(max-width:700px){.app-header{height:66px;padding:0 14px}.brand-caption{font-size:7px}.brand-mark{width:34px;height:34px}.header-right{gap:10px}.system-badge{font-size:0;padding:9px}.system-badge i{width:8px;height:8px}.utc-clock{gap:4px}.utc-clock b{font-size:12px}.main-shell{padding:16px 13px 0}.telemetry-grid{grid-template-columns:repeat(2,1fr);gap:8px}.metric-card{min-height:98px;padding:12px}.metric-value{font-size:22px}.metric-top{font-size:8px}.toolbar{align-items:flex-start;flex-direction:column;margin:15px 0 13px;padding-bottom:12px}.tab-nav{width:100%;justify-content:space-between;overflow-x:auto}.tab-button{padding:10px 7px 12px;font-size:10px;gap:5px;white-space:nowrap}.toolbar-actions{width:100%}.toolbar-actions select{flex:1}.reset-button{white-space:nowrap}.overview-side{grid-template-columns:1fr}.map-panel{padding:13px;min-height:450px}.map-canvas{height:330px}.zone-label{font-size:7px}.zone-label small{font-size:8px}.map-legend{gap:9px;font-size:8px;flex-wrap:wrap}.map-legend .legend-right{margin-left:0}.section-title{align-items:flex-start;flex-direction:column;margin:20px 0 16px}.section-title h1{font-size:20px}.section-title>.button{width:100%}.worker-grid{grid-template-columns:1fr}.security-layout{grid-template-columns:minmax(0,1fr)}.radar-panel{padding:13px}.radar-wrap{height:320px}.radar-grid{width:min(300px,82vw)}.radar-footer{font-size:7px;flex-wrap:wrap}.workbench-top{grid-template-columns:minmax(0,1fr)}.camera-panel,.matcher-panel{padding:12px}.camera-feed{height:245px}.fragment-compare{grid-template-columns:1fr 48px 1fr}.fragment-shape{width:72px;height:69px}.fragment-label{font-size:6px}.fragment-card>b{font-size:8px}.fragment-card>small{font-size:7px}.section-title .scan-count{position:absolute;right:14px;margin-top:2px}.section-title:has(.scan-count){padding-right:80px}.app-footer{flex-direction:column;gap:8px;font-size:7px}.global-alert{align-items:flex-start;flex-wrap:wrap}.global-alert>button{margin-left:40px}.confirm-float{left:12px;right:12px;transform:none;gap:8px}.confirm-float>div{white-space:normal;flex:1}.confirm-float small{font-size:8px}.confirm-float>button:not(.confirm-close){font-size:9px}.form-grid{grid-template-columns:1fr}.field-full{grid-column:auto}.modal{padding:18px}.modal-actions{flex-wrap:wrap}.modal-actions .button{flex:1}.history-panel{padding:13px}.toast{right:12px;bottom:12px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
`;
