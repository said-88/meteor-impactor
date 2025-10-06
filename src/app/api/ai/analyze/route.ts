import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import type { ImpactResults, MeteorParameters, NASA_Asteroid } from '@/types/asteroid';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/analyze
 * Generate AI-powered impact analysis for a PHA
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pha, impactResults, parameters, context } = body as {
      pha: NASA_Asteroid;
      impactResults: ImpactResults;
      parameters: MeteorParameters;
      context?: {
        location?: string;
        populationDensity?: number;
        historicalComparison?: boolean;
      };
    };

    // Validate required fields
    if (!pha || !impactResults || !parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: pha, impactResults, parameters' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('❌ Google AI API key not configured');
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          fallback: true,
          analysis: getFallbackAnalysis(pha, impactResults)
        },
        { status: 200 } // Return 200 with fallback data
      );
    }

    // Initialize Google AI model (server-side)
    console.log('🔑 Initializing Google AI model on server...');
    const model = google('models/gemini-2.0-flash-exp');

    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(pha, impactResults, parameters, context);

    console.log(`🤖 Generating AI analysis for ${pha.name}...`);

    // Generate analysis using AI SDK
    const result = await generateText({
      model,
      prompt,
      temperature: 0.3, // Lower temperature for more factual analysis
    });

    console.log(`✅ AI analysis generated successfully for ${pha.name}`);

    // Parse the response
    const analysis = parseAnalysisResponse(result.text);

    return NextResponse.json({
      success: true,
      analysis,
      fallback: false,
    });

  } catch (error) {
    console.error('❌ AI analysis API error:', error);
    
    // Return fallback analysis on error
    const { pha, impactResults } = await request.json();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'AI analysis failed',
        fallback: true,
        analysis: getFallbackAnalysis(pha, impactResults),
      },
      { status: 200 } // Return 200 with fallback
    );
  }
}

/**
 * Build comprehensive analysis prompt for the AI
 */
function buildAnalysisPrompt(
  pha: NASA_Asteroid,
  impactResults: ImpactResults,
  parameters: MeteorParameters,
  context?: {
    location?: string;
    populationDensity?: number;
    historicalComparison?: boolean;
  }
): string {
  const location = context?.location || 'Global impact assessment';
  const populationDensity = context?.populationDensity || 100;

  return `You are an expert planetary defense analyst. Analyze this asteroid impact scenario and provide a comprehensive assessment.

**ASTEROID DATA:**
- Name: ${pha.name}
- Size: ${pha.estimatedDiameter.min.toFixed(0)}-${pha.estimatedDiameter.max.toFixed(0)} meters diameter
- Size Category: ${pha.sizeCategory}
- Comparison: ${pha.sizeComparison}
- Threat Level: ${pha.threatLevel.rating}
- Threat Description: ${pha.threatLevel.description}
- Composition: ${pha.composition.type}
- Density: ${pha.composition.density} kg/m³

**IMPACT PARAMETERS:**
- Velocity: ${parameters.velocity} km/s
- Impact Angle: ${parameters.angle}°
- Composition: ${parameters.composition}

**IMPACT EFFECTS:**
- Energy: ${impactResults.energy.megatonsTNT.toExponential(2)} Megatons TNT (${impactResults.energy.joules.toExponential(2)} Joules)
- Crater Diameter: ${(impactResults.crater.diameter / 1000).toFixed(2)} km
- Crater Depth: ${impactResults.crater.depth.toFixed(0)} meters
- Fireball Radius: ${impactResults.effects.fireball.radius.toFixed(2)} km (${impactResults.effects.fireball.temperature.toLocaleString()}°C)
- Air Blast Radius: ${impactResults.effects.airblast.overpressureRadius.toFixed(2)} km
- Thermal Radiation: ${impactResults.effects.thermal.radiationRadius.toFixed(2)} km
- Seismic Magnitude: ${impactResults.effects.seismic.magnitude.toFixed(1)} Richter
- Estimated Casualties: ${impactResults.casualties.estimated.toLocaleString()}
- Affected Population: ${impactResults.casualties.affectedPopulation.toLocaleString()}

**CONTEXT:**
- Location: ${location}
- Population Density: ${populationDensity} people/km²

Please provide a detailed analysis in the following format:

**SUMMARY:** (2-3 sentences providing an executive overview of the threat)

**RISK ASSESSMENT:** (Detailed evaluation of the threat level, probability, and consequences. Include comparisons to historical events if relevant)

**HUMAN IMPACT:** (Detailed analysis of casualties, affected populations, infrastructure damage, and humanitarian consequences)

**MITIGATION STRATEGIES:** (Comprehensive list of deflection methods, warning systems, and evacuation plans with specific timelines and success rates)

**TECHNICAL BREAKDOWN:** (Scientific explanation of the impact physics, energy release, and environmental effects)

**KEY INSIGHTS:** (5-7 bullet points with critical takeaways and recommendations)

Use scientific accuracy but make it accessible to non-experts. Include specific numbers and comparisons when possible.`;
}

/**
 * Parse AI response into structured format
 */
