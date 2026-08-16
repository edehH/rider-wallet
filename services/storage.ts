
import { AppData, DailyStats } from '../types';
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

const createNewDay = (goal: number = 1000, customDate?: string): DailyStats => ({
  date: customDate || getWorkingDate(),
  earnings: 0,
  ownerShare: 0,
  fuel: 0,
  purchases: 0,
  objectivePayments: 0,
  goal: goal || 1000,
  operations: []
});

export const getInitialData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const currentWorkingDate = getWorkingDate();

  if (stored) {
    const data = JSON.parse(stored) as AppData;

    // Trigger automatic transfer into vault at 6:00 AM when working date changes
    if (data.currentDay.date !== currentWorkingDate) {
       // Automatic Settlement at 6 AM boundary
       const net = data.currentDay.earnings - (
         data.currentDay.ownerShare + 
         data.currentDay.fuel + 
         data.currentDay.purchases + 
         (data.currentDay.objectivePayments || 0)
       );
       if (net !== 0) {
         data.vault.push({ 
           date: data.currentDay.date, 
           amount: net,
           note: net < 0 ? 'تغطية عجز يومي (مشتريات/مصاريف)' : 'ترحيل أرباح يومية'
         });
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

    // Migration: Ensure objectives, operations, monthlyGoal and vacationFund exist
    if (!data.objectives) data.objectives = [];
    if (!data.currentDay.operations) data.currentDay.operations = [];
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
    if (!data.savingsPlan || data.savingsPlan.timeframeMonths === 6) {
      data.savingsPlan = {
        targetAmount: data.savingsPlan?.targetAmount || 100000,
        timeframeMonths: 3,
        startDate: currentWorkingDate,
        title: `خطة تجميع ${(data.savingsPlan?.targetAmount || 100000).toLocaleString()} أوقية (3 أشهر)`,
        dailyIncomeBaseline: 1500
      };
    }
    return data;
  }
  
  const defaultData: AppData = {
    currentDay: createNewDay(1000, currentWorkingDate),
    vault: [],
    objectives: [],
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
      targetAmount: 100000,
      timeframeMonths: 3,
      startDate: currentWorkingDate,
      title: 'خطة تجميع 100,000 أوقية (3 أشهر)',
      dailyIncomeBaseline: 1500
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
