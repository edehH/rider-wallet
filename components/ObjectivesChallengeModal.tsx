import React from 'react';
import { AppData } from '../types';
import { calculateTenDayChallenge, DayRoadmapItem } from '../data/tenDayChallenge';
import { RaceTimelineProgress } from './RaceTimelineProgress';

interface ObjectivesChallengeModalProps {
  data: AppData;
  onClose: () => void;
  onOpenVault: () => void;
  onOpenKeypadForDeposit: () => void;
  onOpenChest: (stationNumber: number) => void;
}

export const ObjectivesChallengeModal: React.FC<ObjectivesChallengeModalProps> = ({
  data,
  onClose,
  onOpenVault,
  onOpenKeypadForDeposit,
  onOpenChest,
}) => {
  const challengeState = calculateTenDayChallenge(data);

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[80] overflow-y-auto p-3 sm:p-6 font-['Cairo',sans-serif] select-none text-right"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-[2.5rem] border-2 border-yellow-400/50 shadow-2xl p-4 sm:p-7 relative overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4 relative z-10 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-yellow-300">
                تحدي الـ 10,000 أوقية 🎯
              </span>
              <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                10 أيام × 1,000 أوقية/يوم
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold mt-1">
              الهدف الوحيد المعتمد للتطبيق مع احتساب الوقت التلقائي ومكافآت كل مرحلة
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-white px-5 text-sm transition-all active:scale-95 border border-white/10"
          >
            إغلاق ✕
          </button>
        </div>

        {/* REAL-TIME PACING STATUS BANNER (محرك احتساب الوقت والتأخير أو التقدم) */}
        <div className="mb-6 relative z-10">
          {challengeState.status === 'ahead' && (
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-2 border-emerald-400/80 rounded-3xl p-4 sm:p-5 shadow-lg shadow-emerald-500/15">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                  ⚡
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center flex-wrap gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-black text-emerald-300">
                      {challengeState.statusTitle}
                    </h3>
                    <span className="text-[11px] font-black bg-emerald-400 text-emerald-950 px-3 py-1 rounded-full shadow-2xs">
                      {challengeState.statusBadge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-100/90 leading-relaxed">
                    {challengeState.statusMessage}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-xl">
                      متقدم بـ: {challengeState.surplusAmount.toLocaleString()} أوقية
                    </span>
                    <span className="text-[11px] font-black bg-white/10 text-white px-3 py-1 rounded-xl">
                      اختصرت: {challengeState.daysAhead} {challengeState.daysAhead === 1 ? 'يوم' : 'أيام'} مقدماً 🚀
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {challengeState.status === 'behind' && (
            <div className="bg-gradient-to-r from-rose-950 via-orange-950 to-slate-900 border-2 border-rose-500/80 rounded-3xl p-4 sm:p-5 shadow-lg shadow-rose-500/15">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md animate-pulse">
                  ⏳
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center flex-wrap gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-black text-rose-300">
                      {challengeState.statusTitle}
                    </h3>
                    <span className="text-[11px] font-black bg-rose-500 text-white px-3 py-1 rounded-full shadow-2xs">
                      {challengeState.statusBadge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-rose-100/90 leading-relaxed mb-3">
                    {challengeState.statusMessage}
                  </p>

                  {/* Delayed Items Breakdown Table */}
                  <div className="bg-black/30 border border-rose-500/40 rounded-2xl p-3 space-y-2">
                    <div className="text-[11px] font-black text-rose-300 border-b border-rose-500/30 pb-1 flex justify-between">
                      <span>بيان الأشياء المتأخر عنها بدقة:</span>
                      <span className="text-amber-300">مطلوب التعويض للعودة للوتيرة</span>
                    </div>
                    {challengeState.delayedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center text-xs py-1 px-2 rounded-lg ${
                          item.isHighlight
                            ? 'bg-rose-500/20 text-rose-200 font-black border border-rose-500/50'
                            : 'text-gray-300 font-bold'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={item.isAlert ? 'text-rose-300 font-black text-sm' : 'text-white'}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {challengeState.status === 'on_track' && (
            <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 border-2 border-blue-400/80 rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-500/15">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-400 text-blue-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                  🎯
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center flex-wrap gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-black text-blue-300">
                      {challengeState.statusTitle}
                    </h3>
                    <span className="text-[11px] font-black bg-blue-400 text-blue-950 px-3 py-1 rounded-full shadow-2xs">
                      {challengeState.statusBadge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-blue-100/90 leading-relaxed">
                    {challengeState.statusMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {challengeState.status === 'completed' && (
            <div className="bg-gradient-to-r from-amber-950 via-yellow-900 to-slate-900 border-2 border-yellow-400/80 rounded-3xl p-4 sm:p-5 shadow-lg shadow-yellow-500/20">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-yellow-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-black text-yellow-300">
                    {challengeState.statusTitle}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-yellow-100/90 mt-1 leading-relaxed">
                    {challengeState.statusMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {challengeState.status === 'not_started' && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                  ⏱️
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {challengeState.statusTitle}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-gray-300 mt-1">
                    {challengeState.statusMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 block mb-1">المدخر بالخزنة 💰</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {challengeState.actualSaved.toLocaleString()} <span className="text-xs font-normal">أوقية</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 font-bold mt-1">
              من أصل 10,000 أوقية
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 block mb-1">المتبقي للإنجاز ⏳</span>
            <div className="text-xl sm:text-2xl font-black text-yellow-300">
              {challengeState.remainingMoney.toLocaleString()} <span className="text-xs font-normal">أوقية</span>
            </div>
            <span className="text-[10px] text-yellow-200/80 font-bold mt-1">
              {challengeState.remainingMoney === 0 ? 'اكتمل الهدف! 🏆' : 'متبقي للوصول للهدف'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 block mb-1">اليوم في التحدي 📅</span>
            <div className="text-xl sm:text-2xl font-black text-blue-300">
              اليوم {challengeState.currentDay} <span className="text-xs font-normal">من 10</span>
            </div>
            <span className="text-[10px] text-blue-200/80 font-bold mt-1">
              باقي {challengeState.daysRemaining} {challengeState.daysRemaining === 1 ? 'يوم' : 'أيام'} بالجدول
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 block mb-1">نسبة الإنجاز 🏁</span>
            <div className="text-xl sm:text-2xl font-black text-cyan-300">
              {challengeState.progressPct.toFixed(0)}%
            </div>
            <span className="text-[10px] text-cyan-200/80 font-bold mt-1">
              {challengeState.roadmap.filter((r) => r.isUnlocked).length} من 10 مراحل مكتملة
            </span>
          </div>
        </div>

        {/* Dual Track Race: 10,000 UM Progress alongside 10-Day Timeline */}
        <div className="mb-7 relative z-10">
          <RaceTimelineProgress challenge={challengeState} compact={false} />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 relative z-10">
          <button
            onClick={onOpenKeypadForDeposit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-800"
          >
            <span>دفع مباشر للتحدي الآن 💰</span>
          </button>
          <button
            onClick={onOpenVault}
            className="bg-yellow-800 hover:bg-yellow-900 text-white p-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-yellow-950"
          >
            <span>فتح الخزنة وسجل المدخرات 🏦</span>
          </button>
        </div>

        {/* 10-DAY ROADMAP & REWARD CHESTS (صناديق المكافآت والمراحل والرتب) */}
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 className="text-sm sm:text-base font-black text-yellow-300 flex items-center gap-2">
              <span>🗺️</span>
              <span>خريطة الأيام العشرة ومحطات المكافآت (10 مراحل × 1,000 أوقية)</span>
            </h3>
            <span className="text-xs text-gray-400 font-bold">
              كل يوم مرحلة وكل مرحلة تفتح صندوق أسرار 🎁
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {challengeState.roadmap.map((item: DayRoadmapItem) => {
              const { dayNumber, cumulativeTarget, status, station, isUnlocked, unlockedChest } = item;

              let cardBorder = 'border-white/10 bg-white/5 text-gray-300';
              let badgeBg = 'bg-white/10 text-gray-400';
              let badgeText = '🔒 قادم';

              if (status === 'completed') {
                cardBorder = 'border-emerald-500/60 bg-emerald-950/30 text-emerald-100 shadow-xs';
                badgeBg = 'bg-emerald-500 text-emerald-950';
                badgeText = '✅ مكتمل';
              } else if (status === 'current') {
                cardBorder = 'border-2 border-yellow-400 bg-yellow-950/30 text-yellow-100 shadow-md shadow-yellow-500/10 animate-pulse';
                badgeBg = 'bg-yellow-400 text-yellow-950';
                badgeText = '📍 اليوم الحالي';
              } else if (status === 'delayed') {
                cardBorder = 'border-2 border-rose-500/70 bg-rose-950/30 text-rose-100 shadow-xs';
                badgeBg = 'bg-rose-500 text-white';
                badgeText = '⚠️ متأخر';
              }

              return (
                <div
                  key={dayNumber}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${cardBorder}`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{station.badgeIcon}</span>
                        <div>
                          <div className="text-xs font-black">{station.title}</div>
                          <div className="text-[10px] text-gray-400 font-bold">
                            اليوم {dayNumber} • الهدف التراكمي: {cumulativeTarget.toLocaleString()} أوقية
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                        {badgeText}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-gray-300 line-clamp-2 my-1">
                      {station.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[11px] font-black text-gray-400">
                      المرحلة #{dayNumber}
                    </span>

                    {isUnlocked ? (
                      <button
                        onClick={() => onOpenChest(dayNumber)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5 ${
                          unlockedChest
                            ? 'bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-400/40'
                            : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 animate-bounce'
                        }`}
                      >
                        <span>{unlockedChest ? 'استعراض الصندوق' : 'افتح الصندوق الآن!'}</span>
                        <span>🎁</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                        <span>🔒</span>
                        <span>يفتح عند {cumulativeTarget.toLocaleString()} أوقية</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
