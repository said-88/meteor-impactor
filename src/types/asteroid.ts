export interface MeteorParameters {
  diameter: number; // in meters
  velocity: number; // in km/s
  angle: number; // impact angle in degrees (0-90)
  density: number; // in kg/m³
  composition: AsteroidComposition;
}

export type AsteroidComposition = 'rocky' | 'iron' | 'icy';

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

export interface NASAAsteroid {
  id: string;
  name: string;
  estimatedDiameter: {
    min: number;
    max: number;
  };
  closeApproachData: {
    date: string;
    velocity: number;
    missDistance: number;
  };
  isPotentiallyHazardous: boolean;
}

export interface MitigationStrategy {
  type: 'kinetic-impactor' | 'gravity-tractor' | 'nuclear' | 'laser-ablation';
  name: string;
  description: string;
  leadTime: number; // years needed before impact
  successRate: number; // percentage
  deltaV: number; // change in velocity (m/s)
}
