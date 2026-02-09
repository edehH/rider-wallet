
import { AppData, DailyStats } from '../types';
import { INITIAL_PIN } from '../constants';

const STORAGE_KEY = 'mr_rider_wallet_data_v3';

const createNewDay = (goal: number): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  earnings: 0,
  ownerShare: 0,
  fuel: 0,
  purchases: 0,
  objectivePayments: 0,
  goal: goal,
  operations: []
});

export const getInitialData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored) as AppData;
    const today = new Date().toISOString().split('T')[0];
    if (data.currentDay.date !== today) {
       // Automatic Settlement
       const net = data.currentDay.earnings - (data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases + (data.currentDay.objectivePayments || 0));
       if (net > 0) {
         data.vault.push({ date: data.currentDay.date, amount: net });
       }
       data.currentDay = createNewDay(data.settings.dailyGoal);
       data.lastSettlementDate = today;
       saveData(data);
    }
    // Migration: Ensure objectives and operations exist
    if (!data.objectives) data.objectives = [];
    if (!data.currentDay.operations) data.currentDay.operations = [];
    return data;
  }
  
  const defaultData: AppData = {
    currentDay: createNewDay(500),
    vault: [],
    objectives: [],
    settings: {
      dailyGoal: 500,
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
