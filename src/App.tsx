import React, { useState, useMemo } from 'react';
import { RAW_AIRLINE_DATA } from './data/airlineData';
import {
  analyzeTurnarounds,
  analyzeCrewDuty,
  analyzePassengerConnections,
  analyzeAirportCapacity,
  analyzeFleetStatus,
  generateOperationalAlerts,
  generateAIRecommendations,
  simulateFlightDelay
} from './utils/airlineCalculations';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './views/DashboardOverview';
import { FlightRadarView } from './views/FlightRadarView';
import { FlightNetworkView } from './views/FlightNetworkView';
import { AircraftMonitorView } from './views/AircraftMonitorView';
import { CrewManagementView } from './views/CrewManagementView';
import { PassengerConnectionsView } from './views/PassengerConnectionsView';
import { AirportCapacityView } from './views/AirportCapacityView';
import { AIAssistantView } from './views/AIAssistantView';
import { OperationalAlertsView } from './views/OperationalAlertsView';
import { ReportsView } from './views/ReportsView';
import { QuickDelayModal } from './components/QuickDelayModal';
import { ShieldCheck, Sliders, BellRing, Database } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('command-centre');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedFlightId, setSimulatedFlightId] = useState<string | null>(null);
  const [simulatedDelayMinutes, setSimulatedDelayMinutes] = useState<number>(0);
  const [isQuickDelayOpen, setIsQuickDelayOpen] = useState<boolean>(false);

  // Dynamic calculations based on simulation or scheduled baseline
  const activeFlights = useMemo(() => {
    if (isSimulating && simulatedFlightId && simulatedDelayMinutes > 0) {
      const res = simulateFlightDelay(RAW_AIRLINE_DATA, simulatedFlightId, simulatedDelayMinutes);
      return res.simulatedFlights;
    }
    return RAW_AIRLINE_DATA.flights;
  }, [isSimulating, simulatedFlightId, simulatedDelayMinutes]);

  // Dynamic Rule Validations
  const turnarounds = useMemo(() => {
    return analyzeTurnarounds(activeFlights, RAW_AIRLINE_DATA.meta.min_turnaround_minutes);
  }, [activeFlights]);

  const crews = useMemo(() => {
    return analyzeCrewDuty(RAW_AIRLINE_DATA, activeFlights);
  }, [activeFlights]);

  const connections = useMemo(() => {
    return analyzePassengerConnections(RAW_AIRLINE_DATA, activeFlights);
  }, [activeFlights]);

  const airports = useMemo(() => {
    return analyzeAirportCapacity(RAW_AIRLINE_DATA, activeFlights);
  }, [activeFlights]);

  const fleet = useMemo(() => {
    return analyzeFleetStatus(RAW_AIRLINE_DATA, activeFlights);
  }, [activeFlights]);

  const alerts = useMemo(() => {
    return generateOperationalAlerts(turnarounds, crews, connections, airports);
  }, [turnarounds, crews, connections, airports]);

  const recommendations = useMemo(() => {
    return generateAIRecommendations(
      RAW_AIRLINE_DATA,
      turnarounds,
      crews,
      connections,
      airports,
      RAW_AIRLINE_DATA.spare_aircraft
    );
  }, [turnarounds, crews, connections, airports]);

  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  // Handler: Start simulation
  const handleSimulateDelay = (flightId: string, delayMinutes: number = 30) => {
    setSimulatedFlightId(flightId);
    setSimulatedDelayMinutes(delayMinutes);
    setIsSimulating(true);
  };

  // Handler: Reset simulation
  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulatedFlightId(null);
    setSimulatedDelayMinutes(0);
  };

  // Handler: Deploy Spare Aircraft Swap
  const handleDeploySpare = (spareTail: string, targetTail: string) => {
    alert(`Success: Spare Aircraft ${spareTail} deployed to replace rotation on ${targetTail}. Rotation recovered!`);
    handleResetSimulation();
  };

  // Handler: Standby Relief Crew
  const handleReliefCrew = (crewId: string) => {
    alert(`Standby relief crew activated at intermediate station for Crew ${crewId}. Duty hours stabilized.`);
  };

  // Handler: Apply AI Action
  const handleApplyAIAction = (recId: string) => {
    alert(`AI Action Protocol [${recId}] executed successfully. Target parameters stabilized.`);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#040711] text-slate-100 font-sans">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        criticalAlertsCount={criticalAlertsCount}
        isSimulating={isSimulating}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSimulating={isSimulating}
          onResetSimulation={handleResetSimulation}
          onOpenQuickDelay={() => setIsQuickDelayOpen(true)}
          criticalAlertCount={criticalAlertsCount}
          totalAlertCount={alerts.length}
          flights={activeFlights}
          onSelectFlight={fid => handleSimulateDelay(fid, 30)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto">
          {(activeTab === 'command-centre' || activeTab === 'dashboard') && (
            <DashboardOverview
              dataset={RAW_AIRLINE_DATA}
              flights={activeFlights}
              turnarounds={turnarounds}
              crews={crews}
              connections={connections}
              airports={airports}
              fleet={fleet}
              alerts={alerts}
              recommendations={recommendations}
              onNavigateTab={setActiveTab}
              onSelectFlightForDelay={fid => handleSimulateDelay(fid, 30)}
            />
          )}

          {activeTab === 'flight-radar' && (
            <FlightRadarView
              airports={RAW_AIRLINE_DATA.airports}
              flights={activeFlights}
              spares={RAW_AIRLINE_DATA.spare_aircraft}
              crews={crews}
              turnarounds={turnarounds}
              connections={connections}
              recommendations={recommendations}
              onSimulateDelay={fid => handleSimulateDelay(fid, 30)}
            />
          )}

          {(activeTab === 'flight-operations' || activeTab === 'flight-network') && (
            <FlightNetworkView
              airports={RAW_AIRLINE_DATA.airports}
              flights={activeFlights}
              spares={RAW_AIRLINE_DATA.spare_aircraft}
              onSimulateDelay={fid => handleSimulateDelay(fid, 30)}
            />
          )}

          {(activeTab === 'aircraft-tracking' || activeTab === 'aircraft-monitor') && (
            <AircraftMonitorView
              dataset={RAW_AIRLINE_DATA}
              flights={activeFlights}
              turnarounds={turnarounds}
              fleet={fleet}
              onDeploySpare={handleDeploySpare}
              onSimulateDelay={fid => handleSimulateDelay(fid, 30)}
            />
          )}

          {activeTab === 'crew-management' && (
            <CrewManagementView
              dataset={RAW_AIRLINE_DATA}
              crews={crews}
              flights={activeFlights}
              onReliefCrewSim={handleReliefCrew}
            />
          )}

          {(activeTab === 'passenger-operations' || activeTab === 'passenger-connections') && (
            <PassengerConnectionsView
              dataset={RAW_AIRLINE_DATA}
              connections={connections}
              flights={activeFlights}
              onPriorityEscort={cid =>
                alert(`Priority tarmac transit vehicle and express baggage escort assigned for Connection ${cid}.`)
              }
            />
          )}

          {activeTab === 'operational-alerts' && (
            <OperationalAlertsView
              alerts={alerts}
              flights={activeFlights}
              crews={crews}
              turnarounds={turnarounds}
              connections={connections}
              onSelectFlightForDelay={fid => handleSimulateDelay(fid, 30)}
            />
          )}

          {(activeTab === 'analytics' || activeTab === 'airport-capacity') && (
            <AirportCapacityView
              dataset={RAW_AIRLINE_DATA}
              airports={airports}
              flights={activeFlights}
            />
          )}

          {(activeTab === 'ai-intelligence' || activeTab === 'ai-assistant') && (
            <AIAssistantView
              dataset={RAW_AIRLINE_DATA}
              flights={activeFlights}
              turnarounds={turnarounds}
              crews={crews}
              connections={connections}
              airports={airports}
              recommendations={recommendations}
              isSimulating={isSimulating}
              simulatedFlightId={simulatedFlightId}
              simulatedDelayMinutes={simulatedDelayMinutes}
              onSimulateDelay={handleSimulateDelay}
              onResetSimulation={handleResetSimulation}
              onApplyAIAction={handleApplyAIAction}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              dataset={RAW_AIRLINE_DATA}
              flights={activeFlights}
              turnarounds={turnarounds}
              crews={crews}
              connections={connections}
              airports={airports}
              recommendations={recommendations}
            />
          )}

          {activeTab === 'settings' && (
            <div className="p-6 max-w-4xl mx-auto space-y-4 font-mono select-none">
              <div className="atc-panel p-5 rounded">
                <div className="flex items-center space-x-2 border-b border-[#1E3048] pb-3">
                  <Sliders className="w-5 h-5 text-[#00D9FF]" />
                  <h2 className="text-base font-bold text-[#EAF4FF] tracking-wider">
                    OCC SYSTEM SETTINGS & REGULATORY SAFETY PARAMETERS
                  </h2>
                </div>
                <p className="text-xs text-[#8498AD] mt-1.5">
                  Civil Aviation DGCA Rule Enforcements & Active Airspace Thresholds
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3.5 rounded bg-[#0A1422] border border-[#1E3048]">
                    <span className="text-[#8498AD] block text-[10px] uppercase">
                      Mandatory Turnaround Window
                    </span>
                    <span className="text-[#00D9FF] font-bold text-base mt-0.5 block">
                      30 Minutes
                    </span>
                    <span className="text-[10px] text-[#8498AD]">
                      DGCA Safety Requirement for Airbus A320
                    </span>
                  </div>

                  <div className="p-3.5 rounded bg-[#0A1422] border border-[#1E3048]">
                    <span className="text-[#8498AD] block text-[10px] uppercase">
                      Max Crew Flight Duty Period (FDTL)
                    </span>
                    <span className="text-[#00D9FF] font-bold text-base mt-0.5 block">
                      600 Minutes (10 Hours)
                    </span>
                    <span className="text-[10px] text-[#8498AD]">
                      Legal Rest & Work Hour Cap
                    </span>
                  </div>

                  <div className="p-3.5 rounded bg-[#0A1422] border border-[#1E3048]">
                    <span className="text-[#8498AD] block text-[10px] uppercase">
                      Minimum Connecting Time (MCT)
                    </span>
                    <span className="text-[#00D9FF] font-bold text-base mt-0.5 block">
                      40 - 45 Minutes
                    </span>
                    <span className="text-[10px] text-[#8498AD]">
                      Airport Hub Classification Standard
                    </span>
                  </div>

                  <div className="p-3.5 rounded bg-[#0A1422] border border-[#1E3048]">
                    <span className="text-[#8498AD] block text-[10px] uppercase">
                      Operating Fleet Capacity
                    </span>
                    <span className="text-[#00D9FF] font-bold text-base mt-0.5 block">
                      180 Seats / Aircraft
                    </span>
                    <span className="text-[10px] text-[#8498AD]">
                      A320 Single-Class Layout (16 Active + 2 Hot Spares)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quick Delay Disruption Modal */}
      <QuickDelayModal
        isOpen={isQuickDelayOpen}
        onClose={() => setIsQuickDelayOpen(false)}
        flights={RAW_AIRLINE_DATA.flights}
        onApplyDelay={(fid, delay) => handleSimulateDelay(fid, delay)}
      />
    </div>
  );
};

export default App;
