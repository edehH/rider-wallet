import React, { useState } from 'react';
import { AppData, VacationFund } from '../types';
import { Icons } from '../constants';

interface VacationModalProps {
  data: AppData;
  onUpdateVacationFund: (fund: VacationFund) => void;
  onClose: () => void;
  onTestRewardScreen: () => void;
}

const DAYS_OF_WEEK = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

export const VacationFundModal: React.FC<VacationModalProps> = ({
  data,
  onUpdateVacationFund,
  onClose,
  onTestRewardScreen
}) => {
  const currentFund = data.vacationFund || {
    targetAmount: 2000,
    savedAmount: 0,
    restDay: 5,
    spendingBudget: 1500,
    enabled: true
  };

  const [targetAmount, setTargetAmount] = useState(currentFund.targetAmount.toString());
  const [restDay, setRestDay] = useState(currentFund.restDay);
  const [spendingBudget, setSpendingBudget] = useState(currentFund.spendingBudget.toString());
  const [enabled, setEnabled] = useState(currentFund.enabled);

  const isFundReady = currentFund.savedAmount >= currentFund.targetAmount && currentFund.enabled;
  const progressPct = Math.min(
    (currentFund.savedAmount / Math.max(currentFund.targetAmount, 1)) * 100,
    100
  );

  const handleSave = () => {
    const parsedTarget = Math.max(parseInt(targetAmount) || 0, 100);
    const parsedBudget = Math.max(parseInt(spendingBudget) || 0, 0);

    onUpdateVacationFund({
      targetAmount: parsedTarget,
      savedAmount: currentFund.savedAmount,
      restDay: restDay,
      spendingBudget: parsedBudget,
      enabled: enabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] border-4 border-emerald-100 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl shadow-sm">
              🏖️
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">صندوق العطلة والراحة</h2>
              <p className="text-xs font-bold text-emerald-600">نظام المكافأة الأسبوعية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-lg flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Progress Banner */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-3xl p-5 text-white mb-6 border-2 border-emerald-700/50 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase block mb-1">
                المدخرات التراكمية الحالية
              </span>
              <span className="text-3xl font-black tracking-tight text-white">
                {currentFund.savedAmount.toLocaleString()}{' '}
                <span className="text-xs font-bold text-emerald-400">/ {currentFund.targetAmount.toLocaleString()} أوقية</span>
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xl font-black px-3 py-1 rounded-xl border ${
                isFundReady 
                  ? 'bg-emerald-500 text-white border-emerald-300 animate-pulse' 
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}>
                {Math.round(progressPct)}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-emerald-950/80 rounded-full h-4 p-0.5 border border-emerald-700/40 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500 shadow-inner"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-emerald-200/80">
            <span>يوم الراحة المعتمد: {DAYS_OF_WEEK[currentFund.restDay]}</span>
            <span>ميزانية الإنفاق: {currentFund.spendingBudget.toLocaleString()} أوقية</span>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4 mb-6">
          {/* Active Switch */}
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
            <div>
              <p className="font-black text-sm text-gray-800">تفعيل نظام العطلة والأقفال</p>
              <p className="text-[11px] font-bold text-gray-400">إغلاق التطبيق يوم الراحة عند اكتمال المبلغ</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${
                enabled ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              المبلغ التراكمي المطلوب للتجميع (أوقية):
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="مثال: 2000"
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors text-left"
              dir="ltr"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              يتم اقتطاع الفائض اليومي تلقائياً للوصول لهذا الهدف
            </p>
          </div>

          {/* Spending Budget */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              ميزانية المصروف المتاحة في يوم العطلة (أوقية):
            </label>
            <input
              type="number"
              value={spendingBudget}
              onChange={(e) => setSpendingBudget(e.target.value)}
              placeholder="مثال: 1500"
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors text-left"
              dir="ltr"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              المبلغ المسموح بسحبه وحضوره أثناء يوم الراحة
            </p>
          </div>

          {/* Rest Day Selection */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              يوم الراحة والأقفال المحدد:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((dayName, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRestDay(idx)}
                  className={`p-2.5 rounded-xl font-black text-xs border-2 transition-all ${
                    restDay === idx
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm scale-105'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {dayName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Testing Button */}
        <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 flex items-center justify-between">
          <div>
            <p className="font-black text-xs text-emerald-900">زر معاينة وتجربة الشاشة 🧪</p>
            <p className="text-[10px] text-emerald-700 font-bold">تجربة ظهور واجهة المكافأة الخضراء الآن</p>
          </div>
          <button
            onClick={() => {
              onClose();
              onTestRewardScreen();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs border-b-4 border-emerald-800 active:translate-y-0.5 transition-all shadow-md"
          >
            اختبار الشاشة 👁️
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-black text-base border-b-4 border-emerald-800 active:scale-95 transition-all shadow-md"
          >
            حفظ الإعدادات 💾
          </button>
          <button
            onClick={onClose}
            className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 p-4 rounded-2xl font-black text-base transition-all"
          >
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
};
