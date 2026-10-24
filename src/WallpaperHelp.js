import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// TUTO « FOND D'ÉCRAN LIVE » : explique comment afficher le site (mode ?fond) en fond d'écran, sur PC et sur Mac.
// Si le fichier /public/tuto-fond-ecran.mp4 existe, la vidéo motion design s'affiche en haut de la page.
// ─────────────────────────────────────────────────────────────────────

const LIVELY = "https://github.com/rocksdanister/lively";
const PLASH = "https://sindresorhus.com/plash";

const STEPS = {
  windows: [
    { t: "Installe Lively Wallpaper", d: "Gratuit, sur le Microsoft Store (cherche « Lively Wallpaper ») ou sur sa page officielle.", link: [LIVELY, "Page officielle de Lively"] },
    { t: "Ouvre Lively et clique sur « + »", d: "Le bouton « + » se trouve en haut de la fenêtre de Lively." },
    { t: "Colle le lien et valide", d: "Colle le lien ci-dessus dans le champ prévu, puis clique sur OK." },
    { t: "Définis-le comme fond d'écran", d: "Clique sur la vignette qui vient d'apparaître dans ta bibliothèque, ou fais un clic droit puis « Set as wallpaper »." },
  ],
  mac: [
    { t: "Installe Plash", d: "Gratuit, sur le Mac App Store. Vérifie sur sa page qu'il est compatible avec ta version de macOS.", link: [PLASH, "Page officielle de Plash"] },
    { t: "Ouvre Plash", d: "Une petite icône apparaît dans la barre de menus, en haut de l'écran. Clique dessus pour ouvrir son menu." },
    { t: "Ajoute un site web", d: "Dans le menu de l'icône, choisis l'option pour ajouter un site web (« Add Website… »). Les libellés peuvent varier selon la version." },
    { t: "Colle le lien et valide", d: "Colle le lien ci-dessus, puis valide : la page s'affiche alors sur ton bureau." },
  ],
};

const CSS = `
.wh-wrap{padding-bottom:28px}
.wh-lead{font-size:.92rem;line-height:1.35;color:#e4e4ec;text-shadow:0 1px 6px rgba(0,0,0,.8);margin-bottom:12px}
.wh-card{background:rgba(18,18,22,.8);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:13px 14px;margin-bottom:12px}
.wh-lbl{font-family:'Orbitron',sans-serif;font-size:.5rem;font-weight:700;letter-spacing:.14em;color:var(--red);margin-bottom:7px}
.wh-link{display:flex;gap:8px}
.wh-link input{flex:1;min-width:0;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font:600 .82rem 'Rajdhani',sans-serif;padding:8px 10px}
.wh-btn{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.82rem;letter-spacing:.04em;padding:8px 14px;border-radius:8px;border:1px solid var(--red);background:var(--red);color:#fff;cursor:pointer;flex-shrink:0}
.wh-video{display:block;width:100%;max-height:60vh;border-radius:12px;background:#000;margin-bottom:12px;border:1px solid rgba(255,255,255,.12)}
.wh-tabs{display:flex;gap:8px;margin-bottom:12px}
.wh-tab{flex:1;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.66rem;letter-spacing:.1em;padding:11px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(18,18,22,.75);color:#c9c9d6;cursor:pointer}
.wh-tab.on{border-color:#b8f400;color:#fff;background:rgba(184,244,0,.12)}
.wh-step{display:flex;gap:12px;align-items:flex-start;background:rgba(18,18,22,.8);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:12px 14px;margin-bottom:9px;opacity:0;animation:wh-in .5s ease forwards;transition:border-color .4s,background .4s,transform .4s}
.wh-step.on{border-color:#b8f400;background:rgba(184,244,0,.1);transform:translateX(3px)}
.wh-n{flex:0 0 30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-weight:900;font-size:.8rem;background:rgba(255,255,255,.1);color:#fff;transition:background .4s,color .4s,box-shadow .4s}
.wh-step.on .wh-n{background:#b8f400;color:#0a0a0c;box-shadow:0 0 14px rgba(184,244,0,.7)}
.wh-t{font-weight:700;font-size:.98rem;line-height:1.2}
.wh-d{font-size:.84rem;line-height:1.35;color:#c4c4d2;margin-top:3px}
.wh-d a{color:#b8f400}
.wh-note{font-size:.76rem;line-height:1.4;color:#b4b4c4;text-shadow:0 1px 6px rgba(0,0,0,.8);margin-top:6px}
.wh-note b{color:#e4e4ec}
@keyframes wh-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.wh-step{animation:none;opacity:1;transition:none}}
`;

