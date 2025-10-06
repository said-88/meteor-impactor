/**
 * Crater Data Generator
 * Generates unique, reproducible crater characteristics based on impact physics
 */

import { SeededRandom, type AsteroidVisualData } from '../asteroid/asteroid-data-generator';
import type { ImpactResults } from '@/types/asteroid';

export interface CraterVisualData {
  // Physical properties from impact
  diameter: number;      // meters
  depth: number;         // meters
  rimHeight: number;     // meters

  // Visual properties (procedurally generated)
  seed: number;          // For reproducibility
  complexity: number;    // 0-1 based on impact energy
  rimSegments: number;   // Number of rim detail segments
  innerRings: number;    // Concentric rings count

  // Ejecta pattern
  ejectaPattern: Array<{
    angle: number;
    distance: number;
    size: number;
    density: number;
  }>;

  // Color based on target material and asteroid composition
  colors: {
    floor: {
      center: string;
      mid: string;
      edge: string;
    };
    rim: {
      outer: string;
      inner: string;
      highlight: string;
    };
    ejecta: {
      primary: string;
      secondary: string;
      dust: string;
    };
    shadow: string;
  };

  // Shape properties
  irregularity: number;  // 0-1, how irregular the rim is
  centralUplift: number; // 0-1, height of central peak
  rayCount: number;      // Number of bright rays
}

/**
 * Generates a deterministic seed from impact parameters
 */
export function generateCraterSeed(
  asteroidData: AsteroidVisualData,
  results: ImpactResults
): number {
  // Create unique but reproducible seed from multiple factors
  const hash = Math.floor(
    asteroidData.diameter * 1000 +
    asteroidData.velocity * 100 +
    asteroidData.angle * 10 +
    results.energy.megatonsTNT * 1000 +
    results.crater.diameter * 10
  );
  return hash % 999999;
}

/**
 * Calculates realistic crater depth based on impact physics
 */
export function calculateCraterDepth(
  asteroidDiameter: number,
  asteroidVelocity: number,
  asteroidDensity: number,
  targetDensity: number = 2500 // Average ground density kg/m³
): number {
  // Simplified depth calculation based on impact physics
  // Real formula involves energy, angle, material properties
  const energy = (1/2) * asteroidDensity * Math.pow(asteroidDiameter / 2, 3) * (4/3) * Math.PI * Math.pow(asteroidVelocity, 2);
  const depth = Math.pow(energy / targetDensity, 1/3) * 0.1;

  return Math.min(depth, asteroidDiameter * 0.3); // Depth typically < 30% of asteroid diameter
}

/**
 * Calculates rim height based on impact angle and composition
 */
export function calculateRimHeight(
  craterDiameter: number,
  impactAngle: number,
  composition: 'rocky' | 'metallic' | 'icy'
): number {
  // Base rim height as fraction of crater diameter
  let baseHeight = craterDiameter * 0.05; // 5% of diameter

  // Adjust based on composition
  switch (composition) {
    case 'rocky':
      baseHeight *= 1.2; // Higher rims in rocky material
      break;
    case 'metallic':
      baseHeight *= 0.8; // Lower rims in metallic material
      break;
    case 'icy':
      baseHeight *= 0.9; // Medium rims in icy material
      break;
  }

  // Adjust based on impact angle (more oblique = asymmetric rim)
  const angleFactor = Math.abs(Math.sin(impactAngle * Math.PI / 180));
  baseHeight *= (0.7 + angleFactor * 0.6);

  return baseHeight;
}

/**
 * Generates color palette based on asteroid composition and target material
 */
