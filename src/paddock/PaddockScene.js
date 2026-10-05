import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import PaddockCamera from "./PaddockCamera";
import Garage from "./Garage";
import GarageScreen from "./GarageScreen";
import { GARAGES, DECOR } from "./layout";
import { Box, BOX, MAT, SignText } from "./shared";
import { facadeTexture } from "./textures";

/* ═══ 1. PREMIER PLAN : la pit-lane ═══ */

function Floor({ reflect }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]} material={reflect ? undefined : MAT.asphalt}>
      <planeGeometry args={[130, 150]} />
      {reflect && (
        <MeshReflectorMaterial
          map={MAT.asphalt.map}
          blur={[400, 160]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.9}
          roughness={1}
          depthScale={0.8}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#b9b9bf"
          metalness={0.2}
        />
      )}
    </mesh>
  );
}

// Marquages : lignes de voie, LIGNE BLANCHE séparant la voie rapide de la zone des stands, emplacements, traces
function Lane() {
  const bays = [-22.5, -13.5, -4.5, 4.5, 13.5, 22.5];
  const skids = [
    [-12, -3.2, 16, 0.5, 0.05],
    [-2, -3.6, 22, 0.45, -0.03],
    [10, -2.8, 18, 0.55, 0.04],
  ];
  return (
    <group>
      <Box p={[0, 0.016, -6.4]} s={[84, 0.01, 0.3]} m={MAT.line} />
      <Box p={[-4.75, 0.015, 1.8]} s={[0.12, 0.01, 16.4]} m={MAT.line} />
      <Box p={[4.75, 0.015, 1.8]} s={[0.12, 0.01, 16.4]} m={MAT.line} />
      {bays.map((x) => (
        <Box key={x} p={[x, 0.015, -9.0]} s={[0.1, 0.01, 5.2]} m={MAT.line} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, -1.2]} material={MAT.soft}>
        <planeGeometry args={[80, 5]} />
      </mesh>
      {skids.map(([x, z, w, h, r], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, r]} position={[x, 0.012, z]} material={MAT.skid}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}
      <SignText rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -0.6]} fontSize={1.5} letterSpacing={0.16} color="#ffffff" fillOpacity={0.45} anchorX="center" anchorY="middle">
        F1 TRACKER
      </SignText>
    </group>
  );
}

function Flag({ p }) {
  return (
    <group position={p}>
      <Box p={[0, 3, 0]} s={[0.07, 6, 0.07]} m={MAT.darkSteel} />
      <mesh position={[0.6, 5.1, 0]} material={MAT.flag}>
        <planeGeometry args={[1.2, 1.9]} />
      </mesh>
      <Box p={[0.6, 4.2, 0.01]} s={[1.2, 0.05, 0.02]} m={MAT.led} />
    </group>
  );
}

/* ═══ 3. ARRIÈRE-PLAN : le paddock continue au-delà des stands (flou par le brouillard) ═══ */

// x, z, largeur, hauteur, profondeur
const BLD = [
  [-58, -52, 22, 13, 16], [-38, -40, 14, 10, 10], [-18, -38, 16, 15, 12],
  [8, -44, 20, 12, 14], [30, -38, 14, 17, 10], [52, -48, 24, 11, 16],
  [-30, -72, 26, 22, 16], [0, -80, 30, 18, 16], [34, -74, 24, 24, 16],
  [-68, -78, 24, 16, 14], [66, -82, 24, 20, 14],
];

