import React, { useEffect, useRef, useState } from "react";
import { WH_CSS } from "./WallpaperHelp";
import { T, useLang } from "./i18n";

// ─────────────────────────────────────────────────────────────────────
// PAGE « WIDGET IPHONE » : explique comment afficher le prochain Grand Prix (compte à rebours + sessions)
// sur l'écran d'accueil de l'iPhone, avec l'appli gratuite Scriptable.
// Le script du widget est hébergé sur ce site : /public/widget/F1-Widget.js
// → le modifier sur GitHub met à jour tous les widgets déjà installés.
// Adresse directe à partager : <site>/widget
// ─────────────────────────────────────────────────────────────────────

const SCRIPTABLE = "https://apps.apple.com/app/scriptable/id1405459188";

const steps = () => [
  { t: T("Installe Scriptable", "Install Scriptable"), d: T("Une appli gratuite de l'App Store, qui sert à afficher le widget.", "A free App Store app that displays the widget."), link: [SCRIPTABLE, T("Scriptable sur l'App Store", "Scriptable on the App Store")] },
  { t: T("Crée un nouveau script", "Create a new script"), d: T("Ouvre Scriptable et appuie sur « + » en haut à droite.", "Open Scriptable and tap “+” at the top right.") },
  { t: T("Colle le code", "Paste the code"), d: T("Colle le code copié ci-dessus, puis appuie sur ▶ en bas à droite pour voir l'aperçu. Appuie ensuite sur « Done » pour revenir à la liste. Tu peux nommer le script (par exemple « F1 »).", "Paste the code copied above, then tap ▶ at the bottom right to preview it. Tap “Done” to go back to the list. You can name the script (for example “F1”).") },
  { t: T("Ajoute le widget à l'écran d'accueil", "Add the widget to your Home Screen"), d: T("Appuie longuement sur un espace vide de l'écran d'accueil, puis sur « + ». Cherche « Scriptable », choisis la taille Moyenne (ou Petite) et appuie sur « Ajouter le widget ».", "Long-press an empty area of your Home Screen, then tap “+”. Search for “Scriptable”, pick the Medium (or Small) size and tap “Add Widget”.") },
  { t: T("Choisis ton script", "Choose your script"), d: T("Appuie sur le widget qui vient d'apparaître (l'écran d'accueil est encore en mode édition), choisis « Script » puis ton script. Valide : le widget s'affiche.", "Tap the widget that just appeared (the Home Screen is still in edit mode), choose “Script” and then your script. Confirm: the widget appears.") },
];
const STEP_COUNT = 5;

const CSS = `
.wd-code{display:block;width:100%;box-sizing:border-box;resize:none;white-space:pre;overflow-x:auto;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#d9ffa6;font:600 .7rem/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:10px}
.wd-copy{width:100%;margin-top:9px;padding:11px 14px;font-size:.92rem}
.wd-warn{background:rgba(255,202,40,.08);border:1px solid rgba(255,202,40,.28);border-radius:11px;padding:10px 12px;margin-bottom:12px;font-size:.84rem;line-height:1.35;color:#f1e3b0}
`;

const isIOS = () => {
  try {
    const ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  } catch (e) {
    return false;
  }
};