export function generateCraterColors(
  asteroidComposition: 'rocky' | 'metallic' | 'icy',
  random: SeededRandom
): CraterVisualData['colors'] {
  switch (asteroidComposition) {
    case 'rocky':
      return {
        floor: {
          center: `hsl(${random.range(15, 35)}, ${random.range(25, 45)}%, ${random.range(15, 25)}%)`, // Dark brown center
          mid: `hsl(${random.range(20, 40)}, ${random.range(30, 50)}%, ${random.range(25, 35)}%)`,    // Medium brown
          edge: `hsl(${random.range(25, 45)}, ${random.range(35, 55)}%, ${random.range(35, 45)}%)`,  // Lighter brown edge
        },
        rim: {
          outer: `hsl(${random.range(30, 50)}, ${random.range(40, 60)}%, ${random.range(45, 55)}%)`, // Light brown outer rim
          inner: `hsl(${random.range(20, 40)}, ${random.range(35, 55)}%, ${random.range(40, 50)}%)`, // Medium brown inner rim
          highlight: `hsl(${random.range(35, 55)}, ${random.range(45, 65)}%, ${random.range(55, 65)}%)`, // Highlight
        },
        ejecta: {
          primary: `hsl(${random.range(25, 45)}, ${random.range(40, 60)}%, ${random.range(45, 55)}%)`, // Main ejecta
          secondary: `hsl(${random.range(20, 40)}, ${random.range(35, 55)}%, ${random.range(35, 45)}%)`, // Secondary material
          dust: `hsl(${random.range(30, 50)}, ${random.range(20, 40)}%, ${random.range(60, 80)}%)`,     // Dust cloud
        },
        shadow: `hsl(${random.range(15, 35)}, ${random.range(20, 40)}%, ${random.range(10, 20)}%)`, // Shadow color
      };

    case 'metallic':
      return {
        floor: {
          center: `hsl(${random.range(200, 240)}, ${random.range(10, 20)}%, ${random.range(20, 30)}%)`, // Dark grey center
          mid: `hsl(${random.range(200, 240)}, ${random.range(15, 25)}%, ${random.range(30, 40)}%)`,    // Medium grey
          edge: `hsl(${random.range(200, 240)}, ${random.range(20, 30)}%, ${random.range(40, 50)}%)`,  // Lighter grey edge
        },
        rim: {
          outer: `hsl(${random.range(200, 240)}, ${random.range(25, 35)}%, ${random.range(50, 60)}%)`, // Light grey outer rim
          inner: `hsl(${random.range(200, 240)}, ${random.range(20, 30)}%, ${random.range(45, 55)}%)`, // Medium grey inner rim
          highlight: `hsl(${random.range(200, 240)}, ${random.range(30, 40)}%, ${random.range(60, 70)}%)`, // Metallic highlight
        },
        ejecta: {
          primary: `hsl(${random.range(200, 240)}, ${random.range(25, 35)}%, ${random.range(50, 60)}%)`, // Main metallic ejecta
          secondary: `hsl(${random.range(200, 240)}, ${random.range(20, 30)}%, ${random.range(40, 50)}%)`, // Secondary material
          dust: `hsl(${random.range(200, 240)}, ${random.range(15, 25)}%, ${random.range(70, 80)}%)`,     // Metallic dust
        },
        shadow: `hsl(${random.range(200, 240)}, ${random.range(10, 20)}%, ${random.range(15, 25)}%)`, // Shadow color
      };

    case 'icy':
      return {
        floor: {
          center: `hsl(${random.range(200, 240)}, ${random.range(30, 50)}%, ${random.range(25, 35)}%)`, // Blue center
          mid: `hsl(${random.range(190, 230)}, ${random.range(35, 55)}%, ${random.range(35, 45)}%)`,    // Cyan mid
          edge: `hsl(${random.range(180, 220)}, ${random.range(40, 60)}%, ${random.range(45, 55)}%)`,  // Light blue edge
        },
        rim: {
          outer: `hsl(${random.range(180, 220)}, ${random.range(45, 65)}%, ${random.range(55, 65)}%)`, // Light blue outer rim
          inner: `hsl(${random.range(190, 230)}, ${random.range(40, 60)}%, ${random.range(50, 60)}%)`, // Cyan inner rim
          highlight: `hsl(${random.range(170, 210)}, ${random.range(50, 70)}%, ${random.range(65, 75)}%)`, // Ice highlight
        },
        ejecta: {
          primary: `hsl(${random.range(180, 220)}, ${random.range(45, 65)}%, ${random.range(55, 65)}%)`, // Main icy ejecta
          secondary: `hsl(${random.range(190, 230)}, ${random.range(40, 60)}%, ${random.range(45, 55)}%)`, // Secondary material
          dust: `hsl(${random.range(170, 210)}, ${random.range(30, 50)}%, ${random.range(75, 85)}%)`,     // Ice crystals
        },
        shadow: `hsl(${random.range(200, 240)}, ${random.range(25, 45)}%, ${random.range(20, 30)}%)`, // Shadow color
      };
  }
}

