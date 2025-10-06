/**
 * Crater Shape Generator
 * Creates procedural crater shapes and renders them on Canvas
 */

import { SeededRandom, type AsteroidVisualData } from '../asteroid/asteroid-data-generator';
import { generateCraterData, type CraterVisualData } from './crater-data-generator';

export interface CraterShape {
  vertices: Array<{ x: number; y: number; radius: number; angle: number }>;
  baseRadius: number;
  rimPoints: Array<{ x: number; y: number; height: number }>;
}

/**
 * Simple noise function for procedural crater generation
 */
export class CraterNoise {
  private random: SeededRandom;
  private perm: number[];

  constructor(seed: number) {
    this.random = new SeededRandom(seed);
    this.perm = [];

    // Generate permutation table
    for (let i = 0; i < 256; i++) {
      this.perm[i] = i;
    }

    // Shuffle using seeded random
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this.random.next() * (i + 1));
      [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
    }

    // Duplicate for wrapping
    this.perm = [...this.perm, ...this.perm];
  }

  /**
   * 2D noise for crater irregularity
   */
  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

    return this.lerp(x1, x2, v);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

/**
 * Generates an irregular crater shape using noise
 */
export function generateCraterShape(
  craterData: CraterVisualData,
  baseRadius: number
): CraterShape {
  const vertices: Array<{ x: number; y: number; radius: number; angle: number }> = [];
  const rimPoints: Array<{ x: number; y: number; height: number }> = [];
  const noise = new CraterNoise(craterData.seed);
  const random = new SeededRandom(craterData.seed);

  // Generate rim points with irregularity
  for (let i = 0; i < craterData.rimSegments; i++) {
    const angle = (i / craterData.rimSegments) * Math.PI * 2;

    // Apply noise for irregularity
    let radiusVariation = 0;
    let amplitude = 1;
    let frequency = 1;

    // Multiple octaves of noise for natural irregularity
    for (let octave = 0; octave < 3; octave++) {
      const noiseValue = noise.noise2D(
        Math.cos(angle) * frequency * 3,
        Math.sin(angle) * frequency * 3
      );
      radiusVariation += noiseValue * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    // Apply irregularity factor
    radiusVariation *= craterData.irregularity;

    // Add some random variation for extra realism
    if (random.next() < 0.4) {
      radiusVariation += random.range(-0.15, 0.15);
    }

    // Calculate final radius for this vertex
    const vertexRadius = baseRadius * Math.max(0.7, 1 + radiusVariation * 0.3);

    vertices.push({
      x: Math.cos(angle) * vertexRadius,
      y: Math.sin(angle) * vertexRadius,
      radius: vertexRadius,
      angle,
    });

    // Generate rim height points
    const rimHeight = craterData.rimHeight * (0.8 + random.range(0, 0.4)); // Vary rim height
    rimPoints.push({
      x: Math.cos(angle) * vertexRadius,
      y: Math.sin(angle) * vertexRadius,
      height: rimHeight,
    });
  }

  return { vertices, baseRadius, rimPoints };
}

/**
 * Draws the crater floor with realistic depth and texture
 */
export function drawCraterFloor(
  ctx: CanvasRenderingContext2D,
  craterData: CraterVisualData,
  centerX: number,
  centerY: number,
  baseRadius: number
): void {
  ctx.save();

  // Create complex gradient for crater floor
  const floorGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.2, // Slight offset for depth effect
    centerY - baseRadius * 0.2,
    0,
    centerX,
    centerY,
    baseRadius
  );

  // Multiple gradient stops for realistic depth
  floorGradient.addColorStop(0, craterData.colors.floor.center);
  floorGradient.addColorStop(0.3, craterData.colors.floor.mid);
  floorGradient.addColorStop(0.7, craterData.colors.floor.edge);
  floorGradient.addColorStop(0.9, craterData.colors.shadow);
  floorGradient.addColorStop(1, craterData.colors.shadow);

  ctx.fillStyle = floorGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Add central uplift for complex craters
  if (craterData.centralUplift > 0) {
    const upliftRadius = baseRadius * craterData.centralUplift;
    const upliftGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, upliftRadius
    );

    upliftGradient.addColorStop(0, craterData.colors.rim.highlight);
    upliftGradient.addColorStop(0.6, craterData.colors.rim.inner);
    upliftGradient.addColorStop(1, craterData.colors.floor.mid);

    ctx.fillStyle = upliftGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, upliftRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws the crater rim with segments and highlights
 */
export function drawCraterRim(
  ctx: CanvasRenderingContext2D,
  craterData: CraterVisualData,
  centerX: number,
  centerY: number,
  baseRadius: number
): void {
  ctx.save();

  const noise = new CraterNoise(craterData.seed + 1000);
  const random = new SeededRandom(craterData.seed + 1000);

  // Draw rim segments
  for (let i = 0; i < craterData.rimSegments; i++) {
    const current = craterData.rimSegments > 0 ?
      {
        x: centerX + Math.cos((i / craterData.rimSegments) * Math.PI * 2) * baseRadius,
        y: centerY + Math.sin((i / craterData.rimSegments) * Math.PI * 2) * baseRadius,
      } : { x: centerX, y: centerY };

    const next = craterData.rimSegments > 0 ?
      {
        x: centerX + Math.cos(((i + 1) / craterData.rimSegments) * Math.PI * 2) * baseRadius,
        y: centerY + Math.sin(((i + 1) / craterData.rimSegments) * Math.PI * 2) * baseRadius,
      } : { x: centerX, y: centerY };

    // Add noise-based deformation to rim
    const angle = (i / craterData.rimSegments) * Math.PI * 2;
    const noiseValue = noise.noise2D(Math.cos(angle) * 2, Math.sin(angle) * 2);
    const deformation = noiseValue * craterData.irregularity * 0.2;

    const currentX = current.x + Math.cos(angle) * deformation * baseRadius;
    const currentY = current.y + Math.sin(angle) * deformation * baseRadius;
    const nextX = next.x + Math.cos(angle + Math.PI * 2 / craterData.rimSegments) * deformation * baseRadius;
    const nextY = next.y + Math.sin(angle + Math.PI * 2 / craterData.rimSegments) * deformation * baseRadius;

    // Draw rim segment with gradient
    const rimGradient = ctx.createLinearGradient(currentX, currentY, nextX, nextY);
    rimGradient.addColorStop(0, craterData.colors.rim.inner);
    rimGradient.addColorStop(0.5, craterData.colors.rim.outer);
    rimGradient.addColorStop(1, craterData.colors.rim.inner);

    ctx.strokeStyle = rimGradient;
    ctx.lineWidth = baseRadius * 0.05; // Rim thickness
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(nextX, nextY);
    ctx.stroke();

    // Add rim highlight
    ctx.strokeStyle = craterData.colors.rim.highlight;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws ejecta pattern around the crater
 */
export function drawEjectaPattern(
  ctx: CanvasRenderingContext2D,
  craterData: CraterVisualData,
  centerX: number,
  centerY: number,
  baseRadius: number
): void {
  ctx.save();

  const random = new SeededRandom(craterData.seed + 2000);

  // Draw each ejecta blob
  craterData.ejectaPattern.forEach((ejecta, index) => {
    const x = centerX + Math.cos(ejecta.angle) * ejecta.distance;
    const y = centerY + Math.sin(ejecta.angle) * ejecta.distance;
    const size = ejecta.size * baseRadius;

    if (size > 0.5) { // Only draw significant ejecta
      // Ejecta gradient
      const ejectaGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      ejectaGradient.addColorStop(0, craterData.colors.ejecta.primary);
      ejectaGradient.addColorStop(0.6, craterData.colors.ejecta.secondary);
      ejectaGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = ejectaGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add texture to ejecta
      const textureIntensity = ejecta.density;
      if (textureIntensity > 0.5) {
        ctx.fillStyle = random.next() > 0.5 ?
          craterData.colors.ejecta.dust :
          craterData.colors.shadow;
        ctx.globalAlpha = textureIntensity * 0.3;

        for (let i = 0; i < 5; i++) {
          const tx = x + random.range(-size, size);
          const ty = y + random.range(-size, size);
          const tSize = random.range(1, 3);

          ctx.beginPath();
          ctx.arc(tx, ty, tSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }
    }
  });

  ctx.restore();
}

/**
 * Draws bright rays for icy craters
 */
export function drawCraterRays(
  ctx: CanvasRenderingContext2D,
  craterData: CraterVisualData,
  centerX: number,
  centerY: number,
  baseRadius: number
): void {
  if (craterData.rayCount === 0) return;

  ctx.save();

  const random = new SeededRandom(craterData.seed + 3000);

  for (let i = 0; i < craterData.rayCount; i++) {
    const angle = random.range(0, Math.PI * 2);
    const length = baseRadius * (2 + random.range(0, 2)); // 2-4x crater radius
    const width = baseRadius * (0.1 + random.range(0, 0.1)); // Variable width

    // Ray gradient
    const rayGradient = ctx.createLinearGradient(
      centerX,
      centerY,
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );

    rayGradient.addColorStop(0, craterData.colors.rim.highlight);
    rayGradient.addColorStop(0.3, craterData.colors.ejecta.dust);
    rayGradient.addColorStop(1, 'transparent');

    ctx.strokeStyle = rayGradient;
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.6;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Draws inner rings for complex craters
 */
export function drawInnerRings(
  ctx: CanvasRenderingContext2D,
  craterData: CraterVisualData,
  centerX: number,
  centerY: number,
  baseRadius: number
): void {
  ctx.save();

  for (let ring = 0; ring < craterData.innerRings; ring++) {
    const ringRadius = baseRadius * (0.2 + ring * 0.15); // Rings from 20% to 65% of radius
    const ringWidth = baseRadius * 0.02; // Ring thickness

    // Ring gradient
    const ringGradient = ctx.createRadialGradient(
      centerX, centerY, ringRadius - ringWidth,
      centerX, centerY, ringRadius + ringWidth
    );

    ringGradient.addColorStop(0, craterData.colors.shadow);
    ringGradient.addColorStop(0.4, craterData.colors.floor.edge);
    ringGradient.addColorStop(0.6, craterData.colors.floor.mid);
    ringGradient.addColorStop(1, craterData.colors.shadow);

    ctx.strokeStyle = ringGradient;
    ctx.lineWidth = ringWidth;
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Main function to draw complete procedural crater
 */
export function drawProceduralCrater(
  ctx: CanvasRenderingContext2D,
  craterData: CraterVisualData,
  centerX: number,
  centerY: number,
  baseRadius: number
): void {
  // Draw in order from back to front
  drawCraterFloor(ctx, craterData, centerX, centerY, baseRadius);
  drawInnerRings(ctx, craterData, centerX, centerY, baseRadius);
  drawCraterRim(ctx, craterData, centerX, centerY, baseRadius);
  drawEjectaPattern(ctx, craterData, centerX, centerY, baseRadius);
  drawCraterRays(ctx, craterData, centerX, centerY, baseRadius);
}

/**
 * Calculates the appropriate pixel size for a crater based on map dimensions
 */
export function calculateCraterPixelRadius(
  craterData: CraterVisualData,
  mapWidth: number,
  mapHeight: number
): number {
  // Base radius from physics
  const baseRadius = craterData.diameter / 2;

  // Scale factor based on map size
  const baseScale = Math.min(mapWidth, mapHeight) / 800;

  // Convert to pixels
  const craterRadiusPixels = baseRadius * baseScale;

  // Limit maximum size to prevent map overflow
  const maxCraterSize = Math.min(mapWidth, mapHeight) * 0.15; // Max 15% of map size
  const finalRadius = Math.min(craterRadiusPixels, maxCraterSize);

  return Math.max(finalRadius, 20); // Minimum 20px for visibility
}
