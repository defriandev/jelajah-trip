import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Informasi Paket',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      subject: 'Informasi Paket',
      message: '',
    });
  };

  const contactItems = [
    {
      icon: Phone,
      title: 'Concierge Telepon',
      detail: '+62 812-3456-7890',
    },
    {
      icon: Mail,
      title: 'Private Inquiries',
      detail: 'curator@jelajahtrip.com',
    },
    {
      icon: MapPin,
      title: 'Atelier & Kantor',
      detail: 'Jl. Jend. Sudirman Kav. 52, SCBD, Jakarta Selatan',
    },
    {
      icon: Clock,
      title: 'Jam Layanan Kurator',
      detail: 'Senin–Sabtu, 08.00–20.00 WIB',
    },
  ];

  return (
    <div className="bg-[#FCFCFA] min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A059]">
            PRIVATE CONCIERGE & ATELIER
          </p>
          <h1 className="font-serif font-bold tracking-tight text-[#08261E] text-4xl sm:text-5xl">
            Konsultasikan Ekspedisi Impian Anda
          </h1>
          <p className="leading-relaxed text-[#08261E]/70 text-base sm:text-lg">
            Setiap perjalanan adalah mahakarya unik. Tim kurator spesialis Jelajah Trip siap merancang rencana perjalanan eksklusif yang disesuaikan dengan preferensi pribadi Anda.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Info Cards */}
            <div className="space-y-4">
              {contactItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#EAE7DF] rounded-3xl p-6 flex items-start gap-4 shadow-sm hover:border-[#C5A059]/40 transition-all duration-300"
                  >
                    <div className="bg-[#08261E]/5 p-3.5 rounded-2xl text-[#08261E] flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-[#C5A059]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#08261E]/50 mb-1">
                        {item.title}
                      </h4>
                      <p className="font-semibold text-[#08261E] text-base">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WhatsApp CTA Card */}
            <div className="bg-[#08261E] text-white rounded-3xl p-7 space-y-5 border border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3.5">
                <div className="bg-white/10 p-3 rounded-2xl text-[#C5A059]">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Direct VIP WhatsApp
                  </h3>
                  <p className="text-xs text-white/70">
                    Terhubung langsung dalam 5 menit dengan Dedicated Curator
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/6281234567890?text=Halo%20Jelajah%20Trip%2C%20saya%20tertarik%20untuk%20konsultasi%20paket%20wisata%20eksklusif"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#b08d4b] text-[#08261E] rounded-2xl px-6 py-4 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi Concierge WhatsApp
              </a>
            </div>
          </div>

          {/* Right Column (col-span-7) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#EAE7DF] rounded-3xl p-8 sm:p-10 space-y-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                  INQUIRY FORM
                </p>
                <h2 className="font-serif font-bold tracking-tight text-[#08261E] text-2xl sm:text-3xl mt-1">
                  Kirim Pesan Ke Kurator
                </h2>
                <p className="leading-relaxed text-[#08261E]/70 text-sm mt-1.5">
                  Isi formulir di bawah ini dan kami akan membalas pesan Anda dalam kurun waktu 1x24 jam dengan proposal kurasi awal.
                </p>
              </div>

              {submitted && (
                <div className="bg-emerald-50 border border-emerald-200 text-[#08261E] rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <p className="text-sm font-medium">
                    Pesan Anda berhasil diterima! Kurator Jelajah Trip akan segera menghubungi Anda.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#08261E] mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Raden Surya"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] rounded-2xl text-[#08261E] px-4 py-3.5 w-full text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#08261E] mb-1.5">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] rounded-2xl text-[#08261E] px-4 py-3.5 w-full text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#08261E] mb-1.5">
                    Tujuan Konsultasi
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] rounded-2xl text-[#08261E] px-4 py-3.5 w-full text-sm transition-colors"
                  >
                    <option value="Informasi Paket">Informasi Paket Eksklusif</option>
                    <option value="Pemesanan Private Group">Pemesanan Private Group / Charter</option>
                    <option value="Konsultasi Jadwal & Itinerary">Konsultasi Jadwal & Itinerary Khusus</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#08261E] mb-1.5">
                    Detail Pesan / Rencana Liburan
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Ceritakan destinasi impian, preferensi waktu keberangkatan, atau jumlah rombongan Anda..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] rounded-2xl text-[#08261E] px-4 py-3.5 w-full text-sm transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#08261E] hover:bg-[#08261E]/90 text-white rounded-2xl px-6 py-4 font-semibold text-sm transition-all shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4 text-[#C5A059]" />
                  Kirim Inquiry ke Kurator
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
