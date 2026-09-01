import React, { useState } from 'react';
import { AppData, SavingsPlan, VaultEntry } from '../types';
import { getStations, calculateDriverLevel } from '../data/gamificationData';

interface SavingsVaultModalProps {
  data: AppData;
  onClose: () => void;
  onUpdateSavingsPlan: (plan: SavingsPlan) => void;
  onWithdraw: () => void;
  onManualSettlement: () => void;
  onAddManualDeposit: () => void;
  onOpenChest?: (stationNumber: number) => void;
  onClearCharityFund?: () => void;
}

const PRESET_PLANS = [
  {
    targetAmount: 100000,
    timeframeMonths: 3,
    title: 'خطة الـ 100,000 أوقية (3 أشهر - 90 يوماً)',
    dailyIncomeBaseline: 1500,
    dailySavingsNeeded: 1111,
    icon: '🎯',
    badge: 'الهدف السريع للشباب',
  },
  {
    targetAmount: 180000,
    timeframeMonths: 3,
    title: 'خطة الـ 180,000 أوقية (3 أشهر - 90 يوماً)',
    dailyIncomeBaseline: 1500,
    dailySavingsNeeded: 2000,
    icon: '🚀',
    badge: 'الهدف الذهبي المكثف',
  },
  {
    targetAmount: 50000,
    timeframeMonths: 3,
    title: 'خطة الـ 50,000 أوقية (3 أشهر)',
    dailyIncomeBaseline: 1500,
    dailySavingsNeeded: 556,
    icon: '⚡',
    badge: 'هدف انطلاقة ميسرة',
  },
];

