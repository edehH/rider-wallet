import React, { useState, useEffect, useRef } from 'react';
import { MysteryCard } from '../types';
import { StationInfo, getStations } from '../data/gamificationData';
import { 
  playChestOpenSound, 
  playLevelUpFanfare, 
  playExplosionShockwaveSound,
  playCountdownTick 
} from '../services/soundEffects';

interface MysteryMilestoneModalProps {
  isOpen: boolean;
  station?: StationInfo | null;
  card?: MysteryCard | null;
  mode: 'station_unlocked' | 'chest_opened' | 'lucky_bonus' | 'penalty_notice';
  bonusXp?: number;
  penaltyAmount?: number;
  penaltyReason?: string;
  onClose: () => void;
  onOpenChest?: (stationNumber: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'rect' | 'star' | 'coin';
  depthZ: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface FireworkRocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  exploded: boolean;
}

export const MysteryMilestoneModal: React.FC<MysteryMilestoneModalProps> = ({
  isOpen,
  station: propStation,
  card: propCard,
  mode,
  bonusXp,
  penaltyAmount,
  penaltyReason,
  onClose,
  onOpenChest
}) => {
  const [chestState, setChestState] = useState<'closed' | 'opening' | 'exploding' | 'revealed'>('closed');
  const [countdown, setCountdown] = useState<number>(10);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [cardTilt, setCardTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [screenShaking, setScreenShaking] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Fallback default station if undefined
  const defaultStation = getStations(100000)[0];
  const activeStation = propStation || defaultStation;

  // Visual Palette and 3D properties according to active station
  const stationColors = activeStation.particleColors || ['#f59e0b', '#fbbf24', '#ffffff'];
  const themeHex = activeStation.themeColor || '#f59e0b';
  const stationNumber = activeStation.stationNumber || 1;

  useEffect(() => {
    if (isOpen) {
      setCountdown(10);
      setIsTimerActive(false);

      if (mode === 'station_unlocked') {
        setChestState('closed');
        playLevelUpFanfare();
      } else if (mode === 'chest_opened' || mode === 'lucky_bonus') {
        // Automatically start sequence if opened directly
        triggerExplosionAndReveal();
      } else {
        setChestState('closed');
      }
    } else {
      setChestState('closed');
      setIsTimerActive(false);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    }
  }, [isOpen, mode]);

  // 10-Second Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive) {
      let remaining = countdown;
      interval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (interval) clearInterval(interval);
          setCountdown(0);
          handleFinishCelebration();
        } else {
          setCountdown(remaining);
          if (remaining <= 4) {
            playCountdownTick();
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  // Trigger Explosive Reveal
  const triggerExplosionAndReveal = () => {
    setChestState('exploding');
    setScreenShaking(true);
    playExplosionShockwaveSound();

    // Trigger onOpenChest callback if provided
    if (onOpenChest && propStation) {
      onOpenChest(propStation.stationNumber);
    }

    // Brief screen rumble
    setTimeout(() => {
      setScreenShaking(false);
      setChestState('revealed');
      setIsTimerActive(true);
      setCountdown(10);
    }, 600);
  };

  const handleFinishCelebration = () => {
    setIsTimerActive(false);
    onClose();
  };

  // Canvas 3D Particle & Firework Engine
  useEffect(() => {
    if (!isOpen || (chestState !== 'exploding' && chestState !== 'revealed')) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const shockwaves: Shockwave[] = [];
    const fireworks: FireworkRocket[] = [];

    const spawnShockwave = (x: number, y: number, color: string) => {
      shockwaves.push({
        x,
        y,
        radius: 10,
        maxRadius: Math.max(width, height) * 0.7,
        color,
        alpha: 0.9,
        lineWidth: 8
      });
    };

    const spawnExplosionBurst = (x: number, y: number, count: number = 80, customColors = stationColors) => {
      spawnShockwave(x, y, customColors[0] || themeHex);

      const shapes: Particle['shape'][] = ['circle', 'rect', 'star', 'coin'];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 12;
        const color = customColors[Math.floor(Math.random() * customColors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 4), // upward bias
          size: shape === 'coin' ? 10 + Math.random() * 8 : 4 + Math.random() * 8,
          color,
          alpha: 1,
          decay: 0.006 + Math.random() * 0.012,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          shape,
          depthZ: 0.5 + Math.random() * 1.5
        });
      }
    };

    // Initial big detonation burst at center
    spawnExplosionBurst(width / 2, height / 2, 120);

    let lastRocketTime = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Periodically spawn fireworks across the 10-second celebration
      if (time - lastRocketTime > 550) {
        lastRocketTime = time;
        const startX = width * 0.15 + Math.random() * (width * 0.7);
        fireworks.push({
          x: startX,
          y: height + 10,
          vx: (Math.random() - 0.5) * 4,
          vy: -(11 + Math.random() * 7),
          targetY: height * 0.15 + Math.random() * (height * 0.4),
          color: stationColors[Math.floor(Math.random() * stationColors.length)],
          exploded: false
        });
      }

      // Update and draw Fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        fw.x += fw.vx;
        fw.y += fw.vy;

        // Draw rocket head & smoke trail
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = fw.color;
        ctx.shadowColor = fw.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        if (fw.y <= fw.targetY || fw.vy >= 0) {
          spawnExplosionBurst(fw.x, fw.y, 60);
          fireworks.splice(i, 1);
        }
      }

      // Update and draw Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 14;
        sw.alpha *= 0.94;
        sw.lineWidth = Math.max(1, sw.lineWidth * 0.96);

        if (sw.alpha <= 0.02 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.globalAlpha = sw.alpha;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw 3D rotating particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.vx *= 0.985; // Air friction
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > height + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        const radCos = Math.cos((p.rotation * Math.PI) / 90); // 3D spin illusion

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * Math.abs(radCos), p.size, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, (-p.size * Math.abs(radCos)) / 2, p.size, p.size * Math.abs(radCos));
        } else if (p.shape === 'coin') {
          // 3D Gold Coin with rim
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * Math.abs(radCos), p.size, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Sparkle Star
          ctx.beginPath();
          for (let s = 0; s < 4; s++) {
            ctx.rotate(Math.PI / 2);
            ctx.lineTo(p.size, 0);
            ctx.lineTo(p.size * 0.25, p.size * 0.25);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isOpen, chestState, stationColors, themeHex]);

  if (!isOpen) return null;

  const getRarityBadge = (rarity?: 'common' | 'rare' | 'epic' | 'legendary') => {
    switch (rarity) {
      case 'legendary':
        return { text: '🌟 مكافأة أسطورية (Legendary)', bg: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-yellow-950 border-amber-300 font-black shadow-lg shadow-amber-500/30' };
      case 'epic':
        return { text: '💜 مكافأة ملحمية (Epic)', bg: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-300 font-black shadow-lg shadow-purple-500/30' };
      case 'rare':
        return { text: '💙 مكافأة نادرة (Rare)', bg: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-blue-300 font-black shadow-lg shadow-blue-500/30' };
      default:
        return { text: '💚 مكافأة خاصة (Special)', bg: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-emerald-300 font-black shadow-lg shadow-emerald-500/30' };
    }
  };

  // 3D Card Interactive Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({ x: x * 18, y: -y * 18 });
  };

  const handleMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-700 overflow-hidden ${
      chestState === 'exploding' || chestState === 'revealed'
        ? `bg-slate-950/90 backdrop-blur-xl`
        : 'bg-black/80 backdrop-blur-md'
    } ${screenShaking ? 'animate-bounce' : ''}`}>

      {/* Dynamic Background Atmosphere Glow with Stage Color */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-60"
        style={{
          background: chestState === 'revealed' || chestState === 'exploding'
            ? `radial-gradient(circle at center, ${themeHex}44 0%, ${themeHex}11 45%, transparent 75%)`
            : undefined
        }}
      />

      {/* Background 3D Floating Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-40 transition-all duration-1000 animate-pulse"
          style={{ backgroundColor: themeHex }}
        />
        <div 
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30 transition-all duration-1000 animate-pulse"
          style={{ backgroundColor: stationColors[1] || themeHex }}
        />
      </div>

      {/* Full-Screen 3D Fireworks & Explosion Canvas */}
      {(chestState === 'exploding' || chestState === 'revealed') && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20 w-full h-full"
        />
      )}

      {/* Main Interactive Modal Card */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateY(${cardTilt.x}deg) rotateX(${cardTilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out'
        }}
        className={`w-full max-w-lg p-6 sm:p-8 rounded-[2.5rem] text-center text-white shadow-2xl relative z-30 overflow-hidden border-2 transition-all duration-500 ${
          chestState === 'revealed'
            ? 'bg-slate-900/95 border-yellow-400 shadow-yellow-500/20'
            : 'bg-slate-900 border-yellow-400/60'
        }`}
      >
        {/* Glowing Top Rainbow Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-amber-300 to-emerald-400 animate-pulse" 
          style={{
            background: `linear-gradient(90deg, ${stationColors.join(', ')})`
          }}
        />

        {/* 10-Second Countdown Celebration Bar (Active during celebration) */}
        {isTimerActive && (
          <div className="mb-4 bg-slate-800/90 border border-yellow-400/50 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs font-black shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-lg animate-spin">⏱️</span>
              <span className="text-yellow-300">
                العودة تلقائياً بعد {countdown} ثوانٍ...
              </span>
            </div>
            <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-1000 rounded-full"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
            <button
              onClick={handleFinishCelebration}
              className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 border border-yellow-400/40 px-2.5 py-1 rounded-lg text-[10px] active:scale-95 transition-all"
            >
              متابعة الآن ⏭️
            </button>
          </div>
        )}

        {/* ---------------- STATE 1: UNOPENED CHEST (المرحلة المغلقة بانتظار الفتح) ---------------- */}
        {chestState === 'closed' && mode !== 'penalty_notice' && (
          <div className="animate-scaleUp">
            {/* 3D Floating Stage Badge */}
            <div className="relative inline-block mb-3">
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl mx-auto transition-transform animate-bounce border-2 border-white/20"
                style={{
                  background: `linear-gradient(135deg, ${themeHex}, #0f172a)`
                }}
              >
                {activeStation.badgeIcon}
              </div>
              <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-yellow-400 text-yellow-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                المحطة #{stationNumber} من 10
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight mt-3">
              {activeStation.title}
            </h2>

            <p className="text-amber-300 font-black text-sm mb-4">
              🎯 الهدف المحقق: {activeStation.targetAmount.toLocaleString()} أوقية
            </p>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-6 text-gray-200 text-xs font-bold leading-relaxed shadow-inner">
              {activeStation.dopamineMessage}
            </div>

            {/* 3D Interactive Mysterious Chest Box Button */}
            <div 
              onClick={triggerExplosionAndReveal}
              className="bg-gradient-to-b from-amber-500/25 via-yellow-500/15 to-transparent border-2 border-yellow-400 rounded-3xl p-6 mb-5 cursor-pointer hover:scale-105 active:scale-95 transition-all group shadow-xl shadow-yellow-500/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="text-6xl mb-2 group-hover:scale-125 transition-transform animate-pulse drop-shadow-lg">
                🎁
              </div>

              <h3 className="text-lg font-black text-yellow-300 mb-1 flex items-center justify-center gap-1.5">
                <span>المس لفتح صندوق المفاجأة</span>
                <span>✨</span>
              </h3>

              <p className="text-[11px] font-bold text-gray-300">
                رسوم 3D، عبارات ملهمة، مفاجآت ونقاط عزيمة استثنائية تنتظرك!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-800/80 hover:bg-slate-700 text-gray-400 py-3 rounded-2xl font-bold text-xs transition-all border border-slate-700"
            >
              تأجيل الفتح والعودة للخزنة
            </button>
          </div>
        )}

        {/* ---------------- STATE 2: EXPLODING / REVEALED (الانفجار والمفاجأة والعبارة الملهمة) ---------------- */}
        {(chestState === 'exploding' || chestState === 'revealed') && mode !== 'penalty_notice' && (
          <div className="animate-scaleUp">
            {/* Rarity & Stage Header */}
            <div className="inline-block mb-3">
              <span className={`text-[11px] px-3.5 py-1 rounded-full border ${getRarityBadge(propCard?.rarity).bg}`}>
                {getRarityBadge(propCard?.rarity).text}
              </span>
            </div>

            {/* 3D Holographic Mystery Card */}
            <div 
              className="rounded-3xl p-5 sm:p-6 mb-5 shadow-2xl relative overflow-hidden text-right border-2 transition-all"
              style={{
                background: `linear-gradient(145deg, #1e293b, #0f172a)`,
                borderColor: themeHex,
                boxShadow: `0 20px 40px -15px ${themeHex}66`
              }}
            >
              {/* Holographic Shimmer Glare */}
              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none animate-pulse" />

              <div className="flex items-center gap-3.5 mb-4 relative z-10">
                <div 
                  className="w-14 h-14 rounded-2xl text-3xl flex items-center justify-center shadow-lg border border-white/20 shrink-0 animate-bounce"
                  style={{
                    backgroundColor: `${themeHex}33`
                  }}
                >
                  {propCard?.icon || activeStation.badgeIcon || '🌟'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-yellow-300 leading-tight">
                    {propCard?.title || activeStation.title}
                  </h3>
                  <span className="text-xs font-black text-emerald-400 block mt-0.5">
                    {propCard?.perkTitle || `وسام المحطة #${stationNumber}`}
                  </span>
                </div>
              </div>

              {/* Beautiful Inspiring Quote Box */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-4 text-xs sm:text-sm font-medium text-amber-100 leading-relaxed italic text-center relative shadow-inner">
                <span className="text-xl text-yellow-400 absolute top-1 right-2 opacity-50">“</span>
                <p className="px-3">
                  {propCard?.quote || '«كل أوقية تضعها في خزنتك هي خطوة حقيقية نحو استقلالك المالي وسيادتك الكاملة على حياتك ومستقبلك.»'}
                </p>
                <span className="text-xl text-yellow-400 absolute bottom-1 left-2 opacity-50">”</span>
              </div>

              {/* Surprise Perk & XP Reward */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-200 bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span>🎁</span>
                  <span>المفاجأة المكتسبة:</span>
                </span>
                <span className="text-yellow-300 font-black text-sm">
                  {propCard?.perkDesc || '+1,500 XP ونقاط عزيمة مضاعفة ⚡'}
                </span>
              </div>
            </div>

            {/* Next Stage Advancement Notice */}
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-3 mb-5 text-emerald-300 text-xs font-black flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>
                {stationNumber < 10
                  ? `أحسنت! تم الانتقال تلقائياً إلى المحطة التالية #${stationNumber + 1}`
                  : 'أنت الآن في قمة هرم العظماء بالوصول إلى المحطة الأخيرة! 🏆'}
              </span>
            </div>

            {/* Action Continue Button */}
            <button
              onClick={handleFinishCelebration}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-yellow-950 font-black py-4 rounded-2xl text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>استلام المكافأة والمتابعة للمرحلة التالية</span>
              <span>🚀</span>
            </button>
          </div>
        )}

        {/* ---------------- STATE 3: PENALTY NOTICE (ميثاق الالتزام والصدقة) ---------------- */}
        {mode === 'penalty_notice' && (
          <div className="animate-scaleUp">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/40 text-3xl shadow-lg mb-4">
              ⚖️
            </div>

            <span className="text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full uppercase tracking-wider block w-max mx-auto mb-2">
              تنبيه ميثاق الالتزام الذاتي
            </span>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              خصم تأديبي لصالح صندوق الصدقة 🛡️
            </h2>

            <p className="text-rose-300 font-bold text-sm mb-4">
              المبلغ المخصوم: {(penaltyAmount || 150).toLocaleString()} أوقية
            </p>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 text-gray-200 text-xs font-bold leading-relaxed text-right">
              <p className="mb-2">
                {penaltyReason || 'انقضت أكثر من 3 أيام دون أي حركة ادخار أو ترحيل أرباح للخزنة.'}
              </p>
              <p className="text-amber-300 text-[11px]">
                💡 تم تحويل المبلغ تلقائياً إلى <b>صندوق الصدقة والبركة</b> لتطهير المال وتجديد النية والعزيمة للعودة بقوة إلى الميدان!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-4 rounded-2xl text-sm shadow-xl active:scale-95 transition-all"
            >
              فهمت، والعودة للالتزام فوراً 💪
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
