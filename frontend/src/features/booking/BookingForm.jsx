import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { bookingService } from '../../services/api';
import { validateIndonesianPhone } from '../../utils/validation';

export default function BookingForm({ trip, user, onSuccess, onFormChange }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: '',
    travel_date: '',
    pax: 1,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Pre-fill from user prop when it arrives
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  // Notify parent of pax / date changes for summary card
  useEffect(() => {
    if (onFormChange) {
      onFormChange({ pax: formData.pax, travel_date: formData.travel_date });
    }
  }, [formData.pax, formData.travel_date]);

  const validate = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Nama lengkap wajib diisi.';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Format email tidak valid.';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Nomor WhatsApp wajib diisi.';
    } else if (!validateIndonesianPhone(formData.customer_phone)) {
      newErrors.customer_phone = 'Nomor telepon tidak valid (harus nomor Indonesia aktif, misal 08123456789 atau +628123456789).';
    }

    if (!formData.travel_date) {
      newErrors.travel_date = 'Tanggal keberangkatan wajib dipilih.';
    }

    if (!formData.pax || formData.pax < 1) {
      newErrors.pax = 'Jumlah peserta minimal 1 orang.';
    } else if (trip?.quota && formData.pax > trip.quota) {
      newErrors.pax = `Jumlah peserta melebihi kuota tersedia (${trip.quota}).`;
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pax' ? Number(value) : value,
    }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePaxStep = (delta) => {
    setFormData((prev) => {
      const next = Math.max(1, Math.min(trip?.quota || 99, prev.pax + delta));
      return { ...prev, pax: next };
    });
    if (errors.pax) setErrors((prev) => ({ ...prev, pax: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        trip_id: trip.id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        travel_date: formData.travel_date,
        pax: formData.pax,
      };

      const res = await bookingService.createBooking(payload);
      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setSubmitError(res.message || 'Gagal membuat pesanan. Coba lagi.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-[#E6E4DD] rounded-2xl p-6 space-y-6"
    >
      {/* Section header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736] mb-1">LANGKAH 1</p>
        <h2 className="text-xl font-display font-bold tracking-[-0.03em] text-[#14211D]">Data Pemesan</h2>
        <p className="text-sm leading-[1.65] text-[#4A5550] mt-1">
          Pastikan kontak aktif untuk pengiriman voucher dan konfirmasi jadwal via WhatsApp.
        </p>
      </div>

      {/* Global submit error */}
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3">
          {submitError}
        </div>
      )}

      <div className="space-y-5">
        {/* Nama Lengkap */}
        <div>
          <label className="block text-sm font-medium text-[#14211D] mb-1">
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="customer_name"
            placeholder="Contoh: Budi Santoso"
            value={formData.customer_name}
            onChange={handleChange}
            className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm placeholder:text-[#4A5550]/50 transition-colors"
          />
          {errors.customer_name && (
            <p className="text-sm text-rose-600 mt-1">{errors.customer_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#14211D] mb-1">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            name="customer_email"
            placeholder="Contoh: budi@gmail.com"
            value={formData.customer_email}
            onChange={handleChange}
            className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm placeholder:text-[#4A5550]/50 transition-colors"
          />
          {errors.customer_email && (
            <p className="text-sm text-rose-600 mt-1">{errors.customer_email}</p>
          )}
        </div>

        {/* No. WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-[#14211D] mb-1">
            No. WhatsApp <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            name="customer_phone"
            placeholder="Contoh: 081234567890"
            value={formData.customer_phone}
            onChange={handleChange}
            className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm placeholder:text-[#4A5550]/50 transition-colors"
          />
          {errors.customer_phone ? (
            <p className="text-sm text-rose-600 mt-1">{errors.customer_phone}</p>
          ) : (
            <p className="text-xs text-[#4A5550]/70 mt-1">
              Nomor ini digunakan tim pemandu untuk membuat grup koordinasi keberangkatan.
            </p>
          )}
        </div>

        {/* Tanggal & Pax — two-column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tanggal Keberangkatan */}
          <div>
            <label className="block text-sm font-medium text-[#14211D] mb-1">
              Tanggal Keberangkatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="travel_date"
              min={minDate}
              value={formData.travel_date}
              onChange={handleChange}
              className="bg-[#FAF9F6] border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full text-sm transition-colors"
            />
            {errors.travel_date && (
              <p className="text-sm text-rose-600 mt-1">{errors.travel_date}</p>
            )}
          </div>

          {/* Jumlah Pax */}
          <div>
            <label className="block text-sm font-medium text-[#14211D] mb-1">
              Jumlah Pax <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePaxStep(-1)}
                disabled={formData.pax <= 1}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] text-[#14211D] text-lg font-bold hover:bg-[#F0EDE6] disabled:opacity-40 transition-colors"
              >
                −
              </button>
              <div className="flex-1 py-3 text-center bg-[#FAF9F6] border border-[#E6E4DD] rounded-xl font-semibold text-[#14211D] text-sm tabular-nums select-none">
                {formData.pax} Pax
              </div>
              <button
                type="button"
                onClick={() => handlePaxStep(1)}
                disabled={trip?.quota ? formData.pax >= trip.quota : false}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] text-[#14211D] text-lg font-bold hover:bg-[#F0EDE6] disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>
            {errors.pax && (
              <p className="text-sm text-rose-600 mt-1">{errors.pax}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-[#F4F2EC] border border-[#E6E4DD] rounded-xl p-4 text-sm leading-[1.65] text-[#4A5550]">
        Pesanan Anda tersimpan dengan status <strong className="text-[#14211D]">Pending</strong>. Lakukan pembayaran via Transfer Bank / QRIS dan lacak perkembangannya di halaman <strong className="text-[#14211D]">Cek Pesanan</strong>.
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses…
          </>
        ) : (
          'Konfirmasi & Buat Pesanan'
        )}
      </button>
    </form>
  );
}