function parseAnalysisResponse(text: string): {
  summary: string;
  riskAssessment: string;
  humanImpact: string;
  mitigationStrategies: string;
  technicalBreakdown: string;
  keyInsights: string[];
} {
  const sections = {
    summary: '',
    riskAssessment: '',
    humanImpact: '',
    mitigationStrategies: '',
    technicalBreakdown: '',
    keyInsights: [] as string[],
  };

  try {
    // Extract sections using simple string splitting
    const summaryMatch = text.match(/\*\*SUMMARY:\*\*[\s\S]*?(?=\*\*|$)/);
    const riskMatch = text.match(/\*\*RISK ASSESSMENT:\*\*[\s\S]*?(?=\*\*|$)/);
    const humanMatch = text.match(/\*\*HUMAN IMPACT:\*\*[\s\S]*?(?=\*\*|$)/);
    const mitigationMatch = text.match(/\*\*MITIGATION STRATEGIES:\*\*[\s\S]*?(?=\*\*|$)/);
    const technicalMatch = text.match(/\*\*TECHNICAL BREAKDOWN:\*\*[\s\S]*?(?=\*\*|$)/);
    const insightsMatch = text.match(/\*\*KEY INSIGHTS:\*\*[\s\S]*$/);

    sections.summary = summaryMatch?.[0]?.replace(/\*\*SUMMARY:\*\*/, '').trim() || 'Analysis in progress...';
    sections.riskAssessment = riskMatch?.[0]?.replace(/\*\*RISK ASSESSMENT:\*\*/, '').trim() || 'Evaluating threat level...';
    sections.humanImpact = humanMatch?.[0]?.replace(/\*\*HUMAN IMPACT:\*\*/, '').trim() || 'Assessing human impact...';
    sections.mitigationStrategies = mitigationMatch?.[0]?.replace(/\*\*MITIGATION STRATEGIES:\*\*/, '').trim() || 'Developing mitigation strategies...';
    sections.technicalBreakdown = technicalMatch?.[0]?.replace(/\*\*TECHNICAL BREAKDOWN:\*\*/, '').trim() || 'Computing technical details...';

    // Parse key insights (bullet points)
    if (insightsMatch?.[0]) {
      const insightsText = insightsMatch[0].replace(/\*\*KEY INSIGHTS:\*\*/, '').trim();
      sections.keyInsights = insightsText
        .split(/\n/)
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    return sections;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return sections;
  }
}

/**
 * Fallback analysis when AI is unavailable
 */
function getFallbackAnalysis(
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
  const hiroshimaEquivalent = (energyMT / 0.015).toFixed(0);

  return {
    summary: `${pha.name} is a ${pha.sizeCategory} asteroid with a diameter of ${pha.estimatedDiameter.min.toFixed(0)}-${pha.estimatedDiameter.max.toFixed(0)} meters (${pha.sizeComparison}). An impact would release ${energyMT.toExponential(2)} megatons of TNT equivalent energy, approximately ${hiroshimaEquivalent}× the Hiroshima bomb. This represents a ${pha.threatLevel.rating} threat level with significant regional to global consequences.`,

    riskAssessment: `The impact would generate a ${(impactResults.crater.diameter / 1000).toFixed(2)} km diameter crater and produce devastating effects across multiple zones. The fireball radius of ${impactResults.effects.fireball.radius.toFixed(2)} km would cause instant vaporization, while air blast effects would extend ${impactResults.effects.airblast.overpressureRadius.toFixed(2)} km causing widespread structural collapse. Thermal radiation would affect areas up to ${impactResults.effects.thermal.radiationRadius.toFixed(2)} km away. The seismic event would register ${impactResults.effects.seismic.magnitude.toFixed(1)} on the Richter scale.`,

    humanImpact: `Based on a population density of 100 people per km², estimated casualties would reach ${impactResults.casualties.estimated.toLocaleString()} with ${impactResults.casualties.affectedPopulation.toLocaleString()} people in the affected zone. The immediate impact zone (fireball) would result in 100% fatalities. The severe damage zone would experience 50-90% casualties from structural collapse and debris. Moderate damage zones would see injuries from thermal burns, flying glass, and infrastructure damage. Long-term effects would include displacement, resource scarcity, and potential climate impacts.`,

    mitigationStrategies: `Mitigation strategies depend critically on warning time: (1) 15+ years advance warning: Kinetic impactor mission or gravity tractor deflection with 85-95% success rate. (2) 5-15 years: Kinetic impactor as primary option. (3) 1-5 years: Nuclear standoff detonation for trajectory modification. (4) <1 year: Focus on mass evacuation, infrastructure hardening, and emergency response preparation. Early detection through programs like NASA's Planetary Defense Coordination Office is crucial. International cooperation through the UN Space Mission Planning Advisory Group would coordinate global response.`,

    technicalBreakdown: `The impact physics involves several stages: (1) Atmospheric entry at ${pha.composition.type === 'iron' ? 'minimal' : 'significant'} ablation given the asteroid's ${pha.composition.type} composition. (2) Kinetic energy conversion: ${impactResults.energy.joules.toExponential(2)} Joules released instantaneously. (3) Crater formation following ${pha.composition.strength} material ejection patterns. (4) Shock wave propagation creating ${impactResults.effects.seismic.magnitude.toFixed(1)} magnitude seismic event. (5) Thermal pulse generating ${impactResults.effects.fireball.temperature.toLocaleString()}°C temperatures. The ${pha.composition.density} kg/m³ density affects penetration depth and energy distribution.`,

    keyInsights: [
      `Energy equivalent to ${hiroshimaEquivalent} Hiroshima bombs would be released on impact`,
      `${pha.threatLevel.description} - Early detection is crucial for successful deflection`,
      `Crater diameter of ${(impactResults.crater.diameter / 1000).toFixed(2)} km indicates ${pha.sizeCategory}-scale devastation`,
      `Multiple deflection technologies exist but require 5-15 years advance warning`,
      `Seismic magnitude ${impactResults.effects.seismic.magnitude.toFixed(1)} would affect infrastructure hundreds of kilometers away`,
      `Global cooperation through UN Space Mission Planning Advisory Group is essential`,
      `Investment in detection systems like Pan-STARRS and ATLAS is critical for planetary defense`,
    ],
  };
}
