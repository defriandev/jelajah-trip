import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Clock, Star, ArrowUpRight, Heart, Check
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative rounded-2xl bg-white border border-[#E6E4DD] overflow-hidden shadow-xs hover:shadow-[0_16px_36px_rgba(20,33,29,0.08)] hover:border-[#0F4C3A]/30 flex flex-col transition-shadow"
    >
      {/* Photo Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F4F2EC]">
        <img
          src={trip.image_url}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-[#14211D] shadow-sm border border-[#E6E4DD]">
              <Clock className="w-3 h-3 text-[#4A5550]" />
              {trip.duration}
            </span>

            {trip.quota <= 15 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#D97736] text-white shadow-sm">
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
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-[#E6E4DD] flex items-center justify-center text-[#4A5550] hover:text-[#D97736] hover:scale-105 transition-all shadow-sm"
            aria-label="Simpan Favorit"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? 'fill-[#D97736] text-[#D97736]' : ''}`} />
          </motion.button>
        </div>

        {/* Bottom Destination Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#14211D]/80 backdrop-blur-md text-white">
            <MapPin className="w-3 h-3 text-white/80" />
            <span className="truncate max-w-[180px]">{trip.destination}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs mb-2">
            <div className="flex items-center text-[#D97736]">
              <Star className="w-3.5 h-3.5 fill-[#D97736]" />
            </div>
            <span className="font-semibold text-[#14211D] tabular-nums">{avgRating}</span>
            <span className="text-[#4A5550] text-[11px]">({reviewsCount > 0 ? reviewsCount : '12'} ulasan)</span>
          </div>

          {/* Title */}
          <Link to={`/trips/${trip.id}`}>
            <h3 className="text-base font-bold text-[#14211D] group-hover:text-[#0F4C3A] transition-colors line-clamp-1 font-display">
              {trip.title}
            </h3>
          </Link>

          <p className="mt-1.5 text-xs text-[#4A5550] line-clamp-2 leading-relaxed">
            {trip.description}
          </p>

          {/* Facilities Tags */}
          {trip.facilities && trip.facilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {trip.facilities.slice(0, 2).map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#FAF9F6] border border-[#E6E4DD] text-[#4A5550]"
                >
                  <Check className="w-2.5 h-2.5 text-[#0F4C3A]" />
                  <span className="truncate max-w-[120px]">{f}</span>
                </span>
              ))}
              {trip.facilities.length > 2 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium text-[#4A5550] bg-[#FAF9F6] border border-[#E6E4DD]">
                  +{trip.facilities.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3.5 border-t border-[#E6E4DD] flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#4A5550] font-medium">
              Mulai Dari
            </span>
            <div className="text-base font-extrabold text-[#14211D] tabular-nums font-display">
              {formatIDR(trip.price)}
              <span className="text-[11px] font-normal text-[#4A5550]">/pax</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/trips/${trip.id}`}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#14211D] border border-[#E6E4DD] hover:bg-[#FAF9F6] transition-colors"
            >
              Detail
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={`/booking/${trip.id}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F4C3A] hover:bg-[#0A3629] transition-colors shadow-sm"
              >
                Pesan
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}