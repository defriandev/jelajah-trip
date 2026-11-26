import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Phone, Mail,
  CheckCircle, Clock, MessageCircle, ArrowRight, Loader2, AlertCircle, ShieldCheck, Sparkles
} from 'lucide-react';
import { bookingService } from '../../services/api';

/* ─── Status helpers ──────────────────────────────────────────────── */
const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  confirmed: 'bg-[#08261E]/8 text-[#08261E] border border-[#08261E]/20',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200/80',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200/80',
};

const STATUS_LABEL = {
  pending: 'Menunggu Verifikasi Pembayaran',
  confirmed: 'Jadwal Terkonfirmasi (Siap Berangkat)',
  cancelled: 'Dibatalkan',
  completed: 'Perjalanan Selesai',
};

/* ─── Timeline step definitions ──────────────────────────────────── */
const STEPS = [
  { key: 'received',  label: 'Pesanan Diterima' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'ready',     label: 'Siap Berangkat' },
  { key: 'done',      label: 'Selesai' },
];

function activeStepIndex(status) {
  switch (status) {
    case 'confirmed':  return 1;
    case 'completed':  return 3;
    case 'cancelled':  return -1;
    default:           return 0; // pending
  }
}

const formatIDR = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);

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

  useEffect(() => {
    const initialCode = searchParams.get('code');
    const initialVerif = searchParams.get('verification');
    if (initialCode && initialVerif) {
      setBookingCode(initialCode);
      setVerification(initialVerif);
      fetchTracking(initialCode, initialVerif);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracking();
  };

  const stepIdx = booking ? activeStepIndex(booking.status) : -1;

  return (
    <div className="min-h-screen bg-[#FCFCFA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#C5A059]/30 text-[11px] font-semibold text-[#08261E] tracking-wider uppercase shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            Lacak Status Reservasi
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#08261E]">
            Pantau Perjalanan Anda
          </h1>
          <p className="leading-relaxed text-[#64748B] text-xs sm:text-sm max-w-xl mx-auto font-light">
            Masukkan kode pemesanan resmi dan verifikasi keamanan (email atau 4 digit terakhir nomor WhatsApp) untuk memantau status konfirmasi tiket Anda.
          </p>
        </div>

        {/* ── Search card ──────────────────────────────────────────── */}
        <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-7 sm:p-8 shadow-xl shadow-[#08261E]/4">
          <form onSubmit={handleSearchSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#08261E] mb-2 uppercase tracking-wider">
                Kode Pemesanan Resmi
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059]" />
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="TRIP-20261118-XXXXXXXX"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#08261E] font-mono text-xs uppercase tracking-widest placeholder-[#64748B]/40 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#08261E] mb-2 uppercase tracking-wider">
                Verifikasi Pemesan (Email / 4 Digit No. HP)
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059]" />
                <input
                  type="text"
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  placeholder="Contoh: budi@gmail.com atau 7890"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] text-xs placeholder-[#64748B]/40 transition"
                />
              </div>
              <p className="text-[11px] text-[#64748B]/70 mt-1.5">
                *Demi privasi transaksi, masukkan alamat email atau 4 digit nomor telepon saat pemesanan.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#08261E] hover:bg-[#0D3B2E] disabled:opacity-50 text-[#F5E4BE] rounded-full px-6 py-4 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#08261E]/15 border border-[#C5A059]/40 mt-3 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                  Memverifikasi Data…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#C5A059]" />
                  Lacak Status Pemesanan
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── States ───────────────────────────────────────────────── */}
        {!searched && !loading && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-[#EAE7DF] flex items-center justify-center text-[#C5A059] shadow-xs">
              <Search className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-[#64748B]">
              Masukkan kode pesanan Anda di atas untuk melihat detail perjalanan.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white border border-[#EAE7DF] rounded-3xl p-8 space-y-6 animate-pulse shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 bg-[#EAE7DF] rounded-full" />
              <div className="h-7 w-28 bg-[#EAE7DF] rounded-full" />
            </div>
            <div className="h-px bg-[#EAE7DF]" />
            <div className="space-y-3">
              <div className="h-5 w-3/4 bg-[#EAE7DF] rounded-lg" />
              <div className="h-4 w-1/2 bg-[#EAE7DF] rounded-lg" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 rounded-3xl p-6 flex items-start gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 leading-relaxed font-medium">{error}</p>
          </div>
        )}

        {/* ── Result card ──────────────────────────────────────────── */}
        {booking && !loading && (
          <div className="bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-7 sm:p-10 space-y-8 shadow-xl shadow-[#08261E]/4">

            {/* Header: code + status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                  Kode Pemesanan
                </p>
                <span className="font-mono text-base bg-[#FCFCFA] rounded-full px-4 py-1.5 text-[#08261E] font-bold tracking-widest border border-[#EAE7DF] inline-block shadow-2xs">
                  {booking.booking_code}
                </span>
                {booking.created_at && (
                  <p className="text-[11px] text-[#64748B] pt-1">
                    Diterbitkan pada{' '}
                    {new Date(booking.created_at).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold self-start shadow-2xs ${
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
              <div className="bg-[#FCFCFA] p-6 rounded-3xl border border-[#EAE7DF]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-2">
                  Detail Ekspedisi
                </p>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold text-[#08261E]">
                    {booking.trip.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                      {booking.trip.destination}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                      {booking.travel_date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                      {booking.pax} Peserta (Pax)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer & Payment info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                  Informasi Pemesan
                </p>
                <div className="text-xs text-[#64748B] space-y-1.5">
                  <p><strong className="text-[#08261E]">{booking.customer_name}</strong></p>
                  <p>{booking.customer_email}</p>
                  <p>{booking.customer_phone}</p>
                </div>
              </div>

              <div className="space-y-2 sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                  Total Biaya All-Inclusive
                </p>
                <p className="text-2xl font-extrabold tabular-nums text-[#08261E] font-sans">
                  {formatIDR(booking.total_price)}
                </p>
                <p className="text-[11px] text-[#64748B]">Termasuk PPN, Guide & Asuransi</p>
              </div>
            </div>

            <hr className="border-[#EAE7DF]/70" />

            {/* Timeline stepper */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B] mb-6">
                Progres Tahapan Pemesanan
              </p>
              <div className="relative flex items-start justify-between">
                {STEPS.map((step, idx) => {
                  const isCompleted = stepIdx > idx;
                  const isCurrent  = stepIdx === idx;
                  const isFuture   = stepIdx < idx;

                  return (
                    <React.Fragment key={step.key}>
                      {idx > 0 && (
                        <div
                          className={`flex-1 h-0.5 mt-5 mx-1 transition-colors ${
                            isCompleted || (stepIdx >= idx)
                              ? 'bg-[#08261E]'
                              : 'bg-[#EAE7DF]'
                          }`}
                        />
                      )}

                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all shadow-2xs ${
                            isCompleted
                              ? 'bg-[#08261E] text-[#F5E4BE]'
                              : isCurrent
                              ? 'border-2 border-[#08261E] text-[#08261E] bg-white font-bold'
                              : 'bg-[#FCFCFA] border border-[#EAE7DF] text-[#64748B]/50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-[#C5A059]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] text-center leading-tight font-medium ${
                            isFuture ? 'text-[#64748B]/50' : 'text-[#08261E] font-semibold'
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
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo Admin Jelajah Trip, saya ingin konfirmasi pembayaran untuk kode pesanan: ${booking.booking_code}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#08261E] hover:bg-[#0D3B2E] text-[#F5E4BE] rounded-full px-6 py-4 font-semibold text-xs transition-all shadow-lg shadow-[#08261E]/15 border border-[#C5A059]/40"
              >
                <MessageCircle className="w-4 h-4 text-[#C5A059]" />
                Konfirmasi Pembayaran via WhatsApp
              </a>
              <Link
                to="/trips"
                className="flex items-center justify-center gap-2 border border-[#EAE7DF] hover:bg-[#FCFCFA] text-[#08261E] rounded-full px-6 py-4 font-semibold text-xs transition-colors"
              >
                Lihat Destinasi Lain
                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
