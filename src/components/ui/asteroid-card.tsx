import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NASA_Asteroid } from "@/types/asteroid";

// Enhanced Color-coded threat levels - Improved contrast and logical progression
const threatColors = {
  safe: { bg: 'threat-safe', text: 'text-green-400', icon: '🛡️' },
  low: { bg: 'threat-low', text: 'text-emerald-400', icon: 'ℹ️' },
  medium: { bg: 'threat-medium', text: 'text-yellow-400', icon: '⚠️' },
  high: { bg: 'threat-high', text: 'text-orange-400', icon: '🚨' },
  extreme: { bg: 'threat-extreme', text: 'text-red-400', icon: '⚡' }
};

// Size category icons and descriptions
const sizeCategories = {
  small: { icon: '🏐', description: 'Small boulder' },
  medium: { icon: '🏠', description: 'House-sized' },
  large: { icon: '🏟️', description: 'Stadium-sized' },
  huge: { icon: '🏙️', description: 'City-sized' }
};

interface AsteroidCardProps {
  asteroid: NASA_Asteroid;
  onSelect: () => void;
  isSelected: boolean;
}

export function AsteroidCard({ asteroid, onSelect, isSelected }: AsteroidCardProps) {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              {asteroid.name}
              <span className="text-lg">{sizeCategories[asteroid.sizeCategory].icon}</span>
            </h3>
            <p className="text-sm text-muted-foreground">{asteroid.threatLevel.description}</p>
          </div>
          <Badge className={`${threatColors[asteroid.threatLevel.rating].bg} ${threatColors[asteroid.threatLevel.rating].text}`}>
            {threatColors[asteroid.threatLevel.rating].icon} {asteroid.threatLevel.rating}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Size:</span>
            <p className="font-medium">{sizeCategories[asteroid.sizeCategory].description}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Next Approach:</span>
            <p className="font-medium">{asteroid.orbit.nextApproach.description}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p>📅 Orbital period: {asteroid.orbit.orbitalPeriod.value.toFixed(1)} years</p>
          <p>🔭 Discovered: {asteroid.discovery.year} by {asteroid.discovery.discoverer}</p>
          <p className="italic">💡 {asteroid.discovery.funFact}</p>
        </div>

        <Button onClick={onSelect} className="w-full mt-3">
          Use This Asteroid
        </Button>
      </CardContent>
    </Card>
  );
}

interface AsteroidDetailsProps {
  asteroid: NASA_Asteroid;
}

export function AsteroidDetails({ asteroid }: AsteroidDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Quick Facts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl mb-1">{sizeCategories[asteroid.sizeCategory].icon}</div>
              <p className="text-sm text-muted-foreground">Size Category</p>
              <p className="font-semibold">{sizeCategories[asteroid.sizeCategory].description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl mb-1">{threatColors[asteroid.threatLevel.rating].icon}</div>
              <p className="text-sm text-muted-foreground">Threat Level</p>
              <p className="font-semibold">{asteroid.threatLevel.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Through Space */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🚀 Journey Through Space</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Orbital Period:</span>
            <span className="font-semibold">{asteroid.orbit.orbitalPeriod.value.toFixed(1)} years</span>
          </div>
          <div className="flex justify-between">
            <span>Earth Crossings:</span>
            <span className="font-semibold">{asteroid.orbit.earthCrossings} times/year</span>
          </div>
          <div className="flex justify-between">
            <span>Next Approach:</span>
            <span className="font-semibold">{asteroid.orbit.nextApproach.date}</span>
          </div>
          <div className="flex justify-between">
            <span>Distance:</span>
            <span className="font-semibold">{asteroid.orbit.nextApproach.distance.value.toFixed(1)} {asteroid.orbit.nextApproach.distance.unit}</span>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Story */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔭 Discovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Discovered:</strong> {asteroid.discovery.year} by {asteroid.discovery.discoverer}</p>
          <p><strong>Method:</strong> {asteroid.discovery.method.replace('-', ' ')}</p>
          <p className="text-sm text-muted-foreground italic">💡 {asteroid.discovery.funFact}</p>
        </CardContent>
      </Card>

      {/* Composition & Physics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚗️ Composition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Type:</strong> {asteroid.composition.type}</p>
          <p><strong>Density:</strong> {asteroid.composition.density} kg/m³</p>
          <p><strong>Strength:</strong> {asteroid.composition.strength}</p>
        </CardContent>
      </Card>
    </div>
  );
}
