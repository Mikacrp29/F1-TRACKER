import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import PaddockScene from "./PaddockScene";
import { getQuality } from "./support";
import { GARAGES, GARAGE_XS, PAN_MAX, HOME_Z, ROW_Z, fovFor } from "./layout";
import "./paddock.css";

const clampPan = (v) => Math.max(-PAN_MAX, Math.min(PAN_MAX, v));

// Couche 3D autour de l'app existante. `children` = la page courante (déjà rendue par App.js).
export default function Paddock({ children, onNavigate, introDone, alertActive, statusLabel }) {
  const [inside, setInside] = useState(null); // id du garage, ou null = devant la rangée
  const [arrived, setArrived] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const quality = useMemo(() => getQuality(), []);
  const insideRef = useRef(null);
  insideRef.current = inside;
  const panRef = useRef(0); // position gauche/droite voulue pour la caméra
  const drag = useRef(null);

  const enter = useCallback(
    (id) => {
      const g = GARAGES.find((x) => x.id === id);
      if (!g) return;
      try { window.history.pushState({ pdk: id }, ""); } catch (e) { /* ignore */ }
      setArrived(false);
      setInside(id);
      onNavigate(g.page);
    },
    [onNavigate]
  );

  // retour au paddock : bouton retour du navigateur, Échap, ou le logo en haut à gauche
  const leave = useCallback(() => {
    if (!insideRef.current) return;
    try { window.history.back(); } catch (e) { setArrived(false); setInside(null); }
  }, []);

  // saute d'un garage au suivant (flèches, boutons)
  const step = useCallback((dir) => {
    let best = 0;
    GARAGE_XS.forEach((x, i) => {
      if (Math.abs(x - panRef.current) < Math.abs(GARAGE_XS[best] - panRef.current)) best = i;
    });
    const next = Math.max(0, Math.min(GARAGE_XS.length - 1, best + dir));
    panRef.current = clampPan(GARAGE_XS[next]);
  }, []);

  useEffect(() => {
    const onPop = () => { setArrived(false); setInside(null); };
    const onKey = (e) => {
      if (e.key === "Escape") leave();
      if (insideRef.current) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [leave, step]);

  // glisser (souris ou doigt) pour se promener de gauche à droite
  const onPointerDown = (e) => {
    if (insideRef.current) return;
    drag.current = { x: e.clientX, pan: panRef.current };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || insideRef.current) return;
    const h = window.innerHeight;
    const fov = fovFor(window.innerWidth / h);
    const dist = HOME_Z - ROW_Z;
    const unitsPerPx = (2 * dist * Math.tan((fov * Math.PI) / 360)) / h; // le décor suit le doigt
    panRef.current = clampPan(d.pan - (e.clientX - d.x) * unitsPerPx);
  };
  const endDrag = () => { drag.current = null; };
  const onWheel = (e) => {
    if (insideRef.current) return;
    const dd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    panRef.current = clampPan(panRef.current + dd * 0.02);
  };
  const stop = (e) => e.stopPropagation();

  const onArrive = useCallback((id) => { if (id) setArrived(true); }, []);

  return (
    <div
      className="pdk-root"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
    >
      <Canvas
        dpr={degraded ? 1 : quality.dpr}
        frameloop={introDone ? "always" : "demand"}
        camera={{ fov: 48, near: 0.1, far: 170, position: [0, 1.8, 24] }}
        gl={{ antialias: quality.aa, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor flipflops={2} onFallback={() => setDegraded(true)} />
        <Suspense fallback={null}>
          <PaddockScene
            inside={inside}
            arrived={arrived}
            introDone={introDone}
            quality={quality}
            degraded={degraded}
            alertActive={alertActive}
            onSelect={enter}
            onArrive={onArrive}
            screen={children}
            panRef={panRef}
          />
        </Suspense>
      </Canvas>

      {introDone && (
        <>
          <div className="pdk-hud">
            <button type="button" className={`pdk-brand${inside ? " back" : ""}`} onPointerDown={stop} onClick={inside ? leave : undefined} aria-label={inside ? "Retour au paddock" : "F1 Tracker"}>
              {inside ? <span className="pdk-back">‹ PADDOCK</span> : <span className="pdk-dot" />}
              <span>
                F1 <b>TRACKER</b>
              </span>
            </button>
            <span className="pdk-status">{statusLabel}</span>
          </div>
          {!inside && (
            <>
              <button type="button" className="pdk-arrow l" onPointerDown={stop} onClick={() => step(-1)} aria-label="Garage précédent">‹</button>
              <button type="button" className="pdk-arrow r" onPointerDown={stop} onClick={() => step(1)} aria-label="Garage suivant">›</button>
              <div className="pdk-hint">Glissez pour parcourir · touchez un garage</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
