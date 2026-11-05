// FORMULA DESK – Widget Scriptable v3 (look du site f1-call.netlify.app)
// Prochain Grand Prix : circuit, compte à rebours en blocs, sessions du week-end.
// Données : API Jolpica-F1.

// ---------- Réglages ----------
const SITE_URL = "https://f1-call.netlify.app";
// Image de fond (ex: ton panorama du paddock). Laisser vide = dégradé bleu nuit.
const BG_URL = "https://f1-call.netlify.app/paddock/panorama.webp";
const BG_FOCUS_X = 0.5; // partie du panorama affichée : 0 = gauche, 0.5 = centre, 1 = droite
const FONT_TITLE = "Futura-Bold"; // police intégrée à iOS (les polices du site ne peuvent pas être chargées)
const FONT_TEXT = "Futura-Medium";

const API = "https://api.jolpi.ca/ergast/f1/current/next.json";
const CACHE_FILE = "f1-widget-cache.json";

const C = {
  navyTop: new Color("#050a1c"),
  navyBottom: new Color("#0d2150"),
  metal: new Color("#9aa3b2"),
  dim: new Color("#5d6678"),
  white: new Color("#ffffff"),
  green: new Color("#b6ff1a"), // vert fluo du site
};

const FLAGS = {
  Australia: "🇦🇺", China: "🇨🇳", Japan: "🇯🇵", Bahrain: "🇧🇭", "Saudi Arabia": "🇸🇦",
  USA: "🇺🇸", "United States": "🇺🇸", Italy: "🇮🇹", Monaco: "🇲🇨", Canada: "🇨🇦",
  Spain: "🇪🇸", Austria: "🇦🇹", UK: "🇬🇧", "United Kingdom": "🇬🇧", Hungary: "🇭🇺",
  Belgium: "🇧🇪", Netherlands: "🇳🇱", Azerbaijan: "🇦🇿", Singapore: "🇸🇬", Mexico: "🇲🇽",
  Brazil: "🇧🇷", Qatar: "🇶🇦", UAE: "🇦🇪", "United Arab Emirates": "🇦🇪",
};

// ---------- Données ----------
async function loadRace() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
  try {
    const req = new Request(API);
    req.timeoutInterval = 15;
    const json = await req.loadJSON();
    const race = json.MRData.RaceTable.Races[0];
    if (race) {
      fm.writeString(path, JSON.stringify(race));
      return race;
    }
  } catch (e) {
    // pas de réseau : cache
  }
  if (fm.fileExists(path)) return JSON.parse(fm.readString(path));
  return null;
}

function toDate(s) {
  if (!s || !s.date) return null;
  return new Date(`${s.date}T${s.time || "12:00:00Z"}`);
}

function buildSessions(race) {
  const list = [
    ["EL1", race.FirstPractice],
    ["EL2", race.SecondPractice],
    ["EL3", race.ThirdPractice],
    ["SPRINT Q.", race.SprintQualifying || race.SprintShootout],
    ["SPRINT", race.Sprint],
    ["QUALI", race.Qualifying],
    ["COURSE", { date: race.date, time: race.time }],
  ];
  return list
    .map(([name, s]) => ({ name, date: toDate(s) }))
    .filter((s) => s.date)
    .sort((a, b) => a.date - b.date);
}

// ---------- Helpers ----------
function fmt(date, pattern) {
  const df = new DateFormatter();
  df.locale = "fr_FR";
  df.dateFormat = pattern;
  return df.string(date);
}

function txt(stack, text, size, color, title) {
  const t = stack.addText(text);
  t.textColor = color;
  t.font = new Font(title ? FONT_TITLE : FONT_TEXT, size);
  return t;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// Bloc "04 / JOURS" avec soulignement vert, comme sur le site
function box(parent, value, label, width, size) {
  const col = parent.addStack();
  col.layoutVertically();
  col.size = new Size(width, 0);
  const v = txt(col, value, size, C.white, true);
  v.centerAlignText();
  v.lineLimit = 1;
  v.minimumScaleFactor = 0.6;
  const l = txt(col, label, 6.5, C.metal);
  l.centerAlignText();
  l.lineLimit = 1;
  l.minimumScaleFactor = 0.6;
  col.addSpacer(2);
  const u = col.addStack();
  u.size = new Size(width, 2);
  u.backgroundColor = C.green;
}

function countdown(parent, date, small) {
  const ms = Math.max(0, date - new Date());
  const DAY = 24 * 3600 * 1000;
  if (ms > DAY) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const row = parent.addStack();
    const w = small ? 34 : 38;
    const s = small ? 19 : 20;
    box(row, pad(days), "JOURS", w, s);
    row.addSpacer(4);
    box(row, pad(hours), "HEURES", w, s);
    row.addSpacer(4);
    box(row, pad(mins), "MIN", w, s);
  } else {
    // Moins de 24h : compte à rebours en direct
    const t = parent.addDate(date);
    t.applyTimerStyle();
    t.textColor = C.green;
    t.font = new Font(FONT_TITLE, small ? 24 : 28);
  }
}

