import type { NASA_Asteroid } from "@/types/asteroid";
import { UserFriendlyDataConverter } from "./data-converter";

const API_BASE = "/api/nasa";

/**
 * Service for fetching and analyzing dangerous Potentially Hazardous Asteroids
 * Uses NASA's official risk assessment data from Sentry Risk Table
 */
export class DangerousPHAService {

  /**
   * Get the most dangerous asteroids from NASA's Sentry Risk Table
   * These are asteroids with actual impact probability > 0
   */
  static async getMostDangerous(): Promise<NASA_Asteroid[]> {
    console.log("🚨 Fetching most dangerous asteroids from NASA Sentry...");

    try {
      const response = await fetch(`${API_BASE}?endpoint=sentry`);
      if (!response.ok) {
        throw new Error(`Sentry API error: ${response.status}`);
      }

      const sentryData = await response.json();
      console.log(`📊 Sentry data received:`, sentryData);

      // Parse Sentry data format
      const dangerousAsteroids: NASA_Asteroid[] = [];

      // Handle different Sentry API response formats
      let sentryArray: any[] = [];

      if (sentryData && typeof sentryData === 'object') {
        // Data field as array
        if (Array.isArray(sentryData.data)) {
          sentryArray = sentryData.data;
        } else if (Array.isArray(sentryData.sentry_data)) {
          sentryArray = sentryData.sentry_data;
        } else if (Array.isArray(sentryData)) {
          // Root response is array
          sentryArray = sentryData as any[];
        } else {
          sentryArray = [];
        }
      }

      console.log(`📊 Processing ${sentryArray.length} Sentry records`);

      for (const asteroidData of sentryArray) {
        // Skip invalid records that are neither objects nor arrays
        if (!asteroidData || (typeof asteroidData !== 'object' && !Array.isArray(asteroidData))) {
          console.warn('⚠️ Skipping invalid Sentry record:', asteroidData);
          continue;
        }
        try {
          // Convert Sentry format to our asteroid format
          const asteroid = this.convertSentryToAsteroid(asteroidData);
          if (asteroid) {
            dangerousAsteroids.push(asteroid);
            console.log(`🚨 Dangerous asteroid: ${asteroid.name} (Palermo: ${asteroid.threatLevel.palermoScale})`);
          }
        } catch (error) {
          console.warn(`❌ Failed to convert Sentry asteroid:`, error);
        }
      }

      // Sort by danger level (Palermo Scale descending)
      dangerousAsteroids.sort((a, b) => (b.threatLevel.palermoScale || -10) - (a.threatLevel.palermoScale || -10));

      console.log(`🎯 Found ${dangerousAsteroids.length} dangerous asteroids`);

      // If no dangerous asteroids found, return sample data for demonstration
      if (dangerousAsteroids.length === 0) {
        console.log("📝 No dangerous asteroids found, returning sample data for demonstration");
        return this.getSampleDangerousAsteroids();
      }

      return dangerousAsteroids.slice(0, 10); // Top 10 most dangerous

    } catch (error) {
      console.error("❌ Failed to fetch dangerous asteroids:", error);
      console.log("📝 Returning sample dangerous asteroids for demonstration");
      return this.getSampleDangerousAsteroids();
    }
  }

  /**
   * Get PHAs with close approaches in the next 30 days
   */
  static async getUpcomingThreats(): Promise<NASA_Asteroid[]> {
    console.log("⚠️ Fetching upcoming dangerous close approaches...");

    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);

      const response = await fetch(`${API_BASE}?endpoint=cad&date=${futureDate.toISOString().split('T')[0]}`);
      if (!response.ok) {
        throw new Error(`CAD API error: ${response.status}`);
      }

      const cadData = await response.json();
      console.log(`📅 CAD data received:`, cadData);

      const threatAsteroids: NASA_Asteroid[] = [];

