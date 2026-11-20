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
      title: 'Telepon',
      detail: '+62 812-3456-7890',
    },
    {
      icon: Mail,
      title: 'Email',
      detail: 'hello@jelajahtrip.com',
    },
    {
      icon: MapPin,
      title: 'Alamat',
      detail: 'Jl. Sudirman No. 123, Jakarta Selatan',
    },
    {
      icon: Clock,
      title: 'Jam Operasional',
      detail: 'Senin–Sabtu, 08.00–17.00 WIB',
    },
  ];

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
            HUBUNGI KAMI
          </p>
          <h1 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-4xl sm:text-5xl">
            Siap Membantu Perjalanan Anda
          </h1>
          <p className="leading-[1.65] text-[#4A5550]">
            Punya pertanyaan mengenai paket wisata atau butuh rekomendasi khusus? Tim konsultan perjalanan kami siap melayani dan memberikan solusi terbaik untuk liburan Anda.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Info Cards */}
            <div className="space-y-4">
              {contactItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#E6E4DD] rounded-2xl p-6 flex items-start gap-4"
                  >
                    <div className="bg-[#F4F2EC] p-3 rounded-xl text-[#0F4C3A] flex-shrink-0">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A5550] mb-1">
                        {item.title}
                      </h4>
                      <p className="font-semibold text-[#14211D] text-base">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WhatsApp CTA Card */}
            <div className="bg-[#0F4C3A] text-white rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Konsultasi Cepat
                  </h3>
                  <p className="text-xs text-white/80">
                    Respon langsung dari tim kami via WhatsApp
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20paket%20wisata"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0F4C3A] hover:bg-[#FAF9F6] rounded-xl px-6 py-3.5 font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chat WhatsApp Sekarang
              </a>
            </div>
          </div>

          {/* Right Column (col-span-7) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E6E4DD] rounded-2xl p-8 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
                  KIRIM PESAN
                </p>
                <h2 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-2xl sm:text-3xl mt-1">
                  Ada Pertanyaan? Tulis di Sini
                </h2>
                <p className="leading-[1.65] text-[#4A5550] text-sm mt-1">
                  Isi formulir di bawah ini dan kami akan membalas pesan Anda dalam kurun waktu 1x24 jam.
                </p>
              </div>

              {submitted && (
                <div className="bg-emerald-50 border border-emerald-200 text-[#0F4C3A] rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Pesan Anda berhasil dikirim! Tim Jelajah Trip akan segera menghubungi Anda.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#14211D] mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#14211D] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#14211D] mb-1.5">
                    Subjek
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                  >
                    <option value="Informasi Paket">Informasi Paket</option>
                    <option value="Pemesanan">Pemesanan</option>
                    <option value="Komplain">Komplain</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#14211D] mb-1.5">
                    Pesan
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Tuliskan pertanyaan atau kebutuhan paket wisata Anda..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3.5 font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
