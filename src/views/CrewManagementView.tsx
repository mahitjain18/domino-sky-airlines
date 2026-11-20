import React, { useState } from 'react';
import { AirlineDataset, CrewDutyAnalysis, Flight } from '../types/airline';
import {
  Users,
  Sparkles
} from 'lucide-react';

interface CrewManagementViewProps {
  dataset: AirlineDataset;
  crews: CrewDutyAnalysis[];
  flights: Flight[];
  onReliefCrewSim: (crewId: string) => void;
}

export const CrewManagementView: React.FC<CrewManagementViewProps> = ({
  dataset,
  crews,
  flights,
  onReliefCrewSim
}) => {
  const [selectedBase, setSelectedBase] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<boolean>(false);

  const flightMap = new Map<string, Flight>();
  for (const f of flights) {
    flightMap.set(f.flight_id, f);
  }

  const bases = Array.from(new Set(crews.map(c => c.base))).sort();

  const filteredCrews = crews.filter(c => {
    const matchesBase = selectedBase === 'all' || c.base === selectedBase;
    const matchesRisk = !filterRisk || c.is_high_risk || c.is_violation;
    return matchesBase && matchesRisk;
  });

  const violationsCount = crews.filter(c => c.is_violation).length;
  const highRiskCount = crews.filter(c => c.is_high_risk).length;

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              CREW DUTY & LEGAL REST COMPLIANCE (DGCA 600-MIN CAP)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Rule: Duty runs from duty_start until scheduled arrival of last flight (Max 600 mins / 10 hours) • {dataset.meta.dataset}
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">TOTAL CREWS</span>
            <span className="text-white font-bold">{crews.length} Crews</span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">DUTY BREACHES</span>
            <span className={violationsCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {violationsCount > 0 ? `${violationsCount} ILLEGAL` : '0 VIOLATIONS'}
            </span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">HIGH RISK (≥90%)</span>
            <span className="text-amber-400 font-bold">{highRiskCount} CREWS</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <label htmlFor="crew-base-select" className="text-slate-400">
            Filter Base:
          </label>
          <select
            id="crew-base-select"
            value={selectedBase}
            onChange={e => setSelectedBase(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Bases (10)</option>
            {bases.map(b => (
              <option key={b} value={b}>
                {b} Base
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setFilterRisk(!filterRisk)}
          className={`px-3 py-1 rounded transition border ${
            filterRisk
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {filterRisk ? '✓ Showing High Risk Only' : 'Show High Risk Only (≥90% Duty)'}
        </button>
      </div>

      {/* Crew Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCrews.map(crew => {
          const isViolation = crew.is_violation;
          const isHighRisk = crew.is_high_risk;

          return (
            <div
              key={crew.crew_id}
              className={`p-5 rounded-xl border flex flex-col justify-between font-mono text-xs transition ${
                isViolation
                  ? 'bg-rose-950/25 border-rose-500/50 shadow-glow-rose'
                  : isHighRisk
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-glow-amber'
                  : 'glass-panel border-slate-800/80 hover:border-cyan-500/30'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-extrabold text-white">
                      {crew.crew_id}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      Base: {crew.base}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isViolation
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : isHighRisk
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isViolation
                      ? 'ILLEGAL BREACH'
                      : isHighRisk
                      ? 'HIGH RISK'
                      : 'COMPLIANT'}
                  </span>
                </div>

                {/* Duty Meter */}
                <div className="my-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Scheduled Duty:</span>
                    <span
                      className={`font-bold ${
                        isViolation
                          ? 'text-rose-400'
                          : isHighRisk
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {crew.total_duty_mins} / {crew.max_duty_mins} mins ({crew.utilization_percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isViolation
                          ? 'bg-rose-500'
                          : isHighRisk
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, crew.utilization_percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>Duty Start: {crew.duty_start}</span>
                    <span>Last Arr: {crew.last_arr}</span>
                    <span className={crew.remaining_duty_mins <= 30 ? 'text-amber-400 font-bold' : ''}>
                      {crew.remaining_duty_mins >= 0 ? `${crew.remaining_duty_mins}m buffer` : `+${Math.abs(crew.remaining_duty_mins)}m over`}
                    </span>
                  </div>
                </div>

                {/* Assigned Flights */}
                <div className="mt-3">
                  <div className="text-[10px] uppercase text-slate-500 mb-1.5">
                    Assigned Aircraft: <span className="text-cyan-300 font-bold">{crew.tail_id}</span> ({crew.flight_ids.length} legs)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {crew.flight_ids.map(fid => {
                      const f = flightMap.get(fid);
                      return (
                        <span
                          key={fid}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                          title={f ? `${f.origin} -> ${f.destination} (${f.dep}-${f.arr})` : fid}
                        >
                          {fid} ({f ? `${f.origin}-${f.destination}` : ''})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action / Warning Notice */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {isHighRisk && (
                  <div className="mb-2 p-2 rounded bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300/90 font-sans">
                    ⚠ Safety buffer is under 60 mins. Any delay on {crew.tail_id} will push duty past the 600m threshold.
                  </div>
                )}
                {isViolation && (
                  <div className="mb-2 p-2 rounded bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 font-sans font-bold">
                    🚨 DGCA Safety Limit Breached! Ground crew replacement required.
                  </div>
                )}

                <button
                  onClick={() => onReliefCrewSim(crew.crew_id)}
                  className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition border border-slate-700 flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assign Standby Crew Relief</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
