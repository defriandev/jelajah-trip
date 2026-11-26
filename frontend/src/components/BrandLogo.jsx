import React from 'react';
import { motion } from 'framer-motion';

export function BrandMark({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Deep Rainforest Gradient Background */}
        <linearGradient id="jtBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#08261E" />
          <stop offset="100%" stopColor="#0D3B2E" />
        </linearGradient>

        {/* Champagne Sand Gold Gradient */}
        <linearGradient id="jtGoldGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5E4BE" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9A7532" />
        </linearGradient>

        {/* Subtle Glow Filter */}
        <filter id="jtGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#08261E" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Rounded Luxury Squircle */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill="url(#jtBgGrad)"
        stroke="url(#jtGoldGrad)"
        strokeWidth="1.2"
        filter="url(#jtGlow)"
      />

      {/* Archipelago Horizon Arc (The Equator Curve) */}
      <path
        d="M 8 27 C 16 33, 32 33, 40 27"
        stroke="url(#jtGoldGrad)"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.45"
      />

      {/* Geometric Horizon Compass / Star of the Archipelago */}
      {/* North Cardinal Ray */}
      <path
        d="M 24 10 L 26 21 L 24 24 L 22 21 Z"
        fill="url(#jtGoldGrad)"
      />
      {/* South Cardinal Ray */}
      <path
        d="M 24 38 L 22 27 L 24 24 L 26 27 Z"
        fill="url(#jtGoldGrad)"
        opacity="0.9"
      />
      {/* East Cardinal Ray */}
      <path
        d="M 38 24 L 27 26 L 24 24 L 27 22 Z"
        fill="url(#jtGoldGrad)"
        opacity="0.95"
      />
      {/* West Cardinal Ray */}
      <path
        d="M 10 24 L 21 22 L 24 24 L 21 26 Z"
        fill="url(#jtGoldGrad)"
        opacity="0.95"
      />

      {/* Central Polished Diamond Ring */}
      <circle
        cx="24"
        cy="24"
        r="3.5"
        fill="#08261E"
        stroke="url(#jtGoldGrad)"
        strokeWidth="1.2"
      />
      <circle
        cx="24"
        cy="24"
        r="1.2"
        fill="#F5E4BE"
      />
    </svg>
  );
}

export default function BrandLogo({ inverted = false, showTagline = true, size = 'default' }) {
  const markSize = size === 'large' ? 48 : size === 'small' ? 32 : 40;

  return (
    <div className="flex items-center gap-3 group">
      <motion.div
        whileHover={{ scale: 1.04, rotate: 2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      >
        <BrandMark size={markSize} />
      </motion.div>

      <div className="flex flex-col">
        <div className="flex items-baseline tracking-tight">
          <span
            className={`font-serif text-xl font-bold tracking-[-0.02em] ${
              inverted ? 'text-white' : 'text-[#08261E]'
            }`}
          >
            Jelajah
          </span>
          <span className="font-sans font-light text-xl tracking-[0.06em] text-[#C5A059] ml-1">
            Trip
          </span>
        </div>

        {showTagline && (
          <span
            className={`text-[9px] uppercase tracking-[0.24em] font-medium -mt-0.5 ${
              inverted ? 'text-white/60' : 'text-[#64748B]'
            }`}
          >
            Archipelago Atelier
          </span>
        )}
      </div>
    </div>
  );
}
