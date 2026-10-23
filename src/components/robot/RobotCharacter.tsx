import React, { useState, useEffect, useRef } from 'react';
import { RobotEmotion } from '../../types/index.js';
import { soundEffects } from '../../utils/audioEffects.js';
import { Mic, MicOff } from 'lucide-react';

interface RobotCharacterProps {
  emotion: RobotEmotion;
  isSpeaking?: boolean;
  isListening?: boolean;
  onTap?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showMicButton?: boolean;
  isMicUnmuted?: boolean;
  onToggleMic?: () => void;
}

export const RobotCharacter: React.FC<RobotCharacterProps> = ({
  emotion = 'idle',
  isSpeaking = false,
  isListening = false,
  onTap,
  size = 'md',
  showMicButton = true,
  isMicUnmuted = false,
  onToggleMic,
}) => {
  const [blink, setBlink] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Eye gaze tracking towards cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Smooth subtle gaze within screen bounds
      setEyeOffset({
        x: Math.max(-10, Math.min(10, deltaX * 12)),
        y: Math.max(-8, Math.min(8, deltaY * 9)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleClick = () => {
    soundEffects.unlockAudio();
    soundEffects.playChirp();
    setWiggle(true);
    setTimeout(() => setWiggle(false), 500);
    if (onTap) onTap();
  };

  const dims = {
    sm: { width: 160, height: 110 },
    md: { width: 240, height: 160 },
    lg: { width: 320, height: 210 },
  }[size];

  // Primary eye glow color based on emotion
  const getGlowColor = () => {
    switch (emotion) {
      case 'thinking':
        return '#38BDF8'; // Sky blue
      case 'celebrating':
        return '#34D399'; // Emerald
      case 'listening':
        return '#FBBF24'; // Warm amber
      case 'explaining':
      case 'speaking':
        return '#22D3EE'; // Bright cyan
      case 'curious':
        return '#C084FC'; // Violet
      case 'encouraging':
        return '#F472B6'; // Pink
      default:
        return '#38BDF8';
    }
  };

  const glowColor = getGlowColor();

  return (
    <div className="flex flex-col items-center">
      {/* Robot Face Screen (Strictly OLED Visor with JUST Eye & Mouth) */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`relative inline-flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-300 ${
          wiggle ? 'scale-105' : ''
        }`}
        style={{ width: dims.width, height: dims.height }}
        title="Aero Robot Face (Eye & Mouth)"
      >
        <svg
          viewBox="0 0 260 170"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
        >
          <defs>
            {/* Visor outer gradient */}
            <linearGradient id="visorBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Visor glass glare reflection */}
            <linearGradient id="glassGlare" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
              <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Eye glow filter */}
            <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Bezel (Sleek aerodynamic curved visor casing) */}
          <rect
            x="4"
            y="4"
            width="252"
            height="162"
            rx="36"
            fill="url(#visorBezelGrad)"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Inner Visor Display Screen (Deep OLED pitch black #020617) */}
          <rect
            x="12"
            y="12"
            width="236"
            height="146"
            rx="28"
            fill="#020617"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Subtle curved glass reflection overlay */}
          <path
            d="M 16 36 Q 130 16 244 36 L 244 80 Q 130 60 16 80 Z"
            fill="url(#glassGlare)"
            opacity="0.7"
          />

          {/* Top Status LED dot */}
          <circle
            cx="130"
            cy="22"
            r="3"
            fill={isListening ? '#FBBF24' : isSpeaking ? '#34D399' : '#38BDF8'}
            className={isListening || isSpeaking ? 'animate-pulse' : ''}
          />

          {/* ================= EYES ================= */}
          <g id="robotEyes">
            {blink ? (
              // Blinking: Sleek thin horizontal glow line
              <g stroke={glowColor} strokeWidth="4" strokeLinecap="round" filter="url(#eyeGlow)">
                <line x1={72 + eyeOffset.x} y1={68 + eyeOffset.y} x2={104 + eyeOffset.x} y2={68 + eyeOffset.y} />
                <line x1={156 + eyeOffset.x} y1={68 + eyeOffset.y} x2={188 + eyeOffset.x} y2={68 + eyeOffset.y} />
              </g>
            ) : emotion === 'celebrating' ? (
              // Happy / Celebrating: Upward joyful arcs ^^
              <g
                stroke={glowColor}
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                filter="url(#eyeGlow)"
              >
                <path d={`M ${72 + eyeOffset.x} ${74 + eyeOffset.y} Q ${88 + eyeOffset.x} ${54 + eyeOffset.y} ${104 + eyeOffset.x} ${74 + eyeOffset.y}`} />
                <path d={`M ${156 + eyeOffset.x} ${74 + eyeOffset.y} Q ${172 + eyeOffset.x} ${54 + eyeOffset.y} ${188 + eyeOffset.x} ${74 + eyeOffset.y}`} />
              </g>
            ) : emotion === 'thinking' ? (
              // Thinking: Concentric holographic rings
              <g filter="url(#eyeGlow)">
                <circle
                  cx={88 + eyeOffset.x}
                  cy={68 + eyeOffset.y}
                  r="18"
                  stroke={glowColor}
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="animate-spin"
                />
                <circle cx={88 + eyeOffset.x} cy={68 + eyeOffset.y} r="6" fill={glowColor} />
                <circle
                  cx={172 + eyeOffset.x}
                  cy={68 + eyeOffset.y}
                  r="18"
                  stroke={glowColor}
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="animate-spin"
                />
                <circle cx={172 + eyeOffset.x} cy={68 + eyeOffset.y} r="6" fill={glowColor} />
              </g>
            ) : emotion === 'curious' ? (
              // Curious asymmetric gaze
              <g fill={glowColor} filter="url(#eyeGlow)">
                <ellipse cx={88 + eyeOffset.x} cy={64 + eyeOffset.y} rx="16" ry="19" />
                <circle cx={92 + eyeOffset.x} cy={60 + eyeOffset.y} r="5" fill="#FFFFFF" />
                <ellipse cx={172 + eyeOffset.x} cy={72 + eyeOffset.y} rx="14" ry="14" />
                <circle cx={175 + eyeOffset.x} cy={70 + eyeOffset.y} r="4" fill="#FFFFFF" />
              </g>
            ) : (
              // Expressive Glowing Rounded Digital Eyes with Gaze Tracking
              <g fill={glowColor} filter="url(#eyeGlow)">
                <ellipse cx={88 + eyeOffset.x} cy={68 + eyeOffset.y} rx="16" ry="18" />
                <circle cx={92 + eyeOffset.x} cy={63 + eyeOffset.y} r="5" fill="#FFFFFF" />
                <ellipse cx={172 + eyeOffset.x} cy={68 + eyeOffset.y} rx="16" ry="18" />
                <circle cx={176 + eyeOffset.x} cy={63 + eyeOffset.y} r="5" fill="#FFFFFF" />
              </g>
            )}
          </g>

          {/* ================= MOUTH ================= */}
          <g id="robotMouth">
            {isSpeaking ? (
              // Active Voice Equalizer Mouth Waveform (bars bounce dynamically when speaking)
              <g fill={glowColor} opacity="0.95" filter="url(#eyeGlow)">
                <rect x="96" y="118" width="5" height="14" rx="2.5" className="animate-pulse" />
                <rect x="106" y="112" width="5" height="24" rx="2.5" />
                <rect x="116" y="106" width="5" height="34" rx="2.5" className="animate-pulse" />
                <rect x="126" y="103" width="5" height="38" rx="2.5" />
                <rect x="136" y="106" width="5" height="34" rx="2.5" className="animate-pulse" />
                <rect x="146" y="112" width="5" height="24" rx="2.5" />
                <rect x="156" y="118" width="5" height="14" rx="2.5" className="animate-pulse" />
              </g>
            ) : emotion === 'listening' ? (
              // Listening: Responsive sound reception waveform
              <g stroke={glowColor} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" filter="url(#eyeGlow)">
                <path d="M 100 124 Q 130 110 160 124" />
              </g>
            ) : (
              // Friendly calm smile
              <path
                d="M 104 122 Q 130 138 156 122"
                stroke={glowColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
                filter="url(#eyeGlow)"
              />
            )}
          </g>
        </svg>
      </div>

      {/* ================= MIC SYMBOL JUST BELOW THE ROBOT FACE ITSELF ================= */}
      {showMicButton && (
        <div className="mt-3.5 flex flex-col items-center gap-2 w-full max-w-[280px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleMic) onToggleMic();
            }}
            aria-label={isMicUnmuted ? 'Mute microphone' : 'Unmute microphone'}
            title={isMicUnmuted ? 'Microphone is unmuted (live) — Click to mute' : 'Microphone is muted — Click to unmute'}
            className={`group relative flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg w-full ${
              isMicUnmuted
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold ring-4 ring-emerald-400/30 shadow-emerald-500/40 animate-pulse'
                : 'bg-slate-950/90 hover:bg-slate-900 text-slate-200 border-2 border-rose-500/50 hover:border-rose-400 shadow-slate-950/80'
            }`}
          >
            {/* Dynamic ping ripple when unmuted */}
            {isMicUnmuted && (
              <span className="absolute -inset-1 rounded-2xl bg-emerald-400/30 animate-ping pointer-events-none" />
            )}

            <div
              className={`p-1.5 rounded-xl flex items-center justify-center transition-colors ${
                isMicUnmuted ? 'bg-slate-950 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isMicUnmuted ? (
                <Mic className="w-5 h-5 text-emerald-400" />
              ) : (
                <MicOff className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className="flex flex-col text-left leading-tight">
              <span className="font-mono text-xs font-bold tracking-wide">
                {isMicUnmuted ? 'MIC IS UNMUTED' : 'MIC IS MUTED'}
              </span>
              <span className={`text-[10px] ${isMicUnmuted ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                {isMicUnmuted ? 'Click or press M to mute' : 'Click or press M to talk'}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
