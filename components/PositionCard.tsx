import React, { useState } from 'react';
import { ReTokenPosition, PositionStatus } from '../types';
import { AlertTriangle, ArrowDownRight, TrendingUp, ShieldAlert, Bot, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { analyzeRisk } from '../services/geminiService';

interface PositionCardProps {
  position: ReTokenPosition;
  onUpdateAnalysis: (id: string, analysis: string) => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({ position, onUpdateAnalysis }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getStatusColor = (status: PositionStatus) => {
    switch (status) {
      case PositionStatus.ACTIVE: return 'text-brand-400 border-brand-500/30 bg-brand-500/5';
      case PositionStatus.WARNING: return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      case PositionStatus.EXITED: return 'text-red-400 border-red-500/30 bg-red-500/5';
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeRisk(position.protocol, position.asset, position.currentScore);
    onUpdateAnalysis(position.id, result);
    setIsAnalyzing(false);
  };

  const isExited = position.status === PositionStatus.EXITED;

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-slate-800/50 backdrop-blur transition-all duration-300 ${isExited ? 'border-red-900/50 grayscale-[0.2]' : 'border-slate-700 hover:border-slate-600'}`}>
      {/* Header */}
      <div className="p-5 flex justify-between items-start border-b border-slate-700/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{position.protocol}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(position.status)}`}>
              {position.status}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-mono">Re-{position.asset}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Deposited</p>
          <p className="text-lg font-mono font-bold text-white">
            {position.amount.toLocaleString()} <span className="text-xs text-slate-400">{position.asset}</span>
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-700/30">
        <div className="bg-slate-800/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Risk Threshold</p>
          <p className="text-xl font-bold text-white font-mono">{position.riskThreshold}<span className="text-xs text-slate-500">/100</span></p>
        </div>
        <div className="bg-slate-800/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <ShieldAlert size={40} />
          </div>
          <p className="text-xs text-slate-500 mb-1">Live Score</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold font-mono ${position.currentScore < position.riskThreshold ? 'text-red-500' : 'text-brand-400'}`}>
              {position.currentScore}
            </p>
            {position.currentScore < position.riskThreshold && (
               <span className="text-xs text-red-400 flex items-center gap-1 animate-pulse font-bold">
                 <AlertTriangle size={10} /> TRIGGERED
               </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-24 bg-slate-900/50 w-full relative group">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 z-10 pointer-events-none">
          <p className="text-xs text-slate-400">7 Day Risk History</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={position.history}>
            <defs>
              <linearGradient id={`colorScore-${position.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isExited ? '#ef4444' : '#14b8a6'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isExited ? '#ef4444' : '#14b8a6'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke={isExited ? '#ef4444' : '#14b8a6'} 
              fillOpacity={1} 
              fill={`url(#colorScore-${position.id})`} 
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Analysis Section */}
      <div className="p-4 bg-slate-800/30 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-brand-300">
            <Bot size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Gemini Risk Agent</span>
          </div>
          <button 
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || isExited}
            className={`p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50 ${isAnalyzing ? 'animate-spin' : ''}`}
            title="Refresh AI Analysis"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        
        {position.lastAiAnalysis ? (
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-700/50">
            <ul className="list-disc pl-4 space-y-1">
              {position.lastAiAnalysis.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((line, idx) => (
                <li key={idx}>{line.replace(/^[-*]\s*/, '')}</li>
              ))}
              {!position.lastAiAnalysis.includes('-') && !position.lastAiAnalysis.includes('*') && (
                <li>{position.lastAiAnalysis}</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic p-2 text-center">
            {isExited ? "Analysis archived on chain." : "No analysis run yet. Click refresh to scan."}
          </div>
        )}
      </div>

      {isExited && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="bg-green-500/20 p-4 rounded-full mb-4 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Funds Secured</h3>
          <p className="text-slate-400 text-xs mb-6 max-w-[200px]">
            Risk score dropped to <span className="text-red-400 font-mono font-bold">{position.currentScore}</span>. 
            Position unwound successfully.
          </p>
          
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 w-full mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 uppercase">Received</span>
              <span className="text-[10px] text-slate-500 uppercase">Slippage</span>
            </div>
            <div className="flex justify-between items-baseline">
              <p className="text-lg font-mono text-white font-bold">{(position.amount * 0.995).toLocaleString()} <span className="text-xs text-slate-500">USDC</span></p>
              <p className="text-xs font-mono text-green-400">0.05%</p>
            </div>
          </div>

          {position.exitTxHash && (
            <a href="#" className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-mono bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
              <ExternalLink size={10} />
              View TX: {position.exitTxHash}
            </a>
          )}
        </div>
      )}
    </div>
  );
};