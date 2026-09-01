import React from 'react';
import { AppData } from '../types';
import { calculateDriverLevel, getStations } from '../data/gamificationData';

interface HonorBadgeRibbonProps {
  data: AppData;
  onOpenShowcase: () => void;
}

export const HonorBadgeRibbon: React.FC<HonorBadgeRibbonProps> = ({ data, onOpenShowcase }) => {
  const gamification = data.gamification || {
    streakDays: 1,
    lastStreakDate: data.currentDay.date,
    totalXp: 500,
    openedChests: [],
    celebratedMilestones: [],
    charityFund: 0,
    unlockedTitles: ['سائق واعد 🌱'],
    selectedTitle: 'سائق واعد 🌱',
    strictCommitmentEnabled: true,
    mysteryInventory: []
  };

  const targetAmount = data.savingsPlan?.targetAmount || 100000;
  const totalSaved = Math.max(0, data.vault.reduce((acc, curr) => acc + curr.amount, 0));
  const stations = getStations(targetAmount);

  // Driver Level Info
  const driverLevel = calculateDriverLevel(gamification.totalXp);

  // Determine the highest station achieved
  const unlockedStations = stations.filter(s => totalSaved >= s.targetAmount);
  const highestStation = unlockedStations.length > 0 ? unlockedStations[unlockedStations.length - 1] : stations[0];

  // Highest Honor Card from inventory
  const latestHonorCard = gamification.mysteryInventory.length > 0 ? gamification.mysteryInventory[0] : null;

  // Selected or active Honor Title
  const activeTitle = gamification.selectedTitle || latestHonorCard?.perkTitle || driverLevel.title;

  // Determine active medal icon
  const activeMedalIcon = latestHonorCard?.icon || highestStation.badgeIcon || '🎖️';

  return (
    <div
      onClick={onOpenShowcase}
      className="mb-3.5 cursor-pointer select-none group transition-all active:scale-[0.99]"
      title="اضغط لعرض وتغيير وسام الأقدمية والرتبة"
    >
      <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400/60 rounded-2xl px-3.5 py-2 text-white flex items-center justify-between gap-3 shadow-xs">
        {/* Badge Icon & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-lg shrink-0">
            {activeMedalIcon}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-300 truncate">
                {activeTitle}
              </span>
              <span className="text-[10px] font-mono font-black bg-slate-800 text-gray-300 px-1.5 py-0.2 rounded-md border border-slate-700">
                L{driverLevel.level}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold truncate">
              المحطة #{highestStation.stationNumber} • {gamification.totalXp.toLocaleString()} XP
              {gamification.streakDays > 0 && ` • 🔥 ${gamification.streakDays} يوم`}
            </p>
          </div>
        </div>

        {/* Minimal indicator */}
        <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-gray-400 group-hover:text-amber-300 transition-colors">
          <span>الرتبة</span>
          <span className="text-xs font-black">←</span>
        </div>
      </div>
    </div>
  );
};

