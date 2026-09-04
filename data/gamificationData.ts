import { MysteryCard } from '../types';

export interface StationInfo {
  stationNumber: number; // 1 to 10
  targetAmount: number; // e.g. 10000, 20000, ...
  title: string;
  subtitle: string;
  badgeIcon: string;
  color: string;
  themeColor: string;
  particleColors: string[];
  bgGradient: string;
  specialAnimation: string;
  dopamineMessage: string;
}

// 10 Progressive Stations for the 10,000 UM target divided over 10 days
export const getStations = (planTarget: number = 10000): StationInfo[] => {
  const step = Math.max(500, Math.round(planTarget / 10));
  
  return [
    {
      stationNumber: 1,
      targetAmount: step * 1,
      title: 'محطة الشرارة الأولى ⚡',
      subtitle: 'اليوم الأول: كسر حاجز الصفر وبداية بناء رأس المال',
      badgeIcon: '⚡',
      color: 'from-amber-600 to-yellow-500',
      themeColor: '#f59e0b',
      particleColors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff'],
      bgGradient: 'from-amber-950 via-yellow-900 to-slate-950',
      specialAnimation: 'electric_storm',
      dopamineMessage: `أول ${(step * 1).toLocaleString()} أوقية في التحدي! بداية نارية ومبهرة تثبت عزمك القوي على إنجاز الـ 10 آلاف في 10 أيام!`
    },
    {
      stationNumber: 2,
      targetAmount: step * 2,
      title: 'محطة قوة الدفع النفاثة 🚀',
      subtitle: 'اليوم الثاني: تحول الادخار إلى عادة يومية منتظمة',
      badgeIcon: '🚀',
      color: 'from-blue-600 to-cyan-500',
      themeColor: '#06b6d4',
      particleColors: ['#38bdf8', '#06b6d4', '#0284c7', '#e0f2fe', '#ffffff'],
      bgGradient: 'from-cyan-950 via-blue-900 to-slate-950',
      specialAnimation: 'hyper_drive',
      dopamineMessage: `${(step * 2).toLocaleString()} أوقية في الخزنة! وتيرة الـ 10 أيام تسير بانتظام واحتراف!`
    },
    {
      stationNumber: 3,
      targetAmount: step * 3,
      title: 'محطة كاسر الحواجز 🛡️',
      subtitle: 'اليوم الثالث: الانضباط الصلب وبناء الأمان',
      badgeIcon: '⚔️',
      color: 'from-indigo-600 to-purple-500',
      themeColor: '#8b5cf6',
      particleColors: ['#a855f7', '#8b5cf6', '#6366f1', '#f3e8ff', '#ffffff'],
      bgGradient: 'from-purple-950 via-indigo-900 to-slate-950',
      specialAnimation: 'arcane_shield',
      dopamineMessage: `${(step * 3).toLocaleString()} أوقية صلبة في خزينتك! الآن أصبحت ترى أثر تعبك يتحول إلى أمان مالي حقيقي ومبهر!`
    },
    {
      stationNumber: 4,
      targetAmount: step * 4,
      title: 'محطة وحش الإسفلت 🦁',
      subtitle: 'اليوم الرابع: قوة التركيز واقتراب منتصف الطريق',
      badgeIcon: '🔥',
      color: 'from-orange-600 to-red-500',
      themeColor: '#f97316',
      particleColors: ['#fb923c', '#f97316', '#ef4444', '#fee2e2', '#ffffff'],
      bgGradient: 'from-rose-950 via-orange-900 to-slate-950',
      specialAnimation: 'fire_burst',
      dopamineMessage: `${(step * 4).toLocaleString()} أوقية! أنت تقترب من منتصف طريق الـ 10 أيام بسرعة الصاروخ.. العزيمة مشتعلة!`
    },
    {
      stationNumber: 5,
      targetAmount: step * 5,
      title: 'محطة النصف الذهبي 👑',
      subtitle: 'اليوم الخامس: منتصف التحدي.. 5,000 أوقية بالكامل!',
      badgeIcon: '👑',
      color: 'from-yellow-500 to-amber-400',
      themeColor: '#eab308',
      particleColors: ['#fde047', '#eab308', '#ca8a04', '#fef9c3', '#ffffff'],
      bgGradient: 'from-yellow-950 via-amber-900 to-slate-950',
      specialAnimation: 'golden_rain',
      dopamineMessage: `${(step * 5).toLocaleString()} أوقية كاملة! قطعت نصف مسافة التحدي.. أنت الآن تنحدر نحو خط النهاية بثقة الأبطال!`
    },
    {
      stationNumber: 6,
      targetAmount: step * 6,
      title: 'محطة الانضباط الماسي 💎',
      subtitle: 'اليوم السادس: عبور النصف والاقتراب الحاسم',
      badgeIcon: '💎',
      color: 'from-emerald-600 to-teal-400',
      themeColor: '#10b981',
      particleColors: ['#34d399', '#10b981', '#059669', '#d1fae5', '#ffffff'],
      bgGradient: 'from-emerald-950 via-teal-900 to-slate-950',
      specialAnimation: 'diamond_shards',
      dopamineMessage: `${(step * 6).toLocaleString()} أوقية! الانضباط تحول إلى درع يحميك ويزيدك قوة يوماً بعد يوم!`
    },
    {
      stationNumber: 7,
      targetAmount: step * 7,
      title: 'محطة الإعصار المالي 🌪️',
      subtitle: 'اليوم السابع: تسارع غير مسبوق نحو خط النهاية',
      badgeIcon: '🌪️',
      color: 'from-purple-600 to-pink-500',
      themeColor: '#ec4899',
      particleColors: ['#f472b6', '#ec4899', '#db2777', '#fce7f3', '#ffffff'],
      bgGradient: 'from-pink-950 via-purple-900 to-slate-950',
      specialAnimation: 'vortex_spin',
      dopamineMessage: `${(step * 7).toLocaleString()} أوقية! لم يتبق سوى 3 أيام فقط، الهدف أصبح يلوح في الأفق ببريق ساطع!`
    },
    {
      stationNumber: 8,
      targetAmount: step * 8,
      title: 'محطة صقر النخبة 🦅',
      subtitle: 'اليوم الثامن: أنت الآن في أعلى درجات الالتزام',
      badgeIcon: '🦅',
      color: 'from-sky-600 to-blue-400',
      themeColor: '#38bdf8',
      particleColors: ['#7dd3fc', '#38bdf8', '#0284c7', '#f0f9ff', '#ffffff'],
      bgGradient: 'from-sky-950 via-blue-950 to-slate-950',
      specialAnimation: 'celestial_beam',
      dopamineMessage: `${(step * 8).toLocaleString()} أوقية! رأس مالك الجديد أصبح حقيقة ملموسة وخط النهاية يناديك!`
    },
    {
      stationNumber: 9,
      targetAmount: step * 9,
      title: 'محطة أبواب المجد 🔥',
      subtitle: 'اليوم التاسع: المحطة قبل الأخيرة.. خطوة واحدة فقط!',
      badgeIcon: '🔥',
      color: 'from-rose-600 to-amber-500',
      themeColor: '#f43f5e',
      particleColors: ['#fb7185', '#f43f5e', '#e11d48', '#ffe4e6', '#ffffff'],
      bgGradient: 'from-rose-950 via-red-900 to-slate-950',
      specialAnimation: 'meteor_shower',
      dopamineMessage: `${(step * 9).toLocaleString()} أوقية! اسمع دقات قلبك.. أنت على بعد خطوة واحدة فقط من الـ 10,000 أوقية الأسطورية!`
    },
    {
      stationNumber: 10,
      targetAmount: step * 10,
      title: 'محطة أسطورة الـ 10 آلاف 🏆',
      subtitle: 'اليوم العاشر: اكتمال التحدي وتحقيق الـ 10,000 أوقية',
      badgeIcon: '🏆',
      color: 'from-yellow-400 via-amber-300 to-yellow-500',
      themeColor: '#fbbf24',
      particleColors: ['#fef08a', '#fde047', '#f59e0b', '#fbbf24', '#ffffff', '#ec4899', '#38bdf8'],
      bgGradient: 'from-amber-900 via-yellow-950 to-slate-950',
      specialAnimation: 'supernova_victory',
      dopamineMessage: `🏆 ${(step * 10).toLocaleString()} أوقية كاملة! حققت التحدي بإرادتك وعرق جبينك.. أنت أسطورة حقيقية تستحق كل فخر واعتزاز!`
    }
  ];
};

