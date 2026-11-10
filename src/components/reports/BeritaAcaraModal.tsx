import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  ShieldCheck,
  FileText,
  FileCheck2,
  Edit3,
  Sparkles,
  Layers,
  Calendar,
  Building2
} from 'lucide-react';
import { Calon, Pemilih, Suara, PengaturanSekolah, PengaturanPemilihan } from '../../types';
import { formatTanggalIndonesia, getNamaHariFromDate } from '../../utils/date';

interface BeritaAcaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  calonList: Calon[];
  pemilihList: Pemilih[];
  suaraList: Suara[];
  isResultsUnlocked?: boolean;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  isOpen,
  onClose,
  sekolah,
  pemilihan,
  calonList,
  pemilihList,
  suaraList,
  isResultsUnlocked = false,
}) => {
  // Default to AUTO if results unlocked or votes exist, otherwise MANUAL (sebelum acara)
  const [modeBeritaAcara, setModeBeritaAcara] = useState<'AUTO' | 'MANUAL'>(
    isResultsUnlocked || suaraList.length > 0 ? 'AUTO' : 'MANUAL'
  );
  const [paperSize, setPaperSize] = useState<'A4' | 'FOLIO'>('A4');
  const [nomorSurat, setNomorSurat] = useState<string>(
    `004/PAN-PILKETOS/${pemilihan.tahunPelajaran.replace('/', '-')}/X/2026`
  );
  const [namaKetuaOsis, setNamaKetuaOsis] = useState<string>(
    sekolah.namaKetuaOsis || ''
  );

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-print-modal');
      // Sync default mode based on current lock status
      if (isResultsUnlocked || suaraList.length > 0) {
        setModeBeritaAcara('AUTO');
      } else {
        setModeBeritaAcara('MANUAL');
      }
      return () => {
        document.body.classList.remove('has-print-modal');
      };
    }
  }, [isOpen, isResultsUnlocked, suaraList.length]);

  if (!isOpen) return null;

  const totalDPT = pemilihList.length;
  const totalMasuk = suaraList.length;
  const totalSah = suaraList.filter((s) => s.status === 'SAH').length;
  const totalTidakSah = suaraList.filter((s) => s.status === 'TIDAK_SAH').length;
  const belumMemilih = Math.max(0, totalDPT - totalMasuk);
  const partisipasi = totalDPT > 0 ? ((totalMasuk / totalDPT) * 100).toFixed(2) : '0';

  const candidateResults = calonList
    .map((c) => {
      const votes = suaraList.filter((s) => s.idCalon === c.id).length;
      const pct = totalMasuk > 0 ? ((votes / totalMasuk) * 100).toFixed(2) : '0';
      return {
        ...c,
        suara: votes,
        persentase: pct,
      };
    })
    .sort((a, b) => b.suara - a.suara); // sort by vote count descending

  const winner = candidateResults[0];

  const handlePrint = () => {
    window.print();
  };

  const hariPelaksanaan = pemilihan.hariPemilihan || getNamaHariFromDate(pemilihan.tanggalPemilihan);
  const tanggalPelaksanaan = formatTanggalIndonesia(pemilihan.tanggalPemilihan, hariPelaksanaan);

  return createPortal(
    <div
      id="berita-acara-portal"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 max-h-[95vh] flex flex-col print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-h-none print:overflow-visible print:w-full print:max-w-none">
        
        {/* Modal Controls Header (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Cetak Dokumen Resmi Berita Acara Pemilihan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih mode cetak sebelum acara (blangko manual) atau setelah acara selesai (rekapitulasi otomatis).
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Sekarang ({paperSize})
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
        <div className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3 rounded-2xl my-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Mode Selector: Sebelum Acara (Manual) vs Setelah Acara (Otomatis) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setModeBeritaAcara('MANUAL')}
                className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
                  modeBeritaAcara === 'MANUAL'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cetak format blangko sebelum acara untuk ditulis manual dengan pulpen saat pleno TPS"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-900" />
                📋 Blangko Manual (Sebelum Acara)
              </button>
              <button
                type="button"
                onClick={() => setModeBeritaAcara('AUTO')}
                className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
                  modeBeritaAcara === 'AUTO'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cetak hasil suara yang sudah terisi otomatis dari database kotak suara digital"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                ⚡ Terisi Otomatis (Setelah Acara)
              </button>
            </div>

            {/* Pilihan Kertas: A4 vs Folio */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  paperSize === 'A4'
                    ? 'bg-slate-900 text-white font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ukuran standar A4 (210 x 297 mm)"
              >
                Kertas A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('FOLIO')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  paperSize === 'FOLIO'
                    ? 'bg-slate-900 text-white font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ukuran Folio / F4 (215 x 330 mm)"
              >
                Folio / F4
              </button>
            </div>

          </div>

          {/* Nomor Surat & Nama Ketua OSIS Editor */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-[11px] shadow-xs">
              <span className="text-slate-500 font-bold">No. Surat:</span>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="bg-transparent font-mono text-slate-800 outline-none w-52 sm:w-60 font-bold"
                placeholder="No. Berita Acara..."
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-[11px] shadow-xs">
              <span className="text-slate-500 font-bold">Nama Ketua OSIS:</span>
              <input
                type="text"
                value={namaKetuaOsis}
                onChange={(e) => setNamaKetuaOsis(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none w-44 sm:w-52"
                placeholder="Kosongkan jika TTD manual"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-[11px] shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-500 font-bold">Jadwal Acuan:</span>
              <strong className="text-slate-800">{tanggalPelaksanaan}</strong>
            </div>
          </div>
        </div>

        {/* Status Guide Notice (Hidden on print) */}
        <div className={`text-xs px-3.5 py-2 rounded-xl mb-2 flex items-center justify-between print:hidden border ${
          modeBeritaAcara === 'MANUAL'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            {modeBeritaAcara === 'MANUAL' ? (
              <>
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Mode Blangko Manual Aktif:</strong> Format kolom suara dicetak bergaris titik-titik (<code>..........</code>) siap diisi manual dengan pulpen oleh panitia & saksi saat penghitungan suara di lapangan.
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Mode Terisi Otomatis Aktif:</strong> Seluruh perolehan suara ({totalMasuk} suara masuk) dan penetapan pemenang terisi lengkap secara otomatis dari sistem digital.
                </span>
              </>
            )}
          </div>
          <span className="font-bold text-[11px] uppercase tracking-wider shrink-0 ml-2">
            Format: {paperSize === 'A4' ? 'A4 (210×297 mm)' : 'Folio F4 (215×330 mm)'}
          </span>
        </div>

        {/* Printable Document Sheet */}
        <div
          id="print-area"
          className="flex-1 overflow-y-auto p-4 sm:p-7 border border-slate-200 rounded-2xl bg-white text-slate-900 font-sans print:border-none print:p-0 print:m-0 print:overflow-visible print:w-full"
        >
          {/* Kop Surat Sekolah Resmi */}
          <div className="flex items-center gap-3.5 border-b-4 border-double border-slate-900 pb-2.5 mb-3">
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
            <div className="flex-1 text-center">
              <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                KOMISI PEMILIHAN KETUA & WAKIL KETUA OSIS
              </h2>
              <h1 className="text-base sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                {sekolah.namaSekolah}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-snug">
                NPSN: {sekolah.npsn} • NSM: {sekolah.nsm} • Alamat: {sekolah.alamat}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500">
                Telepon: {sekolah.telepon || '-'} • Email: {sekolah.email || '-'}
              </p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-3">
            <h2 className="text-sm sm:text-base font-black uppercase underline tracking-wider text-slate-950">
              BERITA ACARA HASIL PEMUNGUTAN DAN PENGHITUNGAN SUARA
            </h2>
            <p className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 mt-0.5">
              Nomor: {nomorSurat}
            </p>
          </div>

          {/* Document Body Intro */}
          <div className="text-[11px] sm:text-xs leading-relaxed mb-3 text-slate-800">
            <p className="mb-1 text-justify">
              Pada hari ini, <strong>{tanggalPelaksanaan}</strong>, bertempat di <strong>{sekolah.namaSekolah}</strong>,
              telah dilaksanakan proses pemungutan dan penghitungan suara secara resmi dalam rangka:{' '}
              <strong>{pemilihan.namaKegiatan} Masa Bakti {pemilihan.tahunPelajaran}</strong>.
            </p>
            <p className="text-justify">
              {modeBeritaAcara === 'AUTO'
                ? 'Berdasarkan rekapitulasi data dari Sistem Kotak Suara Digital (E-Pemilihan OSIS), diperoleh rincian perolehan suara sah sebagai berikut:'
                : 'Adapun hasil rekapitulasi perolehan suara di Tempat Pemungutan Suara (TPS) ditetapkan dan disahkan dengan rincian sebagai berikut:'}
            </p>
          </div>

          {/* Table 1: Rekapitulasi Pemilih & Suara */}
          <div className="mb-3">
            <h4 className="font-bold text-[11px] sm:text-xs uppercase mb-1 bg-slate-100 p-1.5 rounded border border-slate-300 text-slate-900">
              I. DATA REKAPITULASI PEMILIH DAN SUARA
            </h4>
            <table className="w-full text-[10px] sm:text-[11px] border-collapse border border-slate-800">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold w-8 text-center border-r border-slate-800">1</td>
                  <td className="p-1.5 border-r border-slate-800">Jumlah Pemilih Terdaftar dalam DPT</td>
                  <td className="p-1.5 font-bold font-mono text-right w-44">
                    {modeBeritaAcara === 'AUTO' ? `${totalDPT} Siswa` : `${totalDPT > 0 ? `${totalDPT} Siswa` : '................................ Siswa'}`}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold text-center border-r border-slate-800">2</td>
                  <td className="p-1.5 border-r border-slate-800">Jumlah Pemilih yang Menggunakan Hak Pilih (Suara Masuk)</td>
                  <td className="p-1.5 font-bold font-mono text-right">
                    {modeBeritaAcara === 'AUTO' ? `${totalMasuk} Suara` : '................................ Suara'}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold text-center border-r border-slate-800">3</td>
                  <td className="p-1.5 border-r border-slate-800">Jumlah Pemilih yang Tidak Menggunakan Hak Pilih (Golput / Absen)</td>
                  <td className="p-1.5 font-bold font-mono text-right">
                    {modeBeritaAcara === 'AUTO' ? `${belumMemilih} Siswa` : '................................ Siswa'}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold text-center border-r border-slate-800">4</td>
                  <td className="p-1.5 border-r border-slate-800">Jumlah Suara SAH</td>
                  <td className="p-1.5 font-bold font-mono text-right">
                    {modeBeritaAcara === 'AUTO' ? `${totalSah} Suara` : '................................ Suara'}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold text-center border-r border-slate-800">5</td>
                  <td className="p-1.5 border-r border-slate-800">Jumlah Suara TIDAK SAH</td>
                  <td className="p-1.5 font-bold font-mono text-right">
                    {modeBeritaAcara === 'AUTO' ? `${totalTidakSah} Suara` : '................................ Suara'}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-1.5 text-center border-r border-slate-800">6</td>
                  <td className="p-1.5 border-r border-slate-800">Persentase Partisipasi Pemilih</td>
                  <td className="p-1.5 font-mono text-right text-slate-900">
                    {modeBeritaAcara === 'AUTO' ? `${partisipasi}%` : '................................ %'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Rincian Perolehan Calon */}
          <div className="mb-3">
            <h4 className="font-bold text-[11px] sm:text-xs uppercase mb-1 bg-slate-100 p-1.5 rounded border border-slate-300 text-slate-900">
              II. RINCIAN PEROLEHAN SUARA PASANGAN CALON
            </h4>
            <table className="w-full text-[10px] sm:text-[11px] border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 text-slate-900">
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">No. Urut</th>
                  <th className="p-1.5 border-r border-slate-800 text-left">Nama Pasangan Calon Ketua & Wakil Ketua</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-24">Kelas</th>
                  <th className="p-1.5 border-r border-slate-800 text-right w-32">Perolehan Suara</th>
                  <th className="p-1.5 text-right w-24">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {candidateResults.map((c) => (
                  <tr key={c.id} className="border-b border-slate-400">
                    <td className="p-1.5 border-r border-slate-800 text-center font-bold">
                      0{c.noUrut}
                    </td>
                    <td className="p-1.5 border-r border-slate-800 font-bold uppercase text-slate-950">
                      {c.nama}
                    </td>
                    <td className="p-1.5 border-r border-slate-800 text-center text-slate-700">
                      {c.kelas}
                    </td>
                    <td className="p-1.5 border-r border-slate-800 text-right font-mono font-bold">
                      {modeBeritaAcara === 'AUTO' ? `${c.suara} Suara` : '.................... Suara'}
                    </td>
                    <td className="p-1.5 text-right font-mono">
                      {modeBeritaAcara === 'AUTO' ? `${c.persentase}%` : '........... %'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
                  <td colSpan={3} className="p-1.5 text-right border-r border-slate-800">
                    TOTAL SUARA MASUK:
                  </td>
                  <td className="p-1.5 text-right font-mono">
                    {modeBeritaAcara === 'AUTO' ? `${totalMasuk} Suara` : '.................... Suara'}
                  </td>
                  <td className="p-1.5 text-right font-mono">
                    100.00%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statement of Validity & Winner */}
          <div className="text-[10px] sm:text-[11px] leading-relaxed mb-3 p-2.5 bg-slate-50 border border-slate-300 rounded-md">
            {modeBeritaAcara === 'AUTO' ? (
              <p className="text-justify">
                Berdasarkan hasil pemungutan dan penghitungan suara di atas, Pasangan Calon dengan perolehan suara terbanyak adalah:{' '}
                <strong>Nomor Urut 0{winner?.noUrut} - {winner?.nama}</strong> dengan perolehan sebanyak{' '}
                <strong>{winner?.suara} suara ({winner?.persentase}%)</strong> dan dinyatakan secara sah sebagai{' '}
                <strong>Ketua & Wakil Ketua OSIS Terpilih {sekolah.namaSekolah} Masa Bakti {pemilihan.tahunPelajaran}</strong>.
              </p>
            ) : (
              <p className="text-justify">
                Berdasarkan hasil pemungutan dan penghitungan suara di atas, Pasangan Calon dengan perolehan suara terbanyak adalah:{' '}
                <strong>Nomor Urut ......... atas nama ........................................................................................</strong> dengan perolehan sebanyak{' '}
                <strong>......................... suara (..............%)</strong> dan ditetapkan secara sah sebagai{' '}
                <strong>Ketua & Wakil Ketua OSIS Terpilih {sekolah.namaSekolah} Masa Bakti {pemilihan.tahunPelajaran}</strong>.
              </p>
            )}
            <p className="mt-1 text-justify text-slate-600">
              Demikian Berita Acara ini dibuat dengan sebenarnya dan disahkan secara resmi oleh seluruh pihak terkait tanpa adanya paksaan untuk dipergunakan sebagaimana mestinya.
            </p>
          </div>

          {/* Signatures Section: TTD HANYA KETUA OSIS, PANITIA, KEPALA SEKOLAH */}
          <div className="pt-2 border-t border-slate-300 break-inside-avoid page-break-inside-avoid text-[10px] sm:text-[11px]">
            <div className="grid grid-cols-2 gap-4 text-center">
              
              <div>
                <p className="text-slate-800 font-bold mb-0.5">Ketua OSIS,</p>
                <div className="h-14 sm:h-16 flex items-center justify-center text-slate-300 italic text-[9px]">
                  (Tanda Tangan)
                </div>
                <p className="font-bold underline uppercase text-slate-900">
                  {namaKetuaOsis.trim() || '( .................................... )'}
                </p>
              </div>

              <div>
                <p className="text-slate-800 font-bold mb-0.5">Panitia Pemilihan,</p>
                <p className="text-[9px] text-slate-500 -mt-0.5 font-medium">Ketua Panitia</p>
                <div className="h-12 sm:h-14 flex items-center justify-center text-slate-300 italic text-[9px]">
                  (Tanda Tangan & Cap)
                </div>
                <p className="font-bold underline uppercase text-slate-900">
                  {sekolah.namaKetuaPanitia || '( .................................... )'}
                </p>
              </div>

              <div className="col-span-2 text-center mt-2 pt-2 border-t border-slate-200">
                <p className="text-slate-600">Mengetahui & Mengesahkan,</p>
                <p className="font-bold text-slate-900 text-xs">Kepala {sekolah.namaSekolah}</p>
                <div className="h-12 sm:h-14 flex items-center justify-center text-slate-300 italic text-[9px]">
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

      </div>
    </div>,
    document.body
  );
};
