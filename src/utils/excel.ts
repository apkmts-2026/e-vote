import * as XLSX from 'xlsx';
import { Calon, Pemilih, Suara, PengaturanSekolah, PengaturanPemilihan } from '../types';

/**
 * Download sample Excel template for importing voters
 */
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      'NIS / NISN': '0081234001',
      'NAMA LENGKAP': 'Ahmad Fauzan',
      'KELAS': 'VII-A',
      'KODE PEMILIH': 'OSIS-7A01',
    },
    {
      'NIS / NISN': '0081234002',
      'NAMA LENGKAP': 'Bella Anggraini',
      'KELAS': 'VII-A',
      'KODE PEMILIH': 'OSIS-7A02',
    },
    {
      'NIS / NISN': '0071234003',
      'NAMA LENGKAP': 'Cahya Ramadhan',
      'KELAS': 'VIII-B',
      'KODE PEMILIH': 'OSIS-8B01',
    },
    {
      'NIS / NISN': '0061234004',
      'NAMA LENGKAP': 'Dian Safitri',
      'KELAS': 'IX-C',
      'KODE PEMILIH': 'OSIS-9C01',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Pemilih');
  XLSX.writeFile(workbook, 'Template_Data_Pemilih_OSIS.xlsx');
}

/**
 * Parse an Excel or CSV file from input element
 */
export async function parseExcelPemilih(file: File): Promise<Omit<Pemilih, 'id' | 'statusMemilih' | 'waktuMemilih'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsed: Omit<Pemilih, 'id' | 'statusMemilih' | 'waktuMemilih'>[] = [];

        rawJson.forEach((row, index) => {
          // Normalize column keys
          const keys = Object.keys(row);
          const nisKey = keys.find((k) => /nis|nisn|nomor_induk/i.test(k));
          const namaKey = keys.find((k) => /nama|siswa|pemilih/i.test(k));
          const kelasKey = keys.find((k) => /kelas|rombel/i.test(k));
          const kodeKey = keys.find((k) => /kode|token|pin|password/i.test(k));

          const nisNisn = String(nisKey ? row[nisKey] : '').trim();
          const nama = String(namaKey ? row[namaKey] : '').trim();
          const kelas = String(kelasKey ? row[kelasKey] : 'Umum').trim();
          let kodePemilih = String(kodeKey ? row[kodeKey] : '').trim();

          // If valid voter row
          if (nama) {
            if (!kodePemilih) {
              // Generate token if empty: random 6 alphanumeric
              kodePemilih = (nisNisn || `VOTE${index + 1}`).substring(0, 6) + Math.random().toString(36).substring(2, 5).toUpperCase();
            }
            parsed.push({
              nisNisn: nisNisn || `NIS-${Date.now().toString().slice(-5)}-${index + 1}`,
              nama,
              kelas: kelas || 'Umum',
              kodePemilih: kodePemilih.toUpperCase(),
            });
          }
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

/**
 * Export current voter list to Excel
 */
export function exportPemilihToExcel(pemilihList: Pemilih[], schoolName: string): void {
  const data = pemilihList.map((p, idx) => ({
    'No': idx + 1,
    'NIS / NISN': p.nisNisn,
    'Nama Lengkap': p.nama,
    'Kelas': p.kelas,
    'Kode Pemilih': p.kodePemilih,
    'Status Memilih': p.statusMemilih ? 'SUDAH MEMILIH' : 'BELUM MEMILIH',
    'Waktu Memilih': p.waktuMemilih ? new Date(p.waktuMemilih).toLocaleString('id-ID') : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Pemilih');
  const safeSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `Daftar_Pemilih_OSIS_${safeSchool}.xlsx`);
}

/**
 * Export Election Result Summary to Excel
 */
export function exportHasilToExcel(
  calonList: Calon[],
  suaraList: Suara[],
  pemilihList: Pemilih[],
  sekolah: PengaturanSekolah,
  pemilihan: PengaturanPemilihan
): void {
  const totalDPT = pemilihList.length;
  const totalMasuk = suaraList.length;
  const partisipasi = totalDPT > 0 ? ((totalMasuk / totalDPT) * 100).toFixed(2) + '%' : '0%';

  // Summary Rows
  const ringkasan = [
    { 'Keterangan': 'Nama Sekolah', 'Nilai': sekolah.namaSekolah },
    { 'Keterangan': 'Kegiatan', 'Nilai': pemilihan.namaKegiatan },
    { 'Keterangan': 'Tahun Pelajaran', 'Nilai': pemilihan.tahunPelajaran },
    { 'Keterangan': 'Tanggal Pelaksanaan', 'Nilai': pemilihan.tanggalPemilihan },
    { 'Keterangan': 'Jumlah Pemilih Terdaftar (DPT)', 'Nilai': totalDPT },
    { 'Keterangan': 'Jumlah Suara Masuk', 'Nilai': totalMasuk },
    { 'Keterangan': 'Jumlah Pemilih Belum Memilih', 'Nilai': totalDPT - totalMasuk },
    { 'Keterangan': 'Tingkat Partisipasi', 'Nilai': partisipasi },
  ];

  // Candidates Result Rows
  const hasilCalon = calonList.map((c) => {
    const votes = suaraList.filter((s) => s.idCalon === c.id).length;
    const pct = totalMasuk > 0 ? ((votes / totalMasuk) * 100).toFixed(2) + '%' : '0%';
    return {
      'Nomor Urut': `0${c.noUrut}`,
      'Nama Calon': c.nama,
      'Kelas': c.kelas,
      'Perolehan Suara': votes,
      'Persentase Suara': pct,
      'Status Calon': c.aktif ? 'Aktif' : 'Non-aktif',
    };
  });

  const workbook = XLSX.utils.book_new();

  const wsRingkasan = XLSX.utils.json_to_sheet(ringkasan);
  wsRingkasan['!cols'] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, wsRingkasan, 'Ringkasan');

  const wsHasil = XLSX.utils.json_to_sheet(hasilCalon);
  wsHasil['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(workbook, wsHasil, 'Perolehan_Suara');

  XLSX.writeFile(workbook, `Hasil_Pemilihan_OSIS_${pemilihan.tahunPelajaran.replace('/', '-')}.xlsx`);
}
