"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Award,
  User as UserIcon,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  Radio,
  Loader2,
  AlertCircle,
  Compass,
  Car,
  Footprints,
  Bike,
  Bus,
  X,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  LocateFixed,
  CornerUpRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  UserItem,
  API_URL,
  getLiveMapUsers,
  LiveMapUsersParams,
  LiveMapCluster,
  LiveMapPoint,
  LiveMapSummary,
} from "@/lib/api";
import { StateItem } from "./AddUserModal";

declare global {
  interface Window {
    google?: any;
  }
}

// US State centroids for fallback plotting if needed
const STATE_CENTROIDS: Record<string, [number, number]> = {
  ALABAMA: [32.806671, -86.79113],
  AL: [32.806671, -86.79113],
  ALASKA: [61.370716, -152.404419],
  AK: [61.370716, -152.404419],
  ARIZONA: [33.729759, -111.431221],
  AZ: [33.729759, -111.431221],
  ARKANSAS: [34.969704, -92.373123],
  AR: [34.969704, -92.373123],
  CALIFORNIA: [36.116203, -119.681564],
  CA: [36.116203, -119.681564],
  COLORADO: [39.059811, -105.311104],
  CO: [39.059811, -105.311104],
  CONNECTICUT: [41.597782, -72.755371],
  CT: [41.597782, -72.755371],
  DELAWARE: [39.318523, -75.507141],
  DE: [39.318523, -75.507141],
  FLORIDA: [27.766279, -81.686783],
  FL: [27.766279, -81.686783],
  GEORGIA: [33.040619, -83.643074],
  GA: [33.040619, -83.643074],
  HAWAII: [21.094318, -157.498337],
  HI: [21.094318, -157.498337],
  IDAHO: [44.240459, -114.478828],
  ID: [44.240459, -114.478828],
  ILLINOIS: [40.349457, -88.986137],
  IL: [40.349457, -88.986137],
  INDIANA: [39.849426, -86.258278],
  IN: [39.849426, -86.258278],
  IOWA: [42.011539, -93.210526],
  IA: [42.011539, -93.210526],
  KANSAS: [38.5266, -96.726486],
  KS: [38.5266, -96.726486],
  KENTUCKY: [37.66814, -84.670067],
  KY: [37.66814, -84.670067],
  LOUISIANA: [31.169546, -91.867805],
  LA: [31.169546, -91.867805],
  MAINE: [44.693947, -69.381927],
  ME: [44.693947, -69.381927],
  MARYLAND: [39.063946, -76.802101],
  MD: [39.063946, -76.802101],
  MASSACHUSETTS: [42.230171, -71.530106],
  MA: [42.230171, -71.530106],
  MICHIGAN: [43.326618, -84.536095],
  MI: [43.326618, -84.536095],
  MINNESOTA: [45.694454, -93.900192],
  MN: [45.694454, -93.900192],
  MISSISSIPPI: [32.741646, -89.678696],
  MS: [32.741646, -89.678696],
  MISSOURI: [38.456085, -92.288368],
  MO: [38.456085, -92.288368],
  MONTANA: [46.921925, -110.454353],
  MT: [46.921925, -110.454353],
  NEBRASKA: [41.12537, -98.268082],
  NE: [41.12537, -98.268082],
  NEVADA: [38.313515, -117.055374],
  NV: [38.313515, -117.055374],
  NEW_HAMPSHIRE: [43.452492, -71.563896],
  NH: [43.452492, -71.563896],
  NEW_JERSEY: [40.298904, -74.521011],
  NJ: [40.298904, -74.521011],
  NEW_MEXICO: [34.840515, -106.248482],
  NM: [34.840515, -106.248482],
  NEW_YORK: [42.165726, -74.948051],
  NY: [42.165726, -74.948051],
  NORTH_CAROLINA: [35.630066, -79.806419],
  NC: [35.630066, -79.806419],
  NORTH_DAKOTA: [47.528912, -99.784012],
  ND: [47.528912, -99.784012],
  OHIO: [40.388783, -82.764915],
  OH: [40.388783, -82.764915],
  OKLAHOMA: [35.565342, -96.928917],
  OK: [35.565342, -96.928917],
  OREGON: [44.572021, -122.070938],
  OR: [44.572021, -122.070938],
  PENNSYLVANIA: [40.590752, -77.209755],
  PA: [40.590752, -77.209755],
  RHODE_ISLAND: [41.680893, -71.51178],
  RI: [41.680893, -71.51178],
  SOUTH_CAROLINA: [33.856892, -80.945007],
  SC: [33.856892, -80.945007],
  SOUTH_DAKOTA: [44.299782, -99.438828],
  SD: [44.299782, -99.438828],
  TENNESSEE: [35.747845, -86.692345],
  TN: [35.747845, -86.692345],
  TEXAS: [31.054487, -97.563461],
  TX: [31.054487, -97.563461],
  UTAH: [40.150032, -111.862434],
  UT: [40.150032, -111.862434],
  VERMONT: [44.045876, -72.710686],
  VT: [44.045876, -72.710686],
  VIRGINIA: [37.769337, -78.169968],
  VA: [37.769337, -78.169968],
  WASHINGTON: [47.400902, -121.490494],
  WA: [47.400902, -121.490494],
  WEST_VIRGINIA: [38.491226, -80.954453],
  WV: [38.491226, -80.954453],
  WISCONSIN: [44.268543, -89.616508],
  WI: [44.268543, -89.616508],
  WYOMING: [42.755966, -107.30249],
  WY: [42.755966, -107.30249],
};

function getDeterministicOffset(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.006;
  const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.006;
  return [latOffset, lngOffset];
}

