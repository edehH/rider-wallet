import React, { useEffect, useState, useRef } from 'react';
import {
  playStage1NormalReminder,
  playStage2EscalatingWarning,
  playStage3EmergencySOS,
  playDispatchPhoneRing,
  playDispatchMotivationHorn,
  stopContinuousSounds
} from '../services/soundEffects';

export type AlertStage = 1 | 2 | 3;

interface DispatchCallAlertProps {
  isOpen: boolean;
  minutesInactive: number;
  forcedStage?: AlertStage;
  onRecordNow: (quickCourseInfo?: { fromLocation?: string; toLocation?: string; title?: string }) => void;
  onSnooze: (minutes: number) => void;
  onClose: () => void;
}

export const DispatchCallAlert: React.FC<DispatchCallAlertProps> = ({
  isOpen,
  minutesInactive,
  forcedStage,
  onRecordNow,
  onSnooze,
  onClose
}) => {
  // Determine Stage based on inactive duration:
  // Stage 1: 60 - 119 mins
  // Stage 2: 120 - 179 mins
  // Stage 3: >= 180 mins
  const currentStage: AlertStage = forcedStage || (minutesInactive >= 180 ? 3 : minutesInactive >= 120 ? 2 : 1);

  // Stage 1: 10-second countdown auto-dismiss
  const [countdown, setCountdown] = useState(10);
  const [quickDestination, setQuickDestination] = useState('');
  const [quickOrigin, setQuickOrigin] = useState('');
  const [warningEscalationStep, setWarningEscalationStep] = useState(0);

  const soundLoopRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Background Web Notification Trigger when opened
  useEffect(() => {
    if (!isOpen) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        let notifTitle = 'محفظة السائق: تذكير نشاط الميدان 🛵';
        let notifBody = `مضت ${Math.floor(minutesInactive / 60) || 1} ساعة دون تسجيل كسب. الميدان ينتظرك!`;
        if (currentStage === 2) {
          notifTitle = '⚠️ تحذير المستوى الثاني: مضت ساعتان!';
          notifBody = 'صوت التحذير يتصاعد.. افتح المحفظة وسجل كورسك للحفاظ على معدل دخلك.';
        } else if (currentStage === 3) {
          notifTitle = '🚨 نداء استغاثة وخطر: 3 ساعات دون دخل!';
          notifBody = 'الوقت ينفذ والهدف اليومي في خطر! سجل كورس الآن لإنقاذ اليوم.';
        }

        new Notification(notifTitle, {
          body: notifBody,
          icon: '/favicon.ico',
          tag: 'driver-inactivity-radar',
          requireInteraction: currentStage >= 2
        });
      } catch {
        // Ignore
      }
    }

    if ('vibrate' in navigator) {
      try {
        if (currentStage === 1) {
          navigator.vibrate([200, 100, 200]);
        } else if (currentStage === 2) {
          navigator.vibrate([300, 100, 300, 100, 400]);
        } else {
          navigator.vibrate([500, 150, 500, 150, 500, 150, 800]);
        }
      } catch {
        // Ignore
      }
    }
  }, [isOpen, currentStage, minutesInactive]);

  // Audio and Countdown Lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopContinuousSounds();
      if (soundLoopRef.current) clearInterval(soundLoopRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    setCountdown(10);
    setWarningEscalationStep(0);

    if (currentStage === 1) {
      // Stage 1: 10s countdown & gentle reminder ring
      playDispatchMotivationHorn();
      setTimeout(() => {
        playStage1NormalReminder();
      }, 350);

      let remaining = 10;
      setCountdown(remaining);
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          onCloseRef.current();
        }
      }, 1000);
    } else if (currentStage === 2) {
      // Stage 2: Escalating sound getting louder & higher pitch
      let step = 0;
      playStage2EscalatingWarning(step);

      soundLoopRef.current = setInterval(() => {
        step = Math.min(step + 1, 5);
        setWarningEscalationStep(step);
        playStage2EscalatingWarning(step);
      }, 2500);
    } else if (currentStage === 3) {
      // Stage 3: Danger emergency SOS siren
      playStage3EmergencySOS();

      soundLoopRef.current = setInterval(() => {
        playStage3EmergencySOS();
      }, 1800);
    }

    return () => {
      stopContinuousSounds();
      if (soundLoopRef.current) clearInterval(soundLoopRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isOpen, currentStage]);

  if (!isOpen) return null;

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopContinuousSounds();
    if (soundLoopRef.current) clearInterval(soundLoopRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    onRecordNow({
      fromLocation: quickOrigin.trim() || undefined,
      toLocation: quickDestination.trim() || undefined,
      title: quickOrigin && quickDestination ? `${quickOrigin} ➔ ${quickDestination}` : quickDestination || undefined
    });
  };

  const handleDismiss = () => {
    stopContinuousSounds();
    if (soundLoopRef.current) clearInterval(soundLoopRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    onClose();
  };

  const handleSnooze = (mins: number) => {
    stopContinuousSounds();
    if (soundLoopRef.current) clearInterval(soundLoopRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    onSnooze(mins);
  };

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md select-none font-['Cairo',sans-serif] transition-colors duration-500 ${
        currentStage === 3
          ? 'bg-rose-950/90 animate-pulse'
          : currentStage === 2
          ? 'bg-amber-950/85'
          : 'bg-black/80'
      }`}
    >
      <div
        className={`relative max-w-md w-full rounded-[2.8rem] p-6 text-white text-center shadow-2xl overflow-hidden border-4 transition-all duration-500 ${
          currentStage === 3
            ? 'bg-gradient-to-b from-rose-950 via-red-900 to-slate-950 border-rose-500 shadow-rose-600/50 animate-bounce-short'
            : currentStage === 2
            ? 'bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950 border-amber-500 shadow-amber-500/40'
            : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-emerald-500 shadow-emerald-500/30'
        }`}
      >
        {/* Top Emergency Strobe Animation for Stage 3 */}
        {currentStage === 3 && (
          <div className="absolute top-0 right-0 left-0 h-3 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600 animate-ping opacity-90" />
        )}

        {/* Stage Indicator Badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md ${
              currentStage === 3
                ? 'bg-rose-600 text-white border-white animate-pulse'
                : currentStage === 2
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
            <span>
              {currentStage === 3
                ? '🚨 المرحلة الثالثة: خطر ونداء استغاثة'
                : currentStage === 2
                ? '⚠️ المرحلة الثانية: تحذير متصاعد'
                : '🔔 المرحلة الأولى: تذكير عادي'}
            </span>
          </div>
        </div>

        {/* Dynamic Center Stage Icon */}
        <div className="relative w-24 h-24 mx-auto my-2 flex items-center justify-center">
          {currentStage === 3 ? (
            <div className="relative">
              <div className="absolute -inset-4 bg-rose-600/40 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-rose-600 to-red-500 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 border-white animate-pulse">
                🆘
              </div>
            </div>
          ) : currentStage === 2 ? (
            <div className="relative">
              <div className="absolute -inset-3 bg-amber-500/30 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-amber-600 to-yellow-500 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 border-amber-200">
                ⚠️
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute -inset-2 bg-emerald-500/30 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 border-white">
                🛵
              </div>
            </div>
          )}
        </div>

        {/* Stage Title and Elapsed Inactivity Status */}
        <h3
          className={`text-xl font-black mt-1 leading-tight ${
            currentStage === 3 ? 'text-rose-200' : currentStage === 2 ? 'text-yellow-300' : 'text-emerald-300'
          }`}
        >
          {currentStage === 3
            ? 'الخطر الأكبر: الوقت ينفذ والهدف في خطر!'
            : currentStage === 2
            ? 'مضت ساعتان دون عمل! الصوت يتصاعد لتنبيهك'
            : 'تذكير نشاط الميدان: ابدأ مكوراً جديداً'}
        </h3>

        <div className="inline-flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl text-xs font-bold text-gray-200 mt-2 mb-3 border border-white/10">
          <span>⏱️ مضت</span>
          <span className="text-yellow-400 font-black font-mono">
            {minutesInactive >= 60
              ? `${Math.floor(minutesInactive / 60)} ساعة و ${minutesInactive % 60} دقيقة`
              : `${minutesInactive} دقيقة`}
          </span>
          <span>بدون تسجيل كسب</span>
        </div>

        {/* Sound Intensity Meter for Stage 2 */}
        {currentStage === 2 && (
          <div className="bg-amber-950/70 border border-amber-500/40 rounded-2xl p-2.5 mb-3 flex items-center justify-between gap-2 px-4">
            <span className="text-xs font-black text-amber-200">مستوى شدة صوت التحذير:</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className={`w-3 h-5 rounded-sm transition-all duration-300 ${
                    lvl <= warningEscalationStep
                      ? 'bg-amber-400 shadow-sm shadow-amber-400'
                      : 'bg-stone-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stage 1: 10-Second Auto-dismiss Countdown Progress Bar */}
        {currentStage === 1 && (
          <div className="mb-3 bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-2.5 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <span>⏳</span>
              <span>يختفي تلقائياً خلال:</span>
            </div>
            <span className="font-mono font-black bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-500/50">
              {countdown} ثوانٍ
            </span>
          </div>
        )}

        {/* Quick Search & Course Input Box Prompt */}
        <form onSubmit={handleQuickSubmit} className="bg-black/30 border border-white/10 rounded-2xl p-3 mb-4 text-right">
          <label className="block text-[11px] font-black text-gray-300 mb-1.5">
            🔍 خانة بحث وتحديد الوجهة السريعة للإنطلاق:
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="من أين (مثال: كارفور)..."
              value={quickOrigin}
              onChange={(e) => setQuickOrigin(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-gray-500 text-right outline-none focus:border-yellow-400"
            />
            <input
              type="text"
              placeholder="إلى أين (الوجهة)..."
              value={quickDestination}
              onChange={(e) => setQuickDestination(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-gray-500 text-right outline-none focus:border-yellow-400"
            />
          </div>
          <p className="text-[10px] font-bold text-gray-400">
            * اكتب وجهة الكورس مباشرة واضغط الزر بالأسفل لإدخال المبلغ فوراً.
          </p>
        </form>

        {/* Main Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleQuickSubmit()}
            className={`w-full font-black py-3.5 rounded-2xl text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
              currentStage === 3
                ? 'bg-gradient-to-r from-red-500 via-rose-500 to-yellow-400 hover:from-red-400 text-slate-950 shadow-rose-600/50'
                : currentStage === 2
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 shadow-amber-500/40'
                : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 text-slate-950 shadow-emerald-500/40'
            }`}
          >
            <span className="text-xl">🚕</span>
            <span>
              {currentStage === 3 ? 'إنقاذ اليوم وإدخال كورس الآن! 🚨' : 'تسجيل كورس وإدخال الكسب فوراً'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSnooze(15)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-gray-300 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <span>☕</span>
              <span>استراحة (15 دقيقة)</span>
            </button>

            <button
              onClick={handleDismiss}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-gray-400 hover:text-white font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              إغلاق التنبيه ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
