'use client';

import { useCallback } from 'react';
import {
  APIProvider,
  Map,
  Marker
} from '@vis.gl/react-google-maps';
import type { ImpactLocation, ImpactResults } from '@/types/asteroid';

interface GoogleMapProps {
  impactLocation: ImpactLocation;
  impactResults: ImpactResults | null;
  onLocationChange: (location: ImpactLocation) => void;
}

export function GoogleMap({ impactLocation, impactResults, onLocationChange }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  console.log('🗺️ GoogleMap component rendering');
  console.log('🔑 API Key configured:', !!apiKey);
  console.log('📍 Impact location:', impactLocation);
  console.log('📊 Has results:', !!impactResults);

  const handleMapClick = useCallback((event: any) => {
    console.log('🖱️ Map clicked:', event);
    if (event.detail && event.detail.latLng) {
      const newLocation = {
        lat: event.detail.latLng.lat,
        lng: event.detail.latLng.lng,
      };
      console.log('📍 New location selected:', newLocation);
      onLocationChange(newLocation);
    }
  }, [onLocationChange]);

  const handleMarkerDragEnd = useCallback((event: any) => {
    console.log('🎯 Marker dragged:', event);
    if (event.detail && event.detail.latLng) {
      const newLocation = {
        lat: event.detail.latLng.lat,
        lng: event.detail.latLng.lng,
      };
      onLocationChange(newLocation);
    }
  }, [onLocationChange]);

  if (!apiKey) {
    console.error('❌ No API key found');
    return (
      <div className="relative w-full h-full min-h-[400px] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600">Google Maps API key required</p>
          <p className="text-xs text-gray-500 mt-1">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
          </p>
        </div>
      </div>
    );
  }

  console.log('✅ API key found, rendering map');

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <APIProvider apiKey={apiKey} libraries={['geometry']}>
        <div className="relative w-full h-full">
          <Map
            center={impactLocation}
            zoom={6}
            minZoom={1}
            maxZoom={20}
            mapTypeControl={true}
            streetViewControl={false}
            fullscreenControl={true}
            zoomControl={true}
            scrollwheel={true}
            gestureHandling={'auto'}
            disableDoubleClickZoom={false}
            onClick={handleMapClick}
            style={{
              width: '100%',
              height: '100%'
            }}
          />

          {/* Marker */}
          <Marker
            position={impactLocation}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          />


        </div>
      </APIProvider>

      {/* Legend */}
      {impactResults && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-xs z-10">
          <h3 className="font-bold mb-2 text-sm">Impact Effects</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
              <span>Crater ({(impactResults.crater.diameter / 1000).toFixed(2)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
              <span>Fireball ({impactResults.effects.fireball.radius.toFixed(2)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
              <span>Thermal Radiation ({impactResults.effects.thermal.radiationRadius.toFixed(2)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
              <span>Overpressure ({impactResults.effects.airblast.overpressureRadius.toFixed(2)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa]"></div>
              <span>Shockwave ({impactResults.effects.airblast.shockwaveRadius.toFixed(2)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
              <span>Seismic ({impactResults.effects.seismic.effectiveRadius.toFixed(2)} km)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
