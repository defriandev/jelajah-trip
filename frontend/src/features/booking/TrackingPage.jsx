import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Phone, Mail,
  CheckCircle, Clock, MessageCircle, ArrowRight, Loader2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { bookingService } from '../../services/api';

/* ─── Status helpers ──────────────────────────────────────────────── */
const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-emerald-50 text-[#0F4C3A] border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const STATUS_LABEL = {
  pending: 'Menunggu Verifikasi',
  confirmed: 'Terkonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};

/* ─── Timeline step definitions ──────────────────────────────────── */
const STEPS = [
  { key: 'received',  label: 'Pesanan Diterima' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'ready',     label: 'Siap Berangkat' },
  { key: 'done',      label: 'Selesai' },
];

/** Returns 0-based index of the "current" active step given booking status */
function activeStepIndex(status) {
  switch (status) {
    case 'confirmed':  return 1;
    case 'completed':  return 3;
    case 'cancelled':  return -1; // show nothing active
    default:           return 0;  // pending
  }
}

/* ─── Formatting ─────────────────────────────────────────────────── */
const formatIDR = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);

/* ═══════════════════════════════════════════════════════════════════ */
export default function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookingCode, setBookingCode] = useState(searchParams.get('code') || '');
  const [verification, setVerification] = useState(searchParams.get('verification') || '');
  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [searched, setSearched] = useState(false);

  const fetchTracking = async (codeToSearch, verifToSearch) => {
    const code = (codeToSearch !== undefined ? codeToSearch : bookingCode).trim().toUpperCase();
    const verif = (verifToSearch !== undefined ? verifToSearch : verification).trim();
    if (!code || !verif) {
      setError('Kode pesanan dan data verifikasi (email atau 4 digit nomor telepon) wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await bookingService.trackBooking(code, verif);
      if (res.success && res.data) {
        setBooking(res.data);
        setSearchParams({ code, verification: verif });
      }
    } catch (err) {
      setError(err.message || 'Pesanan tidak ditemukan atau data verifikasi tidak cocok.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  /* Auto-trigger if ?code= and ?verification= are present in URL */
  useEffect(() => {
    const initialCode = searchParams.get('code');
    const initialVerif = searchParams.get('verification');
    if (initialCode && initialVerif) {
      setBookingCode(initialCode);
      setVerification(initialVerif);
      fetchTracking(initialCode, initialVerif);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracking();
  };

  const stepIdx = booking ? activeStepIndex(booking.status) : -1;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
            Lacak Pesanan
          </p>
          <h1 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-3xl sm:text-4xl">
            Cek Status Pesanan Anda
          </h1>
          <p className="leading-[1.65] text-[#4A5550] text-sm">
            Masukkan kode pemesanan dan verifikasi keamanan (email atau 4 digit terakhir nomor telepon) untuk memantau status voucher perjalanan Anda.
          </p>
        </div>

        {/* ── Search card ──────────────────────────────────────────── */}
        <div className="max-w-lg mx-auto bg-white border border-[#E6E4DD] rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#14211D] mb-1.5 uppercase tracking-wider">
                Kode Pemesanan
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5550]" />
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="TRIP-20261118-XXXXXXXX"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] font-mono text-sm uppercase tracking-widest placeholder-[#4A5550]/40 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14211D] mb-1.5 uppercase tracking-wider">
                Verifikasi Pemesan (Email / 4 Digit No. HP)
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5550]" />
                <input
                  type="text"
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  placeholder="Contoh: budi@gmail.com atau 7890"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] text-sm placeholder-[#4A5550]/40 transition"
                />
              </div>
              <p className="text-[11px] text-[#4A5550]/70 mt-1">
                *Demi privasi transaksi, masukkan email pemesan atau 4 digit terakhir nomor telepon pemesan.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F4C3A] hover:bg-[#0A3629] disabled:opacity-60 text-white rounded-xl px-6 py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi & Mencari…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Lacak Pesanan
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── States ───────────────────────────────────────────────── */}

        {/* Not searched yet */}
        {!searched && !loading && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Search className="w-20 h-20 text-[#E6E4DD]" strokeWidth={1.2} />
            <p className="text-sm text-[#4A5550]/60">
              Hasil pencarian akan muncul di sini.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white border border-[#E6E4DD] rounded-2xl p-6 md:p-8 space-y-5 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-[#E6E4DD] rounded-lg" />
              <div className="h-6 w-24 bg-[#E6E4DD] rounded-full" />
            </div>
            <div className="h-px bg-[#E6E4DD]" />
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-[#E6E4DD] rounded" />
              <div className="h-4 w-1/2 bg-[#E6E4DD] rounded" />
              <div className="h-4 w-2/3 bg-[#E6E4DD] rounded" />
            </div>
            <div className="h-px bg-[#E6E4DD]" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-[#E6E4DD] rounded" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-lg mx-auto bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 leading-[1.65]">{error}</p>
          </div>
        )}

        {/* ── Result card ──────────────────────────────────────────── */}
        {booking && !loading && (
          <div className="bg-white border border-[#E6E4DD] rounded-2xl p-6 md:p-8 space-y-7">

            {/* Header: code + status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4A5550]">
                  Kode Pemesanan
                </p>
                <span className="font-mono text-sm bg-[#F4F2EC] rounded-lg px-3 py-1 text-[#14211D] font-semibold tracking-widest">
                  {booking.booking_code}
                </span>
                {booking.created_at && (
                  <p className="text-xs text-[#4A5550]/60 pt-0.5">
                    Dipesan pada{' '}
                    {new Date(booking.created_at).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start ${
                  STATUS_BADGE[booking.status] ?? STATUS_BADGE.pending
                }`}
              >
                {booking.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                {booking.status === 'confirmed' && <CheckCircle className="w-3.5 h-3.5" />}
                {booking.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
            </div>

            {/* Trip info */}
            {booking.trip && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-3">
                  Detail Perjalanan
                </p>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-lg">
                    {booking.trip.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-[#4A5550]">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-[#D97736]" />
                    <span>{booking.trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#4A5550]">
                    <Calendar className="w-4 h-4 flex-shrink-0 text-[#D97736]" />
                    <span>{booking.travel_date}</span>
                  </div>
                </div>
              </div>
            )}

            <hr className="border-[#E6E4DD]" />

            {/* Customer info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-3">
                Informasi Pemesan
              </p>
              <ul className="space-y-2 text-sm text-[#4A5550]">
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 flex-shrink-0 text-[#4A5550]/50" />
                  <span className="font-medium text-[#14211D]">{booking.customer_name}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0 text-[#4A5550]/50" />
                  <span>{booking.customer_email}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 text-[#4A5550]/50" />
                  <span>{booking.customer_phone}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 flex-shrink-0 text-[#4A5550]/50" />
                  <span>
                    Jumlah Orang:{' '}
                    <span className="font-semibold text-[#14211D] tabular-nums">
                      {booking.pax} Pax
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            <hr className="border-[#E6E4DD]" />

            {/* Total price */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4A5550]">Total Pembayaran</p>
              <p className="text-2xl font-bold tabular-nums text-[#14211D]">
                {formatIDR(booking.total_price)}
              </p>
            </div>

            <hr className="border-[#E6E4DD]" />

            {/* Timeline stepper */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4A5550] mb-6">
                Tahapan Pesanan
              </p>
              <div className="relative flex items-start justify-between">
                {STEPS.map((step, idx) => {
                  const isCompleted = stepIdx > idx;
                  const isCurrent  = stepIdx === idx;
                  const isFuture   = stepIdx < idx;

                  return (
                    <React.Fragment key={step.key}>
                      {/* Connector line (before each step except first) */}
                      {idx > 0 && (
                        <div
                          className={`flex-1 h-0.5 mt-5 mx-1 ${
                            isCompleted || (stepIdx >= idx)
                              ? 'bg-[#0F4C3A]'
                              : 'bg-[#E6E4DD]'
                          }`}
                        />
                      )}

                      {/* Step node */}
                      <div className="flex flex-col items-center gap-2 min-w-[56px]">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                            isCompleted
                              ? 'bg-[#0F4C3A] text-white'
                              : isCurrent
                              ? 'border-2 border-[#0F4C3A] text-[#0F4C3A] bg-white'
                              : 'bg-[#E6E4DD] text-[#4A5550]'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] text-center leading-tight font-medium ${
                            isFuture ? 'text-[#4A5550]/50' : 'text-[#14211D]'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo Admin Jelajah Trip, saya ingin konfirmasi pembayaran untuk kode pesanan: ${booking.booking_code}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Konfirmasi via WhatsApp
              </a>
              <Link
                to="/trips"
                className="flex items-center justify-center gap-2 border border-[#14211D]/20 hover:bg-[#14211D]/5 text-[#14211D] rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
              >
                Lihat Paket Lain
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
