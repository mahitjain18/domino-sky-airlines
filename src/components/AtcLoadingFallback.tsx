import React from 'react';
import { Radar } from 'lucide-react';

interface AtcLoadingFallbackProps {
  label?: string;
}

export const AtcLoadingFallback: React.FC<AtcLoadingFallbackProps> = ({
  label = 'INITIALIZING TACTICAL DATA STREAM...'
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[400px] h-full w-full flex flex-col items-center justify-center p-8 bg-[#040711] text-slate-100 font-mono select-none"
    >
      <div className="relative flex items-center justify-center w-20 h-20 mb-4">
        {/* Animated radar rings */}
        <div className="absolute inset-0 rounded-full border border-[#00D9FF]/20 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full border border-[#00D9FF]/40 animate-pulse-ring" />
        <div className="w-12 h-12 rounded-full bg-[#0A1422] border border-[#00D9FF] flex items-center justify-center text-[#00D9FF] shadow-[0_0_15px_rgba(0,217,255,0.4)]">
          <Radar className="w-6 h-6 animate-spin-slow text-[#00D9FF]" />
        </div>
      </div>
      <div className="text-xs font-bold tracking-widest text-[#EAF4FF] flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-[#22D3A6] animate-pulse" />
        <span>{label}</span>
      </div>
      <p className="text-[10px] text-[#8498AD] mt-1.5 tracking-wider">
        DGCA AIRSPACE MONITORING ENGINE • 100% DETERMINISTIC CALCULATION
      </p>
    </div>
  );
};

export default AtcLoadingFallback;