export function resolveCoordinates(
  u: any,
  fallbackToState: boolean = false,
): [number, number] | null {
  // 1. Check u.location object (from live location tracking)
  const loc = u.location;
  if (
    loc &&
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number" &&
    !isNaN(loc.latitude) &&
    !isNaN(loc.longitude) &&
    (loc.latitude !== 0 || loc.longitude !== 0)
  ) {
    return [loc.latitude, loc.longitude];
  }

  // 2. Check direct latitude & longitude properties
  const directLat = Number(u.latitude ?? u.lat ?? u.profile?.latitude);
  const directLng = Number(u.longitude ?? u.lng ?? u.profile?.longitude);

  if (!isNaN(directLat) && !isNaN(directLng) && directLat !== 0 && directLng !== 0) {
    return [directLat, directLng];
  }

  if (!fallbackToState) return null;

  // 3. Fallback to State Centroid only if explicitly requested
  const rawState =
    (typeof u.profile?.state === "object"
      ? u.profile?.state?.state_name || u.profile?.state?.state_code
      : u.profile?.state) ||
    (typeof u.state === "object"
      ? u.state?.state_name || u.state?.state_code
      : u.state);

  const cleanState = String(rawState || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const centroid = STATE_CENTROIDS[cleanState];
  if (centroid) {
    const [dLat, dLng] = getDeterministicOffset(u.id || "user");
    return [centroid[0] + dLat, centroid[1] + dLng];
  }

  return null;
}

export function getClusterSvg(countText: string | number): {
  url: string;
  scaledSize: any;
  anchor: any;
} {
  const rawNum =
    typeof countText === "number"
      ? countText
      : parseInt(String(countText).replace(/[^0-9]/g, ""), 10) || 1;
  const displayStr = String(countText);

  let size = 42;
  let fontSize = 12;

  if (rawNum >= 1000) {
    size = 56;
    fontSize = 14;
  } else if (rawNum >= 100) {
    size = 50;
    fontSize = 13;
  } else if (rawNum >= 10) {
    size = 46;
    fontSize = 12;
  }

  const center = size / 2;
  const innerRadius = center - 6;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="c-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Halo ring -->
      <circle cx="${center}" cy="${center}" r="${center - 1}" fill="rgba(16, 185, 129, 0.22)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1.5" />
      <!-- Solid cluster circle -->
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="#1f3d2a" stroke="#10b981" stroke-width="2.5" filter="url(#c-shadow)" />
      <!-- Count number -->
      <text x="${center}" y="${center + fontSize / 3.2}" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle">${displayStr}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: window.google?.maps?.Size
      ? new window.google.maps.Size(size, size)
      : undefined,
    anchor: window.google?.maps?.Point
      ? new window.google.maps.Point(center, center)
      : undefined,
  };
}

export interface LiveMapUser {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  latitude: number;
  longitude: number;
  status?: string;
  role?: string;
  membership_tier?: string;
  profile_picture?: string | null;
  license_status?: string;
  [key: string]: any;
}

interface UsersMapProps {
  fallbackUsers: UserItem[];
  states?: StateItem[];
  mapSelectedState?: string;
  onMapStateChange?: (stateVal: string) => void;
  onClearFilterState?: () => void;
  isFiltering?: boolean;
  filterParams?: {
    search?: string;
    status?: string;
    plan_level?: string;
    state_name?: string;
    joined_at?: string;
  };
  selectedUser: UserItem | null;
  onSelectUser: (user: any | null) => void;
}

// Minimum zoom level required to trigger live map fetches (Backend clustering supports world zoom >= 2)
const MIN_FETCH_ZOOM = 2;

