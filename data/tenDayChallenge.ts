import { AppData } from '../types';
import { getStations, StationInfo } from './gamificationData';

export const TEN_DAY_TARGET = 10000;
export const TEN_DAY_DURATION = 10;
export const TEN_DAY_DAILY_TARGET = 1000;

export interface DayRoadmapItem {
  dayNumber: number; // 1 to 10
  dailyQuota: number; // 1,000
  cumulativeTarget: number; // 1,000 to 10,000
  status: 'completed' | 'current' | 'delayed' | 'upcoming';
  station: StationInfo;
  isUnlocked: boolean;
  unlockedChest: boolean;
}

export interface TenDayChallengeState {
  targetAmount: number;
  totalDays: number;
  dailyTarget: number;
  isStarted: boolean;
  challengeStartedAt: number;
  startDateStr: string;
  endDateStr: string;
  isTimelineEnded: boolean;

  // Real-time day position & timeline
  currentDay: number; // 1 to 10
  daysRemaining: number; // 10 - currentDay (or 0 if completed)
  timeProgressPct: number; // 0% to 100% based on days elapsed

  // Savings figures
  actualSaved: number; // from vault (+ unsettled)
  expectedSavedAmount: number; // currentDay * 1,000
  remainingMoney: number; // targetAmount - actualSaved
  progressPct: number;

  // Race between user progress and time
  raceLead: 'driver' | 'time' | 'tied';
  raceDiffPct: number;
  raceMessage: string;

  // Status
  status: 'completed' | 'ahead' | 'on_track' | 'behind' | 'not_started';
  daysAhead: number;
  daysBehind: number;
  deficitAmount: number;
  surplusAmount: number;

  // Presentation text
  statusBadge: string;
  statusTitle: string;
  statusMessage: string;

  // Detailed items shown when delayed
  delayedItems: { label: string; value: string; isAlert?: boolean; isHighlight?: boolean }[];

  // 10-day stations breakdown
  roadmap: DayRoadmapItem[];
}

