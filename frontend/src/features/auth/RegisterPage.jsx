import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

function getPasswordStrength(password) {
  if (!password) return 0;
  if (password.length < 6) return 1;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const extras = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (password.length >= 10 && extras >= 2) return 3;
  if (password.length >= 6 && extras >= 1) return 2;
  return 1;
}

const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat & Terproteksi'];
const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-[#C5A059]'];

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialName = searchParams.get('name') || '';
  const initialEmail = searchParams.get('email') || '';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#FCFCFA] flex flex-col lg:flex-row">
      {/* Left decorative brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#08261E] text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle geometric circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-16 left-16 w-72 h-72 rounded-full border border-white" />
          <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-white" />
        </div>

        {/* Top: Artisan Brand Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo inverted size="large" />
          </Link>
        </div>

        {/* Middle content */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
              Keanggotaan Eksklusif Pelancong
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl font-normal text-white leading-tight">
              Jelajahi Indonesia Bersama Kami
            </h2>
            <p className="text-white/75 leading-relaxed text-xs sm:text-sm font-light">
              Daftarkan akun Anda dan nikmati kemudahan reservasi tanpa batas, riwayat voucher instan, dan penawaran destinasi rahasia nusantara.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { value: '500+', label: 'Destinasi' },
              { value: '10K+', label: 'Pelancong' },
              { value: '4.9★', label: 'Penilaian' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center">
                <p className="text-[#F5E4BE] font-bold text-base tabular-nums font-sans">{stat.value}</p>
                <p className="text-white/60 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-white/40 text-xs">
          Keanggotaan Gratis • Jaminan Privasi Data 100% Aman
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-10 lg:py-16 my-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="lg:hidden inline-block">
              <BrandLogo />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#08261E] transition-colors ml-auto lg:ml-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
          <div className="bg-white/95 backdrop-blur-xl border border-[#EAE7DF] rounded-3xl p-7 sm:p-9 shadow-xl shadow-[#08261E]/4">
            {/* Eyebrow & Title */}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-1.5">
              REGISTRASI BARU
            </p>
            <h1 className="font-serif font-normal text-2xl sm:text-3xl text-[#08261E] mb-6">
              Bergabung Sekarang
            </h1>

            {/* Hybrid Info Banner (Prefilled from guest checkout) */}
            {initialEmail && (
              <div className="bg-[#08261E]/5 border border-[#08261E]/15 text-[#08261E] text-xs rounded-2xl p-4 flex items-start gap-2.5 mb-5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Data nama dan email terisi otomatis dari pesanan Anda. Buat kata sandi untuk menautkan riwayat pesanan ke akun ini.
                </span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl p-4 flex items-start gap-2.5 mb-5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full text-xs placeholder-[#64748B]/40 transition-all font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full text-xs placeholder-[#64748B]/40 transition-all font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full pr-11 text-xs placeholder-[#64748B]/40 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#08261E] transition-colors p-1"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            strength >= level ? strengthColor[strength] : 'bg-[#EAE7DF]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Kekuatan Sandi: <span className="font-semibold text-[#08261E]">{strengthLabel[strength]}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#08261E] mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#FCFCFA] border border-[#EAE7DF] focus:border-[#08261E] focus:outline-none focus:ring-1 focus:ring-[#08261E] rounded-2xl text-[#111827] px-4 py-3 w-full pr-11 text-xs placeholder-[#64748B]/40 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#08261E] transition-colors p-1"
                    title={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#08261E] hover:bg-[#0D3B2E] text-[#F5E4BE] rounded-full px-6 py-3.5 font-semibold text-xs w-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#08261E]/15 disabled:opacity-50 border border-[#C5A059]/40 cursor-pointer mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                    Mendaftarkan Akun Anda...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-xs text-[#64748B] mt-6">
              Sudah memiliki akun?{' '}
              <Link to="/login" className="font-semibold text-[#08261E] hover:text-[#C5A059] transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
