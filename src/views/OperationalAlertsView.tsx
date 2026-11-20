import React, { useState } from 'react';
import { OperationalAlert, Flight, CrewDutyAnalysis, TurnaroundAnalysis, ConnectionAnalysis } from '../types/airline';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Search
} from 'lucide-react';

interface OperationalAlertsViewProps {
  alerts: OperationalAlert[];
  flights: Flight[];
  crews: CrewDutyAnalysis[];
  turnarounds: TurnaroundAnalysis[];
  connections: ConnectionAnalysis[];
  onSelectFlightForDelay: (flightId: string) => void;
}

export const OperationalAlertsView: React.FC<OperationalAlertsViewProps> = ({
  alerts,
  flights,
  crews,
  turnarounds,
  connections,
  onSelectFlightForDelay
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'advisory'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (searchTerm) {
      const match =
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.targetId?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const advisoryCount = alerts.filter(a => a.severity === 'advisory').length;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1720px] mx-auto select-none font-mono">
      {/* Top Banner */}
      <div className="atc-panel p-3.5 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-[#0A1422] border border-[#FFB547]/40 flex items-center justify-center text-[#FFB547]">
            <BellRing className="w-4 h-4 text-[#FFB547]" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#EAF4FF] tracking-wider flex items-center space-x-2">
              <span>OPERATIONAL ALERTS & DGCA COMPLIANCE LOG</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40">
                ACTIVE SCAN
              </span>
            </div>
            <div className="text-[10px] text-[#8498AD]">
              Continuous network validation across {flights.length} flights, {crews.length} crews, {turnarounds.length} turnarounds, and {connections.length} connections.
            </div>
          </div>
        </div>

        {/* Severity Metrics */}
        <div className="flex items-center space-x-2 text-[11px]">
          <div className="bg-[#0A1422] px-2.5 py-1 rounded border border-[#1E3048]">
            <span className="text-[#FF5364] font-bold">{criticalCount} Critical</span>
          </div>
          <div className="bg-[#0A1422] px-2.5 py-1 rounded border border-[#1E3048]">
            <span className="text-[#FFB547] font-bold">{warningCount} Warnings</span>
          </div>
          <div className="bg-[#0A1422] px-2.5 py-1 rounded border border-[#1E3048]">
            <span className="text-[#00D9FF] font-bold">{advisoryCount} Advisories</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="atc-panel p-2.5 rounded flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          {(['all', 'critical', 'warning', 'advisory'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded uppercase font-bold text-[10px] transition ${
                severityFilter === sev
                  ? 'bg-[#00D9FF] text-[#050B14]'
                  : 'bg-[#0A1422] text-[#8498AD] hover:text-white border border-[#1E3048]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8498AD] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by flight, crew, or hub..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#0A1422] text-white placeholder-[#8498AD]/60 pl-8 pr-3 py-1 rounded border border-[#1E3048] text-xs focus:outline-none focus:border-[#00D9FF]"
          />
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="atc-panel p-8 rounded text-center">
            <CheckCircle2 className="w-8 h-8 text-[#22D3A6] mx-auto mb-2" />
            <div className="text-sm font-bold text-white">All Airspace Operations Running Nominal</div>
            <p className="text-xs text-[#8498AD] mt-1">
              Zero safety rule violations detected under current operational filter.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded bg-[#101D2D] border transition text-xs ${
                  isCritical
                    ? 'border-[#FF5364]/60 bg-[#FF5364]/5'
                    : isWarning
                    ? 'border-[#FFB547]/50 bg-[#FFB547]/5'
                    : 'border-[#1E3048]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-[#FF5364]/20 text-[#FF5364]'
                          : isWarning
                          ? 'bg-[#FFB547]/20 text-[#FFB547]'
                          : 'bg-[#00D9FF]/20 text-[#00D9FF]'
                      }`}
                    >
                      {isCritical ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold text-sm ${
                            isCritical ? 'text-[#FF5364]' : isWarning ? 'text-[#FFB547]' : 'text-[#00D9FF]'
                          }`}
                        >
                          {alert.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0A1422] text-[#8498AD] border border-[#1E3048] uppercase">
                          {alert.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[#EAF4FF] mt-1 text-xs leading-relaxed">{alert.message}</p>

                      {/* Actionable Strategy Box */}
                      {alert.actionableRecommendation && (
                        <div className="mt-2 p-2 rounded bg-[#0A1422] border border-[#1E3048] text-[11px] text-[#8498AD]">
                          <span className="text-[#00D9FF] font-bold block mb-0.5">Recommended Tactical Action:</span>
                          {alert.actionableRecommendation}
                        </div>
                      )}
                    </div>
                  </div>

                  {alert.targetId && (
                    <button
                      onClick={() => alert.targetId && onSelectFlightForDelay(alert.targetId)}
                      className="shrink-0 px-2.5 py-1.5 rounded bg-[#0A1422] hover:bg-[#1A3065] border border-[#1E3048] text-[#00D9FF] text-[10px] font-bold transition flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
                    >
                      <span>TEST DISRUPTION</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