/**
 * Generates ejecta pattern based on impact physics
 */
export function generateEjectaPattern(
  craterDiameter: number,
  impactAngle: number,
  impactVelocity: number,
  random: SeededRandom
): Array<{ angle: number; distance: number; size: number; density: number }> {
  const ejectaCount = Math.floor(15 + random.range(0, 10)); // 15-25 ejecta blobs
  const ejectaPattern: Array<{ angle: number; distance: number; size: number; density: number }> = [];

  for (let i = 0; i < ejectaCount; i++) {
    // Base angle distribution (more material opposite to impact direction)
    const baseAngle = random.range(0, Math.PI * 2);

    // Distance from crater center (realistic ballistic distribution)
    const distance = craterDiameter * (0.5 + random.range(0, 1.5)); // 0.5x to 2x crater radius

    // Size based on distance (closer = larger chunks)
    const size = (1 - distance / (craterDiameter * 2)) * (0.05 + random.range(0, 0.1));

    // Density based on material and velocity
    const density = random.range(0.3, 1.0);

    ejectaPattern.push({
      angle: baseAngle,
      distance,
      size,
      density,
    });
  }

  return ejectaPattern;
}

/**
 * Main function to generate complete crater visual data
 */
export function generateCraterData(
  asteroidData: AsteroidVisualData,
  results: ImpactResults
): CraterVisualData {
  const seed = generateCraterSeed(asteroidData, results);
  const random = new SeededRandom(seed);

  // Calculate physical properties
  const depth = calculateCraterDepth(
    asteroidData.diameter,
    asteroidData.velocity,
    asteroidData.mass / (Math.pow(asteroidData.diameter / 2, 3) * (4/3) * Math.PI)
  );

  const rimHeight = calculateRimHeight(
    results.crater.diameter,
    asteroidData.angle,
    asteroidData.composition
  );

  // Calculate complexity based on impact energy
  const complexity = Math.min(Math.log10(results.energy.megatonsTNT + 1) / 3, 1);

  // Visual properties
  const rimSegments = Math.floor(12 + complexity * 20); // 12-32 segments
  const innerRings = Math.floor(complexity * 3) + 1;   // 1-4 rings

  // Shape irregularity based on composition and energy
  let irregularity: number;
  switch (asteroidData.composition) {
    case 'rocky':
      irregularity = random.range(0.6, 0.9); // Very irregular
      break;
    case 'metallic':
      irregularity = random.range(0.3, 0.6); // More regular
      break;
    case 'icy':
      irregularity = random.range(0.4, 0.7); // Moderately irregular
      break;
  }

  // Central uplift for larger, high-energy impacts
  const centralUplift = complexity > 0.6 ? random.range(0.1, 0.3) : 0;

  // Ray count for icy/rocky compositions
  const rayCount = asteroidData.composition === 'icy' ? random.int(3, 8) : random.int(0, 3);

  // Generate colors
  const colors = generateCraterColors(asteroidData.composition, random);

  // Generate ejecta pattern
  const ejectaPattern = generateEjectaPattern(
    results.crater.diameter,
    asteroidData.angle,
    asteroidData.velocity,
    random
  );

  return {
    diameter: results.crater.diameter,
    depth,
    rimHeight,
    seed,
    complexity,
    rimSegments,
    innerRings,
    ejectaPattern,
    colors,
    irregularity,
    centralUplift,
    rayCount,
  };
}
