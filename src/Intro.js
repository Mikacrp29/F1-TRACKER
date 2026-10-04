import React, { useState, useEffect, useRef } from "react";

// Intro : une F1 (vue de face) arrive de très loin, grossit et remplit l'écran,
// puis le site apparaît. Tout est en code (SVG + CSS), aucune image à fournir.

const INTRO_CSS = `
.fx{position:fixed;inset:0;z-index:9999;background:#050507;overflow:hidden;transition:opacity .55s ease,visibility .55s;cursor:pointer}
.fx.out{opacity:0;visibility:hidden}

/* lueur de l'horizon */
.fx-glow{position:absolute;left:0;right:0;top:0;height:100%;background:radial-gradient(ellipse 70% 38% at 50% 46%,rgba(232,0,45,.28),transparent 70%)}
.fx-horizon{position:absolute;left:0;right:0;top:46%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)}

/* route : lignes qui convergent vers le point de fuite */
.fx-road{position:absolute;left:0;top:0;width:100%;height:100%}
.fx-road line{stroke:rgba(255,255,255,.2);stroke-width:2;vector-effect:non-scaling-stroke;stroke-dasharray:14 22;animation:fxdash .35s linear infinite}
@keyframes fxdash{to{stroke-dashoffset:-36}}

/* traits de vitesse qui partent du centre */
.fx-rays{position:absolute;inset:-30%;opacity:0;
  background:repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.16) 0deg .6deg,transparent .6deg 9deg);
  -webkit-mask-image:radial-gradient(circle at 50% 46%,transparent 8%,#000 60%);
          mask-image:radial-gradient(circle at 50% 46%,transparent 8%,#000 60%);
  animation:fxrays 2.6s .1s linear forwards}
@keyframes fxrays{0%{opacity:0;transform:scale(.6)}55%{opacity:0;transform:scale(.8)}80%{opacity:.7;transform:scale(1.2)}100%{opacity:.9;transform:scale(2.2)}}

/* la voiture : démarre minuscule au point de fuite, finit en plein écran */
.fx-car{position:absolute;left:50%;top:46%;width:min(86vw,460px);transform-origin:50% 63%;opacity:0;will-change:transform;
  animation:fxdrive 2.6s .1s linear forwards}
@keyframes fxdrive{
  0%  {transform:translate(-50%,-50%) scale(.025);opacity:0}
  6%  {opacity:1}
  40% {transform:translate(-50%,-50%) scale(.09)}
  65% {transform:translate(-50%,-50%) scale(.26)}
  80% {transform:translate(-50%,-50%) scale(.75)}
  92% {transform:translate(-50%,-50%) scale(2.8)}
  100%{transform:translate(-50%,-50%) scale(13);opacity:1}
}
.fx-car svg{display:block;width:100%;height:auto;animation:fxshake .07s linear infinite alternate}
@keyframes fxshake{from{transform:translate(-.4px,0)}to{transform:translate(.4px,.5px)}}

.fx-skip{position:absolute;bottom:calc(22px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;font-size:.62rem;letter-spacing:.22em;text-transform:uppercase;color:#55556a;font-family:'Rajdhani',sans-serif}
`;

