"use client";

import {
  Activity,
  AlertTriangle,
  Info,
  Target,
  Thermometer,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMeteorStore } from "@/lib/store/meteorStore";
import {
  formatDistance,
  formatEnergy,
  formatMagnitude,
  formatMegatons,
  formatNumber,
  formatTemperature,
  getHistoricalComparison,
  getImpactSeverity,
} from "@/lib/utils";

export function ResultsPanel() {
  const { impactResults, toggleResultsPanel } = useMeteorStore();

  if (!impactResults) return null;

  const severity = getImpactSeverity(impactResults.energy.megatonsTNT);
  const historicalComparison = getHistoricalComparison(
    impactResults.energy.megatonsTNT,
  );

  return (
    <div className="glass-panel h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            IMPACT ANALYSIS
          </h2>
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                severity.level === 'minimal' ? 'threat-low' :
                severity.level === 'low' ? 'threat-low' :
                severity.level === 'moderate' ? 'threat-medium' :
                severity.level === 'high' ? 'threat-high' :
                severity.level === 'catastrophic' ? 'threat-extreme' : 'threat-extreme'
              } px-3 py-1`}
            >
              {severity.level.toUpperCase()}
            </Badge>
            <button
              onClick={toggleResultsPanel}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Hide Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Energy Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-sm">Energy Release</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Energy</p>
              <p className="font-mono text-lg">
                {formatEnergy(impactResults.energy.joules)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">TNT Equivalent</p>
              <p className="font-mono text-lg">
                {formatMegatons(impactResults.energy.megatonsTNT)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Crater Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-sm">Crater Formation</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Diameter</p>
              <p className="font-mono text-lg">
                {formatDistance(impactResults.crater.diameter)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Depth</p>
              <p className="font-mono text-lg">
                {formatDistance(impactResults.crater.depth)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Effects Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Environmental Effects
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-muted-foreground">Fireball Radius</span>
              </div>
              <span className="font-mono">
                {formatDistance(impactResults.effects.fireball.radius * 1000)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3 h-3 text-red-500" />
                <span className="text-muted-foreground">Max Temperature</span>
              </div>
              <span className="font-mono">
                {formatTemperature(impactResults.effects.fireball.temperature)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-3 h-3 text-blue-500" />
                <span className="text-muted-foreground">Airblast Radius</span>
              </div>
              <span className="font-mono">
                {formatDistance(
                  impactResults.effects.airblast.overpressureRadius * 1000,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-purple-500" />
                <span className="text-muted-foreground">Seismic Magnitude</span>
              </div>
              <span className="font-mono">
                {formatMagnitude(impactResults.effects.seismic.magnitude)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Casualties Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-sm">Human Impact</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Estimated Casualties</p>
              <p className="font-mono text-lg text-red-600">
                {formatNumber(impactResults.casualties.estimated)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Affected Population</p>
              <p className="font-mono text-lg text-orange-600">
                {formatNumber(impactResults.casualties.affectedPopulation)}
              </p>
            </div>
          </div>
        </div>

        {/* Historical Comparison */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Historical Comparison</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Similar in magnitude to: <strong>{historicalComparison}</strong>
          </p>
        </div>

        {/* Detailed Effects */}
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Detailed Effects</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>
              • Thermal radiation can cause severe burns up to{" "}
              {formatDistance(
                impactResults.effects.thermal.radiationRadius * 1000,
              )}
            </p>
            <p>
              • Shockwave effects felt up to{" "}
              {formatDistance(
                impactResults.effects.airblast.shockwaveRadius * 1000,
              )}
            </p>
            <p>
              • Seismic activity equivalent to magnitude{" "}
              {impactResults.effects.seismic.magnitude} earthquake
            </p>
            <p>
              • Crater formation would displace{" "}
              {formatNumber(
                (impactResults.crater.diameter *
                  impactResults.crater.depth *
                  Math.PI) /
                  6,
              )}{" "}
              cubic meters of material
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