async function applyBackground(w, small) {
  if (BG_URL) {
    try {
      const img = await new Request(BG_URL).loadImage();
      // Recadrage au format du widget + réduction (limite mémoire des widgets)
      const ratio = small ? 1 : 2.1;
      const outW = 700;
      const outH = Math.round(outW / ratio);
      const iw = img.size.width;
      const ih = img.size.height;
      let sw, sh;
      if (iw / ih > ratio) {
        sh = ih;
        sw = ih * ratio;
      } else {
        sw = iw;
        sh = iw / ratio;
      }
      const sx = (iw - sw) * BG_FOCUS_X;
      const sy = (ih - sh) * 0.5;
      const k = outW / sw;
      const dc = new DrawContext();
      dc.size = new Size(outW, outH);
      dc.respectScreenScale = false;
      dc.drawImageInRect(img, new Rect(-sx * k, -sy * k, iw * k, ih * k));
      dc.setFillColor(new Color("#000814", 0.65));
      dc.fillRect(new Rect(0, 0, outW, outH));
      w.backgroundImage = dc.getImage();
      return;
    } catch (e) {
      // image indisponible : dégradé
    }
  }
  const g = new LinearGradient();
  g.colors = [C.navyTop, C.navyBottom];
  g.locations = [0, 1];
  g.startPoint = new Point(0.3, 0);
  g.endPoint = new Point(0.7, 1);
  w.backgroundGradient = g;
}

// ---------- Widget ----------
async function buildWidget() {
  const w = new ListWidget();
  w.setPadding(12, 14, 12, 12);
  w.url = SITE_URL;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  await applyBackground(w, (config.widgetFamily || "medium") === "small");

  const race = await loadRace();
  if (!race) {
    txt(w, "FORMULA DESK", 14, C.green, true);
    txt(w, "Données indisponibles", 11, C.metal);
    return w;
  }

  const sessions = buildSessions(race);
  const now = new Date();
  const next = sessions.find((s) => s.date > now);
  const finished = !next;
  const target = next || sessions[sessions.length - 1];
  const small = (config.widgetFamily || "medium") === "small";
  const loc = race.Circuit.Location;
  const flag = FLAGS[loc.country] || "🏁";
  const gpName = race.raceName.replace("Grand Prix", "GP");

  // En-tête : ● FORMULA DESK ........ LIVE · 2026
  const head = w.addStack();
  head.centerAlignContent();
  txt(head, "●", 7, C.green);
  head.addSpacer(5);
  txt(head, "FORMULA ", 11, C.white, true);
  txt(head, "DESK", 11, C.green, true);
  if (!small) {
    head.addSpacer();
    txt(head, `LIVE · ${now.getFullYear()}`, 8, C.metal);
  }
  w.addSpacer(6);

  const body = w.addStack();
  body.layoutHorizontally();

  const left = body.addStack();
  left.layoutVertically();

  txt(left, finished ? "WEEK-END TERMINÉ" : (small ? target.name : "PROCHAIN GRAND PRIX"), 8, C.green);
  left.addSpacer(2);
  const title = txt(left, `${flag} ${gpName}`, small ? 14 : 17, C.white, true);
  title.lineLimit = 2;
  title.minimumScaleFactor = 0.7;

  if (small) {
    left.addSpacer(6);
    if (!finished) countdown(left, target.date, true);
    left.addSpacer(4);
    if (!finished) txt(left, `${fmt(target.date, "EEE d MMM")} · ${fmt(target.date, "HH'h'mm")}`, 9, C.white);
    return w;
  }

  const sub = txt(left, `${race.Circuit.circuitName.replace("Autódromo ", "")}`, 8.5, C.metal);
  sub.lineLimit = 1;
  sub.minimumScaleFactor = 0.7;
  const date = txt(left, `${loc.locality} · ${fmt(sessions[sessions.length - 1].date, "d MMM")}`, 8.5, C.metal);
  date.lineLimit = 1;
  left.addSpacer(8);
  if (!finished) countdown(left, target.date, false);

  body.addSpacer(10);

  // Sessions du week-end
  const right = body.addStack();
  right.layoutVertically();
  right.size = new Size(160, 0);
  right.backgroundColor = new Color("#000814", 0.45);
  right.cornerRadius = 10;
  right.setPadding(6, 6, 6, 6);

  txt(right, "SESSIONS DU WEEK-END", 7, C.metal);
  right.addSpacer(3);

  const fs = sessions.length > 5 ? 9 : 10;
  const gap = sessions.length > 5 ? 1 : 3;

  sessions.forEach((s, i) => {
    const passed = s.date < now;
    const isNext = s === next;
    const row = right.addStack();
    row.centerAlignContent();
    row.setPadding(2, 5, 2, 5);
    row.cornerRadius = 5;
    if (isNext) row.backgroundColor = new Color("#b6ff1a", 0.22);

    const nameColor = passed ? C.dim : isNext ? C.green : C.white;
    if (isNext) {
      txt(row, "● ", 6, C.green);
    }
    txt(row, s.name, fs, nameColor, true);
    row.addSpacer();
    txt(row, fmt(s.date, "EEE d").replace(".", ""), 8, passed ? C.dim : C.metal);
    row.addSpacer(5);
    txt(row, fmt(s.date, "HH'h'mm"), fs, passed ? C.dim : C.white, true);

    if (i < sessions.length - 1) right.addSpacer(gap);
  });

  return w;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
