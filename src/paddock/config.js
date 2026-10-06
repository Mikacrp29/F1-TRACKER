// Toutes les coordonnées sont en pixels de l'image d'origine (1454 × 720).
export const IW = 1454;
export const IH = 720;
const DIR = "/paddock/";

export const PANO = DIR + "panorama.webp";

// hot = zone cliquable sur le panorama
// tv  = écran mural dans la photo du garage (le contenu réel s'affiche à cet endroit)
// Ordre = de gauche à droite sur le panorama.
export const GARAGES = [
  { id: "results",   page: "results",   label: "RÉSULTATS",  img: DIR + "resultats.webp",  hot: { x: 0,    y: 255, w: 278, h: 200 }, tv: { x: 447, y: 262, w: 543, h: 143 } },
  { id: "calendar",  page: "calendar",  label: "CALENDRIER", img: DIR + "calendrier.webp", hot: { x: 305,  y: 255, w: 262, h: 200 }, tv: { x: 482, y: 258, w: 480, h: 152 } },
  { id: "home",      page: "home",      label: "ACCUEIL",    img: DIR + "accueil.webp",    hot: { x: 585,  y: 255, w: 280, h: 225 }, tv: { x: 535, y: 247, w: 377, h: 165 } },
  { id: "standings", page: "standings", label: "CLASSEMENT", img: DIR + "classement.webp", hot: { x: 885,  y: 255, w: 270, h: 200 }, tv: { x: 541, y: 248, w: 381, h: 164 } },
  { id: "alerts",    page: "alerts",    label: "ALERTE",     img: DIR + "alerte.webp",     hot: { x: 1190, y: 255, w: 264, h: 200 }, tv: { x: 542, y: 248, w: 380, h: 164 } },
];
