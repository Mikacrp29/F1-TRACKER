import * as THREE from "three";

// Textures procédurales (canvas) : aucune image à télécharger.
const mk = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
const toTex = (c, repeat) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
};
const rng = (seed) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

// Asphalte : grain fin + grandes variations très douces
export function asphaltTexture() {
  const c = mk(512, 512);
  const x = c.getContext("2d");
  const img = x.createImageData(512, 512);
  const r = rng(11);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 62 + r() * 46 + (r() < 0.025 ? 38 : 0);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v + 3;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  for (let k = 0; k < 28; k++) {
    const px = r() * 512, py = r() * 512, rad = 40 + r() * 90;
    const g = x.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, r() < 0.6 ? "rgba(0,0,0,.16)" : "rgba(255,255,255,.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  return toTex(c, [26, 32]);
}

// Façade d'immeuble : grille de fenêtres, quelques-unes allumées
export function facadeTexture() {
  const c = mk(128, 128);
  const x = c.getContext("2d");
  const r = rng(5);
  x.fillStyle = "#1c1f26";
  x.fillRect(0, 0, 128, 128);
  const n = 8, cell = 128 / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const lit = r() < 0.3;
      x.fillStyle = lit ? (r() < 0.5 ? "#ffd8a0" : "#bcd6ff") : "#0a0c10";
      x.fillRect(i * cell + 2, j * cell + 3, cell - 4, cell - 6);
    }
  }
  return toTex(c);
}

// Fibre de carbone : sergé fin
export function carbonTexture() {
  const c = mk(32, 32);
  const x = c.getContext("2d");
  x.fillStyle = "#101113";
  x.fillRect(0, 0, 32, 32);
  for (let i = -32; i < 64; i += 4) {
    x.strokeStyle = (i / 4) % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.35)";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i + 32, 32);
    x.stroke();
  }
  return toTex(c, [6, 6]);
}

// Petit écran de stand : barres abstraites (aucune donnée affichée)
export function screenTexture(seed = 1) {
  const c = mk(128, 64);
  const x = c.getContext("2d");
  const r = rng(seed * 7 + 3);
  x.fillStyle = "#05090a";
  x.fillRect(0, 0, 128, 64);
  x.fillStyle = "rgba(184,244,0,.55)";
  x.fillRect(6, 6, 40, 4);
  for (let i = 0; i < 12; i++) {
    const h = 6 + r() * 34;
    x.fillStyle = i % 4 === 0 ? "rgba(184,244,0,.7)" : "rgba(220,235,255,.45)";
    x.fillRect(8 + i * 9, 58 - h, 6, h);
  }
  x.fillStyle = "rgba(255,255,255,.12)";
  for (let i = 0; i < 4; i++) x.fillRect(70, 16 + i * 6, 52, 2);
  return toTex(c);
}

export function glowTexture() {
  const c = mk(128, 128);
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return toTex(c);
}

// Traces de gomme : deux bandes qui s'estompent aux extrémités
export function skidTexture() {
  const c = mk(256, 32);
  const x = c.getContext("2d");
  for (const y of [9, 21]) {
    const g = x.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.25, "rgba(0,0,0,.9)");
    g.addColorStop(0.75, "rgba(0,0,0,.9)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, y - 3, 256, 6);
  }
  return toTex(c);
}
