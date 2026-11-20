import React, { useState } from 'react';
import { AirlineDataset, Flight, TurnaroundAnalysis, FleetAircraftStatus } from '../types/airline';
import {
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plane,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { timeToMinutes } from '../utils/airlineCalculations';

interface AircraftMonitorViewProps {
  dataset: AirlineDataset;
  flights: Flight[];
  turnarounds: TurnaroundAnalysis[];
  fleet: FleetAircraftStatus[];
  onDeploySpare: (spareTail: string, targetTail: string) => void;
  onSimulateDelay: (flightId: string) => void;
}

export const AircraftMonitorView: React.FC<AircraftMonitorViewProps> = ({
  dataset,
  flights,
  turnarounds,
  fleet,
  onDeploySpare,
  onSimulateDelay
}) => {
  const [selectedTail, setSelectedTail] = useState<string>(fleet[0]?.tail_id || 'VT-DS01');
  const [activeTab, setActiveTab] = useState<'timeline' | 'turnarounds' | 'spares'>('timeline');

  const turnaroundMap = new Map<string, TurnaroundAnalysis>();
  for (const t of turnarounds) {
    turnaroundMap.set(t.flight_id, t);
  }

  const selectedAircraft = fleet.find(f => f.tail_id === selectedTail);
  const tightCount = turnarounds.filter(t => t.is_tight).length;
  const violationCount = turnarounds.filter(t => t.is_violation).length;

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              AIRCRAFT ROTATION & TURNAROUND MONITOR
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Mandatory minimum turnaround: 30 minutes • 16 Active Tails (VT-DS01 to VT-DS16) + 2 Standby Spares
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">30M ADHERENCE</span>
            <span className={violationCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {violationCount > 0 ? `${violationCount} VIOLATIONS` : '100% PASS'}
            </span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">TIGHT (30-35M)</span>
            <span className="text-amber-400 font-bold">{tightCount} LEGS</span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">STANDBY RESERVES</span>
            <span className="text-cyan-400 font-bold">VT-DS17 / VT-DS18</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition ${
            activeTab === 'timeline'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Daily Flight Leg Timelines
        </button>
        <button
          onClick={() => setActiveTab('turnarounds')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition ${
            activeTab === 'turnarounds'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Turnaround Verification Matrix (All Legs)
        </button>
        <button
          onClick={() => setActiveTab('spares')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition ${
            activeTab === 'spares'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Spare Aircraft Management (BLR & DEL)
        </button>
      </div>

      {/* Tab 1: Gantt Visual Timeline of Aircraft Rotations */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Aircraft Selector Sidebar (3 cols) */}
          <div className="lg:col-span-3 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col max-h-[640px]">
            <div className="font-mono text-xs font-bold text-slate-300 pb-2 border-b border-slate-800 mb-2">
              FLEET ROTATIONS ({fleet.length})
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {fleet.map(ac => (
                <button
                  key={ac.tail_id}
                  onClick={() => setSelectedTail(ac.tail_id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition flex items-center justify-between ${
                    selectedTail === ac.tail_id
                      ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <span>{ac.tail_id}</span>
                    <span className="text-[10px] block text-slate-500">
                      {ac.legs_count} legs • {ac.first_dep} - {ac.last_arr}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      ac.status === 'delayed'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {ac.status.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline & Legs Detail (9 cols) */}
          <div className="lg:col-span-9 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col">
            {selectedAircraft ? (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-white font-mono">
                        {selectedAircraft.tail_id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                        Airbus A320 (180 Seats)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Total Block: {(selectedAircraft.total_block_minutes / 60).toFixed(1)} hrs • Pax: {selectedAircraft.total_pax} • Avg Load: {selectedAircraft.avg_load_factor}%
                    </p>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="text-slate-400">Station At EOD:</span>{' '}
                    <span className="text-cyan-400 font-bold">{selectedAircraft.current_location}</span>
                  </div>
                </div>

                {/* Visual Gantt Bar of the Operating Day (06:00 to 22:00 = 960 mins) */}
                <div className="my-6 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
                    <span>TIMELINE SCHEDULE (06:00 - 22:00 IST)</span>
                    <span className="text-[10px] text-cyan-400">■ Flight Sector | ▯ Ground Turnaround</span>
                  </div>

                  <div className="relative w-full h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center px-1">
                    {/* Hour Grid Markers */}
                    {[6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => {
                      const leftPercent = ((hour - 6) / 16) * 100;
                      return (
                        <div
                          key={hour}
                          className="absolute top-0 bottom-0 border-l border-slate-800 text-[9px] text-slate-600 pl-1 font-mono"
                          style={{ left: `${leftPercent}%` }}
                        >
                          {hour}:00
                        </div>
                      );
                    })}

                    {/* Flight Blocks */}
                    {selectedAircraft.flights.map(leg => {
                      const startMins = timeToMinutes(leg.actual_dep || leg.dep);
                      const endMins = timeToMinutes(leg.actual_arr || leg.arr);
                      // Timeline spans 06:00 (360) to 22:00 (1320) = 960 mins
                      const leftPct = Math.max(0, ((startMins - 360) / 960) * 100);
                      const widthPct = Math.max(2, ((endMins - startMins) / 960) * 100);

                      const isDelayed = (leg.delay_minutes || 0) > 0;

                      return (
                        <div
                          key={leg.flight_id}
                          className={`absolute h-8 rounded text-[10px] font-mono flex items-center justify-center font-bold px-1 overflow-hidden transition shadow-lg ${
                            isDelayed
                              ? 'bg-rose-600 text-white'
                              : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                          }`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`${leg.flight_id}: ${leg.origin} -> ${leg.destination} (${leg.dep}-${leg.arr})`}
                        >
                          <span className="truncate">{leg.flight_id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sequential Leg Order Card Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-300">
                    SEQUENTIAL FLIGHT LEGS & TURNAROUND INTERVALS
                  </h4>

                  {selectedAircraft.flights.map((leg, index) => {
                    const ta = turnaroundMap.get(leg.flight_id);
                    const isDelayed = (leg.delay_minutes || 0) > 0;

                    return (
                      <div
                        key={leg.flight_id}
                        className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs font-mono flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/20">
                            {leg.leg_order}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white text-sm">
                                {leg.flight_id}
                              </span>
                              <span className="text-slate-400">
                                {leg.origin} → {leg.destination}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              DEP: {leg.actual_dep || leg.dep} | ARR: {leg.actual_arr || leg.arr} ({leg.block_minutes} mins)
                            </div>
                          </div>
                        </div>

                        {/* Turnaround Status Before this flight */}
                        {index > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 text-[11px]">Turnaround:</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                ta?.is_violation
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : ta?.is_tight
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {ta?.actual_gap_mins} mins
                              {ta?.is_violation
                                ? ' ✗ (< 30m MIN)'
                                : ta?.is_tight
                                ? ' ⚠ TIGHT (30-35m)'
                                : ' ✓ COMPLIANT'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">First Rotation Leg</span>
                        )}

                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-400 font-bold">
                            {leg.pax} pax ({Math.round((leg.pax / 180) * 100)}%)
                          </span>
                          <button
                            onClick={() => onSimulateDelay(leg.flight_id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                          >
                            Simulate Delay
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono">
                Select an aircraft to view rotation timeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Full Turnaround Verification Matrix (Table) */}
      {activeTab === 'turnarounds' && (
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                TURNAROUND DURATION VALIDATION (RULE: MINIMUM 30 MINUTES)
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Every subsequent leg must depart ≥ 30 minutes after previous leg arrival
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              DGCA Certified Safety Protocol
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Tail ID</th>
                  <th className="py-2.5 px-3">Flight ID</th>
                  <th className="py-2.5 px-3">Leg</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Prev Flight</th>
                  <th className="py-2.5 px-3 text-center">Turnaround Duration</th>
                  <th className="py-2.5 px-3 text-center">Rule Min</th>
                  <th className="py-2.5 px-3 text-center">Validation Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {turnarounds.map(t => {
                  const isViolation = t.is_violation;
                  const isTight = t.is_tight;

                  return (
                    <tr
                      key={t.flight_id}
                      className={`hover:bg-slate-900/60 transition ${
                        isViolation ? 'bg-rose-950/20' : isTight ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{t.tail_id}</td>
                      <td className="py-2.5 px-3 text-cyan-300 font-bold">{t.flight_id}</td>
                      <td className="py-2.5 px-3 text-slate-400">{t.prev_flight_id ? 'Subsequent' : 'Origin Leg 1'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{t.origin}</td>
                      <td className="py-2.5 px-3 text-slate-400">{t.prev_flight_id || 'None'}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {t.actual_gap_mins !== null ? `${t.actual_gap_mins} mins` : '--'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{t.min_required_mins} mins</td>
                      <td className="py-2.5 px-3 text-center">
                        {t.actual_gap_mins === null ? (
                          <span className="text-slate-500">First Leg</span>
                        ) : isViolation ? (
                          <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            VIOLATION (&lt;30m)
                          </span>
                        ) : isTight ? (
                          <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            TIGHT (30-35m)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            COMPLIANT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSimulateDelay(t.flight_id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700"
                        >
                          Delay Test
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Spare Aircraft Management (VT-DS17 & VT-DS18) */}
      {activeTab === 'spares' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dataset.spare_aircraft.map(spare => (
            <div
              key={spare.tail_id}
              className="glass-panel p-6 rounded-xl border border-amber-500/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-5 h-5 text-amber-400" />
                    <span className="text-lg font-bold font-mono text-white">
                      HOT-STANDBY: {spare.tail_id}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    READY FOR DISPATCH
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 font-mono text-xs">
                  <div className="p-3 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Strategic Base Hub:</span>
                    <span className="text-white font-bold text-sm">{spare.base} (Kempegowda/IGI)</span>
                  </div>
                  <div className="p-3 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Availability Window:</span>
                    <span className="text-cyan-400 font-bold text-sm">From {spare.available_from} IST</span>
                  </div>
                  <div className="p-3 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Seating Capacity:</span>
                    <span className="text-white font-bold text-sm">{spare.seats} Economy Seats</span>
                  </div>
                  <div className="p-3 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Readiness State:</span>
                    <span className="text-emerald-400 font-bold text-sm">Fueled & Pre-Flighted</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {spare.base === 'DEL'
                    ? 'Stationed at Delhi mega-hub to provide instant rescue capacity for northern rotations (VT-DS01, VT-DS02, VT-DS03, VT-DS09, VT-DS11) in case of weather delays or crew duty cap breaches.'
                    : 'Stationed at Bengaluru mega-hub to back up southern rotations (VT-DS05, VT-DS06, VT-DS07, VT-DS08, VT-DS13, VT-DS14, VT-DS16) and secure key passenger transfers.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Dispatch Response: &lt; 25 mins</span>
                <button
                  onClick={() => onDeploySpare(spare.tail_id, spare.base === 'DEL' ? 'VT-DS03' : 'VT-DS06')}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-xs transition shadow-lg flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Standby Swap</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
