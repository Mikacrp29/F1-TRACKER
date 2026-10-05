import React from "react";

// Niveaux de qualité. Forçables pour tester : ?quality=low | mid | high
const TIERS = {
  low:  { name: "low",  dpr: [1, 1.25], reflect: false, aa: false, lights: false },
  mid:  { name: "mid",  dpr: [1, 1.5],  reflect: false, aa: true,  lights: true },
  high: { name: "high", dpr: [1, 2],    reflect: true,  aa: true,  lights: true },
};

const param = (k) => {
  try { return new URLSearchParams(window.location.search).get(k); } catch (e) { return null; }
};

// true si on peut afficher le paddock 3D. ?classic force l'interface actuelle.
export function supportsPaddock() {
  try {
    if (typeof window === "undefined") return false;
    if (param("classic") !== null) return false;
    // mouvements de caméra = on respecte "réduire les animations"
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
    return true;
  } catch (e) {
    return false;
  }
}

export function getQuality() {
  const forced = param("quality");
  if (forced && TIERS[forced]) return TIERS[forced];
  const ua = navigator.userAgent || "";
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (mobile || mem <= 2) return TIERS.low;
  if (mem <= 4 || cores <= 4) return TIERS.mid;
  return TIERS.high;
}

// Si la 3D plante (WebGL perdu, chunk non chargé...), on retombe sur l'interface classique.
export class PaddockBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("Paddock 3D indisponible :", err);
    if (this.props.onFail) this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
