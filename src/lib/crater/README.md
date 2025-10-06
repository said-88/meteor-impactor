# Procedural Crater System

A modular, physics-based procedural crater generation system that creates unique, realistic impact craters based on asteroid parameters and impact physics.

## 🌟 Overview

This system generates procedurally unique craters for each impact site, where the crater appearance and size respond directly to the asteroid parameters (diameter, velocity, angle, composition). Each crater is:

- **Physics-Based**: Size and shape determined by real impact physics
- **Unique**: Different asteroid parameters = different crater appearance
- **Reproducible**: Same parameters = same crater every time
- **Composition-Aware**: Visual style matches asteroid composition
- **Map-Friendly**: Scales properly with zoom and map dimensions

## 📁 Architecture

The system is divided into modular components:

```
src/lib/crater/
├── crater-data-generator.ts    # Generate crater characteristics
├── crater-shape-generator.ts   # Create procedural shapes & rendering
└── README.md                   # This file

src/components/crater/
└── ProceduralCrater.tsx        # React component for map integration
```

### Module 1: Data Generator (`crater-data-generator.ts`)

Generates crater characteristics based on impact physics:

```typescript
interface CraterVisualData {
  // Physical properties from impact
  diameter: number;      // meters
  depth: number;         // meters
  rimHeight: number;     // meters

  // Visual properties (procedurally generated)
  seed: number;          // For reproducibility
  complexity: number;    // 0-1 based on impact energy
  rimSegments: number;   // Number of rim detail segments
  innerRings: number;    // Concentric rings count

  // Ejecta pattern
  ejectaPattern: Array<{
    angle: number;
    distance: number;
    size: number;
    density: number;
  }>;

  // Color based on target material and asteroid composition
  colors: {
    floor: { center: string; mid: string; edge: string; };
    rim: { outer: string; inner: string; highlight: string; };
    ejecta: { primary: string; secondary: string; dust: string; };
    shadow: string;
  };

  // Shape properties
  irregularity: number;  // 0-1, how irregular the rim is
  centralUplift: number; // 0-1, height of central peak
  rayCount: number;      // Number of bright rays
}
```

**Key Features:**
- Physics-based depth and rim height calculations
- Composition-aware color palette generation
- Realistic ejecta pattern distribution
- Deterministic seed generation from multiple parameters

### Module 2: Shape Generator (`crater-shape-generator.ts`)

Creates procedural crater shapes and renders them:

```typescript
interface CraterShape {
  vertices: Array<{ x: number; y: number; radius: number; angle: number }>;
  baseRadius: number;
  rimPoints: Array<{ x: number; y: number; height: number }>;
}
```

**Key Features:**
- Custom noise implementation for organic irregularity
- Multi-octave noise for natural-looking deformation
- Composition-specific visual characteristics:
  - **Rocky**: Irregular rims, brown/earth tones
  - **Metallic**: More regular shapes, grey/silver colors
  - **Icy**: Bright rays, blue/white crystalline appearance
- Advanced Canvas rendering with multiple layers

## 🎨 Visual Features

### **1. Multi-Layer Rendering**
- **Crater Floor**: Complex radial gradients with depth
- **Inner Rings**: Concentric rings for complex craters
- **Rim Structure**: Irregular segments with noise deformation
- **Ejecta Pattern**: Realistic ballistic distribution of material
- **Bright Rays**: For icy compositions (like lunar craters)

### **2. Physics-Based Properties**
- **Depth**: Calculated from impact energy and material density
- **Rim Height**: Based on impact angle and composition
- **Ejecta Distribution**: Ballistic trajectories from impact
- **Central Uplift**: For high-energy impacts

### **3. Composition-Specific Styling**

#### **Rocky Craters**
- Brown/grey color palette
- High irregularity (0.6-0.9)
- Multiple rim segments
- Earth-like appearance

#### **Metallic Craters**
- Grey/silver color palette
- Medium irregularity (0.3-0.6)
- Reflective highlights
- More geometric appearance

#### **Icy Craters**
- Blue/white/cyan colors
- Medium irregularity (0.4-0.7)
- Bright rays extending outward
- Crystalline texture effects

## 🔬 Technical Implementation

### **Physics Calculations**

```typescript
// Realistic crater depth based on impact physics
export function calculateCraterDepth(
  asteroidDiameter: number,
  asteroidVelocity: number,
  asteroidDensity: number,
  targetDensity: number = 2500
): number {
  const energy = (1/2) * asteroidDensity * Math.pow(asteroidDiameter / 2, 3) * (4/3) * Math.PI * Math.pow(asteroidVelocity, 2);
  const depth = Math.pow(energy / targetDensity, 1/3) * 0.1;
  return Math.min(depth, asteroidDiameter * 0.3);
}
```

### **Procedural Generation**

```typescript
// Noise-based rim irregularity
export function generateCraterShape(craterData: CraterVisualData, baseRadius: number): CraterShape {
  const noise = new CraterNoise(craterData.seed);

  for (let i = 0; i < craterData.rimSegments; i++) {
    const angle = (i / craterData.rimSegments) * Math.PI * 2;

    // Multi-octave noise for natural deformation
    let radiusVariation = 0;
    for (let octave = 0; octave < 3; octave++) {
      const noiseValue = noise.noise2D(Math.cos(angle) * frequency, Math.sin(angle) * frequency);
      radiusVariation += noiseValue * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    // Apply composition-based irregularity
    radiusVariation *= craterData.irregularity;
  }
}
```

