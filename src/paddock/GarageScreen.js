import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { SCREEN_Y, SCREEN_PX, DISTANCE_FACTOR, isPortrait, toWorld } from "./layout";

// Écran mural : héberge la VRAIE page de l'application (mêmes composants, mêmes données).
export default function GarageScreen({ g, children }) {
  const size = useThree((s) => s.size);
  const px = isPortrait(size.width / size.height) ? SCREEN_PX.portrait : SCREEN_PX.landscape;
  const pos = toWorld(g, -3.78, SCREEN_Y, 0);
  const tone = g.id === "alerts" ? "pdk-red" : "pdk-green";

  return (
    <group position={pos} rotation={[0, g.yaw + Math.PI / 2, 0]}>
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
