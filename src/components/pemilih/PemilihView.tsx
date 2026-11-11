import React, { useState, useEffect } from 'react';
import {
  Vote,
  Lock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  LogOut,
  Info,
  ChevronRight,
  Sparkles,
  FileText,
  KeyRound,
  Shield,
  HelpCircle,
  X,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Calon, Pemilih, PengaturanSekolah, PengaturanPemilihan } from '../../types';
import { StorageService } from '../../utils/storage';
import { CloudService } from '../../utils/firebase';
import { validasiJadwalBilik, ValidasiJadwalResult } from '../../utils/date';

interface PemilihViewProps {
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  calonList: Calon[];
  pemilihList: Pemilih[];
  onVoteSuccess: () => void;
}

export const PemilihView: React.FC<PemilihViewProps> = ({
  sekolah,
  pemilihan,
  calonList,
  pemilihList,
  onVoteSuccess,
}) => {
  // Session state for current voter
  const [currentVoter, setCurrentVoter] = useState<Pemilih | null>(null);
  
  // Real-time clock state for live schedule evaluation
  const [currentLiveTime, setCurrentLiveTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Access validation modal state
  const [accessDeniedModal, setAccessDeniedModal] = useState<ValidasiJadwalResult | null>(null);

  // Login input states
  const [inputToken, setInputToken] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Voting flow states
  const [selectedCandidate, setSelectedCandidate] = useState<Calon | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [visiMisiCandidate, setVisiMisiCandidate] = useState<Calon | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [voteTimestamp, setVoteTimestamp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Login Pemilih
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // 1. Cek validasi hari & jam pelaksanaan pemilihan (Bilik Suara Digital)
    const scheduleCheck = validasiJadwalBilik(pemilihan, new Date());
    if (!scheduleCheck.bisaMasuk) {
      setLoginError(scheduleCheck.pesan);
      setAccessDeniedModal(scheduleCheck);
      return;
    }

    const cleanToken = inputToken.trim().toUpperCase();

    if (!cleanToken) {
      setLoginError('Silakan masukkan Kode Pemilih atau NIS/NISN Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Re-verify schedule inside timeout
      const recheck = validasiJadwalBilik(pemilihan, new Date());
      if (!recheck.bisaMasuk) {
        setLoginError(recheck.pesan);
        setAccessDeniedModal(recheck);
        setIsLoading(false);
        return;
      }

      // Find voter in database
      const found = pemilihList.find(
        (p) =>
          p.kodePemilih.toUpperCase() === cleanToken ||
          p.nisNisn.trim() === cleanToken
      );

      if (!found) {
        setLoginError('Kode Pemilih atau NIS/NISN tidak ditemukan dalam Daftar Pemilih Tetap (DPT). Silakan hubungi Panitia.');
        setIsLoading(false);
        return;
      }

      if (found.statusMemilih) {
        setLoginError('Anda sudah menggunakan hak pilih Anda. Satu pemilih hanya dapat memberikan suara sebanyak 1 kali.');
        setIsLoading(false);
        return;
      }

      setCurrentVoter(found);
      setIsLoading(false);
    }, 300);
  };

  // Handle Vote Confirmation
  const initiateVote = (calon: Calon) => {
    setSelectedCandidate(calon);
    setConfirmModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!currentVoter || !selectedCandidate) return;

    // Check schedule validity right before casting vote
    const scheduleCheck = validasiJadwalBilik(pemilihan, new Date());
    if (!scheduleCheck.bisaMasuk) {
      setErrorMessage(`Waktu pemungutan suara telah berakhir (${scheduleCheck.waktuSelesai} WIB). Kotak suara digital telah ditutup.`);
      setConfirmModalOpen(false);
      setAccessDeniedModal(scheduleCheck);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Rekam suara langsung ke Firebase Firestore Cloud Database
      const cloudSuccess = await CloudService.castVoteCloud(currentVoter, selectedCandidate.id);
      
      // 2. Simpan juga ke cache lokal
      StorageService.castVote(currentVoter.id, selectedCandidate.id);

      if (cloudSuccess) {
        setVoteSubmitted(true);
        setVoteTimestamp(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setConfirmModalOpen(false);
        onVoteSuccess();
      } else {
        // Fallback jika cloud ada kendala
        setVoteSubmitted(true);
        setVoteTimestamp(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setConfirmModalOpen(false);
        onVoteSuccess();
      }
    } catch (err) {
      console.error('Error saat mencatat suara:', err);
      const result = StorageService.castVote(currentVoter.id, selectedCandidate.id);
      if (result.success) {
        setVoteSubmitted(true);
        setVoteTimestamp(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setConfirmModalOpen(false);
        onVoteSuccess();
      } else {
        setErrorMessage(result.message);
        setConfirmModalOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndLogout = () => {
    setCurrentVoter(null);
    setSelectedCandidate(null);
    setVoteSubmitted(false);
    setInputToken('');
    setLoginError('');
  };

  // Active candidates only
  const activeCandidates = calonList.filter((c) => c.aktif).sort((a, b) => a.noUrut - b.noUrut);

  // 1. SUCCESS VIEW (AFTER VOTING)
  if (voteSubmitted) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-emerald-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Terima Kasih!
          </h2>
          <p className="text-base text-emerald-800 font-semibold mb-4">
            Suara Anda telah berhasil direkam ke dalam kotak suara digital.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs text-slate-600 space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Pemilih:</span>
              <span className="font-bold text-slate-800">{currentVoter?.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kelas:</span>
              <span className="font-semibold text-slate-700">{currentVoter?.kelas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waktu Rekam:</span>
              <span className="font-mono text-slate-700">{voteTimestamp} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status Hak Pilih:</span>
              <span className="inline-flex items-center text-emerald-600 font-bold">
                ✓ SUDAH DIGUNAKAN
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-6 text-center">
            Pilihan Anda bersifat <strong>LUBER JURDIL</strong> (Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil).
          </div>

          <button
            type="button"
            onClick={handleFinishAndLogout}
            className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            SELESAI / KELUAR
          </button>
        </div>
      </main>
    );
  }

  // 2. VOTING BALLOT VIEW (LOGGED IN)
  if (currentVoter) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header for Voter */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                {sekolah.logo ? (
                  <img
                    src={sekolah.logo}
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded-2xl p-1 bg-white border border-amber-300 shadow-xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-300 mb-2">
                    <Vote className="w-3.5 h-3.5 text-amber-700" />
                    SURAT SUARA DIGITAL
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                    {pemilihan.namaKegiatan}
                  </h1>
                  <p className="text-sm sm:text-base font-bold text-amber-600">
                    {sekolah.namaSekolah} • {pemilihan.tahunPelajaran}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    Silakan tentukan pilihan Anda dengan menekan tombol <strong>[PILIH CALON INI]</strong> di bawah foto calon.
                  </p>
                </div>
              </div>

              {/* Voter Identity Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shrink-0 sm:w-72">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-semibold">Pemilih Aktif:</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{currentVoter.nama}</p>
                    <p className="text-xs text-slate-500 font-medium">Kelas {currentVoter.kelas} • {currentVoter.nisNisn}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Candidacy Grid (Mobile First, large cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activeCandidates.map((calon) => (
              <div
                key={calon.id}
                className="bg-white rounded-3xl border-2 border-slate-200 hover:border-amber-400 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col group"
              >
                {/* Number Badge Top */}
                <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-6 py-3 flex items-center justify-between text-slate-950">
                  <span className="text-xs font-black tracking-wider uppercase opacity-90">
                    Nomor Urut
                  </span>
                  <span className="text-3xl font-black tracking-tight">
                    {calon.noUrut < 10 ? `0${calon.noUrut}` : calon.noUrut}
                  </span>
                </div>

                {/* Candidate Photo */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={calon.foto}
                    alt={`Foto Calon ${calon.nama}`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback image
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                      Kelas: {calon.kelas}
                    </span>
                  </div>
                </div>

                {/* Candidate Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">
                      {calon.nama}
                    </h3>
                    {calon.tagline && (
                      <p className="text-xs font-bold text-amber-600 italic mb-4">
                        "{calon.tagline}"
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setVisiMisiCandidate(calon)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors mb-4"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Baca Visi & Misi
                    </button>
                  </div>

                  {/* Primary Selection Button */}
                  <button
                    type="button"
                    onClick={() => initiateVote(calon)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-base tracking-wide shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Vote className="w-5 h-5 text-slate-950" />
                    PILIH CALON NOMOR 0{calon.noUrut}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeCandidates.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Belum Ada Calon Aktif</h3>
              <p className="text-sm text-slate-500">Panitia belum mengaktifkan data calon Ketua OSIS.</p>
            </div>
          )}

        </div>

        {/* Modal Konfirmasi Pilihan (Critical Requirement) */}
        {confirmModalOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-300">
                  <Vote className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Konfirmasi Pilihan Anda
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Apakah Anda yakin memilih:
                </p>
              </div>

              {/* Candidate Info Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4 mb-6">
                <img
                  src={selectedCandidate.foto}
                  alt={selectedCandidate.nama}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-300 shrink-0"
                />
                <div>
                  <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded text-xs font-black">
                    NOMOR 0{selectedCandidate.noUrut}
                  </span>
                  <h4 className="font-extrabold text-slate-900 leading-tight text-sm mt-0.5">
                    {selectedCandidate.nama}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Kelas {selectedCandidate.kelas}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-6">
                ⚠️ Pilihan tidak dapat diubah kembali setelah dikonfirmasi. Pastikan pilihan Anda sudah mantap.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={isLoading}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVote}
                  disabled={isLoading}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'YA, SAYA YAKIN'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Visi & Misi */}
        {visiMisiCandidate && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <span className="text-xs font-bold text-amber-600">
                    CALON NOMOR 0{visiMisiCandidate.noUrut}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {visiMisiCandidate.nama}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVisiMisiCandidate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Visi
                  </h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
                    "{visiMisiCandidate.visi}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Misi
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {visiMisiCandidate.misi.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setVisiMisiCandidate(null)}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    );
  }

  // 3. LOGIN PEMILIH VIEW (DEFAULT FOR STUDENTS)
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-100 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Card Login */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            {sekolah.logo ? (
              <div className="relative inline-block mx-auto mb-3">
                <img
                  src={sekolah.logo}
                  alt={sekolah.namaSekolah || 'Logo Lembaga'}
                  className="w-20 h-20 object-contain rounded-2xl p-1.5 bg-white border-2 border-amber-400 shadow-lg shadow-amber-500/20"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black rounded-lg shadow-sm border border-white">
                  OSIS
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
                <Vote className="w-9 h-9" />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              BILIK SUARA DIGITAL
            </h1>
            <p className="text-xs sm:text-sm font-bold text-amber-600 uppercase tracking-wide">
              {sekolah.namaSekolah}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan Kode Pemilih atau NIS/NISN yang telah dibagikan oleh Panitia.
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kode Pemilih / NISN
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Contoh: VOTE-7A01 atau 0081234001"
                  className="w-full px-4 py-3.5 pl-11 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl font-mono text-sm uppercase font-bold text-slate-800 transition-all outline-none"
                  autoFocus
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Vote className="w-5 h-5 text-slate-950" />
                  MASUK KE BILIK SUARA
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee Notice */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Sistem Dijamin Rahasia & Terenkripsi</span>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Panitia Pemilihan OSIS • {sekolah.namaSekolah}
        </p>

      </div>

      {/* MODAL NOTIFIKASI: GAGAL MASUK KARENA JADWAL */}
      {accessDeniedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <button
              type="button"
              onClick={() => setAccessDeniedModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${
                  accessDeniedModal.status === 'MELEBIHI_WAKTU_TANGGAL' ||
                  accessDeniedModal.status === 'MELEBIHI_WAKTU_JAM' ||
                  accessDeniedModal.status === 'STATUS_SELESAI'
                    ? 'bg-rose-100 text-rose-600 shadow-rose-500/20'
                    : 'bg-amber-100 text-amber-600 shadow-amber-500/20'
                }`}
              >
                <Lock className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-2">
                GAGAL MASUK KE BILIK SUARA
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {accessDeniedModal.judul}
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-xs space-y-3 text-slate-700">
              <p className="font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                {accessDeniedModal.pesan}
              </p>

              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jadwal Pelaksanaan:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {accessDeniedModal.hariPelaksanaan}, {accessDeniedModal.tanggalPelaksanaanFormatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jam Operasional:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {accessDeniedModal.waktuMulai} - {accessDeniedModal.waktuSelesai} WIB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Percobaan Masuk:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {accessDeniedModal.waktuSekarangStr} WIB
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAccessDeniedModal(null)}
              className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 text-sm"
            >
              MENGERTI & KEMBALI
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
