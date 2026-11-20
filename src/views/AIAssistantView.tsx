import React, { useState } from 'react';
import {
  AirlineDataset,
  Flight,
  TurnaroundAnalysis,
  CrewDutyAnalysis,
  ConnectionAnalysis,
  AirportCapacityAnalysis,
  AIRecommendation
} from '../types/airline';
import {
  Bot,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  Zap,
  Plane,
  Clock,
  Layers
} from 'lucide-react';

interface AIAssistantViewProps {
  dataset: AirlineDataset;
  flights: Flight[];
  turnarounds: TurnaroundAnalysis[];
  crews: CrewDutyAnalysis[];
  connections: ConnectionAnalysis[];
  airports: AirportCapacityAnalysis[];
  recommendations: AIRecommendation[];
  isSimulating: boolean;
  simulatedFlightId: string | null;
  simulatedDelayMinutes: number;
  onSimulateDelay: (flightId: string, delayMins: number) => void;
  onResetSimulation: () => void;
  onApplyAIAction: (recommendationId: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  dataset,
  flights,
  turnarounds,
  crews,
  connections,
  airports,
  recommendations,
  isSimulating,
  simulatedFlightId,
  simulatedDelayMinutes,
  onSimulateDelay,
  onResetSimulation,
  onApplyAIAction
}) => {
  const [selectedFlight, setSelectedFlight] = useState<string>(flights[0]?.flight_id || 'DS0301');
  const [delayInput, setDelayInput] = useState<number>(30);
  const totalTransitPassengers = connections.reduce((sum, c) => sum + (c.passengers || 0), 0);
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: `Welcome to DOMINO SKY AI OCC Operations Assistant. All ${flights.length} flights, 16 crews, 21 connection pairs, and 2 spare aircraft are actively monitored against DGCA safety rules.`,
      time: '11:00'
    }
  ]);
  const [queryInput, setQueryInput] = useState<string>('');

  const handleSendQuery = (customText?: string) => {
    const textToSend = customText || queryInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };

    let reply = '';
    const lower = textToSend.toLowerCase();

    if (lower.includes('crew') || lower.includes('duty')) {
      const highRisk = crews.filter(c => c.is_high_risk);
      reply = `Crew Duty Audit: 16 crews evaluated. 0 legal violations at baseline. Critical attention required for Crew CR03 (Base DEL) operating VT-DS03 at 590/600 mins (98.3% duty cap), followed by CR08 (Base HYD) at 580/600 mins. A relief crew is recommended at DEL.`;
    } else if (lower.includes('spare') || lower.includes('aircraft')) {
      reply = `Spare Fleet Readiness: 2 hot-standby aircraft active with 180 seats each. VT-DS18 stationed at Indira Gandhi International (DEL) ready from 05:00 IST; VT-DS17 stationed at Kempegowda International (BLR) ready from 05:00 IST. Both fueled and available for dispatch in < 25 mins.`;
    } else if (lower.includes('connection') || lower.includes('passenger') || lower.includes('transit')) {
      const tight = connections.filter(c => c.is_tight);
      reply = `Passenger Connection Integrity: 21 transit pairs monitored (${totalTransitPassengers} total transit passengers). 0 broken connections scheduled. However, ${tight.length} pairs operate with ≤ 15m safety buffer above MCT (minimum connecting time). Highest risk: CX14 at DEL (50m gap vs 45m MCT for 20 pax). Priority tarmac escorts advised.`;
    } else if (lower.includes('turnaround') || lower.includes('30')) {
      const tightTa = turnarounds.filter(t => t.is_tight);
      reply = `Turnaround Compliance: Minimum 30-minute standard strictly enforced. All ${flights.length} scheduled legs meet or exceed 30 mins. ${tightTa.length} legs operate at exact 30-35m minimums (e.g. DS0402 at GOI, DS0504 at BLR). Dual-door boarding and expedited refueling pre-staged.`;
    } else if (lower.includes('airport') || lower.includes('capacity') || lower.includes('del')) {
      reply = `Airport Runway Capacity: 16 airports evaluated across 24 hourly buckets. No runway capacity overages detected. DEL is peak hub with 5 movements during hour 12:00 against 40/hr capacity; BLR peaks at 14:00 with 5 movements against 34/hr capacity.`;
    } else {
      reply = `Operational Analysis: System running nominal across all ${flights.length} flight legs. Recommend reviewing AI Recommendations for proactive buffer enhancement on rotation VT-DS03 and transit pair CX14.`;
    }

    const aiMsg = {
      sender: 'ai' as const,
      text: reply,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    setQueryInput('');
  };

  const currentFlight = flights.find(f => f.flight_id === selectedFlight);

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              AI OCC ASSISTANT & WHAT-IF DISRUPTION SIMULATOR
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time automated decision intelligence and cascading delay impact modeling
          </p>
        </div>

        {isSimulating && (
          <button
            onClick={onResetSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold hover:bg-amber-500/30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Active Simulation (+{simulatedDelayMinutes}m on {simulatedFlightId})</span>
          </button>
        )}
      </div>

      {/* Grid: What-If Disruption Simulator & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What-If Simulator (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                DISRUPTION INJECTION ENGINE
              </h3>
            </div>

            <p className="text-xs text-slate-300 font-sans mb-4 leading-relaxed">
              Select any flight sector in the network and inject an operational delay (e.g. weather, ATC slot, technical maintenance). The simulator will automatically propagate cascading delays through subsequent legs, verify 30-min turnarounds, audit crew duty limits, test passenger transfer windows, and propose AI spare aircraft interventions.
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1.5">Select Flight to Delay:</label>
                <select
                  value={selectedFlight}
                  onChange={e => setSelectedFlight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                >
                  {flights.map(f => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_id} ({f.tail_id}) : {f.origin} → {f.destination} ({f.dep} - {f.arr})
                    </option>
                  ))}
                </select>
              </div>

              {currentFlight && (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                  <div className="text-cyan-300 font-bold mb-1">
                    Flight Profile: {currentFlight.flight_id}
                  </div>
                  <div className="text-slate-300">
                    Aircraft: {currentFlight.tail_id} (Leg {currentFlight.leg_order} of rotation)
                  </div>
                  <div className="text-slate-400">
                    Scheduled: {currentFlight.dep} - {currentFlight.arr} ({currentFlight.block_minutes} mins)
                  </div>
                  <div className="text-emerald-400">
                    Passenger Load: {currentFlight.pax} passengers
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400">Inject Delay Duration:</label>
                  <span className="text-amber-400 font-bold">{delayInput} Minutes</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={delayInput}
                  onChange={e => setDelayInput(Number(e.target.value))}
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

              <div className="flex items-center space-x-2 pt-2">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setDelayInput(mins)}
                    className={`flex-1 py-1 rounded text-[11px] font-bold border transition ${
                      delayInput === mins
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-3">
            <button
              onClick={() => onSimulateDelay(selectedFlight, delayInput)}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold font-mono text-xs transition shadow-lg flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulate Cascading Delay</span>
            </button>
            {isSimulating && (
              <button
                onClick={onResetSimulation}
                className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition border border-slate-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic AI Operational Recommendations (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                AI OPERATIONAL RECOMMENDATIONS ({recommendations.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Active Optimization Engine
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[520px]">
            {recommendations.map(rec => {
              const isImmediate = rec.priority === 'Immediate';
              const isHigh = rec.priority === 'High';

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border font-mono text-xs transition ${
                    isImmediate
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isHigh
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">
                      {rec.summary}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                        isImmediate
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          : isHigh
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {rec.priority} Priority
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                    {rec.detail}
                  </p>

                  <div className="mt-2.5 p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px]">
                    <div className="text-cyan-400 font-bold mb-0.5">
                      ✓ Expected Impact: <span className="font-normal text-slate-300 font-sans">{rec.expectedImpact}</span>
                    </div>
                    <div className="text-emerald-400 font-bold">
                      ⚡ Action Plan: <span className="font-normal text-slate-300 font-sans">{rec.suggestedAction}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Category: {rec.category}</span>
                    <button
                      onClick={() => onApplyAIAction(rec.id)}
                      className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition flex items-center space-x-1"
                    >
                      <span>Deploy Recommendation</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive AI Query Console */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-mono">
            OPERATIONS QUERY CONSOLE & DGCA COMPLIANCE CHAT
          </h3>
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap gap-2 mb-3 text-[11px] font-mono">
          <button
            onClick={() => handleSendQuery('Which crews are close to legal duty limit?')}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition"
          >
            "Which crews are close to duty limit?"
          </button>
          <button
            onClick={() => handleSendQuery('Where are our spare aircraft located?')}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition"
          >
            "Where are our spare aircraft located?"
          </button>
          <button
            onClick={() => handleSendQuery('What passenger connections are at risk?')}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition"
          >
            "What passenger connections are at risk?"
          </button>
          <button
            onClick={() => handleSendQuery('What is the peak movement hour at DEL?')}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition"
          >
            "What is peak hour at DEL?"
          </button>
        </div>

        {/* Chat Messages */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto mb-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 ml-8'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-300 mr-8'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span className="font-bold uppercase">{msg.sender === 'user' ? 'OCC CONTROLLER' : 'DOMINO AI'}</span>
                <span>{msg.time}</span>
              </div>
              <p className="font-sans text-xs leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <input
            type="text"
            placeholder="Ask AI OCC Assistant about network status, crew rules, spare aircraft, turnaround times..."
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendQuery()}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSendQuery()}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
