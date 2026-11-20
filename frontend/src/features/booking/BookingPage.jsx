import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, Copy, Check, ArrowRight, AlertCircle, Loader2, Home, UserPlus,
} from 'lucide-react';
import { tripService, bookingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BookingForm from './BookingForm';
import BookingSummaryCard from './BookingSummaryCard';

export default function BookingPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Success modal state
  const [createdBooking, setCreatedBooking] = useState(null);
  const [copied, setCopied] = useState(false);

  // Live summary state driven by form changes
  const [formSummary, setFormSummary] = useState({ pax: 1, travel_date: '' });

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await tripService.getTripByID(tripId);
        if (res.success && res.data) {
          setTrip(res.data);
        } else {
          setError('Gagal memuat paket wisata');
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat paket wisata');
      } finally {
        setLoading(false);
      }
    };

    if (tripId) fetchTrip();
  }, [tripId]);

  const handleSuccess = (bookingData) => {
    setCreatedBooking(bookingData);
  };

  const handleFormChange = ({ pax, travel_date }) => {
    setFormSummary({ pax, travel_date });
  };

  const handleCopyCode = () => {
    if (createdBooking?.booking_code) {
      navigator.clipboard.writeText(createdBooking.booking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#0F4C3A]" />
        <p className="text-sm text-[#4A5550]">Menyiapkan formulir pemesanan…</p>
      </div>
    );
  }

  /* ── Trip not found ── */
  if (!trip) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-display font-bold tracking-[-0.03em] text-[#14211D]">
          Paket Wisata Tidak Ditemukan
        </h2>
        <p className="text-sm text-[#4A5550]">{error || 'Paket yang kamu cari tidak tersedia.'}</p>
        <Link
          to="/trips"
          className="bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
        >
          Lihat Katalog Trip
        </Link>
      </div>
    );
  }

  const formatIDR = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#4A5550] mb-8 flex-wrap">
          <Link to="/" className="hover:text-[#14211D] transition-colors">Beranda</Link>
          <span className="opacity-40">/</span>
          <Link to="/trips" className="hover:text-[#14211D] transition-colors">Paket Trip</Link>
          <span className="opacity-40">/</span>
          <Link to={`/trips/${trip.id}`} className="hover:text-[#14211D] transition-colors truncate max-w-[180px]">
            {trip.title}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-[#14211D] font-medium">Pemesanan</span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-1">PEMESANAN</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-[-0.03em] text-[#14211D]">
            Pesan Paket Trip
          </h1>
          <p className="text-sm leading-[1.65] text-[#4A5550] mt-1">
            Lengkapi data pemesanan di bawah untuk reservasi instan.
          </p>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left — Booking Form */}
          <div className="lg:col-span-8">
            <BookingForm
              trip={trip}
              user={user}
              onSuccess={handleSuccess}
              onFormChange={handleFormChange}
            />
          </div>

          {/* Right — Summary Card */}
          <div className="lg:col-span-4">
            <BookingSummaryCard
              trip={trip}
              pax={formSummary.pax}
              travelDate={formSummary.travel_date}
            />
          </div>
        </div>
      </div>

      {/* ── Success Modal ── */}
      {createdBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6E4DD] shadow-xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">

            {/* Check icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#EBF4F0] flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-[#0F4C3A]" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-display font-bold tracking-[-0.03em] text-[#14211D]">
                Pemesanan Berhasil!
              </h3>
              <p className="text-sm leading-[1.65] text-[#4A5550]">
                Simpan kode ini untuk melacak pesanan Anda.
              </p>
            </div>

            {/* Booking code */}
            <div className="bg-[#F4F2EC] border border-[#E6E4DD] rounded-xl p-4 text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4A5550]">Kode Pemesanan</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-lg font-bold text-[#14211D] tracking-widest">
                  {createdBooking.booking_code}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Salin kode"
                  className="p-1.5 rounded-lg border border-[#E6E4DD] bg-white hover:bg-[#FAF9F6] text-[#4A5550] transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#0F4C3A]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-[#0F4C3A] font-medium">Berhasil disalin!</p>
              )}
            </div>

            {/* Brief info */}
            <div className="space-y-2 text-sm border-t border-[#E6E4DD] pt-4">
              <div className="flex justify-between">
                <span className="text-[#4A5550]">Paket Wisata</span>
                <span className="font-medium text-[#14211D] truncate max-w-[180px] text-right">{trip.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5550]">Atas Nama</span>
                <span className="font-medium text-[#14211D]">{createdBooking.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5550]">Total Tagihan</span>
                <span className="font-bold tabular-nums text-[#14211D]">
                  {formatIDR(createdBooking.total_price)}
                </span>
              </div>
            </div>

            {/* Hybrid Checkout: Guest Account Link Banner */}
            {!user && (
              <div className="bg-[#EBF4F0] border border-[#C5DFD6] rounded-xl p-3.5 text-left space-y-2">
                <div className="flex items-start gap-2.5">
                  <UserPlus className="w-5 h-5 text-[#0F4C3A] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#2D3732] leading-relaxed">
                    <p className="font-semibold text-[#0F4C3A]">Simpan tiket ke akun Anda?</p>
                    <p className="mt-0.5 text-[#4A5550]">
                      Buat akun sekarang dengan email <strong className="text-[#14211D]">{createdBooking.customer_email}</strong> agar riwayat perjalanan tersimpan otomatis dan Anda dapat memberikan ulasan setelah trip selesai.
                    </p>
                  </div>
                </div>
                <div className="pt-0.5">
                  <Link
                    to={`/register?email=${encodeURIComponent(createdBooking.customer_email || '')}&name=${encodeURIComponent(createdBooking.customer_name || '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C3A] hover:underline"
                  >
                    Daftar Akun Sekarang <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to={`/tracking?code=${createdBooking.booking_code}`}
                className="flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
              >
                Lacak Pesanan
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 border border-[#14211D]/20 hover:bg-[#14211D]/5 text-[#14211D] rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
