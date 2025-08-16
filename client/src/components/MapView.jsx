import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Convert a point to Leaflet [lat, lng].
 * Accepts both [lat, lng] and [lng, lat] by checking plausible ranges.
 * Returns null for invalid input.
 */
function toLatLng(pt) {
  if (!Array.isArray(pt) || pt.length < 2) return null;
  const [a, b] = pt.map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  // If the first value is outside latitude range, assume [lng, lat] and swap
  if (Math.abs(a) > 90) return [b, a];
  return [a, b];
}

/**
 * MapView
 * Renders an interactive Leaflet map with a polyline or GeoJSON LineString.
 * - Accepts either `geojson` (preferred) or raw `coords`
 * - Automatically fits bounds to the drawn route
 * - Uses refs to avoid re-creating the Leaflet map instance
 */
export default function MapView({ coords = [], geojson = null, color = '#667eea', height = 380 }) {
  const divRef = useRef(null); // Map container element
  const mapRef = useRef(null); // Leaflet map
  const fgRef = useRef(null);  // Layer group for current overlays

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current && divRef.current) {
      mapRef.current = L.map(divRef.current, { zoomControl: true }).setView([31.7683, 35.2137], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      fgRef.current = L.featureGroup().addTo(mapRef.current);
    }
  }, []);

  // Re-render route when inputs change
  useEffect(() => {
    if (!mapRef.current || !fgRef.current) return;
    fgRef.current.clearLayers();

    let added = false;

    // Prefer GeoJSON LineString if provided
    if (geojson && geojson.type === 'LineString' && Array.isArray(geojson.coordinates)) {
      L.geoJSON(geojson, { style: { color, weight: 5, opacity: 0.9, lineCap: 'round' } }).addTo(fgRef.current);
      added = true;
    } else if (Array.isArray(coords) && coords.length) {
      // Fallback: polyline from raw coords
      const latlngs = coords.map(toLatLng).filter(Boolean);
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color, weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(fgRef.current);
        added = true;
      }
    }

    // Fit to route
    if (added) {
      const bounds = fgRef.current.getBounds();
      if (bounds && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
    }
  }, [coords, geojson, color]);

  // Render container
  return <div ref={divRef} style={{ width: '100%', height }} />;
}
