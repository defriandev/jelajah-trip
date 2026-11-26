import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import PolicyModal from './PolicyModal';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const [policyModal, setPolicyModal] = useState({
    isOpen: false,
    tab: 'terms',
  });

  const openPolicy = (tab) => {
    setPolicyModal({ isOpen: true, tab });
  };

  const closePolicy = () => {
    setPolicyModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <footer className="bg-[#051813] text-[#FCFCFA] border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-16">
          {/* Main 4-Column Minimalist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14 pb-12 border-b border-white/10">
            {/* Column 1: Brand & Ringkasan */}
            <div className="space-y-4">
              <BrandLogo inverted showTagline />
              <p className="text-[12px] leading-relaxed text-[#A3B8B0]">
                Biro perjalanan kurasi ekspedisi all-inclusive kepulauan Indonesia berstandar tinggi dengan fokus pada konservasi alam dan keselamatan pelancong.
              </p>
              <div className="text-[11px] text-[#A3B8B0]/80 pt-1 space-y-1">
                <p>Yogyakarta, Indonesia • halo@jelajahtrip.com</p>
              </div>
            </div>

            {/* Column 2: Destinasi Unggulan */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059] mb-4">
                Destinasi Unggulan
              </p>
              <ul className="space-y-2.5 text-[#A3B8B0]">
                <li>
                  <Link to="/trips?destination=Raja%20Ampat" className="hover:text-white transition-colors">
                    Raja Ampat & Wayag
                  </Link>
                </li>
                <li>
                  <Link to="/trips?destination=Labuan%20Bajo" className="hover:text-white transition-colors">
                    Labuan Bajo Liveaboard
                  </Link>
                </li>
                <li>
                  <Link to="/trips?destination=Bromo" className="hover:text-white transition-colors">
                    Gunung Bromo Sunrise
                  </Link>
                </li>
                <li>
                  <Link to="/trips?destination=Nusa%20Penida" className="hover:text-white transition-colors">
                    Nusa Penida & Bali
                  </Link>
                </li>
                <li>
                  <Link to="/trips?destination=Danau%20Toba" className="hover:text-white transition-colors">
                    Danau Toba Heritage
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Navigasi & Bantuan */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059] mb-4">
                Navigasi & Bantuan
              </p>
              <ul className="space-y-2.5 text-[#A3B8B0]">
                <li>
                  <Link to="/trips" className="hover:text-white transition-colors">
                    Katalog Paket Wisata
                  </Link>
                </li>
                <li>
                  <Link to="/tracking" className="hover:text-white transition-colors">
                    Lacak Kode Booking
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition-colors">
                    Tanya Jawab (FAQ)
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Hubungi Kurator Wisata
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Masuk Akun / Panel Admin
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Sertifikasi & Kanal Pembayaran */}
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059] mb-3">
                  Legalitas & Standar
                </p>
                <div className="inline-flex items-center gap-2.5 text-[11px] text-[#E2ECE8] bg-white/5 px-3.5 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
                  <span>Kemenparekraf & ASITA Certified</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059] mb-2.5">
                  Kanal Pembayaran Resmi
                </p>
                <p className="text-[11px] text-[#A3B8B0] leading-relaxed font-mono">
                  BCA • Mandiri • BNI • BRI • QRIS • Visa / MasterCard
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Interactive Legal Policies */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A3B8B0]/70">
            <p>
              © {new Date().getFullYear()} PT Jelajah Trip Nusantara. Hak Cipta Dilindungi Undang-Undang.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[#A3B8B0]">
              <button
                type="button"
                onClick={() => openPolicy('terms')}
                className="hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Syarat & Ketentuan
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openPolicy('privacy')}
                className="hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Kebijakan Privasi
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openPolicy('safety')}
                className="hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Prosedur Keselamatan
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal Pop-up */}
      <PolicyModal
        isOpen={policyModal.isOpen}
        onClose={closePolicy}
        initialTab={policyModal.tab}
      />
    </>
  );
}
