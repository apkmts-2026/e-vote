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
    <main className="min-h-[calc(100vh-5rem)] bg-rainbow-bright text-slate-900 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      
      {/* Background Rainbow Floating Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-white/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-white/35 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between p-5 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl gap-4 text-center md:text-left text-slate-900">
          
          <div className="flex items-center gap-4">
            {sekolah.logo ? (
              <div className="relative shrink-0">
                <img
                  src={sekolah.logo}
                  alt="Logo Sekolah"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl bg-white p-1.5 border-2 border-amber-400 shadow-md"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md border border-amber-300 shrink-0">
                OSIS
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                  MONITOR SUARA
                </div>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
                {pemilihan.namaKegiatan}
              </h1>
              <p className="text-slate-600 font-bold text-sm sm:text-base">
                {sekolah.namaSekolah} • TAHUN PELAJARAN {pemilihan.tahunPelajaran}
              </p>
            </div>
          </div>

          {/* Status & Live Refresh Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 font-mono font-bold block">Sinkronisasi Realtime</span>
              <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1.5 justify-end">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Aktif ({lastRefreshed.toLocaleTimeString('id-ID')})
              </span>
            </div>
            
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm text-slate-800">
              {pemilihan.status === 'BELUM_DIMULAI' && (
                <span className="text-amber-700">⏳ BELUM DIMULAI</span>
              )}
              {pemilihan.status === 'SEDANG_BERLANGSUNG' && (
                <span className="text-emerald-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  SEDANG BERLANGSUNG
                </span>
              )}
              {pemilihan.status === 'SELESAI' && (
                <span className="text-blue-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
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
          <div className="bg-white/95 border border-white/80 rounded-3xl p-8 sm:p-16 text-center max-w-3xl mx-auto backdrop-blur-xl shadow-2xl text-slate-900">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 border border-amber-300 shadow-md">
              <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              PEMILIHAN BELUM DIMULAI
            </h2>
            <p className="text-slate-600 font-medium text-base sm:text-lg max-w-xl mx-auto mb-8">
              Panitia sedang mempersiapkan bilik suara digital. Layar ini akan menampilkan perhitungan suara masuk secara otomatis setelah pemilihan resmi dibuka.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-bold">Jadwal Mulai:</span>
                <p className="text-lg font-mono font-black text-amber-600">{pemilihan.waktuMulai} WIB</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-bold">Total Pemilih (DPT):</span>
                <p className="text-lg font-mono font-black text-slate-900">{totalDPT} Siswa</p>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO 2: PEMILIHAN SEDANG BERLANGSUNG */}
        {pemilihan.status === 'SEDANG_BERLANGSUNG' && (
          <div className="space-y-8">
            
            {/* Massive Counter Banner */}
            <div className="text-center py-4 px-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 max-w-2xl mx-auto shadow-xl text-slate-900">
              <p className="text-sm sm:text-base font-black tracking-widest text-amber-600 uppercase mb-1">
                PEMUNGUTAN SUARA SEDANG BERLANGSUNG
              </p>
              <h2 className="text-base sm:text-lg font-bold text-slate-700">
                Jumlah Suara yang Telah Masuk ke Kotak Suara Digital
              </h2>
            </div>

            {/* Giant Metric Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              
              {/* PRIMARY CARD: SUARA SUDAH MASUK */}
              <div className="md:col-span-3 bg-white/95 backdrop-blur-xl border-4 border-amber-400 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-yellow-500/10 pointer-events-none" />
                <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-950 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500/40 inline-block mb-4 shadow-md">
                  SUARA SUDAH MASUK
                </span>

                <div className={`transition-transform duration-300 ${pulseAnimation ? 'scale-110 text-amber-600' : 'scale-100 text-slate-900'}`}>
                  <span className="font-mono text-7xl sm:text-9xl font-black tracking-tighter drop-shadow-sm">
                    {totalSuaraMasuk}
                  </span>
                  <span className="text-2xl sm:text-4xl text-slate-500 font-bold ml-2">Suara</span>
                </div>

                {/* Big Progress Bar */}
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-600 mb-2">
                    <span className="font-bold">PROGRESS PENGUMPULAN SUARA</span>
                    <span className="text-emerald-600 font-black">{persentase}%</span>
                  </div>
                  <div className="h-6 sm:h-8 w-full bg-slate-100 rounded-full p-1 border border-slate-300 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-black text-slate-950 shadow-sm"
                      style={{ width: `${Math.min(100, Math.max(2, Number(persentase)))}%` }}
                    >
                      {Number(persentase) > 10 && `${persentase}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* STAT 1: PEMILIH TERDAFTAR */}
              <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 text-center flex flex-col justify-center shadow-xl text-slate-900">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  PEMILIH TERDAFTAR (DPT)
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900">
                  {totalDPT}
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-1">Siswa Berhak Memilih</span>
              </div>

              {/* STAT 2: TINGKAT PARTISIPASI */}
              <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 text-center flex flex-col justify-center shadow-xl text-slate-900">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  TINGKAT PARTISIPASI
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-600">
                  {persentase}%
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-1">Dari Total Hak Suara</span>
              </div>

              {/* STAT 3: BELUM MEMBERIKAN SUARA */}
              <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 text-center flex flex-col justify-center shadow-xl text-slate-900">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  BELUM MEMILIH
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-amber-600">
                  {belumMemilih}
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-1">Siswa Belum Memberi Suara</span>
              </div>

            </div>

            {/* Privacy Badge Guarantee */}
            <div className="text-center p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 max-w-xl mx-auto text-xs text-slate-700 font-semibold shadow-lg">
              🔒 Perolehan suara masing-masing calon dirahasiakan selama pemilihan berlangsung demi menjaga kerahasiaan pilihan siswa.
            </div>

          </div>
        )}

        {/* SCENARIO 3: PEMILIHAN SELESAI, TAPI ADMIN BELUM MENGAKTIFKAN TAMPILKAN HASIL */}
        {pemilihan.status === 'SELESAI' && !pemilihan.hasilDitampilkanKePenonton && (
          <div className="bg-white/95 border border-white/80 rounded-3xl p-8 sm:p-16 text-center max-w-3xl mx-auto backdrop-blur-xl shadow-2xl text-slate-900">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-6 border border-blue-200 shadow-md">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              PEMILIHAN SUDAH SELESAI
            </h2>
            <p className="text-slate-600 font-medium text-base sm:text-lg max-w-xl mx-auto mb-6">
              Pemungutan suara telah ditutup. Panitia sedang melakukan proses validasi dan verifikasi data suara masuk.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700 font-semibold max-w-md mx-auto shadow-sm">
              Hasil akhir akan segera ditampilkan di layar ini setelah Admin mengaktifkan <strong>"TAMPILKAN HASIL"</strong>.
            </div>
          </div>
        )}

        {/* SCENARIO 4: PEMILIHAN SELESAI & ADMIN SUDAH MENGAKTIFKAN TAMPILKAN HASIL (FULL REVEAL) */}
        {pemilihan.status === 'SELESAI' && pemilihan.hasilDitampilkanKePenonton && (
          <div className="space-y-8">
            <div className="text-center py-6 px-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 max-w-4xl mx-auto shadow-2xl text-slate-900">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-yellow-100 text-yellow-900 border border-yellow-300 mb-3 shadow-sm">
                <Trophy className="w-4 h-4 text-yellow-600" />
                HASIL AKHIR RESMI PEMILIHAN
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 uppercase">
                PEROLEHAN SUARA CALON KETUA OSIS
              </h2>
              <p className="text-slate-600 font-bold text-sm sm:text-base mt-2">
                Total Suara Masuk: <strong className="text-slate-900">{totalSuaraMasuk}</strong> dari <strong className="text-slate-900">{totalDPT}</strong> Pemilih Terdaftar ({persentase}% Partisipasi)
              </p>
            </div>

            {/* Candidate Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {candidateTally.map((calon) => {
                const isWinner = calon.suara === highestVotes && calon.suara > 0;
                return (
                  <div
                    key={calon.id}
                    className={`bg-white/95 backdrop-blur-xl rounded-3xl border-2 overflow-hidden shadow-2xl relative transition-all duration-300 flex flex-col text-slate-900 ${
                      isWinner
                        ? 'border-amber-400 ring-4 ring-amber-300/40 scale-102'
                        : 'border-white/80'
                    }`}
                  >
                    {isWinner && (
                      <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs py-2 px-4 text-center tracking-wider flex items-center justify-center gap-1.5 shadow-md">
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
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
                          />
                          <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                            0{calon.noUrut}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-slate-500 font-bold">NOMOR URUT 0{calon.noUrut}</span>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">
                            {calon.nama}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold">Kelas {calon.kelas}</p>
                        </div>
                      </div>

                      {/* Vote Count & Percent */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 shadow-inner">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                              {calon.suara}
                            </span>
                            <span className="text-xs text-slate-500 font-bold ml-1.5">Suara</span>
                          </div>
                          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                            {calon.persentase}%
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="h-3 w-full bg-slate-200 rounded-full mt-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isWinner
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                            }`}
                            style={{ width: `${calon.persentaseNum}%` }}
                          />
                        </div>
                      </div>

                      {/* Tagline */}
                      {calon.tagline && (
                        <p className="text-xs text-slate-600 italic text-center font-medium">
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
      <footer className="relative z-10 max-w-7xl mx-auto w-full py-4 px-6 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2 shadow-xl">
        <p>
          Sistem E-Pemilihan Ketua OSIS • <strong className="text-slate-950">{sekolah.namaSekolah}</strong>
        </p>
        <p className="font-mono text-emerald-700 font-bold flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          Status Sistem: Layar Monitor Penonton Aktif
        </p>
      </footer>

    </main>
  );
};
