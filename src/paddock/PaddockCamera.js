import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GARAGES, HOME_POS, HOME_LOOK, interiorPose, fovFor } from "./layout";

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Une seule règle : la caméra suit `inside` (id de garage ou null = pit-lane).
export default function PaddockCamera({ inside, introDone, onArrive }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;

  const anim = useRef({ t: 1, dur: 2, curve: null, look0: V(HOME_LOOK), look1: V(HOME_LOOK), ease: easeInOut, arrive: false });
  const look = useRef(V(HOME_LOOK));
  const started = useRef(false);
  const prev = useRef(null);
  const insideRef = useRef(inside);
  insideRef.current = inside;
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;

  // lance un trajet courbe depuis la position actuelle
  const fly = useRef(null);
  fly.current = (pts, lookTo, dur, ease) => {
    const a = anim.current;
    a.curve = new THREE.CatmullRomCurve3([camera.position.clone(), ...pts.map(V)], false, "centripetal");
    a.look0 = look.current.clone();
    a.look1 = V(lookTo);
    a.t = 0;
    a.dur = dur;
    a.ease = ease;
    a.arrive = true;
  };

  useEffect(() => {
    camera.fov = fovFor(aspect);
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  // révélation du paddock quand l'intro est terminée
  useEffect(() => {
    if (!introDone || started.current) return;
    started.current = true;
    fly.current([[0, 1.68, 20], HOME_POS], HOME_LOOK, 3.6, easeOut);
  }, [introDone]);

  // entrée / sortie d'un garage
  useEffect(() => {
    const before = prev.current;
    prev.current = inside;
    if (!started.current) return;
    const g = GARAGES.find((x) => x.id === inside);
    if (before !== inside) {
      if (g) {
        const pose = interiorPose(g, aspect);
        fly.current([pose.mid, pose.pos], pose.look, 2.4, easeInOut);
      } else {
        const from = GARAGES.find((x) => x.id === before);
        const pts = from ? [interiorPose(from, aspect).mid, HOME_POS] : [HOME_POS];
        fly.current(pts, HOME_LOOK, 2.2, easeInOut);
      }
    } else if (g) {
      // redimensionnement pendant qu'on est dans le garage : on recale sans animer
      const pose = interiorPose(g, aspect);
      camera.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
      look.current.set(pose.look[0], pose.look[1], pose.look[2]);
      anim.current.t = 1;
    }
  }, [inside, aspect, camera]);

  useFrame((state, dt) => {
    const a = anim.current;
    const d = Math.min(dt, 0.05);
    if (a.t < 1) {
      a.t = Math.min(1, a.t + d / a.dur);
      const e = a.ease(a.t);
      a.curve.getPoint(e, camera.position);
      look.current.lerpVectors(a.look0, a.look1, THREE.MathUtils.smoothstep(e, 0, 1));
      if (a.t >= 1 && a.arrive) {
        a.arrive = false;
        if (arriveRef.current) arriveRef.current(insideRef.current);
      }
    } else if (!insideRef.current && started.current) {
      // pit-lane : léger parallaxe (caméra limitée)
      const px = state.pointer.x;
      const py = state.pointer.y;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, HOME_POS[0] + px * 1.2, 3, d);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, HOME_POS[1] + py * 0.18, 3, d);
      look.current.x = THREE.MathUtils.damp(look.current.x, HOME_LOOK[0] + px * 3, 3, d);
    }
    camera.lookAt(look.current);
  });

  return null;
}
