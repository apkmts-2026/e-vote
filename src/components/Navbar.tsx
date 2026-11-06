import React, { useState, useEffect } from 'react';
import {
  Vote,
  Tv,
  ShieldCheck,
  Maximize,
  Minimize,
  Clock,
  School,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Lock,
  Cloud,
  LogOut
} from 'lucide-react';
import { PengaturanSekolah, PengaturanPemilihan } from '../types';

interface NavbarProps {
  currentView: 'pemilih' | 'penonton' | 'admin';
  onViewChange: (view: 'pemilih' | 'penonton' | 'admin') => void;
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  isAdminLoggedIn?: boolean;
  onAdminLogout?: () => void;
  isCloudConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  sekolah,
  pemilihan,
  isAdminLoggedIn = false,
  onAdminLogout,
  isCloudConnected = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setCurrentTime(now.toLocaleDateString('id-ID', options) + ' WIB');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const getStatusBadge = () => {
    switch (pemilihan.status) {
      case 'BELUM_DIMULAI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            BELUM DIMULAI
          </span>
        );
      case 'SEDANG_BERLANGSUNG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            BERLANGSUNG
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            SELESAI
          </span>
        );
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 flex items-center">
              {sekolah.logo ? (
                <div className="relative group">
                  <img
                    src={sekolah.logo}
                    alt={sekolah.namaSekolah || 'Logo Lembaga'}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl border border-amber-400/40 p-1 bg-white shadow-sm ring-2 ring-amber-400/30"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[9px] font-black rounded-md shadow-xs border border-white">
                    OSIS
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm border border-amber-300">
                  OSIS
                </div>
              )}
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 truncate">
                  E-PEMILIHAN KETUA OSIS
                </span>
                <span className="hidden md:inline-block">
                  {getStatusBadge()}
                </span>
                {isCloudConnected ? (
                  <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs" title="Database terpusat aktif di Google Cloud / Firebase Firestore">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Cloud Database Online
                  </span>
                ) : (
                  <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    <Cloud className="w-3 h-3 text-slate-400 animate-spin" />
                    Menghubungkan Cloud...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{sekolah.namaSekolah}</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-500 hidden sm:inline">{pemilihan.tahunPelajaran}</span>
              </p>
            </div>
          </div>

          {/* Nav Switcher (Pemilih / Penonton / Admin) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => onViewChange('pemilih')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'pemilih'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Halaman Siswa untuk Memberikan Hak Suara"
              >
                <Vote className="w-4 h-4" />
                <span className="hidden xs:inline">Pemilih</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('penonton')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'penonton'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Halaman Layar Proyektor / TV Publik"
              >
                <Tv className="w-4 h-4" />
                <span className="hidden xs:inline">Penonton / TV</span>
              </button>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onViewChange('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    currentView === 'admin'
                      ? 'bg-slate-900 text-amber-400 ring-1 ring-amber-400/40 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title={isAdminLoggedIn ? "Panel Kontrol Admin (Sesi Aktif)" : "Panel Kontrol Admin (Terkunci - Wajib Login)"}
                >
                  {isAdminLoggedIn ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="hidden xs:inline">Admin</span>
                  {!isAdminLoggedIn && (
                    <span className="hidden md:inline text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-black">
                      TERKUNCI
                    </span>
                  )}
                </button>
                {isAdminLoggedIn && onAdminLogout && currentView === 'admin' && (
                  <button
                    type="button"
                    onClick={onAdminLogout}
                    className="ml-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Kunci Panel Admin (Logout)"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </nav>

            {/* Fullscreen & Clock */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Layar Penuh"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Layar Penuh / Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
