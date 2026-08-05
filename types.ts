
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
  note?: string;
}

export interface VacationFund {
  targetAmount: number;
  savedAmount: number;
  restDay: number; // 0=الأحد, 1=الإثنين, 2=الثلاثاء, 3=الأربعاء, 4=الخميس, 5=الجمعة, 6=السبت
  spendingBudget: number;
  enabled: boolean;
}

export interface AppSettings {
  dailyGoal: number;
  monthlyGoal: number;
  vaultPin: string;
}

export interface AppData {
  currentDay: DailyStats;
  vault: VaultEntry[];
  objectives: Objective[];
  settings: AppSettings;
  vacationFund?: VacationFund;
  lastSettlementDate: string;
}
