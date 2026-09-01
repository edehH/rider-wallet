
import React, { useState } from 'react';
import { playKeypadBeep, playUndoSound } from '../services/soundEffects';

interface KeypadProps {
  onInput: (val: string) => void;
  onClear: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  value: string;
  isCourseInput?: boolean;
  courseTitle?: string;
  setCourseTitle?: (val: string) => void;
  fromLocation?: string;
  setFromLocation?: (val: string) => void;
  toLocation?: string;
  setToLocation?: (val: string) => void;
  isDuplicateCourse?: boolean;
  isPaid?: boolean;
  setIsPaid?: (val: boolean) => void;
}

const Keypad: React.FC<KeypadProps> = ({
  onInput,
  onClear,
  onConfirm,
  onCancel,
  title,
  value,
  isCourseInput = false,
  courseTitle = '',
  setCourseTitle,
  fromLocation = '',
  setFromLocation,
  toLocation = '',
  setToLocation,
  isDuplicateCourse = false,
  isPaid = false,
  setIsPaid,
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
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          إلغاء ✕
        </button>
        <h3 className="text-lg sm:text-xl font-black text-gray-800 flex items-center gap-2">
          <span>{title}</span>
          {isCourseInput && <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg font-bold">🚖 مكور</span>}
        </h3>
      </div>

      {/* Free-form text fields: No default presets, free typing */}
      {isCourseInput && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
          {/* Duplicate Notice */}
          {isDuplicateCourse && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-2">
              <span>⚠️</span>
              <span>تنبيه: تم تسجيل هذا الاسم أو المشوار سابقاً اليوم.</span>
            </div>
          )}

          {/* Direct Title Input Field */}
          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">
              عنوان الرسالة / اسم المكور (اكتب أي اسم بحرية):
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle?.(e.target.value)}
              placeholder="اكتب هنا عنوان أو اسم المكور..."
              className="w-full text-sm font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-right transition-all"
            />
          </div>

          {/* Sender and Destination Inputs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                اسم المرسل / من أين:
              </label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation?.(e.target.value)}
                placeholder="من أين..."
                className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-right transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                إلى أين (الوجهة):
              </label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation?.(e.target.value)}
                placeholder="إلى أين..."
                className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-right transition-all"
              />
            </div>
          </div>

          {/* Payment Status (Default: Unpaid, with 1-click toggle for pre-paid deliveries) */}
          <div className="pt-1">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs">
              <div className="pr-1">
                <span className="text-xs font-black text-slate-800 block">حالة استلام الحساب:</span>
                <span className="text-[11px] font-bold text-slate-500">
                  {isPaid ? 'تم الدفع مسبقاً (مسدد) ✅' : 'تلقائياً: غير مدفوعة (متبقية) ⏳'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaid?.(!isPaid)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer select-none ${
                  isPaid
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                }`}
              >
                <span>{isPaid ? 'تم الدفع مسبقاً ✅' : 'غير مدفوعة ⏳'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amount Display */}
      <div className="text-center mb-4">
        <div className="text-4xl sm:text-5xl font-black text-blue-700 bg-blue-50 py-3 sm:py-4 rounded-2xl tracking-tighter shadow-inner flex items-center justify-center gap-2" dir="ltr">
          <span className="font-mono">{value || '0'}</span>
          <span className="text-sm font-bold text-blue-400 font-sans" dir="rtl">أوقية</span>
        </div>
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

