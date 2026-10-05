import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Box, BOX, MAT, Tires } from "./shared";

// Un garage. Repère local : l'ouverture regarde +x ; `g.yaw` la tourne vers la caméra.
export default function Garage({ g, decor = false, active = false, anyActive = false, alertActive = false, lights = true, onSelect }) {
  const accent = g.accent || "#b8f400";
  const isAlert = g.id === "alerts";
  const hover = useRef(0);
  const want = useRef(0);
  const lightRef = useRef(null);

  const base = useMemo(() => new THREE.Color(accent), [accent]);
  const ledMat = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }), [accent]);
  const standby = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.07, depthWrite: false }), [accent]);
  useEffect(() => () => { ledMat.dispose(); standby.dispose(); }, [ledMat, standby]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    hover.current = THREE.MathUtils.damp(hover.current, active ? 1 : want.current, 8, Math.min(dt, 0.05));
    // Alerte : respiration discrète au repos, pulsation plus nette si un week-end est en cours
    let pulse = 1;
    if (isAlert) pulse = alertActive ? 0.85 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.2)) : 0.5 + 0.1 * Math.sin(t * 1.1);
    if (decor) pulse = 0.55;
    ledMat.color.copy(base).multiplyScalar((0.9 + 0.9 * hover.current) * pulse);
    if (lightRef.current) lightRef.current.intensity = (6 + 10 * hover.current) * pulse;
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
    want.current = 1; // retour visuel au toucher
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
      {/* structure */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={MAT.floor}>
        <planeGeometry args={[8, 7.4]} />
      </mesh>
      <Box p={[-4.05, 2.3, 0]} s={[0.3, 4.6, 7.8]} m={MAT.carbon} />
      <Box p={[0, 2.3, 3.9]} s={[8.2, 4.6, 0.3]} m={MAT.carbon} />
      <Box p={[0, 2.3, -3.9]} s={[8.2, 4.6, 0.3]} m={MAT.carbon} />
      <Box p={[0.1, 4.75, 0]} s={[8.6, 0.35, 8.2]} m={MAT.carbon} />

      {/* façade : bandeau, poteaux, LED */}
      <Box p={[4.1, 3.95, 0]} s={[0.45, 1.5, 7.9]} m={MAT.panel} />
      <Box p={[4.1, 1.6, 3.85]} s={[0.45, 3.2, 0.35]} m={MAT.carbon} />
      <Box p={[4.1, 1.6, -3.85]} s={[0.45, 3.2, 0.35]} m={MAT.carbon} />
      <Box p={[4.35, 3.2, 0]} s={[0.06, 0.07, 7.4]} m={ledMat} />
      <Box p={[4.35, 1.6, 3.6]} s={[0.05, 2.9, 0.06]} m={ledMat} />
      <Box p={[4.35, 1.6, -3.6]} s={[0.05, 2.9, 0.06]} m={ledMat} />
      <Text position={[4.345, 4.05, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.8} letterSpacing={0.08} color="#f0f0f4" anchorX="center" anchorY="middle">
        {g.label}
      </Text>
      <Box p={[4.34, 3.58, 0]} s={[0.03, 0.06, 2.4]} m={ledMat} />

      {/* intérieur : néons de plafond, écran mural en veille, matériel */}
      {[-2.2, 0, 2.2].map((z) => (
        <Box key={z} p={[-0.3, 4.52, z]} s={[6.8, 0.04, 0.14]} m={MAT.white} />
      ))}
      <Box p={[-3.85, 2.2, 0]} s={[0.06, 4.0, 6.3]} m={MAT.screen} />
      <Box p={[-3.8, 4.22, 0]} s={[0.04, 0.04, 6.3]} m={ledMat} />
      <Box p={[-3.8, 0.18, 0]} s={[0.04, 0.04, 6.3]} m={ledMat} />
      <mesh position={[-3.8, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} material={standby}>
        <planeGeometry args={[6.0, 3.8]} />
      </mesh>
      <Tires p={[3.0, 0, 2.8]} />
      <Box p={[2.8, 0.4, -2.8]} s={[1, 0.8, 0.7]} m={MAT.panel} />

      {(lights || active) && <pointLight ref={lightRef} position={[0, 3.7, 0]} color={accent} distance={12} decay={2} />}

      {/* zone cliquable : tout le garage, invisible */}
      {!decor && (
        <mesh
          geometry={BOX}
          position={[0, 2.4, 0]}
          scale={[8.4, 4.9, 7.9]}
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
