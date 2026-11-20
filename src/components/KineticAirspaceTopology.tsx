import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Airport, Flight, SpareAircraft } from '../types/airline';
import {
  Compass,
  Layers,
  MapPin,
  Plane,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  X,
  Sparkles,
  Radio,
  Sliders,
  Globe2,
  Orbit,
  Box,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export type TopologyMode = 'geo-radar' | 'holo-tilt' | 'orbital-constellation';

interface KineticAirspaceTopologyProps {
  airports: Airport[];
  flights: Flight[];
  spares?: SpareAircraft[];
  selectedFlightId?: string | null;
  onSelectFlight: (flight: Flight) => void;
  selectedAirportId?: string | null;
  onSelectAirport?: (airportId: string | null) => void;
  onSimulateDelay?: (flightId: string) => void;
}

export const KineticAirspaceTopology: React.FC<KineticAirspaceTopologyProps> = ({
  airports,
  flights,
  spares = [],
  selectedFlightId,
  onSelectFlight,
  selectedAirportId,
  onSelectAirport,
  onSimulateDelay
}) => {
  // Mode Selection: 01 — GEO RADAR, 02 — 2.5D HOLO TILT, 03 — ORBITAL CONSTELLATION
  const [mode, setMode] = useState<TopologyMode>('geo-radar');

  // Toolbar & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ontime' | 'delayed'>('all');
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [labelMode, setLabelMode] = useState<'all' | 'hubs' | 'off'>('all');

  // Pan and Zoom States
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hover states for tooltips
  const [hoveredFlightId, setHoveredFlightId] = useState<string | null>(null);
  const [hoveredAirportId, setHoveredAirportId] = useState<string | null>(null);

  // Active Flight Object
  const activeFlight = useMemo(() => {
    return flights.find(f => f.flight_id === selectedFlightId) || flights[0];
  }, [flights, selectedFlightId]);

  // Active Airport Object
  const activeAirport = useMemo(() => {
    if (!selectedAirportId) return null;
    return airports.find(a => a.id === selectedAirportId) || null;
  }, [airports, selectedAirportId]);

  // Fast lookup hash map for airports
  const airportMap = useMemo(() => {
    const map = new Map<string, Airport>();
    for (const a of airports) {
      map.set(a.id, a);
    }
    return map;
  }, [airports]);

  // Daily movement statistics per airport
  const airportStats = useMemo(() => {
    const stats = new Map<
      string,
      { departures: number; arrivals: number; total: number; connectedAirports: Set<string> }
    >();
    for (const a of airports) {
      stats.set(a.id, { departures: 0, arrivals: 0, total: 0, connectedAirports: new Set() });
    }
    for (const f of flights) {
      const orig = stats.get(f.origin);
      if (orig) {
        orig.departures += 1;
        orig.total += 1;
        orig.connectedAirports.add(f.destination);
      }
      const dest = stats.get(f.destination);
      if (dest) {
        dest.arrivals += 1;
        dest.total += 1;
        dest.connectedAirports.add(f.origin);
      }
    }
    return stats;
  }, [airports, flights]);

  // Geographical Map Projection: Lat [8°N to 32°N], Lng [68°E to 94°E] -> SVG viewBox (1000 x 700)
  const getGeoCoords = (lat: number, lng: number) => {
    const minLng = 67.5;
    const maxLng = 94.5;
    const minLat = 7.5;
    const maxLat = 32.5;

    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 130;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 540 + 75;
    return { x, y };
  };

  // Deterministic Orbital Constellation Layout
  // Center is (500, 350) in SVG 1000 x 700
  const getOrbitalCoords = (airportId: string) => {
    const cx = 500;
    const cy = 350;

    // Mega Hubs: Central Core (R = 110)
    const megaHubAngles: Record<string, number> = {
      DEL: -Math.PI / 2, // North (270 deg)
      BLR: Math.PI / 2, // South (90 deg)
      BOM: Math.PI, // West (180 deg)
      HYD: 0 // East (0 deg)
    };

    if (megaHubAngles[airportId] !== undefined) {
      const angle = megaHubAngles[airportId];
      const r = 110;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    }

    // Regional Hubs: Mid Orbit (R = 215)
    const regionalAngles: Record<string, number> = {
      AMD: (5 * Math.PI) / 6, // 150 deg (North-West)
      CCU: -Math.PI / 6, // 330 deg (North-East)
      COK: (2 * Math.PI) / 3, // 120 deg (South-West)
      MAA: Math.PI / 3 // 60 deg (South-East)
    };

    if (regionalAngles[airportId] !== undefined) {
      const angle = regionalAngles[airportId];
      const r = 215;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    }

    // Spokes: Outer Orbit (R = 320)
    const spokeAngles: Record<string, number> = {
      JAI: -Math.PI * 0.65, // ~240 deg
      IXC: -Math.PI * 0.42, // ~285 deg
      LKO: -Math.PI * 0.25, // ~315 deg
      GAU: -Math.PI * 0.05, // ~350 deg
      BBI: Math.PI * 0.18, // ~32 deg
      TRV: Math.PI * 0.45, // ~80 deg
      GOI: Math.PI * 0.78, // ~140 deg
      PNQ: Math.PI * 0.95 // ~170 deg
    };

    const angle = spokeAngles[airportId] ?? Math.PI * 0.5;
    const r = 320;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Get coordinates based on active visualization mode
  const getAirportPosition = (airport: Airport) => {
    if (mode === 'orbital-constellation') {
      return getOrbitalCoords(airport.id);
    }
    return getGeoCoords(airport.lat, airport.lng);
  };

  // Filtered flights based on search query, airport selection, and status filter
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      // Status filter
      if (statusFilter === 'ontime' && (f.delay_minutes || 0) > 0) return false;
      if (statusFilter === 'delayed' && (f.delay_minutes || 0) === 0) return false;

      // Selected airport filter
      if (selectedAirportId) {
        if (f.origin !== selectedAirportId && f.destination !== selectedAirportId) {
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesFlight = f.flight_id.toLowerCase().includes(q);
        const matchesOrigin = f.origin.toLowerCase().includes(q);
        const matchesDest = f.destination.toLowerCase().includes(q);
        const matchesTail = f.tail_id.toLowerCase().includes(q);
        if (!matchesFlight && !matchesOrigin && !matchesDest && !matchesTail) {
          return false;
        }
      }

      return true;
    });
  }, [flights, statusFilter, selectedAirportId, searchQuery]);

  // Reset view to default zoom and pan
  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(2.4, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.6, prev - 0.2));

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on primary mouse click outside interactive elements
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).classList.contains('pan-surface')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate smooth curved flight route path (Bézier arc)
  const calculateRoutePath = (f: Flight) => {
    const orig = airportMap.get(f.origin);
    const dest = airportMap.get(f.destination);
    if (!orig || !dest) return '';

    const p1 = getAirportPosition(orig);
    const p2 = getAirportPosition(dest);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    // Deterministic curve offset to separate outbound and inbound legs
    const isOutbound = f.origin < f.destination;
    const sign = isOutbound ? 1 : -1;

    let cpx: number;
    let cpy: number;

    if (mode === 'orbital-constellation') {
      // In constellation mode, arc around the orbital center (500, 350)
      const toCenterX = 500 - mx;
      const toCenterY = 350 - my;
      const toCenterDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY) || 1;
      const normalX = toCenterX / toCenterDist;
      const normalY = toCenterY / toCenterDist;

      const curveFactor = Math.min(60, dist * 0.22);
      cpx = mx + normalX * curveFactor * sign;
      cpy = my + normalY * curveFactor * sign;
    } else if (mode === 'holo-tilt') {
      // In 2.5D Holo Tilt, elevate the trajectory high into the 3D airspace
      const normalX = (-dy / dist) * sign;
      const normalY = (dx / dist) * sign;
      const lateralFactor = Math.min(35, dist * 0.12);
      const elevationAltitude = 35 + Math.min(45, dist * 0.16);

      cpx = mx + normalX * lateralFactor;
      cpy = my + normalY * lateralFactor - elevationAltitude;
    } else {
      // Standard Geo Radar: Elegant aerodynamic quadratic arc
      const normalX = (-dy / dist) * sign;
      const normalY = (dx / dist) * sign;
      const curveFactor = Math.min(50, Math.max(16, dist * 0.15));

      cpx = mx + normalX * curveFactor;
      cpy = my + normalY * curveFactor;
    }

    return `M ${p1.x} ${p1.y} Q ${cpx} ${cpy} ${p2.x} ${p2.y}`;
  };

  // Node radius in constellation mode proportional to daily flight volume
  const getConstellationNodeRadius = (airportId: string) => {
    const stats = airportStats.get(airportId);
    const count = stats?.total || 4;
    // Map total movements (from 4 up to 22) into radius (11 to 24)
    return Math.max(11, Math.min(24, 10 + count * 0.65));
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col bg-[#050B14] border border-[#1E3048] rounded relative overflow-hidden select-none font-mono ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* =========================================================================
          HEADER: KINETIC AIRSPACE TOPOLOGY + SUBTITLE + SEGMENTED MODE SELECTOR
      ========================================================================= */}
      <div className="px-4 py-3 bg-[#0A1422] border-b border-[#1E3048] flex flex-wrap items-center justify-between gap-3 z-30 shadow-md">
        {/* Title & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[#101D2D] border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.25)]">
            <Radio className="w-4 h-4 text-[#00D9FF]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm text-[#EAF4FF] tracking-wider">
                KINETIC AIRSPACE TOPOLOGY
              </h2>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 font-bold uppercase tracking-wider">
                {mode === 'geo-radar'
                  ? 'GEO TOPOLOGY'
                  : mode === 'holo-tilt'
                  ? '2.5D PERSPECTIVE'
                  : 'CELESTIAL CLUSTER'}
              </span>
            </div>
            <p className="text-[10px] text-[#8498AD] font-sans">
              Intelligent visualization of global flight connections and operational activity.
            </p>
          </div>
        </div>

        {/* Segmented Mode Selector: 01 — GEO RADAR, 02 — 2.5D HOLO TILT, 03 — ORBITAL CONSTELLATION */}
        <div className="flex items-center bg-[#050B14] p-1 rounded border border-[#1E3048]">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'geo-radar'}
            onClick={() => setMode('geo-radar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-200 ${
              mode === 'geo-radar'
                ? 'bg-[#00D9FF] text-[#050B14] shadow-[0_0_12px_rgba(0,217,255,0.4)]'
                : 'text-[#8498AD] hover:text-[#EAF4FF] hover:bg-[#101D2D]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>01 — GEO RADAR</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'holo-tilt'}
            onClick={() => setMode('holo-tilt')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-200 ${
              mode === 'holo-tilt'
                ? 'bg-[#247BFF] text-[#EAF4FF] shadow-[0_0_12px_rgba(36,123,255,0.4)]'
                : 'text-[#8498AD] hover:text-[#EAF4FF] hover:bg-[#101D2D]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>02 — 2.5D HOLO TILT</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'orbital-constellation'}
            onClick={() => setMode('orbital-constellation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-200 ${
              mode === 'orbital-constellation'
                ? 'bg-[#22D3A6] text-[#050B14] shadow-[0_0_12px_rgba(34,211,166,0.4)]'
                : 'text-[#8498AD] hover:text-[#EAF4FF] hover:bg-[#101D2D]'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>03 — ORBITAL CONSTELLATION</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TOOLBAR: SEARCH, STATUS FILTER, TOGGLE ROUTES, LABELS, PAN/ZOOM & FULLSCREEN
      ========================================================================= */}
      <div className="px-4 py-2 bg-[#0D1726]/90 border-b border-[#1E3048] flex flex-wrap items-center justify-between gap-2 z-20 text-xs">
        {/* Left Controls: Search & Status Filter */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#8498AD] absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search flight or airport..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#050B14] border border-[#1E3048] rounded pl-7 pr-7 py-1 text-[11px] text-[#EAF4FF] placeholder-[#8498AD] focus:outline-none focus:border-[#00D9FF] w-48 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#8498AD] hover:text-[#EAF4FF]"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#050B14] rounded border border-[#1E3048] p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#1E3048] text-[#EAF4FF]'
                  : 'text-[#8498AD] hover:text-[#EAF4FF]'
              }`}
            >
              ALL ({flights.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ontime')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'ontime'
                  ? 'bg-[#22D3A6]/20 text-[#22D3A6]'
                  : 'text-[#8498AD] hover:text-[#22D3A6]'
              }`}
            >
              ON-TIME ({flights.filter(f => !f.delay_minutes).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('delayed')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'delayed'
                  ? 'bg-[#FFB547]/20 text-[#FFB547]'
                  : 'text-[#8498AD] hover:text-[#FFB547]'
              }`}
            >
              DELAYED ({flights.filter(f => (f.delay_minutes || 0) > 0).length})
            </button>
          </div>
        </div>

        {/* Right Controls: Routes, Labels, Zoom, Fullscreen */}
        <div className="flex items-center space-x-2">
          {/* Route Visibility Toggle */}
          <button
            type="button"
            onClick={() => setShowRoutes(prev => !prev)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] font-bold transition-all ${
              showRoutes
                ? 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/40'
                : 'bg-[#050B14] text-[#8498AD] border-[#1E3048]'
            }`}
            title="Toggle Flight Route Visibility"
          >
            {showRoutes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>ROUTES: {showRoutes ? 'ON' : 'OFF'}</span>
          </button>

          {/* Airport Label Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (labelMode === 'all') setLabelMode('hubs');
              else if (labelMode === 'hubs') setLabelMode('off');
              else setLabelMode('all');
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#050B14] text-[#8498AD] hover:text-[#EAF4FF] border border-[#1E3048] text-[11px] font-bold"
            title="Cycle Airport Label Density"
          >
            <span>LABELS: {labelMode.toUpperCase()}</span>
          </button>

          {/* Zoom In/Out & Reset */}
          <div className="flex items-center bg-[#050B14] rounded border border-[#1E3048]">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:bg-[#101D2D] text-[#8498AD] hover:text-[#00D9FF] transition-all"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:bg-[#101D2D] text-[#8498AD] hover:text-[#00D9FF] transition-all border-l border-[#1E3048]"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1 hover:bg-[#101D2D] text-[#8498AD] hover:text-[#22D3A6] transition-all border-l border-[#1E3048]"
              title="Reset View"
              aria-label="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-[#050B14] text-[#8498AD] hover:text-[#00D9FF] border border-[#1E3048] transition-all"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN VISUALIZATION CANVAS (GEO RADAR / 2.5D HOLO TILT / ORBITAL CONSTELLATION)
      ========================================================================= */}
      <div
        className={`relative flex-1 w-full h-full overflow-hidden cursor-crosshair pan-surface ${
          mode === 'holo-tilt' ? 'perspective-1200' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background Cyber Topology Grid */}
        <div className="absolute inset-0 radar-grid-bg opacity-30 pointer-events-none" />

        {/* 3D Holo Tilt Wrapper if mode === 'holo-tilt' */}
        <div
          className={`w-full h-full transition-all duration-700 ease-out ${
            mode === 'holo-tilt' ? 'holo-tilt-surface' : ''
          }`}
          style={{
            transform:
              mode === 'holo-tilt'
                ? `rotateX(46deg) rotateZ(-12deg) scale(${zoom * 0.92}) translate(${panOffset.x}px, ${panOffset.y}px)`
                : `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '50% 50%'
          }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Neon Glow Filters */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Vertical Light Pillar Gradient for 2.5D Holo Tilt */}
              <linearGradient id="lightPillarGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.15" />
                <stop offset="60%" stopColor="#00D9FF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#EAF4FF" stopOpacity="1" />
              </linearGradient>

              {/* Active Route Gradient */}
              <linearGradient id="activeFlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#247BFF" />
                <stop offset="50%" stopColor="#00D9FF" />
                <stop offset="100%" stopColor="#22D3A6" />
              </linearGradient>
            </defs>

            {/* =================================================================
                MODE-SPECIFIC BACKGROUND GRAPHICS
            ================================================================= */}
            {mode === 'orbital-constellation' && (
              <g className="orbital-tracks opacity-35 pointer-events-none">
                {/* Concentric Orbital Celestial Rings */}
                <circle cx="500" cy="350" r="110" fill="none" stroke="#247BFF" strokeWidth="1" strokeDasharray="4 6" />
                <circle cx="500" cy="350" r="215" fill="none" stroke="#00D9FF" strokeWidth="1" strokeDasharray="6 8" />
                <circle cx="500" cy="350" r="320" fill="none" stroke="#1E3048" strokeWidth="1.2" strokeDasharray="8 12" />

                {/* Celestial Axis Crosshairs */}
                <line x1="160" y1="350" x2="840" y2="350" stroke="#1E3048" strokeWidth="0.8" strokeDasharray="2 4" />
                <line x1="500" y1="10" x2="500" y2="690" stroke="#1E3048" strokeWidth="0.8" strokeDasharray="2 4" />

                {/* Central Celestial Core Beacon */}
                <circle cx="500" cy="350" r="8" fill="#0A1422" stroke="#00D9FF" strokeWidth="1.5" />
                <circle cx="500" cy="350" r="3" fill="#00D9FF" />
                <text x="500" y="370" textAnchor="middle" fill="#8498AD" fontSize="9" letterSpacing="2">
                  DOMINO SKY CORE
                </text>
              </g>
            )}

            {mode === 'geo-radar' && (
              <g className="geo-grid opacity-20 pointer-events-none">
                {/* Latitude & Longitude Parallels across India */}
                {[10, 15, 20, 25, 30].map(lat => {
                  const { y } = getGeoCoords(lat, 68);
                  return (
                    <g key={`lat-${lat}`}>
                      <line x1="100" y1={y} x2="900" y2={y} stroke="#1E3048" strokeWidth="0.75" strokeDasharray="4 6" />
                      <text x="910" y={y + 3} fill="#8498AD" fontSize="8">{lat}°N</text>
                    </g>
                  );
                })}
                {[70, 75, 80, 85, 90].map(lng => {
                  const { x } = getGeoCoords(8, lng);
                  return (
                    <g key={`lng-${lng}`}>
                      <line x1={x} y1="70" x2={x} y2="630" stroke="#1E3048" strokeWidth="0.75" strokeDasharray="4 6" />
                      <text x={x} y="645" textAnchor="middle" fill="#8498AD" fontSize="8">{lng}°E</text>
                    </g>
                  );
                })}
              </g>
            )}

            {mode === 'holo-tilt' && (
              <g className="holo-ground-mesh opacity-25 pointer-events-none">
                {/* Perspective 3D Ground Plane Grid */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line
                    key={`hg-${i}`}
                    x1="80"
                    y1={80 + i * 65}
                    x2="920"
                    y2={80 + i * 65}
                    stroke="#247BFF"
                    strokeWidth="1"
                    strokeDasharray="4 8"
                  />
                ))}
                {Array.from({ length: 11 }).map((_, i) => (
                  <line
                    key={`vg-${i}`}
                    x1={100 + i * 80}
                    y1="60"
                    x2={100 + i * 80}
                    y2="640"
                    stroke="#00D9FF"
                    strokeWidth="0.8"
                    strokeDasharray="4 8"
                  />
                ))}
              </g>
            )}

            {/* =================================================================
                FLIGHT ROUTE ARCS (CURVED BÉZIER SPLINES)
            ================================================================= */}
            {showRoutes && (
              <g className="flight-routes">
                {filteredFlights.map(f => {
                  const isSelected = f.flight_id === selectedFlightId;
                  const isHovered = f.flight_id === hoveredFlightId;
                  const isDelayed = (f.delay_minutes || 0) > 0;
                  const pathD = calculateRoutePath(f);
                  if (!pathD) return null;

                  // Highlighting rules
                  const isConnectedToSelectedAirport =
                    selectedAirportId &&
                    (f.origin === selectedAirportId || f.destination === selectedAirportId);

                  let strokeColor = '#247BFF';
                  let strokeOpacity = 0.28;
                  let strokeWidth = 1.2;

                  if (isSelected) {
                    strokeColor = '#00D9FF';
                    strokeOpacity = 1;
                    strokeWidth = 3;
                  } else if (isHovered) {
                    strokeColor = '#00D9FF';
                    strokeOpacity = 0.85;
                    strokeWidth = 2.2;
                  } else if (isConnectedToSelectedAirport) {
                    strokeColor = isDelayed ? '#FFB547' : '#00D9FF';
                    strokeOpacity = 0.75;
                    strokeWidth = 2;
                  } else if (isDelayed) {
                    strokeColor = '#FFB547';
                    strokeOpacity = 0.65;
                  } else if (selectedAirportId || selectedFlightId) {
                    // Dim non-selected routes gracefully
                    strokeOpacity = 0.08;
                  }

                  return (
                    <g
                      key={`route-${f.flight_id}`}
                      className="cursor-pointer group"
                      onClick={() => onSelectFlight(f)}
                      onMouseEnter={() => setHoveredFlightId(f.flight_id)}
                      onMouseLeave={() => setHoveredFlightId(null)}
                    >
                      {/* Invisible wider hit area for easy clicking */}
                      <path d={pathD} fill="none" stroke="transparent" strokeWidth="12" />

                      {/* Visible Curved Route Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        filter={isSelected || isHovered ? 'url(#cyanGlow)' : undefined}
                        className={isSelected ? 'animate-kinetic-dash' : 'transition-all duration-300'}
                        strokeDasharray={isSelected ? '8 6' : undefined}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* =================================================================
                AIRPORT MARKERS & VERTICAL BEAMS (2.5D HOLO TILT)
            ================================================================= */}
            <g className="airports">
              {airports.map(airport => {
                const pos = getAirportPosition(airport);
                const isSelected = airport.id === selectedAirportId;
                const isHovered = airport.id === hoveredAirportId;
                const stats = airportStats.get(airport.id);
                const isConnected =
                  selectedAirportId &&
                  airportStats.get(selectedAirportId)?.connectedAirports.has(airport.id);

                // Tier styling
                const isMega = airport.tier === 'mega_hub';
                const isRegional = airport.tier === 'regional_hub';

                let nodeRadius = isMega ? 7.5 : isRegional ? 5.5 : 4;
                if (mode === 'orbital-constellation') {
                  nodeRadius = getConstellationNodeRadius(airport.id);
                }

                let primaryColor = isMega ? '#00D9FF' : isRegional ? '#247BFF' : '#8498AD';
                if (isSelected) primaryColor = '#22D3A6';
                if (isConnected) primaryColor = '#00D9FF';

                // Label visibility logic
                const showThisLabel =
                  labelMode === 'all' ||
                  (labelMode === 'hubs' && (isMega || isRegional)) ||
                  isSelected ||
                  isHovered;

                return (
                  <g
                    key={`ap-${airport.id}`}
                    className="cursor-pointer group"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectAirport?.(isSelected ? null : airport.id);
                    }}
                    onMouseEnter={() => setHoveredAirportId(airport.id)}
                    onMouseLeave={() => setHoveredAirportId(null)}
                  >
                    {/* Mode 2.5D HOLO TILT: Vertical Light Pillar Beam */}
                    {mode === 'holo-tilt' && (
                      <g className="holo-pillar">
                        {/* Ground Base Disc */}
                        <ellipse
                          cx={pos.x}
                          cy={pos.y}
                          rx={isMega ? 8 : 5}
                          ry={isMega ? 4 : 2.5}
                          fill="#0A1422"
                          stroke={primaryColor}
                          strokeWidth="1.2"
                          strokeOpacity="0.4"
                        />
                        {/* Vertical Light Pillar Line to Elevated Position */}
                        <line
                          x1={pos.x}
                          y1={pos.y}
                          x2={pos.x}
                          y2={pos.y - 36}
                          stroke="url(#lightPillarGradient)"
                          strokeWidth={isMega ? '2.5' : '1.8'}
                          strokeDasharray="2 3"
                        />
                      </g>
                    )}

                    {/* Elevated Node Position (Offset Y in 2.5D Holo Tilt) */}
                    <g transform={`translate(${pos.x}, ${mode === 'holo-tilt' ? pos.y - 36 : pos.y})`}>
                      {/* Pulse Ring for Selected or Mega Hubs */}
                      {(isSelected || isMega) && (
                        <circle
                          cx="0"
                          cy="0"
                          r={nodeRadius * 1.8}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth="1"
                          strokeOpacity="0.35"
                          className="animate-pulse"
                        />
                      )}

                      {/* Halo Backing */}
                      <circle
                        cx="0"
                        cy="0"
                        r={nodeRadius}
                        fill="#0A1422"
                        stroke={primaryColor}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        filter={isSelected || isHovered ? 'url(#cyanGlow)' : undefined}
                      />

                      {/* Solid Center Pip */}
                      <circle
                        cx="0"
                        cy="0"
                        r={Math.max(2, nodeRadius * 0.45)}
                        fill={primaryColor}
                      />

                      {/* Constellation Movement Indicator Text */}
                      {mode === 'orbital-constellation' && (
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#EAF4FF"
                          fontSize="9"
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          {airport.id}
                        </text>
                      )}

                      {/* Airport Label (Geo Radar & Holo Tilt) */}
                      {mode !== 'orbital-constellation' && showThisLabel && (
                        <g
                          transform="translate(0, -12)"
                          className={mode === 'holo-tilt' ? 'holo-billboard' : ''}
                        >
                          <rect
                            x="-18"
                            y="-11"
                            width="36"
                            height="13"
                            rx="2"
                            fill="#0A1422"
                            fillOpacity="0.88"
                            stroke={isSelected ? '#22D3A6' : isMega ? '#00D9FF' : '#1E3048'}
                            strokeWidth="0.8"
                          />
                          <text
                            x="0"
                            y="-2"
                            textAnchor="middle"
                            fill={isSelected ? '#22D3A6' : '#EAF4FF'}
                            fontSize="8.5"
                            fontWeight="bold"
                            letterSpacing="0.5"
                            className="pointer-events-none"
                          >
                            {airport.id}
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* =========================================================================
            STATUS LEGEND (BOTTOM-LEFT FLOATING BAR)
        ========================================================================= */}
        <div className="absolute bottom-3 left-3 bg-[#0A1422]/90 backdrop-blur-md px-3 py-2 rounded border border-[#1E3048] flex items-center space-x-4 text-[10px] text-[#8498AD] z-20 shadow-lg pointer-events-auto">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF] shadow-[0_0_6px_rgba(0,217,255,0.8)]" />
            <span className="text-[#EAF4FF] font-bold">Active Flights</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB547] shadow-[0_0_6px_rgba(255,181,71,0.8)]" />
            <span className="text-[#FFB547] font-bold">Delayed</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3A6] shadow-[0_0_6px_rgba(34,211,166,0.8)]" />
            <span className="text-[#22D3A6] font-bold">Nominal / Spares</span>
          </div>
          <div className="flex items-center space-x-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-full bg-[#247BFF]" />
            <span>Airports</span>
          </div>
          <div className="flex items-center space-x-1.5 hidden md:flex">
            <span className="w-3.5 h-0.5 bg-[#00D9FF] rounded" />
            <span>Curved Arcs</span>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE INFORMATION PANEL (SLIDE-IN ON SELECTION)
        ========================================================================= */}
        {(activeAirport || (activeFlight && selectedFlightId)) && (
          <div className="absolute top-3 right-3 w-80 max-w-[calc(100%-24px)] bg-[#0D1726]/95 backdrop-blur-md border border-[#1E3048] rounded p-3.5 z-30 shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header: Item Identity & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1E3048]">
              <div className="flex items-center space-x-2">
                {activeAirport ? (
                  <MapPin className="w-4 h-4 text-[#22D3A6]" />
                ) : (
                  <Plane className="w-4 h-4 text-[#00D9FF]" />
                )}
                <div>
                  <span className="font-extrabold text-sm text-[#EAF4FF]">
                    {activeAirport ? `${activeAirport.name} (${activeAirport.id})` : activeFlight.flight_id}
                  </span>
                  <div className="text-[10px] text-[#8498AD]">
                    {activeAirport
                      ? `City: ${activeAirport.city} • Tier: ${activeAirport.tier.replace('_', ' ').toUpperCase()}`
                      : `${activeFlight.origin} → ${activeFlight.destination} • Leg ${activeFlight.leg_order}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (activeAirport) onSelectAirport?.(null);
                }}
                className="text-[#8498AD] hover:text-[#EAF4FF] p-1 rounded hover:bg-[#1E3048]"
                aria-label="Close details"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content: Airport View */}
            {activeAirport && (
              <div className="space-y-2.5 text-[11px]">
                <div className="grid grid-cols-2 gap-2 bg-[#050B14] p-2 rounded border border-[#1E3048]">
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Runway Capacity</span>
                    <span className="font-bold text-[#00D9FF]">
                      {activeAirport.capacity_per_hour} mvts/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Total Daily Flights</span>
                    <span className="font-bold text-[#EAF4FF]">
                      {airportStats.get(activeAirport.id)?.total || 0} flights
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Departures</span>
                    <span className="font-bold text-[#22D3A6]">
                      {airportStats.get(activeAirport.id)?.departures || 0} deps
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Arrivals</span>
                    <span className="font-bold text-[#247BFF]">
                      {airportStats.get(activeAirport.id)?.arrivals || 0} arrs
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[#8498AD] text-[10px] block mb-1">
                    Directly Connected Destinations ({airportStats.get(activeAirport.id)?.connectedAirports.size || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(airportStats.get(activeAirport.id)?.connectedAirports || []).map(destId => (
                      <span
                        key={destId}
                        className="px-1.5 py-0.5 rounded bg-[#101D2D] border border-[#1E3048] text-[10px] font-bold text-[#00D9FF]"
                      >
                        {destId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content: Flight View */}
            {!activeAirport && activeFlight && (
              <div className="space-y-2.5 text-[11px]">
                <div className="grid grid-cols-2 gap-2 bg-[#050B14] p-2 rounded border border-[#1E3048]">
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Departure / Arrival</span>
                    <span className="font-bold text-[#EAF4FF]">
                      {activeFlight.dep} - {activeFlight.arr} IST
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Block Duration</span>
                    <span className="font-bold text-[#00D9FF]">
                      {activeFlight.block_minutes} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Aircraft Tail</span>
                    <span className="font-bold text-[#22D3A6]">
                      {activeFlight.tail_id} (180 seats)
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8498AD] text-[10px] block">Pax Booked</span>
                    <span className="font-bold text-[#FFB547]">
                      {activeFlight.pax} pax ({Math.round((activeFlight.pax / 180) * 100)}% LF)
                    </span>
                  </div>
                </div>

                {/* Status & Delay Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        (activeFlight.delay_minutes || 0) > 0 ? 'bg-[#FFB547]' : 'bg-[#22D3A6]'
                      }`}
                    />
                    <span className="font-bold text-[11px] text-[#EAF4FF]">
                      {(activeFlight.delay_minutes || 0) > 0
                        ? `DELAYED +${activeFlight.delay_minutes}M`
                        : 'ON SCHEDULE'}
                    </span>
                  </div>

                  {onSimulateDelay && (
                    <button
                      type="button"
                      onClick={() => onSimulateDelay(activeFlight.flight_id)}
                      className="px-2.5 py-1 rounded bg-[#FFB547]/20 text-[#FFB547] hover:bg-[#FFB547]/30 border border-[#FFB547]/40 text-[10px] font-bold transition-all"
                    >
                      SIMULATE DELAY
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
