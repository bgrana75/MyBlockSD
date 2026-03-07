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
  civic: {
    libraries: { item: { name: string; address: string; lat: number; lng: number }; distanceMiles: number }[];
    fireStations: { item: { name: string; stationNum: string; lat: number; lng: number }; distanceMiles: number }[];
  } | null;
  activeTab: string;
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
  return CATEGORY_COLORS[svc] || '#94a3b8';
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function Map({ center, radiusMiles, items311, permits, civic, activeTab }: Props) {
  const radiusMeters = radiusMiles * 1609.34;

  return (
    <MapContainer center={center} zoom={15} className="h-full w-full" scrollWheelZoom={true} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <RecenterMap center={center} />
      <Circle
        center={center}
        radius={radiusMeters}
        pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.04, weight: 1.5, dashArray: '6 4' }}
      />

      {activeTab === 'briefing' && items311.map((item) => (
        <CircleMarker
          key={`311-${item.id}`}
          center={[item.lat, item.lng]}
          radius={4}
          pathOptions={{ color: getColor(item.svc || ''), fillColor: getColor(item.svc || ''), fillOpacity: 0.7, weight: 1 }}
        >
          <Popup>
            <div className="text-xs leading-relaxed">
              <strong className="text-sm">{item.svc}</strong>
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
            <div className="text-xs leading-relaxed">
              <strong className="text-sm">{item.type}</strong>
              <br />Status: {item.st}
              <br />Date: {item.dt}
              {item.addr && <><br />{item.addr}</>}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Libraries */}
      {activeTab === 'briefing' && civic?.libraries.map((lib) => (
        <CircleMarker
          key={`lib-${lib.item.name}`}
          center={[lib.item.lat, lib.item.lng]}
          radius={7}
          pathOptions={{ color: '#0284c7', fillColor: '#0ea5e9', fillOpacity: 0.8, weight: 2 }}
        >
          <Popup>
            <div className="text-xs leading-relaxed">
              <strong className="text-sm">📚 {lib.item.name} Library</strong>
              <br />{lib.item.address}
              <br />{lib.distanceMiles} mi away
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Fire Stations */}
      {activeTab === 'briefing' && civic?.fireStations.map((fs) => (
        <CircleMarker
          key={`fs-${fs.item.name}`}
          center={[fs.item.lat, fs.item.lng]}
          radius={7}
          pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2 }}
        >
          <Popup>
            <div className="text-xs leading-relaxed">
              <strong className="text-sm">🚒 Fire Station {fs.item.stationNum}</strong>
              <br />{fs.distanceMiles} mi away
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
