/**
 * Asteroid Data Generator
 * Generates unique, reproducible asteroid characteristics based on physical parameters
 */

export interface AsteroidVisualData {
  // Physical properties
  diameter: number;
  mass: number;
  velocity: number;
  angle: number;
  composition: 'rocky' | 'metallic' | 'icy';
  
  // Visual properties (procedurally generated)
  seed: number;
  complexity: number; // 0-1, based on size
  roughness: number; // 0-1, how irregular the shape is
  vertexCount: number; // Number of points in the shape
  
  // Color palette
  colors: {
    base: string;
    dark: string;
    bright: string;
    accent: string;
  };
  
  // Crater properties
  craterCount: number;
  craterSizes: number[];
  craterPositions: Array<{ angle: number; distance: number }>;
}

/**
 * Generates a deterministic seed from asteroid parameters
 */
export function generateSeed(diameter: number, velocity: number, angle: number): number {
  // Create a unique but reproducible seed
  const hash = Math.floor(diameter * 1000 + velocity * 100 + angle * 10);
  return hash % 9999;
}

/**
 * Seeded random number generator for reproducibility
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

/**
 * Determines asteroid composition based on parameters
 */
export function determineComposition(
  diameter: number,
  velocity: number
): 'rocky' | 'metallic' | 'icy' {
  const random = new SeededRandom(Math.floor(diameter * velocity));
  const value = random.next();
  
  // Distribution based on actual asteroid statistics
  if (value < 0.75) return 'rocky'; // 75% rocky (C-type, S-type)
  if (value < 0.90) return 'metallic'; // 15% metallic (M-type)
  return 'icy'; // 10% icy (cometary)
}

/**
 * Generates color palette based on composition
 */
export function generateColorPalette(
  composition: 'rocky' | 'metallic' | 'icy',
  random: SeededRandom
): AsteroidVisualData['colors'] {
  switch (composition) {
    case 'rocky':
      // Browns, greys, dark reds
      const rockyHue = random.range(0, 40); // Brown to red-brown
      const rockySat = random.range(20, 50);
      const rockyLight = random.range(20, 40);
      return {
        base: `hsl(${rockyHue}, ${rockySat}%, ${rockyLight}%)`,
        dark: `hsl(${rockyHue}, ${rockySat + 10}%, ${rockyLight - 15}%)`,
        bright: `hsl(${rockyHue}, ${rockySat - 10}%, ${rockyLight + 15}%)`,
        accent: `hsl(${rockyHue + 10}, ${rockySat + 5}%, ${rockyLight + 5}%)`,
      };
      
    case 'metallic':
      // Greys, silvers, slight blues
      const metallicHue = random.range(200, 240); // Blue-grey
      const metallicSat = random.range(5, 15);
      const metallicLight = random.range(45, 65);
      return {
        base: `hsl(${metallicHue}, ${metallicSat}%, ${metallicLight}%)`,
        dark: `hsl(${metallicHue}, ${metallicSat}%, ${metallicLight - 20}%)`,
        bright: `hsl(${metallicHue}, ${metallicSat}%, ${metallicLight + 20}%)`,
        accent: `hsl(${metallicHue + 20}, ${metallicSat + 10}%, ${metallicLight + 10}%)`,
      };
      
    case 'icy':
      // Blues, whites, slight cyan
      const icyHue = random.range(180, 220); // Cyan to blue
      const icySat = random.range(30, 60);
      const icyLight = random.range(50, 70);
      return {
        base: `hsl(${icyHue}, ${icySat}%, ${icyLight}%)`,
        dark: `hsl(${icyHue}, ${icySat + 10}%, ${icyLight - 20}%)`,
        bright: `hsl(${icyHue}, ${icySat - 10}%, ${icyLight + 15}%)`,
        accent: `hsl(${icyHue + 30}, ${icySat}%, ${icyLight + 10}%)`,
      };
  }
}

/**
 * Generates crater data for the asteroid surface
 */
export function generateCraters(
  diameter: number,
  complexity: number,
  random: SeededRandom
): { count: number; sizes: number[]; positions: Array<{ angle: number; distance: number }> } {
  // More complex asteroids have more craters
  const baseCount = Math.floor(complexity * 15) + 5;
  const count = random.int(baseCount, baseCount + 10);
  
  const sizes: number[] = [];
  const positions: Array<{ angle: number; distance: number }> = [];
  
  for (let i = 0; i < count; i++) {
    // Crater size relative to asteroid (smaller asteroids = smaller craters)
    sizes.push(random.range(0.05, 0.15));
    
    // Random position on surface
    positions.push({
      angle: random.range(0, Math.PI * 2),
      distance: random.range(0.2, 0.9), // Distance from center (0-1)
    });
  }
  
  return { count, sizes, positions };
}

/**
 * Main function to generate complete asteroid visual data
 */
export function generateAsteroidData(
  diameter: number,
  velocity: number,
  angle: number,
  mass: number
): AsteroidVisualData {
  const seed = generateSeed(diameter, velocity, angle);
  const random = new SeededRandom(seed);
  
  // Determine composition
  const composition = determineComposition(diameter, velocity);
  
  // Calculate complexity based on size (larger = more complex)
  const complexity = Math.min(Math.log10(diameter + 1) / 3, 1);
  
  // Roughness varies by composition
  let roughness: number;
  switch (composition) {
    case 'rocky':
      roughness = random.range(0.6, 0.9); // Very irregular
      break;
    case 'metallic':
      roughness = random.range(0.3, 0.6); // Moderately irregular
      break;
    case 'icy':
      roughness = random.range(0.4, 0.7); // Moderately irregular with ice chunks
      break;
  }
  
  // Vertex count based on complexity (more complex = more vertices)
  const vertexCount = Math.floor(20 + complexity * 30);
  
  // Generate color palette
  const colors = generateColorPalette(composition, random);
  
  // Generate craters
  const craters = generateCraters(diameter, complexity, random);
  
  return {
    diameter,
    mass,
    velocity,
    angle,
    composition,
    seed,
    complexity,
    roughness,
    vertexCount,
    colors,
    craterCount: craters.count,
    craterSizes: craters.sizes,
    craterPositions: craters.positions,
  };
}
