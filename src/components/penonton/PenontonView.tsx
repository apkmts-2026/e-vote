import React, { useState, useEffect } from 'react';
import {
  Tv,
  Users,
  Vote,
  TrendingUp,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Radio,
  RefreshCw,
  Maximize2,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Calon, Pemilih, Suara, PengaturanSekolah, PengaturanPemilihan } from '../../types';

interface PenontonViewProps {
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  calonList: Calon[];
  pemilihList: Pemilih[];
  suaraList: Suara[];
}

export const PenontonView: React.FC<PenontonViewProps> = ({
  sekolah,
  pemilihan,
  calonList,
  pemilihList,
  suaraList,
}) => {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [pulseAnimation, setPulseAnimation] = useState<boolean>(false);
  const [prevCount, setPrevCount] = useState<number>(suaraList.length);

  // Trigger brief pulse animation whenever vote count increases
  useEffect(() => {
    if (suaraList.length !== prevCount) {
      setPulseAnimation(true);
      setPrevCount(suaraList.length);
      const timer = setTimeout(() => setPulseAnimation(false), 800);
      return () => clearTimeout(timer);
    }
  }, [suaraList.length, prevCount]);

  // Periodic heartbeat timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fire confetti if results are displayed to audience and status is finished
  useEffect(() => {
    if (pemilihan.status === 'SELESAI' && pemilihan.hasilDitampilkanKePenonton) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [pemilihan.status, pemilihan.hasilDitampilkanKePenonton]);

  const totalDPT = pemilihList.length;
  const totalSuaraMasuk = suaraList.length;
  const belumMemilih = Math.max(0, totalDPT - totalSuaraMasuk);
  const persentase = totalDPT > 0 ? ((totalSuaraMasuk / totalDPT) * 100).toFixed(2) : '0';

  // Per-candidate vote calculation (only used when revealed)
  const candidateTally = calonList
    .map((c) => {
      const count = suaraList.filter((s) => s.idCalon === c.id).length;
      const pct = totalSuaraMasuk > 0 ? ((count / totalSuaraMasuk) * 100).toFixed(1) : '0';
      return {
        ...c,
        suara: count,
        persentase: pct,
        persentaseNum: totalSuaraMasuk > 0 ? (count / totalSuaraMasuk) * 100 : 0,
      };
    })
    .sort((a, b) => a.noUrut - b.noUrut);

  const highestVotes = Math.max(...candidateTally.map((c) => c.suara), 0);

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4 text-center md:text-left">
          
          <div className="flex items-center gap-4">
            {sekolah.logo ? (
              <div className="relative shrink-0">
                <img
                  src={sekolah.logo}
                  alt="Logo Sekolah"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl bg-white p-1.5 border-2 border-amber-400 shadow-lg shadow-amber-500/20"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/30 border border-amber-300 shrink-0">
                OSIS
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                MONITOR RESMI LAYAR PENONTON
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
                {pemilihan.namaKegiatan}
              </h1>
              <p className="text-slate-400 font-semibold text-sm sm:text-base">
                {sekolah.namaSekolah} • TAHUN PELAJARAN {pemilihan.tahunPelajaran}
              </p>
            </div>
          </div>

          {/* Status & Live Refresh Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 font-mono block">Sinkronisasi Realtime</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Aktif ({lastRefreshed.toLocaleTimeString('id-ID')})
              </span>
            </div>
            
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-2">
              {pemilihan.status === 'BELUM_DIMULAI' && (
                <span className="text-amber-400">⏳ BELUM DIMULAI</span>
              )}
              {pemilihan.status === 'SEDANG_BERLANGSUNG' && (
                <span className="text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  SEDANG BERLANGSUNG
                </span>
              )}
              {pemilihan.status === 'SELESAI' && (
                <span className="text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  PEMILIHAN SELESAI
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Stage */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-8">

        {/* SCENARIO 1: PEMILIHAN BELUM DIMULAI */}
        {pemilihan.status === 'BELUM_DIMULAI' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-16 text-center max-w-3xl mx-auto backdrop-blur-xl">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
              <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              PEMILIHAN BELUM DIMULAI
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Panitia sedang mempersiapkan bilik suara digital. Layar ini akan menampilkan perhitungan suara masuk secara otomatis setelah pemilihan resmi dibuka.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-semibold">Jadwal Mulai:</span>
                <p className="text-lg font-mono font-bold text-amber-400">{pemilihan.waktuMulai} WIB</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Pemilih (DPT):</span>
                <p className="text-lg font-mono font-bold text-white">{totalDPT} Siswa</p>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO 2: PEMILIHAN SEDANG BERLANGSUNG (STRICT PRIVACY: ONLY SHOW TOTAL COUNT, NEVER CANDIDATE VOTES!) */}
        {pemilihan.status === 'SEDANG_BERLANGSUNG' && (
          <div className="space-y-8">
            
            {/* Massive Counter Banner */}
            <div className="text-center py-4">
              <p className="text-sm sm:text-base font-extrabold tracking-widest text-amber-400 uppercase mb-2">
                PEMUNGUTAN SUARA SEDANG BERLANGSUNG
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-300">
                Jumlah Suara yang Telah Masuk ke Kotak Suara Digital
              </h2>
            </div>

            {/* Giant Metric Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              
              {/* PRIMARY CARD: SUARA SUDAH MASUK */}
              <div className="md:col-span-3 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-yellow-500/10 pointer-events-none" />
                <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-amber-300 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-700/60 inline-block mb-4">
                  SUARA SUDAH MASUK
                </span>

                <div className={`transition-transform duration-300 ${pulseAnimation ? 'scale-110 text-amber-400' : 'scale-100 text-white'}`}>
                  <span className="font-mono text-7xl sm:text-9xl font-black tracking-tighter drop-shadow-md">
                    {totalSuaraMasuk}
                  </span>
                  <span className="text-2xl sm:text-4xl text-slate-400 font-bold ml-2">Suara</span>
                </div>

                {/* Big Progress Bar */}
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                    <span>PROGRESS PENGUMPULAN SUARA</span>
                    <span className="text-emerald-400">{persentase}%</span>
                  </div>
                  <div className="h-6 sm:h-8 w-full bg-slate-800 rounded-full p-1 border border-slate-700 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-black text-slate-950"
                      style={{ width: `${Math.min(100, Math.max(2, Number(persentase)))}%` }}
                    >
                      {Number(persentase) > 10 && `${persentase}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* STAT 1: PEMILIH TERDAFTAR */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col justify-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  PEMILIH TERDAFTAR (DPT)
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                  {totalDPT}
                </span>
                <span className="text-xs text-slate-500 mt-1">Siswa Berhak Memilih</span>
              </div>

              {/* STAT 2: TINGKAT PARTISIPASI */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col justify-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  TINGKAT PARTISIPASI
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                  {persentase}%
                </span>
                <span className="text-xs text-slate-500 mt-1">Dari Total Hak Suara</span>
              </div>

              {/* STAT 3: BELUM MEMBERIKAN SUARA */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col justify-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/15 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  BELUM MEMILIH
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400">
                  {belumMemilih}
                </span>
                <span className="text-xs text-slate-500 mt-1">Siswa Belum Menggunakan Suara</span>
              </div>

            </div>

            {/* Privacy Badge Guarantee */}
            <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800/80 max-w-xl mx-auto text-xs text-slate-400">
              🔒 Perolehan suara masing-masing calon dirahasiakan selama pemilihan berlangsung demi menjaga independensi pilihan.
            </div>

          </div>
        )}

        {/* SCENARIO 3: PEMILIHAN SELESAI, TAPI ADMIN BELUM MENGAKTIFKAN TAMPILKAN HASIL */}
        {pemilihan.status === 'SELESAI' && !pemilihan.hasilDitampilkanKePenonton && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-16 text-center max-w-3xl mx-auto backdrop-blur-xl">
            <div className="w-20 h-20 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              PEMILIHAN SUDAH SELESAI
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-6">
              Pemungutan suara telah ditutup. Panitia sedang melakukan proses validasi dan verifikasi data suara masuk.
            </p>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-sm text-slate-400 max-w-md mx-auto">
              Hasil akhir akan segera ditampilkan di layar ini setelah Admin mengaktifkan <strong>"TAMPILKAN HASIL"</strong>.
            </div>
          </div>
        )}

        {/* SCENARIO 4: PEMILIHAN SELESAI & ADMIN SUDAH MENGAKTIFKAN TAMPILKAN HASIL (FULL REVEAL) */}
        {pemilihan.status === 'SELESAI' && pemilihan.hasilDitampilkanKePenonton && (
          <div className="space-y-8">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 mb-3">
                <Trophy className="w-4 h-4 text-yellow-400" />
                HASIL AKHIR RESMI PEMILIHAN
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                PEROLEHAN SUARA CALON KETUA OSIS
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                Total Suara Masuk: <strong className="text-white">{totalSuaraMasuk}</strong> dari <strong className="text-white">{totalDPT}</strong> Pemilih Terdaftar ({persentase}% Partisipasi)
              </p>
            </div>

            {/* Candidate Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {candidateTally.map((calon) => {
                const isWinner = calon.suara === highestVotes && calon.suara > 0;
                return (
                  <div
                    key={calon.id}
                    className={`bg-slate-900 rounded-3xl border-2 overflow-hidden shadow-2xl relative transition-all duration-300 flex flex-col ${
                      isWinner
                        ? 'border-yellow-500/80 ring-4 ring-yellow-500/20 scale-102'
                        : 'border-slate-800'
                    }`}
                  >
                    {isWinner && (
                      <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-slate-950 font-black text-xs py-1.5 px-4 text-center tracking-wider flex items-center justify-center gap-1.5 shadow-md">
                        <Award className="w-4 h-4" />
                        PEROLEHAN SUARA TERTINGGI (TERPILIH)
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {/* Photo and Number */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <img
                            src={calon.foto}
                            alt={calon.nama}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-700"
                          />
                          <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow-md">
                            0{calon.noUrut}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-slate-400 font-bold">NOMOR URUT 0{calon.noUrut}</span>
                          <h3 className="text-lg sm:text-xl font-black text-white leading-tight truncate">
                            {calon.nama}
                          </h3>
                          <p className="text-xs text-slate-400">Kelas {calon.kelas}</p>
                        </div>
                      </div>

                      {/* Vote Count & Percent */}
                      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 mb-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                              {calon.suara}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold ml-1.5">Suara</span>
                          </div>
                          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                            {calon.persentase}%
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="h-3 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isWinner
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                            }`}
                            style={{ width: `${calon.persentaseNum}%` }}
                          />
                        </div>
                      </div>

                      {/* Tagline */}
                      {calon.tagline && (
                        <p className="text-xs text-slate-400 italic text-center">
                          "{calon.tagline}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>
          Sistem E-Pemilihan Ketua OSIS • <strong>{sekolah.namaSekolah}</strong>
        </p>
        <p className="font-mono">
          Status Sistem: Operasional Normal (Layar Terbuka)
        </p>
      </footer>

    </main>
  );
};
