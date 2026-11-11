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

export type StatusJadwalBilik =
  | 'AKTIF'
  | 'BELUM_WAKTUNYA_TANGGAL'
  | 'MELEBIHI_WAKTU_TANGGAL'
  | 'BELUM_WAKTUNYA_JAM'
  | 'MELEBIHI_WAKTU_JAM'
  | 'STATUS_BELUM_DIMULAI'
  | 'STATUS_SELESAI';

export interface ValidasiJadwalResult {
  bisaMasuk: boolean;
  status: StatusJadwalBilik;
  judul: string;
  pesan: string;
  hariPelaksanaan: string;
  tanggalPelaksanaanFormatted: string;
  waktuMulai: string;
  waktuSelesai: string;
  waktuSekarangStr: string;
  tanggalSekarangFormatted: string;
}

/**
 * Validates whether the Digital Voting Booth (Bilik Suara) is currently accessible
 * based on the configured election date (hari & tanggal) and hours (waktuMulai & waktuSelesai).
 */
export function validasiJadwalBilik(
  pemilihan: {
    tanggalPemilihan: string;
    hariPemilihan?: string;
    waktuMulai: string;
    waktuSelesai: string;
    status: string;
  },
  customNow?: Date
): ValidasiJadwalResult {
  const now = customNow || new Date();
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowDay = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${nowYear}-${nowMonth}-${nowDay}`;

  const nowHours = String(now.getHours()).padStart(2, '0');
  const nowMinutes = String(now.getMinutes()).padStart(2, '0');
  const waktuSekarangStr = `${nowHours}:${nowMinutes}`;

  const targetDateStr = (pemilihan.tanggalPemilihan || '').trim();
  const hariPelaksanaan =
    pemilihan.hariPemilihan?.trim() || getNamaHariFromDate(targetDateStr);
  const tanggalPelaksanaanFormatted = formatTanggalIndonesia(targetDateStr, hariPelaksanaan);
  const tanggalSekarangFormatted = formatTanggalIndonesia(todayDateStr);

  const waktuMulai = (pemilihan.waktuMulai || '07:30').trim();
  const waktuSelesai = (pemilihan.waktuSelesai || '13:00').trim();

  // 1. Cek jika pemilihan sudah resmi diselesaikan oleh Panitia
  if (pemilihan.status === 'SELESAI') {
    return {
      bisaMasuk: false,
      status: 'STATUS_SELESAI',
      judul: 'Pemilihan Telah Ditutup',
      pesan: `Pemungutan suara telah resmi diselesaikan dan ditutup oleh Panitia Pemilihan. Bilik suara tidak lagi menerima suara baru.`,
      hariPelaksanaan,
      tanggalPelaksanaanFormatted,
      waktuMulai,
      waktuSelesai,
      waktuSekarangStr,
      tanggalSekarangFormatted,
    };
  }

  // 2. Cek tanggal pelaksanaan jika diatur
  if (targetDateStr) {
    // 2a. Hari ini belum mencapai tanggal pemilihan (Belum waktunya)
    if (todayDateStr < targetDateStr) {
      return {
        bisaMasuk: false,
        status: 'BELUM_WAKTUNYA_TANGGAL',
        judul: 'Akses Bilik Suara Belum Dibuka',
        pesan: `Akses bilik suara digital belum dibuka karena belum memasuki tanggal pelaksanaan. Pemilihan dijadwalkan pada ${tanggalPelaksanaanFormatted} pukul ${waktuMulai} - ${waktuSelesai} WIB.`,
        hariPelaksanaan,
        tanggalPelaksanaanFormatted,
        waktuMulai,
        waktuSelesai,
        waktuSekarangStr,
        tanggalSekarangFormatted,
      };
    }

    // 2b. Hari ini sudah melewati tanggal pemilihan (Melebihi waktu)
    if (todayDateStr > targetDateStr) {
      return {
        bisaMasuk: false,
        status: 'MELEBIHI_WAKTU_TANGGAL',
        judul: 'Jadwal Pemilihan Telah Berakhir',
        pesan: `Akses bilik suara digital telah berakhir dan ditutup. Tanggal pelaksanaan (${tanggalPelaksanaanFormatted}) telah terlewat.`,
        hariPelaksanaan,
        tanggalPelaksanaanFormatted,
        waktuMulai,
        waktuSelesai,
        waktuSekarangStr,
        tanggalSekarangFormatted,
      };
    }

    // 2c. Hari ini tepat pada tanggal pemilihan (todayDateStr === targetDateStr)
    // Cek jam mulai
    if (waktuMulai && waktuSekarangStr < waktuMulai) {
      return {
        bisaMasuk: false,
        status: 'BELUM_WAKTUNYA_JAM',
        judul: 'Bilik Suara Belum Dibuka',
        pesan: `Pemungutan suara hari ini (${tanggalPelaksanaanFormatted}) belum dibuka. Bilik suara baru dapat diakses mulai pukul ${waktuMulai} WIB (Waktu saat ini: ${waktuSekarangStr} WIB).`,
        hariPelaksanaan,
        tanggalPelaksanaanFormatted,
        waktuMulai,
        waktuSelesai,
        waktuSekarangStr,
        tanggalSekarangFormatted,
      };
    }

    // Cek jam selesai
    if (waktuSelesai && waktuSekarangStr > waktuSelesai) {
      return {
        bisaMasuk: false,
        status: 'MELEBIHI_WAKTU_JAM',
        judul: 'Waktu Pemilihan Telah Berakhir',
        pesan: `Akses bilik suara digital telah berakhir dan ditutup sejak pukul ${waktuSelesai} WIB (Waktu saat ini: ${waktuSekarangStr} WIB). Anda sudah tidak dapat memberikan suara.`,
        hariPelaksanaan,
        tanggalPelaksanaanFormatted,
        waktuMulai,
        waktuSelesai,
        waktuSekarangStr,
        tanggalSekarangFormatted,
      };
    }
  }

  // 3. Cek jika status masih BELUM_DIMULAI oleh admin
  if (pemilihan.status === 'BELUM_DIMULAI') {
    return {
      bisaMasuk: false,
      status: 'STATUS_BELUM_DIMULAI',
      judul: 'Bilik Suara Belum Dibuka',
      pesan: `Akses bilik suara digital saat ini berstatus BELUM DIMULAI oleh Panitia Pemilihan. Silakan menunggu panitia membuka sesi pemilihan resmi.`,
      hariPelaksanaan,
      tanggalPelaksanaanFormatted,
      waktuMulai,
      waktuSelesai,
      waktuSekarangStr,
      tanggalSekarangFormatted,
    };
  }

  // 4. Semua validasi lolos: status aktif dan waktu sesuai
  return {
    bisaMasuk: true,
    status: 'AKTIF',
    judul: 'Bilik Suara Aktif',
    pesan: `Bilik suara digital sedang dibuka dan aktif sampai pukul ${waktuSelesai} WIB. Silakan gunakan hak pilih Anda dengan tertib.`,
    hariPelaksanaan,
    tanggalPelaksanaanFormatted,
    waktuMulai,
    waktuSelesai,
    waktuSekarangStr,
    tanggalSekarangFormatted,
  };
}
