import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  Search,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { ParseExcelResult, ParsedPemilihRow, IgnoredRowDetail } from '../../utils/excel';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parseResult: ParseExcelResult | null;
  fileName: string;
  onConfirmImport: (mode: 'OVERWRITE' | 'MERGE' | 'SKIP_DUPLICATES') => void;
  currentDptCount: number;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  parseResult,
  fileName,
  onConfirmImport,
  currentDptCount,
}) => {
  const [importMode, setImportMode] = useState<'OVERWRITE' | 'MERGE' | 'SKIP_DUPLICATES'>('OVERWRITE');
  const [activeTab, setActiveTab] = useState<'VALID' | 'IGNORED'>('VALID');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen || !parseResult) return null;

  const filteredValid = parseResult.validPemilih.filter(
    (p: ParsedPemilihRow) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nisNisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIgnored = parseResult.ignoredRows.filter(
    (r: IgnoredRowDetail) =>
      r.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sheetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 max-h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Hasil Analisis & Pratinjau Import Excel DPT
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              File: <strong className="text-slate-800">{fileName}</strong> • Terdeteksi total{' '}
              <strong className="text-emerald-700 font-bold">{parseResult.totalStudentsFound} Siswa</strong> dari{' '}
              {parseResult.sheetsDetected.length} Sheet.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            title="Batal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-black">
              ✓
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Siswa Valid Terbaca</span>
              <strong className="text-emerald-900 text-base font-black">
                {parseResult.totalStudentsFound} Siswa
              </strong>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 font-black">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Sheet Excel Terbaca</span>
              <p className="text-blue-950 font-bold truncate text-xs">
                {parseResult.sheetsDetected
                  .filter((s: { sheetName: string; rowCount: number; studentCount: number }) => s.studentCount > 0)
                  .map((s: { sheetName: string; rowCount: number; studentCount: number }) => `${s.sheetName} (${s.studentCount})`)
                  .join(', ') || `${parseResult.sheetsDetected.length} Sheet`}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-black text-xs">
              {parseResult.ignoredRows.length}
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Baris Dilewati</span>
              <span className="text-slate-700 font-bold text-xs">
                {parseResult.ignoredRows.length > 0 ? `${parseResult.ignoredRows.length} baris (non-siswa)` : '0 baris'}
              </span>
            </div>
          </div>
        </div>

        {/* Import Mode Selector Box */}
        <div className="bg-gradient-to-r from-amber-50/70 via-yellow-50/50 to-amber-50/70 border border-amber-300 rounded-2xl p-3 sm:p-4 mb-3">
          <label className="text-xs font-black text-amber-950 uppercase tracking-wide block mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Pilih Mode Penyimpanan ke Sistem:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* Mode 1: Overwrite (Recommended) */}
            <label
              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                importMode === 'OVERWRITE'
                  ? 'border-emerald-600 bg-white shadow-xs text-slate-900 font-bold'
                  : 'border-slate-200 bg-white/60 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="importMode"
                  value="OVERWRITE"
                  checked={importMode === 'OVERWRITE'}
                  onChange={() => setImportMode('OVERWRITE')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    Ganti Seluruh DPT (Disarankan)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Mengganti data lama ({currentDptCount} siswa) dan menetapkan <strong>{parseResult.totalStudentsFound} siswa</strong> ini sebagai DPT resmi baru.
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded self-start mt-2">
                ⭐ Rekomendasi File Lengkap
              </span>
            </label>

            {/* Mode 2: Merge (Update & Add) */}
            <label
              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                importMode === 'MERGE'
                  ? 'border-emerald-600 bg-white shadow-xs text-slate-900 font-bold'
                  : 'border-slate-200 bg-white/60 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="importMode"
                  value="MERGE"
                  checked={importMode === 'MERGE'}
                  onChange={() => setImportMode('MERGE')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    Perbarui & Gabungkan (Merge)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Siswa dengan NIS sama akan diperbarui, dan siswa baru ditambahkan ke DPT yang sudah ada.
                  </p>
                </div>
              </div>
            </label>

            {/* Mode 3: Skip Duplicates */}
            <label
              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                importMode === 'SKIP_DUPLICATES'
                  ? 'border-emerald-600 bg-white shadow-xs text-slate-900 font-bold'
                  : 'border-slate-200 bg-white/60 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="importMode"
                  value="SKIP_DUPLICATES"
                  checked={importMode === 'SKIP_DUPLICATES'}
                  onChange={() => setImportMode('SKIP_DUPLICATES')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    Hanya Tambah yang Belum Ada
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Jika NIS sudah terdaftar sebelumnya, baris tersebut dilewati tanpa diubah.
                  </p>
                </div>
              </div>
            </label>

          </div>
        </div>

        {/* Tab Selector & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('VALID')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'VALID'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Siswa Terbaca ({parseResult.totalStudentsFound})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('IGNORED')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'IGNORED'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-amber-600" />
              Baris Dilewati ({parseResult.ignoredRows.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa / baris..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl min-h-[220px] max-h-[360px] bg-white">
          {activeTab === 'VALID' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Sheet Asal</th>
                    <th className="py-2.5 px-3">NIS / NISN</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3 text-center">Kelas</th>
                    <th className="py-2.5 px-3 font-mono text-center">Token Dihasilkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredValid.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tidak ada siswa yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredValid.map((item: ParsedPemilihRow, idx: number) => (
                      <tr key={`${item.sourceSheet}-${item.sourceRowNumber}-${idx}`} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{item.sourceSheet}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{item.nisNisn}</td>
                        <td className="py-2 px-3 font-bold text-slate-950 uppercase">{item.nama}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                            {item.kelas}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-700 text-center">
                          {item.kodePemilih}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {parseResult.ignoredRows.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700 text-xs">Semua baris terbaca sempurna!</p>
                  <p className="text-[11px]">Tidak ada baris yang dilewati atau gagal dibaca pada file ini.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">Baris</th>
                      <th className="py-2.5 px-3 w-28">Sheet</th>
                      <th className="py-2.5 px-3">Cuplikan Isi Baris di Excel</th>
                      <th className="py-2.5 px-3">Alasan Dilewati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIgnored.map((item: IgnoredRowDetail, idx: number) => (
                      <tr key={idx} className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">
                          #{item.rowNumber}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{item.sheetName}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-700 truncate max-w-xs">
                          {item.contentSnippet || '(kosong)'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-slate-200 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Pastikan jumlah siswa sudah sesuai sebelum menekan tombol simpan.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onConfirmImport(importMode)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan {parseResult.totalStudentsFound} Siswa ke DPT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