export default function Intro({ onDone }) {
  const [out, setOut] = useState(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2500);   // fondu de l'intro
    const t2 = setTimeout(() => cb.current(), 3150);   // retrait complet
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const skip = () => { setOut(true); setTimeout(() => cb.current(), 450); };

  return (
    <div className={`fx${out ? " out" : ""}`} onClick={skip}>
      <style>{INTRO_CSS}</style>

      <div className="fx-glow" />
      <div className="fx-horizon" />

      <svg className="fx-road" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[-120, -70, -30, 5, 28, 44, 56, 72, 95, 130, 170, 220].map(x => (
          <line key={x} x1="50" y1="46" x2={x} y2="100" />
        ))}
      </svg>

      <div className="fx-rays" />

      <div className="fx-car">
        <svg viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fxbody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff2a4d" />
              <stop offset=".55" stopColor="#e8002d" />
              <stop offset="1" stopColor="#8a0019" />
            </linearGradient>
            <linearGradient id="fxnose" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#9c001d" />
              <stop offset=".45" stopColor="#ff3556" />
              <stop offset="1" stopColor="#9c001d" />
            </linearGradient>
            <linearGradient id="fxtyre" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0a0a0c" />
              <stop offset=".5" stopColor="#26262c" />
              <stop offset="1" stopColor="#0a0a0c" />
            </linearGradient>
            <linearGradient id="fxcarbon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c2c33" />
              <stop offset="1" stopColor="#0d0d10" />
            </linearGradient>
          </defs>

          <ellipse cx="200" cy="262" rx="200" ry="7" fill="rgba(0,0,0,.55)" />

          {/* aileron arrière (au fond) */}
          <rect x="120" y="42" width="160" height="9" rx="2" fill="#15151a" />
          <rect x="124" y="53" width="152" height="5" rx="2" fill="#e8002d" />
          <rect x="118" y="36" width="7" height="30" rx="2" fill="#1d1d23" />
          <rect x="275" y="36" width="7" height="30" rx="2" fill="#1d1d23" />
          <rect x="194" y="58" width="12" height="46" fill="#18181d" />

          {/* pneus arrière */}
          <rect x="6" y="108" width="82" height="140" rx="16" fill="url(#fxtyre)" />
          <rect x="312" y="108" width="82" height="140" rx="16" fill="url(#fxtyre)" />

          {/* carrosserie / pontons */}
          <path d="M96 150 Q112 112 150 104 L250 104 Q288 112 304 150 L316 232 L84 232 Z" fill="url(#fxbody)" />
          <path d="M112 160 L150 116 L250 116 L288 160 L296 214 L104 214 Z" fill="#c70026" opacity=".55" />
          <path d="M116 168 Q132 160 158 164 L158 204 Q132 208 116 200 Z" fill="#0b0b0e" />
          <path d="M284 168 Q268 160 242 164 L242 204 Q268 208 284 200 Z" fill="#0b0b0e" />
          <path d="M120 172 Q134 167 154 170" stroke="#3a3a42" strokeWidth="2" fill="none" />
          <path d="M280 172 Q266 167 246 170" stroke="#3a3a42" strokeWidth="2" fill="none" />

          {/* prise d'air + casque */}
          <path d="M174 112 L178 74 Q200 64 222 74 L226 112 Z" fill="#9c001d" />
          <path d="M180 100 L182 78 Q200 70 218 78 L220 100 Z" fill="#0b0b0e" />
          <circle cx="200" cy="124" r="15" fill="#ffca28" />
          <rect x="186" y="119" width="28" height="9" rx="4" fill="#0b0b0e" />
          <rect x="190" y="121" width="20" height="3" rx="1.5" fill="#4a90d9" opacity=".7" />

          {/* nez */}
          <path d="M176 150 L224 150 L214 222 Q200 232 186 222 Z" fill="url(#fxnose)" />
          <rect x="197" y="150" width="6" height="74" fill="#f0f0f4" opacity=".9" />

          {/* halo */}
          <path d="M164 150 Q166 96 200 92 Q234 96 236 150" fill="none" stroke="#0e0e12" strokeWidth="7" strokeLinecap="round" />
          <path d="M164 150 Q166 96 200 92 Q234 96 236 150" fill="none" stroke="#3b3b44" strokeWidth="2" strokeLinecap="round" />
          <rect x="196" y="92" width="8" height="56" rx="3" fill="#15151a" />

          {/* rétroviseurs */}
          <rect x="104" y="140" width="26" height="12" rx="4" fill="#15151a" />
          <rect x="270" y="140" width="26" height="12" rx="4" fill="#15151a" />

          {/* suspensions */}
          <g stroke="#2a2a31" strokeWidth="3.5" strokeLinecap="round">
            <line x1="176" y1="190" x2="84" y2="176" />
            <line x1="176" y1="206" x2="84" y2="200" />
            <line x1="224" y1="190" x2="316" y2="176" />
            <line x1="224" y1="206" x2="316" y2="200" />
          </g>
          <g stroke="#555" strokeWidth="2" strokeLinecap="round">
            <line x1="170" y1="170" x2="86" y2="168" />
            <line x1="230" y1="170" x2="314" y2="168" />
          </g>

          {/* pneus avant */}
          <rect x="22" y="130" width="64" height="126" rx="14" fill="url(#fxtyre)" />
          <rect x="314" y="130" width="64" height="126" rx="14" fill="url(#fxtyre)" />
          <rect x="22" y="130" width="64" height="9" rx="4" fill="#ffca28" />
          <rect x="314" y="130" width="64" height="9" rx="4" fill="#ffca28" />
          <rect x="82" y="150" width="10" height="80" rx="4" fill="#15151a" />
          <rect x="308" y="150" width="10" height="80" rx="4" fill="#15151a" />
          <path d="M30 152 L78 152 M30 168 L78 168 M30 184 L78 184 M30 200 L78 200 M30 216 L78 216" stroke="#000" strokeWidth="1.5" opacity=".5" />
          <path d="M322 152 L370 152 M322 168 L370 168 M322 184 L370 184 M322 200 L370 200 M322 216 L370 216" stroke="#000" strokeWidth="1.5" opacity=".5" />

          {/* aileron avant */}
          <path d="M0 246 L400 246 L400 258 L0 258 Z" fill="url(#fxcarbon)" />
          <path d="M10 236 L390 236 L400 246 L0 246 Z" fill="#1c1c22" />
          <path d="M40 228 L360 228 L372 236 L28 236 Z" fill="#e8002d" />
          <path d="M90 220 L310 220 L322 228 L78 228 Z" fill="#f0f0f4" />
          <path d="M176 222 L224 222 L214 232 L186 232 Z" fill="#9c001d" />
          <path d="M0 200 L14 200 L20 258 L0 258 Z" fill="#f0f0f4" />
          <path d="M0 214 L12 214 L16 258 L0 258 Z" fill="#e8002d" />
          <path d="M400 200 L386 200 L380 258 L400 258 Z" fill="#f0f0f4" />
          <path d="M400 214 L388 214 L384 258 L400 258 Z" fill="#e8002d" />
        </svg>
      </div>

      <div className="fx-skip">Touche pour passer</div>
    </div>
  );
}
