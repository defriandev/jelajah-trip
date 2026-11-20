import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat'];
const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-500'];

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
    <div className="flex-1 min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col lg:flex-row">
      {/* Left decorative brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F382A] text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle geometric circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-16 left-16 w-72 h-72 rounded-full border border-white" />
          <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-white" />
        </div>

        {/* Top: Monogram */}
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg font-display tracking-tight">JT</span>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
              Jelajahi Indonesia
            </h2>
            <p className="text-white/80 leading-relaxed text-sm">
              Daftarkan akun Anda dan mulai rencanakan petualangan tak terlupakan bersama ribuan pelancong Jelajah Trip.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { value: '500+', label: 'Destinasi' },
              { value: '10K+', label: 'Pelancong' },
              { value: '4.9★', label: 'Penilaian' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-base tabular-nums">{stat.value}</p>
                <p className="text-white/70 text-[11px] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-white/50 text-xs">
          Keanggotaan Gratis dengan Keuntungan Akses Eksklusif
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-10 lg:py-16 my-auto">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6E4DD] rounded-2xl p-7 sm:p-9 shadow-sm">
            {/* Eyebrow & Title */}
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D97736] mb-1.5">
              BUAT AKUN
            </p>
            <h1 className="font-display font-bold text-2xl text-[#14211D] mb-6 tracking-tight">
              Bergabung Sekarang
            </h1>

            {/* Hybrid Info Banner (Prefilled from guest checkout) */}
            {initialEmail && (
              <div className="bg-[#EBF4F0] border border-[#C5DFD6] text-[#0F4C3A] text-xs rounded-xl p-3.5 flex items-start gap-2.5 mb-5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Data nama dan email terisi otomatis dari pesanan Anda. Buat kata sandi untuk menautkan riwayat pesanan ke akun ini.
                </span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5 mb-5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-[#14211D] mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border border-[#D5D2C9] focus:border-[#0F4C3A] focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/15 rounded-xl text-[#14211D] px-3.5 py-2.5 sm:py-3 w-full text-sm placeholder-[#4A5550]/40 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#14211D] mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border border-[#D5D2C9] focus:border-[#0F4C3A] focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/15 rounded-xl text-[#14211D] px-3.5 py-2.5 sm:py-3 w-full text-sm placeholder-[#4A5550]/40 transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#14211D] mb-1.5">
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
                    className="bg-white border border-[#D5D2C9] focus:border-[#0F4C3A] focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/15 rounded-xl text-[#14211D] px-3.5 py-2.5 sm:py-3 w-full pr-11 text-sm placeholder-[#4A5550]/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5550] hover:text-[#14211D] transition-colors p-1"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            strength >= level ? strengthColor[strength] : 'bg-[#E6E4DD]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#4A5550]">
                      Kekuatan Sandi: <span className="font-semibold text-[#14211D]">{strengthLabel[strength]}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#14211D] mb-1.5">
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
                    className="bg-white border border-[#D5D2C9] focus:border-[#0F4C3A] focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/15 rounded-xl text-[#14211D] px-3.5 py-2.5 sm:py-3 w-full pr-11 text-sm placeholder-[#4A5550]/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5550] hover:text-[#14211D] transition-colors p-1"
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
                className="bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3 font-semibold text-sm w-full flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mendaftarkan Akun...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-xs text-[#4A5550] mt-6">
              Sudah memiliki akun?{' '}
              <Link to="/login" className="font-semibold text-[#0F4C3A] hover:underline underline-offset-2">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