export const SavingsVaultModal: React.FC<SavingsVaultModalProps> = ({
  data,
  onClose,
  onUpdateSavingsPlan,
  onWithdraw,
  onManualSettlement,
  onAddManualDeposit,
  onOpenChest,
  onClearCharityFund,
}) => {
  const currentPlan: SavingsPlan = data.savingsPlan || {
    targetAmount: 100000,
    timeframeMonths: 3,
    startDate: data.currentDay.date,
    title: 'خطة تجميع 100,000 أوقية (3 أشهر)',
    dailyIncomeBaseline: 1500,
  };

  const [isEditingCustomTarget, setIsEditingCustomTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState(String(currentPlan.targetAmount));
  const [customIncomeInput, setCustomIncomeInput] = useState(String(currentPlan.dailyIncomeBaseline || 1500));

  // Calculations
  const totalSavedInVault = data.vault.reduce((acc, curr) => acc + curr.amount, 0);
  const currentDayNet = data.currentDay.earnings - (data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases + (data.currentDay.objectivePayments || 0));
  const settledToday = data.currentDay.settledAmount || 0;
  const unsettledLive = Math.max(0, currentDayNet - settledToday);

  // Total saved includes confirmed vault + live un-settled surplus
  const totalSaved = Math.max(0, totalSavedInVault + unsettledLive);
  const target = currentPlan.targetAmount || 100000;
  const remaining = Math.max(0, target - totalSaved);
  const progressPct = Math.min(100, Math.max(0, (totalSaved / target) * 100));

  const totalDays = (currentPlan.timeframeMonths || 3) * 30;
  const dailyNeeded = Math.max(1, Math.round(target / totalDays));
  const dailyIncome = currentPlan.dailyIncomeBaseline || 1500;
  const dailySavingsRatio = Math.round((dailyNeeded / dailyIncome) * 100);

  // Performance-based Days & Months Countdown (Shortened directly as user saves more)
  const daysCompleted = Math.min(totalDays, Math.floor(totalSaved / dailyNeeded));
  const daysRemaining = Math.max(0, Math.ceil(remaining / dailyNeeded));

  const formatRemainingText = (days: number) => {
    if (days <= 0) return '0 يوم (اكتمل الهدف بنجاح! 🏆)';
    const m = Math.floor(days / 30);
    const d = days % 30;
    if (m > 0 && d > 0) {
      const mText = m === 1 ? 'شهر واحد' : m === 2 ? 'شهران (2)' : `${m} أشهر`;
      const dText = d === 1 ? 'يوم واحد' : d === 2 ? 'يومان' : `${d} أيام`;
      return `${mText} و ${dText} (${days} يوماً)`;
    }
    if (m > 0 && d === 0) {
      const mText = m === 1 ? 'شهر واحد (30 يوماً)' : m === 2 ? 'شهران (60 يوماً)' : `${m} أشهر (${days} يوماً)`;
      return mText;
    }
    return `${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومان' : days <= 10 ? 'أيام' : 'يوماً'}`;
  };

  // Motivational Affirmations according to milestone
  const getMotivationMessage = () => {
    if (totalSaved >= target) {
      return {
        title: '🎉 ألف مبروك يا بطل! تم تحقيق الهدف بالكامل!',
        desc: `لقد جمعت ${totalSaved.toLocaleString()} أوقية بنجاح واقتدار في مقتبل شبابك خلال 3 أشهر فقط. طريقك مفتوح نحو إنجازات أعظم!`,
        color: 'from-emerald-500 to-teal-700',
        textColor: 'text-emerald-950',
      };
    }
    if (progressPct >= 75) {
      return {
        title: '👑 أنت على وشك النهاية! لم يتبق سوى القليل جداً',
        desc: `متبقي لك ${remaining.toLocaleString()} أوقية فقط للوصول إلى ${target.toLocaleString()} أوقية! استمر بنفس العزيمة.`,
        color: 'from-amber-400 to-orange-500',
        textColor: 'text-amber-950',
      };
    }
    if (progressPct >= 50) {
      return {
        title: '🔥 قطعت أكثر من نصف الطريق في فترة قياسية!',
        desc: `حققت ${totalSaved.toLocaleString()} أوقية، والمتبقي ${remaining.toLocaleString()} أوقية فقط. المسار الآن أسهل وأسرع!`,
        color: 'from-blue-500 to-indigo-600',
        textColor: 'text-blue-950',
      };
    }
    if (progressPct >= 25) {
      return {
        title: '💪 إنجاز رائع! تجاوزت ربع الهدف بنجاح',
        desc: `وفرت ${totalSaved.toLocaleString()} أوقية. متبقي ${remaining.toLocaleString()} أوقية، خطواتك ثابتة والأفق مشرق!`,
        color: 'from-cyan-500 to-blue-600',
        textColor: 'text-cyan-950',
      };
    }
    return {
      title: '🌱 خطة الشهور الثلاثة السريعة لمقتبل العمر',
      desc: `خلال 3 أشهر (90 يوماً فقط)، ادخار ${dailyNeeded.toLocaleString()} أوقية يومياً يوصلك لـ ${target.toLocaleString()} أوقية كاملة في نصف المدة!`,
      color: 'from-yellow-400 to-amber-500',
      textColor: 'text-yellow-950',
    };
  };

  const stations = getStations(target);
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

  const driverStats = calculateDriverLevel(gamification.totalXp);
  const nextStation = stations.find(s => totalSaved < s.targetAmount) || stations[stations.length - 1];
  const amountToNextStation = Math.max(0, nextStation.targetAmount - totalSaved);

  const [activeTab, setActiveTab] = useState<'roadmap' | 'inventory' | 'history'>('roadmap');

  const handleApplyCustomPlan = () => {
    const newTarget = parseInt(customTargetInput, 10) || 100000;
    const newIncome = parseInt(customIncomeInput, 10) || 1500;
    const updated: SavingsPlan = {
      ...currentPlan,
      targetAmount: newTarget,
      dailyIncomeBaseline: newIncome,
      title: `خطة تجميع ${newTarget.toLocaleString()} أوقية`,
    };
    onUpdateSavingsPlan(updated);
    setIsEditingCustomTarget(false);
  };

  return (
    <div className="fixed inset-0 bg-[#F9FAFB] z-[90] overflow-y-auto p-4 sm:p-6 font-['Cairo',sans-serif] select-none text-right" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
            <span>الخزنة ومُتابِع الادخار 🏦</span>
          </h2>
          <p className="text-xs text-gray-500 font-bold mt-1">تتبع رحلة تجميع الـ 100,000 و 180,000 أوقية والمتبقي بدقة</p>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 sm:p-3 bg-red-100 hover:bg-red-200 rounded-2xl font-black text-red-700 px-5 text-sm transition-all active:scale-95 shadow-sm"
        >
          رجوع ✕
        </button>
      </div>

      {/* Hero Goal Card: Current Savings & Exact Remaining Countdown */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[2.5rem] p-6 sm:p-8 text-white mb-6 shadow-2xl border-4 border-yellow-500/30 relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute -bottom-10 -left-10 opacity-10 text-[11rem] pointer-events-none">🏦</div>

        {/* Top Badges & Plan Title */}
        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
          <div className="bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <span>🎯</span>
            <span>{currentPlan.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>⏳ المدة المتبقية:</span>
              <span className="text-white font-black">{formatRemainingText(daysRemaining)}</span>
            </div>
            {daysCompleted > 0 && (
              <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl">
                ⚡ اختصرت {daysCompleted} يوم عمل!
              </div>
            )}
          </div>
        </div>

        {/* Primary Amount Displays: Total Saved vs REMAINING AMOUNT & REMAINING DAYS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          {/* Box 1: Saved so far */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 block mb-1">إجمالي ما تم ادخاره 💰</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {totalSaved.toLocaleString()} <span className="text-xs font-bold text-gray-300">أوقية</span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-emerald-300/80">
                تم إنجاز {progressPct.toFixed(1)}% من الهدف
              </span>
              {unsettledLive > 0 && (
                <span className="text-[10px] text-amber-300 font-black">
                  (يشمل {unsettledLive.toLocaleString()} أوقية صافي اليوم قبل الترحيل)
                </span>
              )}
            </div>
          </div>

          {/* Box 2: EXACT REMAINING MONEY (المبلغ المتبقي لتحقيق الهدف) */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-400/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg shadow-yellow-500/10 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-yellow-300 block mb-1">
                  المبلغ المتبقي ⏳
                </span>
                <span className="text-[10px] bg-yellow-400 text-yellow-950 font-black px-2 py-0.5 rounded-md">
                  مالياً
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-tight">
                {remaining.toLocaleString()} <span className="text-xs font-bold text-yellow-200/80">أوقية</span>
              </div>
            </div>
            <span className="text-[11px] font-black text-yellow-200/90 mt-2 block">
              {remaining === 0 ? 'تم اكتمال الهدف! 🏆' : `يفصلك ${remaining.toLocaleString()} أوقية`}
            </span>
          </div>

          {/* Box 3: DYNAMIC REMAINING DAYS (الأيام والشهور المتبقية وتخصم مع كل إيداع) */}
          <div className="bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-blue-600/20 border-2 border-blue-400/60 rounded-2xl p-4 backdrop-blur-sm shadow-lg shadow-blue-500/10 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-blue-300 block mb-1">
                  المدة المتبقية بالعمل 📅
                </span>
                <span className="text-[10px] bg-blue-400 text-blue-950 font-black px-2 py-0.5 rounded-md">
                  تخصم الأيام فوراً
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-200 tracking-tight">
                {formatRemainingText(daysRemaining)}
              </div>
            </div>
            <span className="text-[11px] font-black text-cyan-300/90 mt-2 block">
              {daysRemaining === 0 
                ? 'وصلت لخط النهاية! 🏆' 
                : `إيداعك يخصم ${Math.max(1, Math.round(1500 / dailyNeeded))} يوم دفعة واحدة! 🚀`}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-black mb-1.5">
            <span className="text-gray-300">مسار التقدم نحو {target.toLocaleString()} أوقية:</span>
            <span className="text-yellow-400 font-bold">{progressPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-7 overflow-hidden border-2 border-slate-700 p-1 shadow-inner relative">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end px-2 bg-gradient-to-r from-emerald-500 via-yellow-400 to-amber-500 shadow-md"
              style={{ width: `${Math.max(5, progressPct)}%` }}
            >
              <span className="text-xs font-black text-slate-950">
                {progressPct >= 15 ? `${progressPct.toFixed(0)}%` : ''} 🏁
              </span>
            </div>
          </div>
        </div>

        {/* Driver Level, Streak, and XP Header Bar */}
        <div className="bg-slate-900/90 border border-yellow-400/40 rounded-2xl p-3.5 mb-5 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-yellow-950 flex items-center justify-center font-black text-base shadow-sm">
              L{driverStats.level}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-yellow-300">{driverStats.title}</span>
                <span className="text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-0.5 rounded-full">
                  🔥 تتابع: {gamification.streakDays} يوم
                </span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                نقاط الخبرة: {gamification.totalXp.toLocaleString()} XP
              </div>
            </div>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block font-bold">المحطة القادمة:</span>
            <span className="text-xs font-black text-emerald-400">
              {amountToNextStation === 0 ? 'اكتملت جميع المحطات! 🏆' : `باقي ${amountToNextStation.toLocaleString()} أوقية`}
            </span>
          </div>
        </div>

        {/* 10-Station Interactive Roadmap Grid (خريطة المحطات العشر التفاعلية) */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2.5">
            <h4 className="text-xs font-black text-yellow-300 flex items-center gap-1.5">
              <span>🗺️</span>
              <span>خريطة المحطات الـ 10 (كل محطة مرحلة وصندوق أسرار 🎁)</span>
            </h4>
            <span className="text-[10px] font-bold text-gray-400">
              منجز {stations.filter(s => totalSaved >= s.targetAmount).length} من 10
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stations.map((s) => {
              const isUnlocked = totalSaved >= s.targetAmount;
              const isChestOpened = gamification.openedChests.includes(s.stationNumber);
              const isCurrentTarget = nextStation.stationNumber === s.stationNumber && !isUnlocked;

              return (
                <div
                  key={s.stationNumber}
                  className={`p-2.5 rounded-2xl border transition-all text-center flex flex-col justify-between relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-400/60 text-emerald-200 shadow-xs'
                      : isCurrentTarget
                      ? 'bg-gradient-to-b from-amber-500/25 to-yellow-500/15 border-2 border-yellow-400 text-yellow-200 shadow-md shadow-yellow-500/10 animate-pulse'
                      : 'bg-white/5 border-white/10 text-gray-400 opacity-65'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-black mb-1">
                      <span className="opacity-80">#{s.stationNumber}</span>
                      <span>{s.badgeIcon}</span>
                    </div>
                    <div className="text-[11px] font-black leading-tight text-white mb-1">
                      {s.targetAmount.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-bold truncate opacity-90 mb-2">
                      {s.title.replace(/[0-9]/g, '')}
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      isChestOpened ? (
                        <div className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 py-1 rounded-lg border border-emerald-500/30">
                          ✅ مفتوح
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenChest && onOpenChest(s.stationNumber)}
                          className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-yellow-950 text-[10px] font-black py-1 rounded-lg shadow-sm active:scale-95 transition-all animate-bounce"
                        >
                          🎁 افتح!
                        </button>
                      )
                    ) : isCurrentTarget ? (
                      <div className="text-[9px] font-black text-amber-300 bg-amber-500/20 py-1 rounded-lg border border-amber-400/40">
                        🎯 القادمة ({Math.max(0, s.targetAmount - totalSaved).toLocaleString()})
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-gray-500 py-1">
                        🔒 مغلق
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Card Box */}
        <div className="bg-gradient-to-r from-yellow-500/15 via-amber-500/20 to-yellow-500/15 border border-yellow-400/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌟</span>
            <h4 className="font-black text-yellow-300 text-sm">{nextStation.title}</h4>
          </div>
          <p className="text-xs font-bold text-gray-200 leading-relaxed pr-6">{nextStation.dopamineMessage}</p>
        </div>

        {/* Mystery Cards Inventory & Charity Fund Showcase */}
        {gamification.mysteryInventory.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 mb-4">
            <h5 className="text-xs font-black text-yellow-300 mb-2 flex items-center justify-between">
              <span>🎴 بطاقات العزيمة والألقاب المكتسبة ({gamification.mysteryInventory.length}):</span>
            </h5>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gamification.mysteryInventory.map((c) => (
                <div key={c.id} className="bg-slate-800 border border-yellow-400/40 rounded-xl p-2.5 min-w-[140px] max-w-[160px] shrink-0 text-right">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{c.icon}</span>
                    <span className="text-[10px] font-black text-yellow-300 truncate">{c.title}</span>
                  </div>
                  <p className="text-[9px] text-gray-300 line-clamp-2 italic mb-1">"{c.quote}"</p>
                  <span className="text-[9px] font-black text-emerald-400 block">{c.perkTitle}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Silent Charity & Inactivity Discipline Box (صندوق الصدقة والانضباط المالي) */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <div>
                <span className="text-emerald-300 font-black text-xs block">
                  صندوق الصدقة والانضباط المالي (داخل الخزنة)
                </span>
                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                  يُخصم 150 أوقية بصمت عند كل تأخير أو انقطاع عن العمل لتتراكم كصدقة وتطهير للمال.
                </span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] text-gray-400 block font-bold">المستحقات المتراكمة:</span>
              <span className={`text-base font-black ${gamification.charityFund > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {gamification.charityFund.toLocaleString()} أوقية
              </span>
            </div>
          </div>

          {gamification.charityFund > 0 ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
              <div className="text-[11px] text-emerald-200 font-bold text-right w-full sm:w-auto">
                <span>تراكمت {gamification.charityFund} أوقية. عند إخراجها أو التصدق بها، اضغط "تم" لتصفير الصندوق والجاهزية للجولات القادمة.</span>
              </div>
              <button
                onClick={() => onClearCharityFund && onClearCharityFund()}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <span>تم الإخراج والتصدق بها ✓</span>
                <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-md">تصفير (0)</span>
              </button>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-gray-400 bg-slate-950/50 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>✅ الصندوق مصفّر حالياً (0 أوقية) وجاهز. لا توجد أي مستحقات متأخرة.</span>
              <span className="text-emerald-400 font-black">منضبط 🛡️</span>
            </div>
          )}
        </div>

        {/* Daily Pace Roadmap breakdown */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <div>
              <span className="text-slate-400 font-bold block">معدل الادخار اليومي المقترح:</span>
              <span className="text-white font-black text-sm">
                {dailyNeeded.toLocaleString()} أوقية / يومياً
              </span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-slate-400 font-bold block">نسبة من دخلك (~{dailyIncome.toLocaleString()}):</span>
            <span className="text-yellow-400 font-black">{dailySavingsRatio}% فقط</span>
          </div>
        </div>
      </div>

      {/* Target Chooser & Plan Switcher */}
      <div className="bg-white p-5 sm:p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
            <span>اختر خطة تجميع رأس المال (3 أشهر - 90 يوماً) ⚡</span>
          </h3>
          <button
            onClick={() => setIsEditingCustomTarget(!isEditingCustomTarget)}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/60 hover:bg-blue-100 transition-all"
          >
            {isEditingCustomTarget ? 'إلغاء التعديل ✕' : 'تخصيص هدف آخر ✎'}
          </button>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {PRESET_PLANS.map((plan, idx) => {
            const isSelected = currentPlan.targetAmount === plan.targetAmount;
            return (
              <button
                key={idx}
                onClick={() => {
                  onUpdateSavingsPlan({
                    targetAmount: plan.targetAmount,
                    timeframeMonths: plan.timeframeMonths,
                    startDate: data.currentDay.date,
                    title: plan.title,
                    dailyIncomeBaseline: plan.dailyIncomeBaseline,
                  });
                  setIsEditingCustomTarget(false);
                }}
                className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between active:scale-95 ${
                  isSelected
                    ? 'border-yellow-500 bg-yellow-50/80 shadow-md shadow-yellow-500/10'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/70'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xl">{plan.icon}</span>
                    <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-md border text-slate-700">
                      {plan.badge}
                    </span>
                  </div>
                  <div className="text-lg font-black text-gray-900">
                    {plan.targetAmount.toLocaleString()} <span className="text-xs font-bold text-gray-500">أوقية</span>
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-0.5">خلال {plan.timeframeMonths} أشهر</div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200/70 text-[11px] font-bold text-slate-600 flex justify-between">
                  <span>المعدل اليومي:</span>
                  <span className="font-black text-blue-700">~{plan.dailySavingsNeeded} أوقية</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Target Editor Form */}
        {isEditingCustomTarget && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-3 animate-fadeIn">
            <h4 className="text-xs font-black text-slate-800">تحديد هدف مالي مخصص:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">المبلغ الإجمالي المستهدف (أوقية):</label>
                <input
                  type="number"
                  value={customTargetInput}
                  onChange={(e) => setCustomTargetInput(e.target.value)}
                  placeholder="مثلاً: 100000 أو 180000"
                  className="w-full text-sm font-black p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-right"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">متوسط دخلك اليومي التقريبي (أوقية):</label>
                <input
                  type="number"
                  value={customIncomeInput}
                  onChange={(e) => setCustomIncomeInput(e.target.value)}
                  placeholder="مثلاً: 1500"
                  className="w-full text-sm font-black p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-right"
                />
              </div>
            </div>
            <button
              onClick={handleApplyCustomPlan}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              حفظ واعتماد الخطة الجديدة ✓
            </button>
          </div>
        )}
      </div>

      {/* Vault Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <button
          onClick={onWithdraw}
          className="bg-yellow-950 hover:bg-black text-white p-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-yellow-900"
        >
          <span>سحب مبلغ 💸</span>
        </button>
        <button
          onClick={onManualSettlement}
          className="bg-yellow-800 hover:bg-yellow-900 text-white p-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-yellow-900"
        >
          <span>{unsettledLive > 0 ? `ترحيل أرباح اليوم (${unsettledLive.toLocaleString()} أوقية) 🔄` : 'تسوية وترحيل الأرباح 🔄'}</span>
        </button>
        <button
          onClick={onAddManualDeposit}
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-900"
        >
          <span>إيداع ادخار مباشر 💰</span>
        </button>
      </div>

      {/* Transaction Movements History */}
      <div className="bg-white p-5 sm:p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-3">
        <h4 className="font-black text-gray-800 text-sm border-b pb-2 flex justify-between items-center">
          <span>سجل حركات الخزنة والادخار 📜</span>
          <span className="text-xs text-gray-400 font-bold">{data.vault.length} حركة مسجلة</span>
        </h4>

        {data.vault.length === 0 && (
          <div className="text-center text-gray-400 py-10 font-bold">
            <span className="text-3xl block mb-2">🏦</span>
            لا توجد حركات ادخار مسجلة بعد. عند ترحيل أرباحك اليومية أو إيداع مبالغ، ستظهر هنا مباشرة!
          </div>
        )}

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {[...data.vault].reverse().map((entry: VaultEntry, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 shadow-xs font-black text-xs sm:text-sm"
            >
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px]">{entry.date}</span>
                <span className="text-gray-800 text-xs sm:text-sm">
                  {entry.note || (entry.amount < 0 ? 'تغطية عجز يومي / سحب' : 'ترحيل أرباح يومية')}
                </span>
              </div>
              <span className={`text-base sm:text-lg font-black dir-ltr ${entry.amount < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {entry.amount < 0 ? '' : '+'}{(entry.amount || 0).toLocaleString()} <span className="text-[10px]">أوقية</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
