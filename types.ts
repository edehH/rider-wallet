
export type OperationType = 'earnings' | 'ownerShare' | 'fuel' | 'purchases' | 'objectivePayment';

export interface Operation {
  id: string;
  type: OperationType;
  amount: number;
  label: string;
  timestamp: string;
  courseTitle?: string; // اسم أو عنوان المكور / الكورس
  fromLocation?: string; // من أين / اسم المرسل
  toLocation?: string; // إلى أين / الوجهة
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
  settledAmount?: number; // المبلغ الذي تم ترحيله مسبقاً للخزنة خلال اليوم
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

export interface SavingsPlan {
  targetAmount: number; // e.g., 100000 or 180000
  timeframeMonths: number; // e.g., 6 months
  startDate: string; // ISO Date YYYY-MM-DD
  title: string; // e.g., "تجميع 100,000 أوقية"
  dailyIncomeBaseline: number; // e.g. 1500
}

export interface AppData {
  currentDay: DailyStats;
  vault: VaultEntry[];
  objectives: Objective[];
  settings: AppSettings;
  vacationFund?: VacationFund;
  savingsPlan?: SavingsPlan;
  lastSettlementDate: string;
}
