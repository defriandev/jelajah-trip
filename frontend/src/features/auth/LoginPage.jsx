import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

        {/* Middle: Inspiring copy without dashes */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
              Mulai Petualangan Anda
            </h2>
            <p className="text-white/80 leading-relaxed text-sm">
              Temukan destinasi impian Anda bersama Jelajah Trip untuk perjalanan istimewa yang tak terlupakan di setiap sudut nusantara.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-5 text-left">
            <p className="text-white/90 italic text-sm leading-relaxed">
              "Dunia adalah buku, dan mereka yang tidak bepergian hanya membaca satu halaman."
            </p>
            <p className="text-emerald-300 text-xs font-semibold mt-3">
              Santo Agustinus
            </p>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="relative z-10 text-white/50 text-xs">
          Platform Kurasi Wisata Nusantara Terpercaya
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-10 lg:py-16 my-auto">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6E4DD] rounded-2xl p-7 sm:p-9 shadow-sm">
            {/* Eyebrow & Title */}
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D97736] mb-1.5">
              MASUK AKUN
            </p>
            <h1 className="font-display font-bold text-2xl text-[#14211D] mb-6 tracking-tight">
              Selamat Datang Kembali
            </h1>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5 mb-5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
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

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#14211D]">
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
                    Memverifikasi...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            {import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' && import.meta.env.MODE !== 'production' && (
              <div className="mt-5 pt-4 border-t border-[#E6E4DD]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4A5550] mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                  <span>Akses Cepat Demo Pengujian</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@jelajahtrip.com', 'admin123')}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F7F6F2] hover:bg-[#EBF4F0] border border-[#E6E4DD] hover:border-[#0F4C3A]/30 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#14211D]">Akun Admin</p>
                      <p className="text-[10px] text-[#4A5550] truncate">admin@jelajahtrip.com</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemo('budi@example.com', 'password123')}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F7F6F2] hover:bg-[#EBF4F0] border border-[#E6E4DD] hover:border-[#0F4C3A]/30 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#14211D]">Akun Customer</p>
                      <p className="text-[10px] text-[#4A5550] truncate">budi@example.com</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Register link */}
            <p className="text-center text-xs text-[#4A5550] mt-6">
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold text-[#0F4C3A] hover:underline underline-offset-2">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
