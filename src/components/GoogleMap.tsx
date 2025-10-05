"use client";

import { APIProvider, Map as GoogleMapComponent, Marker } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import { useMeteorStore } from "@/lib/store/meteorStore";
import { ImpactCoordinator } from "./effects/ImpactCoordinator";

export function GoogleMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { impactLocation, impactResults, isAnimating, setImpactLocation } =
    useMeteorStore();

  console.log("🗺️ GoogleMap component rendering");
  console.log("🔑 API Key configured:", !!apiKey);
  console.log("📍 Impact location:", impactLocation);
  console.log("📊 Has results:", !!impactResults);
  console.log("🎬 Is animating:", isAnimating);

  // Track container dimensions for canvas
  useEffect(() => {
    const updateDimensions = () => {
      const element = document.querySelector(".map-container");
      if (element) {
        const rect = element.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleMapClick = useCallback(
    (event: any) => {
      console.log("🖱️ Map clicked:", event);
      if (event.detail?.latLng) {
        const newLocation = {
          lat: event.detail.latLng.lat,
          lng: event.detail.latLng.lng,
        };
        console.log("📍 New location selected:", newLocation);
        setImpactLocation(newLocation);
      }
    },
    [setImpactLocation],
  );

  const handleMarkerDragEnd = useCallback(
    (event: any) => {
      console.log("🎯 Marker dragged:", event);
      if (event.detail?.latLng) {
        const newLocation = {
          lat: event.detail.latLng.lat,
          lng: event.detail.latLng.lng,
        };
        setImpactLocation(newLocation);
      }
    },
    [setImpactLocation],
  );

  if (!apiKey) {
    console.error("❌ No API key found");
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

  console.log("✅ API key found, rendering map");

  return (
    <div className="relative w-full h-full min-h-[400px] map-container">
      <APIProvider apiKey={apiKey} libraries={["geometry"]}>
        <GoogleMapComponent
          defaultCenter={impactLocation}
          defaultZoom={6}
          minZoom={1}
          maxZoom={18}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={true}
          gestureHandling="greedy"
          clickableIcons={false}
          onClick={handleMapClick}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {/* Marker */}
          <Marker
            position={impactLocation}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          />
        </GoogleMapComponent>
      </APIProvider>

      {/* Impact Visual Effects */}
      {impactResults && (
        <ImpactCoordinator
          results={impactResults}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}
      
      {/* Legend */}
      {impactResults && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-xs z-10">
          <h3 className="font-bold mb-2 text-sm">Impact Effects</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
              <span>
                Crater ({(impactResults.crater.diameter / 1000).toFixed(2)} km)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
              <span>
                Fireball ({impactResults.effects.fireball.radius.toFixed(2)} km)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
              <span>
                Thermal Radiation (
                {impactResults.effects.thermal.radiationRadius.toFixed(2)} km)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
              <span>
                Overpressure (
                {impactResults.effects.airblast.overpressureRadius.toFixed(2)}{" "}
                km)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa]"></div>
              <span>
                Shockwave (
                {impactResults.effects.airblast.shockwaveRadius.toFixed(2)} km)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
              <span>
                Seismic (
                {impactResults.effects.seismic.effectiveRadius.toFixed(2)} km)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
