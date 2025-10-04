import type { MeteorParameters, ImpactResults } from '@/types/asteroid';

/**
 * Calculate impact energy and effects based on meteor parameters
 * Uses established impact physics models and scaling relationships
 */
export class ImpactCalculator {
  private static readonly JOULES_TO_MEGATONS = 4.184e15; // 1 megaton TNT = 4.184e15 joules

  /**
   * Calculate the kinetic energy of the asteroid
   * KE = 0.5 * mass * velocity²
   */
  static calculateKineticEnergy(params: MeteorParameters): number {
    const radius = params.diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3); // m³
    const mass = volume * params.density; // kg
    const velocityMs = params.velocity * 1000; // convert km/s to m/s
    
    return 0.5 * mass * Math.pow(velocityMs, 2); // joules
  }

  /**
   * Calculate crater dimensions using scaling relationships
   * Based on Holsapple & Housen (2007) crater scaling laws
   */
  static calculateCraterSize(params: MeteorParameters, energy: number): { diameter: number; depth: number } {
    const impactAngleRad = (params.angle * Math.PI) / 180;
    const effectiveEnergy = energy * Math.sin(impactAngleRad); // Oblique impact correction
    
    // Simplified crater scaling: D ∝ E^0.25 (for complex craters)
    const craterDiameter = 1.8 * Math.pow(effectiveEnergy / 1e15, 0.25); // in meters
    const craterDepth = craterDiameter / 5; // Typical depth-to-diameter ratio
    
    return {
      diameter: craterDiameter,
      depth: craterDepth
    };
  }

  /**
   * Calculate fireball effects
   */
  static calculateFireballEffects(energy: number): { radius: number; temperature: number } {
    const megatons = energy / this.JOULES_TO_MEGATONS;
    
    // Fireball radius scales with cube root of energy
    const radius = 0.28 * Math.pow(megatons, 0.33); // in km
    
    // Surface temperature (simplified)
    const temperature = 5000 + (megatons * 10); // Celsius
    
    return { radius, temperature };
  }

  /**
   * Calculate airblast overpressure effects
   */
  static calculateAirblastEffects(energy: number): { overpressureRadius: number; shockwaveRadius: number } {
    const megatons = energy / this.JOULES_TO_MEGATONS;
    
    // 5 psi overpressure radius (moderate damage)
    const overpressureRadius = 2.2 * Math.pow(megatons, 0.33); // km
    
    // Shockwave perceptible radius
    const shockwaveRadius = 8.5 * Math.pow(megatons, 0.4); // km
    
    return { overpressureRadius, shockwaveRadius };
  }

  /**
   * Calculate seismic effects
   */
  static calculateSeismicEffects(energy: number, params: MeteorParameters): { magnitude: number; effectiveRadius: number } {
    const megatons = energy / this.JOULES_TO_MEGATONS;
    
    // Richter magnitude from energy
    const magnitude = (2/3) * Math.log10(energy / 1e10) - 3.2;
    
    // Effective radius for seismic damage
    const effectiveRadius = 15 * Math.pow(megatons, 0.4); // km
    
    return {
      magnitude: Math.max(0, Math.min(10, magnitude)),
      effectiveRadius
    };
  }

  /**
   * Calculate thermal radiation effects
   */
  static calculateThermalEffects(energy: number): { radiationRadius: number } {
    const megatons = energy / this.JOULES_TO_MEGATONS;
    
    // Radius for 3rd degree burns from thermal radiation
    const radiationRadius = 3.5 * Math.pow(megatons, 0.41); // km
    
    return { radiationRadius };
  }

  /**
   * Estimate casualties based on impact location and effects
   * This is a simplified model - real calculations would need population density data
   */
  static estimateCasualties(results: Omit<ImpactResults, 'casualties'>, populationDensity: number = 100): {
    estimated: number;
    affectedPopulation: number;
  } {
    // Calculate affected area (simplified circular model)
    const effectiveRadius = Math.max(
      results.effects.fireball.radius,
      results.effects.airblast.overpressureRadius,
      results.effects.thermal.radiationRadius
    );
    
    const affectedArea = Math.PI * Math.pow(effectiveRadius, 2); // km²
    const affectedPopulation = Math.floor(affectedArea * populationDensity);
    
    // Casualty rate decreases with distance (simplified)
    const estimated = Math.floor(affectedPopulation * 0.7);
    
    return {
      estimated,
      affectedPopulation
    };
  }

  /**
   * Calculate complete impact results
   */
  static calculateImpact(params: MeteorParameters, populationDensity?: number): ImpactResults {
    const energy = this.calculateKineticEnergy(params);
    const megatonsTNT = energy / this.JOULES_TO_MEGATONS;
    const crater = this.calculateCraterSize(params, energy);
    const fireball = this.calculateFireballEffects(energy);
    const airblast = this.calculateAirblastEffects(energy);
    const seismic = this.calculateSeismicEffects(energy, params);
    const thermal = this.calculateThermalEffects(energy);

    const partialResults = {
      energy: {
        joules: energy,
        megatonsTNT
      },
      crater,
      effects: {
        fireball,
        airblast,
        seismic,
        thermal
      }
    };

    const casualties = this.estimateCasualties(partialResults as any, populationDensity);

    return {
      ...partialResults,
      casualties
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
      composition: 'rocky'
    };
  }

  /**
   * Get density based on composition
   */
  static getDensityForComposition(composition: string): number {
    const densities: Record<string, number> = {
      rocky: 3000,
      iron: 7800,
      icy: 1000
    };
    return densities[composition] || 3000;
  }
}
