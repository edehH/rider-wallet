import React from 'react';
import { AppData, MysteryCard } from '../types';
import { calculateDriverLevel, getStations } from '../data/gamificationData';

interface HonorShowcaseModalProps {
  data: AppData;
  isOpen: boolean;
  onClose: () => void;
  onSelectTitle: (title: string) => void;
}

export const HonorShowcaseModal: React.FC<HonorShowcaseModalProps> = ({
  data,
  isOpen,
  onClose,
  onSelectTitle
}) => {
  if (!isOpen) return null;

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
  const driverLevel = calculateDriverLevel(gamification.totalXp);

  // Available titles from level + unlocked mystery cards
  const availableTitles: { title: string; source: string; icon: string }[] = [
    { title: driverLevel.title, source: `رتبة المستوى L${driverLevel.level}`, icon: '🎖️' }
  ];

  gamification.unlockedTitles.forEach(t => {
    if (!availableTitles.some(a => a.title === t)) {
      availableTitles.push({ title: t, source: 'لقب شرفي مفتوح', icon: '⭐' });
    }
  });

  gamification.mysteryInventory.forEach(card => {
    if (card.perkTitle && !availableTitles.some(a => a.title === card.perkTitle)) {
      availableTitles.push({ title: card.perkTitle, source: card.title, icon: card.icon || '🌟' });
    }
  });

  // Current active title
  const activeTitle = gamification.selectedTitle || availableTitles[0]?.title || driverLevel.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-scaleUp select-none">
      <div className="bg-slate-900 border-2 border-yellow-400/70 rounded-[2.5rem] p-6 max-w-lg w-full text-white shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Ribbon Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎖️</span>
            <div>
              <h2 className="text-xl font-black text-yellow-300 leading-tight">
                سجل أوسمة الشرف والألقاب
              </h2>
              <p className="text-[11px] font-bold text-gray-400">
                الأوسمة التي حزتها وتستحق أن تفتخر بها في مسيرتك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center font-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Active Prominent Medal Box */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-yellow-400 rounded-3xl p-4 mb-4 text-center relative overflow-hidden shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-yellow-950 flex items-center justify-center text-3xl font-black mx-auto mb-2 shadow-lg border-2 border-white/20">
            👑
          </div>
          <span className="text-[10px] font-black text-amber-300 bg-amber-500/30 px-3 py-0.5 rounded-full border border-amber-400/40 uppercase">
            الوسام المثبت في أعلى الشاشة الرئيسية
          </span>
          <h3 className="text-lg font-black text-yellow-300 mt-1">
            {activeTitle}
          </h3>
          <p className="text-[11px] font-bold text-gray-300 mt-0.5">
            المستوى {driverLevel.level} • {gamification.totalXp.toLocaleString()} XP • تتابع {gamification.streakDays} يوم 🔥
          </p>
        </div>

        {/* Scrollable Content: Titles & Stations Medals */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* Section 1: Choose Active Title / Honor Badge */}
          <div>
            <h4 className="text-xs font-black text-yellow-300 mb-2 flex items-center gap-1.5">
              <span>🏷️</span>
              <span>اختر اللقب والوسام الذي يظهر أعلى شاشتك:</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {availableTitles.map((t, idx) => {
                const isSelected = activeTitle === t.title;
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectTitle(t.title)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/20 border-yellow-400 text-yellow-200 shadow-md'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <div className="text-xs font-black text-white">{t.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{t.source}</div>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-black bg-yellow-400 text-yellow-950 px-2.5 py-1 rounded-lg">
                        ✅ مثبت الآن
                      </span>
                    ) : (
                      <button className="text-[10px] font-bold text-yellow-300/80 hover:text-yellow-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                        تثبيت كشعار
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: 10 Station Medals Track Record */}
          <div>
            <h4 className="text-xs font-black text-yellow-300 mb-2 flex items-center gap-1.5">
              <span>🗺️</span>
              <span>أوسمة المحطات العشر (منجز {stations.filter(s => totalSaved >= s.targetAmount).length} من 10):</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {stations.map((s) => {
                const isUnlocked = totalSaved >= s.targetAmount;
                return (
                  <div
                    key={s.stationNumber}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-2.5 ${
                      isUnlocked
                        ? 'bg-emerald-950/30 border-emerald-400/60 text-emerald-200 shadow-xs'
                        : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
                    }`}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{s.badgeIcon}</span>
                    <div className="overflow-hidden">
                      <div className="text-[11px] font-black text-white truncate">
                        {s.title}
                      </div>
                      <div className="text-[10px] font-bold text-gray-300">
                        {s.targetAmount.toLocaleString()} أوقية
                      </div>
                      <div className="text-[9px] font-bold mt-1">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-black">✅ وسام محقق</span>
                        ) : (
                          <span className="text-gray-500 font-bold">🔒 قيد الإنجاز</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Earned Mystery Cards & Inspiring Quotes */}
          {gamification.mysteryInventory.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-yellow-300 mb-2 flex items-center gap-1.5">
                <span>🎴</span>
                <span>بطاقات العزيمة والاقتباسات الخالدة المكتسبة ({gamification.mysteryInventory.length}):</span>
              </h4>
              <div className="space-y-2">
                {gamification.mysteryInventory.map((card: MysteryCard) => (
                  <div
                    key={card.id}
                    className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 text-right shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{card.icon}</span>
                        <span className="text-xs font-black text-yellow-300">{card.title}</span>
                      </div>
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {card.perkTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-200 font-medium italic mb-1.5 leading-relaxed">
                      "{card.quote}"
                    </p>
                    <div className="text-[10px] text-gray-400 font-bold flex justify-between items-center">
                      <span>{card.perkDesc}</span>
                      <button
                        onClick={() => onSelectTitle(card.perkTitle)}
                        className="text-amber-400 hover:text-amber-300 font-black underline text-[10px]"
                      >
                        عرض هذا اللقب في الأعلى
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Close Button */}
        <div className="pt-4 border-t border-slate-800 mt-2">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-yellow-950 font-black py-3 rounded-2xl text-xs transition-all active:scale-98 shadow-md"
          >
            إغلاق وسام الشرف
          </button>
        </div>
      </div>
    </div>
  );
};
