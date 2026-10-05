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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -35]}>
      <planeGeometry args={[46, 140]} />
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

function Lane() {
  return (
    <group>
      {Array.from({ length: 16 }).map((_, i) => (
        <Box key={i} p={[0, 0.015, 14 - i * 6.5]} s={[0.22, 0.01, 3.2]} m={MAT.line} />
      ))}
      <Box p={[-4.75, 0.015, -35]} s={[0.12, 0.01, 140]} m={MAT.line} />
      <Box p={[4.75, 0.015, -35]} s={[0.12, 0.01, 140]} m={MAT.line} />
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 5]} fontSize={1.5} letterSpacing={0.18} color="#ffffff" fillOpacity={0.5} anchorX="center" anchorY="middle">
        F1 TRACKER
      </Text>
    </group>
  );
}

function Flag({ p, ry }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
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
      {[-10.5, -19.5, -28.5].map((z) => (
        <group key={z}>
          <Flag p={[-5.2, 0, z]} ry={0} />
          <Flag p={[5.2, 0, z]} ry={Math.PI} />
        </group>
      ))}
      {[8, -1, -10.5, -19.5].map((z) => (
        <Tires key={z} p={[-4.2, 0, z + 1]} n={4} />
      ))}
      {[6, -10.5, -28.5].map((z) => (
        <Tires key={z} p={[4.2, 0, z - 1]} n={3} />
      ))}
      <Box p={[4.1, 0.4, 2]} s={[0.9, 0.8, 0.6]} m={MAT.panel} />
      <Box p={[-4.1, 0.4, -12]} s={[0.9, 0.8, 0.6]} m={MAT.panel} />
      <Box p={[4.1, 0.4, -21.5]} s={[0.9, 0.8, 0.6]} m={MAT.panel} />
    </group>
  );
}

// Fond de piste : tribune en silhouette + lueur de coucher de soleil (sans modèle ni image à charger)
function Horizon() {
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
    <group>
      <mesh position={[0, 19, -100]}>
        <planeGeometry args={[260, 50]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
      </mesh>
      <Box p={[0, 3, -70]} s={[34, 6, 6]} m={MAT.carbon} />
      <Box p={[0, 5.6, -66.9]} s={[34, 0.12, 0.1]} m={MAT.led} />
    </group>
  );
}

export default function PaddockScene({ inside, arrived, introDone, quality, degraded, alertActive, onSelect, onArrive, screen }) {
  const reflect = quality.reflect && !degraded;
  const lights = quality.lights && !degraded;
  const activeG = GARAGES.find((g) => g.id === inside);

  return (
    <>
      <color attach="background" args={["#06070a"]} />
      <fog attach="fog" args={["#090a0e", 22, 95]} />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#8fa4c8", "#0a0a0c", 0.35]} />
      <directionalLight position={[-6, 14, -40]} intensity={1.1} color="#ffb27a" />

      <Floor reflect={reflect} />
      <Lane />
      <Props />
      <Horizon />

      {GARAGES.map((g) => (
        <Garage key={g.id} g={g} active={inside === g.id} anyActive={!!inside} alertActive={alertActive} lights={lights} onSelect={onSelect} />
      ))}
      {DECOR.map((g) => (
        <Garage key={g.id} g={g} decor anyActive={!!inside} lights={lights} />
      ))}

      {arrived && activeG && <GarageScreen g={activeG}>{screen}</GarageScreen>}

      <PaddockCamera inside={inside} introDone={introDone} onArrive={onArrive} />
    </>
  );
}
