// Plan du paddock. Le couloir (pit-lane) va de z=+15 (caméra) vers z=-100 (horizon).
export const GARAGE_X = 9;        // centre d'un garage (x)
export const WALL_X = 12.85;      // face intérieure du mur du fond
export const SCREEN_Y = 2.2;      // hauteur du centre de l'écran mural

export const HOME_POS = [0, 1.75, 15];
export const HOME_LOOK = [0, 2.1, -30];

const GREEN = "#b8f400";
const RED = "#ff3b30";

// page = identifiant de page déjà utilisé par App.js
export const GARAGES = [
  { id: "home",      page: "home",      label: "ACCUEIL",    side: -1, z: -6,  accent: GREEN },
  { id: "calendar",  page: "calendar",  label: "CALENDRIER", side: -1, z: -15, accent: GREEN },
  { id: "results",   page: "results",   label: "RÉSULTATS",  side: -1, z: -24, accent: GREEN },
  { id: "standings", page: "standings", label: "CLASSEMENT", side: 1,  z: -6,  accent: GREEN },
  { id: "alerts",    page: "alerts",    label: "ALERTE",     side: 1,  z: -15, accent: RED },
];

// garage décoratif (non cliquable) pour équilibrer la pit-lane
export const DECOR = [{ id: "hospitality", label: "F1 TRACKER", side: 1, z: -24, accent: GREEN }];

// Écran mural : 100 px de CSS = 1 unité 3D (voir DISTANCE_FACTOR)
export const SCREEN_PX = { landscape: { w: 600, h: 380 }, portrait: { w: 340, h: 520 } };
export const PX_PER_UNIT = 100;
export const DISTANCE_FACTOR = 400 / PX_PER_UNIT; // réglage drei <Html transform> : 1 unité = 400/DF px

export const isPortrait = (aspect) => aspect < 0.9;
export const fovFor = (aspect) => (isPortrait(aspect) ? 62 : 48);

// distance caméra-écran pour que l'écran remplisse bien la vue
export function fitDistance(aspect, fovDeg) {
  const s = isPortrait(aspect) ? SCREEN_PX.portrait : SCREEN_PX.landscape;
  const wU = (s.w / PX_PER_UNIT) * 1.1;
  const hU = (s.h / PX_PER_UNIT) * 1.2;
  const t = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const d = Math.max(wU / 2 / (aspect * t), hU / 2 / t);
  return Math.min(8, Math.max(3.6, d));
}

export function interiorPose(g, aspect) {
  const d = fitDistance(aspect, fovFor(aspect));
  return {
    pos: [g.side * (WALL_X - d), 1.9, g.z],
    look: [g.side * WALL_X, SCREEN_Y, g.z],
    mid: [g.side * 2.2, 1.8, g.z + 4.5], // point de passage : on s'engage depuis la pit-lane
  };
}
