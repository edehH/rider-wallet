import React, { useEffect, useRef } from 'react';

export interface OperationFeedback {
  id: string;
  type: 'earning' | 'expense' | 'vault_deposit' | 'vault_withdraw' | 'settlement' | 'delete' | 'goal' | 'info';
  title: string;
  subtitle?: string;
  amount?: number;
  icon: string;
}

interface OperationToastProps {
  feedback?: OperationFeedback | null;
  toast?: OperationFeedback | null;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const OperationToast: React.FC<OperationToastProps> = ({ feedback, toast, onDismiss, onClose }) => {
  const activeItem = toast || feedback;
  const dismissCallback = onClose || onDismiss;
  const dismissRef = useRef(dismissCallback);
  dismissRef.current = dismissCallback;

  useEffect(() => {
    if (!activeItem) return;
    const timer = setTimeout(() => {
      dismissRef.current?.();
    }, 3800);
    return () => clearTimeout(timer);
  }, [activeItem?.id]);

  if (!activeItem) return null;

  const getStyle = () => {
    switch (activeItem.type) {
      case 'earning':
        return {
          bg: 'from-emerald-600 via-emerald-700 to-teal-800',
          border: 'border-emerald-300',
          shadow: 'shadow-emerald-500/30',
          badge: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/40',
          tag: 'كسب جديد مقبوض 💸'
        };
      case 'expense':
        return {
          bg: 'from-rose-600 via-rose-700 to-red-900',
          border: 'border-rose-300',
          shadow: 'shadow-rose-500/30',
          badge: 'bg-rose-400/20 text-rose-100 border-rose-300/40',
          tag: 'خصم مستلزمات / مصاريف 📉'
        };
      case 'vault_deposit':
        return {
          bg: 'from-amber-600 via-yellow-600 to-amber-800',
          border: 'border-yellow-300',
          shadow: 'shadow-yellow-500/40',
          badge: 'bg-yellow-400/20 text-yellow-100 border-yellow-300/40',
          tag: 'إيداع ادخار في الخزنة 🏦'
        };
      case 'vault_withdraw':
        return {
          bg: 'from-purple-700 via-indigo-800 to-slate-900',
          border: 'border-purple-300',
          shadow: 'shadow-purple-500/30',
          badge: 'bg-purple-400/20 text-purple-100 border-purple-300/40',
          tag: 'سحب من الخزنة 🔓'
        };
      case 'settlement':
        return {
          bg: 'from-blue-600 via-cyan-700 to-blue-900',
          border: 'border-cyan-300',
          shadow: 'shadow-cyan-500/30',
          badge: 'bg-cyan-400/20 text-cyan-100 border-cyan-300/40',
          tag: 'تصفية وترحيل الأرباح ⚡'
        };
      case 'delete':
        return {
          bg: 'from-slate-700 via-slate-800 to-slate-900',
          border: 'border-slate-400',
          shadow: 'shadow-slate-500/30',
          badge: 'bg-slate-500/30 text-gray-200 border-slate-400/30',
          tag: 'حذف وتراجع 🗑️'
        };
      default:
        return {
          bg: 'from-blue-600 to-indigo-800',
          border: 'border-blue-300',
          shadow: 'shadow-blue-500/30',
          badge: 'bg-white/20 text-white border-white/30',
          tag: 'تحديث'
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed top-4 left-4 right-4 z-[999] max-w-md mx-auto pointer-events-auto transition-all animate-bounce">
      <div
        onClick={() => dismissRef.current?.()}
        className={`bg-gradient-to-r ${style.bg} border-2 ${style.border} text-white p-3.5 rounded-3xl shadow-2xl ${style.shadow} cursor-pointer flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
            {activeItem.icon}
          </div>

          {/* Texts */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${style.badge}`}>
                {style.tag}
              </span>
              {activeItem.amount !== undefined && (
                <span className="text-sm font-black font-mono text-yellow-300" dir="ltr">
                  {activeItem.type === 'expense' || activeItem.type === 'vault_withdraw' ? '-' : '+'}
                  {activeItem.amount.toLocaleString()} أوقية
                </span>
              )}
            </div>
            <h4 className="text-sm font-black text-white mt-0.5 leading-snug">
              {activeItem.title}
            </h4>
            {activeItem.subtitle && (
              <p className="text-[11px] text-white/80 font-bold">
                {activeItem.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Close hint */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dismissRef.current?.();
          }}
          className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 text-white/80"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
