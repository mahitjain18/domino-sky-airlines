import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Search,
  Bell,
  Clock,
  Sliders,
  RotateCcw,
  Plane,
  Maximize2,
  Minimize2,
  Menu,
  Compass
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { Flight } from '../types/airline';
import { sanitizeSearchInput } from '../utils/airlineCalculations';

/**
 * Isolated DualClock subcomponent.
 * Rerenders only itself every second to prevent re-rendering the parent Navbar.
 */
const DualClock: React.FC = memo(() => {
  const [istTime, setIstTime] = useState('');
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
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

  return (
    <div
      aria-label="Aviation Clocks (Indian Standard Time and Coordinated Universal Time)"
      className="hidden lg:flex items-center space-x-2 bg-[#0A1422] border border-[#1E3048] px-2.5 py-1 rounded text-[11px] text-[#8498AD]"
    >
      <Clock className="w-3 h-3 text-[#00D9FF]" aria-hidden="true" />
      <span className="text-[#EAF4FF] font-bold">{istTime || '11:55:00 IST'}</span>
      <span className="text-[#1E3048]" aria-hidden="true">|</span>
      <span>{utcTime || '06:25:00Z'}</span>
    </div>
  );
});

DualClock.displayName = 'DualClock';

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
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation: ⌘K or Ctrl+K to focus search, Escape to close
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

  const sanitizedQuery = sanitizeSearchInput(searchQuery).toLowerCase();

  // Filter search results
  const searchResults = sanitizedQuery
    ? flights
        .filter(f =>
          f.flight_id.toLowerCase().includes(sanitizedQuery) ||
          f.tail_id.toLowerCase().includes(sanitizedQuery) ||
          f.origin.toLowerCase().includes(sanitizedQuery) ||
          f.destination.toLowerCase().includes(sanitizedQuery)
        )
        .slice(0, 6)
    : [];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
      if (target) {
        onSelectFlight(target.flight_id);
        setShowSearchDropdown(false);
        setSearchQuery('');
        setSelectedIndex(-1);
        setActiveTab('flight-operations');
      }
    }
  };

  return (
    <header
      role="banner"
      className="bg-[#050B14] border-b border-[#1E3048] px-4 md:px-6 py-2.5 sticky top-0 z-40 select-none"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand & Radar Status */}
        <div className="flex items-center space-x-3 shrink-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded bg-[#0A1422] border border-[#1E3048] text-slate-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded="false"
            >
              <Menu className="w-4 h-4 text-[#00D9FF]" />
            </button>
          )}

          {/* ATC Brand Title & Crosshair Icon */}
          <button
            onClick={() => setActiveTab('command-centre')}
            className="flex items-center space-x-2.5 text-left focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none rounded p-1"
            aria-label="Domino Sky Command Centre Home"
          >
            <div className="w-8 h-8 rounded bg-[#0A1422] border border-[#00D9FF]/40 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,217,255,0.25)]">
              <Compass className="w-4 h-4 text-[#00D9FF] animate-spin-slow" aria-hidden="true" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] absolute animate-ping" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-sm tracking-widest text-[#EAF4FF]">
                  DOMINO SKY
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#247BFF]/20 text-[#00D9FF] border border-[#247BFF]/40 font-bold">
                  ATC OCC v2.6
                </span>
                <span className="hidden md:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0A1422] text-[#8498AD] border border-[#1E3048]">
                  {activeTab.toUpperCase().replace('-', ' ')}
                </span>
              </div>
              <div className="text-[10px] text-[#8498AD] font-mono tracking-wider hidden sm:block">
                AI AIRLINE OPERATIONS CONTROL CENTRE
              </div>
            </div>
          </button>
        </div>

        {/* Center: Search Box */}
        <div ref={searchContainerRef} className="flex-1 max-w-md mx-2 relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8498AD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSearchDropdown && searchResults.length > 0}
              aria-controls="search-dropdown-list"
              aria-label="Search flights, airports, or aircraft callsigns"
              placeholder="Search callsign, tail, hub (e.g. DS0301, DEL)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-[#0A1422] text-[#EAF4FF] placeholder-[#8498AD]/70 pl-8 pr-12 py-1.5 rounded border border-[#1E3048] focus:border-[#00D9FF]/70 focus:ring-1 focus:ring-[#00D9FF] focus:outline-none text-xs font-mono transition"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono bg-[#101D2D] text-[#8498AD] rounded border border-[#1E3048]">
              ⌘K
            </kbd>
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div
              id="search-dropdown-list"
              role="listbox"
              aria-label="Flight Search Results"
              className="absolute top-full left-0 right-0 mt-1.5 bg-[#101D2D] border border-[#00D9FF]/40 rounded shadow-2xl p-2 z-50 font-mono text-xs max-h-72 overflow-y-auto"
            >
              <div className="text-[10px] text-[#8498AD] px-2 py-1 uppercase font-bold border-b border-[#1E3048] mb-1">
                Active Tactical Flights ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-[#8498AD] text-center">No flights matching query.</div>
              ) : (
                searchResults.map((f, idx) => (
                  <button
                    key={f.flight_id}
                    role="option"
                    aria-selected={selectedIndex === idx}
                    onClick={() => {
                      onSelectFlight(f.flight_id);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                      setSelectedIndex(-1);
                      setActiveTab('flight-operations');
                    }}
                    className={`w-full text-left p-2 rounded flex items-center justify-between transition focus-visible:ring-1 focus-visible:ring-[#00D9FF] focus-visible:outline-none ${
                      selectedIndex === idx
                        ? 'bg-[#00D9FF]/20 text-[#00D9FF] font-bold'
                        : 'hover:bg-[#00D9FF]/10 hover:text-[#00D9FF]'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Plane className="w-3 h-3 text-[#00D9FF]" aria-hidden="true" />
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
          <DualClock />

          {/* Tactical DEFCON / Operational Status */}
          {isSimulating ? (
            <div
              aria-live="polite"
              className="flex items-center space-x-1.5 bg-[#FFB547]/15 border border-[#FFB547]/50 px-2.5 py-1 rounded text-[#FFB547]"
            >
              <span className="w-2 h-2 rounded-full bg-[#FFB547] animate-ping" aria-hidden="true" />
              <span className="font-bold text-[11px]">DISRUPTION ACTIVE</span>
              <button
                onClick={onResetSimulation}
                className="ml-1.5 px-1.5 py-0.5 rounded bg-[#101D2D] hover:bg-slate-800 text-[#EAF4FF] text-[10px] border border-[#1E3048] flex items-center space-x-1 focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
                title="Reset simulation to nominal baseline"
                aria-label="Reset simulation to nominal baseline"
              >
                <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
                <span>RESET</span>
              </button>
            </div>
          ) : (
            <div
              aria-live="polite"
              className="flex items-center space-x-1.5 bg-[#22D3A6]/10 border border-[#22D3A6]/30 px-2.5 py-1 rounded text-[#22D3A6]"
            >
              <span className="w-2 h-2 rounded-full bg-[#22D3A6] animate-pulse" aria-hidden="true" />
              <span className="font-bold text-[11px]">DEFCON 4 / NOMINAL</span>
            </div>
          )}

          {/* Disruption Simulator Button */}
          {!isSimulating && (
            <button
              onClick={onOpenQuickDelay}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded bg-[#101D2D] hover:bg-[#1A3065] border border-[#1E3048] text-[#00D9FF] text-xs transition focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
              title="Inject Tactical Disruption"
              aria-label="Inject Tactical Disruption"
            >
              <Sliders className="w-3 h-3" aria-hidden="true" />
              <span>SIMULATE</span>
            </button>
          )}

          {/* Operational Alerts Bell */}
          <button
            onClick={() => setActiveTab('operational-alerts')}
            className="relative p-1.5 rounded bg-[#0A1422] hover:bg-[#101D2D] border border-[#1E3048] text-[#8498AD] hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
            title="Operational Alerts"
            aria-label={`View Operational Alerts (${totalAlertCount} total alerts, ${criticalAlertCount} critical)`}
          >
            <Bell className="w-3.5 h-3.5" aria-hidden="true" />
            {totalAlertCount > 0 && (
              <span
                aria-hidden="true"
                className={`absolute -top-1 -right-1 w-3.5 h-3.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse ${
                  criticalAlertCount > 0 ? 'bg-[#FF5364]' : 'bg-[#FFB547]'
                }`}
              >
                {totalAlertCount}
              </span>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="hidden sm:flex p-1.5 rounded bg-[#0A1422] hover:bg-[#101D2D] border border-[#1E3048] text-[#8498AD] hover:text-[#00D9FF] transition focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {/* Controller Call-Sign Profile */}
          <div
            aria-label="Current Air Traffic Controller: DS-ATC-1 Supervisor"
            className="flex items-center space-x-2 pl-2 border-l border-[#1E3048]"
          >
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
