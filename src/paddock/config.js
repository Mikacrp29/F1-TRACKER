// Dimensions des images (en pixels) : le panorama et les photos de garage n'ont pas la même taille.
export const PW = 1983; // panorama
export const PH = 793;
export const GW = 1454; // photos des garages
export const GH = 720;
const DIR = "/paddock/";

export const PANO = DIR + "panorama.webp";

// hot = zone cliquable sur le panorama (pixels du panorama, PW × PH)
// tv  = écran mural dans la photo du garage (pixels des photos, GW × GH) : le contenu réel s'affiche à cet endroit
// Ordre = de gauche à droite sur le panorama.
export const GARAGES = [
  { id: "results",   page: "results",   label: "RÉSULTATS",  img: DIR + "resultats.webp",  hot: { x: 0,    y: 240, w: 380, h: 290 }, tv: { x: 447, y: 262, w: 543, h: 143 } },
  { id: "calendar",  page: "calendar",  label: "CALENDRIER", img: DIR + "calendrier.webp", hot: { x: 435,  y: 240, w: 350, h: 290 }, tv: { x: 482, y: 258, w: 480, h: 152 } },
  { id: "home",      page: "home",      label: "ACCUEIL",    img: DIR + "accueil.webp",    hot: { x: 823,  y: 240, w: 375, h: 330 }, tv: { x: 535, y: 247, w: 377, h: 165 } },
  { id: "standings", page: "standings", label: "CLASSEMENT", img: DIR + "classement.webp", hot: { x: 1205, y: 240, w: 370, h: 290 }, tv: { x: 541, y: 248, w: 381, h: 164 } },
  { id: "alerts",    page: "alerts",    label: "ALERTE",     img: DIR + "alerte.webp",     hot: { x: 1600, y: 240, w: 383, h: 290 }, tv: { x: 542, y: 248, w: 380, h: 164 } },
];
