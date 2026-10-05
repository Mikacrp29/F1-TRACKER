import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, BOX, MAT, Tires, SignText } from "./shared";
import Car from "./Car";

// Panneau d'enseigne : biseaux asymétriques (haut-gauche / bas-droite)
const SIGN_GEO = (() => {
  const w = 3.3, h = 0.575, c = 0.3;
  const s = new THREE.Shape();
  s.moveTo(-w, -h);
  s.lineTo(w - c, -h);
  s.lineTo(w, -h + c);
  s.lineTo(w, h);
  s.lineTo(-w + c, h);
  s.lineTo(-w, h - c);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false });
})();

const GREEN = new THREE.Color("#b8f400");
const RED = new THREE.Color("#ff3b30");
const COOL = new THREE.Color("#d6e6ff");
const WARN = new THREE.Color("#ff4a3a");

// Un stand. Repère local : l'ouverture regarde +x ; `g.yaw` la tourne vers la caméra.
export default function Garage({ g, decor = false, active = false, anyActive = false, alertActive = false, detail = true, onSelect }) {
  const isAlert = g.id === "alerts";
  const alarm = isAlert && alertActive; // le rouge n'apparaît que s'il y a une vraie alerte
  const dir = g.x <= 0 ? 1 : -1;        // côté de la voiture (symétrique de part et d'autre du centre)
  const hover = useRef(0);
  const want = useRef(0);
  const lightRef = useRef(null);

  const ledMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#b8f400", toneMapped: false }), []);
  const liveryMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b8f400", roughness: 0.3, metalness: 0.2, emissive: "#b8f400", emissiveIntensity: 0.05 }), []);
  const standby = useMemo(() => new THREE.MeshBasicMaterial({ color: "#b8f400", transparent: true, opacity: 0.06, depthWrite: false }), []);
  const spill = useMemo(
    () => new THREE.MeshBasicMaterial({ map: MAT.soft.map, color: "#c4d8ff", transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    []
  );
  useEffect(() => () => { ledMat.dispose(); liveryMat.dispose(); standby.dispose(); spill.dispose(); }, [ledMat, liveryMat, standby, spill]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    hover.current = THREE.MathUtils.damp(hover.current, active ? 1 : want.current, 8, Math.min(dt, 0.05));
    const h = hover.current;
    const tint = alarm ? RED : GREEN;
    let pulse = 1;
    if (alarm) pulse = 0.85 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.2));
    else if (isAlert) pulse = 0.7;
    else if (decor) pulse = 0.5;
    ledMat.color.copy(tint).multiplyScalar((0.8 + h) * pulse);
    liveryMat.emissiveIntensity = 0.05 + 0.7 * h;
    standby.color.copy(tint);
    standby.opacity = 0.05 + 0.1 * h;
    spill.color.copy(alarm ? WARN : COOL);
    spill.opacity = 0.22 + 0.3 * h;
    if (lightRef.current) {
      lightRef.current.intensity = (22 + 22 * h) * (alarm ? pulse : 1);
      lightRef.current.color.copy(alarm ? WARN : COOL);
    }
  });

  const over = (e) => {
    if (anyActive) return;
    e.stopPropagation();
    want.current = 1;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    want.current = 0;
    document.body.style.cursor = "auto";
  };
  const down = (e) => {
    if (anyActive) return;
    e.stopPropagation();
    want.current = 1;
  };
  const click = (e) => {
    if (anyActive) return;
    e.stopPropagation();
    if (e.delta > 8) { out(); return; } // c'était un glissement, pas un clic
    out();
    if (onSelect) onSelect(g.id);
  };

  return (
    <group position={[g.x, 0, g.z]} rotation={[0, g.yaw, 0]}>
      {/* ── structure métallique ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={MAT.concrete}>
        <planeGeometry args={[8, 7.4]} />
      </mesh>
      <Box p={[-4.05, 2.3, 0]} s={[0.3, 4.6, 7.8]} m={MAT.darkSteel} />
      <Box p={[0, 2.3, 3.9]} s={[8.2, 4.6, 0.3]} m={MAT.darkSteel} />
      <Box p={[0, 2.3, -3.9]} s={[8.2, 4.6, 0.3]} m={MAT.darkSteel} />
      <Box p={[0.1, 4.75, 0]} s={[8.6, 0.35, 8.2]} m={MAT.darkSteel} />
      {[3.95, -3.95].map((z) => (
        <group key={z}>
          <Box p={[4.2, 2.3, z]} s={[0.4, 4.6, 0.4]} m={MAT.darkSteel} />
          <Box p={[4.42, 2.3, z]} s={[0.04, 4.4, 0.18]} m={MAT.steel} />
        </group>
      ))}
      {/* auvent en porte-à-faux + bande lumineuse blanche dessous */}
      <Box p={[4.9, 4.6, 0]} s={[1.9, 0.2, 8.2]} m={MAT.darkSteel} />
      <Box p={[5.7, 4.49, 0]} s={[0.06, 0.03, 7.6]} m={MAT.whiteLed} />

      {/* ── enseigne ── */}
      <group position={[5.0, 3.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={SIGN_GEO} material={MAT.signPanel} />
        {!decor && (
          <>
            <SignText position={[-2.55, 0.02, 0.2]} fontSize={0.34} color="#8d96a0" anchorX="center" anchorY="middle">
              {g.num}
            </SignText>
            <Box p={[-1.85, 0, 0.19]} s={[0.02, 0.7, 0.02]} m={MAT.steel} />
          </>
        )}
        <SignText position={[decor ? 0 : 0.58, 0.06, 0.2]} fontSize={0.52} letterSpacing={0.06} color="#f3f5f7" anchorX="center" anchorY="middle">
          {g.label}
        </SignText>
        <Box p={[decor ? 0 : 0.58, -0.4, 0.19]} s={[1.1, 0.045, 0.02]} m={ledMat} />
        <Box p={[-3.0, 0.4, 0.19]} s={[0.1, 0.1, 0.02]} m={ledMat} />
        <Box p={[-0.15, -0.56, 0.19]} s={[6.1, 0.03, 0.02]} m={ledMat} />
      </group>

      {/* ── intérieur : plafond technique, éclairage froid ── */}
      <Box p={[0, 4.5, 0]} s={[7.9, 0.06, 7.6]} m={MAT.carbon} />
      {[-2.2, 0, 2.2].map((z) => (
        <Box key={z} p={[-0.3, 4.46, z]} s={[6.8, 0.04, 0.18]} m={MAT.whiteLed} />
      ))}
      <Box p={[-2, 4.35, 0]} s={[0.12, 0.18, 7.7]} m={MAT.steel} />
      <Box p={[1, 4.35, 0]} s={[0.12, 0.18, 7.7]} m={MAT.steel} />
      <Box p={[0.5, 2.4, 3.72]} s={[0.05, 2.6, 0.03]} m={MAT.whiteLed} />
      <Box p={[0.5, 2.4, -3.72]} s={[0.05, 2.6, 0.03]} m={MAT.whiteLed} />

      {/* mur du fond : cadre de l'écran mural (le contenu réel s'affiche ici) */}
      <Box p={[-3.85, 2.2, 0]} s={[0.06, 3.9, 6.2]} m={MAT.signPanel} />
      <Box p={[-3.82, 4.2, 0]} s={[0.1, 0.08, 6.4]} m={MAT.steel} />
      <Box p={[-3.82, 0.2, 0]} s={[0.1, 0.08, 6.4]} m={MAT.steel} />
      <Box p={[-3.82, 2.2, 3.15]} s={[0.1, 4.0, 0.08]} m={MAT.steel} />
      <Box p={[-3.82, 2.2, -3.15]} s={[0.1, 4.0, 0.08]} m={MAT.steel} />
      <Box p={[-3.76, 4.2, 2.9]} s={[0.03, 0.05, 0.25]} m={ledMat} />
      <Box p={[-3.76, 4.2, -2.9]} s={[0.03, 0.05, 0.25]} m={ledMat} />
      <mesh position={[-3.8, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} material={standby}>
        <planeGeometry args={[6.0, 3.8]} />
      </mesh>

      {/* équipement : établi + écrans, coffre à outils, étagères, pneus */}
      <Box p={[0.8, 0.45, 3.35]} s={[3.0, 0.9, 0.7]} m={MAT.darkSteel} />
      <Box p={[0.8, 0.92, 3.35]} s={[3.1, 0.04, 0.75]} m={MAT.steel} />
      <Box p={[0.2, 1.3, 3.45]} s={[0.7, 0.42, 0.04]} m={MAT.monitor} />
      <Box p={[1.3, 1.3, 3.45]} s={[0.7, 0.42, 0.04]} m={MAT.monitor} />
      <Box p={[-1.8, 0.55, -3.4]} s={[1.0, 1.1, 0.65]} m={MAT.darkSteel} />
      {[0.3, 0.6, 0.9].map((y) => (
        <Box key={y} p={[-1.29, y, -3.4]} s={[0.02, 0.02, 0.6]} m={MAT.steel} />
      ))}
      <Box p={[1.8, 1.2, -3.65]} s={[2.0, 0.04, 0.3]} m={MAT.steel} />
      <Box p={[1.8, 1.8, -3.65]} s={[2.0, 0.04, 0.3]} m={MAT.steel} />
      <Box p={[0.8, 1.5, -3.65]} s={[0.04, 1.8, 0.3]} m={MAT.steel} />
      <Box p={[2.8, 1.5, -3.65]} s={[0.04, 1.8, 0.3]} m={MAT.steel} />
      <Tires p={[-3.2, 0, 3.2]} n={3} />
      <Tires p={[2.4, 0, -2.9]} n={4} />

      {/* lumière du garage qui déborde sur l'asphalte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.8, 0.025, 0]} material={spill}>
        <planeGeometry args={[7, 8.4]} />
      </mesh>
      {!decor && <pointLight ref={lightRef} position={[0, 3.9, 0]} color="#d6e6ff" intensity={22} distance={13} decay={2} />}

      {/* ── devant le stand : monoplace + matériel, discrets ── */}
      {!decor && (
        <>
          <Car p={[7.0, 0, 2.3 * dir]} rotY={dir * 1.1} liveryMat={liveryMat} simple={!detail} />
          {detail && (
            <>
              <Tires p={[6.4, 0, -3.2 * dir]} n={3} />
              <Box p={[7.6, 0.06, -2.2 * dir]} s={[0.95, 0.1, 0.95]} m={MAT.rubber} />
              <Box p={[7.6, 0.16, -2.2 * dir]} s={[0.95, 0.1, 0.95]} m={MAT.rubber} />
              <Box p={[7.95, 0.2, -2.2 * dir]} s={[0.04, 0.03, 0.2]} m={ledMat} />
              <Box p={[7.8, 0.55, -3.4 * dir]} s={[0.9, 0.6, 0.5]} m={MAT.darkSteel} />
              <Box p={[8.3, 0.75, 3.6 * dir]} s={[0.05, 1.5, 0.05]} m={MAT.steel} />
              <Box p={[8.3, 1.55, 3.6 * dir]} s={[0.04, 0.5, 0.7]} m={MAT.signPanel} />
              <Box p={[8.33, 1.7, 3.6 * dir]} s={[0.02, 0.05, 0.4]} m={ledMat} />
            </>
          )}
        </>
      )}

      {/* zone cliquable : stand + voiture, invisible */}
      {!decor && (
        <mesh
          geometry={BOX}
          position={[2, 2.4, 0]}
          scale={[12.4, 4.9, 7.9]}
          material={MAT.zone}
          onPointerOver={over}
          onPointerOut={out}
          onPointerDown={down}
          onClick={click}
        />
      )}
    </group>
  );
}
