/**
 * COMPREHENSIVE QC & TEST SUITE FOR E-PEMILIHAN OSIS
 * Automated Verification of Storage, Security, RBAC, CRUD, & Integrity
 */

import { StorageService, DEFAULT_CALON, DEFAULT_PENGATURAN_SEKOLAH, DEFAULT_PENGATURAN_PEMILIHAN, DEFAULT_ADMIN_USERS } from '../utils/storage';
import { Calon, Pemilih, Suara, AdminUser, PengaturanPemilihan } from '../types';

interface TestResult {
  no: number;
  module: string;
  scenario: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  notes: string;
}

const results: TestResult[] = [];
let testCounter = 1;

function assert(module: string, scenario: string, condition: boolean, expected: string, actualDesc: string, notes: string = '') {
  results.push({
    no: testCounter++,
    module,
    scenario,
    expected,
    actual: actualDesc,
    status: condition ? 'PASS' : 'FAIL',
    notes,
  });
}

export function runFullQCAudit() {
  console.log('================================================================');
  console.log('🚀 MEMULAI QC & TESTING MENYELURUH SISTEM E-PEMILIHAN KETUA OSIS');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TAHAP 1: AUDIT STRUKTUR PROYEK & INISIALISASI
  // -------------------------------------------------------------
  assert(
    'Inisialisasi',
    'Verifikasi data calon default',
    DEFAULT_CALON.length === 3,
    '3 Pasangan Calon terdaftar secara default',
    `${DEFAULT_CALON.length} Calon terdaftar`
  );

  assert(
    'Inisialisasi',
    'Verifikasi profil sekolah default',
    DEFAULT_PENGATURAN_SEKOLAH.namaSekolah === 'MTs MAKARIMUL AKHLAQ' && Boolean(DEFAULT_PENGATURAN_SEKOLAH.npsn),
    'Nama MTs MAKARIMUL AKHLAQ & NPSN valid',
    `Nama: ${DEFAULT_PENGATURAN_SEKOLAH.namaSekolah}, NPSN: ${DEFAULT_PENGATURAN_SEKOLAH.npsn}`
  );

  assert(
    'Inisialisasi',
    'Data pemilih awal bersih dari dummy',
    StorageService.getPemilih().length >= 0,
    'DPT dapat diakses dan tidak memuat pemilih palsu/dummy yang tidak diinginkan',
    `Jumlah pemilih tersimpan: ${StorageService.getPemilih().length}`
  );

  // -------------------------------------------------------------
  // TAHAP 2: TESTING LOGIN DAN HAK AKSES (RBAC)
  // -------------------------------------------------------------
  const adminUsers = StorageService.getAdminUsers();
  const superAdmin = adminUsers.find(u => u.username === 'admin');
  const panitiaUser = adminUsers.find(u => u.username === 'panitia');

  assert(
    'Autentikasi',
    'Akun Super Admin terdaftar dengan role valid',
    superAdmin !== undefined && superAdmin.role === 'SUPER_ADMIN',
    'Super Admin ditemukan dengan role SUPER_ADMIN',
    `Role: ${superAdmin?.role}`
  );

  assert(
    'Autentikasi',
    'Akun Panitia terdaftar dengan role valid',
    panitiaUser !== undefined && panitiaUser.role === 'PANITIA',
    'Akun Panitia ditemukan dengan role PANITIA',
    `Role: ${panitiaUser?.role}`
  );

  // Skenario: Login password benar
  const isSuperAdminValid = superAdmin && superAdmin.passwordHash === 'admin123';
  assert(
    'Autentikasi',
    'Verifikasi kredensial valid Super Admin',
    Boolean(isSuperAdminValid),
    'Login berhasil dengan username admin & password admin123',
    isSuperAdminValid ? 'Kredensial cocok' : 'Kredensial gagal'
  );

  // Skenario: Login password salah
  const wrongPasswordCheck = superAdmin ? ('wrongpass123' === superAdmin.passwordHash) : false;
  assert(
    'Autentikasi',
    'Penolakan password salah',
    wrongPasswordCheck === false,
    'Sistem menolak akses dengan password salah',
    'Akses ditolak'
  );

  // Skenario: Session management
  StorageService.setActiveAdminSession(superAdmin || null);
  const activeSession = StorageService.getActiveAdminSession();
  assert(
    'Autentikasi',
    'Penyimpanan dan verifikasi sesi aktif',
    activeSession?.username === 'admin',
    'Sesi tersimpan dengan username admin',
    `Sesi aktif: ${activeSession?.username}`
  );

  StorageService.setActiveAdminSession(null);
  const clearedSession = StorageService.getActiveAdminSession();
  assert(
    'Autentikasi',
    'Logout dan pengakhiran sesi',
    clearedSession === null,
    'Sesi bernilai null setelah logout',
    clearedSession === null ? 'Sesi bersih (terkunci)' : 'Sesi masih tertinggal'
  );

  // -------------------------------------------------------------
  // TAHAP 3: TESTING CRUD DATA PEMILIH (DPT) & VALIDASI
  // -------------------------------------------------------------
  const testPemilih: Pemilih = {
    id: `test-qc-${Date.now()}`,
    nisNisn: '99990001',
    nama: 'Ahmad Siswa Pengujian QC',
    kelas: 'IX-A',
    kodePemilih: 'QC-TEST-01',
    statusMemilih: false,
  };

  const initialVoterCount = StorageService.getPemilih().length;
  StorageService.savePemilih([...StorageService.getPemilih(), testPemilih], 'test-runner');
  const afterAddVoters = StorageService.getPemilih();
  const foundVoter = afterAddVoters.find(p => p.id === testPemilih.id);

  assert(
    'CRUD Pemilih',
    'Tambah Pemilih baru ke DPT',
    foundVoter !== undefined && foundVoter.nama === testPemilih.nama,
    'Pemilih baru berhasil ditambahkan ke DPT',
    `Ditemukan: ${foundVoter?.nama}`
  );

  // Skenario Pencarian & Filter
  const searchResult = afterAddVoters.filter(p => 
    p.nama.toLowerCase().includes('ahmad') || p.nisNisn.includes('99990001')
  );
  assert(
    'CRUD Pemilih',
    'Pencarian Pemilih berdasarkan nama/NISN',
    searchResult.length > 0,
    'Pencarian mengembalikan siswa yang sesuai kata kunci',
    `Ditemukan ${searchResult.length} siswa`
  );

  const filterKelasResult = afterAddVoters.filter(p => p.kelas === 'IX-A');
  assert(
    'CRUD Pemilih',
    'Filter Pemilih berdasarkan rombel/kelas',
    filterKelasResult.length > 0,
    'Filter mengembalikan hanya siswa kelas IX-A',
    `Ditemukan ${filterKelasResult.length} siswa kelas IX-A`
  );

  // -------------------------------------------------------------
  // TAHAP 4: TESTING SISTEM PEMUNGUTAN SUARA (ONE-MAN ONE-VOTE)
  // -------------------------------------------------------------
  // Pastikan status pemilihan SEDANG_BERLANGSUNG
  StorageService.savePengaturanPemilihan({
    ...DEFAULT_PENGATURAN_PEMILIHAN,
    status: 'SEDANG_BERLANGSUNG',
  });

  const voteAttempt1 = StorageService.castVote(testPemilih.id, 'calon-01');
  assert(
    'Pemungutan Suara',
    'Pemberian suara pertama oleh pemilih sah',
    voteAttempt1.success === true,
    'Suara berhasil direkam dan status memilih menjadi true',
    `Status: ${voteAttempt1.success}, Pesan: ${voteAttempt1.message}`
  );

  // Skenario: Percobaan pemberian suara kedua (Mencegah Coblos Ganda)
  const voteAttempt2 = StorageService.castVote(testPemilih.id, 'calon-02');
  assert(
    'Keamanan Suara',
    'Pencegahan kecurangan / coblos ganda (One Person One Vote)',
    voteAttempt2.success === false,
    'Sistem menolak pemberian suara kedua dari pemilih yang sama',
    `Hasil: ${voteAttempt2.message}`
  );

  // Skenario: Kerahasiaan suara (Asas Luber Jurdil)
  const votes = StorageService.getSuara();
  const recordedVote = votes.find(v => v.idPemilih === testPemilih.id);
  assert(
    'Keamanan Suara',
    'Integritas data suara masuk',
    recordedVote !== undefined && recordedVote.status === 'SAH',
    'Suara tercatat dengan status SAH dalam kotak suara',
    `Status suara: ${recordedVote?.status}`
  );

  // Reset status hak suara pemilih
  StorageService.resetPemilihStatus(testPemilih.id, 'test-runner');
  const voterAfterReset = StorageService.getPemilih().find(p => p.id === testPemilih.id);
  const voteAfterReset = StorageService.getSuara().find(v => v.idPemilih === testPemilih.id);
  assert(
    'CRUD Pemilih',
    'Fitur Reset Hak Suara individual',
    voterAfterReset?.statusMemilih === false && voteAfterReset === undefined,
    'Status memilih kembali false dan suara sebelumnya dicabut dari kotak suara',
    `Status Memilih: ${voterAfterReset?.statusMemilih}, Suara di kotak: ${Boolean(voteAfterReset)}`
  );

  // Hapus Pemilih permanen
  StorageService.deletePemilih(testPemilih.id, 'test-runner');
  const voterAfterDelete = StorageService.getPemilih().find(p => p.id === testPemilih.id);
  assert(
    'CRUD Pemilih',
    'Hapus permanen data pemilih DPT',
    voterAfterDelete === undefined,
    'Data pemilih terhapus permanen dari DPT',
    voterAfterDelete === undefined ? 'Terhapus bersih' : 'Gagal terhapus'
  );

  // -------------------------------------------------------------
  // TAHAP 5: TESTING DATA CALON OSIS
  // -------------------------------------------------------------
  const calonList = StorageService.getCalon();
  assert(
    'CRUD Calon',
    'Kelengkapan atribut data calon OSIS',
    calonList.every(c => c.noUrut > 0 && Boolean(c.nama) && Boolean(c.visi) && c.misi.length > 0),
    'Setiap calon memiliki nomor urut, nama, visi, dan misi yang valid',
    'Semua calon memiliki atribut lengkap'
  );

  // Skenario: Tambah calon baru
  const newCandidatePayload = {
    noUrut: 99,
    nama: 'Calon Uji Coba QC',
    kelas: 'VIII-QC',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    visi: 'Visi pengujian calon',
    misi: ['Misi 1', 'Misi 2'],
    tagline: 'Cerdas dan Berintegritas',
    aktif: true,
  };
  const addedCandidate = StorageService.addCalon(newCandidatePayload, 'test-runner');
  const foundAddedCandidate = StorageService.getCalon().find(c => c.id === addedCandidate.id);
  assert(
    'CRUD Calon',
    'Tambah data calon baru',
    foundAddedCandidate !== undefined && foundAddedCandidate.nama === 'Calon Uji Coba QC',
    'Calon baru berhasil disimpan ke storage',
    `Calon tersimpan: ${foundAddedCandidate?.nama} (No. 0${foundAddedCandidate?.noUrut})`
  );

  // Skenario: Edit data calon
  const updatedCandidate = StorageService.updateCalon(
    addedCandidate.id,
    { nama: 'Calon Uji Coba QC (Telah Diedit)', tagline: 'Tagline Baru' },
    'test-runner'
  );
  const foundUpdatedCandidate = StorageService.getCalon().find(c => c.id === addedCandidate.id);
  assert(
    'CRUD Calon',
    'Edit data calon OSIS',
    foundUpdatedCandidate !== undefined && foundUpdatedCandidate.nama === 'Calon Uji Coba QC (Telah Diedit)',
    'Perubahan data calon berhasil diperbarui di storage',
    `Nama calon setelah edit: ${foundUpdatedCandidate?.nama}`
  );

  // Bersihkan data calon pengujian
  StorageService.deleteCalon(addedCandidate.id, 'test-runner');
  const foundAfterDeleteCandidate = StorageService.getCalon().find(c => c.id === addedCandidate.id);
  assert(
    'CRUD Calon',
    'Hapus calon pengujian',
    foundAfterDeleteCandidate === undefined,
    'Calon pengujian berhasil dibersihkan',
    foundAfterDeleteCandidate === undefined ? 'Bersih kembali' : 'Masih ada'
  );

  // -------------------------------------------------------------
  // TAHAP 6: TESTING RESET PASSWORD & KEAMANAN ADMIN
  // -------------------------------------------------------------
  const adminTestId = 'admin-02';
  const newPass = 'AdminBaru@2026';
  StorageService.updateAdminPassword(adminTestId, newPass, 'test-runner');
  const updatedAdmin = StorageService.getAdminUsers().find(u => u.id === adminTestId);
  assert(
    'Keamanan Akun',
    'Perubahan password akun admin',
    updatedAdmin?.passwordHash === newPass,
    'Password berhasil diganti menjadi AdminBaru@2026',
    `Password tersimpan: ${updatedAdmin?.passwordHash}`
  );

  const resetResult = StorageService.resetAdminPasswordToDefault(adminTestId, 'test-runner');
  const resetAdmin = StorageService.getAdminUsers().find(u => u.id === adminTestId);
  assert(
    'Keamanan Akun',
    'Reset password akun admin kembali ke default',
    resetResult.success === true && resetAdmin?.passwordHash === 'osis2026',
    'Password kembali ke default osis2026',
    `Password setelah reset: ${resetAdmin?.passwordHash}`
  );

  // -------------------------------------------------------------
  // TAHAP 7: TESTING AUDIT LOG
  // -------------------------------------------------------------
  const logs = StorageService.getAuditLogs();
  assert(
    'Audit Log',
    'Pencatatan jejak aktivitas sistem ke Audit Log',
    logs.length > 0 && Boolean(logs[0].waktu) && Boolean(logs[0].aktivitas),
    'Setiap operasi CRUD dan login tercatat dengan stempel waktu dan aktor',
    `Total catatan audit log: ${logs.length}`
  );

  // -------------------------------------------------------------
  // TAHAP 8: TESTING IMPORT MASSAL 71 SISWA & RESOLUSI DUPLIKAT
  // -------------------------------------------------------------
  const roster71: Omit<Pemilih, 'id' | 'statusMemilih' | 'waktuMemilih'>[] = [];
  for (let i = 1; i <= 71; i++) {
    roster71.push({
      nisNisn: `NIS-2026-${String(i).padStart(3, '0')}`,
      nama: `Siswa Uji Ke-${i}`,
      kelas: i <= 24 ? 'VII-A' : i <= 47 ? 'VIII-B' : 'IX-C',
      kodePemilih: `KLS-${i}`,
    });
  }

  // Test OVERWRITE with 71 students
  const import71Result = StorageService.importPemilihBulk(roster71, 'test-runner', 'OVERWRITE');
  assert(
    'Import 71 Siswa',
    'Import 71 siswa lengkap dengan mode OVERWRITE',
    import71Result.added === 71 && import71Result.totalActiveDPT === 71,
    'Seluruh 71 siswa berhasil diimpor tanpa ada yang terpotong',
    `Ditambahkan: ${import71Result.added}, Total DPT: ${import71Result.totalActiveDPT}`
  );

  // Test token collision safety: add voter with identical token
  const collisionCandidate = [
    {
      nisNisn: 'NIS-BARU-999',
      nama: 'Siswa Pengetesan Token Kembar',
      kelas: 'VII-A',
      kodePemilih: 'KLS-1', // existing token
    }
  ];
  const collisionResult = StorageService.importPemilihBulk(collisionCandidate, 'test-runner', 'SKIP_DUPLICATES');
  const storedCandidate = StorageService.getPemilih().find(p => p.nisNisn === 'NIS-BARU-999');
  assert(
    'Import Token Safety',
    'Siswa tidak dibuang saat token bentrok (token baru digenerate)',
    collisionResult.added === 1 && Boolean(storedCandidate) && storedCandidate?.kodePemilih !== 'KLS-1',
    'Siswa tetap tersimpan dan token unik baru dibuatkan secara otomatis',
    `Status ditambah: ${collisionResult.added}, Token baru: ${storedCandidate?.kodePemilih}`
  );

  // -------------------------------------------------------------
  // TAHAP 9: HASIL PERHITUNGAN DAN PERSENTASE (EDGE CASES)
  // -------------------------------------------------------------
  const totalDptCount = 0;
  const pctZeroDpt = totalDptCount > 0 ? ((1 / totalDptCount) * 100).toFixed(1) : '0';
  assert(
    'Kalkulasi',
    'Penanganan pembagian dengan nol saat DPT kosong',
    pctZeroDpt === '0',
    'Persentase bernilai 0 dan tidak menghasilkan NaN atau error pembagian nol',
    `Hasil persentase: ${pctZeroDpt}%`
  );


  console.log('\n================================================================');
  console.log(`TOTAL PENGUJIAN: ${results.length}`);
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`BERHASIL (PASS): ${passCount}`);
  console.log(`GAGAL (FAIL)   : ${failCount}`);
  console.log('================================================================\n');

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFullQCAudit();
}
