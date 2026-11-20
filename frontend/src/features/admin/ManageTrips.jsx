
import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Search, X, Loader2,
  AlertCircle, Image as ImageIcon, Check, MapPin, Clock, Users,
  ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import api, { tripService, triggerFileDownload } from '../../services/api';

export default function ManageTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12, total_pages: 1 });

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal State for Delete Confirmation
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    price: '',
    duration: '3D2N',
    quota: 15,
    image_url: '',
    facilities: '',
  });

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        search: search || undefined,
        sort: 'created_at',
        order: 'desc',
      };
      const res = await tripService.getTrips(params);

      if (res && res.data) {
        setTrips(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      } else if (Array.isArray(res)) {
        setTrips(res);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat paket trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [currentPage]);

  const openCreateModal = () => {
    setEditingTrip(null);
    setFormError(null);
    setFormData({
      title: '',
      destination: '',
      description: '',
      price: '',
      duration: '3D2N',
      quota: 15,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      facilities: 'Transportasi AC, Penginapan 2 Malam, Makan Sesuai Program, Tour Leader, Dokumentasi Foto',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setFormError(null);
    setFormData({
      title: trip.title || '',
      destination: trip.destination || '',
      description: trip.description || '',
      price: trip.price || '',
      duration: trip.duration || '3D2N',
      quota: trip.quota || 15,
      image_url: trip.image_url || '',
      facilities: Array.isArray(trip.facilities)
        ? trip.facilities.join(', ')
        : (trip.facilities || ''),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const facilitiesArray = formData.facilities
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const payload = {
      title: formData.title.trim(),
      destination: formData.destination.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      duration: formData.duration.trim(),
      quota: Number(formData.quota),
      image_url: formData.image_url.trim(),
      facilities: facilitiesArray,
    };

    try {
      if (editingTrip) {
        try {
          await tripService.updateTrip(editingTrip.id, payload);
        } catch (err) {
          await api.put(`/admin/trips/${editingTrip.id}`, payload, { headers: getHeaders() });
        }
      } else {
        try {
          await tripService.createTrip(payload);
        } catch (err) {
          await api.post('/admin/trips', payload, { headers: getHeaders() });
        }
      }

      setIsModalOpen(false);
      fetchTrips();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan paket wisata');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingTrip) return;
    setIsDeleting(true);

    try {
      try {
        await tripService.deleteTrip(deletingTrip.id);
      } catch (err) {
        await api.delete(`/admin/trips/${deletingTrip.id}`, { headers: getHeaders() });
      }
      setDeletingTrip(null);
      fetchTrips();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await tripService.exportExcel();
      const timestamp = new Date().toISOString().slice(0, 10);
      triggerFileDownload(blob, `katalog-paket-wisata-${timestamp}.xlsx`);
    } catch (err) {
      alert(`Gagal mengekspor katalog: ${err.message || 'Terjadi kesalahan sistem'}`);
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

  const filteredTrips = trips.filter((t) => {
    const q = search.toLowerCase();
    const titleMatch = t.title?.toLowerCase().includes(q);
    const destMatch = t.destination?.toLowerCase().includes(q);
    return titleMatch || destMatch;
  });

  const parsedFacilities = formData.facilities
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-2xl">
            Kelola Paket Trip
          </h2>
          <p className="text-sm text-[#4A5550] leading-[1.65]">
            Atur destinasi, tarif, kuota ketersediaan, dan fasilitas wisata.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF9F6] text-[#14211D] border border-[#E6E4DD] rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            title="Download katalog paket wisata ke file Excel (.xlsx)"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0F4C3A]" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-[#0F4C3A]" />
            )}
            {exporting ? 'Mengunduh...' : 'Ekspor Excel'}
          </button>

          <button
            onClick={openCreateModal}
            className="bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-4 py-2.5 font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Trip Baru
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5550]" />
        <input
          type="text"
          placeholder="Cari berdasarkan judul atau destinasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] pl-10 pr-4 py-2.5 w-full text-sm placeholder-[#4A5550]"
        />
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trips Table */}
      {loading ? (
        <div className="py-16 text-center text-[#4A5550]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0F4C3A] mb-2" />
          <p className="text-sm">Memuat data paket wisata...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white border border-[#E6E4DD] rounded-2xl p-10 text-center text-[#4A5550] text-sm">
          {search
            ? 'Tidak ada paket trip yang cocok dengan kata kunci pencarian.'
            : 'Belum ada paket trip. Klik "Tambah Trip Baru" untuk menambahkan destinasi.'}
        </div>
      ) : (
        <div className="bg-white border border-[#E6E4DD] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E4DD]">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                    Gambar
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                    Judul
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                    Destinasi
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                    Harga
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550]">
                    Kuota
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5550] text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {filteredTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    className="hover:bg-[#FAF9F6] transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      {trip.image_url ? (
                        <img
                          src={trip.image_url}
                          alt={trip.title}
                          className="w-10 h-10 object-cover rounded-lg border border-[#E6E4DD]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD] flex items-center justify-center text-[#4A5550]">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <strong className="text-[#14211D] font-bold block max-w-xs truncate">
                        {trip.title}
                      </strong>
                      <span className="text-xs text-[#4A5550] block truncate max-w-xs leading-[1.65]">
                        {trip.duration} &bull; {trip.description}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#4A5550] font-medium">
                      {trip.destination}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap tabular-nums font-bold text-[#14211D]">
                      {formatIDR(trip.price)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap tabular-nums">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trip.quota <= 5
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-[#0F4C3A] border border-emerald-200'
                        }`}
                      >
                        {trip.quota} Pax
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(trip)}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF9F6] text-[#4A5550] hover:text-[#14211D] border border-[#E6E4DD] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                        title="Edit Trip"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingTrip(trip)}
                        className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                        title="Hapus Trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
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
                dari <span className="font-semibold text-[#14211D] tabular-nums">{meta.total}</span> paket wisata
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

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E6E4DD] rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E6E4DD] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-0.5">
                  {editingTrip ? 'EDIT TRIP' : 'TAMBAH TRIP'}
                </p>
                <h3 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-xl">
                  {editingTrip ? 'Edit Paket Wisata' : 'Tambah Paket Trip Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#4A5550] hover:text-[#14211D] p-1 rounded-lg hover:bg-[#FAF9F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#14211D] mb-1">
                  Judul Paket Trip
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Eksotisme Raja Ampat & Wayag Islands"
                  className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#14211D] mb-1">
                    Destinasi
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="Contoh: Raja Ampat, Papua Barat Daya"
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#14211D] mb-1">
                    Durasi
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Contoh: 3D2N"
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#14211D] mb-1">
                    Harga Paket / Pax (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Contoh: 4500000"
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#14211D] mb-1">
                    Kuota Peserta
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                    placeholder="Contoh: 15"
                    className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#14211D] mb-1">
                  URL Gambar Cover
                </label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#14211D] mb-1">
                  Deskripsi Lengkap
                </label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ceritakan pengalaman perjalanan istimewa yang ditawarkan..."
                  className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm leading-[1.65]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#14211D] mb-1">
                  Fasilitas (Pisahkan dengan tanda koma)
                </label>
                <input
                  type="text"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="Contoh: Tiket Kapal Speedboat, Hotel 2 Malam, Makan Sesuai Program, Tour Guide"
                  className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm"
                />
                {parsedFacilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {parsedFacilities.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-[#F4F2EC] text-[#0F4C3A] border border-[#E6E4DD] text-xs font-medium px-2.5 py-1 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E4DD]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white hover:bg-[#FAF9F6] text-[#4A5550] hover:text-[#14211D] border border-[#E6E4DD] rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-5 py-2.5 font-semibold text-sm disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    'Simpan Paket Wisata'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTrip && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E4DD] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-1">
                KONFIRMASI HAPUS
              </p>
              <h3 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-lg">
                Hapus Paket Trip?
              </h3>
              <p className="text-sm text-[#4A5550] leading-[1.65] mt-2">
                Apakah Anda yakin ingin menghapus paket trip{' '}
                <strong className="text-[#14211D]">"{deletingTrip.title}"</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E6E4DD]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTrip(null)}
                className="bg-white hover:bg-[#FAF9F6] text-[#4A5550] hover:text-[#14211D] border border-[#E6E4DD] rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Trip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
