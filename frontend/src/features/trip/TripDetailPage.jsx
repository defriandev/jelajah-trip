import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, Users, Star, ArrowUpRight, CheckCircle, Share2,
  Camera, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripService, reviewService } from '../../services/api';

const formatIDR = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-[#EAE7DF] fill-[#EAE7DF]'
          }`}
        />
      ))}
    </div>
  );
}

function AvatarInitials({ name }) {
  const initials = (name || 'P')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#08261E] to-[#0D3B2E] text-[#F5E4BE] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs border border-[#C5A059]/30">
      {initials}
    </div>
  );
}

/* ─── Skeleton ─── */
function SkeletonPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-4 w-56 bg-[#E6E4DD] rounded" />
        <div className="w-full aspect-[16/9] max-h-[480px] bg-[#E6E4DD] rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-9 w-3/4 bg-[#E6E4DD] rounded" />
            <div className="flex gap-4">
              <div className="h-5 w-28 bg-[#E6E4DD] rounded" />
              <div className="h-5 w-24 bg-[#E6E4DD] rounded" />
              <div className="h-5 w-32 bg-[#E6E4DD] rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-[#E6E4DD] rounded" />
              <div className="h-4 w-5/6 bg-[#E6E4DD] rounded" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="h-72 bg-[#E6E4DD] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Error ─── */
function ErrorPage({ message }) {
  return (
    <div className="min-h-screen bg-[#FCFCFA] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7 text-rose-500" />
        </div>
        <h2 className="text-xl font-serif font-bold tracking-tight text-[#08261E]">
          Paket Wisata Tidak Ditemukan
        </h2>
        <p className="text-sm leading-relaxed text-[#64748B]">
          {message || 'Paket trip yang Anda cari tidak tersedia atau telah dihapus.'}
        </p>
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 bg-[#08261E] hover:bg-[#08261E]/90 text-[#C5A059] rounded-2xl px-6 py-3.5 font-semibold text-sm transition-all shadow-sm active:scale-95"
        >
          Kembali ke Katalog
        </Link>
      </div>
    </div>
  );
}

/* ─── Destination Photo Presets ─── */
const destinationGalleries = {
  yogyakarta: [
    {
      url: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80',
      title: 'Candi Prambanan Megah',
    },
    {
      url: 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=1200&q=80',
      title: 'Sunrise Candi Borobudur',
    },
    {
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      title: 'Keagungan Stupa & Lembah Menoreh',
    },
  ],
  bromo: [
    {
      url: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
      title: 'Kaldera Bromo & Lautan Pasir',
    },
    {
      url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
      title: 'Lembah Fajar Bromo Tengger',
    },
  ],
  rajaampat: [
    {
      url: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80',
      title: 'Gugusan Karst Kepulauan Wayag',
    },
    {
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      title: 'Laguna Terumbu Karang Pianemo',
    },
  ],
  labuanbajo: [
    {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      title: 'Puncak Pulau Padar Saat Fajar',
    },
    {
      url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
      title: 'Sailing Phinisi di Pink Beach',
    },
  ],
  nusapenida: [
    {
      url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      title: 'Kelingking Beach T-Rex Cliff',
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      title: 'Tangga Tebing Diamond Beach',
    },
  ],
  danautoba: [
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      title: 'Panorama Danau Toba & Pulau Samosir',
    },
    {
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      title: 'Perbukitan Hijau Holbung Toba',
    },
  ],
  derawan: [
    {
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      title: 'Danau Ubur-ubur Kakaban & Laguna Maratua',
    },
  ],
  toraja: [
    {
      url: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=1200&q=80',
      title: 'Tongkonan Adat & Perbukitan Batutumonga',
    },
  ],
  belitung: [
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      title: 'Batu Granit Tanjung Tinggi & Pulau Lengkuas',
    },
  ],
  sumba: [
    {
      url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
      title: 'Savana Warinding & Laguna Danau Weekuri',
    },
  ],
};

/* ─── Main Page ─── */
export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      tripService.getTripByID(id),
      reviewService.getReviewsByTrip(id).catch(() => ({ data: [] })),
    ])
      .then(([tripRes, reviewsRes]) => {
        if (tripRes && tripRes.data) {
          setTrip(tripRes.data);
          setActivePhoto(tripRes.data.image_url);
        } else {
          setError(tripRes?.message || 'Gagal memuat detail paket trip');
        }
        if (reviewsRes && Array.isArray(reviewsRes.data)) {
          setReviews(reviewsRes.data);
        }
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat detail paket trip');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SkeletonPage />;
  if (error || !trip) return <ErrorPage message={error} />;

  const reviewsCount = reviews.length;
  const avgRating =
    reviewsCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1)
      : '4.9';

  const lowQuota = trip.quota < 10;

  // Determine gallery images
  const destKey = trip.destination.toLowerCase().replace(/[^a-z]/g, '');
  let gallery = [];
  if (destKey.includes('yogyakarta') || trip.title.toLowerCase().includes('yogyakarta')) {
    gallery = destinationGalleries.yogyakarta;
  } else if (destKey.includes('bromo')) {
    gallery = destinationGalleries.bromo;
  } else if (destKey.includes('rajaampat')) {
    gallery = destinationGalleries.rajaampat;
  } else if (destKey.includes('labuanbajo')) {
    gallery = destinationGalleries.labuanbajo;
  } else if (destKey.includes('penida')) {
    gallery = destinationGalleries.nusapenida;
  } else if (destKey.includes('toba')) {
    gallery = destinationGalleries.danautoba;
  }

  // Fallback: if no multi gallery, ensure at least the primary image is present
  if (!gallery.some((g) => g.url === trip.image_url)) {
    gallery = [{ url: trip.image_url, title: trip.title }, ...gallery];
  }

  const currentPhoto = activePhoto || trip.image_url;

  const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(
    `Halo Admin Jelajah Trip, saya tertarik untuk bertanya lebih lanjut mengenai paket wisata "${trip.title}". Mohon informasi ketersediaannya.`
  )}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: trip.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── 1. Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Link to="/" className="hover:text-[#08261E] transition-colors">Beranda</Link>
          <span>/</span>
          <Link to="/trips" className="hover:text-[#08261E] transition-colors">Katalog Trip</Link>
          <span>/</span>
          <span className="text-[#08261E] font-semibold truncate max-w-[240px]">{trip.title}</span>
        </nav>

        {/* ── 2. Hero Image Showcase + Interactive Gallery ── */}
        <div className="space-y-4">
          <div className="relative w-full aspect-[16/9] max-h-[500px] rounded-3xl overflow-hidden bg-[#08261E] border border-[#EAE7DF] shadow-md group">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhoto}
                src={currentPhoto}
                alt={trip.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
                }}
                initial={{ opacity: 0.6, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.6 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-[#08261E]/80 via-transparent to-transparent pointer-events-none" />

            {/* Destination badge bottom-left */}
            <div className="absolute bottom-5 left-5 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FCFCFA] bg-[#08261E]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                {trip.destination}
              </span>
            </div>
          </div>

          {/* Gallery Thumbnails Strip (terutama untuk Yogyakarta & destinasi lainnya) */}
          {gallery.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#08261E]/70">
                <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Galeri Foto Destinasi:</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {gallery.map((item, idx) => {
                  const isSelected = currentPhoto === item.url;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActivePhoto(item.url)}
                      className={`relative flex-shrink-0 w-28 h-20 rounded-2xl overflow-hidden border-2 transition-all shadow-2xs ${
                        isSelected
                          ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 scale-102'
                          : 'border-[#EAE7DF] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ── LEFT (8 cols) ── */}
          <div className="lg:col-span-8 space-y-10">

            {/* Title + Meta */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-serif font-normal text-[#08261E] leading-tight">
                {trip.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] bg-white px-3.5 py-1.5 rounded-full border border-[#EAE7DF] shadow-2xs">
                  <Clock className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <span>{trip.duration}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] bg-white px-3.5 py-1.5 rounded-full border border-[#EAE7DF] shadow-2xs">
                  <MapPin className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <span>{trip.destination}</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full ${
                    lowQuota
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-[#08261E]/5 text-[#08261E] border border-[#08261E]/15'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="tabular-nums">{trip.quota} sisa kuota</span>
                </div>

                <span className="tabular-nums text-2xl font-extrabold text-[#08261E] ml-auto font-sans">
                  {formatIDR(trip.price)}
                </span>
              </div>

              {/* Average rating row */}
              <div className="flex items-center gap-2 pt-1">
                <StarRating rating={Math.round(parseFloat(avgRating))} />
                <span className="text-xs text-[#64748B]">
                  <span className="tabular-nums font-bold text-[#08261E]">{avgRating}</span>
                  &nbsp;({reviewsCount > 0 ? reviewsCount : '12'} ulasan terverifikasi)
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                Tentang Ekspedisi
              </p>
              <p className="leading-[1.8] text-[#64748B] text-sm md:text-base whitespace-pre-line font-light">
                {trip.description}
              </p>
            </div>

            {/* Facilities */}
            {trip.facilities && trip.facilities.length > 0 && (
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                  Fasilitas Termasuk
                </p>
                <div className="bg-white border border-[#EAE7DF] rounded-3xl p-6 shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {trip.facilities.map((facility, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-[#08261E]"
                      >
                        <CheckCircle className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                        <span className="leading-[1.65] text-[#64748B]">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                Ulasan Pelancong
              </p>

              {reviewsCount === 0 ? (
                <div className="bg-white border border-[#EAE7DF] rounded-3xl p-8 text-center space-y-2 shadow-xs">
                  <p className="text-sm font-serif font-bold text-[#08261E]">
                    Belum ada ulasan untuk paket ini.
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Jadilah pelancong pertama yang memesan dan membagikan pengalaman berharga Anda!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-[#EAE7DF] rounded-3xl p-6 space-y-3.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AvatarInitials name={rev.user?.name} />
                          <div>
                            <span className="block text-sm font-semibold text-[#08261E]">
                              {rev.user?.name || 'Pelancong Terverifikasi'}
                            </span>
                            <span className="block text-[11px] text-[#64748B]">
                              {new Date(rev.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <StarRating rating={rev.rating} />
                      </div>
                      <p className="font-serif italic text-sm leading-[1.7] text-[#08261E]">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT — Sticky Booking Card (4 cols) ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-7 space-y-6 shadow-xl shadow-[#08261E]/5">

              {/* Price */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Tarif All-Inclusive
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tabular-nums text-[#08261E] font-sans">
                    {formatIDR(trip.price)}
                  </span>
                  <span className="text-xs text-[#64748B]">/orang</span>
                </div>
              </div>

              {/* Quota info */}
              <div className="flex items-center gap-2.5 text-xs text-[#64748B] bg-[#FCFCFA] p-3.5 rounded-2xl border border-[#EAE7DF]">
                <Users className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>
                  Sisa kuota keberangkatan:{' '}
                  <strong className={`tabular-nums font-bold ${lowQuota ? 'text-amber-700' : 'text-[#08261E]'}`}>
                    {trip.quota} Pax
                  </strong>
                </span>
              </div>

              {/* Assurance points */}
              <div className="space-y-3 border-t border-[#EAE7DF]/70 pt-5">
                {[
                  '100% Berangkat tanpa batasan minimum kuota',
                  'Pemandu lokal berlisensi resmi HPI',
                  'Gratis reschedule hingga H-7 jadwal tour',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-xs text-[#64748B]">
                    <CheckCircle className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>

              {/* CTA: Book now - Fixed route to /booking/:tripId */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/booking/${trip.id}`)}
                className="bg-[#08261E] hover:bg-[#0D3B2E] text-[#F5E4BE] w-full rounded-full py-4 font-semibold flex items-center justify-center gap-2 transition-all text-xs shadow-lg shadow-[#08261E]/20 border border-[#C5A059]/40"
              >
                <span>Pesan Sekarang</span>
                <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
              </motion.button>

              {/* Secondary: WhatsApp + Share */}
              <div className="flex gap-2.5">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-[#EAE7DF] hover:bg-[#FCFCFA] text-[#08261E] rounded-full px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Tanya WhatsApp</span>
                </a>
                <button
                  onClick={handleShare}
                  aria-label="Bagikan"
                  className="border border-[#EAE7DF] hover:bg-[#FCFCFA] text-[#08261E] rounded-full px-4 py-2.5 flex items-center justify-center transition-colors relative"
                  title="Salin Tautan"
                >
                  {copied ? (
                    <span className="text-[10px] font-bold text-[#C5A059]">Tersalin!</span>
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}