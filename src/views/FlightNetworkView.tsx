import React, { useState } from 'react';
import { Airport, Flight, SpareAircraft } from '../types/airline';
import { IndiaFlightMap } from '../components/IndiaFlightMap';
import {
  Plane,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Users,
  AlertTriangle,
  Sliders
} from 'lucide-react';

interface FlightNetworkViewProps {
  airports: Airport[];
  flights: Flight[];
  spares: SpareAircraft[];
  onSimulateDelay: (flightId: string) => void;
}

export const FlightNetworkView: React.FC<FlightNetworkViewProps> = ({
  airports,
  flights,
  spares,
  onSimulateDelay
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [selectedTail, setSelectedTail] = useState<string>('all');

  const filteredFlights = flights.filter(f => {
    const matchesSearch =
      f.flight_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tail_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHub =
      selectedHub === 'all' || f.origin === selectedHub || f.destination === selectedHub;

    const matchesTail = selectedTail === 'all' || f.tail_id === selectedTail;

    return matchesSearch && matchesHub && matchesTail;
  });

  const uniqueTails = Array.from(new Set(flights.map(f => f.tail_id))).sort();

  return (
    <div className="p-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            <span>FLIGHT NETWORK & DOMESTIC RADAR</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {flights.length} Scheduled Flight Legs • 16 Active Tails • 16 Domestic Hubs
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search flight, tail, city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={selectedHub}
            onChange={e => setSelectedHub(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Hubs (16)</option>
            {airports.map(a => (
              <option key={a.id} value={a.id}>
                {a.id} - {a.city}
              </option>
            ))}
          </select>

          <select
            value={selectedTail}
            onChange={e => setSelectedTail(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Aircraft (16)</option>
            {uniqueTails.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Flight Legs Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Full Interactive Leaflet Radar Map */}
        <div className="lg:col-span-8 glass-panel p-4 rounded-xl border border-slate-800 h-[620px]">
          <IndiaFlightMap
            airports={airports}
            flights={filteredFlights}
            spares={spares}
            selectedAirportId={selectedHub === 'all' ? null : selectedHub}
            selectedTailId={selectedTail === 'all' ? null : selectedTail}
          />
        </div>

        {/* Flight Legs Detail Feed */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col h-[620px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-white uppercase">
              Filtered Flights ({filteredFlights.length})
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              Leg Order Scheduled
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {filteredFlights.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No flights match selected filter.
              </div>
            ) : (
              filteredFlights.map(flight => {
                const isDelayed = (flight.delay_minutes || 0) > 0;
                const loadPct = Math.round((flight.pax / 180) * 100);

                return (
                  <div
                    key={flight.flight_id}
                    className={`p-3 rounded-lg border text-xs font-mono transition group ${
                      isDelayed
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-white text-sm">
                          {flight.flight_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {flight.tail_id} (Leg {flight.leg_order})
                        </span>
                      </div>
                      <button
                        onClick={() => onSimulateDelay(flight.flight_id)}
                        className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center space-x-1"
                        title="Simulate delay on this leg"
                      >
                        <Sliders className="w-2.5 h-2.5" />
                        <span>Simulate</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 my-2 text-sm font-bold">
                      <span className="text-cyan-300">{flight.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-cyan-300">{flight.destination}</span>
                      <span className="text-xs font-normal text-slate-400 ml-auto">
                        {flight.actual_dep || flight.dep} - {flight.actual_arr || flight.arr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                      <span>{flight.block_minutes} mins block</span>
                      <span className="text-emerald-400 font-bold">
                        {flight.pax}/180 pax ({loadPct}%)
                      </span>
                    </div>

                    {isDelayed && (
                      <div className="mt-1.5 text-[10px] text-rose-400 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>DELAY: +{flight.delay_minutes} MINS CASCADE</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