const isMac = () => {
  try { return /Macintosh/i.test(navigator.userAgent || ""); } catch (e) { return false; }
};

export default function WallpaperHelp({ onBack }) {
  const url = `${window.location.origin}/?fond`;
  const [os, setOs] = useState(() => (isMac() ? "mac" : "windows"));
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const inputRef = useRef(null);

  // vidéo du tuto : affichée seulement si le fichier existe vraiment (le site renvoie sinon une page HTML)
  useEffect(() => {
    let stop = false;
    fetch("/tuto-fond-ecran.mp4", { method: "HEAD" })
      .then((r) => { if (!stop && r.ok && /^video\//i.test(r.headers.get("content-type") || "")) setHasVideo(true); })
      .catch(() => {});
    return () => { stop = true; };
  }, []);

  // mise en avant des étapes, l'une après l'autre
  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) return undefined;
    setActive(0);
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS[os].length), 2400);
    return () => clearInterval(id);
  }, [os]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (e) {
      try { inputRef.current.select(); document.execCommand("copy"); setCopied(true); } catch (e2) {}
    }
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fade wh-wrap">
      <style>{CSS}</style>
      <button className="back" style={{ color: "#e4e4ec", textShadow: "0 1px 6px rgba(0,0,0,.8)" }} onClick={onBack}>‹ Retour</button>
      <div className="ptitle">Fond d'écran live</div>
      <p className="wh-lead">Affiche le compte à rebours et les sessions de la semaine directement sur ton bureau, mis à jour en direct. Le tuto se fait sur ton <b>ordinateur</b> : copie le lien ci-dessous et ouvre-le là-bas.</p>

      {hasVideo && (
        <video className="wh-video" src="/tuto-fond-ecran.mp4" controls playsInline preload="metadata" />
      )}

      <div className="wh-card">
        <div className="wh-lbl">TON LIEN FOND D'ÉCRAN</div>
        <div className="wh-link">
          <input ref={inputRef} readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Lien du fond d'écran" />
          <button className="wh-btn" onClick={copy}>{copied ? "Copié ✓" : "Copier"}</button>
        </div>
      </div>

      <div className="wh-tabs" role="tablist">
        <button role="tab" aria-selected={os === "windows"} className={`wh-tab${os === "windows" ? " on" : ""}`} onClick={() => setOs("windows")}>WINDOWS</button>
        <button role="tab" aria-selected={os === "mac"} className={`wh-tab${os === "mac" ? " on" : ""}`} onClick={() => setOs("mac")}>MAC</button>
      </div>

      {STEPS[os].map((s, i) => (
        <div key={`${os}-${i}`} className={`wh-step${active === i ? " on" : ""}`} style={{ animationDelay: `${i * 0.14}s` }}>
          <div className="wh-n">{i + 1}</div>
          <div>
            <div className="wh-t">{s.t}</div>
            <div className="wh-d">
              {s.d}
              {s.link && <> <a href={s.link[0]} target="_blank" rel="noopener noreferrer">{s.link[1]} ↗</a></>}
            </div>
          </div>
        </div>
      ))}

      <p className="wh-note"><b>Bon à savoir :</b> une connexion internet est nécessaire pour que le fond se mette à jour. Sur un ordinateur professionnel, vérifie d'abord auprès de ton service informatique que tu peux installer ce type de logiciel.</p>
      <p className="wh-note"><b>Sans rien installer :</b> ouvre le lien dans ton navigateur et appuie sur F11 pour l'afficher en plein écran.</p>
    </div>
  );
}
