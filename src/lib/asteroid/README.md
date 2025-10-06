# Procedural Asteroid System

A modular, physics-based procedural asteroid generation system that creates unique, realistic asteroid visualizations based on NASA data.

## 🌟 Overview

This system generates procedurally unique asteroids for each set of NASA parameters (diameter, velocity, angle, density). Each asteroid is:

- **Unique**: Different parameters = different asteroid appearance
- **Reproducible**: Same parameters = same asteroid every time
- **Realistic**: Based on actual asteroid composition statistics
- **Detailed**: Includes craters, surface texture, and material-specific characteristics

## 📁 Architecture

The system is divided into modular components:

```
src/lib/asteroid/
├── asteroid-data-generator.ts    # Generate asteroid characteristics
├── asteroid-shape-generator.ts   # Create procedural shapes & textures
└── README.md                     # This file
```

### Module 1: Data Generator (`asteroid-data-generator.ts`)

Generates asteroid characteristics based on physical parameters:

```typescript
interface AsteroidVisualData {
  // Physical properties
  diameter: number;
  mass: number;
  velocity: number;
  angle: number;
  composition: 'rocky' | 'metallic' | 'icy';
  
  // Visual properties (procedurally generated)
  seed: number;              // For reproducibility
  complexity: number;        // 0-1, based on size
  roughness: number;         // 0-1, surface irregularity
  vertexCount: number;       // Shape detail level
  
  // Color palette (composition-based)
  colors: {
    base: string;
    dark: string;
    bright: string;
    accent: string;
  };
  
  // Crater properties
  craterCount: number;
  craterSizes: number[];
  craterPositions: Array<{ angle: number; distance: number }>;
}
```

**Key Features:**
- Deterministic seed generation from parameters
- Composition determination (75% rocky, 15% metallic, 10% icy)
- Color palette generation based on composition
- Crater distribution calculation

### Module 2: Shape Generator (`asteroid-shape-generator.ts`)

Creates procedural shapes and renders them:

```typescript
interface AsteroidShape {
  vertices: Array<{ x: number; y: number; radius: number }>;
  baseRadius: number;
}
```

**Key Features:**
- Simplex noise for organic deformation
- Multi-octave noise for detail
- Composition-specific textures:
  - **Rocky**: Rough surface with small irregularities
  - **Metallic**: Reflective patches and smooth areas
  - **Icy**: Crystalline structures with sparkles
- Crater rendering with depth and highlights

## 🎨 How It Works

### 1. Data Generation

```typescript
import { generateAsteroidData } from '@/lib/asteroid/asteroid-data-generator';

const asteroidData = generateAsteroidData(
  diameter,    // meters
  velocity,    // km/s
  angle,       // degrees
  mass         // kg
);
```

### 2. Shape Generation

```typescript
import { generateAsteroidShape } from '@/lib/asteroid/asteroid-shape-generator';

const shape = generateAsteroidShape(asteroidData, baseRadius);
```

### 3. Rendering

```typescript
import { 
  drawAsteroidShape, 
  drawAsteroidDetails 
} from '@/lib/asteroid/asteroid-shape-generator';

// Draw base shape
drawAsteroidShape(ctx, shape, x, y, asteroidData, rotation);

// Draw surface details (craters, texture)
drawAsteroidDetails(ctx, shape, x, y, asteroidData, rotation);
```

## 🔬 Technical Details

### Composition Distribution

Based on real asteroid statistics:
- **75% Rocky** (C-type, S-type asteroids)
  - Brown/grey/dark red colors
  - High roughness (0.6-0.9)
  - Many small surface irregularities

- **15% Metallic** (M-type asteroids)
  - Grey/silver/blue-grey colors
  - Medium roughness (0.3-0.6)
  - Reflective patches

- **10% Icy** (Cometary objects)
  - Blue/white/cyan colors
  - Medium roughness (0.4-0.7)
  - Crystalline texture with sparkles

