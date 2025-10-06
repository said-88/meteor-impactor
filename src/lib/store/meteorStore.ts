import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ImpactCalculator } from "@/lib/physics/impactCalculator";
import { NASAAPIService } from "@/lib/nasa-api";
import { DangerousPHAService } from "@/lib/nasa/dangerous-pha-service";
import { PHAAnalyst } from "@/lib/ai/pha-analyst";
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

  // AI Analysis state
  phaAIAnalyses: Map<string, {
    summary: string;
    riskAssessment: string;
    humanImpact: string;
    mitigationStrategies: string;
    technicalBreakdown: string;
    keyInsights: string[];
  }>;
  calculatingAIAnalyses: Set<string>;
  aiAnalysisProgress: Map<string, number>;
  aiAnalysisErrors: Map<string, string>;

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

  // AI Analysis actions
  generatePHAIAnalysis: (phaId: string) => Promise<void>;
  getPHAIAnalysis: (phaId: string) => {
    summary: string;
    riskAssessment: string;
    humanImpact: string;
    mitigationStrategies: string;
    technicalBreakdown: string;
    keyInsights: string[];
  } | null;
  getAIAnalysisStatus: (phaId: string) => 'idle' | 'calculating' | 'completed' | 'error';
  clearAIAnalysis: (phaId: string) => void;
  generateComparativeAIAnalysis: (phaIds: string[]) => Promise<void>;
  generateMitigationStrategies: (phaId: string, leadTime?: number) => Promise<void>;
  generateScenarioAnalysis: (phaId: string) => Promise<void>;

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
      phaAIAnalyses: new Map<string, {
        summary: string;
        riskAssessment: string;
        humanImpact: string;
        mitigationStrategies: string;
        technicalBreakdown: string;
        keyInsights: string[];
      }>(),
      calculatingAIAnalyses: new Set<string>(),
      aiAnalysisProgress: new Map<string, number>(),
      aiAnalysisErrors: new Map<string, string>(),

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
        const { dangerousPHAs, phaImpactAnalyses } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (pha) {
          console.log(`🔍 Calculating impact analysis for PHA ${pha.name} (ID: ${phaId})`);

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

          console.log(`📏 PHA Parameters:`, parameters);

          // Calculate impact results
          const impactResults = ImpactCalculator.calculateImpact(parameters, 100);

          console.log(`📊 Impact Results:`, impactResults);

          // Store the analysis immediately
          set((state) => {
            const newAnalyses = new Map(state.phaImpactAnalyses);
            newAnalyses.set(phaId, impactResults);
            console.log(`💾 Stored impact analysis for PHA ${pha.name}`);
            console.log(`📋 Current analyses in store:`, Array.from(newAnalyses.keys()));
            return { phaImpactAnalyses: newAnalyses };
          });

          console.log(`✅ Successfully calculated impact analysis for PHA ${pha.name}`);
        } else {
          console.error(`❌ PHA with ID ${phaId} not found in dangerousPHAs array`);
          console.error(`📋 Available PHAs:`, dangerousPHAs.map(pha => ({ id: pha.id, name: pha.name })));
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

      // AI Analysis actions
      generatePHAIAnalysis: async (phaId: string) => {
        const { dangerousPHAs } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (!pha) {
          console.warn(`⚠️ PHA ${phaId} not found for AI analysis`);
          return;
        }

        // Check if we have impact analysis first
        let impactResults = get().phaImpactAnalyses.get(phaId);

        if (!impactResults) {
          console.log(`📊 No impact analysis available for PHA ${pha.name}, calculating first...`);
          
          // Calculate impact analysis first and wait for it to complete
          try {
            await get().calculatePHAImpactAnalysis(phaId);
            
            // Wait a bit for state to update
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Get the results from the updated state
            impactResults = get().phaImpactAnalyses.get(phaId);
            
            if (impactResults) {
              console.log(`✅ Impact analysis completed successfully for ${pha.name}`);
            } else {
              console.error(`❌ Impact analysis failed to generate results for ${pha.name}`);
              
              // Set error state
              set((state) => ({
                aiAnalysisErrors: new Map([...state.aiAnalysisErrors, [phaId, 'Failed to calculate impact analysis']]),
              }));
              return;
            }
          } catch (error) {
            console.error(`❌ Error calculating impact analysis for ${pha.name}:`, error);
            set((state) => ({
              aiAnalysisErrors: new Map([...state.aiAnalysisErrors, [phaId, 'Impact calculation error']]),
            }));
            return;
          }
        }

        if (!impactResults) {
          console.error(`❌ No impact results available after calculation for ${pha.name}`);
          return;
        }

        // Set AI calculating state
        set((state) => ({
          calculatingAIAnalyses: new Set([...state.calculatingAIAnalyses, phaId]),
          aiAnalysisProgress: new Map([...state.aiAnalysisProgress, [phaId, 0]]),
          aiAnalysisErrors: new Map([...state.aiAnalysisErrors].filter(([id]) => id !== phaId)),
        }));

        try {
          // Simulate progressive AI analysis with steps
          const analysisSteps = [
            { name: 'Analyzing asteroid data', duration: 300 },
            { name: 'Processing impact calculations', duration: 400 },
            { name: 'Generating risk assessment', duration: 500 },
            { name: 'Creating mitigation strategies', duration: 350 },
            { name: 'Compiling final report', duration: 250 },
          ];

          for (let i = 0; i < analysisSteps.length; i++) {
            const step = analysisSteps[i];
            const progressIncrement = 100 / analysisSteps.length;

            // Update progress
            set((state) => {
              const newProgress = new Map(state.aiAnalysisProgress);
              newProgress.set(phaId, (i + 1) * progressIncrement);
              return { aiAnalysisProgress: newProgress };
            });

            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, step.duration));

            // Check if analysis was cancelled
            const { calculatingAIAnalyses } = get();
            if (!calculatingAIAnalyses.has(phaId)) {
              console.log(`🛑 AI analysis cancelled for PHA ${pha.name}`);
              return;
            }
          }

          // Convert PHA data to meteor parameters for AI analysis
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

          // Generate AI analysis
          const aiAnalysis = await PHAAnalyst.generateImpactAnalysis(
            pha,
            impactResults,
            parameters,
            {
              location: 'Global impact assessment',
              populationDensity: 100,
              historicalComparison: true,
            }
          );

          // Store the completed AI analysis
          set((state) => {
            const newAIAnalyses = new Map(state.phaAIAnalyses);
            newAIAnalyses.set(phaId, aiAnalysis);

            // Remove from calculating set
            const newCalculating = new Set(state.calculatingAIAnalyses);
            newCalculating.delete(phaId);

            return {
              phaAIAnalyses: newAIAnalyses,
              calculatingAIAnalyses: newCalculating,
              aiAnalysisProgress: new Map([...state.aiAnalysisProgress].filter(([id]) => id !== phaId)),
            };
          });

          console.log(`🤖 Completed AI analysis for PHA ${pha.name}:`, aiAnalysis);

        } catch (error) {
          console.error(`❌ Failed to generate AI analysis for PHA ${pha.name}:`, error);

          // Set error state
          set((state) => {
            const newErrors = new Map(state.aiAnalysisErrors);
            newErrors.set(phaId, error instanceof Error ? error.message : 'AI analysis failed');

            const newCalculating = new Set(state.calculatingAIAnalyses);
            newCalculating.delete(phaId);

            return {
              aiAnalysisErrors: newErrors,
              calculatingAIAnalyses: newCalculating,
              aiAnalysisProgress: new Map([...state.aiAnalysisProgress].filter(([id]) => id !== phaId)),
            };
          });
        }
      },

      getPHAIAnalysis: (phaId: string) => {
        const { phaAIAnalyses } = get();
        return phaAIAnalyses.get(phaId) || null;
      },

      getAIAnalysisStatus: (phaId: string) => {
        const { calculatingAIAnalyses, phaAIAnalyses, aiAnalysisErrors } = get();

        if (calculatingAIAnalyses.has(phaId)) return 'calculating';
        if (aiAnalysisErrors.has(phaId)) return 'error';
        if (phaAIAnalyses.has(phaId)) return 'completed';
        return 'idle';
      },

      clearAIAnalysis: (phaId: string) => {
        set((state) => {
          const newAIAnalyses = new Map(state.phaAIAnalyses);
          newAIAnalyses.delete(phaId);

          const newCalculating = new Set(state.calculatingAIAnalyses);
          newCalculating.delete(phaId);

          const newProgress = new Map(state.aiAnalysisProgress);
          newProgress.delete(phaId);

          const newErrors = new Map(state.aiAnalysisErrors);
          newErrors.delete(phaId);

          return {
            phaAIAnalyses: newAIAnalyses,
            calculatingAIAnalyses: newCalculating,
            aiAnalysisProgress: newProgress,
            aiAnalysisErrors: newErrors,
          };
        });
      },

      generateComparativeAIAnalysis: async (phaIds: string[]) => {
        const { dangerousPHAs, phaImpactAnalyses } = get();

        // Filter to only PHAs that have impact analyses
        const validPhas = phaIds
          .map(id => {
            const pha = dangerousPHAs.find(a => a.id === id);
            const impactResults = phaImpactAnalyses.get(id);
            if (pha && impactResults) {
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

              return { pha, impactResults, parameters };
            }
            return null;
          })
          .filter((item): item is { pha: NASA_Asteroid; impactResults: ImpactResults; parameters: MeteorParameters } => item !== null);

        if (validPhas.length < 2) {
          console.warn('⚠️ Need at least 2 PHAs with impact analyses for comparative analysis');
          return;
        }

        try {
          console.log(`🔍 Generating comparative AI analysis for ${validPhas.length} PHAs...`);
          const comparativeAnalysis = await PHAAnalyst.generateComparativeAnalysis(validPhas);

          // Store comparative analysis (could be stored separately or with first PHA)
          console.log('📊 Comparative analysis completed:', comparativeAnalysis);

        } catch (error) {
          console.error('❌ Failed to generate comparative analysis:', error);
        }
      },

      generateMitigationStrategies: async (phaId: string, leadTime = 10) => {
        const { dangerousPHAs, phaImpactAnalyses } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (!pha) {
          console.warn(`⚠️ PHA ${phaId} not found for mitigation analysis`);
          return;
        }

        const impactResults = phaImpactAnalyses.get(phaId);
        if (!impactResults) {
          console.warn(`⚠️ No impact analysis available for mitigation strategies`);
          return;
        }

        try {
          console.log(`🛡️ Generating mitigation strategies for PHA ${pha.name} (${leadTime} years lead time)...`);
          const mitigationStrategies = await PHAAnalyst.generateMitigationStrategies(
            pha,
            impactResults,
            leadTime
          );

          console.log('✅ Mitigation strategies generated:', mitigationStrategies);

        } catch (error) {
          console.error('❌ Failed to generate mitigation strategies:', error);
        }
      },

      generateScenarioAnalysis: async (phaId: string) => {
        const { dangerousPHAs, phaImpactAnalyses } = get();
        const pha = dangerousPHAs.find((a) => a.id === phaId);

        if (!pha) {
          console.warn(`⚠️ PHA ${phaId} not found for scenario analysis`);
          return;
        }

        const impactResults = phaImpactAnalyses.get(phaId);
        if (!impactResults) {
          console.warn(`⚠️ No impact analysis available for scenario analysis`);
          return;
        }

        try {
          console.log(`🔮 Generating scenario analysis for PHA ${pha.name}...`);

          // Convert PHA data to meteor parameters
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

          const scenarioAnalysis = await PHAAnalyst.generateScenarioAnalysis(
            pha,
            impactResults,
            parameters
          );

          console.log('✅ Scenario analysis completed:', scenarioAnalysis);

        } catch (error) {
          console.error('❌ Failed to generate scenario analysis:', error);
        }
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
