import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ShieldCheck, Star, Users, MapPin,
  Calendar, CheckCircle2, Search, Award, Check, MessageCircle, Phone,
  Sparkles, Compass, Globe, Compass as CompassIcon
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
    { id: 'laut', label: 'Pantai & Kepulauan' },
    { id: 'gunung', label: 'Kaldera & Puncak Fajar' },
    { id: 'budaya', label: 'Heritage & Tradisi' },
  ];

  return (
    <div className="bg-[#FCFCFA] text-[#111827] overflow-x-hidden">
      {/* 1. HERO SECTION (Atmospheric High-Fashion Editorial) */}
      <section className="relative pt-6 pb-16 lg:pt-12 lg:pb-24 overflow-hidden">
        {/* Subtle Ambient Radial Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#C5A059]/10 via-[#08261E]/3 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Centered Editorial Typography Stack */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto text-center space-y-6 pt-2 sm:pt-6"
          >
            {/* Luxury Eyebrow Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-[#C5A059]/30 shadow-xs backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#08261E]">
                Kurasi Eksklusif Nusantara • Edisi 2026/2027
              </span>
            </motion.div>

            {/* H1 Hero Title (Playfair Display Luxury - Centered) */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] text-[#08261E] tracking-tight"
            >
              Kemurnian Alam Indonesia,{' '}
              <span className="italic font-serif font-light text-[#C5A059] block sm:inline">
                Disusun Sempurna.
              </span>
            </motion.h1>

            {/* Centered Body Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-base sm:text-lg leading-[1.7] text-[#64748B] max-w-2xl mx-auto font-normal"
            >
              Biro perjalanan butik yang menghubungkan Anda dengan pulau-pulau rahasia, puncak kaldera fajar, dan warisan budaya nusantara dengan jaminan keberangkatan pasti serta pemandu berlisensi resmi.
            </motion.p>

            {/* Centered Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-1"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/trips"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-xs text-[#F5E4BE] bg-[#08261E] hover:bg-[#0D3B2E] transition-all shadow-xl shadow-[#08261E]/20 border border-[#C5A059]/40"
                >
                  <span>Eksplorasi Katalog Trip</span>
                  <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/tracking"
                  className="inline-flex items-center gap-2 border border-[#EAE7DF] bg-white/80 hover:bg-white text-[#08261E] rounded-full px-6 py-4 font-semibold text-xs transition-all shadow-xs backdrop-blur-sm"
                >
                  <Search className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Lacak Kode Booking</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Centered Live Trust Metrics Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#64748B]"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#C5A059]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C5A059]" />
                  ))}
                </div>
                <span className="font-bold text-[#08261E] tabular-nums text-sm font-sans">4.9 / 5.0</span>
              </div>
              <div className="h-4 w-px bg-[#EAE7DF] hidden sm:block" />
              <div>
                <strong className="text-[#08261E] font-semibold tabular-nums">3.200+</strong> Pelancong Terverifikasi
              </div>
              <div className="h-4 w-px bg-[#EAE7DF] hidden sm:block" />
              <div className="text-[#08261E] font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                <span>Kemenparekraf & ASITA Certified</span>
              </div>
            </motion.div>
          </motion.div>

          {/* CENTERPIECE VISUAL SHOWCASE WITH TRANSLUCENT GRADIENTS (Gambar di Tengah & Gradasi Tembus Pandang) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-6xl mx-auto mt-10 lg:mt-12"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 max-w-4xl mx-auto h-full bg-gradient-to-r from-[#C5A059]/15 via-[#08261E]/20 to-[#C5A059]/15 blur-3xl -z-10 rounded-full pointer-events-none transform -translate-y-4" />

            {/* Main Visual Frame with Cinematic Edge Curvature */}
            <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-[#EAE7DF] bg-[#08261E] shadow-[0_30px_90px_-20px_rgba(8,38,30,0.25)] aspect-[16/10] sm:aspect-[21/9] min-h-[360px] sm:min-h-[460px] group">
              <img
                src="https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=2400&q=85"
                alt="Kepulauan Wayag Raja Ampat"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
              />

              {/* GRADIASI TEMBUS PANDANG 1: Gradasi Gelap Bawah Menuju Transparan */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08261E]/95 via-[#08261E]/40 to-transparent pointer-events-none" />

              {/* GRADIASI TEMBUS PANDANG 2: Gradasi Halus Atas Menuju Transparan */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FCFCFA]/40 via-transparent to-transparent pointer-events-none" />

              {/* GRADIASI TEMBUS PANDANG 3: Vignette Radial Tembus Pandang */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(8,38,30,0.55)_100%)] pointer-events-none" />

              {/* GRADIASI TEMBUS PANDANG 4: Ambient Diagonal Light Reflex */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

              {/* Floating Top Badge Kiri (Glass Frosted Pill) */}
              <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xl text-white border border-white/30 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  Destinasi Terpopuler 2026/2027
                </span>
              </div>

              {/* Floating Top Badge Kanan (Garansi Keberangkatan) */}
              <div className="absolute top-5 right-5 sm:top-6 sm:right-6 hidden sm:block">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#08261E]/60 backdrop-blur-xl text-[#F5E4BE] border border-white/20 shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  100% Garansi Keberangkatan Pasti
                </span>
              </div>

              {/* Bottom Photo Caption (Ethereal Editorial Tag) */}
              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-10 text-white/90 hidden md:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#C5A059]">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block">
                    Mahakarya Bahari Indonesia
                  </span>
                  <span className="text-xs font-serif italic text-white/90">
                    Kepulauan Wayag, Raja Ampat — Papua Barat Daya
                  </span>
                </div>
              </div>
            </div>

            {/* FLOATING ISLAND SEARCH CAPSULE OVERLAPPING BOTTOM GRADIENT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="relative -mt-12 sm:-mt-16 z-20 max-w-5xl mx-auto px-4"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-2xl lg:rounded-full p-2.5 sm:p-3 shadow-[0_25px_60px_-15px_rgba(8,38,30,0.18)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center"
              >
                {/* Destinasi */}
                <div className="lg:col-span-4 px-4 py-2.5 rounded-xl lg:rounded-full bg-[#FCFCFA] border border-[#EAE7DF] hover:border-[#08261E]/30 focus-within:border-[#08261E] transition-all">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                    Destinasi Impian
                  </label>
                  <select
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-[#08261E] focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Destinasi Indonesia</option>
                    <option value="Raja Ampat">Raja Ampat, Papua Barat Daya</option>
                    <option value="Labuan Bajo">Labuan Bajo, NTT</option>
                    <option value="Bromo">Gunung Bromo, Jawa Timur</option>
                    <option value="Nusa Penida">Nusa Penida, Bali</option>
                    <option value="Danau Toba">Danau Toba, Sumatera Utara</option>
                    <option value="Yogyakarta">DI Yogyakarta Heritage</option>
                  </select>
                </div>

                {/* Tanggal */}
                <div className="lg:col-span-3 px-4 py-2.5 rounded-xl lg:rounded-full bg-[#FCFCFA] border border-[#EAE7DF] hover:border-[#08261E]/30 focus-within:border-[#08261E] transition-all">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                    Tanggal Berangkat
                  </label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-[#08261E] focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Peserta */}
                <div className="lg:col-span-2 px-4 py-2.5 rounded-xl lg:rounded-full bg-[#FCFCFA] border border-[#EAE7DF] hover:border-[#08261E]/30 focus-within:border-[#08261E] transition-all">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                    Peserta
                  </label>
                  <select
                    value={searchPax}
                    onChange={(e) => setSearchPax(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-semibold text-[#08261E] focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Orang</option>
                    <option value={2}>2 Orang</option>
                    <option value={4}>3 - 5 Orang</option>
                    <option value={8}>Grup (6+)</option>
                  </select>
                </div>

                {/* Tombol Search */}
                <div className="lg:col-span-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full py-4 px-6 rounded-xl lg:rounded-full font-semibold text-xs text-[#F5E4BE] bg-[#08261E] hover:bg-[#0D3B2E] transition-all shadow-lg shadow-[#08261E]/20 flex items-center justify-center gap-2 border border-[#C5A059]/40 active:scale-95"
                  >
                    <Search className="w-4 h-4 text-[#C5A059]" />
                    <span>Cari Paket Trip</span>
                  </motion.button>
                </div>
              </form>

              {/* Quick Inspiration Pills */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#64748B]">
                <span className="text-[11px] font-medium text-[#08261E]/60">Destinasi Populer:</span>
                {['Raja Ampat', 'Labuan Bajo', 'Gunung Bromo', 'Nusa Penida'].map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSearchDestination(d);
                      navigate(`/trips?destination=${encodeURIComponent(d)}`);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-medium bg-white/80 hover:bg-white border border-[#EAE7DF] text-[#08261E] transition-all shadow-2xs hover:border-[#C5A059]"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. ACCREDITATION & TRUST ARCHITECTURE */}
      <section className="py-12 bg-white border-y border-[#EAE7DF]/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            {[
              { icon: ShieldCheck, title: 'Izin Resmi Pemerintah', desc: 'Kemenparekraf & ASITA Certified' },
              { icon: Award, title: 'Pemandu Lisensi HPI', desc: 'Standar Nasional Indonesia' },
              { icon: CheckCircle2, title: 'Transparansi Biaya', desc: 'All-Inclusive Tanpa Tipuan' },
              { icon: Phone, title: 'Concierge Butik 24/7', desc: 'Pendampingan Pribadi Siaga' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#08261E]/5 border border-[#08261E]/10 flex items-center justify-center text-[#08261E] shrink-0 shadow-xs">
                    <Icon className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <strong className="block text-[#08261E] font-bold text-xs">{item.title}</strong>
                    <span className="text-[#64748B] text-[11px] leading-tight block mt-0.5">{item.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. KOLEKSI DESTINASI UNGGULAN (CINEMATIC TILES) */}
      <section className="py-20 border-b border-[#EAE7DF]/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                Wilayah Pilihan Nusantara
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#08261E] tracking-tight mt-1">
                Koleksi Surga Tersembunyi
              </h2>
            </div>
            <Link
              to="/trips"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#08261E] hover:text-[#C5A059] transition-colors"
            >
              <span>Eksplorasi Seluruh Wilayah</span>
              <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
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
                transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  to={`/trips?destination=${encodeURIComponent(d.name)}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-[#EAE7DF] bg-[#F4F0E8] hover:shadow-xl transition-all block"
                >
                  <img
                    src={d.img}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08261E]/90 via-[#08261E]/20 to-transparent" />
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                    <strong className="block text-sm font-bold font-serif leading-tight">{d.name}</strong>
                    <span className="text-[10px] text-white/80 block mt-0.5">{d.desc}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PAKET TRIP TERKURASI DENGAN PILL TABS */}
      <section className="py-20 bg-[#FCFCFA] border-b border-[#EAE7DF]/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                Katalog Pengalaman Terpilih
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#08261E] tracking-tight mt-1">
                Jadwal & Eksplorasi Unggulan
              </h2>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-full bg-white border border-[#EAE7DF] text-xs shadow-xs">
              {categoryTabs.map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`relative px-4 py-2 rounded-full font-semibold text-xs transition-colors ${
                      active ? 'text-[#F5E4BE]' : 'text-[#64748B] hover:text-[#08261E]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeCategoryBg"
                        className="absolute inset-0 bg-[#08261E] rounded-full shadow-xs border border-[#C5A059]/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl bg-white border border-[#EAE7DF] h-96 animate-pulse" />
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

          <div className="text-center pt-8">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 py-3.5 px-8 rounded-full border border-[#08261E]/30 bg-white hover:bg-[#F4F0E8] text-[#08261E] font-semibold text-xs transition-all shadow-xs"
              >
                <span>Lihat Seluruh Paket Wisata ({featuredTrips.length} Destinasi Terkurasi)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL TRAVELER STORIES (TESTIMONIALS) */}
      <section className="py-20 bg-white border-b border-[#EAE7DF]/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
              Catatan Pengalaman Otentik
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#08261E]">
              Ulasan Pelancong Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: '"Jadwal sailing di Labuan Bajo sangat rapi dan personal. Pemandu lokal menguasai rute trekking Pulau Padar dengan aman saat fajar, dan makanan di kapal sangat segar."',
                name: 'Budi Santoso',
                meta: 'Raja Ampat Wayag • 4D3N',
                initial: 'B',
              },
              {
                text: '"Sangat mengapresiasi sistem tracking pemesanan instan tanpa registrasi berbelit. Pengalaman sunrise Bromo sangat memuaskan dan tenang."',
                name: 'Dian Permatasari',
                meta: 'Labuan Bajo Liveaboard • 3D2N',
                initial: 'D',
              },
              {
                text: '"Dokumentasi drone dan perlengkapan snorkeling sudah termasuk tanpa tagihan tersembunyi di lapangan. Sangat direkomendasikan untuk liburan keluarga berkesan."',
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
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="p-8 rounded-3xl bg-[#FCFCFA] border border-[#EAE7DF] space-y-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-[#C5A059]/40 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-1 text-[#C5A059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C5A059]" />
                    ))}
                  </div>
                  <p className="font-serif italic text-sm text-[#08261E] leading-relaxed">
                    {t.text}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#EAE7DF]/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#08261E] to-[#0D3B2E] text-[#F5E4BE] font-bold text-xs flex items-center justify-center border border-[#C5A059]/30">
                    {t.initial}
                  </div>
                  <div>
                    <strong className="block text-xs text-[#08261E] font-bold">{t.name}</strong>
                    <span className="text-[11px] text-[#64748B]">{t.meta}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL CALL TO ACTION BANNER (DEEP FOREST NIGHT) */}
      <section className="py-24 bg-[#08261E] text-white relative overflow-hidden">
        {/* Subtle Ambient Gold Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C5A059]/15 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto px-6 text-center space-y-7"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-[#C5A059]/30 text-[11px] font-semibold text-[#F5E4BE] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            Konsultasi Pribadi & Rombongan
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-[1.15] text-white">
            Rencanakan Ekspedisi Impian Anda <br />
            <span className="italic text-[#C5A059]">Bersama Kurator Berlisensi.</span>
          </h2>

          <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto leading-relaxed font-light">
            Butuh jadwal khusus untuk gathering kantor, liburan keluarga besar, atau itinerary privat? Konsultasikan rencana Anda langsung bersama tim kurator kami.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-xs text-[#08261E] bg-[#F5E4BE] hover:bg-white transition-all shadow-xl"
              >
                <span>Pilih Paket Wisata</span>
                <ArrowUpRight className="w-4 h-4 text-[#08261E]" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20Jelajah%20Trip,%20saya%20ingin%20konsultasi%20jadwal%20perjalanan."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-xs text-white border border-white/30 hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <MessageCircle className="w-4 h-4 text-[#C5A059]" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
