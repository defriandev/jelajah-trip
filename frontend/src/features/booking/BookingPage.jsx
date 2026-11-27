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
      <div className="min-h-screen bg-[#FCFCFA] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#08261E]" />
        <p className="text-xs text-[#64748B]">Menyiapkan formulir pemesanan…</p>
      </div>
    );
  }

  /* ── Trip not found ── */
  if (!trip) {
    return (
      <div className="min-h-screen bg-[#FCFCFA] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-serif font-bold text-[#111827]">
          Paket Wisata Tidak Ditemukan
        </h2>
        <p className="text-sm text-[#64748B]">{error || 'Paket yang kamu cari tidak tersedia.'}</p>
        <Link
          to="/trips"
          className="bg-[#08261E] hover:bg-[#0D3B2E] text-[#F5E4BE] rounded-full px-7 py-3.5 font-semibold text-xs transition-colors shadow-sm border border-[#C5A059]/30"
        >
          Lihat Katalog Trip
        </Link>
      </div>
    );
  }

  const formatIDR = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#FCFCFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-8 flex-wrap">
          <Link to="/" className="hover:text-[#08261E] transition-colors">Beranda</Link>
          <span className="opacity-40">/</span>
          <Link to="/trips" className="hover:text-[#08261E] transition-colors">Paket Trip</Link>
          <span className="opacity-40">/</span>
          <Link to={`/trips/${trip.id}`} className="hover:text-[#08261E] transition-colors truncate max-w-[180px]">
            {trip.title}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-[#08261E] font-medium">Pemesanan</span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7532] mb-1">RESERVASI EKSKLUSIF</p>
          <h1 className="text-2xl sm:text-4xl font-serif font-medium text-[#08261E]">
            Formulir Reservasi Perjalanan
          </h1>
          <p className="text-sm text-[#475569] mt-1.5 font-normal">
            Lengkapi data pemesanan di bawah untuk konfirmasi jadwal terjamin.
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE7DF] shadow-2xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">

            {/* Check icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#08261E]/8 flex items-center justify-center border border-[#08261E]/15">
                <CheckCircle className="w-9 h-9 text-[#08261E]" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-serif font-bold text-[#08261E]">
                Reservasi Berhasil Diterbitkan!
              </h3>
              <p className="text-xs text-[#64748B]">
                Simpan kode unik di bawah ini untuk melacak status pesanan Anda.
              </p>
            </div>

            {/* Booking code */}
            <div className="bg-[#FCFCFA] border border-[#EAE7DF] rounded-2xl p-4 text-center space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">Kode Pemesanan Resmi</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xl font-bold text-[#08261E] tracking-widest">
                  {createdBooking.booking_code}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Salin kode"
                  className="p-2 rounded-xl border border-[#EAE7DF] bg-white hover:bg-[#F4F0E8] text-[#08261E] transition-colors shadow-2xs"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#C5A059]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-[11px] text-[#C5A059] font-semibold">Kode berhasil disalin ke clipboard!</p>
              )}
            </div>

            {/* Brief info */}
            <div className="space-y-2.5 text-xs border-t border-[#EAE7DF]/70 pt-4">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Paket Wisata</span>
                <span className="font-semibold text-[#08261E] truncate max-w-[180px] text-right">{trip.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Atas Nama</span>
                <span className="font-semibold text-[#08261E]">{createdBooking.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Tagihan</span>
                <span className="font-bold tabular-nums text-[#08261E] text-sm font-sans">
                  {formatIDR(createdBooking.total_price)}
                </span>
              </div>
            </div>

            {/* Hybrid Checkout: Guest Account Link Banner */}
            {!user && (
              <div className="bg-[#08261E]/5 border border-[#08261E]/15 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <UserPlus className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#08261E] leading-relaxed">
                    <p className="font-bold text-[#08261E]">Simpan tiket ke akun pribadi?</p>
                    <p className="mt-0.5 text-[#64748B] text-[11px]">
                      Buat akun sekarang dengan email <strong className="text-[#08261E]">{createdBooking.customer_email}</strong> agar riwayat perjalanan tersimpan otomatis dan Anda dapat memberikan ulasan setelah trip selesai.
                    </p>
                  </div>
                </div>
                <div className="pt-0.5">
                  <Link
                    to={`/register?email=${encodeURIComponent(createdBooking.customer_email || '')}&name=${encodeURIComponent(createdBooking.customer_name || '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#08261E] hover:text-[#C5A059] transition-colors"
                  >
                    Daftar Akun Sekarang <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                  </Link>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to={`/tracking?code=${createdBooking.booking_code}`}
                className="flex items-center justify-center gap-2 bg-[#08261E] hover:bg-[#0D3B2E] text-[#F5E4BE] rounded-full px-5 py-3.5 font-semibold text-xs transition-colors shadow-md border border-[#C5A059]/30"
              >
                <span>Lacak Pesanan</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 border border-[#EAE7DF] hover:bg-[#FCFCFA] text-[#08261E] rounded-full px-5 py-3.5 font-semibold text-xs transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
