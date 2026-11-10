import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Filter,
  UserCheck,
  FileCheck2,
  Calendar,
  Layers
} from 'lucide-react';
import { Pemilih, PengaturanSekolah, PengaturanPemilihan } from '../../types';

interface AbsensiPemilihModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  pemilihList: Pemilih[];
}

export const AbsensiPemilihModal: React.FC<AbsensiPemilihModalProps> = ({
  isOpen,
  onClose,
  sekolah,
  pemilihan,
  pemilihList,
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [modeAbsensi, setModeAbsensi] = useState<'BLANK' | 'REKAP'>('BLANK');
  const [sortBy, setSortBy] = useState<'NAMA' | 'NISN'>('NAMA');
  const [paperSize, setPaperSize] = useState<'A4' | 'FOLIO'>('A4');
  const [namaKetuaOsis, setNamaKetuaOsis] = useState<string>(
    sekolah.namaKetuaOsis || ''
  );

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-print-modal');
      return () => {
        document.body.classList.remove('has-print-modal');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Unique classes for filtering
  const uniqueClasses = Array.from(new Set(pemilihList.map((p) => p.kelas))).sort();

  // Filter voters
  let filteredList = selectedKelas === 'ALL'
    ? [...pemilihList]
    : pemilihList.filter((p) => p.kelas === selectedKelas);

  // Sort voters
  if (sortBy === 'NAMA') {
    filteredList.sort((a, b) => a.nama.localeCompare(b.nama));
  } else {
    filteredList.sort((a, b) => a.nisNisn.localeCompare(b.nisNisn));
  }

  const totalDPT = filteredList.length;
  const totalHadir = filteredList.filter((p) => p.statusMemilih).length;
  const totalTidakHadir = Math.max(0, totalDPT - totalHadir);
  const persentaseHadir = totalDPT > 0 ? ((totalHadir / totalDPT) * 100).toFixed(1) : '0';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return createPortal(
    <div
      id="absensi-pemilih-portal"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 max-h-[96vh] flex flex-col print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-h-none print:overflow-visible print:w-full print:max-w-none">
        
        {/* Top Controls Toolbar (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Lembar Daftar Hadir Pemilih (Model C-Daftar Hadir DPT)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Format lembar absensi resmi pemilu lengkap dengan kolom tanda tangan zig-zag KPPS siap cetak.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Cetak Absensi ({filteredList.length})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Hidden on print) */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl my-3 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-xs">
              <span className="text-slate-500 font-bold">Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas ({pemilihList.length} DPT)</option>
                {uniqueClasses.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k} ({pemilihList.filter((p) => p.kelas === k).length} Siswa)
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Lembar Absensi */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setModeAbsensi('BLANK')}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                  modeAbsensi === 'BLANK'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kolom tanda tangan kosong untuk ditandatangani basah oleh siswa di TPS"
              >
                ✍️ Blangko TPS (Tanda Tangan Basah)
              </button>
              <button
                type="button"
                onClick={() => setModeAbsensi('REKAP')}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                  modeAbsensi === 'REKAP'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan centang status kehadiran digital siswa yang sudah coblos"
              >
                📊 Rekap Kehadiran Realtime
              </button>
            </div>

            {/* Urutan */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-xs">
              <span className="text-slate-500 font-bold">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'NAMA' | 'NISN')}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="NAMA">Nama Siswa (A-Z)</option>
                <option value="NISN">NIS / NISN</option>
              </select>
            </div>

            {/* Pilihan Kertas */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2 py-0.5 rounded-md font-bold ${
                  paperSize === 'A4'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('FOLIO')}
                className={`px-2 py-0.5 rounded-md font-bold ${
                  paperSize === 'FOLIO'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Folio / F4
              </button>
            </div>

            {/* Nama Ketua OSIS Editor */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-[11px] shadow-xs">
              <span className="text-slate-500 font-bold">Ketua OSIS:</span>
              <input
                type="text"
                value={namaKetuaOsis}
                onChange={(e) => setNamaKetuaOsis(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none w-36 sm:w-44"
                placeholder="( .................... )"
              />
            </div>

          </div>

          <div className="text-slate-600 font-mono text-[11px] bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-xs">
            Hadir: <strong className="text-emerald-600">{totalHadir}</strong> / {totalDPT} ({persentaseHadir}%)
          </div>
        </div>

        {/* Printable Official Document Sheet Area */}
        <div
          id="print-absensi-area"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white border border-slate-200 rounded-2xl print:border-none print:p-0 print:m-0 print:overflow-visible print:w-full font-serif"
        >
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Tidak ada data pemilih untuk ditampilkan.</p>
              <p className="text-xs">Silakan pilih kelas lain atau periksa data DPT Anda.</p>
            </div>
          ) : (
            <div>
              {/* Kop Surat Resmi */}
              <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-3 mb-4">
                {sekolah.logo ? (
                  <img
                    src={sekolah.logo}
                    alt="Logo Sekolah"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                    OSIS
                  </div>
                )}
                <div className="flex-1 text-center font-sans">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-wider uppercase">
                    KOMISI PEMILIHAN KETUA & WAKIL KETUA OSIS (KP-OSIS)
                  </h3>
                  <h1 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    {sekolah.namaSekolah}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                    {sekolah.alamat} • NPSN: {sekolah.npsn} • NSM: {sekolah.nsm}
                  </p>
                </div>
              </div>

              {/* Judul Formulir Model Pemilu Resmi */}
              <div className="text-center font-sans mb-4 space-y-0.5">
                <div className="inline-block px-3 py-0.5 border border-slate-900 font-mono font-black text-[10px] sm:text-xs tracking-wider uppercase mb-1">
                  FORMULIR MODEL C.DAFTAR HADIR - DPT
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                  DAFTAR HADIR PEMILIH TETAP (DPT) DI TPS / BILIK SUARA
                </h2>
                <p className="text-xs text-slate-700 font-medium">
                  {pemilihan.namaKegiatan} • TAHUN PELAJARAN {pemilihan.tahunPelajaran}
                </p>
              </div>

              {/* Metadata Informasi TPS & Kelas */}
              <div className="font-sans text-[11px] sm:text-xs grid grid-cols-2 gap-x-4 gap-y-1 mb-4 p-2.5 border border-slate-400 rounded-md bg-slate-50/50 print:bg-transparent">
                <div>
                  <span className="text-slate-500">Tempat Pemungutan Suara (TPS):</span>{' '}
                  <strong className="text-slate-900">TPS 01 (Bilik Suara Digital Siswa)</strong>
                </div>
                <div>
                  <span className="text-slate-500">Hari, Tanggal:</span>{' '}
                  <strong className="text-slate-900">{formattedDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Rombel / Kelas:</span>{' '}
                  <strong className="text-slate-900">
                    {selectedKelas === 'ALL' ? 'Semua Kelas (Seluruh DPT)' : `Kelas ${selectedKelas}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Total DPT Terdaftar:</span>{' '}
                  <strong className="text-slate-900">{totalDPT} Pemilih</strong>
                </div>
              </div>

              {/* Tabel Daftar Hadir Resmi Pemilu Model C */}
              <table className="w-full font-sans border-collapse border border-slate-900 text-[10px] sm:text-[11px]">
                <thead>
                  <tr className="bg-slate-200 print:bg-slate-200 border-b-2 border-slate-900 text-slate-900">
                    <th className="border border-slate-800 p-1.5 text-center w-8">NO.</th>
                    <th className="border border-slate-800 p-1.5 text-center w-28">NIS / NISN</th>
                    <th className="border border-slate-800 p-1.5 text-left">NAMA LENGKAP SISWA (DPT)</th>
                    <th className="border border-slate-800 p-1.5 text-center w-14">KELAS</th>
                    <th className="border border-slate-800 p-1.5 text-center w-36" colSpan={2}>
                      TANDA TANGAN / PARAF PEMILIH
                    </th>
                    <th className="border border-slate-800 p-1.5 text-center w-24">STATUS / KET.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, index) => {
                    const noUrut = index + 1;
                    const isOdd = noUrut % 2 !== 0;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-400 break-inside-avoid page-break-inside-avoid hover:bg-slate-50"
                      >
                        {/* No */}
                        <td className="border border-slate-700 p-1.5 text-center font-bold">
                          {noUrut}
                        </td>

                        {/* NIS / NISN */}
                        <td className="border border-slate-700 p-1.5 text-center font-mono font-medium">
                          {item.nisNisn}
                        </td>

                        {/* Nama */}
                        <td className="border border-slate-700 p-1.5 font-bold uppercase text-slate-950">
                          {item.nama}
                        </td>

                        {/* Kelas */}
                        <td className="border border-slate-700 p-1.5 text-center font-bold">
                          {item.kelas}
                        </td>

                        {/* Kolom Tanda Tangan Ganjil (Kiri) */}
                        <td className="border border-slate-700 p-1.5 w-20 text-left align-middle h-8">
                          {isOdd && (
                            modeAbsensi === 'REKAP' && item.statusMemilih ? (
                              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[9px]">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>{noUrut}. Hadir</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">
                                {noUrut}. .................
                              </span>
                            )
                          )}
                        </td>

                        {/* Kolom Tanda Tangan Genap (Kanan) */}
                        <td className="border border-slate-700 p-1.5 w-20 text-left align-middle h-8">
                          {!isOdd && (
                            modeAbsensi === 'REKAP' && item.statusMemilih ? (
                              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[9px]">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>{noUrut}. Hadir</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">
                                {noUrut}. .................
                              </span>
                            )
                          )}
                        </td>

                        {/* Keterangan */}
                        <td className="border border-slate-700 p-1.5 text-center text-[9px] font-medium">
                          {modeAbsensi === 'REKAP' ? (
                            item.statusMemilih ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                SUDAH COBLOS
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Belum Hadir</span>
                            )
                          ) : (
                            <span className="text-slate-300">...............</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Catatan & Rekapitulasi Kehadiran */}
              <div className="mt-4 pt-2 border-t-2 border-slate-800 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rekap Angka */}
                  <div className="border border-slate-400 p-2.5 rounded-md bg-slate-50/50 print:bg-transparent">
                    <h5 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">
                      Rekapitulasi Kehadiran Pemilih:
                    </h5>
                    <table className="w-full text-[11px]">
                      <tbody>
                        <tr>
                          <td className="py-0.5 text-slate-600">1. Total Pemilih Terdaftar (DPT)</td>
                          <td className="py-0.5 font-bold text-right font-mono">: {totalDPT} Siswa</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-slate-600">2. Pemilih Hadir Memberikan Suara</td>
                          <td className="py-0.5 font-bold text-right font-mono text-emerald-800">
                            : {modeAbsensi === 'REKAP' ? `${totalHadir} Siswa (${persentaseHadir}%)` : '...... Siswa'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-slate-600">3. Pemilih Tidak Hadir / Absen</td>
                          <td className="py-0.5 font-bold text-right font-mono text-red-800">
                            : {modeAbsensi === 'REKAP' ? `${totalTidakHadir} Siswa` : '...... Siswa'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Catatan KPPS */}
                  <div className="border border-slate-400 p-2.5 rounded-md text-[10px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800 uppercase">Petunjuk KPPS / Petugas Registrasi:</p>
                    <p>1. Setiap pemilih wajib menunjukkan kartu pemilih dan menandatangani daftar hadir ini sebelum menuju bilik suara.</p>
                    <p>2. Pemilih yang berhalangan hadir atau telah pindah diberi keterangan pada kolom keterangan.</p>
                    <p>3. Lembar daftar hadir ini merupakan dokumen resmi pertanggungjawaban panitia pemilihan.</p>
                  </div>
                </div>

                {/* Lembar Tanda Tangan Resmi: TTD HANYA KETUA OSIS, PANITIA, KEPALA SEKOLAH */}
                <div className="grid grid-cols-2 gap-4 text-center mt-6 pt-2 break-inside-avoid page-break-inside-avoid text-[11px]">
                  <div>
                    <p className="text-slate-800 font-bold mb-0.5">Ketua OSIS,</p>
                    <div className="h-14 sm:h-16 flex items-center justify-center text-slate-300 italic text-[10px]">
                      (Tanda Tangan)
                    </div>
                    <p className="font-bold underline uppercase text-slate-900">
                      {namaKetuaOsis.trim() || '( .................................... )'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-800 font-bold mb-0.5">Panitia Pemilihan,</p>
                    <p className="text-[10px] text-slate-500 -mt-0.5 font-medium">Ketua Panitia</p>
                    <div className="h-12 sm:h-14 flex items-center justify-center text-slate-300 italic text-[10px]">
                      (Tanda Tangan & Cap)
                    </div>
                    <p className="font-bold underline uppercase text-slate-900">
                      {sekolah.namaKetuaPanitia || '( .................................... )'}
                    </p>
                  </div>

                  <div className="col-span-2 text-center mt-3 pt-2 border-t border-slate-300">
                    <p className="text-slate-600">Mengetahui & Mengesahkan,</p>
                    <p className="font-bold text-slate-900 text-xs">Kepala {sekolah.namaSekolah}</p>
                    <div className="h-12 sm:h-14 flex items-center justify-center text-slate-300 italic text-[10px]">
                      (Tanda Tangan & Cap Dinas)
                    </div>
                    <p className="font-bold underline uppercase text-slate-900 text-xs">
                      {sekolah.namaKepalaSekolah}
                    </p>
                    <p className="text-[10px] text-slate-600">NIP: {sekolah.nipKepalaSekolah || '-'}</p>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};
