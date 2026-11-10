/**
 * Indonesian Date & Day Formatting Utilities
 * Standardized across Election settings, Berita Acara, and Absensi
 */

export const DAFTAR_HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

export const DAFTAR_BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/**
 * Derives the Indonesian day name ('Senin', 'Selasa', dll.) from a YYYY-MM-DD string
 * Uses local date constructor to avoid UTC timezone offset shifts.
 */
export function getNamaHariFromDate(dateStr: string): string {
  if (!dateStr) return 'Sabtu';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'Sabtu';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Sabtu';
  const d = new Date(year, month, day);
  return DAFTAR_HARI_INDONESIA[d.getDay()] || 'Sabtu';
}

/**
 * Formats a YYYY-MM-DD date string with its Day of the Week according to election settings.
 * Example: "Sabtu, 3 Oktober 2026"
 */
export function formatTanggalIndonesia(dateStr: string, customDay?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const d = new Date(year, month, day);
  const namaHari = customDay?.trim() || DAFTAR_HARI_INDONESIA[d.getDay()] || 'Sabtu';
  const namaBulan = DAFTAR_BULAN_INDONESIA[month] || '';

  return `${namaHari}, ${day} ${namaBulan} ${year}`;
}

/**
 * Formats date only without day name, e.g. "3 Oktober 2026"
 */
export function formatTanggalSaja(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const namaBulan = DAFTAR_BULAN_INDONESIA[month] || '';
  return `${day} ${namaBulan} ${year}`;
}
