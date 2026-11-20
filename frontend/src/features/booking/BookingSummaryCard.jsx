import React from 'react';
import { MapPin, Clock, Calendar, Users } from 'lucide-react';

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
    <div className="bg-white border border-[#E6E4DD] rounded-2xl p-6 sticky top-24 space-y-5">

      {/* Eyebrow */}
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
        RINGKASAN PESANAN
      </p>

      {/* Trip image thumbnail */}
      {trip?.image_url && (
        <div className="rounded-xl overflow-hidden aspect-video">
          <img
            src={trip.image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Trip title */}
      <h3 className="text-lg font-semibold text-[#14211D] leading-snug">
        {trip?.title}
      </h3>

      {/* Details list */}
      <ul className="space-y-3 text-sm text-[#4A5550]">
        <li className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#0F4C3A] flex-shrink-0 mt-0.5" />
          <span>{trip?.destination || '—'}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-[#0F4C3A] flex-shrink-0 mt-0.5" />
          <span>{trip?.duration || '—'}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-[#0F4C3A] flex-shrink-0 mt-0.5" />
          <span>{travelDate ? formatDate(travelDate) : <em className="opacity-50 not-italic">Belum dipilih</em>}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Users className="w-4 h-4 text-[#0F4C3A] flex-shrink-0 mt-0.5" />
          <span>{pax ? `${pax} orang` : <em className="opacity-50 not-italic">Belum dipilih</em>}</span>
        </li>
      </ul>

      {/* Price breakdown */}
      <div className="border-t border-[#E6E4DD] pt-4 space-y-2.5">
        {hasSelection ? (
          <>
            <div className="flex justify-between text-sm text-[#4A5550]">
              <span>Harga per orang</span>
              <span className="tabular-nums font-medium text-[#14211D]">{formatIDR(pricePerPax)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#4A5550]">
              <span>× {pax} peserta</span>
              <span className="tabular-nums font-medium text-[#14211D]">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#4A5550]">
              <span>Biaya layanan</span>
              <span className="text-[#0F4C3A] font-medium">Gratis</span>
            </div>
            <div className="border-t border-[#E6E4DD] pt-3 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#14211D]">Total</span>
              <span className="text-2xl font-bold tabular-nums text-[#14211D]">{formatIDR(subtotal)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#4A5550]/60 italic text-center py-2">
            Isi formulir untuk melihat total harga
          </p>
        )}
      </div>

      {/* Quota note */}
      {trip?.quota !== undefined && (
        <p className="text-xs text-[#4A5550] text-center">
          Tersisa{' '}
          <span className={`font-semibold ${trip.quota < 10 ? 'text-[#D97736]' : 'text-[#0F4C3A]'}`}>
            {trip.quota} kuota
          </span>{' '}
          tersedia
        </p>
      )}
    </div>
  );
}
