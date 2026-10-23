import React, { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// PAGE VIDÉOS : la liste vient de /public/videos.json (à modifier sur GitHub).
// Rien n'est chargé chez TikTok / Instagram tant que le visiteur n'a pas cliqué sur « Lire ».
// ─────────────────────────────────────────────────────────────────────

const PLATFORMS = {
  tiktok: { label: "TikTok", color: "#25f4ee" },
  instagram: { label: "Instagram", color: "#ff5fa2" },
};

const platformOf = (v) => {
  if (v.platform && PLATFORMS[v.platform]) return v.platform;
  if (/instagram\.com/i.test(v.url || "")) return "instagram";
  return "tiktok";
};

// Adresse du lecteur intégré, ou null si on ne peut pas la déduire du lien
// (ex. lien court vm.tiktok.com : dans ce cas on propose seulement « Ouvrir »).
const embedUrl = (v) => {
  const url = v.url || "";
  if (platformOf(v) === "instagram") {
    const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (!m) return null;
    const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
    return { src: `https://www.instagram.com/${kind}/${m[2]}/embed`, height: 700 };
  }
  const id = (v.id && String(v.id).match(/^\d+$/) && String(v.id)) || (url.match(/\/video\/(\d+)/) || [])[1];
  if (!id) return null;
  return { src: `https://www.tiktok.com/embed/v2/${id}`, height: 740 };
};

// On n'ouvre que des liens https vers TikTok / Instagram
const safeLink = (url) => (/^https:\/\/([a-z0-9-]+\.)*(tiktok|instagram)\.com\//i.test(url || "") ? url : null);

const CSS = `
.vgrid{display:flex;flex-direction:column;gap:10px}
.vcard{background:var(--bg3);border:1px solid var(--bd);border-radius:13px;padding:13px 14px}
.vtop{display:flex;align-items:center;gap:9px}
.vbadge{font-family:'Orbitron',sans-serif;font-size:.5rem;font-weight:700;letter-spacing:.1em;padding:2px 7px;border-radius:20px;border:1px solid currentColor;flex-shrink:0}
.vtitle{flex:1;font-weight:700;font-size:.95rem;line-height:1.2}
.vdate{font-size:.66rem;color:var(--g2)}
.vact{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
.vbtn{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;letter-spacing:.04em;padding:7px 14px;border-radius:8px;border:1px solid var(--bd);background:var(--bg4);color:var(--w);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.vbtn.main{background:var(--red);border-color:var(--red)}
.vframe{display:block;width:100%;max-width:340px;margin:12px auto 0;border:0;border-radius:10px;background:#000}
.vnote{font-size:.62rem;color:var(--g2);margin-top:8px;line-height:1.35}
`;

export default function Videos({ onBack }) {
  const [list, setList] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(null); // index de la vidéo en lecture

  useEffect(() => {
    let stop = false;
    fetch("/videos.json", { cache: "no-cache" })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => { if (!stop) setList(Array.isArray(d) ? d : []); })
      .catch(() => { if (!stop) setError(true); });
    return () => { stop = true; };
  }, []);

  return (
    <div className="fade">
      <style>{CSS}</style>
      <button className="back" onClick={onBack}>‹ Retour</button>
      <div className="ptitle">Vidéos</div>

      {error && <div className="empty"><p>Impossible de charger les vidéos.<br />Réessaie dans un instant.</p></div>}
      {!error && list === null && <div className="empty"><p>Chargement…</p></div>}
      {!error && list && list.length === 0 && <div className="empty"><p>Aucune vidéo pour le moment.</p></div>}

      {list && list.length > 0 && (
        <div className="vgrid">
          {list.map((v, i) => {
            const p = platformOf(v);
            const meta = PLATFORMS[p];
            const emb = embedUrl(v);
            const link = safeLink(v.url);
            const playing = open === i && emb;
            return (
              <div key={`${v.url}-${i}`} className="vcard">
                <div className="vtop">
                  <span className="vbadge" style={{ color: meta.color }}>{meta.label}</span>
                  <div className="vtitle">{v.title || "Vidéo"}</div>
                </div>
                {v.date && <div className="vdate" style={{ marginTop: 4 }}>{v.date}</div>}
                <div className="vact">
                  {emb && (
                    <button className="vbtn main" onClick={() => setOpen(playing ? null : i)}>
                      {playing ? "Fermer" : "▶ Lire"}
                    </button>
                  )}
                  {link && (
                    <a className={`vbtn${emb ? "" : " main"}`} href={link} target="_blank" rel="noopener noreferrer">
                      Ouvrir sur {meta.label} ↗
                    </a>
                  )}
                </div>
                {playing && (
                  <>
                    <iframe
                      className="vframe"
                      style={{ height: emb.height }}
                      src={emb.src}
                      title={v.title || "Vidéo"}
                      allow="fullscreen; encrypted-media; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                    <div className="vnote">Lecteur fourni par {meta.label} : en lançant la lecture, {meta.label} peut placer ses propres cookies.</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="note">Rien n'est chargé depuis TikTok ou Instagram avant que tu appuies sur « Lire »</div>
    </div>
  );
}
