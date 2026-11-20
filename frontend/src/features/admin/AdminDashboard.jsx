import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, ShoppingBag, Clock, TrendingUp,
  Compass, Menu, X, Loader2, AlertCircle,
  RefreshCw, LogOut, ChevronRight, ArrowUpRight,
  ShieldCheck, Globe, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { bookingService, triggerFileDownload } from '../../services/api';
import ManageTrips from './ManageTrips';
import ManageBookings from './ManageBookings';

/* ─── Status Badge ───────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:   'bg-amber-50 text-amber-700 border border-amber-200',
    confirmed: 'bg-emerald-50 text-[#0F4C3A] border border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
    completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  };
  const cls = map[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  return (
    <span className={`${cls} rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize inline-block whitespace-nowrap`}>
      {status}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function AdminDashboard() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'trips' | 'bookings'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  /* Auth guard */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Stats
      let statsData = null;
      try {
        const res = await bookingService.getStats();
        if (res && res.data) statsData = res.data;
      } catch (err) {
        try {
          const res = await api.get('/bookings/admin/stats');
          if (res && res.data) statsData = res.data;
        } catch (innerErr) {
          console.warn('Fallback admin stats failed:', innerErr.message);
        }
      }
      if (statsData) setStats(statsData);

      // 2. Fetch Bookings
      let bookingsData = [];
      try {
        const res = await bookingService.getAllBookings();
        if (res && res.data) bookingsData = res.data;
      } catch (err) {
        try {
          const res = await api.get('/bookings');
          if (res && res.data) bookingsData = res.data;
        } catch (innerErr) {
          console.warn('Fallback admin bookings failed:', innerErr.message);
        }
      }
      setRecentBookings(bookingsData.slice(0, 8));
    } catch (err) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBookingsExcel = async () => {
    setExporting(true);
    try {
      const blob = await bookingService.exportExcel();
      const timestamp = new Date().toISOString().slice(0, 10);
      triggerFileDownload(blob, `rekap-seluruh-pemesanan-${timestamp}.xlsx`);
    } catch (err) {
      alert(`Gagal mengekspor laporan: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setExporting(false);
    }
  };

  const formatIDR = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);

  /* ── Sidebar Component ─────────────────────────────────── */
  const renderSidebar = (isMobile = false) => (
    <aside className={`bg-white border-r border-[#E6E4DD] flex flex-col h-full ${isMobile ? 'w-full' : 'w-64 fixed left-0 top-0 bottom-0 z-30'}`}>
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E6E4DD] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F4C3A] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base text-[#14211D] tracking-tight">
                JELAJAH TRIP
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D97736]">
              PORTAL ADMIN
            </span>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-[#4A5550] hover:bg-[#F4F2EC]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4A5550]/70 mb-2">
          Menu Utama
        </p>

        <button
          onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#0F4C3A] text-white shadow-sm'
              : 'text-[#4A5550] hover:bg-[#F4F2EC] hover:text-[#14211D]'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveTab('trips'); setSidebarOpen(false); }}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'trips'
              ? 'bg-[#0F4C3A] text-white shadow-sm'
              : 'text-[#4A5550] hover:bg-[#F4F2EC] hover:text-[#14211D]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 flex-shrink-0" />
            <span>Kelola Trip</span>
          </div>
          {stats?.total_trips > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
              activeTab === 'trips' ? 'bg-white/20 text-white' : 'bg-[#F4F2EC] text-[#4A5550]'
            }`}>
              {stats.total_trips}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('bookings'); setSidebarOpen(false); }}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'bookings'
              ? 'bg-[#0F4C3A] text-white shadow-sm'
              : 'text-[#4A5550] hover:bg-[#F4F2EC] hover:text-[#14211D]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span>Kelola Pesanan</span>
          </div>
          {stats?.pending_bookings > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
              activeTab === 'bookings' ? 'bg-amber-400 text-[#14211D]' : 'bg-amber-100 text-amber-800'
            }`}>
              {stats.pending_bookings}
            </span>
          )}
        </button>

        <div className="pt-4 pb-2">
          <div className="border-t border-[#E6E4DD]" />
        </div>

        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4A5550]/70 mb-2">
          Navigasi Luar
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#4A5550] hover:bg-[#F4F2EC] hover:text-[#14211D] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span>Lihat Website</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#4A5550]/70" />
        </button>
      </div>

      {/* Admin User Section at Bottom */}
      <div className="p-4 border-t border-[#E6E4DD] bg-[#FAF9F6]/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#0F4C3A] flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#14211D] truncate leading-tight">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-xs text-[#4A5550] truncate">
              {user?.email || 'admin@jelajahtrip.com'}
            </p>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#14211D] flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        {renderSidebar(false)}
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 h-full z-10 shadow-2xl">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#E6E4DD] h-16 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#4A5550] hover:bg-[#F4F2EC] transition-colors"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#4A5550]">
                <span>Admin</span>
                <span>/</span>
                <span className="font-semibold text-[#14211D] capitalize">
                  {activeTab === 'dashboard' ? 'Ringkasan' : activeTab === 'trips' ? 'Kelola Trip' : 'Kelola Pesanan'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#0F4C3A] rounded-full border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Aktif</span>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E4DD] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#14211D] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0F4C3A]' : ''}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Header Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E4DD] pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-1">
                    RINGKASAN OPERASIONAL
                  </p>
                  <h1 className="font-display font-extrabold tracking-[-0.03em] text-[#14211D] text-3xl">
                    Dashboard Admin
                  </h1>
                  <p className="text-sm text-[#4A5550] mt-1 leading-[1.65]">
                    Pantau kinerja penjualan, kuota destinasi, dan verifikasi reservasi wisatawan terkini.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleExportBookingsExcel}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#14211D] border border-[#E6E4DD] font-semibold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    title="Download seluruh data pemesanan ke file Excel (.xlsx)"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#0F4C3A]" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-[#0F4C3A]" />
                    )}
                    <span>{exporting ? 'Mengunduh...' : 'Ekspor Laporan Excel'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('trips')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#0A3629] text-white font-semibold text-sm shadow-sm transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Kelola Trip</span>
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 4 Stat Cards */}
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#4A5550]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0F4C3A]" />
                  <span className="text-sm font-medium">Memuat metrik ringkasan...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Total Trip */}
                  <div
                    onClick={() => setActiveTab('trips')}
                    className="bg-white border border-[#E6E4DD] rounded-2xl p-5 hover:border-[#0F4C3A]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4A5550]">
                        Total Trip
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-[#0F4C3A]">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-[#14211D]">
                        {stats?.total_trips ?? 0}
                      </div>
                      <p className="text-xs text-[#4A5550] mt-1">Paket aktif di katalog</p>
                    </div>
                  </div>

                  {/* Card 2: Total Pesanan */}
                  <div
                    onClick={() => setActiveTab('bookings')}
                    className="bg-white border border-[#E6E4DD] rounded-2xl p-5 hover:border-[#0F4C3A]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4A5550]">
                        Total Pesanan
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-[#14211D]">
                        {stats?.total_bookings ?? 0}
                      </div>
                      <p className="text-xs text-[#4A5550] mt-1">Seluruh transaksi tercatat</p>
                    </div>
                  </div>

                  {/* Card 3: Pesanan Pending */}
                  <div
                    onClick={() => setActiveTab('bookings')}
                    className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                      stats?.pending_bookings > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-[#E6E4DD]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4A5550]">
                        Pesanan Pending
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-amber-600">
                        {stats?.pending_bookings ?? 0}
                      </div>
                      <p className="text-xs text-[#4A5550] mt-1">Menunggu konfirmasi admin</p>
                    </div>
                  </div>

                  {/* Card 4: Total Pendapatan */}
                  <div className="bg-white border border-[#E6E4DD] rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4A5550]">
                        Total Pendapatan
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#0F4C3A]">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold tabular-nums tracking-tight text-[#14211D] break-all">
                        {formatIDR(stats?.total_revenue)}
                      </div>
                      <p className="text-xs text-[#4A5550] mt-1">Akumulasi transaksi selesai</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Bookings Section */}
              {!loading && (
                <div className="bg-white border border-[#E6E4DD] rounded-2xl overflow-hidden shadow-xs">
                  <div className="px-6 py-4 border-b border-[#E6E4DD] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-lg text-[#14211D] tracking-tight">
                        Pesanan Masuk Terbaru
                      </h3>
                      <p className="text-xs text-[#4A5550] mt-0.5">
                        Daftar transaksi reservasi terakhir yang membutuhkan pemantauan atau verifikasi.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F4C3A] hover:underline self-start sm:self-auto"
                    >
                      <span>Buka Manajemen Pesanan</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#FAF9F6] border-b border-[#E6E4DD]">
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                            Kode Booking
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                            Pemesan
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                            Destinasi Trip
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                            Keberangkatan
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                            Total Bayar
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                            Status
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550] text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E4DD]">
                        {recentBookings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#4A5550]">
                              Belum ada pesanan terbaru dalam sistem.
                            </td>
                          </tr>
                        ) : (
                          recentBookings.map((b, idx) => (
                            <tr
                              key={b.id}
                              className={`hover:bg-[#FAF9F6]/80 transition-colors ${
                                idx % 2 === 1 ? 'bg-[#FAF9F6]/30' : 'bg-white'
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-[#0F4C3A] bg-[#F4F2EC] px-2.5 py-1 rounded-lg border border-[#E6E4DD]">
                                  {b.booking_code}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-[#14211D] block">
                                  {b.customer_name}
                                </span>
                                <span className="text-xs text-[#4A5550]">
                                  {b.customer_email}
                                </span>
                              </td>
                              <td className="px-6 py-4 max-w-[200px] truncate">
                                <span className="font-medium text-[#14211D] block truncate">
                                  {b.trip?.title || 'Paket Trip'}
                                </span>
                                <span className="text-xs text-[#4A5550]">
                                  {b.pax} Peserta
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-[#4A5550] text-xs">
                                {new Date(b.travel_date || b.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap tabular-nums font-bold text-[#14211D]">
                                {formatIDR(b.total_price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={b.status} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => setActiveTab('bookings')}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0F4C3A] hover:bg-[#F4F2EC] px-3 py-1.5 rounded-lg transition-colors border border-[#E6E4DD]"
                                >
                                  <span>Kelola</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KELOLA TRIP */}
          {activeTab === 'trips' && <ManageTrips />}

          {/* TAB 3: KELOLA PESANAN */}
          {activeTab === 'bookings' && <ManageBookings />}
        </main>
      </div>
    </div>
  );
}