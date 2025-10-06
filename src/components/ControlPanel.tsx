"use client";

import { Info, RotateCcw, Zap, Activity, Rocket, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImpactCalculator } from "@/lib/physics/impactCalculator";
import { useMeteorStore } from "@/lib/store/meteorStore";

interface ControlPanelProps {
  onClose?: () => void;
}

export function ControlPanel({ onClose }: ControlPanelProps) {
  const {
    parameters,
    updateParameter,
    randomizeParameters,
    nasaAsteroids,
    selectedNASAId,
    isLoadingNASA,
    nasaError,
    loadNASAasteroids,
    load2025CloseApproaches,
    selectNASAsteroid,
    dangerousPHAs,
    selectedDangerousPHAId,
    isLoadingDangerous,
    dangerousPHAError,
    loadDangerousPHAs,
    selectDangerousPHA,
    launchAsteroid,
    clearAllImpacts,
    impactSites,
    isAnimating,
    isLaunching,
    isLocked,
  } = useMeteorStore();

  function getInfoText(key: string): React.ReactNode {
    switch (key) {
      case "diameter":
        return "The diameter of the meteor in meters. Larger diameters result in more massive impacts.";
      case "velocity":
        return "The velocity of the meteor at impact in km/s. Higher velocities increase the kinetic energy.";
      case "angle":
        return "The angle of impact in degrees (0° = grazing, 90° = vertical). Affects crater size and shape.";
      case "composition":
        return "The material composition of the meteor, determining its density (rocky: 3000 kg/m³, iron: 7800 kg/m³, icy: 1000 kg/m³).";
      default:
        return "No information available.";
    }
  }
  return (
    <TooltipProvider>
      <div className="glass-panel-enhanced h-full flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              METEOR PARAMETERS
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => !isLocked && randomizeParameters()}
                disabled={isLocked}
                className={`control-button ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                RANDOM
              </Button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Hide Panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Launch Controls */}
          <div className="space-y-2">
            <Button
              onClick={launchAsteroid}
              disabled={isAnimating || isLaunching}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Rocket className="w-5 h-5 mr-2" />
              {isLaunching ? "LAUNCHING..." : "LAUNCH ASTEROID"}
            </Button>
            
            {impactSites.length > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{impactSites.length} impact site{impactSites.length > 1 ? 's' : ''}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllImpacts}
                  className="h-6 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Diameter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="diameter" className="text-sm font-medium">
                Diameter: {parameters.diameter}m
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getInfoText("diameter")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              id="diameter"
              min={10}
              max={1000}
              step={10}
              value={[parameters.diameter]}
              onValueChange={([value]) => !isLocked && updateParameter("diameter", value)}
              disabled={isLocked}
              className={`w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Velocity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="velocity" className="text-sm font-medium">
                Velocity: {parameters.velocity} km/s
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getInfoText("velocity")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              id="velocity"
              min={11}
              max={72}
              step={1}
              value={[parameters.velocity]}
              onValueChange={([value]) => !isLocked && updateParameter("velocity", value)}
              disabled={isLocked}
              className={`w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Impact Angle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="angle" className="text-sm font-medium">
                Impact Angle: {parameters.angle}°
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getInfoText("angle")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              id="angle"
              min={0}
              max={90}
              step={5}
              value={[parameters.angle]}
              onValueChange={([value]) => !isLocked && updateParameter("angle", value)}
              disabled={isLocked}
              className={`w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Composition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Composition</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getInfoText("composition")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={parameters.composition}
              onValueChange={(value: string) =>
                !isLocked && updateParameter("composition", value as "rocky" | "iron" | "icy")
              }
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rocky">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Rocky</Badge>
                    <span className="text-xs text-muted-foreground">
                      3000 kg/m³
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="iron">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Iron</Badge>
                    <span className="text-xs text-muted-foreground">
                      7800 kg/m³
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="icy">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Icy</Badge>
                    <span className="text-xs text-muted-foreground">
                      1000 kg/m³
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isLocked) {
                    const defaults = ImpactCalculator.getDefaultParameters();
                    updateParameter("diameter", defaults.diameter);
                    updateParameter("velocity", defaults.velocity);
                    updateParameter("angle", defaults.angle);
                    updateParameter("density", defaults.density);
                    updateParameter("composition", defaults.composition);
                  }
                }}
                disabled={isLocked}
                className={`${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isLocked) {
                    updateParameter("diameter", 50);
                    updateParameter("velocity", 20);
                    updateParameter("angle", 45);
                    updateParameter("density", 3000);
                    updateParameter("composition", "rocky");
                  }
                }}
                disabled={isLocked}
                className={`${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Tunguska
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isLocked) {
                    updateParameter("diameter", 20);
                    updateParameter("velocity", 18);
                    updateParameter("angle", 20);
                    updateParameter("density", 3300);
                    updateParameter("composition", "rocky");
                  }
                }}
                disabled={isLocked}
                className={`${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Chelyabinsk
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isLocked) {
                    updateParameter("diameter", 10000);
                    updateParameter("velocity", 20);
                    updateParameter("angle", 45);
                    updateParameter("density", 3000);
                    updateParameter("composition", "rocky");
                  }
                }}
                disabled={isLocked}
                className={`${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Dinosaur
              </Button>
            </div>
          </div>

          {/* 🚨 DANGEROUS PHAs Section - Most Important */}
          <div className="space-y-3">
            <Card className="border-primary bg-[hsl(var(--card))]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                  🚨 Most Dangerous PHAs
                </CardTitle>
                <p className="text-sm text-orange-300">
                  Real asteroids that could threaten Earth (NASA Sentry data)
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full border-primary text-primary hover:bg-primary/10 hover:text-primary bg-primary/5 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isLocked && loadDangerousPHAs()}
                  disabled={isLoadingDangerous || isLocked}
                >
                  {isLoadingDangerous ? (
                    <>
                      <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full mr-2"></div>
                      <span className="text-primary">Loading...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-primary font-semibold">Load Dangerous PHAs</span>
                    </>
                  )}
                </Button>

                {/* Display loaded dangerous PHAs - Simple List */}
                {dangerousPHAs.length > 0 && (
                  <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-destructive-foreground">
                    {dangerousPHAs.length} dangerous asteroid{dangerousPHAs.length > 1 ? 's' : ''} loaded:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dangerousPHAs.slice(0, 8).map((pha) => (
                    <div
                      key={pha.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedDangerousPHAId === pha.id
                        ? 'bg-destructive/10 border-destructive/30 ring-2 ring-destructive/50 text-white'
                        : 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10 text-white'
                      }`}
                      onClick={() => selectDangerousPHA(pha.id)}
                    >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{pha.name}</span>
                                <span className="text-sm">
                                  {pha.sizeCategory === 'small' ? '🏐' :
                                   pha.sizeCategory === 'medium' ? '🏠' :
                                   pha.sizeCategory === 'large' ? '🏟️' : '🏙️'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{pha.threatLevel.description}</p>
                            </div>
                            <Badge
                              className={`text-xs ${
                                pha.threatLevel.rating === 'extreme' ? 'bg-destructive text-destructive-foreground' :
                                pha.threatLevel.rating === 'high' ? 'bg-orange-600 text-white' :
                                pha.threatLevel.rating === 'medium' ? 'bg-yellow-600 text-white' :
                                'bg-green-600 text-white'
                              }`}
                            >
                              {pha.threatLevel.rating}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>📏 {pha.sizeComparison} • 📅 {pha.orbit.orbitalPeriod.value.toFixed(1)}y orbit</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dangerousPHAError && (
                  <Card className="bg-red-50/50 border-red-200 mt-3">
                    <CardContent className="p-2">
                      <p className="font-medium text-sm text-red-700">Failed to load dangerous PHAs</p>
                      <p className="text-xs text-red-600">{dangerousPHAError}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced NASA Asteroids Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">🌌 Real Asteroids from NASA</Label>
              <Badge variant="outline">{nasaAsteroids.length} Available</Badge>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isLocked && loadNASAasteroids()}
                  disabled={isLoadingNASA || isLocked}
                  className={`${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Famous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isLocked && load2025CloseApproaches()}
                  disabled={isLoadingNASA || isLocked}
                  className={`${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Recent NEOs
                </Button>
              </div>

              {isLoadingNASA && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full"></div>
                  Fetching real asteroid data from NASA...
                </div>
              )}

              {nasaError && (
                <Card className="bg-destructive/10 border-destructive/20">
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">Failed to load NASA data</p>
                    <p className="text-xs text-muted-foreground">{nasaError}</p>
                  </CardContent>
                </Card>
              )}

              {nasaAsteroids.length > 0 && (
                <div className="space-y-2">
                  <Select
                    value={selectedNASAId || ""}
                    onValueChange={(value) => !isLocked && selectNASAsteroid(value)}
                    disabled={isLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a real asteroid..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nasaAsteroids.map((asteroid) => (
                        <SelectItem key={asteroid.id} value={asteroid.id}>
                          <div className="flex items-center gap-2 w-full">
                            <span className="truncate flex-1">{asteroid.name}</span>
                            <Badge
                              variant={
                                asteroid.threatLevel.rating === 'safe' ? "secondary" :
                                asteroid.threatLevel.rating === 'low' ? "outline" :
                                asteroid.threatLevel.rating === 'medium' ? "default" : "destructive"
                              }
                              className="text-xs shrink-0"
                            >
                              {asteroid.threatLevel.rating}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected asteroid preview */}
                  {(() => {
                    const selectedAsteroid = nasaAsteroids.find(a => a.id === selectedNASAId);
                    return selectedAsteroid ? (
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{selectedAsteroid.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedAsteroid.threatLevel.description}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs">📏 {selectedAsteroid.sizeComparison}</span>
                                <span className="text-xs">📅 {selectedAsteroid.orbit.orbitalPeriod.value.toFixed(1)} year orbit</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="ml-2">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })()}
                </div>
              )}

              {nasaAsteroids.length === 0 && !isLoadingNASA && !nasaError && (
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Click "Famous" for well-known asteroids or "Recent NEOs" for asteroids with upcoming close approaches
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
