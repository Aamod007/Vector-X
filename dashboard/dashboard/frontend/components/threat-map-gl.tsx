"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Activity, Compass, Flame, Globe, Minus, Navigation, Plus, Radio, Shield, Zap } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

/** Coordinates for known threat-source countries (lng, lat) */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  "india":         [78.9629, 20.5937],
  "russia":        [37.6173, 55.7558],
  "united states": [-98.5795, 39.8283],
  "china":         [104.1954, 35.8617],
  "germany":       [10.4515, 51.1657],
  "singapore":     [103.8198, 1.3521],
  "brazil":        [-51.9253, -14.2350],
  "japan":         [138.2529, 36.2048],
  "south korea":   [127.7669, 35.9078],
  "united kingdom": [-3.4360, 55.3781],
  "france":        [2.2137, 46.2276],
  "australia":     [133.7751, -25.2744],
  "canada":        [-106.3468, 56.1304],
  "iran":          [53.6880, 32.4279],
  "north korea":   [127.5101, 40.3399],
  "ukraine":       [31.1656, 48.3794],
  "turkey":        [35.2433, 38.9637],
  "netherlands":   [5.2913, 52.1326],
  "israel":        [34.8516, 31.0461],
  "vietnam":       [108.2772, 14.0583],
};

const TARGET_COORDS: [number, number] = [-77.0369, 38.9072]; // US HQ Data Center

interface ThreatSource {
  country: string;
  count: number;
  color: string;
}

interface ThreatMapGLProps {
  threatSources: ThreatSource[];
  maxCount: number;
  onCountryClick?: (country: string) => void;
  searchQuery?: string;
}

export type MapDisplayMode = "trajectories" | "heatmap" | "hybrid";

/* eslint-disable @typescript-eslint/no-explicit-any */

function createCurvedTrajectory(start: [number, number], end: [number, number], numPoints = 40): number[][] {
  const points: number[][] = [];
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;

  const midLng = (lng1 + lng2) / 2;
  const midLat = (lat1 + lat2) / 2 + Math.min(25, Math.abs(lng2 - lng1) * 0.15);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const curLng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    const curLat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    points.push([curLng, curLat]);
  }
  return points;
}

