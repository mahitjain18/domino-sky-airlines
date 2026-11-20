import React, { useState } from 'react';
import { AirlineDataset, ConnectionAnalysis, Flight } from '../types/airline';
import { GitFork } from 'lucide-react';

interface PassengerConnectionsViewProps {
  dataset: AirlineDataset;
  connections: ConnectionAnalysis[];
  flights: Flight[];
  onPriorityEscort: (connId: string) => void;
}

export const PassengerConnectionsView: React.FC<PassengerConnectionsViewProps> = ({
  dataset,
  connections,
  flights,
  onPriorityEscort
}) => {
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tight' | 'broken' | 'valid'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const hubs = Array.from(new Set(connections.map(c => c.airport))).sort();

  const totalTransitPax = connections.reduce((sum, c) => sum + c.passengers, 0);
  const brokenCount = connections.filter(c => c.is_broken).length;
  const tightCount = connections.filter(c => c.is_tight).length;
  const affectedBrokenPax = connections.filter(c => c.is_broken).reduce((sum, c) => sum + c.passengers, 0);
  const affectedTightPax = connections.filter(c => c.is_tight).reduce((sum, c) => sum + c.passengers, 0);

  const filteredConnections = connections.filter(c => {
    const matchesHub = selectedHub === 'all' || c.airport === selectedHub;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      c.connection_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.from_flight.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.to_flight.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.airport.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesHub && matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              PASSENGER CONNECTIONS & MINIMUM CONNECT TIME (MCT)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Rule: Connecting flight must depart ≥ min_connect_minutes after inbound flight arrival • Monitored across {flights.length} active legs in dataset {dataset.meta.dataset}
          </p>
        </div>

        {/* Indicators */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">TOTAL TRANSIT PAX</span>
            <span className="text-cyan-400 font-bold">{totalTransitPax} Pax</span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">BROKEN TRANSITS</span>
            <span className={brokenCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {brokenCount > 0 ? `${brokenCount} (${affectedBrokenPax} pax)` : '0 BROKEN'}
            </span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">TIGHT MARGIN (≤15M)</span>
            <span className="text-amber-400 font-bold">
              {tightCount} Pairs ({affectedTightPax} pax)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="conn-search-input" className="sr-only">Search passenger connections</label>
          <input
            id="conn-search-input"
            type="text"
            placeholder="Search pair, flight..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <label htmlFor="conn-hub-filter" className="sr-only">Filter by Transfer Hub</label>
          <select
            id="conn-hub-filter"
            value={selectedHub}
            onChange={e => setSelectedHub(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Transfer Hubs ({hubs.length})</option>
            {hubs.map(h => (
              <option key={h} value={h}>
                {h} Hub
              </option>
            ))}
          </select>

          <label htmlFor="conn-status-filter" className="sr-only">Filter by MCT Status</label>
          <select
            id="conn-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'tight' | 'broken' | 'valid')}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="valid">Valid MCT Margin</option>
            <option value="tight">Tight Buffer (≤ 15m)</option>
            <option value="broken">Broken / Missed</option>
          </select>
        </div>

        <span className="text-slate-400">
          Showing {filteredConnections.length} of {connections.length} Pairs
        </span>
      </div>

      {/* Connections Table */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Connection ID</th>
                <th className="py-3 px-3">Hub Airport</th>
                <th className="py-3 px-3">Inbound Flight</th>
                <th className="py-3 px-3">Inbound Arr</th>
                <th className="py-3 px-3">Outbound Flight</th>
                <th className="py-3 px-3">Outbound Dep</th>
                <th className="py-3 px-3 text-center">Connect Window</th>
                <th className="py-3 px-3 text-center">Min Req (MCT)</th>
                <th className="py-3 px-3 text-center">Safety Buffer</th>
                <th className="py-3 px-3 text-center">Passengers</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Escort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredConnections.map(cx => {
                const isBroken = cx.is_broken;
                const isTight = cx.is_tight;

                return (
                  <tr
                    key={cx.connection_id}
                    className={`hover:bg-slate-900/60 transition ${
                      isBroken ? 'bg-rose-950/25' : isTight ? 'bg-amber-950/15' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-extrabold text-white">{cx.connection_id}</td>
                    <td className="py-3 px-3 font-bold text-cyan-300">{cx.airport}</td>
                    <td className="py-3 px-3 text-white font-bold">{cx.from_flight}</td>
                    <td className="py-3 px-3 text-slate-300">{cx.from_arr}</td>
                    <td className="py-3 px-3 text-white font-bold">{cx.to_flight}</td>
                    <td className="py-3 px-3 text-slate-300">{cx.to_dep}</td>
                    <td className="py-3 px-3 text-center font-bold text-white">
                      {cx.actual_gap_mins} mins
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      {cx.min_connect_minutes} mins
                    </td>
                    <td
                      className={`py-3 px-3 text-center font-bold ${
                        isBroken
                          ? 'text-rose-400'
                          : isTight
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {cx.buffer_mins >= 0 ? `+${cx.buffer_mins}m` : `${cx.buffer_mins}m`}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-cyan-300">
                      {cx.passengers} pax
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isBroken ? (
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          MISSED / BROKEN
                        </span>
                      ) : isTight ? (
                        <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          TIGHT BUFFER (≤15m)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isTight || isBroken ? (
                        <button
                          onClick={() => onPriorityEscort(cx.connection_id)}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold"
                        >
                          Fast-Track
                        </button>
                      ) : (
                        <span className="text-slate-600">Standard</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
