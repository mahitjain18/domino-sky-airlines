import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Airport, Flight, SpareAircraft } from '../types/airline';
import { Plane } from 'lucide-react';

// Custom Map Marker Icons using Leaflet divIcon
const createAirportIcon = (tier: string, isSelected: boolean) => {
  let color = '#38BDF8'; // regional hub: sky
  let size = 26;
  if (tier === 'mega_hub') {
    color = '#00F0FF'; // mega hub: cyan
    size = 32;
  } else if (tier === 'spoke') {
    color = '#94A3B8'; // spoke: slate
    size = 20;
  }

  const border = isSelected ? 'border-2 border-white shadow-glow-cyan scale-125' : 'border border-slate-900';

  return L.divIcon({
    className: 'custom-airport-pin',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        box-shadow: 0 0 12px ${color}88;
      " class="${border}">
        <div style="width: 8px; height: 8px; background-color: #0B1120; border-radius: 9999px;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const createSpareIcon = () => {
  return L.divIcon({
    className: 'custom-spare-pin',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: #F59E0B;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        border: 2px solid #FFF;
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.7);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

interface IndiaFlightMapProps {
  airports: Airport[];
  flights: Flight[];
  spares: SpareAircraft[];
  selectedAirportId?: string | null;
  onSelectAirport?: (airport: Airport | null) => void;
  selectedTailId?: string | null;
}

export const IndiaFlightMap: React.FC<IndiaFlightMapProps> = ({
  airports,
  flights,
  spares,
  selectedAirportId,
  onSelectAirport,
  selectedTailId
}) => {
  const airportMap = new Map<string, Airport>();
  for (const a of airports) {
    airportMap.set(a.id, a);
  }

  // Filter flights if an airport or aircraft is selected
  const visibleFlights = flights.filter(f => {
    if (selectedTailId && f.tail_id !== selectedTailId) return false;
    if (selectedAirportId && f.origin !== selectedAirportId && f.destination !== selectedAirportId) {
      return false;
    }
    return true;
  });

  // Calculate unique routes
  const routeCounts = new Map<string, number>();
  for (const f of visibleFlights) {
    const key = [f.origin, f.destination].sort().join('-');
    routeCounts.set(key, (routeCounts.get(key) || 0) + 1);
  }

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-[#080D1A]">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs shadow-xl pointer-events-auto">
        <div className="font-semibold text-slate-200 mb-2 font-mono flex items-center space-x-1.5">
          <Plane className="w-3.5 h-3.5 text-cyan-400" />
          <span>INDIAN DOMESTIC OCC RADAR</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#00F0FF] shadow-glow-cyan inline-block"></span>
            <span className="text-slate-300">Mega Hubs (DEL, BOM, BLR, HYD)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block"></span>
            <span className="text-slate-300">Regional Hubs (MAA, CCU, AMD, COK)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#94A3B8] inline-block"></span>
            <span className="text-slate-300">Spoke Airports (GOI, PNQ, etc.)</span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
            <span className="text-amber-300 font-mono">Spare Aircraft (BLR, DEL)</span>
          </div>
        </div>
      </div>

      {/* Selected Airport Filter Notice */}
      {selectedAirportId && (
        <div className="absolute top-3 right-3 z-[1000] bg-cyan-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 text-xs font-mono text-cyan-200 flex items-center space-x-2">
          <span>Filtering Hub: {selectedAirportId}</span>
          <button
            onClick={() => onSelectAirport && onSelectAirport(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', backgroundColor: '#070B14' }}
      >
        {/* CartoDB Dark Matter Tiles (Free, high performance, perfect dark navy theme) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Flight Route Polylines */}
        {visibleFlights.map(flight => {
          const originAirport = airportMap.get(flight.origin);
          const destAirport = airportMap.get(flight.destination);
          if (!originAirport || !destAirport) return null;

          const isDelayed = (flight.delay_minutes || 0) > 0;
          const lineColor = isDelayed ? '#F43F5E' : '#00F0FF';
          const lineOpacity = isDelayed ? 0.8 : 0.45;
          const lineWeight = isDelayed ? 3 : 2;

          return (
            <Polyline
              key={flight.flight_id}
              positions={[
                [originAirport.lat, originAirport.lng],
                [destAirport.lat, destAirport.lng]
              ]}
              pathOptions={{
                color: lineColor,
                weight: lineWeight,
                opacity: lineOpacity,
                dashArray: isDelayed ? '6, 6' : undefined
              }}
            >
              <Tooltip sticky>
                <div className="p-1 font-mono text-xs">
                  <div className="font-bold text-cyan-300">
                    {flight.flight_id} ({flight.tail_id})
                  </div>
                  <div className="text-slate-300">
                    {flight.origin} → {flight.destination}
                  </div>
                  <div className="text-slate-400">
                    DEP: {flight.actual_dep || flight.dep} | ARR: {flight.actual_arr || flight.arr}
                  </div>
                  <div className="text-emerald-400">
                    PAX: {flight.pax}/180 ({Math.round((flight.pax / 180) * 100)}% load)
                  </div>
                  {isDelayed && (
                    <div className="text-rose-400 font-bold">
                      ⚠ DELAYED +{flight.delay_minutes}m
                    </div>
                  )}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Airport Markers */}
        {airports.map(airport => {
          const isSelected = airport.id === selectedAirportId;
          const departingFlights = flights.filter(f => f.origin === airport.id);
          const arrivingFlights = flights.filter(f => f.destination === airport.id);

          return (
            <Marker
              key={airport.id}
              position={[airport.lat, airport.lng]}
              icon={createAirportIcon(airport.tier, isSelected)}
              eventHandlers={{
                click: () => onSelectAirport && onSelectAirport(airport)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-700 mb-2">
                    <span className="font-mono font-bold text-sm text-cyan-300">
                      {airport.id} - {airport.city}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {airport.tier.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mb-1">{airport.name}</div>
                  <div className="grid grid-cols-2 gap-2 my-2 text-[11px] font-mono bg-slate-900/60 p-2 rounded">
                    <div>
                      <span className="text-slate-400 block">Runway Cap:</span>
                      <span className="text-cyan-400 font-bold">{airport.capacity_per_hour}/hr</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Movements:</span>
                      <span className="text-white font-bold">
                        {departingFlights.length + arrivingFlights.length} flights
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    DEP: {departingFlights.length} | ARR: {arrivingFlights.length}
                  </div>
                  <button
                    onClick={() => onSelectAirport && onSelectAirport(isSelected ? null : airport)}
                    className="mt-2 w-full py-1 text-center bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium transition"
                  >
                    {isSelected ? 'Clear Filter' : 'Filter Hub Flights'}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Spare Aircraft Location Markers (VT-DS17 at BLR, VT-DS18 at DEL) */}
        {spares.map(spare => {
          const baseAirport = airportMap.get(spare.base);
          if (!baseAirport) return null;

          // Offset marker slightly so it doesn't overlap airport center
          const spareLat = baseAirport.lat + 0.15;
          const spareLng = baseAirport.lng + 0.15;

          return (
            <Marker key={spare.tail_id} position={[spareLat, spareLng]} icon={createSpareIcon()}>
              <Popup>
                <div className="p-2">
                  <div className="font-mono font-bold text-amber-400 text-xs flex items-center space-x-1.5">
                    <span>HOT-STANDBY SPARE: {spare.tail_id}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Stationed at {baseAirport.name} ({spare.base})
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Available From: {spare.available_from} IST | Seats: {spare.seats}
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20 font-mono">
                    ✓ 100% Operational & Fuel Ready
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
