import {
  Calon,
  Pemilih,
  Suara,
  AuditLogItem,
  PengaturanSekolah,
  PengaturanPemilihan,
  AdminUser,
} from '../types';

const STORAGE_KEYS = {
  CALON: 'e_osis_calon_v1',
  PEMILIH: 'e_osis_pemilih_v1',
  SUARA: 'e_osis_suara_v1',
  PENGATURAN_SEKOLAH: 'e_osis_pengaturan_sekolah_v1',
  PENGATURAN_PEMILIHAN: 'e_osis_pengaturan_pemilihan_v1',
  AUDIT_LOG: 'e_osis_audit_log_v1',
  ADMIN_USERS: 'e_osis_admin_users_v1',
  ACTIVE_ADMIN_SESSION: 'e_osis_active_admin_session_v1',
};

// Initial default school data
export const DEFAULT_PENGATURAN_SEKOLAH: PengaturanSekolah = {
  namaSekolah: 'MTs MAKARIMUL AKHLAQ',
  npsn: '20582910',
  nsm: '121235150001',
  alamat: 'Jl. KH. Hasyim Asy\'ari No. 45, Sumberrejo, Bojonegoro, Jawa Timur',
  telepon: '(0353) 887654',
  email: 'info@mtsmakarimulakhlaq.sch.id',
  website: 'https://mtsmakarimulakhlaq.sch.id',
  logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80',
  namaKepalaSekolah: 'Drs. H. Miftahul Huda, M.Pd.I',
  nipKepalaSekolah: '19750812 200501 1 003',
  namaKetuaPanitia: 'Ahmad Raihan Pratama (Ketua MPK)',
  namaPembinaOsis: 'Ust. Nur Cahyono, S.Pd',
};

export const DEFAULT_PENGATURAN_PEMILIHAN: PengaturanPemilihan = {
  namaKegiatan: 'PEMILIHAN KETUA & WAKIL KETUA OSIS',
  tahunPelajaran: '2026/2027',
  periode: 'Masa Bakti 2026/2027',
  tanggalPemilihan: '2026-10-03',
  waktuMulai: '07:30',
  waktuSelesai: '13:00',
  status: 'SEDANG_BERLANGSUNG',
  hasilTerbukaUntukAdmin: false,
  hasilDitampilkanKePenonton: false,
  warnaTema: 'merah',
  gasWebhookUrl: '',
};

export const DEFAULT_CALON: Calon[] = [
  {
    id: 'calon-01',
    noUrut: 1,
    nama: 'Ahmad Fauzi & Nabila Putri',
    kelas: 'VIII-A & VIII-B',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    visi: 'Mewujudkan OSIS MTs Makarimul Akhlaq yang berakhlak mulia, disiplin, berprestasi, dan inovatif di era digital.',
    misi: [
      'Menanamkan nilai-nilai religius dan keteladanan akhlak dalam setiap kegiatan madrasah.',
      'Mengembangkan minat, bakat, serta kreativitas siswa melalui ekstrakurikuler yang aktif dan terarah.',
      'Membuat wadah aspirasi digital siswa yang transparan dan responsif.',
      'Menciptakan lingkungan madrasah yang bersih, asri, sehat, dan ramah lingkungan.'
    ],
    aktif: true,
    tagline: 'Berakhlak, Kreatif, Berprestasi'
  },
  {
    id: 'calon-02',
    noUrut: 2,
    nama: 'Muhammad Rizky & Siti Aisyah',
    kelas: 'VIII-C & VIII-D',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    visi: 'Menjadikan OSIS sebagai jembatan persatuan siswa yang bersinergi, unggul dalam sains, dan berdaya saing global.',
    misi: [
      'Meningkatkan budaya literasi, riset siswa madrasah, dan kompetisi akademik tingkat kabupaten hingga nasional.',
      'Mengadakan forum diskusi dan pelatihan kepemimpinan siswa secara berkala.',
      'Mempererat tali ukhuwah islamiyah antar angkatan melalui pekan olahraga dan seni santri.',
      'Mengoptimalkan pemanfaatan media sosial sekolah untuk publikasi prestasi siswa.'
    ],
    aktif: true,
    tagline: 'Sinergi Menginspirasi, Unggul Berprestasi'
  },
  {
    id: 'calon-03',
    noUrut: 3,
    nama: 'Dimas Bagus Saputra & Zahra Amalia',
    kelas: 'VIII-E & VIII-A',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    visi: 'Terwujudnya OSIS yang adaptif, mandiri, peduli sosial, dan berkarakter islami yang kokoh.',
    misi: [
      'Menyelenggarakan bakti sosial dan gerakan kepedulian lingkungan secara rutin di lingkungan madrasah.',
      'Mengembangkan kemandirian ekonomi siswa melalui program koperasi santri kreatif.',
      'Menyelenggarakan kegiatan keagamaan yang semarak, modern, dan menyenangkan.',
      'Membina kebersamaan dan solidaritas seluruh civitas madrasah tanpa membeda-bedakan.'
    ],
    aktif: true,
    tagline: 'Aksi Nyata untuk Madrasah Tercinta'
  }
];

