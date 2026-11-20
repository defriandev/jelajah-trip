import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Menu, X, User, LogOut, Shield, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E6E4DD]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-[#0F4C3A] flex items-center justify-center text-white shadow-sm transition-transform"
            >
              <Compass className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <span className="text-lg font-extrabold tracking-[-0.03em] text-[#14211D] font-display uppercase block">
                Jelajah<span className="text-[#0F4C3A]">Trip</span>
              </span>
              <span className="text-[10px] tracking-[0.14em] uppercase text-[#4A5550] font-semibold -mt-1 block">
                Archipelago Curated
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors relative py-2 ${active ? 'text-[#0F4C3A] font-semibold' : 'text-[#4A5550] hover:text-[#14211D]'
                    }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="navActiveUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F4C3A] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C3A] bg-[#0F4C3A]/10 px-3.5 py-1.5 rounded-full hover:bg-[#0F4C3A]/20 transition-all hover:scale-105 active:scale-95"
              >
                <Shield className="w-3.5 h-3.5" />
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
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-[#E6E4DD] bg-white hover:border-[#14211D]/30 transition-all text-xs font-medium text-[#14211D] shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0F4C3A] text-white flex items-center justify-center font-bold text-[10px] uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                </motion.button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E6E4DD] shadow-xl py-1.5 z-50 text-xs"
                    >
                      <div className="px-4 py-2 border-b border-[#E6E4DD]">
                        <p className="font-bold text-[#14211D] truncate">{user?.name}</p>
                        <p className="text-[11px] text-[#4A5550] truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#FAF9F6] text-[#0F4C3A] border border-[#E6E4DD]">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#4A5550] hover:text-[#14211D] hover:bg-[#FAF9F6] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#4A5550]" />
                        Profil & Riwayat Pesanan
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-[#0F4C3A] hover:bg-[#FAF9F6] transition-colors font-medium"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="border-t border-[#E6E4DD] my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
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
                  className="px-4 py-2 text-xs font-semibold text-[#14211D] hover:text-[#0F4C3A] transition-colors"
                >
                  Masuk
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F4C3A] hover:bg-[#0A3629] transition-colors shadow-sm block"
                  >
                    Daftar
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-[#E6E4DD] text-[#14211D] hover:bg-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-[#FAF9F6] border-b border-[#E6E4DD] px-6 py-4 space-y-2 shadow-lg"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${location.pathname === link.to ? 'text-[#0F4C3A] font-bold' : 'text-[#14211D]'
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-[#0F4C3A]"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}

            <div className="pt-3 border-t border-[#E6E4DD]">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-sm text-[#14211D]"
                  >
                    <User className="w-4 h-4" />
                    Profil ({user?.name})
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 py-2 text-sm text-rose-600 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 rounded-lg text-xs font-semibold border border-[#E6E4DD] text-[#14211D]"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 rounded-lg text-xs font-semibold bg-[#0F4C3A] text-white"
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
  );
}