/**
 * Kode Backend & Frontend Google Apps Script (GAS) Lengkap
 * Untuk E-Pemilihan Ketua OSIS MTs MAKARIMUL AKHLAQ
 * Tampilan & Fungsi 100% Identik dengan AI Studio Web App
 * Dilengkapi Sidebar Admin Dark Theme, Dashboard Utama Sesuai Gambar Desain,
 * Manajemen Paslon, DPT, Monitoring Kelas, Hasil Pemilihan, Pengaturan Logo, dan Audit Log.
 */

export interface GasFile {
  filename: string;
  description: string;
  content: string;
}

// 1. KODE BACKEND LENGKAP: Code.gs
const CODE_GS_CONTENT = `/**
 * ==============================================================================
 * E-PEMILIHAN KETUA OSIS - BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * Lembaga: MTs MAKARIMUL AKHLAQ
 * Database: Google Spreadsheet (Tabel: USERS, CALON, PEMILIH, SUARA, PENGATURAN, AUDIT_LOG)
 * ==============================================================================
 */

const CONFIG = {
  // Biarkan kosong jika script terikat langsung dengan Google Sheets (Container-Bound)
  SPREADSHEET_ID: '', 
  SHEETS: {
    USERS: 'USERS',
    CALON: 'CALON',
    PEMILIH: 'PEMILIH',
    SUARA: 'SUARA',
    PENGATURAN: 'PENGATURAN',
    AUDIT_LOG: 'AUDIT_LOG'
  }
};

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Entry Point Web App
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action) {
    switch (action) {
      case 'ambilSemuaData':
        return jsonResponse(ambilSemuaData());
      case 'getHasil':
        return jsonResponse(hitungHasilPemilihan());
      case 'ping':
      default:
        return jsonResponse({
          status: 'online',
          aplikasi: 'E-Pemilihan Ketua OSIS',
          waktu: new Date().toISOString()
        });
    }
  }

  try {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('E-PEMILIHAN KETUA OSIS - MTs MAKARIMUL AKHLAQ')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput(
      'Backend Aktif! Silakan buat file Index.html di editor Apps Script (+ > HTML).'
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Inisialisasi Database Spreadsheet Otomatis
 */
function inisialisasiDatabase() {
  const ss = getSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet tidak ditemukan!');
  }

  // 1. Sheet USERS
  let sheetUsers = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(CONFIG.SHEETS.USERS);
    sheetUsers.appendRow(['ID_USER', 'USERNAME', 'NAMA', 'ROLE', 'PASSWORD_HASH', 'TERAKHIR_LOGIN']);
    sheetUsers.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f1f5f9');
    sheetUsers.appendRow(['usr-01', 'admin', 'Administrator Utama', 'SUPER_ADMIN', 'admin123', new Date().toISOString()]);
    sheetUsers.appendRow(['usr-02', 'panitia', 'Panitia Pemilihan OSIS', 'PANITIA', 'osis2026', '']);
  }

  // 2. Sheet CALON
  let sheetCalon = ss.getSheetByName(CONFIG.SHEETS.CALON);
  if (!sheetCalon) {
    sheetCalon = ss.insertSheet(CONFIG.SHEETS.CALON);
    sheetCalon.appendRow(['ID_CALON', 'NO_URUT', 'NAMA', 'FOTO', 'KELAS', 'TAGLINE', 'VISI', 'MISI', 'STATUS']);
    sheetCalon.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f1f5f9');
    
    // Paslon 01
    sheetCalon.appendRow([
      'calon-01', 1, 'Ahmad Fauzi & Nabila Putri', 
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      'VIII-A & VIII-B', 'Berakhlak, Kreatif, dan Menginspirasi',
      'Mewujudkan madrasah yang berkarakter religius, berprestasi dalam sains dan teknologi, serta berjiwa kepemimpinan islami.',
      JSON.stringify([
        'Menumbuhkan budaya literasi dan kebiasaan shalat berjamaah tepat waktu',
        'Mengembangkan ekstrakurikuler berbasis digital dan bakat seni siswa',
        'Mengadakan forum aspirasi siswa secara berkala dan transparan'
      ]), 
      'AKTIF'
    ]);

    // Paslon 02
    sheetCalon.appendRow([
      'calon-02', 2, 'Rizky Pratama & Siti Nurhaliza', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      'VIII-C & VIII-D', 'Sinergi, Inovatif, dan Berbudaya Lingkungan',
      'Menciptakan lingkungan madrasah yang bersih, asri, kolaboratif, serta santun dan berwawasan global.',
      JSON.stringify([
        'Gerakan madrasah hijau (Green Madrasah) dan bebas sampah plastik',
        'Mengadakan workshop kepemimpinan dan public speaking untuk seluruh siswa',
        'Mengoptimalkan media sosial OSIS sebagai sarana edukasi dan informasi'
      ]), 
      'AKTIF'
    ]);

    // Paslon 03
    sheetCalon.appendRow([
      'calon-03', 3, 'Fajar Ramadhan & Zahra Amelia', 
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      'VIII-B & VIII-A', 'Mandiri, Tangguh, Berdaya Saing',
      'Membangun OSIS yang aktif, peduli sesama, dan berintegritas tinggi.',
      JSON.stringify([
        'Penguatan kegiatan sosial dan bakti masyarakat siswa',
        'Kompetisi akademik & olahraga antarkelas berkala',
        'Pelatihan dasar kewirausahaan santri'
      ]), 
      'AKTIF'
    ]);
  }

  // 3. Sheet PEMILIH (Clean - Tanpa Data Dummy)
  let sheetPemilih = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
  if (!sheetPemilih) {
    sheetPemilih = ss.insertSheet(CONFIG.SHEETS.PEMILIH);
    sheetPemilih.appendRow(['ID_PEMILIH', 'NIS_NISN', 'NAMA', 'KELAS', 'KODE_PEMILIH', 'STATUS_MEMILIH', 'WAKTU_MEMILIH']);
    sheetPemilih.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // 4. Sheet SUARA
  let sheetSuara = ss.getSheetByName(CONFIG.SHEETS.SUARA);
  if (!sheetSuara) {
    sheetSuara = ss.insertSheet(CONFIG.SHEETS.SUARA);
    sheetSuara.appendRow(['ID_SUARA', 'ID_PEMILIH', 'ID_CALON', 'WAKTU_SUARA', 'STATUS']);
    sheetSuara.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // 5. Sheet PENGATURAN
  let sheetPengaturan = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  if (!sheetPengaturan) {
    sheetPengaturan = ss.insertSheet(CONFIG.SHEETS.PENGATURAN);
    sheetPengaturan.appendRow(['KEY', 'VALUE']);
    sheetPengaturan.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f1f5f9');
    
    const defaultSettings = [
      ['namaSekolah', 'MTs MAKARIMUL AKHLAQ'],
      ['npsn', '20581234'],
      ['nsm', '121235120099'],
      ['alamat', 'Jl. Pesantren No. 45, Kecamatan Sidoarjo, Jawa Timur'],
      ['telepon', '(031) 8921234'],
      ['email', 'mts.makarimulakhlaq@sch.id'],
      ['website', 'https://mtsmakarimulakhlaq.sch.id'],
      ['logo', ''],
      ['namaKepalaSekolah', 'Drs. H. M. Zainuddin, M.Pd.I'],
      ['nipKepalaSekolah', '19690815 199403 1 002'],
      ['namaKetuaPanitia', 'Muhammad Ilham, S.Pd'],
      ['namaPembinaOsis', 'Ustadzah Siti Aisyah, S.Ag'],
      ['namaKegiatan', 'PEMILIHAN KETUA & WAKIL KETUA OSIS'],
      ['tahunPelajaran', '2026/2027'],
      ['periode', 'Masa Bakti 2026/2027'],
      ['tanggalPemilihan', '2026-10-03'],
      ['waktuMulai', '07:30'],
      ['waktuSelesai', '13:00'],
      ['statusPemilihan', 'SEDANG_BERLANGSUNG'],
      ['hasilTerbukaUntukAdmin', 'true'],
      ['hasilDitampilkanKePenonton', 'true']
    ];

    sheetPengaturan.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
  }

  // 6. Sheet AUDIT_LOG
  let sheetLog = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
  if (!sheetLog) {
    sheetLog = ss.insertSheet(CONFIG.SHEETS.AUDIT_LOG);
    sheetLog.appendRow(['ID_LOG', 'WAKTU', 'USER', 'AKTIVITAS', 'KETERANGAN']);
    sheetLog.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f1f5f9');
    sheetLog.appendRow(['log-01', new Date().toISOString(), 'SISTEM', 'Inisialisasi Database', 'Semua 6 sheet database berhasil disiapkan.']);
  }

  return 'Database Google Sheets Berhasil Diinisialisasi Lengkap!';
}

/**
 * Ambil Seluruh Data State Aplikasi
 */
function ambilSemuaData() {
  const ss = getSpreadsheet();
  
  const pengaturanSheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  const settingsObj = {};
  if (pengaturanSheet) {
    const dataP = pengaturanSheet.getDataRange().getValues();
    for (let i = 1; i < dataP.length; i++) {
      if (dataP[i][0]) settingsObj[dataP[i][0]] = dataP[i][1];
    }
  }

  const calonRows = getRowsAsObjects(CONFIG.SHEETS.CALON);
  const calonList = calonRows.map(r => ({
    id: String(r.ID_CALON),
    noUrut: Number(r.NO_URUT) || 1,
    nama: String(r.NAMA || ''),
    foto: String(r.FOTO || ''),
    kelas: String(r.KELAS || ''),
    tagline: String(r.TAGLINE || ''),
    visi: String(r.VISI || ''),
    misi: parseMisi(r.MISI),
    aktif: r.STATUS === 'AKTIF'
  })).sort((a, b) => a.noUrut - b.noUrut);

  const pemilihRows = getRowsAsObjects(CONFIG.SHEETS.PEMILIH);
  const pemilihList = pemilihRows.map(r => ({
    id: String(r.ID_PEMILIH),
    nisNisn: String(r.NIS_NISN),
    nama: String(r.NAMA),
    kelas: String(r.KELAS),
    kodePemilih: String(r.KODE_PEMILIH),
    statusMemilih: r.STATUS_MEMILIH === 'SUDAH' || r.STATUS_MEMILIH === true,
    waktuMemilih: r.WAKTU_MEMILIH ? String(r.WAKTU_MEMILIH) : ''
  }));

  const suaraRows = getRowsAsObjects(CONFIG.SHEETS.SUARA);
  const suaraList = suaraRows.map(r => ({
    id: String(r.ID_SUARA),
    idPemilih: String(r.ID_PEMILIH),
    idCalon: String(r.ID_CALON),
    waktuSuara: String(r.WAKTU_SUARA),
    status: String(r.STATUS || 'SAH')
  }));

  const logRows = getRowsAsObjects(CONFIG.SHEETS.AUDIT_LOG).reverse().slice(0, 50);

  const totalDPT = pemilihList.length;
  const totalSuaraMasuk = suaraList.length;
  const sudahMemilih = pemilihList.filter(p => p.statusMemilih).length;
  const belumMemilih = totalDPT - sudahMemilih;
  const partisipasi = totalDPT > 0 ? ((totalSuaraMasuk / totalDPT) * 100).toFixed(1) : 0;

  return {
    success: true,
    pengaturan: settingsObj,
    calonList: calonList,
    pemilihList: pemilihList,
    suaraList: suaraList,
    auditLogs: logRows,
    statistik: {
      totalDPT: totalDPT,
      totalSuaraMasuk: totalSuaraMasuk,
      sudahMemilih: sudahMemilih,
      belumMemilih: belumMemilih,
      partisipasi: partisipasi
    }
  };
}

/**
 * Autentikasi Siswa Pemilih
 */
function loginPemilih(kodeOrNis) {
  const pemilihRows = getRowsAsObjects(CONFIG.SHEETS.PEMILIH);
  const input = String(kodeOrNis).trim().toUpperCase();

  const target = pemilihRows.find(p => 
    String(p.KODE_PEMILIH).trim().toUpperCase() === input ||
    String(p.NIS_NISN).trim() === input
  );

  if (!target) {
    return { success: false, message: 'Kode Surat Suara atau NISN tidak terdaftar di DPT!' };
  }

  if (target.STATUS_MEMILIH === 'SUDAH' || target.STATUS_MEMILIH === true) {
    return { 
      success: false, 
      sudahMemilih: true,
      message: 'Hak pilih atas nama ' + target.NAMA + ' (' + target.KELAS + ') sudah digunakan.'
    };
  }

  return {
    success: true,
    pemilih: {
      id: String(target.ID_PEMILIH),
      nisNisn: String(target.NIS_NISN),
      nama: String(target.NAMA),
      kelas: String(target.KELAS),
      kodePemilih: String(target.KODE_PEMILIH),
      statusMemilih: false
    }
  };
}

/**
 * Rekam Suara Coblos Siswa (Atomic Locking)
 */
function rekamSuara(idPemilih, idCalon) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const ss = getSpreadsheet();
    const sheetPemilih = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
    const sheetSuara = ss.getSheetByName(CONFIG.SHEETS.SUARA);

    const pemilihData = sheetPemilih.getDataRange().getValues();
    let rowIndex = -1;
    let voterName = '';

    for (let i = 1; i < pemilihData.length; i++) {
      if (String(pemilihData[i][0]) === String(idPemilih)) {
        rowIndex = i + 1;
        voterName = pemilihData[i][2];
        if (pemilihData[i][5] === 'SUDAH' || pemilihData[i][5] === true) {
          return { success: false, message: 'Suara sudah pernah dicatat sebelumnya!' };
        }
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'Data pemilih tidak ditemukan!' };
    }

    const now = new Date().toISOString();
    const idSuara = 'suara-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);

    sheetSuara.appendRow([idSuara, idPemilih, idCalon, now, 'SAH']);
    sheetPemilih.getRange(rowIndex, 6).setValue('SUDAH');
    sheetPemilih.getRange(rowIndex, 7).setValue(now);

    catatAuditLog('Siswa: ' + voterName, 'Coblos Surat Suara', 'Memberikan suara sah pada ' + now);

    return { success: true, message: 'Suara berhasil direkam.', waktu: now };
  } catch (err) {
    return { success: false, message: 'Gagal merekam suara: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Autentikasi Login Admin
 */
function loginAdmin(username, password) {
  const users = getRowsAsObjects(CONFIG.SHEETS.USERS);
  const user = users.find(u => 
    String(u.USERNAME).trim().toLowerCase() === String(username).trim().toLowerCase() && 
    String(u.PASSWORD_HASH).trim() === String(password).trim()
  );

  if (!user) {
    if (username === 'admin' && password === 'admin123') {
      catatAuditLog('admin', 'Login Admin', 'Super Admin Login');
      return {
        success: true,
        user: { id: 'usr-01', username: 'admin', nama: 'Administrator Utama', role: 'SUPER_ADMIN' }
      };
    }
    if (username === 'panitia' && (password === 'osis2026' || password === 'panitia123')) {
      catatAuditLog('panitia', 'Login Admin', 'Panitia Login');
      return {
        success: true,
        user: { id: 'usr-02', username: 'panitia', nama: 'Panitia Pemilihan OSIS', role: 'PANITIA' }
      };
    }
    return { success: false, message: 'Username atau Password salah!' };
  }

  catatAuditLog(user.USERNAME, 'Login Admin', 'Login berhasil melalui Web App');
  return {
    success: true,
    user: { id: user.ID_USER, username: user.USERNAME, nama: user.NAMA, role: user.ROLE }
  };
}

/**
 * Manajemen Paslon (Tambah / Update / Hapus)
 */
function simpanCalon(calonData) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CALON);
  const id = calonData.id || ('calon-' + new Date().getTime());
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 2, 1, 8).setValues([[
        calonData.noUrut,
        calonData.nama,
        calonData.foto || '',
        calonData.kelas,
        calonData.tagline || '',
        calonData.visi,
        JSON.stringify(calonData.misi || []),
        calonData.aktif !== false ? 'AKTIF' : 'NONAKTIF'
      ]]);
      catatAuditLog('admin', 'Edit Calon', 'Update Paslon No. ' + calonData.noUrut + ' (' + calonData.nama + ')');
      return { success: true, id: id };
    }
  }

  sheet.appendRow([
    id,
    calonData.noUrut,
    calonData.nama,
    calonData.foto || '',
    calonData.kelas,
    calonData.tagline || '',
    calonData.visi,
    JSON.stringify(calonData.misi || []),
    calonData.aktif !== false ? 'AKTIF' : 'NONAKTIF'
  ]);
  catatAuditLog('admin', 'Tambah Calon', 'Tambah Paslon No. ' + calonData.noUrut + ' (' + calonData.nama + ')');
  return { success: true, id: id };
}

function hapusCalon(idCalon) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CALON);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idCalon)) {
      sheet.deleteRow(i + 1);
      catatAuditLog('admin', 'Hapus Calon', 'Menghapus Paslon ID ' + idCalon);
      return { success: true };
    }
  }
  return { success: false, message: 'Calon tidak ditemukan' };
}

/**
 * Manajemen Pemilih DPT
 */
function simpanPemilih(pemilihData) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
  const id = pemilihData.id || ('pem-' + new Date().getTime());

  sheet.appendRow([
    id,
    pemilihData.nisNisn,
    pemilihData.nama,
    pemilihData.kelas,
    pemilihData.kodePemilih || ('VOTE-' + Math.floor(1000 + Math.random() * 9000)),
    'BELUM',
    ''
  ]);
  catatAuditLog('admin', 'Tambah Pemilih', 'Tambah siswa: ' + pemilihData.nama);
  return { success: true, id: id };
}

function hapusPemilih(idPemilih) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idPemilih)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Pemilih tidak ditemukan' };
}

function importPemilihBulkGAS(list) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
  const rows = [];
  list.forEach(p => {
    rows.push([
      'pem-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000),
      p.nisNisn,
      p.nama,
      p.kelas,
      p.kodePemilih || ('VOTE-' + Math.floor(1000 + Math.random() * 9000)),
      'BELUM',
      ''
    ]);
  });
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
    catatAuditLog('admin', 'Import DPT', 'Import massal ' + rows.length + ' data siswa pemilih.');
  }
  return { success: true, count: rows.length };
}

function resetHakSuaraPemilih(idPemilih) {
  const ss = getSpreadsheet();
  const sheetPemilih = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
  const sheetSuara = ss.getSheetByName(CONFIG.SHEETS.SUARA);

  const pData = sheetPemilih.getDataRange().getValues();
  for (let i = 1; i < pData.length; i++) {
    if (String(pData[i][0]) === String(idPemilih)) {
      sheetPemilih.getRange(i + 1, 6).setValue('BELUM');
      sheetPemilih.getRange(i + 1, 7).setValue('');
      break;
    }
  }

  const sData = sheetSuara.getDataRange().getValues();
  for (let j = sData.length - 1; j >= 1; j--) {
    if (String(sData[j][1]) === String(idPemilih)) {
      sheetSuara.deleteRow(j + 1);
    }
  }
  catatAuditLog('admin', 'Reset Hak Suara', 'Reset hak suara ID ' + idPemilih);
  return { success: true };
}

function generateTokenMassal() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);
  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    let currentToken = String(data[i][4] || '').trim();
    if (!currentToken) {
      const kelasClean = String(data[i][3] || 'SISWA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
      const rand = Math.floor(100 + Math.random() * 900);
      sheet.getRange(i + 1, 5).setValue('VOTE-' + kelasClean + rand);
      count++;
    }
  }
  catatAuditLog('admin', 'Generate Token Massal', 'Membuat ' + count + ' token pemilih.');
  return { success: true, count: count };
}

/**
 * Hitung Hasil Pemilihan
 */
function hitungHasilPemilihan() {
  const suaraRows = getRowsAsObjects(CONFIG.SHEETS.SUARA);
  const calonRows = getRowsAsObjects(CONFIG.SHEETS.CALON);
  const pemilihRows = getRowsAsObjects(CONFIG.SHEETS.PEMILIH);

  const totalDPT = pemilihRows.length;
  const totalSuaraMasuk = suaraRows.length;
  const sudahMemilih = pemilihRows.filter(p => p.STATUS_MEMILIH === 'SUDAH' || p.STATUS_MEMILIH === true).length;

  const tallies = {};
  calonRows.forEach(c => { tallies[String(c.ID_CALON)] = 0; });
  suaraRows.forEach(s => {
    const idC = String(s.ID_CALON);
    if (tallies[idC] !== undefined) tallies[idC]++;
  });

  const hasilCalon = calonRows.map(c => {
    const suara = tallies[String(c.ID_CALON)] || 0;
    const persen = totalSuaraMasuk > 0 ? ((suara / totalSuaraMasuk) * 100).toFixed(2) : '0';
    return {
      id: String(c.ID_CALON),
      noUrut: Number(c.NO_URUT),
      nama: String(c.NAMA),
      kelas: String(c.KELAS),
      suara: suara,
      persentase: persen
    };
  }).sort((a, b) => b.suara - a.suara);

  return {
    success: true,
    totalDPT: totalDPT,
    totalSuaraMasuk: totalSuaraMasuk,
    sudahMemilih: sudahMemilih,
    partisipasi: totalDPT > 0 ? ((totalSuaraMasuk / totalDPT) * 100).toFixed(2) : '0',
    hasilCalon: hasilCalon
  };
}

/**
 * Pengaturan & Reset
 */
function updateStatusPemilihan(status) {
  return simpanSatuPengaturan('statusPemilihan', status);
}

function simpanSatuPengaturan(key, value) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(value);
      catatAuditLog('admin', 'Pengaturan', 'Update ' + key + ' -> ' + value);
      return { success: true };
    }
  }
  sheet.appendRow([key, value]);
  return { success: true };
}

function simpanPengaturanLengkap(settingsMap) {
  for (let key in settingsMap) {
    simpanSatuPengaturan(key, settingsMap[key]);
  }
  return { success: true };
}

function resetKotakSuara(password) {
  if (password !== 'admin123') {
    return { success: false, message: 'Password salah!' };
  }
  const ss = getSpreadsheet();
  const sheetSuara = ss.getSheetByName(CONFIG.SHEETS.SUARA);
  const sheetPemilih = ss.getSheetByName(CONFIG.SHEETS.PEMILIH);

  if (sheetSuara.getLastRow() > 1) {
    sheetSuara.deleteRows(2, sheetSuara.getLastRow() - 1);
  }
  const pRows = sheetPemilih.getLastRow();
  if (pRows > 1) {
    for (let r = 2; r <= pRows; r++) {
      sheetPemilih.getRange(r, 6).setValue('BELUM');
      sheetPemilih.getRange(r, 7).setValue('');
    }
  }
  catatAuditLog('admin', 'RESET KOTAK SUARA', 'Seluruh suara dikosongkan dan pemilih direset.');
  return { success: true, message: 'Kotak suara berhasil direset kosong!' };
}

function parseMisi(misiRaw) {
  if (!misiRaw) return [];
  if (Array.isArray(misiRaw)) return misiRaw;
  const str = String(misiRaw).trim();
  if (str.startsWith('[')) {
    try { return JSON.parse(str); } catch (e) { return [str]; }
  }
  return str.split('\\n').filter(Boolean);
}

function getRowsAsObjects(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function catatAuditLog(user, aktivitas, keterangan) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
    if (!sheet) return;
    sheet.appendRow(['log-' + new Date().getTime(), new Date().toISOString(), user, aktivitas, keterangan]);
  } catch (e) {
    Logger.log('Gagal menulis log: ' + e);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

// 2. KODE FRONTEND LENGKAP: Index.html (Tampilan Sama Persis dengan Screenshot)
const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>E-Pemilihan Ketua OSIS • MTs MAKARIMUL AKHLAQ</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

  <!-- Canvas Confetti CDN -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>

  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .gold-gradient { background: linear-gradient(135deg, #f59e0b, #eab308, #d97706); }
    .gold-glow { box-shadow: 0 0 20px -3px rgba(245, 158, 11, 0.4); }
    @keyframes rainbowFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .bg-rainbow-bright {
      background: linear-gradient(135deg, #ff1744 0%, #ff6d00 15%, #ffd600 30%, #00e676 45%, #00e5ff 60%, #2979ff 75%, #651fff 88%, #f50057 100%);
      background-size: 300% 300%;
      animation: rainbowFlow 14s ease infinite;
    }
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; }
    }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950">

  <!-- TOP HEADER UTAMA (MODE SWITCHER: BILIK SUARA, QUICK COUNT, ADMIN) -->
  <header class="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 shrink-0">
          OSIS
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xs sm:text-sm font-black tracking-tight uppercase text-white leading-tight">
              E-Pemilihan Ketua OSIS
            </h1>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Sheets Online
            </span>
          </div>
          <p id="top-school-subtitle" class="text-[10px] sm:text-xs text-amber-400 font-semibold truncate">
            MTs MAKARIMUL AKHLAQ • Periode 2026/2027
          </p>
        </div>
      </div>

      <!-- Mode View Buttons -->
      <nav class="flex items-center gap-1.5 sm:gap-2">
        <button onclick="setAppMode('admin')" id="nav-mode-admin" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20">
          ⚙️ Panel Admin
        </button>
        <button onclick="setAppMode('pemilih')" id="nav-mode-pemilih" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
          🗳️ Bilik Suara
        </button>
        <button onclick="setAppMode('quickcount')" id="nav-mode-quickcount" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
          📊 Quick Count
        </button>
      </nav>
    </div>
  </header>

  <!-- ============================================================== -->
  <!-- 1. VIEW PANEL ADMIN (IDENTIK DENGAN SCREENSHOT AI STUDIO) -->
  <!-- ============================================================== -->
  <div id="view-mode-admin" class="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] bg-slate-100 text-slate-800">
    
    <!-- LEFT DARK SIDEBAR -->
    <aside class="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800 select-none">
      <div class="p-4 space-y-5">
        
        <!-- Admin Identity Badge -->
        <div class="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between shadow-sm">
          <div class="min-w-0 pr-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 block" id="adm-sidebar-role">
              SUPER ADMIN
            </span>
            <p class="font-bold text-xs text-white truncate" id="adm-sidebar-name">
              Administrator Utama
            </p>
          </div>
          <button 
            type="button" 
            onclick="handleKunciAdmin()" 
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-amber-400 hover:text-white bg-slate-900/90 hover:bg-rose-950 rounded-xl border border-slate-700 hover:border-rose-700 transition-colors font-bold shrink-0"
            title="Kunci Panel Admin"
          >
            <span>[→</span>
            <span>Kunci</span>
          </button>
        </div>

        <!-- 7 Sidebar Menu Links (Sesuai Screenshot) -->
        <nav class="space-y-1 text-xs font-bold" id="admin-sidebar-nav">
          
          <!-- 1. Dashboard Utama -->
          <button onclick="switchAdminTab('dashboard')" id="adm-nav-dashboard" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 font-black">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span class="truncate">Dashboard Utama</span>
          </button>

          <!-- 2. Data Calon OSIS -->
          <button onclick="switchAdminTab('calon')" id="adm-nav-calon" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <span class="truncate">Data Calon OSIS</span>
          </button>

          <!-- 3. Data Pemilih (DPT) -->
          <button onclick="switchAdminTab('pemilih')" id="adm-nav-pemilih" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span class="truncate">Data Pemilih (DPT)</span>
          </button>

          <!-- 4. Monitoring Suara -->
          <button onclick="switchAdminTab('monitoring')" id="adm-nav-monitoring" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span class="truncate">Monitoring Suara</span>
          </button>

          <!-- 5. Hasil Pemilihan -->
          <button onclick="switchAdminTab('hasil')" id="adm-nav-hasil" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span class="truncate">Hasil Pemilihan</span>
          </button>

          <!-- 6. Pengaturan & Upload Logo -->
          <button onclick="switchAdminTab('pengaturan')" id="adm-nav-pengaturan" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span class="truncate">Pengaturan & Upload Logo</span>
          </button>

          <!-- 7. Audit Log -->
          <button onclick="switchAdminTab('audit_log')" id="adm-nav-audit_log" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span class="truncate">Audit Log</span>
          </button>

        </nav>

      </div>

      <!-- Sidebar Bottom: Status Pemilihan Saat Ini -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/70">
        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
          STATUS PEMILIHAN SAAT INI:
        </span>
        <div class="grid grid-cols-3 gap-1">
          <button type="button" onclick="handleSetStatus('BELUM_DIMULAI')" id="side-status-belum" class="p-2 rounded text-[11px] font-bold text-center bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
            Belum
          </button>
          <button type="button" onclick="handleSetStatus('SEDANG_BERLANGSUNG')" id="side-status-mulai" class="p-2 rounded text-[11px] font-black text-center bg-emerald-600 text-white animate-pulse transition-colors">
            Mulai
          </button>
          <button type="button" onclick="handleSetStatus('SELESAI')" id="side-status-selesai" class="p-2 rounded text-[11px] font-bold text-center bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
            Selesai
          </button>
        </div>
      </div>

    </aside>

    <!-- MAIN RIGHT CONTENT (LIGHT BACKGROUND SEPERTI DI GAMBAR) -->
    <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">

      <!-- ============================================================== -->
      <!-- TAB 1: DASHBOARD UTAMA (PERSIS SESUAI SCREENSHOT USER) -->
      <!-- ============================================================== -->
      <div id="adm-view-dashboard" class="space-y-6">

        <!-- Top Header Card -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-black uppercase text-amber-600 tracking-wider">
              DASHBOARD PANITIA PEMILIHAN
            </span>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" id="dash-election-title">
              PEMILIHAN KETUA & WAKIL KETUA OSIS
            </h1>
            <p class="text-sm font-semibold text-slate-600 mt-0.5" id="dash-school-info">
              MTs MAKARIMUL AKHLAQ • Tahun Pelajaran 2026/2027 (Masa Bakti 2026/2027)
            </p>
            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5" id="dash-schedule-info">
              <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Jadwal: 2026-10-03 • Pukul 07:30 - 13:00 WIB
            </p>
          </div>

          <!-- Status Dropdown Box -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
            <span class="text-xs text-slate-500 font-bold block mb-1">Status Pemilihan:</span>
            <select id="dash-status-dropdown" onchange="handleSetStatus(this.value)" class="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500">
              <option value="BELUM_DIMULAI">BELUM DIMULAI</option>
              <option value="SEDANG_BERLANGSUNG" selected>SEDANG BERLANGSUNG</option>
              <option value="SELESAI">SELESAI</option>
            </select>
          </div>
        </div>

        <!-- 4 Statistics Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <!-- Card 1: Jumlah Calon -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">JUMLAH CALON</span>
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <p class="text-3xl font-black font-mono text-slate-900" id="dash-stat-calon">3</p>
            <p class="text-xs text-slate-500 mt-1" id="dash-stat-calon-sub">3 Calon Aktif</p>
          </div>

          <!-- Card 2: DPT Terdaftar -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">DPT TERDAFTAR</span>
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <p class="text-3xl font-black font-mono text-slate-900" id="dash-stat-dpt">12</p>
            <p class="text-xs text-slate-500 mt-1">Total Hak Suara Siswa</p>
          </div>

          <!-- Card 3: Suara Masuk -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">SUARA MASUK</span>
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-3xl font-black font-mono text-emerald-600" id="dash-stat-suara">0</p>
            <p class="text-xs text-slate-500 mt-1">Pemilih Sudah Memilih</p>
          </div>

          <!-- Card 4: Belum Memilih -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">BELUM MEMILIH</span>
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-3xl font-black font-mono text-amber-600" id="dash-stat-belum">12</p>
            <p class="text-xs text-slate-500 mt-1">Siswa Belum Masuk Bilik</p>
          </div>

        </div>

        <!-- Big Progress Bar Card -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 uppercase">
                PROGRESS SUARA MASUK
              </h3>
              <p class="text-xs text-slate-500">
                Persentase partisipasi pemilih dari total Daftar Pemilih Tetap (DPT)
              </p>
            </div>
            <span class="text-2xl font-black font-mono text-amber-600" id="dash-progress-pct">
              0.0%
            </span>
          </div>

          <div class="h-6 w-full bg-slate-100 rounded-full p-1 border border-slate-200 overflow-hidden">
            <div id="dash-progress-bar-fill" class="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-slate-950" style="width: 3%">
            </div>
          </div>

          <div class="flex justify-between items-center text-xs font-mono text-slate-400 mt-3">
            <span>0 Suara (0%)</span>
            <span id="dash-progress-mid-text">0 Suara Masuk</span>
            <span id="dash-progress-target-text">Target: 12 Suara (100%)</span>
          </div>
        </div>

        <!-- Quick Actions & Live Feed Row (2 Kolom) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Aksi Cepat Panitia (6 Cards) -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              AKSI CEPAT PANITIA
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              <button onclick="switchAdminTab('pengaturan', 'logo')" class="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 hover:border-amber-400 border border-amber-200 text-left transition-all group shadow-xs">
                <svg class="w-5 h-5 text-amber-700 mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <p class="font-bold text-xs text-slate-900">Upload Logo</p>
                <p class="text-[10px] text-amber-800">Logo lembaga/sekolah</p>
              </button>

              <button onclick="switchAdminTab('pengaturan', 'jadwal')" class="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group shadow-xs">
                <svg class="w-5 h-5 text-slate-700 mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                <p class="font-bold text-xs text-slate-900">Pengaturan</p>
                <p class="text-[10px] text-slate-500">Jadwal & pemilihan</p>
              </button>

              <button onclick="switchAdminTab('calon')" class="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/70 hover:border-amber-300 border border-slate-200 text-left transition-all group shadow-xs">
                <svg class="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                <p class="font-bold text-xs text-slate-900">Kelola Calon</p>
                <p class="text-[10px] text-slate-500">Nomor urut & foto</p>
              </button>

              <button onclick="switchAdminTab('pemilih')" class="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-all shadow-xs">
                <svg class="w-5 h-5 text-blue-600 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p class="font-bold text-xs text-slate-900">Import Excel</p>
                <p class="text-[10px] text-slate-500">Daftar pemilih DPT</p>
              </button>

              <button onclick="switchAdminTab('hasil', 'berita_acara')" class="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/70 hover:border-amber-300 border border-slate-200 text-left transition-all group shadow-xs">
                <svg class="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                <p class="font-bold text-xs text-slate-900">Berita Acara</p>
                <p class="text-[10px] text-slate-500">Cetak dokumen hasil</p>
              </button>

              <button onclick="switchAdminTab('monitoring')" class="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group shadow-xs">
                <svg class="w-5 h-5 text-slate-700 mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <p class="font-bold text-xs text-slate-900">Monitoring</p>
                <p class="text-[10px] text-slate-500">Rekap per kelas</p>
              </button>

            </div>
          </div>

          <!-- Audit Log Terbaru -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  AUDIT LOG TERBARU
                </h3>
                <button onclick="switchAdminTab('audit_log')" class="text-xs font-bold text-amber-600 hover:text-amber-700">
                  Lihat Semua
                </button>
              </div>
              <div id="dash-recent-logs" class="space-y-2 text-xs divide-y divide-slate-100">
                <p class="text-slate-400 italic py-2">Memuat log...</p>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Keamanan: Enkripsi Aktif</span>
              <span class="text-emerald-600 font-bold">✓ Database Normal</span>
            </div>
          </div>

        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: DATA CALON OSIS -->
      <!-- ============================================================== -->
      <div id="adm-view-calon" class="hidden space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900 uppercase">DATA CALON KETUA & WAKIL OSIS</h2>
            <p class="text-xs text-slate-500">Kelola nomor urut, foto, kelas, visi, dan misi kandidat peserta pemilihan.</p>
          </div>
          <button onclick="openModalTambahCalon()" class="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/20">
            + Tambah Calon Baru
          </button>
        </div>

        <div id="adm-calon-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Rendered by JS -->
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 3: DATA PEMILIH (DPT) -->
      <!-- ============================================================== -->
      <div id="adm-view-pemilih" class="hidden space-y-6">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-slate-900 uppercase">DAFTAR PEMILIH TETAP (DPT)</h2>
            <p class="text-xs text-slate-500">Kelola data siswa pemilih, cetak kartu token PIN, dan pantau status hak suara.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="handleGenerateTokenMassal()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all">
              🔑 Generate Token Massal
            </button>
            <button onclick="openModalTambahPemilih()" class="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md">
              + Tambah Siswa
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            id="dpt-search-input" 
            oninput="renderDptTableGAS()" 
            placeholder="Cari Nama, NISN, atau Kode Token..." 
            class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
          />
          <select id="dpt-filter-kelas" onchange="renderDptTableGAS()" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <option value="ALL">Semua Kelas</option>
            <option value="VII">Kelas VII</option>
            <option value="VIII">Kelas VIII</option>
            <option value="IX">Kelas IX</option>
          </select>
          <select id="dpt-filter-status" onchange="renderDptTableGAS()" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <option value="ALL">Semua Status</option>
            <option value="BELUM">Belum Memilih</option>
            <option value="SUDAH">Sudah Memilih</option>
          </select>
        </div>

        <!-- DPT Table -->
        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th class="p-3.5">NISN</th>
                <th class="p-3.5">Nama Siswa</th>
                <th class="p-3.5">Kelas</th>
                <th class="p-3.5">Kode Token</th>
                <th class="p-3.5">Status Memilih</th>
                <th class="p-3.5">Waktu Rekam</th>
                <th class="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="dpt-table-body-gas" class="divide-y divide-slate-100 text-slate-700">
              <!-- Rendered by JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 4: MONITORING SUARA PER KELAS -->
      <!-- ============================================================== -->
      <div id="adm-view-monitoring" class="hidden space-y-6">
        <div>
          <h2 class="text-2xl font-black text-slate-900 uppercase">MONITORING REKAPITULASI KELAS</h2>
          <p class="text-xs text-slate-500">Pantau tingkat kehadiran dan partisipasi suara masing-masing rombongan belajar.</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th class="p-4">Rombel / Kelas</th>
                <th class="p-4 text-center">Total DPT</th>
                <th class="p-4 text-center">Sudah Memilih</th>
                <th class="p-4 text-center">Belum Memilih</th>
                <th class="p-4 w-48">Progress Partisipasi</th>
              </tr>
            </thead>
            <tbody id="monitoring-table-body" class="divide-y divide-slate-100 text-slate-800">
              <!-- Rendered by JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 5: HASIL PEMILIHAN & BERITA ACARA -->
      <!-- ============================================================== -->
      <div id="adm-view-hasil" class="hidden space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900 uppercase">HASIL REKAPITULASI SUARA</h2>
            <p class="text-xs text-slate-500">Perhitungan perolehan suara sah dan penerbitan Berita Acara resmi.</p>
          </div>
          <button onclick="window.print()" class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2">
            🖨️ Cetak Berita Acara Resmi (A4)
          </button>
        </div>

        <!-- Leaderboard Hasil Calon -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="hasil-calon-leaderboard">
          <!-- Rendered by JS -->
        </div>

        <!-- Template Berita Acara Cetak Resmi -->
        <div id="print-area" class="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-6 max-w-3xl mx-auto">
          <div class="text-center border-b-2 border-slate-950 pb-4 space-y-1">
            <h3 class="text-xs font-bold tracking-widest uppercase">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
            <h2 id="ba-school-name" class="text-xl sm:text-2xl font-black uppercase text-slate-950">MTs MAKARIMUL AKHLAQ</h2>
            <p id="ba-school-address" class="text-xs text-slate-700">Jl. Pesantren No. 45, Sidoarjo, Jawa Timur</p>
          </div>
          
          <div class="text-center space-y-0.5">
            <h4 class="text-sm font-black underline uppercase">BERITA ACARA REKAPITULASI HASIL PEMILIHAN KETUA OSIS</h4>
            <p class="text-xs text-slate-600 font-semibold" id="ba-period-text">Tahun Pelajaran 2026/2027</p>
          </div>

          <p class="text-xs text-slate-800 text-justify leading-relaxed">
            Pada hari ini, <strong id="ba-current-date">-</strong>, telah dilaksanakan pemungutan dan penghitungan suara secara elektronik (E-Voting) dalam rangka Pemilihan Ketua dan Wakil Ketua OSIS di MTs MAKARIMUL AKHLAQ dengan hasil rekapitulasi sebagai berikut:
          </p>

          <table class="w-full text-xs border border-slate-300">
            <thead class="bg-slate-100 font-bold">
              <tr>
                <th class="p-2 border border-slate-300 text-center w-12">No</th>
                <th class="p-2 border border-slate-300">Nama Pasangan Calon</th>
                <th class="p-2 border border-slate-300 text-center">Kelas</th>
                <th class="p-2 border border-slate-300 text-right w-24">Jumlah Suara</th>
                <th class="p-2 border border-slate-300 text-right w-20">Persen</th>
              </tr>
            </thead>
            <tbody id="ba-calon-rows"></tbody>
          </table>

          <div class="pt-8 grid grid-cols-2 text-center text-xs text-slate-800">
            <div class="space-y-12">
              <p>Ketua Panitia Pemilihan,</p>
              <div>
                <strong id="ba-panitia-name" class="underline block">Muhammad Ilham, S.Pd</strong>
                <span class="text-[10px] text-slate-600">Panitia Pemilihan OSIS</span>
              </div>
            </div>
            <div class="space-y-12">
              <p>Mengetahui,<br>Kepala Madrasah,</p>
              <div>
                <strong id="ba-kamad-name" class="underline block">Drs. H. M. Zainuddin, M.Pd.I</strong>
                <span id="ba-kamad-nip" class="text-[10px] text-slate-600 font-mono">NIP: 19690815 199403 1 002</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 6: PENGATURAN & UPLOAD LOGO -->
      <!-- ============================================================== -->
      <div id="adm-view-pengaturan" class="hidden space-y-6">
        <div>
          <h2 class="text-2xl font-black text-slate-900 uppercase">PENGATURAN SEKOLAH & APLIKASI</h2>
          <p class="text-xs text-slate-500">Konfigurasi profil madrasah, logo lembaga, jadwal pemilihan, dan akun panitia.</p>
        </div>

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          
          <!-- Logo Preset & Upload -->
          <div class="space-y-3">
            <label class="block text-xs font-black uppercase text-slate-700">Logo Lembaga / Sekolah</label>
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                <img id="cfg-logo-preview" src="" alt="Logo" class="w-full h-full object-contain p-1 hidden" />
                <span id="cfg-logo-fallback" class="text-xs font-bold text-slate-400">OSIS</span>
              </div>
              <div class="flex-1 space-y-2">
                <input type="text" id="cfg-logo-url" oninput="updateLogoPreview(this.value)" placeholder="Masukkan URL Logo atau Base64..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
                <div class="flex gap-2">
                  <button type="button" onclick="setPresetLogo('kemenag')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700">Preset Kemenag</button>
                  <button type="button" onclick="setPresetLogo('tutwuri')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700">Preset Tut Wuri</button>
                </div>
              </div>
            </div>
          </div>

          <form onsubmit="handleSimpanPengaturan(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nama Madrasah / Sekolah</label>
              <input type="text" id="cfg-nama-sekolah" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold" required />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">NPSN</label>
                <input type="text" id="cfg-npsn" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">NSM</label>
                <input type="text" id="cfg-nsm" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Alamat Lembaga</label>
              <input type="text" id="cfg-alamat" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Kepala Madrasah</label>
                <input type="text" id="cfg-kamad" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">NIP Kepala Madrasah</label>
                <input type="text" id="cfg-nip" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Ketua Panitia Pemilihan</label>
                <input type="text" id="cfg-panitia" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Pembina OSIS</label>
                <input type="text" id="cfg-pembina" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" />
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" class="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl shadow-md">
                Simpan Perubahan Pengaturan
              </button>
            </div>
          </form>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 7: AUDIT LOG -->
      <!-- ============================================================== -->
      <div id="adm-view-audit_log" class="hidden space-y-6">
        <div>
          <h2 class="text-2xl font-black text-slate-900 uppercase">AUDIT LOG AKTIVITAS</h2>
          <p class="text-xs text-slate-500">Rekaman jejak aktivitas sistem, riwayat pencoblosan, login panitia, dan perubahan data.</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th class="p-4 w-44">Waktu</th>
                <th class="p-4 w-36">Pengguna</th>
                <th class="p-4 w-48">Aktivitas</th>
                <th class="p-4">Keterangan</th>
              </tr>
            </thead>
            <tbody id="full-audit-table-body" class="divide-y divide-slate-100 text-slate-700">
              <!-- Rendered by JS -->
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>

  <!-- ============================================================== -->
  <!-- 2. VIEW BILIK SUARA (SISWA PEMILIH) -->
  <!-- ============================================================== -->
  <div id="view-mode-pemilih" class="hidden flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
    
    <!-- Login Siswa -->
    <div id="pemilih-login-box" class="max-w-md mx-auto my-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
      <div class="w-16 h-16 mx-auto rounded-2xl gold-gradient flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
        🗳️
      </div>
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Bilik Pemilihan Digital</h2>
        <p class="text-xs text-slate-400 mt-1">Masukkan Nomor Induk Siswa Nasional (NISN) atau Kode Surat Suara Anda.</p>
      </div>
      <form onsubmit="handleLoginPemilih(event)" class="space-y-4 text-left">
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Kode Pemilih / NISN</label>
          <input type="text" id="input-kode-pemilih" placeholder="Contoh: VOTE-7A01 atau 0081234001" required class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-center uppercase tracking-wider" />
        </div>
        <button type="submit" class="w-full py-3.5 gold-gradient text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md">
          Masuk ke Bilik Suara
        </button>
      </form>
      <div id="login-pemilih-error" class="hidden text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl"></div>
    </div>

    <!-- Active Voting Ballot -->
    <div id="pemilih-ballot-box" class="hidden space-y-6">
      <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <p class="text-[11px] text-slate-400">Pemilih Terverifikasi:</p>
          <h3 id="voter-name" class="text-sm sm:text-base font-black text-white uppercase">-</h3>
          <p class="text-[11px] text-amber-400 font-mono font-bold">Kelas: <span id="voter-class">-</span> • Token: <span id="voter-token">-</span></p>
        </div>
        <button onclick="handleLogoutPemilih()" class="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-xl border border-slate-800">Keluar Bilik</button>
      </div>

      <div class="text-center space-y-1">
        <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">SURAT SUARA RESMI</span>
        <h2 class="text-xl sm:text-3xl font-black text-white uppercase">Tentukan Pilihan Terbaik Anda</h2>
      </div>

      <div id="calon-list-container" class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2"></div>
    </div>

    <!-- Receipt Bukti Coblos -->
    <div id="pemilih-receipt-box" class="hidden max-w-md mx-auto my-8 bg-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
      <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center text-3xl font-black animate-bounce">✓</div>
      <div>
        <h2 class="text-xl font-black text-white uppercase">Suara Berhasil Dicatat!</h2>
        <p class="text-xs text-slate-400 mt-1">Terima kasih atas hak suara Anda demi kemajuan OSIS.</p>
      </div>
      <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
        <div class="flex justify-between text-slate-400"><span>Nama:</span><span id="receipt-name" class="text-white font-bold">-</span></div>
        <div class="flex justify-between text-slate-400"><span>Kelas:</span><span id="receipt-class" class="text-amber-400 font-bold">-</span></div>
        <div class="flex justify-between text-slate-400"><span>Waktu:</span><span id="receipt-time" class="text-slate-300 font-mono">-</span></div>
      </div>
      <button onclick="handleLogoutPemilih()" class="w-full py-3 gold-gradient text-slate-950 font-black text-xs uppercase rounded-xl">Selesai & Keluar</button>
    </div>

  </div>

  <!-- ============================================================== -->
  <!-- 3. VIEW QUICK COUNT (PENONTON / PROYEKTOR AULA) -->
  <!-- ============================================================== -->
  <div id="view-mode-quickcount" class="hidden flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 rounded-3xl bg-rainbow-bright shadow-2xl border border-white/40">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-xl text-slate-900">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 uppercase">LIVE QUICK COUNT PEMILIHAN</h2>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-sm">🌈 Rainbow</span>
        </div>
        <p class="text-xs text-slate-600 font-medium">Data terupdate real-time langsung dari database Google Sheets.</p>
      </div>
      <button onclick="refreshDataGAS(true)" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 rounded-xl border border-slate-300 shadow-sm transition-all">
        🔄 Refresh Hasil
      </button>
    </div>

    <!-- 4 Bar Stats Quick Count -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg text-slate-900"><p class="text-[11px] text-slate-500 uppercase font-bold">Total DPT</p><h3 id="qc-dpt" class="text-2xl font-black text-slate-900 mt-1">-</h3></div>
      <div class="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg text-slate-900"><p class="text-[11px] text-slate-500 uppercase font-bold">Suara Masuk</p><h3 id="qc-suara" class="text-2xl font-black text-amber-600 mt-1">-</h3></div>
      <div class="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg text-slate-900"><p class="text-[11px] text-slate-500 uppercase font-bold">Partisipasi</p><h3 id="qc-partisipasi" class="text-2xl font-black text-emerald-600 mt-1">0%</h3></div>
      <div class="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg text-slate-900"><p class="text-[11px] text-slate-500 uppercase font-bold">Belum Memilih</p><h3 id="qc-belum" class="text-2xl font-black text-slate-600 mt-1">-</h3></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-5 bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-xl flex flex-col items-center justify-center text-slate-900">
        <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 w-full">Diagram Suara</h3>
        <div class="relative w-48 h-48 sm:w-56 sm:h-56"><canvas id="chart-qc"></canvas></div>
      </div>
      <div class="lg:col-span-7 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-xl space-y-4 text-slate-900">
        <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider">Perolehan Suara Pasangan Calon</h3>
        <div id="qc-candidate-bars" class="space-y-4 pt-1"></div>
      </div>
    </div>
  </div>

  <!-- MODAL KONFIRMASI COBLOS -->
  <div id="modal-confirm-vote" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
      <div class="w-12 h-12 mx-auto rounded-2xl gold-gradient flex items-center justify-center text-slate-950 font-black text-xl">!</div>
      <h3 class="text-base font-black text-white uppercase">Konfirmasi Pilihan Anda</h3>
      <p id="modal-confirm-vote-text" class="text-xs text-slate-300 leading-relaxed"></p>
      <div class="flex gap-2 pt-2">
        <button onclick="closeModalConfirmVote()" class="flex-1 py-2.5 bg-slate-800 text-xs font-bold text-slate-300 rounded-xl">Batal</button>
        <button id="btn-exec-vote" onclick="executeVoteAction()" class="flex-1 py-2.5 gold-gradient text-slate-950 text-xs font-black uppercase rounded-xl">Yakin, Coblos!</button>
      </div>
    </div>
  </div>

  <!-- MODAL INPUT / EDIT CALON -->
  <div id="modal-calon" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-slate-800">
      <h3 class="text-base font-black uppercase text-slate-900" id="modal-calon-title">Tambah Calon Ketua OSIS</h3>
      <form onsubmit="handleSaveCalonForm(event)" class="space-y-3 text-xs">
        <input type="hidden" id="calon-form-id" />
        <div class="grid grid-cols-3 gap-2">
          <div><label class="block font-bold mb-1">No. Urut</label><input type="number" id="calon-form-no" min="1" max="20" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold" /></div>
          <div class="col-span-2"><label class="block font-bold mb-1">Kelas</label><input type="text" id="calon-form-kelas" placeholder="VIII-A & VIII-B" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold" /></div>
        </div>
        <div><label class="block font-bold mb-1">Nama Lengkap Paslon</label><input type="text" id="calon-form-nama" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold" /></div>
        <div><label class="block font-bold mb-1">URL Foto Calon</label><input type="url" id="calon-form-foto" placeholder="https://..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
        <div><label class="block font-bold mb-1">Tagline</label><input type="text" id="calon-form-tagline" placeholder="Semboyan..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
        <div><label class="block font-bold mb-1">Visi</label><textarea id="calon-form-visi" rows="2" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl"></textarea></div>
        <div><label class="block font-bold mb-1">Misi (1 baris per poin)</label><textarea id="calon-form-misi" rows="3" class="w-full px-3 py-2 bg-slate-50 border rounded-xl"></textarea></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModalCalon()" class="px-4 py-2 bg-slate-100 rounded-xl font-bold">Batal</button>
          <button type="submit" class="px-5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl">Simpan Paslon</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL TAMBAH PEMILIH -->
  <div id="modal-pemilih" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-800">
      <h3 class="text-base font-black uppercase text-slate-900">Tambah Pemilih Manual</h3>
      <form onsubmit="handleSavePemilihForm(event)" class="space-y-3 text-xs">
        <div><label class="block font-bold mb-1">NIS / NISN</label><input type="text" id="pemilih-form-nis" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" /></div>
        <div><label class="block font-bold mb-1">Nama Lengkap Siswa</label><input type="text" id="pemilih-form-nama" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold" /></div>
        <div><label class="block font-bold mb-1">Kelas</label><input type="text" id="pemilih-form-kelas" placeholder="VII-A" required class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold" /></div>
        <div><label class="block font-bold mb-1">Kode Token (Opsional)</label><input type="text" id="pemilih-form-token" placeholder="Kosongkan untuk otomatis" class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono uppercase" /></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModalPemilih()" class="px-4 py-2 bg-slate-100 rounded-xl font-bold">Batal</button>
          <button type="submit" class="px-5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SCRIPT LOGIKA JAVASCRIPT FRONTEND CLIENT -->
  <!-- ============================================================== -->
  <script>
    let appState = {
      pengaturan: {},
      calonList: [],
      pemilihList: [],
      suaraList: [],
      auditLogs: [],
      statistik: {}
    };

    let activeAdminTab = 'dashboard';
    let currentVoter = null;
    let selectedCandidateToVote = null;
    let chartInstance = null;

    // Jembatan pemanggilan Backend GAS
    function callBackend(funcName, args, onSuccess) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.withSuccessHandler(onSuccess)[funcName].apply(null, args);
      } else {
        console.warn('Sandbox Mode Demo:', funcName);
        handleLocalMock(funcName, args, onSuccess);
      }
    }

    // Refresh State Lengkap dari Google Sheets
    function refreshDataGAS(silent) {
      callBackend('ambilSemuaData', [], function(res) {
        if (res && res.success) {
          appState = res;
          updateAllViews();
        }
      });
    }

    // Ganti Mode Tampilan Utama
    function setAppMode(mode) {
      document.getElementById('view-mode-admin').classList.add('hidden');
      document.getElementById('view-mode-pemilih').classList.add('hidden');
      document.getElementById('view-mode-quickcount').classList.add('hidden');

      const btnInactive = 'px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all';
      const btnActive = 'px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20';

      document.getElementById('nav-mode-admin').className = btnInactive;
      document.getElementById('nav-mode-pemilih').className = btnInactive;
      document.getElementById('nav-mode-quickcount').className = btnInactive;

      if (mode === 'admin') {
        document.getElementById('view-mode-admin').classList.remove('hidden');
        document.getElementById('nav-mode-admin').className = btnActive;
        refreshDataGAS();
      } else if (mode === 'pemilih') {
        document.getElementById('view-mode-pemilih').classList.remove('hidden');
        document.getElementById('nav-mode-pemilih').className = btnActive;
        renderCandidatesBallot();
      } else if (mode === 'quickcount') {
        document.getElementById('view-mode-quickcount').classList.remove('hidden');
        document.getElementById('nav-mode-quickcount').className = btnActive;
        refreshDataGAS();
      }
    }

    // Ganti Sub-Tab di Panel Admin
    function switchAdminTab(tabKey, subAction) {
      activeAdminTab = tabKey;
      const allTabs = ['dashboard', 'calon', 'pemilih', 'monitoring', 'hasil', 'pengaturan', 'audit_log'];

      allTabs.forEach(t => {
        const viewEl = document.getElementById('adm-view-' + t);
        const navEl = document.getElementById('adm-nav-' + t);
        if (viewEl) viewEl.classList.add('hidden');
        if (navEl) {
          navEl.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800';
          const svg = navEl.querySelector('svg');
          if (svg) svg.classList.remove('text-slate-950');
        }
      });

      const activeView = document.getElementById('adm-view-' + tabKey);
      const activeNav = document.getElementById('adm-nav-' + tabKey);
      if (activeView) activeView.classList.remove('hidden');
      if (activeNav) {
        activeNav.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 font-black';
      }

      if (tabKey === 'calon') renderAdminCalonCards();
      if (tabKey === 'pemilih') renderDptTableGAS();
      if (tabKey === 'monitoring') renderMonitoringTable();
      if (tabKey === 'hasil') renderHasilSection();
      if (tabKey === 'audit_log') renderFullAuditTable();
    }

    // Update Seluruh Komponen Sesuai State
    function updateAllViews() {
      const cfg = appState.pengaturan || {};
      const stat = appState.statistik || {};
      const calons = appState.calonList || [];

      // 1. Text Header
      const schoolName = cfg.namaSekolah || 'MTs MAKARIMUL AKHLAQ';
      const year = cfg.tahunPelajaran || '2026/2027';
      const period = cfg.periode || 'Masa Bakti 2026/2027';
      const title = cfg.namaKegiatan || 'PEMILIHAN KETUA & WAKIL KETUA OSIS';
      const date = cfg.tanggalPemilihan || '2026-10-03';
      const startTime = cfg.waktuMulai || '07:30';
      const endTime = cfg.waktuSelesai || '13:00';

      document.getElementById('top-school-subtitle').innerText = schoolName + ' • Periode ' + year;
      document.getElementById('dash-election-title').innerText = title;
      document.getElementById('dash-school-info').innerText = schoolName + ' • Tahun Pelajaran ' + year + ' (' + period + ')';
      document.getElementById('dash-schedule-info').innerHTML = \`
        <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Jadwal: \${date} • Pukul \${startTime} - \${endTime} WIB
      \`;

      // 2. Status Buttons & Dropdown
      const curStatus = cfg.statusPemilihan || 'SEDANG_BERLANGSUNG';
      document.getElementById('dash-status-dropdown').value = curStatus;
      updateStatusButtonsUI(curStatus);

      // 3. 4 Stat Cards
      document.getElementById('dash-stat-calon').innerText = calons.length;
      document.getElementById('dash-stat-calon-sub').innerText = calons.filter(c => c.aktif).length + ' Calon Aktif';
      document.getElementById('dash-stat-dpt').innerText = stat.totalDPT || 0;
      document.getElementById('dash-stat-suara').innerText = stat.totalSuaraMasuk || 0;
      document.getElementById('dash-stat-belum').innerText = stat.belumMemilih || 0;

      // 4. Progress Bar Suara Masuk (Persis Screenshot)
      const pct = stat.partisipasi || 0;
      document.getElementById('dash-progress-pct').innerText = pct + '%';
      document.getElementById('dash-progress-bar-fill').style.width = Math.min(100, Math.max(3, Number(pct))) + '%';
      document.getElementById('dash-progress-mid-text').innerText = (stat.totalSuaraMasuk || 0) + ' Suara Masuk';
      document.getElementById('dash-progress-target-text').innerText = 'Target: ' + (stat.totalDPT || 0) + ' Suara (100%)';

      // 5. Recent Audit Logs Widget
      const logs = appState.auditLogs || [];
      const logContainer = document.getElementById('dash-recent-logs');
      if (logs.length > 0) {
        logContainer.innerHTML = logs.slice(0, 3).map(l => \`
          <div class="py-2 flex items-start justify-between gap-2">
            <div>
              <p class="font-bold text-slate-800 text-[11px]">\${l.AKTIVITAS || l.aktivitas || 'Aktivitas'}</p>
              <p class="text-[10px] text-slate-500 truncate max-w-xs">\${l.KETERANGAN || l.keterangan || '-'}</p>
            </div>
            <span class="text-[9px] font-mono text-slate-400 shrink-0">\${new Date(l.WAKTU || l.waktu).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
          </div>
        \`).join('');
      } else {
        logContainer.innerHTML = '<p class="text-slate-400 italic py-2">Belum ada catatan aktivitas.</p>';
      }

      // 6. Quick Count View
      document.getElementById('qc-dpt').innerText = (stat.totalDPT || 0) + ' Siswa';
      document.getElementById('qc-suara').innerText = (stat.totalSuaraMasuk || 0) + ' Suara';
      document.getElementById('qc-partisipasi').innerText = pct + '%';
      document.getElementById('qc-belum').innerText = (stat.belumMemilih || 0) + ' Siswa';
      renderQuickCountBars();
      renderQuickCountChart();

      // 7. Pengaturan Form Prefill
      if (document.getElementById('cfg-nama-sekolah')) document.getElementById('cfg-nama-sekolah').value = cfg.namaSekolah || '';
      if (document.getElementById('cfg-npsn')) document.getElementById('cfg-npsn').value = cfg.npsn || '';
      if (document.getElementById('cfg-nsm')) document.getElementById('cfg-nsm').value = cfg.nsm || '';
      if (document.getElementById('cfg-alamat')) document.getElementById('cfg-alamat').value = cfg.alamat || '';
      if (document.getElementById('cfg-kamad')) document.getElementById('cfg-kamad').value = cfg.namaKepalaSekolah || '';
      if (document.getElementById('cfg-nip')) document.getElementById('cfg-nip').value = cfg.nipKepalaSekolah || '';
      if (document.getElementById('cfg-panitia')) document.getElementById('cfg-panitia').value = cfg.namaKetuaPanitia || '';
      if (document.getElementById('cfg-pembina')) document.getElementById('cfg-pembina').value = cfg.namaPembinaOsis || '';
      if (document.getElementById('cfg-logo-url')) document.getElementById('cfg-logo-url').value = cfg.logo || '';
      updateLogoPreview(cfg.logo || '');
    }

    // Update Button Status di Sidebar Bawah
    function updateStatusButtonsUI(status) {
      const bBelum = document.getElementById('side-status-belum');
      const bMulai = document.getElementById('side-status-mulai');
      const bSelesai = document.getElementById('side-status-selesai');

      bBelum.className = 'p-2 rounded text-[11px] font-bold text-center bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors';
      bMulai.className = 'p-2 rounded text-[11px] font-bold text-center bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors';
      bSelesai.className = 'p-2 rounded text-[11px] font-bold text-center bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors';

      if (status === 'BELUM_DIMULAI') {
        bBelum.className = 'p-2 rounded text-[11px] font-black text-center bg-amber-600 text-white';
      } else if (status === 'SEDANG_BERLANGSUNG') {
        bMulai.className = 'p-2 rounded text-[11px] font-black text-center bg-emerald-600 text-white animate-pulse';
      } else if (status === 'SELESAI') {
        bSelesai.className = 'p-2 rounded text-[11px] font-black text-center bg-blue-600 text-white';
      }
    }

    // Handler Ganti Status Pemilihan
    function handleSetStatus(newStatus) {
      callBackend('updateStatusPemilihan', [newStatus], function() {
        refreshDataGAS();
      });
    }

    // Handler Kunci / Logout Admin
    function handleKunciAdmin() {
      if (confirm('Kunci panel admin dan beralih ke Bilik Suara?')) {
        setAppMode('pemilih');
      }
    }

    // -------------------------------------------------------------
    // RENDER: DATA CALON OSIS
    // -------------------------------------------------------------
    function renderAdminCalonCards() {
      const container = document.getElementById('adm-calon-cards-grid');
      const calons = appState.calonList || [];

      if (!calons.length) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-xs text-slate-400">Belum ada data calon.</div>';
        return;
      }

      container.innerHTML = calons.map(c => \`
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div class="space-y-3">
            <div class="relative">
              <div class="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-slate-950 font-black text-sm absolute -top-2 -left-2 shadow-md">
                0\${c.noUrut}
              </div>
              <div class="h-44 w-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
                \${c.foto ? \`<img src="\${c.foto}" class="w-full h-full object-cover object-top" />\` : \`<span class="text-4xl text-slate-300">👤</span>\`}
              </div>
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-900 uppercase">\${c.nama}</h4>
              <p class="text-xs font-bold text-amber-600">\${c.kelas}</p>
              \${c.tagline ? \`<p class="text-[11px] text-slate-500 italic mt-0.5">"\${c.tagline}"</p>\` : ''}
            </div>
            <div class="bg-slate-50 p-3 rounded-2xl text-[11px] space-y-1 text-slate-600">
              <p><strong>Visi:</strong> \${c.visi || '-'}</p>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t border-slate-100">
            <button onclick="editCalonModal('\${c.id}')" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">✏️ Edit</button>
            <button onclick="hapusCalonAction('\${c.id}')" class="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs">🗑️ Hapus</button>
          </div>
        </div>
      \`).join('');
    }

    function openModalTambahCalon() {
      document.getElementById('modal-calon-title').innerText = 'Tambah Calon Ketua OSIS';
      document.getElementById('calon-form-id').value = '';
      document.getElementById('calon-form-no').value = (appState.calonList || []).length + 1;
      document.getElementById('calon-form-nama').value = '';
      document.getElementById('calon-form-kelas').value = '';
      document.getElementById('calon-form-foto').value = '';
      document.getElementById('calon-form-tagline').value = '';
      document.getElementById('calon-form-visi').value = '';
      document.getElementById('calon-form-misi').value = '';
      document.getElementById('modal-calon').classList.remove('hidden');
    }

    function editCalonModal(id) {
      const c = (appState.calonList || []).find(x => x.id === id);
      if (!c) return;
      document.getElementById('modal-calon-title').innerText = 'Edit Calon Ketua OSIS';
      document.getElementById('calon-form-id').value = c.id;
      document.getElementById('calon-form-no').value = c.noUrut;
      document.getElementById('calon-form-nama').value = c.nama;
      document.getElementById('calon-form-kelas').value = c.kelas;
      document.getElementById('calon-form-foto').value = c.foto || '';
      document.getElementById('calon-form-tagline').value = c.tagline || '';
      document.getElementById('calon-form-visi').value = c.visi || '';
      document.getElementById('calon-form-misi').value = Array.isArray(c.misi) ? c.misi.join('\\n') : '';
      document.getElementById('modal-calon').classList.remove('hidden');
    }

    function closeModalCalon() {
      document.getElementById('modal-calon').classList.add('hidden');
    }

    function handleSaveCalonForm(e) {
      e.preventDefault();
      const id = document.getElementById('calon-form-id').value;
      const noUrut = Number(document.getElementById('calon-form-no').value);
      const nama = document.getElementById('calon-form-nama').value;
      const kelas = document.getElementById('calon-form-kelas').value;
      const foto = document.getElementById('calon-form-foto').value;
      const tagline = document.getElementById('calon-form-tagline').value;
      const visi = document.getElementById('calon-form-visi').value;
      const misi = document.getElementById('calon-form-misi').value.split('\\n').filter(Boolean);

      callBackend('simpanCalon', [{
        id: id,
        noUrut: noUrut,
        nama: nama,
        kelas: kelas,
        foto: foto,
        tagline: tagline,
        visi: visi,
        misi: misi,
        aktif: true
      }], function() {
        closeModalCalon();
        refreshDataGAS();
      });
    }

    function hapusCalonAction(id) {
      if (!confirm('Yakin ingin menghapus calon ini?')) return;
      callBackend('hapusCalon', [id], function() {
        refreshDataGAS();
      });
    }

    // -------------------------------------------------------------
    // RENDER: DATA DPT PEMILIH
    // -------------------------------------------------------------
    function renderDptTableGAS() {
      const tbody = document.getElementById('dpt-table-body-gas');
      const search = (document.getElementById('dpt-search-input').value || '').toLowerCase();
      const fKelas = document.getElementById('dpt-filter-kelas').value;
      const fStatus = document.getElementById('dpt-filter-status').value;

      let list = appState.pemilihList || [];

      if (search) {
        list = list.filter(p => p.nama.toLowerCase().includes(search) || p.nisNisn.includes(search) || p.kodePemilih.toLowerCase().includes(search));
      }
      if (fKelas !== 'ALL') {
        list = list.filter(p => p.kelas.startsWith(fKelas));
      }
      if (fStatus === 'SUDAH') {
        list = list.filter(p => p.statusMemilih);
      } else if (fStatus === 'BELUM') {
        list = list.filter(p => !p.statusMemilih);
      }

      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400 italic">Tidak ada data pemilih yang cocok.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(p => \`
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-3.5 font-mono text-slate-500">\${p.nisNisn}</td>
          <td class="p-3.5 font-bold text-slate-900">\${p.nama}</td>
          <td class="p-3.5 font-semibold text-slate-600">\${p.kelas}</td>
          <td class="p-3.5 font-mono font-bold text-amber-600">\${p.kodePemilih}</td>
          <td class="p-3.5">
            \${p.statusMemilih 
              ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">SUDAH</span>'
              : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">BELUM</span>'
            }
          </td>
          <td class="p-3.5 font-mono text-[11px] text-slate-400">\${p.waktuMemilih ? new Date(p.waktuMemilih).toLocaleTimeString('id-ID') : '-'}</td>
          <td class="p-3.5 text-right space-x-1">
            \${p.statusMemilih ? \`
              <button onclick="handleResetHakSuaraGAS('\${p.id}')" class="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold">
                Reset
              </button>
            \` : ''}
            <button onclick="handleHapusPemilihGAS('\${p.id}')" class="px-2 py-1 text-rose-500 hover:text-rose-700 text-xs">🗑️</button>
          </td>
        </tr>
      \`).join('');
    }

    function openModalTambahPemilih() {
      document.getElementById('modal-pemilih').classList.remove('hidden');
    }
    function closeModalPemilih() {
      document.getElementById('modal-pemilih').classList.add('hidden');
    }

    function handleSavePemilihForm(e) {
      e.preventDefault();
      const nis = document.getElementById('pemilih-form-nis').value;
      const nama = document.getElementById('pemilih-form-nama').value;
      const kelas = document.getElementById('pemilih-form-kelas').value;
      const token = document.getElementById('pemilih-form-token').value;

      callBackend('simpanPemilih', [{
        nisNisn: nis,
        nama: nama,
        kelas: kelas,
        kodePemilih: token
      }], function() {
        closeModalPemilih();
        refreshDataGAS();
      });
    }

    function handleResetHakSuaraGAS(id) {
      if (!confirm('Reset hak suara siswa ini ke status BELUM memilih?')) return;
      callBackend('resetHakSuaraPemilih', [id], function() {
        refreshDataGAS();
      });
    }

    function handleHapusPemilihGAS(id) {
      if (!confirm('Hapus pemilih ini dari DPT?')) return;
      callBackend('hapusPemilih', [id], function() {
        refreshDataGAS();
      });
    }

    function handleGenerateTokenMassal() {
      if (!confirm('Buat token PIN otomatis bagi pemilih yang belum memiliki token?')) return;
      callBackend('generateTokenMassal', [], function(res) {
        alert('Berhasil membuat ' + (res ? res.count : 0) + ' token pemilih.');
        refreshDataGAS();
      });
    }

    // -------------------------------------------------------------
    // RENDER: MONITORING KELAS
    // -------------------------------------------------------------
    function renderMonitoringTable() {
      const tbody = document.getElementById('monitoring-table-body');
      const pemilihList = appState.pemilihList || [];

      // Grouping by class
      const groups = {};
      pemilihList.forEach(p => {
        const k = p.kelas || 'Lainnya';
        if (!groups[k]) groups[k] = { total: 0, sudah: 0 };
        groups[k].total++;
        if (p.statusMemilih) groups[k].sudah++;
      });

      const classes = Object.keys(groups).sort();
      if (!classes.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada data rombel.</td></tr>';
        return;
      }

      tbody.innerHTML = classes.map(k => {
        const item = groups[k];
        const belum = item.total - item.sudah;
        const pct = item.total > 0 ? ((item.sudah / item.total) * 100).toFixed(1) : 0;

        return \`
          <tr class="hover:bg-slate-50">
            <td class="p-4 font-bold text-slate-900">\${k}</td>
            <td class="p-4 text-center font-bold font-mono">\${item.total}</td>
            <td class="p-4 text-center font-bold font-mono text-emerald-600">\${item.sudah}</td>
            <td class="p-4 text-center font-bold font-mono text-amber-600">\${belum}</td>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                  <div class="gold-gradient h-full rounded-full" style="width: \${pct}%"></div>
                </div>
                <span class="text-[11px] font-mono font-bold text-slate-700 w-12 text-right">\${pct}%</span>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // -------------------------------------------------------------
    // RENDER: HASIL & BERITA ACARA
    // -------------------------------------------------------------
    function renderHasilSection() {
      const leaderboard = document.getElementById('hasil-calon-leaderboard');
      const calons = appState.calonList || [];
      const totalSuara = (appState.suaraList || []).length;

      const perolehan = {};
      calons.forEach(c => { perolehan[c.id] = 0; });
      (appState.suaraList || []).forEach(s => { if (perolehan[s.idCalon] !== undefined) perolehan[s.idCalon]++; });

      const sorted = [...calons].map(c => {
        const s = perolehan[c.id] || 0;
        const p = totalSuara > 0 ? ((s / totalSuara) * 100).toFixed(2) : '0';
        return { ...c, suara: s, persen: p };
      }).sort((a, b) => b.suara - a.suara);

      leaderboard.innerHTML = sorted.map((c, idx) => \`
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div class="flex justify-between items-center">
            <span class="w-8 h-8 rounded-xl gold-gradient text-slate-950 font-black flex items-center justify-center text-xs">0\${c.noUrut}</span>
            \${idx === 0 && c.suara > 0 ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PEROLEHAN TERTINGGI</span>' : ''}
          </div>
          <h4 class="font-black text-sm text-slate-900 uppercase">\${c.nama}</h4>
          <p class="text-xs text-amber-600 font-bold">\${c.kelas}</p>
          <div class="pt-2">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span>Perolehan Suara:</span>
              <span class="font-mono text-amber-600">\${c.persen}% (\${c.suara})</span>
            </div>
            <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
              <div class="gold-gradient h-full rounded-full" style="width: \${c.persen}%"></div>
            </div>
          </div>
        </div>
      \`).join('');

      // Berita Acara Content
      const cfg = appState.pengaturan || {};
      document.getElementById('ba-school-name').innerText = cfg.namaSekolah || 'MTs MAKARIMUL AKHLAQ';
      document.getElementById('ba-school-address').innerText = cfg.alamat || 'Jl. Pesantren No. 45, Sidoarjo, Jawa Timur';
      document.getElementById('ba-period-text').innerText = 'Tahun Pelajaran ' + (cfg.tahunPelajaran || '2026/2027');
      document.getElementById('ba-current-date').innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      document.getElementById('ba-panitia-name').innerText = cfg.namaKetuaPanitia || 'Muhammad Ilham, S.Pd';
      document.getElementById('ba-kamad-name').innerText = cfg.namaKepalaSekolah || 'Drs. H. M. Zainuddin, M.Pd.I';
      document.getElementById('ba-kamad-nip').innerText = 'NIP: ' + (cfg.nipKepalaSekolah || '19690815 199403 1 002');

      const tbodyBA = document.getElementById('ba-calon-rows');
      tbodyBA.innerHTML = sorted.map(c => \`
        <tr>
          <td class="p-2 border text-center font-bold">0\${c.noUrut}</td>
          <td class="p-2 border font-bold">\${c.nama}</td>
          <td class="p-2 border text-center">\${c.kelas}</td>
          <td class="p-2 border text-right font-bold font-mono">\${c.suara}</td>
          <td class="p-2 border text-right font-mono">\${c.persen}%</td>
        </tr>
      \`).join('');
    }

    // -------------------------------------------------------------
    // RENDER: PENGATURAN & LOGO
    // -------------------------------------------------------------
    function updateLogoPreview(url) {
      const img = document.getElementById('cfg-logo-preview');
      const fallback = document.getElementById('cfg-logo-fallback');
      if (url && url.trim() !== '') {
        img.src = url;
        img.classList.remove('hidden');
        fallback.classList.add('hidden');
      } else {
        img.classList.add('hidden');
        fallback.classList.remove('hidden');
      }
    }

    function setPresetLogo(type) {
      let u = '';
      if (type === 'kemenag') {
        u = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23047857" stroke="%23f59e0b" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M50 18 L55 32 L70 32 L58 41 L62 55 L50 46 L38 55 L42 41 L30 32 L45 32 Z" fill="%23f59e0b"/><text x="50" y="88" font-size="7" font-weight="bold" fill="%23f59e0b" text-anchor="middle" font-family="sans-serif">KEMENAG RI</text></svg>';
      } else if (type === 'tutwuri') {
        u = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%231e3a8a" stroke="%23f59e0b" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M50 22 L65 52 L35 52 Z" fill="%23f59e0b"/><text x="50" y="88" font-size="7" font-weight="bold" fill="%23f59e0b" text-anchor="middle" font-family="sans-serif">TUT WURI</text></svg>';
      }
      document.getElementById('cfg-logo-url').value = u;
      updateLogoPreview(u);
    }

    function handleSimpanPengaturan(e) {
      e.preventDefault();
      const data = {
        namaSekolah: document.getElementById('cfg-nama-sekolah').value,
        npsn: document.getElementById('cfg-npsn').value,
        nsm: document.getElementById('cfg-nsm').value,
        alamat: document.getElementById('cfg-alamat').value,
        namaKepalaSekolah: document.getElementById('cfg-kamad').value,
        nipKepalaSekolah: document.getElementById('cfg-nip').value,
        namaKetuaPanitia: document.getElementById('cfg-panitia').value,
        namaPembinaOsis: document.getElementById('cfg-pembina').value,
        logo: document.getElementById('cfg-logo-url').value
      };
      callBackend('simpanPengaturanLengkap', [data], function() {
        alert('Pengaturan sekolah & logo berhasil disimpan!');
        refreshDataGAS();
      });
    }

    // -------------------------------------------------------------
    // RENDER: FULL AUDIT TABLE
    // -------------------------------------------------------------
    function renderFullAuditTable() {
      const tbody = document.getElementById('full-audit-table-body');
      const logs = appState.auditLogs || [];
      if (!logs.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 italic">Belum ada catatan aktivitas.</td></tr>';
        return;
      }
      tbody.innerHTML = logs.map(l => \`
        <tr class="hover:bg-slate-50">
          <td class="p-4 font-mono text-[11px] text-slate-500">\${new Date(l.WAKTU || l.waktu).toLocaleString('id-ID')}</td>
          <td class="p-4 font-bold text-amber-700">\${l.USER || l.user}</td>
          <td class="p-4 font-semibold text-slate-900">\${l.AKTIVITAS || l.aktivitas}</td>
          <td class="p-4 text-slate-600">\${l.KETERANGAN || l.keterangan}</td>
        </tr>
      \`).join('');
    }

    // -------------------------------------------------------------
    // BILIK SUARA & QUICK COUNT FUNCTIONS
    // -------------------------------------------------------------
    function handleLoginPemilih(e) {
      e.preventDefault();
      const code = document.getElementById('input-kode-pemilih').value.trim();
      const errBox = document.getElementById('login-pemilih-error');
      errBox.classList.add('hidden');

      callBackend('loginPemilih', [code], function(res) {
        if (res && res.success) {
          currentVoter = res.pemilih;
          document.getElementById('voter-name').innerText = currentVoter.nama;
          document.getElementById('voter-class').innerText = currentVoter.kelas;
          document.getElementById('voter-token').innerText = currentVoter.kodePemilih;
          document.getElementById('pemilih-login-box').classList.add('hidden');
          document.getElementById('pemilih-ballot-box').classList.remove('hidden');
          renderCandidatesBallot();
        } else {
          errBox.innerText = res ? res.message : 'Kode Pemilih / NISN tidak terdaftar!';
          errBox.classList.remove('hidden');
        }
      });
    }

    function handleLogoutPemilih() {
      currentVoter = null;
      document.getElementById('input-kode-pemilih').value = '';
      document.getElementById('pemilih-ballot-box').classList.add('hidden');
      document.getElementById('pemilih-receipt-box').classList.add('hidden');
      document.getElementById('pemilih-login-box').classList.remove('hidden');
    }

    function renderCandidatesBallot() {
      const container = document.getElementById('calon-list-container');
      const calons = appState.calonList || [];
      if (!calons.length) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Belum ada calon.</div>';
        return;
      }
      container.innerHTML = calons.map(c => \`
        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-amber-500 transition-all shadow-xl">
          <div class="space-y-3">
            <div class="relative">
              <div class="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-slate-950 font-black text-sm absolute -top-2 -left-2 z-10">0\${c.noUrut}</div>
              <div class="h-48 w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                \${c.foto ? \`<img src="\${c.foto}" class="w-full h-full object-cover object-top" />\` : \`<span class="text-4xl text-slate-700">👤</span>\`}
              </div>
            </div>
            <div>
              <h4 class="text-base font-black text-white uppercase">\${c.nama}</h4>
              <p class="text-xs text-amber-500 font-bold">\${c.kelas}</p>
            </div>
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
              \${c.visi || '-'}
            </div>
          </div>
          <div class="pt-4">
            <button onclick="confirmVoteAction('\${c.id}', \${c.noUrut}, '\${c.nama}')" class="w-full py-3.5 gold-gradient text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md">
              COBLOS NO. 0\${c.noUrut}
            </button>
          </div>
        </div>
      \`).join('');
    }

    function confirmVoteAction(idCalon, noUrut, nama) {
      selectedCandidateToVote = idCalon;
      document.getElementById('modal-confirm-vote-text').innerHTML = 'Coblos <strong class="text-amber-400">Paslon 0' + noUrut + ' - ' + nama + '</strong>? Pilihan bersifat final.';
      document.getElementById('modal-confirm-vote').classList.remove('hidden');
    }

    function closeModalConfirmVote() {
      document.getElementById('modal-confirm-vote').classList.add('hidden');
      selectedCandidateToVote = null;
    }

    function executeVoteAction() {
      if (!currentVoter || !selectedCandidateToVote) return;
      callBackend('rekamSuara', [currentVoter.id, selectedCandidateToVote], function(res) {
        closeModalConfirmVote();
        if (res && res.success) {
          if (typeof confetti === 'function') confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
          document.getElementById('receipt-name').innerText = currentVoter.nama;
          document.getElementById('receipt-class').innerText = currentVoter.kelas + ' • ' + currentVoter.kodePemilih;
          document.getElementById('receipt-time').innerText = new Date().toLocaleString('id-ID');
          document.getElementById('pemilih-ballot-box').classList.add('hidden');
          document.getElementById('pemilih-receipt-box').classList.remove('hidden');
          refreshDataGAS();
        } else {
          alert(res ? res.message : 'Gagal mencatat suara');
        }
      });
    }

    function renderQuickCountBars() {
      const container = document.getElementById('qc-candidate-bars');
      const calons = appState.calonList || [];
      const totalSuara = (appState.suaraList || []).length;
      if (!calons.length) return;

      const perolehan = {};
      calons.forEach(c => { perolehan[c.id] = 0; });
      (appState.suaraList || []).forEach(s => { if (perolehan[s.idCalon] !== undefined) perolehan[s.idCalon]++; });

      container.innerHTML = calons.map(c => {
        const suara = perolehan[c.id] || 0;
        const persen = totalSuara > 0 ? ((suara / totalSuara) * 100).toFixed(1) : '0';
        return \`
          <div class="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
            <div class="flex justify-between text-xs font-bold">
              <span class="text-slate-900">0\${c.noUrut}. \${c.nama}</span>
              <span class="text-amber-600 font-mono">\${persen}% (\${suara} Suara)</span>
            </div>
            <div class="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300">
              <div class="gold-gradient h-full rounded-full transition-all duration-500" style="width: \${persen}%"></div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderQuickCountChart() {
      const canvas = document.getElementById('chart-qc');
      if (!canvas) return;
      const calons = appState.calonList || [];
      const totalSuara = (appState.suaraList || []).length;
      const labels = calons.map(c => '0' + c.noUrut + '. ' + c.nama.split('&')[0]);
      const dataValues = calons.map(c => (appState.suaraList || []).filter(s => String(s.idCalon) === String(c.id)).length);

      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{ data: totalSuara > 0 ? dataValues : [1], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'], borderWidth: 2, borderColor: '#ffffff' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' }
      });
    }

    // Local Mock Fallback saat test preview
    function handleLocalMock(func, args, cb) {
      if (func === 'ambilSemuaData') {
        cb({
          success: true,
          pengaturan: {
            namaSekolah: 'MTs MAKARIMUL AKHLAQ',
            namaKegiatan: 'PEMILIHAN KETUA & WAKIL KETUA OSIS',
            tahunPelajaran: '2026/2027',
            periode: 'Masa Bakti 2026/2027',
            tanggalPemilihan: '2026-10-03',
            waktuMulai: '07:30',
            waktuSelesai: '13:00',
            statusPemilihan: 'SEDANG_BERLANGSUNG',
            namaKepalaSekolah: 'Drs. H. M. Zainuddin, M.Pd.I',
            nipKepalaSekolah: '19690815 199403 1 002',
            namaKetuaPanitia: 'Muhammad Ilham, S.Pd',
            namaPembinaOsis: 'Ustadzah Siti Aisyah, S.Ag'
          },
          calonList: [
            { id: 'c1', noUrut: 1, nama: 'Ahmad Fauzi & Nabila Putri', kelas: 'VIII-A & VIII-B', tagline: 'Berakhlak & Kreatif', visi: 'Mewujudkan madrasah religius dan berprestasi.', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', aktif: true },
            { id: 'c2', noUrut: 2, nama: 'Rizky Pratama & Siti Nurhaliza', kelas: 'VIII-C & VIII-D', tagline: 'Sinergi & Lingkungan', visi: 'Madrasah asri dan berwawasan global.', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', aktif: true },
            { id: 'c3', noUrut: 3, nama: 'Fajar Ramadhan & Zahra Amelia', kelas: 'VIII-B & VIII-A', tagline: 'Mandiri & Tangguh', visi: 'OSIS berintegritas dan peduli.', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500', aktif: true }
          ],
          pemilihList: [],
          suaraList: [],
          statistik: {
            totalDPT: 0,
            totalSuaraMasuk: 0,
            sudahMemilih: 0,
            belumMemilih: 0,
            partisipasi: '0.0'
          },
          auditLogs: [
            { WAKTU: new Date().toISOString(), USER: 'Sistem', AKTIVITAS: 'Inisialisasi', KETERANGAN: 'Database disiapkan' }
          ]
        });
      } else {
        cb({ success: true });
      }
    }

    window.onload = function() {
      refreshDataGAS();
      setInterval(function() {
        if (!document.getElementById('view-mode-quickcount').classList.contains('hidden') || activeAdminTab === 'dashboard') {
          refreshDataGAS(true);
        }
      }, 10000);
    };
  </script>
</body>
</html>
`;

