import { useMemo } from "react";
import * as THREE from "three";
import { Text, MeshReflectorMaterial } from "@react-three/drei";
import PaddockCamera from "./PaddockCamera";
import Garage from "./Garage";
import GarageScreen from "./GarageScreen";
import { GARAGES, DECOR } from "./layout";
import { Box, MAT, Tires } from "./shared";

function Floor({ reflect }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]}>
      <planeGeometry args={[130, 150]} />
      {reflect ? (
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={1.4}
          roughness={1}
          depthScale={0.8}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0b0c0f"
          metalness={0.6}
        />
      ) : (
        <meshStandardMaterial color="#0d0e11" metalness={0.5} roughness={0.35} />
      )}
    </mesh>
  );
}

// Voie des stands : deux lignes qui convergent vers l'Accueil, ligne de mur devant les garages, logo au sol
function Lane() {
  return (
    <group>
      <Box p={[-4.75, 0.015, -1]} s={[0.12, 0.01, 22]} m={MAT.line} />
      <Box p={[4.75, 0.015, -1]} s={[0.12, 0.01, 22]} m={MAT.line} />
      <Box p={[0, 0.015, -10.6]} s={[60, 0.01, 0.12]} m={MAT.line} />
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.5]} fontSize={1.8} letterSpacing={0.18} color="#ffffff" fillOpacity={0.5} anchorX="center" anchorY="middle">
        F1 TRACKER
      </Text>
    </group>
  );
}

function Flag({ p }) {
  return (
    <group position={p}>
      <Box p={[0, 3, 0]} s={[0.07, 6, 0.07]} m={MAT.carbon} />
      <mesh position={[0.6, 5.1, 0]} material={MAT.flag}>
        <planeGeometry args={[1.2, 1.9]} />
      </mesh>
      <Box p={[0.6, 4.2, 0.01]} s={[1.2, 0.06, 0.02]} m={MAT.led} />
    </group>
  );
}

function Props() {
  return (
    <group>
      {[-22.5, -13.5, -4.5, 4.5, 13.5, 22.5].map((x) => (
        <Flag key={x} p={[x, 0, -10.8]} />
      ))}
      {[-15.5, -6.5, 6.5, 15.5].map((x) => (
        <Tires key={x} p={[x, 0, -9.4]} n={4} />
      ))}
      {[-12, 3.2, 12, 21].map((x) => (
        <Box key={x} p={[x, 0.4, -9.2]} s={[0.9, 0.8, 0.6]} m={MAT.panel} />
      ))}
    </group>
  );
}

// Ciel de coucher de soleil derrière les toits (sans image à charger)
function Sky() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 256, 0, 0);
    g.addColorStop(0, "rgba(255,150,70,0.95)");
    g.addColorStop(0.25, "rgba(190,80,70,0.55)");
    g.addColorStop(0.6, "rgba(60,40,90,0.25)");
    g.addColorStop(1, "rgba(6,7,10,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh position={[0, 36, -100]}>
      <planeGeometry args={[300, 56]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
    </mesh>
  );
}

export default function PaddockScene({ inside, arrived, introDone, quality, degraded, alertActive, onSelect, onArrive, screen, panRef }) {
  const reflect = quality.reflect && !degraded;
  const lights = quality.lights && !degraded;
  const activeG = GARAGES.find((g) => g.id === inside);

  return (
    <>
      <color attach="background" args={["#06070a"]} />
      <fog attach="fog" args={["#090a0e", 30, 110]} />
      <ambientLight intensity={0.32} />
      <hemisphereLight args={["#8fa4c8", "#0a0a0c", 0.35]} />
      <directionalLight position={[-6, 14, -40]} intensity={1.0} color="#ffb27a" />
      <directionalLight position={[0, 10, 30]} intensity={0.55} color="#9fb4ff" />

      <Floor reflect={reflect} />
      <Lane />
      <Props />
      <Sky />

      {GARAGES.map((g) => (
        <Garage key={g.id} g={g} active={inside === g.id} anyActive={!!inside} alertActive={alertActive} lights={lights} onSelect={onSelect} />
      ))}
      {DECOR.map((g) => (
        <Garage key={g.id} g={g} decor anyActive={!!inside} lights={lights} />
      ))}

      {arrived && activeG && <GarageScreen g={activeG}>{screen}</GarageScreen>}

      <PaddockCamera inside={inside} introDone={introDone} onArrive={onArrive} panRef={panRef} />
    </>
  );
}
