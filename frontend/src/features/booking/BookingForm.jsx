import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
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
      newErrors.customer_name = 'Nama lengkap pemesan wajib diisi.';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Alamat email wajib diisi.';
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
      newErrors.pax = `Jumlah peserta melebihi sisa kuota (${trip.quota}).`;
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pax' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePaxStep = (step) => {
    const nextPax = Math.max(1, (formData.pax || 1) + step);
    if (trip?.quota && nextPax > trip.quota) return;
    setFormData((prev) => ({ ...prev, pax: nextPax }));
    if (errors.pax) {
      setErrors((prev) => ({ ...prev, pax: undefined }));
    }
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
      setSubmitError(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-7 sm:p-8 space-y-6 shadow-xs"
    >
      {/* Section header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7532] mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Langkah 1 Dari 2</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#08261E]">Data Pemesan & Jadwal</h2>
        <p className="text-sm text-[#475569] mt-1 font-normal">
          Pastikan kontak aktif untuk pengiriman voucher resmi dan koordinasi pemandu via WhatsApp.
        </p>
      </div>

      {/* Global submit error */}
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl p-4">
          {submitError}
        </div>
      )}

      <div className="space-y-5">
        {/* Nama Lengkap */}
        <div>
          <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
            Nama Lengkap Sesuai KTP/Paspor <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="customer_name"
            placeholder="Contoh: Budi Santoso"
            value={formData.customer_name}
            onChange={handleChange}
            className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full text-sm placeholder:text-[#94A3B8] transition-all font-medium"
          />
          {errors.customer_name && (
            <p className="text-xs text-rose-600 mt-1">{errors.customer_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
            Alamat Email Aktif <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            name="customer_email"
            placeholder="Contoh: budi@example.com"
            value={formData.customer_email}
            onChange={handleChange}
            className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full text-sm placeholder:text-[#94A3B8] transition-all font-medium"
          />
          {errors.customer_email && (
            <p className="text-xs text-rose-600 mt-1">{errors.customer_email}</p>
          )}
        </div>

        {/* No. WhatsApp */}
        <div>
          <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
            Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            name="customer_phone"
            placeholder="Contoh: 081234567890"
            value={formData.customer_phone}
            onChange={handleChange}
            className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full text-sm placeholder:text-[#94A3B8] transition-all font-medium"
          />
          {errors.customer_phone ? (
            <p className="text-xs text-rose-600 mt-1">{errors.customer_phone}</p>
          ) : (
            <p className="text-xs text-[#475569] mt-1.5">
              Nomor ini digunakan tim kurator untuk membuat grup koordinasi penjemputan bandara.
            </p>
          )}
        </div>

        {/* Tanggal & Pax — two-column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tanggal Keberangkatan */}
          <div>
            <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
              Tanggal Keberangkatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="travel_date"
              min={minDate}
              value={formData.travel_date}
              onChange={handleChange}
              className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full text-xs transition-all font-medium cursor-pointer"
            />
            {errors.travel_date && (
              <p className="text-xs text-rose-600 mt-1">{errors.travel_date}</p>
            )}
          </div>

          {/* Jumlah Pax */}
          <div>
            <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
              Jumlah Peserta (Pax) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePaxStep(-1)}
                disabled={formData.pax <= 1}
                className="w-12 h-11 flex items-center justify-center rounded-2xl bg-[#FCFCFA] border border-[#EAE7DF] text-[#08261E] text-base font-bold hover:bg-[#F4F0E8] disabled:opacity-30 transition-colors shadow-2xs"
              >
                −
              </button>
              <div className="flex-1 py-3 text-center bg-[#FCFCFA] border border-[#EAE7DF] rounded-2xl font-bold text-[#08261E] text-xs tabular-nums select-none shadow-2xs">
                {formData.pax} Peserta
              </div>
              <button
                type="button"
                onClick={() => handlePaxStep(1)}
                disabled={trip?.quota ? formData.pax >= trip.quota : false}
                className="w-12 h-11 flex items-center justify-center rounded-2xl bg-[#FCFCFA] border border-[#EAE7DF] text-[#08261E] text-base font-bold hover:bg-[#F4F0E8] disabled:opacity-30 transition-colors shadow-2xs"
              >
                +
              </button>
            </div>
            {errors.pax && (
              <p className="text-xs text-rose-600 mt-1">{errors.pax}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-[#08261E]/5 border border-[#08261E]/12 rounded-2xl p-4 text-xs leading-relaxed text-[#64748B]">
        Pesanan Anda disimpan dengan status <strong className="text-[#08261E]">Pending</strong>. Anda dapat melakukan pembayaran via Transfer Bank / QRIS dan melacak seluruh riwayat di menu <strong className="text-[#08261E]">Cek Pesanan</strong>.
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#08261E] hover:bg-[#0D3B2E] disabled:opacity-50 text-[#F5E4BE] rounded-full px-6 py-4 font-semibold text-xs transition-all shadow-xl shadow-[#08261E]/20 border border-[#C5A059]/40 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
            Memproses Reservasi Anda…
          </>
        ) : (
          <>
            <span>Konfirmasi & Terbitkan Kode Booking</span>
            <ArrowRight className="w-4 h-4 text-[#C5A059]" />
          </>
        )}
      </button>
    </form>
  );
}
