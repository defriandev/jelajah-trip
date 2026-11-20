import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Shield,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  Compass,
} from 'lucide-react';

export default function PolicyModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'terms', label: 'Syarat & Ketentuan', icon: FileText },
    { id: 'privacy', label: 'Kebijakan Privasi', icon: Shield },
    { id: 'safety', label: 'Prosedur Keselamatan', icon: HeartPulse },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl border border-[#E6E4DD] shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E6E4DD] bg-[#FAF9F6]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F4C3A] text-white flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#14211D] tracking-tight">
                  Informasi Hukum & Kebijakan
                </h3>
                <p className="text-xs text-[#4A5550]">
                  Standar operasional resmi PT Jelajah Trip Nusantara
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#4A5550] hover:text-[#14211D] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EBE9E2] rounded-xl text-xs font-semibold">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0F4C3A] shadow-xs'
                      : 'text-[#4A5550] hover:text-[#14211D]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#2D3732] leading-relaxed">
          {/* TAB 1: Syarat & Ketentuan */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-[#E6E4DD] pb-3">
                <h4 className="font-display font-bold text-base text-[#14211D]">
                  Syarat & Ketentuan Layanan Wisata
                </h4>
                <p className="text-xs text-[#4A5550] mt-0.5">
                  Berlaku untuk seluruh reservasi paket wisata melalui platform Jelajah Trip.
                </p>
              </div>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EBF4F0] text-[#0F4C3A] text-xs flex items-center justify-center font-bold">1</span>
                  Pemesanan & Konfirmasi Tiket
                </h5>
                <p className="text-xs text-[#4A5550] pl-7">
                  Pemesanan dianggap sah setelah data pelanggan lengkap dan pembayaran terverifikasi oleh sistem atau admin kami. Setiap pemesan akan menerima kode booking unik 8-karakter yang dapat digunakan untuk melacak tahapan pesanan.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EBF4F0] text-[#0F4C3A] text-xs flex items-center justify-center font-bold">2</span>
                  Kebijakan Pembatalan & Pengembalian Dana (Refund)
                </h5>
                <ul className="text-xs text-[#4A5550] pl-7 space-y-1.5 list-disc list-inside">
                  <li><strong>H-14 sebelum keberangkatan:</strong> Pengembalian dana 85% dari total biaya (potongan administrasi 15%).</li>
                  <li><strong>H-7 s/d H-13:</strong> Pengembalian dana 50% dari total biaya.</li>
                  <li><strong>Kurang dari H-7:</strong> Dana tidak dapat dikembalikan karena kuota akomodasi dan transportasi lokal telah diamankan.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EBF4F0] text-[#0F4C3A] text-xs flex items-center justify-center font-bold">3</span>
                  Perubahan Jadwal (Reschedule)
                </h5>
                <p className="text-xs text-[#4A5550] pl-7">
                  Pengajuan perubahan tanggal perjalanan dapat diajukan maksimal H-7 sebelum jadwal semula tanpa biaya penalti, selama kuota tanggal tujuan baru masih tersedia.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EBF4F0] text-[#0F4C3A] text-xs flex items-center justify-center font-bold">4</span>
                  Keadaan Kahar (Force Majeure)
                </h5>
                <p className="text-xs text-[#4A5550] pl-7">
                  Jika terjadi cuaca ekstrem, gelombang tinggi, penutupan resmi Taman Nasional oleh Balai Konservasi, atau bencana alam, Jelajah Trip berhak mengubah rute demi keselamatan, menjadwalkan ulang, atau mengembalikan dana sesuai kesepakatan bersama.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: Kebijakan Privasi */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-[#E6E4DD] pb-3">
                <h4 className="font-display font-bold text-base text-[#14211D]">
                  Kebijakan Privasi & Perlindungan Data
                </h4>
                <p className="text-xs text-[#4A5550] mt-0.5">
                  Komitmen kami menjaga keamanan data pribadi seluruh wisatawan Jelajah Trip.
                </p>
              </div>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                  Informasi yang Kami Kumpulkan
                </h5>
                <p className="text-xs text-[#4A5550]">
                  Kami hanya mengumpulkan informasi yang esensial untuk reservasi perjalanan: nama lengkap, alamat email aktif, nomor telepon/WhatsApp, dan tanggal keberangkatan. Data ini digunakan untuk manifest perjalanan resmi dan asuransi.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                  Keamanan & Enkripsi Standar Industri
                </h5>
                <p className="text-xs text-[#4A5550]">
                  Kata sandi pengguna dienkripsi menggunakan algoritma *bcrypt* dengan cost factor tinggi. Sesi login diamankan menggunakan token JWT di cookie <code>HttpOnly</code> dan <code>SameSite</code> yang kebal dari pencurian skrip jahat (XSS).
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                  Tidak Ada Penjualan Data ke Pihak Ketiga
                </h5>
                <p className="text-xs text-[#4A5550]">
                  Data Anda tidak akan pernah dijual, disewakan, atau dibagikan kepada pihak pengiklan mana pun. Informasi hanya diteruskan ke mitra pemandu lokal dan pihak otoritas pengelola kawasan konservasi strictly untuk perizinan masuk.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                  Hak Kendali Data Pengguna
                </h5>
                <p className="text-xs text-[#4A5550]">
                  Anda memiliki hak penuh untuk memperbarui profil akun Anda kapan saja, atau mengajukan permohonan penghapusan riwayat data akun dengan menghubungi tim kami di <code>halo@jelajahtrip.com</code>.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: Prosedur Keselamatan */}
          {activeTab === 'safety' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-[#E6E4DD] pb-3">
                <h4 className="font-display font-bold text-base text-[#14211D]">
                  Prosedur Keselamatan & Tanggap Darurat
                </h4>
                <p className="text-xs text-[#4A5550] mt-0.5">
                  Standar keamanan Zero Accident berstandar Kemenparekraf & ASITA.
                </p>
              </div>

              <div className="bg-[#EBF4F0] border border-[#C5DFD6] rounded-xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#0F4C3A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#14211D] leading-relaxed">
                  <p className="font-semibold text-[#0F4C3A]">Keselamatan Pelancong Adalah Prioritas Utama</p>
                  <p className="text-[#4A5550] mt-0.5">
                    Setiap rute perjalanan telah melalui analisis risiko medan, dilengkapi pemandu bersertifikasi, serta protokol evakuasi medis darurat.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D]">1. Pemandu Berlisensi Resmi (Certified Guides)</h5>
                <p className="text-xs text-[#4A5550]">
                  Semua pemandu lapangan Jelajah Trip telah tersertifikasi HPI (Himpunan Pramuwisata Indonesia) dan menguasai teknik pertolongan pertama (First Aid / CPR).
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D]">2. Alat Pelindung Diri (APD) Wajib</h5>
                <p className="text-xs text-[#4A5550]">
                  Penggunaan jaket pelampung (life jacket) bersertifikat SOLAS wajib selama berada di kapal liveaboard dan kegiatan perairan. Pada wisata penjelajahan gua atau canyoning, helm pelindung berstandar CE disediakan tanpa biaya tambahan.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D]">3. Kotak Medis P3K & Perlindungan Asuransi</h5>
                <p className="text-xs text-[#4A5550]">
                  Setiap armada transportasi dan pemandu membawa perlengkapan medis P3K lengkap serta tabung oksigen portabel untuk rute dataran tinggi (seperti Bromo/Semeru). Seluruh peserta terlindungi oleh asuransi perjalanan.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-semibold text-[#14211D]">4. Etika Konservasi Alam (Leave No Trace)</h5>
                <p className="text-xs text-[#4A5550]">
                  Peserta wajib mematuhi etika menjaga kelestarian alam: dilarang membuang sampah sembarangan di laut/gunung, dilarang menyentuh terumbu karang saat snorkeling, dan dilarang memberi makan satwa liar endemik.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-[#E6E4DD] bg-[#FAF9F6] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#4A5550]">
            Terakhir diperbarui: Januari 2026
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0F4C3A] hover:bg-[#0A3629] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
}
