import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Clock,
  Radio,
  Sliders,
  RotateCcw,
  Plane,
  Shield,
  Maximize2,
  Minimize2,
  Menu,
  ChevronDown,
  Activity,
  Compass
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { Flight } from '../types/airline';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSimulating: boolean;
  onResetSimulation: () => void;
  onOpenQuickDelay: () => void;
  criticalAlertCount: number;
  totalAlertCount: number;
  flights: Flight[];
  onSelectFlight: (flightId: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  onResetSimulation,
  onOpenQuickDelay,
  criticalAlertCount,
  totalAlertCount,
  flights,
  onSelectFlight,
  onToggleMobileSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [istTime, setIstTime] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Navigation: Command/Ctrl + K to focus search, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      } else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update dual live clock every second (IST & UTC standard aviation time)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // IST Format
      const istOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      // UTC Format
      const utcOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setIstTime(now.toLocaleTimeString('en-GB', istOptions) + ' IST');
      setUtcTime(now.toLocaleTimeString('en-GB', utcOptions) + 'Z');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Filter search results
  const searchResults = flights
    .filter(f =>
      f.flight_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tail_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.destination.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 6);

  return (
    <header className="bg-[#050B14] border-b border-[#1E3048] px-4 md:px-6 py-2.5 sticky top-0 z-40 select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand & Radar Status */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded bg-[#0A1422] border border-[#1E3048] text-slate-300 hover:text-white transition"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4 text-[#00D9FF]" />
            </button>
          )}

          {/* ATC Brand Title & Crosshair Icon */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('command-centre')}>
            <div className="w-8 h-8 rounded bg-[#0A1422] border border-[#00D9FF]/40 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,217,255,0.25)]">
              <Compass className="w-4 h-4 text-[#00D9FF] animate-spin-slow" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] absolute animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-sm tracking-widest text-[#EAF4FF]">
                  DOMINO SKY
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#247BFF]/20 text-[#00D9FF] border border-[#247BFF]/40">
                  ATC OCC v2.6
                </span>
              </div>
              <div className="text-[10px] text-[#8498AD] font-mono tracking-wider hidden sm:block">
                AI AIRLINE OPERATIONS CONTROL CENTRE
              </div>
            </div>
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-2 relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8498AD] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search flights, airports, or aircraft"
              placeholder="Search callsign, tail, hub (e.g. DS0301, DEL)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full bg-[#0A1422] text-[#EAF4FF] placeholder-[#8498AD]/70 pl-8 pr-12 py-1.5 rounded border border-[#1E3048] focus:border-[#00D9FF]/70 focus:outline-none text-xs font-mono transition"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono bg-[#101D2D] text-[#8498AD] rounded border border-[#1E3048]">
              ⌘K
            </kbd>
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#101D2D] border border-[#00D9FF]/40 rounded shadow-2xl p-2 z-50 font-mono text-xs max-h-72 overflow-y-auto">
              <div className="text-[10px] text-[#8498AD] px-2 py-1 uppercase font-bold border-b border-[#1E3048] mb-1">
                Active Tactical Flights
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-[#8498AD] text-center">No flights matching query.</div>
              ) : (
                searchResults.map(f => (
                  <button
                    key={f.flight_id}
                    onClick={() => {
                      onSelectFlight(f.flight_id);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                      setActiveTab('flight-operations');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-[#00D9FF]/10 hover:text-[#00D9FF] flex items-center justify-between transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Plane className="w-3 h-3 text-[#00D9FF]" />
                      <span className="font-bold text-white">{f.flight_id}</span>
                      <span className="text-[#8498AD]">({f.tail_id})</span>
                    </div>
                    <div className="text-xs text-[#EAF4FF]">
                      {f.origin} → {f.destination} ({f.dep} - {f.arr})
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Operational Status, Dual Clock, Disruption Trigger, Fullscreen & Profile */}
        <div className="flex items-center space-x-2 md:space-x-3 shrink-0 text-xs font-mono">
          {/* Dual Clock (IST & UTC Aviation Format) */}
          <div className="hidden lg:flex items-center space-x-2 bg-[#0A1422] border border-[#1E3048] px-2.5 py-1 rounded text-[11px] text-[#8498AD]">
            <Clock className="w-3 h-3 text-[#00D9FF]" />
            <span className="text-[#EAF4FF] font-bold">{istTime || '11:55:00 IST'}</span>
            <span className="text-[#1E3048]">|</span>
            <span>{utcTime || '06:25:00Z'}</span>
          </div>

          {/* Tactical DEFCON / Operational Status */}
          {isSimulating ? (
            <div className="flex items-center space-x-1.5 bg-[#FFB547]/15 border border-[#FFB547]/50 px-2.5 py-1 rounded text-[#FFB547]">
              <span className="w-2 h-2 rounded-full bg-[#FFB547] animate-ping" />
              <span className="font-bold text-[11px]">DISRUPTION ACTIVE</span>
              <button
                onClick={onResetSimulation}
                className="ml-1.5 px-1.5 py-0.5 rounded bg-[#101D2D] hover:bg-slate-800 text-[#EAF4FF] text-[10px] border border-[#1E3048] flex items-center space-x-1"
                title="Reset simulation"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>RESET</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-[#22D3A6]/10 border border-[#22D3A6]/30 px-2.5 py-1 rounded text-[#22D3A6]">
              <span className="w-2 h-2 rounded-full bg-[#22D3A6] animate-pulse" />
              <span className="font-bold text-[11px]">DEFCON 4 / NOMINAL</span>
            </div>
          )}

          {/* Disruption Simulator Button */}
          {!isSimulating && (
            <button
              onClick={onOpenQuickDelay}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded bg-[#101D2D] hover:bg-[#1A3065] border border-[#1E3048] text-[#00D9FF] text-xs transition"
              title="Inject Tactical Disruption"
            >
              <Sliders className="w-3 h-3" />
              <span>SIMULATE</span>
            </button>
          )}

          {/* Operational Alerts Bell */}
          <button
            onClick={() => setActiveTab('operational-alerts')}
            className="relative p-1.5 rounded bg-[#0A1422] hover:bg-[#101D2D] border border-[#1E3048] text-[#8498AD] hover:text-white transition"
            title="Operational Alerts"
            aria-label="View Operational Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            {totalAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF5364] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalAlertCount}
              </span>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="hidden sm:flex p-1.5 rounded bg-[#0A1422] hover:bg-[#101D2D] border border-[#1E3048] text-[#8498AD] hover:text-[#00D9FF] transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Controller Call-Sign Profile */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#1E3048]">
            <div className="w-7 h-7 rounded bg-[#101D2D] border border-[#00D9FF]/40 flex items-center justify-center font-mono font-bold text-[11px] text-[#00D9FF]">
              OCC
            </div>
            <div className="hidden xl:block text-left leading-tight">
              <div className="text-[11px] font-bold text-[#EAF4FF]">DS-ATC-1</div>
              <div className="text-[9px] text-[#8498AD]">SUPERVISOR</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
