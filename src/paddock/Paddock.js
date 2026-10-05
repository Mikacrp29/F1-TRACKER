import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import PaddockScene from "./PaddockScene";
import { getQuality } from "./support";
import { GARAGES } from "./layout";
import "./paddock.css";

// Couche 3D autour de l'app existante. `children` = la page courante (déjà rendue par App.js).
export default function Paddock({ children, onNavigate, introDone, alertActive, statusLabel }) {
  const [inside, setInside] = useState(null); // id du garage, ou null = pit-lane
  const [arrived, setArrived] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const quality = useMemo(() => getQuality(), []);
  const insideRef = useRef(null);
  insideRef.current = inside;

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

  useEffect(() => {
    const onPop = () => { setArrived(false); setInside(null); };
    const onKey = (e) => { if (e.key === "Escape") leave(); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [leave]);

  const onArrive = useCallback((id) => { if (id) setArrived(true); }, []);

  return (
    <div className="pdk-root">
      <Canvas
        dpr={degraded ? 1 : quality.dpr}
        frameloop={introDone ? "always" : "demand"}
        camera={{ fov: 48, near: 0.1, far: 160, position: [0, 1.6, 26] }}
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
          />
        </Suspense>
      </Canvas>

      {introDone && (
        <>
          <div className="pdk-hud">
            <button type="button" className={`pdk-brand${inside ? " back" : ""}`} onClick={inside ? leave : undefined} aria-label={inside ? "Retour au paddock" : "F1 Tracker"}>
              {inside ? <span className="pdk-back">‹ PADDOCK</span> : <span className="pdk-dot" />}
              <span>
                F1 <b>TRACKER</b>
              </span>
            </button>
            <span className="pdk-status">{statusLabel}</span>
          </div>
          {!inside && <div className="pdk-hint">Choisissez un garage</div>}
        </>
      )}
    </div>
  );
}
