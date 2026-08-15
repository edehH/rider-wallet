import React, { useState, useMemo } from 'react';
import { AppData, Operation } from '../types';

export interface TradingDashboardProps {
  data: AppData;
  onClose?: () => void;
}

type Timeframe = 'today' | 'week' | 'month';

interface DataPoint {
  label: string;
  green: number;  // Net Profit & Goal Progress
  yellow: number; // Essential Operational Costs (Fuel, Maintenance, Owner Share)
  red: number;    // Personal Consumption & Food (Purchases)
}

export const TradingDashboard: React.FC<TradingDashboardProps> = ({ data, onClose }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [chartMode, setChartMode] = useState<'zigzag' | 'smooth'>('zigzag');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [isChartFullscreen, setIsChartFullscreen] = useState<boolean>(false);
  const [visibleLines, setVisibleLines] = useState<{ green: boolean; yellow: boolean; red: boolean }>({
    green: true,
    yellow: true,
    red: true,
  });

  // Calculate dynamic timeframe points based on actual AppData
  const chartPoints = useMemo<DataPoint[]>(() => {
    const ops = data.currentDay.operations || [];
    const vault = data.vault || [];

    if (timeframe === 'today') {
      if (ops.length === 0) {
        // Default baseline day timeline before operations start
        const defaultSlots = ['08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
        const baseFactor = (data.currentDay.earnings > 0 ? data.currentDay.earnings : 0);
        return defaultSlots.map((hour, idx) => {
          const factor = (idx + 1) / defaultSlots.length;
          const net = Math.max(0, data.currentDay.earnings - (data.currentDay.fuel + data.currentDay.ownerShare + data.currentDay.purchases));
          return {
            label: hour,
            green: Math.round(net * factor),
            yellow: Math.round((data.currentDay.fuel + data.currentDay.ownerShare) * factor),
            red: Math.round(data.currentDay.purchases * factor),
          };
        });
      }

      // Step-by-step transaction timeline (Real Stock Market ZigZag)
      // Point 0: Beginning of shift
      const points: DataPoint[] = [
        {
          label: '08:00 (البداية)',
          green: 0,
          yellow: 0,
          red: 0,
        }
      ];

      let runningGreen = 0;
      let runningYellow = 0;
      let runningRed = 0;

      ops.forEach((op, index) => {
        if (op.type === 'earnings') {
          runningGreen += op.amount;
        } else if (op.type === 'ownerShare' || op.type === 'fuel' || op.type === 'objectivePayment') {
          runningYellow += op.amount;
          runningGreen -= op.amount; // Expenses pull the net curve down!
        } else if (op.type === 'purchases') {
          runningRed += op.amount;
          runningGreen -= op.amount; // Purchases pull the net curve down!
        }

        const tag = op.courseTitle ? `🚖 ${op.courseTitle}` : op.label;
        points.push({
          label: `${op.timestamp || `عملية #${index + 1}`} (${tag})`,
          green: Math.max(0, runningGreen),
          yellow: runningYellow,
          red: runningRed,
        });
      });

      // If shift is active and only 1-2 ops exist, append a steady current plateau point
      if (points.length < 5) {
        const lastP = points[points.length - 1];
        points.push({
          label: 'الآن (استقرار ➔)',
          green: lastP.green,
          yellow: lastP.yellow,
          red: lastP.red,
        });
      }

      return points;
    }

    if (timeframe === 'week') {
      const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      const now = new Date();
      const todayIdx = (now.getDay() + 1) % 7; // Map JS Sunday (0) to Saturday index

      return days.map((dayLabel, idx) => {
        if (idx === todayIdx) {
          // Today's live stats
          const netE = Math.max(0, data.currentDay.earnings - data.currentDay.ownerShare - data.currentDay.fuel - data.currentDay.purchases);
          return {
            label: dayLabel,
            green: netE,
            yellow: data.currentDay.fuel + data.currentDay.ownerShare,
            red: data.currentDay.purchases,
          };
        } else if (idx < todayIdx) {
          // Historical vault days or realistic trend estimates
          const vaultEntry = vault[vault.length - (todayIdx - idx)] || { amount: Math.round(data.settings.dailyGoal * (0.6 + (idx * 0.1))) };
          const netE = Math.max(0, vaultEntry.amount || 300);
          return {
            label: dayLabel,
            green: netE,
            yellow: Math.round(netE * 0.25 + 50),
            red: Math.round(netE * 0.15 + 30),
          };
        } else {
          // Project future days of current week based on goal
          const projE = Math.round(data.settings.dailyGoal * 0.85);
          return {
            label: dayLabel,
            green: projE,
            yellow: Math.round(projE * 0.2),
            red: Math.round(projE * 0.12),
          };
        }
      });
    }

    // timeframe === 'month'
    const intervals = ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
    const avgDailyGoal = data.settings.dailyGoal || 500;
    const weeklyTarget = avgDailyGoal * 7;

    return intervals.map((label, idx) => {
      // Historical monthly breakdown from vault
      const monthVault = vault.filter(v => v.amount > 0);
      const chunkVault = monthVault.slice(idx * 7, (idx + 1) * 7);
      const sumVault = chunkVault.reduce((acc, v) => acc + v.amount, 0);

      const greenVal = sumVault > 0 ? sumVault : Math.round(weeklyTarget * (0.7 + idx * 0.1));
      const yellowVal = Math.round(greenVal * 0.28);
      const redVal = Math.round(greenVal * 0.18);

      return {
        label,
        green: greenVal,
        yellow: yellowVal,
        red: redVal,
      };
    });
  }, [data, timeframe]);

  // Aggregate Metrics
  const totals = useMemo(() => {
    const greenTotal = chartPoints[chartPoints.length - 1]?.green || 0;
    const yellowTotal = chartPoints.reduce((acc, p) => Math.max(acc, p.yellow), 0);
    const redTotal = chartPoints.reduce((acc, p) => Math.max(acc, p.red), 0);

    const firstG = chartPoints[0]?.green || 1;
    const lastG = chartPoints[chartPoints.length - 1]?.green || 0;
    const greenTrendPct = Math.round(((lastG - firstG) / Math.max(firstG, 1)) * 100);

    const firstY = chartPoints[0]?.yellow || 1;
    const lastY = chartPoints[chartPoints.length - 1]?.yellow || 0;
    const yellowTrendPct = Math.round(((lastY - firstY) / Math.max(firstY, 1)) * 100);

    const firstR = chartPoints[0]?.red || 1;
    const lastR = chartPoints[chartPoints.length - 1]?.red || 0;
    const redTrendPct = Math.round(((lastR - firstR) / Math.max(firstR, 1)) * 100);

    return {
      greenTotal,
      yellowTotal,
      redTotal,
      greenTrendPct,
      yellowTrendPct,
      redTrendPct,
      isGreenUp: lastG >= firstG,
      isYellowUp: lastY >= firstY,
      isRedUp: lastR >= firstR,
    };
  }, [chartPoints]);

  // Smart Trading Signal Engine
  const smartSignal = useMemo(() => {
    const { greenTotal, yellowTotal, redTotal } = totals;
    const totalExp = yellowTotal + redTotal;

    if (greenTotal > 0 && totalExp === 0) {
      return {
        status: 'bullish',
        color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
        badge: '🟢 إشارة نمو فائقة (STRONG BUY)',
        title: 'أرباح صافية ممتازة بدو نفقات مسجلة',
        desc: 'أداء مالي استثنائي، حافظ على هذه الوتيرة لتحقيق الأهداف المالية بسرعة.',
      };
    }

    if (redTotal > greenTotal * 0.4 && redTotal > 0) {
      return {
        status: 'warning-red',
        color: 'text-rose-400 border-rose-500/50 bg-rose-950/40',
        badge: '🔴 تنبيه استهلاكي (HIGH CONSUMPTION)',
        title: 'ارتفاع ملحوظ في المشتريات الشخصية والوجبات',
        desc: 'تستهلك المشتريات الاستهلاكية نسبة كبيرة من الدخل. يُنصح بضبط المصاريف اليومية.',
      };
    }

    if (yellowTotal > greenTotal * 0.45 && yellowTotal > 0) {
      return {
        status: 'warning-yellow',
        color: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
        badge: '🟡 تنبيه تشغيلي (HIGH OPEX)',
        title: 'ارتفاع تكاليف البنزين والصيانة والتشغيل',
        desc: 'تأكد من سلامة الدراجة وفحص الاستهلاك لتقليل مصاريف الوقود والصيانة.',
      };
    }

    return {
      status: 'balanced',
      color: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40',
      badge: '⚡ إشارة متزنة (BALANCED TREND)',
      title: 'أداء مالي متزن ومؤشرات مستقرة',
      desc: 'المصاريف التشغيلية والاستهلاكية متزنة مقارنة بالأرباح المحققة.',
    };
  }, [totals]);

  // Chart Geometry Calculations
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    ...chartPoints.flatMap(p => [p.green, p.yellow, p.red]),
    data.settings.dailyGoal || 500,
    100
  );

  const getX = (index: number) => {
    if (chartPoints.length <= 1) return paddingX;
    return paddingX + (index / (chartPoints.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const usableH = svgHeight - paddingY * 2;
    return svgHeight - paddingY - (val / maxVal) * usableH;
  };

  const generatePath = (key: 'green' | 'yellow' | 'red') => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, point, idx) => {
      const x = getX(idx);
      const y = getY(point[key]);
      if (idx === 0) return `M ${x} ${y}`;
      if (chartMode === 'zigzag') {
        // Electronic Stock Market Zig-Zag Line (Sharp direct segments)
        return `${acc} L ${x} ${y}`;
      }
      // Smooth cubic bezier path
      const prevX = getX(idx - 1);
      const prevY = getY(chartPoints[idx - 1][key]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }, '');
  };

  const generateAreaPath = (key: 'green' | 'yellow' | 'red') => {
    const linePath = generatePath(key);
    if (!linePath) return '';
    const lastX = getX(chartPoints.length - 1);
    const firstX = getX(0);
    const bottomY = svgHeight - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const getArrowAngle = (key: 'green' | 'yellow' | 'red') => {
    if (chartPoints.length < 2) return 0;
    const lastIdx = chartPoints.length - 1;
    const prevIdx = lastIdx - 1;
    const x2 = getX(lastIdx);
    const y2 = getY(chartPoints[lastIdx][key]);
    const x1 = getX(prevIdx);
    const y1 = getY(chartPoints[prevIdx][key]);

    const dx = x2 - x1;
    const dy = y2 - y1;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#070a11] text-slate-100 flex flex-col font-['Cairo',sans-serif] overflow-y-auto dir-rtl select-none backdrop-blur-xl">
      {/* Glow Ambient Highlights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/2 right-1/3 w-80 h-80 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-[#0d1322]/90 border-b border-slate-800/80 px-4 py-3 backdrop-blur-md flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <div className="w-full h-full bg-[#0d1322] rounded-[10px] flex items-center justify-center text-emerald-400 font-black text-lg">
              📈
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wide">شاشة التداول والاتجاهات</h1>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                مباشر
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">تحليل الأرباح والنفقات والسباق الزمني</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95 text-sm font-bold flex items-center gap-1.5"
          >
            إغلاق ✕
          </button>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 pb-12">
        {/* Timeframe Selector Pills */}
        <div className="bg-[#0d1527] border border-slate-800 p-1.5 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setTimeframe('today')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
              timeframe === 'today'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            اليوم ⏱️
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
              timeframe === 'week'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            هذا الأسبوع 📅
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
              timeframe === 'month'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            هذا الشهر 🏆
          </button>
        </div>

        {/* Smart Trading Signal Banner */}
        <div className={`p-4 rounded-2xl border ${smartSignal.color} shadow-lg relative overflow-hidden backdrop-blur-md transition-all`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-black/40 border border-current">
              {smartSignal.badge}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">تحديث فوري</span>
          </div>
          <h3 className="text-sm font-black text-white mb-1">{smartSignal.title}</h3>
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">{smartSignal.desc}</p>
        </div>

        {/* Live Metrics Cards (3 Cards with Trend Indicators) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Green Metric: Net Profit & Goal */}
          <div
            onClick={() => setVisibleLines(v => ({ ...v, green: !v.green }))}
            className={`cursor-pointer p-3 rounded-2xl border transition-all ${
              visibleLines.green
                ? 'bg-[#0d1a18] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-[#0d1322]/50 border-slate-800 opacity-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-emerald-400">الأرباح والهدف</span>
              <span className="text-xs">{totals.isGreenUp ? '🟢 ↗️' : '🟢 ↘️'}</span>
            </div>
            <p className="text-base font-black text-emerald-400 tracking-tight">
              {totals.greenTotal.toLocaleString()}{' '}
              <span className="text-[9px] text-emerald-500/80 font-normal">أوقية</span>
            </p>
            <div className="mt-1 flex items-center justify-between text-[9px] font-bold">
              <span className={totals.greenTrendPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {totals.greenTrendPct >= 0 ? `+${totals.greenTrendPct}%` : `${totals.greenTrendPct}%`}
              </span>
              <span className="text-slate-500">صافي</span>
            </div>
          </div>

          {/* Yellow Metric: Operational Costs */}
          <div
            onClick={() => setVisibleLines(v => ({ ...v, yellow: !v.yellow }))}
            className={`cursor-pointer p-3 rounded-2xl border transition-all ${
              visibleLines.yellow
                ? 'bg-[#1a170d] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-[#0d1322]/50 border-slate-800 opacity-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-amber-400">التشغيل والصيانة</span>
              <span className="text-xs">{totals.isYellowUp ? '🟡 ↗️' : '🟡 ↘️'}</span>
            </div>
            <p className="text-base font-black text-amber-400 tracking-tight">
              {totals.yellowTotal.toLocaleString()}{' '}
              <span className="text-[9px] text-amber-500/80 font-normal">أوقية</span>
            </p>
            <div className="mt-1 flex items-center justify-between text-[9px] font-bold">
              <span className={totals.yellowTrendPct <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {totals.yellowTrendPct >= 0 ? `+${totals.yellowTrendPct}%` : `${totals.yellowTrendPct}%`}
              </span>
              <span className="text-slate-500">وقود/صيانة</span>
            </div>
          </div>

          {/* Red Metric: Personal Purchases */}
          <div
            onClick={() => setVisibleLines(v => ({ ...v, red: !v.red }))}
            className={`cursor-pointer p-3 rounded-2xl border transition-all ${
              visibleLines.red
                ? 'bg-[#1a0d11] border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : 'bg-[#0d1322]/50 border-slate-800 opacity-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-rose-400">المشتريات الاستهلاكية</span>
              <span className="text-xs">{totals.isRedUp ? '🔴 ↗️' : '🔴 ↘️'}</span>
            </div>
            <p className="text-base font-black text-rose-400 tracking-tight">
              {totals.redTotal.toLocaleString()}{' '}
              <span className="text-[9px] text-rose-500/80 font-normal">أوقية</span>
            </p>
            <div className="mt-1 flex items-center justify-between text-[9px] font-bold">
              <span className={totals.redTrendPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {totals.redTrendPct >= 0 ? `+${totals.redTrendPct}%` : `${totals.redTrendPct}%`}
              </span>
              <span className="text-slate-500">طعام/شخصي</span>
            </div>
          </div>
        </div>

        {/* Main Trading Chart Canvas (SVG Dynamic Chart) */}
        <div className="bg-[#0b101d] border border-slate-800/90 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-slate-300">مخطط اتجاهات الأسهم والسباق الزمني</h2>
              <span className="text-[10px] text-slate-500 font-semibold">(انقر لتحديد نقطة)</span>
            </div>

            {/* Interactive Legend Toggles & Mode Switcher & Top Corner Expand Button */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold flex-wrap">
              {/* Mode Toggle Button: Zigzag vs Smooth */}
              <button
                onClick={() => setChartMode(m => m === 'zigzag' ? 'smooth' : 'zigzag')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all active:scale-95 ${
                  chartMode === 'zigzag'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                }`}
                title="التبديل بين الأسهم المتعرجة (البورصة) والمنحنى الناعم"
              >
                <span>{chartMode === 'zigzag' ? '⚡ متعرج (بورصة)' : '🌊 منحنى ناعم'}</span>
              </button>

              <button
                onClick={() => setVisibleLines(v => ({ ...v, green: !v.green }))}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  visibleLines.green
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-800/50 text-slate-500 border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                أرباح
              </button>
              <button
                onClick={() => setVisibleLines(v => ({ ...v, yellow: !v.yellow }))}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  visibleLines.yellow
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                    : 'bg-slate-800/50 text-slate-500 border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                تشغيل
              </button>
              <button
                onClick={() => setVisibleLines(v => ({ ...v, red: !v.red }))}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  visibleLines.red
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                    : 'bg-slate-800/50 text-slate-500 border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                استهلاك
              </button>

              {/* Fullscreen Expand Button in Top Corner */}
              <button
                onClick={() => setIsChartFullscreen(true)}
                className="p-1 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center gap-1"
                title="تكبير المخطط لملء الشاشة بالكامل"
              >
                <span>⛶</span>
                <span className="text-[10px]">تكبير</span>
              </button>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full aspect-[21/10] bg-[#070b14] rounded-2xl border border-slate-800/60 p-1 overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Sharp Vector Arrowhead Markers */}
                <marker
                  id="arrowGreen"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <polygon points="0,1 10,5 0,9 3,5" fill="#10b981" />
                </marker>
                <marker
                  id="arrowYellow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <polygon points="0,1 10,5 0,9 3,5" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrowRed"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <polygon points="0,1 10,5 0,9 3,5" fill="#ef4444" />
                </marker>

                {/* Gradients */}
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>

                {/* Glow Filters */}
                <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Horizontal Reference Lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                const y = paddingY + ratio * (svgHeight - paddingY * 2);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Goal Target Line */}
              {data.settings.dailyGoal > 0 && (
                <g>
                  <line
                    x1={paddingX}
                    y1={getY(data.settings.dailyGoal)}
                    x2={svgWidth - paddingX}
                    y2={getY(data.settings.dailyGoal)}
                    stroke="#0284c7"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                  <text
                    x={svgWidth - paddingX - 10}
                    y={getY(data.settings.dailyGoal) - 4}
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    الهدف اليومي ({data.settings.dailyGoal})
                  </text>
                </g>
              )}

              {/* Area Fills */}
              {visibleLines.green && (
                <path d={generateAreaPath('green')} fill="url(#greenGradient)" />
              )}
              {visibleLines.yellow && (
                <path d={generateAreaPath('yellow')} fill="url(#yellowGradient)" />
              )}
              {visibleLines.red && (
                <path d={generateAreaPath('red')} fill="url(#redGradient)" />
              )}

              {/* Stroke Curves with Vector Sharp Arrowhead Markers */}
              {visibleLines.green && (
                <path
                  d={generatePath('green')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowGreen)"
                  filter="url(#glowGreen)"
                />
              )}
              {visibleLines.yellow && (
                <path
                  d={generatePath('yellow')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowYellow)"
                  filter="url(#glowYellow)"
                />
              )}
              {visibleLines.red && (
                <path
                  d={generatePath('red')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowRed)"
                  filter="url(#glowRed)"
                />
              )}

              {/* Connected Sharp Vector Pointer Arrowheads at Curve Tips */}
              {chartPoints.length > 1 && (
                <>
                  {/* Green Sharp Vector Arrow Head */}
                  {visibleLines.green && (
                    <g
                      transform={`translate(${getX(chartPoints.length - 1)}, ${getY(chartPoints[chartPoints.length - 1].green)}) rotate(${getArrowAngle('green')})`}
                    >
                      <polygon
                        points="-12,-6 4,0 -12,6 -7,0"
                        fill="#10b981"
                        stroke="#070a11"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}

                  {/* Yellow Sharp Vector Arrow Head */}
                  {visibleLines.yellow && (
                    <g
                      transform={`translate(${getX(chartPoints.length - 1)}, ${getY(chartPoints[chartPoints.length - 1].yellow)}) rotate(${getArrowAngle('yellow')})`}
                    >
                      <polygon
                        points="-10,-5 3,0 -10,5 -6,0"
                        fill="#f59e0b"
                        stroke="#070a11"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}

                  {/* Red Sharp Vector Arrow Head */}
                  {visibleLines.red && (
                    <g
                      transform={`translate(${getX(chartPoints.length - 1)}, ${getY(chartPoints[chartPoints.length - 1].red)}) rotate(${getArrowAngle('red')})`}
                    >
                      <polygon
                        points="-10,-5 3,0 -10,5 -6,0"
                        fill="#ef4444"
                        stroke="#070a11"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </>
              )}

              {/* Chart Points & Labels */}
              {chartPoints.map((pt, idx) => {
                const x = getX(idx);
                const isLast = idx === chartPoints.length - 1;

                return (
                  <g key={idx} onClick={() => setActivePointIndex(activePointIndex === idx ? null : idx)} className="cursor-pointer">
                    {/* Vertical guideline on hover/click */}
                    {activePointIndex === idx && (
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={svgHeight - paddingY}
                        stroke="#475569"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Green Point */}
                    {visibleLines.green && (
                      <g>
                        <circle
                          cx={x}
                          cy={getY(pt.green)}
                          r={isLast ? 5.5 : 4}
                          fill="#10b981"
                          stroke="#070a11"
                          strokeWidth="2"
                        />
                        {/* Delta indicator for step */}
                        {idx > 0 && (
                          <g transform={`translate(${x}, ${getY(pt.green) - 12})`}>
                            {pt.green > chartPoints[idx - 1].green ? (
                              <text x="0" y="0" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">
                                ▲+{pt.green - chartPoints[idx - 1].green}
                              </text>
                            ) : pt.green < chartPoints[idx - 1].green ? (
                              <text x="0" y="0" fill="#f87171" fontSize="8" fontWeight="bold" textAnchor="middle">
                                ▼{pt.green - chartPoints[idx - 1].green}
                              </text>
                            ) : (
                              <text x="0" y="0" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">
                                ━ استقرار
                              </text>
                            )}
                          </g>
                        )}
                        {isLast && (
                          <g transform={`translate(${x + 10}, ${getY(pt.green) - 7})`}>
                            <rect x="-2" y="-12" width="34" height="15" rx="4" fill="#10b981" />
                            <text x="15" y="-1" fill="#070a11" fontSize="9" fontWeight="900" textAnchor="middle">
                              {pt.green.toLocaleString()}
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Yellow Point */}
                    {visibleLines.yellow && (
                      <g>
                        <circle
                          cx={x}
                          cy={getY(pt.yellow)}
                          r={isLast ? 4.5 : 3}
                          fill="#f59e0b"
                          stroke="#070a11"
                          strokeWidth="2"
                        />
                        {isLast && (
                          <g transform={`translate(${x + 10}, ${getY(pt.yellow) - 7})`}>
                            <rect x="-2" y="-12" width="34" height="15" rx="4" fill="#f59e0b" />
                            <text x="15" y="-1" fill="#070a11" fontSize="9" fontWeight="900" textAnchor="middle">
                              {pt.yellow.toLocaleString()}
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Red Point */}
                    {visibleLines.red && (
                      <g>
                        <circle
                          cx={x}
                          cy={getY(pt.red)}
                          r={isLast ? 4.5 : 3}
                          fill="#ef4444"
                          stroke="#070a11"
                          strokeWidth="2"
                        />
                        {isLast && (
                          <g transform={`translate(${x + 10}, ${getY(pt.red) - 7})`}>
                            <rect x="-2" y="-12" width="34" height="15" rx="4" fill="#ef4444" />
                            <text x="15" y="-1" fill="#070a11" fontSize="9" fontWeight="900" textAnchor="middle">
                              {pt.red.toLocaleString()}
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* X Axis Time Labels */}
                    <text
                      x={x}
                      y={svgHeight - 8}
                      fill={activePointIndex === idx ? '#38bdf8' : '#64748b'}
                      fontSize="9"
                      fontWeight={activePointIndex === idx ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Tooltip Card for Selected Point */}
          {activePointIndex !== null && chartPoints[activePointIndex] && (
            <div className="mt-3 p-3 rounded-2xl bg-[#0f172a] border border-slate-700/80 shadow-xl flex justify-between items-center text-xs animate-fadeIn">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">
                  التوقيت: {chartPoints[activePointIndex].label}
                </span>
                <div className="flex gap-3 font-black">
                  <span className="text-emerald-400">
                    أرباح: {chartPoints[activePointIndex].green.toLocaleString()}
                  </span>
                  <span className="text-amber-400">
                    تشغيل: {chartPoints[activePointIndex].yellow.toLocaleString()}
                  </span>
                  <span className="text-rose-400">
                    استهلاك: {chartPoints[activePointIndex].red.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActivePointIndex(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Categories Detailed Breakdown */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
          <h3 className="text-xs font-black text-slate-300">تفاصيل الفئات والتحليلات</h3>

          {/* Green Category Detail */}
          <div className="flex justify-between items-center p-3 rounded-2xl bg-[#070b14] border border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                💰
              </div>
              <div>
                <p className="text-xs font-black text-emerald-400">الأرباح والهدف المحقق</p>
                <p className="text-[10px] text-slate-400">صافي الكسب اليومي والترحيل</p>
              </div>
            </div>
            <div className="text-left font-black">
              <p className="text-sm text-emerald-400">{totals.greenTotal.toLocaleString()} أوقية</p>
              <p className="text-[9px] text-emerald-500/80">
                {data.settings.dailyGoal ? Math.round((totals.greenTotal / data.settings.dailyGoal) * 100) : 0}% من الهدف
              </p>
            </div>
          </div>

          {/* Yellow Category Detail */}
          <div className="flex justify-between items-center p-3 rounded-2xl bg-[#070b14] border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                ⛽
              </div>
              <div>
                <p className="text-xs font-black text-amber-400">مصاريف التشغيل والصيانة</p>
                <p className="text-[10px] text-slate-400">وقود (بنزين) + نسبة المالك + الصيانة</p>
              </div>
            </div>
            <div className="text-left font-black">
              <p className="text-sm text-amber-400">{totals.yellowTotal.toLocaleString()} أوقية</p>
              <p className="text-[9px] text-amber-500/80">مصاريف أساسية للعمل</p>
            </div>
          </div>

          {/* Red Category Detail */}
          <div className="flex justify-between items-center p-3 rounded-2xl bg-[#070b14] border border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                🛒
              </div>
              <div>
                <p className="text-xs font-black text-rose-400">المشتريات الاستهلاكية والشخصية</p>
                <p className="text-[10px] text-slate-400">طعام، مشروبات، وتسوق شخصي فقط</p>
              </div>
            </div>
            <div className="text-left font-black">
              <p className="text-sm text-rose-400">{totals.redTotal.toLocaleString()} أوقية</p>
              <p className="text-[9px] text-rose-500/80">إنفاق استهلاكي شخصي</p>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen High-Definition Chart Overlay Modal */}
      {isChartFullscreen && (
        <div className="fixed inset-0 z-[250] bg-[#070b14] text-slate-100 flex flex-col p-4 sm:p-6 overflow-y-auto dir-rtl font-['Cairo',sans-serif] animate-fadeIn">
          {/* Header Bar */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center text-emerald-400 font-black text-xl">
                  📈
                </div>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>مخطط اتجاهات الأسهم والتداول</span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    شاشة كاملة عالي الدقة
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-bold">رؤوس مدببة واقعية متصلة بالخطوط وقراءات بيانية دقيقة</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Mode Toggle in Fullscreen */}
              <button
                onClick={() => setChartMode(m => m === 'zigzag' ? 'smooth' : 'zigzag')}
                className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                  chartMode === 'zigzag'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                }`}
              >
                <span>{chartMode === 'zigzag' ? '⚡ أسهم متعرجة (بورصة)' : '🌊 منحنى ناعم'}</span>
              </button>

              {/* Category Toggles */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setVisibleLines(v => ({ ...v, green: !v.green }))}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    visibleLines.green
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-800/50 text-slate-500 border-slate-700'
                  }`}
                >
                  ● أرباح ({totals.greenTotal.toLocaleString()})
                </button>
                <button
                  onClick={() => setVisibleLines(v => ({ ...v, yellow: !v.yellow }))}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    visibleLines.yellow
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm'
                      : 'bg-slate-800/50 text-slate-500 border-slate-700'
                  }`}
                >
                  ● تشغيل ({totals.yellowTotal.toLocaleString()})
                </button>
                <button
                  onClick={() => setVisibleLines(v => ({ ...v, red: !v.red }))}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    visibleLines.red
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm'
                      : 'bg-slate-800/50 text-slate-500 border-slate-700'
                  }`}
                >
                  ● استهلاك ({totals.redTotal.toLocaleString()})
                </button>
              </div>

              {/* Close Fullscreen Button */}
              <button
                onClick={() => setIsChartFullscreen(false)}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <span>إغلاق التكبير</span>
                <span>✕</span>
              </button>
            </div>
          </div>

          {/* Large Expanded SVG Chart Canvas */}
          <div className="flex-1 bg-[#0b101d] border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[420px]">
            <div className="relative w-full h-full flex-1">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Sharp Vector Arrowhead Markers */}
                  <marker id="arrowGreenFs" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <polygon points="0,1 10,5 0,9 3,5" fill="#10b981" />
                  </marker>
                  <marker id="arrowYellowFs" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <polygon points="0,1 10,5 0,9 3,5" fill="#f59e0b" />
                  </marker>
                  <marker id="arrowRedFs" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <polygon points="0,1 10,5 0,9 3,5" fill="#ef4444" />
                  </marker>

                  <linearGradient id="greenGradientFs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="yellowGradientFs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="redGradientFs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0.15, 0.35, 0.55, 0.75, 0.95].map((ratio, i) => {
                  const y = paddingY + ratio * (svgHeight - paddingY * 2);
                  return (
                    <line
                      key={i}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
                    />
                  );
                })}

                {/* Area Fills */}
                {visibleLines.green && <path d={generateAreaPath('green')} fill="url(#greenGradientFs)" />}
                {visibleLines.yellow && <path d={generateAreaPath('yellow')} fill="url(#yellowGradientFs)" />}
                {visibleLines.red && <path d={generateAreaPath('red')} fill="url(#redGradientFs)" />}

                {/* Stroke Curves */}
                {visibleLines.green && (
                  <path
                    d={generatePath('green')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    markerEnd="url(#arrowGreenFs)"
                  />
                )}
                {visibleLines.yellow && (
                  <path
                    d={generatePath('yellow')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#arrowYellowFs)"
                  />
                )}
                {visibleLines.red && (
                  <path
                    d={generatePath('red')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#arrowRedFs)"
                  />
                )}

                {/* Vector Pointer Arrowheads attached to tip */}
                {chartPoints.length > 1 && (
                  <>
                    {visibleLines.green && (
                      <g transform={`translate(${getX(chartPoints.length - 1)}, ${getY(chartPoints[chartPoints.length - 1].green)}) rotate(${getArrowAngle('green')})`}>
                        <polygon points="-14,-7 5,0 -14,7 -8,0" fill="#10b981" stroke="#070a11" strokeWidth="2" />
                      </g>
                    )}
                    {visibleLines.yellow && (
                      <g transform={`translate(${getX(chartPoints.length - 1)}, ${getY(chartPoints[chartPoints.length - 1].yellow)}) rotate(${getArrowAngle('yellow')})`}>
                        <polygon points="-12,-6 4,0 -12,6 -7,0" fill="#f59e0b" stroke="#070a11" strokeWidth="2" />
                      </g>
                    )}
                    {visibleLines.red && (
                      <g transform={`translate(${getX(chartPoints.length - 1)}, ${getY(chartPoints[chartPoints.length - 1].red)}) rotate(${getArrowAngle('red')})`}>
                        <polygon points="-12,-6 4,0 -12,6 -7,0" fill="#ef4444" stroke="#070a11" strokeWidth="2" />
                      </g>
                    )}
                  </>
                )}

                {/* Chart Points and Values */}
                {chartPoints.map((pt, idx) => {
                  const x = getX(idx);
                  const isLast = idx === chartPoints.length - 1;

                  return (
                    <g key={idx} onClick={() => setActivePointIndex(activePointIndex === idx ? null : idx)} className="cursor-pointer">
                      {activePointIndex === idx && (
                        <line x1={x} y1={paddingY} x2={x} y2={svgHeight - paddingY} stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="2" />
                      )}

                      {/* Green */}
                      {visibleLines.green && (
                        <g>
                          <circle cx={x} cy={getY(pt.green)} r={isLast ? 6 : 4} fill="#10b981" stroke="#070a11" strokeWidth="2" />
                          <text x={x} y={getY(pt.green) - 10} fill="#6ee7b7" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {pt.green.toLocaleString()}
                          </text>
                          {idx > 0 && (
                            <g transform={`translate(${x}, ${getY(pt.green) - 20})`}>
                              {pt.green > chartPoints[idx - 1].green ? (
                                <text x="0" y="0" fill="#34d399" fontSize="8" fontWeight="black" textAnchor="middle">
                                  ▲+{pt.green - chartPoints[idx - 1].green}
                                </text>
                              ) : pt.green < chartPoints[idx - 1].green ? (
                                <text x="0" y="0" fill="#f87171" fontSize="8" fontWeight="black" textAnchor="middle">
                                  ▼{pt.green - chartPoints[idx - 1].green}
                                </text>
                              ) : (
                                <text x="0" y="0" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">
                                  ━ 0
                                </text>
                              )}
                            </g>
                          )}
                        </g>
                      )}

                      {/* Yellow */}
                      {visibleLines.yellow && (
                        <g>
                          <circle cx={x} cy={getY(pt.yellow)} r={isLast ? 5.5 : 3.5} fill="#f59e0b" stroke="#070a11" strokeWidth="2" />
                          <text x={x} y={getY(pt.yellow) - 10} fill="#fcd34d" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {pt.yellow.toLocaleString()}
                          </text>
                        </g>
                      )}

                      {/* Red */}
                      {visibleLines.red && (
                        <g>
                          <circle cx={x} cy={getY(pt.red)} r={isLast ? 5.5 : 3.5} fill="#ef4444" stroke="#070a11" strokeWidth="2" />
                          <text x={x} y={getY(pt.red) - 10} fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {pt.red.toLocaleString()}
                          </text>
                        </g>
                      )}

                      {/* X Label */}
                      <text
                        x={x}
                        y={svgHeight - 8}
                        fill={activePointIndex === idx ? '#38bdf8' : '#94a3b8'}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Point Breakdown Bar in Fullscreen Mode */}
            {activePointIndex !== null && chartPoints[activePointIndex] && (
              <div className="mt-4 p-4 rounded-2xl bg-[#0d1527] border border-slate-700 shadow-2xl flex justify-between items-center animate-fadeIn text-sm">
                <div>
                  <span className="text-slate-300 font-bold block mb-1">
                    📌 النقطة المختارة: {chartPoints[activePointIndex].label}
                  </span>
                  <div className="flex gap-4 font-black">
                    <span className="text-emerald-400">💰 الأرباح: {chartPoints[activePointIndex].green.toLocaleString()} أوقية</span>
                    <span className="text-amber-400">⛽ التشغيل: {chartPoints[activePointIndex].yellow.toLocaleString()} أوقية</span>
                    <span className="text-rose-400">🛒 الاستهلاك: {chartPoints[activePointIndex].red.toLocaleString()} أوقية</span>
                  </div>
                </div>
                <button
                  onClick={() => setActivePointIndex(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
                >
                  إلغاء التحديد ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingDashboard;