export function ThreatMapGL({
  threatSources,
  maxCount,
  onCountryClick,
  searchQuery,
}: ThreatMapGLProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);
  const mlRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("trajectories");
  const animFrameRef = useRef<number | null>(null);

  // Initialize MapLibre with 100% Free OpenStreetMap Tiles (No API Key Required)
  useEffect(() => {
    if (!mapContainer.current) return;
    let cancelled = false;

    (async () => {
      const mod = await import("maplibre-gl");
      const ml = (mod as any).default ?? mod;
      mlRef.current = ml;

      if (cancelled || !mapContainer.current || mapRef.current) return;

      const map = new ml.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
              paint: {
                "raster-saturation": -0.35,
                "raster-contrast": 0.05,
                "raster-brightness-min": 0.08,
              },
            },
          ],
        },
        center: [20, 28] as [number, number],
        zoom: 1.15,
        minZoom: 0.8,
        maxZoom: 6,
        attributionControl: false,
        interactive: true,
        dragRotate: false,
        pitchWithRotate: false,
        touchZoomRotate: true,
      });

      map.on("load", () => {
        if (!cancelled) setMapReady(true);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Update Trajectory Arcs & Native Heatmap Layer in MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // 1. Build GeoJSON for curved trajectory arcs
    const arcFeatures = threatSources
      .filter((s) => s.country.toLowerCase() !== "united states")
      .map((s) => {
        const coords = COUNTRY_COORDS[s.country.toLowerCase()];
        if (!coords) return null;
        const lineCoords = createCurvedTrajectory(coords, TARGET_COORDS);
        return {
          type: "Feature",
          properties: {
            country: s.country,
            color: s.color,
            count: s.count,
          },
          geometry: {
            type: "LineString",
            coordinates: lineCoords,
          },
        };
      })
      .filter(Boolean);

    const arcGeojsonData = {
      type: "FeatureCollection",
      features: arcFeatures,
    };

    if (map.getSource("threat-arcs")) {
      map.getSource("threat-arcs").setData(arcGeojsonData);
    } else {
      map.addSource("threat-arcs", {
        type: "geojson",
        data: arcGeojsonData,
      });

      map.addLayer({
        id: "threat-arcs-glow",
        type: "line",
        source: "threat-arcs",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 3.5,
          "line-opacity": 0.25,
          "line-blur": 2,
        },
      });

      map.addLayer({
        id: "threat-arcs-core",
        type: "line",
        source: "threat-arcs",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.6,
          "line-opacity": 0.75,
          "line-dasharray": [3, 2],
        },
      });
    }

    // 2. Build GeoJSON for Native Heatmap Layer
    const pointFeatures = threatSources.map((s) => {
      const coords = COUNTRY_COORDS[s.country.toLowerCase()];
      if (!coords) return null;
      return {
        type: "Feature",
        properties: {
          country: s.country,
          count: s.count,
          weight: Math.max(1, s.count / Math.max(1, maxCount)),
        },
        geometry: {
          type: "Point",
          coordinates: coords,
        },
      };
    }).filter(Boolean);

    const pointGeojsonData = {
      type: "FeatureCollection",
      features: pointFeatures,
    };

    if (map.getSource("threat-points")) {
      map.getSource("threat-points").setData(pointGeojsonData);
    } else {
      map.addSource("threat-points", {
        type: "geojson",
        data: pointGeojsonData,
      });

      map.addLayer({
        id: "threat-heatmap",
        type: "heatmap",
        source: "threat-points",
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 5, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(59,130,246,0)",
            0.2, "rgba(59,130,246,0.6)",
            0.4, "rgba(6,182,212,0.8)",
            0.6, "rgba(234,179,8,0.85)",
            0.8, "rgba(249,115,22,0.9)",
            1, "rgba(239,68,68,0.95)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 22, 5, 55],
          "heatmap-opacity": 0.82,
        },
      });
    }

    // Toggle layer visibility based on displayMode
    try {
      const showArcs = displayMode === "trajectories" || displayMode === "hybrid";
      const showHeatmap = displayMode === "heatmap" || displayMode === "hybrid";

      if (map.getLayer("threat-arcs-glow")) {
        map.setLayoutProperty("threat-arcs-glow", "visibility", showArcs ? "visible" : "none");
      }
      if (map.getLayer("threat-arcs-core")) {
        map.setLayoutProperty("threat-arcs-core", "visibility", showArcs ? "visible" : "none");
      }
      if (map.getLayer("threat-heatmap")) {
        map.setLayoutProperty("threat-heatmap", "visibility", showHeatmap ? "visible" : "none");
      }
    } catch {}

    // Animate dash array for attack pulses
    let dashOffset = 0;
    const animateDash = () => {
      if (!mapRef.current || !mapRef.current.getLayer("threat-arcs-core")) return;
      dashOffset = (dashOffset + 0.12) % 5;
      try {
        mapRef.current.setPaintProperty("threat-arcs-core", "line-dasharray", [3, 2]);
      } catch {}
      animFrameRef.current = requestAnimationFrame(animateDash);
    };
    animFrameRef.current = requestAnimationFrame(animateDash);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [threatSources, maxCount, mapReady, displayMode]);

  // Update Markers & Popups
  const updateMarkers = useCallback(() => {
    const ml = mlRef.current;
    if (!ml || !mapRef.current || !mapReady) return;

    markersRef.current.forEach((m: any) => m.remove());
    markersRef.current = [];

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // In pure heatmap mode, we can show lighter target marker and omit bulky bubble markers
    const showMarkers = displayMode !== "heatmap";

    // 1. Target Node Marker (US Cloud Datacenter)
    const targetEl = document.createElement("div");
    targetEl.className = "target-node-marker";
    targetEl.style.cssText = `
      width: 32px;
      height: 32px;
      position: relative;
      cursor: pointer;
    `;
    targetEl.innerHTML = `
      <div style="position: absolute; inset: 0; border-radius: 50%; background: #2563eb; opacity: 0.2; animation: threatPulse 2s infinite;"></div>
      <div style="position: absolute; inset: 6px; border-radius: 50%; background: #1d4ed8; border: 2px solid #ffffff; display: grid; place-items: center; box-shadow: 0 0 10px rgba(37,99,235,0.6);">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
      <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 8px; font-weight: 700; color: #1e3a8a; background: #eff6ff; border: 1px solid #bfdbfe; padding: 1px 5px; border-radius: 4px; white-space: nowrap;">
        HQ TARGET
      </div>
    `;
    const targetMarker = new ml.Marker({ element: targetEl, anchor: "center" })
      .setLngLat(TARGET_COORDS)
      .addTo(mapRef.current!);
    markersRef.current.push(targetMarker);

    if (!showMarkers) return;

    // 2. Add Threat Source Country Markers
    threatSources.forEach((source) => {
      const key = source.country.toLowerCase();
      const coords = COUNTRY_COORDS[key];
      if (!coords) return;

      const fraction = Math.max(0.1, source.count / maxCount);
      const radius = Math.round(11 + fraction * 24);

      const isSelected =
        searchQuery && searchQuery.toLowerCase() === source.country.toLowerCase();

      const el = document.createElement("div");
      el.className = "threat-marker-gl";
      el.style.cssText = `
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        position: relative;
        cursor: pointer;
      `;

      // Radar Pulse Rings
      const ring = document.createElement("div");
      ring.className = "threat-pulse-ring";
      ring.style.cssText = `
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: ${source.color};
        opacity: ${isSelected ? 0.35 : 0.2};
        animation: threatPulse 2.2s ease-in-out infinite;
      `;
      el.appendChild(ring);

      if (fraction > 0.4) {
        const outerRadar = document.createElement("div");
        outerRadar.style.cssText = `
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px dashed ${source.color};
          opacity: 0.4;
          animation: spinRadar 8s linear infinite;
        `;
        el.appendChild(outerRadar);
      }

      // Inner Core Node
      const dot = document.createElement("div");
      const dotSize = Math.max(8, radius * 0.55);
      dot.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${dotSize}px;
        height: ${dotSize}px;
        border-radius: 50%;
        background: ${source.color};
        border: 2px solid rgba(255,255,255,0.95);
        box-shadow: 0 0 10px ${source.color}90, 0 1px 3px rgba(0,0,0,0.3);
        transition: transform 0.15s ease;
      `;
      el.appendChild(dot);

      // Value label
      if (radius > 13) {
        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 8px;
          font-weight: 800;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
          pointer-events: none;
          white-space: nowrap;
          font-family: monospace;
        `;
        label.textContent =
          source.count > 1000 ? `${(source.count / 1000).toFixed(1)}k` : String(source.count);
        el.appendChild(label);
      }

      // Selected ring
      if (isSelected) {
        const selRing = document.createElement("div");
        selRing.style.cssText = `
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid ${source.color};
          animation: threatPulse 1.5s ease-in-out infinite;
        `;
        el.appendChild(selRing);
      }

      // Hover Tooltip
      el.addEventListener("mouseenter", () => {
        dot.style.transform = "translate(-50%, -50%) scale(1.2)";
        const popup = new ml.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -(radius + 4)],
          className: "threat-popup-gl",
        })
          .setLngLat(coords)
          .setHTML(
            `<div class="threat-popup-content" style="padding: 6px 10px; background: rgba(15,23,42,0.92); color: white; border-radius: 6px; font-size: 11px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; gap: 8px; margin-bottom: 3px;">
                <strong style="font-size:12px; color:#f8fafc;">${source.country}</strong>
                <span style="font-size:10px; padding:1px 5px; border-radius:3px; background:${source.color}30; color:${source.color}; font-weight:700;">
                  ${Math.round((source.count / maxCount) * 100)}% Ingress
                </span>
              </div>
              <div style="color:#94a3b8; font-size:10px; font-family:monospace;">${source.count.toLocaleString()} blocked attempts</div>
              <div style="margin-top:4px; font-size:9.5px; color:#38bdf8;">Click node to isolate telemetry &rarr;</div>
            </div>`
          )
          .addTo(mapRef.current!);
        popupRef.current = popup;
      });

      el.addEventListener("mouseleave", () => {
        dot.style.transform = "translate(-50%, -50%) scale(1)";
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      el.addEventListener("click", () => {
        onCountryClick?.(source.country);
      });

      const marker = new ml.Marker({ element: el, anchor: "center" })
        .setLngLat(coords)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [threatSources, maxCount, searchQuery, onCountryClick, mapReady, displayMode]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  const handleZoom = (delta: number) => {
    if (mapRef.current) {
      mapRef.current.easeTo({ zoom: mapRef.current.getZoom() + delta, duration: 300 });
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({ center: [20, 28], zoom: 1.15, duration: 400 });
    }
  };

  return (
    <div className="threat-map-gl-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* ─── HIGH-TECH SOC HUD OVERLAY ─── */}
      <div
        className="threat-map-hud"
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(6px)",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "10px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", animation: "threatPulse 1.5s infinite" }} />
          <span style={{ fontWeight: 700, color: "#1e293b" }}>OpenStreetMap</span>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <span style={{ fontFamily: "monospace", color: "#ef4444", fontWeight: 700 }}>
            {threatSources.reduce((a, b) => a + b.count, 0).toLocaleString()} blocks
          </span>
        </div>

        {/* Dynamic Mode Switcher: Trajectories vs Heatmap vs Hybrid */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "#f1f5f9", padding: "2px", borderRadius: "4px" }}>
          <button
            type="button"
            onClick={() => setDisplayMode("trajectories")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "9.5px",
              fontWeight: displayMode === "trajectories" ? 700 : 500,
              background: displayMode === "trajectories" ? "#ffffff" : "transparent",
              color: displayMode === "trajectories" ? "#2563eb" : "#64748b",
              border: "none",
              cursor: "pointer",
              boxShadow: displayMode === "trajectories" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            title="Show attack trajectory arcs and radar nodes"
          >
            <Radio size={10} />
            <span>Arcs</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("heatmap")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "9.5px",
              fontWeight: displayMode === "heatmap" ? 700 : 500,
              background: displayMode === "heatmap" ? "#ffffff" : "transparent",
              color: displayMode === "heatmap" ? "#e11d48" : "#64748b",
              border: "none",
              cursor: "pointer",
              boxShadow: displayMode === "heatmap" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            title="Show native MapLibre density heatmap"
          >
            <Flame size={10} />
            <span>Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("hybrid")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "9.5px",
              fontWeight: displayMode === "hybrid" ? 700 : 500,
              background: displayMode === "hybrid" ? "#ffffff" : "transparent",
              color: displayMode === "hybrid" ? "#8b5cf6" : "#64748b",
              border: "none",
              cursor: "pointer",
              boxShadow: displayMode === "hybrid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            title="Show both heatmap density and attack trajectories"
          >
            <Zap size={10} />
            <span>Hybrid</span>
          </button>
        </div>
      </div>

      {/* ─── MAP CANVAS (FREE OPENSTREETMAP) ─── */}
      <div ref={mapContainer} className="threat-map-gl-canvas" style={{ width: "100%", height: "100%" }} />

      {/* ─── MAP CONTROLS OVERLAY (BOTTOM RIGHT) ─── */}
      <div
        className="threat-map-controls"
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => handleZoom(0.6)}
          title="Zoom In"
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            background: "white",
            border: "1px solid #cbd5e1",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#334155",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Plus size={12} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.6)}
          title="Zoom Out"
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            background: "white",
            border: "1px solid #cbd5e1",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#334155",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title="Reset Global View"
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            background: "white",
            border: "1px solid #cbd5e1",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#2563eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Compass size={12} />
        </button>
      </div>
    </div>
  );
}
