import type { NASA_Asteroid } from "@/types/asteroid";

/**
 * Converts raw NASA asteroid data into user-friendly format
 * Makes complex scientific data accessible and engaging for users
 */
export class UserFriendlyDataConverter {

  /**
   * Convert raw NASA data to enhanced user-friendly asteroid
   */
  static convertNASAAsteroid(nasaData: any): NASA_Asteroid {
    const basicAsteroid = this.createBasicAsteroid(nasaData);

    return {
      ...basicAsteroid,
      sizeCategory: this.categorizeSize(basicAsteroid.estimatedDiameter.max),
      sizeComparison: this.createSizeComparison(basicAsteroid.estimatedDiameter.max),
      threatLevel: this.calculateThreatLevel(nasaData),
      orbit: this.createOrbitInfo(nasaData),
      discovery: this.createDiscoveryInfo(nasaData),
      composition: this.determineComposition(nasaData),
    };
  }

  /**
   * Create basic asteroid structure from NASA data
   */
  private static createBasicAsteroid(nasaData: any): Omit<NASA_Asteroid, 'sizeCategory' | 'sizeComparison' | 'threatLevel' | 'orbit' | 'discovery' | 'composition'> {
    const diameter = nasaData.estimated_diameter?.meters || nasaData.estimated_diameter;
    const closeApproach = nasaData.close_approach_data?.[0];

    return {
      id: nasaData.id,
      neo_reference_id: nasaData.neo_reference_id,
      name: nasaData.name,
      designation: nasaData.designation,
      nasa_jpl_url: nasaData.nasa_jpl_url,
      absolute_magnitude_h: nasaData.absolute_magnitude_h,
      estimatedDiameter: {
        min: diameter?.estimated_diameter_min || 0,
        max: diameter?.estimated_diameter_max || 0,
      },
      closeApproachData: {
        date: closeApproach?.close_approach_date || '',
        velocity: parseFloat(closeApproach?.relative_velocity?.kilometers_per_second || '0'),
        missDistance: parseFloat(closeApproach?.miss_distance?.kilometers || '0'),
      },
      isPotentiallyHazardous: nasaData.is_potentially_hazardous_asteroid || false,
      orbitalData: nasaData.orbital_data,
    };
  }

  /**
   * Categorize asteroid size in user-friendly terms
   */
  private static categorizeSize(maxDiameter: number): 'small' | 'medium' | 'large' | 'huge' {
    if (maxDiameter < 50) return 'small';
    if (maxDiameter < 200) return 'medium';
    if (maxDiameter < 1000) return 'large';
    return 'huge';
  }

  /**
   * Create size comparison that's easy to visualize
   */
  private static createSizeComparison(diameter: number): string {
    if (diameter < 10) return 'Size of a small car';
    if (diameter < 50) return 'Size of a house';
    if (diameter < 200) return 'Size of a football field';
    if (diameter < 1000) return 'Size of a small mountain';
    return 'Size of a large mountain';
  }

  /**
   * Calculate threat level with simple explanation
   */
  private static calculateThreatLevel(nasaData: any): NASA_Asteroid['threatLevel'] {
    const isHazardous = nasaData.is_potentially_hazardous_asteroid;
    const palermoScale = nasaData.palermo_scale || -10;
    const torinoScale = nasaData.torino_scale || 0;

    let rating: NASA_Asteroid['threatLevel']['rating'] = 'safe';
    let description = 'No threat for centuries';

    if (isHazardous) {
      if (palermoScale > -2) {
        rating = 'high';
        description = 'Requires monitoring by astronomers';
      } else if (palermoScale > -4) {
        rating = 'medium';
        description = 'Low probability of impact';
      } else {
        rating = 'low';
        description = 'Very low probability of impact';
      }
    }

    return {
      rating,
      description,
      palermoScale,
      torinoScale,
    };
  }

  /**
   * Create user-friendly orbital information
   */
  private static createOrbitInfo(nasaData: any): NASA_Asteroid['orbit'] {
    const orbitalData = nasaData.orbital_data;
    const closeApproach = nasaData.close_approach_data?.[0];

    // Calculate Earth crossings (simplified)
    const earthCrossings = orbitalData?.orbit_class?.orbit_class_type === 'NEO' ? 2 : 1;

    // Next approach information
    const nextApproach = closeApproach ? {
      date: closeApproach.close_approach_date,
      distance: {
        value: parseFloat(closeApproach.miss_distance.lunar || '0'),
        unit: 'LD' as const,
      },
      description: this.getApproachDescription(closeApproach),
    } : {
      date: 'Unknown',
      distance: { value: 0, unit: 'LD' as const },
      description: 'No close approaches recorded',
    };

    // Orbital period
    const orbitalPeriod = orbitalData?.orbital_period ?
      parseFloat(orbitalData.orbital_period) / 365.25 : 1;

    return {
      earthCrossings,
      nextApproach,
      orbitalPeriod: {
        value: orbitalPeriod,
        unit: 'years',
      },
    };
  }

  /**
   * Create engaging discovery information
   */
  private static createDiscoveryInfo(nasaData: any): NASA_Asteroid['discovery'] {
    const orbitalData = nasaData.orbital_data;
    const discoveryDate = orbitalData?.first_observation_date;

    return {
      year: discoveryDate ? new Date(discoveryDate).getFullYear() : 2000,
      discoverer: 'NASA/JPL',
      method: this.determineDiscoveryMethod(nasaData),
      funFact: this.generateFunFact(nasaData),
    };
  }

  /**
   * Determine composition type based on available data
   */
  private static determineComposition(nasaData: any): NASA_Asteroid['composition'] {
    // Default to stony for now - in future this could use spectral data
    return {
      type: 'stony',
      density: 3000,
      strength: 'moderate',
    };
  }

  /**
   * Get user-friendly description of close approach
   */
  private static getApproachDescription(closeApproach: any): string {
    const distanceLD = parseFloat(closeApproach.miss_distance.lunar || '0');

    if (distanceLD < 1) return 'Very close approach';
    if (distanceLD < 5) return 'Notable close approach';
    if (distanceLD < 10) return 'Moderate distance';
    return 'Distant approach';
  }

  /**
   * Determine discovery method (simplified)
   */
  private static determineDiscoveryMethod(nasaData: any): NASA_Asteroid['discovery']['method'] {
    // This would ideally use real discovery method data from NASA
    return 'ground-telescope';
  }

  /**
   * Generate interesting fun fact about the asteroid
   */
  private static generateFunFact(nasaData: any): string {
    const name = nasaData.name;
    const diameter = nasaData.estimated_diameter?.meters?.estimated_diameter_max || 0;

    if (diameter > 500) {
      return `${name} is large enough to have its own gravity!`;
    } else if (diameter > 100) {
      return `${name} could create a crater visible from space if it impacted Earth.`;
    } else {
      return `${name} is part of NASA's ongoing search for near-Earth objects.`;
    }
  }
}
