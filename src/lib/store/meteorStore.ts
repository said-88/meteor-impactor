import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ImpactCalculator } from "@/lib/physics/impactCalculator";
import { NASAAPIService } from "@/lib/nasa-api";
import type {
  ImpactLocation,
  ImpactResults,
  MeteorParameters,
  NASA_Asteroid,
} from "@/types/asteroid";

export interface ImpactSite {
  id: string;
  location: ImpactLocation;
  parameters: MeteorParameters;
  results: ImpactResults;
  timestamp: Date;
  isLaunched: boolean; // true after launch, false if just preview
}

interface MeteorState {
  // Meteor parameters
  parameters: MeteorParameters;

  // Impact location for preview marker
  impactLocation: ImpactLocation;

  // Multiple impact sites
  impactSites: ImpactSite[];
  activeImpactId: string | null;

  // UI state
  showResults: boolean;
  isAnimating: boolean;
  showInfo: string | null;
  isLaunching: boolean;

  // Computed values
  impactResults: ImpactResults | null;

  // NASA asteroid data
  nasaAsteroids: NASA_Asteroid[];
  selectedNASAId: string | null;
  isLoadingNASA: boolean;
  nasaError: string | null;

  // Actions
  setParameters: (parameters: MeteorParameters) => void;
  updateParameter: <K extends keyof MeteorParameters>(
    key: K,
    value: MeteorParameters[K],
  ) => void;
  setImpactLocation: (location: ImpactLocation) => void;
  setShowResults: (show: boolean) => void;
  setIsAnimating: (animating: boolean) => void;
  setShowInfo: (info: string | null) => void;

  // Impact site actions
  launchAsteroid: () => void;
  clearImpact: (id: string) => void;
  clearAllImpacts: () => void;

  // NASA actions
  loadNASAasteroids: () => Promise<void>;
  load2025CloseApproaches: () => Promise<void>;
  selectNASAsteroid: (asteroidId: string) => void;
  setIsLoadingNASA: (loading: boolean) => void;

  // Utility actions
  randomizeParameters: () => void;
  resetToDefaults: () => void;
  toggleResultsPanel: () => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  calculateImpact: () => void;
}

const defaultLocation: ImpactLocation = {
  lat: 40.7128,
  lng: -74.006,
};

const defaultParameters = ImpactCalculator.getDefaultParameters();

