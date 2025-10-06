import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ImpactCalculator } from "@/lib/physics/impactCalculator";
import { NASAAPIService } from "@/lib/nasa-api";
import { DangerousPHAService } from "@/lib/nasa/dangerous-pha-service";
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
  isLocked: boolean; // Controls interface lock during launch

  // Computed values
  impactResults: ImpactResults | null;

  // NASA asteroid data
  nasaAsteroids: NASA_Asteroid[];
  selectedNASAId: string | null;
  isLoadingNASA: boolean;
  nasaError: string | null;

  // Dangerous PHA data
  dangerousPHAs: NASA_Asteroid[];
  selectedDangerousPHAId: string | null;
  isLoadingDangerous: boolean;
  dangerousPHAError: string | null;

  // PHA Impact analyses (calculated for each dangerous PHA)
  phaImpactAnalyses: Map<string, ImpactResults>;

  // Individual PHA calculation states
  calculatingPHAnalyses: Set<string>;
  phaCalculationProgress: Map<string, number>;
  phaCalculationErrors: Map<string, string>;

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

  // Dangerous PHA actions
  loadDangerousPHAs: () => Promise<void>;
  selectDangerousPHA: (phaId: string) => void;
  setIsLoadingDangerous: (loading: boolean) => void;
  calculatePHAImpactAnalysis: (phaId: string) => void;
  getPHAImpactAnalysis: (phaId: string) => ImpactResults | null;
  calculateIndividualPHAImpact: (phaId: string) => Promise<void>;
  getPHAnalysisStatus: (phaId: string) => 'idle' | 'calculating' | 'completed' | 'error';
  clearPHAnalysis: (phaId: string) => void;

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
      showResults: false,
      isAnimating: false,
      showInfo: null,
      isLaunching: false,
      isLocked: false,
      impactResults: ImpactCalculator.calculateImpact(defaultParameters, 100),
      nasaAsteroids: [],
      selectedNASAId: null,
      isLoadingNASA: false,
      nasaError: null,
      dangerousPHAs: [],
      selectedDangerousPHAId: null,
      isLoadingDangerous: false,
      dangerousPHAError: null,
      phaImpactAnalyses: new Map<string, ImpactResults>(),
      calculatingPHAnalyses: new Set<string>(),
      phaCalculationProgress: new Map<string, number>(),
      phaCalculationErrors: new Map<string, string>(),

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
          isLocked: true, // Lock interface during launch
        }));

        // Start animation sequence
        const phases = ImpactCalculator.calculateImpactPhases(parameters, impactResults.energy.joules);

        // Temporarily block buttons for 3 seconds to let user see the simulation
        setTimeout(() => {
          set({
            isLocked: false // Unlock interface after 3 seconds so user can see simulation
          });
        }, 3000);

        // Continue animation until completion
        setTimeout(() => {
          set({
            isAnimating: false,
            isLaunching: false,
          });
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

      // Dangerous PHA actions
      loadDangerousPHAs: async () => {
        set({ isLoadingDangerous: true, dangerousPHAError: null });
        try {
          const dangerousAsteroids = await DangerousPHAService.getMostDangerous();
          set({ dangerousPHAs: dangerousAsteroids, isLoadingDangerous: false });
        } catch (error) {
          console.error("Failed to load dangerous PHAs:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to load dangerous PHA data";
          set({ isLoadingDangerous: false, dangerousPHAError: errorMessage });
        }
      },

      selectDangerousPHA: (phaId: string) => {
        const { dangerousPHAs } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (pha) {
          // Convert dangerous PHA data to meteor parameters
          const diameter = (pha.estimatedDiameter.min + pha.estimatedDiameter.max) / 2;
          const velocity = pha.closeApproachData.velocity;
          const angle = 45; // Default impact angle
          const composition = "rocky" as const;
          const density = ImpactCalculator.getDensityForComposition(composition);

          const parameters: MeteorParameters = {
            diameter,
            velocity,
            angle,
            density,
            composition,
          };

          get().setParameters(parameters);
          set({ selectedDangerousPHAId: phaId });
        }
      },

      setIsLoadingDangerous: (loading: boolean) => {
        set({ isLoadingDangerous: loading });
      },

      calculatePHAImpactAnalysis: (phaId: string) => {
        const { dangerousPHAs } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (pha) {
          // Convert PHA data to meteor parameters for calculation
          const diameter = (pha.estimatedDiameter.min + pha.estimatedDiameter.max) / 2;
          const velocity = pha.closeApproachData.velocity;
          const angle = 45; // Default impact angle
          const composition = "rocky" as const;
          const density = ImpactCalculator.getDensityForComposition(composition);

          const parameters: MeteorParameters = {
            diameter,
            velocity,
            angle,
            density,
            composition,
          };

          // Calculate impact results
          const impactResults = ImpactCalculator.calculateImpact(parameters, 100);

          // Store the analysis
          set((state) => {
            const newAnalyses = new Map(state.phaImpactAnalyses);
            newAnalyses.set(phaId, impactResults);
            return { phaImpactAnalyses: newAnalyses };
          });

          console.log(`📊 Calculated impact analysis for PHA ${pha.name}:`, impactResults);
        }
      },

      getPHAImpactAnalysis: (phaId: string) => {
        const { phaImpactAnalyses } = get();
        return phaImpactAnalyses.get(phaId) || null;
      },

      calculateIndividualPHAImpact: async (phaId: string) => {
        const { dangerousPHAs } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (!pha) {
          console.warn(`⚠️ PHA ${phaId} not found`);
          return;
        }

        // Set calculating state
        set((state) => ({
          calculatingPHAnalyses: new Set([...state.calculatingPHAnalyses, phaId]),
          phaCalculationProgress: new Map([...state.phaCalculationProgress, [phaId, 0]]),
          phaCalculationErrors: new Map([...state.phaCalculationErrors].filter(([id]) => id !== phaId)),
        }));

        try {
          // Simulate progressive calculation with steps
          const calculationSteps = [
            { name: 'Converting PHA data', duration: 200 },
            { name: 'Calculating kinetic energy', duration: 300 },
            { name: 'Modeling crater formation', duration: 400 },
            { name: 'Simulating blast effects', duration: 350 },
            { name: 'Assessing casualties', duration: 250 },
            { name: 'Finalizing analysis', duration: 150 },
          ];

          for (let i = 0; i < calculationSteps.length; i++) {
            const step = calculationSteps[i];
            const progressIncrement = 100 / calculationSteps.length;

            // Update progress
            set((state) => {
              const newProgress = new Map(state.phaCalculationProgress);
              newProgress.set(phaId, (i + 1) * progressIncrement);
              return { phaCalculationProgress: newProgress };
            });

            // Simulate calculation time
            await new Promise(resolve => setTimeout(resolve, step.duration));

            // Check if calculation was cancelled
            const { calculatingPHAnalyses } = get();
            if (!calculatingPHAnalyses.has(phaId)) {
              console.log(`🛑 Calculation cancelled for PHA ${pha.name}`);
              return;
            }
          }

          // Final calculation with PHA-specific parameters
          const diameter = (pha.estimatedDiameter.min + pha.estimatedDiameter.max) / 2;
          const velocity = pha.closeApproachData.velocity;
          const angle = 45;
          const composition = "rocky" as const;
          const density = ImpactCalculator.getDensityForComposition(composition);

          const parameters: MeteorParameters = {
            diameter,
            velocity,
            angle,
            density,
            composition,
          };

          const impactResults = ImpactCalculator.calculateImpact(parameters, 100);

          // Store the completed analysis
          set((state) => {
            const newAnalyses = new Map(state.phaImpactAnalyses);
            newAnalyses.set(phaId, impactResults);

            // Remove from calculating set
            const newCalculating = new Set(state.calculatingPHAnalyses);
            newCalculating.delete(phaId);

            return {
              phaImpactAnalyses: newAnalyses,
              calculatingPHAnalyses: newCalculating,
              phaCalculationProgress: new Map([...state.phaCalculationProgress].filter(([id]) => id !== phaId)),
            };
          });

          console.log(`✅ Completed impact analysis for PHA ${pha.name}:`, impactResults);

        } catch (error) {
          console.error(`❌ Failed to calculate impact for PHA ${pha.name}:`, error);

          // Set error state
          set((state) => {
            const newErrors = new Map(state.phaCalculationErrors);
            newErrors.set(phaId, error instanceof Error ? error.message : 'Calculation failed');

            const newCalculating = new Set(state.calculatingPHAnalyses);
            newCalculating.delete(phaId);

            return {
              phaCalculationErrors: newErrors,
              calculatingPHAnalyses: newCalculating,
              phaCalculationProgress: new Map([...state.phaCalculationProgress].filter(([id]) => id !== phaId)),
            };
          });
        }
      },

      getPHAnalysisStatus: (phaId: string) => {
        const { calculatingPHAnalyses, phaImpactAnalyses, phaCalculationErrors } = get();

        if (calculatingPHAnalyses.has(phaId)) return 'calculating';
        if (phaCalculationErrors.has(phaId)) return 'error';
        if (phaImpactAnalyses.has(phaId)) return 'completed';
        return 'idle';
      },

      clearPHAnalysis: (phaId: string) => {
        set((state) => {
          const newAnalyses = new Map(state.phaImpactAnalyses);
          newAnalyses.delete(phaId);

          const newCalculating = new Set(state.calculatingPHAnalyses);
          newCalculating.delete(phaId);

          const newProgress = new Map(state.phaCalculationProgress);
          newProgress.delete(phaId);

          const newErrors = new Map(state.phaCalculationErrors);
          newErrors.delete(phaId);

          return {
            phaImpactAnalyses: newAnalyses,
            calculatingPHAnalyses: newCalculating,
            phaCalculationProgress: newProgress,
            phaCalculationErrors: newErrors,
          };
        });
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
