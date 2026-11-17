import { NextRequest, NextResponse } from "next/server";

// Fallback Google Maps Key from onSpotRN mobile app which has Routes API enabled
const FALLBACK_KEY = "AIzaSyACaRGXoQ0JlTgmjbueFt55tfzHBr9HT9Y";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, travelMode = "DRIVE" } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: "Origin and destination are required" },
        { status: 400 },
      );
    }

    const apiKey =
      process.env.GOOGLE_MAPS_ROUTES_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      FALLBACK_KEY;

    // Normalize travel mode for Google Routes API
    const modeMap: Record<string, string> = {
      DRIVING: "DRIVE",
      DRIVE: "DRIVE",
      WALKING: "WALK",
      WALK: "WALK",
      BICYCLING: "BICYCLE",
      BICYCLE: "BICYCLE",
      TRANSIT: "TRANSIT",
    };
    const googleMode = modeMap[travelMode.toUpperCase()] || "DRIVE";

    let routeLoaded = false;
    let resultPayload: any = null;

    // 1. Primary: Google Routes API (computeRoutes) - identical to onSpotRN MapComponent.tsx
    const keysToTry = [apiKey];
    if (apiKey !== FALLBACK_KEY) {
      keysToTry.push(FALLBACK_KEY);
    }

    for (const key of keysToTry) {
      if (routeLoaded) break;
      try {
        const routesRes = await fetch(
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": key,
              "X-Goog-FieldMask":
                "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs",
            },
            body: JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude: origin.lat,
                    longitude: origin.lng,
                  },
                },
              },
              destination: {
                location: {
                  latLng: {
                    latitude: destination.lat,
                    longitude: destination.lng,
                  },
                },
              },
              travelMode: googleMode,
            }),
          },
        );

        const routesData = await routesRes.json();
        if (routesData.routes && routesData.routes.length > 0) {
          const r = routesData.routes[0];
          const distMeters = r.distanceMeters || 0;
          const distMiles = (distMeters / 1609.34).toFixed(1);
          const durationSec = parseInt(
            r.duration?.replace("s", "") || "0",
            10,
          );
          const durationMins = Math.max(1, Math.round(durationSec / 60));
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const durationText =
            hours > 0 ? `${hours} hr ${mins} min` : `${durationMins} mins`;

          const rawSteps = r.legs?.[0]?.steps || [];
          const parsedSteps = rawSteps.map((s: any) => ({
            instruction:
              s.navigationInstruction?.instructions ||
              s.instructions ||
              "Proceed along route",
            distance: s.distanceMeters
              ? `${(s.distanceMeters / 1609.34).toFixed(1)} mi`
              : "",
            duration: s.staticDuration
              ? `${Math.max(1, Math.round(parseInt(s.staticDuration.replace("s", ""), 10) / 60))} min`
              : "",
          }));

          resultPayload = {
            success: true,
            source: "google_routes",
            encodedPolyline: r.polyline?.encodedPolyline || "",
            distanceText: `${distMiles} mi`,
            distanceMeters: distMeters,
            durationText,
            durationSeconds: durationSec,
            steps: parsedSteps,
          };
          routeLoaded = true;
        }
      } catch (gErr) {
        console.warn("Google Routes API attempt failed:", gErr);
      }
    }

    // 2. Secondary fallback: OSRM road routing engine (matching onSpotRN MapComponent.tsx line 411)
    if (!routeLoaded) {
      try {
        const osrmMode =
          travelMode.toUpperCase().includes("WALK")
            ? "foot"
            : travelMode.toUpperCase().includes("BIKE")
              ? "bike"
              : "driving";
        const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmMode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline&steps=true`;
        const osrmRes = await fetch(osrmUrl);
        const osrmData = await osrmRes.json();

        if (osrmData.routes && osrmData.routes.length > 0) {
          const r = osrmData.routes[0];
          const distMiles = (r.distance / 1609.34).toFixed(1);
          const durationMins = Math.max(1, Math.round(r.duration / 60));
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const durationText =
            hours > 0 ? `${hours} hr ${mins} min` : `${durationMins} mins`;

          const legSteps = r.legs?.[0]?.steps || [];
          const parsedSteps = legSteps.map((s: any) => ({
            instruction: s.name
              ? `Turn onto ${s.name}`
              : s.maneuver?.type
                ? `${s.maneuver.type} ${s.maneuver.modifier || ""}`.trim()
                : "Proceed along road",
            distance: `${Math.round(s.distance * 3.28084)} ft`,
            duration: `${Math.max(1, Math.round(s.duration / 60))} min`,
          }));

          resultPayload = {
            success: true,
            source: "osrm_fallback",
            encodedPolyline: r.geometry || "",
            distanceText: `${distMiles} mi`,
            distanceMeters: Math.round(r.distance),
            durationText,
            durationSeconds: Math.round(r.duration),
            steps: parsedSteps,
          };
          routeLoaded = true;
        }
      } catch (oErr) {
        console.warn("OSRM road routing fallback failed:", oErr);
      }
    }

    if (routeLoaded && resultPayload) {
      return NextResponse.json(resultPayload);
    }

    return NextResponse.json(
      { success: false, error: "Could not calculate a route between these coordinates." },
      { status: 404 },
    );
  } catch (err: any) {
    console.error("Navigation route error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
