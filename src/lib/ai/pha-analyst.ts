import type { ImpactResults, MeteorParameters, NASA_Asteroid } from '@/types/asteroid';

/**
 * AI-powered PHA (Potentially Hazardous Asteroid) impact analyst
 * Client-side wrapper that calls the backend API for secure AI analysis
 */
export class PHAAnalyst {
  /**
   * Generate comprehensive impact analysis using AI (via backend API)
   */
  static async generateImpactAnalysis(
    pha: NASA_Asteroid,
    impactResults: ImpactResults,
    parameters: MeteorParameters,
    context?: {
      location?: string;
      populationDensity?: number;
      historicalComparison?: boolean;
    }
  ): Promise<{
    summary: string;
    riskAssessment: string;
    humanImpact: string;
    mitigationStrategies: string;
    technicalBreakdown: string;
    keyInsights: string[];
  }> {
    try {
      console.log(`🤖 Requesting AI analysis for ${pha.name} from backend API...`);

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pha,
          impactResults,
          parameters,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.fallback) {
        console.warn('⚠️ Using fallback analysis (AI not configured or error occurred)');
      } else {
        console.log(`✅ AI analysis received successfully for ${pha.name}`);
      }

      return data.analysis;

    } catch (error) {
      console.error('❌ Failed to get AI analysis from backend:', error);
      
      // Return basic fallback if API call fails completely
      return this.getBasicFallback(pha, impactResults);
    }
  }

  /**
   * Basic fallback when API is completely unavailable
   */
  private static getBasicFallback(
    pha: NASA_Asteroid,
    impactResults: ImpactResults
  ): {
    summary: string;
    riskAssessment: string;
    humanImpact: string;
    mitigationStrategies: string;
    technicalBreakdown: string;
    keyInsights: string[];
  } {
    const energyMT = impactResults.energy.megatonsTNT;
    const hiroshimaEq = (energyMT / 0.015).toFixed(0);
    
    return {
      summary: `${pha.name} is a ${pha.sizeCategory} asteroid (${pha.sizeComparison}). Impact would release ${energyMT.toExponential(2)} MT TNT (~${hiroshimaEq}× Hiroshima). Threat level: ${pha.threatLevel.rating}.`,
      
      riskAssessment: `Energy: ${energyMT.toExponential(2)} MT. Crater: ${(impactResults.crater.diameter / 1000).toFixed(2)} km diameter. Fireball: ${impactResults.effects.fireball.radius.toFixed(2)} km. Airblast: ${impactResults.effects.airblast.overpressureRadius.toFixed(2)} km. Seismic: ${impactResults.effects.seismic.magnitude.toFixed(1)} magnitude.`,
      
      humanImpact: `Estimated casualties: ${impactResults.casualties.estimated.toLocaleString()}. Affected population: ${impactResults.casualties.affectedPopulation.toLocaleString()}. Multiple impact zones with varying severity from instant vaporization to structural damage.`,
      
      mitigationStrategies: `Deflection options vary by warning time: 15+ years: All methods viable (kinetic impactor, gravity tractor). 5-15 years: Kinetic impactor primary. 1-5 years: Nuclear deflection. <1 year: Focus on evacuation and preparation.`,
      
      technicalBreakdown: `Impact energy: ${impactResults.energy.joules.toExponential(2)} J. Velocity: ${pha.closeApproachData.velocity} km/s. Composition: ${pha.composition.type} (${pha.composition.density} kg/m³). Seismic magnitude: ${impactResults.effects.seismic.magnitude.toFixed(1)}.`,
      
      keyInsights: [
        `Energy equivalent to ~${hiroshimaEq} Hiroshima bombs`,
        `${pha.threatLevel.description}`,
        `Crater: ${(impactResults.crater.diameter / 1000).toFixed(2)} km diameter`,
        'Early detection crucial for successful deflection',
        'Multiple mitigation technologies available',
        'International cooperation essential',
        `Warning time determines available options`,
      ],
    };
  }

  /**
   * Generate comparative analysis between multiple PHAs
   */
  static async generateComparativeAnalysis(
    phas: Array<{
      pha: NASA_Asteroid;
      impactResults: ImpactResults;
      parameters: MeteorParameters;
    }>
  ): Promise<{
    ranking: string;
    comparisons: string;
    recommendations: string;
    overallAssessment: string;
  }> {
    console.log('Comparative analysis not yet implemented');
    
    return {
      ranking: 'Comparative analysis requires backend implementation',
      comparisons: '',
      recommendations: '',
      overallAssessment: '',
    };
  }

  /**
   * Generate detailed mitigation strategies
   */
  static async generateMitigationStrategies(
    pha: NASA_Asteroid,
    impactResults: ImpactResults,
    yearsNotice: number
  ): Promise<{
    recommendedApproach: string;
    alternatives: string[];
    timeline: string;
    successProbability: number;
    costEstimate: string;
  }> {
    console.log('Mitigation strategies not yet implemented');
    
    return {
      recommendedApproach: 'Detailed mitigation strategies require backend implementation',
      alternatives: [],
      timeline: '',
      successProbability: 0,
      costEstimate: '',
    };
  }

  /**
   * Generate scenario analysis
   */
  static async generateScenarioAnalysis(
    pha: NASA_Asteroid,
    impactResults: ImpactResults
  ): Promise<{
    worstCase: string;
    bestCase: string;
    mostLikely: string;
    preparednessRecommendations: string[];
  }> {
    console.log('Scenario analysis not yet implemented');
    
    return {
      worstCase: 'Scenario analysis requires backend implementation',
      bestCase: '',
      mostLikely: '',
      preparednessRecommendations: [],
    };
  }
}
