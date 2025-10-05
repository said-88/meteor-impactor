'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useMeteorStore } from '@/lib/store/meteorStore';
import { ImpactCalculator } from '@/lib/physics/impactCalculator';
import type { ImpactResults } from '@/types/asteroid';

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
  const { isAnimating, parameters } = useMeteorStore();

  // Physics constants
  const GRAVITY = 9.81; // m/s²
  const AIR_RESISTANCE = 0.02;
  const PIXELS_PER_METER = useMemo(() => {
    // Scale factor: larger asteroids need more space
    const baseScale = Math.min(width, height) / 800;
    const energyScale = Math.log10(results.energy.megatonsTNT + 1) / 3;
    return baseScale * (1 + energyScale * 0.5);
  }, [width, height, results.energy.megatonsTNT]);

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

  // Draw meteor trail during entry
  const drawMeteorTrail = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    time: number
  ) => {
    if (time > 3) return;
    
    const progress = time / 3;
    const meteorY = centerY - (1 - progress) * height * 0.5;
    const trailLength = visualProps.atmosphericEntry.trailLength * PIXELS_PER_METER;
    
    // Draw meteor
    const gradient = ctx.createRadialGradient(centerX, meteorY, 0, centerX, meteorY, visualProps.meteorRadius * 2);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FF8C00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, meteorY, visualProps.meteorRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw trail
    const trailGradient = ctx.createLinearGradient(
      centerX, meteorY - trailLength,
      centerX, meteorY
    );
    trailGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    trailGradient.addColorStop(0.3, `rgba(255, 215, 0, ${0.6 * (1 - progress)})`);
    trailGradient.addColorStop(0.7, `rgba(255, 140, 0, ${0.8 * (1 - progress)})`);
    trailGradient.addColorStop(1, `rgba(255, 69, 0, ${(1 - progress)})`);
    
    ctx.strokeStyle = trailGradient;
    ctx.lineWidth = visualProps.meteorRadius * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, meteorY - trailLength);
    ctx.lineTo(centerX, meteorY);
    ctx.stroke();
  }, [height, visualProps, PIXELS_PER_METER]);

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
