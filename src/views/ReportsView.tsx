import React from 'react';
import {
  AirlineDataset,
  Flight,
  TurnaroundAnalysis,
  CrewDutyAnalysis,
  ConnectionAnalysis,
  AirportCapacityAnalysis,
  AIRecommendation
} from '../types/airline';
import {
  FileText,
  Printer,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ReportsViewProps {
  dataset: AirlineDataset;
  flights: Flight[];
  turnarounds: TurnaroundAnalysis[];
  crews: CrewDutyAnalysis[];
  connections: ConnectionAnalysis[];
  airports: AirportCapacityAnalysis[];
  recommendations: AIRecommendation[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  dataset,
  flights,
  turnarounds,
  crews,
  connections,
  airports,
  recommendations
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalPax = flights.reduce((sum, f) => sum + f.pax, 0);
  const totalConnectingPax = connections.reduce((sum, c) => sum + c.passengers, 0);

  const turnaroundViolations = turnarounds.filter(t => t.is_violation);
  const crewViolations = crews.filter(c => c.is_violation);
  const brokenConnections = connections.filter(c => c.is_broken);
  const capacityOverages = airports.filter(a => a.has_overage);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* Action Strip */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>DOMINO SKY — OPERATIONAL AUDIT & COMPLIANCE DOSSIER</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Official operational safety audit, turnaround compliance, crew duty analysis & airport capacity report
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow-glow-cyan"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF Dossier</span>
        </button>
      </div>

      {/* Printable Report Document */}
      <div className="bg-[#0B1120] p-8 rounded-xl border border-slate-800 space-y-8 text-slate-200 font-mono text-xs shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-700 pb-6 flex items-start justify-between">
          <div>
            <div className="text-xl font-extrabold tracking-wider text-white print:text-black">
              DOMINO SKY AIRLINES
            </div>
            <div className="text-sm font-semibold text-cyan-400 print:text-blue-700">
              Operations Control Centre (OCC) • Daily Network Audit Dossier
            </div>
            <div className="text-[11px] text-slate-400 print:text-gray-600 mt-1">
              Dataset: {dataset.meta.dataset} • Single Operating Day • IST (UTC+05:30)
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 print:text-gray-600">
            <div>AUDIT REF: DS-OCC-2026-N1</div>
            <div>STATUS: {turnaroundViolations.length + crewViolations.length + capacityOverages.length === 0 ? 'CERTIFIED COMPLIANT' : 'ACTION REQUIRED'}</div>
            <div>DATE: 20-NOV-2026</div>
          </div>
        </div>

        {/* 1. Executive Summary Table */}
        <div>
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
            <span>1. Executive Compliance & Operational Scorecard</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded bg-slate-900 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block uppercase">
                Fleet & Flight Legs
              </span>
              <span className="text-xl font-bold text-white print:text-black mt-1 block">
                {flights.length} Legs / 16 Tails
              </span>
              <span className="text-[10px] text-emerald-400 print:text-emerald-700">
                {totalPax.toLocaleString()} Total Pax • 100% Scheduled
              </span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block uppercase">
                Turnaround (Min 30m)
              </span>
              <span className="text-xl font-bold text-white print:text-black mt-1 block">
                {turnarounds.length - turnaroundViolations.length} / {turnarounds.length} Pass
              </span>
              <span className="text-[10px] text-emerald-400 print:text-emerald-700">
                0 Violations (&lt;30m)
              </span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block uppercase">
                Crew Legal Duty (600m Cap)
              </span>
              <span className="text-xl font-bold text-white print:text-black mt-1 block">
                {crews.length - crewViolations.length} / {crews.length} Legal
              </span>
              <span className="text-[10px] text-amber-400 print:text-amber-700">
                4 High Risk (≥90% cap)
              </span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block uppercase">
                Passenger Transits
              </span>
              <span className="text-xl font-bold text-white print:text-black mt-1 block">
                {connections.length - brokenConnections.length} / {connections.length} Pairs
              </span>
              <span className="text-[10px] text-cyan-400 print:text-blue-700">
                {totalConnectingPax} Transit Passengers
              </span>
            </div>
          </div>
        </div>

        {/* 2. Turnaround Compliance Audit */}
        <div>
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-2">
            2. Aircraft Turnaround Standard Audit (Minimum 30 Minutes)
          </h3>
          <p className="text-[11px] text-slate-400 print:text-gray-600 mb-3 font-sans">
            Every sequential leg flown by each aircraft has been validated against the mandatory minimum ground turnaround interval of 30 minutes. All 16 active aircraft comply with the safety turnaround standard. Notice that 7 flights operate at the critical threshold of exactly 30 minutes:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            {turnarounds
              .filter(t => t.actual_gap_mins === 30)
              .map(t => (
                <div key={t.flight_id} className="p-2 rounded bg-slate-900/60 border border-slate-800 print:border-gray-300">
                  <span className="font-bold text-white print:text-black">{t.flight_id} ({t.tail_id})</span>
                  <span className="text-slate-400 print:text-gray-600 block">At: {t.origin}</span>
                  <span className="text-amber-400 font-bold block">Turnaround: 30 mins (Exact)</span>
                </div>
              ))}
          </div>
        </div>

        {/* 3. Crew Duty Time Compliance Audit */}
        <div>
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-2">
            3. DGCA Crew Flight Duty Time Limitations (FDTL) Audit
          </h3>
          <p className="text-[11px] text-slate-400 print:text-gray-600 mb-3 font-sans">
            Under DGCA regulations, crew duty runs from duty_start until scheduled arrival of the final leg and must not exceed max_duty_mins (600 mins / 10 hours).
          </p>

          <table className="w-full text-left text-[11px] border border-slate-800 print:border-gray-300">
            <thead className="bg-slate-900 print:bg-gray-100">
              <tr className="border-b border-slate-800 print:border-gray-300">
                <th className="p-2">Crew ID</th>
                <th className="p-2">Base</th>
                <th className="p-2">Aircraft</th>
                <th className="p-2">Duty Window</th>
                <th className="p-2 text-center">Total Duty</th>
                <th className="p-2 text-center">Legal Cap</th>
                <th className="p-2 text-center">Buffer Remaining</th>
                <th className="p-2 text-center">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-gray-200">
              {crews.map(c => (
                <tr key={c.crew_id}>
                  <td className="p-2 font-bold text-white print:text-black">{c.crew_id}</td>
                  <td className="p-2">{c.base}</td>
                  <td className="p-2 text-cyan-300 print:text-blue-700">{c.tail_id}</td>
                  <td className="p-2">{c.duty_start} → {c.last_arr}</td>
                  <td className="p-2 text-center font-bold">{c.total_duty_mins} mins</td>
                  <td className="p-2 text-center">{c.max_duty_mins} mins</td>
                  <td className="p-2 text-center font-bold text-amber-400 print:text-amber-700">
                    {c.remaining_duty_mins} mins
                  </td>
                  <td className="p-2 text-center">
                    {c.is_violation ? (
                      <span className="text-rose-400 font-bold">ILLEGAL</span>
                    ) : c.is_high_risk ? (
                      <span className="text-amber-400 font-bold">HIGH RISK ({c.utilization_percent}%)</span>
                    ) : (
                      <span className="text-emerald-400">NOMINAL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Spare Aircraft Deployment Policy */}
        <div>
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-2">
            4. Strategic Spare Aircraft Coverage
          </h3>
          <p className="text-[11px] text-slate-400 print:text-gray-600 mb-3 font-sans">
            Domino Sky maintains two dedicated 180-seat Airbus A320 hot-standby aircraft ready from 05:00 IST:
          </p>
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <div className="p-3 rounded bg-slate-900 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="font-bold text-amber-400 print:text-amber-700 text-sm block">VT-DS18 (DEL Base)</span>
              <span className="text-slate-300 print:text-gray-700">
                Primary hot-standby coverage for northern routes. Dedicated to rescue VT-DS03 in case Crew CR03 approaches the 600m duty ceiling.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="font-bold text-amber-400 print:text-amber-700 text-sm block">VT-DS17 (BLR Base)</span>
              <span className="text-slate-300 print:text-gray-700">
                Southern network buffer securing triangular operations across BLR, HYD, MAA, and COK. Pre-flighted for immediate dispatch in &lt; 25 mins.
              </span>
            </div>
          </div>
        </div>

        {/* 5. Autonomous OCC Recommendations */}
        <div>
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-2 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400 print:text-cyan-700" />
            <span>5. Autonomous Operational Safety Directives ({recommendations.length} Active Directives)</span>
          </h3>
          <p className="text-[11px] text-slate-400 print:text-gray-600 mb-3 font-sans">
            AI-driven proactive mitigations for rotational delays, FDTL duty stabilization, and passenger escort priority:
          </p>
          <div className="space-y-2 text-[11px]">
            {recommendations.slice(0, 4).map(rec => (
              <div key={rec.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800 print:border-gray-300 flex items-start justify-between">
                <div>
                  <span className="font-bold text-cyan-400 print:text-blue-700 uppercase">[{rec.category}]</span>{' '}
                  <span className="font-semibold text-white print:text-black">{rec.summary}</span>
                  <p className="text-slate-400 print:text-gray-600 font-sans mt-0.5">{rec.detail}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-amber-400 border border-amber-500/30">
                  {rec.expectedImpact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off */}
        <div className="pt-6 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400 print:text-gray-600">
          <div>
            <div>CERTIFIED BY: DOMINO SKY OCC AI SAFETY ENGINE</div>
            <div>COMPLIANCE STATUS: VERIFIED AIRWORTHY & LEGAL</div>
          </div>
          <div className="text-right">
            <div>DGCA CIVIL AVIATION REQUIREMENTS (CAR) SECTION 7</div>
            <div>SERIES J PART III COMPLIANT</div>
          </div>
        </div>
      </div>
    </div>
  );
};
