
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
  isPaid?: boolean; // حالة الدفع: true = تم الدفع، false = غير مدفوع / مؤجل
  paidTimestamp?: string;
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
  workHoursStart?: number; // e.g. 8 for 8:00 AM
  workHoursEnd?: number; // e.g. 24 for 12:00 midnight
  inactivityAlertEnabled?: boolean;
  inactivityIntervalMinutes?: number; // default 60 minutes
  soundEnabled?: boolean;
  muteDuringSleepHours?: boolean; // كتم صوت الإشعارات أثناء ساعات النوم
  muteInteractionSounds?: boolean; // كتم أصوات التفاعل والأزرار
  sleepHoursStart?: number; // e.g. 0 for 12:00 midnight
  sleepHoursEnd?: number; // e.g. 8 for 8:00 AM
  notificationsPermissionRequested?: boolean;
}

export interface SavingsPlan {
  targetAmount: number; // e.g., 100000 or 180000
  timeframeMonths: number; // e.g., 6 months
  startDate: string; // ISO Date YYYY-MM-DD
  title: string; // e.g., "تجميع 100,000 أوقية"
  dailyIncomeBaseline: number; // e.g. 1500
}

export interface MysteryCard {
  id: string;
  milestone: number;
  title: string;
  quote: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  perkTitle: string;
  perkDesc: string;
  unlockedAt: string;
}

export interface GamificationState {
  streakDays: number;
  lastStreakDate: string;
  totalXp: number;
  openedChests: number[]; // station numbers e.g. [1, 2]
  celebratedMilestones: number[]; // e.g. [10000, 20000]
  charityFund: number; // صندوق الصدقة والانضباط المالي المتراكم (150، 300، 450...)
  lastPenaltyTimestamp?: number; // آخر وقت تم فيه خصم عقوبة التأخير الصامتة
  unlockedTitles: string[];
  selectedTitle: string;
  strictCommitmentEnabled: boolean;
  mysteryInventory: MysteryCard[];
}

export interface AppData {
  currentDay: DailyStats;
  vault: VaultEntry[];
  objectives: Objective[];
  settings: AppSettings;
  vacationFund?: VacationFund;
  savingsPlan?: SavingsPlan;
  gamification?: GamificationState;
  lastSettlementDate: string;
  lastEarningTimestamp?: number; // timestamp ms of last recorded earning
}
