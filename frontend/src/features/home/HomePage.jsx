import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass, ArrowUpRight, ShieldCheck, Star, Users, MapPin,
  Calendar, CheckCircle2, Search, Award, Check, MessageCircle, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripService } from '../../services/api';
import TripCard from '../trip/TripCard';

export default function HomePage() {
  const [featuredTrips, setFeaturedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // Search Bar Form States
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchPax, setSearchPax] = useState(2);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await tripService.getTrips();
        if (res.success && res.data) {
          setFeaturedTrips(res.data);
        }
      } catch (err) {
        console.error('Failed to load trips for homepage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchDestination) query.set('destination', searchDestination);
    if (searchDate) query.set('date', searchDate);
    navigate(`/trips?${query.toString()}`);
  };

  const filteredTrips = featuredTrips.filter((trip) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'laut') {
      return (
        trip.destination.toLowerCase().includes('raja ampat') ||
        trip.destination.toLowerCase().includes('labuan bajo') ||
        trip.destination.toLowerCase().includes('penida')
      );
    }
    if (activeCategory === 'gunung') {
      return trip.destination.toLowerCase().includes('bromo');
    }
    if (activeCategory === 'budaya') {
      return (
        trip.destination.toLowerCase().includes('yogyakarta') ||
        trip.destination.toLowerCase().includes('toba')
      );
    }
    return true;
  });

  const categoryTabs = [
    { id: 'all', label: 'Semua Destinasi' },
    { id: 'laut', label: 'Pantai & Sailing' },
    { id: 'gunung', label: 'Kaldera & Sunrise' },
    { id: 'budaya', label: 'Heritage & Budaya' },
  ];

  return (
    <div className="bg-[#FAF9F6] text-[#14211D] overflow-x-hidden">
      {/* 1. HERO SECTION (12-Column Swiss Grid + Framer Motion) */}
      <section className="relative pt-8 pb-12 lg:pt-16 lg:pb-20 border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (Editorial Copy) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-6 space-y-6"
            >
              {/* Eyebrow */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]"
              >
                Kurasi Perjalanan Nusantara • Edisi 2026
              </motion.p>

              {/* H1 Hero Title */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl md:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#14211D] font-display"
              >
                Kemurnian Alam Indonesia, Disusun Sempurna.
              </motion.h1>

              {/* Body Copy */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-base md:text-lg leading-[1.65] text-[#4A5550] max-w-[54ch]"
              >
                Menghubungkan Anda dengan kepulauan terjauh, puncak kaldera fajar, dan tradisi nusantara lewat perjalanan terkurasi dengan jaminan keberangkatan pasti serta pemandu berlisensi resmi.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/trips"
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white bg-[#0F4C3A] hover:bg-[#0A3629] transition-all shadow-sm"
                  >
                    <span>Jelajahi Paket Wisata</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/tracking"
                    className="inline-flex items-center gap-2 border border-[#14211D]/20 bg-transparent hover:bg-[#14211D]/5 text-[#14211D] rounded-xl px-6 py-3.5 font-semibold transition-colors"
                  >
                    <Search className="w-4 h-4 text-[#4A5550]" />
                    <span>Lacak Pesanan</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Social Proof & Metrics */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="pt-4 flex items-center gap-6 border-t border-[#E6E4DD]"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-[#D97736]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D97736]" />
                    ))}
                  </div>
                  <span className="font-bold text-[#14211D] tabular-nums text-sm">4.9/5.0</span>
                </div>
                <div className="h-4 w-px bg-[#E6E4DD]" />
                <div className="text-xs text-[#4A5550]">
                  <strong className="text-[#14211D] font-semibold tabular-nums">3.200+</strong> Pelancong Terverifikasi
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column (Visual Showcase) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-2xl overflow-hidden border border-[#E6E4DD] bg-[#F4F2EC] shadow-[0_20px_48px_rgba(20,33,29,0.08)] max-h-[520px] aspect-[4/3] sm:aspect-[4/5] lg:aspect-[4/3] group">
                <img
                  src="https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80"
                  alt="Wayag Islands Raja Ampat"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#14211D]/75 via-transparent to-transparent pointer-events-none" />

                {/* Contained Frosted Glass Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  whileHover={{ y: -3 }}
                  className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md text-[#14211D] border border-[#E6E4DD] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-transform"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A5550] block">
                      Garansi Keberangkatan
                    </span>
                    <strong className="text-xs font-semibold text-[#14211D]">
                      100% Pasti Berangkat Tanpa Min. Kuota
                    </strong>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* FLOATING SEARCH BAR */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12 pt-2"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white border border-[#E6E4DD] rounded-2xl p-3 sm:p-4 shadow-[0_10px_35px_rgba(20,33,29,0.06)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
            >
              {/* Destinasi */}
              <div className="lg:col-span-4 p-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] focus-within:border-[#0F4C3A] transition-colors">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A5550] mb-0.5">
                  Destinasi
                </label>
                <select
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#14211D] focus:outline-none cursor-pointer"
                >
                  <option value="">Semua Destinasi Indonesia</option>
                  <option value="Raja Ampat">Raja Ampat, Papua Barat Daya</option>
                  <option value="Labuan Bajo">Labuan Bajo, NTT</option>
                  <option value="Bromo">Gunung Bromo, Jawa Timur</option>
                  <option value="Nusa Penida">Nusa Penida, Bali</option>
                  <option value="Danau Toba">Danau Toba, Sumatera Utara</option>
                  <option value="Yogyakarta">DI Yogyakarta</option>
                </select>
              </div>

              {/* Tanggal */}
              <div className="lg:col-span-3 p-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] focus-within:border-[#0F4C3A] transition-colors">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A5550] mb-0.5">
                  Tanggal Berangkat
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#14211D] focus:outline-none cursor-pointer"
                />
              </div>

              {/* Peserta */}
              <div className="lg:col-span-2 p-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] focus-within:border-[#0F4C3A] transition-colors">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A5550] mb-0.5">
                  Jumlah Peserta
                </label>
                <select
                  value={searchPax}
                  onChange={(e) => setSearchPax(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-semibold text-[#14211D] focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 Orang</option>
                  <option value={2}>2 Orang</option>
                  <option value={4}>3 - 5 Orang</option>
                  <option value={8}>Rombongan (6+)</option>
                </select>
              </div>

              {/* Tombol Search */}
              <div className="lg:col-span-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-white bg-[#0F4C3A] hover:bg-[#0A3629] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Cari Paket Trip</span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 2. ACCREDITATION & TRUST STRIP */}
      <section className="py-10 bg-white border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            {[
              { icon: ShieldCheck, title: 'Terdaftar Resmi', desc: 'Kemenparekraf & ASITA' },
              { icon: Award, title: 'Pemandu Bersertifikat', desc: 'Standar Lisensi HPI' },
              { icon: CheckCircle2, title: 'Transparansi Biaya', desc: 'Tanpa Biaya Tersembunyi' },
              { icon: Phone, title: 'Dukungan 24/7', desc: 'Respons Cepat WhatsApp' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] flex items-center justify-center text-[#0F4C3A] flex-shrink-0 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#14211D] font-bold">{item.title}</strong>
                    <span className="text-[#4A5550] text-[11px]">{item.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DESTINASI UNGGULAN (EDITORIAL GALLERY TILES) */}
      <section className="py-16 border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
                Wilayah Pilihan
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14211D] tracking-tight font-display mt-1">
                Koleksi Destinasi Nusantara
              </h2>
            </div>
            <Link
              to="/trips"
              className="text-xs font-semibold text-[#0F4C3A] hover:text-[#0A3629] flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua Destinasi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Raja Ampat', img: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=400&q=80', desc: 'Papua Barat Daya' },
              { name: 'Labuan Bajo', img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80', desc: 'Nusa Tenggara Timur' },
              { name: 'Bromo', img: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=400&q=80', desc: 'Jawa Timur' },
              { name: 'Nusa Penida', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80', desc: 'Bali' },
              { name: 'Danau Toba', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', desc: 'Sumatera Utara' },
              { name: 'Yogyakarta', img: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=600&q=80', desc: 'D.I. Yogyakarta' },
            ].map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -5 }}
              >
                <Link
                  to={`/trips?destination=${encodeURIComponent(d.name)}`}
                  className="group relative rounded-xl overflow-hidden aspect-[3/4] border border-[#E6E4DD] bg-[#F4F2EC] hover:shadow-lg transition-all block"
                >
                  <img
                    src={d.img}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14211D]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <strong className="block text-sm font-bold font-display">{d.name}</strong>
                    <span className="text-[10px] text-white/80">{d.desc}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PAKET TRIP POPULER DENGAN FILTER TABS */}
      <section className="py-16 bg-[#FAF9F6] border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
                Paket Perjalanan Terkurasi
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14211D] tracking-tight font-display mt-1">
                Jadwal & Eksplorasi Unggulan
              </h2>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white border border-[#E6E4DD] text-xs">
              {categoryTabs.map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`relative px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      active ? 'text-white' : 'text-[#4A5550] hover:text-[#14211D]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeCategoryBg"
                        className="absolute inset-0 bg-[#0F4C3A] rounded-lg shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid with Framer Motion AnimatePresence */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-[#E6E4DD] h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="text-center pt-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl border border-[#14211D]/20 bg-white hover:bg-[#FAF9F6] text-[#14211D] font-semibold text-xs transition-colors shadow-2xs"
              >
                <span>Lihat Seluruh Paket Wisata ({featuredTrips.length} Pilihan)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL TESTIMONIALS */}
      <section className="py-16 bg-white border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
              Catatan Pengalaman
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14211D] font-display">
              Ulasan Pelancong Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: '"Jadwal sailing di Labuan Bajo sangat rapi. Pemandu lokal menguasai rute trekking Pulau Padar dengan aman saat fajar, dan makanan di kapal sangat segar."',
                name: 'Budi Santoso',
                meta: 'Raja Ampat Wayag • 4D3N',
                initial: 'B',
              },
              {
                text: '"Sangat mengapresiasi sistem konfirmasi dan tracking pemesanan tanpa harus registrasi berbelit. Pengalaman sunrise Bromo sangat memuaskan."',
                name: 'Dian Permatasari',
                meta: 'Labuan Bajo Liveaboard • 3D2N',
                initial: 'D',
              },
              {
                text: '"Dokumentasi drone dan perlengkapan snorkeling sudah termasuk tanpa tagihan tak terduga di lapangan. Sangat direkomendasikan untuk liburan keluarga."',
                name: 'Andi Wijaya',
                meta: 'Bromo Sunrise & Madakaripura • 2D1N',
                initial: 'A',
              },
            ].map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E6E4DD] space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 text-[#D97736]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#D97736]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5550] leading-relaxed">
                    {t.text}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E6E4DD] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0F4C3A] text-white font-bold text-xs flex items-center justify-center">
                    {t.initial}
                  </div>
                  <div>
                    <strong className="block text-xs text-[#14211D]">{t.name}</strong>
                    <span className="text-[11px] text-[#4A5550]">{t.meta}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL CALL TO ACTION BANNER */}
      <section className="py-20 bg-[#14211D] text-[#FAF9F6]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-6 text-center space-y-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
            Konsultasi Pribadi & Rombongan
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            Rencanakan Perjalanan Sempurna Anda Bersama Agen Resmi.
          </h2>
          <p className="text-sm text-[#FAF9F6]/80 max-w-lg mx-auto leading-relaxed">
            Butuh jadwal khusus untuk gathering kantor, liburan keluarga besar, atau itinerary privat? Konsultasikan rencana Anda bersama tim kurator kami.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-[#14211D] bg-[#FAF9F6] hover:bg-white transition-all shadow-sm"
              >
                <span>Pilih Paket Wisata</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20Jelajah%20Trip,%20saya%20ingin%20konsultasi%20jadwal%20perjalanan."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white border border-[#FAF9F6]/30 hover:bg-[#FAF9F6]/10 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}