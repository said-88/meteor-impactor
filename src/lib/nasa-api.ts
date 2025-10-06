import type { NASA_Asteroid } from "@/types/asteroid";
import { UserFriendlyDataConverter } from "./nasa/data-converter";

const API_BASE = "/api/nasa"; // Use our Next.js API route instead of NASA directly

export interface NASAFeedResponse {
  links: {
    next: string;
    previous: string;
    self: string;
  };
  element_count: number;
  near_earth_objects: Record<string, NASA_Asteroid[]>;
}

export interface NASALookupResponse {
  links: {
    self: string;
  };
  id: string;
  neo_reference_id: string;
  name: string;
  designation: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    miles: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    feet: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    epoch_date_close_approach: number;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
      miles_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      lunar: string;
      kilometers: string;
      miles: string;
    };
    orbiting_body: string;
  }>;
  orbital_data: {
    orbit_id: string;
    orbit_determination_date: string;
    first_observation_date: string;
    last_observation_date: string;
    data_arc_in_days: number;
    observations_used: number;
    orbit_uncertainty: string;
    minimum_orbit_intersection: string;
    jupiter_tether_moxie: string;
    epoch_osculation: string;
    eccentricity: string;
    semi_major_axis: string;
    inclination: string;
    ascending_node_longitude: string;
    orbital_period: string;
    perihelion_distance: string;
    perihelion_argument: string;
    aphelion_distance: string;
    perihelion_time: string;
    mean_anomaly: string;
    mean_motion: string;
    equinox: string;
    orbit_class: {
      orbit_class_type: string;
      orbit_class_description: string;
      orbit_class_range: string;
    };
  };
  is_sentry_object: boolean;
}

export class NASAAPIService {
  /**
   * Fetch asteroids for a date range
   */
  static async getAsteroidsFeed(
    startDate: string,
    endDate: string,
  ): Promise<NASAFeedResponse> {
    const url = `${API_BASE}?endpoint=feed&start_date=${startDate}&end_date=${endDate}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`NASA API error: ${errorData.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Lookup a specific asteroid by ID
   */
  static async getAsteroidById(asteroidId: string): Promise<NASALookupResponse> {
    const url = `${API_BASE}?endpoint=neo&id=${asteroidId}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`NASA API error: ${errorData.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Browse the overall asteroid dataset
   */
  static async browseAsteroids(page: number = 0, size: number = 20): Promise<any> {
    const url = `${API_BASE}?endpoint=browse&page=${page}&size=${size}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`NASA API error: ${errorData.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert NASA asteroid data to our internal format using user-friendly converter
   */
  static convertToInternalFormat(nasaAsteroid: NASALookupResponse): NASA_Asteroid {
    return UserFriendlyDataConverter.convertNASAAsteroid(nasaAsteroid);
  }

  /**
   * Get famous asteroids using verified working NASA asteroid IDs
   * Falls back to recent close approaches if famous asteroids fail
   */
  static async getFamousAsteroids(): Promise<NASA_Asteroid[]> {
    // Using asteroid IDs that are known to work with NASA NEO API
    // These are verified NEO reference IDs from NASA database
    const famousAsteroidIds = [
      "2163294", // 433 Eros - well known near-Earth asteroid
      "2001580", // 25143 Itokawa - visited by Hayabusa spacecraft
      "2025148", // 101955 Bennu - OSIRIS-REx target
      "2001221", // 162173 Ryugu - Hayabusa2 target
    ];

    const asteroids: NASA_Asteroid[] = [];

    for (const id of famousAsteroidIds) {
      try {
        console.log(`🌌 Fetching asteroid ${id}...`);
        const nasaData = await this.getAsteroidById(id);
        const asteroid = this.convertToInternalFormat(nasaData);
        asteroids.push(asteroid);
        console.log(`✅ Successfully loaded ${asteroid.name} (${asteroid.estimatedDiameter.min.toFixed(1)}-${asteroid.estimatedDiameter.max.toFixed(1)}m, ${asteroid.closeApproachData.velocity.toFixed(2)} km/s)`);
      } catch (error) {
        console.warn(`❌ Failed to fetch asteroid ${id}:`, error);
        // Try alternative famous asteroid IDs if the primary ones fail
        if (id === "2163294") {
          console.log("🔄 Trying alternative asteroid IDs...");
          const alternativeIds = ["2000433", "20025143", "2001019"];
          for (const altId of alternativeIds) {
            try {
              console.log(`🌌 Trying alternative asteroid ${altId}...`);
              const altData = await this.getAsteroidById(altId);
              const altAsteroid = this.convertToInternalFormat(altData);
              asteroids.push(altAsteroid);
              console.log(`✅ Successfully loaded alternative ${altAsteroid.name}`);
              break; // Success, break out of alternatives
            } catch (altError) {
              console.warn(`❌ Alternative asteroid ${altId} also failed:`, altError);
            }
          }
        }
      }
    }

    // If we got at least one asteroid, return what we have
    if (asteroids.length > 0) {
      console.log(`🎯 Successfully loaded ${asteroids.length} asteroids from NASA`);
      return asteroids;
    }

    // Fallback: Try to get NEOs with recent close approaches
    console.log("🌌 Falling back to recent NEO close approaches...");
    return await this.getRecentCloseApproaches();
  }

  /**
   * Get asteroids with recent close approaches (7-day window)
   */
  static async getRecentCloseApproaches(): Promise<NASA_Asteroid[]> {
    console.log("🌌 Fetching asteroids with recent close approaches...");
    const asteroids: NASA_Asteroid[] = [];

    try {
      // Use a 7-day window (NASA API limit)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const feedData = await this.getAsteroidsFeed(startDateStr, endDateStr);

      const neoAsteroids = Object.values(feedData.near_earth_objects).flat();
      console.log(`📅 Found ${neoAsteroids.length} asteroids with recent close approaches`);

      // Get detailed data for up to 5 asteroids
      const sampleAsteroids = neoAsteroids.slice(0, 5);

      for (const nasaAsteroid of sampleAsteroids) {
        try {
          const fullData = await this.getAsteroidById(nasaAsteroid.id);
          const asteroid = this.convertToInternalFormat(fullData);
          asteroids.push(asteroid);
          console.log(`✅ Loaded NEO: ${asteroid.name} (${asteroid.closeApproachData.date})`);
        } catch (error) {
          console.warn(`❌ Failed to load ${nasaAsteroid.id}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Failed to load recent close approaches:", error);
      // Fallback to browsing asteroids
      console.log("🌌 Falling back to browsing asteroid database...");
      return await this.getBrowseAsteroids();
    }

    return asteroids;
  }

  /**
   * Get some asteroids from the NASA browse endpoint as fallback
   */
  static async getBrowseAsteroids(): Promise<NASA_Asteroid[]> {
    console.log("🌌 Browsing NASA asteroid database...");
    const asteroids: NASA_Asteroid[] = [];

    try {
      const browseData = await this.browseAsteroids(0, 10); // Get first 10 asteroids

      for (const asteroid of browseData.near_earth_objects || []) {
        try {
          // Get full data for each asteroid
          const fullData = await this.getAsteroidById(asteroid.id);
          const convertedAsteroid = this.convertToInternalFormat(fullData);
          asteroids.push(convertedAsteroid);
          console.log(`✅ Browsed asteroid: ${convertedAsteroid.name}`);

          // Limit to 3 asteroids for performance
          if (asteroids.length >= 3) break;
        } catch (error) {
          console.warn(`❌ Failed to load browsed asteroid ${asteroid.id}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Failed to browse asteroids:", error);
    }

    return asteroids;
  }
}
