import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck } from 'lucide-react';
import PolicyModal from './PolicyModal';

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
      <footer className="bg-[#0C1713] text-[#FAF9F6] border-t border-[#1C2C25] text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-14">
          {/* Main 4-Column Minimalist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-10 border-b border-[#1C2C25]">
            {/* Column 1: Brand & Ringkasan */}
            <div className="space-y-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F4C3A] flex items-center justify-center text-white">
                  <Compass className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-base font-extrabold tracking-[-0.03em] font-display uppercase text-white">
                  JELAJAH<span className="text-[#D97736]">TRIP</span>
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#9AA8A1]">
                Platform reservasi paket wisata terkurasi di Indonesia. Menghadirkan petualangan all-inclusive berstandar tinggi dengan fokus pada konservasi dan keselamatan.
              </p>
              <div className="text-[11px] text-[#9AA8A1] pt-1 space-y-1">
                <p>Yogyakarta, Indonesia • halo@jelajahtrip.com</p>
              </div>
            </div>

            {/* Column 2: Destinasi Unggulan */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-3.5">
                Destinasi Unggulan
              </p>
              <ul className="space-y-2 text-[#9AA8A1]">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-3.5">
                Navigasi & Bantuan
              </p>
              <ul className="space-y-2 text-[#9AA8A1]">
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
                    Hubungi Agen Wisata
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Masuk Akun / Admin
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Sertifikasi & Kanal Pembayaran */}
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-2.5">
                  Legalitas & Standar
                </p>
                <div className="inline-flex items-center gap-2 text-[11px] text-[#C4D0CA] bg-[#142620] px-3 py-1.5 rounded-lg border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kemenparekraf & ASITA Certified</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-2">
                  Pembayaran Terverifikasi
                </p>
                <p className="text-[11px] text-[#9AA8A1] leading-relaxed">
                  BCA • Mandiri • BNI • BRI • QRIS • Visa / MasterCard
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Interactive Legal Policies */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3.5 text-[11px] text-[#7E8D86]">
            <p>
              © {new Date().getFullYear()} PT Jelajah Trip Nusantara. Hak Cipta Dilindungi Undang-Undang.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[#9AA8A1]">
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