### Procedural Generation

**Simplex Noise:**
- Custom implementation for reproducible randomness
- 4 octaves for multi-scale detail
- Frequency and amplitude scaling for natural appearance

**Vertex Generation:**
- Vertex count scales with complexity (20-50 vertices)
- Noise-based deformation for irregular shape
- Smooth curve interpolation between vertices

**Crater Generation:**
- Count scales with size and complexity
- Randomized but reproducible positions
- Depth rendered with gradients and rim highlights

## 🚀 Integration

The system is integrated into `ImpactOverlay2D.tsx`:

```typescript
// Generate asteroid data from NASA parameters
const asteroidData = useMemo(() => {
  return generateAsteroidData(
    parameters.diameter,
    parameters.velocity,
    parameters.angle,
    parameters.density * Math.pow(parameters.diameter / 2, 3) * (4/3) * Math.PI
  );
}, [parameters.diameter, parameters.velocity, parameters.angle, parameters.density]);

// Reset shape cache when parameters change
useEffect(() => {
  asteroidShapeRef.current = null;
}, [asteroidData]);

// Draw in animation loop
const drawMeteorBody = useCallback((ctx, x, y, radius, colors, intensity, time) => {
  if (!asteroidShapeRef.current) {
    asteroidShapeRef.current = generateAsteroidShape(asteroidData, radius);
  }
  
  drawAsteroidShape(ctx, asteroidShapeRef.current, x, y, asteroidData, time * 2);
  drawAsteroidDetails(ctx, asteroidShapeRef.current, x, y, asteroidData, time * 2);
}, [asteroidData]);
```

## 🎯 Benefits

1. **Modular Design**: Easy to extend and maintain
2. **Performance**: Shape cached and reused during animation
3. **Realistic**: Based on actual asteroid physics and statistics
4. **Unique**: Every parameter combination creates different asteroid
5. **Reproducible**: Same parameters = same visual every time
6. **Scientific**: Uses NASA data for accurate representation

## 🔧 Customization

### Adding New Compositions

1. Add to composition type:
```typescript
type Composition = 'rocky' | 'metallic' | 'icy' | 'carbonaceous';
```

2. Update distribution in `determineComposition()`
3. Add color palette in `generateColorPalette()`
4. Add texture rendering in `drawAsteroidDetails()`

### Adjusting Visual Properties

Modify constants in `asteroid-data-generator.ts`:
- Complexity calculation
- Roughness ranges
- Vertex count formula
- Crater distribution

## 📊 Examples

### Small Rocky Asteroid (10m diameter)
- 25-30 vertices
- Dark brown/grey colors
- 5-10 small craters
- High roughness

### Large Metallic Asteroid (1000m diameter)
- 45-50 vertices
- Silver/blue-grey colors
- 20-30 craters
- Medium roughness
- Reflective patches

### Icy Comet (100m diameter)
- 35-40 vertices
- Blue/white colors
- 15-20 craters
- Crystalline sparkles
- Medium roughness

## 🐛 Troubleshooting

**Asteroid not updating:**
- Check if `asteroidShapeRef.current` is being reset in useEffect
- Verify parameter changes trigger useMemo recalculation

**Performance issues:**
- Reduce crater count for smaller asteroids
- Decrease vertex count
- Optimize texture rendering loops

**Visual artifacts:**
- Check canvas context state (save/restore)
- Verify gradient coordinates
- Check rotation calculations

## 📚 References

- NASA NEO Database
- Asteroid taxonomy and composition statistics
- Perlin/Simplex noise algorithms
- Canvas 2D rendering optimization techniques

## 🤝 Contributing

When adding features:
1. Keep modules independent
2. Document new parameters
3. Add TypeScript types
4. Test with various NASA parameters
5. Optimize for performance

---

**Created for Meteor Madness Impact Simulator**
*Bringing NASA data to life with procedural generation*
