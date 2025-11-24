import React, { useState, useEffect } from 'react';
    import { ShieldCheck, Activity, Wallet, LogOut, Loader2, AlertCircle } from 'lucide-react';
    import { web3Service, WalletState } from '../services/web3Service';
    
    interface NavbarProps {
      onConnect: (address: string) => void;
      onDisconnect: () => void;
      walletState: WalletState;
    }
    
    export const Navbar: React.FC<NavbarProps> = ({ onConnect, onDisconnect, walletState }) => {
      const [isConnecting, setIsConnecting] = useState(false);
      const [error, setError] = useState<string | null>(null);
    
      const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
          const state = await web3Service.connectWallet();
          if (state.address) {
            onConnect(state.address);
          }
        } catch (e: any) {
          setError(e.message || "Failed to connect");
        } finally {
          setIsConnecting(false);
        }
      };
    
      return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="bg-brand-500 p-2 rounded-lg bg-opacity-20 text-brand-400">
                  <ShieldCheck size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Re<span className="text-brand-400">-Token</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {walletState.isConnected ? (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-slate-400 border border-slate-700">
                    <div className={`w-2 h-2 rounded-full ${walletState.chainId === 1 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span>{walletState.chainId === 1 ? 'MAINNET' : `CHAIN ID: ${walletState.chainId}`}</span>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-slate-400 border border-slate-700">
                    <Activity size={14} className="text-slate-500" />
                    <span>DISCONNECTED</span>
                  </div>
                )}
                
                {walletState.address ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-slate-400 font-mono">
                        {parseFloat(walletState.balance || '0').toFixed(4)} ETH
                      </p>
                    </div>
                    <button 
                      onClick={onDisconnect}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-brand-400 to-blue-500"></div>
                      {web3Service.shortenAddress(walletState.address)}
                      <LogOut size={14} className="ml-1 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-brand-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? <Loader2 size={16} className="animate-spin"/> : <Wallet size={16} />}
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                    {error && (
                      <p className="absolute top-16 text-[10px] text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-900/50">
                        <AlertCircle size={10} /> {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      );
    };