function Backdrop() {
  const base = useMemo(() => facadeTexture(), []);
  const mats = useMemo(
    () =>
      BLD.map(([, , w, h]) => {
        const t = base.clone();
        t.needsUpdate = true;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(Math.max(1, Math.round(w / 5)), Math.max(1, Math.round(h / 5)));
        return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: "#ffffff", emissiveIntensity: 0.9, color: "#4a4e58", roughness: 0.6, metalness: 0.4 });
      }),
    [base]
  );
  return (
    <group>
      {BLD.map(([x, z, w, h, d], i) => (
        <mesh key={i} geometry={BOX} position={[x, h / 2, z]} scale={[w, h, d]} material={mats[i]} />
      ))}
      {/* passerelles */}
      <Box p={[-27, 11, -39]} s={[24, 1.0, 1.4]} m={MAT.darkSteel} />
      <Box p={[40, 9, -41]} s={[22, 1.0, 1.4]} m={MAT.darkSteel} />
      {/* pylônes d'éclairage */}
      {[[-34, -30], [34, -30], [-62, -38], [62, -38]].map(([x, z]) => (
        <group key={x}>
          <Box p={[x, 13, z]} s={[0.5, 26, 0.5]} m={MAT.darkSteel} />
          <Box p={[x, 26, z]} s={[4, 1.2, 0.4]} m={MAT.whiteLed} />
        </group>
      ))}
      {/* tribunes */}
      {[0, 1, 2].map((i) => (
        <Box key={i} p={[0, 2 + i * 3, -62 - i * 4]} s={[60, 4, 6]} m={MAT.carbon} />
      ))}
      <Box p={[0, 10.1, -67.4]} s={[60, 0.15, 0.2]} m={MAT.whiteLed} />
      {/* camions de paddock */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box p={[s * 46, 2.2, -26]} s={[9, 4.4, 2.6]} m={MAT.paintWhite} />
          <Box p={[s * 40.2, 1.6, -26]} s={[2.4, 3.2, 2.6]} m={MAT.darkSteel} />
          <Box p={[s * 46, 4.1, -24.69]} s={[9, 0.08, 0.03]} m={MAT.led} />
        </group>
      ))}
      {[-44, -34, 34, 44].map((x) => (
        <Flag key={x} p={[x, 0, -22]} />
      ))}
    </group>
  );
}

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

/* ═══ Scène ═══ */

export default function PaddockScene({ inside, arrived, introDone, quality, degraded, alertActive, onSelect, onArrive, screen, panRef }) {
  const reflect = quality.reflect && !degraded;
  const detail = quality.name !== "low" && !degraded;
  const activeG = GARAGES.find((g) => g.id === inside);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.environmentIntensity = 0.8; // reflets sur métal, peinture et verre
  }, [scene]);

  return (
    <>
      <color attach="background" args={["#06070a"]} />
      <fog attach="fog" args={["#0c0f15", 35, 130]} />

      {/* lumière naturelle : couchant chaud derrière, ciel froid devant */}
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#8fa4c8", "#0a0a0c", 0.3]} />
      <directionalLight position={[-6, 14, -40]} intensity={0.9} color="#ffb27a" />
      <directionalLight position={[0, 10, 30]} intensity={0.45} color="#9fb4ff" />

      {/* environnement de reflets généré sur place (aucune image à charger) */}
      <Environment resolution={quality.name === "high" ? 256 : 128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffb27a" position={[-30, 10, -40]} scale={[40, 14, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#a9c4ff" position={[0, 30, 0]} scale={[60, 60, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} color="#dfe9ff" position={[0, 8, 40]} scale={[60, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[40, 6, 0]} scale={[30, 6, 1]} target={[0, 0, 0]} />
      </Environment>

      <Floor reflect={reflect} />
      <Lane />
      <Backdrop />
      <Sky />
      {[-22.5, -13.5, -4.5, 4.5, 13.5, 22.5].map((x) => (
        <Flag key={x} p={[x, 0, -10.8]} />
      ))}

      {GARAGES.map((g) => (
        <Garage key={g.id} g={g} active={inside === g.id} anyActive={!!inside} alertActive={alertActive} detail={detail} onSelect={onSelect} />
      ))}
      {DECOR.map((g) => (
        <Garage key={g.id} g={g} decor anyActive={!!inside} detail={detail} />
      ))}

      {arrived && activeG && (
        <GarageScreen g={activeG} alertActive={alertActive}>
          {screen}
        </GarageScreen>
      )}

      <PaddockCamera inside={inside} introDone={introDone} onArrive={onArrive} panRef={panRef} />
    </>
  );
}
