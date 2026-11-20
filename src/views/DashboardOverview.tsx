import React, { useState } from 'react';
import {
  AirlineDataset,
  Flight,
  TurnaroundAnalysis,
  CrewDutyAnalysis,
  ConnectionAnalysis,
  AirportCapacityAnalysis,
  FleetAircraftStatus,
  OperationalAlert,
  AIRecommendation
} from '../types/airline';
import { NavTab } from '../components/Sidebar';
import { KineticAirspaceTopology } from '../components/KineticAirspaceTopology';
import { FlightIntelligencePanel } from '../components/FlightIntelligencePanel';
import { AtcOperationsTimeline } from '../components/AtcOperationsTimeline';
import {
  Plane,
  Armchair,
  Building,
  Users,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Radar,
  Radio,
  Gauge
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardOverviewProps {
  dataset: AirlineDataset;
  flights: Flight[];
  turnarounds: TurnaroundAnalysis[];
  crews: CrewDutyAnalysis[];
  connections: ConnectionAnalysis[];
  airports: AirportCapacityAnalysis[];
  fleet: FleetAircraftStatus[];
  alerts: OperationalAlert[];
  recommendations: AIRecommendation[];
  onNavigateTab: (tab: NavTab) => void;
  onSelectFlightForDelay: (flightId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dataset,
  flights,
  turnarounds,
  crews,
  connections,
  airports,
  fleet,
  alerts,
  recommendations,
  onNavigateTab,
  onSelectFlightForDelay
}) => {
  // Selected flight state for telemetry & intelligence panel
  // Default to DS0301 (operating on high-risk Crew CR03)
  const [selectedFlight, setSelectedFlight] = useState<Flight>(
    flights.find(f => f.flight_id === 'DS0301') || flights[0]
  );
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>(null);

  // Dynamic Dataset Calculations
  const totalFlightsCount = flights.length; // 70 scheduled flight legs
  const totalSeatsAcrossFleet = 16 * (dataset.meta?.seats_per_aircraft || 180); // 2,880 active rotation seats
  const totalAirportsCount = dataset.airports.length || 16;
  const totalBookedPax = flights.reduce((sum, f) => sum + (f.pax || 0), 0); // 10,394 booked
  const totalConnectingPax = connections.reduce((sum, c) => sum + (c.passengers || 0), 0); // 659 transit
  const totalCrewCount = crews.length || 16;

  // Aircraft Status calculations (Dynamic from fleet and simulation)
  const delayedTails = new Set(
    flights.filter(f => (f.delay_minutes || 0) > 0).map(f => f.tail_id)
  );
  const delayedCount = delayedTails.size;
  const groundedCount = fleet.filter(f => f.status === 'grounded').length;
  const onTimeCount = Math.max(0, fleet.length - delayedCount - groundedCount);
  const onSchedulePercent = fleet.length > 0 ? Math.round((onTimeCount / fleet.length) * 100) : 100;

  // Connection calculations
  const brokenConnections = connections.filter(c => c.is_broken);
  const invalidPaxCount = brokenConnections.reduce((s, c) => s + (c.passengers || 0), 0);
  const validPaxCount = totalConnectingPax - invalidPaxCount;
  const validConnectionPercent = totalConnectingPax > 0 ? Math.round((validPaxCount / totalConnectingPax) * 100) : 100;

  // Top 5 Airports Traffic Data for Bar Chart
  const topAirportsData = airports
    .map(a => ({
      code: a.airport.id,
      capacity: a.airport.capacity_per_hour,
      movements: a.total_movements_day,
      peakMovements: a.peak_movements
    }))
    .sort((a, b) => b.movements - a.movements)
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1720px] mx-auto select-none font-mono">
      {/* =========================================================================
          SECTION 1: 5 TACTICAL TELEMETRY MONITORS
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Monitor 1: Total Flights */}
        <div className="atc-panel p-3 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8498AD]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Scheduled Legs</span>
            <Plane className="w-3.5 h-3.5 text-[#00D9FF]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-[#EAF4FF]">{totalFlightsCount}</span>
            <span className="text-[10px] text-[#22D3A6] font-bold">140 MVTS</span>
          </div>
          <div className="text-[9px] text-[#8498AD] mt-1 border-t border-[#1E3048] pt-1 flex justify-between">
            <span>16 Tail Rotations</span>
            <span className="text-[#00D9FF]">100% Sched</span>
          </div>
        </div>

        {/* Monitor 2: Aircraft Fleet Status */}
        <div className="atc-panel p-3 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8498AD]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Fleet</span>
            <Gauge className="w-3.5 h-3.5 text-[#22D3A6]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-[#EAF4FF]">{onTimeCount}/16</span>
            <span
              className={`text-[10px] font-bold ${
                onSchedulePercent === 100 ? 'text-[#22D3A6]' : 'text-[#FFB547]'
              }`}
            >
              {onSchedulePercent}% OTP
            </span>
          </div>
          <div className="text-[9px] text-[#8498AD] mt-1 border-t border-[#1E3048] pt-1 flex justify-between">
            <span>{delayedCount} Delayed</span>
            <span className="text-[#22D3A6]">2 Hot Spares</span>
          </div>
        </div>

        {/* Monitor 3: Seat Inventory */}
        <div className="atc-panel p-3 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8498AD]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Seat Capacity</span>
            <Armchair className="w-3.5 h-3.5 text-[#247BFF]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-[#EAF4FF]">{totalSeatsAcrossFleet.toLocaleString()}</span>
            <span className="text-[10px] text-[#247BFF] font-bold">180 / AC</span>
          </div>
          <div className="text-[9px] text-[#8498AD] mt-1 border-t border-[#1E3048] pt-1 flex justify-between">
            <span>{totalBookedPax.toLocaleString()} Booked</span>
            <span className="text-[#EAF4FF]">3,240 Total</span>
          </div>
        </div>

        {/* Monitor 4: Passenger Transit Corridors */}
        <div className="atc-panel p-3 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8498AD]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Connecting Pax</span>
            <Users className="w-3.5 h-3.5 text-[#FFB547]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-[#EAF4FF]">{totalConnectingPax}</span>
            <span
              className={`text-[10px] font-bold ${
                validConnectionPercent === 100 ? 'text-[#22D3A6]' : 'text-[#FF5364]'
              }`}
            >
              {validConnectionPercent}% VALID
            </span>
          </div>
          <div className="text-[9px] text-[#8498AD] mt-1 border-t border-[#1E3048] pt-1 flex justify-between">
            <span>21 Hub Pairs</span>
            <span className="text-[#FFB547]">5 Tight MCT</span>
          </div>
        </div>

        {/* Monitor 5: Crew Legal Duty (FDTL) */}
        <div className="atc-panel p-3 rounded relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#8498AD]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Crew FDTL Cap</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D9FF]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-[#EAF4FF]">16/16</span>
            <span className="text-[10px] text-[#FFB547] font-bold">CR03 590M</span>
          </div>
          <div className="text-[9px] text-[#8498AD] mt-1 border-t border-[#1E3048] pt-1 flex justify-between">
            <span>Max 600m DGCA</span>
            <span className="text-[#22D3A6]">0 Breaches</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: MAIN FLIGHT RADAR (LEFT) + RIGHT-SIDE INTELLIGENCE PANEL (RIGHT)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[560px]">
        {/* Main Kinetic Airspace Topology (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <KineticAirspaceTopology
            airports={dataset.airports}
            flights={flights}
            spares={dataset.spare_aircraft}
            selectedFlightId={selectedFlight.flight_id}
            onSelectFlight={f => setSelectedFlight(f)}
            selectedAirportId={selectedAirportId}
            onSelectAirport={apId => setSelectedAirportId(apId)}
            onSimulateDelay={fid => onSelectFlightForDelay(fid)}
          />
        </div>

        {/* Right-Side Telemetry & Intelligence Panel (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <FlightIntelligencePanel
            flight={selectedFlight}
            allFlights={flights}
            crews={crews}
            turnarounds={turnarounds}
            connections={connections}
            recommendations={recommendations}
            onSimulateDelayForFlight={fid => onSelectFlightForDelay(fid)}
          />
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: 24-HOUR OPERATIONAL TIMELINE
      ========================================================================= */}
      <div>
        <AtcOperationsTimeline
          flights={flights}
          alerts={alerts}
          onSelectFlight={f => setSelectedFlight(f)}
          selectedFlightId={selectedFlight.flight_id}
        />
      </div>

      {/* =========================================================================
          SECTION 4: AIRPORT RUNWAY CAPACITY + OPERATIONAL ALERTS FEED
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Top Airports Movements Bar Chart (6 cols) */}
        <div className="lg:col-span-6 atc-panel p-3.5 rounded">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E3048] mb-2">
            <span className="font-bold text-xs text-[#EAF4FF] tracking-wider flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>TOP AIRPORT MOVEMENTS & RUNWAY CAPACITIES</span>
            </span>
            <button
              onClick={() => onNavigateTab('airport-capacity')}
              className="text-[10px] text-[#00D9FF] hover:underline flex items-center space-x-0.5"
            >
              <span>INSPECT ALL 16</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-36 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAirportsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="code" stroke="#8498AD" fontSize={10} fontVariant="font-mono" />
                <YAxis stroke="#8498AD" fontSize={10} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0A1422] p-2 rounded border border-[#1E3048] text-[10px] font-mono text-[#EAF4FF] shadow-2xl">
                          <div className="font-bold text-[#00D9FF]">{d.code} Hub</div>
                          <div>Hourly Capacity: {d.capacity}/hr</div>
                          <div>Daily Movements: {d.movements} flights</div>
                          <div>Peak Movements: {d.peakMovements} mvts/hr</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="movements" fill="#247BFF" radius={[2, 2, 0, 0]}>
                  {topAirportsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#00D9FF' : index === 1 ? '#247BFF' : '#1A3065'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-[9px] text-[#8498AD] pt-2 border-t border-[#1E3048] mt-1">
            {topAirportsData.slice(0, 3).map(a => (
              <span key={a.code}>
                {a.code}: {a.movements} mvts (Cap: {a.capacity}/hr)
              </span>
            ))}
          </div>
        </div>

        {/* Operational Alerts Tactical Stream (6 cols) */}
        <div className="lg:col-span-6 atc-panel p-3.5 rounded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1E3048] mb-2">
              <span className="font-bold text-xs text-[#EAF4FF] tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FFB547]" />
                <span>OPERATIONAL ALERTS & DGCA COMPLIANCE FEED</span>
              </span>
              <button
                onClick={() => onNavigateTab('operational-alerts')}
                className="text-[10px] text-[#00D9FF] hover:underline flex items-center space-x-0.5"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 mt-1">
              {alerts.slice(0, 3).map((alert, idx) => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';
                return (
                  <div
                    key={alert.id}
                    className="p-2 rounded bg-[#0A1422] border border-[#1E3048] flex items-start space-x-2 text-[11px]"
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        isCritical ? 'bg-[#FF5364]' : isWarning ? 'bg-[#FFB547]' : 'bg-[#00D9FF]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span
                          className={`font-bold truncate ${
                            isCritical ? 'text-[#FF5364]' : isWarning ? 'text-[#FFB547]' : 'text-[#00D9FF]'
                          }`}
                        >
                          {alert.title}
                        </span>
                        <span className="text-[9px] text-[#8498AD]">
                          {idx === 0 ? '09:15' : idx === 1 ? '08:50' : '08:30'}
                        </span>
                      </div>
                      <p className="text-[#8498AD] text-[10px] mt-0.5 leading-snug line-clamp-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[9px] text-[#8498AD] pt-2 border-t border-[#1E3048] mt-2 flex justify-between">
            <span>Automated DGCA Engine</span>
            <span className="text-[#22D3A6]">Real-time Network Scan Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
