
import { AppData, DailyStats, VaultEntry } from '../types';
import { INITIAL_PIN } from '../constants';

const STORAGE_KEY = 'mr_rider_wallet_data_v3';

// Calculates current working date string (YYYY-MM-DD) with 6:00 AM daily rollover boundary
export const getWorkingDate = (date = new Date()): string => {
  const d = new Date(date);
  // Before 6:00 AM belongs to the previous working day's shift
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Consolidates vault movements so that each date has strictly ONE unified record entry
export const consolidateVaultEntries = (vault: VaultEntry[]): VaultEntry[] => {
  if (!vault || vault.length === 0) return [];
  const dateMap = new Map<string, { amount: number; note?: string }>();
  const order: string[] = [];

  for (const entry of vault) {
    if (!dateMap.has(entry.date)) {
      dateMap.set(entry.date, { amount: entry.amount, note: entry.note });
      order.push(entry.date);
    } else {
      const current = dateMap.get(entry.date)!;
      const newAmount = current.amount + entry.amount;
      dateMap.set(entry.date, {
        amount: newAmount,
        note: newAmount >= 0 ? 'ترحيل وصافي أرباح اليوم' : 'صافي عجز اليوم (مصاريف/مشتريات)'
      });
    }
  }

  return order.map(date => {
    const item = dateMap.get(date)!;
    return {
      date,
      amount: item.amount,
      note: item.note || (item.amount >= 0 ? 'ترحيل وصافي أرباح اليوم' : 'صافي عجز اليوم (مصاريف/مشتريات)')
    };
  });
};

// Adds or merges an amount into the unified daily vault entry for a given date
export const addOrUpdateVaultEntry = (
  vault: VaultEntry[],
  date: string,
  amount: number,
  customNote?: string
): VaultEntry[] => {
  const consolidated = consolidateVaultEntries(vault || []);
  const existingIndex = consolidated.findIndex(e => e.date === date);

  if (existingIndex > -1) {
    const updatedAmount = consolidated[existingIndex].amount + amount;
    consolidated[existingIndex] = {
      date,
      amount: updatedAmount,
      note: customNote || (updatedAmount >= 0 ? 'ترحيل وصافي أرباح اليوم' : 'صافي عجز اليوم (مصاريف/مشتريات)')
    };
  } else {
    consolidated.push({
      date,
      amount,
      note: customNote || (amount < 0 ? 'تغطية عجز يومي (مشتريات/مصاريف)' : 'ترحيل أرباح يومية')
    });
  }

  return consolidated;
};

const createNewDay = (goal: number = 1000, customDate?: string): DailyStats => ({
  date: customDate || getWorkingDate(),
  earnings: 0,
  ownerShare: 0,
  fuel: 0,
  purchases: 0,
  objectivePayments: 0,
  goal: goal || 1000,
  operations: [],
  settledAmount: 0
});

export const getInitialData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const currentWorkingDate = getWorkingDate();

  if (stored) {
    const data = JSON.parse(stored) as AppData;

    // Trigger automatic transfer into vault at 6:00 AM when working date changes
    if (data.currentDay.date !== currentWorkingDate) {
       // Automatic Settlement at 6 AM boundary of remaining unsettled net
       const totalDeductions = (
         data.currentDay.ownerShare + 
         data.currentDay.fuel + 
         data.currentDay.purchases + 
         (data.currentDay.objectivePayments || 0)
       );
       const net = data.currentDay.earnings - totalDeductions;
       const unsettledNet = net - (data.currentDay.settledAmount || 0);

       if (unsettledNet !== 0) {
         data.vault = addOrUpdateVaultEntry(
           data.vault,
           data.currentDay.date,
           unsettledNet
         );
       }
       
       const activeGoal = data.settings.dailyGoal === 500 ? 1000 : (data.settings.dailyGoal || 1000);
       data.settings.dailyGoal = activeGoal;
       data.currentDay = createNewDay(activeGoal, currentWorkingDate);
       data.lastSettlementDate = currentWorkingDate;
       saveData(data);
    } else if (data.settings.dailyGoal === 500) {
       // Upgrade default goal from 500 to 1000
       data.settings.dailyGoal = 1000;
       if (data.currentDay.goal === 500) {
         data.currentDay.goal = 1000;
       }
       saveData(data);
    }

    // Always ensure vault history is cleanly consolidated per day
    if (data.vault && data.vault.length > 0) {
      data.vault = consolidateVaultEntries(data.vault);
    }

    // Reset/migrate objectives: Replace all side objectives with the single 10,000 UM 10-day challenge
    const currentVaultTotal = data.vault ? data.vault.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    data.objectives = [
      {
        id: 'target_10k_10days',
        title: 'تحدي الـ 10,000 أوقية (10 أيام)',
        targetAmount: 10000,
        paidAmount: Math.min(10000, Math.max(0, currentVaultTotal)),
        isCompleted: currentVaultTotal >= 10000
      }
    ];

    if (!data.currentDay.operations) data.currentDay.operations = [];

    // Clean up any past penalty/inactivity deductions from vault to restore driver's balance
    if (data.vault && Array.isArray(data.vault)) {
      data.vault = data.vault.filter(
        (entry) =>
          !(
            entry.amount < 0 &&
            (entry.note?.includes('خصم تأخير') ||
              entry.note?.includes('صندوق الصدقة') ||
              entry.note?.includes('الانضباط') ||
              entry.note?.includes('عقوبة'))
          )
      );
    }

    if (!data.settings.vaultPin || data.settings.vaultPin === '5492') {
      data.settings.vaultPin = INITIAL_PIN;
    }
    if (!data.settings.monthlyGoal) data.settings.monthlyGoal = 30000;
    if (!data.vacationFund) {
      data.vacationFund = {
        targetAmount: 2000,
        savedAmount: 0,
        restDay: 5, // الجمعة افتراضياً
        spendingBudget: 1500,
        enabled: true
      };
    }

    // Ensure savingsPlan is set to the unified 10,000 UM 10-day challenge
    const hasExistingOps = data.currentDay.operations && data.currentDay.operations.length > 0;
    const hasExistingVault = data.vault && data.vault.length > 0;
    if (!data.savingsPlan || data.savingsPlan.targetAmount !== 10000 || !data.savingsPlan.durationDays) {
      data.savingsPlan = {
        targetAmount: 10000,
        timeframeMonths: 1,
        durationDays: 10,
        startDate: data.savingsPlan?.startDate || currentWorkingDate,
        challengeStartedAt: data.savingsPlan?.challengeStartedAt || (hasExistingOps || hasExistingVault ? Date.now() : undefined),
        title: 'تحدي تجميع 10,000 أوقية (10 أيام)',
        dailyIncomeBaseline: 1500
      };
    }
    if (!data.gamification) {
      data.gamification = {
        streakDays: 1,
        lastStreakDate: currentWorkingDate,
        totalXp: 500,
        openedChests: [],
        celebratedMilestones: [],
        charityFund: 0,
        unlockedTitles: ['سائق واعد 🌱'],
        selectedTitle: 'سائق واعد 🌱',
        strictCommitmentEnabled: true,
        mysteryInventory: []
      };
    } else {
      data.gamification.charityFund = 0;
      delete data.gamification.lastPenaltyTimestamp;
    }
    return data;
  }
  
  const defaultData: AppData = {
    currentDay: createNewDay(1000, currentWorkingDate),
    vault: [],
    objectives: [
      {
        id: 'target_10k_10days',
        title: 'تحدي الـ 10,000 أوقية (10 أيام)',
        targetAmount: 10000,
        paidAmount: 0,
        isCompleted: false
      }
    ],
    settings: {
      dailyGoal: 1000,
      monthlyGoal: 30000,
      vaultPin: INITIAL_PIN
    },
    vacationFund: {
      targetAmount: 2000,
      savedAmount: 0,
      restDay: 5, // الجمعة افتراضياً
      spendingBudget: 1500,
      enabled: true
    },
    savingsPlan: {
      targetAmount: 10000,
      timeframeMonths: 1,
      durationDays: 10,
      startDate: currentWorkingDate,
      title: 'تحدي تجميع 10,000 أوقية (10 أيام)',
      dailyIncomeBaseline: 1500
    },
    gamification: {
      streakDays: 1,
      lastStreakDate: currentWorkingDate,
      totalXp: 500,
      openedChests: [],
      celebratedMilestones: [],
      charityFund: 0,
      unlockedTitles: ['سائق واعد 🌱'],
      selectedTitle: 'سائق واعد 🌱',
      strictCommitmentEnabled: true,
      mysteryInventory: []
    },
    lastSettlementDate: currentWorkingDate
  };
  saveData(defaultData);
  return defaultData;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const exportData = (data: AppData) => {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rider_wallet_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