// Clean default data - no dummy voters or sample votes
export const DEFAULT_PEMILIH: Pemilih[] = [];

export const DEFAULT_SUARA: Suara[] = [];

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin-01',
    username: 'admin',
    nama: 'Administrator Utama',
    role: 'SUPER_ADMIN',
    passwordHash: 'admin123',
    terakhirLogin: '2026-10-03T07:30:00.000Z'
  },
  {
    id: 'admin-02',
    username: 'panitia',
    nama: 'Panitia Pemilihan OSIS',
    role: 'PANITIA',
    passwordHash: 'osis2026',
    terakhirLogin: '2026-10-03T07:35:00.000Z'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-001',
    waktu: '2026-10-03T07:00:00.000Z',
    user: 'admin',
    aktivitas: 'Inisialisasi Sistem',
    keterangan: 'Sistem Pemilihan Ketua OSIS dimulai dan data awal dimuat'
  },
  {
    id: 'log-002',
    waktu: '2026-10-03T07:30:00.000Z',
    user: 'admin',
    aktivitas: 'Mulai Pemilihan',
    keterangan: 'Status pemilihan diubah menjadi SEDANG BERLANGSUNG'
  }
];

// In-memory fallback if localStorage is unavailable (SSR, Node test runner, or restricted browser)
const memoryStorage = new Map<string, string>();

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

