export interface MeteorParameters {
  diameter: number; // in meters
  velocity: number; // in km/s
  angle: number; // impact angle in degrees (0-90)
  density: number; // in kg/m³
  composition: AsteroidComposition;
}

export type AsteroidComposition = "rocky" | "iron" | "icy";

export interface ImpactLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ImpactResults {
  energy: {
    joules: number;
    megatonsTNT: number;
  };
  crater: {
    diameter: number; // in meters
    depth: number; // in meters
  };
  effects: {
    fireball: {
      radius: number; // in km
      temperature: number; // in Celsius
    };
    airblast: {
      overpressureRadius: number; // in km (overpressure threshold)
      shockwaveRadius: number; // in km
    };
    seismic: {
      magnitude: number; // Richter scale
      effectiveRadius: number; // in km
    };
    thermal: {
      radiationRadius: number; // in km (3rd degree burns)
    };
  };
  casualties: {
    estimated: number;
    affectedPopulation: number;
  };
}

export interface NASA_Asteroid {
  id: string;
  neo_reference_id?: string;
  name: string;
  designation?: string;
  nasa_jpl_url?: string;
  absolute_magnitude_h?: number;

  // Enhanced size information with user-friendly categorization
  estimatedDiameter: {
    min: number;
    max: number;
  };
  sizeCategory: 'small' | 'medium' | 'large' | 'huge';
  sizeComparison: string; // e.g., "Size of a school bus"

  // Enhanced threat assessment with simple explanations
  threatLevel: {
    rating: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
    description: string; // e.g., "No threat for centuries"
    palermoScale?: number;
    torinoScale?: number;
  };

  // User-friendly orbital information
  orbit: {
    earthCrossings: number; // Times it crosses Earth's orbit per year
    nextApproach: {
      date: string;
      distance: { value: number; unit: 'LD' | 'km' | 'AU' };
      description: string; // "Very close approach" or "Distant but notable"
    };
    orbitalPeriod: { value: number; unit: 'years' };
  };

  // Discovery information for user engagement
  discovery: {
    year: number;
    discoverer: string;
    method: 'ground-telescope' | 'space-telescope' | 'radar' | 'spacecraft';
    funFact: string;
  };

  // Composition affecting impact physics
  composition: {
    type: 'stony' | 'iron' | 'stony-iron' | 'carbonaceous' | 'unknown';
    density: number;
    strength: 'fragile' | 'moderate' | 'strong';
  };

  // Legacy fields for backward compatibility
  closeApproachData: {
    date: string;
    velocity: number; // km/s
    missDistance: number; // km
  };
  isPotentiallyHazardous: boolean;
  orbitalData?: {
    orbit_class: {
      orbit_class_type: string;
      orbit_class_description: string;
    };
  };
}

export interface MitigationStrategy {
  type: "kinetic-impactor" | "gravity-tractor" | "nuclear" | "laser-ablation";
  name: string;
  description: string;
  leadTime: number; // years needed before impact
  successRate: number; // percentage
  deltaV: number; // change in velocity (m/s)
}