export const calculateTenDayChallenge = (data: AppData): TenDayChallengeState => {
  const targetAmount = TEN_DAY_TARGET;
  const totalDays = TEN_DAY_DURATION;
  const dailyTarget = TEN_DAY_DAILY_TARGET;

  // Total saved in vault + unsettled earnings
  const vaultSaved = data.vault.reduce((acc, curr) => acc + curr.amount, 0);
  const currentDayNet =
    data.currentDay.earnings -
    (data.currentDay.ownerShare +
      data.currentDay.fuel +
      data.currentDay.purchases +
      (data.currentDay.objectivePayments || 0));
  const settledToday = data.currentDay.settledAmount || 0;
  const unsettledLive = Math.max(0, currentDayNet - settledToday);
  const actualSaved = Math.max(0, vaultSaved + unsettledLive);

  // Check start time
  const hasEarnings = data.currentDay.operations && data.currentDay.operations.some(o => o.type === 'earnings');
  const hasVaultEntries = data.vault && data.vault.length > 0;
  const plan = data.savingsPlan;

  let challengeStartedAt = plan?.challengeStartedAt;
  let isStarted = Boolean(challengeStartedAt);

  if (!challengeStartedAt && (hasEarnings || hasVaultEntries)) {
    // If earnings or vault entries exist, start date is established
    challengeStartedAt = Date.now();
    isStarted = true;
  }

  const effectiveStartTime = challengeStartedAt || Date.now();
  const startDateObj = new Date(effectiveStartTime);
  const endDateObj = new Date(effectiveStartTime + (9 * 24 * 60 * 60 * 1000));
  const startDateStr = `${startDateObj.getDate()}/${startDateObj.getMonth() + 1}/${startDateObj.getFullYear()}`;
  const endDateStr = `${endDateObj.getDate()}/${endDateObj.getMonth() + 1}/${endDateObj.getFullYear()}`;

  // Calculate day number in challenge (Day 1 to 10)
  let currentDay = 1;
  let isTimelineEnded = false;
  if (isStarted) {
    const elapsedMs = Math.max(0, Date.now() - effectiveStartTime);
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    currentDay = Math.min(totalDays, Math.max(1, elapsedDays + 1));
    if (elapsedDays >= totalDays) {
      isTimelineEnded = true;
    }
  }

  const timeProgressPct = isStarted ? Math.min(100, Math.max(0, (currentDay / totalDays) * 100)) : 0;
  const expectedSavedAmount = Math.min(targetAmount, currentDay * dailyTarget);
  const remainingMoney = Math.max(0, targetAmount - actualSaved);
  const progressPct = Math.min(100, Math.max(0, (actualSaved / targetAmount) * 100));
  const daysRemaining = Math.max(0, totalDays - currentDay);

  // Race between progress and time
  let raceLead: TenDayChallengeState['raceLead'] = 'tied';
  if (!isStarted) {
    raceLead = 'tied';
  } else if (actualSaved >= targetAmount) {
    raceLead = 'driver';
  } else if (progressPct > timeProgressPct) {
    raceLead = 'driver';
  } else if (progressPct < timeProgressPct) {
    raceLead = 'time';
  } else {
    raceLead = 'tied';
  }
  const raceDiffPct = Math.abs(Math.round(progressPct - timeProgressPct));

  let status: TenDayChallengeState['status'] = 'on_track';
  let daysAhead = 0;
  let daysBehind = 0;
  let deficitAmount = 0;
  let surplusAmount = 0;
  let statusBadge = '';
  let statusTitle = '';
  let statusMessage = '';

  const delayedItems: { label: string; value: string; isAlert?: boolean; isHighlight?: boolean }[] = [];

  if (!isStarted) {
    status = 'not_started';
    statusBadge = 'جاهز للانطلاق ⏳';
    statusTitle = 'يبدأ التحدي مع تسجيل أول رحلة!';
    statusMessage = 'سيبدأ عداد الـ 10 أيام تلقائياً فور تسجيل أول رحلة اليوم.';
  } else if (actualSaved >= targetAmount) {
    status = 'completed';
    daysAhead = Math.max(0, totalDays - currentDay);
    statusBadge = 'اكتمل الهدف 🏆';
    statusTitle = 'ألف مبروك! حققت هدف الـ 10,000 أوقية بالكامل!';
    statusMessage =
      daysAhead > 0
        ? `إنجاز أسطوري! أنهيت التحدي في ${currentDay} أيام فقط واختصرت ${daysAhead} ${
            daysAhead === 1 ? 'يوم' : 'أيام'
          } من الجدول المقرر!`
        : 'أنجزت التحدي كاملاً خلال 10 أيام بكل جدارة واقتدار!';
  } else if (actualSaved >= expectedSavedAmount) {
    surplusAmount = actualSaved - expectedSavedAmount;
    // Effective days completed
    const effectiveDay = Math.floor(actualSaved / dailyTarget);
    daysAhead = Math.max(0, effectiveDay - currentDay);

    if (daysAhead > 0) {
      status = 'ahead';
      statusBadge = `اختصرت ${daysAhead} ${daysAhead === 1 ? 'يوم' : 'أيام'} ⚡`;
      statusTitle = `🚀 ممتاز! اختصرت ${daysAhead} ${daysAhead === 1 ? 'يوم' : 'أيام'} من التحدي!`;
      statusMessage = `أنت في اليوم ${currentDay} من 10، ورصيدك الحالي (${actualSaved.toLocaleString()} أوقية) يتجاوز المطلوب حتى اليوم بـ ${surplusAmount.toLocaleString()} أوقية. وفرت وسبقت الخطة بـ ${daysAhead} ${
        daysAhead === 1 ? 'يوم' : 'أيام'
      }!`;
    } else {
      status = 'on_track';
      statusBadge = 'منضبط بالكامل 🎯';
      statusTitle = '🎯 وتيرتك ممتازة ومتطابقة مع الجدول';
      statusMessage = `أنت في اليوم ${currentDay} من 10، ورصيدك (${actualSaved.toLocaleString()} أوقية) يواكب وتيرة الـ 1,000 أوقية لكل يوم تماماً.`;
    }
  } else {
    deficitAmount = expectedSavedAmount - actualSaved;
    daysBehind = Math.min(totalDays, Math.max(1, Math.ceil(deficitAmount / dailyTarget)));
    status = 'behind';
    statusBadge = `متأخر بـ ${daysBehind} ${daysBehind === 1 ? 'يوم' : 'أيام'} ⏳`;
    statusTitle = `⏳ تنبيه: متأخر بـ ${daysBehind} ${daysBehind === 1 ? 'يوم' : 'أيام'} عن الوتيرة`;
    statusMessage = `أنت حالياً في اليوم ${currentDay} من 10. المفترض أن يكون معك حتى اليوم ${expectedSavedAmount.toLocaleString()} أوقية، بينما المتوفر فعلياً ${actualSaved.toLocaleString()} أوقية (متأخر بـ ${deficitAmount.toLocaleString()} أوقية).`;

    delayedItems.push(
      { label: 'اليوم الحالي في جدول التحدي', value: `اليوم ${currentDay} من 10` },
      { label: 'المفترض توفيره حتى هذا اليوم', value: `${expectedSavedAmount.toLocaleString()} أوقية` },
      { label: 'الرصيد الفعلي الحالي في الخزنة', value: `${actualSaved.toLocaleString()} أوقية` },
      {
        label: 'العجز المتأخر المطلوب تعويضه',
        value: `${deficitAmount.toLocaleString()} أوقية`,
        isAlert: true,
        isHighlight: true
      },
      {
        label: 'المتبقي لتحقيق الهدف النهائي (10,000)',
        value: `${remainingMoney.toLocaleString()} أوقية`
      }
    );
  }

  // Generate 10-day roadmap
  const stations = getStations(targetAmount);
  const openedChests = data.gamification?.openedChests || [];

  const roadmap: DayRoadmapItem[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const cumulative = d * dailyTarget;
    const station = stations.find(s => s.stationNumber === d) || stations[d - 1] || stations[0];
    const isUnlocked = actualSaved >= cumulative;
    const isChestOpened = openedChests.includes(d);

    let dayStatus: DayRoadmapItem['status'] = 'upcoming';
    if (isUnlocked) {
      dayStatus = 'completed';
    } else if (d === currentDay) {
      dayStatus = 'current';
    } else if (d < currentDay) {
      dayStatus = 'delayed';
    } else {
      dayStatus = 'upcoming';
    }

    roadmap.push({
      dayNumber: d,
      dailyQuota: dailyTarget,
      cumulativeTarget: cumulative,
      status: dayStatus,
      station,
      isUnlocked,
      unlockedChest: isChestOpened
    });
  }

  let raceMessage = '';
  if (!isStarted) {
    raceMessage = 'يبدأ الخط الزمني للـ 10 أيام وينطلق السباق فور تسجيل أول مكسب!';
  } else if (actualSaved >= targetAmount) {
    raceMessage = '🏆 فزت بالسباق وتفوقت على الزمن بتحقيق هدف الـ 10,000 أوقية بالكامل!';
  } else if (raceLead === 'driver') {
    raceMessage = `🚀 أنت متقدم على خط الزمن بفارق ${raceDiffPct}% (+${surplusAmount.toLocaleString()} أوقية)!`;
  } else if (raceLead === 'time') {
    raceMessage = `⏳ الزمن يسبقك بفارق ${raceDiffPct}% (مطلوب +${deficitAmount.toLocaleString()} أوقية للتعادل واللحاق بالخطة)!`;
  } else {
    raceMessage = '🎯 أنت والزمن متعادلان تماماً على نفس الخط والوتيرة!';
  }

  return {
    targetAmount,
    totalDays,
    dailyTarget,
    isStarted,
    challengeStartedAt: effectiveStartTime,
    startDateStr,
    endDateStr,
    isTimelineEnded,
    currentDay,
    daysRemaining,
    timeProgressPct,
    actualSaved,
    expectedSavedAmount,
    remainingMoney,
    progressPct,
    raceLead,
    raceDiffPct,
    raceMessage,
    status,
    daysAhead,
    daysBehind,
    deficitAmount,
    surplusAmount,
    statusBadge,
    statusTitle,
    statusMessage,
    delayedItems,
    roadmap
  };
};
