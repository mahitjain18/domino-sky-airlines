import React from 'react';
import {
  LayoutDashboard,
  Radar,
  Orbit,
  Plane,
  Gauge,
  Users,
  GitFork,
  Bot,
  BellRing,
  BarChart3,
  Settings,
  Radio,
  X
} from 'lucide-react';

export type NavTab =
  | 'command-centre'
  | 'flight-radar'
  | 'flight-operations'
  | 'aircraft-tracking'
  | 'crew-management'
  | 'passenger-operations'
  | 'ai-intelligence'
  | 'operational-alerts'
  | 'analytics'
  | 'settings'
  // Backward compatibility aliases
  | 'dashboard'
  | 'flight-network'
  | 'aircraft-monitor'
  | 'passenger-connections'
  | 'airport-capacity'
  | 'ai-assistant'
  | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  criticalAlertsCount: number;
  isSimulating: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalAlertsCount,
  isSimulating,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'command-centre', label: '1. Command Centre', icon: LayoutDashboard },
    { id: 'flight-radar', label: '2. Airspace Topology', icon: Orbit, badge: 'KINETIC' },
    { id: 'flight-operations', label: '3. Flight Operations', icon: Plane },
    { id: 'aircraft-tracking', label: '4. Aircraft Tracking', icon: Gauge },
    { id: 'crew-management', label: '5. Crew Management', icon: Users },
    { id: 'passenger-operations', label: '6. Passenger Operations', icon: GitFork },
    { id: 'ai-intelligence', label: '7. AI Intelligence', icon: Bot, badge: 'AI' },
    { id: 'operational-alerts', label: '8. Operational Alerts', icon: BellRing },
    { id: 'analytics', label: '9. Analytics & Capacity', icon: BarChart3 },
    { id: 'settings', label: '10. OCC Parameters', icon: Settings },
  ];

  // Helper: Match active state accounting for aliases
  const isItemActive = (itemId: NavTab) => {
    if (activeTab === itemId) return true;
    if (itemId === 'command-centre' && activeTab === 'dashboard') return true;
    if (itemId === 'flight-operations' && activeTab === 'flight-network') return true;
    if (itemId === 'aircraft-tracking' && activeTab === 'aircraft-monitor') return true;
    if (itemId === 'passenger-operations' && activeTab === 'passenger-connections') return true;
    if (itemId === 'ai-intelligence' && activeTab === 'ai-assistant') return true;
    if (itemId === 'analytics' && (activeTab === 'airport-capacity' || activeTab === 'reports')) return true;
    return false;
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderContent = () => (
    <div className="flex flex-col h-full bg-[#050B14] border-r border-[#1E3048] font-mono text-xs select-none">
      {/* Brand Header */}
      <div className="p-4 pb-3 border-b border-[#1E3048] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#0A1422] border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF]">
            <Radar className="w-4 h-4 text-[#00D9FF] animate-spin-slow" aria-hidden="true" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#EAF4FF] tracking-wider">
              ATC DISPATCH
            </div>
            <div className="text-[9px] text-[#8498AD] uppercase tracking-widest">
              Airspace Sector 04
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded text-[#8498AD] hover:text-white hover:bg-[#101D2D] focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
            aria-label="Close navigation sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav
        aria-label="Tactical Flight Operations Consoles"
        className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto"
      >
        <div className="text-[9px] font-bold text-[#8498AD]/70 uppercase px-3 py-1 tracking-widest">
          Tactical Consoles
        </div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[11px] transition-all group focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none ${
                isActive
                  ? 'bg-[#101D2D] text-[#00D9FF] font-bold border-l-2 border-[#00D9FF] shadow-[inset_0_0_12px_rgba(0,217,255,0.15)]'
                  : 'text-[#8498AD] hover:text-[#EAF4FF] hover:bg-[#0A1422] border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-[#00D9FF]' : 'text-[#8498AD] group-hover:text-[#00D9FF]'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                      : 'bg-[#1E3048]/60 text-[#8498AD]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.id === 'operational-alerts' && criticalAlertsCount > 0 && !isActive && (
                <span
                  className="w-2 h-2 rounded-full bg-[#FF5364] animate-pulse"
                  aria-label={`${criticalAlertsCount} critical alerts active`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Disruption Simulation Active Warning */}
      {isSimulating && (
        <div
          role="status"
          aria-live="polite"
          className="m-2.5 p-2 rounded bg-[#FFB547]/10 border border-[#FFB547]/40 text-[#FFB547] text-[10px]"
        >
          <div className="flex items-center space-x-1.5 font-bold">
            <Radio className="w-3 h-3 text-[#FFB547] animate-spin" aria-hidden="true" />
            <span>Tactical Disruption</span>
          </div>
          <p className="text-[9px] text-[#FFB547]/80 mt-0.5 leading-tight">
            Cascading delays injected across rotational sequence.
          </p>
        </div>
      )}

      {/* Hot-Standby Fleet Status Pill */}
      <section
        aria-label="Hot-Standby Fleet Reserves"
        className="p-3 border-t border-[#1E3048] bg-[#0A1422]/60"
      >
        <div className="flex items-center justify-between text-[10px] text-[#8498AD] font-bold uppercase mb-1.5">
          <span>Standby Reserves</span>
          <span className="text-[#22D3A6] flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3A6] animate-pulse" aria-hidden="true" />
            <span>Hot</span>
          </span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="p-1.5 rounded bg-[#101D2D] border border-[#1E3048] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#00D9FF]">VT-DS18</span>
              <span className="text-[#8498AD] ml-1">DEL Hub</span>
            </div>
            <span className="text-[#22D3A6]">Ready 05:00</span>
          </div>
          <div className="p-1.5 rounded bg-[#101D2D] border border-[#1E3048] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#00D9FF]">VT-DS17</span>
              <span className="text-[#8498AD] ml-1">BLR Hub</span>
            </div>
            <span className="text-[#22D3A6]">Ready 05:00</span>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Desktop Operations Navigation"
        className="hidden md:flex w-56 flex-col h-screen select-none shrink-0 z-30"
      >
        {renderContent()}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isOpenMobile && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            aria-label="Mobile Operations Navigation"
            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden shadow-2xl"
          >
            {renderContent()}
          </aside>
        </>
      )}
    </>
  );
};
