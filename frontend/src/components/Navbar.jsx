import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield, ArrowUpRight, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/trips', label: 'Katalog Trip' },
    { to: '/tracking', label: 'Cek Pesanan' },
    { to: '/faq', label: 'Bantuan' },
    { to: '/contact', label: 'Kontak' },
  ];

  return (
    <div className="sticky top-3 lg:top-4 z-50 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_-8px_rgba(8,38,30,0.08)] rounded-2xl lg:rounded-full px-5 py-2.5 sm:px-6 sm:py-3 transition-all"
      >
        <div className="flex items-center justify-between">
          {/* Artisan Brandmark Logo */}
          <Link to="/" className="flex items-center">
            <BrandLogo />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-xs lg:text-[13px] font-medium transition-all px-3.5 py-1.5 rounded-full relative ${
                    active
                      ? 'text-[#08261E] font-semibold bg-[#08261E]/6'
                      : 'text-[#64748B] hover:text-[#08261E] hover:bg-[#08261E]/3'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="navActiveIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C5A059]"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#08261E] bg-[#C5A059]/20 border border-[#C5A059]/40 px-3.5 py-1.5 rounded-full hover:bg-[#C5A059]/30 transition-all hover:scale-105 active:scale-95 ml-1"
              >
                <Shield className="w-3.5 h-3.5 text-[#08261E]" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border border-[#EAE7DF] bg-white hover:border-[#08261E]/30 transition-all text-xs font-medium text-[#111827] shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#08261E] to-[#0D3B2E] text-[#F5E4BE] flex items-center justify-center font-bold text-[10px] uppercase shadow-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate font-medium">{user?.name}</span>
                </motion.button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#EAE7DF] shadow-2xl py-2 z-50 text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-[#EAE7DF]/70">
                        <p className="font-bold text-[#111827] truncate font-serif text-sm">{user?.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">{user?.email}</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#08261E]/8 text-[#08261E] border border-[#08261E]/15">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#64748B] hover:text-[#08261E] hover:bg-[#08261E]/5 transition-colors font-medium"
                      >
                        <User className="w-4 h-4 text-[#C5A059]" />
                        Profil & Riwayat Pesanan
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[#08261E] hover:bg-[#08261E]/5 transition-colors font-semibold"
                        >
                          <Shield className="w-4 h-4 text-[#C5A059]" />
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="border-t border-[#EAE7DF]/70 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50/80 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-[#111827] hover:text-[#08261E] transition-colors"
                >
                  Masuk
                </Link>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#F5E4BE] bg-[#08261E] hover:bg-[#0D3B2E] transition-all shadow-md shadow-[#08261E]/15 border border-[#C5A059]/30"
                  >
                    <span>Daftar</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#EAE7DF] text-[#111827] hover:bg-[#08261E]/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-[#EAE7DF]/70 mt-3 pt-3 pb-2 space-y-1"
            >
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#08261E] text-white font-semibold'
                        : 'text-[#64748B] hover:text-[#111827] hover:bg-[#08261E]/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#08261E] bg-[#C5A059]/20"
                >
                  <Shield className="w-4 h-4 text-[#08261E]" />
                  Admin Panel
                </Link>
              )}

              <div className="border-t border-[#EAE7DF]/70 pt-3 mt-2">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="px-4 py-2 bg-[#08261E]/5 rounded-xl">
                      <p className="font-bold text-[#111827] text-sm font-serif">{user?.name}</p>
                      <p className="text-xs text-[#64748B]">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-[#64748B] hover:text-[#111827]"
                    >
                      Profil & Riwayat Pesanan
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 font-medium"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl border border-[#EAE7DF] text-xs font-semibold text-[#111827]"
                    >
                      Masuk
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl bg-[#08261E] text-[#F5E4BE] text-xs font-semibold shadow-sm"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
