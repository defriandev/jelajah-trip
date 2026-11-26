import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Luggage, LogOut, Loader2, AlertCircle, Shield, ArrowUpRight,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';

const STATUS_CONFIG = {
  confirmed: {
    label: 'Terkonfirmasi',
    className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  pending: {
    label: 'Menunggu',
    className: 'bg-[#C5A059]/15 text-[#8F6B23] border border-[#C5A059]/30',
  },
};

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchMyBookings = async () => {
      try {
        const res = await bookingService.getMyBookings({
          page: currentPage,
          limit: 10,
        });
        if (res && res.data) {
          setBookings(res.data);
          if (res.meta) {
            setMeta(res.meta);
          }
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat riwayat pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [isAuthenticated, navigate, currentPage]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#FCFCFA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white border border-[#EAE7DF] rounded-3xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#08261E] to-[#124235] text-[#C5A059] text-2xl font-serif font-bold flex items-center justify-center flex-shrink-0 shadow-md border border-[#C5A059]/30">
              {initial}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-serif font-bold tracking-tight text-[#08261E]">
                  {user?.name || 'Pengguna'}
                </h1>
                <span className="bg-[#08261E]/5 text-[#08261E] rounded-full px-3 py-0.5 text-xs font-semibold tracking-wider uppercase border border-[#08261E]/10">
                  {user?.role || 'Guest'}
                </span>
              </div>
              <p className="text-sm text-[#08261E]/60">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#08261E] hover:bg-[#08261E]/90 text-[#C5A059] text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                <Shield className="w-4 h-4 text-[#C5A059]" />
                Admin Atelier
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>

        {/* Booking History Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A059] mb-1">
                JOURNEY ARCHIVE
              </p>
              <h2 className="text-2xl font-serif font-bold tracking-tight text-[#08261E]">
                Riwayat Perjalanan Saya
              </h2>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#EAE7DF] rounded-3xl p-6 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-[#EAE7DF] rounded" />
                    <div className="h-5 w-20 bg-[#EAE7DF] rounded-full" />
                  </div>
                  <div className="h-6 w-1/2 bg-[#EAE7DF] rounded" />
                  <div className="h-4 w-1/3 bg-[#EAE7DF] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 flex items-start gap-2 mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && bookings.length === 0 && (
            <div className="bg-white border border-[#EAE7DF] rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 text-[#C5A059] flex items-center justify-center bg-[#08261E]/5 rounded-2xl">
                <Luggage className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#08261E] mb-1">
                Belum Ada Catatan Perjalanan
              </h3>
              <p className="text-[#08261E]/60 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                Anda belum memesan perjalanan apapun. Mulailah merancang ekspedisi tak terlupakan melintasi keindahan nusantara.
              </p>
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 bg-[#08261E] hover:bg-[#08261E]/90 text-[#C5A059] rounded-2xl px-6 py-3.5 font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95"
              >
                Jelajahi Paket Wisata
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Booking Cards List */}
          {!loading && !error && bookings.length > 0 && (
            <>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white border border-[#EAE7DF] rounded-3xl p-6 hover:border-[#C5A059]/40 transition-all duration-300 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      {/* Left: Code, Status, Title, Destination, Date */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-xs bg-[#08261E]/5 rounded-xl px-2.5 py-1 text-[#08261E] font-semibold border border-[#08261E]/10">
                            {booking.booking_code}
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>

                        <h3 className="text-lg font-serif font-bold text-[#08261E] truncate">
                          {booking.trip?.title || 'Paket Perjalanan'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#08261E]/65">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                            {booking.trip?.destination || 'Indonesia'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                            {booking.travel_date}
                          </span>
                          <span>{booking.pax} Peserta</span>
                        </div>
                      </div>

                      {/* Right: Price & Track button */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#EAE7DF]">
                        <div className="text-left md:text-right">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#08261E]/50 block">Total Investasi</span>
                          <span className="tabular-nums font-serif font-bold text-[#08261E] text-lg">
                            {formatIDR(booking.total_price)}
                          </span>
                        </div>

                        <Link
                          to={`/track?code=${booking.booking_code}`}
                          className="inline-flex items-center justify-center border border-[#08261E] text-[#08261E] hover:bg-[#08261E] hover:text-[#C5A059] rounded-2xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300"
                        >
                          Lacak Status Pesanan
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Server-side pagination controls */}
              {meta.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-[#EAE7DF] pt-4 text-xs text-[#08261E]/60">
                  <span>
                    Halaman <strong className="text-[#08261E]">{meta.page}</strong> dari{' '}
                    <strong className="text-[#08261E]">{meta.total_pages}</strong> ({meta.total} pesanan)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl border border-[#EAE7DF] bg-white hover:bg-[#FCFCFA] text-[#08261E] font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPage >= meta.total_pages}
                      onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl border border-[#EAE7DF] bg-white hover:bg-[#FCFCFA] text-[#08261E] font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      Berikutnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
