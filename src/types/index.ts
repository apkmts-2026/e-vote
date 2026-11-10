export type ElectionStatus = 'BELUM_DIMULAI' | 'SEDANG_BERLANGSUNG' | 'SELESAI';

export interface Calon {
  id: string; // Unique ID (UUID/timestamp)
  noUrut: number;
  nama: string;
  kelas: string;
  foto: string; // Base64 or URL
  visi: string;
  misi: string[];
  aktif: boolean;
  tagline?: string;
}

export interface Pemilih {
  id: string;
  nisNisn: string;
  nama: string;
  kelas: string;
  kodePemilih: string; // Unique voter token/PIN
  statusMemilih: boolean;
  waktuMemilih?: string; // ISO string
}

export interface Suara {
  id: string; // Unique vote UUID
  idPemilih: string; // anonymous hash or voter ID
  idCalon: string;
  waktuSuara: string;
  status: 'SAH' | 'TIDAK_SAH';
}

export interface AuditLogItem {
  id: string;
  waktu: string;
  user: string;
  aktivitas: string;
  keterangan: string;
}

export interface PengaturanSekolah {
  namaSekolah: string;
  npsn: string;
  nsm: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  logo: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaKetuaPanitia: string;
  namaPembinaOsis: string;
  namaKetuaOsis?: string;
}

export interface PengaturanPemilihan {
  namaKegiatan: string;
  tahunPelajaran: string;
  periode: string;
  tanggalPemilihan: string;
  hariPemilihan?: string; // Hari pelaksanaan, contoh: 'Sabtu', 'Senin'
  waktuMulai: string; // HH:mm
  waktuSelesai: string; // HH:mm
  status: ElectionStatus;
  hasilTerbukaUntukAdmin: boolean; // "Lihat Suara" pressed by admin
  hasilDitampilkanKePenonton: boolean; // Broadcast results to penonton
  warnaTema: 'merah' | 'biru' | 'hijau' | 'indigo';
  gasWebhookUrl?: string; // Google Apps Script web app URL for cloud sync
}

export interface AdminUser {
  id: string;
  username: string;
  nama: string;
  role: 'SUPER_ADMIN' | 'PANITIA';
  passwordHash: string; // Simulated secure hash or simple stored
  terakhirLogin?: string;
}
