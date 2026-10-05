import * as THREE from "three";

export const BOX = new THREE.BoxGeometry(1, 1, 1);

export const MAT = {
  carbon: new THREE.MeshStandardMaterial({ color: "#0c0d10", metalness: 0.75, roughness: 0.38 }),
  panel:  new THREE.MeshStandardMaterial({ color: "#17181d", metalness: 0.55, roughness: 0.5 }),
  floor:  new THREE.MeshStandardMaterial({ color: "#1a1b20", metalness: 0.35, roughness: 0.4 }),
  rubber: new THREE.MeshStandardMaterial({ color: "#08080a", metalness: 0.1, roughness: 0.9 }),
  screen: new THREE.MeshStandardMaterial({ color: "#050506", metalness: 0.6, roughness: 0.3 }),
  flag:   new THREE.MeshStandardMaterial({ color: "#0a0a0c", metalness: 0.2, roughness: 0.8, side: THREE.DoubleSide }),
  led:    new THREE.MeshBasicMaterial({ color: "#b8f400", toneMapped: false }),
  white:  new THREE.MeshBasicMaterial({ color: "#e8eeff", toneMapped: false }),
  line:   new THREE.MeshBasicMaterial({ color: "#f0f0f4", toneMapped: false }),
  zone:   new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
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
