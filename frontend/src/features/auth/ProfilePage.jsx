import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Luggage, LogOut, Loader2, AlertCircle, Shield, ArrowUpRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import api from '../../services/api';

const STATUS_CONFIG = {
  confirmed: {
    label: 'Terkonfirmasi',
    className: 'bg-emerald-50 text-[#0F4C3A] border border-emerald-200',
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
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
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
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white border border-[#E6E4DD] rounded-2xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* 64px circle avatar */}
            <div className="w-16 h-16 rounded-full bg-[#0F4C3A] text-white text-2xl font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-display font-bold tracking-[-0.03em] text-[#14211D]">
                  {user?.name || 'Pengguna'}
                </h1>
                <span className="bg-[#F4F2EC] text-[#4A5550] rounded-full px-3 py-1 text-sm font-medium capitalize">
                  {user?.role || 'customer'}
                </span>
              </div>
              <p className="text-sm text-[#4A5550] leading-[1.65]">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#E6E4DD] text-[#14211D] text-sm font-semibold transition-colors"
              >
                <Shield className="w-4 h-4 text-[#0F4C3A]" />
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>

        {/* Booking History Section */}
        <div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-1">
              RIWAYAT PESANAN
            </p>
            <h2 className="text-2xl font-display font-bold tracking-[-0.03em] text-[#14211D]">
              Perjalanan Saya
            </h2>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E6E4DD] rounded-2xl p-5 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-[#E6E4DD] rounded" />
                    <div className="h-5 w-20 bg-[#E6E4DD] rounded-full" />
                  </div>
                  <div className="h-6 w-1/2 bg-[#E6E4DD] rounded" />
                  <div className="h-4 w-1/3 bg-[#E6E4DD] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 flex items-start gap-2 mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && bookings.length === 0 && (
            <div className="bg-white border border-[#E6E4DD] rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-[#E6E4DD] flex items-center justify-center">
                <Luggage className="w-16 h-16 stroke-1" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#14211D] mb-1">
                Belum ada pesanan
              </h3>
              <p className="text-[#4A5550] text-sm leading-[1.65] max-w-sm mx-auto mb-6">
                Anda belum memesan perjalanan apapun. Jelajahi berbagai paket wisata menarik dan mulailah berpetualang!
              </p>
              <Link
                to="/trips"
                className="inline-flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors"
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
                    className="bg-white border border-[#E6E4DD] rounded-2xl p-5 hover:border-[#0F4C3A]/30 transition-all shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Code, Status, Title, Destination, Date */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm bg-[#F4F2EC] rounded-lg px-2 py-0.5 text-[#14211D] font-medium">
                            {booking.booking_code}
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>

                        <h3 className="text-lg font-semibold text-[#14211D] truncate">
                          {booking.trip?.title || 'Paket Perjalanan'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#4A5550]">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#4A5550] flex-shrink-0" />
                            {booking.trip?.destination || 'Indonesia'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#4A5550] flex-shrink-0" />
                            {booking.travel_date}
                          </span>
                          <span>{booking.pax} Peserta</span>
                        </div>
                      </div>

                      {/* Right: Price & Track button */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E6E4DD]">
                        <div className="text-left md:text-right">
                          <span className="text-xs text-[#4A5550] block">Total Pembayaran</span>
                          <span className="tabular-nums font-bold text-[#14211D] text-lg">
                            {formatIDR(booking.total_price)}
                          </span>
                        </div>

                        <Link
                          to={`/track?code=${booking.booking_code}`}
                          className="inline-flex items-center justify-center border border-[#0F4C3A] text-[#0F4C3A] hover:bg-[#0F4C3A]/5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Lacak Pesanan
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Server-side pagination controls */}
              {meta.total_pages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-[#E6E4DD] pt-4 text-xs text-[#4A5550]">
                  <span>
                    Halaman <strong className="text-[#14211D]">{meta.page}</strong> dari{' '}
                    <strong className="text-[#14211D]">{meta.total_pages}</strong> ({meta.total} pesanan)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E6E4DD] bg-white hover:bg-[#FAF9F6] text-[#14211D] font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPage >= meta.total_pages}
                      onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E6E4DD] bg-white hover:bg-[#FAF9F6] text-[#14211D] font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
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