// Helper to safely get from localStorage with memory fallback
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    if (isStorageAvailable()) {
      const item = window.localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    }
    const memItem = memoryStorage.get(key);
    if (!memItem) return defaultValue;
    return JSON.parse(memItem);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (isStorageAvailable()) {
      window.localStorage.setItem(key, serialized);
    }
    memoryStorage.set(key, serialized);
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Calon
  getCalon(): Calon[] {
    return getStorage<Calon[]>(STORAGE_KEYS.CALON, DEFAULT_CALON);
  },
  saveCalon(calonList: Calon[], actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.CALON, calonList);
    this.addAuditLog(actor, 'Perubahan Data Calon', `Menyimpan ${calonList.length} data calon`);
  },
  addCalon(calon: Omit<Calon, 'id'>, actor: string = 'admin'): Calon {
    const list = this.getCalon();
    const newCalon: Calon = {
      ...calon,
      id: `calon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    list.push(newCalon);
    this.saveCalon(list, actor);
    this.addAuditLog(actor, 'Tambah Calon', `Menambahkan calon no. urut ${calon.noUrut}: ${calon.nama}`);
    return newCalon;
  },
  updateCalon(id: string, updated: Partial<Calon>, actor: string = 'admin'): void {
    const list = this.getCalon().map((c) => (c.id === id ? { ...c, ...updated } : c));
    this.saveCalon(list, actor);
    this.addAuditLog(actor, 'Edit Calon', `Memperbarui data calon ID ${id}`);
  },
  deleteCalon(id: string, actor: string = 'admin'): void {
    const list = this.getCalon();
    const target = list.find((c) => c.id === id);
    const filtered = list.filter((c) => c.id !== id);
    this.saveCalon(filtered, actor);
    this.addAuditLog(actor, 'Hapus Calon', `Menghapus calon: ${target?.nama || id}`);
  },

  // Pemilih
  getPemilih(): Pemilih[] {
    return getStorage<Pemilih[]>(STORAGE_KEYS.PEMILIH, DEFAULT_PEMILIH);
  },
  savePemilih(pemilihList: Pemilih[], actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.PEMILIH, pemilihList);
  },
  addPemilih(pemilih: Omit<Pemilih, 'id' | 'statusMemilih' | 'waktuMemilih'>, actor: string = 'admin'): Pemilih {
    const list = this.getPemilih();
    const newPemilih: Pemilih = {
      ...pemilih,
      id: `pemilih-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      statusMemilih: false,
    };
    list.push(newPemilih);
    this.savePemilih(list, actor);
    this.addAuditLog(actor, 'Tambah Pemilih', `Menambahkan pemilih ${pemilih.nama} (${pemilih.nisNisn})`);
    return newPemilih;
  },
  updatePemilih(id: string, updated: Partial<Pemilih>, actor: string = 'admin'): void {
    const list = this.getPemilih().map((p) => (p.id === id ? { ...p, ...updated } : p));
    this.savePemilih(list, actor);
    this.addAuditLog(actor, 'Edit Pemilih', `Memperbarui data pemilih ID ${id}`);
  },
  deletePemilih(id: string, actor: string = 'admin'): void {
    const list = this.getPemilih();
    const target = list.find((p) => p.id === id);
    const filtered = list.filter((p) => p.id !== id);
    this.savePemilih(filtered, actor);
    // Also remove any vote cast by this voter to maintain data consistency
    const votes = this.getSuara().filter((s) => s.idPemilih !== id);
    setStorage(STORAGE_KEYS.SUARA, votes);
    this.addAuditLog(actor, 'Hapus Pemilih Permanen', `Menghapus pemilih: ${target?.nama || id} (${target?.nisNisn || ''})`);
  },
  clearAllPemilih(actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.PEMILIH, []);
    setStorage(STORAGE_KEYS.SUARA, []);
    this.addAuditLog(actor, 'Kosongkan DPT Permanen', 'Semua data DPT pemilih dan suara telah dikosongkan secara permanen');
  },
  importPemilihBulk(newList: Omit<Pemilih, 'id' | 'statusMemilih' | 'waktuMemilih'>[], actor: string = 'admin'): { added: number; skipped: number } {
    const current = this.getPemilih();
    const existingTokens = new Set(current.map((p) => p.kodePemilih.toUpperCase()));
    const existingNis = new Set(current.map((p) => p.nisNisn.trim()));

    let added = 0;
    let skipped = 0;

    for (const item of newList) {
      if (existingTokens.has(item.kodePemilih.toUpperCase()) || existingNis.has(item.nisNisn.trim())) {
        skipped++;
        continue;
      }
      current.push({
        ...item,
        id: `pemilih-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        statusMemilih: false,
      });
      existingTokens.add(item.kodePemilih.toUpperCase());
      existingNis.add(item.nisNisn.trim());
      added++;
    }

    this.savePemilih(current, actor);
    this.addAuditLog(actor, 'Import Pemilih', `Import Excel: berhasil ${added}, duplikat/dilewati ${skipped}`);
    return { added, skipped };
  },
  resetPemilihStatus(id: string, actor: string = 'admin'): void {
    // Reset status voting for a specific voter
    const list = this.getPemilih().map((p) => (p.id === id ? { ...p, statusMemilih: false, waktuMemilih: undefined } : p));
    this.savePemilih(list, actor);
    // Also remove their vote from votes table to keep integrity
    const votes = this.getSuara().filter((s) => s.idPemilih !== id);
    setStorage(STORAGE_KEYS.SUARA, votes);
    this.addAuditLog(actor, 'Reset Status Pemilih', `Mereset status memilih untuk ID pemilih ${id}`);
  },

  // Suara (Votes)
  getSuara(): Suara[] {
    return getStorage<Suara[]>(STORAGE_KEYS.SUARA, DEFAULT_SUARA);
  },
  castVote(idPemilih: string, idCalon: string): { success: boolean; message: string; voteId?: string } {
    const pemilihList = this.getPemilih();
    const voter = pemilihList.find((p) => p.id === idPemilih);

    if (!voter) {
      return { success: false, message: 'Data pemilih tidak ditemukan dalam sistem.' };
    }

    if (voter.statusMemilih) {
      return { success: false, message: 'Anda sudah menggunakan hak pilih Anda. Satu pemilih hanya dapat memilih 1 kali.' };
    }

    const settings = this.getPengaturanPemilihan();
    if (settings.status !== 'SEDANG_BERLANGSUNG') {
      return {
        success: false,
        message: settings.status === 'BELUM_DIMULAI'
          ? 'Pemilihan belum dimulai oleh Panitia.'
          : 'Pemilihan sudah berakhir/ditutup oleh Panitia.'
      };
    }

    const calonList = this.getCalon();
    const candidate = calonList.find((c) => c.id === idCalon && c.aktif);
    if (!candidate) {
      return { success: false, message: 'Calon yang dipilih tidak valid atau tidak aktif.' };
    }

    // Double check existing vote in votes table
    const currentVotes = this.getSuara();
    if (currentVotes.some((v) => v.idPemilih === idPemilih)) {
      return { success: false, message: 'Hak pilih untuk akun ini telah tercatat sebelumnya.' };
    }

    const now = new Date().toISOString();
    const voteId = `vote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 1. Save Vote
    currentVotes.push({
      id: voteId,
      idPemilih,
      idCalon,
      waktuSuara: now,
      status: 'SAH',
    });
    setStorage(STORAGE_KEYS.SUARA, currentVotes);

    // 2. Mark Voter as voted
    voter.statusMemilih = true;
    voter.waktuMemilih = now;
    this.savePemilih(pemilihList, 'sistem');

    // 3. Audit log (without revealing candidate to protect secret ballot)
    this.addAuditLog(
      'pemilih:' + voter.kodePemilih,
      'Memberikan Suara',
      `Pemilih ${voter.nama} (${voter.kelas}) berhasil memberikan suara (ID Suara: ${voteId})`
    );

    return { success: true, message: 'Suara Anda telah berhasil direkam.', voteId };
  },

  // Pengaturan
  getPengaturanSekolah(): PengaturanSekolah {
    return getStorage<PengaturanSekolah>(STORAGE_KEYS.PENGATURAN_SEKOLAH, DEFAULT_PENGATURAN_SEKOLAH);
  },
  savePengaturanSekolah(data: PengaturanSekolah, actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.PENGATURAN_SEKOLAH, data);
    this.addAuditLog(actor, 'Pengaturan Sekolah', 'Memperbarui profil data sekolah & madrasah');
  },
  getPengaturanPemilihan(): PengaturanPemilihan {
    return getStorage<PengaturanPemilihan>(STORAGE_KEYS.PENGATURAN_PEMILIHAN, DEFAULT_PENGATURAN_PEMILIHAN);
  },
  savePengaturanPemilihan(data: PengaturanPemilihan, actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.PENGATURAN_PEMILIHAN, data);
    this.addAuditLog(actor, 'Pengaturan Pemilihan', `Status pemilihan: ${data.status}`);
  },

  // Admin Users
  getAdminUsers(): AdminUser[] {
    return getStorage<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, DEFAULT_ADMIN_USERS);
  },
  saveAdminUsers(users: AdminUser[], actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.ADMIN_USERS, users);
    this.addAuditLog(actor, 'Kelola Admin', 'Memperbarui data pengguna admin');
  },
  getActiveAdminSession(): AdminUser | null {
    return getStorage<AdminUser | null>(STORAGE_KEYS.ACTIVE_ADMIN_SESSION, null);
  },
  setActiveAdminSession(user: AdminUser | null): void {
    setStorage(STORAGE_KEYS.ACTIVE_ADMIN_SESSION, user);
    if (user) {
      this.addAuditLog(user.username, 'Login Admin', `Admin ${user.nama} berhasil masuk ke sistem`);
    }
  },
  updateAdminPassword(userId: string, newPassword: string, actor: string = 'admin'): boolean {
    const users = this.getAdminUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    user.passwordHash = newPassword;
    this.saveAdminUsers(users, actor);
    this.addAuditLog(actor, 'Ubah Password Admin', `Password akun ${user.username} (${user.nama}) berhasil diperbarui`);
    return true;
  },
  resetAdminPasswordToDefault(userId: string, actor: string = 'admin'): { success: boolean; defaultPass: string; user?: AdminUser } {
    const users = this.getAdminUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, defaultPass: '' };
    const defaultPass = user.username === 'admin' ? 'admin123' : 'osis2026';
    user.passwordHash = defaultPass;
    this.saveAdminUsers(users, actor);
    this.addAuditLog(actor, 'Reset Password Admin', `Password akun ${user.username} direset ke default (${defaultPass})`);
    return { success: true, defaultPass, user };
  },

  // Audit Logs
  getAuditLogs(): AuditLogItem[] {
    return getStorage<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOG, DEFAULT_AUDIT_LOGS);
  },
  addAuditLog(user: string, aktivitas: string, keterangan: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      waktu: new Date().toISOString(),
      user,
      aktivitas,
      keterangan,
    };
    logs.unshift(newLog); // latest on top
    // keep max 500 logs
    if (logs.length > 500) logs.pop();
    setStorage(STORAGE_KEYS.AUDIT_LOG, logs);
  },

  // Database Reset / Factory Defaults
  resetToDefault(actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.CALON, DEFAULT_CALON);
    setStorage(STORAGE_KEYS.PEMILIH, DEFAULT_PEMILIH);
    setStorage(STORAGE_KEYS.SUARA, DEFAULT_SUARA);
    setStorage(STORAGE_KEYS.PENGATURAN_SEKOLAH, DEFAULT_PENGATURAN_SEKOLAH);
    setStorage(STORAGE_KEYS.PENGATURAN_PEMILIHAN, DEFAULT_PENGATURAN_PEMILIHAN);
    setStorage(STORAGE_KEYS.ADMIN_USERS, DEFAULT_ADMIN_USERS);
    setStorage(STORAGE_KEYS.AUDIT_LOG, DEFAULT_AUDIT_LOGS);
    this.addAuditLog(actor, 'Reset Database', 'Mengembalikan database ke pengaturan default awal');
  },

  // Wipe All Votes for clean new voting session
  resetOnlyVotes(actor: string = 'admin'): void {
    setStorage(STORAGE_KEYS.SUARA, []);
    const voters = this.getPemilih().map((p) => ({ ...p, statusMemilih: false, waktuMemilih: undefined }));
    setStorage(STORAGE_KEYS.PEMILIH, voters);
    const settings = this.getPengaturanPemilihan();
    settings.hasilTerbukaUntukAdmin = false;
    settings.hasilDitampilkanKePenonton = false;
    setStorage(STORAGE_KEYS.PENGATURAN_PEMILIHAN, settings);
    this.addAuditLog(actor, 'Reset Kotak Suara', 'Mereset semua suara masuk dan mengembalikan hak pilih semua siswa');
  },

  // Full backup & restore
  exportFullBackup(): string {
    const backup = {
      calon: this.getCalon(),
      pemilih: this.getPemilih(),
      suara: this.getSuara(),
      pengaturanSekolah: this.getPengaturanSekolah(),
      pengaturanPemilihan: this.getPengaturanPemilihan(),
      adminUsers: this.getAdminUsers(),
      auditLog: this.getAuditLogs(),
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  },
  importFullBackup(jsonString: string, actor: string = 'admin'): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.calon) setStorage(STORAGE_KEYS.CALON, data.calon);
      if (data.pemilih) setStorage(STORAGE_KEYS.PEMILIH, data.pemilih);
      if (data.suara) setStorage(STORAGE_KEYS.SUARA, data.suara);
      if (data.pengaturanSekolah) setStorage(STORAGE_KEYS.PENGATURAN_SEKOLAH, data.pengaturanSekolah);
      if (data.pengaturanPemilihan) setStorage(STORAGE_KEYS.PENGATURAN_PEMILIHAN, data.pengaturanPemilihan);
      if (data.adminUsers) setStorage(STORAGE_KEYS.ADMIN_USERS, data.adminUsers);
      if (data.auditLog) setStorage(STORAGE_KEYS.AUDIT_LOG, data.auditLog);
      this.addAuditLog(actor, 'Restore Database', 'Memulihkan database dari file backup JSON');
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },
};
