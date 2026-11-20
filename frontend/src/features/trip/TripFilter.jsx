import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export default function TripFilter({
  filters,
  destinations,
  onFilterChange,
  onReset,
}) {
  return (
    <div className="bg-white border border-[#E6E4DD] rounded-2xl p-5 shadow-sm mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pencarian Kata Kunci */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5550]">
            Cari Destinasi / Trip
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5550]" />
            <input
              type="text"
              placeholder="Contoh: Raja Ampat, Bromo..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] text-xs text-[#14211D] placeholder-[#4A5550]/60 focus:outline-none focus:border-[#0F4C3A] transition-colors"
            />
          </div>
        </div>

        {/* Filter Destinasi */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5550]">
            Wilayah Destinasi
          </label>
          <select
            value={filters.destination}
            onChange={(e) => onFilterChange('destination', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] text-xs text-[#14211D] focus:outline-none focus:border-[#0F4C3A] transition-colors cursor-pointer"
          >
            <option value="">Semua Wilayah</option>
            {destinations.map((dest, i) => (
              <option key={i} value={dest}>
                {dest}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Durasi */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5550]">
            Durasi Perjalanan
          </label>
          <select
            value={filters.duration}
            onChange={(e) => onFilterChange('duration', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] text-xs text-[#14211D] focus:outline-none focus:border-[#0F4C3A] transition-colors cursor-pointer"
          >
            <option value="">Semua Durasi</option>
            <option value="2D1N">2 Hari 1 Malam (2D1N)</option>
            <option value="3D2N">3 Hari 2 Malam (3D2N)</option>
            <option value="4D3N">4 Hari 3 Malam (4D3N)</option>
          </select>
        </div>

        {/* Urutkan / Sort By */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5550]">
            Urutkan
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] text-xs text-[#14211D] focus:outline-none focus:border-[#0F4C3A] transition-colors cursor-pointer"
            >
              <option value="newest">Terpopuler & Terbaru</option>
              <option value="price_asc">Harga: Rendah ke Tinggi</option>
              <option value="price_desc">Harga: Tinggi ke Rendah</option>
            </select>

            <button
              onClick={onReset}
              title="Reset Filter"
              className="px-3 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#E6E4DD] border border-[#E6E4DD] text-[#4A5550] hover:text-[#14211D] transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
