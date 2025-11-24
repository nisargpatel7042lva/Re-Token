export enum PositionStatus {
  ACTIVE = 'ACTIVE',
  WARNING = 'WARNING',
  EXITED = 'EXITED',
}

export type MarketCondition = 'STABLE' | 'VOLATILE' | 'CRASH';

export interface ScorePoint {
  timestamp: number;
  score: number;
}

export interface ReTokenPosition {
  id: string;
  ownerAddress?: string; // Address of the user who created this position
  creationTxHash?: string; // The transaction hash on Ethereum
  protocol: string; // e.g., 'Aave V3', 'Compound'
  asset: string; // e.g., 'USDC', 'ETH'
  amount: number;
  apy: number;
  riskThreshold: number; // The score below which we auto-exit
  currentScore: number;
  status: PositionStatus;
  history: ScorePoint[];
  lastAiAnalysis?: string;
  lastAiUpdate?: number;
  exitTxHash?: string;
  exitTimestamp?: number;
}

export interface CreatePositionFormData {
  protocol: string;
  asset: string;
  amount: number;
  riskThreshold: number;
}