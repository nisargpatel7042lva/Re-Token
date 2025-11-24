import React, { useState } from 'react';
import { CreatePositionFormData } from '../types';
import { X, Shield, Settings2, Loader2, ExternalLink } from 'lucide-react';
import { web3Service } from '../services/web3Service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreatePositionFormData, txHash: string) => void;
  isConnected: boolean;
}

const PROTOCOLS = ['Aave V3', 'Compound V3', 'Spark Protocol', 'Morpho'];
const ASSETS = ['USDC', 'ETH', 'WBTC', 'DAI', 'USDT'];

export const CreatePositionModal: React.FC<Props> = ({ isOpen, onClose, onCreate, isConnected }) => {
  const [formData, setFormData] = useState<CreatePositionFormData>({
    protocol: PROTOCOLS[0],
    asset: ASSETS[0],
    amount: 1000,
    riskThreshold: 75
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
        setStatusMsg("Please connect your wallet first.");
        return;
    }

    setIsSubmitting(true);
    setStatusMsg("Waiting for wallet confirmation...");

    try {
        // Trigger a real transaction on the blockchain
        const txHash = await web3Service.simulateDepositTransaction(formData.amount, formData.asset);
        setStatusMsg("Transaction submitted! Indexing...");
        
        // Brief delay to show success state
        setTimeout(() => {
            onCreate(formData, txHash);
            onClose();
            setIsSubmitting(false);
            setStatusMsg('');
        }, 1500);

    } catch (error) {
        console.error(error);
        setStatusMsg("Transaction rejected or failed.");
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500/10 p-2 rounded-lg text-brand-400">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Wrap New Position</h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-500 hover:text-white transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protocol</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={formData.protocol}
                onChange={e => setFormData({...formData, protocol: e.target.value})}
                disabled={isSubmitting}
              >
                {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={formData.asset}
                onChange={e => setFormData({...formData, asset: e.target.value})}
                disabled={isSubmitting}
              >
                {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deposit Amount</label>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                step="100"
                className="w-full bg-slate-800 border border-slate-700 text-white text-lg font-mono rounded-lg p-3 pr-16 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                disabled={isSubmitting}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">{formData.asset}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 size={16} className="text-brand-400" />
              <span className="text-sm font-bold text-white">Auto-Exit Configuration</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="text-slate-400">Risk Threshold</label>
                <span className={`font-mono font-bold ${formData.riskThreshold > 80 ? 'text-green-400' : formData.riskThreshold < 60 ? 'text-red-400' : 'text-amber-400'}`}>
                  {formData.riskThreshold}/100
                </span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="95" 
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                value={formData.riskThreshold}
                onChange={e => setFormData({...formData, riskThreshold: parseInt(e.target.value)})}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Re-Token will automatically unwind this position into Stablecoins if the protocol's safety score falls below {formData.riskThreshold}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
             {!isConnected && (
                 <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 text-center">
                     Connect wallet to deploy on-chain.
                 </div>
             )}
            <button 
                type="submit" 
                disabled={isSubmitting || !isConnected}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        {statusMsg || "Processing..."}
                    </>
                ) : (
                    <>
                         Deploy Re-Token
                         <ExternalLink size={16} className="opacity-60" />
                    </>
                )}
            </button>
            {isSubmitting && statusMsg.includes("confirmation") && (
                <p className="text-center text-xs text-brand-400 animate-pulse">Check your wallet...</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};