export default function UsersMap({
  fallbackUsers,
  states = [],
  mapSelectedState = "",
  onMapStateChange,
  onClearFilterState,
  isFiltering = false,
  filterParams,
  selectedUser,
  onSelectUser,
}: UsersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAppliedDefaultCenterRef = useRef(false);

  const filterParamsKey = useMemo(
    () => JSON.stringify(filterParams || {}),
    [filterParams],
  );
  const prevFilterKeyRef = useRef<string>(filterParamsKey);
  const shouldCenterOnFilteredUserRef = useRef<boolean>(true);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);
  const [zoomTooLow, setZoomTooLow] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [liveUsers, setLiveUsers] = useState<LiveMapUser[]>([]);
  const [liveClusters, setLiveClusters] = useState<LiveMapCluster[]>([]);
  const [mapSummary, setMapSummary] = useState<LiveMapSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [activeSelectedUser, setActiveSelectedUser] = useState<any | null>(null);
  const [activeSelectedCluster, setActiveSelectedCluster] = useState<LiveMapCluster | null>(null);

  // In-App Route Polylines & Endpoint Markers Ref
  const routePolylinesRef = useRef<any[]>([]);
  const navMarkersRef = useRef<any[]>([]);
  const navInfoWindowRef = useRef<any>(null);

  const [navState, setNavState] = useState<{
    active: boolean;
    targetUser: any | null;
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    travelMode: string;
    distance: string;
    duration: string;
    startAddress: string;
    endAddress: string;
    steps: Array<{ instruction: string; distance: string; duration: string }>;
    showSteps: boolean;
    calculating: boolean;
    error: string | null;
    permissionDenied: boolean;
  }>({
    active: false,
    targetUser: null,
    origin: null,
    destination: null,
    travelMode: "DRIVING",
    distance: "",
    duration: "",
    startAddress: "",
    endAddress: "",
    steps: [],
    showSteps: false,
    calculating: false,
    error: null,
    permissionDenied: false,
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Helper to fetch live map users from backend API with current bounding box + filters
  const fetchMapUsersForBounds = useCallback(
    async (bounds: any, zoomLevel: number) => {
      if (!bounds) return;

      // Protection: if zoom level is too far out (e.g. world level), skip fetching to prevent browser crash
      if (zoomLevel < MIN_FETCH_ZOOM) {
        setZoomTooLow(true);
        setLoadingPins(false);
        return;
      }
      setZoomTooLow(false);

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const minLat = Number(sw.lat().toFixed(4));
      const maxLat = Number(ne.lat().toFixed(4));
      const minLng = Number(sw.lng().toFixed(4));
      const maxLng = Number(ne.lng().toFixed(4));

      const apiParams: LiveMapUsersParams = {
        minLat,
        maxLat,
        minLng,
        maxLng,
        zoomLevel: Math.round(zoomLevel),
        cluster: true,
        clusterRadius: 50,
        search: filterParams?.search,
        status: filterParams?.status,
        plan_level: filterParams?.plan_level,
        state_name: filterParams?.state_name,
        joined_at: filterParams?.joined_at,
      };

      setLoadingPins(true);
      try {
        const res = await getLiveMapUsers(apiParams);

        // Store live clustering summary if provided by backend
        if (res && res.summary) {
          setMapSummary(res.summary);
        } else {
          setMapSummary(null);
        }

        const rawList = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.users)
              ? res.data.users
              : Array.isArray(res?.users)
                ? res.users
                : [];

        const clusters: LiveMapCluster[] = [];
        const points: LiveMapUser[] = [];

        rawList.forEach((item: any) => {
          if (!item) return;

          // Check if item is a cluster (type === 'cluster' or cluster_id present)
          if (item.type === "cluster" || item.cluster_id !== undefined) {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              clusters.push({
                type: "cluster",
                cluster_id: item.cluster_id,
                point_count: Number(item.point_count || 1),
                point_count_abbreviated:
                  item.point_count_abbreviated || item.point_count || 1,
                latitude: lat,
                longitude: lng,
                expansion_zoom: Number(item.expansion_zoom || Math.round(zoomLevel) + 2),
                bounds: item.bounds,
                users: Array.isArray(item.users) ? item.users : [],
              });
            }
          } else {
            // Individual user point
            const coords = resolveCoordinates(item, false);
            if (coords) {
              points.push({
                ...item,
                id: item.id || String(Math.random()),
                latitude: coords[0],
                longitude: coords[1],
              });
            }
          }
        });

        setLiveClusters(clusters);
        setLiveUsers(points);
      } catch (err: any) {
        console.warn("Live map API fallback to local users:", err);
        setMapSummary(null);
        setLiveClusters([]);
        // Fallback to plotting table users that have valid coordinates
        const fallbackList: LiveMapUser[] = fallbackUsers
          .map((u) => {
            const coords = resolveCoordinates(u, false);
            if (!coords) return null;
            return {
              ...u,
              latitude: coords[0],
              longitude: coords[1],
            };
          })
          .filter(Boolean) as LiveMapUser[];
        setLiveUsers(fallbackList);
      } finally {
        setLoadingPins(false);
      }
    },
    [fallbackUsers, filterParams],
  );

  // Initialize Google Maps SDK
  useEffect(() => {
    let isCancelled = false;

    const initializeGoogleMap = () => {
      if (isCancelled || !mapContainerRef.current || !window.google?.maps?.Map) return;

      try {
        // Initial center check: find first user from table with valid coordinates
        let defaultCenter = { lat: 39.8283, lng: -98.5795 };
        let defaultZoom = 4;

        const firstWithCoords = fallbackUsers.find((u) => {
          return resolveCoordinates(u, false) !== null;
        });

        if (firstWithCoords) {
          const coords = resolveCoordinates(firstWithCoords, false);
          if (coords) {
            defaultCenter = { lat: coords[0], lng: coords[1] };
            defaultZoom = 12;
            hasAppliedDefaultCenterRef.current = true;
            setActiveSelectedUser({
              ...firstWithCoords,
              latitude: coords[0],
              longitude: coords[1],
            });
          }
        }

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          minZoom: 3,
          maxZoom: 19,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "administrative.land_parcel",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);

        // Listen for bounds change on 'idle' event (debounced)
        map.addListener("idle", () => {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            const currentBounds = map.getBounds();
            const currentZoom = map.getZoom() || 4;
            fetchMapUsersForBounds(currentBounds, currentZoom);
          }, 350);
        });
      } catch (err: any) {
        console.error("Google Maps initialization error:", err);
        setMapError(err?.message || "Failed to initialize Google Maps");
      }
    };

    if (window.google?.maps?.Map) {
      initializeGoogleMap();
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      // Added &loading=async to satisfy Google Maps modern async loading requirement
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,routes&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!isCancelled) initializeGoogleMap();
      };
      script.onerror = () => {
        if (!isCancelled) {
          setMapError("Failed to load Google Maps SDK. Check your API key.");
        }
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => {
        if (!isCancelled) initializeGoogleMap();
      });
      pollInterval = setInterval(() => {
        if (window.google?.maps?.Map) {
          if (pollInterval) clearInterval(pollInterval);
          if (!isCancelled) initializeGoogleMap();
        }
      }, 100);
    }

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [apiKey, fallbackUsers, fetchMapUsersForBounds]);

  // When filter parameters change, arm the ref so the next fallbackUsers update centers the map
  useEffect(() => {
    if (filterParamsKey !== prevFilterKeyRef.current) {
      prevFilterKeyRef.current = filterParamsKey;
      shouldCenterOnFilteredUserRef.current = true;
    }
  }, [filterParamsKey]);

  // When table users load initially or update after applying filters,
  // pan to the first user with coords, or fallback to full US if none have coords
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !mapLoaded) {
      return;
    }

    if (shouldCenterOnFilteredUserRef.current) {
      const firstWithCoords = fallbackUsers.find((u) => {
        return resolveCoordinates(u, false) !== null;
      });

      if (firstWithCoords) {
        const coords = resolveCoordinates(firstWithCoords, false);
        if (coords) {
          shouldCenterOnFilteredUserRef.current = false;
          hasAppliedDefaultCenterRef.current = true;
          mapInstanceRef.current.panTo({ lat: coords[0], lng: coords[1] });
          mapInstanceRef.current.setZoom(12);
          setActiveSelectedUser({
            ...firstWithCoords,
            latitude: coords[0],
            longitude: coords[1],
          });
          return;
        }
      }

      // If fallbackUsers is populated but none have coordinates
      if (fallbackUsers.length > 0 && !firstWithCoords) {
        shouldCenterOnFilteredUserRef.current = false;
        hasAppliedDefaultCenterRef.current = true;
        mapInstanceRef.current.panTo({ lat: 39.8283, lng: -98.5795 });
        mapInstanceRef.current.setZoom(4);
        setActiveSelectedUser(null);
        return;
      }

      // If filter returned 0 users after initial load
      if (fallbackUsers.length === 0 && hasAppliedDefaultCenterRef.current) {
        shouldCenterOnFilteredUserRef.current = false;
        mapInstanceRef.current.panTo({ lat: 39.8283, lng: -98.5795 });
        mapInstanceRef.current.setZoom(4);
        setActiveSelectedUser(null);
      }
    }
  }, [fallbackUsers, mapLoaded]);

  // Refetch when filter parameters change
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      const bounds = mapInstanceRef.current.getBounds();
      const zoom = mapInstanceRef.current.getZoom() || 4;
      fetchMapUsersForBounds(bounds, zoom);
    }
  }, [filterParams, mapLoaded, fetchMapUsersForBounds]);

  // Sync markers whenever liveUsers or liveClusters change (diff in-place without drop animation to avoid double-bounce)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;

    // Custom pulsing green bubble marker SVG icon
    const greenBubbleIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="17" fill="rgba(16, 185, 129, 0.22)" />
          <circle cx="19" cy="19" r="12" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />
          <circle cx="26" cy="12" r="4" fill="#047857" stroke="#ffffff" stroke-width="1.5" />
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(38, 38),
      anchor: new window.google.maps.Point(19, 19),
    };

    const currentMarkerKeys = new Set<string>();

    // 1. Render / Update Clusters (backend-clustering-specification)
    liveClusters.forEach((c) => {
      const lat = Number(c.latitude);
      const lng = Number(c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const key = `cluster_${c.cluster_id}`;
      currentMarkerKeys.add(key);

      const clusterIcon = getClusterSvg(c.point_count_abbreviated || c.point_count);
      const existingMarker = markersMapRef.current.get(key);

      if (existingMarker) {
        const currentPos = existingMarker.getPosition();
        if (!currentPos || currentPos.lat() !== lat || currentPos.lng() !== lng) {
          existingMarker.setPosition({ lat, lng });
        }
        existingMarker.setIcon(clusterIcon);
        existingMarker.setTitle(
          `${c.point_count} active users in this cluster (Click to expand)`,
        );
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          icon: clusterIcon,
          title: `${c.point_count} active users in this cluster (Click to expand)`,
          zIndex: 100,
        });

        marker.addListener("click", () => {
          const currentZoom = map.getZoom() || 4;
          const targetZoom = c.expansion_zoom || Math.min(currentZoom + 2, 18);
          if (targetZoom > currentZoom && targetZoom <= 18) {
            map.setZoom(targetZoom);
            map.panTo({ lat: c.latitude, lng: c.longitude });
          } else {
            // Edge case 1: Multiple users at identical GPS coordinates at max zoom
            setActiveSelectedCluster(c);
            setActiveSelectedUser(null);
          }
        });

        markersMapRef.current.set(key, marker);
      }
    });

    // 2. Render / Update Individual User Points
    liveUsers.forEach((u) => {
      const lat = Number(u.latitude);
      const lng = Number(u.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const key = `point_${u.id}`;
      currentMarkerKeys.add(key);

      const existingMarker = markersMapRef.current.get(key);
      if (existingMarker) {
        // Update position in-place if changed
        const currentPos = existingMarker.getPosition();
        if (!currentPos || currentPos.lat() !== lat || currentPos.lng() !== lng) {
          existingMarker.setPosition({ lat, lng });
        }
      } else {
        // Create new marker without DROP animation (avoids bouncing twice)
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          icon: greenBubbleIcon,
          title: u.display_name || u.email,
          zIndex: 200,
        });

        marker.addListener("click", () => {
          setActiveSelectedCluster(null);
          setActiveSelectedUser(u);
          onSelectUser(u);
          map.panTo({ lat, lng });
          if (map.getZoom() < 10) map.setZoom(10);
        });

        markersMapRef.current.set(key, marker);
      }
    });

    // 3. Remove markers for clusters/users no longer in view
    markersMapRef.current.forEach((marker, key) => {
      if (!currentMarkerKeys.has(key)) {
        marker.setMap(null);
        markersMapRef.current.delete(key);
      }
    });
  }, [liveClusters, liveUsers, onSelectUser]);

  // React to external selectedUser (e.g. from table row click)
  useEffect(() => {
    if (!selectedUser || !mapInstanceRef.current || !window.google?.maps) return;

    const coords = resolveCoordinates(selectedUser, true) || [39.8283, -98.5795];
    const [lat, lng] = coords;
    const map = mapInstanceRef.current;

    map.panTo({ lat, lng });
    map.setZoom(12);

    // Sync selected user state for info card
    setActiveSelectedUser({
      ...selectedUser,
      latitude: lat,
      longitude: lng,
    });
  }, [selectedUser]);

  // Trigger Google Maps viewport recalculation when expanding/collapsing height
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const timer = setTimeout(() => {
      window.google.maps.event.trigger(mapInstanceRef.current, "resize");
    }, 320);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Center all plotted markers (both clusters and individual points)
  const handleCenterAll = () => {
    if (
      !mapInstanceRef.current ||
      (liveUsers.length === 0 && liveClusters.length === 0) ||
      !window.google?.maps
    )
      return;

    const bounds = new window.google.maps.LatLngBounds();
    liveClusters.forEach((c) => {
      bounds.extend({ lat: Number(c.latitude), lng: Number(c.longitude) });
    });
    liveUsers.forEach((u) => {
      bounds.extend({ lat: Number(u.latitude), lng: Number(u.longitude) });
    });

    mapInstanceRef.current.fitBounds(bounds, 30);
    setActiveSelectedUser(null);
    setActiveSelectedCluster(null);
    onSelectUser(null);
  };

  // State selection in map header: uses fitBounds if state.bounds exists, else pans to coordinates
  const handleMapStateSelect = (val: string) => {
    if (onMapStateChange) onMapStateChange(val);
    if (onClearFilterState) onClearFilterState();

    if (!val || !mapInstanceRef.current || !window.google?.maps) return;

    const stateObj = states.find(
      (s) =>
        s.state_code?.toUpperCase() === val.toUpperCase() ||
        s.state_name?.toUpperCase() === val.toUpperCase(),
    );

    if (!stateObj) return;

    // 1. If state has bounds, fitBounds gives the optimal frame
    if (stateObj.bounds && typeof stateObj.bounds === "object") {
      const b = stateObj.bounds;
      const minLat = Number(b.minLat);
      const maxLat = Number(b.maxLat);
      const minLng = Number(b.minLng);
      const maxLng = Number(b.maxLng);

      if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLng) && !isNaN(maxLng)) {
        const bounds = new window.google.maps.LatLngBounds(
          { lat: minLat, lng: minLng },
          { lat: maxLat, lng: maxLng },
        );
        mapInstanceRef.current.fitBounds(bounds, 30);
        return;
      }
    }

    // 2. Fallback to state's latitude & longitude
    const sLat = Number(stateObj.latitude);
    const sLng = Number(stateObj.longitude);
    if (!isNaN(sLat) && !isNaN(sLng) && sLat !== 0 && sLng !== 0) {
      mapInstanceRef.current.panTo({ lat: sLat, lng: sLng });
      mapInstanceRef.current.setZoom(7);
      return;
    }

    // 3. Fallback to centroid table
    const centroid =
      STATE_CENTROIDS[stateObj.state_code?.toUpperCase() || ""] ||
      STATE_CENTROIDS[
        stateObj.state_name?.toUpperCase()?.replace(/\s+/g, "_") || ""
      ];
    if (centroid) {
      mapInstanceRef.current.panTo({ lat: centroid[0], lng: centroid[1] });
      mapInstanceRef.current.setZoom(7);
    }
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedCoords(true);
    toast.success("Coordinates copied to clipboard");
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleExternalDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // User display name helper
  const getDisplayName = useCallback((u: any) => {
    if (!u) return "User";
    const fn = u.first_name && u.first_name !== "null" ? u.first_name : "";
    const ln = u.last_name && u.last_name !== "null" ? u.last_name : "";
    const name = `${fn} ${ln}`.trim();
    return name || u.display_name || u.email?.split("@")[0] || "User";
  }, []);

  // Clear any existing route polylines and navigation endpoint markers drawn on the map
  const clearRoutePolylines = useCallback(() => {
    if (routePolylinesRef.current && routePolylinesRef.current.length > 0) {
      routePolylinesRef.current.forEach((poly: any) => {
        try {
          poly?.setMap?.(null);
        } catch {}
      });
      routePolylinesRef.current = [];
    }
    if (navMarkersRef.current && navMarkersRef.current.length > 0) {
      navMarkersRef.current.forEach((marker: any) => {
        try {
          marker?.setMap?.(null);
        } catch {}
      });
      navMarkersRef.current = [];
    }
    if (navInfoWindowRef.current) {
      try {
        navInfoWindowRef.current.close();
      } catch {}
      navInfoWindowRef.current = null;
    }
  }, []);

  // Decode standard polyline geometry string (e.g. from Google Routes API or OSRM)
  const decodePolyline = useCallback(
    (encoded: string): { lat: number; lng: number }[] => {
      const points: { lat: number; lng: number }[] = [];
      let index = 0;
      const len = encoded.length;
      let lat = 0;
      let lng = 0;

      while (index < len) {
        let b: number;
        let shift = 0;
        let result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({
          lat: lat / 1e5,
          lng: lng / 1e5,
        });
      }

      return points;
    },
    [],
  );

  // Distinct Start (Your Location) and End (Destination) markers on route endpoints
  const createNavigationEndpointMarkers = useCallback(
    (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
      targetUser?: any,
    ) => {
      if (!mapInstanceRef.current || !window.google?.maps) return;

      const map = mapInstanceRef.current;
      const destDisplayName = targetUser ? getDisplayName(targetUser) : "Destination";

      // 1. Origin: Pulsing Blue GPS Beacon with "YOUR LOCATION" badge
      const originIcon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="60" viewBox="0 0 96 60">
            <defs>
              <filter id="shadow-origin" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <rect x="4" y="2" width="88" height="20" rx="10" fill="#2563eb" filter="url(#shadow-origin)"/>
            <text x="48" y="16" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="800" text-anchor="middle" letter-spacing="0.5">YOUR LOCATION</text>
            <polygon points="44,22 52,22 48,26" fill="#2563eb" />
            <circle cx="48" cy="42" r="16" fill="rgba(37, 99, 235, 0.25)" />
            <circle cx="48" cy="42" r="9" fill="#2563eb" stroke="#ffffff" stroke-width="2.5" />
            <circle cx="48" cy="42" r="3.5" fill="#ffffff" />
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(96, 60),
        anchor: new window.google.maps.Point(48, 42),
      };

      const startMarker = new window.google.maps.Marker({
        position: { lat: origin.lat, lng: origin.lng },
        map,
        icon: originIcon,
        title: "Your Location (Start)",
        zIndex: 999,
      });

      // 2. Destination: High-visibility Red Pin with "DESTINATION" badge
      const destIcon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="72" viewBox="0 0 96 72">
            <defs>
              <filter id="shadow-dest" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.35"/>
              </filter>
            </defs>
            <rect x="4" y="2" width="88" height="20" rx="10" fill="#dc2626" filter="url(#shadow-dest)"/>
            <text x="48" y="16" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="800" text-anchor="middle" letter-spacing="0.5">DESTINATION</text>
            <polygon points="44,22 52,22 48,26" fill="#dc2626" />
            <path d="M48 28 C40 28 34 34.5 34 42.5 C34 54 48 70 48 70 C48 70 62 54 62 42.5 C62 34.5 56 28 48 28 Z" fill="#dc2626" stroke="#ffffff" stroke-width="2" filter="url(#shadow-dest)"/>
            <circle cx="48" cy="42" r="6" fill="#ffffff"/>
            <circle cx="48" cy="42" r="3" fill="#dc2626"/>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(96, 72),
        anchor: new window.google.maps.Point(48, 70),
      };

      const endMarker = new window.google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map,
        icon: destIcon,
        title: `Destination: ${destDisplayName}`,
        zIndex: 1000,
      });

      // Interactive InfoWindow on click
      const infoWindow = new window.google.maps.InfoWindow();
      navInfoWindowRef.current = infoWindow;

      startMarker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:4px 6px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;">📍 Your Location</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px;">Route Origin (Start Point)</div>
          </div>
        `);
        infoWindow.open(map, startMarker);
      });

      endMarker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:4px 6px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;">🎯 Destination</div>
            <div style="font-size:12px;font-weight:600;color:#111827;margin-top:2px;">${destDisplayName}</div>
          </div>
        `);
        infoWindow.open(map, endMarker);
      });

      navMarkersRef.current = [startMarker, endMarker];
    },
    [getDisplayName],
  );

  // Calculate in-app route using Google Routes API (Route.computeRoutes) with server-proxy fallback
  const calculateRoute = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
      travelMode: string = "DRIVING",
      targetUser?: any,
    ) => {
      if (!mapInstanceRef.current || !window.google?.maps) return;

      // 1. Clear any previously drawn polylines and endpoint markers
      clearRoutePolylines();

      setNavState((prev) => ({
        ...prev,
        calculating: true,
        error: null,
        travelMode,
      }));

      // Mode mapping for Google Routes API
      const modeMap: Record<string, string> = {
        DRIVING: "DRIVE",
        WALKING: "WALK",
        BICYCLING: "BICYCLE",
        TRANSIT: "TRANSIT",
      };
      const routesTravelMode = modeMap[travelMode.toUpperCase()] || "DRIVE";

      let routeCalculated = false;

      // 2. Try Route.computeRoutes() from google.maps.importLibrary("routes")
      try {
        if (typeof window.google?.maps?.importLibrary === "function") {
          const { Route } =
            (await window.google.maps.importLibrary("routes")) || {};
          if (Route && typeof Route.computeRoutes === "function") {
            const request: any = {
              origin: { lat: origin.lat, lng: origin.lng },
              destination: { lat: destination.lat, lng: destination.lng },
              travelMode: routesTravelMode,
              fields: [
                "path",
                "viewport",
                "distanceMeters",
                "durationMillis",
                "legs",
              ],
            };

            const response = await Route.computeRoutes(request);
            if (response && response.routes && response.routes.length > 0) {
              const route = response.routes[0];

              // Draw returned route using route.createPolylines()
              if (typeof route.createPolylines === "function") {
                const polylines = route.createPolylines({
                  polylineOptions: {
                    strokeColor: "#1f3d2a",
                    strokeWeight: 6,
                    strokeOpacity: 0.85,
                  },
                });
                polylines.forEach((poly: any) =>
                  poly.setMap(mapInstanceRef.current),
                );
                routePolylinesRef.current = polylines;
              } else if (route.path && Array.isArray(route.path)) {
                const poly = new window.google.maps.Polyline({
                  path: route.path,
                  strokeColor: "#1f3d2a",
                  strokeWeight: 6,
                  strokeOpacity: 0.85,
                  map: mapInstanceRef.current,
                });
                routePolylinesRef.current = [poly];
              }

              // Create Endpoint Markers (Origin: Blue GPS beacon, Destination: Red Map Pin)
              createNavigationEndpointMarkers(origin, destination, targetUser);

              // Fit map bounds to route viewport or path + endpoints
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend(origin);
              bounds.extend(destination);
              if (route.viewport) {
                try {
                  bounds.union(route.viewport);
                } catch {
                  if (route.path && Array.isArray(route.path)) {
                    route.path.forEach((pt: any) => bounds.extend(pt));
                  }
                }
              } else if (route.path && route.path.length > 0) {
                route.path.forEach((pt: any) => bounds.extend(pt));
              }
              mapInstanceRef.current.fitBounds(bounds, 50);

              const distMiles = (
                (route.distanceMeters || 0) / 1609.34
              ).toFixed(1);
              const totalSec = Math.round(
                Number(route.durationMillis || 0) / 1000,
              );
              const totalMins = Math.max(1, Math.round(totalSec / 60));
              const hrs = Math.floor(totalMins / 60);
              const mins = totalMins % 60;
              const durationText =
                hrs > 0 ? `${hrs} hr ${mins} min` : `${totalMins} mins`;

              const leg = route.legs?.[0];
              const parsedSteps = (leg?.steps || []).map((step: any) => ({
                instruction:
                  step.navigationInstruction?.instructions ||
                  step.instructions ||
                  "Proceed along route",
                distance: step.distanceMeters
                  ? `${(step.distanceMeters / 1609.34).toFixed(1)} mi`
                  : "",
                duration: step.staticDurationMillis
                  ? `${Math.max(1, Math.round(step.staticDurationMillis / 60000))} min`
                  : "",
              }));

              setNavState((prev) => ({
                ...prev,
                active: true,
                origin,
                destination,
                targetUser: targetUser || prev.targetUser,
                travelMode,
                distance: `${distMiles} mi`,
                duration: durationText,
                startAddress: "Your Current Location",
                endAddress: "",
                steps: parsedSteps,
                calculating: false,
                error: null,
                permissionDenied: false,
              }));
              routeCalculated = true;
            }
          }
        }
      } catch (clientRouteErr) {
        console.warn(
          "Client Route.computeRoutes failed, falling back to server proxy:",
          clientRouteErr,
        );
      }

      // 3. Fallback: Call /api/navigation/route (which uses Routes API key from onSpotRN + OSRM)
      if (!routeCalculated) {
        try {
          const res = await fetch("/api/navigation/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              origin,
              destination,
              travelMode,
            }),
          });
          const data = await res.json();

          if (data && data.success && data.encodedPolyline) {
            const decodedPoints = decodePolyline(data.encodedPolyline);
            if (decodedPoints.length > 0) {
              const poly = new window.google.maps.Polyline({
                path: decodedPoints,
                strokeColor: "#1f3d2a",
                strokeWeight: 6,
                strokeOpacity: 0.85,
                map: mapInstanceRef.current,
              });
              routePolylinesRef.current = [poly];

              // Create Endpoint Markers (Origin: Blue GPS beacon, Destination: Red Map Pin)
              createNavigationEndpointMarkers(origin, destination, targetUser);

              const b = new window.google.maps.LatLngBounds();
              b.extend(origin);
              b.extend(destination);
              decodedPoints.forEach((pt) => b.extend(pt));
              mapInstanceRef.current.fitBounds(b, 50);

              setNavState((prev) => ({
                ...prev,
                active: true,
                origin,
                destination,
                targetUser: targetUser || prev.targetUser,
                travelMode,
                distance: data.distanceText || "",
                duration: data.durationText || "",
                startAddress: "Your Current Location",
                endAddress: "",
                steps: data.steps || [],
                calculating: false,
                error: null,
                permissionDenied: false,
              }));
              routeCalculated = true;
            }
          } else {
            throw new Error(data?.error || "Failed to calculate route");
          }
        } catch (proxyErr: any) {
          console.error("Navigation route error:", proxyErr);
          const errMsg =
            proxyErr?.message ||
            "Could not calculate route between your location and this user.";
          setNavState((prev) => ({
            ...prev,
            calculating: false,
            error: errMsg,
          }));
          toast.error(errMsg);
        }
      }
    },
    [clearRoutePolylines, decodePolyline, createNavigationEndpointMarkers],
  );

  // Start In-App Navigation by requesting user's current GPS location
  const handleStartNavigation = useCallback(
    (user: any) => {
      const destLat = Number(user.latitude);
      const destLng = Number(user.longitude);

      if (isNaN(destLat) || isNaN(destLng)) {
        toast.error("User does not have valid coordinates recorded.");
        return;
      }

      setActiveSelectedUser(null);

      if (typeof window === "undefined" || !navigator.geolocation) {
        setNavState({
          active: true,
          targetUser: user,
          origin: null,
          destination: { lat: destLat, lng: destLng },
          travelMode: "DRIVING",
          distance: "",
          duration: "",
          startAddress: "",
          endAddress: "",
          steps: [],
          showSteps: false,
          calculating: false,
          error:
            "Geolocation is not supported by your browser. In-app navigation is not possible without location permission.",
          permissionDenied: true,
        });
        toast.error("Geolocation is not supported by your browser.");
        return;
      }

      setNavState((prev) => ({
        ...prev,
        active: true,
        targetUser: user,
        destination: { lat: destLat, lng: destLng },
        calculating: true,
        permissionDenied: false,
        error: null,
      }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          calculateRoute(
            origin,
            { lat: destLat, lng: destLng },
            "DRIVING",
            user,
          );
        },
        (err) => {
          console.warn("Geolocation permission error:", err);
          let msg =
            "Location permission was denied. In-app navigation is not possible without permission to access your current location.";
          if (err.code === 2) {
            msg =
              "Could not determine your GPS location. Please check your device location settings.";
          } else if (err.code === 3) {
            msg = "Location request timed out. Please try again.";
          }
          setNavState((prev) => ({
            ...prev,
            active: true,
            targetUser: user,
            calculating: false,
            permissionDenied: true,
            error: msg,
          }));
          toast.error(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        },
      );
    },
    [calculateRoute],
  );

  // Exit in-app navigation and clear the route polyline from the map
  const handleExitNavigation = useCallback(() => {
    clearRoutePolylines();
    setNavState({
      active: false,
      targetUser: null,
      origin: null,
      destination: null,
      travelMode: "DRIVING",
      distance: "",
      duration: "",
      startAddress: "",
      endAddress: "",
      steps: [],
      showSteps: false,
      calculating: false,
      error: null,
      permissionDenied: false,
    });
  }, [clearRoutePolylines]);

  // Change travel mode (Driving, Walking, Bicycling, Transit)
  const handleTravelModeChange = (mode: string) => {
    if (!navState.origin || !navState.destination) return;
    calculateRoute(
      navState.origin,
      navState.destination,
      mode,
      navState.targetUser,
    );
  };

  // Avatar helper
  const getAvatarUrl = (u: any) => {
    const raw = u.profile?.profile_picture || u.profile_picture;
    if (!raw) return "";
    return raw.startsWith("http")
      ? raw
      : `${API_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  return (
    <div className="bg-white rounded-[14px] border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)] overflow-hidden transition-all duration-300">
      {/* Header bar above Google Map */}
      <div className="px-5 py-3 border-b border-[#ececec] flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2d4a23] border border-emerald-100 flex items-center justify-center">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1f1f1f] text-sm flex items-center gap-2 flex-wrap">
              <span>Online Users Live Map</span>
              {mapSummary ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {mapSummary.total_active_users.toLocaleString()} Active
                  </span>
                  {mapSummary.cluster_count > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {mapSummary.cluster_count} Clusters • {mapSummary.point_count} Points
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {liveUsers.length} Plotted
                </span>
              )}
              {(isFiltering || loadingPins) && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                  {isFiltering ? "Filtering users..." : "Updating pins..."}
                </span>
              )}
              {zoomTooLow && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-normal">
                  Zoom in closer to fetch live pins
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#7D848D]">
              Real-time online locations fetched dynamically by view bounds
            </p>
          </div>
        </div>

        {/* Map Tool Actions: State Jump Dropdown, Center All, Expand/Collapse */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map State Selector */}
          <div className="flex items-center gap-1">
            <select
              value={mapSelectedState}
              onChange={(e) => handleMapStateSelect(e.target.value)}
              className="h-[32px] text-xs text-[#2c2c2c] bg-[#F9F9F9] border border-[#e4e4df] rounded-[8px] px-2.5 pr-7 focus:outline-none focus:border-[#1f3d2a] cursor-pointer font-medium appearance-none shrink-0"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
              title="Jump to a specific State on map"
            >
              <option value="">Jump to State...</option>
              {states.map((s, idx) => {
                const val = s.state_code || s.state_name;
                return (
                  <option key={val + idx} value={val}>
                    {s.state_name}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCenterAll}
            className="px-2.5 py-1.5 rounded-[8px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-xs font-medium text-[#4a4a4a] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset map to fit all visible markers"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Center All</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-[8px] border border-[#e4e4df] bg-white hover:bg-[#f7f7f2] text-xs font-medium text-[#4a4a4a] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse map height" : "Expand map height"}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Google Map Canvas */}
      <div className="relative w-full">
        <div
          ref={mapContainerRef}
          style={{
            height: isExpanded ? "700px" : "500px",
            width: "100%",
          }}
          className="w-full transition-all duration-300"
        />

        {/* Floating Map Status Pill (like Airbnb / Google Maps) */}
        {(isFiltering || loadingPins) && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-emerald-100 flex items-center gap-2 text-xs font-semibold text-[#1f3d2a] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>{isFiltering ? "Filtering users & map..." : "Updating live pins..."}</span>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2 z-10">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-xs font-semibold text-gray-800">{mapError}</p>
            <p className="text-[11px] text-gray-500 max-w-sm">
              Please verify your NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.
            </p>
          </div>
        )}

        {/* Floating Details Card for Selected User */}
        {activeSelectedUser && (
          <div className="absolute top-3 left-3 z-[10] bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 max-w-sm w-[90%] sm:w-80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#2d4a23] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-100 overflow-hidden relative">
                  {getAvatarUrl(activeSelectedUser) ? (
                    <Image
                      src={getAvatarUrl(activeSelectedUser)}
                      alt={getDisplayName(activeSelectedUser)}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getDisplayName(activeSelectedUser).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    {getDisplayName(activeSelectedUser)}
                  </h4>
                  <p className="text-[10px] text-gray-500 truncate max-w-[150px]">
                    {activeSelectedUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveSelectedUser(null);
                  onSelectUser(null);
                }}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-xs"
                title="Close card"
              >
                ✕
              </button>
            </div>

            {/* Badges: Status & License Tier */}
            <div className="flex items-center gap-2 pt-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#eaf1fa] text-[#3b6bbf] border border-[#cfdcef] capitalize">
                <ShieldCheck className="w-3 h-3 text-[#3b6bbf]" />
                {String(
                  activeSelectedUser.membership_tier ||
                    activeSelectedUser.profile?.current_tier ||
                    (typeof activeSelectedUser.profile?.membership === "object"
                      ? activeSelectedUser.profile?.membership?.name
                      : activeSelectedUser.profile?.membership) ||
                    "Basic",
                )}{" "}
                Tier
              </span>
            </div>

            {/* Coordinates Display */}
            <div className="mt-2.5 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-[11px] text-gray-700 font-mono">
              <div>
                <span className="text-gray-400 font-sans text-[10px] block">
                  Coordinates:
                </span>
                <span>
                  {Number(activeSelectedUser.latitude).toFixed(5)},{" "}
                  {Number(activeSelectedUser.longitude).toFixed(5)}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyCoords(
                    Number(activeSelectedUser.latitude),
                    Number(activeSelectedUser.longitude),
                  )
                }
                className="p-1 text-gray-500 hover:text-[#2d4a23] hover:bg-white rounded transition-colors cursor-pointer"
                title="Copy coordinates"
              >
                {copiedCoords ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Logged / Recorded Timestamp if provided */}
            {(activeSelectedUser.location?.logged_at ||
              activeSelectedUser.logged_at) && (
              <div className="text-[10px] text-gray-500 pt-1.5 px-0.5 flex items-center justify-between">
                <span className="text-gray-400">Recorded:</span>
                <span className="font-medium text-gray-700">
                  {new Date(
                    activeSelectedUser.location?.logged_at ||
                      activeSelectedUser.logged_at,
                  ).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            {/* Action Buttons: Get Directions & View Profile */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartNavigation(activeSelectedUser)}
                className="flex-1 py-1.5 px-2 bg-[#1f3d2a] hover:bg-[#295034] text-white text-[11px] font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Calculate driving route from your current location"
              >
                <Navigation className="w-3 h-3" />
                <span>Navigate In-App</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExternalDirections(
                    Number(activeSelectedUser.latitude),
                    Number(activeSelectedUser.longitude),
                  )
                }
                className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer"
                title="Open in external Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
              </button>

              <Link
                href={`/user/${activeSelectedUser.id}`}
                className="py-1.5 px-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <UserIcon className="w-3 h-3 text-gray-500" />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        )}

        {/* Floating Details Card for Selected Cluster (Backend Clustering Spec - Edge Case 1) */}
        {activeSelectedCluster && (
          <div className="absolute top-3 left-3 z-[10] bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 max-w-sm w-[90%] sm:w-80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#1f3d2a] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-200">
                  {activeSelectedCluster.point_count_abbreviated || activeSelectedCluster.point_count}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    User Cluster ({activeSelectedCluster.point_count} users)
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    {activeSelectedCluster.latitude.toFixed(4)}, {activeSelectedCluster.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSelectedCluster(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-xs"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Users sample list in cluster */}
            {activeSelectedCluster.users && activeSelectedCluster.users.length > 0 ? (
              <div className="mt-2.5 space-y-1 max-h-52 overflow-y-auto pr-1">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Active users at this location:
                </div>
                {activeSelectedCluster.users.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setActiveSelectedCluster(null);
                      setActiveSelectedUser({
                        ...u,
                        latitude: activeSelectedCluster.latitude,
                        longitude: activeSelectedCluster.longitude,
                      });
                      onSelectUser(u);
                    }}
                    className="flex items-center justify-between p-1.5 hover:bg-emerald-50/60 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-emerald-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                        {u.profile_picture ? (
                          <img
                            src={u.profile_picture}
                            alt={u.display_name || u.email}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (u.display_name || u.email || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">
                          {u.display_name || u.email}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold shrink-0 ml-1">
                      View →
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                {activeSelectedCluster.point_count} active users clustered at this coordinate.
              </p>
            )}

            {/* Expansion button if higher zoom is available */}
            {mapInstanceRef.current &&
              activeSelectedCluster.expansion_zoom > (mapInstanceRef.current.getZoom() || 4) && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setZoom(activeSelectedCluster.expansion_zoom);
                        mapInstanceRef.current.panTo({
                          lat: activeSelectedCluster.latitude,
                          lng: activeSelectedCluster.longitude,
                        });
                        setActiveSelectedCluster(null);
                      }
                    }}
                    className="w-full py-1.5 px-3 bg-[#1f3d2a] hover:bg-[#295034] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Zoom In Closer (Level {activeSelectedCluster.expansion_zoom})</span>
                  </button>
                </div>
              )}
          </div>
        )}

        {/* ===================== IN-APP NAVIGATION OVERLAYS ===================== */}

        {/* 1. Location Permission Denied Dialog */}
        {navState.active && navState.permissionDenied && (
          <div className="absolute top-3 left-3 z-[25] bg-white rounded-xl p-4 shadow-xl border border-amber-200 max-w-sm w-[92%] sm:w-84 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900">
                  Location Permission Required
                </h4>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  In-app navigation requires access to your current GPS location as the starting point. Without permission, route navigation is not possible.
                </p>
                <div className="mt-2 text-[10.5px] text-gray-600 bg-amber-50/80 p-2 rounded-md border border-amber-100">
                  <strong>How to enable:</strong> Click the permissions/lock icon in your browser URL bar, set <em>Location</em> to <em>Allow</em>, and click <strong>Try Again</strong>.
                </div>
              </div>
              <button
                type="button"
                onClick={handleExitNavigation}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleExitNavigation}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartNavigation(navState.targetUser)}
                className="px-3.5 py-1.5 text-xs bg-[#1f3d2a] hover:bg-[#295034] text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Active In-App Navigation Card */}
        {navState.active && !navState.permissionDenied && (
          <div className="absolute top-3 left-3 z-[25] bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-emerald-100 max-w-sm w-[92%] sm:w-84 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <Navigation className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                      Live Route Navigation
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <h4 className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">
                    To: {getDisplayName(navState.targetUser)}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExitNavigation}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                title="Exit Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calculating State */}
            {navState.calculating && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <p className="text-xs font-medium text-gray-700">
                  Requesting GPS & calculating optimal route...
                </p>
              </div>
            )}

            {/* Error State */}
            {!navState.calculating && navState.error && (
              <div className="py-3 text-center space-y-2">
                <p className="text-xs text-red-600 font-medium">
                  {navState.error}
                </p>
                <button
                  type="button"
                  onClick={() => handleStartNavigation(navState.targetUser)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 font-medium transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Route Stats & Mode Selection */}
            {!navState.calculating && !navState.error && navState.distance && (
              <div className="space-y-3 pt-2.5">
                {/* Distance & Duration */}
                <div className="flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      Estimated Duration
                    </span>
                    <span className="text-lg font-bold text-emerald-900">
                      {navState.duration}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      Total Distance
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {navState.distance}
                    </span>
                  </div>
                </div>

                {/* Travel Mode Switcher */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                  {[
                    { mode: "DRIVING", label: "Drive", icon: Car },
                    { mode: "WALKING", label: "Walk", icon: Footprints },
                    { mode: "BICYCLING", label: "Bike", icon: Bike },
                    { mode: "TRANSIT", label: "Transit", icon: Bus },
                  ].map((m) => {
                    const IconComponent = m.icon;
                    const isActive = navState.travelMode === m.mode;
                    return (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => handleTravelModeChange(m.mode)}
                        className={`flex-1 py-1 rounded-md text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#1f3d2a] text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                        }`}
                        title={m.label}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className="hidden sm:inline">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Turn-by-Turn Collapsible Section */}
                {navState.steps.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setNavState((prev) => ({
                          ...prev,
                          showSteps: !prev.showSteps,
                        }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left text-xs font-semibold text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <CornerUpRight className="w-3.5 h-3.5 text-emerald-700" />
                        Turn-by-Turn Steps ({navState.steps.length})
                      </span>
                      {navState.showSteps ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>

                    {navState.showSteps && (
                      <div className="max-h-48 overflow-y-auto p-2 space-y-2 divide-y divide-gray-100 text-[11px] bg-white">
                        {navState.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="pt-1.5 first:pt-0 flex items-start gap-2"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 font-medium leading-snug">
                                {step.instruction}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {step.distance} • {step.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Exit Navigation & External Fallback */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExitNavigation}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Exit Navigation
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleExternalDirections(
                        Number(navState.targetUser?.latitude),
                        Number(navState.targetUser?.longitude),
                      )
                    }
                    className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Open in external Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
