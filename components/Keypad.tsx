
import React, { useState } from 'react';

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
}

const QUICK_ROUTES = [
  { from: 'تفرغ زينة', to: 'لكصر', title: 'تفرغ زينة ➔ لكصر' },
  { from: 'كابيتال', to: 'المطار', title: 'كابيتال ➔ المطار' },
  { from: 'عرفات', to: 'تيارت', title: 'عرفات ➔ تيارت' },
  { from: 'تنسويلم', to: 'السبخة', title: 'تنسويلم ➔ السبخة' },
  { from: 'المتجر', to: 'الزبون', title: '📦 توصيل طرد' },
];

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
}) => {
  const [showAdvancedCourse, setShowAdvancedCourse] = useState(false);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-t-[2.5rem] shadow-2xl fixed bottom-0 left-0 right-0 z-50 border-t-8 border-gray-100 max-h-[92vh] overflow-y-auto font-['Cairo',sans-serif]">
      <div className="flex justify-between items-center mb-3 px-2">
        <button
          onClick={onCancel}
          className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-xl font-bold text-sm active:bg-gray-200"
        >
          إلغاء ✕
        </button>
        <h3 className="text-lg sm:text-xl font-black text-gray-800 flex items-center gap-2">
          <span>{title}</span>
          {isCourseInput && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">🚖 مكور</span>}
        </h3>
      </div>

      {/* Course Specific Metadata Inputs (Title / Sender / Destination / Duplicate Prevention) */}
      {isCourseInput && (
        <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <span>📍 تفاصيل وتسمية المكور</span>
              <span className="text-[10px] text-slate-400 font-bold">(لتجنب التكرار المزدوج)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAdvancedCourse(!showAdvancedCourse)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60"
            >
              {showAdvancedCourse ? 'إخفاء التفاصيل ▲' : 'إضافة عنوان/مسار ▼'}
            </button>
          </div>

          {/* Duplicate Warning Badge */}
          {isDuplicateCourse && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-2 animate-pulse">
              <span>⚠️</span>
              <span>تنبيه: تم تسجيل مكور بنفس الاسم أو الوجهة اليوم! تأكد لتفادي التكرار المزدوج.</span>
            </div>
          )}

          {/* Quick Route Preset Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_ROUTES.map((route, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCourseTitle?.(route.title);
                  setFromLocation?.(route.from);
                  setToLocation?.(route.to);
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap border transition-all active:scale-95 ${
                  courseTitle === route.title
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {route.title}
              </button>
            ))}
          </div>

          {/* Expandable Manual Inputs */}
          {showAdvancedCourse && (
            <div className="space-y-2 pt-1 border-t border-slate-200/60">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">اسم أو عنوان المكور / الكورس:</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle?.(e.target.value)}
                  placeholder="مثلاً: مشوار زبون خاص أو توصيل طلبية"
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">من أين (المرسل / الانطلاق):</label>
                  <input
                    type="text"
                    value={fromLocation}
                    onChange={(e) => setFromLocation?.(e.target.value)}
                    placeholder="مثلاً: تفرغ زينة أو اسم المحل"
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-right"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">إلى أين (الوجهة):</label>
                  <input
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation?.(e.target.value)}
                    placeholder="مثلاً: لكصر أو اسم العميل"
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-right"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Amount Display */}
      <div className="text-center mb-4">
        <div className="text-4xl sm:text-5xl font-black text-blue-700 bg-blue-50 py-3 sm:py-4 rounded-2xl tracking-tighter shadow-inner">
          {value || '0'} <span className="text-sm font-bold text-blue-400">أوقية</span>
        </div>
      </div>

      {/* Numerical Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'C') onClear();
              else if (key === '✓') onConfirm();
              else onInput(key);
            }}
            className={`
              h-16 sm:h-20 flex items-center justify-center text-2xl sm:text-3xl font-black rounded-2xl active:scale-95 transition-all
              ${
                key === 'C'
                  ? 'bg-orange-100 text-orange-600 border-b-4 border-orange-200'
                  : key === '✓'
                  ? 'bg-green-600 text-white border-b-4 border-green-800 shadow-lg shadow-green-600/30'
                  : 'bg-gray-100 text-gray-900 border-b-4 border-gray-300'
              }
            `}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Keypad;

