'use client';

import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

interface Item {
  id: string;
  lat: number;
  lng: number;
  svc?: string;
  type?: string;
  st: string;
  dt: string;
  nbr?: string;
  addr?: string;
  age?: number;
}

interface Props {
  center: [number, number];
  radiusMiles: number;
  items311: Item[];
  permits: Item[];
  activeTab: 'briefing' | 'rightnow';
}

const CATEGORY_COLORS: Record<string, string> = {
  'Pothole': '#ef4444',
  'Street Light Maintenance': '#f59e0b',
  'Sidewalk Repair Issue': '#8b5cf6',
  'Graffiti - Code Enforcement': '#ec4899',
  'ROW Maintenance': '#6366f1',
  'Illegal Dumping': '#14b8a6',
  'ESD Collections': '#06b6d4',
};

function getColor(svc: string) {
  return CATEGORY_COLORS[svc] || '#6b7280';
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function Map({ center, radiusMiles, items311, permits, activeTab }: Props) {
  const radiusMeters = radiusMiles * 1609.34;

  return (
    <MapContainer center={center} zoom={15} className="h-full w-full rounded-lg" scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <Circle
        center={center}
        radius={radiusMeters}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1 }}
      />

      {activeTab === 'briefing' && items311.map((item) => (
        <CircleMarker
          key={`311-${item.id}`}
          center={[item.lat, item.lng]}
          radius={4}
          pathOptions={{ color: getColor(item.svc || ''), fillColor: getColor(item.svc || ''), fillOpacity: 0.7, weight: 1 }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{item.svc}</strong>
              <br />Status: {item.st === 'I' ? 'In Process' : 'New'}
              <br />Opened: {item.dt}
              {item.age !== undefined && <><br />{item.age} days old</>}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {activeTab === 'briefing' && permits.map((item) => (
        <CircleMarker
          key={`pmt-${item.id}`}
          center={[item.lat, item.lng]}
          radius={5}
          pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.6, weight: 1 }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{item.type}</strong>
              <br />Status: {item.st}
              <br />Date: {item.dt}
              {item.addr && <><br />{item.addr}</>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
