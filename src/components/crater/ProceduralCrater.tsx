/**
 * Procedural Crater Component
 * Renders procedural craters on Google Maps using Canvas
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { generateAsteroidData, type AsteroidVisualData } from '@/lib/asteroid/asteroid-data-generator';
import { generateCraterData, type CraterVisualData } from '@/lib/crater/crater-data-generator';
import { drawProceduralCrater, calculateCraterPixelRadius } from '@/lib/crater/crater-shape-generator';
import type { ImpactResults } from '@/types/asteroid';

interface ProceduralCraterProps {
  // Impact site data
  results: ImpactResults;
  asteroidData: AsteroidVisualData;

  // Position and dimensions
  position: { x: number; y: number };
  mapWidth: number;
  mapHeight: number;

  // Visual options
  showLabel?: boolean;
  className?: string;
}

/**
 * Procedural Crater Component
 */
export function ProceduralCrater({
  results,
  asteroidData,
  position,
  mapWidth,
  mapHeight,
  showLabel = true,
  className = '',
}: ProceduralCraterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const craterDataRef = useRef<CraterVisualData | null>(null);

  // Generate crater data based on asteroid parameters and impact results
  const craterData = useMemo(() => {
    return generateCraterData(asteroidData, results);
  }, [asteroidData, results]);

  // Calculate crater pixel radius based on map dimensions
  const craterPixelRadius = useMemo(() => {
    return calculateCraterPixelRadius(craterData, mapWidth, mapHeight);
  }, [craterData, mapWidth, mapHeight]);

  // Render the procedural crater
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = mapWidth;
    canvas.height = mapHeight;

    // Clear canvas
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    // Draw the procedural crater
    drawProceduralCrater(
      ctx,
      craterData,
      position.x,
      position.y,
      craterPixelRadius
    );

    // Draw crater label if enabled
    if (showLabel) {
      drawCraterLabel(ctx, position.x, position.y, craterPixelRadius);
    }
  }, [craterData, position.x, position.y, craterPixelRadius, mapWidth, mapHeight, showLabel]);

  return (
    <canvas
      ref={canvasRef}
      width={mapWidth}
      height={mapHeight}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 10,
      }}
    />
  );
}

/**
 * Draws the "CRATER" label similar to neal.fun style
 */
function drawCraterLabel(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  craterRadius: number
): void {
  ctx.save();

  // Label text
  const label = 'CRATER';
  const fontSize = Math.max(10, Math.min(craterRadius * 0.15, 16));

  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow for better visibility
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillText(label, centerX + 1, centerY + 1);

  // Main text
  ctx.fillStyle = 'white';
  ctx.fillText(label, centerX, centerY);

  ctx.restore();
}

/**
 * Hook to generate asteroid data from impact site
 */
export function useAsteroidDataFromSite(results: ImpactResults): AsteroidVisualData {
  return useMemo(() => {
    // For now, we'll use default parameters since we don't have the original asteroid data
    // In a full implementation, this would come from the store or be passed as props
    return generateAsteroidData(
      100, // diameter - would come from original parameters
      15,  // velocity - would come from original parameters
      45,  // angle - would come from original parameters
      3000 // mass - would come from original parameters
    );
  }, [results]);
}
