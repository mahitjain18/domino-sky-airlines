import React, { useState, useEffect } from 'react';
import { Flight } from '../types/airline';
import { Sliders, X, AlertTriangle, Play } from 'lucide-react';

interface QuickDelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  flights: Flight[];
  onApplyDelay: (flightId: string, delayMinutes: number) => void;
}

export const QuickDelayModal: React.FC<QuickDelayModalProps> = ({
  isOpen,
  onClose,
  flights,
  onApplyDelay
}) => {
  if (!isOpen) return null;

  const [selectedFlightId, setSelectedFlightId] = useState<string>(flights[0]?.flight_id || 'DS0301');
  const [delayMinutes, setDelayMinutes] = useState<number>(30);

  // Keyboard accessibility: Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeDelay = Math.min(180, Math.max(5, Math.floor(Number(delayMinutes)) || 30));
    onApplyDelay(selectedFlightId, safeDelay);
    onClose();
  };

  const current = flights.find(f => f.flight_id === selectedFlightId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-[#0F172A] border border-cyan-500/30 rounded-xl p-5 shadow-2xl font-mono text-xs text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 id="modal-title" className="text-sm font-bold text-white">SIMULATE FLIGHT DISRUPTION</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-slate-400 block mb-1.5">Select Flight Leg:</label>
            <select
              value={selectedFlightId}
              onChange={e => setSelectedFlightId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-500"
            >
              {flights.map(f => (
                <option key={f.flight_id} value={f.flight_id}>
                  {f.flight_id} ({f.tail_id}): {f.origin} → {f.destination} ({f.dep})
                </option>
              ))}
            </select>
          </div>

          {current && (
            <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
              <div>Route: {current.origin} to {current.destination}</div>
              <div>Aircraft: {current.tail_id} (Leg {current.leg_order})</div>
              <div>Scheduled: {current.dep} - {current.arr} ({current.pax} passengers)</div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-400">Delay Amount:</label>
              <span className="text-amber-400 font-bold">+{delayMinutes} Minutes</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={delayMinutes}
              onChange={e => setDelayMinutes(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>+10m</span>
              <span>+30m</span>
              <span>+60m</span>
              <span>+90m</span>
              <span>+120m</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold transition flex items-center justify-center space-x-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
