"use client";

import { APIProvider, Map as GoogleMapComponent, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState, useRef } from "react";
import { useMeteorStore } from "@/lib/store/meteorStore";
import { ImpactCoordinator } from "./effects/ImpactCoordinator";
import { ProceduralCrater } from "./crater/ProceduralCrater";
import { generateAsteroidData } from "@/lib/asteroid/asteroid-data-generator";
import type { ImpactSite } from "@/lib/store/meteorStore";

export function GoogleMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const [markerPositions, setMarkerPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  const {
    impactLocation,
    impactResults,
    isAnimating,
    setImpactLocation,
    impactSites,
    activeImpactId,
    clearImpact,
    isLocked,
  } = useMeteorStore();

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

  // Update marker screen positions when map moves
  useEffect(() => {
    if (!mapRef.current) return;

    const updateMarkerPositions = () => {
      const map = mapRef.current;
      if (!map) return;

      // Create overlay once if it doesn't exist
      if (!overlayRef.current) {
        const overlay = new google.maps.OverlayView();
        overlay.draw = function() {};
        overlay.setMap(map);
        overlayRef.current = overlay;
      }

      const overlay = overlayRef.current;
      const projection = overlay.getProjection();
      
      if (!projection) {
        // Projection not ready yet, wait for it
        google.maps.event.addListenerOnce(overlay, 'projection_changed', updateMarkerPositions);
        return;
      }

      const newPositions = new Map<string, { x: number, y: number }>();

      // Helper function to convert lat/lng to pixel coordinates
      const getPixelPosition = (lat: number, lng: number) => {
        const point = projection.fromLatLngToContainerPixel(
          new google.maps.LatLng(lat, lng)
        );
        return point ? { x: point.x, y: point.y } : null;
      };

      // Add preview marker position
      const previewPos = getPixelPosition(impactLocation.lat, impactLocation.lng);
      if (previewPos) {
        newPositions.set('preview', previewPos);
        console.log('📍 Preview marker pixel position:', previewPos);
      }

      // Add launched impact site positions
      impactSites.forEach((site) => {
        const sitePos = getPixelPosition(site.location.lat, site.location.lng);
        if (sitePos) {
          newPositions.set(site.id, sitePos);
          console.log(`🎯 Impact site ${site.id} pixel position:`, sitePos);
        }
      });

      setMarkerPositions(newPositions);
      console.log('🗺️ All marker positions updated:', newPositions.size, 'markers');
    };

    const map = mapRef.current;
    const boundsListener = map.addListener('bounds_changed', updateMarkerPositions);
    const zoomListener = map.addListener('zoom_changed', updateMarkerPositions);
    
    updateMarkerPositions();

    return () => {
      if (boundsListener) google.maps.event.removeListener(boundsListener);
      if (zoomListener) google.maps.event.removeListener(zoomListener);
      // Don't remove overlay here - let it persist across re-renders
    };
  }, [impactLocation, impactSites, dimensions]);

  // Cleanup overlay only on component unmount
  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        try {
          overlayRef.current.setMap(null);
        } catch (e) {
          console.warn('Error cleaning up overlay:', e);
        }
        overlayRef.current = null;
      }
    };
  }, []);

  const handleMapClick = useCallback(
    (event: any) => {
      // Prevent map interactions when interface is locked
      if (isLocked) {
        console.log("🛑 Map click blocked - interface locked");
        return;
      }

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
    [setImpactLocation, isLocked],
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

  const onMapLoad = useCallback((event: any) => {
    if (event?.map) {
      mapRef.current = event.map;
    }
  }, []);

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
          onCameraChanged={onMapLoad}
          mapId="meteor-impact-map"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {/* Preview marker - only show when NOT animating or no active impact */}
          {!isAnimating && (
            <AdvancedMarker
              position={impactLocation}
              draggable={!isLocked}
              onDragEnd={handleMarkerDragEnd}
            >
              <div className="relative animate-pulse">
                <img
                  src="/asteroid-icon.svg"
                  alt="Asteroid impact location"
                  className="w-8 h-8 drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(255, 107, 0, 0.6))'
                  }}
                />
              </div>
            </AdvancedMarker>
          )}

          {/* Launched impact sites - permanent markers */}
          {impactSites.map((site) => (
            <AdvancedMarker
              key={site.id}
              position={site.location}
              onClick={() => clearImpact(site.id)}
            >
              <div className="relative cursor-pointer group">
                <img
                  src="/asteroid-icon.svg"
                  alt="Past impact site"
                  className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{
                    filter: 'grayscale(0.7) brightness(0.6) drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))'
                  }}
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to remove
                </div>
              </div>
            </AdvancedMarker>
          ))}
        </GoogleMapComponent>
      </APIProvider>

      {/* Active Impact Animation */}
      {isAnimating && activeImpactId && impactSites.find(site => site.id === activeImpactId) && (() => {
        const activeSite = impactSites.find(site => site.id === activeImpactId);
        const position = markerPositions.get(activeImpactId);
        console.log('🎬 Active animation for:', activeImpactId, 'at position:', position);
        console.log('📐 Canvas dimensions:', dimensions);
        if (activeSite && position) {
          return (
            <ImpactCoordinator
              results={activeSite.results}
              width={dimensions.width}
              height={dimensions.height}
              centerX={position.x}
              centerY={position.y}
            />
          );
        }
        return null;
      })()}

      {/* Procedural Crater Overlays for all launched sites */}
      {impactSites.map((site) => {
        const position = markerPositions.get(site.id);
        // Show crater only when NOT currently animating for this site
        if (!position || (isAnimating && site.id === activeImpactId)) return null;

        // Generate asteroid data for this impact site
        // For now using default parameters - in full implementation would use stored parameters
        const asteroidData = generateAsteroidData(
          100, // diameter - would come from original parameters
          15,  // velocity - would come from original parameters
          45,  // angle - would come from original parameters
          3000 // mass - would come from original parameters
        );

        return (
          <ProceduralCrater
            key={`crater-${site.id}`}
            results={site.results}
            asteroidData={asteroidData}
            position={position}
            mapWidth={dimensions.width}
            mapHeight={dimensions.height}
            showLabel={true}
            className="crater-overlay"
          />
        );
      })}
      
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
              <div className="w-3 h-3 rounded-full bg-[#1e40af]"></div>
              <span>
                Overpressure (
                {impactResults.effects.airblast.overpressureRadius.toFixed(2)}{" "}
                km)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1d4ed8]"></div>
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
