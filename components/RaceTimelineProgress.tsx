import React from 'react';
import { TenDayChallengeState } from '../data/tenDayChallenge';

interface RaceTimelineProgressProps {
  challenge: TenDayChallengeState;
  compact?: boolean;
  onOpenModal?: () => void;
}

export const RaceTimelineProgress: React.FC<RaceTimelineProgressProps> = ({
  challenge,
  compact = false,
  onOpenModal
}) => {
  const {
    progressPct,
    timeProgressPct,
    actualSaved,
    targetAmount,
    currentDay,
    totalDays,
    daysRemaining,
    startDateStr,
    endDateStr,
    isStarted,
    raceLead,
    raceMessage,
    surplusAmount,
    deficitAmount
  } = challenge;

  return (
    <div
      onClick={onOpenModal}
      className={`relative overflow-hidden transition-all rounded-3xl border-2 select-none text-right font-['Cairo',sans-serif] ${
        compact
          ? 'p-3.5 sm:p-4 mb-5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 text-white border-yellow-500/40 shadow-lg shadow-black/20 hover:border-yellow-400 cursor-pointer'
          : 'p-5 sm:p-6 bg-slate-950/80 rounded-[2rem] border-white/10 text-white shadow-xl'
      }`}
      dir="rtl"
    >
      {/* Background Accent Glows */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-slate-950 flex items-center justify-center text-base font-black shadow-sm shrink-0">
            🏁
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-sm sm:text-base text-yellow-300">
                سباق الـ 10 أيام ضد الزمن
              </h3>
              <span className="text-[10px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-md border border-white/10">
                10 آلاف أوقية × 10 أيام
              </span>
            </div>
            {isStarted && (
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                بدأ: <span className="text-slate-200">{startDateStr}</span> ➔ ينتهي: <span className="text-slate-200">{endDateStr}</span>
              </p>
            )}
          </div>
        </div>

        {/* Real-time Race Badge */}
        <div className="shrink-0">
          {!isStarted ? (
            <span className="text-[11px] font-black bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-700">
              ⏱️ بانتظار أول مكسب
            </span>
          ) : raceLead === 'driver' ? (
            <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/50 shadow-xs flex items-center gap-1">
              <span>🚀 متقدم على الزمن!</span>
              <span className="font-mono dir-ltr text-[10px] bg-emerald-500/30 px-1 rounded">
                +{surplusAmount.toLocaleString()}
              </span>
            </span>
          ) : raceLead === 'time' ? (
            <span className="text-[11px] font-black bg-rose-500/20 text-rose-300 px-3 py-1 rounded-xl border border-rose-500/50 shadow-xs flex items-center gap-1 animate-pulse">
              <span>⏳ الزمن يسبقك!</span>
              <span className="font-mono dir-ltr text-[10px] bg-rose-500/30 px-1 rounded">
                -{deficitAmount.toLocaleString()}
              </span>
            </span>
          ) : (
            <span className="text-[11px] font-black bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-xl border border-cyan-500/50 shadow-xs">
              🎯 متعادل مع الزمن
            </span>
          )}
        </div>
      </div>

      {/* Dual Tracks: Track 1 (Financial Progress) vs Track 2 (Time Elapsed) */}
      <div className="space-y-3.5 my-3 relative z-10">
        {/* TRACK 1: FINANCIAL PROGRESS (تقدمي المالي) */}
        <div>
          <div className="flex justify-between items-center text-xs font-black mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span>💰</span>
              <span>مسار تقدمي (الـ 10,000 أوقية):</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-emerald-300">
                {actualSaved.toLocaleString()} / {targetAmount.toLocaleString()} أوقية
              </span>
              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {progressPct.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="relative w-full bg-slate-800/90 rounded-full h-4 sm:h-5 p-0.5 border border-emerald-500/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 shadow-md relative flex items-center justify-end"
              style={{ width: `${Math.min(100, Math.max(3, progressPct))}%` }}
            >
              <div className="absolute left-1 w-2.5 h-2.5 bg-white rounded-full opacity-70 animate-pulse" />
            </div>
          </div>
        </div>

        {/* TRACK 2: TIME LINE (الخط الزمني للعشرة أيام) */}
        <div>
          <div className="flex justify-between items-center text-xs font-black mb-1.5">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span>⏱️</span>
              <span>الخط الزمني للزمن (العشرة أيام):</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-300 font-bold">
                {isStarted ? `اليوم ${currentDay} من ${totalDays}` : 'لم يبدأ بعد'}
                {isStarted && daysRemaining > 0 && ` (باقي ${daysRemaining} يوم)`}
              </span>
              <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                {timeProgressPct.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="relative w-full bg-slate-800/90 rounded-full h-4 sm:h-5 p-0.5 border border-blue-500/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-md relative"
              style={{ width: `${Math.min(100, Math.max(3, timeProgressPct))}%` }}
            >
              <div className="absolute left-1 w-2.5 h-2.5 bg-white rounded-full opacity-70" />
            </div>
          </div>

          {/* 10-Day Step Markers on Timeline */}
          <div className="grid grid-cols-10 gap-1 mt-1.5 px-0.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const dayNum = idx + 1;
              const isPast = isStarted && dayNum < currentDay;
              const isCurrent = isStarted && dayNum === currentDay;
              return (
                <div
                  key={dayNum}
                  className={`text-center py-0.5 rounded text-[9px] font-black transition-all ${
                    isCurrent
                      ? 'bg-yellow-400 text-slate-950 ring-1 ring-yellow-300 shadow-xs scale-105'
                      : isPast
                      ? 'bg-blue-900/60 text-blue-200 border border-blue-700/50'
                      : 'bg-white/5 text-slate-500 border border-white/5'
                  }`}
                  title={`اليوم ${dayNum} من 10 (الهدف التراكمي: ${(dayNum * 1000).toLocaleString()} أوقية)`}
                >
                  يـ{dayNum}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Race Real-time Summary Message */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs relative z-10 flex-wrap">
        <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <span>{raceLead === 'driver' ? '🏆' : raceLead === 'time' ? '⚡' : '🏁'}</span>
          <span>{raceMessage}</span>
        </p>
        {compact && (
          <span className="text-[10px] font-black text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-0.5 rounded-lg border border-yellow-500/30 transition-all">
            عرض التفاصيل ↗
          </span>
        )}
      </div>
    </div>
  );
};
