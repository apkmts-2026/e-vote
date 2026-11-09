import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { Calon, Pemilih, Suara, PengaturanSekolah, PengaturanPemilihan } from '../../types';

interface BeritaAcaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  calonList: Calon[];
  pemilihList: Pemilih[];
  suaraList: Suara[];
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  isOpen,
  onClose,
  sekolah,
  pemilihan,
  calonList,
  pemilihList,
  suaraList,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-print-modal');
      return () => {
        document.body.classList.remove('has-print-modal');
      };
    }
  }, [isOpen]);

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

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return createPortal(
    <div
      id="berita-acara-portal"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 my-4 max-h-[95vh] flex flex-col print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-h-none print:overflow-visible print:w-full print:max-w-none">
        
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-lg">
              Pratinjau Dokumen Resmi & Cetak Berita Acara
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-xl text-sm font-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div id="print-area" className="flex-1 overflow-y-auto p-4 sm:p-8 border border-slate-200 rounded-2xl bg-white text-slate-900 font-serif print:border-none print:p-0 print:m-0 print:overflow-visible print:max-h-none print:w-full">
          
          {/* Kop Surat Sekolah */}
          <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-4 mb-6">
            {sekolah.logo && (
              <img
                src={sekolah.logo}
                alt="Logo Sekolah"
                className="w-20 h-20 object-contain shrink-0"
              />
            )}
            <div className="flex-1 text-center font-sans">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                PANITIA PEMILIHAN KETUA & WAKIL KETUA OSIS
              </h2>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 uppercase">
                {sekolah.namaSekolah}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                NPSN: {sekolah.npsn} • NSM: {sekolah.nsm} • Alamat: {sekolah.alamat}
              </p>
              <p className="text-xs text-slate-600">
                Telepon: {sekolah.telepon} • Email: {sekolah.email}
              </p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg sm:text-xl font-bold uppercase underline tracking-wider font-sans">
              BERITA ACARA HASIL PEMUNGUTAN DAN PENGHITUNGAN SUARA
            </h1>
            <p className="text-xs sm:text-sm font-sans text-slate-600 mt-1">
              Nomor: 004/PAN-PILKETOS/{pemilihan.tahunPelajaran.replace('/', '-')}/X/2026
            </p>
          </div>

          {/* Document Body Intro */}
          <div className="text-xs sm:text-sm leading-relaxed mb-6 font-sans">
            <p className="mb-2">
              Pada hari ini, <strong>{formattedDate}</strong>, bertempat di <strong>{sekolah.namaSekolah}</strong>,
              telah dilaksanakan proses pemungutan dan penghitungan suara secara digital dalam rangka:{' '}
              <strong>{pemilihan.namaKegiatan} Masa Bakti {pemilihan.tahunPelajaran}</strong>.
            </p>
            <p>
              Berdasarkan rekapitulasi data dari Sistem Kotak Suara Digital (E-Pemilihan OSIS), diperoleh rincian pelaksanaan sebagai berikut:
            </p>
          </div>

          {/* Table 1: Rekapitulasi Pemilih & Suara */}
          <div className="mb-6 font-sans">
            <h4 className="font-bold text-xs sm:text-sm uppercase mb-2 bg-slate-100 p-2 rounded border border-slate-300">
              I. DATA REKAPITULASI PEMILIH DAN SUARA
            </h4>
            <table className="w-full text-xs sm:text-sm border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-semibold w-12 text-center border-r border-slate-300">1</td>
                  <td className="p-2 border-r border-slate-300">Jumlah Pemilih Terdaftar dalam DPT</td>
                  <td className="p-2 font-bold font-mono text-right w-32">{totalDPT} Siswa</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-semibold text-center border-r border-slate-300">2</td>
                  <td className="p-2 border-r border-slate-300">Jumlah Pemilih yang Menggunakan Hak Pilih (Suara Masuk)</td>
                  <td className="p-2 font-bold font-mono text-right">{totalMasuk} Suara</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-semibold text-center border-r border-slate-300">3</td>
                  <td className="p-2 border-r border-slate-300">Jumlah Pemilih yang Tidak Menggunakan Hak Pilih (Golput)</td>
                  <td className="p-2 font-bold font-mono text-right">{belumMemilih} Siswa</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-semibold text-center border-r border-slate-300">4</td>
                  <td className="p-2 border-r border-slate-300">Jumlah Suara SAH</td>
                  <td className="p-2 font-bold font-mono text-right">{totalSah} Suara</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-semibold text-center border-r border-slate-300">5</td>
                  <td className="p-2 border-r border-slate-300">Jumlah Suara TIDAK SAH</td>
                  <td className="p-2 font-bold font-mono text-right">{totalTidakSah} Suara</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2 text-center border-r border-slate-300">6</td>
                  <td className="p-2 border-r border-slate-300">Persentase Partisipasi Pemilih</td>
                  <td className="p-2 font-mono text-right text-emerald-700">{partisipasi}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Rincian Perolehan Calon */}
          <div className="mb-6 font-sans">
            <h4 className="font-bold text-xs sm:text-sm uppercase mb-2 bg-slate-100 p-2 rounded border border-slate-300">
              II. RINCIAN PEROLEHAN SUARA MASING-MASING PASANGAN CALON
            </h4>
            <table className="w-full text-xs sm:text-sm border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                  <th className="p-2 border-r border-slate-300 text-center w-16">No. Urut</th>
                  <th className="p-2 border-r border-slate-300 text-left">Nama Pasangan Calon</th>
                  <th className="p-2 border-r border-slate-300 text-center w-28">Kelas</th>
                  <th className="p-2 border-r border-slate-300 text-right w-28">Perolehan Suara</th>
                  <th className="p-2 text-right w-28">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {candidateResults.map((c) => (
                  <tr key={c.id} className="border-b border-slate-300">
                    <td className="p-2 border-r border-slate-300 text-center font-bold">0{c.noUrut}</td>
                    <td className="p-2 border-r border-slate-300 font-semibold">{c.nama}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{c.kelas}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{c.suara}</td>
                    <td className="p-2 text-right font-mono">{c.persentase}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t border-slate-400">
                  <td colSpan={3} className="p-2 text-right border-r border-slate-300">TOTAL SUARA MASUK:</td>
                  <td className="p-2 text-right font-mono">{totalMasuk}</td>
                  <td className="p-2 text-right font-mono">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statement of Validity & Winner */}
          <div className="text-xs sm:text-sm leading-relaxed mb-8 font-sans p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p>
              Berdasarkan hasil penghitungan di atas, Pasangan Calon dengan perolehan suara terbanyak adalah:{' '}
              <strong>Nomor Urut 0{winner?.noUrut} - {winner?.nama}</strong> dengan perolehan <strong>{winner?.suara} suara ({winner?.persentase}%)</strong> dan dinyatakan sebagai <strong>Ketua & Wakil Ketua OSIS Terpilih {sekolah.namaSekolah} Masa Bakti {pemilihan.tahunPelajaran}</strong>.
            </p>
            <p className="mt-1">
              Demikian Berita Acara ini dibuat dengan sebenarnya dan disahkan secara digital tanpa adanya paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.
            </p>
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-8 text-xs sm:text-sm font-sans pt-4 border-t border-slate-200">
            
            <div className="text-center">
              <p className="text-slate-500 mb-1">Mengetahui,</p>
              <p className="font-bold">Pembina OSIS</p>
              <div className="h-20 flex items-center justify-center text-slate-300 italic">
                (Tanda Tangan & Cap)
              </div>
              <p className="font-bold underline uppercase">{sekolah.namaPembinaOsis}</p>
            </div>

            <div className="text-center">
              <p className="text-slate-500 mb-1">Disahkan di Bojonegoro,</p>
              <p className="font-bold">Ketua Panitia Pemilihan</p>
              <div className="h-20 flex items-center justify-center text-slate-300 italic">
                (Tanda Tangan & Cap)
              </div>
              <p className="font-bold underline uppercase">{sekolah.namaKetuaPanitia}</p>
            </div>

            <div className="col-span-2 text-center mt-4">
              <p className="font-bold">Menyetujui & Mengesahkan,</p>
              <p className="font-bold">Kepala {sekolah.namaSekolah}</p>
              <div className="h-20 flex items-center justify-center text-slate-300 italic">
                (Tanda Tangan & Cap Dinas)
              </div>
              <p className="font-bold underline uppercase">{sekolah.namaKepalaSekolah}</p>
              <p className="text-xs text-slate-600">NIP: {sekolah.nipKepalaSekolah}</p>
            </div>

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
