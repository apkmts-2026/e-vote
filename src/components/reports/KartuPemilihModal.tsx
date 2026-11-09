import React, { useState } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  Scissors,
  Lock,
  User,
  GraduationCap,
  Layers,
  FileText
} from 'lucide-react';
import { Pemilih, PengaturanSekolah, PengaturanPemilihan } from '../../types';

interface KartuPemilihModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  pemilihList: Pemilih[];
  singlePemilih?: Pemilih | null;
}

export const KartuPemilihModal: React.FC<KartuPemilihModalProps> = ({
  isOpen,
  onClose,
  sekolah,
  pemilihan,
  pemilihList,
  singlePemilih = null,
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>(
    singlePemilih ? singlePemilih.kelas : 'ALL'
  );
  const [paperSize, setPaperSize] = useState<'A4' | 'FOLIO'>('A4');

  if (!isOpen) return null;

  // Class list for filtering
  const uniqueClasses = Array.from(new Set(pemilihList.map((p) => p.kelas))).sort();

  // Filtered voters to render
  const targetList: Pemilih[] = singlePemilih
    ? [singlePemilih]
    : selectedKelas === 'ALL'
    ? pemilihList
    : pemilihList.filter((p) => p.kelas === selectedKelas);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 max-h-[96vh] flex flex-col">
        
        {/* Modal Controls (Hidden during print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                {singlePemilih ? 'Cetak Kartu Pemilih Satuan' : 'Cetak Kartu Pemilih Massal'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {singlePemilih
                ? `Mencetak kartu pemilih untuk: ${singlePemilih.nama} (${singlePemilih.kelas})`
                : `Total ${targetList.length} kartu siap dicetak dalam format lembar kertas siap potong.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            {/* Class Filter (Only if mass printing) */}
            {!singlePemilih && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-bold">Kelas:</span>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kelas ({pemilihList.length})</option>
                  {uniqueClasses.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k} ({pemilihList.filter((p) => p.kelas === k).length})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paper Size Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  paperSize === 'A4'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ukuran Kertas A4 (210 x 297 mm)"
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('FOLIO')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  paperSize === 'FOLIO'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ukuran Kertas Folio / F4 (215 x 330 mm)"
              >
                Folio / F4
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={targetList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Sekarang ({targetList.length})
            </button>

            {/* Close Button */}
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

        {/* Paper Guide Hint (Hidden on print) */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-2 rounded-xl my-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-600" />
            <span>
              Format Kertas: <strong>{paperSize === 'A4' ? 'A4 (210 x 297 mm)' : 'Folio / F4 (215 x 330 mm)'}</strong> • Disusun rapi <strong>2 kolom</strong> per lembar dengan garis putus-putus untuk kemudahan pemotongan kartu.
            </span>
          </div>
          <span className="font-mono font-bold text-amber-700 hidden sm:inline">
            Estimasi: {Math.ceil(targetList.length / 8)} Lembar
          </span>
        </div>

        {/* Printable Cards Sheet Area */}
        <div
          id="print-kartu-area"
          className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 border border-slate-200 rounded-2xl print:bg-white print:border-none print:p-0 print:m-0"
        >
          {targetList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Tidak ada data pemilih yang dipilih.</p>
              <p className="text-xs">Pastikan daftar DPT sudah terisi atau pilih filter kelas yang memiliki siswa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 print:grid-cols-2 print:gap-3">
              {targetList.map((pemilihItem, index) => (
                <div
                  key={pemilihItem.id}
                  className="print-card-item bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3.5 sm:p-4 relative flex flex-col justify-between shadow-xs print:shadow-none print:border-slate-400 print:rounded-xl break-inside-avoid page-break-inside-avoid overflow-hidden"
                  style={{ minHeight: '210px' }}
                >
                  {/* Subtle Background Watermark */}
                  <div className="absolute right-2 bottom-2 text-slate-100 font-black text-6xl select-none pointer-events-none -rotate-12 uppercase opacity-40">
                    PILKETOS
                  </div>

                  {/* Scissor Cut Mark Corner */}
                  <div className="absolute -top-1 -right-1 text-slate-300 print:text-slate-400">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>

                  {/* Header Kartu Kop Mini */}
                  <div className="flex items-center gap-2.5 border-b-2 border-slate-800 pb-2 mb-2.5">
                    {sekolah.logo ? (
                      <img
                        src={sekolah.logo}
                        alt="Logo"
                        className="w-10 h-10 object-contain rounded-lg p-0.5 border border-slate-200 bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        OSIS
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase text-slate-900 leading-tight truncate">
                        KARTU PEMILIH DIGITAL (DPT)
                      </h4>
                      <p className="text-[10px] font-bold text-slate-700 uppercase truncate">
                        {sekolah.namaSekolah}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">
                        {pemilihan.namaKegiatan} • TP {pemilihan.tahunPelajaran}
                      </p>
                    </div>
                  </div>

                  {/* Body: Identitas Siswa Pemilih */}
                  <div className="space-y-1.5 text-xs text-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Nama Siswa:</span>
                        <h5 className="text-xs sm:text-sm font-black text-slate-950 uppercase truncate leading-tight">
                          {pemilihItem.nama}
                        </h5>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Kelas:</span>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-900 font-black text-[11px]">
                          {pemilihItem.kelas}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">NIS / NISN:</span>
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {pemilihItem.nisNisn}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">No. Urut DPT:</span>
                        <span className="font-mono font-bold text-slate-600 text-[11px]">
                          #{String(index + 1).padStart(3, '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Token Box (PIN Khusus Bilik Suara) */}
                  <div className="my-2 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-400 rounded-xl p-2 text-center shadow-xs">
                    <span className="text-[9px] font-black uppercase text-amber-900 tracking-wider flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" />
                      KODE TOKEN / PIN BILIK SUARA
                    </span>
                    <div className="font-mono text-base sm:text-lg font-black tracking-widest text-slate-950 mt-0.5">
                      {pemilihItem.kodePemilih}
                    </div>
                  </div>

                  {/* Footer Kartu & Petunjuk Singkat */}
                  <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-[9px] text-slate-500">
                    <p className="leading-tight">
                      * Buka bilik suara &bull; Masukkan NISN + Token &bull; Coblos pilihanmu.
                    </p>
                    <span className="font-bold text-slate-700 shrink-0 uppercase tracking-wider text-[8px] border border-slate-300 px-1 py-0.2 rounded">
                      🔒 RAHASIA
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
