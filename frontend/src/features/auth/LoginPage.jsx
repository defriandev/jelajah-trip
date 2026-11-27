import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield, User, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Login gagal, periksa email dan kata sandi Anda');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
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

        {/* Middle: Inspiring copy */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
              Gerbang Eksplorasi Nusantara
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl font-normal text-white leading-tight">
              Mulai Petualangan Berkelas Anda
            </h2>
            <p className="text-white/75 leading-relaxed text-xs sm:text-sm font-light">
              Masuk ke akun Anda untuk memantau status voucher, riwayat perjalanan terkurasi, dan konsultasi privat bersama tim kurator kami.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-left">
            <p className="font-serif italic text-white/90 text-sm leading-relaxed">
              "Dunia adalah buku, dan mereka yang tidak bepergian hanya membaca satu halaman."
            </p>
            <p className="text-[#C5A059] text-xs font-semibold mt-3">
              Santo Agustinus
            </p>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} Jelajah Trip • Archipelago Atelier
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
              AUTENTIKASI AKUN
            </p>
            <h1 className="font-serif font-normal text-2xl sm:text-3xl text-[#08261E] mb-6">
              Selamat Datang Kembali
            </h1>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl p-4 flex items-start gap-2.5 mb-5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
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

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#08261E]">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
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
                    Memverifikasi Kredensial...
                  </>
                ) : (
                  'Masuk ke Akun'
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            {import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' && import.meta.env.MODE !== 'production' && (
              <div className="mt-6 pt-5 border-t border-[#EAE7DF]/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Akses Cepat Demo Pengujian</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@jelajahtrip.com', 'admin123')}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#FCFCFA] hover:bg-[#F4F0E8] border border-[#EAE7DF] hover:border-[#08261E]/30 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#08261E]/10 text-[#08261E] flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#08261E]">Akun Admin</p>
                      <p className="text-[10px] text-[#64748B] truncate">admin@jelajahtrip.com</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemo('budi@example.com', 'password123')}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#FCFCFA] hover:bg-[#F4F0E8] border border-[#EAE7DF] hover:border-[#08261E]/30 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#08261E]/10 text-[#08261E] flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-[#C5A059]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#08261E]">Akun Customer</p>
                      <p className="text-[10px] text-[#64748B] truncate">budi@example.com</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Register link */}
            <p className="text-center text-xs text-[#64748B] mt-6">
              Belum memiliki akun?{' '}
              <Link to="/register" className="font-semibold text-[#08261E] hover:text-[#C5A059] transition-colors">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
