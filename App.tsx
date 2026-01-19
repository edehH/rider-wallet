
import React, { useState, useEffect, useCallback } from 'react';
import { AppData, DailyStats } from './types';
import { getInitialData, saveData, exportData } from './services/storage';
import { Icons, CURRENCY } from './constants';
import Keypad from './components/Keypad';

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [activeInput, setActiveInput] = useState<{ 
    type: keyof DailyStats | 'pin' | 'goal' | 'tempEarnings', 
    title: string 
  } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showVault, setShowVault] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // To store the temporary earnings amount before asking for the share
  const [tempEarningsValue, setTempEarningsValue] = useState<number | null>(null);

  useEffect(() => {
    setData(getInitialData());
  }, []);

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
      // Step 1: Just entered the earnings, now ask for share
      setTempEarningsValue(numValue);
      setInputValue('');
      setActiveInput({ type: 'ownerShare', title: 'خصم نسبة المالك من هذا الكسب' });
      return;
    } else if (activeInput.type === 'ownerShare' && tempEarningsValue !== null) {
      // Step 2: Entered the owner share, update both
      newData.currentDay.earnings += tempEarningsValue;
      newData.currentDay.ownerShare += numValue;
      setTempEarningsValue(null);
    } else {
      // Normal fuel/purchases or direct settings
      const field = activeInput.type as keyof DailyStats;
      (newData.currentDay[field] as number) += numValue;
    }

    setData(newData);
    saveData(newData);
    setActiveInput(null);
    setInputValue('');
  }, [data, activeInput, inputValue, tempEarningsValue]);

  const handleCancel = useCallback(() => {
    setActiveInput(null);
    setInputValue('');
    setTempEarningsValue(null);
    if (showVault && !vaultUnlocked) setShowVault(false);
  }, [showVault, vaultUnlocked]);

  if (!data) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  const netBalance = data.currentDay.earnings - (data.currentDay.ownerShare + data.currentDay.fuel + data.currentDay.purchases);
  const progress = Math.min((netBalance / data.currentDay.goal) * 100, 100);

  const getProgressColor = (pct: number) => {
    if (pct < 30) return 'bg-red-500';
    if (pct < 60) return 'bg-orange-500';
    if (pct < 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBg = (pct: number) => {
    if (pct < 30) return 'bg-red-100 border-red-200';
    if (pct < 60) return 'bg-orange-100 border-orange-200';
    if (pct < 90) return 'bg-yellow-100 border-yellow-200';
    return 'bg-green-100 border-green-200';
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F9FAFB] flex flex-col p-4 pb-24 select-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 bg-white rounded-2xl text-gray-800 border-2 border-gray-200 active:bg-gray-100 shadow-sm"
        >
          <Icons.Settings />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 leading-none">محفظة السائق</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">{data.currentDay.date}</p>
        </div>
        <button 
          onClick={() => {
            setShowVault(true);
            setVaultUnlocked(false);
            setActiveInput({ type: 'pin', title: 'أدخل رمز PIN للخزنة' });
          }}
          className="p-3 bg-yellow-400 rounded-2xl text-yellow-950 border-2 border-yellow-500 active:bg-yellow-500 shadow-sm"
        >
          <Icons.Vault />
        </button>
      </div>

      {/* Interactive Goal Progress */}
      <div 
        onClick={() => setActiveInput({ type: 'goal', title: 'تعديل الهدف اليومي' })}
        className={`${getProgressBg(progress)} border-4 rounded-[2.5rem] p-6 mb-6 shadow-md transition-colors duration-500 active:scale-[0.98] cursor-pointer`}
      >
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500 block mb-0.5">الهدف اليومي</span>
            <span className="text-2xl font-black text-gray-900">{data.currentDay.goal.toLocaleString()} <span className="text-xs font-bold opacity-60">أوقية</span></span>
          </div>
          <div className="text-right">
             <span className="text-4xl font-black text-gray-900 leading-none">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="w-full bg-black/10 rounded-full h-10 overflow-hidden border-2 border-black/5 p-1.5 shadow-inner">
          <div 
            className={`${getProgressColor(progress)} h-full rounded-full transition-all duration-700 ease-out flex items-center justify-center`} 
            style={{ width: `${progress}%` }}
          >
            {progress > 15 && <div className="w-full h-full opacity-30 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>}
          </div>
        </div>
        <p className="text-center text-[0.65rem] font-black text-gray-600 mt-3 uppercase tracking-widest opacity-60">اضغط هنا لتغيير الهدف</p>
      </div>

      {/* Net Balance Display */}
      <div className="bg-[#1e293b] rounded-[3rem] p-8 text-white mb-8 shadow-2xl border-b-[12px] border-[#0f172a] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 pointer-events-none"></div>
        <p className="text-blue-300 font-black mb-1 text-lg uppercase tracking-tight opacity-80">الصافي المتبقي لك</p>
        <h2 className="text-6xl font-black tracking-tighter flex items-baseline gap-2">
          {netBalance.toLocaleString()} <span className="text-xl font-bold opacity-40">أوقية</span>
        </h2>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4 flex-grow">
        <ActionButton 
          label="الكسب" 
          emoji="💰" 
          color="bg-green-50" 
          textColor="text-green-900"
          borderColor="border-green-400"
          value={data.currentDay.earnings}
          onClick={() => setActiveInput({ type: 'tempEarnings', title: 'إضافة مبلغ الكسب' })}
        />
        <ActionButton 
          label="نسبة المالك" 
          emoji="🔑" 
          color="bg-red-50" 
          textColor="text-red-900"
          borderColor="border-red-400"
          value={data.currentDay.ownerShare}
          onClick={() => setActiveInput({ type: 'ownerShare', title: 'خصم نسبة المالك' })}
        />
        <ActionButton 
          label="الوقود" 
          emoji="⛽" 
          color="bg-orange-50" 
          textColor="text-orange-900"
          borderColor="border-orange-400"
          value={data.currentDay.fuel}
          onClick={() => setActiveInput({ type: 'fuel', title: 'خصم مصاريف الوقود' })}
        />
        <ActionButton 
          label="المشتريات" 
          emoji="🛒" 
          color="bg-indigo-50" 
          textColor="text-indigo-900"
          borderColor="border-indigo-400"
          value={data.currentDay.purchases}
          onClick={() => setActiveInput({ type: 'purchases', title: 'خصم المشتريات اليومية' })}
        />
      </div>

      {/* Modals & Overlays */}
      {activeInput && (
        <div className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-md flex items-end" onClick={handleCancel}>
          <div className="w-full" onClick={e => e.stopPropagation()}>
            <Keypad 
              title={activeInput.title}
              value={inputValue}
              onInput={(v) => setInputValue(prev => prev + v)}
              onClear={() => setInputValue('')}
              onConfirm={handleUpdateValue}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      {showVault && vaultUnlocked && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[70] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-900">الخزنة 🏦</h2>
              <button onClick={() => setShowVault(false)} className="p-3 bg-red-100 rounded-2xl font-black text-red-700 px-6 active:bg-red-200">رجوع ✕</button>
            </div>
            <div className="bg-yellow-400 border-4 border-yellow-500 rounded-[3rem] p-10 mb-8 shadow-xl text-yellow-950 relative overflow-hidden">
               <div className="absolute bottom-0 right-0 p-4 opacity-10 text-8xl">🏦</div>
              <p className="font-black mb-1 text-xl opacity-80 uppercase tracking-widest">إجمالي المدخرات</p>
              <h3 className="text-6xl font-black tracking-tighter">
                {data.vault.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} <span className="text-xl">أوقية</span>
              </h3>
            </div>
            <div className="space-y-4 pb-10">
              <h4 className="font-black text-gray-500 border-b-2 border-gray-200 pb-2 flex justify-between">
                <span>السجل التاريخي</span>
                <span className="text-xs">{data.vault.length} سجلات</span>
              </h4>
              {data.vault.length === 0 && <div className="text-center text-gray-400 py-20 text-lg font-bold italic">لا يوجد سجلات في الخزنة حالياً</div>}
              {[...data.vault].reverse().map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center p-6 bg-white rounded-3xl border-2 border-gray-100 shadow-sm">
                  <span className="font-bold text-gray-500">{entry.date}</span>
                  <span className="font-black text-green-700 text-2xl">+{entry.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-[#F9FAFB] z-[70] p-6 overflow-y-auto">
           <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">الإعدادات ⚙️</h2>
            <button onClick={() => setShowSettings(false)} className="p-3 bg-gray-200 rounded-2xl font-black text-gray-700 px-6 active:bg-gray-300">رجوع ✕</button>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
              <h3 className="text-xl font-black mb-6 text-gray-800 border-r-4 border-blue-600 pr-3">إدارة البيانات</h3>
              <div className="space-y-4">
                <button 
                   onClick={() => exportData(data)}
                   className="w-full text-right p-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-xl shadow-lg border-b-8 border-blue-800 active:translate-y-1 active:border-b-4 transition-all"
                >
                  تصدير نسخة احتياطية (Backup)
                </button>
                <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-3xl flex items-start gap-4">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-sm text-orange-900 font-black leading-relaxed">
                    تحذير: يتم ترحيل الأموال تلقائياً للخزنة يومياً عند الساعة 6:00 ليلاً. الصافي = الكسب - (النسبة + الوقود + المشتريات).
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 text-center text-gray-400 font-bold text-sm">
              محفظة السائق v2.1 Interactive Edition
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  emoji: string;
  color: string;
  textColor: string;
  borderColor: string;
  value: number;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, emoji, color, textColor, borderColor, value, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`${color} ${borderColor} border-4 rounded-[2.5rem] p-6 flex flex-col justify-between items-start h-44 active:scale-95 transition-all shadow-sm group hover:shadow-md border-b-8`}
    >
      <div className="text-5xl filter drop-shadow-md group-active:scale-125 transition-transform">{emoji}</div>
      <div className="text-right w-full">
        <p className={`${textColor} font-black text-xl mb-1`}>{label}</p>
        <p className={`${textColor} font-black bg-white/70 inline-block px-3 py-1 rounded-xl text-xs border border-black/5 shadow-inner`}>
          {value.toLocaleString()} <span className="text-[10px]">أوقية</span>
        </p>
      </div>
    </button>
  );
};

export default App;
