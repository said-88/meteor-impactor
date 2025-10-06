/**
 * Asteroid Shape Generator
 * Creates procedural, irregular asteroid shapes
 */

import { SeededRandom, type AsteroidVisualData } from './asteroid-data-generator';

export interface AsteroidShape {
  vertices: Array<{ x: number; y: number; radius: number }>;
  baseRadius: number;
}

/**
 * Simple noise function for procedural generation
 */
export class SimplexNoise {
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
   * 2D Perlin-like noise
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
 * Generates an irregular asteroid shape using noise
 */
export function generateAsteroidShape(
  data: AsteroidVisualData,
  baseRadius: number
): AsteroidShape {
  const vertices: Array<{ x: number; y: number; radius: number }> = [];
  const noise = new SimplexNoise(data.seed);
  const random = new SeededRandom(data.seed);
  
  // Generate vertices in a circle with noise-based deformation
  for (let i = 0; i < data.vertexCount; i++) {
    const angle = (i / data.vertexCount) * Math.PI * 2;
    
    // Multiple octaves of noise for more interesting shapes
    let deformation = 0;
    let amplitude = 1;
    let frequency = 1;
    
    // Add multiple noise layers
    for (let octave = 0; octave < 4; octave++) {
      const noiseValue = noise.noise2D(
        Math.cos(angle) * frequency * 2,
        Math.sin(angle) * frequency * 2
      );
      deformation += noiseValue * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    // Apply roughness to deformation
    deformation *= data.roughness;
    
    // Add some random bumps for variety
    if (random.next() < 0.3) {
      deformation += random.range(-0.2, 0.2);
    }
    
    // Calculate final radius for this vertex
    const radiusMultiplier = 1 + deformation * 0.5;
    const vertexRadius = baseRadius * Math.max(0.5, radiusMultiplier);
    
    vertices.push({
      x: Math.cos(angle) * vertexRadius,
      y: Math.sin(angle) * vertexRadius,
      radius: vertexRadius,
    });
  }
  
  return { vertices, baseRadius };
}

/**
 * Draws the asteroid shape on a canvas context
 */
export function drawAsteroidShape(
  ctx: CanvasRenderingContext2D,
  shape: AsteroidShape,
  centerX: number,
  centerY: number,
  data: AsteroidVisualData,
  rotation: number = 0
): void {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  
  // Create the asteroid outline
  ctx.beginPath();
  const firstVertex = shape.vertices[0];
  ctx.moveTo(firstVertex.x, firstVertex.y);
  
  // Draw smooth curves between vertices
  for (let i = 0; i < shape.vertices.length; i++) {
    const current = shape.vertices[i];
    const next = shape.vertices[(i + 1) % shape.vertices.length];
    
    // Control point for smoother curves
    const cpX = (current.x + next.x) / 2;
    const cpY = (current.y + next.y) / 2;
    
    ctx.quadraticCurveTo(current.x, current.y, cpX, cpY);
  }
  
  ctx.closePath();
  
  // Create gradient based on composition
  const gradient = ctx.createRadialGradient(
    -shape.baseRadius * 0.3,
    -shape.baseRadius * 0.3,
    0,
    0,
    0,
    shape.baseRadius * 1.2
  );
  
  gradient.addColorStop(0, data.colors.bright);
  gradient.addColorStop(0.4, data.colors.base);
  gradient.addColorStop(0.7, data.colors.dark);
  gradient.addColorStop(1, data.colors.dark);
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add edge highlight for depth
  ctx.strokeStyle = data.colors.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draws surface details (craters, texture) on the asteroid
 */
export function drawAsteroidDetails(
  ctx: CanvasRenderingContext2D,
  shape: AsteroidShape,
  centerX: number,
  centerY: number,
  data: AsteroidVisualData,
  rotation: number = 0
): void {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  
  const random = new SeededRandom(data.seed + 1000);
  
  // Draw craters
  for (let i = 0; i < data.craterCount; i++) {
    const craterPos = data.craterPositions[i];
    const craterSize = data.craterSizes[i];
    
    const x = Math.cos(craterPos.angle) * shape.baseRadius * craterPos.distance;
    const y = Math.sin(craterPos.angle) * shape.baseRadius * craterPos.distance;
    const radius = shape.baseRadius * craterSize;
    
    // Crater shadow
    const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    craterGradient.addColorStop(0, data.colors.dark);
    craterGradient.addColorStop(0.6, data.colors.base);
    craterGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = craterGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Crater rim highlight
    ctx.strokeStyle = data.colors.accent;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Add surface texture based on composition
  if (data.composition === 'rocky') {
    // Rocky texture - small dots and irregularities
    for (let i = 0; i < 30; i++) {
      const angle = random.range(0, Math.PI * 2);
      const distance = random.range(0, shape.baseRadius * 0.8);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = random.range(0.5, 2);
      
      ctx.fillStyle = random.next() > 0.5 ? data.colors.dark : data.colors.accent;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (data.composition === 'metallic') {
    // Metallic texture - reflective patches
    for (let i = 0; i < 15; i++) {
      const angle = random.range(0, Math.PI * 2);
      const distance = random.range(0, shape.baseRadius * 0.7);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = random.range(2, 5);
      
      const metalGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      metalGradient.addColorStop(0, data.colors.bright);
      metalGradient.addColorStop(0.5, data.colors.accent);
      metalGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = metalGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (data.composition === 'icy') {
    // Icy texture - crystalline patches
    for (let i = 0; i < 20; i++) {
      const angle = random.range(0, Math.PI * 2);
      const distance = random.range(0, shape.baseRadius * 0.7);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = random.range(1, 4);
      
      // Sparkly ice effect
      ctx.fillStyle = random.next() > 0.7 ? data.colors.bright : data.colors.accent;
      ctx.globalAlpha = random.range(0.5, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  
  ctx.restore();
}
