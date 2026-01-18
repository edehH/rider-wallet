
import { AppData, DailyStats } from '../types';
import { INITIAL_PIN } from '../constants';

const STORAGE_KEY = 'mr_rider_wallet_data';

const createNewDay = (goal: number): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  earnings: 0,
  ownerShare: 0,
  fuel: 0,
  purchases: 0,
  goal: goal
});

export const getInitialData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored) as AppData;
    // Check if we need a settlement (new day)
    const today = new Date().toISOString().split('T')[0];
    if (data.currentDay.date !== today) {
       // Automatic Settlement
       const net = data.currentDay.earnings - (data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases);
       if (net > 0) {
         data.vault.push({ date: data.currentDay.date, amount: net });
       }
       data.currentDay = createNewDay(data.settings.dailyGoal);
       data.lastSettlementDate = today;
       saveData(data);
    }
    return data;
  }
  
  const defaultData: AppData = {
    currentDay: createNewDay(5000),
    vault: [],
    settings: {
      dailyGoal: 5000,
      vaultPin: INITIAL_PIN
    },
    lastSettlementDate: new Date().toISOString().split('T')[0]
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
