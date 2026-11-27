import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ShieldCheck, Star, Users, MapPin,
  Calendar, CheckCircle2, Search, Award, Check, MessageCircle, Phone,
  Sparkles, Compass, Globe, Compass as CompassIcon
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { tripService } from '../../services/api';
import TripCard from '../trip/TripCard';

const LUXURY_EASE = [0.22, 1, 0.36, 1];

export default function HomePage() {
  const [featuredTrips, setFeaturedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // Search Bar Form States
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchPax, setSearchPax] = useState(2);

  const navigate = useNavigate();
  const heroRef = useRef(null);

  // Global editorial scroll progress indicator
  const { scrollYProgress: pageProgress } = useScroll();
  const smoothProgress = useSpring(pageProgress, { stiffness: 140, damping: 24, restDelta: 0.001 });

  // Scroll-linked hero parallax
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImgY = useTransform(heroProgress, [0, 1], ['0%', '16%']);
  const heroImgScale = useTransform(heroProgress, [0, 1], [1.05, 1.14]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -28]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.85], [1, 0.25]);

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
      {/* Razor-thin Editorial Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#08261E] via-[#C5A059] to-[#F5E4BE] origin-left z-[60] pointer-events-none"
      />

      {/* 1. HERO SECTION (Minimalist Luxury Atelier Stage with Scroll Parallax & Masked Reveal) */}
      <section ref={heroRef} className="relative px-4 sm:px-6 lg:px-8 pt-2 pb-10 lg:pb-14 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Subtle Ambient Radial Backlight */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.65, 0.9, 0.65] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#C5A059]/15 via-[#08261E]/20 to-[#C5A059]/15 blur-3xl -z-10 rounded-full pointer-events-none"
        />

        {/* The Clean Panoramic Showcase Frame (Gambar di Tengah dengan Gradasi Tembus Pandang) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: LUXURY_EASE }}
          className="relative rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden border border-[#EAE7DF] bg-[#08261E] shadow-[0_20px_60px_-15px_rgba(8,38,30,0.22)] min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-10 lg:px-12 text-center"
        >
          {/* Panoramic Hero Photo with Scroll-Linked Parallax */}
          <motion.img
            style={{ y: heroImgY, scale: heroImgScale }}
            src="https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=2400&q=85"
            alt="Kepulauan Wayag Raja Ampat"
            className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
          />

          {/* GRADIASI TEMBUS PANDANG (Atmospheric Translucent Scrim) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08261E]/90 via-[#08261E]/55 to-[#08261E]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(8,38,30,0.6)_100%)] pointer-events-none" />

          {/* CENTER TYPOGRAPHY (Masked Line-by-Line Reveal + Scroll Lift) */}
          <motion.div
            style={{ y: heroTextY, opacity: heroTextOpacity }}
            className="relative z-10 max-w-3xl mx-auto space-y-4 will-change-transform"
          >
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-white tracking-tight drop-shadow-sm">
              <span className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.85, ease: LUXURY_EASE, delay: 0.1 }}
                  className="block"
                >
                  Kemurnian Alam Indonesia,
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.85, ease: LUXURY_EASE, delay: 0.24 }}
                  className="italic font-serif font-light text-[#C5A059] block"
                >
                  Disusun Sempurna.
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: LUXURY_EASE }}
              className="text-xs sm:text-sm lg:text-base leading-relaxed text-white/80 max-w-lg mx-auto font-normal"
            >
              Biro perjalanan butik ke pulau-pulau rahasia, puncak kaldera fajar, dan warisan budaya nusantara.
            </motion.p>
          </motion.div>
        </motion.div>

        {/* DI BAWAH GAMBAR: SEARCH CAPSULE (Sitting cleanly below the image) */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.48, ease: LUXURY_EASE }}
          className="w-full max-w-5xl mx-auto px-2"
        >
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white border border-[#EAE7DF] rounded-2xl lg:rounded-full p-2.5 sm:p-3 shadow-[0_12px_40px_-10px_rgba(8,38,30,0.08)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center"
          >
            {/* Destinasi */}
            <div className="lg:col-span-4 px-4 py-2.5 rounded-xl lg:rounded-full bg-[#FCFCFA] border border-[#EAE7DF] hover:border-[#08261E]/30 focus-within:border-[#08261E] transition-all text-left">
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
            <div className="lg:col-span-3 px-4 py-2.5 rounded-xl lg:rounded-full bg-[#FCFCFA] border border-[#EAE7DF] hover:border-[#08261E]/30 focus-within:border-[#08261E] transition-all text-left">
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
            <div className="lg:col-span-2 px-4 py-2.5 rounded-xl lg:rounded-full bg-[#FCFCFA] border border-[#EAE7DF] hover:border-[#08261E]/30 focus-within:border-[#08261E] transition-all text-left">
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
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl lg:rounded-full font-semibold text-xs text-[#08261E] bg-[#C5A059] hover:bg-[#d6b26b] transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Search className="w-4 h-4 text-[#08261E]" />
                <span>Cari Paket Trip</span>
              </button>
            </div>
          </form>
        </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: LUXURY_EASE }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#08261E] hover:text-[#C5A059] transition-colors group"
            >
              <span>Eksplorasi Seluruh Wilayah</span>
              <ArrowUpRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>

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

      {/* 5. EDITORIAL TRAVELER STORIES (INFINITE SMOOTH MARQUEE) */}
      <section className="py-20 bg-white border-b border-[#EAE7DF]/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: LUXURY_EASE }}
            className="text-center max-w-xl mx-auto space-y-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
              Catatan Pengalaman Otentik
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#08261E]">
              Ulasan Pelancong Kami
            </h2>
          </motion.div>
        </div>

        {/* Seamless Marquee Track with Side Fade Masks (Pause on Hover) */}
        <div
          className="relative mt-10 w-full overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="animate-marquee gap-6 py-3">
            {[
              ...[
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
                {
                  text: '"Nusa Penida terasa seperti pulau pribadi karena kurator mengatur jam kunjungan sebelum ramai wisatawan lain tiba. Benar-benar luxury service."',
                  name: 'Clarissa Gunawan',
                  meta: 'Nusa Penida Karst • 2D1N',
                  initial: 'C',
                },
                {
                  text: '"Menginap di water cottage Maratua dan berenang di Kakaban bersama ubur-ubur tanpa sengat jadi momen terbaik sepanjang tahun 2026 kami."',
                  name: 'Rafi Pratama',
                  meta: 'Derawan & Maratua • 4D3N',
                  initial: 'R',
                },
              ],
              ...[
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
                {
                  text: '"Nusa Penida terasa seperti pulau pribadi karena kurator mengatur jam kunjungan sebelum ramai wisatawan lain tiba. Benar-benar luxury service."',
                  name: 'Clarissa Gunawan',
                  meta: 'Nusa Penida Karst • 2D1N',
                  initial: 'C',
                },
                {
                  text: '"Menginap di water cottage Maratua dan berenang di Kakaban bersama ubur-ubur tanpa sengat jadi momen terbaik sepanjang tahun 2026 kami."',
                  name: 'Rafi Pratama',
                  meta: 'Derawan & Maratua • 4D3N',
                  initial: 'R',
                },
              ],
            ].map((t, idx) => (
              <div
                key={idx}
                className="w-[320px] sm:w-[370px] shrink-0 p-7 rounded-3xl bg-[#FCFCFA] border border-[#EAE7DF] space-y-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-[#C5A059]/50 hover:-translate-y-1.5 transition-all duration-300"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL CALL TO ACTION BANNER (DEEP FOREST NIGHT) */}
      <section className="py-24 bg-[#08261E] text-white relative overflow-hidden">
        {/* Breathing Ambient Gold Gradient */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.14, 0.24, 0.14] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C5A059]/30 via-transparent to-transparent pointer-events-none"
        />

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
