
export type OperationType = 'earnings' | 'ownerShare' | 'fuel' | 'purchases' | 'objectivePayment';

export interface Operation {
  id: string;
  type: OperationType;
  amount: number;
  label: string;
  timestamp: string;
}

export interface Objective {
  id: string;
  title: string;
  targetAmount: number;
  paidAmount: number;
  isCompleted: boolean;
}

export interface DailyStats {
  date: string; // ISO Date YYYY-MM-DD
  earnings: number;
  ownerShare: number;
  fuel: number;
  purchases: number;
  objectivePayments: number;
  goal: number;
  operations: Operation[];
}

export interface VaultEntry {
  date: string;
  amount: number;
}

export interface AppSettings {
  dailyGoal: number;
  vaultPin: string;
}

export interface AppData {
  currentDay: DailyStats;
  vault: VaultEntry[];
  objectives: Objective[];
  settings: AppSettings;
  lastSettlementDate: string;
}
