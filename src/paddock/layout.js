// Plan du paddock : les garages sont alignés DE FACE, la caméra glisse de gauche à droite.
//   Résultats | Calendrier | ACCUEIL | Classement | Alerte
export const SCREEN_Y = 2.2;     // hauteur du centre de l'écran mural
export const ROW_Z = -16;        // profondeur de la rangée de garages
export const YAW = -Math.PI / 2; // ouverture du garage tournée vers la caméra (+z)

export const HOME_Y = 2.0;       // hauteur de la caméra dans le paddock
export const HOME_Z = 10;        // distance : plus petit = plus près des garages
export const HOME_LOOK_Y = 2.6;
export const PAN_MAX = 14;       // limite du déplacement gauche/droite

const GREEN = "#b8f400";
const RED = "#ff3b30";

// page = identifiant de page déjà utilisé par App.js
export const GARAGES = [
  { id: "results",   page: "results",   label: "RÉSULTATS",  x: -18, accent: GREEN },
  { id: "calendar",  page: "calendar",  label: "CALENDRIER", x: -9,  accent: GREEN },
  { id: "home",      page: "home",      label: "ACCUEIL",    x: 0,   accent: GREEN },
  { id: "standings", page: "standings", label: "CLASSEMENT", x: 9,   accent: GREEN },
  { id: "alerts",    page: "alerts",    label: "ALERTE",     x: 18,  accent: RED },
].map((g) => ({ ...g, z: ROW_Z, yaw: YAW }));

// garages décoratifs (non cliquables) aux deux extrémités
export const DECOR = [
  { id: "decor-l", label: "F1 TRACKER", x: -27, accent: GREEN },
  { id: "decor-r", label: "F1 TRACKER", x: 27,  accent: GREEN },
].map((g) => ({ ...g, z: ROW_Z, yaw: YAW }));

export const GARAGE_XS = GARAGES.map((g) => g.x);

// Écran mural : 100 px de CSS = 1 unité 3D (voir DISTANCE_FACTOR)
export const SCREEN_PX = { landscape: { w: 600, h: 380 }, portrait: { w: 340, h: 520 } };
export const PX_PER_UNIT = 100;
export const DISTANCE_FACTOR = 400 / PX_PER_UNIT;

export const isPortrait = (aspect) => aspect < 0.9;
export const fovFor = (aspect) => (isPortrait(aspect) ? 62 : 48);

export const homePos = (x) => [x, HOME_Y, HOME_Z];
export const homeLook = (x) => [x, HOME_LOOK_Y, ROW_Z];

// repère du garage -> repère du monde (l'ouverture du garage est +x local)
export function toWorld(g, lx, y, lz) {
  const c = Math.cos(g.yaw);
  const s = Math.sin(g.yaw);
  return [g.x + c * lx + s * lz, y, g.z - s * lx + c * lz];
}

// distance caméra-écran pour que l'écran remplisse bien la vue
export function fitDistance(aspect, fovDeg) {
  const s = isPortrait(aspect) ? SCREEN_PX.portrait : SCREEN_PX.landscape;
  const wU = (s.w / PX_PER_UNIT) * 1.1;
  const hU = (s.h / PX_PER_UNIT) * 1.2;
  const t = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const d = Math.max(wU / 2 / (aspect * t), hU / 2 / t);
  return Math.min(7.6, Math.max(3.6, d));
}

export function interiorPose(g, aspect) {
  const d = fitDistance(aspect, fovFor(aspect));
  return {
    pos: toWorld(g, -3.85 + d, 1.9, 0),  // à l'intérieur, face au mur du fond
    look: toWorld(g, -3.85, SCREEN_Y, 0),
    mid: toWorld(g, 9, 1.85, 0),         // point de passage : devant le garage
  };
}
