// client/src/components/MapView.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// אם יש לך כבר תיקון לאייקונים (markerIcon וכו') עשי אותו בקובץ אב כללי פעם אחת.

function toLatLng(pt) {
 
  if (!Array.isArray(pt) || pt.length < 2) return null;
  const [a, b] = pt.map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  
  if (Math.abs(a) > 90) return [b, a];

  return [a, b];
}

export default function MapView({ coords = [], geojson = null, color = '#667eea', height = 380 }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current && divRef.current) {
      mapRef.current = L.map(divRef.current, { zoomControl: true }).setView([31.7683, 35.2137], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      fgRef.current = L.featureGroup().addTo(mapRef.current);
    }
    return () => { /* לא הורסים כאן כדי לשמור state בעת רה-רנדר */ };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !fgRef.current) return;
    fgRef.current.clearLayers();

    let added = false;

    if (geojson && geojson.type === 'LineString' && Array.isArray(geojson.coordinates)) {
      // GeoJSON אמיתי – Leaflet כבר יודע שזה lon,lat
      L.geoJSON(geojson, { style: { color, weight: 5, opacity: 0.9, lineCap: 'round' } }).addTo(fgRef.current);
      added = true;
    } else if (Array.isArray(coords) && coords.length) {
      // מערך נקודות – ננרמל ל-[lat,lng] ונצייר Polyline
      const latlngs = coords.map(toLatLng).filter(Boolean);
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color, weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(fgRef.current);
        added = true;
      }
    }

    if (added) {
      const bounds = fgRef.current.getBounds();
      if (bounds && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
    }
  }, [coords, geojson, color]);

  return <div ref={divRef} style={{ width: '100%', height }} />;
}
