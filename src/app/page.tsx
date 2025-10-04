'use client';

import { useState, useMemo } from 'react';
import { GoogleMap } from '@/components/GoogleMap';
import { ControlPanel } from '@/components/ControlPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { ImpactCalculator } from '@/lib/physics/impactCalculator';
import type { MeteorParameters, ImpactLocation, ImpactResults } from '@/types/asteroid';

export default function Home() {
  // Default impact location (New York area for demonstration)
  const [impactLocation, setImpactLocation] = useState<ImpactLocation>({
    lat: 40.7128,
    lng: -74.0060,
  });

  // Default meteor parameters
  const [parameters, setParameters] = useState<MeteorParameters>(
    ImpactCalculator.getDefaultParameters()
  );

  // Control panel for results visibility
  const [showResults, setShowResults] = useState(true);

  // Calculate impact results based on current parameters
  const impactResults: ImpactResults | null = useMemo(() => {
    if (!parameters) return null;
    return ImpactCalculator.calculateImpact(parameters, 100); // Default population density
  }, [parameters]);

  const handleParametersChange = (newParameters: MeteorParameters) => {
    setParameters(newParameters);
  };

  const handleLocationChange = (newLocation: ImpactLocation) => {
    setImpactLocation(newLocation);
  };

  const handleRandomize = () => {
    const randomParams: MeteorParameters = {
      diameter: Math.random() * 990 + 10, // 10-1000m
      velocity: Math.random() * 61 + 11, // 11-72 km/s
      angle: Math.random() * 90, // 0-90 degrees
      density: ImpactCalculator.getDensityForComposition(
        ['rocky', 'iron', 'icy'][Math.floor(Math.random() * 3)]
      ),
      composition: ['rocky', 'iron', 'icy'][Math.floor(Math.random() * 3)] as any,
    };
    setParameters(randomParams);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Meteor Impact Simulator
              </h1>
              <p className="text-muted-foreground mt-1">
                Explore the potential consequences of meteor impacts on Earth
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Based on real physics and scientific data</p>
              <p>Inspired by NASA NEO and USGS datasets</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Control Panel */}
          <div className="xl:col-span-1">
            <ControlPanel
              parameters={parameters}
              onParametersChange={handleParametersChange}
              onRandomize={handleRandomize}
            />
          </div>

          {/* Map View */}
          <div className="xl:col-span-2">
            <div className="bg-card rounded-lg border h-full overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Impact Visualization</h2>
                <p className="text-sm text-muted-foreground">
                  Click on the map to select impact location • Drag the marker to reposition
                </p>
              </div>
              <div className="h-[calc(100%-80px)]">
                <GoogleMap
                  impactLocation={impactLocation}
                  impactResults={impactResults}
                  onLocationChange={handleLocationChange}
                />
              </div>
            </div>
          </div>

          {/* Results Panel - Desktop: Right side, Mobile: Below */}
          <div className="xl:absolute xl:top-6 xl:right-4 xl:w-80">
            {impactResults && showResults && (
              <div className="relative">
                {/* Hide/Show Button */}
                <button
                  onClick={() => setShowResults(false)}
                  className="absolute -top-2 -right-2 z-30 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                  title="Hide Results Panel"
                >
                  ×
                </button>
                <ResultsPanel results={impactResults} onHide={() => setShowResults(false)} />
              </div>
            )}

            {/* Show Results Button (when hidden) */}
            {impactResults && !showResults && (
              <button
                onClick={() => setShowResults(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
                title="Show Results Panel"
              >
                📊 Show Results
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p>© 2025 Meteor Impact Simulator</p>
              <p>Educational tool for understanding meteor impact risks</p>
            </div>
            <div className="text-right">
              <p>Data sources: NASA NEO, USGS</p>
              <p>Physics models: Established impact scaling relationships</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
