import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GARAGES, PANO, PW, PH, GW, GH } from "./config";
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

// pose du panorama pour une position de défilement `pan` (0..1)
function panoPose(vw, vh, pan) {
  const Sc = Math.max(vw / PW, vh / PH);
  const dw = PW * Sc;
  return { S: Sc, tx: dw - vw > 24 ? -(dw - vw) * pan : (vw - dw) / 2, ty: (vh - PH * Sc) / 2 };
}

// position du panorama (0..1) qui centre un garage
function panFor(g, vw, vh) {
  const Sc = Math.max(vw / PW, vh / PH);
  const range = PW * Sc - vw;
  if (range < 24) return 0.5;
  return clamp(((g.hot.x + g.hot.w / 2) * Sc - vw / 2) / range, 0, 1);
}

// Paddock en photos : panorama + 5 garages, caméra animée. Les pages réelles de l'app s'affichent sur l'écran du garage.
export default function Paddock({ children, onNavigate, introDone, alertActive, statusLabel, sky, road }) {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [phase, setPhase] = useState("pano"); // pano | pre | entering | garage | screen | leaving1 | leaving2
  const [cur, setCur] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [settled, setSettled] = useState(false);

  const rootRef = useRef(null);
  const layerRef = useRef(null);
  const drag = useRef(null);
  const moved = useRef(0);
  const timers = useRef([]);
  const pendingLeave = useRef(false);
  const preloaded = useRef({});
  const phaseRef = useRef("pano");
  phaseRef.current = phase;
  const curRef = useRef(null);
  curRef.current = cur;
  const vpRef = useRef(vp);
  vpRef.current = vp;

  // défilement gauche/droite : position affichée (lissée), position visée, vitesse d'élan
  const panRef = useRef(0.5);
  const panTarget = useRef(0.5);
  const vel = useRef(0);
  const dragging = useRef(false);

  const reduce = useMemo(reduceMotion, []);
  const k = reduce ? 0.01 : 1;
  const D = (s) => `${(s * k).toFixed(2)}s`;

  const later = useCallback((fn, s) => { timers.current.push(setTimeout(fn, s * 1000 * k)); }, [k]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    // on mesure la vraie zone d'affichage (et non window.innerHeight, trop petit sur iPhone en mode application)
    const measure = () => {
      const el = rootRef.current;
      const w = el ? el.clientWidth : window.innerWidth;
      const h = el ? el.clientHeight : window.innerHeight;
      setVp((o) => (o.w === w && o.h === h ? o : { w, h }));
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    let ro = null;
    if (typeof ResizeObserver !== "undefined" && rootRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(rootRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      if (ro) ro.disconnect();
    };
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

  /* ── défilement fluide : une boucle d'animation écrit directement la position (sans re-rendu React) ── */
  useEffect(() => {
    if (phase !== "pano" || !settled) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // élan après un lancer du doigt : ralentit progressivement
      if (!dragging.current && vel.current !== 0) {
        panTarget.current = clamp(panTarget.current + vel.current * dt, 0, 1);
        vel.current *= Math.exp(-dt * 3.2);
        if (Math.abs(vel.current) < 0.004 || panTarget.current <= 0 || panTarget.current >= 1) vel.current = 0;
      }
      // suit la cible avec un amorti : serré pendant le glissement, plus doux sinon
      const diff = panTarget.current - panRef.current;
      if (Math.abs(diff) > 0.00002) {
        panRef.current += diff * (1 - Math.exp(-dt * (dragging.current ? 30 : 6.5)));
        const el = layerRef.current;
        if (el) {
          const { w, h } = vpRef.current;
          el.style.transform = tf(panoPose(w, h, panRef.current));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, settled]);

  /* ── machine d'états de la caméra ── */
  const startLeave = useCallback(() => {
    if (!curRef.current) return;
    const g = GARAGES.find((x) => x.id === curRef.current);
    const fromScreen = phaseRef.current === "screen";
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("leaving1");
    later(() => {
      // on ressort en face du garage quitté
      const p = panFor(g, vpRef.current.w, vpRef.current.h);
      panRef.current = p;
      panTarget.current = p;
      vel.current = 0;
      setPhase("leaving2");
      later(() => { setPhase("pano"); setCur(null); }, 1.1);
    }, fromScreen ? 0.6 : 0.2);
  }, [later]);

  const enter = (g) => {
    if (phaseRef.current !== "pano" || !revealed) return;
    try { window.history.pushState({ pdk: g.id }, ""); } catch (e) { /* ignore */ }
    pendingLeave.current = false;
    dragging.current = false;
    vel.current = 0;
    panTarget.current = panRef.current; // on fige le panorama là où il est
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

  // passe au garage précédent / suivant
  const step = useCallback((dir) => {
    if (phaseRef.current !== "pano") return;
    const { w, h } = vpRef.current;
    const targets = GARAGES.map((g) => panFor(g, w, h));
    let best = 0;
    targets.forEach((t, i) => { if (Math.abs(t - panTarget.current) < Math.abs(targets[best] - panTarget.current)) best = i; });
    vel.current = 0;
    panTarget.current = targets[clamp(best + dir, 0, targets.length - 1)];
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

  // image introuvable : on laisse le filet de sécurité (PaddockBoundary) revenir à l'interface classique
  if (failed) throw new Error("Images du paddock introuvables (public/paddock)");

  /* ── géométrie de la caméra ── */
  const { w: vw, h: vh } = vp;
  const Sp = Math.max(vw / PW, vh / PH); // échelle "plein écran" du panorama
  const Sg = Math.max(vw / GW, vh / GH); // échelle "plein écran" d'une photo de garage
  const dw = PW * Sp;
  const canPan = dw - vw > 24;
  const portrait = vw / vh < 0.9;
  const g = GARAGES.find((x) => x.id === cur) || null;
  const clampP = (tx, ty, S) => [clamp(tx, Math.min(0, vw - PW * S), 0), clamp(ty, Math.min(0, vh - PH * S), 0)];
  const clampG = (tx, ty, S) => [clamp(tx, Math.min(0, vw - GW * S), 0), clamp(ty, Math.min(0, vh - GH * S), 0)];

  const panoT = panoPose(vw, vh, panRef.current);
  const panoIntro = (() => { const S = Sp * 1.18; return { S, tx: vw / 2 - (PW / 2) * S, ty: vh / 2 - (PH / 2) * S }; })();

  let hotZ = panoT;
  let gFit = panoT;
  let gEnter = panoT;
  let gScreen = panoT;
  let panelW = 0, panelH = 0, panelTop = 0;
  if (g) {
    const Sz = Math.min(6, (910 / g.hot.w) * Sg); // le garage du panorama a la même taille à l'écran que sur sa photo
    const hcx = g.hot.x + g.hot.w / 2;
    const hcy = g.hot.y + g.hot.h / 2;
    const [hx, hy] = clampP(vw / 2 - hcx * Sz, vh / 2 - hcy * Sz, Sz);
    hotZ = { S: Sz, tx: hx, ty: hy };
    const [fx, fy] = clampG(vw / 2 - CX * Sg, (vh - GH * Sg) / 2, Sg);
    gFit = { S: Sg, tx: fx, ty: fy };
    const Se = Sg * 1.12;
    const [ex, ey] = clampG(vw / 2 - CX * Se, vh / 2 - CY * Se, Se);
    gEnter = { S: Se, tx: ex, ty: ey };
    panelW = portrait ? vw * 0.94 : Math.min(vw * 0.9, 720);
    panelH = portrait ? Math.min(vh * 0.76, 660) : Math.min(vh * 0.8, 560);
    panelTop = (vh - panelH) / 2;
    const Ss = Math.max(Sg, panelW / g.tv.w); // l'écran du garage occupe la largeur du panneau
    const [sx, sy] = clampG(vw / 2 - (g.tv.x + g.tv.w / 2) * Ss, panelTop - g.tv.y * Ss, Ss);
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
    // panorama au repos : pendant la révélation, mouvement lent ; ensuite la boucle d'animation pilote la position
    panoStyle = {
      transform: tf(panoT), opacity: 1, filter: "none",
      transition: !settled ? `transform ${D(2.6)} ${EASE_OUT}, opacity ${D(1.4)} ease, filter ${D(2)} ease` : "none",
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

  /* ── interactions : glisser (avec élan), molette, flèches ── */
  const onPointerDown = (e) => {
    moved.current = 0;
    if (phaseRef.current !== "pano" || !canPan || !settled) return;
    dragging.current = true;
    vel.current = 0;
    drag.current = { x: e.clientX, start: panTarget.current, samples: [[performance.now(), panTarget.current]] };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      moved.current = Math.max(moved.current, Math.abs(dx));
      panTarget.current = clamp(d.start - dx / (dw - vw), 0, 1); // le décor suit le doigt
      const now = performance.now();
      d.samples.push([now, panTarget.current]);
      while (d.samples.length > 2 && now - d.samples[0][0] > 120) d.samples.shift();
    }
    if (e.pointerType === "mouse" && rootRef.current) {
      rootRef.current.style.setProperty("--px", (e.clientX / vw - 0.5).toFixed(3));
      rootRef.current.style.setProperty("--py", (e.clientY / vh - 0.5).toFixed(3));
    }
  };
  const endDrag = () => {
    const d = drag.current;
    if (d && d.samples.length > 1) {
      // lancer du doigt : le panorama continue sur sa lancée puis ralentit
      const [t0, p0] = d.samples[0];
      const [t1, p1] = d.samples[d.samples.length - 1];
      const dtm = (t1 - t0) / 1000;
      if (dtm > 0.01 && performance.now() - t1 < 80) vel.current = clamp((p1 - p0) / dtm, -3, 3);
    }
    drag.current = null;
    dragging.current = false;
  };
  const onWheel = (e) => {
    if (phaseRef.current !== "pano" || !canPan || !settled) return;
    const dd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    vel.current = 0;
    panTarget.current = clamp(panTarget.current + (dd * (e.deltaMode === 1 ? 16 : 1)) / (dw - vw), 0, 1);
  };
  const stop = (e) => e.stopPropagation();

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
          <div ref={layerRef} className="pdk-layer" style={{ width: PW, height: PH, ...panoStyle }}>
            <img src={PANO} width={PW} height={PH} alt="" draggable={false} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
            {GARAGES.map((x) => (
              <button
                key={x.id}
                type="button"
                className={`pdk-hot pdk-hot-${x.id}${x.id === "alerts" && alertActive ? " alarm" : ""}`}                style={{ left: x.hot.x, top: x.hot.y, width: x.hot.w, height: x.hot.h }}
                aria-label={`Entrer dans ${x.label}`}
                tabIndex={phase === "pano" ? 0 : -1}
                onMouseEnter={() => preload(x)}
                onPointerDown={() => preload(x)}
                onClick={() => { if (moved.current > 8) return; enter(x); }}
              >
                <span className="pdk-hot-chip">ENTRER ›</span>
              </button>
            ))}

            {/* infos posées dans la scène : elles font partie du décor et défilent avec lui (ciel = prochain GP, route = sessions) */}
            {sky && <div className={`pit-sky-pos${phase === "pano" ? "" : " off"}`}>{sky}</div>}
            {road && <div className={`pit-road-pos${phase === "pano" ? "" : " off"}`}>{road}</div>}
          </div>

          {/* photo du garage choisi */}
          {g && (
            <div className="pdk-layer" style={{ width: GW, height: GH, ...garageStyle }}>
              <img src={g.img} width={GW} height={GH} alt="" draggable={false} decoding="async" />
              {g.id === "alerts" && alertActive && <div className="pdk-alarm" />}
            </div>
          )}
        </div>
      </div>
      <div className="pdk-vig" />

      {/* page réelle de l'application, posée sur l'écran du garage */}
      {phase === "screen" && g && (
        <div className={`pdk-screen panel ${tone} pdk-g-${g.id}`} style={{ width: panelW, height: panelH, left: (vw - panelW) / 2, top: panelTop, animationDelay: D(0.55) }}>
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
          {phase === "pano" && <div className="pdk-hint">{canPan ? "Glissez pour parcourir · touchez un garage" : "Touchez un garage"}</div>}
        </>
      )}
    </div>
  );
}
