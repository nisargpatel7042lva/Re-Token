import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PositionCard } from './components/PositionCard';
import { CreatePositionModal } from './components/CreatePositionModal';
import { ReTokenPosition, PositionStatus, CreatePositionFormData, MarketCondition } from './types';
import { Plus, LayoutDashboard, History, Zap, TrendingDown, Activity, AlertOctagon, ShieldAlert, Link as LinkIcon, Lock } from 'lucide-react';
import { analyzeRisk } from './services/geminiService';
import { web3Service, WalletState } from './services/web3Service';

const MOCK_INITIAL_POSITIONS: ReTokenPosition[] = [
  {
    id: '1',
    protocol: 'Aave V3',
    asset: 'USDC',
    amount: 50000,
    apy: 4.5,
    riskThreshold: 80,
    currentScore: 88,
    status: PositionStatus.ACTIVE,
    history: Array.from({ length: 20 }, (_, i) => ({ timestamp: i, score: 85 + Math.random() * 10 })),
    lastAiAnalysis: "* Smart contract audit verified recently.\n* High liquidity utilization observed (85%), monitoring required.\n* Governance proposals stable."
  },
  {
    id: '2',
    protocol: 'Compound V3',
    asset: 'ETH',
    amount: 12.5,
    apy: 2.1,
    riskThreshold: 75,
    currentScore: 78,
    status: PositionStatus.WARNING,
    history: Array.from({ length: 20 }, (_, i) => ({ timestamp: i, score: 80 - Math.random() * 5 })),
    lastAiAnalysis: "* Recent price volatility in collateral assets.\n* Oracle latency spikes detected on secondary networks.\n* Reserve factor remains optimal."
  }
];

