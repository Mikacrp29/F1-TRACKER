import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { WALL_X, SCREEN_Y, SCREEN_PX, DISTANCE_FACTOR, isPortrait } from "./layout";

// Écran mural : héberge la VRAIE page de l'application (mêmes composants, mêmes données).
export default function GarageScreen({ g, children }) {
  const size = useThree((s) => s.size);
  const px = isPortrait(size.width / size.height) ? SCREEN_PX.portrait : SCREEN_PX.landscape;
  const rotY = g.side === -1 ? Math.PI / 2 : -Math.PI / 2;
  const tone = g.id === "alerts" ? "pdk-red" : "pdk-green";

  return (
    <group position={[g.side * (WALL_X - 0.08), SCREEN_Y, g.z]} rotation={[0, rotY, 0]}>
      <Html transform center distanceFactor={DISTANCE_FACTOR} zIndexRange={[30, 0]}>
        <div className={`pdk-screen ${tone}`} style={{ width: px.w, height: px.h }}>
          <div className="pdk-bar">
            <span className="pdk-led" />
            {g.label}
          </div>
          <div className="pdk-body">
            <div className="inner">{children}</div>
          </div>
        </div>
      </Html>
    </group>
  );
}