export const useMeteorStore = create<MeteorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      parameters: defaultParameters,
      impactLocation: defaultLocation,
      impactSites: [],
      activeImpactId: null,
      showResults: true,
      isAnimating: false,
      showInfo: null,
      isLaunching: false,
      impactResults: ImpactCalculator.calculateImpact(defaultParameters, 100),
      nasaAsteroids: [],
      selectedNASAId: null,
      isLoadingNASA: false,
      nasaError: null,

      // Actions
      setParameters: (parameters: MeteorParameters) => {
        const results = ImpactCalculator.calculateImpact(parameters, 100);
        set({
          parameters,
          impactResults: results,
        });
      },

      updateParameter: <K extends keyof MeteorParameters>(
        key: K,
        value: MeteorParameters[K],
      ) => {
        const currentParams = get().parameters;
        const newParams = {
          ...currentParams,
          [key]: value,
        };
        get().setParameters(newParams);
      },

      setImpactLocation: (location: ImpactLocation) => {
        set({ impactLocation: location });
      },

      setShowResults: (show: boolean) => {
        set({ showResults: show });
      },

      setIsAnimating: (animating: boolean) => {
        set({ isAnimating: animating });
      },

      setShowInfo: (info: string | null) => {
        set({ showInfo: info });
      },

      // Impact site actions
      launchAsteroid: () => {
        const { parameters, impactLocation, impactResults } = get();
        if (!impactResults) return;

        const newSite: ImpactSite = {
          id: `impact-${Date.now()}`,
          location: impactLocation,
          parameters: { ...parameters },
          results: { ...impactResults },
          timestamp: new Date(),
          isLaunched: true,
        };

        set((state) => ({
          impactSites: [...state.impactSites, newSite],
          activeImpactId: newSite.id,
          isAnimating: true,
          isLaunching: true,
        }));

        // Start animation sequence
        const phases = ImpactCalculator.calculateImpactPhases(parameters, impactResults.energy.joules);
        
        setTimeout(() => {
          set({ isAnimating: false, isLaunching: false });
        }, phases.totalDuration * 1000);
      },

      clearImpact: (id: string) => {
        set((state) => ({
          impactSites: state.impactSites.filter((site) => site.id !== id),
          activeImpactId: state.activeImpactId === id ? null : state.activeImpactId,
        }));
      },

      clearAllImpacts: () => {
        set({
          impactSites: [],
          activeImpactId: null,
          isAnimating: false,
        });
      },

      // NASA actions
      loadNASAasteroids: async () => {
        set({ isLoadingNASA: true, nasaError: null });
        try {
          const asteroids = await NASAAPIService.getFamousAsteroids();
          set({ nasaAsteroids: asteroids, isLoadingNASA: false });
        } catch (error) {
          console.error("Failed to load NASA asteroids:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to load NASA data";
          set({ isLoadingNASA: false, nasaError: errorMessage });
        }
      },

      load2025CloseApproaches: async () => {
        set({ isLoadingNASA: true, nasaError: null });
        try {
          const asteroids = await NASAAPIService.getRecentCloseApproaches();
          set({ nasaAsteroids: asteroids, isLoadingNASA: false });
        } catch (error) {
          console.error("Failed to load recent close approaches:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to load recent data";
          set({ isLoadingNASA: false, nasaError: errorMessage });
        }
      },

      selectNASAsteroid: (asteroidId: string) => {
        const { nasaAsteroids } = get();
        const asteroid = nasaAsteroids.find((a) => a.id === asteroidId);

        if (asteroid) {
          // Convert NASA data to meteor parameters
          const diameter = (asteroid.estimatedDiameter.min + asteroid.estimatedDiameter.max) / 2;
          const velocity = asteroid.closeApproachData.velocity;
          const angle = 45; // Default impact angle
          const composition = "rocky" as const; // Assume rocky composition
          const density = ImpactCalculator.getDensityForComposition(composition);

          const parameters: MeteorParameters = {
            diameter,
            velocity,
            angle,
            density,
            composition,
          };

          get().setParameters(parameters);
          set({ selectedNASAId: asteroidId });
        }
      },

      setIsLoadingNASA: (loading: boolean) => {
        set({ isLoadingNASA: loading });
      },

      calculateImpact: () => {
        const { parameters } = get();
        const results = ImpactCalculator.calculateImpact(parameters, 100);
        set({ impactResults: results });
      },

      // Utility actions
      randomizeParameters: () => {
        const randomParams: MeteorParameters = {
          diameter: Math.random() * 990 + 10, // 10-1000m
          velocity: Math.random() * 61 + 11, // 11-72 km/s
          angle: Math.random() * 90, // 0-90 degrees
          density: ImpactCalculator.getDensityForComposition(
            ["rocky", "iron", "icy"][Math.floor(Math.random() * 3)],
          ),
          composition: ["rocky", "iron", "icy"][
            Math.floor(Math.random() * 3)
          ] as "rocky" | "iron" | "icy",
        };

        get().setParameters(randomParams);
      },

      resetToDefaults: () => {
        set({
          parameters: defaultParameters,
          impactLocation: defaultLocation,
          impactResults: ImpactCalculator.calculateImpact(
            defaultParameters,
            100,
          ),
          isAnimating: false,
        });
      },

      toggleResultsPanel: () => {
        set((state) => ({ showResults: !state.showResults }));
      },

      startAnimation: () => {
        const { parameters, impactResults, activeImpactId } = get();
        if (impactResults && activeImpactId) {
          const phases = ImpactCalculator.calculateImpactPhases(parameters, impactResults.energy.joules);
          set({ isAnimating: true });
          setTimeout(() => {
            set({ isAnimating: false });
          }, phases.totalDuration * 1000);
        }
      },

      stopAnimation: () => {
        set({ isAnimating: false });
      },
    }),
    {
      name: "meteor-store",
    },
  ),
);
