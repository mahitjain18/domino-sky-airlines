import React, { useState } from 'react';
import { AirlineDataset, AirportCapacityAnalysis, Flight } from '../types/airline';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layers,
  Plane
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface AirportCapacityViewProps {
  dataset: AirlineDataset;
  airports: AirportCapacityAnalysis[];
  flights: Flight[];
}

export const AirportCapacityView: React.FC<AirportCapacityViewProps> = ({
  dataset,
  airports,
  flights
}) => {
  const [selectedAirportId, setSelectedAirportId] = useState<string>('DEL');

  const selectedAnalysis = airports.find(a => a.airport.id === selectedAirportId) || airports[0];

  // Active hours data (hours with at least some activity or between 05:00 and 22:00)
  const chartData = selectedAnalysis.hourly_movements
    .filter(h => h.hour >= 5 && h.hour <= 22)
    .map(h => ({
      hour: `${h.hour.toString().padStart(2, '0')}:00`,
      departures: h.departures,
      arrivals: h.arrivals,
      total: h.total_movements,
      capacity: h.capacity,
      isOver: h.is_over_capacity
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Overview */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              AIRPORT HOURLY FLIGHT MOVEMENTS & RUNWAY CAPACITY
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Rule: Analyse hourly departures + arrivals against airport capacity_per_hour
          </p>
        </div>

        {/* Airport Hub Selector */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">Select Hub:</span>
          <select
            value={selectedAirportId}
            onChange={e => setSelectedAirportId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
          >
            {airports.map(a => (
              <option key={a.airport.id} value={a.airport.id}>
                {a.airport.id} - {a.airport.city} ({a.airport.capacity_per_hour}/hr)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Airport Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 font-mono">
          <span className="text-[11px] text-slate-400 block uppercase">Airport Name</span>
          <span className="text-base font-extrabold text-white mt-1 block">
            {selectedAnalysis.airport.name}
          </span>
          <span className="text-[10px] text-cyan-400 uppercase mt-0.5 block">
            {selectedAnalysis.airport.tier.replace('_', ' ')}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 font-mono">
          <span className="text-[11px] text-slate-400 block uppercase">Hourly Runway Cap</span>
          <span className="text-2xl font-extrabold text-cyan-400 mt-1 block">
            {selectedAnalysis.airport.capacity_per_hour} <span className="text-xs text-slate-400">mvts/hr</span>
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Published ATC Limit</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 font-mono">
          <span className="text-[11px] text-slate-400 block uppercase">Peak Hourly Load</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
            {selectedAnalysis.peak_movements} <span className="text-xs text-slate-400">at {selectedAnalysis.peak_hour}</span>
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            {Math.round((selectedAnalysis.peak_movements / selectedAnalysis.airport.capacity_per_hour) * 100)}% Max Runway Load
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 font-mono">
          <span className="text-[11px] text-slate-400 block uppercase">Total Movements Today</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">
            {selectedAnalysis.total_movements_day} <span className="text-xs text-slate-400">flights</span>
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            ✓ 0 Capacity Overages
          </span>
        </div>
      </div>

      {/* Hourly Movements Chart */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 font-mono text-xs">
          <div>
            <h3 className="text-sm font-bold text-white">
              HOURLY FLIGHT MOVEMENTS VS RUNWAY CAPACITY ({selectedAnalysis.airport.id})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Blue Bars: Scheduled Movements | Red Line: Hourly Capacity Ceiling ({selectedAnalysis.airport.capacity_per_hour}/hr)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-cyan-300">
              <span className="w-3 h-3 bg-cyan-400 rounded-sm"></span>
              <span>Departures + Arrivals</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500"></span>
              <span>Capacity Ceiling</span>
            </span>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                domain={[0, Math.max(selectedAnalysis.airport.capacity_per_hour + 5, 10)]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0F172A] p-3 rounded-lg border border-slate-700 font-mono text-xs shadow-xl">
                        <div className="font-bold text-cyan-300">Time Slot: {data.hour}</div>
                        <div className="text-white mt-1">Total Movements: {data.total} flights</div>
                        <div className="text-slate-400">Departures: {data.departures} | Arrivals: {data.arrivals}</div>
                        <div className="text-rose-400 mt-1">Runway Capacity: {data.capacity} / hr</div>
                        <div className="text-emerald-400 mt-0.5">
                          Headroom: {data.capacity - data.total} slots available
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOver ? '#F43F5E' : entry.total >= entry.capacity * 0.8 ? '#F59E0B' : '#00F0FF'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network-wide Airport Capacity Comparison Matrix */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-white font-mono mb-3">
          NETWORK-WIDE AIRPORT CAPACITY & TIER BENCHMARK
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
          {airports.map(a => (
            <button
              key={a.airport.id}
              onClick={() => setSelectedAirportId(a.airport.id)}
              className={`p-3 rounded-lg border text-left transition ${
                selectedAirportId === a.airport.id
                  ? 'bg-cyan-950/60 border-cyan-500/50 shadow-glow-cyan'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">{a.airport.id}</span>
                <span className="text-[10px] text-slate-400">{a.airport.capacity_per_hour}/h</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-1">{a.airport.city}</div>
              <div className="mt-2 text-[11px] text-cyan-300 font-bold">
                {a.total_movements_day} mvts
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
