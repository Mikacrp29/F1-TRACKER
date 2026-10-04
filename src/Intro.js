import React, { useState, useEffect, useRef } from "react";

// Intro : une F1 (vue de face) arrive de très loin, grossit et remplit l'écran,
// puis le site apparaît. Image : /public/f1-intro.webp

const INTRO_CSS = `
.fx{position:fixed;inset:0;z-index:9999;background:#050507;overflow:hidden;transition:opacity .55s ease,visibility .55s;cursor:pointer}
.fx.out{opacity:0;visibility:hidden}

.fx-glow{position:absolute;inset:0;background:radial-gradient(ellipse 75% 42% at 50% 46%,rgba(232,0,45,.34),rgba(120,0,24,.12) 55%,transparent 75%)}
.fx-horizon{position:absolute;left:0;right:0;top:46%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)}

/* route : lignes qui convergent vers le point de fuite */
.fx-road{position:absolute;left:0;top:0;width:100%;height:100%}
.fx-road line{stroke:rgba(255,255,255,.2);stroke-width:2;vector-effect:non-scaling-stroke;stroke-dasharray:14 22}
.fx.go .fx-road line{animation:fxdash .35s linear infinite}
@keyframes fxdash{to{stroke-dashoffset:-36}}

/* traits de vitesse */
.fx-rays{position:absolute;inset:-30%;opacity:0;
  background:repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.16) 0deg .6deg,transparent .6deg 9deg);
  -webkit-mask-image:radial-gradient(circle at 50% 46%,transparent 8%,#000 60%);
          mask-image:radial-gradient(circle at 50% 46%,transparent 8%,#000 60%)}
.fx.go .fx-rays{animation:fxrays 2.6s .1s linear forwards}
@keyframes fxrays{0%{opacity:0;transform:scale(.6)}55%{opacity:0;transform:scale(.8)}80%{opacity:.7;transform:scale(1.2)}100%{opacity:.9;transform:scale(2.2)}}

/* la voiture : minuscule au point de fuite -> plein écran */
.fx-car{position:absolute;left:50%;top:46%;width:min(92vw,520px);transform-origin:50% 60%;opacity:0;will-change:transform;
  transform:translate(-50%,-50%) scale(.025)}
.fx.go .fx-car{animation:fxdrive 2.6s .1s linear forwards}
@keyframes fxdrive{
  0%  {transform:translate(-50%,-50%) scale(.025);opacity:0}
  6%  {opacity:1}
  40% {transform:translate(-50%,-50%) scale(.09)}
  65% {transform:translate(-50%,-50%) scale(.26)}
  80% {transform:translate(-50%,-50%) scale(.75)}
  92% {transform:translate(-50%,-50%) scale(2.8)}
  100%{transform:translate(-50%,-50%) scale(14);opacity:1}
}
.fx-car img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none;pointer-events:none}
.fx.go .fx-car img{animation:fxshake .07s linear infinite alternate}
@keyframes fxshake{from{transform:translate(-.4px,0)}to{transform:translate(.4px,.5px)}}

/* voile final : garantit un écran entièrement couvert avant la révélation du site */
.fx-cover{position:absolute;inset:0;background:#050507;opacity:0}
.fx.go .fx-cover{animation:fxcover 2.6s .1s linear forwards}
@keyframes fxcover{0%,86%{opacity:0}100%{opacity:1}}

.fx-skip{position:absolute;bottom:calc(22px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;font-size:.62rem;letter-spacing:.22em;text-transform:uppercase;color:#55556a;font-family:'Rajdhani',sans-serif}
`;

export default function Intro({ onDone }) {
  const [ready, setReady] = useState(false);
  const [out, setOut] = useState(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  // sécurité : si l'image n'arrive pas en 3 s, on saute l'intro
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => cb.current(), 3000);
    return () => clearTimeout(t);
  }, [ready]);

  // une fois l'image chargée, on lance l'animation
  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(() => setOut(true), 2500);   // fondu de l'intro
    const t2 = setTimeout(() => cb.current(), 3150);   // retrait complet
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ready]);

  const skip = () => { setOut(true); setTimeout(() => cb.current(), 450); };

  return (
    <div className={`fx${ready ? " go" : ""}${out ? " out" : ""}`} onClick={skip}>
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
        <img
          src="/f1-intro.webp"
          alt=""
          onLoad={() => setReady(true)}
          onError={() => cb.current()}
        />
      </div>

      <div className="fx-cover" />
      <div className="fx-skip">Touche pour passer</div>
    </div>
  );
}