// Mystery Rewards Pool with Rarity & Unpredictability
export const MYSTERY_REWARDS_POOL = [
  {
    title: 'بطاقة العقلية الفولاذية 🛡️',
    quote: '«السر ليس في كمية المال الذي تكسبه، بل في الانضباط الذي تحمي به ما تكسبه.»',
    icon: '🛡️',
    rarity: 'rare' as const,
    perkTitle: 'لقب الشرف: كاسر المستحيل',
    perkDesc: 'مضاعفة نقاط الخبرة التراكمية +500 XP'
  },
  {
    title: 'بطاقة مغناطيس الوفرة 🧲',
    quote: '«كل أوقية تضعها في خزنتك هي جندي وفيّ يعمل لبناء مستقبلك وحريتك.»',
    icon: '🧲',
    rarity: 'epic' as const,
    perkTitle: 'لقب الشرف: قناص الأرباح',
    perkDesc: 'وسام الذهب اللامع في الملف الشخصي +1,000 XP'
  },
  {
    title: 'بطاقة البركة المضاعفة ✨',
    quote: '«ما نقص مال من صدقة، والبركة هي الجندي الخفي الذي ينمي القليل ويحفظ الكثير.»',
    icon: '✨',
    rarity: 'legendary' as const,
    perkTitle: 'لقب الشرف: فارس البركة',
    perkDesc: 'حماية معنوية ومضاعفة حظ الترحيل +2,500 XP'
  },
  {
    title: 'بطاقة محارب الإسفلت 🏎️',
    quote: '«الطريق لا يعرف الأعذار، بل يعرف من يملك خطة ويستيقظ كل صباح لينفذها.»',
    icon: '🏎️',
    rarity: 'common' as const,
    perkTitle: 'لقب الشرف: ملك الشارع',
    perkDesc: 'رمز قيادي فريد +300 XP'
  },
  {
    title: 'بطاقة الصبر الأسطوري ⏳',
    quote: '«الأشجار العظيمة بدأت ببذرة صغيرة صمدت أمام الرياح.. أنت تبني صرحك حجراً بحجر.»',
    icon: '⏳',
    rarity: 'rare' as const,
    perkTitle: 'لقب الشرف: حكيم العزيمة',
    perkDesc: 'تثبيت شارة التتابع اليومي +750 XP'
  },
  {
    title: 'بطاقة الصقر الجارح 🦅',
    quote: '«العين على القمة، واليد على المقود.. لا تلتفت للمشتتات لأن وجهتك واضحة.»',
    icon: '🦅',
    rarity: 'epic' as const,
    perkTitle: 'لقب الشرف: صقر التوفير',
    perkDesc: 'إطار ذهبي متوهج في الخزنة +1,500 XP'
  },
  {
    title: 'بطاقة تاج الإرادة 👑',
    quote: '«الرجال لا يولدون عظماء، بل يصنعون عظمتهم بالصمود عندما يستسلم الآخرون.»',
    icon: '👑',
    rarity: 'legendary' as const,
    perkTitle: 'لقب الشرف: أسطورة الطريق',
    perkDesc: 'أعلى لقب شرفي في النظام +5,000 XP'
  }
];

