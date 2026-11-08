import React, { useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────
// LANGUE DU SITE : français par défaut, anglais au choix (bouton FR | EN).
// Le choix est mémorisé dans le navigateur (localStorage « fd-lang »).
// Utilisation : T("texte français", "english text")
// ─────────────────────────────────────────────────────────────────────

const KEY = "fd-lang";
let lang = "fr";
try {
  const saved = localStorage.getItem(KEY);
  if (saved === "en" || saved === "fr") lang = saved;
} catch (e) {}
try { document.documentElement.lang = lang; } catch (e) {}

const subs = new Set();

export const getLang = () => lang;
export const setLang = (l) => {
  if (l !== "fr" && l !== "en") return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch (e) {}
  try { document.documentElement.lang = l; } catch (e) {}
  subs.forEach((f) => f());
};

// à appeler dans le composant racine : il se redessine quand la langue change
export const useLang = () =>
  useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => lang
  );

export const T = (fr, en) => (lang === "en" ? en : fr);
export const locale = () => (lang === "en" ? "en-GB" : "fr-FR");

const OPTS = [
  { id: "fr", flag: "fr", label: "FR", name: "Français" },
  { id: "en", flag: "gb", label: "EN", name: "English" },
];

// Sélecteur de langue : deux petits boutons drapeau + code
export function LangSwitch() {
  useLang();
  const stop = (e) => e.stopPropagation();
  return (
    <span role="group" aria-label="Langue / Language" onPointerDown={stop} onClick={stop} style={{ display: "inline-flex", gap: 4, pointerEvents: "auto" }}>
      {OPTS.map((o) => {
        const on = lang === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setLang(o.id)}
            aria-pressed={on}
            aria-label={o.name}
            title={o.name}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
              padding: "3px 7px", borderRadius: 14, font: "700 .56rem Orbitron,sans-serif", letterSpacing: ".08em",
              color: on ? "#fff" : "#a8afbb",
              background: on ? "rgba(184,244,0,.14)" : "rgba(0,0,0,.35)",
              border: `1px solid ${on ? "#b8f400" : "rgba(255,255,255,.16)"}`,
              opacity: on ? 1 : 0.8,
            }}
          >
            <img src={`https://flagcdn.com/w20/${o.flag}.png`} srcSet={`https://flagcdn.com/w40/${o.flag}.png 2x`} alt="" width={15} height={11} style={{ borderRadius: 2, objectFit: "cover" }} />
            {o.label}
          </button>
        );
      })}
    </span>
  );
}
