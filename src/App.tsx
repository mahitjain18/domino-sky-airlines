import React, { useState, useMemo, Suspense, lazy } from 'react';
import { RAW_AIRLINE_DATA } from './data/airlineData';
import {
  analyzeTurnarounds,
  analyzeCrewDuty,
  analyzePassengerConnections,
  analyzeAirportCapacity,
  analyzeFleetStatus,
  generateOperationalAlerts,
  generateAIRecommendations,
  simulateFlightDelay,
  deploySpareSwap,
  applyReliefCrew
} from './utils/airlineCalculations';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { QuickDelayModal } from './components/QuickDelayModal';
import { TacticalToast, ToastNotification, ToastType } from './components/TacticalToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AtcLoadingFallback } from './components/AtcLoadingFallback';
import { Sliders } from 'lucide-react';

// Code-split dynamic views for optimal bundle performance
const DashboardOverview = lazy(() =>
  import('./views/DashboardOverview').then(m => ({ default: m.DashboardOverview }))
);
const FlightRadarView = lazy(() =>
  import('./views/FlightRadarView').then(m => ({ default: m.FlightRadarView }))
);
const FlightNetworkView = lazy(() =>
  import('./views/FlightNetworkView').then(m => ({ default: m.FlightNetworkView }))
);
const AircraftMonitorView = lazy(() =>
  import('./views/AircraftMonitorView').then(m => ({ default: m.AircraftMonitorView }))
);
const CrewManagementView = lazy(() =>
  import('./views/CrewManagementView').then(m => ({ default: m.CrewManagementView }))
);
const PassengerConnectionsView = lazy(() =>
  import('./views/PassengerConnectionsView').then(m => ({ default: m.PassengerConnectionsView }))
);
const AirportCapacityView = lazy(() =>
  import('./views/AirportCapacityView').then(m => ({ default: m.AirportCapacityView }))
);
const AIAssistantView = lazy(() =>
  import('./views/AIAssistantView').then(m => ({ default: m.AIAssistantView }))
);
const OperationalAlertsView = lazy(() =>
  import('./views/OperationalAlertsView').then(m => ({ default: m.OperationalAlertsView }))
);
const ReportsView = lazy(() =>
  import('./views/ReportsView').then(m => ({ default: m.ReportsView }))
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('command-centre');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Simulation & Tactical Action State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedFlightId, setSimulatedFlightId] = useState<string | null>(null);
  const [simulatedDelayMinutes, setSimulatedDelayMinutes] = useState<number>(0);
  const [isQuickDelayOpen, setIsQuickDelayOpen] = useState<boolean>(false);

  // Active Tactical Spare Deployments & Crew Relief State
  const [deployedSpares, setDeployedSpares] = useState<{ [targetTail: string]: string }>({});
  const [relievedCrews, setRelievedCrews] = useState<string[]>([]);

  // In-app Tactical Notification Toast Queue
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (type: ToastType, title: string, message: string) => {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const time = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setNotifications(prev => [...prev.slice(-3), { id, type, title, message, timestamp: time }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Dynamic calculations based on simulation or scheduled baseline + spare deployment
  const activeFlights = useMemo(() => {
    let baseFlights = RAW_AIRLINE_DATA.flights;
    if (isSimulating && simulatedFlightId && simulatedDelayMinutes > 0) {
      const res = simulateFlightDelay(RAW_AIRLINE_DATA, simulatedFlightId, simulatedDelayMinutes);
      baseFlights = res.simulatedFlights;
    }

    // Apply active spare aircraft rotation replacements
    let currentFlights = baseFlights;
    for (const [targetTail, spareTail] of Object.entries(deployedSpares)) {
      const swapRes = deploySpareSwap(currentFlights, spareTail, targetTail);
      currentFlights = swapRes.updatedFlights;
    }

    return currentFlights;
  }, [isSimulating, simulatedFlightId, simulatedDelayMinutes, deployedSpares]);

  // Dynamic Rule Validations
  const turnarounds = useMemo(() => {
    return analyzeTurnarounds(activeFlights, RAW_AIRLINE_DATA.meta.min_turnaround_minutes);
  }, [activeFlights]);

  const rawCrews = useMemo(() => {
    return analyzeCrewDuty(RAW_AIRLINE_DATA, activeFlights);
  }, [activeFlights]);

  const crews = useMemo(() => {
    let processed = rawCrews;
    for (const cid of relievedCrews) {
      processed = applyReliefCrew(processed, cid);
    }
    return processed;
  }, [rawCrews, relievedCrews]);

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
    addNotification(
      'warning',
      'TACTICAL DISRUPTION INJECTED',
      `Delay of +${delayMinutes} mins injected on Flight ${flightId}. Cascading delay calculated across rotation.`
    );
  };

  // Handler: Reset simulation
  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulatedFlightId(null);
    setSimulatedDelayMinutes(0);
    setDeployedSpares({});
    setRelievedCrews([]);
    addNotification(
      'info',
      'NOMINAL BASELINE RESTORED',
      'All rotations, crew rosters, and turnaround buffers restored to scheduled baseline.'
    );
  };

  // Handler: Deploy Spare Aircraft Swap
  const handleDeploySpare = (spareTail: string, targetTail: string) => {
    setDeployedSpares(prev => ({ ...prev, [targetTail]: spareTail }));
    addNotification(
      'success',
      'HOT-STANDBY SPARE DEPLOYED',
      `Spare Aircraft ${spareTail} assigned to replace rotation ${targetTail}. Rotation recovered with on-time schedule!`
    );
  };

  // Handler: Standby Relief Crew
  const handleReliefCrew = (crewId: string) => {
    setRelievedCrews(prev => [...prev, crewId]);
    addNotification(
      'success',
      'STANDBY RELIEF CREW ACTIVATED',
      `Relief crew dispatched at intermediate hub for Crew ${crewId}. Duty hours restabilized within DGCA limits.`
    );
  };

  // Handler: Apply AI Action
  const handleApplyAIAction = (recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (recId === 'REC-01') {
      handleReliefCrew('CR03');
    } else if (recId === 'REC-02') {
      handleReliefCrew('CR08');
    } else if (recId === 'REC-03') {
      handleDeploySpare('VT-DS18', 'VT-DS03');
    } else if (recId === 'REC-04') {
      handleDeploySpare('VT-DS17', 'VT-DS05');
    } else {
      addNotification(
        'success',
        `AI ACTION PROTOCOL [${recId}] EXECUTED`,
        rec?.suggestedAction || 'Operational optimization protocol executed successfully.'
      );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#040711] text-slate-100 font-sans">
      {/* Keyboard Accessibility: Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#00D9FF] focus:text-[#050B14] focus:font-mono focus:font-bold focus:rounded focus:outline-none focus:ring-2 focus:ring-white shadow-xl"
      >
        Skip to tactical content
      </a>

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

        {/* Scrollable View Container Wrapped with ErrorBoundary & Suspense */}
        <main
          id="main-content"
          tabIndex={-1}
          role="main"
          aria-label="Tactical Airspace View"
          className="flex-1 overflow-y-auto focus:outline-none"
        >
          <ErrorBoundary onReset={handleResetSimulation}>
            <Suspense fallback={<AtcLoadingFallback label="LOADING CONSOLE TELEMETRY..." />}>
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
                    addNotification(
                      'success',
                      `PRIORITY ESCORT ACTIVATED: ${cid}`,
                      `Priority tarmac transit vehicle and express baggage escort assigned for Connection ${cid}.`
                    )
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
                      <Sliders className="w-5 h-5 text-[#00D9FF]" aria-hidden="true" />
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
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Quick Delay Disruption Modal */}
      <QuickDelayModal
        isOpen={isQuickDelayOpen}
        onClose={() => setIsQuickDelayOpen(false)}
        flights={RAW_AIRLINE_DATA.flights}
        onApplyDelay={(fid, delay) => handleSimulateDelay(fid, delay)}
      />

      {/* In-App Tactical Notification Toast System */}
      <TacticalToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default App;
