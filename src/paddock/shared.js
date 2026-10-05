import React from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { asphaltTexture, carbonTexture, screenTexture, glowTexture, skidTexture } from "./textures";

export const BOX = new THREE.BoxGeometry(1, 1, 1);

const std = (o) => new THREE.MeshStandardMaterial(o);
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
const basic = (o) => new THREE.MeshBasicMaterial(o);

// Matériaux : chacun a un rôle lisible (asphalte, métal, carbone, caoutchouc, peinture, LED, écran)
export const MAT = {
  asphalt:    std({ map: asphaltTexture(), color: "#c9c9ce", roughness: 0.92, metalness: 0 }),
  concrete:   std({ color: "#2a2c31", roughness: 0.35, metalness: 0.15 }),
  darkSteel:  std({ color: "#23262b", roughness: 0.42, metalness: 0.85 }),
  steel:      std({ color: "#a3a9b1", roughness: 0.32, metalness: 0.95 }),
  signPanel:  std({ color: "#0c0d10", roughness: 0.28, metalness: 0.75 }),
  carbon:     std({ map: carbonTexture(), color: "#cfcfd4", roughness: 0.35, metalness: 0.45 }),
  rubber:     std({ color: "#09090b", roughness: 0.92, metalness: 0.05 }),
  rim:        std({ color: "#8d939b", roughness: 0.25, metalness: 1 }),
  paint:      phys({ color: "#0f1114", metalness: 0.65, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }),
  paintWhite: phys({ color: "#e8ebef", metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
  flag:       std({ color: "#0a0a0c", metalness: 0.2, roughness: 0.8, side: THREE.DoubleSide }),
  led:        basic({ color: "#b8f400", toneMapped: false }),
  whiteLed:   basic({ color: "#e4efff", toneMapped: false }),
  redLed:     basic({ color: "#ff2a2a", toneMapped: false }),
  line:       basic({ color: "#f4f4f6", toneMapped: false }),
  monitor:    basic({ map: screenTexture(1), toneMapped: false }),
  skid:       basic({ map: skidTexture(), color: "#000000", transparent: true, opacity: 0.55, depthWrite: false }),
  soft:       basic({ map: glowTexture(), color: "#000000", transparent: true, opacity: 0.3, depthWrite: false }),
  zone:       basic({ transparent: true, opacity: 0, depthWrite: false }),
};

export function Box({ p, s, m, ...rest }) {
  return <mesh geometry={BOX} position={p} scale={s} material={m} {...rest} />;
}

export function Tires({ p, n = 3 }) {
  return (
    <group position={p}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[0, 0.17 + i * 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.rubber}>
          <cylinderGeometry args={[0.34, 0.34, 0.3, 14]} />
        </mesh>
      ))}
    </group>
  );
}

// Typographie des enseignes : Orbitron (comme le reste de l'app). Si la police ne charge pas, police par défaut.
const FONT = "https://cdn.jsdelivr.net/fontsource/fonts/orbitron@latest/latin-700-normal.woff";

class TextBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SignText({ children, ...props }) {
  return (
    <TextBoundary fallback={<Text {...props}>{children}</Text>}>
      <Text font={FONT} {...props}>
        {children}
      </Text>
    </TextBoundary>
  );
}
