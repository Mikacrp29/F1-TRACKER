import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GARAGES, PANO, IW, IH } from "./config";
import "./paddock.css";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
};
const tf = ({ S, tx, ty }) => `translate3d(${tx}px, ${ty}px, 0) scale(${S})`;
const EASE_OUT = "cubic-bezier(.2,.7,.2,1)";
const EASE_IN = "cubic-bezier(.55,0,.8,.4)";
const EASE_IO = "cubic-bezier(.6,0,.2,1)";
const CX = 727; // centre horizontal d'une photo de garage
const CY = 360;

// position du panorama (0..1) qui centre un garage
function panFor(g, vw, vh) {
  const Sc = Math.max(vw / IW, vh / IH);
  const range = IW * Sc - vw;
  if (range < 24) return 0.5;
  return clamp(((g.hot.x + g.hot.w / 2) * Sc - vw / 2) / range, 0, 1);
}

// Paddock en photos : panorama + 5 garages, caméra animée. Les pages réelles de l'app s'affichent sur l'écran du garage.
export default function Paddock({ children, onNavigate, introDone, alertActive, statusLabel }) {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [phase, setPhase] = useState("pano"); // pano | pre | entering | garage | screen | leaving1 | leaving2
  const [cur, setCur] = useState(null);
  const [pan, setPan] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [settled, setSettled] = useState(false);
  const [gyro, setGyro] = useState(false); // mode "inclinez le téléphone"
  const gBase = useRef(null);
  const touchDev = useMemo(() => {
    try { return window.matchMedia("(pointer: coarse)").matches && "DeviceOrientationEvent" in window; } catch (e) { return false; }
  }, []);

  const rootRef = useRef(null);
  const drag = useRef(null);
  const moved = useRef(0);
  const timers = useRef([]);
  const pendingLeave = useRef(false);
  const preloaded = useRef({});
  const phaseRef = useRef("pano");
  phaseRef.current = phase;
  const curRef = useRef(null);
  curRef.current = cur;
  const panRef = useRef(0.5);
  panRef.current = pan;
  const vpRef = useRef(vp);
  vpRef.current = vp;

  const reduce = useMemo(reduceMotion, []);
  const k = reduce ? 0.01 : 1;
  const D = (s) => `${(s * k).toFixed(2)}s`;

  const later = useCallback((fn, s) => { timers.current.push(setTimeout(fn, s * 1000 * k)); }, [k]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // pré-chargement des photos des garages (sans gêner l'affichage)
  const preload = useCallback((g) => {
    if (preloaded.current[g.id]) return;
    preloaded.current[g.id] = true;
    const im = new Image();
    im.src = g.img;
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => GARAGES.forEach(preload), 1200);
    return () => clearTimeout(t);
  }, [loaded, preload]);

  // révélation du paddock quand l'intro est terminée
  useEffect(() => {
    if (!introDone || !loaded || revealed) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
    return () => cancelAnimationFrame(r);
  }, [introDone, loaded, revealed]);
  useEffect(() => {
    if (!revealed) return;
    later(() => setSettled(true), 2.8);
  }, [revealed, later]);

  /* ── machine d'états de la caméra ── */
  const startLeave = useCallback(() => {
    if (!curRef.current) return;
    const g = GARAGES.find((x) => x.id === curRef.current);
    const fromScreen = phaseRef.current === "screen";
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("leaving1");
    later(() => {
      setPan(panFor(g, vpRef.current.w, vpRef.current.h)); // on ressort en face du garage quitté
      setPhase("leaving2");
      later(() => { setPhase("pano"); setCur(null); }, 1.1);
    }, fromScreen ? 0.6 : 0.2);
  }, [later]);

  const enter = (g) => {
    if (phaseRef.current !== "pano" || !revealed) return;
    try { window.history.pushState({ pdk: g.id }, ""); } catch (e) { /* ignore */ }
    pendingLeave.current = false;
    setCur(g.id);
    onNavigate(g.page);
    setPhase("pre");
  };

  useEffect(() => {
    if (phase !== "pre") return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPhase("entering")); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [phase]);
  useEffect(() => {
    if (phase === "entering") later(() => setPhase("garage"), 1.05);
  }, [phase, later]);
  useEffect(() => {
    if (phase !== "garage") return;
    if (pendingLeave.current) { pendingLeave.current = false; startLeave(); return; }
    later(() => setPhase("screen"), 0.45);
  }, [phase, later, startLeave]);

  // retour au paddock : bouton retour du navigateur, Échap, ou le logo en haut à gauche
  const leave = useCallback(() => {
    if (!curRef.current) return;
    try { window.history.back(); } catch (e) { startLeave(); }
  }, [startLeave]);

  const step = useCallback((dir) => {
    if (phaseRef.current !== "pano") return;
    const { w, h } = vpRef.current;
    const targets = GARAGES.map((g) => panFor(g, w, h));
    let best = 0;
    targets.forEach((t, i) => { if (Math.abs(t - panRef.current) < Math.abs(targets[best] - panRef.current)) best = i; });
    setPan(targets[clamp(best + dir, 0, targets.length - 1)]);
  }, []);

  useEffect(() => {
    const onPop = () => {
      const p = phaseRef.current;
      if (!curRef.current) return;
      if (p === "garage" || p === "screen") startLeave();
      else if (p === "pre" || p === "entering") pendingLeave.current = true;
    };
    const onKey = (e) => {
      if (e.key === "Escape") leave();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [leave, step, startLeave]);

  /* ── gyroscope : incliner le téléphone à gauche / à droite fait glisser le panorama ── */
  useEffect(() => {
    if (!touchDev) return;
    try {
      const DOE = window.DeviceOrientationEvent;
      const needsAsk = DOE && typeof DOE.requestPermission === "function"; // iPhone : il faut un toucher pour autoriser
      if (localStorage.getItem("pdk-gyro") === "1" && !needsAsk) setGyro(true);
    } catch (e) { /* ignore */ }
  }, [touchDev]);
  useEffect(() => {
    if (!gyro) return;
    const RANGE = 40; // ±20° d'inclinaison = tout le panorama
    let smooth = null;
    const onOri = (e) => {
      if (phaseRef.current !== "pano" || drag.current || e.gamma == null || window.innerHeight < window.innerWidth) {
        gBase.current = null; // on se recalera à la reprise
        return;
      }
      const tilt = clamp(e.gamma, -45, 45);
      smooth = smooth === null ? tilt : smooth + (tilt - smooth) * 0.15;
      if (gBase.current === null) gBase.current = smooth + (panRef.current - 0.5) * RANGE;
      const next = clamp(0.5 - (smooth - gBase.current) / RANGE, 0, 1); // sens inversé : incliner à droite = aller à droite
      if (Math.abs(next - panRef.current) > 0.002) setPan(next);
    };
    window.addEventListener("deviceorientation", onOri);
    return () => window.removeEventListener("deviceorientation", onOri);
  }, [gyro]);

  // image introuvable : on laisse le filet de sécurité (PaddockBoundary) revenir à l'interface classique
  if (failed) throw new Error("Images du paddock introuvables (public/paddock)");

  /* ── géométrie de la caméra ── */
  const { w: vw, h: vh } = vp;
  const Sc = Math.max(vw / IW, vh / IH);
  const dw = IW * Sc;
  const canPan = dw - vw > 24;
  const portrait = vw / vh < 0.9;
  const g = GARAGES.find((x) => x.id === cur) || null;
  const clampT = (tx, ty, S) => [clamp(tx, Math.min(0, vw - IW * S), 0), clamp(ty, Math.min(0, vh - IH * S), 0)];

  const panoT = { S: Sc, tx: canPan ? -(dw - vw) * pan : (vw - dw) / 2, ty: (vh - IH * Sc) / 2 };
  const panoIntro = (() => { const S = Sc * 1.18; return { S, tx: vw / 2 - CX * S, ty: vh / 2 - CY * S }; })();

  let hotZ = panoT;
  let gFit = panoT;
  let gEnter = panoT;
  let gScreen = panoT;
  let panelW = 0, panelH = 0, panelTop = 0;
  if (g) {
    const Sz = Math.min(5.2, (910 / g.hot.w) * Sc); // le garage du panorama a la même taille que sur sa photo
    const hcx = g.hot.x + g.hot.w / 2;
    const hcy = g.hot.y + g.hot.h / 2;
    const [hx, hy] = clampT(vw / 2 - hcx * Sz, vh / 2 - hcy * Sz, Sz);
    hotZ = { S: Sz, tx: hx, ty: hy };
    const [fx, fy] = clampT(vw / 2 - CX * Sc, (vh - IH * Sc) / 2, Sc);
    gFit = { S: Sc, tx: fx, ty: fy };
    const Se = Sc * 1.12;
    const [ex, ey] = clampT(vw / 2 - CX * Se, vh / 2 - CY * Se, Se);
    gEnter = { S: Se, tx: ex, ty: ey };
    panelW = portrait ? vw * 0.94 : Math.min(vw * 0.9, 720);
    panelH = portrait ? Math.min(vh * 0.76, 660) : Math.min(vh * 0.8, 560);
    panelTop = (vh - panelH) / 2;
    const Ss = Math.max(Sc, panelW / g.tv.w); // l'écran du garage occupe la largeur du panneau
    const [sx, sy] = clampT(vw / 2 - (g.tv.x + g.tv.w / 2) * Ss, panelTop - g.tv.y * Ss, Ss);
    gScreen = { S: Ss, tx: sx, ty: sy };
  }

  /* ── styles des couches selon la phase ── */
  const zoomed = phase === "entering" || phase === "garage" || phase === "screen" || phase === "leaving1";
  let panoStyle;
  if (!revealed) {
    panoStyle = { transform: tf(panoIntro), opacity: 0, filter: "blur(8px)", transition: "none" };
  } else if (phase === "leaving2") {
    panoStyle = { transform: tf(panoT), opacity: 1, transition: `transform ${D(1.1)} ${EASE_OUT}, opacity ${D(0.55)} ease` };
  } else if (zoomed) {
    panoStyle = { transform: tf(hotZ), opacity: 0, transition: `transform ${D(1.15)} ${EASE_IN}, opacity ${D(0.5)} ease ${D(0.6)}` };
  } else if (phase === "pre") {
    panoStyle = { transform: tf(panoT), opacity: 1, transition: "none" };
  } else {
    panoStyle = {
      transform: tf(panoT), opacity: 1, filter: "none",
      transition: !settled ? `transform ${D(2.6)} ${EASE_OUT}, opacity ${D(1.4)} ease, filter ${D(2)} ease` : dragging ? "none" : `transform ${D(0.45)} ${EASE_OUT}`,
    };
  }

  const normalAlert = g && g.id === "alerts" && !alertActive; // rouge seulement s'il y a une vraie alerte
  const baseFilter = normalAlert ? "saturate(.1) brightness(1.04)" : "";
  const withBlur = (b) => [baseFilter, b].filter(Boolean).join(" ") || "none";
  let garageStyle = null;
  if (g) {
    if (phase === "pre") garageStyle = { transform: tf(gEnter), opacity: 0, filter: withBlur(""), transition: "none" };
    else if (phase === "entering" || phase === "garage") garageStyle = { transform: tf(gFit), opacity: 1, filter: withBlur(""), transition: `transform ${D(1.4)} ${EASE_OUT} ${D(0.45)}, opacity ${D(0.6)} ease ${D(0.6)}` };
    else if (phase === "screen") garageStyle = { transform: tf(gScreen), opacity: 1, filter: withBlur("blur(2.5px) brightness(.55)"), transition: `transform ${D(0.95)} ${EASE_IO}, filter ${D(0.9)} ease` };
    else if (phase === "leaving1") garageStyle = { transform: tf(gFit), opacity: 1, filter: withBlur(""), transition: `transform ${D(0.6)} ${EASE_IO}, filter ${D(0.5)} ease` };
    else garageStyle = { transform: tf(gEnter), opacity: 0, filter: withBlur(""), transition: `transform ${D(1.1)} ${EASE_OUT}, opacity ${D(0.55)} ease` };
  }

  /* ── interactions ── */
  const onPointerDown = (e) => {
    moved.current = 0;
    if (phaseRef.current !== "pano" || !canPan) return;
    drag.current = { x: e.clientX, pan: panRef.current };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      moved.current = Math.max(moved.current, Math.abs(dx));
      setPan(clamp(d.pan - dx / (dw - vw), 0, 1));
    }
    if (e.pointerType === "mouse" && rootRef.current) {
      rootRef.current.style.setProperty("--px", (e.clientX / vw - 0.5).toFixed(3));
      rootRef.current.style.setProperty("--py", (e.clientY / vh - 0.5).toFixed(3));
    }
  };
  const endDrag = () => { drag.current = null; setDragging(false); };
  const onWheel = (e) => {
    if (phaseRef.current !== "pano" || !canPan) return;
    const dd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    setPan((p) => clamp(p + dd / (dw - vw), 0, 1));
  };
  const stop = (e) => e.stopPropagation();
  const toggleGyro = async () => {
    if (gyro) {
      setGyro(false);
      try { localStorage.setItem("pdk-gyro", "0"); } catch (e) { /* ignore */ }
      return;
    }
    try {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        const r = await DOE.requestPermission(); // iPhone : fenêtre d'autorisation
        if (r !== "granted") return;
      }
      gBase.current = null;
      setGyro(true);
      try { localStorage.setItem("pdk-gyro", "1"); } catch (e) { /* ignore */ }
    } catch (e) { /* refusé ou non supporté */ }
  };

  const inGarage = phase === "garage" || phase === "screen";
  const showHud = introDone && revealed;
  const tone = g && g.id === "alerts" && alertActive ? "pdk-red" : "pdk-green";

  return (
    <div
      ref={rootRef}
      className={`pdk-root${phase !== "pano" ? " still" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
    >
      <div className="pdk-par">
        <div className="pdk-drift">
          {/* panorama de la voie des stands + zones cliquables */}
          <div className="pdk-layer" style={{ width: IW, height: IH, ...panoStyle }}>
            <img src={PANO} width={IW} height={IH} alt="" draggable={false} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
            {GARAGES.map((x) => (
              <button
                key={x.id}
                type="button"
                className={`pdk-hot${x.id === "alerts" && alertActive ? " alarm" : ""}`}
                style={{ left: x.hot.x, top: x.hot.y, width: x.hot.w, height: x.hot.h }}
                aria-label={`Entrer dans ${x.label}`}
                tabIndex={phase === "pano" ? 0 : -1}
                onMouseEnter={() => preload(x)}
                onPointerDown={() => preload(x)}
                onClick={() => { if (moved.current > 8) return; enter(x); }}
              >
                <span className="pdk-hot-chip">ENTRER ›</span>
              </button>
            ))}
          </div>

          {/* photo du garage choisi */}
          {g && (
            <div className="pdk-layer" style={{ width: IW, height: IH, ...garageStyle }}>
              <img src={g.img} width={IW} height={IH} alt="" draggable={false} decoding="async" />
              {g.id === "alerts" && alertActive && <div className="pdk-alarm" />}
            </div>
          )}
        </div>
      </div>
      <div className="pdk-vig" />

      {/* page réelle de l'application, posée sur l'écran du garage */}
      {phase === "screen" && g && (
        <div className={`pdk-screen panel ${tone}`} style={{ width: panelW, height: panelH, left: (vw - panelW) / 2, top: panelTop, animationDelay: D(0.55) }}>
          <div className="pdk-bar">
            <span className="pdk-led" />
            {g.label}
          </div>
          <div className="pdk-body">
            <div className="inner">{children}</div>
          </div>
        </div>
      )}

      {showHud && (
        <>
          <div className="pdk-hud">
            <button type="button" className={`pdk-brand${inGarage ? " back" : ""}`} onPointerDown={stop} onClick={inGarage ? leave : undefined} aria-label={inGarage ? "Retour au paddock" : "F1 Tracker"}>
              {inGarage ? <span className="pdk-back">‹ PADDOCK</span> : <span className="pdk-dot" />}
              <span>
                F1 <b>TRACKER</b>
              </span>
            </button>
            <span className="pdk-status">{statusLabel}</span>
          </div>
          {phase === "pano" && canPan && (
            <>
              <button type="button" className="pdk-arrow l" onPointerDown={stop} onClick={() => step(-1)} aria-label="Garage précédent">‹</button>
              <button type="button" className="pdk-arrow r" onPointerDown={stop} onClick={() => step(1)} aria-label="Garage suivant">›</button>
            </>
          )}
          {phase === "pano" && canPan && touchDev && (
            <button type="button" className={`pdk-gyro${gyro ? " on" : ""}`} onPointerDown={stop} onClick={toggleGyro} aria-pressed={gyro} aria-label="Incliner le téléphone pour se déplacer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(-18 12 12)" />
                <path d="M3 12h2M19 12h2" />
              </svg>
            </button>
          )}
          {phase === "pano" && <div className="pdk-hint">{canPan ? "Glissez pour parcourir · touchez un garage" : "Touchez un garage"}</div>}
        </>
      )}
    </div>
  );
}
