import React from 'react';
import { MapPin, Clock, Calendar, Users, Sparkles } from 'lucide-react';

export default function BookingSummaryCard({ trip, pax, travelDate }) {
  const formatIDR = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  const pricePerPax = trip?.price || 0;
  const hasSelection = travelDate && pax >= 1;
  const subtotal = pricePerPax * (pax || 1);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-7 sticky top-28 space-y-6 shadow-xl shadow-[#08261E]/4">

      {/* Eyebrow */}
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
        <span>Ringkasan Reservasi</span>
      </div>

      {/* Trip image thumbnail */}
      {trip?.image_url && (
        <div className="rounded-2xl overflow-hidden aspect-[16/10] border border-[#EAE7DF]">
          <img
            src={trip.image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Trip title */}
      <h3 className="font-serif text-xl font-bold text-[#08261E] leading-snug">
        {trip?.title}
      </h3>

      {/* Details list */}
      <ul className="space-y-3.5 text-xs text-[#64748B]">
        <li className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
          <span className="font-medium text-[#111827]">{trip?.destination || '—'}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
          <span>{trip?.duration || '—'}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
          <span>{travelDate ? formatDate(travelDate) : <em className="opacity-50 not-italic">Belum ditentukan</em>}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Users className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
          <span>{pax ? `${pax} peserta` : <em className="opacity-50 not-italic">Belum ditentukan</em>}</span>
        </li>
      </ul>

      {/* Price breakdown */}
      <div className="border-t border-[#EAE7DF]/70 pt-5 space-y-3">
        {hasSelection ? (
          <>
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Tarif per orang</span>
              <span className="tabular-nums font-semibold text-[#111827]">{formatIDR(pricePerPax)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Kuantitas ({pax} peserta)</span>
              <span className="tabular-nums font-semibold text-[#111827]">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Biaya Layanan & Asuransi</span>
              <span className="text-[#08261E] font-bold">Termasuk</span>
            </div>
            <div className="border-t border-[#EAE7DF]/70 pt-4 flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-wider font-bold text-[#64748B]">Total Pembayaran</span>
              <span className="text-2xl font-extrabold tabular-nums text-[#08261E] font-sans">{formatIDR(subtotal)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-[#64748B]/70 italic text-center py-2 font-light">
            Lengkapi data formulir untuk menghitung kalkulasi biaya
          </p>
        )}
      </div>

      {/* Quota note */}
      {trip?.quota !== undefined && (
        <p className="text-[11px] text-[#64748B] text-center bg-[#FCFCFA] py-2 px-3 rounded-full border border-[#EAE7DF]">
          Tersisa{' '}
          <span className={`font-bold tabular-nums ${trip.quota < 10 ? 'text-amber-700' : 'text-[#08261E]'}`}>
            {trip.quota} kuota
          </span>{' '}
          pada jadwal ini
        </p>
      )}
    </div>
  );
}
