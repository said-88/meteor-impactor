import type { ImpactResults, MeteorParameters } from "@/types/asteroid";

/**
 * Enhanced impact calculator with multi-stage physics and atmospheric effects
 * Uses established impact physics models with atmospheric interaction
 */
export class ImpactCalculator {
  private static readonly JOULES_TO_MEGATONS = 4.184e15; // 1 megaton TNT = 4.184e15 joules
  private static readonly AIR_DENSITY = 1.225; // kg/m³ at sea level
  private static readonly DRAG_COEFFICIENT = 0.47; // Typical for spherical objects
  private static readonly SOUND_SPEED = 343; // m/s

  /**
   * Calculate the kinetic energy of the asteroid
   * KE = 0.5 * mass * velocity²
   */
  static calculateKineticEnergy(params: MeteorParameters): number {
    const radius = params.diameter / 2;
    const volume = (4 / 3) * Math.PI * radius ** 3; // m³
    const mass = volume * params.density; // kg
    const velocityMs = params.velocity * 1000; // convert km/s to m/s

    return 0.5 * mass * velocityMs ** 2; // joules
  }

  /**
   * Calculate crater dimensions using scaling relationships
   * Based on Holsapple & Housen (2007) crater scaling laws
   */
  static calculateCraterSize(
    params: MeteorParameters,
    energy: number,
  ): { diameter: number; depth: number } {
    const impactAngleRad = (params.angle * Math.PI) / 180;
    const effectiveEnergy = energy * Math.sin(impactAngleRad); // Oblique impact correction

    // Simplified crater scaling: D ∝ E^0.25 (for complex craters)
    const craterDiameter = 1.8 * (effectiveEnergy / 1e15) ** 0.25; // in meters
    const craterDepth = craterDiameter / 5; // Typical depth-to-diameter ratio

    return {
      diameter: craterDiameter,
      depth: craterDepth,
    };
  }

  /**
   * Calculate fireball effects
   */
  static calculateFireballEffects(energy: number): {
    radius: number;
    temperature: number;
  } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;

    // Fireball radius scales with cube root of energy
    const radius = 0.28 * megatons ** 0.33; // in km

    // Surface temperature (simplified)
    const temperature = 5000 + megatons * 10; // Celsius

