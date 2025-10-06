"use client";

import { useState } from "react";
import {
  Brain,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Users,
  Building,
  Globe,
  Clock,
  Lightbulb,
  Rocket,
  Satellite,
  Radio,
  Activity,
  Eye,
  MapPin,
  Flame,
  Wind,
  Mountain
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useMeteorStore } from "@/lib/store/meteorStore";

interface AIAnalysisPanelProps {
  phaId: string;
  onClose?: () => void;
}

export function AIAnalysisPanel({ phaId, onClose }: AIAnalysisPanelProps) {
  const {
    dangerousPHAs,
    getPHAIAnalysis,
    getAIAnalysisStatus,
    generatePHAIAnalysis,
    generateMitigationStrategies,
    generateScenarioAnalysis,
    phaImpactAnalyses,
    aiAnalysisProgress,
    aiAnalysisErrors,
  } = useMeteorStore();

  const pha = dangerousPHAs.find((a) => a.id === phaId);
  const aiAnalysis = getPHAIAnalysis(phaId);
  const status = getAIAnalysisStatus(phaId);
  const progress = aiAnalysisProgress.get(phaId) || 0;
  const error = aiAnalysisErrors.get(phaId);
  const impactResults = phaImpactAnalyses.get(phaId);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'risk']));
  const [expandAllSections, setExpandAllSections] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleExpandAll = () => {
    if (expandAllSections) {
      setExpandedSections(new Set());
      setExpandAllSections(false);
    } else {
      setExpandedSections(new Set(['summary', 'risk', 'impact', 'mitigation', 'technical', 'scenarios']));
      setExpandAllSections(true);
    }
  };

  const handleGenerateAnalysis = async () => {
    await generatePHAIAnalysis(phaId);
  };

  const handleGenerateMitigation = async () => {
    await generateMitigationStrategies(phaId, 10);
  };

  const handleGenerateScenarios = async () => {
    await generateScenarioAnalysis(phaId);
  };

  if (!pha) {
    return (
      <Card className="w-full h-full">
        <CardContent className="p-6">
          <p className="text-muted-foreground">PHA not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                AI IMPACT ANALYSIS
              </h2>
              <p className="text-sm text-muted-foreground">
                {pha.name} • {pha.sizeComparison}
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-500/20 hover:text-red-400"
            >
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Status and Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === 'calculating' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm text-blue-400">Generating AI Analysis...</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {progress.toFixed(0)}%
                  </Badge>
                </>
              )}
              {status === 'completed' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Analysis Complete</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Analysis Failed</span>
                </>
              )}
              {status === 'idle' && (
                <>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Ready for Analysis</span>
                </>
              )}
            </div>
          </div>

          {error && (
            <Card className="bg-red-50/10 border-red-200/50">
              <CardContent className="p-3">
                <p className="text-sm text-red-400 font-medium">Analysis Error</p>
                <p className="text-xs text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Action Buttons */}
          {status === 'completed' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                {expandAllSections ? 'Collapse All' : 'Expand All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateMitigation}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                Mitigation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateScenarios}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Scenarios
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {status === 'calculating' && (
          <Card className="text-center py-16 bg-slate-800/50 border-blue-500/20">
            <CardContent>
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-lg text-muted-foreground mb-2">AI is analyzing the impact scenario...</p>
              <p className="text-sm text-muted-foreground">
                Processing {pha.name} data with advanced impact modeling
              </p>
              <div className="mt-6 max-w-md mx-auto">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{progress.toFixed(0)}% Complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'completed' && aiAnalysis && (
          <div className="space-y-4">
            {/* Summary Section */}
            <Collapsible
              open={expandedSections.has('summary')}
              onOpenChange={() => toggleSection('summary')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Executive Summary
                        <Badge variant="outline" className="ml-2 text-blue-400 border-blue-400">
                          Overview
                        </Badge>
                      </CardTitle>
                      {expandedSections.has('summary') ?
                        <ChevronDown className="w-4 h-4" /> :
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {aiAnalysis.summary}
                      </p>
                      
                      {/* Quick Stats */}
                      {impactResults && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                          <div className="bg-muted/30 p-3 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Diameter</p>
                            <p className="text-lg font-bold text-cyan-400">
                              {pha.estimatedDiameter.min.toFixed(0)}-{pha.estimatedDiameter.max.toFixed(0)}m
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Energy</p>
                            <p className="text-lg font-bold text-yellow-400">
                              {impactResults.energy.megatonsTNT.toExponential(1)} MT
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Crater</p>
                            <p className="text-lg font-bold text-orange-400">
                              {(impactResults.crater.diameter / 1000).toFixed(1)} km
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Casualties</p>
                            <p className="text-lg font-bold text-red-400">
                              {impactResults.casualties.estimated.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Risk Assessment */}
            <Collapsible
              open={expandedSections.has('risk')}
              onOpenChange={() => toggleSection('risk')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        Risk Assessment
                        <Badge variant="outline" className="ml-2 text-orange-400 border-orange-400">
                          {pha.threatLevel.rating.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      {expandedSections.has('risk') ?
                        <ChevronDown className="w-4 h-4" /> :
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {aiAnalysis.riskAssessment}
                      </p>

                      {/* Risk Metrics */}
                      {impactResults && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-yellow-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-5 h-5 text-yellow-400" />
                              <span className="font-semibold text-yellow-400">Energy Release</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-400 mb-1">
                              {impactResults.energy.megatonsTNT.toExponential(2)} MT
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Equivalent to {(impactResults.energy.megatonsTNT / 15).toFixed(0)}× Hiroshima bomb
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 p-4 rounded-lg border border-red-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-5 h-5 text-red-400" />
                              <span className="font-semibold text-red-400">Potential Casualties</span>
                            </div>
                            <p className="text-2xl font-bold text-red-400 mb-1">
                              {impactResults.casualties.estimated.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Based on 100 people/km² density
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Threat Level Indicator */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Threat Level</span>
                          <Badge variant="outline" className={`
                            ${pha.threatLevel.rating === 'extreme' ? 'text-red-400 border-red-400' : ''}
                            ${pha.threatLevel.rating === 'high' ? 'text-orange-400 border-orange-400' : ''}
                            ${pha.threatLevel.rating === 'medium' ? 'text-yellow-400 border-yellow-400' : ''}
                            ${pha.threatLevel.rating === 'low' ? 'text-green-400 border-green-400' : ''}
                            ${pha.threatLevel.rating === 'safe' ? 'text-blue-400 border-blue-400' : ''}
                          `}>
                            {pha.threatLevel.rating.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pha.threatLevel.description}
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Human Impact */}
            <Collapsible
              open={expandedSections.has('impact')}
              onOpenChange={() => toggleSection('impact')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-red-400" />
                        Human Impact Assessment
                        <Badge variant="outline" className="ml-2 text-red-400 border-red-400">
                          Critical
                        </Badge>
                      </CardTitle>
                      {expandedSections.has('impact') ?
                        <ChevronDown className="w-4 h-4" /> :
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {aiAnalysis.humanImpact}
                      </p>

                      {/* Impact Zones */}
                      {impactResults && (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-red-500/20 to-red-500/10 p-4 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Flame className="w-5 h-5 text-red-400" />
                              <span className="font-semibold text-red-400">Immediate Impact Zone</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Fireball radius: <strong className="text-red-400">{impactResults.effects.fireball.radius.toFixed(1)} km</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              100% fatality rate. Complete vaporization of all matter within this radius.
                            </p>
                          </div>

                          <div className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Wind className="w-5 h-5 text-orange-400" />
                              <span className="font-semibold text-orange-400">Severe Damage Zone</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Blast wave radius: <strong className="text-orange-400">{impactResults.effects.airblast.overpressureRadius.toFixed(1)} km</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Most buildings destroyed, 50-90% fatality rate from structural collapse and flying debris.
                            </p>
                          </div>

                          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="w-5 h-5 text-yellow-400" />
                              <span className="font-semibold text-yellow-400">Moderate Damage Zone</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Thermal radiation radius: <strong className="text-yellow-400">{impactResults.effects.thermal.radiationRadius.toFixed(1)} km</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              3rd degree burns, widespread fires, glass shattering causing injuries.
                            </p>
                          </div>

                          <div className="bg-gradient-to-r from-blue-500/20 to-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Mountain className="w-5 h-5 text-blue-400" />
                              <span className="font-semibold text-blue-400">Seismic Effects Zone</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Magnitude: <strong className="text-blue-400">{impactResults.effects.seismic.magnitude.toFixed(1)} Richter</strong> • 
                              Radius: <strong className="text-blue-400"> {impactResults.effects.seismic.effectiveRadius.toFixed(1)} km</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Earthquake-like shaking causing structural damage and panic.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Mitigation Strategies */}
            <Collapsible
              open={expandedSections.has('mitigation')}
              onOpenChange={() => toggleSection('mitigation')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-green-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-400" />
                        Mitigation Strategies
                        <Badge variant="outline" className="ml-2 text-green-400 border-green-400">
                          Action Plan
                        </Badge>
                      </CardTitle>
                      {expandedSections.has('mitigation') ?
                        <ChevronDown className="w-4 h-4" /> :
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {aiAnalysis.mitigationStrategies}
                      </p>
                      
                      {/* Mitigation Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Rocket className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-green-400">Kinetic Impactor</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Direct collision to alter trajectory. Effective for early detection (10+ years advance warning).
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Satellite className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-blue-400">Gravity Tractor</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Spacecraft uses gravity to slowly deflect. Requires 15+ years but highly precise.
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-yellow-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="font-semibold text-yellow-400">Nuclear Standoff</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Nuclear detonation near surface. Last resort option for imminent threats (&lt;5 years).
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-purple-400" />
                            <span className="font-semibold text-purple-400">Ion Beam Deflection</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Focused ion beam gradually changes trajectory. Experimental but highly controlled.
                          </p>
                        </div>
                      </div>

                      {/* Warning Timeline */}
                      <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-orange-400" />
                          <span className="font-semibold text-orange-400">Critical Timeline Requirements</span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span><strong>15+ years:</strong> All deflection methods viable</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                            <span><strong>5-15 years:</strong> Kinetic impactor or gravity tractor</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full" />
                            <span><strong>1-5 years:</strong> Nuclear standoff deflection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full" />
                            <span><strong>&lt;1 year:</strong> Focus on evacuation and impact preparation</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Technical Breakdown */}
            <Collapsible
              open={expandedSections.has('technical')}
              onOpenChange={() => toggleSection('technical')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-purple-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-400" />
                        Technical Breakdown
                        <Badge variant="outline" className="ml-2 text-purple-400 border-purple-400">
                          Physics
                        </Badge>
                      </CardTitle>
                      {expandedSections.has('technical') ?
                        <ChevronDown className="w-4 h-4" /> :
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {aiAnalysis.technicalBreakdown}
                      </p>

                      {/* Impact Physics Grid */}
                      {impactResults && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                          <div className="bg-muted/30 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Flame className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-medium text-muted-foreground">Fireball</span>
                            </div>
                            <p className="text-xl font-bold text-orange-400">
                              {impactResults.effects.fireball.radius.toFixed(1)} km
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {impactResults.effects.fireball.temperature.toLocaleString()}°C
                            </p>
                          </div>

                          <div className="bg-muted/30 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Wind className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-muted-foreground">Blast Wave</span>
                            </div>
                            <p className="text-xl font-bold text-blue-400">
                              {impactResults.effects.airblast.overpressureRadius.toFixed(1)} km
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Overpressure damage
                            </p>
                          </div>

                          <div className="bg-muted/30 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Mountain className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-medium text-muted-foreground">Crater</span>
                            </div>
                            <p className="text-xl font-bold text-yellow-400">
                              {(impactResults.crater.diameter / 1000).toFixed(1)} km
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {impactResults.crater.depth.toFixed(0)}m deep
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Impact Scenarios */}
            <Collapsible
              open={expandedSections.has('scenarios')}
              onOpenChange={() => toggleSection('scenarios')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-cyan-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                        Impact Scenarios
                        <Badge variant="outline" className="ml-2 text-cyan-400 border-cyan-400">
                          What If
                        </Badge>
                      </CardTitle>
                      {expandedSections.has('scenarios') ?
                        <ChevronDown className="w-4 h-4" /> :
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Different location scenarios */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-blue-400">Urban Impact Scenario</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Impact in a major metropolitan area (population density: 5,000/km²)
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-red-400" />
                              <span className="text-muted-foreground">Est. casualties:</span>
                              <span className="font-bold text-red-400">
                                {impactResults ? (impactResults.casualties.estimated * 50).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-orange-400" />
                              <span className="text-muted-foreground">Infrastructure:</span>
                              <span className="font-bold text-orange-400">Catastrophic</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-green-400">Rural/Ocean Impact</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Impact in remote area or ocean (population density: &lt;10/km²)
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-green-400" />
                              <span className="text-muted-foreground">Est. casualties:</span>
                              <span className="font-bold text-green-400">Minimal</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-yellow-400" />
                              <span className="text-muted-foreground">Global effects:</span>
                              <span className="font-bold text-yellow-400">Regional</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Radio className="w-5 h-5 text-purple-400" />
                            <span className="font-semibold text-purple-400">Early Warning Scenario</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            With 10+ years advance detection and mitigation preparation
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-green-400" />
                              <span className="text-muted-foreground">Deflection success:</span>
                              <span className="font-bold text-green-400">85-95%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-green-400" />
                              <span className="text-muted-foreground">Lives saved:</span>
                              <span className="font-bold text-green-400">Most/All</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Key Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiAnalysis.keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {status === 'idle' && !aiAnalysis && (
          <Card className="text-center py-16 bg-slate-800/50 border-purple-500/20">
            <CardContent>
              <Brain className="w-16 h-16 mx-auto mb-6 text-purple-400" />
              <p className="text-xl text-foreground mb-2 font-semibold">
                AI Analysis Ready
              </p>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                AI will provide comprehensive insights, risk assessment, and mitigation strategies for {pha.name}
              </p>
              <Button
                onClick={handleGenerateAnalysis}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start AI Analysis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
