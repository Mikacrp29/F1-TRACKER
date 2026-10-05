import { Box, MAT } from "./shared";

function Wheel({ p, r, w }) {
  return (
    <group position={p} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={MAT.rubber}>
        <cylinderGeometry args={[r, r, w, 18]} />
      </mesh>
      <mesh material={MAT.rim}>
        <cylinderGeometry args={[r * 0.58, r * 0.58, w + 0.01, 14]} />
      </mesh>
    </group>
  );
}

// Monoplace stylisée (échelle réelle ≈ 5,4 m), avant = +x. `simple` allège pour mobile.
export default function Car({ p = [0, 0, 0], rotY = 0, liveryMat, simple = false }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {/* plancher, monocoque, nez */}
      <Box p={[0.1, 0.16, 0]} s={[4.6, 0.06, 1.5]} m={MAT.carbon} />
      <Box p={[0.2, 0.42, 0]} s={[2.0, 0.38, 0.62]} m={MAT.paint} />
      <mesh position={[1.75, 0.33, 0]} rotation={[0, 0, -Math.PI / 2]} material={MAT.paint}>
        <cylinderGeometry args={[0.07, 0.22, 1.7, 10]} />
      </mesh>

      {/* pontons, capot moteur, prise d'air, arrière */}
      <Box p={[-0.2, 0.34, 0.5]} s={[1.3, 0.34, 0.4]} m={MAT.paintWhite} />
      <Box p={[-0.2, 0.34, -0.5]} s={[1.3, 0.34, 0.4]} m={MAT.paintWhite} />
      <Box p={[-1.05, 0.58, 0]} s={[1.5, 0.3, 0.34]} m={MAT.paint} />
      <Box p={[-0.25, 0.78, 0]} s={[0.34, 0.32, 0.3]} m={MAT.paint} />
      <Box p={[-0.08, 0.8, 0]} s={[0.04, 0.22, 0.22]} m={MAT.rubber} />
      <Box p={[-1.9, 0.4, 0]} s={[0.9, 0.22, 0.42]} m={MAT.paint} />

      {/* livery : filet vert fin */}
      <Box p={[-1.05, 0.74, 0]} s={[1.5, 0.012, 0.1]} m={liveryMat} />
      <Box p={[0.2, 0.62, 0]} s={[2.0, 0.012, 0.1]} m={liveryMat} />

      {/* cockpit, casque, halo */}
      <Box p={[0.45, 0.62, 0]} s={[0.6, 0.04, 0.34]} m={MAT.rubber} />
      <mesh position={[0.4, 0.68, 0]} material={MAT.paintWhite}>
        <sphereGeometry args={[0.13, 12, 10]} />
      </mesh>
      {!simple && (
        <>
          <mesh position={[0.55, 0.62, 0]} material={MAT.carbon}>
            <torusGeometry args={[0.3, 0.02, 6, 14, Math.PI]} />
          </mesh>
          <Box p={[0.8, 0.72, 0]} s={[0.04, 0.3, 0.04]} m={MAT.carbon} />
        </>
      )}

      {/* aileron avant */}
      <Box p={[2.65, 0.1, 0]} s={[0.5, 0.03, 1.9]} m={MAT.carbon} />
      <Box p={[2.45, 0.19, 0]} s={[0.34, 0.03, 1.7]} m={MAT.carbon} />
      <Box p={[2.6, 0.17, 0.95]} s={[0.6, 0.2, 0.03]} m={MAT.paint} />
      <Box p={[2.6, 0.17, -0.95]} s={[0.6, 0.2, 0.03]} m={MAT.paint} />

      {/* aileron arrière + feu de pluie */}
      <Box p={[-2.55, 0.86, 0]} s={[0.42, 0.04, 1.45]} m={MAT.carbon} />
      <Box p={[-2.55, 1.0, 0]} s={[0.3, 0.03, 1.42]} m={MAT.carbon} />
      <Box p={[-2.55, 0.78, 0.73]} s={[0.62, 0.5, 0.03]} m={MAT.paint} />
      <Box p={[-2.55, 0.78, -0.73]} s={[0.62, 0.5, 0.03]} m={MAT.paint} />
      <Box p={[-2.45, 0.5, 0]} s={[0.1, 0.7, 0.08]} m={MAT.carbon} />
      <Box p={[-2.76, 0.62, 0]} s={[0.03, 0.14, 0.1]} m={MAT.redLed} />

      {/* roues */}
      <Wheel p={[1.35, 0.33, 0.8]} r={0.33} w={0.3} />
      <Wheel p={[1.35, 0.33, -0.8]} r={0.33} w={0.3} />
      <Wheel p={[-1.55, 0.36, 0.78]} r={0.36} w={0.42} />
      <Wheel p={[-1.55, 0.36, -0.78]} r={0.36} w={0.42} />
      {!simple && (
        <>
          <Box p={[1.35, 0.3, 0.5]} s={[0.05, 0.05, 0.55]} m={MAT.carbon} />
          <Box p={[1.35, 0.3, -0.5]} s={[0.05, 0.05, 0.55]} m={MAT.carbon} />
          <Box p={[-1.55, 0.3, 0.5]} s={[0.05, 0.05, 0.55]} m={MAT.carbon} />
          <Box p={[-1.55, 0.3, -0.5]} s={[0.05, 0.05, 0.55]} m={MAT.carbon} />
        </>
      )}
    </group>
  );
}
