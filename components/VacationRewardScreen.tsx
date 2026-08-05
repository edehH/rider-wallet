import React, { useState } from 'react';
import { AppData, VaultEntry } from '../types';

interface VacationRewardScreenProps {
  data: AppData;
  isTestMode?: boolean;
  onCloseTestMode?: () => void;
  onWithdrawVacationExpense: (amount: number) => void;
}

export const VacationRewardScreen: React.FC<VacationRewardScreenProps> = ({
  data,
  isTestMode = false,
  onCloseTestMode,
  onWithdrawVacationExpense
}) => {
  const fund = data.vacationFund || {
    targetAmount: 2000,
    savedAmount: 2000,
    restDay: 5,
    spendingBudget: 1500,
    enabled: true
  };

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  const handleConfirmWithdraw = () => {
    const num = parseInt(withdrawAmount) || 0;
    if (num <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للسحب');
      return;
    }
    onWithdrawVacationExpense(num);
    setWithdrawSuccessMsg(`تم سحب ${num.toLocaleString()} أوقية بنجاح لمصروف العطلة! 🎉`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');

    setTimeout(() => {
      setWithdrawSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-900 via-green-950 to-slate-950 z-[200] flex flex-col p-4 overflow-y-auto select-none">
      
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="bg-amber-400 text-amber-950 p-3 rounded-2xl font-black text-xs flex justify-between items-center mb-4 shadow-lg border-2 border-amber-300 animate-bounce">
          <span className="flex items-center gap-2">
            <span>🧪</span>
            <span>وضع المعاينة والاختبار التجريبي لشاشة يوم الراحة والمكافأة</span>
          </span>
          <button
            onClick={onCloseTestMode}
            className="bg-amber-950 text-amber-100 px-3 py-1 rounded-xl text-xs hover:bg-black transition-colors"
          >
            إنهاء المعاينة ✕
          </button>
        </div>
      )}

      {/* Main Celebratory Container */}
      <div className="max-w-md w-full mx-auto my-auto flex flex-col items-center text-center space-y-6 py-6">
        
        {/* Glowing Checkmark Badge */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 border-4 border-emerald-200 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(16,185,129,0.5)] z-10 relative">
            ✅
          </div>
        </div>

        {/* Title & Banner */}
        <div className="space-y-2">
          <span className="bg-emerald-500/20 text-emerald-300 font-black px-4 py-1.5 rounded-full text-xs border border-emerald-500/30 tracking-wide uppercase inline-block">
            🎉 تم تحقيق هدف صندوق العطلة
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            اليوم يوم راحة ومكافأة! 🌴
          </h1>
          <p className="text-emerald-200/90 text-sm font-bold max-w-xs mx-auto leading-relaxed">
            تهانينا! لقد حققت شرط الادخار المطلوب ({fund.targetAmount.toLocaleString()} أوقية). العمل مقفل اليوم لكي تستريح وتكافئ نفسك!
          </p>
        </div>

        {/* Status Lock Warning */}
        <div className="w-full bg-emerald-950/60 border-2 border-emerald-500/40 rounded-3xl p-4 text-emerald-300 font-black text-xs flex items-center gap-3 text-right shadow-inner">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
            🚫
          </div>
          <div>
            <p className="text-white font-black text-sm">إدخال العمليات مقفل تلقائياً</p>
            <p className="text-[11px] text-emerald-400/80 font-bold">
              لا يمكن إدخال رحلات أو الوقود اليوم. المسموح فقط هو سحب مصروف العطلة!
            </p>
          </div>
        </div>

        {/* Funds Summary Card */}
        <div className="w-full bg-gradient-to-br from-emerald-900/80 to-teal-950/90 border-2 border-emerald-500/50 rounded-[2.5rem] p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-emerald-700/50 pb-4">
            <span className="text-xs font-black text-emerald-300">الرصيد المجمع للعطلة:</span>
            <span className="text-2xl font-black text-white">
              {fund.savedAmount.toLocaleString()} <span className="text-xs font-bold text-emerald-400">أوقية</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-emerald-300">ميزانية الإنفاق المحددة:</span>
            <span className="text-lg font-black text-emerald-200">
              {fund.spendingBudget.toLocaleString()} <span className="text-xs font-bold text-emerald-400">أوقية</span>
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {withdrawSuccessMsg && (
          <div className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-sm shadow-xl border-2 border-emerald-300 animate-fadeIn text-center">
            {withdrawSuccessMsg}
          </div>
        )}

        {/* Withdrawal Action Button (Withdrawal ONLY) */}
        <div className="w-full space-y-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white p-5 rounded-3xl font-black text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] active:scale-95 transition-all border-b-8 border-emerald-800 flex items-center justify-center gap-3"
          >
            <span>سحب مصروف العطلة 💸</span>
          </button>

          {isTestMode ? (
            <button
              onClick={onCloseTestMode}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-2xl font-black text-sm border-2 border-slate-700 transition-all"
            >
              العودة من وضع التجربة المعاينة ✕
            </button>
          ) : (
            <p className="text-[11px] font-bold text-emerald-400/60">
              تطبيق محفظة السائق - يوم الاستجمام والمكافأة الأسبوعية
            </p>
          )}
        </div>

      </div>

      {/* Withdraw Modal inside Reward Screen */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-emerald-500/50 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-right">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white">سحب من صندوق العطلة 💸</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 font-black text-xl hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-black text-emerald-300 mb-2">
                أدخل المبلغ المراد سحبه لمصروف الإجازة:
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="أدخل المبلغ هنا..."
                className="w-full p-4 bg-slate-950 border-2 border-emerald-600/50 rounded-2xl text-2xl font-black text-white text-center focus:outline-none focus:border-emerald-400"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmWithdraw}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl font-black text-base border-b-4 border-emerald-800 active:scale-95 transition-all"
              >
                تأكيد السحب 💵
              </button>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-2xl font-black text-base"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