## 🚀 Integration

### **GoogleMap Component Integration**

```typescript
// Replace static SVG craters with procedural craters
{impactSites.map((site) => {
  const position = markerPositions.get(site.id);
  if (!position || (isAnimating && site.id === activeImpactId)) return null;

  // Generate asteroid data for visual consistency
  const asteroidData = generateAsteroidData(diameter, velocity, angle, mass);

  return (
    <ProceduralCrater
      key={`crater-${site.id}`}
      results={site.results}
      asteroidData={asteroidData}
      position={position}
      mapWidth={dimensions.width}
      mapHeight={dimensions.height}
      showLabel={true}
    />
  );
})}
```

### **Responsive Scaling**

```typescript
export function calculateCraterPixelRadius(
  craterData: CraterVisualData,
  mapWidth: number,
  mapHeight: number
): number {
  const baseRadius = craterData.diameter / 2;
  const baseScale = Math.min(mapWidth, mapHeight) / 800;
  const craterRadiusPixels = baseRadius * baseScale;

  // Limit maximum size to prevent map overflow
  const maxCraterSize = Math.min(mapWidth, mapHeight) * 0.15;
  const finalRadius = Math.min(craterRadiusPixels, maxCraterSize);

  return Math.max(finalRadius, 20); // Minimum visibility
}
```

## 🎯 Key Benefits

### **1. Physics-Based Scaling**
- **Small Asteroid (10m)**: Crater ~80px diameter
- **Medium Asteroid (100m)**: Crater ~300px diameter
- **Large Asteroid (1000m)**: Crater ~600px diameter
- **Responsive**: Adapts to map zoom and dimensions

### **2. Visual Consistency**
- Crater appearance matches asteroid composition
- Same parameters = same visual result
- Consistent with existing asteroid system

### **3. Performance Optimized**
- Canvas-based rendering (no WebGL complexity)
- Efficient noise algorithms
- Cached crater data during session

### **4. Realistic Physics**
- Depth calculation from impact energy
- Rim height based on material properties
- Ejecta distribution following ballistic trajectories

## 📊 Examples

### **Small Rocky Impact**
```typescript
// 10m rocky asteroid at 15 km/s
{
  diameter: 50,      // 50m crater
  complexity: 0.3,   // Low complexity
  rimSegments: 12,   // Simple rim
  colors: { floor: browns, rim: light browns, ejecta: earth tones }
}
```

### **Large Metallic Impact**
```typescript
// 1000m metallic asteroid at 25 km/s
{
  diameter: 5000,    // 5km crater
  complexity: 0.9,   // High complexity
  rimSegments: 28,   // Complex rim
  centralUplift: 0.2, // Central peak
  colors: { floor: greys, rim: silvers, ejecta: metallic }
}
```

### **Icy Comet Impact**
```typescript
// 100m icy comet at 30 km/s
{
  diameter: 300,     // 300m crater
  complexity: 0.6,   // Medium complexity
  rayCount: 5,       // Bright rays
  colors: { floor: blues, rim: ice blue, ejecta: crystalline }
}
```

## 🔧 Customization

### **Adding New Crater Types**

1. **New Composition**: Add to composition type in data generator
2. **Color Palette**: Define colors in `generateCraterColors()`
3. **Visual Properties**: Adjust irregularity, ray count, etc.
4. **Physics Properties**: Modify depth/rim calculations

### **Adjusting Visual Parameters**

```typescript
// In crater-data-generator.ts
export function calculateCraterDepth(asteroidDiameter, velocity, density) {
  // Modify the 0.1 and 0.3 constants to adjust depth scaling
  const depth = Math.pow(energy / targetDensity, 1/3) * 0.1; // Change 0.1
  return Math.min(depth, asteroidDiameter * 0.3); // Change 0.3
}
```

## 🐛 Troubleshooting

### **Crater Not Appearing**
- Check if `position` is valid in GoogleMap component
- Verify `ProceduralCrater` component is rendering
- Check canvas context creation

### **Wrong Size**
- Verify `calculateCraterPixelRadius` calculation
- Check map dimensions are being passed correctly
- Ensure PIXELS_PER_METER scaling is appropriate

### **Visual Artifacts**
- Check canvas save/restore state management
- Verify gradient coordinates are within canvas bounds
- Check noise function implementation

## 📚 References

- Impact crater formation physics
- Ballistic ejecta distribution models
- Lunar and terrestrial crater studies
- Canvas 2D rendering optimization

## 🤝 Integration Notes

- **Seamless Integration**: Works with existing GoogleMap component
- **No Breaking Changes**: Replaces static SVG with procedural Canvas
- **Performance**: Efficient rendering suitable for multiple craters
- **Responsive**: Adapts to different screen sizes and zoom levels

---

**Created for Meteor Madness Impact Simulator**
*Bringing realistic impact craters to life with procedural generation*
