"use client";

import { useMeteorStore } from "@/lib/store/meteorStore";
import type { ImpactResults } from "@/types/asteroid";
import { ImpactOverlay2D } from "./ImpactOverlay2D";

interface ImpactCoordinatorProps {
  results: ImpactResults;
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
}

export function ImpactCoordinator({
  results,
  width,
  height,
  centerX,
  centerY,
}: ImpactCoordinatorProps) {
  const { isAnimating } = useMeteorStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 2D Canvas Effects - Physics-based animation */}
      <ImpactOverlay2D 
        results={results} 
        width={width} 
        height={height}
        centerX={centerX}
        centerY={centerY}
      />
    </div>
  );
}
