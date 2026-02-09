
import React, { useState, useEffect, useCallback } from 'react';
import { AppData, DailyStats, Operation, Objective, OperationType } from './types';
import { getInitialData, saveData, exportData } from './services/storage';
import { Icons, CURRENCY } from './constants';
import Keypad from './components/Keypad';

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [activeInput, setActiveInput] = useState<{ 
    type: keyof DailyStats | 'pin' | 'goal' | 'tempEarnings' | 'editOperation' | 'newObjectiveAmount' | 'payObjective', 
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
  
  const [tempEarningsValue, setTempEarningsValue] = useState<number | null>(null);

  useEffect(() => {
    setData(getInitialData());
  }, []);

  const addOperation = (type: OperationType, amount: number, label: string) => {
    if (!data) return;
    const newOp: Operation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      label,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    data.currentDay.operations.push(newOp);
  };

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
    } else if (activeInput.type === 'tempEarnings') {
      setTempEarningsValue(numValue);
      setInputValue('');
      setActiveInput({ type: 'ownerShare', title: 'خصم نسبة المالك من هذا الكسب' });
      return;
    } else if (activeInput.type === 'ownerShare' && tempEarningsValue !== null) {
      newData.currentDay.earnings += tempEarningsValue;
      newData.currentDay.ownerShare += numValue;
      
      const newOpE: Operation = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'earnings', amount: tempEarningsValue, label: 'كسب جديد', timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      const newOpS: Operation = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ownerShare', amount: numValue, label: 'نسبة المالك', timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      newData.currentDay.operations.push(newOpE, newOpS);
      setTempEarningsValue(null);
    } else if (activeInput.type === 'editOperation' && activeInput.operationId) {
      const opIndex = newData.currentDay.operations.findIndex(o => o.id === activeInput.operationId);
      if (opIndex > -1) {
        const op = newData.currentDay.operations[opIndex];
        const diff = numValue - op.amount;
        
        // Update the global total for that type
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
    } else if (activeInput.type === 'payObjective' && activeInput.objectiveId) {
      const objIndex = newData.objectives.findIndex(o => o.id === activeInput.objectiveId);
      if (objIndex > -1) {
        const obj = newData.objectives[objIndex];
        obj.paidAmount += numValue;
        if (obj.paidAmount >= obj.targetAmount) obj.isCompleted = true;
        
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

  const handleCancel = useCallback(() => {
    setActiveInput(null);
    setInputValue('');
    setTempEarningsValue(null);
    if (showVault && !vaultUnlocked) setShowVault(false);
  }, [showVault, vaultUnlocked]);

  if (!data) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  const totalDeductions = data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases + (data.currentDay.objectivePayments || 0);
  const netBalance = data.currentDay.earnings - totalDeductions;
  const progress = Math.min((netBalance / data.currentDay.goal) * 100, 100);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F9FAFB] flex flex-col p-4 pb-24 select-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setShowSettings(true)} className="p-3 bg-white rounded-2xl text-gray-800 border-2 border-gray-200 shadow-sm active:bg-gray-100"><Icons.Settings /></button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 leading-none">محفظة السائق</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">{data.currentDay.date}</p>
        </div>
        <button onClick={() => { setShowVault(true); setVaultUnlocked(false); setActiveInput({ type: 'pin', title: 'أدخل رمز PIN للخزنة' }); }} className="p-3 bg-yellow-400 rounded-2xl text-yellow-950 border-2 border-yellow-500 shadow-sm active:bg-yellow-500"><Icons.Vault /></button>
      </div>

      {/* Goal Progress */}
      <div onClick={() => setActiveInput({ type: 'goal', title: 'تعديل الهدف اليومي' })} className="bg-white border-4 rounded-[2.5rem] p-6 mb-6 shadow-md cursor-pointer border-blue-100">
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-400 block mb-0.5">الهدف اليومي</span>
            <span className="text-2xl font-black text-gray-900">{data.currentDay.goal.toLocaleString()} <span className="text-xs font-bold opacity-60">أوقية</span></span>
          </div>
          <div className="text-right"><span className="text-4xl font-black text-gray-900 leading-none">{Math.round(progress)}%</span></div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-10 overflow-hidden border-2 border-gray-50 p-1.5 shadow-inner">
          <div className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-center text-[0.65rem] font-black text-gray-400 mt-3 uppercase tracking-widest">اضغط لتعديل الهدف</p>
      </div>

      {/* Net Balance */}
      <div className="bg-[#1e293b] rounded-[3rem] p-8 text-white mb-8 shadow-2xl border-b-[12px] border-[#0f172a] relative overflow-hidden">
        <p className="text-blue-300 font-black mb-1 text-lg uppercase tracking-tight opacity-80">الصافي المتبقي لك</p>
        <h2 className="text-6xl font-black tracking-tighter flex items-baseline gap-2">
          {netBalance.toLocaleString()} <span className="text-xl font-bold opacity-40">أوقية</span>
        </h2>
      </div>

      {/* Action Grid (6 Buttons) */}
      <div className="grid grid-cols-2 gap-4 flex-grow mb-4">
        <ActionButton label="الكسب" emoji="💰" color="bg-green-50" textColor="text-green-900" borderColor="border-green-400" value={data.currentDay.earnings} onClick={() => setActiveInput({ type: 'tempEarnings', title: 'إضافة مبلغ الكسب' })} />
        <ActionButton label="نسبة المالك" emoji="🔑" color="bg-red-50" textColor="text-red-900" borderColor="border-red-400" value={data.currentDay.ownerShare} onClick={() => setActiveInput({ type: 'ownerShare', title: 'خصم نسبة المالك' })} />
        <ActionButton label="الوقود" emoji="⛽" color="bg-orange-50" textColor="text-orange-900" borderColor="border-orange-400" value={data.currentDay.fuel} onClick={() => setActiveInput({ type: 'fuel', title: 'خصم مصاريف الوقود' })} />
        <ActionButton label="المشتريات" emoji="🛒" color="bg-indigo-50" textColor="text-indigo-900" borderColor="border-indigo-400" value={data.currentDay.purchases} onClick={() => setActiveInput({ type: 'purchases', title: 'خصم المشتريات اليومية' })} />
        <ActionButton label="العمليات" emoji="📋" color="bg-gray-50" textColor="text-gray-900" borderColor="border-gray-400" value={data.currentDay.operations.length} onClick={() => setShowOpsList(true)} labelSuffix="عملية" />
        <ActionButton label="الأهداف" emoji="🎯" color="bg-blue-50" textColor="text-blue-900" borderColor="border-blue-400" value={data.objectives.length} onClick={() => setShowObjectives(true)} labelSuffix="هدف" />
      </div>

      {/* Overlays (Modals) */}
      {activeInput && (
        <div className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-md flex items-end" onClick={handleCancel}>
          <div className="w-full" onClick={e => e.stopPropagation()}>
            <Keypad title={activeInput.title} value={inputValue} onInput={(v) => setInputValue(prev => prev + v)} onClear={() => setInputValue('')} onConfirm={handleUpdateValue} onCancel={handleCancel} />
          </div>
        </div>
      )}

      {/* Operations List Modal */}
      {showOpsList && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[80] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">العمليات اليومية 📋</h2>
            <button onClick={() => setShowOpsList(false)} className="p-3 bg-red-100 rounded-2xl font-black text-red-700 px-6">إغلاق ✕</button>
          </div>
          <div className="space-y-4">
            {data.currentDay.operations.length === 0 && <div className="text-center text-gray-400 py-20 font-bold">لم تقم بأي عمليات اليوم</div>}
            {[...data.currentDay.operations].reverse().map(op => (
              <div key={op.id} className="bg-white p-5 rounded-3xl border-2 border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-black text-gray-800">{op.label}</p>
                  <p className="text-xs font-bold text-gray-400">{op.timestamp}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-black text-xl ${op.type === 'earnings' ? 'text-green-600' : 'text-red-500'}`}>
                    {op.type === 'earnings' ? '+' : '-'}{op.amount.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveInput({ type: 'editOperation', title: 'تعديل المبلغ', operationId: op.id })} className="p-2 bg-blue-50 text-blue-600 rounded-xl">✎</button>
                    <button onClick={() => deleteOperation(op.id)} className="p-2 bg-red-50 text-red-600 rounded-xl">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objectives Modal */}
      {showObjectives && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[80] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">الأهداف والديون 🎯</h2>
            <button onClick={() => setShowObjectives(false)} className="p-3 bg-red-100 rounded-2xl font-black text-red-700 px-6">إغلاق ✕</button>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-blue-200 mb-8">
            <h3 className="font-black mb-4 text-blue-800">إضافة هدف جديد</h3>
            <input 
              type="text" placeholder="اسم الهدف (مثلاً: شراء خوذة)" value={objectiveTitle} onChange={e => setObjectiveTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 mb-3 text-right font-bold focus:border-blue-500 outline-none"
            />
            <button onClick={() => setActiveInput({ type: 'newObjectiveAmount', title: 'المبلغ المطلوب للهدف' })} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">تحديد المبلغ وإضافة</button>
          </div>

          <div className="space-y-6">
            {data.objectives.map(obj => (
              <div key={obj.id} className={`bg-white p-6 rounded-[2rem] border-2 shadow-sm ${obj.isCompleted ? 'border-green-200' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-xl text-gray-800">{obj.title} {obj.isCompleted && '✅'}</h4>
                    <p className="text-sm font-bold text-gray-400">المطلوب: {obj.targetAmount.toLocaleString()} أوقية</p>
                  </div>
                  {!obj.isCompleted && (
                    <button onClick={() => setActiveInput({ type: 'payObjective', title: `دفع لـ ${obj.title}`, objectiveId: obj.id })} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black shadow-md">دفع الآن</button>
                  )}
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-2">
                  <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${Math.min((obj.paidAmount / obj.targetAmount) * 100, 100)}%` }}></div>
                </div>
                <p className="text-left text-xs font-black text-gray-500">تم دفع: {obj.paidAmount.toLocaleString()} ({Math.round((obj.paidAmount / obj.targetAmount) * 100)}%)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Vault and Settings Modals... */}
      {showVault && vaultUnlocked && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[90] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">الخزنة 🏦</h2>
            <button onClick={() => setShowVault(false)} className="p-3 bg-red-100 rounded-2xl font-black text-red-700 px-6">رجوع ✕</button>
          </div>
          <div className="bg-yellow-400 border-4 border-yellow-500 rounded-[3rem] p-10 mb-8 shadow-xl text-yellow-950">
            <p className="font-black mb-1 text-xl opacity-80">إجمالي المدخرات</p>
            <h3 className="text-6xl font-black tracking-tighter">
              {data.vault.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} <span className="text-xl">أوقية</span>
            </h3>
          </div>
          <div className="space-y-4">
            {data.vault.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center p-6 bg-white rounded-3xl border-2 border-gray-100 shadow-sm font-black">
                <span className="text-gray-400">{entry.date}</span>
                <span className="text-green-700 text-2xl">+{entry.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[90] p-6">
           <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">الإعدادات ⚙️</h2>
            <button onClick={() => setShowSettings(false)} className="p-3 bg-gray-200 rounded-2xl font-black text-gray-700 px-6">رجوع ✕</button>
          </div>
          <button onClick={() => exportData(data)} className="w-full text-right p-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-xl shadow-lg border-b-8 border-blue-800 active:translate-y-1 active:border-b-4 transition-all">تصدير نسخة احتياطية (Backup)</button>
        </div>
      )}
    </div>
  );
};

const ActionButton: React.FC<{ label: string, emoji: string, color: string, textColor: string, borderColor: string, value: number, onClick: () => void, labelSuffix?: string }> = ({ label, emoji, color, textColor, borderColor, value, onClick, labelSuffix = "أوقية" }) => {
  return (
    <button onClick={onClick} className={`${color} ${borderColor} border-4 rounded-[2.5rem] p-5 flex flex-col justify-between items-start h-44 active:scale-95 transition-all shadow-sm border-b-8`}>
      <div className="text-5xl">{emoji}</div>
      <div className="text-right w-full">
        <p className={`${textColor} font-black text-lg mb-1`}>{label}</p>
        <p className={`${textColor} font-black bg-white/70 inline-block px-3 py-1 rounded-xl text-xs border border-black/5`}>
          {value.toLocaleString()} <span className="text-[10px]">{labelSuffix}</span>
        </p>
      </div>
    </button>
  );
};

export default App;
