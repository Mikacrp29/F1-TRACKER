import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// INTRO CINÉMA : une F1 fonce vers la caméra, de très loin jusqu'à
// remplir l'écran. Vraie perspective (canvas), route, lampadaires,
// reflet sur sol mouillé, ombre, flou de vitesse, secousses de caméra.
// Image utilisée : /public/f1-intro.webp
// ─────────────────────────────────────────────────────────────────────

const DUR   = 3000;   // durée de l'approche (ms)
const CAR_W = 2.0;    // largeur de la voiture (mètres)
const CAM_H = 0.55;   // hauteur de la caméra (mètres)
const Z0 = 60;        // distance de départ (m)
const Z1 = 0.5;       // distance d'arrivée (m)
const LN0 = Math.log(Z0), LN1 = Math.log(Z1);

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gfun  = p => 0.10 * p + 0.90 * Math.pow(p, 1.18);          // profil d'approche
const zOf   = p => Math.exp(LN0 + (LN1 - LN0) * gfun(p));        // distance voiture-caméra
const dzdp  = p => Math.abs((LN1 - LN0) * (0.10 + 0.90 * 1.18 * Math.pow(p, 0.18))); // vitesse de zoom

// traits de vitesse (générés une seule fois, toujours identiques)
const STREAKS = (() => {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 70 }, () => ({ a: rnd() * Math.PI * 2, r: 0.12 + rnd() * 0.5, l: 0.15 + rnd() * 0.5, w: 0.6 + rnd() * 1.6, k: rnd() }));
})();

