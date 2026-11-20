import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppButton({ customMessage }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const phoneNumber = '6281234567890';
  const defaultText = customMessage || 'Halo Admin Jelajah Trip, saya ingin konsultasi mengenai paket wisata.';
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultText)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end flex-col">
      {/* Tooltip / Popup greeting */}
      {showTooltip && (
        <div className="mb-2 p-3 rounded-xl bg-white border border-[#E6E4DD] shadow-lg text-xs max-w-xs text-[#14211D] animate-in fade-in duration-200 relative">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-[#4A5550] hover:text-[#14211D]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="font-semibold text-[#0F4C3A] mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Customer Service Online
          </div>
          <p className="text-[11px] text-[#4A5550] leading-relaxed">
            Ada pertanyaan tentang destinasi atau jadwal? Chat kami langsung via WhatsApp.
          </p>
        </div>
      )}

      {/* Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        className="w-12 h-12 rounded-full bg-[#0F4C3A] hover:bg-[#0A3629] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label="Konsultasi WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white" />
      </a>
    </div>
  );
}
