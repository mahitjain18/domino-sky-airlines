import React, { useState } from 'react';
import { Flight, OperationalAlert } from '../types/airline';
import { Clock } from 'lucide-react';

interface AtcOperationsTimelineProps {
  flights: Flight[];
  alerts?: OperationalAlert[];
  onSelectFlight: (flight: Flight) => void;
  selectedFlightId?: string | null;
}

export const AtcOperationsTimeline: React.FC<AtcOperationsTimelineProps> = ({
  flights,
  alerts = [],
  onSelectFlight,
  selectedFlightId
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(12); // Default to midday peak

  // 24 hour buckets from 05:00 to 22:00
  const hours = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  // Flights operating in selected hour
  const flightsInHour = flights.filter(f => {
    const depHour = parseInt(f.dep.split(':')[0], 10);
    const arrHour = parseInt(f.arr.split(':')[0], 10);
    return depHour === selectedHour || arrHour === selectedHour;
  });

  return (
    <div className="w-full bg-[#0A1422] border border-[#1E3048] rounded text-xs font-mono select-none">
      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-[#1E3048] flex flex-wrap items-center justify-between gap-2 bg-[#101D2D]/60">
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span className="font-bold text-[#EAF4FF] tracking-wider">
            24-HOUR OPERATIONAL TIMELINE & RUNWAY MOVEMENTS
          </span>
          <span className="text-[#8498AD] text-[10px]">
            ({flightsInHour.length} movements in window {selectedHour.toString().padStart(2, '0')}:00)
          </span>
        </div>

        {/* Hour Selector Buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto max-w-full py-0.5">
          {hours.map(h => {
            const hasMovements = flights.some(f => parseInt(f.dep.split(':')[0], 10) === h);
            const isSelected = selectedHour === h;
            return (
              <button
                key={h}
                onClick={() => setSelectedHour(h)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                  isSelected
                    ? 'bg-[#00D9FF] text-[#050B14]'
                    : hasMovements
                    ? 'bg-[#101D2D] text-[#8498AD] hover:text-white hover:bg-[#1E3048]'
                    : 'text-[#8498AD]/40'
                }`}
              >
                {h.toString().padStart(2, '0')}z
              </button>
            );
          })}
        </div>
      </div>

      {/* Flight Events Stream in Selected Hour */}
      <div className="p-2.5 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {flightsInHour.length === 0 ? (
            <div className="text-[11px] text-[#8498AD] py-2 px-3">
              No scheduled movements within this hourly window.
            </div>
          ) : (
            flightsInHour.map(flight => {
              const isSelected = flight.flight_id === selectedFlightId;
              const isDelayed = (flight.delay_minutes || 0) > 0;
              const hasAlert = alerts.some(a => a.targetId === flight.flight_id);

              return (
                <div
                  key={flight.flight_id}
                  onClick={() => onSelectFlight(flight)}
                  className={`p-2 rounded border cursor-pointer transition min-w-[190px] ${
                    isSelected
                      ? 'bg-[#101D2D] border-[#00D9FF] text-white shadow-[0_0_10px_rgba(0,217,255,0.2)]'
                      : isDelayed || hasAlert
                      ? 'bg-[#101D2D]/80 border-[#FFB547]/50 text-[#EAF4FF]'
                      : 'bg-[#101D2D]/50 border-[#1E3048] hover:border-[#00D9FF]/40 text-[#8498AD] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#00D9FF]">{flight.flight_id}</span>
                    <span className="text-[10px] text-[#8498AD]">{flight.tail_id}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-white font-bold">{flight.origin}</span>
                    <span className="text-[#8498AD]">
                      {flight.dep} → {flight.arr}
                    </span>
                    <span className="text-white font-bold">{flight.destination}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#1E3048]/60 text-[9px]">
                    <span>{flight.pax} pax</span>
                    <span className={isDelayed ? 'text-[#FFB547] font-bold' : 'text-[#22D3A6]'}>
                      {isDelayed ? `+${flight.delay_minutes}m DELAY` : 'ON TIME'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
