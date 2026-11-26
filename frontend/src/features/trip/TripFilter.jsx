import React from 'react';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';

export default function TripFilter({
  filters,
  destinations,
  onFilterChange,
  onReset,
}) {
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_-8px_rgba(8,38,30,0.04)] mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pencarian Kata Kunci */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Search className="w-3 h-3 text-[#C5A059]" />
            Cari Destinasi / Trip
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Contoh: Raja Ampat, Bromo..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[#FCFCFA] border border-[#EAE7DF] text-xs text-[#08261E] placeholder-[#64748B]/50 focus:outline-none focus:border-[#08261E] focus:ring-1 focus:ring-[#08261E] transition-all"
            />
          </div>
        </div>

        {/* Filter Destinasi */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Wilayah Destinasi
          </label>
          <select
            value={filters.destination}
            onChange={(e) => onFilterChange('destination', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full bg-[#FCFCFA] border border-[#EAE7DF] text-xs text-[#08261E] focus:outline-none focus:border-[#08261E] focus:ring-1 focus:ring-[#08261E] transition-all cursor-pointer font-medium"
          >
            <option value="">Semua Wilayah Indonesia</option>
            {destinations.map((dest, i) => (
              <option key={i} value={dest}>
                {dest}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Durasi */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Durasi Perjalanan
          </label>
          <select
            value={filters.duration}
            onChange={(e) => onFilterChange('duration', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full bg-[#FCFCFA] border border-[#EAE7DF] text-xs text-[#08261E] focus:outline-none focus:border-[#08261E] focus:ring-1 focus:ring-[#08261E] transition-all cursor-pointer font-medium"
          >
            <option value="">Semua Durasi</option>
            <option value="2D1N">2 Hari 1 Malam (2D1N)</option>
            <option value="3D2N">3 Hari 2 Malam (3D2N)</option>
            <option value="4D3N">4 Hari 3 Malam (4D3N)</option>
          </select>
        </div>

        {/* Urutkan / Sort By */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Urutkan
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-[#FCFCFA] border border-[#EAE7DF] text-xs text-[#08261E] focus:outline-none focus:border-[#08261E] focus:ring-1 focus:ring-[#08261E] transition-all cursor-pointer font-medium"
            >
              <option value="newest">Terpopuler & Terbaru</option>
              <option value="price_asc">Harga: Terjangkau ke Tinggi</option>
              <option value="price_desc">Harga: Tertinggi ke Rendah</option>
            </select>

            <button
              onClick={onReset}
              title="Reset Filter"
              className="px-3.5 py-2.5 rounded-full bg-[#FCFCFA] hover:bg-[#F4F0E8] border border-[#EAE7DF] text-[#64748B] hover:text-[#08261E] transition-colors flex items-center justify-center shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
