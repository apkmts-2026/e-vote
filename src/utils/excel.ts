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

export interface ParsedPemilihRow {
  nisNisn: string;
  nama: string;
  kelas: string;
  kodePemilih: string;
  sourceSheet: string;
  sourceRowNumber: number;
}

export interface IgnoredRowDetail {
  sheetName: string;
  rowNumber: number;
  contentSnippet: string;
  reason: string;
}

export interface ParseExcelResult {
  success: boolean;
  totalStudentsFound: number;
  validPemilih: ParsedPemilihRow[];
  ignoredRows: IgnoredRowDetail[];
  sheetsDetected: { sheetName: string; rowCount: number; studentCount: number }[];
  duplicateNisInFile: { nis: string; nama: string; row: number }[];
}

/**
 * Generate a guaranteed unique voter PIN token within the current import batch
 */
function generateUniqueToken(existingTokens: Set<string>, kelas: string, index: number): string {
  const cleanKelas = (kelas || 'OSIS').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0, 1, I, O
  let token = '';
  let attempts = 0;

  do {
    let rand = '';
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    token = `${cleanKelas}-${rand}`;
    attempts++;
  } while (existingTokens.has(token) && attempts < 100);

  existingTokens.add(token);
  return token;
}

/**
 * Deep multi-sheet and smart-header parser for Excel/CSV voter files
 */