export const generateMysteryCardForStation = (stationNumber: number): MysteryCard => {
  // Semi-random selection biased by station number for progression dopamine
  let filtered = MYSTERY_REWARDS_POOL;
  if (stationNumber >= 8) {
    filtered = MYSTERY_REWARDS_POOL.filter(r => r.rarity === 'legendary' || r.rarity === 'epic');
  } else if (stationNumber >= 4) {
    filtered = MYSTERY_REWARDS_POOL.filter(r => r.rarity === 'rare' || r.rarity === 'epic');
  }
  
  const chosen = filtered[Math.floor(Math.random() * filtered.length)] || MYSTERY_REWARDS_POOL[0];
  
  return {
    id: `card_${stationNumber}_${Date.now()}`,
    milestone: stationNumber,
    title: chosen.title,
    quote: chosen.quote,
    icon: chosen.icon,
    rarity: chosen.rarity,
    perkTitle: chosen.perkTitle,
    perkDesc: chosen.perkDesc,
    unlockedAt: new Date().toISOString()
  };
};

export const calculateDriverLevel = (totalXp: number): { level: number; title: string; nextLevelXp: number; progress: number } => {
  const levels = [
    { lvl: 1, xp: 0, title: 'سائق واعد 🌱' },
    { lvl: 2, xp: 1000, title: 'محارب الطريق ⚔️' },
    { lvl: 3, xp: 2500, title: 'صياد الأرباح 🎯' },
    { lvl: 4, xp: 5000, title: 'خبير الانضباط 💎' },
    { lvl: 5, xp: 9000, title: 'فارس الإسفلت 🦁' },
    { lvl: 6, xp: 15000, title: 'كابتن النخبة 🦅' },
    { lvl: 7, xp: 23000, title: 'سيد الخزنة 👑' },
    { lvl: 8, xp: 35000, title: 'الأسطورة الحية 🏆' }
  ];

  let current = levels[0];
  let next = levels[1];

  for (let i = 0; i < levels.length; i++) {
    if (totalXp >= levels[i].xp) {
      current = levels[i];
      next = levels[i + 1] || { lvl: current.lvl + 1, xp: current.xp * 1.5, title: 'ماستر الأساطير 🌟' };
    }
  }

  const prevXp = current.xp;
  const targetXp = next.xp;
  const progress = Math.min(100, Math.max(0, ((totalXp - prevXp) / (targetXp - prevXp)) * 100));

  return {
    level: current.lvl,
    title: current.title,
    nextLevelXp: targetXp,
    progress
  };
};