export default function Intro({ onDone }) {
  const canvasRef = useRef(null);
  const [out, setOut] = useState(false);
  const cb = useRef(onDone); cb.current = onDone;
  const skipRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0, stopped = false, finished = false, start = null;
    let W = 0, H = 0, dpr = 1;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      setOut(true);
      setTimeout(() => cb.current(), 650);
    };
    skipRef.current = finish;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.4e6 / (W * H))));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const img = new Image();
    let refl = null;

    // reflet du sol mouillé : version retournée, floue, qui s'estompe vers le bas
    const makeReflection = () => {
      const sw = 520, fullH = Math.round(img.height * sw / img.width);
      const small = document.createElement("canvas");
      small.width = Math.round(sw / 5); small.height = Math.round(fullH / 5);
      const sc = small.getContext("2d");
      sc.translate(0, small.height); sc.scale(1, -1);
      sc.drawImage(img, 0, 0, small.width, small.height);
      const rh = Math.round(fullH * 0.62);
      const c = document.createElement("canvas"); c.width = sw; c.height = rh;
      const x = c.getContext("2d");
      x.drawImage(small, 0, 0, small.width, small.height * 0.62, 0, 0, sw, rh);
      x.globalCompositeOperation = "destination-in";
      const g = x.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, "rgba(0,0,0,.75)"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, sw, rh);
      return c;
    };

    const render = (p, tms) => {
      const t = tms / 1000;
      const Z = zOf(p);
      const f = 1.1 * W;                 // focale (px)
      const cx = W / 2, yh = H * 0.46;   // point de fuite
      const travel = Z0 - Z;             // distance parcourue par la caméra
      const sh = sstep(0.25, 1, p);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

      // secousses de caméra + léger roulis final
      const shx = (Math.sin(t * 61) + Math.sin(t * 37 + 1)) * 0.5 * (0.3 + 5 * sh * sh);
      const shy = (Math.sin(t * 53 + 2) + Math.sin(t * 29)) * 0.5 * (0.3 + 6 * sh * sh);
      const roll = Math.sin(t * 7) * 0.004 * sh + sstep(0.7, 1, p) * 0.022;
      ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.translate(-W / 2 + shx, -H / 2 + shy);

      const X0 = -W, Y0 = -H * 0.2, WW = W * 3, HH = H * 1.6;

      // ciel
      let g = ctx.createLinearGradient(0, 0, 0, yh);
      g.addColorStop(0, "#020204"); g.addColorStop(1, "#14060a");
      ctx.fillStyle = g; ctx.fillRect(X0, Y0, WW, yh - Y0);
      // lueur de l'horizon
      ctx.save(); ctx.translate(cx, yh); ctx.scale(1, 0.38);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.95);
      g.addColorStop(0, "rgba(232,0,45,.55)"); g.addColorStop(0.45, "rgba(150,0,30,.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(-W * 1.2, -W * 1.2, W * 2.4, W * 2.4); ctx.restore();

      // sol
      g = ctx.createLinearGradient(0, yh, 0, H);
      g.addColorStop(0, "#1b0a0f"); g.addColorStop(0.25, "#0d0d11"); g.addColorStop(1, "#060608");
      ctx.fillStyle = g; ctx.fillRect(X0, yh, WW, H * 1.6);

      // projection monde -> écran
      const PX = (X, Zd) => cx + f * X / Zd;
      const PY = Zd => yh + f * CAM_H / Zd;
      const quad = (xa, xb, za, zb, col, alpha) => {
        const zn = Math.max(za, 0.45), zf = Math.max(zb, zn + 0.001);
        const y1 = PY(zn), y2 = PY(zf);
        ctx.globalAlpha = alpha; ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(PX(xa, zn), y1); ctx.lineTo(PX(xb, zn), y1);
        ctx.lineTo(PX(xb, zf), y2); ctx.lineTo(PX(xa, zf), y2);
        ctx.closePath(); ctx.fill();
      };
      const fog = z => Math.pow(Math.max(0, 1 - z / 300), 1.3);

      // chaussée (asphalte mouillé)
      g = ctx.createLinearGradient(0, yh, 0, H);
      g.addColorStop(0, "#241217"); g.addColorStop(0.2, "#15151a"); g.addColorStop(1, "#0b0b0e");
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(PX(-4.6, 0.45), PY(0.45)); ctx.lineTo(PX(4.6, 0.45), PY(0.45));
      ctx.lineTo(PX(4.6, 600), PY(600)); ctx.lineTo(PX(-4.6, 600), PY(600));
      ctx.closePath(); ctx.fill();

      // vibreurs rouges/blancs + ligne centrale
      const KP = 3;                                   // période vibreurs (m)
      for (let k = Math.floor(travel / KP) - 1; k < Math.floor((travel + 160) / KP) + 1; k++) {
        const d = k * KP - travel; if (d + KP < 0.45 || d > 160) continue;
        const col = (k & 1) ? "#e8002d" : "#f0f0f4", a = fog(d) * 0.95;
        quad(4.6, 5.7, d, d + KP, col, a);
        quad(-5.7, -4.6, d, d + KP, col, a);
      }
      const LP = 12;
      for (let k = Math.floor(travel / LP) - 1; k < Math.floor((travel + 260) / LP) + 1; k++) {
        const d = k * LP - travel; if (d + 5 < 0.45 || d > 260) continue;
        quad(-0.06, 0.06, d, d + 5, "#e6e6ec", fog(d) * 0.7 * sstep(2, 9, d));
      }
      ctx.globalAlpha = 1;

      // lampadaires qui défilent
      const SP = 22;
      for (let k = Math.floor((travel + 300) / SP); k >= Math.floor(travel / SP); k--) {
        const d = k * SP - travel; if (d < 2.2 || d > 300) continue;
        for (const side of [-1, 1]) {
          const x = PX(side * 7.6, d), yb = PY(d), yt = yh - f * (5.5 - CAM_H) / d;
          const a = fog(d);
          ctx.globalAlpha = a * 0.9; ctx.strokeStyle = "#2a2a31"; ctx.lineWidth = Math.max(1, f * 0.13 / d);
          ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x, yt); ctx.stroke();
          const r = Math.max(2.5, f * 1.6 / d);
          const gg = ctx.createRadialGradient(x, yt, 0, x, yt, r);
          gg.addColorStop(0, "rgba(255,235,230,.95)"); gg.addColorStop(0.18, "rgba(255,90,100,.55)"); gg.addColorStop(1, "rgba(232,0,45,0)");
          ctx.globalAlpha = a; ctx.fillStyle = gg; ctx.fillRect(x - r, yt - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;

      // voiture
      const imgW = img.width, imgH = img.height;
      const carPx = f * CAR_W / Z;                       // largeur à l'écran
      const yg = PY(Z);                                  // contact avec le sol
      const bounce = Math.sin(t * 24) * 0.0016 * carPx * (0.4 + sh);

      // halo rouge sur le sol
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.translate(cx, yg); ctx.scale(1, 0.12);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, carPx * 0.75);
      g.addColorStop(0, "rgba(232,0,45,.38)"); g.addColorStop(1, "rgba(232,0,45,0)");
      ctx.fillStyle = g; ctx.fillRect(-carPx, -carPx, carPx * 2, carPx * 2); ctx.restore();

      // reflet
      if (refl) {
        const rw = carPx, rhh = refl.height * rw / refl.width;
        ctx.globalAlpha = 0.9 * (1 - sstep(0.85, 1, p));
        ctx.drawImage(refl, cx - rw / 2, yg + bounce, rw, rhh);
        ctx.globalAlpha = 1;
      }

      // ombre
      ctx.save(); ctx.translate(cx, yg + bounce); ctx.scale(1, 0.07);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, carPx * 0.62);
      g.addColorStop(0, "rgba(0,0,0,.95)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(-carPx, -carPx, carPx * 2, carPx * 2); ctx.restore();

      // flou de vitesse : échantillons de la voiture à des instants plus anciens
      const blur = Math.min(0.55, dzdp(p) / (DUR / 1000) * 0.016 * (1.5 + 5 * p * p));
      const drawCar = (z, a) => {
        const w = f * CAR_W / z, h = w * imgH / imgW, y = PY(z) + bounce;
        ctx.globalAlpha = a; ctx.drawImage(img, cx - w / 2, y - h, w, h);
      };
      if (blur > 0.012) {
        const n = 6;
        for (let i = n; i >= 1; i--) drawCar(Z * (1 + blur * i / n), 0.16 + 0.1 * (n - i) / n);
      }
      drawCar(Z, 1);
      ctx.globalAlpha = 1;

      // traits de vitesse radiaux
      const si = sstep(0.5, 0.92, p);
      if (si > 0.01) {
        ctx.lineCap = "round";
        const R = Math.hypot(W, H);
        for (const s of STREAKS) {
          const grow = 0.25 + 1.4 * si;
          const r0 = R * s.r * grow * 0.6, r1 = r0 + R * s.l * si * 0.9;
          ctx.globalAlpha = si * (0.25 + 0.4 * s.k);
          ctx.strokeStyle = s.k > 0.7 ? "#ff5a6e" : "#ffffff";
          ctx.lineWidth = s.w * (0.6 + si);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(s.a) * r0, yh + Math.sin(s.a) * r0);
          ctx.lineTo(cx + Math.cos(s.a) * r1, yh + Math.sin(s.a) * r1);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // voile final : écran entièrement couvert avant la révélation du site
      const cov = sstep(0.88, 1, p);
      if (cov > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = cov; ctx.fillStyle = "#050507"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      }
    };

    const tick = ts => {
      if (stopped || finished) return;
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / DUR);
      render(p, ts);
      if (p < 1) raf = requestAnimationFrame(tick); else finish();
    };

    img.onload = () => { try { refl = makeReflection(); } catch (e) { refl = null; } raf = requestAnimationFrame(tick); };
    img.onerror = () => cb.current();
    img.src = "/f1-intro.webp";
    const guard = setTimeout(() => { if (start === null) { stopped = true; cb.current(); } }, 3500); // image trop lente : on saute

    return () => { stopped = true; cancelAnimationFrame(raf); clearTimeout(guard); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div
      onClick={() => skipRef.current()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#050507", cursor: "pointer",
        opacity: out ? 0 : 1, visibility: out ? "hidden" : "visible",
        transition: "opacity .55s ease, visibility .55s",
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 46%, transparent 52%, rgba(0,0,0,.7) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(22px + env(safe-area-inset-bottom))", textAlign: "center", fontSize: ".62rem", letterSpacing: ".22em", textTransform: "uppercase", color: "#55556a", fontFamily: "'Rajdhani',sans-serif", pointerEvents: "none" }}>
        Touche pour passer
      </div>
    </div>
  );
}
