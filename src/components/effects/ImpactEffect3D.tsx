'use client';

import { Sphere, Trail } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useMeteorStore } from '@/lib/store/meteorStore';
import { ImpactCalculator } from '@/lib/physics/impactCalculator';
import type { ImpactResults } from '@/types/asteroid';

export function ImpactEffect3D({ results }: { results: ImpactResults }) {
  const meteorRef = useRef<THREE.Mesh>(null);
  const fireballRef = useRef<THREE.Mesh>(null);
  const craterRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const fireballMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { isAnimating, parameters } = useMeteorStore();

  // Calculate enhanced visual properties
  const visualProps = useMemo(() => ({
    intensity: Math.min(results.energy.megatonsTNT / 50, 3),
    atmosphericEntry: ImpactCalculator.calculateAtmosphericEntry(parameters),
    enhancedFireball: ImpactCalculator.calculateEnhancedFireball(results.energy.joules, parameters),
    impactPhases: ImpactCalculator.calculateImpactPhases(parameters, results.energy.joules),
    // Scale 3D objects based on asteroid size
    meteorSize: Math.max(parameters.diameter / 1000, 0.1), // Scale meteor size with asteroid diameter
    fireballSize: Math.min(results.energy.megatonsTNT / 10, 5), // Scale fireball with energy
    craterSize: Math.min(results.crater.diameter / 1000, 2), // Scale crater with calculated diameter
  }), [results.energy.megatonsTNT, parameters]);

  // Animation loop with multi-stage effects
  useFrame((state) => {
    if (!isAnimating) return;

    const time = state.clock.getElapsedTime();

    // Atmospheric entry phase (0-3 seconds)
    if (time < 3 && meteorRef.current) {
      const entryProgress = time / 3;
      const altitude = 10 * (1 - entryProgress); // Descending from 10 units high

      meteorRef.current.position.y = altitude;
      meteorRef.current.rotation.x += 0.1;
      meteorRef.current.rotation.z += 0.05;

      // Heating effect - color changes from cold to hot
      const heatIntensity = entryProgress;
      const meteorMaterial = meteorRef.current.material as THREE.MeshStandardMaterial;
      meteorMaterial.emissive.setHSL(0.1, 0.8, heatIntensity * 0.5);
    }

    // Impact explosion phase (5-6 seconds)
    if (time >= 5 && time < 6 && fireballRef.current && fireballMaterialRef.current) {
      const explosionProgress = (time - 5);
      const scale = 1 + explosionProgress * visualProps.intensity;

      fireballRef.current.scale.setScalar(scale);

      // Color animation through explosion phases
      const hue = (explosionProgress * 2) % 1; // Faster color cycling
      fireballMaterialRef.current.color.setHSL(hue, 0.9, 0.7);
      fireballMaterialRef.current.emissiveIntensity = 0.5 + explosionProgress * 0.3;
    }

    // Crater formation phase (6-10 seconds)
    if (time >= 6 && time < 10 && craterRef.current) {
      const craterProgress = (time - 6) / 4;
      const craterDepth = craterProgress * 2; // Excavate crater

      craterRef.current.position.y = -craterDepth;
      craterRef.current.scale.y = craterProgress;
    }
  });

  return (
    <group>
      {/* Meteor during atmospheric entry */}
      <Trail
        width={2}
        length={20}
        color={new THREE.Color(1, 0.5, 0)}
        attenuation={(t) => t * t}
      >
        <Sphere ref={meteorRef} args={[visualProps.meteorSize, 16, 16]} position={[0, 10, 0]}>
          <meshStandardMaterial
            color="#666666"
            roughness={0.8}
            metalness={0.2}
            emissive="#000000"
          />
        </Sphere>
      </Trail>

      {/* Enhanced fireball with multiple phases */}
      <Sphere ref={fireballRef} args={[visualProps.fireballSize, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          ref={fireballMaterialRef}
          color="#ff6600"
          roughness={0.1}
          metalness={0.0}
          emissive="#ff3300"
          emissiveIntensity={0.2}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Energy shockwave rings */}
      {[...Array(3)].map((_, i) => (
        <Sphere
          key={`shockwave-${i}`}
          args={[2 + i * 0.8, 20, 20]}
          position={[0, 0, 0]}
        >
          <meshBasicMaterial
            color={`hsl(${results.energy.megatonsTNT * 5}, 80%, ${60 - i * 15}%)`}
            transparent
            opacity={0.4 - i * 0.1}
            wireframe={i > 0}
          />
        </Sphere>
      ))}

      {/* Crater formation */}
      <Sphere
        ref={craterRef}
        args={[visualProps.intensity * 2, 24, 24]}
        position={[0, 0, 0]}
        rotation={[Math.PI, 0, 0]} // Flip upside down for crater
      >
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
        />
      </Sphere>

      {/* Fragment particles during entry */}
      {isAnimating && [...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 3 + Math.sin(Date.now() * 0.01 + i) * 0.5;

        return (
          <Sphere
            key={`fragment-${i}`}
            args={[0.1, 8, 8]}
            position={[
              Math.cos(angle) * radius,
              5 + Math.sin(Date.now() * 0.02 + i) * 2,
              Math.sin(angle) * radius
            ]}
          >
            <meshBasicMaterial
              color={`hsl(${200 + i * 20}, 70%, 60%)`}
              transparent
              opacity={0.7}
            />
          </Sphere>
        );
      })}

      {/* Plasma tendrils during explosion */}
      {isAnimating && [...Array(6)].map((_, i) => {
        const tendrilRef = useRef<THREE.Mesh>(null);

        useFrame((state) => {
          if (tendrilRef.current && state.clock.elapsedTime > 5) {
            const explosionTime = state.clock.elapsedTime - 5;
            if (explosionTime < 1) {
              const progress = explosionTime;
              const angle = (i / 6) * Math.PI * 2 + progress * 2;
              const length = progress * 3;

              tendrilRef.current.position.set(
                Math.cos(angle) * length,
                Math.sin(angle * 1.5) * length * 0.5,
                Math.sin(angle) * length
              );
              tendrilRef.current.scale.setScalar(1 - progress * 0.5);
            }
          }
        });

        return (
          <Sphere
            key={`plasma-${i}`}
            ref={tendrilRef}
            args={[0.2, 8, 8]}
            position={[0, 0, 0]}
          >
            <meshBasicMaterial
              color="#00FFFF"
              transparent
              opacity={0.8}
            />
          </Sphere>
        );
      })}
    </group>
  );
}
