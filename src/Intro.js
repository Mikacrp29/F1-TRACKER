import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// INTRO VIDÉO : joue /public/intro/intro.mp4 en plein écran, puis révèle le site.
// Toucher / cliquer = passer. Si la vidéo ne démarre pas, on saute l'intro.
// ─────────────────────────────────────────────────────────────────────

const SRC = "/intro/intro.mp4";
const POSTER = "";          // optionnel : "/intro/poster.jpg" (image affichée avant la lecture)
const START_TIMEOUT = 4000; // si la vidéo n'a pas démarré après 4 s, on passe

export default function Intro({ onDone }) {
  const videoRef = useRef(null);
  const [out, setOut] = useState(false);
  const cb = useRef(onDone);
  cb.current = onDone;
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setOut(true);
    setTimeout(() => cb.current(), 650); // même délai que l'ancienne intro : fondu puis révélation
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let started = false;
    const guard = setTimeout(() => { if (!started) finish(); }, START_TIMEOUT);
    const onPlaying = () => { started = true; clearTimeout(guard); };
    v.addEventListener("playing", onPlaying);
    const p = v.play();
    if (p && p.catch) p.catch(() => finish()); // lecture automatique refusée par le navigateur
    return () => {
      clearTimeout(guard);
      v.removeEventListener("playing", onPlaying);
    };
  }, [finish]);

  return (
    <div
      onClick={finish}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#050507", cursor: "pointer",
        opacity: out ? 0 : 1, visibility: out ? "hidden" : "visible",
        transition: "opacity .55s ease, visibility .55s",
      }}
    >
      <video
        ref={videoRef}
        src={SRC}
        poster={POSTER || undefined}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(22px + env(safe-area-inset-bottom))", textAlign: "center", fontSize: ".62rem", letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontFamily: "'Rajdhani',sans-serif", pointerEvents: "none", textShadow: "0 1px 6px rgba(0,0,0,.8)" }}>
        Touche pour passer
      </div>
    </div>
  );
}
