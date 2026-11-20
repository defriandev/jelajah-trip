import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
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
    <div className="min-h-screen py-10 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
            Katalog Destinasi Nusantara
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14211D] tracking-tight font-display">
            Semua Paket Perjalanan
          </h1>
          <p className="text-sm text-[#4A5550] leading-relaxed">
            Pilih perjalanan impian Anda dari pulau karang tropis hingga puncak kaldera aktif dengan fasilitas all-inclusive.
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
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#4A5550]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F4C3A]" />
            <p className="text-xs">Memuat paket perjalanan...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-[#14211D] font-semibold">{error}</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-[#0F4C3A] text-white text-xs font-semibold hover:bg-[#0A3629] transition-colors"
            >
              Muat Ulang
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-3 bg-white border border-[#E6E4DD] rounded-2xl p-8 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#E6E4DD] text-[#4A5550] mx-auto flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#14211D] font-display">Tidak Ada Paket Ditemukan</h3>
            <p className="text-xs text-[#4A5550]">
              Tidak ada paket trip yang cocok dengan kriteria pencarian Anda. Coba reset filter atau gunakan kata kunci lain.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-4 py-2 rounded-xl bg-[#0F4C3A] text-white text-xs font-semibold hover:bg-[#0A3629] transition-colors"
            >
              Tampilkan Semua Trip
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 text-xs text-[#4A5550]">
              <span>
                Menampilkan <strong className="text-[#14211D] tabular-nums">{trips.length}</strong> dari{' '}
                <strong className="text-[#14211D] tabular-nums">{meta.total}</strong> paket perjalanan (Halaman {meta.page} dari {meta.total_pages})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>

            {/* Server-Side Pagination Controls */}
            {meta.total_pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3.5 py-2 rounded-xl border border-[#E6E4DD] bg-white text-xs font-medium text-[#14211D] hover:bg-[#FAF9F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: meta.total_pages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.total_pages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const isGap = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {isGap && <span className="px-1 text-xs text-[#4A5550]">...</span>}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors ${
                              currentPage === p
                                ? 'bg-[#0F4C3A] text-white shadow-sm'
                                : 'bg-white border border-[#E6E4DD] text-[#14211D] hover:bg-[#FAF9F6]'
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
                  className="px-3.5 py-2 rounded-xl border border-[#E6E4DD] bg-white text-xs font-medium text-[#14211D] hover:bg-[#FAF9F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm transition-colors"
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
