'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrthographicCamera, Scene, WebGLRenderer, PlaneGeometry, MeshBasicMaterial, DoubleSide, TextureLoader, SpriteMaterial, Sprite } from 'three';
import { gsap } from 'gsap';
import { useMeteorStore } from '@/lib/store/meteorStore';
import { ImpactCalculator } from '@/lib/physics/impactCalculator';
import type { ImpactResults, MeteorParameters } from '@/types/asteroid';

/**
 * Advanced Impact Animation using Three.js 2D + GSAP + SVG
 * Provides professional-grade animations with precise timing and smooth effects
 */
/**
 * Enhanced 2D Impact Animation with proper scaling and neal.fun style visuals
 */

export function ImpactOverlay2D({
  results,
  width,
  height,
}: {
  results: ImpactResults;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    type: 'ejecta' | 'dust' | 'plasma';
  }>>([]);
  const { isAnimating, parameters } = useMeteorStore();

  // Calculate enhanced visual properties with proper scaling based on asteroid size
  const visualProps = useMemo(() => {
    // Base crater size on actual physics calculations
    const baseCraterRadius = results.crater.diameter / 2; // radius in meters
    const scaledCraterRadius = Math.min(baseCraterRadius / 100, 50) * Math.min(width, height) / 400;

    // Scale other effects based on asteroid size and energy
    const asteroidSize = parameters.diameter;
    const energyScale = Math.min(results.energy.megatonsTNT / 10, 5);

    return {
      craterRadius: Math.max(scaledCraterRadius, 20), // minimum 20px radius
      fireballRadius: results.effects.fireball.radius * energyScale,
      energyIntensity: Math.min(results.energy.megatonsTNT / 50, 1),
      temperature: results.effects.fireball.temperature,
      atmosphericEntry: ImpactCalculator.calculateAtmosphericEntry(parameters),
      ejectaPattern: ImpactCalculator.calculateEjectaPattern(parameters, results.energy.joules),
      enhancedFireball: ImpactCalculator.calculateEnhancedFireball(results.energy.joules, parameters),
      asteroidScale: Math.max(asteroidSize / 100, 0.5), // scale factor based on asteroid size
      impactPhases: ImpactCalculator.calculateImpactPhases(parameters, results.energy.joules),
    };
  }, [results, parameters, width, height]);

  const drawShockwave = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      const shockwaveRadius = Math.min(time * 100, props.fireballRadius * 200);

      if (shockwaveRadius > 0) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, shockwaveRadius);

        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * Math.max(0, 1 - time * 0.5)})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 100, ${0.4 * Math.max(0, 1 - time * 0.3)})`);
        gradient.addColorStop(0.7, `rgba(255, 100, 50, ${0.2 * Math.max(0, 1 - time * 0.2)})`);
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  const drawFireball = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      const fireballRadius = Math.min(30, props.energyIntensity * 50);

      if (time < 2) { // Show fireball for first 2 seconds
        const intensity = Math.max(0, 1 - time * 0.5);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, fireballRadius);

        gradient.addColorStop(0, `rgba(255, 255, 150, ${intensity})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 50, ${intensity * 0.8})`);
        gradient.addColorStop(0.7, `rgba(255, 100, 0, ${intensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, fireballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add some sparkle effects
        for (let i = 0; i < 10; i++) {
          const angle = (time * 2 + i) * Math.PI / 5;
          const distance = fireballRadius * (0.5 + Math.sin(time * 10 + i) * 0.3);
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          ctx.fillStyle = `rgba(255, 255, 200, ${intensity * 0.8})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    []
  );

  const drawThermalEffects = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      if (time > 1 && time < 5) { // Thermal effects after initial impact
        const thermalRadius = props.energyIntensity * 100;
        const intensity = Math.max(0, 0.5 - (time - 1) * 0.1);

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, thermalRadius);

        gradient.addColorStop(0, `rgba(255, 100, 50, ${intensity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(255, 50, 0, ${intensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, thermalRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  // Enhanced multi-stage drawing functions
  const drawMeteorTrail = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      if (time < 3) { // Show trail during atmospheric entry
        const trailLength = Math.min(time * 150, props.atmosphericEntry.trailLength * 20);
        const intensity = Math.max(0, 1 - time * 0.3);

        // Main trail
        const gradient = ctx.createLinearGradient(centerX, centerY - trailLength, centerX, centerY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.8})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 100, ${intensity * 0.6})`);
        gradient.addColorStop(0.7, `rgba(255, 100, 50, ${intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - trailLength);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();

        // Ionization effects
        for (let i = 0; i < 5; i++) {
          const y = centerY - (time * 50 + i * 20) % trailLength;
          const offsetX = Math.sin(time * 10 + i) * 3;

          ctx.fillStyle = `rgba(100, 200, 255, ${intensity * 0.4})`;
          ctx.beginPath();
          ctx.arc(centerX + offsetX, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    []
  );

  const drawFragmentation = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      if (time > 1.5 && time < 3) { // Fragmentation during entry
        const fragmentCount = 12;
        const intensity = Math.max(0, 1 - (time - 1.5) * 0.7);

        for (let i = 0; i < fragmentCount; i++) {
          const angle = (i / fragmentCount) * Math.PI * 2 + time * 2;
          const distance = (time - 1.5) * 80 + Math.random() * 30;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          // Fragment size based on material
          const size = 2 + Math.random() * 4;
          const alpha = intensity * (0.3 + Math.random() * 0.4);

          ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, ${50 + Math.random() * 50}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();

          // Fragment trails
          ctx.strokeStyle = `rgba(255, 150, 50, ${alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(angle) * 10, y - Math.sin(angle) * 10);
          ctx.stroke();
        }
      }
    },
    []
  );

  const drawEnhancedFireball = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      const fireballPhase = props.enhancedFireball.phases.find(phase => {
        const phaseStart = props.impactPhases.phases.find(p => p.name === 'impact_explosion')?.startTime || 5;
        return time >= phaseStart && time < phaseStart + phase.duration;
      });

      if (fireballPhase) {
        const phaseTime = time - (props.impactPhases.phases.find(p => p.name === 'impact_explosion')?.startTime || 5);
        const phaseProgress = Math.min(phaseTime / fireballPhase.duration, 1);

        // Neal.fun style fireball with intense white center - scaled by asteroid size and canvas
        const baseRadius = visualProps.asteroidScale * 15; // Scale with asteroid diameter
        const maxRadius = Math.min(baseRadius, 80); // Cap maximum size
        const currentRadius = maxRadius * phaseProgress;

        // Create multiple concentric rings like in neal.fun
        const ringCount = 8;
        for (let ring = 0; ring < ringCount; ring++) {
          const ringRadius = currentRadius * (1 - (ring / ringCount) * 0.9);
          const ringIntensity = Math.max(0, 1 - phaseProgress * 0.5) * (1 - ring * 0.12);

          if (ringRadius > 0) {
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ringRadius);

            // Neal.fun style colors - very bright white center fading to orange
            if (ring === 0) {
              // Innermost ring - almost pure white
              gradient.addColorStop(0, `rgba(255, 255, 255, ${ringIntensity})`);
              gradient.addColorStop(0.3, `rgba(255, 255, 220, ${ringIntensity * 0.9})`);
              gradient.addColorStop(0.6, `rgba(255, 240, 180, ${ringIntensity * 0.7})`);
            } else if (ring < 3) {
              // Inner rings - bright yellow/white
              gradient.addColorStop(0, `rgba(255, 255, ${200 + ring * 20}, ${ringIntensity})`);
              gradient.addColorStop(0.4, `rgba(255, ${220 + ring * 10}, ${100 + ring * 20}, ${ringIntensity * 0.8})`);
              gradient.addColorStop(0.7, `rgba(255, ${180 + ring * 15}, ${50 + ring * 30}, ${ringIntensity * 0.5})`);
            } else {
              // Outer rings - orange to red
              gradient.addColorStop(0, `rgba(255, ${150 + ring * 5}, ${ring * 20}, ${ringIntensity * 0.6})`);
              gradient.addColorStop(0.5, `rgba(255, ${100 + ring * 8}, ${ring * 15}, ${ringIntensity * 0.4})`);
              gradient.addColorStop(0.8, `rgba(200, ${50 + ring * 5}, ${ring * 10}, ${ringIntensity * 0.2})`);
            }
            gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Add the characteristic neal.fun style bright core
        if (currentRadius > 10) {
          const coreRadius = Math.min(currentRadius * 0.15, 20);
          const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);

          coreGradient.addColorStop(0, `rgba(255, 255, 255, ${1})`);
          coreGradient.addColorStop(0.5, `rgba(255, 255, 240, ${0.8})`);
          coreGradient.addColorStop(1, `rgba(255, 255, 200, ${0.4})`);

          ctx.fillStyle = coreGradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Add subtle plasma tendrils (fewer than before, more realistic)
        const tendrilCount = 6;
        for (let i = 0; i < tendrilCount; i++) {
          const angle = (i / tendrilCount) * Math.PI * 2 + time * 2;
          const tendrilLength = currentRadius * (0.9 + Math.sin(time * 6 + i) * 0.3);
          const endX = centerX + Math.cos(angle) * tendrilLength;
          const endY = centerY + Math.sin(angle) * tendrilLength;

          const tendrilGradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
          tendrilGradient.addColorStop(0, `rgba(255, 255, 220, ${0.6})`);
          tendrilGradient.addColorStop(0.7, `rgba(255, 150, 50, ${0.3})`);
          tendrilGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

          ctx.strokeStyle = tendrilGradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    },
    []
  );

  const drawEjectaCurtain = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      const craterPhase = props.impactPhases.phases.find(p => p.name === 'crater_formation');
      if (!craterPhase) return;

      const phaseStart = craterPhase.startTime;
      if (time < phaseStart || time > phaseStart + craterPhase.duration) return;

      const phaseTime = time - phaseStart;
      const progress = phaseTime / craterPhase.duration;

      // Draw ejecta curtain - scaled by asteroid size
      const curtainHeight = visualProps.asteroidScale * 20 * progress;
      const curtainWidth = visualProps.craterRadius * 2 * (1 + progress * 0.5);

      for (let y = 0; y < curtainHeight; y += 5) {
        const widthAtY = curtainWidth * (1 - y / curtainHeight);
        const alpha = (1 - progress) * (1 - y / curtainHeight) * 0.6;

        const gradient = ctx.createLinearGradient(
          centerX - widthAtY / 2, centerY - curtainHeight + y,
          centerX + widthAtY / 2, centerY - curtainHeight + y
        );

        gradient.addColorStop(0, `rgba(139, 69, 19, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(160, 82, 45, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(101, 67, 33, ${alpha})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - widthAtY / 2, centerY - curtainHeight + y, widthAtY, 3);
      }
    },
    []
  );

  const drawSeismicWaves = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      const seismicPhase = props.impactPhases.phases.find(p => p.name === 'crater_formation');
      if (!seismicPhase) return;

      const phaseStart = seismicPhase.startTime;
      if (time < phaseStart || time > phaseStart + 2) return;

      const phaseTime = time - phaseStart;
      const waveRadius = phaseTime * visualProps.asteroidScale * 40;

      if (waveRadius > 0 && waveRadius < 300) {
        // Multiple wave rings
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = waveRadius - ring * 20;
          const intensity = Math.max(0, 0.5 - phaseTime * 0.2) * (1 - ring * 0.3);

          if (ringRadius > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.4})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    },
    []
  );

  const drawDustCloud = useCallback(
    (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number, props: typeof visualProps) => {
      const dustPhase = props.impactPhases.phases.find(p => p.name === 'thermal_effects');
      if (!dustPhase) return;

      const phaseStart = dustPhase.startTime;
      if (time < phaseStart || time > phaseStart + dustPhase.duration) return;

      const phaseTime = time - phaseStart;
      const cloudRadius = visualProps.asteroidScale * 30 * (phaseTime * 0.5);
      const intensity = Math.max(0, 0.8 - phaseTime * 0.1);

      if (cloudRadius > 0) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cloudRadius);

        gradient.addColorStop(0, `rgba(139, 69, 19, ${intensity * 0.6})`);
        gradient.addColorStop(0.3, `rgba(160, 82, 45, ${intensity * 0.4})`);
        gradient.addColorStop(0.7, `rgba(101, 67, 33, ${intensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(101, 67, 33, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cloudRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add dust particles
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2 + time;
          const distance = cloudRadius * (0.5 + Math.random() * 0.5);
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          ctx.fillStyle = `rgba(139, 69, 19, ${intensity * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    []
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (!isAnimating) {
        // Static view - show completed crater
        gsap.set(svgRef.current, { opacity: 1 });
        gsap.set('.crater-main', { scale: 1 });
        gsap.set('.crater-inner', { scale: 1, opacity: 0.6 });
        gsap.set('.crater-rim', { scale: 1, opacity: 0.4 });
        gsap.set('.dust-cloud', { scale: 1, opacity: 1 });
        gsap.set('.shockwave-1', { scale: 1.5, opacity: 0.5 });
        gsap.set('.shockwave-2', { scale: 2.2, opacity: 0.3 });
        return;
      }

      // Multi-stage animated impact effect
      drawMeteorTrail(ctx, centerX, centerY, time, visualProps);
      drawFragmentation(ctx, centerX, centerY, time, visualProps);
      drawEnhancedFireball(ctx, centerX, centerY, time, visualProps);
      drawEjectaCurtain(ctx, centerX, centerY, time, visualProps);
      drawSeismicWaves(ctx, centerX, centerY, time, visualProps);
      drawDustCloud(ctx, centerX, centerY, time, visualProps);

      // Legacy effects for compatibility
      drawShockwave(ctx, centerX, centerY, time, visualProps);
      drawFireball(ctx, centerX, centerY, time, visualProps);
      drawThermalEffects(ctx, centerX, centerY, time, visualProps);
    },
    [
      isAnimating,
      width,
      height,
      visualProps,
      drawMeteorTrail,
      drawFragmentation,
      drawEnhancedFireball,
      drawEjectaCurtain,
      drawSeismicWaves,
      drawDustCloud,
      drawShockwave,
      drawFireball,
      drawThermalEffects
    ],
  );

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

      if (!isAnimating) {
        // Static view - show completed crater
        gsap.set(svg, { opacity: 1 });
        gsap.set('.crater-main', { scale: 1 });
        gsap.set('.crater-inner', { scale: 1, opacity: 0.6 });
        gsap.set('.crater-rim', { scale: 1, opacity: 0.4 });
        gsap.set('.dust-cloud', { scale: 1, opacity: 1 });
        gsap.set('.shockwave-1', { scale: 1.5, opacity: 0.5 });
        gsap.set('.shockwave-2', { scale: 2.2, opacity: 0.3 });
        return;
      }

      // SVG Crater Animation with GSAP - appears during crater formation (6-10 seconds)
      const craterPhase = visualProps.impactPhases.phases.find(p => p.name === 'crater_formation');
      if (craterPhase && elapsedTime >= craterPhase.startTime && elapsedTime < craterPhase.startTime + craterPhase.duration) {
        const phaseTime = elapsedTime - craterPhase.startTime;
        const progress = phaseTime / craterPhase.duration;

        gsap.set(svg, { opacity: 1 });

        // Scale crater based on formation progress
        const currentScale = progress;
        gsap.set('.crater-main', { scale: currentScale, transformOrigin: 'center' });
        gsap.set('.crater-inner', { scale: currentScale, opacity: progress * 0.6 });
        gsap.set('.crater-rim', { scale: 0.8 + currentScale * 0.2, opacity: progress * 0.4 });

        // Expand dust cloud and shockwaves during formation
        gsap.set('.dust-cloud', { scale: 0.5 + progress * 0.5, opacity: progress });
        gsap.set('.shockwave-1', { scale: 1 + progress * 0.5, opacity: progress * 0.5 });
        gsap.set('.shockwave-2', { scale: 1 + progress * 1.2, opacity: progress * 0.3 });
      } else if (craterPhase && elapsedTime >= craterPhase.startTime + craterPhase.duration) {
        // Keep crater visible after formation completes
        gsap.set(svg, { opacity: 1 });
        gsap.set('.crater-main', { scale: 1 });
        gsap.set('.crater-inner', { scale: 1, opacity: 0.6 });
        gsap.set('.crater-rim', { scale: 1, opacity: 0.4 });
        gsap.set('.dust-cloud', { scale: 1, opacity: 1 });
        gsap.set('.shockwave-1', { scale: 1.5, opacity: 0.5 });
        gsap.set('.shockwave-2', { scale: 2.2, opacity: 0.3 });
      }

      // Fade out SVG after all effects complete
      if (elapsedTime >= 12) {
        gsap.to(svg, {
          opacity: 0,
          duration: 1,
          ease: "power2.out"
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Kill any ongoing GSAP animations
      gsap.killTweensOf('.crater-main, .crater-inner, .crater-rim, .dust-cloud, .shockwave-1, .shockwave-2');
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
        style={{
          mixBlendMode: 'multiply',
          opacity: 0.8,
        }}
      />

      {/* SVG Crater Effect - appears after impact */}
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
        style={{
          opacity: 0,
          zIndex: 2,
        }}
      >
        <defs>
          {/* Crater gradient */}
          <radialGradient id="craterGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B4513" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#654321" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#2F1B14" stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </radialGradient>

          {/* Dust cloud gradient */}
          <radialGradient id="dustGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D2B48C" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#F4A460" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8B4513" stopOpacity="0.1" />
          </radialGradient>

          {/* Shockwave gradient */}
          <radialGradient id="shockwaveGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFA500" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FF6347" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#DC143C" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Main crater circle - scaled based on physics calculations */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={visualProps.craterRadius}
          fill="url(#craterGradient)"
          className="crater-main"
        />

        {/* Inner crater detail */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={visualProps.craterRadius * 0.7}
          fill="none"
          stroke="#2F1B14"
          strokeWidth="2"
          opacity="0.6"
          className="crater-inner"
        />

        {/* Crater rim elevation effect */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={visualProps.craterRadius * 1.1}
          fill="none"
          stroke="#8B4513"
          strokeWidth="3"
          opacity="0.4"
          className="crater-rim"
        />

        {/* Dust cloud around crater */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={visualProps.craterRadius * 2}
          fill="url(#dustGradient)"
          className="dust-cloud"
        />

        {/* Shockwave rings */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={visualProps.craterRadius * 1.5}
          fill="none"
          stroke="url(#shockwaveGradient)"
          strokeWidth="2"
          opacity="0.5"
          className="shockwave-1"
        />
        <circle
          cx={width / 2}
          cy={height / 2}
          r={visualProps.craterRadius * 2.2}
          fill="none"
          stroke="url(#shockwaveGradient)"
          strokeWidth="1"
          opacity="0.3"
          className="shockwave-2"
        />
      </svg>
    </>
  );
}
