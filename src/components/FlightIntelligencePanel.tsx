import React from 'react';
import {
  Flight,
  CrewDutyAnalysis,
  TurnaroundAnalysis,
  ConnectionAnalysis,
  AIRecommendation
} from '../types/airline';
import {
  Users,
  Plane,
  Sparkles,
  Sliders
} from 'lucide-react';

interface FlightIntelligencePanelProps {
  flight: Flight;
  allFlights?: Flight[];
  crews: CrewDutyAnalysis[];
  turnarounds: TurnaroundAnalysis[];
  connections: ConnectionAnalysis[];
  recommendations: AIRecommendation[];
  onSimulateDelayForFlight: (flightId: string) => void;
  onDeploySpareForFlight?: (tailId: string) => void;
}

export const FlightIntelligencePanel: React.FC<FlightIntelligencePanelProps> = ({
  flight,
  crews,
  turnarounds,
  connections,
  recommendations,
  onSimulateDelayForFlight,
  onDeploySpareForFlight
}) => {
  // Find assigned crew
  const assignedCrew = crews.find(c => c.tail_id === flight.tail_id);

  // Find turnaround analysis for this flight
  const turnaround = turnarounds.find(t => t.flight_id === flight.flight_id);

  // Find inbound & outbound connections
  const inboundConnections = connections.filter(c => c.to_flight === flight.flight_id);
  const outboundConnections = connections.filter(c => c.from_flight === flight.flight_id);
  const totalConnectingPax =
    inboundConnections.reduce((s, c) => s + c.passengers, 0) +
    outboundConnections.reduce((s, c) => s + c.passengers, 0);

  // Operational Risk Score calculation
  const isDelayed = (flight.delay_minutes || 0) > 0;
  const isCrewHighRisk = assignedCrew?.is_high_risk || assignedCrew?.is_violation;
  const isTurnaroundTight = turnaround?.is_tight || turnaround?.is_violation;
  const isConnectionTight =
    inboundConnections.some(c => c.is_tight || c.is_broken) ||
    outboundConnections.some(c => c.is_tight || c.is_broken);

  const riskLevel: 'CRITICAL' | 'ELEVATED' | 'NOMINAL' =
    isDelayed || assignedCrew?.is_violation || turnaround?.is_violation
      ? 'CRITICAL'
      : isCrewHighRisk || isTurnaroundTight || isConnectionTight
      ? 'ELEVATED'
      : 'NOMINAL';

  // Find relevant AI recommendation
  const relevantRec = recommendations.find(
    r =>
      r.detail.includes(flight.flight_id) ||
      r.detail.includes(flight.tail_id) ||
      (assignedCrew && r.detail.includes(assignedCrew.crew_id)) ||
      r.detail.includes(flight.origin)
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#101D2D] border border-[#1E3048] rounded text-xs font-mono select-none overflow-y-auto">
      {/* Panel Header */}
      <div className="p-3 bg-[#0A1422] border-b border-[#1E3048] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Plane className="w-4 h-4 text-[#00D9FF]" />
          <span className="font-bold text-[#EAF4FF] tracking-wider">TACTICAL TELEMETRY</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            riskLevel === 'CRITICAL'
              ? 'bg-[#FF5364]/20 text-[#FF5364] border border-[#FF5364]/40'
              : riskLevel === 'ELEVATED'
              ? 'bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40'
              : 'bg-[#22D3A6]/20 text-[#22D3A6] border border-[#22D3A6]/40'
          }`}
        >
          {riskLevel} RISK
        </span>
      </div>

      <div className="p-3.5 space-y-3.5 flex-1">
        {/* Flight Call Sign & Tail Identification */}
        <div className="p-3 rounded bg-[#0A1422] border border-[#1E3048]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-black text-[#00D9FF]">{flight.flight_id}</div>
              <div className="text-[10px] text-[#8498AD]">
                Aircraft: <span className="text-[#EAF4FF] font-bold">{flight.tail_id}</span> (A320)
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-[#EAF4FF]">
                Leg {flight.leg_order} of Sequence
              </div>
              <div className="text-[10px] text-[#22D3A6]">
                {flight.pax} Booked Pax (180 Cap)
              </div>
            </div>
          </div>

          {/* Sector Route Bar */}
          <div className="mt-3 pt-2.5 border-t border-[#1E3048] flex items-center justify-between text-[11px]">
            <div className="text-left">
              <div className="text-sm font-bold text-white">{flight.origin}</div>
              <div className="text-[10px] text-[#00D9FF]">DEP {flight.actual_dep || flight.dep}</div>
            </div>
            <div className="flex flex-col items-center px-3 text-[#8498AD]">
              <span className="text-[9px]">{flight.block_minutes} mins</span>
              <div className="w-16 h-px bg-[#00D9FF]/40 relative my-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] absolute -top-[2px] left-1/2 -translate-x-1/2" />
              </div>
              <span className="text-[9px]">Enroute</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{flight.destination}</div>
              <div className="text-[10px] text-[#00D9FF]">ARR {flight.actual_arr || flight.arr}</div>
            </div>
          </div>
        </div>

        {/* Assigned Crew Duty Telemetry */}
        <div className="p-3 rounded bg-[#0A1422] border border-[#1E3048]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8498AD] uppercase font-bold flex items-center space-x-1">
              <Users className="w-3 h-3 text-[#00D9FF]" />
              <span>Assigned Crew Roster</span>
            </span>
            <span className="text-[10px] text-[#00D9FF] font-bold">{assignedCrew?.crew_id || 'CR--'}</span>
          </div>
          {assignedCrew ? (
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-[#8498AD]">Base Station:</span>
                <span className="text-white font-bold">{assignedCrew.base}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-[#8498AD]">FDTL Duty Hours:</span>
                <span
                  className={`font-bold ${
                    assignedCrew.is_violation
                      ? 'text-[#FF5364]'
                      : assignedCrew.is_high_risk
                      ? 'text-[#FFB547]'
                      : 'text-[#22D3A6]'
                  }`}
                >
                  {assignedCrew.total_duty_mins} / {assignedCrew.max_duty_mins}m ({assignedCrew.utilization_percent}%)
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#101D2D] rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${
                    assignedCrew.is_violation
                      ? 'bg-[#FF5364]'
                      : assignedCrew.is_high_risk
                      ? 'bg-[#FFB547]'
                      : 'bg-[#22D3A6]'
                  }`}
                  style={{ width: `${Math.min(100, assignedCrew.utilization_percent)}%` }}
                />
              </div>
              <div className="text-[9px] text-[#8498AD] mt-1 text-right">
                {assignedCrew.remaining_duty_mins}m safety buffer remaining
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#8498AD]">Standard roster assigned</div>
          )}
        </div>

        {/* Turnaround & Connection Telemetry */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {/* Turnaround Status */}
          <div className="p-2.5 rounded bg-[#0A1422] border border-[#1E3048]">
            <span className="text-[#8498AD] block uppercase">30m Turnaround</span>
            <span
              className={`text-xs font-bold block mt-1 ${
                turnaround?.is_violation
                  ? 'text-[#FF5364]'
                  : turnaround?.is_tight
                  ? 'text-[#FFB547]'
                  : 'text-[#22D3A6]'
              }`}
            >
              {turnaround?.actual_gap_mins !== null ? `${turnaround?.actual_gap_mins}m Gap` : 'First Leg'}
            </span>
            <span className="text-[9px] text-[#8498AD] mt-0.5 block">
              {turnaround?.is_violation
                ? 'DGCA Violation'
                : turnaround?.is_tight
                ? '30-35m Tight Buffer'
                : 'Full Safety Buffer'}
            </span>
          </div>

          {/* Connection Status */}
          <div className="p-2.5 rounded bg-[#0A1422] border border-[#1E3048]">
            <span className="text-[#8498AD] block uppercase">Transit Pax Feed</span>
            <span className="text-xs font-bold text-[#00D9FF] block mt-1">
              {totalConnectingPax} Transit Pax
            </span>
            <span className="text-[9px] text-[#8498AD] mt-0.5 block">
              {inboundConnections.length + outboundConnections.length} Transfer Pairs
            </span>
          </div>
        </div>

        {/* Contextual AI Recommendation Box */}
        {relevantRec && (
          <div className="p-3 rounded bg-[#0A1422] border border-[#247BFF]/40 text-[10px]">
            <div className="flex items-center space-x-1.5 text-[#00D9FF] font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>AI Action Protocol: {relevantRec.category}</span>
            </div>
            <p className="text-[#EAF4FF] leading-snug">{relevantRec.summary}</p>
            <p className="text-[#8498AD] mt-1 leading-tight">{relevantRec.suggestedAction}</p>
          </div>
        )}

        {/* Tactical Actions */}
        <div className="pt-2 border-t border-[#1E3048] space-y-2">
          {onDeploySpareForFlight && isDelayed && (
            <button
              onClick={() => onDeploySpareForFlight(flight.tail_id)}
              className="w-full py-2 rounded bg-[#061C18] hover:bg-[#0A2E27] border border-[#22D3A6]/50 text-[#22D3A6] hover:text-white font-bold flex items-center justify-center space-x-1.5 transition focus-visible:ring-2 focus-visible:ring-[#22D3A6] focus-visible:outline-none"
            >
              <span>AUTHORIZE STANDBY SPARE SWAP</span>
            </button>
          )}
          <button
            onClick={() => onSimulateDelayForFlight(flight.flight_id)}
            className="w-full py-2 rounded bg-[#0A1422] hover:bg-[#1A3065] border border-[#00D9FF]/40 text-[#00D9FF] hover:text-white font-bold flex items-center justify-center space-x-1.5 transition focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
          >
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
            <span>INJECT DELAY SIMULATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
