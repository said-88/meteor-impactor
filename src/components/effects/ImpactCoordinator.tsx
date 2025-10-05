"use client";

import { Canvas } from "@react-three/fiber";
import { useMeteorStore } from "@/lib/store/meteorStore";
import type { ImpactResults } from "@/types/asteroid";
import { ImpactEffect3D } from "./ImpactEffect3D";
import { ImpactOverlay2D } from "./ImpactOverlay2D";

interface ImpactCoordinatorProps {
  results: ImpactResults;
  width: number;
  height: number;
}

export function ImpactCoordinator({
  results,
  width,
  height,
}: ImpactCoordinatorProps) {
  const { isAnimating } = useMeteorStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Three.js 3D Effects - Only render when animating */}
      {isAnimating && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <ImpactEffect3D results={results} />
        </Canvas>
      )}

      {/* Canvas 2D Overlay Effects - Only render when animating */}
      {isAnimating && (
        <ImpactOverlay2D results={results} width={width} height={height} />
      )}
    </div>
  );
}
