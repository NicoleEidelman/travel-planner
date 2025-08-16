import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapView({ coords = [], segments = [], dayDistances = [] }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const drawn = useRef([]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current).setView([32.08, 34.78], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
    const map = mapRef.current;

    // clear previous layers
    drawn.current.forEach(l => map.removeLayer(l));
    drawn.current = [];

    const toLL = ([lon, lat]) => [lat, lon];

    const segs = (segments?.length ? segments : [coords]).filter(Boolean);
    const polys = segs.map((seg, i) => {
      const color = i === 0 ? '#667eea' : '#764ba2';
      const poly = L.polyline(seg.map(toLL), { 
        weight: 4, 
        color: color,
        opacity: 0.8
      }).addTo(map);
      drawn.current.push(poly);
      
      if (dayDistances?.[i]) {
        const mid = seg[Math.floor(seg.length/2)];
        const label = `Day ${i+1}: ${dayDistances[i].toFixed(1)} km`;
        const labelMarker = L.marker(toLL(mid), { opacity: 0.001 }).addTo(map)
          .bindTooltip(label, { 
            permanent: true, 
            direction: 'center',
            className: 'map-label'
          });
        drawn.current.push(labelMarker);
      }
      return poly;
    });

    if (coords?.length) {
      const first = toLL(coords[0]);
      const last  = toLL(coords[coords.length-1]);
      
      // Start marker
      const startMarker = L.circleMarker(first, { 
        radius: 8,
        color: '#48bb78',
        fillColor: '#48bb78',
        fillOpacity: 0.8,
        weight: 2
      }).addTo(map)
        .bindTooltip('Start', { 
          permanent: true, 
          offset: [0,-20],
          className: 'map-label'
        });
      drawn.current.push(startMarker);
      
      const gap = map.distance(first, last);
      if (gap > 10) {
        // End marker (only if different from start)
        const endMarker = L.circleMarker(last, { 
          radius: 8,
          color: '#f56565',
          fillColor: '#f56565',
          fillOpacity: 0.8,
          weight: 2
        }).addTo(map)
          .bindTooltip('Finish', { 
            permanent: true, 
            offset: [0,-20],
            className: 'map-label'
          });
        drawn.current.push(endMarker);
      } else {
        // Loop indicator
        startMarker.bindTooltip('Start/Finish', { 
          permanent: true, 
          offset: [0,-20],
          className: 'map-label'
        });
      }
    }

    if (polys.length) {
      const group = L.featureGroup(polys);
      map.fitBounds(group.getBounds(), { padding: [20, 20] });
      setTimeout(() => map.invalidateSize(), 100);
    }

    // cleanup on unmount/change
    return () => { 
      drawn.current.forEach(l => map.removeLayer(l)); 
      drawn.current = []; 
    };
  }, [coords, segments, dayDistances]);

  return (
    <div 
      ref={ref} 
      style={{ 
        height: 400, 
        width: '100%', 
        borderRadius: 16,
        border: 'none'
      }} 
    />
  );
}