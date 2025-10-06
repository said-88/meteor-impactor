'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useMeteorStore } from '@/lib/store/meteorStore';
import { ImpactCalculator } from '@/lib/physics/impactCalculator';
import type { ImpactResults } from '@/types/asteroid';
import { 
  generateAsteroidData, 
  type AsteroidVisualData 
} from '@/lib/asteroid/asteroid-data-generator';
import { 
  generateAsteroidShape, 
  drawAsteroidShape, 
  drawAsteroidDetails,
  type AsteroidShape 
} from '@/lib/asteroid/asteroid-shape-generator';

/**
 * Enhanced 2D Impact Animation with realistic physics-based particles
 * Completely scaled to asteroid size and map dimensions
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  mass: number;
  type: 'ejecta' | 'dust' | 'plasma' | 'fragment' | 'vapor';
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export function ImpactOverlay2D({
  results,
  width,
  height,
  centerX,
  centerY,
}: {
  results: ImpactResults;
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const asteroidDataRef = useRef<AsteroidVisualData | null>(null);
  const asteroidShapeRef = useRef<AsteroidShape | null>(null);
  const { isAnimating, parameters } = useMeteorStore();

  // Physics constants
  const GRAVITY = 9.81; // m/s²
  const AIR_RESISTANCE = 0.02;

  // FIXED: Scale based on map zoom level and asteroid size
  const PIXELS_PER_METER = useMemo(() => {
    // Base scale: use map dimensions but limit maximum size
    const baseScale = Math.min(width, height) / 800;

    // Energy scale: larger asteroids = larger visual representation
    const energyScale = Math.log10(results.energy.megatonsTNT + 1) / 3;

    // Calculate asteroid radius in pixels (limit maximum size)
    const asteroidRadiusPixels = (parameters.diameter / 2) * baseScale * (1 + energyScale * 0.5);

    // Limit maximum asteroid size to prevent map overflow
    const maxAsteroidSize = Math.min(width, height) * 0.15; // Max 15% of map size
    const finalAsteroidSize = Math.min(asteroidRadiusPixels, maxAsteroidSize);

    // Calculate pixels per meter based on final asteroid size
    return finalAsteroidSize / (parameters.diameter / 2);
  }, [width, height, results.energy.megatonsTNT, parameters.diameter]);

  // Generate procedural asteroid data based on NASA parameters
  const asteroidData = useMemo(() => {
    return generateAsteroidData(
      parameters.diameter,
      parameters.velocity,
      parameters.angle,
      parameters.density * Math.pow(parameters.diameter / 2, 3) * (4/3) * Math.PI
    );
  }, [parameters.diameter, parameters.velocity, parameters.angle, parameters.density]);

  // Reset asteroid shape when data changes
  useEffect(() => {
    asteroidShapeRef.current = null;
  }, [asteroidData]);

  // Calculate realistic visual properties based on physics
  const visualProps = useMemo(() => {
    const atmosphericEntry = ImpactCalculator.calculateAtmosphericEntry(parameters);
    const impactPhases = ImpactCalculator.calculateImpactPhases(parameters, results.energy.joules);
    const enhancedFireball = ImpactCalculator.calculateEnhancedFireball(results.energy.joules, parameters);
    const ejectaPattern = ImpactCalculator.calculateEjectaPattern(parameters, results.energy.joules);
    
    // Scale all visual elements to actual physics calculations
    const craterRadiusMeters = results.crater.diameter / 2;
    const craterRadiusPixels = craterRadiusMeters * PIXELS_PER_METER;
    
    // Fireball size in pixels (convert km to meters to pixels)
    const fireballRadiusMeters = enhancedFireball.maxRadius * 1000;
    const fireballRadiusPixels = fireballRadiusMeters * PIXELS_PER_METER;
    
    // Meteor size (actual asteroid diameter)
    const meteorRadiusPixels = (parameters.diameter / 2) * PIXELS_PER_METER;
    
    return {
      craterRadius: Math.max(craterRadiusPixels, 20),
      fireballRadius: Math.max(fireballRadiusPixels, 30),
      meteorRadius: Math.max(meteorRadiusPixels, 2),
      atmosphericEntry,
      impactPhases,
      enhancedFireball,
      ejectaPattern,
      energyIntensity: Math.min(results.energy.megatonsTNT / 50, 1),
      pixelsPerMeter: PIXELS_PER_METER,
    };
  }, [results, parameters, PIXELS_PER_METER]);

  // Initialize WebGL for shader-based effects
  const initWebGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return null;

    // Vertex shader for particles
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute float a_size;
      attribute vec4 a_color;
      
      uniform mat3 u_matrix;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = a_size;
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;

    // Fragment shader with glow effect
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(gl_PointCoord, center);
        
        // Smooth glow falloff
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha *= v_color.a;
        
        // Color based on temperature (hotter = whiter)
        vec3 finalColor = v_color.rgb;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    return gl;
  }, []);

  // Create particle based on physics
  const createParticle = useCallback((
    x: number,
    y: number,
    angle: number,
    speed: number,
    type: Particle['type'],
    mass: number = 1
  ): Particle => {
    const colors = {
      ejecta: '#8B4513',
      dust: '#D2B48C',
      plasma: '#FFD700',
      fragment: '#A9A9A9',
      vapor: '#FFA500',
    };

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: type === 'dust' ? 10 : type === 'ejecta' ? 5 : 3,
      size: type === 'ejecta' ? 3 + Math.random() * 4 : type === 'dust' ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
      mass,
      type,
      color: colors[type],
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    };
  }, []);

  // Update particle physics
  const updateParticle = useCallback((particle: Particle, deltaTime: number) => {
    // Apply gravity
    particle.vy += GRAVITY * PIXELS_PER_METER * deltaTime;
    
    // Apply air resistance
    const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
    const dragForce = AIR_RESISTANCE * speed ** 2;
    const dragX = (particle.vx / speed) * dragForce;
    const dragY = (particle.vy / speed) * dragForce;
    
    particle.vx -= dragX * deltaTime;
    particle.vy -= dragY * deltaTime;
    
    // Update position
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    
    // Update rotation
    particle.rotation += particle.rotationSpeed;
    
    // Update life
    particle.life -= deltaTime / particle.maxLife;
    particle.alpha = Math.max(0, particle.life);
    
    return particle.life > 0;
  }, [PIXELS_PER_METER]);

  // Generate impact particles based on physics
  const generateImpactParticles = useCallback((centerX: number, centerY: number, time: number) => {
    const phase = visualProps.impactPhases.phases.find(p => 
      time >= p.startTime && time < p.startTime + p.duration
    );

    if (!phase) return;

    if (phase.name === 'atmospheric_entry' && particlesRef.current.length < 100) {
      // Atmospheric friction particles
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = visualProps.meteorRadius * (1 + Math.random() * 2);
        particlesRef.current.push(createParticle(
          centerX + Math.cos(angle) * distance,
          centerY - visualProps.meteorRadius * 3 + Math.random() * 50,
          Math.PI / 2 + (Math.random() - 0.5) * 0.5,
          50 + Math.random() * 50,
          'plasma',
          0.1
        ));
      }
    }

    if (phase.name === 'impact_explosion' && time - phase.startTime < 0.5) {
      // Massive particle burst on impact
      const particleCount = Math.min(Math.floor(visualProps.energyIntensity * 500), 1000);
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 100 + Math.random() * 300;
        const distance = Math.random() * 10;
        
        particlesRef.current.push(createParticle(
          centerX + Math.cos(angle) * distance,
          centerY + Math.sin(angle) * distance,
          angle,
          speed,
          Math.random() > 0.5 ? 'plasma' : 'vapor',
          0.5
        ));
      }
    }

    if (phase.name === 'crater_formation') {
      // Ejecta curtain - realistic ballistic trajectories
      const phaseProgress = (time - phase.startTime) / phase.duration;
      if (particlesRef.current.length < 500 && Math.random() > 0.5) {
        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2;
          const ejectionAngle = -Math.PI / 4 - Math.random() * Math.PI / 4; // 45-90 degrees up
          const speed = 50 + Math.random() * 150;
          
          particlesRef.current.push(createParticle(
            centerX + Math.cos(angle) * visualProps.craterRadius,
            centerY + Math.sin(angle) * visualProps.craterRadius,
            angle + ejectionAngle,
            speed,
            'ejecta',
            1 + Math.random() * 5
          ));
        }
      }
    }

    if (phase.name === 'thermal_effects') {
      // Dust cloud particles
      if (particlesRef.current.length < 300 && Math.random() > 0.7) {
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = visualProps.craterRadius * (1 + Math.random());
          
          particlesRef.current.push(createParticle(
            centerX + Math.cos(angle) * distance,
            centerY + Math.sin(angle) * distance,
            angle,
            10 + Math.random() * 30,
            'dust',
            0.1
          ));
        }
      }
    }
  }, [visualProps, createParticle]);

  // Draw particles with effects
  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      // Glow effect for hot particles
      if (particle.type === 'plasma' || particle.type === 'vapor') {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 2);
        gradient.addColorStop(0, `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${particle.color}${Math.floor(particle.alpha * 128).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${particle.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Main particle
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Motion blur for fast particles
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
      if (speed > 50) {
        const blurLength = Math.min(speed / 10, 20);
        const angle = Math.atan2(particle.vy, particle.vx);
        
        ctx.globalAlpha = particle.alpha * 0.3;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.cos(angle) * blurLength, -Math.sin(angle) * blurLength);
        ctx.stroke();
      }
      
      ctx.restore();
    });
  }, []);

  // Enhanced meteor with realistic physics and visual effects
  const drawMeteorTrail = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    time: number
  ) => {
    if (time > 3) return;

    const progress = time / 3;
    const meteorY = centerY - (1 - progress) * height * 0.5;
    const velocity = visualProps.atmosphericEntry.entryVelocity / 1000; // Convert m/s to km/s
    const altitude = (1 - progress) * height * 0.5;

    // Calculate realistic visual properties based on physics
    const temperature = Math.min(velocity * 60, 3500); // Kelvin - increased for more dramatic effect
    const intensity = Math.min(velocity / 15, 1.2); // Visual intensity based on speed - increased sensitivity
    const fragmentation = Math.min(time * 1.5, 1); // Progressive fragmentation - slightly faster

    // Dynamic meteor size (increases as it heats up and fragments)
    const baseRadius = visualProps.meteorRadius;
    const heatedRadius = baseRadius * (1 + intensity * 0.6 + fragmentation * 0.4); // More dramatic size increase
    const plasmaRadius = heatedRadius * (1 + intensity * 2.5); // Larger plasma sheath

    // Color calculation based on temperature (blackbody radiation)
    const meteorColors = getMeteorColors(temperature, intensity);

    // Draw multiple layers for realistic meteor appearance

    // 1. Plasma sheath (outermost, hottest layer)
    if (intensity > 0.3) {
      const plasmaGradient = ctx.createRadialGradient(centerX, meteorY, 0, centerX, meteorY, plasmaRadius);
      plasmaGradient.addColorStop(0, meteorColors.plasmaCore);
      plasmaGradient.addColorStop(0.3, meteorColors.plasmaMid);
      plasmaGradient.addColorStop(0.7, meteorColors.plasmaOuter);
      plasmaGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = plasmaGradient;
      ctx.beginPath();
      ctx.arc(centerX, meteorY, plasmaRadius, 0, Math.PI * 2);
      ctx.fill();

      // Plasma spikes for high-speed meteors
      if (velocity > 30) {
        drawPlasmaSpikes(ctx, centerX, meteorY, plasmaRadius, velocity, time);
      }
    }

    // 2. Fragmentation layer (broken pieces)
    if (fragmentation > 0.1) {
      drawMeteorFragments(ctx, centerX, meteorY, heatedRadius, fragmentation, time, meteorColors);
    }

    // 3. Main meteor body with realistic texture
    drawMeteorBody(ctx, centerX, meteorY, heatedRadius, meteorColors, intensity, time);

    // 4. Ablation particles (small fragments burning up)
    if (intensity > 0.2) {
      drawAblationParticles(ctx, centerX, meteorY, heatedRadius, velocity, time);
    }

    // 5. Enhanced ionization trail
    drawIonizationTrail(ctx, centerX, meteorY, heatedRadius, velocity, progress, meteorColors);

    // 6. Shock wave effects for supersonic meteors
    if (velocity > 12) { // Speed of sound in km/s
      drawShockWaveEffects(ctx, centerX, meteorY, heatedRadius, velocity, time);
    }
  }, [height, visualProps]);

  // Calculate realistic meteor colors based on temperature and physics
  const getMeteorColors = useCallback((temperature: number, intensity: number) => {
    // Blackbody radiation color approximation
    let r, g, b;

    if (temperature < 1000) {
      // Cool meteor - dark red/brown
      r = Math.floor(139 + (temperature / 1000) * 116); // 139 -> 255
      g = Math.floor(69 + (temperature / 1000) * 66);   // 69 -> 135
      b = Math.floor(19 + (temperature / 1000) * 61);   // 19 -> 80
    } else if (temperature < 2000) {
      // Medium heat - orange/yellow
      const t = (temperature - 1000) / 1000;
      r = Math.floor(255 * (0.8 + t * 0.2));
      g = Math.floor(135 * (0.6 + t * 0.4));
      b = Math.floor(80 * (0.3 + t * 0.7));
    } else {
      // Very hot - white/blue-white
      const t = Math.min((temperature - 2000) / 1000, 1);
      r = Math.floor(255 * (0.9 + t * 0.1));
      g = Math.floor(255 * (0.8 + t * 0.2));
      b = Math.floor(255 * (0.7 + t * 0.3));
    }

    // Apply intensity multiplier
    r = Math.floor(r * (0.5 + intensity * 0.5));
    g = Math.floor(g * (0.5 + intensity * 0.5));
    b = Math.floor(b * (0.5 + intensity * 0.5));

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    const baseColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    return {
      body: baseColor,
      bright: `#${toHex(Math.min(255, r + 50))}${toHex(Math.min(255, g + 50))}${toHex(Math.min(255, b + 50))}`,
      dark: `#${toHex(Math.floor(r * 0.7))}${toHex(Math.floor(g * 0.7))}${toHex(Math.floor(b * 0.7))}`,
      plasmaCore: `rgba(255, 255, ${Math.floor(220 + intensity * 35)}, ${0.95 + intensity * 0.05})`,
      plasmaMid: `rgba(255, ${Math.floor(180 + intensity * 75)}, ${Math.floor(120 + intensity * 135)}, ${0.8 + intensity * 0.2})`,
      plasmaOuter: `rgba(255, ${Math.floor(120 + intensity * 135)}, ${Math.floor(180 + intensity * 75)}, ${0.5 + intensity * 0.5})`,
      trail: `rgba(${r}, ${g}, ${b}, ${0.8 * intensity})`
    };
  }, []);

  // Draw plasma spikes for high-speed meteors
  const drawPlasmaSpikes = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    velocity: number,
    time: number
  ) => {
    const spikeCount = Math.floor(velocity / 10) + 3;
    const spikeLength = radius * (0.5 + velocity / 50);

    ctx.save();
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 + time * 2;
      const spikeX = x + Math.cos(angle) * (radius + spikeLength);
      const spikeY = y + Math.sin(angle) * (radius + spikeLength);

      // Create gradient for each spike
      const spikeGradient = ctx.createLinearGradient(x, y, spikeX, spikeY);
      spikeGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8})`);
      spikeGradient.addColorStop(0.5, `rgba(255, 200, 100, ${0.6})`);
      spikeGradient.addColorStop(1, `rgba(255, 150, 50, ${0.2})`);

      ctx.strokeStyle = spikeGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(spikeX, spikeY);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  // Draw meteor fragments
  const drawMeteorFragments = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fragmentation: number,
    time: number,
    colors: any
  ) => {
    const fragmentCount = Math.floor(fragmentation * 8) + 2;

    for (let i = 0; i < fragmentCount; i++) {
      const fragmentAngle = (i / fragmentCount) * Math.PI * 2 + time * 0.5;
      const fragmentDistance = radius * (0.3 + fragmentation * 0.7);
      const fragmentX = x + Math.cos(fragmentAngle) * fragmentDistance;
      const fragmentY = y + Math.sin(fragmentAngle) * fragmentDistance;
      const fragmentSize = radius * (0.1 + fragmentation * 0.15) * (1 - i * 0.1);

      // Fragment trail
      const trailLength = fragmentSize * 3;
      const trailGradient = ctx.createLinearGradient(
        fragmentX - Math.cos(fragmentAngle) * trailLength,
        fragmentY - Math.sin(fragmentAngle) * trailLength,
        fragmentX,
        fragmentY
      );
      trailGradient.addColorStop(0, 'rgba(255, 100, 50, 0)');
      trailGradient.addColorStop(1, colors.bright);

      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = fragmentSize;
      ctx.beginPath();
      ctx.moveTo(fragmentX - Math.cos(fragmentAngle) * trailLength, fragmentY - Math.sin(fragmentAngle) * trailLength);
      ctx.lineTo(fragmentX, fragmentY);
      ctx.stroke();

      // Fragment body
      const fragmentGradient = ctx.createRadialGradient(fragmentX, fragmentY, 0, fragmentX, fragmentY, fragmentSize);
      fragmentGradient.addColorStop(0, colors.bright);
      fragmentGradient.addColorStop(0.7, colors.body);
      fragmentGradient.addColorStop(1, colors.dark);

      ctx.fillStyle = fragmentGradient;
      ctx.beginPath();
      ctx.arc(fragmentX, fragmentY, fragmentSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Draw main meteor body with PROCEDURAL texture based on NASA data
  const drawMeteorBody = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    colors: any,
    intensity: number,
    time: number
  ) => {
    // Generate or retrieve cached asteroid shape
    if (!asteroidShapeRef.current) {
      asteroidShapeRef.current = generateAsteroidShape(asteroidData, radius);
    }

    const rotation = time * 2;
    
    // Draw the procedural asteroid shape with its unique characteristics
    drawAsteroidShape(
      ctx,
      asteroidShapeRef.current,
      x,
      y,
      asteroidData,
      rotation
    );
    
    // Draw surface details (craters, texture based on composition)
    drawAsteroidDetails(
      ctx,
      asteroidShapeRef.current,
      x,
      y,
      asteroidData,
      rotation
    );
  }, [asteroidData]);

  // Draw ablation particles
  const drawAblationParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    velocity: number,
    time: number
  ) => {
    const particleCount = Math.floor(velocity / 5) + 3;

    for (let i = 0; i < particleCount; i++) {
      const particleAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3; // Spread behind meteor
      const particleDistance = radius * (1.5 + Math.random() * 2);
      const particleX = x + Math.cos(particleAngle) * particleDistance;
      const particleY = y + Math.sin(particleAngle) * particleDistance;
      const particleSize = Math.random() * 2 + 1;

      // Particle trail
      const trailLength = particleSize * 5;
      const trailGradient = ctx.createLinearGradient(
        particleX - Math.cos(particleAngle) * trailLength,
        particleY - Math.sin(particleAngle) * trailLength,
        particleX,
        particleY
      );
      trailGradient.addColorStop(0, 'rgba(255, 100, 50, 0)');
      trailGradient.addColorStop(1, 'rgba(255, 200, 100, 0.8)');

      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = particleSize;
      ctx.beginPath();
      ctx.moveTo(particleX - Math.cos(particleAngle) * trailLength, particleY - Math.sin(particleAngle) * trailLength);
      ctx.lineTo(particleX, particleY);
      ctx.stroke();

      // Particle
      ctx.fillStyle = 'rgba(255, 150, 50, 0.9)';
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Enhanced ionization trail
  const drawIonizationTrail = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    velocity: number,
    progress: number,
    colors: any
  ) => {
    const trailLength = radius * (10 + velocity * 2) * (1 - progress * 0.3);

    // Multiple trail segments for depth
    for (let segment = 0; segment < 5; segment++) {
      const segmentProgress = segment / 5;
      const segmentY = y + segmentProgress * trailLength;
      const segmentIntensity = (1 - segmentProgress) * (1 - progress * 0.5);

      if (segmentIntensity > 0.1) {
        const segmentGradient = ctx.createRadialGradient(x, segmentY, 0, x, segmentY, radius * (2 - segmentProgress));
        segmentGradient.addColorStop(0, `rgba(255, 255, 255, ${segmentIntensity})`);
        segmentGradient.addColorStop(0.3, `rgba(255, 200, 100, ${segmentIntensity * 0.8})`);
        segmentGradient.addColorStop(0.7, `rgba(255, 150, 50, ${segmentIntensity * 0.4})`);
        segmentGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

        ctx.fillStyle = segmentGradient;
        ctx.beginPath();
        ctx.arc(x, segmentY, radius * (2 - segmentProgress), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  // Shock wave effects for supersonic meteors
  const drawShockWaveEffects = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    velocity: number,
    time: number
  ) => {
    const shockRadius = radius * (3 + velocity / 10);
    const shockIntensity = Math.min(velocity / 20, 1);

    // Multiple concentric shock waves
    for (let wave = 0; wave < 3; wave++) {
      const waveRadius = shockRadius * (0.8 + wave * 0.2);
      const waveIntensity = shockIntensity * (1 - wave * 0.3) * (1 - time * 0.1);

      if (waveIntensity > 0.1) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${waveIntensity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.strokeStyle = `rgba(255, 200, 100, ${waveIntensity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, []);

  // Draw fireball with proper temperature colors
  const drawFireball = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    time: number
  ) => {
    const explosionPhase = visualProps.impactPhases.phases.find(p => p.name === 'impact_explosion');
    if (!explosionPhase) return;
    
    const phaseStart = explosionPhase.startTime;
    if (time < phaseStart || time > phaseStart + 3) return;
    
    const phaseTime = time - phaseStart;
    const progress = Math.min(phaseTime / 2, 1);
    const currentRadius = visualProps.fireballRadius * progress;
    
    // Multiple concentric rings for depth
    const ringCount = 8;
    for (let ring = 0; ring < ringCount; ring++) {
      const ringProgress = ring / ringCount;
      const ringRadius = currentRadius * (1 - ringProgress * 0.5);
      const intensity = (1 - progress * 0.3) * (1 - ringProgress);
      
      if (ringRadius > 0) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ringRadius);
        
        // Temperature-based colors (hotter = whiter)
        if (ring === 0) {
          gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
          gradient.addColorStop(0.3, `rgba(255, 255, 240, ${intensity * 0.9})`);
          gradient.addColorStop(0.6, `rgba(255, 240, 200, ${intensity * 0.7})`);
        } else if (ring < 3) {
          gradient.addColorStop(0, `rgba(255, 255, ${220 - ring * 20}, ${intensity})`);
          gradient.addColorStop(0.4, `rgba(255, ${230 - ring * 15}, ${100 + ring * 20}, ${intensity * 0.8})`);
          gradient.addColorStop(0.7, `rgba(255, ${200 - ring * 20}, ${50 + ring * 30}, ${intensity * 0.5})`);
        } else {
          gradient.addColorStop(0, `rgba(255, ${180 - ring * 10}, ${ring * 20}, ${intensity * 0.6})`);
          gradient.addColorStop(0.5, `rgba(255, ${140 - ring * 10}, ${ring * 15}, ${intensity * 0.4})`);
          gradient.addColorStop(0.8, `rgba(220, ${100 - ring * 5}, ${ring * 10}, ${intensity * 0.2})`);
        }
        gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Bright core
    const coreRadius = Math.min(currentRadius * 0.15, 20);
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.5, 'rgba(255, 255, 240, 0.8)');
    coreGradient.addColorStop(1, 'rgba(255, 255, 200, 0.4)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fill();
  }, [visualProps]);

  // Draw shockwave
  const drawShockwave = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    time: number
  ) => {
    const explosionPhase = visualProps.impactPhases.phases.find(p => p.name === 'impact_explosion');
    if (!explosionPhase) return;
    
    const phaseStart = explosionPhase.startTime;
    if (time < phaseStart || time > phaseStart + 5) return;
    
    const phaseTime = time - phaseStart;
    const shockwaveSpeed = 343 * PIXELS_PER_METER; // Speed of sound
    const radius = phaseTime * shockwaveSpeed;
    
    if (radius > 0 && radius < Math.max(width, height)) {
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = radius - ring * 30;
        const intensity = Math.max(0, 0.5 - phaseTime * 0.1) * (1 - ring * 0.3);
        
        if (ringRadius > 0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.4})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }, [visualProps, width, height, PIXELS_PER_METER]);

  // Main animation loop
  const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const impactCenterX = centerX ?? width / 2;
    const impactCenterY = centerY ?? height / 2;
    const deltaTime = 1 / 60; // 60 FPS

    // Debug log only once at the start
    if (time < 0.1) {
      console.log('🎨 Drawing impact at:', { impactCenterX, impactCenterY, width, height, centerX, centerY });
    }

    ctx.clearRect(0, 0, width, height);

    if (!isAnimating) {
      particlesRef.current = [];
      return;
    }

    // Draw effects in order
    drawMeteorTrail(ctx, impactCenterX, impactCenterY, time);
    drawFireball(ctx, impactCenterX, impactCenterY, time);
    drawShockwave(ctx, impactCenterX, impactCenterY, time);
    
    // Generate and update particles
    generateImpactParticles(impactCenterX, impactCenterY, time);
    particlesRef.current = particlesRef.current.filter(particle => updateParticle(particle, deltaTime));
    drawParticles(ctx);

  }, [isAnimating, width, height, centerX, centerY, drawMeteorTrail, drawFireball, drawShockwave, generateImpactParticles, updateParticle, drawParticles]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = Date.now();

    const animate = () => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      draw(ctx, elapsedTime);

      // SVG Crater Animation - show during crater formation phase
      const craterPhase = visualProps.impactPhases.phases.find(p => p.name === 'crater_formation');
      if (craterPhase && elapsedTime >= craterPhase.startTime) {
        const phaseTime = elapsedTime - craterPhase.startTime;
        const progress = Math.min(phaseTime / craterPhase.duration, 1);

        gsap.set(svg, { opacity: 1 });
        
        // Animate main crater formation
        gsap.set('.crater-main', { scale: progress, transformOrigin: 'center' });
        gsap.set('.crater-shadow', { scale: progress, opacity: progress * 0.9, transformOrigin: 'center' });
        
        // Animate rim details
        gsap.set('.crater-rim', { scale: progress, opacity: progress * 0.7, transformOrigin: 'center' });
        gsap.set('.crater-rim-outer', { scale: 0.95 + progress * 0.05, opacity: progress * 0.4, transformOrigin: 'center' });
        gsap.set('.crater-rim-glow', { scale: 0.9 + progress * 0.1, opacity: progress * 0.5, transformOrigin: 'center' });
        
        // Animate inner crater details
        gsap.set('.crater-inner', { scale: progress, opacity: progress * 0.6, transformOrigin: 'center' });
        gsap.set('.crater-inner-deep', { scale: progress, opacity: progress * 0.5, transformOrigin: 'center' });
        
        // Animate dust cloud expansion
        gsap.set('.dust-cloud', { scale: 0.3 + progress * 0.7, opacity: progress * 0.8, transformOrigin: 'center' });
        
        // Fade in crater label
        gsap.set('.crater-label', { opacity: Math.max(0, (progress - 0.5) * 2) });
      }

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
      gsap.killTweensOf([
        svg, 
        '.crater-main', 
        '.crater-shadow',
        '.crater-inner', 
        '.crater-inner-deep',
        '.crater-rim', 
        '.crater-rim-outer',
        '.crater-rim-glow',
        '.dust-cloud',
        '.crater-label'
      ]);
      gsap.set(svg, { opacity: 0 });
    };
  }, [isAnimating, draw, visualProps]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className='absolute inset-0 pointer-events-none'
        style={{ zIndex: 1 }}
      />

      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
        style={{ opacity: 0, zIndex: 2 }}
      >
        <defs>
          {/* Enhanced crater gradient with more depth */}
          <radialGradient id="craterGradient" cx="45%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#1a0f0a" stopOpacity="1" />
            <stop offset="20%" stopColor="#2d1b13" stopOpacity="1" />
            <stop offset="50%" stopColor="#4a2f1f" stopOpacity="1" />
            <stop offset="75%" stopColor="#5c3a26" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#6b4423" stopOpacity="0.9" />
          </radialGradient>
          
          {/* Inner shadow for depth */}
          <radialGradient id="craterShadow" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0f0805" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1a0f0a" stopOpacity="0" />
          </radialGradient>
          
          {/* Rim highlight */}
          <radialGradient id="rimHighlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B4513" stopOpacity="0" />
            <stop offset="70%" stopColor="#A0522D" stopOpacity="0.2" />
            <stop offset="90%" stopColor="#CD853F" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B7355" stopOpacity="0.3" />
          </radialGradient>

          {/* Dust cloud gradient */}
          <radialGradient id="dustGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D2B48C" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#CD853F" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#A0522D" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8B4513" stopOpacity="0.1" />
          </radialGradient>

          {/* Texture filter */}
          <filter id="craterTexture">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="2" />
            <feColorMatrix type="saturate" values="0.3" />
            <feBlend mode="multiply" in="SourceGraphic" />
          </filter>
        </defs>

        {/* Dust cloud (appears first) */}
        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius * 2.5}
          fill="url(#dustGradient)"
          className="dust-cloud"
        />

        {/* Outer rim glow */}
        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius * 1.15}
          fill="url(#rimHighlight)"
          className="crater-rim-glow"
        />

        {/* Main crater bowl */}
        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius}
          fill="url(#craterGradient)"
          filter="url(#craterTexture)"
          className="crater-main"
        />

        {/* Inner shadow for depth */}
        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius * 0.8}
          fill="url(#craterShadow)"
          className="crater-shadow"
        />

        {/* Rim detail rings */}
        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius}
          fill="none"
          stroke="#5c3a26"
          strokeWidth="2"
          opacity="0.7"
          className="crater-rim"
        />

        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius * 1.05}
          fill="none"
          stroke="#8B7355"
          strokeWidth="1.5"
          opacity="0.4"
          className="crater-rim-outer"
        />

        {/* Inner crater details */}
        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius * 0.65}
          fill="none"
          stroke="#0f0805"
          strokeWidth="1.5"
          opacity="0.6"
          className="crater-inner"
        />

        <circle
          cx={centerX ?? width / 2}
          cy={centerY ?? height / 2}
          r={visualProps.craterRadius * 0.4}
          fill="none"
          stroke="#1a0f0a"
          strokeWidth="1"
          opacity="0.5"
          className="crater-inner-deep"
        />

        {/* "CRATER" label like neal.fun */}
        <text
          x={centerX ?? width / 2}
          y={centerY ?? height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          letterSpacing="0.5"
          className="crater-label"
          style={{ 
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <tspan x={centerX ?? width / 2} dy="0">CRATER</tspan>
        </text>
      </svg>
    </>
  );
}
