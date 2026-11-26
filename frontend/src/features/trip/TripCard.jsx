import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Clock, Star, ArrowUpRight, Heart, Check, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TripCard({ trip }) {
  const [isLiked, setIsLiked] = useState(false);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const reviewsCount = trip.reviews?.length || 0;
  const avgRating = reviewsCount > 0
    ? (trip.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1)
    : '4.9';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-3xl bg-white border border-[#EAE7DF] overflow-hidden shadow-[0_4px_20px_rgba(8,38,30,0.03)] hover:shadow-[0_20px_45px_-10px_rgba(8,38,30,0.12)] hover:border-[#C5A059]/50 flex flex-col transition-all duration-500"
    >
      {/* Photo Container */}
      <div className="relative aspect-[16/11] overflow-hidden bg-[#F4F0E8]">
        <img
          src={trip.image_url}
          alt={trip.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-1000 ease-out"
          loading="lazy"
        />

        {/* Ambient Top Gradient Scrim */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-md text-[#08261E] shadow-xs border border-white/60">
              <Clock className="w-3 h-3 text-[#C5A059]" />
              {trip.duration}
            </span>

            {trip.quota <= 15 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#08261E]/95 text-[#F5E4BE] shadow-xs border border-[#C5A059]/40 backdrop-blur-md">
                <Sparkles className="w-2.5 h-2.5 text-[#C5A059]" />
                Sisa {trip.quota} Kuota
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/60 flex items-center justify-center text-[#64748B] hover:text-[#C5A059] hover:scale-105 transition-all shadow-xs"
            aria-label="Simpan Favorit"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? 'fill-[#C5A059] text-[#C5A059]' : ''}`} />
          </motion.button>
        </div>

        {/* Bottom Destination Tag */}
        <div className="absolute bottom-3.5 left-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#08261E]/80 backdrop-blur-md text-[#F4F0E8] border border-white/10 shadow-xs">
            <MapPin className="w-3 h-3 text-[#C5A059]" />
            <span className="truncate max-w-[200px]">{trip.destination}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Rating & Review */}
          <div className="flex items-center gap-1.5 text-xs mb-2">
            <div className="flex items-center text-[#C5A059]">
              <Star className="w-3.5 h-3.5 fill-[#C5A059]" />
            </div>
            <span className="font-bold text-[#08261E] tabular-nums">{avgRating}</span>
            <span className="text-[#64748B] text-[11px]">({reviewsCount > 0 ? reviewsCount : '18'} ulasan terverifikasi)</span>
          </div>

          {/* Title */}
          <Link to={`/trips/${trip.id}`}>
            <h3 className="font-serif text-lg font-bold text-[#08261E] group-hover:text-[#C5A059] transition-colors line-clamp-1">
              {trip.title}
            </h3>
          </Link>

          <p className="mt-2 text-xs text-[#64748B] line-clamp-2 leading-relaxed">
            {trip.description}
          </p>

          {/* Facilities Tags */}
          {trip.facilities && trip.facilities.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {trip.facilities.slice(0, 2).map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#08261E]/5 text-[#08261E] border border-[#08261E]/10"
                >
                  <Check className="w-2.5 h-2.5 text-[#C5A059]" />
                  <span className="truncate max-w-[120px]">{f}</span>
                </span>
              ))}
              {trip.facilities.length > 2 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[#64748B] bg-[#F4F0E8] border border-[#EAE7DF]">
                  +{trip.facilities.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-[#EAE7DF]/70 flex items-center justify-between">
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-[#64748B] font-semibold">
              Mulai Dari
            </span>
            <div className="text-lg font-extrabold text-[#08261E] tabular-nums font-sans">
              {formatIDR(trip.price)}
              <span className="text-[11px] font-normal text-[#64748B] ml-0.5">/pax</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/trips/${trip.id}`}
              className="px-3.5 py-2 rounded-full text-xs font-semibold text-[#08261E] border border-[#EAE7DF] hover:bg-[#F4F0E8] transition-colors"
            >
              Detail
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to={`/booking/${trip.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#F5E4BE] bg-[#08261E] hover:bg-[#0D3B2E] transition-all shadow-md shadow-[#08261E]/15 border border-[#C5A059]/30"
              >
                <span>Pesan</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
