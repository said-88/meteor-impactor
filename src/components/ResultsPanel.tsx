'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Target,
  Thermometer,
  Wind,
  Activity,
  Users,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { ImpactResults } from '@/types/asteroid';
import {
  formatDistance,
  formatEnergy,
  formatMegatons,
  formatTemperature,
  formatMagnitude,
  formatNumber,
  getImpactSeverity,
  getHistoricalComparison
} from '@/lib/utils';

interface ResultsPanelProps {
  results: ImpactResults;
  showDetails?: boolean;
  onHide?: () => void;
}

export function ResultsPanel({ results, showDetails = true, onHide }: ResultsPanelProps) {
  const severity = getImpactSeverity(results.energy.megatonsTNT);
  const historicalComparison = getHistoricalComparison(results.energy.megatonsTNT);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Impact Results
            <Badge
              variant="outline"
              style={{
                backgroundColor: severity.color + '20',
                borderColor: severity.color,
                color: severity.color
              }}
            >
              {severity.level}
            </Badge>
          </span>
          {onHide && (
            <button
              onClick={onHide}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Hide Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Energy Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-sm">Energy Release</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Energy</p>
              <p className="font-mono text-lg">{formatEnergy(results.energy.joules)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">TNT Equivalent</p>
              <p className="font-mono text-lg">{formatMegatons(results.energy.megatonsTNT)}</p>
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
              <p className="font-mono text-lg">{formatDistance(results.crater.diameter)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Depth</p>
              <p className="font-mono text-lg">{formatDistance(results.crater.depth)}</p>
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
              <span className="font-mono">{formatDistance(results.effects.fireball.radius * 1000)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3 h-3 text-red-500" />
                <span className="text-muted-foreground">Max Temperature</span>
              </div>
              <span className="font-mono">{formatTemperature(results.effects.fireball.temperature)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-3 h-3 text-blue-500" />
                <span className="text-muted-foreground">Airblast Radius</span>
              </div>
              <span className="font-mono">{formatDistance(results.effects.airblast.overpressureRadius * 1000)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-purple-500" />
                <span className="text-muted-foreground">Seismic Magnitude</span>
              </div>
              <span className="font-mono">{formatMagnitude(results.effects.seismic.magnitude)}</span>
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
                {formatNumber(results.casualties.estimated)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Affected Population</p>
              <p className="font-mono text-lg text-orange-600">
                {formatNumber(results.casualties.affectedPopulation)}
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

        {/* Detailed Effects (Collapsible) */}
        {showDetails && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Detailed Effects</h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>• Thermal radiation can cause severe burns up to {formatDistance(results.effects.thermal.radiationRadius * 1000)}</p>
                <p>• Shockwave effects felt up to {formatDistance(results.effects.airblast.shockwaveRadius * 1000)}</p>
                <p>• Seismic activity equivalent to magnitude {results.effects.seismic.magnitude} earthquake</p>
                <p>• Crater formation would displace {formatNumber(results.crater.diameter * results.crater.depth * Math.PI / 6)} cubic meters of material</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
