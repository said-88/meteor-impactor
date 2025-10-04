'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, RotateCcw } from 'lucide-react';
import type { MeteorParameters } from '@/types/asteroid';
import { ImpactCalculator } from '@/lib/physics/impactCalculator';

interface ControlPanelProps {
  parameters: MeteorParameters;
  onParametersChange: (parameters: MeteorParameters) => void;
  onRandomize: () => void;
}

export function ControlPanel({ parameters, onParametersChange, onRandomize }: ControlPanelProps) {
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const updateParameter = <K extends keyof MeteorParameters>(
    key: K,
    value: MeteorParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  const getInfoText = (param: string) => {
    const info: Record<string, string> = {
      diameter: 'Meteor diameter affects mass and impact energy. Larger meteors create bigger craters and more destruction.',
      velocity: 'Impact velocity determines kinetic energy. Typical meteor velocities range from 11-72 km/s.',
      angle: 'Impact angle affects crater formation and ejecta patterns. 90° is straight down, 0° is grazing.',
      density: 'Material density affects mass for a given size. Iron meteors are denser than rocky ones.',
      composition: 'Different materials have different densities and fragmentation behaviors during impact.'
    };
    return info[param] || '';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          Meteor Parameters
          <Button variant="outline" size="sm" onClick={onRandomize}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Random
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diameter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="diameter" className="text-sm font-medium">
              Diameter: {parameters.diameter}m
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(showInfo === 'diameter' ? null : 'diameter')}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
          <Slider
            id="diameter"
            min={10}
            max={1000}
            step={10}
            value={[parameters.diameter]}
            onValueChange={([value]) => updateParameter('diameter', value)}
            className="w-full"
          />
          {showInfo === 'diameter' && (
            <p className="text-xs text-muted-foreground">{getInfoText('diameter')}</p>
          )}
        </div>

        {/* Velocity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="velocity" className="text-sm font-medium">
              Velocity: {parameters.velocity} km/s
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(showInfo === 'velocity' ? null : 'velocity')}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
          <Slider
            id="velocity"
            min={11}
            max={72}
            step={1}
            value={[parameters.velocity]}
            onValueChange={([value]) => updateParameter('velocity', value)}
            className="w-full"
          />
          {showInfo === 'velocity' && (
            <p className="text-xs text-muted-foreground">{getInfoText('velocity')}</p>
          )}
        </div>

        {/* Impact Angle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="angle" className="text-sm font-medium">
              Impact Angle: {parameters.angle}°
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(showInfo === 'angle' ? null : 'angle')}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
          <Slider
            id="angle"
            min={0}
            max={90}
            step={5}
            value={[parameters.angle]}
            onValueChange={([value]) => updateParameter('angle', value)}
            className="w-full"
          />
          {showInfo === 'angle' && (
            <p className="text-xs text-muted-foreground">{getInfoText('angle')}</p>
          )}
        </div>

        {/* Composition */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Composition</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(showInfo === 'composition' ? null : 'composition')}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
          <Select
            value={parameters.composition}
            onValueChange={(value: any) => updateParameter('composition', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rocky">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Rocky</Badge>
                  <span className="text-xs text-muted-foreground">3000 kg/m³</span>
                </div>
              </SelectItem>
              <SelectItem value="iron">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Iron</Badge>
                  <span className="text-xs text-muted-foreground">7800 kg/m³</span>
                </div>
              </SelectItem>
              <SelectItem value="icy">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Icy</Badge>
                  <span className="text-xs text-muted-foreground">1000 kg/m³</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {showInfo === 'composition' && (
            <p className="text-xs text-muted-foreground">{getInfoText('composition')}</p>
          )}
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onParametersChange(ImpactCalculator.getDefaultParameters())}
            >
              Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onParametersChange({
                diameter: 50,
                velocity: 20,
                angle: 45,
                density: 3000,
                composition: 'rocky'
              })}
            >
              Tunguska
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onParametersChange({
                diameter: 20,
                velocity: 18,
                angle: 20,
                density: 3300,
                composition: 'rocky'
              })}
            >
              Chelyabinsk
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onParametersChange({
                diameter: 10000,
                velocity: 20,
                angle: 45,
                density: 3000,
                composition: 'rocky'
              })}
            >
              Dinosaur
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