      if (cadData.data && Array.isArray(cadData.data)) {
        for (const approachData of cadData.data) {
          try {
            // Only include very close approaches (< 0.05 AU) and large asteroids
            const distanceAU = parseFloat(approachData.dist || '0');
            const diameter = parseFloat(approachData.diam || '0');

            if (distanceAU < 0.05 && diameter > 100) { // Very close and large
              const asteroid = await this.getAsteroidByDesignation(approachData.des);
              if (asteroid) {
                threatAsteroids.push(asteroid);
                console.log(`⚠️ Upcoming threat: ${asteroid.name} (${distanceAU.toFixed(3)} AU, ${diameter.toFixed(0)}m)`);
              }
            }
          } catch (error) {
            console.warn(`❌ Failed to process CAD asteroid:`, error);
          }
        }
      }

      return threatAsteroids.slice(0, 5); // Top 5 upcoming threats

    } catch (error) {
      console.error("❌ Failed to fetch upcoming threats:", error);
      return [];
    }
  }

  /**
   * Get asteroids by danger level
   */
  static async getByDangerLevel(level: 'extreme' | 'high' | 'medium'): Promise<NASA_Asteroid[]> {
    const allDangerous = await this.getMostDangerous();
    const upcoming = await this.getUpcomingThreats();

    const combined = [...allDangerous, ...upcoming];
    const uniqueAsteroids = this.removeDuplicates(combined);

    return uniqueAsteroids.filter(asteroid => asteroid.threatLevel.rating === level);
  }

  /**
   * Convert Sentry Risk Table format to our asteroid format
   */
  private static convertSentryToAsteroid(sentryData: any): NASA_Asteroid | null {
    try {
      // Handle different Sentry API response formats
      let designation, name, yearRange, potentialImpacts, impactProbability, palermoScale, torinoScale;

      if (Array.isArray(sentryData)) {
        // Array format: [des, name, year_range, potential_impacts, impact_prob, palermo, torino, ...]
        [designation, name, yearRange, potentialImpacts, impactProbability, palermoScale, torinoScale] = sentryData;
      } else if (typeof sentryData === 'object' && sentryData !== null) {
        // Object format with named properties
        designation = sentryData.des || sentryData.designation;
        name = sentryData.name;
        yearRange = sentryData.year_range;
        potentialImpacts = sentryData.potential_impacts;
        impactProbability = sentryData.impact_prob || sentryData.ip;
        palermoScale = sentryData.palermo || sentryData.ps;
        torinoScale = sentryData.torino || sentryData.ts;
      } else {
        console.warn("⚠️ Unknown Sentry data format:", sentryData);
        return null;
      }

      // Skip if no real impact probability
      if (!impactProbability || parseFloat(impactProbability) <= 0) {
        return null;
      }

      // Create basic asteroid structure
      const asteroid: NASA_Asteroid = {
        id: designation,
        name: name || designation,
        estimatedDiameter: {
          min: 100, // Default, would be enhanced with real data
          max: 500, // Default, would be enhanced with real data
        },
        sizeCategory: 'large',
        sizeComparison: 'Size of multiple football fields',
        threatLevel: {
          rating: this.calculateDangerRating(parseFloat(palermoScale), parseFloat(torinoScale)),
          description: this.createDangerDescription(parseFloat(palermoScale), parseFloat(impactProbability)),
          palermoScale: parseFloat(palermoScale),
          torinoScale: parseInt(torinoScale),
        },
        orbit: {
          earthCrossings: 2,
          nextApproach: {
            date: new Date().toISOString().split('T')[0],
            distance: { value: 0.01, unit: 'AU' },
            description: 'Very close approach possible',
          },
          orbitalPeriod: { value: 1.5, unit: 'years' },
        },
        discovery: {
          year: 2000, // Would be enhanced with real data
          discoverer: 'NASA/JPL',
          method: 'ground-telescope',
          funFact: `Has actual impact probability calculated by NASA scientists`,
        },
        composition: {
          type: 'stony',
          density: 3000,
          strength: 'moderate',
        },
        closeApproachData: {
          date: new Date().toISOString().split('T')[0],
          velocity: 20,
          missDistance: 1000000, // 1 million km
        },
        isPotentiallyHazardous: true,
      };

      return asteroid;

    } catch (error) {
      console.error("❌ Error converting Sentry data:", error);
      return null;
    }
  }

  /**
   * Calculate danger rating from Palermo and Torino scales
   */
  private static calculateDangerRating(palermoScale: number, torinoScale: number): 'extreme' | 'high' | 'medium' | 'low' {
    if (palermoScale > 0 || torinoScale >= 4) return 'extreme';
    if (palermoScale > -2 || torinoScale >= 2) return 'high';
    if (palermoScale > -4 || torinoScale >= 1) return 'medium';
    return 'low';
  }

  /**
   * Create user-friendly danger description
   */
  private static createDangerDescription(palermoScale: number, impactProbability: number): string {
    if (palermoScale > 0) {
      return 'Extremely dangerous - requires immediate attention';
    } else if (palermoScale > -2) {
      return 'High threat level - under active monitoring';
    } else if (palermoScale > -4) {
      return 'Moderate threat - warrants observation';
    } else {
      return 'Low probability but large size makes it notable';
    }
  }

  /**
   * Get asteroid data by designation (for CAD data)
   */
  private static async getAsteroidByDesignation(designation: string): Promise<NASA_Asteroid | null> {
    try {
      // This would ideally look up the asteroid in NASA's database
      // For now, create a basic structure
      return {
        id: designation,
        name: designation,
        estimatedDiameter: { min: 100, max: 300 },
        sizeCategory: 'medium',
        sizeComparison: 'Size of a small building',
        threatLevel: {
          rating: 'medium',
          description: 'Close approach requires monitoring',
        },
        orbit: {
          earthCrossings: 1,
          nextApproach: {
            date: new Date().toISOString().split('T')[0],
            distance: { value: 0.02, unit: 'AU' },
            description: 'Notable close approach',
          },
          orbitalPeriod: { value: 2, unit: 'years' },
        },
        discovery: {
          year: 2010,
          discoverer: 'NASA',
          method: 'ground-telescope',
          funFact: 'Detected through close approach monitoring',
        },
        composition: {
          type: 'stony',
          density: 3000,
          strength: 'moderate',
        },
        closeApproachData: {
          date: new Date().toISOString().split('T')[0],
          velocity: 15,
          missDistance: 3000000, // 3 million km
        },
        isPotentiallyHazardous: true,
      };
    } catch (error) {
      console.error("❌ Error getting asteroid by designation:", error);
      return null;
    }
  }

  /**
   * Remove duplicate asteroids from combined arrays
   */
  private static removeDuplicates(asteroids: NASA_Asteroid[]): NASA_Asteroid[] {
    const seen = new Set<string>();
    return asteroids.filter(asteroid => {
      if (seen.has(asteroid.id)) {
        return false;
      }
      seen.add(asteroid.id);
      return true;
    });
  }

  /**
   * Get sample dangerous asteroids for demonstration when API is unavailable
   */
  private static getSampleDangerousAsteroids(): NASA_Asteroid[] {
    return [
      {
        id: "sample-001",
        name: "PHA-001 (Demo)",
        estimatedDiameter: { min: 800, max: 1200 },
        sizeCategory: 'huge',
        sizeComparison: 'Size of a small mountain',
        threatLevel: {
          rating: 'extreme',
          description: 'Extremely dangerous - requires immediate attention',
          palermoScale: 1.5,
          torinoScale: 4,
        },
        orbit: {
          earthCrossings: 3,
          nextApproach: {
            date: new Date().toISOString().split('T')[0],
            distance: { value: 0.008, unit: 'AU' },
            description: 'Very close approach possible',
          },
          orbitalPeriod: { value: 2.3, unit: 'years' },
        },
        discovery: {
          year: 2015,
          discoverer: 'NASA/JPL',
          method: 'ground-telescope',
          funFact: 'Detected by NASA\'s asteroid monitoring program',
        },
        composition: {
          type: 'stony-iron',
          density: 4500,
          strength: 'strong',
        },
        closeApproachData: {
          date: new Date().toISOString().split('T')[0],
          velocity: 25,
          missDistance: 800000, // 800,000 km
        },
        isPotentiallyHazardous: true,
      },
      {
        id: "sample-002",
        name: "PHA-002 (Demo)",
        estimatedDiameter: { min: 400, max: 600 },
        sizeCategory: 'large',
        sizeComparison: 'Size of multiple football fields',
        threatLevel: {
          rating: 'high',
          description: 'High threat level - under active monitoring',
          palermoScale: -1.2,
          torinoScale: 2,
        },
        orbit: {
          earthCrossings: 2,
          nextApproach: {
            date: new Date().toISOString().split('T')[0],
            distance: { value: 0.015, unit: 'AU' },
            description: 'Close approach requires attention',
          },
          orbitalPeriod: { value: 1.8, unit: 'years' },
        },
        discovery: {
          year: 2018,
          discoverer: 'NASA/JPL',
          method: 'space-telescope',
          funFact: 'Discovered during routine sky survey',
        },
        composition: {
          type: 'stony',
          density: 3000,
          strength: 'moderate',
        },
        closeApproachData: {
          date: new Date().toISOString().split('T')[0],
          velocity: 18,
          missDistance: 1500000, // 1.5 million km
        },
        isPotentiallyHazardous: true,
      },
      {
        id: "sample-003",
        name: "PHA-003 (Demo)",
        estimatedDiameter: { min: 200, max: 350 },
        sizeCategory: 'medium',
        sizeComparison: 'Size of a small building',
        threatLevel: {
          rating: 'medium',
          description: 'Moderate threat - warrants observation',
          palermoScale: -3.1,
          torinoScale: 1,
        },
        orbit: {
          earthCrossings: 1,
          nextApproach: {
            date: new Date().toISOString().split('T')[0],
            distance: { value: 0.035, unit: 'AU' },
            description: 'Notable close approach',
          },
          orbitalPeriod: { value: 3.2, unit: 'years' },
        },
        discovery: {
          year: 2020,
          discoverer: 'NASA/JPL',
          method: 'ground-telescope',
          funFact: 'Found by amateur astronomers working with NASA',
        },
        composition: {
          type: 'carbonaceous',
          density: 2500,
          strength: 'fragile',
        },
        closeApproachData: {
          date: new Date().toISOString().split('T')[0],
          velocity: 22,
          missDistance: 3500000, // 3.5 million km
        },
        isPotentiallyHazardous: true,
      },
    ];
  }

  /**
   * Get comprehensive threat analysis for an asteroid
   */
  static analyzeThreat(asteroid: NASA_Asteroid): {
    devastationPotential: 'extinction' | 'continental' | 'regional' | 'local';
    mitigationUrgency: 'immediate' | 'high' | 'moderate' | 'low';
    monitoringPriority: 'critical' | 'high' | 'medium' | 'low';
    publicConcern: 'extreme' | 'high' | 'moderate' | 'low';
  } {
    const palermo = asteroid.threatLevel.palermoScale || -10;
    const diameter = asteroid.estimatedDiameter.max;

    let devastationPotential: 'extinction' | 'continental' | 'regional' | 'local' = 'local';
    if (diameter > 1000) devastationPotential = 'extinction';
    else if (diameter > 500) devastationPotential = 'continental';
    else if (diameter > 200) devastationPotential = 'regional';

    let mitigationUrgency: 'immediate' | 'high' | 'moderate' | 'low' = 'low';
    if (palermo > 0) mitigationUrgency = 'immediate';
    else if (palermo > -2) mitigationUrgency = 'high';
    else if (palermo > -4) mitigationUrgency = 'moderate';

    // Map mitigation urgency to monitoring priority
    let monitoringPriority: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (mitigationUrgency === 'immediate') monitoringPriority = 'critical';
    else if (mitigationUrgency === 'high') monitoringPriority = 'high';
    else if (mitigationUrgency === 'moderate') monitoringPriority = 'medium';

    return {
      devastationPotential,
      mitigationUrgency,
      monitoringPriority,
      publicConcern: devastationPotential === 'extinction' ? 'extreme' : devastationPotential === 'continental' ? 'high' : 'moderate',
    };
  }
}
