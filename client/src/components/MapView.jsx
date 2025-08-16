// client/src/components/MapView.jsx

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Converts a coordinate array to [lat, lng] format for Leaflet.
 * Handles both [lat, lng] and [lng, lat] input by checking value ranges.
 * This logic is needed because some APIs (like GeoJSON) use [lng, lat] while Leaflet expects [lat, lng].
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
 * MapView React component
 * Renders an interactive Leaflet map with a polyline or GeoJSON overlay.
 * - Accepts either a GeoJSON LineString or an array of coordinates.
 * - Automatically fits the map to the route bounds.
 * - Uses refs to persist the map and feature group across renders.
 *
 * Design decision: Uses refs and effect hooks to avoid re-creating the map instance on every render.
 * Only updates the displayed route when props change, for performance and to avoid flicker.
 */
export default function MapView({ coords = [], geojson = null, color = '#667eea', height = 380 }) {
  const divRef = useRef(null); // Reference to the map container div
  const mapRef = useRef(null); // Reference to the Leaflet map instance
  const fgRef = useRef(null);  // Reference to the feature group for overlays

  // Initialize the map only once on mount
  useEffect(() => {
    if (!mapRef.current && divRef.current) {
      mapRef.current = L.map(divRef.current, { zoomControl: true }).setView([31.7683, 35.2137], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      fgRef.current = L.featureGroup().addTo(mapRef.current);
    }
    // No cleanup needed: map instance persists for the component's lifetime
  }, []);

  // Update the displayed route whenever coords, geojson, or color change
  useEffect(() => {
    if (!mapRef.current || !fgRef.current) return;
    fgRef.current.clearLayers();

    let added = false;

    // Prefer GeoJSON if provided and valid
    if (geojson && geojson.type === 'LineString' && Array.isArray(geojson.coordinates)) {
      // GeoJSON coordinates are [lng, lat], so Leaflet's geoJSON handles conversion
      L.geoJSON(geojson, { style: { color, weight: 5, opacity: 0.9, lineCap: 'round' } }).addTo(fgRef.current);
      added = true;
    } else if (Array.isArray(coords) && coords.length) {
      // Fallback: draw a polyline from the coords array
      // toLatLng ensures correct [lat, lng] order for Leaflet
      const latlngs = coords.map(toLatLng).filter(Boolean);
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color, weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(fgRef.current);
        added = true;
      }
    }

    // Fit map to route bounds if a route was added
    if (added) {
      const bounds = fgRef.current.getBounds();
      if (bounds && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
    }
  }, [coords, geojson, color]);

  // Render the map container
  return <div ref={divRef} style={{ width: '100%', height }} />;
}
