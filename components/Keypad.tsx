
import React from 'react';
import { playKeypadBeep, playUndoSound } from '../services/soundEffects';

interface KeypadProps {
  onInput: (val: string) => void;
  onClear: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  value: string;
  isCourseInput?: boolean;
  isPercentageInput?: boolean;
  pendingAmount?: number;
  courseTitle?: string;
  setCourseTitle?: (val: string) => void;
  fromLocation?: string;
  setFromLocation?: (val: string) => void;
  toLocation?: string;
  setToLocation?: (val: string) => void;
  clientName?: string;
  setClientName?: (val: string) => void;
  clientPhone?: string;
  setClientPhone?: (val: string) => void;
  isDuplicateCourse?: boolean;
  isPaid?: boolean;
  setIsPaid?: (val: boolean) => void;
  showMissingClientError?: boolean;
}

const Keypad: React.FC<KeypadProps> = ({
  onInput,
  onClear,
  onConfirm,
  onCancel,
  title,
  value,
  isCourseInput = false,
  isPercentageInput = false,
  pendingAmount,
  courseTitle = '',
  setCourseTitle,
  fromLocation = '',
  setFromLocation,
  toLocation = '',
  setToLocation,
  clientName = '',
  setClientName,
  clientPhone = '',
  setClientPhone,
  isDuplicateCourse = false,
  isPaid = false,
  setIsPaid,
  showMissingClientError = false,
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

  const handleKeyClick = (key: string) => {
    playKeypadBeep(key);
    if (key === 'C') {
      onClear();
    } else if (key === '✓') {
      onConfirm();
    } else {
      onInput(key);
    }
  };

  const handleCancelClick = () => {
    playUndoSound();
    onCancel();
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-t-[2.5rem] shadow-2xl fixed bottom-0 left-0 right-0 z-50 border-t-8 border-gray-100 max-h-[92vh] overflow-y-auto font-['Cairo',sans-serif]">
      <div className="flex justify-between items-center mb-3 px-2">
        <button
          onClick={handleCancelClick}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer"
        >
          إلغاء ✕
        </button>
        <h3 className="text-lg sm:text-xl font-black text-gray-800 flex items-center gap-2">
          <span>{title}</span>
          {isCourseInput && <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg font-bold">💰 مكسب</span>}
          {isPercentageInput && <span className="text-xs bg-red-100 text-red-800 px-2.5 py-0.5 rounded-lg font-bold">🔑 الخصم</span>}
        </h3>
      </div>

      {/* Free-form text fields for Course */}
      {isCourseInput && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
          {/* Payment Status Selector (Unpaid by default, manual 1-click switch to Paid) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>حالة استلام الحساب:</span>
                {!isPaid ? (
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-md">
                    غير مدفوعة (افتراضي) ⏳
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-2 py-0.5 rounded-md">
                    تم الدفع نقداً ✅
                  </span>
                )}
              </span>
            </div>

            {/* 2-Option Segmented Control */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaid?.(false)}
                className={`py-2 px-2.5 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  !isPaid
                    ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>⏳ غير مدفوعة (دين)</span>
                {!isPaid && <span className="text-xs">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setIsPaid?.(true)}
                className={`py-2 px-2.5 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isPaid
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>✅ تم الدفع نقداً</span>
                {isPaid && <span className="text-xs">✓</span>}
              </button>
            </div>
          </div>

          {/* Missing Client Mandatory Error Alert */}
          {showMissingClientError && !isPaid && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-bold space-y-2 shadow-xs">
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <p className="font-black text-rose-900">الرحلة مسجلة كـ "غير مدفوعة (دين)"</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    المبلغ ({value || '0'} أوقية) محفوظ. اكتب اسم الزبون أدناه واضغط <strong>(✓)</strong> للمتابعة فوراً:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPaid?.(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  ✅ تحويل لـ "تم الدفع نقداً" وتخطي
                </button>
                <button
                  type="button"
                  onClick={() => setClientName?.('زبون عابر')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  ⚡ تسجيل كـ "زبون عابر"
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Notice */}
          {isDuplicateCourse && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-2">
              <span>⚠️</span>
              <span>تنبيه: تم تسجيل هذه الرحلة سابقاً اليوم.</span>
            </div>
          )}

          {/* Client / Shop Name */}
          <div className={`bg-white p-3 rounded-xl border-2 transition-all shadow-2xs space-y-2 ${
            !isPaid ? 'border-amber-300/80 bg-amber-50/20' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>👤</span>
                <span>اسم الزبون / المحل:</span>
              </label>
            </div>
            
            <div>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
                placeholder={isPaid ? 'اسم الزبون أو المحل (اختياري)...' : 'اسم الزبون أو المحل (مثلاً: أحمد، صيدلية النور)...'}
                className={`w-full text-xs font-bold p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-right transition-all ${
                  showMissingClientError && !isPaid && !clientName.trim()
                    ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                }`}
                autoFocus={showMissingClientError && !isPaid}
              />
            </div>
          </div>
        </div>
      )}

      {/* Amount or Deduction Display */}
      <div className="text-center mb-4">
        {isPercentageInput && pendingAmount !== undefined && (
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-500">مبلغ المكسب:</span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg font-mono dir-ltr">
              {pendingAmount.toLocaleString()} أوقية
            </span>
          </div>
        )}
        <div className={`text-4xl sm:text-5xl font-black py-3 sm:py-4 rounded-2xl tracking-tighter shadow-inner flex items-center justify-center gap-2 ${
          isPercentageInput ? 'text-red-700 bg-red-50' : 'text-blue-700 bg-blue-50'
        }`} dir="ltr">
          <span className="font-mono">{value || '0'}</span>
          <span className={`text-sm font-bold font-sans ${isPercentageInput ? 'text-red-500' : 'text-blue-400'}`} dir="rtl">
            أوقية
          </span>
        </div>
        {isPercentageInput && (
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            اكتب المبلغ الذي تريد خصمه (مثلاً 20 أو 15 أو 0 إن لم يكن هناك خصم) ثم اضغط ✓
          </p>
        )}
      </div>

      {/* Numerical Keypad Grid (Standard LTR: 1 top-left, 3 top-right, Delete bottom-left, Confirm bottom-right) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4" dir="ltr">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => handleKeyClick(key)}
            className={`
              h-16 sm:h-20 flex items-center justify-center text-2xl sm:text-3xl font-black rounded-2xl active:scale-95 transition-all
              ${
                key === 'C'
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-b-4 border-rose-300 shadow-xs'
                  : key === '✓'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-b-4 border-emerald-800 shadow-lg shadow-emerald-600/30'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-b-4 border-gray-300 shadow-xs'
              }
            `}
          >
            {key === 'C' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Keypad;

