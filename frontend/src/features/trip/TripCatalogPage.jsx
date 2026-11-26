import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, AlertCircle, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { tripService } from '../../services/api';
import TripCard from './TripCard';
import TripFilter from './TripFilter';

export default function TripCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12, total_pages: 1 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    destination: searchParams.get('destination') || '',
    duration: searchParams.get('duration') || '',
    sortBy: searchParams.get('sort_by') || 'newest',
  });

  // Fetch Destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await tripService.getDestinations();
        if (res.success && res.data) {
          setDestinations(res.data);
        }
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    };
    fetchDestinations();
  }, []);

  // Fetch Trips based on filters & pagination
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError(null);
      try {
        let sort = 'created_at';
        let order = 'desc';
        if (filters.sortBy === 'price_asc') {
          sort = 'price';
          order = 'asc';
        } else if (filters.sortBy === 'price_desc') {
          sort = 'price';
          order = 'desc';
        }

        const params = {
          search: filters.search || undefined,
          destination: filters.destination || undefined,
          duration: filters.duration || undefined,
          sort,
          order,
          sort_by: filters.sortBy || undefined,
          page: currentPage,
          limit: 12,
        };

        const res = await tripService.getTrips(params);
        if (res.success && res.data) {
          setTrips(res.data);
          if (res.meta) {
            setMeta(res.meta);
          }
        }
      } catch (err) {
        setError(err.message || 'Gagal mengambil data paket wisata');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [filters, currentPage]);

  const handleFilterChange = (key, value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setCurrentPage(1);
    setFilters({
      search: '',
      destination: '',
      duration: '',
      sortBy: 'newest',
    });
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.total_pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen py-12 bg-[#FCFCFA]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#C5A059]/30 text-[11px] font-semibold text-[#08261E] tracking-wider uppercase shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            Koleksi Terkurasi Nusantara
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#08261E] tracking-tight">
            Katalog Perjalanan Terpilih
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed max-w-xl mx-auto">
            Temukan petualangan impian Anda dari terumbu karang kepulauan terluar hingga puncak kaldera aktif dengan fasilitas all-inclusive.
          </p>
        </div>

        {/* Filter Bar */}
        <TripFilter
          filters={filters}
          destinations={destinations}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Content Area */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 text-[#64748B]">
            <Loader2 className="w-8 h-8 animate-spin text-[#08261E]" />
            <p className="text-xs font-medium">Memuat katalog ekspedisi...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-4 bg-white border border-rose-100 rounded-3xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-[#111827] font-semibold">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-full bg-[#08261E] text-white text-xs font-semibold hover:bg-[#0D3B2E] transition-all shadow-sm"
            >
              Muat Ulang
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4 bg-white border border-[#EAE7DF] rounded-3xl p-10 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FCFCFA] border border-[#EAE7DF] text-[#C5A059] mx-auto flex items-center justify-center shadow-xs">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#08261E]">Destinasi Belum Ditemukan</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Tidak ada paket trip yang sesuai dengan filter pencarian saat ini. Silakan atur ulang filter atau gunakan kata kunci lain.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#08261E] text-[#F5E4BE] text-xs font-semibold hover:bg-[#0D3B2E] transition-all shadow-sm border border-[#C5A059]/30"
            >
              Tampilkan Semua Trip
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8 text-xs text-[#64748B]">
              <span>
                Menampilkan <strong className="text-[#08261E] tabular-nums font-semibold">{trips.length}</strong> dari{' '}
                <strong className="text-[#08261E] tabular-nums font-semibold">{meta.total}</strong> paket wisata (Halaman {meta.page} dari {meta.total_pages})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>

            {/* Server-Side Pagination Controls */}
            {meta.total_pages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-full border border-[#EAE7DF] bg-white text-xs font-semibold text-[#08261E] hover:bg-[#F4F0E8] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  {Array.from({ length: meta.total_pages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.total_pages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const isGap = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {isGap && <span className="px-1 text-xs text-[#64748B]">...</span>}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                              currentPage === p
                                ? 'bg-[#08261E] text-[#F5E4BE] shadow-md border border-[#C5A059]/40'
                                : 'bg-white border border-[#EAE7DF] text-[#08261E] hover:bg-[#F4F0E8]'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= meta.total_pages}
                  className="px-4 py-2 rounded-full border border-[#EAE7DF] bg-white text-xs font-semibold text-[#08261E] hover:bg-[#F4F0E8] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