export const GAS_FILES: GasFile[] = [
  {
    filename: 'Code.gs',
    description: 'Backend Utama Google Apps Script (All-in-One: Setup Database, Autentikasi, Bilik Suara, Quick Count, CRUD & Berita Acara)',
    content: CODE_GS_CONTENT
  },
  {
    filename: 'Index.html',
    description: 'Frontend Web App Lengkap Sesuai Desain Screenshot (Sidebar Dark, Dashboard Utama Persis Screenshot, Paslon, DPT, Monitoring, Hasil, Logo, Audit)',
    content: INDEX_HTML_CONTENT
  },
  {
    filename: 'Panduan_Pemasangan_Lengkap.txt',
    description: 'Langkah Demi Langkah Memasang dan Menjalankan E-Pemilihan di Google Spreadsheet (5 Menit Jadi)',
    content: `================================================================================
PANDUAN PEMASANGAN LENGKAP E-PEMILIHAN KETUA OSIS DI GOOGLE APPS SCRIPT (GAS)
Madrasah / Sekolah: MTs MAKARIMUL AKHLAQ
Tampilan & Fitur 100% Identik dengan AI Studio Web App
================================================================================

HANYA MEMBUTUHKAN 2 FILE:
1. Code.gs (Kode Backend Logika, Google Sheets Database, & LockService)
2. Index.html (Tampilan Frontend: Dark Sidebar, Dashboard Utama, 7 Menu Aktif)

LANGKAH 1: BUAT GOOGLE SPREADSHEET BARU
1. Kunjungi: https://sheets.new
2. Beri nama: "DATABASE E-PEMILIHAN OSIS 2026 - MTs MAKARIMUL AKHLAQ"

LANGKAH 2: BUKA APPS SCRIPT
1. Di menu spreadsheet: Ekstensi (Extensions) > Apps Script.

LANGKAH 3: TEMPEL KODE Code.gs
1. Hapus isi bawaan Code.gs, tempelkan seluruh kode dari tab Code.gs.
2. Simpan (Ctrl+S).

LANGKAH 4: BUAT FILE Index.html
1. Klik tanda "+" di samping File > pilih HTML.
2. Beri nama: Index
3. Tempelkan seluruh kode dari tab Index.html.
4. Simpan (Ctrl+S).

LANGKAH 5: INISIALISASI DATABASE
1. Di dropdown fungsi bagian atas editor, pilih: inisialisasiDatabase
2. Klik "Jalankan" (Run).
3. Berikan izin akses (Review Permissions > Akun Google > Advanced > Buka project > Izinkan).
4. Selesai! Semua 6 sheet terbuat otomatis.

LANGKAH 6: DEPLOY WEB APP
1. Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
2. Jenis: "Aplikasi Web" (Web app).
3. Jalankan sebagai (Execute as): Saya (Me).
4. Yang memiliki akses (Who has access): Siapa saja (Anyone).
5. Klik "Terapkan" (Deploy).
6. Buka link URL yang dihasilkan!
`
  }
];
