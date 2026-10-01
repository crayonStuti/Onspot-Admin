"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MapPin,
  Search,
  Navigation,
  Check,
  Loader2,
  Crosshair,
  AlertCircle,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
    initGoogleMapsCallback?: () => void;
  }
}

export interface MapLocationPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  onSelectLocation: (lat: number, lng: number) => void;
}

export default function MapLocationPickerDialog({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  onSelectLocation,
}: MapLocationPickerDialogProps) {
  const [lat, setLat] = useState<number>(initialLat ?? 37.7749);
  const [lng, setLng] = useState<number>(initialLng ?? -122.4194);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.FIREBASE_WEB_API_KEY ||
    "";

  // Sync initial coordinates
  useEffect(() => {
    if (isOpen) {
      const validLat =
        typeof initialLat === "number" && !isNaN(initialLat)
          ? initialLat
          : 37.7749;
      const validLng =
        typeof initialLng === "number" && !isNaN(initialLng)
          ? initialLng
          : -122.4194;
      setLat(validLat);
      setLng(validLng);
      setSearchQuery("");
      setMapError(null);
    }
  }, [isOpen, initialLat, initialLng]);

  // Load Google Maps SDK
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    const initializeMap = () => {
      if (isCancelled || !mapContainerRef.current || !window.google?.maps) return;

      try {
        const centerPos = { lat, lng };

        // 1. Create Map Instance
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: centerPos,
          zoom: 14,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        mapInstanceRef.current = map;

        // 2. Create Draggable Marker
        const marker = new window.google.maps.Marker({
          position: centerPos,
          map,
          draggable: true,
          title: "Drag to set location",
          animation: window.google.maps.Animation.DROP,
        });
        markerInstanceRef.current = marker;

        // 3. Marker Drag Event
        marker.addListener("dragend", (e: any) => {
          if (e && e.latLng) {
            const newLat = Number(e.latLng.lat().toFixed(6));
            const newLng = Number(e.latLng.lng().toFixed(6));
            setLat(newLat);
            setLng(newLng);
          }
        });

        // 4. Map Click to Reposition Marker
        map.addListener("click", (e: any) => {
          if (e && e.latLng) {
            const newLat = Number(e.latLng.lat().toFixed(6));
            const newLng = Number(e.latLng.lng().toFixed(6));
            marker.setPosition({ lat: newLat, lng: newLng });
            setLat(newLat);
            setLng(newLng);
          }
        });

        // 5. Setup Google Places Autocomplete
        if (searchInputRef.current && window.google.maps.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              fields: ["geometry", "formatted_address", "name"],
            },
          );
          autocompleteRef.current = autocomplete;
          autocomplete.bindTo("bounds", map);

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              const newLat = Number(place.geometry.location.lat().toFixed(6));
              const newLng = Number(place.geometry.location.lng().toFixed(6));
              setLat(newLat);
              setLng(newLng);
              marker.setPosition({ lat: newLat, lng: newLng });
              map.setCenter({ lat: newLat, lng: newLng });
              map.setZoom(15);
              setSearchQuery(place.formatted_address || place.name || "");
            }
          });
        }

        setLoadingMap(false);
      } catch (err: any) {
        console.error("Failed to initialize Google Maps:", err);
        setMapError(err?.message || "Failed to load Google Maps");
        setLoadingMap(false);
      }
    };

    // If Google Maps is already loaded in window
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    // Check if script is already present
    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      setLoadingMap(true);
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!isCancelled) {
          initializeMap();
        }
      };
      script.onerror = () => {
        if (!isCancelled) {
          setMapError("Failed to load Google Maps script. Check your API key.");
          setLoadingMap(false);
        }
      };
      document.head.appendChild(script);
    } else {
      // Script already injected, wait for it
      const interval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(interval);
          if (!isCancelled) {
            initializeMap();
          }
        }
      }, 100);
      return () => {
        isCancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Update position manually via lat/lng
  const handleUpdateCoordinates = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    if (markerInstanceRef.current && mapInstanceRef.current && window.google?.maps) {
      const pos = new window.google.maps.LatLng(newLat, newLng);
      markerInstanceRef.current.setPosition(pos);
      mapInstanceRef.current.panTo(pos);
    }
  };

  // Search Address via Geocoder on form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: searchQuery.trim() },
      (results: any[], status: string) => {
        if (status === "OK" && results && results[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const newLat = Number(loc.lat().toFixed(6));
          const newLng = Number(loc.lng().toFixed(6));
          handleUpdateCoordinates(newLat, newLng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setZoom(15);
          }
        } else {
          alert(`Location not found: ${status}`);
        }
      },
    );
  };

  // "Use My Location" via navigator.geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        handleUpdateCoordinates(newLat, newLng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(15);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        alert(
          "Could not retrieve current location. Please check browser permissions.",
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleConfirm = () => {
    onSelectLocation(lat, lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fbfbf9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8f5ec] text-[#0E3E27] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Select Location on Google Map
              </h3>
              <p className="text-xs text-gray-500">
                Click on the map or drag the pin marker to select exact coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar with Google Places Autocomplete */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white relative z-20">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places, address or city with Google Places..."
                className="w-full h-10 pl-9 pr-4 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0E3E27] focus:outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="h-10 px-4 bg-[#0E3E27] hover:bg-[#155435] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              title="Use current location"
              className="h-10 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#0E3E27]" />
              <span className="hidden sm:inline">My Location</span>
            </button>
          </form>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 w-full relative min-h-[400px] bg-gray-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />

          {/* Loading Overlay */}
          {loadingMap && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#0E3E27]" />
              <span className="text-xs text-gray-600 font-medium">
                Loading Google Maps...
              </span>
            </div>
          )}

          {/* Map Error Banner */}
          {mapError && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center gap-3 z-10">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <p className="text-xs text-gray-700 max-w-md">{mapError}</p>
              <p className="text-[11px] text-gray-500">
                You can still manually enter the Latitude and Longitude below.
              </p>
            </div>
          )}

          {/* Helper Badge */}
          {!loadingMap && !mapError && (
            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-md border border-gray-200 text-[11px] text-gray-600 flex items-center gap-1.5 pointer-events-none">
              <Crosshair className="w-3.5 h-3.5 text-[#0E3E27]" />
              <span>Click map or drag pin</span>
            </div>
          )}
        </div>

        {/* Footer Coordinate Inputs & Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-[#fbfbf9] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) =>
                  handleUpdateCoordinates(Number(e.target.value), lng)
                }
                className="w-28 h-8 px-2.5 text-xs font-mono bg-white border border-gray-200 rounded-md focus:border-[#0E3E27] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) =>
                  handleUpdateCoordinates(lat, Number(e.target.value))
                }
                className="w-28 h-8 px-2.5 text-xs font-mono bg-white border border-gray-200 rounded-md focus:border-[#0E3E27] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-9 px-5 bg-[#0E3E27] hover:bg-[#155435] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Coordinates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
