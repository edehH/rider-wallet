
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppData, DailyStats, Operation, Objective, OperationType, VaultEntry, VacationFund, SavingsPlan } from './types';
import { getInitialData, saveData, exportData, getWorkingDate, addOrUpdateVaultEntry } from './services/storage';
import { Icons, CURRENCY } from './constants';
import Keypad from './components/Keypad';
import TradingDashboard from './components/TradingDashboard';
import WeeklyAnalytics from './components/WeeklyAnalytics';
import { VacationFundModal } from './components/VacationFundModal';
import { VacationRewardScreen } from './components/VacationRewardScreen';
import { SavingsVaultModal } from './components/SavingsVaultModal';

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [activeInput, setActiveInput] = useState<{ 
    type: keyof DailyStats | 'pin' | 'goal' | 'monthlyGoal' | 'tempEarnings' | 'editOperation' | 'newObjectiveAmount' | 'payObjective' | 'withdrawVault' | 'depositVault' | 'editObjectiveAmount', 
    title: string,
    operationId?: string,
    objectiveId?: string
  } | null>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [objectiveTitle, setObjectiveTitle] = useState('');
  
  const [showVault, setShowVault] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOpsList, setShowOpsList] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showTrading, setShowTrading] = useState(false);
  const [showWeeklyAnalytics, setShowWeeklyAnalytics] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [testVacationReward, setTestVacationReward] = useState(false);
  
  const [tempEarningsValue, setTempEarningsValue] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  useEffect(() => {
    setData(getInitialData());
  }, []);

  const isDuplicateCourse = useMemo(() => {
    if (!data || !activeInput || activeInput.type !== 'tempEarnings') return false;
    const currentOps = data.currentDay.operations || [];
    const normalizedTitle = courseTitle.trim().toLowerCase();
    const normalizedFrom = fromLocation.trim().toLowerCase();
    const normalizedTo = toLocation.trim().toLowerCase();

    if (!normalizedTitle && !normalizedFrom && !normalizedTo) return false;

    return currentOps.some(op => {
      if (op.type !== 'earnings') return false;
      if (normalizedTitle && op.courseTitle && op.courseTitle.trim().toLowerCase() === normalizedTitle) return true;
      if (normalizedTitle && op.label && op.label.trim().toLowerCase().includes(normalizedTitle)) return true;
      if (normalizedFrom && normalizedTo && op.fromLocation && op.toLocation) {
        if (op.fromLocation.trim().toLowerCase() === normalizedFrom && op.toLocation.trim().toLowerCase() === normalizedTo) return true;
      }
      return false;
    });
  }, [data, activeInput, courseTitle, fromLocation, toLocation]);

  const handleUpdateValue = useCallback(() => {
    if (!data || !activeInput) return;
    
    const numValue = parseInt(inputValue) || 0;
    const newData = { ...data };

    if (activeInput.type === 'pin') {
       if (inputValue === data.settings.vaultPin) {
         setVaultUnlocked(true);
         setActiveInput(null);
         setInputValue('');
       } else {
         alert('رمز PIN غير صحيح');
         setInputValue('');
       }
       return;
    }

    if (activeInput.type === 'goal') {
      newData.settings.dailyGoal = numValue;
      newData.currentDay.goal = numValue;
    } else if (activeInput.type === 'monthlyGoal') {
      newData.settings.monthlyGoal = numValue;
    } else if (activeInput.type === 'withdrawVault') {
      const todayDate = newData.currentDay.date || getWorkingDate();
      newData.vault = addOrUpdateVaultEntry(
        newData.vault,
        todayDate,
        -numValue,
        'سحب يدوي من الخزنة'
      );
    } else if (activeInput.type === 'depositVault') {
      const todayDate = newData.currentDay.date || getWorkingDate();
      newData.vault = addOrUpdateVaultEntry(
        newData.vault,
        todayDate,
        numValue,
        'إيداع ادخار مباشر في الخزنة 💰'
      );
    } else if (activeInput.type === 'tempEarnings') {
      setTempEarningsValue(numValue);
      setInputValue('');
      setActiveInput({ type: 'ownerShare', title: 'خصم نسبة المالك من هذا الكسب' });
      return;
    } else if (activeInput.type === 'ownerShare' && tempEarningsValue !== null) {
      newData.currentDay.earnings += tempEarningsValue;
      newData.currentDay.ownerShare += numValue;
      
      const courseCount = newData.currentDay.operations.filter(o => o.type === 'earnings').length + 1;
      const finalCourseTitle = courseTitle.trim() || (fromLocation.trim() && toLocation.trim() ? `${fromLocation.trim()} ➔ ${toLocation.trim()}` : `مكور #${courseCount}`);
      const finalLabel = `كسب (${finalCourseTitle})`;

      const newOpE: Operation = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'earnings',
        amount: tempEarningsValue,
        label: finalLabel,
        courseTitle: finalCourseTitle,
        fromLocation: fromLocation.trim() || undefined,
        toLocation: toLocation.trim() || undefined,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      const newOpS: Operation = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ownerShare',
        amount: numValue,
        label: `نسبة المالك (${finalCourseTitle})`,
        courseTitle: finalCourseTitle,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      newData.currentDay.operations.push(newOpE, newOpS);
      setTempEarningsValue(null);
      setCourseTitle('');
      setFromLocation('');
      setToLocation('');
    } else if (activeInput.type === 'editOperation' && activeInput.operationId) {
      const opIndex = newData.currentDay.operations.findIndex(o => o.id === activeInput.operationId);
      if (opIndex > -1) {
        const op = newData.currentDay.operations[opIndex];
        const diff = numValue - op.amount;
        if (op.type === 'earnings') newData.currentDay.earnings += diff;
        if (op.type === 'ownerShare') newData.currentDay.ownerShare += diff;
        if (op.type === 'fuel') newData.currentDay.fuel += diff;
        if (op.type === 'purchases') newData.currentDay.purchases += diff;
        if (op.type === 'objectivePayment') newData.currentDay.objectivePayments += diff;
        op.amount = numValue;
      }
    } else if (activeInput.type === 'newObjectiveAmount') {
      const newObj: Objective = {
        id: Math.random().toString(36).substr(2, 9),
        title: objectiveTitle || 'هدف جديد',
        targetAmount: numValue,
        paidAmount: 0,
        isCompleted: false
      };
      newData.objectives.push(newObj);
      setObjectiveTitle('');
    } else if (activeInput.type === 'editObjectiveAmount' && activeInput.objectiveId) {
      const obj = newData.objectives.find(o => o.id === activeInput.objectiveId);
      if (obj) {
        obj.targetAmount = numValue;
        obj.isCompleted = obj.paidAmount >= obj.targetAmount;
      }
    } else if (activeInput.type === 'payObjective' && activeInput.objectiveId) {
      const obj = newData.objectives.find(o => o.id === activeInput.objectiveId);
      if (obj) {
        obj.paidAmount += numValue;
        obj.isCompleted = obj.paidAmount >= obj.targetAmount;
        newData.currentDay.objectivePayments += numValue;
        const newOp: Operation = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'objectivePayment', amount: numValue, label: `دفع لـ: ${obj.title}`, timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
        newData.currentDay.operations.push(newOp);
      }
    } else {
      const field = activeInput.type as keyof DailyStats;
      (newData.currentDay[field] as number) += numValue;
      const labels: Record<string, string> = { earnings: 'كسب', ownerShare: 'نسبة مالك', fuel: 'وقود', purchases: 'مشتريات' };
      const newOp: Operation = {
        id: Math.random().toString(36).substr(2, 9),
        type: activeInput.type as OperationType, amount: numValue, label: labels[activeInput.type] || 'عملية', timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      newData.currentDay.operations.push(newOp);
    }

    setData(newData);
    saveData(newData);
    setActiveInput(null);
    setInputValue('');
  }, [data, activeInput, inputValue, tempEarningsValue, objectiveTitle]);

  const deleteObjective = (id: string) => {
    if (!data) return;
    const newData = { ...data };
    newData.objectives = newData.objectives.filter(o => o.id !== id);
    setData(newData);
    saveData(newData);
  };

  const deleteOperation = (id: string) => {
    if (!data) return;
    const newData = { ...data };
    const opIndex = newData.currentDay.operations.findIndex(o => o.id === id);
    if (opIndex > -1) {
      const op = newData.currentDay.operations[opIndex];
      if (op.type === 'earnings') newData.currentDay.earnings -= op.amount;
      if (op.type === 'ownerShare') newData.currentDay.ownerShare -= op.amount;
      if (op.type === 'fuel') newData.currentDay.fuel -= op.amount;
      if (op.type === 'purchases') newData.currentDay.purchases -= op.amount;
      if (op.type === 'objectivePayment') newData.currentDay.objectivePayments -= op.amount;
      newData.currentDay.operations.splice(opIndex, 1);
      setData(newData);
      saveData(newData);
    }
  };

  const handleManualSettlement = () => {
    if (!data) return;
    const totalDeductions = data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases + (data.currentDay.objectivePayments || 0);
    const net = data.currentDay.earnings - totalDeductions;
    const unsettledNet = net - (data.currentDay.settledAmount || 0);
    const newData = { ...data };
    
    if (unsettledNet !== 0) {
      const todayDate = newData.currentDay.date || getWorkingDate();
      newData.vault = addOrUpdateVaultEntry(
        newData.vault,
        todayDate,
        unsettledNet
      );
      
      // Transfer surplus into vacation fund if not completed yet
      if (unsettledNet > 0 && newData.vacationFund && newData.vacationFund.enabled) {
        if (newData.vacationFund.savedAmount < newData.vacationFund.targetAmount) {
          const needed = newData.vacationFund.targetAmount - newData.vacationFund.savedAmount;
          const contribution = Math.min(unsettledNet, needed);
          newData.vacationFund.savedAmount += contribution;
        }
      }

      // Record settled amount for the current day
      newData.currentDay.settledAmount = (newData.currentDay.settledAmount || 0) + unsettledNet;
    }
    
    newData.lastSettlementDate = getWorkingDate();
    setData(newData);
    saveData(newData);
  };

  const handleUpdateVacationFund = (fund: VacationFund) => {
    if (!data) return;
    const newData = { ...data, vacationFund: fund };
    setData(newData);
    saveData(newData);
  };

  const handleUpdateSavingsPlan = (plan: SavingsPlan) => {
    if (!data) return;
    const newData = { ...data, savingsPlan: plan };
    setData(newData);
    saveData(newData);
  };

  const handleWithdrawVacationExpense = (amount: number) => {
    if (!data) return;
    const newData = { ...data };
    const currentSaved = newData.vacationFund?.savedAmount || 0;
    if (newData.vacationFund) {
      newData.vacationFund.savedAmount = Math.max(0, currentSaved - amount);
    }
    const todayDate = newData.currentDay.date || getWorkingDate();
    newData.vault = addOrUpdateVaultEntry(
      newData.vault,
      todayDate,
      -amount,
      'سحب مصروف العطلة والراحة 🏖️'
    );
    setData(newData);
    saveData(newData);
  };

  const handleCancel = useCallback(() => {
    setActiveInput(null);
    setInputValue('');
    setTempEarningsValue(null);
    setCourseTitle('');
    setFromLocation('');
    setToLocation('');
    if (showVault && !vaultUnlocked) setShowVault(false);
  }, [showVault, vaultUnlocked]);

  if (!data) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  const totalDeductions = data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases + (data.currentDay.objectivePayments || 0);
  const netBalance = data.currentDay.earnings - totalDeductions;
  const settledToday = data.currentDay.settledAmount || 0;
  const unsettledBalance = netBalance - settledToday;
  const progress = Math.min((Math.max(0, netBalance) / (data.currentDay.goal || 1000)) * 100, 100);

  // Time Progression (06:00 to 22:00)
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const dayTimeProgress = Math.min(Math.max((currentHour - 6) / 16, 0), 1) * 100;
  const isNight = now.getHours() >= 18 || now.getHours() < 6;

  // Monthly Progression
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDayOfMonth = now.getDate() + now.getHours() / 24;
  const monthTimeProgress = Math.min((currentDayOfMonth / daysInMonth) * 100, 100);
  
  // Monthly Achievement Progress (شامل جميع ما تم ادخاره وترحيله للخزنة + الفائض المباشر الجديد لليوم)
  const currentWorkingDateStr = data.currentDay.date || now.toISOString().slice(0, 10);
  const currentMonthStr = currentWorkingDateStr.slice(0, 7);
  const totalVaultMonth = data.vault
    .filter(entry => entry.date.startsWith(currentMonthStr))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const unsettledLiveSurplus = Math.max(0, unsettledBalance);
  const monthlyEarnings = Math.max(0, totalVaultMonth + unsettledLiveSurplus);
  const monthAchievementProgress = Math.min((monthlyEarnings / (data.settings.monthlyGoal || 30000)) * 100, 100);

  // Dynamic progress color generator (Red 0% -> Green 100%)
  const getProgressColor = (pct: number) => {
    const hue = Math.min(pct * 1.2, 120); // 0 (red) to 120 (green)
    return `hsl(${hue}, 85%, 45%)`;
  };

  // Check if today is the designated rest day AND the vacation target is reached
  const isRestDayToday = now.getDay() === (data.vacationFund?.restDay ?? 5);
  const isVacationTargetReached = (data.vacationFund?.savedAmount ?? 0) >= (data.vacationFund?.targetAmount ?? 2000);
  const isVacationActiveToday = (data.vacationFund?.enabled ?? true) && isRestDayToday && isVacationTargetReached;

  // Render Lockout Reward Screen when conditions are met OR during test mode
  if (isVacationActiveToday || testVacationReward) {
    return (
      <VacationRewardScreen
        data={data}
        isTestMode={testVacationReward}
        onCloseTestMode={() => setTestVacationReward(false)}
        onWithdrawVacationExpense={handleWithdrawVacationExpense}
      />
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F9FAFB] flex flex-col p-4 pb-24 select-none relative overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        <button onClick={() => setShowSettings(true)} className="p-3 bg-white rounded-2xl text-gray-800 border-2 border-gray-200 shadow-sm active:bg-gray-100"><Icons.Settings /></button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 leading-none">محفظة السائق</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">{data.currentDay.date}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowVacationModal(true)} 
            className="p-3 bg-emerald-900 rounded-2xl text-emerald-300 border-2 border-emerald-700 shadow-sm active:bg-emerald-800 text-lg font-black flex items-center justify-center transition-transform active:scale-95"
            title="صندوق العطلة والراحة"
          >
            🏖️
          </button>
          <button onClick={() => { setShowVault(true); setVaultUnlocked(false); setActiveInput({ type: 'pin', title: 'أدخل رمز PIN للخزنة' }); }} className="p-3 bg-yellow-400 rounded-2xl text-yellow-950 border-2 border-yellow-500 shadow-sm active:bg-yellow-500"><Icons.Vault /></button>
        </div>
      </div>

      {/* Goal Progress */}
      <div onClick={() => setActiveInput({ type: 'goal', title: 'تعديل الهدف اليومي' })} className="bg-white border-4 rounded-[2.5rem] p-6 mb-6 shadow-md cursor-pointer border-gray-100 z-10">
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-400 block mb-0.5">الهدف اليومي</span>
            <span className="text-2xl font-black text-gray-900">{(data.currentDay.goal || 0).toLocaleString()} <span className="text-xs font-bold opacity-60">أوقية</span></span>
          </div>
          <div className="text-right"><span className="text-4xl font-black text-gray-900 leading-none">{Math.round(progress)}%</span></div>
        </div>
        
        {/* Achievement Line */}
        <div className="w-full bg-gray-100 rounded-full h-10 overflow-hidden border-2 border-gray-50 p-1.5 shadow-inner relative mb-2">
          <div className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end px-3" style={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }}>
             <span className="text-white text-lg drop-shadow-md">🏁</span>
          </div>
        </div>

        {/* Time Race Line */}
        <div className="w-full bg-gray-100 rounded-full h-10 overflow-hidden border-2 border-gray-50 p-1.5 shadow-inner relative">
          <div className="h-full rounded-full transition-all duration-1000 ease-linear bg-blue-400/40 flex items-center justify-end px-3" style={{ width: `${dayTimeProgress}%` }}>
             <span className="text-xl">
               {isNight ? '🌙' : '☀️'}
             </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest opacity-50">سباق الوقت اليومي</span>
          </div>
        </div>

        <p className="text-center text-[0.65rem] font-black text-gray-400 mt-3 uppercase tracking-widest">اضغط لتعديل الهدف</p>
      </div>

      {/* 3-Month Wealth Target Quick Bar with Dynamic Days Deduction */}
      {(() => {
        const totalSavedVault = Math.max(0, data.vault.reduce((acc, curr) => acc + curr.amount, 0) + Math.max(0, unsettledBalance));
        const targetAmount = data.savingsPlan?.targetAmount || 100000;
        const remainingMoney = Math.max(0, targetAmount - totalSavedVault);
        const planDays = (data.savingsPlan?.timeframeMonths || 3) * 30;
        const dailyQuota = Math.max(1, Math.round(targetAmount / planDays));
        const daysLeft = Math.max(0, Math.ceil(remainingMoney / dailyQuota));
        const daysShortened = Math.min(planDays, Math.floor(totalSavedVault / dailyQuota));

        const formatQuickDuration = (days: number) => {
          if (days <= 0) return 'اكتمل الهدف 🏆';
          const m = Math.floor(days / 30);
          const d = days % 30;
          if (m > 0 && d > 0) return `${m} ش و ${d} يوم (${days} يوماً)`;
          if (m > 0 && d === 0) return `${m} ${m === 1 ? 'شهر' : m === 2 ? 'شهران' : 'أشهر'} (${days} يوماً)`;
          return `${days} يوم عمل`;
        };

        return (
          <div 
            onClick={() => { setShowVault(true); setVaultUnlocked(false); setActiveInput({ type: 'pin', title: 'أدخل رمز PIN للخزنة' }); }}
            className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-emerald-500/10 border-2 border-yellow-400/50 rounded-3xl p-3.5 mb-6 flex justify-between items-center cursor-pointer active:scale-98 transition-all z-10 shadow-xs hover:border-yellow-400"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-yellow-950 flex items-center justify-center text-lg font-black shadow-sm shrink-0">
                🏦
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black text-amber-900 bg-yellow-300/80 px-2 py-0.5 rounded-md">
                    {data.savingsPlan?.title || 'خطة تجميع 100,000 أوقية (3 أشهر)'}
                  </span>
                  <span className="text-[10px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                    ⏳ باقي: {formatQuickDuration(daysLeft)}
                  </span>
                </div>
                <div className="text-xs font-black text-gray-900 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>المتبقي:</span>
                  <span className="text-amber-700 font-black text-sm">
                    {remainingMoney.toLocaleString()} أوقية
                  </span>
                  {daysShortened > 0 && (
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ⚡ اختصرت {daysShortened} يوم
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-left shrink-0">
              <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl block border border-emerald-200 shadow-2xs">
                {totalSavedVault.toLocaleString()} مدخر ↗
              </span>
            </div>
          </div>
        );
      })()}

      {/* Net Balance */}
      <div className="bg-[#1e293b] rounded-[3rem] p-7 text-white mb-6 shadow-2xl border-b-[12px] border-[#0f172a] relative overflow-hidden z-10">
        <div className="flex justify-between items-center mb-1">
          <p className="text-blue-300 font-black text-sm uppercase tracking-tight opacity-90">
            {settledToday > 0 ? 'صافي اليوم التراكمي' : 'الصافي المتبقي لك'}
          </p>
          {settledToday > 0 && (
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-xl">
              ✓ تم ترحيل {settledToday.toLocaleString()} للخزنة
            </span>
          )}
        </div>
        <h2 className="text-5xl sm:text-6xl font-black tracking-tighter flex items-baseline gap-2">
          {(netBalance || 0).toLocaleString()} <span className="text-xl font-bold opacity-40">أوقية</span>
        </h2>
        {settledToday > 0 && unsettledBalance > 0 && (
          <p className="text-xs font-bold text-amber-300 mt-2">
            ⚡ فائض جديد جاهز للترحيل: {unsettledBalance.toLocaleString()} أوقية
          </p>
        )}
      </div>

      {/* Quick Access Analytics Banners */}
      <div className="grid grid-cols-2 gap-3 mb-6 z-10">
        <button
          onClick={() => setShowWeeklyAnalytics(true)}
          className="p-3.5 rounded-3xl bg-[#0e1628] text-blue-400 border-2 border-slate-800 flex flex-col justify-between items-start shadow-lg active:scale-95 transition-all relative overflow-hidden group text-right h-28"
        >
          <div className="flex justify-between items-center w-full">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-lg">
              📊
            </div>
            <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-500/30">
              مقارنة ↗
            </span>
          </div>
          <div>
            <p className="font-black text-white text-xs leading-tight">التحليل الأسبوعي</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">مقارنة الأسابيع و 7 أيام</p>
          </div>
        </button>

        <button
          onClick={() => setShowTrading(true)}
          className="p-3.5 rounded-3xl bg-[#0b101d] text-emerald-400 border-2 border-slate-800 flex flex-col justify-between items-start shadow-lg active:scale-95 transition-all relative overflow-hidden group text-right h-28"
        >
          <div className="flex justify-between items-center w-full">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
              📈
            </div>
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              تداول ↗
            </span>
          </div>
          <div>
            <p className="font-black text-white text-xs leading-tight">شاشة التداول</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">مؤشرات الأرباح والوقود</p>
          </div>
        </button>
      </div>



      {/* Action Grid (6 Buttons) with Neon Glows */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 flex-grow mb-4 relative">
        <ActionButton label="الكسب" emoji="💰" color="bg-green-50" textColor="text-green-900" borderColor="border-green-400" glowColor="rgba(34, 197, 94, 0.4)" value={data.currentDay.earnings} onClick={() => setActiveInput({ type: 'tempEarnings', title: 'إضافة مبلغ الكسب' })} />
        <ActionButton label="نسبة المالك" emoji="🔑" color="bg-red-50" textColor="text-red-900" borderColor="border-red-400" glowColor="rgba(239, 68, 68, 0.4)" value={data.currentDay.ownerShare} onClick={() => setActiveInput({ type: 'ownerShare', title: 'خصم نسبة المالك' })} />
        <ActionButton label="الوقود" emoji="⛽" color="bg-orange-50" textColor="text-orange-900" borderColor="border-orange-400" glowColor="rgba(249, 115, 22, 0.4)" value={data.currentDay.fuel} onClick={() => setActiveInput({ type: 'fuel', title: 'خصم مصاريف الوقود' })} />
        <ActionButton label="المشتريات" emoji="🛒" color="bg-indigo-50" textColor="text-indigo-900" borderColor="border-indigo-400" glowColor="rgba(99, 102, 241, 0.4)" value={data.currentDay.purchases} onClick={() => setActiveInput({ type: 'purchases', title: 'خصم المشتريات اليومية' })} />
        <ActionButton label="العمليات" emoji="📋" color="bg-gray-50" textColor="text-gray-900" borderColor="border-gray-400" glowColor="rgba(107, 114, 128, 0.4)" value={data.currentDay.operations.length} onClick={() => setShowOpsList(true)} labelSuffix="عملية" />
        <ActionButton label="الأهداف" emoji="🎯" color="bg-blue-50" textColor="text-blue-900" borderColor="border-blue-400" glowColor="rgba(59, 130, 246, 0.4)" value={data.objectives.length} onClick={() => setShowObjectives(true)} labelSuffix="هدف" />
      </div>

      {/* Overlays */}
      {activeInput && (
        <div className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-md flex items-end" onClick={handleCancel}>
          <div className="w-full" onClick={e => e.stopPropagation()}>
            <Keypad
              title={activeInput.title}
              value={inputValue}
              onInput={(v) => setInputValue(prev => prev + v)}
              onClear={() => setInputValue(prev => prev.slice(0, -1))}
              onConfirm={handleUpdateValue}
              onCancel={handleCancel}
              isCourseInput={activeInput.type === 'tempEarnings'}
              courseTitle={courseTitle}
              setCourseTitle={setCourseTitle}
              fromLocation={fromLocation}
              setFromLocation={setFromLocation}
              toLocation={toLocation}
              setToLocation={setToLocation}
              isDuplicateCourse={isDuplicateCourse}
            />
          </div>
        </div>
      )}

      {/* Operations List */}
      {showOpsList && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[80] overflow-y-auto p-4 sm:p-6 font-['Cairo',sans-serif]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                <span>العمليات والمكورات اليومية</span>
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black">
                  {data.currentDay.operations.length}
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-bold mt-1">سجل تفصيلي لجميع المشاوير والنفقات لتجنب التكرار المزدوج</p>
            </div>
            <button onClick={() => setShowOpsList(false)} className="p-2.5 sm:p-3 bg-red-100 hover:bg-red-200 rounded-2xl font-black text-red-700 px-5 text-sm transition-all active:scale-95">
              إغلاق ✕
            </button>
          </div>

          <div className="space-y-3">
            {data.currentDay.operations.length === 0 && (
              <div className="text-center text-gray-400 py-20 font-bold bg-white rounded-3xl border border-gray-100 p-8">
                <span className="text-4xl block mb-2">📋</span>
                لم تقم بتسجيل أي مكور أو عملية اليوم
              </div>
            )}

            {[...data.currentDay.operations].reverse().map((op, idx) => {
              const hasRoute = op.fromLocation || op.toLocation;
              return (
                <div key={op.id} className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-gray-100 flex justify-between items-center shadow-sm hover:border-blue-100 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${op.type === 'earnings' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <p className="font-black text-gray-800 text-sm sm:text-base">{op.label}</p>
                      {op.courseTitle && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                          🚖 {op.courseTitle}
                        </span>
                      )}
                    </div>

                    {hasRoute && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold pr-4">
                        <span>📍</span>
                        <span>{op.fromLocation || 'غير محدد'}</span>
                        <span className="text-blue-500">➔</span>
                        <span>{op.toLocation || 'غير محدد'}</span>
                      </div>
                    )}

                    <p className="text-[11px] font-bold text-gray-400 pr-4">{op.timestamp}</p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`font-black text-lg sm:text-xl dir-ltr ${op.type === 'earnings' ? 'text-green-600' : 'text-red-500'}`}>
                      {op.type === 'earnings' ? '+' : '-'}{(op.amount || 0).toLocaleString()} <span className="text-xs">أوقية</span>
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={() => setActiveInput({ type: 'editOperation', title: 'تعديل المبلغ', operationId: op.id })} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all" title="تعديل">
                        ✎
                      </button>
                      <button onClick={() => deleteOperation(op.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all" title="حذف">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Objectives Modal */}
      {showObjectives && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[80] overflow-y-auto p-4 sm:p-6 font-['Cairo',sans-serif] select-none text-right" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                <span>الأهداف والادخار المخصص 🎯</span>
              </h2>
              <p className="text-xs text-gray-500 font-bold mt-1">تتبع المبالغ المتبقية لكل هدف بدقة وحماس</p>
            </div>
            <button onClick={() => setShowObjectives(false)} className="p-2.5 sm:p-3 bg-red-100 hover:bg-red-200 rounded-2xl font-black text-red-700 px-5 text-sm transition-all active:scale-95">
              إغلاق ✕
            </button>
          </div>
          
          <div className="bg-white p-5 sm:p-6 rounded-[2rem] border-2 border-dashed border-blue-200 mb-6 shadow-xs">
            <h3 className="font-black mb-3 text-blue-900 text-sm sm:text-base">إضافة هدف جديد</h3>
            <input 
              type="text" 
              placeholder="اسم الهدف (مثلاً: تجميع 100 ألف، شراء دراجة، رخصة قيادة...)" 
              value={objectiveTitle} 
              onChange={e => setObjectiveTitle(e.target.value)}
              className="w-full p-3.5 bg-gray-50 rounded-2xl border-2 border-gray-100 mb-3 text-right font-bold focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
            />
            <button 
              onClick={() => setActiveInput({ type: 'newObjectiveAmount', title: 'المبلغ المطلوب للهدف' })} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-2xl font-black shadow-md text-sm transition-all active:scale-95"
            >
              تحديد المبلغ المطلوب وإضافة الهدف ✓
            </button>
          </div>

          <div className="space-y-4 pb-10">
            {data.objectives.length === 0 && (
              <div className="text-center text-gray-400 py-16 font-bold bg-white rounded-3xl border border-gray-100 p-8">
                <span className="text-4xl block mb-2">🎯</span>
                لم تقم بإضافة أي أهداف بعد. أضف أهدافك لتبدأ رؤية المتبقي يومياً!
              </div>
            )}

            {data.objectives.map(obj => {
              const remaining = Math.max(0, (obj.targetAmount || 0) - (obj.paidAmount || 0));
              const pct = Math.min(100, Math.round(((obj.paidAmount || 0) / (obj.targetAmount || 1)) * 100));

              return (
                <div key={obj.id} className={`bg-white p-5 sm:p-6 rounded-[2rem] border-2 shadow-xs transition-all ${obj.isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100 hover:border-blue-100'}`}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-gray-900 flex items-center gap-2">
                        <span>{obj.title}</span>
                        {obj.isCompleted && <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg">مكتمل 🏆</span>}
                      </h4>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">
                        المطلوب الكلي: {(obj.targetAmount || 0).toLocaleString()} أوقية
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      {!obj.isCompleted && (
                        <button 
                          onClick={() => setActiveInput({ type: 'payObjective', title: `دفع لـ ${obj.title}`, objectiveId: obj.id })} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black shadow-xs text-xs active:scale-95 transition-all"
                        >
                          دفع 💰
                        </button>
                      )}
                      <button onClick={() => setActiveInput({ type: 'editObjectiveAmount', title: `تعديل مبلغ ${obj.title}`, objectiveId: obj.id })} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs transition-all" title="تعديل">
                        ✎
                      </button>
                      <button onClick={() => deleteObjective(obj.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs transition-all" title="حذف">
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Motivational Remaining Counter Banner */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-2xl p-3 mb-3 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{obj.isCompleted ? '🎉' : '⏳'}</span>
                      <span className="text-xs font-black text-blue-900">
                        {obj.isCompleted 
                          ? 'ألف مبروك! حققت هدفك كاملاً 100%' 
                          : <>المتبقي لتحقيق الهدف: <span className="text-sm font-black text-indigo-700 underline">{remaining.toLocaleString()} أوقية</span></>
                        }
                      </span>
                    </div>
                    <span className="text-xs font-black bg-white px-2.5 py-1 rounded-xl text-blue-800 border border-blue-200 shadow-2xs">
                      تم دفع: {(obj.paidAmount || 0).toLocaleString()} ({pct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden mb-1 border border-gray-200/70 p-0.5">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-inner" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vault (Savings & Wealth Plan Tracker) */}
      {showVault && vaultUnlocked && (
        <SavingsVaultModal
          data={data}
          onClose={() => setShowVault(false)}
          onUpdateSavingsPlan={handleUpdateSavingsPlan}
          onWithdraw={() => setActiveInput({ type: 'withdrawVault', title: 'مبلغ السحب من الخزنة' })}
          onManualSettlement={() => {
            handleManualSettlement();
            alert('تمت تسوية اليوم وتغطية أي عجز أو ترحيل الفائض إلى الخزنة بنجاح!');
          }}
          onAddManualDeposit={() => setActiveInput({ type: 'depositVault', title: 'مبلغ الإيداع المباشر في الخزنة' })}
        />
      )}

      {/* Settings */}
      {showSettings && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[90] p-6">
           <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">الإعدادات ⚙️</h2>
            <button onClick={() => setShowSettings(false)} className="p-3 bg-gray-200 rounded-2xl font-black text-gray-700 px-6">رجوع ✕</button>
          </div>
          <button onClick={() => exportData(data)} className="w-full text-right p-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-xl shadow-lg border-b-8 border-blue-800 active:translate-y-1 active:border-b-4 transition-all mb-4">تصدير نسخة احتياطية (Backup)</button>
          
          {/* Monthly Goal Race Card */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-gray-100 shadow-md mb-6" onClick={() => setActiveInput({ type: 'monthlyGoal', title: 'تعديل الهدف الشهري' })}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800">الهدف الشهري 🏆</h3>
              <span className="text-2xl font-black text-blue-600">{Math.round(monthAchievementProgress)}%</span>
            </div>
            
            {/* Monthly Achievement Line */}
            <div className="w-full bg-gray-100 rounded-full h-10 overflow-hidden border-2 border-gray-50 p-1.5 shadow-inner relative mb-2">
              <div className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end px-3" style={{ width: `${monthAchievementProgress}%`, backgroundColor: getProgressColor(monthAchievementProgress) }}>
                <span className="text-lg">🚀</span>
              </div>
            </div>

            {/* Monthly Time Line */}
            <div className="w-full bg-gray-100 rounded-full h-10 overflow-hidden border-2 border-gray-50 p-1.5 shadow-inner relative">
              <div className="h-full rounded-full bg-gray-400/40 flex items-center justify-end px-3" style={{ width: `${monthTimeProgress}%` }}>
                 <span className="text-xl">📅</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest opacity-50">سباق الشهر</span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between text-[0.6rem] font-black text-gray-400 uppercase">
              <span>المحقق: {(monthlyEarnings || 0).toLocaleString()}</span>
              <span>الهدف: {(data.settings.monthlyGoal || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Vacation Fund Settings Card */}
          <div className="bg-white p-6 rounded-[2rem] border-4 border-emerald-100 shadow-md mb-6" onClick={() => setShowVacationModal(true)}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏖️</span>
                <h3 className="font-black text-gray-800">صندوق العطلة والراحة</h3>
              </div>
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl">
                {(data.vacationFund?.savedAmount || 0).toLocaleString()} / {(data.vacationFund?.targetAmount || 2000).toLocaleString()} أوقية
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 mb-4">
              إعداد المبلغ التراكمي المطلوبة للإجازة ويوم الراحة المعتمد وإمكانية الاختبار والمعاينة.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVacationModal(true);
              }}
              className="w-full bg-emerald-900 text-emerald-200 p-3 rounded-2xl font-black text-sm border-2 border-emerald-700 shadow-sm active:scale-95 transition-all text-center"
            >
              ضبط إعدادات العطلة ⚙️
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 text-gray-500 font-bold text-center">
            تطبيق محفظة السائق v3.0 Interactive
          </div>
        </div>
      )}

      {/* Vacation Fund Modal */}
      {showVacationModal && (
        <VacationFundModal
          data={data}
          onUpdateVacationFund={handleUpdateVacationFund}
          onClose={() => setShowVacationModal(false)}
          onTestRewardScreen={() => setTestVacationReward(true)}
        />
      )}

      {/* Trading Dashboard Fullscreen View */}
      {showTrading && (
        <TradingDashboard data={data} onClose={() => setShowTrading(false)} />
      )}

      {/* Weekly Analytics Comparative View */}
      {showWeeklyAnalytics && (
        <WeeklyAnalytics data={data} onClose={() => setShowWeeklyAnalytics(false)} />
      )}
    </div>
  );
};

const ActionButton: React.FC<{ 
  label: string, 
  emoji: string, 
  color: string, 
  textColor: string, 
  borderColor: string, 
  glowColor: string, 
  value: number, 
  onClick: () => void, 
  labelSuffix?: string 
}> = ({ label, emoji, color, textColor, borderColor, glowColor, value, onClick, labelSuffix = "أوقية" }) => {
  return (
    <div className="relative group">
      {/* Neon Glow Layer */}
      <div 
        className="absolute inset-0 rounded-[2.5rem] neon-glow -z-10 blur-xl pointer-events-none" 
        style={{ backgroundColor: glowColor }}
      ></div>
      
      <button 
        onClick={onClick} 
        className={`${color} ${borderColor} border-4 rounded-[2.5rem] p-5 flex flex-col justify-between items-start h-44 w-full active:scale-95 transition-all shadow-sm border-b-8 z-10 relative overflow-hidden`}
      >
        <div className="text-5xl group-active:scale-125 transition-transform duration-300">{emoji}</div>
        <div className="text-right w-full">
          <p className={`${textColor} font-black text-lg mb-1 leading-tight`}>{label}</p>
          <p className={`${textColor} font-black bg-white/70 inline-block px-3 py-1 rounded-xl text-xs border border-black/5 shadow-inner`}>
            {value.toLocaleString()} <span className="text-[10px] opacity-70">{labelSuffix}</span>
          </p>
        </div>
        {/* Subtle glass effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
      </button>
    </div>
  );
};

export default App;