export default function WidgetHelp({ onBack }) {
  useLang();
  const base = window.location.origin;
  const scriptUrl = `${base}/widget/F1-Widget.js`;
  const pageUrl = `${base}/widget`;
  // chargeur : le widget lui-même est téléchargé depuis le site à chaque affichage
  const code = [
    `const url = "${scriptUrl}";`,
    "const code = await new Request(url).loadString();",
    'await new Function("return (async () => {" + code + "\\n})()")();',
  ].join("\n");

  const [active, setActive] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [ios] = useState(isIOS);
  const codeRef = useRef(null);
  const linkRef = useRef(null);

  // mise en avant des étapes, l'une après l'autre
  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) return undefined;
    const id = setInterval(() => setActive((a) => (a + 1) % STEP_COUNT), 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const copy = async (text, ref, setFlag) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      try { ref.current.select(); document.execCommand("copy"); } catch (e2) { return; }
    }
    setFlag(true);
    setTimeout(() => setFlag(false), 2200);
  };

  return (
    <div className="fade wh-wrap">
      <style>{WH_CSS}{CSS}</style>
      <button className="back" style={{ color: "#e4e4ec", textShadow: "0 1px 6px rgba(0,0,0,.8)" }} onClick={onBack}>{T("‹ Retour", "‹ Back")}</button>
      <div className="ptitle">{T("Widget iPhone", "iPhone Widget")}</div>
      <p className="wh-lead">{T(<>Affiche le prochain Grand Prix, son compte à rebours et le programme du week-end directement sur l'écran d'accueil de ton iPhone. C'est gratuit et ça prend environ 3 minutes, avec l'appli <b>Scriptable</b>.</>, <>Show the next Grand Prix, its countdown and the weekend schedule right on your iPhone Home Screen. It's free and takes about 3 minutes, with the <b>Scriptable</b> app.</>)}</p>

      {!ios && (
        <div className="wd-warn">{T(<>Ce widget est prévu pour <b>iPhone</b> (et iPad). Copie le lien de cette page tout en bas pour l'ouvrir sur ton iPhone.</>, <>This widget is made for <b>iPhone</b> (and iPad). Copy this page's link at the bottom to open it on your iPhone.</>)}</div>
      )}

      <div className="wh-card">
        <div className="wh-lbl">{T("CODE À COLLER (ÉTAPE 3)", "CODE TO PASTE (STEP 3)")}</div>
        <textarea ref={codeRef} className="wd-code" readOnly rows={4} wrap="off" value={code} onFocus={(e) => e.target.select()} aria-label={T("Code du widget", "Widget code")} />
        <button className="wh-btn wd-copy" onClick={() => copy(code, codeRef, setCopiedCode)}>{copiedCode ? T("Copié ✓", "Copied ✓") : T("Copier le code", "Copy the code")}</button>
      </div>

      {steps().map((s, i) => (
        <div key={i} className={`wh-step${active === i ? " on" : ""}`} style={{ animationDelay: `${i * 0.14}s` }}>
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

      <p className="wh-note">{T(<><b>Bon à savoir :</b> une connexion internet est nécessaire. iOS décide quand le widget se rafraîchit (en général toutes les 15 minutes ou plus). Le compte à rebours affiche les jours, heures et minutes, puis tourne en direct à moins de 24 h de la session. Toucher le widget ouvre le site.</>, <><b>Good to know:</b> an internet connection is required. iOS decides when the widget refreshes (usually every 15 minutes or more). The countdown shows days, hours and minutes, then runs live within 24 h of the session. Tapping the widget opens the site.</>)}</p>
      <p className="wh-note">{T(<><b>Mises à jour automatiques :</b> le code ci-dessus charge le widget depuis ce site. Quand il est amélioré, ton widget se met à jour tout seul, sans rien refaire. Ne colle que le code de cette page.</>, <><b>Automatic updates:</b> the code above loads the widget from this site. When it is improved, your widget updates by itself, with nothing to redo. Only paste the code from this page.</>)}</p>

      <div className="wh-card" style={{ marginTop: 14 }}>
        <div className="wh-lbl">{T("PARTAGE CETTE PAGE", "SHARE THIS PAGE")}</div>
        <div className="wh-link">
          <input ref={linkRef} readOnly value={pageUrl} onFocus={(e) => e.target.select()} aria-label={T("Lien de la page widget", "Widget page link")} />
          <button className="wh-btn" onClick={() => copy(pageUrl, linkRef, setCopiedLink)}>{copiedLink ? T("Copié ✓", "Copied ✓") : T("Copier", "Copy")}</button>
        </div>
      </div>
    </div>
  );
}
