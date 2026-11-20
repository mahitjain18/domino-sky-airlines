import React, { useState } from 'react';
import { Airport, Flight, SpareAircraft, CrewDutyAnalysis, TurnaroundAnalysis, ConnectionAnalysis, AIRecommendation } from '../types/airline';
import { KineticAirspaceTopology } from '../components/KineticAirspaceTopology';
import { FlightIntelligencePanel } from '../components/FlightIntelligencePanel';
import { Orbit } from 'lucide-react';

interface FlightRadarViewProps {
  airports: Airport[];
  flights: Flight[];
  spares: SpareAircraft[];
  crews: CrewDutyAnalysis[];
  turnarounds: TurnaroundAnalysis[];
  connections: ConnectionAnalysis[];
  recommendations: AIRecommendation[];
  onSimulateDelay: (flightId: string) => void;
}

export const FlightRadarView: React.FC<FlightRadarViewProps> = ({
  airports,
  flights,
  spares,
  crews,
  turnarounds,
  connections,
  recommendations,
  onSimulateDelay
}) => {
  const [selectedFlight, setSelectedFlight] = useState<Flight>(
    flights.find(f => f.flight_id === 'DS0301') || flights[0]
  );
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1720px] mx-auto select-none font-mono">
      {/* Top Banner */}
      <div className="atc-panel p-3.5 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-[#0A1422] border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF]">
            <Orbit className="w-4 h-4 text-[#00D9FF]" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#EAF4FF] tracking-wider flex items-center space-x-2">
              <span>KINETIC AIRSPACE TOPOLOGY COMMAND STATION</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 font-bold">
                MULTI-MODE VISUALIZATION
              </span>
            </div>
            <div className="text-[10px] text-[#8498AD]">
              Geo Radar • 2.5D Holo Tilt • Orbital Constellation • Real-time Trajectory Telemetry
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <div className="bg-[#0A1422] px-2.5 py-1 rounded border border-[#1E3048]">
            <span className="text-[#8498AD]">Target In Focus: </span>
            <span className="text-[#00D9FF] font-bold">{selectedFlight.flight_id}</span>
            <span className="text-[#8498AD]"> ({selectedFlight.origin}→{selectedFlight.destination})</span>
          </div>
        </div>
      </div>

      {/* Main Kinetic Topology Screen (Left) + Intelligence Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[640px]">
        {/* Kinetic Topology Workspace (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <KineticAirspaceTopology
            airports={airports}
            flights={flights}
            spares={spares}
            selectedFlightId={selectedFlight.flight_id}
            onSelectFlight={f => setSelectedFlight(f)}
            selectedAirportId={selectedAirportId}
            onSelectAirport={apId => setSelectedAirportId(apId)}
            onSimulateDelay={fid => onSimulateDelay(fid)}
          />
        </div>

        {/* Intelligence Telemetry (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <FlightIntelligencePanel
            flight={selectedFlight}
            allFlights={flights}
            crews={crews}
            turnarounds={turnarounds}
            connections={connections}
            recommendations={recommendations}
            onSimulateDelayForFlight={fid => onSimulateDelay(fid)}
          />
        </div>
      </div>
    </div>
  );
};