export async function parseExcelPemilihDetailed(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        const validPemilih: ParsedPemilihRow[] = [];
        const ignoredRows: IgnoredRowDetail[] = [];
        const sheetsDetected: { sheetName: string; rowCount: number; studentCount: number }[] = [];
        const duplicateNisInFile: { nis: string; nama: string; row: number }[] = [];

        const seenTokens = new Set<string>();
        const seenNis = new Map<string, number>();

        // Loop over EVERY sheet in the workbook
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet || !worksheet['!ref']) continue;

          // Convert sheet to 2D array of rows
          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
          });

          if (rawRows.length === 0) continue;

          let sheetStudentCount = 0;
          let currentSectionClass = '';

          // Derive default class from sheet name if sheet is named e.g. "Kelas 7", "VII-A", "Kelas VIII"
          const sheetClassMatch = sheetName.match(/(?:kelas\s*)?([0-9]+|[IVXLCDM]+(?:\s*[-_ ]\s*[A-Za-z0-9]+)?)/i);
          const defaultSheetClass = sheetClassMatch ? sheetClassMatch[0].trim() : '';

          // 1. Locate the real table header row dynamically
          let headerRowIdx = -1;
          let namaColIdx = -1;
          let nisColIdx = -1;
          let kelasColIdx = -1;
          let kodeColIdx = -1;

          // Search first 20 rows for header keywords
          for (let r = 0; r < Math.min(25, rawRows.length); r++) {
            const row = rawRows[r] || [];
            let hasNama = false;
            let tempNama = -1;
            let tempNis = -1;
            let tempKelas = -1;
            let tempKode = -1;

            row.forEach((cellVal: any, cIdx: number) => {
              const str = String(cellVal).trim();
              if (!str) return;

              // Check for Name column
              if (/^(nama|nama\s*lengkap|nama\s*siswa|nama\s*peserta|peserta\s*didik|nama\s*santri|nama\s*murid|name)$/i.test(str)) {
                hasNama = true;
                tempNama = cIdx;
              } else if (/nama|siswa|peserta.*didik/i.test(str) && tempNama === -1) {
                hasNama = true;
                tempNama = cIdx;
              }

              // Check for NIS / NISN column
              if (/^(nis|nisn|no\.?\s*induk|nomor\s*induk|no\.?\s*peserta|nik|id\s*siswa)$/i.test(str)) {
                tempNis = cIdx;
              } else if (/nis|nisn|nomor_induk/i.test(str) && tempNis === -1) {
                tempNis = cIdx;
              }

              // Check for Kelas / Rombel column
              if (/^(kelas|rombel|tingkat|jurusan|kls)$/i.test(str)) {
                tempKelas = cIdx;
              } else if (/kelas|rombel/i.test(str) && tempKelas === -1) {
                tempKelas = cIdx;
              }

              // Check for Token / PIN / Kode column
              if (/^(kode|token|pin|password|sandi|kode\s*pemilih)$/i.test(str)) {
                tempKode = cIdx;
              } else if (/kode|token|pin/i.test(str) && tempKode === -1) {
                tempKode = cIdx;
              }
            });

            if (hasNama) {
              headerRowIdx = r;
              namaColIdx = tempNama;
              nisColIdx = tempNis;
              kelasColIdx = tempKelas;
              kodeColIdx = tempKode;
              break;
            }
          }

          // Fallback if no explicit header row: heuristic column scanning
          if (namaColIdx === -1) {
            // Find column with most textual names
            let bestNameCol = -1;
            let bestNameCount = 0;

            for (let c = 0; c < 10; c++) {
              let nameCount = 0;
              for (let r = 0; r < rawRows.length; r++) {
                const cell = String(rawRows[r]?.[c] || '').trim();
                // Names usually contain alphabetic characters and are 3-40 chars long without digits
                if (cell.length >= 3 && cell.length <= 40 && /^[a-zA-Z\s'.]+$/.test(cell) && !/^(no|nomor|nis|kelas|laki|perempuan)$/i.test(cell)) {
                  nameCount++;
                }
              }
              if (nameCount > bestNameCount) {
                bestNameCount = nameCount;
                bestNameCol = c;
              }
            }

            if (bestNameCol !== -1 && bestNameCount >= 2) {
              namaColIdx = bestNameCol;
              headerRowIdx = 0; // assume starts near top
              // Try to find NIS column near it
              for (let c = 0; c < 10; c++) {
                if (c === namaColIdx) continue;
                let digitCount = 0;
                for (let r = 0; r < rawRows.length; r++) {
                  const cell = String(rawRows[r]?.[c] || '').trim();
                  if (/^\d{4,16}$/.test(cell)) digitCount++;
                }
                if (digitCount >= 2 && nisColIdx === -1) {
                  nisColIdx = c;
                }
              }
            }
          }

          // If this sheet has no identifiable student names, log and continue to next sheet
          if (namaColIdx === -1) {
            ignoredRows.push({
              sheetName,
              rowNumber: 1,
              contentSnippet: rawRows[0]?.join(', ') || '(sheet kosong)',
              reason: 'Kolom nama siswa tidak terdeteksi pada sheet ini',
            });
            sheetsDetected.push({
              sheetName,
              rowCount: rawRows.length,
              studentCount: 0,
            });
            continue;
          }

          // 2. Iterate data rows after the header
          const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

          for (let r = startRow; r < rawRows.length; r++) {
            const row = rawRows[r] || [];
            const rowNum = r + 1; // 1-indexed for user display

            // Check if entire row is empty
            const nonBlankCells = row.filter((c: any) => String(c).trim() !== '');
            if (nonBlankCells.length === 0) {
              continue;
            }

            const rawName = String(row[namaColIdx] || '').trim();

            // Check if this row is a Section Header within the sheet (e.g. "KELAS 8-B" or "DAFTAR SISWA...")
            if (!rawName || /^(daftar|rekap|total|jumlah|catatan|kelas|mengetahui|panitia|wali)/i.test(rawName)) {
              const fullRowText = nonBlankCells.join(' ');
              
              // Check if it indicates a class transition
              const classMatch = fullRowText.match(/(?:kelas\s*)?([0-9]+|[IVXLCDM]+(?:\s*[-_ ]\s*[A-Za-z0-9]+)?)/i);
              if (classMatch && /kelas|rombel/i.test(fullRowText)) {
                currentSectionClass = classMatch[0].trim();
              }

              // Check if it's a repeated subheader row
              if (/^(no|nomor|nis|nisn|nama)/i.test(rawName) || /nama\s*siswa/i.test(fullRowText)) {
                ignoredRows.push({
                  sheetName,
                  rowNumber: rowNum,
                  contentSnippet: fullRowText.slice(0, 50),
                  reason: 'Baris judul kolom tabel berulang (diabaikan secara otomatis)',
                });
                continue;
              }

              // Check if it's a footer/recap row
              if (/^(jumlah|total|rekapitulasi|laki|perempuan|kepala|mengetahui)/i.test(fullRowText)) {
                ignoredRows.push({
                  sheetName,
                  rowNumber: rowNum,
                  contentSnippet: fullRowText.slice(0, 50),
                  reason: 'Baris ringkasan / tanda tangan penutup (diabaikan)',
                });
                continue;
              }

              // Name truly missing
              if (!rawName) {
                ignoredRows.push({
                  sheetName,
                  rowNumber: rowNum,
                  contentSnippet: fullRowText.slice(0, 50),
                  reason: 'Kolom Nama Siswa kosong',
                });
                continue;
              }
            }

            // Clean student name
            const nama = rawName
              .replace(/\s+/g, ' ')
              .replace(/^[0-9.\-\s]+/, '') // strip leading numbers if user typed "1. Ahmad"
              .trim();

            if (nama.length < 2) {
              ignoredRows.push({
                sheetName,
                rowNumber: rowNum,
                contentSnippet: rawName,
                reason: 'Nama siswa terlalu pendek / tidak valid',
              });
              continue;
            }

            // Extract NIS / NISN
            let nis = nisColIdx !== -1 ? String(row[nisColIdx] || '').trim() : '';
            // Strip decimals if Excel converted number to float e.g. "12345.0"
            nis = nis.replace(/\.0$/, '');

            if (!nis) {
              // Generate fallback NIS
              nis = `DPT-${String(validPemilih.length + 1).padStart(4, '0')}`;
            }

            // Check duplicate NIS within the imported file itself
            if (seenNis.has(nis)) {
              duplicateNisInFile.push({
                nis,
                nama,
                row: rowNum,
              });
            } else {
              seenNis.set(nis, rowNum);
            }

            // Extract Kelas
            let kelas = kelasColIdx !== -1 ? String(row[kelasColIdx] || '').trim() : '';
            if (!kelas) {
              kelas = currentSectionClass || defaultSheetClass || 'Umum';
            }

            // Extract or Generate unique PIN Token
            let token = kodeColIdx !== -1 ? String(row[kodeColIdx] || '').trim().toUpperCase() : '';
            if (!token || seenTokens.has(token)) {
              token = generateUniqueToken(seenTokens, kelas, validPemilih.length);
            } else {
              seenTokens.add(token);
            }

            validPemilih.push({
              nisNisn: nis,
              nama,
              kelas,
              kodePemilih: token,
              sourceSheet: sheetName,
              sourceRowNumber: rowNum,
            });

            sheetStudentCount++;
          }

          sheetsDetected.push({
            sheetName,
            rowCount: rawRows.length,
            studentCount: sheetStudentCount,
          });
        }

        resolve({
          success: validPemilih.length > 0,
          totalStudentsFound: validPemilih.length,
          validPemilih,
          ignoredRows,
          sheetsDetected,
          duplicateNisInFile,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

/**
 * Backward compatible parser returning standard Pemilih array
 */
export async function parseExcelPemilih(file: File): Promise<Omit<Pemilih, 'id' | 'statusMemilih' | 'waktuMemilih'>[]> {
  const result = await parseExcelPemilihDetailed(file);
  return result.validPemilih.map((p: ParsedPemilihRow) => ({
    nisNisn: p.nisNisn,
    nama: p.nama,
    kelas: p.kelas,
    kodePemilih: p.kodePemilih,
  }));
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