    return { radius, temperature };
  }

  /**
   * Calculate airblast overpressure effects
   */
  static calculateAirblastEffects(energy: number): {
    overpressureRadius: number;
    shockwaveRadius: number;
  } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;

    // 5 psi overpressure radius (moderate damage)
    const overpressureRadius = 2.2 * megatons ** 0.33; // km

    // Shockwave perceptible radius
    const shockwaveRadius = 8.5 * megatons ** 0.4; // km

    return { overpressureRadius, shockwaveRadius };
  }

  /**
   * Calculate seismic effects
   */
  static calculateSeismicEffects(
    energy: number,
    params: MeteorParameters,
  ): { magnitude: number; effectiveRadius: number } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;

    // Richter magnitude from energy
    const magnitude = (2 / 3) * Math.log10(energy / 1e10) - 3.2;

    // Effective radius for seismic damage
    const effectiveRadius = 15 * megatons ** 0.4; // km

    return {
      magnitude: Math.max(0, Math.min(10, magnitude)),
      effectiveRadius,
    };
  }

  /**
   * Calculate thermal radiation effects
   */
  static calculateThermalEffects(energy: number): { radiationRadius: number } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;

    // Radius for 3rd degree burns from thermal radiation
    const radiationRadius = 3.5 * megatons ** 0.41; // km

    return { radiationRadius };
  }

  /**
   * Estimate casualties based on impact location and effects
   * This is a simplified model - real calculations would need population density data
   */
  static estimateCasualties(
    results: Omit<ImpactResults, "casualties">,
    populationDensity: number = 100,
  ): {
    estimated: number;
    affectedPopulation: number;
  } {
    // Calculate affected area (simplified circular model)
    const effectiveRadius = Math.max(
      results.effects.fireball.radius,
      results.effects.airblast.overpressureRadius,
      results.effects.thermal.radiationRadius,
    );

    const affectedArea = Math.PI * effectiveRadius ** 2; // km²
    const affectedPopulation = Math.floor(affectedArea * populationDensity);

    // Casualty rate decreases with distance (simplified)
    const estimated = Math.floor(affectedPopulation * 0.7);

    return {
      estimated,
      affectedPopulation,
    };
  }

  /**
   * Calculate complete impact results
   */
  static calculateImpact(
    params: MeteorParameters,
    populationDensity?: number,
  ): ImpactResults {
    const energy = ImpactCalculator.calculateKineticEnergy(params);
    const megatonsTNT = energy / ImpactCalculator.JOULES_TO_MEGATONS;
    const crater = ImpactCalculator.calculateCraterSize(params, energy);
    const fireball = ImpactCalculator.calculateFireballEffects(energy);
    const airblast = ImpactCalculator.calculateAirblastEffects(energy);
    const seismic = ImpactCalculator.calculateSeismicEffects(energy, params);
    const thermal = ImpactCalculator.calculateThermalEffects(energy);

    const partialResults = {
      energy: {
        joules: energy,
        megatonsTNT,
      },
      crater,
      effects: {
        fireball,
        airblast,
        seismic,
        thermal,
      },
    };

    const casualties = ImpactCalculator.estimateCasualties(
      partialResults as any,
      populationDensity,
    );

    return {
      ...partialResults,
      casualties,
    };
  }

  /**
   * Get default meteor parameters
   */
  static getDefaultParameters(): MeteorParameters {
    return {
      diameter: 100, // 100m meteor (similar to Tunguska event)
      velocity: 20, // 20 km/s (typical impact velocity)
      angle: 45, // 45° impact angle
      density: 3000, // 3000 kg/m³ (rocky composition)
      composition: "rocky",
    };
  }

  /**
   * Get density based on composition
   */
  static getDensityForComposition(composition: string): number {
    const densities: Record<string, number> = {
      rocky: 3000,
      iron: 7800,
      icy: 1000,
    };
    return densities[composition] || 3000;
  }

  /**
   * Calculate atmospheric entry effects and fragmentation
   */
  static calculateAtmosphericEntry(params: MeteorParameters): {
    entryVelocity: number;
    fragmentationAltitude: number;
    ablationLoss: number;
    trailLength: number;
  } {
    const velocity = params.velocity * 1000; // m/s
    const radius = params.diameter / 2;
    const crossSectionalArea = Math.PI * radius ** 2;
    const mass = (4 / 3) * Math.PI * radius ** 3 * params.density;

    // Calculate drag force and deceleration
    const dragForce = 0.5 * ImpactCalculator.AIR_DENSITY * velocity ** 2 * ImpactCalculator.DRAG_COEFFICIENT * crossSectionalArea;
    const deceleration = dragForce / mass;

    // Estimate fragmentation based on material strength and deceleration
    const fragmentationThreshold = ImpactCalculator.getFragmentationThreshold(params.composition);
    const fragmentationAltitude = Math.max(0, 50000 - (deceleration / fragmentationThreshold) * 10000);

    // Calculate ablation (mass loss due to heating)
    const ablationLoss = Math.min(0.3, (velocity / 30000) * 0.2); // Up to 30% mass loss

    // Trail length based on velocity and atmospheric density
    const trailLength = Math.min(velocity / 1000, 100); // km

    return {
      entryVelocity: velocity,
      fragmentationAltitude,
      ablationLoss,
      trailLength,
    };
  }

  /**
   * Calculate multi-stage impact phases
   */
  static calculateImpactPhases(params: MeteorParameters, energy: number): {
    phases: Array<{
      name: string;
      duration: number;
      startTime: number;
      effects: Record<string, any>;
    }>;
    totalDuration: number;
  } {
    const phases = [
      {
        name: "atmospheric_entry",
        duration: 3,
        startTime: 0,
        effects: {
          altitude: 50000,
          velocity: params.velocity * 1000,
          fragmentation: ImpactCalculator.calculateAtmosphericEntry(params),
        },
      },
      {
        name: "terminal_phase",
        duration: 2,
        startTime: 3,
        effects: {
          altitude: 10000,
          plasmaFormation: true,
          sonicBoom: params.velocity > 11,
        },
      },
      {
        name: "impact_explosion",
        duration: 1,
        startTime: 5,
        effects: {
          fireballFormation: true,
          shockwaveGeneration: true,
          energy,
        },
      },
      {
        name: "crater_formation",
        duration: 4,
        startTime: 6,
        effects: {
          ejectaCurtain: true,
          groundDeformation: true,
          seismicActivity: true,
        },
      },
      {
        name: "thermal_effects",
        duration: 8,
        startTime: 10,
        effects: {
          thermalRadiation: true,
          fireInitiation: true,
          dustCloudFormation: true,
        },
      },
    ];

    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

    return { phases, totalDuration };
  }

  /**
   * Calculate enhanced ejecta patterns based on impact angle and terrain
   */
  static calculateEjectaPattern(params: MeteorParameters, energy: number): {
    maxDistance: number;
    ejectaMass: number;
    pattern: "butterfly" | "radial" | "asymmetric";
    directions: Array<{ angle: number; distance: number; mass: number }>;
  } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;
    const impactAngleRad = (params.angle * Math.PI) / 180;

    // Ejecta mass calculation (simplified)
    const radius = params.diameter / 2;
    const volume = (4 / 3) * Math.PI * radius ** 3;
    const ejectaMass = volume * params.density * 0.1; // ~10% of meteor mass becomes ejecta

    // Maximum ejecta distance
    const maxDistance = 5 * (megatons ** 0.3) * Math.sin(impactAngleRad);

    // Pattern determination based on impact angle
    let pattern: "butterfly" | "radial" | "asymmetric" = "radial";
    if (params.angle < 30) pattern = "asymmetric";
    else if (params.angle > 60) pattern = "butterfly";

    // Generate ejecta directions
    const directions = [];
    const numDirections = 16;

    for (let i = 0; i < numDirections; i++) {
      const angle = (i / numDirections) * Math.PI * 2;
      const distance = maxDistance * (0.3 + Math.random() * 0.7);
      const mass = ejectaMass / numDirections * (0.5 + Math.random());

      directions.push({ angle, distance, mass });
    }

    return {
      maxDistance,
      ejectaMass,
      pattern,
      directions,
    };
  }

  /**
   * Calculate enhanced fireball with multiple phases
   */
  static calculateEnhancedFireball(energy: number, params: MeteorParameters): {
    initialRadius: number;
    maxRadius: number;
    temperature: number;
    duration: number;
    phases: Array<{
      phase: string;
      radius: number;
      temperature: number;
      duration: number;
    }>;
  } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;

    // Initial fireball (very hot, small)
    const initialRadius = 0.1 * megatons ** 0.33;
    const initialTemp = 8000 + megatons * 50;

    // Maximum fireball size
    const maxRadius = 0.28 * megatons ** 0.33;
    const maxTemp = 5000 + megatons * 10;

    // Total duration
    const duration = 5 + megatons * 2;

    // Fireball phases
    const phases = [
      {
        phase: "flash",
        radius: initialRadius,
        temperature: initialTemp,
        duration: 0.5,
      },
      {
        phase: "expansion",
        radius: maxRadius * 0.7,
        temperature: maxTemp,
        duration: 2,
      },
      {
        phase: "peak",
        radius: maxRadius,
        temperature: maxTemp * 0.8,
        duration: 1.5,
      },
      {
        phase: "decay",
        radius: maxRadius * 0.3,
        temperature: maxTemp * 0.5,
        duration: duration - 4,
      },
    ];

    return {
      initialRadius,
      maxRadius,
      temperature: maxTemp,
      duration,
      phases,
    };
  }

  /**
   * Get fragmentation threshold based on material
   */
  private static getFragmentationThreshold(composition: string): number {
    const thresholds: Record<string, number> = {
      rocky: 1000, // m/s²
      iron: 2000,  // m/s²
      icy: 500,    // m/s²
    };
    return thresholds[composition] || 1000;
  }

  /**
   * Calculate enhanced seismic effects with wave propagation
   */
  static calculateEnhancedSeismic(energy: number, params: MeteorParameters): {
    magnitude: number;
    effectiveRadius: number;
    waveTypes: Array<{
      type: "P" | "S" | "Surface";
      velocity: number;
      amplitude: number;
      frequency: number;
    }>;
    groundAcceleration: number;
  } {
    const megatons = energy / ImpactCalculator.JOULES_TO_MEGATONS;
    const magnitude = (2 / 3) * Math.log10(energy / 1e10) - 3.2;
    const effectiveRadius = 15 * megatons ** 0.4;

    // Ground acceleration at impact point
    const groundAcceleration = Math.min(energy / 1e12, 50); // m/s²

    // Seismic wave types
    const waveTypes = [
      {
        type: "P" as const,
        velocity: 6000, // m/s
        amplitude: groundAcceleration * 0.1,
        frequency: 5, // Hz
      },
      {
        type: "S" as const,
        velocity: 3500, // m/s
        amplitude: groundAcceleration * 0.15,
        frequency: 2, // Hz
      },
      {
        type: "Surface" as const,
        velocity: 3000, // m/s
        amplitude: groundAcceleration * 0.2,
        frequency: 1, // Hz
      },
    ];

    return {
      magnitude: Math.max(0, Math.min(10, magnitude)),
      effectiveRadius,
      waveTypes,
      groundAcceleration,
    };
  }
}