export default function App() {
  const [positions, setPositions] = useState<ReTokenPosition[]>(() => {
    const saved = localStorage.getItem('retoken_positions');
    return saved ? JSON.parse(saved) : MOCK_INITIAL_POSITIONS;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('STABLE');
  
  // Web3 State
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false
  });

  // Attempt to reconnect on load if previously connected
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (eth && eth.selectedAddress) {
       web3Service.connectWallet().then(setWalletState).catch(console.error);
    }
    
    // Listen for account changes
    if (eth) {
        eth.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
                setWalletState(prev => ({ ...prev, address: null, isConnected: false }));
            } else {
                web3Service.connectWallet().then(setWalletState).catch(console.error);
            }
        });
        eth.on('chainChanged', () => window.location.reload());
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('retoken_positions', JSON.stringify(positions));
  }, [positions]);

  // Simulation Engine: Updates scores based on Market Condition
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(pos => {
        if (pos.status === PositionStatus.EXITED) return pos;

        let change = 0;
        switch (marketCondition) {
          case 'STABLE':
            change = (Math.random() * 2) - 1; // Small random noise
            break;
          case 'VOLATILE':
            change = (Math.random() * 8) - 4; // High volatility
            break;
          case 'CRASH':
            change = (Math.random() * -5) - 2; // Strong downward trend
            break;
        }

        let newScore = Math.min(100, Math.max(0, pos.currentScore + change));
        newScore = Math.round(newScore * 10) / 10;

        const newHistory = [...pos.history.slice(1), { timestamp: Date.now(), score: newScore }];

        let newStatus = pos.status;
        let exitData = {};

        // Trigger Auto-Exit
        if (newScore < pos.riskThreshold) {
          newStatus = PositionStatus.EXITED;
          exitData = {
            exitTxHash: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            exitTimestamp: Date.now()
          };
        } else if (newScore < pos.riskThreshold + 5) {
          newStatus = PositionStatus.WARNING;
        } else {
          newStatus = PositionStatus.ACTIVE;
        }

        return {
          ...pos,
          currentScore: newScore,
          status: newStatus,
          history: newHistory,
          ...exitData
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [marketCondition]);

  const handleCreatePosition = (data: CreatePositionFormData, txHash: string) => {
    const newPosition: ReTokenPosition = {
      id: Math.random().toString(36).substr(2, 9),
      ownerAddress: walletState.address || undefined,
      creationTxHash: txHash,
      protocol: data.protocol,
      asset: data.asset,
      amount: data.amount,
      apy: 3 + Math.random() * 5,
      riskThreshold: data.riskThreshold,
      currentScore: 92, // Start healthy
      status: PositionStatus.ACTIVE,
      history: Array.from({ length: 20 }, (_, i) => ({ timestamp: i, score: 92 })),
    };
    
    analyzeRisk(newPosition.protocol, newPosition.asset, newPosition.currentScore)
      .then(analysis => {
        handleUpdateAnalysis(newPosition.id, analysis);
      });

    setPositions([newPosition, ...positions]);
  };

  const handleUpdateAnalysis = useCallback((id: string, analysis: string) => {
    setPositions(prev => prev.map(p => 
      p.id === id ? { ...p, lastAiAnalysis: analysis, lastAiUpdate: Date.now() } : p
    ));
  }, []);

  const handleResetSimulation = () => {
    setPositions(MOCK_INITIAL_POSITIONS);
    setMarketCondition('STABLE');
    localStorage.removeItem('retoken_positions');
  };
  
  const handleConnect = (address: string) => {
      // Refresh full state
      web3Service.connectWallet().then(setWalletState);
  };

  const handleDisconnect = () => {
      setWalletState({
          address: null,
          balance: null,
          chainId: null,
          isConnected: false
      });
  };

  // Filter positions based on wallet connection
  // If connected, show user's positions (mocked + created by them)
  // If disconnected, show demo data
  const userPositions = walletState.isConnected 
    ? positions.filter(p => !p.ownerAddress || p.ownerAddress === walletState.address)
    : positions.filter(p => !p.ownerAddress); // Only show public mock data if disconnected

  const activePositions = userPositions.filter(p => p.status !== PositionStatus.EXITED);
  const exitedPositions = userPositions.filter(p => p.status === PositionStatus.EXITED);
  const totalValue = activePositions.reduce((sum, p) => sum + (p.asset === 'USDC' || p.asset === 'DAI' || p.asset === 'USDT' ? p.amount : p.amount * 2000), 0);

  return (
    <div className="min-h-screen bg-slate-950 pb-20 font-sans">
      <Navbar 
        onConnect={handleConnect} 
        onDisconnect={handleDisconnect} 
        walletState={walletState}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Simulation Control Panel - Essential for demonstrating functionality */}
        <div className="mb-8 bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Market Simulator (Oracle Mode)</h3>
              <p className="text-slate-400 text-xs">Simulate oracle price feeds triggering on-chain exits.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMarketCondition('STABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${marketCondition === 'STABLE' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
            >
              STABLE
            </button>
            <button 
              onClick={() => setMarketCondition('VOLATILE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${marketCondition === 'VOLATILE' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
            >
              VOLATILE
            </button>
            <button 
              onClick={() => setMarketCondition('CRASH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${marketCondition === 'CRASH' ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
            >
              MARKET CRASH
            </button>
            <div className="w-px h-8 bg-slate-800 mx-2"></div>
            <button 
              onClick={handleResetSimulation}
              className="text-xs text-slate-500 hover:text-white underline"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <h2 className="text-slate-400 text-sm font-medium mb-1">Total Value Protected</h2>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">${totalValue.toLocaleString()}</span>
              {marketCondition === 'CRASH' ? (
                 <span className="text-red-400 text-sm font-bold mb-1 flex items-center gap-1"><TrendingDown size={14}/> -12.4%</span>
              ) : (
                 <span className="text-green-400 text-sm font-bold mb-1 flex items-center gap-1"><Activity size={14}/> +2.4%</span>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <h2 className="text-slate-400 text-sm font-medium mb-1">Risk Status</h2>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">{activePositions.length}</span>
              <span className="text-slate-500 text-sm mb-1">/ {userPositions.length} Active</span>
            </div>
            {marketCondition === 'CRASH' && activePositions.length > 0 && (
                <div className="mt-2 text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded w-fit flex items-center gap-1">
                    <AlertOctagon size={10} /> HIGH RISK DETECTED
                </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-brand-900/20 to-brand-800/10 rounded-2xl p-6 border border-brand-500/20 shadow-xl relative overflow-hidden group cursor-pointer hover:border-brand-500/40 transition-colors" onClick={() => setIsModalOpen(true)}>
            <div className="absolute inset-0 bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors"></div>
            <div className="relative flex items-center justify-between h-full">
              <div>
                <h2 className="text-brand-300 text-sm font-bold mb-1">New Strategy</h2>
                <span className="text-xl font-bold text-white">Create Re-Token</span>
              </div>
              <div className="bg-brand-500 p-3 rounded-full text-slate-900 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                <Plus size={24} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl w-fit mb-6 border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutDashboard size={16} />
            Live Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <History size={16} />
            History & Exits
            {exitedPositions.length > 0 && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">{exitedPositions.length}</span>}
          </button>
        </div>

        {/* Web3 Warning */}
        {!walletState.isConnected && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
                    <LinkIcon size={20} />
                </div>
                <div>
                    <h3 className="text-blue-100 font-bold text-sm">Demo Mode Active</h3>
                    <p className="text-blue-300/80 text-xs">Connect your wallet to interact with the Ethereum Mainnet and view your personal positions.</p>
                </div>
            </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' ? (
            activePositions.length > 0 ? (
              activePositions.map(pos => (
                <PositionCard key={pos.id} position={pos} onUpdateAnalysis={handleUpdateAnalysis} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <ShieldAlert size={32} />
                </div>
                <p className="text-slate-400 mb-2 font-medium">No active positions</p>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Your portfolio is currently empty or all positions have been auto-exited due to risk.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-brand-400 font-bold hover:text-brand-300 transition-colors">Wrap a new Re-Token</button>
              </div>
            )
          ) : (
            exitedPositions.length > 0 ? (
              exitedPositions.map(pos => (
                <PositionCard key={pos.id} position={pos} onUpdateAnalysis={handleUpdateAnalysis} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <p className="text-slate-500">No historic exits found.</p>
              </div>
            )
          )}
        </div>

      </main>

      <CreatePositionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreatePosition}
        isConnected={walletState.isConnected}
      />
    </div>
  );
}