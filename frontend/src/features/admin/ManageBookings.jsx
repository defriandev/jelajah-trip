import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { bookingService, triggerFileDownload } from '../../services/api';

function StatusBadge({ status }) {
  const map = {
    pending: {
      label: 'Menunggu',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
    },
    confirmed: {
      label: 'Dikonfirmasi',
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
    },
    completed: {
      label: 'Selesai',
      className: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: CheckCircle,
    },
    cancelled: {
      label: 'Dibatalkan',
      className: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: XCircle,
    },
  };

  const current = map[status] || {
    label: status,
    className: 'bg-[#FAF9F6] text-[#4A5550] border-[#E6E4DD]',
    icon: AlertCircle,
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
}

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [exporting, setExporting] = useState(false);
  const pageSize = 10;

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        sort: 'created_at',
        order: 'desc',
      };

      const res = await bookingService.getAllBookings(params);
      if (res && res.data) {
        setBookings(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      } else if (Array.isArray(res)) {
        setBookings(res);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat pesanan pelanggan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBookings();
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await bookingService.updateStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      alert(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      };
      const blob = await bookingService.exportExcel(params);
      const timestamp = new Date().toISOString().slice(0, 10);
      triggerFileDownload(blob, `rekap-pemesanan-${timestamp}.xlsx`);
    } catch (err) {
      alert(`Gagal mengekspor data: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setExporting(false);
    }
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-2xl">
            Kelola Pesanan
          </h2>
          <p className="text-sm text-[#4A5550] leading-[1.65]">
            Pantau status reservasi pelancong, verifikasi pembayaran, dan perbarui tahapan pesanan secara berkala.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] text-white border border-[#0F4C3A] rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            title="Download data pesanan ke file Excel (.xlsx)"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            )}
            {exporting ? 'Mengunduh...' : 'Ekspor Excel'}
          </button>

          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF9F6] text-[#4A5550] hover:text-[#14211D] border border-[#E6E4DD] rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Segarkan Data
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5550]" />
          <input
            type="text"
            placeholder="Cari kode booking atau nama customer... (Tekan Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] pl-10 pr-4 py-2.5 w-full text-sm placeholder-[#4A5550]"
          />
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5550]" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] pl-10 pr-8 py-2.5 text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="confirmed">Dikonfirmasi (Confirmed)</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-[#E6E4DD] rounded-2xl p-12 text-center text-[#4A5550] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F4C3A]" />
          <p className="text-sm">Memuat daftar pesanan...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-[#E6E4DD] rounded-2xl p-8 text-center text-rose-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-4 px-4 py-2 bg-[#0F4C3A] text-white text-xs font-semibold rounded-xl hover:bg-[#0A3629]"
          >
            Coba Lagi
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-[#E6E4DD] rounded-2xl p-12 text-center text-[#4A5550] space-y-2">
          <Calendar className="w-10 h-10 mx-auto text-[#4A5550]/40 mb-3" />
          <h3 className="font-bold text-base text-[#14211D]">Tidak ada pesanan ditemukan</h3>
          <p className="text-sm">Tidak ada transaksi yang cocok dengan kata kunci atau filter saat ini.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E6E4DD] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6E4DD] bg-[#FAF9F6] text-[11px] font-semibold uppercase tracking-wider text-[#4A5550]">
                  <th className="px-5 py-3.5">Kode Booking</th>
                  <th className="px-5 py-3.5">Pemesan</th>
                  <th className="px-5 py-3.5">Trip</th>
                  <th className="px-5 py-3.5">Dipesan Pada</th>
                  <th className="px-5 py-3.5">Jadwal Perjalanan</th>
                  <th className="px-5 py-3.5">Total Harga</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Aksi Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#0F4C3A] bg-[#F4F2EC] px-2.5 py-1 rounded-lg border border-[#E6E4DD]">
                        {b.booking_code}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <strong className="text-[#14211D] font-bold block">{b.customer_name}</strong>
                      <span className="text-xs text-[#4A5550] block">{b.customer_email}</span>
                      <span className="text-[11px] text-[#4A5550]/80 block font-mono">{b.customer_phone}</span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <strong className="text-[#14211D] font-medium block truncate">
                        {b.trip?.title || 'Trip'}
                      </strong>
                      <span className="text-xs text-[#4A5550]">{b.pax} Peserta</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#4A5550] text-xs">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#4A5550] text-xs font-medium">
                      {formatDate(b.travel_date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap tabular-nums font-bold text-[#14211D]">
                      {formatIDR(b.total_price)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={b.status}
                          disabled={updatingId === b.id}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none rounded-lg text-sm py-1 px-2 text-[#14211D] font-medium transition-colors cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {updatingId === b.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F4C3A]" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          {meta.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-[#E6E4DD] bg-[#FAF9F6]/50 flex items-center justify-between">
              <span className="text-xs text-[#4A5550]">
                Menampilkan{' '}
                <span className="font-semibold text-[#14211D] tabular-nums">
                  {(meta.page - 1) * meta.limit + 1}
                </span>
                –
                <span className="font-semibold text-[#14211D] tabular-nums">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{' '}
                dari <span className="font-semibold text-[#14211D] tabular-nums">{meta.total}</span> pesanan
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 bg-white hover:bg-[#FAF9F6] text-[#14211D] border border-[#E6E4DD] rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Sebelumnya
                </button>
                <span className="text-xs text-[#4A5550] px-2 tabular-nums">
                  {meta.page} / {meta.total_pages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= meta.total_pages}
                  onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
                  className="inline-flex items-center gap-1 bg-white hover:bg-[#FAF9F6] text-[#14211D] border border-[#E6E4DD] rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Berikutnya
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
