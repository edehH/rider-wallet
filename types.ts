
export interface DailyStats {
  date: string; // ISO Date YYYY-MM-DD
  earnings: number;
  ownerShare: number;
  fuel: number;
  purchases: number;
  goal: number;
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
  settings: AppSettings;
  lastSettlementDate: string;
}
