import React from 'react';

/**
 * GymLogo - Iconic Heavy Dumbbell Fitness Brand Logo
 * Features a modern, high-precision calibrated dumbbell emblem in athletic fire-orange and polished steel,
 * paired with high-contrast athletic brand typography.
 *
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} className - Additional CSS classes
 * @param {boolean} showText - Whether to display brand text alongside the emblem
 * @param {string} brandName - Brand text ('GYMPRO' or 'GYM')
 */
export default function GymLogo({
  size = 'md',
  className = '',
  showText = true,
  brandName = 'GYMPRO',
}) {
  const sizeMap = {
    sm: {
      box: 'w-7 h-7',
      svg: 24,
      text: 'text-lg',
      subtext: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      box: 'w-9 h-9',
      svg: 32,
      text: 'text-xl',
      subtext: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      box: 'w-12 h-12',
      svg: 42,
      text: 'text-2xl sm:text-3xl',
      subtext: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      box: 'w-16 h-16',
      svg: 56,
      text: 'text-4xl sm:text-5xl',
      subtext: 'text-sm',
      gap: 'gap-3.5',
    },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center ${current.gap} select-none group ${className}`}>
      {/* Heavy Dumbbell Emblem Container */}
      <div
        className={`relative ${current.box} rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent border border-orange-500/30 flex items-center justify-center p-1 shadow-lg shadow-orange-500/10 transition-transform duration-200 group-hover:scale-105 shrink-0`}
      >
        <svg
          width={current.svg}
          height={current.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(234,88,12,0.4)]"
        >
          <defs>
            <linearGradient id={`dbGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id={`dbSteel-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Athletic 38-degree tilted Dumbbell */}
          <g transform="rotate(-38 50 50)">
            {/* Center Bar (Grip) */}
            <rect
              x="33"
              y="44.5"
              width="34"
              height="11"
              rx="4"
              fill={`url(#dbSteel-${size})`}
            />

            {/* Knurling Grid Texture */}
            <g opacity="0.35" stroke="#0a0a0c" strokeWidth="1.2">
              <line x1="40" y1="45" x2="40" y2="55" />
              <line x1="44" y1="45" x2="44" y2="55" />
              <line x1="48" y1="45" x2="48" y2="55" />
              <line x1="52" y1="45" x2="52" y2="55" />
              <line x1="56" y1="45" x2="56" y2="55" />
              <line x1="60" y1="45" x2="60" y2="55" />
            </g>

            {/* Handle Polished Specular Highlight */}
            <line
              x1="35"
              y1="46.5"
              x2="65"
              y2="46.5"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* --- LEFT WEIGHT HEAD --- */}
            {/* Left Collar Stop */}
            <rect x="31" y="42" width="4" height="16" rx="2" fill={`url(#dbGrad-${size})`} />
            <rect x="31" y="42" width="2" height="16" fill="#ffffff" opacity="0.3" />

            {/* Left Inner Plate */}
            <rect
              x="21"
              y="28"
              width="10"
              height="44"
              rx="3.5"
              fill={`url(#dbGrad-${size})`}
            />
            {/* Left Inner Plate Rim Shadow */}
            <rect x="29" y="29" width="2" height="42" rx="1" fill="#000000" opacity="0.25" />
            <line x1="22.5" y1="30" x2="22.5" y2="70" stroke="#ffffff" strokeWidth="1" opacity="0.4" strokeLinecap="round" />

            {/* Left Outer Main Plate */}
            <rect
              x="8"
              y="18"
              width="13"
              height="64"
              rx="5"
              fill={`url(#dbGrad-${size})`}
            />
            {/* Outer Plate Bevel / Inset Groove */}
            <rect
              x="10.5"
              y="21"
              width="8"
              height="58"
              rx="3.5"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.25"
              fill="none"
            />
            {/* Plate Highlight */}
            <line x1="9.5" y1="20" x2="9.5" y2="80" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />

            {/* Left End Cap Hub */}
            <rect x="4.5" y="43" width="4.5" height="14" rx="2" fill={`url(#dbSteel-${size})`} />
            <circle cx="6.5" cy="50" r="1.5" fill="#ffffff" opacity="0.8" />


            {/* --- RIGHT WEIGHT HEAD --- */}
            {/* Right Collar Stop */}
            <rect x="65" y="42" width="4" height="16" rx="2" fill={`url(#dbGrad-${size})`} />
            <rect x="65" y="42" width="2" height="16" fill="#ffffff" opacity="0.3" />

            {/* Right Inner Plate */}
            <rect
              x="69"
              y="28"
              width="10"
              height="44"
              rx="3.5"
              fill={`url(#dbGrad-${size})`}
            />
            {/* Right Inner Plate Rim Shadow */}
            <rect x="69" y="29" width="2" height="42" rx="1" fill="#000000" opacity="0.25" />
            <line x1="77.5" y1="30" x2="77.5" y2="70" stroke="#ffffff" strokeWidth="1" opacity="0.4" strokeLinecap="round" />

            {/* Right Outer Main Plate */}
            <rect
              x="79"
              y="18"
              width="13"
              height="64"
              rx="5"
              fill={`url(#dbGrad-${size})`}
            />
            {/* Outer Plate Bevel / Inset Groove */}
            <rect
              x="81.5"
              y="21"
              width="8"
              height="58"
              rx="3.5"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.25"
              fill="none"
            />
            {/* Plate Highlight */}
            <line x1="80.5" y1="20" x2="80.5" y2="80" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />

            {/* Right End Cap Hub */}
            <rect x="91" y="43" width="4.5" height="14" rx="2" fill={`url(#dbSteel-${size})`} />
            <circle cx="93" cy="50" r="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`${current.text} font-black tracking-tight flex items-center`}>
            {brandName === 'GYM' ? (
              <span className="text-white">GYM</span>
            ) : brandName === 'GYMPRO' ? (
              <>
                <span className="text-white">GYM</span>
                <span className="text-orange-500 ml-0.5">PRO</span>
              </>
            ) : (
              <span className="text-white">{brandName}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}