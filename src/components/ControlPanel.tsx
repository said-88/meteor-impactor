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
    launchAsteroid,
    clearAllImpacts,
    impactSites,
    isAnimating,
    isLaunching,
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
      <div className="glass-panel h-full flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              METEOR PARAMETERS
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={randomizeParameters}
                className="control-button"
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
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 text-base"
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
              onValueChange={([value]) => updateParameter("diameter", value)}
              className="w-full"
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
              onValueChange={([value]) => updateParameter("velocity", value)}
              className="w-full"
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
              onValueChange={([value]) => updateParameter("angle", value)}
              className="w-full"
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
                updateParameter("composition", value as "rocky" | "iron" | "icy")
              }
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
                  const defaults = ImpactCalculator.getDefaultParameters();
                  updateParameter("diameter", defaults.diameter);
                  updateParameter("velocity", defaults.velocity);
                  updateParameter("angle", defaults.angle);
                  updateParameter("density", defaults.density);
                  updateParameter("composition", defaults.composition);
                }}
              >
                Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateParameter("diameter", 50);
                  updateParameter("velocity", 20);
                  updateParameter("angle", 45);
                  updateParameter("density", 3000);
                  updateParameter("composition", "rocky");
                }}
              >
                Tunguska
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateParameter("diameter", 20);
                  updateParameter("velocity", 18);
                  updateParameter("angle", 20);
                  updateParameter("density", 3300);
                  updateParameter("composition", "rocky");
                }}
              >
                Chelyabinsk
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateParameter("diameter", 10000);
                  updateParameter("velocity", 20);
                  updateParameter("angle", 45);
                  updateParameter("density", 3000);
                  updateParameter("composition", "rocky");
                }}
              >
                Dinosaur
              </Button>
            </div>
          </div>

          {/* NASA Asteroids */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">NASA Asteroids</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNASAasteroids}
                  disabled={isLoadingNASA}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Famous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={load2025CloseApproaches}
                  disabled={isLoadingNASA}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Recent NEOs
                </Button>
              </div>
              {isLoadingNASA && (
                <p className="text-xs text-muted-foreground">
                  Fetching real asteroid data from NASA...
                </p>
              )}
              {nasaError && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                  <p className="font-medium">Failed to load NASA data</p>
                  <p>{nasaError}</p>
                </div>
              )}
              {nasaAsteroids.length > 0 && (
                <Select
                  value={selectedNASAId || ""}
                  onValueChange={selectNASAsteroid}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asteroid" />
                  </SelectTrigger>
                  <SelectContent>
                    {nasaAsteroids.map((asteroid) => (
                      <SelectItem key={asteroid.id} value={asteroid.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{asteroid.name}</span>
                          <Badge
                            variant={
                              asteroid.isPotentiallyHazardous
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {asteroid.isPotentiallyHazardous ? "PHA" : "Safe"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {nasaAsteroids.length === 0 && !isLoadingNASA && !nasaError && (
                <p className="text-xs text-muted-foreground">
                  Click "Famous" for well-known asteroids or "Recent NEOs" for asteroids with upcoming close approaches
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
