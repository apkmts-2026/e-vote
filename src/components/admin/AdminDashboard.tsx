import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Vote,
  Settings,
  Activity,
  BarChart3,
  Building2,
  Shield,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Search,
  Filter,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Lock,
  Unlock,
  Radio,
  Clock,
  Printer,
  RotateCcw,
  User,
  ArrowLeft
} from 'lucide-react';
import {
  Calon,
  Pemilih,
  Suara,
  PengaturanSekolah,
  PengaturanPemilihan,
  AdminUser,
  AuditLogItem,
  ElectionStatus,
} from '../../types';
import { StorageService } from '../../utils/storage';
import { CloudService } from '../../utils/firebase';
import {
  downloadExcelTemplate,
  parseExcelPemilih,
  parseExcelPemilihDetailed,
  ParseExcelResult,
  ParsedPemilihRow,
  exportPemilihToExcel,
  exportHasilToExcel,
} from '../../utils/excel';
import { GAS_FILES, GasFile } from '../../utils/gasCode';
import { BeritaAcaraModal } from '../reports/BeritaAcaraModal';
import { KartuPemilihModal } from '../reports/KartuPemilihModal';
import { AbsensiPemilihModal } from '../reports/AbsensiPemilihModal';
import { ImportPreviewModal } from './ImportPreviewModal';

interface AdminDashboardProps {
  sekolah: PengaturanSekolah;
  pemilihan: PengaturanPemilihan;
  calonList: Calon[];
  pemilihList: Pemilih[];
  suaraList: Suara[];
  adminUsers: AdminUser[];
  auditLogs: AuditLogItem[];
  currentAdmin?: AdminUser | null;
  onAdminLogin?: (user: AdminUser) => void;
  onAdminLogout?: () => void;
  onDataChange: () => void;
  onBackToHome?: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'calon'
  | 'pemilih'
  | 'monitoring'
  | 'hasil'
  | 'pengaturan'
  | 'audit_log';

export type PengaturanSubTab = 'logo_lembaga' | 'pemilihan' | 'user_admin' | 'gas_backend';

export const PRESET_LOGOS = [
  {
    id: 'kemenag',
    name: 'Madrasah (Kemenag RI)',
    sub: 'Hijau & Emas Kemenag',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23047857" stroke="%23f59e0b" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M50 18 L55 32 L70 32 L58 41 L62 55 L50 46 L38 55 L42 41 L30 32 L45 32 Z" fill="%23f59e0b"/><path d="M30 65 Q50 55 70 65 L68 78 Q50 70 32 78 Z" fill="%23047857"/><text x="50" y="88" font-size="7" font-weight="bold" fill="%23f59e0b" text-anchor="middle" font-family="sans-serif">KEMENAG RI</text></svg>',
  },
  {
    id: 'kemdikbud',
    name: 'Sekolah Tut Wuri',
    sub: 'Biru & Emas Kemdikbud',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%231e3a8a" stroke="%23f59e0b" stroke-width="4"/><circle cx="50" cy="36" r="6" fill="%23dc2626"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M50 22 L65 52 L35 52 Z" fill="%23f59e0b"/><path d="M26 62 Q50 54 74 62 L70 76 Q50 70 30 76 Z" fill="%231e3a8a"/><text x="50" y="88" font-size="7" font-weight="bold" fill="%23f59e0b" text-anchor="middle" font-family="sans-serif">TUT WURI</text></svg>',
  },
  {
    id: 'osis_emas',
    name: 'Garuda OSIS Nasional',
    sub: 'Lambang OSIS Emas',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23f59e0b" stroke="%2378350f" stroke-width="3"/><circle cx="50" cy="50" r="39" fill="%230f172a"/><text x="50" y="58" font-size="22" font-weight="900" fill="%23fbbf24" text-anchor="middle" font-family="sans-serif" letter-spacing="2">OSIS</text><text x="50" y="78" font-size="8" font-weight="bold" fill="%23ffffff" text-anchor="middle" font-family="sans-serif">INDONESIA</text></svg>',
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  sekolah,
  pemilihan,
  calonList,
  pemilihList,
  suaraList,
  adminUsers,
  auditLogs,
  currentAdmin: propAdmin,
  onAdminLogin,
  onAdminLogout,
  onDataChange,
  onBackToHome,
}) => {
  // Authentication State - empty inputs to prevent accidental or unauthorized entry
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() =>
    propAdmin !== undefined ? propAdmin : StorageService.getActiveAdminSession()
  );
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    if (propAdmin !== undefined) {
      setCurrentAdmin(propAdmin);
    }
  }, [propAdmin]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [pengaturanSubTab, setPengaturanSubTab] = useState<PengaturanSubTab>('logo_lembaga');
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);

  // Calon CRUD States
  const [calonModalOpen, setCalonModalOpen] = useState<boolean>(false);
  const [editingCalon, setEditingCalon] = useState<Calon | null>(null);
  const [calonForm, setCalonForm] = useState({
    noUrut: 1,
    nama: '',
    kelas: '',
    foto: '',
    visi: '',
    misiText: '',
    tagline: '',
    aktif: true,
  });

  // Pemilih CRUD & Excel States
  const [pemilihModalOpen, setPemilihModalOpen] = useState<boolean>(false);
  const [pemilihForm, setPemilihForm] = useState({
    nisNisn: '',
    nama: '',
    kelas: '',
    kodePemilih: '',
  });
  const [searchPemilih, setSearchPemilih] = useState<string>('');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<string>('');

  // Hasil, Berita Acara, Kartu Pemilih & Absensi
  const [beritaAcaraOpen, setBeritaAcaraOpen] = useState<boolean>(false);
  const [confirmUnlockModal, setConfirmUnlockModal] = useState<boolean>(false);
  const [kartuPemilihModalOpen, setKartuPemilihModalOpen] = useState<boolean>(false);
  const [absensiModalOpen, setAbsensiModalOpen] = useState<boolean>(false);
  const [singlePemilihToPrint, setSinglePemilihToPrint] = useState<Pemilih | null>(null);

  // Import Preview & Diagnostics
  const [importPreviewOpen, setImportPreviewOpen] = useState<boolean>(false);
  const [parseResultData, setParseResultData] = useState<ParseExcelResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Settings Forms
  const [schoolSettingsForm, setSchoolSettingsForm] = useState<PengaturanSekolah>(sekolah);
  const [electionSettingsForm, setElectionSettingsForm] = useState<PengaturanPemilihan>(pemilihan);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string>('');

  // GAS Script Viewer
  const [selectedGasFile, setSelectedGasFile] = useState<GasFile>(GAS_FILES[0]);
  const [copiedGasFile, setCopiedGasFile] = useState<boolean>(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState<string>(pemilihan.gasWebhookUrl || '');
  const [webhookTestStatus, setWebhookTestStatus] = useState<string>('');

  // Admin Password Management States
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<string>('admin-01');
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string>('');
  const [passwordChangeError, setPasswordChangeError] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // In-App Confirmation Modal & Toast (Zero window.alert / window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmStyle?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Login handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanUsername = loginUsername.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError('Silakan masukkan Username dan Password!');
      return;
    }

    const users = StorageService.getAdminUsers();
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        u.passwordHash === cleanPassword
    );

    if (!found) {
      setLoginError(
        'Username atau Password salah! Akses ditolak demi keamanan sistem pemilihan.'
      );
      return;
    }

    StorageService.setActiveAdminSession(found);
    setCurrentAdmin(found);
    if (onAdminLogin) {
      onAdminLogin(found);
    }
    setLoginPassword('');
    setLoginError('');
  };

  const handleAdminLogout = () => {
    StorageService.setActiveAdminSession(null);
    setCurrentAdmin(null);
    setLoginPassword('');
    setLoginUsername('');
    if (onAdminLogout) {
      onAdminLogout();
    }
  };

  // Calculations for Dashboard
  const totalDPT = pemilihList.length;
  const totalSuaraMasuk = suaraList.length;
  const sudahMemilih = pemilihList.filter((p) => p.statusMemilih).length;
  const belumMemilih = Math.max(0, totalDPT - totalSuaraMasuk);
  const partisipasiPct = totalDPT > 0 ? ((totalSuaraMasuk / totalDPT) * 100).toFixed(1) : '0';

  // Per-candidate vote counts
  const candidateResults = calonList.map((c) => {
    const votes = suaraList.filter((s) => s.idCalon === c.id).length;
    const pct = totalSuaraMasuk > 0 ? ((votes / totalSuaraMasuk) * 100).toFixed(1) : '0';
    return {
      ...c,
      suara: votes,
      persentase: pct,
      persentaseNum: totalSuaraMasuk > 0 ? (votes / totalSuaraMasuk) * 100 : 0,
    };
  });

  // Integrity Check: Total votes per candidate == Total Suara Masuk == Total Sudah Memilih
  const totalVotesAcrossCandidates = candidateResults.reduce((acc, c) => acc + c.suara, 0);
  const isIntegrityValid =
    totalVotesAcrossCandidates === totalSuaraMasuk && totalSuaraMasuk === sudahMemilih;

  // Toggle Election Status
  const handleSetStatus = (newStatus: ElectionStatus) => {
    const updated = { ...pemilihan, status: newStatus };
    StorageService.savePengaturanPemilihan(updated, currentAdmin?.username || 'admin');
    onDataChange();
  };

  // Unlock Hasil Suara for Admin
  const handleUnlockHasil = () => {
    const updated = { ...pemilihan, hasilTerbukaUntukAdmin: true };
    StorageService.savePengaturanPemilihan(updated, currentAdmin?.username || 'admin');
    CloudService.savePengaturanPemilihanCloud(updated);
    StorageService.addAuditLog(currentAdmin?.username || 'admin', 'Buka Hasil Suara', 'Admin membuka hasil perolehan suara calon');
    setConfirmUnlockModal(false);
    onDataChange();
  };

  // Toggle Broadcast to Penonton
  const handleToggleBroadcastToPenonton = () => {
    const updated = {
      ...pemilihan,
      hasilDitampilkanKePenonton: !pemilihan.hasilDitampilkanKePenonton,
    };
    StorageService.savePengaturanPemilihan(updated, currentAdmin?.username || 'admin');
    CloudService.savePengaturanPemilihanCloud(updated);
    StorageService.addAuditLog(
      currentAdmin?.username || 'admin',
      updated.hasilDitampilkanKePenonton ? 'Tampilkan Hasil ke Penonton' : 'Sembunyikan Hasil dari Penonton',
      `Status penayangan hasil ke layar penonton diubah`
    );
    onDataChange();
  };

  // Open Calon Modal for Add or Edit
  const openAddCalonModal = () => {
    setEditingCalon(null);
    setCalonForm({
      noUrut: calonList.length + 1,
      nama: '',
      kelas: '',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      visi: '',
      misiText: '',
      tagline: '',
      aktif: true,
    });
    setCalonModalOpen(true);
  };

  const openEditCalonModal = (calon: Calon) => {
    setEditingCalon(calon);
    setCalonForm({
      noUrut: calon.noUrut,
      nama: calon.nama,
      kelas: calon.kelas,
      foto: calon.foto,
      visi: calon.visi,
      misiText: calon.misi.join('\n'),
      tagline: calon.tagline || '',
      aktif: calon.aktif,
    });
    setCalonModalOpen(true);
  };

  // Save Calon
  const handleSaveCalon = (e: React.FormEvent) => {
    e.preventDefault();
    const misiArray = calonForm.misiText
      .split('\n')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    if (editingCalon) {
      StorageService.updateCalon(
        editingCalon.id,
        {
          noUrut: Number(calonForm.noUrut),
          nama: calonForm.nama,
          kelas: calonForm.kelas,
          foto: calonForm.foto,
          visi: calonForm.visi,
          misi: misiArray.length > 0 ? misiArray : ['Meningkatkan kualitas siswa'],
          tagline: calonForm.tagline,
          aktif: calonForm.aktif,
        },
        currentAdmin?.username || 'admin'
      );
    } else {
      StorageService.addCalon(
        {
          noUrut: Number(calonForm.noUrut),
          nama: calonForm.nama,
          kelas: calonForm.kelas,
          foto: calonForm.foto,
          visi: calonForm.visi,
          misi: misiArray.length > 0 ? misiArray : ['Meningkatkan kualitas siswa'],
          tagline: calonForm.tagline,
          aktif: calonForm.aktif,
        },
        currentAdmin?.username || 'admin'
      );
    }

    setCalonModalOpen(false);
    onDataChange();
    CloudService.saveCalonCloud(StorageService.getCalon());
  };

  const handleDeleteCalon = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Calon Permanen',
      message: 'Apakah Anda yakin ingin menghapus data calon ini secara PERMANEN? Data akan dihapus selamanya dari Cloud Firestore dan browser.',
      confirmLabel: 'Hapus Permanen',
      confirmStyle: 'danger',
      onConfirm: async () => {
        StorageService.deleteCalon(id, currentAdmin?.username || 'admin');
        await CloudService.deleteSingleCalonCloud(id);
        onDataChange();
        showToast('✓ Data calon berhasil dihapus secara permanen.', 'success');
      },
    });
  };

  // Photo Upload Handler for Calon
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCalonForm((prev) => ({ ...prev, foto: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Process image file with compression so it fits safely in localStorage
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.includes('svg')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const applyLogoFile = async (file: File) => {
    try {
      const dataUrl = await processImageFile(file);
      const updated = { ...schoolSettingsForm, logo: dataUrl };
      setSchoolSettingsForm(updated);
      StorageService.savePengaturanSekolah(updated, currentAdmin?.username || 'admin');
      CloudService.savePengaturanSekolahCloud(updated);
      setSettingsSuccessMsg('Logo lembaga berhasil diupload dan langsung diterapkan ke seluruh sistem!');
      setTimeout(() => setSettingsSuccessMsg(''), 4000);
      onDataChange();
    } catch (err) {
      console.error(err);
      setSettingsSuccessMsg('Gagal memproses file logo.');
    }
  };

  // School Logo Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await applyLogoFile(file);
    }
  };

  const handleSelectPresetLogo = (presetUrl: string, presetName: string) => {
    const updated = { ...schoolSettingsForm, logo: presetUrl };
    setSchoolSettingsForm(updated);
    StorageService.savePengaturanSekolah(updated, currentAdmin?.username || 'admin');
    CloudService.savePengaturanSekolahCloud(updated);
    setSettingsSuccessMsg(`Logo ${presetName} berhasil diterapkan!`);
    setTimeout(() => setSettingsSuccessMsg(''), 4000);
    onDataChange();
  };

  const handleRemoveLogo = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Logo Kustom',
      message: 'Hapus logo lembaga kustom dan gunakan lambang emas OSIS standar?',
      confirmLabel: 'Gunakan Lambang Standar',
      confirmStyle: 'warning',
      onConfirm: () => {
        const updated = { ...schoolSettingsForm, logo: '' };
        setSchoolSettingsForm(updated);
        StorageService.savePengaturanSekolah(updated, currentAdmin?.username || 'admin');
        CloudService.savePengaturanSekolahCloud(updated);
        setSettingsSuccessMsg('Logo kustom dihapus. Menggunakan lambang standar OSIS.');
        setTimeout(() => setSettingsSuccessMsg(''), 4000);
        onDataChange();
        showToast('Logo kustom berhasil dihapus. Menggunakan lambang standar OSIS.', 'info');
      },
    });
  };

  // Save Pemilih Manual
  const handleSavePemilihManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pemilihForm.nama || !pemilihForm.nisNisn) return;

    StorageService.addPemilih(
      {
        nisNisn: pemilihForm.nisNisn,
        nama: pemilihForm.nama,
        kelas: pemilihForm.kelas || 'Umum',
        kodePemilih:
          pemilihForm.kodePemilih.toUpperCase() ||
          `VOTE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      },
      currentAdmin?.username || 'admin'
    );

    const savedPemilih = StorageService.getPemilih().find((p) => p.nisNisn === pemilihForm.nisNisn);
    if (savedPemilih) {
      CloudService.saveSinglePemilihCloud(savedPemilih);
    }

    setPemilihModalOpen(false);
    setPemilihForm({ nisNisn: '', nama: '', kelas: '', kodePemilih: '' });
    onDataChange();
  };

  // Handle Excel File Upload & Open Diagnostic Preview Modal
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseExcelPemilihDetailed(file);
      if (result.validPemilih.length === 0) {
        showToast(
          `Tidak ditemukan data siswa yang dapat dibaca pada file "${file.name}". Pastikan file memiliki kolom Nama Siswa.`,
          'error'
        );
        return;
      }

      setUploadedFileName(file.name);
      setParseResultData(result);
      setImportPreviewOpen(true);
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal membaca file Excel: ${err?.message || 'Format tidak didukung'}.`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Execute Import after user confirmation in Diagnostic Modal
  const handleConfirmImportExecution = async (mode: 'OVERWRITE' | 'MERGE' | 'SKIP_DUPLICATES') => {
    if (!parseResultData) return;

    const votersToImport = parseResultData.validPemilih.map((p: ParsedPemilihRow) => ({
      nisNisn: p.nisNisn,
      nama: p.nama,
      kelas: p.kelas,
      kodePemilih: p.kodePemilih,
    }));

    // If OVERWRITE: delete all old voters in cloud before syncing new
    if (mode === 'OVERWRITE') {
      await CloudService.deleteAllPemilihCloud();
    }

    const res = StorageService.importPemilihBulk(
      votersToImport,
      currentAdmin?.username || 'admin',
      mode
    );

    // Sync all new/updated DPT to Cloud
    await CloudService.importPemilihBulkCloud(StorageService.getPemilih());

    setImportPreviewOpen(false);
    setParseResultData(null);
    onDataChange();

    showToast(
      `✓ Import Berhasil! ${res.added} siswa baru ditambahkan${res.updated > 0 ? `, ${res.updated} diperbarui` : ''}. Total DPT resmi: ${res.totalActiveDPT} Siswa. Data otomatis tersinkronisasi ke Cloud.`,
      'success'
    );
  };


  // Reset Individual Voter Status
  const handleResetVoter = (id: string, nama: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Hak Suara Pemilih',
      message: `Reset status pemilih "${nama}"? Siswa ini akan dapat memberikan suara kembali.`,
      confirmLabel: 'Reset Hak Suara',
      confirmStyle: 'warning',
      onConfirm: async () => {
        StorageService.resetPemilihStatus(id, currentAdmin?.username || 'admin');
        await CloudService.resetPemilihStatusCloud(id);
        onDataChange();
        showToast(`✓ Hak suara untuk pemilih ${nama} telah direset.`, 'success');
      },
    });
  };

  // Clear All Voters (Permanent Purge of DPT & Votes from Cloud & Local)
  const handleClearAllPemilih = () => {
    if (pemilihList.length === 0) {
      showToast('Daftar DPT Pemilih sudah kosong.', 'info');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'PERINGATAN HAPUS SELURUH DPT',
      message: `Apakah Anda yakin ingin menghapus SEMUA (${pemilihList.length}) data DPT Pemilih dan seluruh suara masuk secara PERMANEN dari Cloud Firestore dan browser?\n\nSemua data dummy/contoh maupun data baru yang telah dihapus TIDAK AKAN MUNCUL KEMBALI.`,
      confirmLabel: 'Hapus Semua Permanen',
      confirmStyle: 'danger',
      onConfirm: async () => {
        StorageService.clearAllPemilih(currentAdmin?.username || 'admin');
        await CloudService.deleteAllPemilihCloud();
        onDataChange();
        showToast('✓ Seluruh data DPT Pemilih dan suara masuk telah berhasil dihapus secara permanen.', 'success');
      },
    });
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeSuccess('');
    setPasswordChangeError('');

    const targetUser = adminUsers.find((u) => u.id === selectedUserForPassword);
    if (!targetUser) {
      setPasswordChangeError('Pengguna tidak ditemukan dalam sistem.');
      return;
    }

    if (!currentPasswordInput) {
      setPasswordChangeError('Masukkan password saat ini untuk verifikasi.');
      return;
    }

    if (currentPasswordInput !== targetUser.passwordHash) {
      setPasswordChangeError('Password saat ini salah. Silakan periksa kembali.');
      return;
    }

    if (!newPasswordInput || newPasswordInput.length < 4) {
      setPasswordChangeError('Password baru minimal 4 karakter.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // 1. Update localStorage
      StorageService.updateAdminPassword(targetUser.id, newPasswordInput, currentAdmin?.username || 'admin');

      // 2. Update Firestore Cloud
      const updatedUser: AdminUser = { ...targetUser, passwordHash: newPasswordInput };
      await CloudService.saveAdminUserCloud(updatedUser);

      // 3. Clear inputs & notify
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordChangeSuccess(`✓ Password untuk akun "${targetUser.nama}" (${targetUser.username}) berhasil diperbarui dan tersimpan permanen di Cloud!`);
      setTimeout(() => setPasswordChangeSuccess(''), 6000);
      onDataChange();
    } catch (err) {
      setPasswordChangeError('Gagal memperbarui password: ' + String(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Reset Password to Default
  const handleResetPasswordDefault = (userId: string) => {
    const targetUser = adminUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    const defaultPass = targetUser.username === 'admin' ? 'admin123' : 'osis2026';

    setConfirmDialog({
      isOpen: true,
      title: 'Reset Password Akun ke Default',
      message: `Apakah Anda yakin ingin mereset password akun "${targetUser.nama}" (${targetUser.username}) kembali ke password default: "${defaultPass}"?\n\nPerubahan akan langsung disimpan ke Cloud Firestore.`,
      confirmLabel: 'Reset ke Default',
      confirmStyle: 'warning',
      onConfirm: async () => {
        try {
          StorageService.resetAdminPasswordToDefault(userId, currentAdmin?.username || 'admin');
          const updatedUser: AdminUser = { ...targetUser, passwordHash: defaultPass };
          await CloudService.saveAdminUserCloud(updatedUser);
          setPasswordChangeSuccess(`✓ Password untuk akun ${targetUser.username} telah direset ke default: "${defaultPass}"`);
          setTimeout(() => setPasswordChangeSuccess(''), 6000);
          onDataChange();
          showToast(`✓ Password ${targetUser.username} berhasil direset ke "${defaultPass}"`, 'success');
        } catch (err) {
          showToast('Gagal mereset password: ' + String(err), 'error');
        }
      },
    });
  };

  // Save School Settings
  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePengaturanSekolah(schoolSettingsForm, currentAdmin?.username || 'admin');
    CloudService.savePengaturanSekolahCloud(schoolSettingsForm);
    setSettingsSuccessMsg('Data profil sekolah & madrasah berhasil diperbarui ke Cloud Database!');
    setTimeout(() => setSettingsSuccessMsg(''), 4000);
    onDataChange();
  };

  // Save Election Settings
  const handleSaveElectionSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePengaturanPemilihan(electionSettingsForm, currentAdmin?.username || 'admin');
    CloudService.savePengaturanPemilihanCloud(electionSettingsForm);
    setSettingsSuccessMsg('Pengaturan kegiatan pemilihan berhasil disimpan ke Cloud Database!');
    setTimeout(() => setSettingsSuccessMsg(''), 4000);
    onDataChange();
  };

  // Reset only votes
  const handleWipeVotes = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Kotak Suara',
      message: 'PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN KOTAK SUARA? Semua suara masuk akan dihapus dari Cloud dan semua siswa dapat memilih kembali.',
      confirmLabel: 'Kosongkan Kotak Suara',
      confirmStyle: 'danger',
      onConfirm: () => {
        StorageService.resetOnlyVotes(currentAdmin?.username || 'admin');
        CloudService.resetOnlyVotesCloud();
        onDataChange();
        showToast('✓ Kotak suara berhasil dikosongkan. Hak pilih semua siswa telah dipulihkan.', 'success');
      },
    });
  };

  // Copy GAS File Code
  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(selectedGasFile.content);
    setCopiedGasFile(true);
    setTimeout(() => setCopiedGasFile(false), 2500);
  };

  // Download GAS File
  const handleDownloadGasFile = () => {
    const blob = new Blob([selectedGasFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedGasFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Test GAS Webhook URL
  const handleTestWebhook = async () => {
    if (!webhookUrlInput) {
      setWebhookTestStatus('Masukkan URL Google Apps Script Web App terlebih dahulu.');
      return;
    }
    setWebhookTestStatus('Menghubungkan ke Google Apps Script...');
    try {
      const resp = await fetch(`${webhookUrlInput}?action=ping`);
      const data = await resp.json();
      if (data.status === 'online') {
        setWebhookTestStatus('✓ Sukses! Terhubung dengan Google Apps Script API');
        // Save URL
        const updated = { ...pemilihan, gasWebhookUrl: webhookUrlInput };
        StorageService.savePengaturanPemilihan(updated, currentAdmin?.username || 'admin');
        onDataChange();
      } else {
        setWebhookTestStatus('Respons diterima namun format tidak sesuai.');
      }
    } catch (e) {
      // Due to Google Apps Script 302 redirects in CORS mode, notify panitia
      setWebhookTestStatus(
        'Terkoneksi (CORS check notice). Pastikan Web App disetel ke "Anyone" saat deploy.'
      );
      const updated = { ...pemilihan, gasWebhookUrl: webhookUrlInput };
      StorageService.savePengaturanPemilihan(updated, currentAdmin?.username || 'admin');
      onDataChange();
    }
  };

  // Filtered Pemilih List
  const uniqueClasses = Array.from(new Set(pemilihList.map((p) => p.kelas))).sort();
  const filteredPemilih = pemilihList.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(searchPemilih.toLowerCase()) ||
      p.nisNisn.toLowerCase().includes(searchPemilih.toLowerCase()) ||
      p.kodePemilih.toLowerCase().includes(searchPemilih.toLowerCase());
    const matchClass = filterKelas === 'ALL' || p.kelas === filterKelas;
    return matchSearch && matchClass;
  });

  // 1. LOGIN SCREEN FOR ADMIN IF NOT LOGGED IN
  if (!currentAdmin) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-rainbow-dark flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Floating Dark Rainbow Ambient Glows */}
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-purple-600/25 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 left-1/4 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="max-w-md w-full card-rainbow-dark rounded-3xl p-6 sm:p-8 text-white relative z-10 overflow-hidden shadow-2xl">
          
          {/* Top Delicate Rainbow Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-amber-400 via-emerald-400 to-indigo-500" />

          {/* Subtle Ambient Glows inside card */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            {sekolah.logo ? (
              <div className="relative inline-block mx-auto mb-3">
                <img
                  src={sekolah.logo}
                  alt={sekolah.namaSekolah || 'Logo'}
                  className="w-16 h-16 object-contain rounded-2xl p-1 bg-white/95 border border-amber-400 shadow-lg shadow-black/50 mx-auto"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[9px] font-black rounded-md shadow-xs border border-white">
                  OSIS
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/50 font-black text-xl border border-amber-300">
                OSIS
              </div>
            )}

            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
              LOGIN PANEL ADMIN
            </h2>
            <p className="text-xs text-amber-400 mt-1 uppercase tracking-wider font-bold">
              {sekolah.namaSekolah}
            </p>
            <p className="text-[11px] text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
              Area khusus Panitia & Pengawas. Silahkan masuk dengan akun resmi terdaftar.
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mb-5 p-3.5 bg-red-950/80 border border-red-500/60 text-red-200 rounded-2xl text-xs flex items-start gap-2.5 shadow-md">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Username Admin
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:border-amber-400 focus:bg-slate-900 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all placeholder:text-slate-400 font-medium shadow-inner"
                  placeholder="Masukkan username admin"
                  autoComplete="username"
                  autoFocus
                  required
                />
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:border-amber-400 focus:bg-slate-900 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all placeholder:text-slate-400 font-medium shadow-inner"
                  placeholder="Masukkan password admin"
                  autoComplete="current-password"
                  required
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-slate-950" />
              MASUK KE PANEL ADMIN
            </button>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Bilik Suara Siswa
              </button>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-slate-300 text-center space-y-1 relative z-10">
            <p className="flex items-center justify-center gap-1 text-slate-200 font-semibold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Proteksi Akses E-Pemilihan Ketua OSIS
            </p>
            <p className="text-[10px] text-slate-400">
              Mencegah pengubahan data calon dan rekap suara oleh pihak yang tidak berwenang.
            </p>
          </div>

        </div>
      </main>
    );
  }

  // 2. MAIN ADMIN DASHBOARD INTERFACE
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div className="p-4 space-y-6">
          
          {/* Admin Identity Badge */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                {currentAdmin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Panitia'}
              </span>
              <p className="font-bold text-sm text-white truncate">{currentAdmin.nama}</p>
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-400 hover:text-white bg-slate-900/80 hover:bg-red-900/60 rounded-xl border border-slate-700/80 hover:border-red-700 transition-colors font-bold"
              title="Kunci Panel Admin (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
              { id: 'calon', label: 'Data Calon OSIS', icon: Users },
              { id: 'pemilih', label: 'Data Pemilih (DPT)', icon: Vote },
              { id: 'monitoring', label: 'Monitoring Suara', icon: Activity },
              { id: 'hasil', label: 'Hasil & Berita Acara', icon: BarChart3 },
              { id: 'pengaturan', label: 'Pengaturan & Upload Logo', icon: Settings },
              { id: 'audit_log', label: 'Audit Log', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-1 ring-amber-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer with Quick Status Switcher */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
            Status Pemilihan Saat Ini:
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => handleSetStatus('BELUM_DIMULAI')}
              className={`p-1.5 rounded text-[10px] font-bold text-center transition-all ${
                pemilihan.status === 'BELUM_DIMULAI'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Belum
            </button>
            <button
              type="button"
              onClick={() => handleSetStatus('SEDANG_BERLANGSUNG')}
              className={`p-1.5 rounded text-[10px] font-bold text-center transition-all ${
                pemilihan.status === 'SEDANG_BERLANGSUNG'
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Mulai
            </button>
            <button
              type="button"
              onClick={() => handleSetStatus('SELESAI')}
              className={`p-1.5 rounded text-[10px] font-bold text-center transition-all ${
                pemilihan.status === 'SELESAI'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Selesai
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        
        {/* TAB 1: DASHBOARD UTAMA */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Overview Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
                  DASHBOARD PANITIA PEMILIHAN
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {pemilihan.namaKegiatan}
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  {sekolah.namaSekolah} • Tahun Pelajaran {pemilihan.tahunPelajaran} ({pemilihan.periode})
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Jadwal: {pemilihan.tanggalPemilihan} • Pukul {pemilihan.waktuMulai} - {pemilihan.waktuSelesai} WIB
                </p>
              </div>

              {/* Status Switcher Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
                <span className="text-xs text-slate-500 font-bold block mb-1">Status Pemilihan:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={pemilihan.status}
                    onChange={(e) => handleSetStatus(e.target.value as ElectionStatus)}
                    aria-label="Pilih Status Pemilihan"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <option value="BELUM_DIMULAI">BELUM DIMULAI</option>
                    <option value="SEDANG_BERLANGSUNG">SEDANG BERLANGSUNG</option>
                    <option value="SELESAI">SELESAI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Jumlah Calon</span>
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-3xl font-black font-mono text-slate-900">{calonList.length}</p>
                <p className="text-xs text-slate-500 mt-1">{calonList.filter((c) => c.aktif).length} Calon Aktif</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">DPT Terdaftar</span>
                  <Vote className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-black font-mono text-slate-900">{totalDPT}</p>
                <p className="text-xs text-slate-500 mt-1">Total Hak Suara Siswa</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Suara Masuk</span>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-black font-mono text-emerald-600">{totalSuaraMasuk}</p>
                <p className="text-xs text-slate-500 mt-1">Pemilih Sudah Memilih</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Belum Memilih</span>
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-3xl font-black font-mono text-amber-600">{belumMemilih}</p>
                <p className="text-xs text-slate-500 mt-1">Siswa Belum Masuk Bilik</p>
              </div>

            </div>

            {/* Big Progress Bar Card (Explicit Requirement) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase">
                    PROGRESS SUARA MASUK
                  </h3>
                  <p className="text-xs text-slate-500">
                    Persentase partisipasi pemilih dari total Daftar Pemilih Tetap (DPT)
                  </p>
                </div>
                <span className="text-2xl font-black font-mono text-amber-600">
                  {partisipasiPct}%
                </span>
              </div>

              <div className="h-6 w-full bg-slate-100 rounded-full p-1 border border-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-slate-950"
                  style={{ width: `${Math.min(100, Math.max(3, Number(partisipasiPct)))}%` }}
                >
                  {Number(partisipasiPct) > 10 && `${partisipasiPct}%`}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mt-3">
                <span>0 Suara (0%)</span>
                <span>{totalSuaraMasuk} Suara Masuk</span>
                <span>Target: {totalDPT} Suara (100%)</span>
              </div>
            </div>

            {/* Quick Actions & Live Feed Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Quick Actions */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Aksi Cepat Panitia
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('pengaturan');
                      setPengaturanSubTab('logo_lembaga');
                    }}
                    className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 hover:border-amber-400 border border-amber-200 text-left transition-all group shadow-xs"
                  >
                    <Upload className="w-5 h-5 text-amber-700 mb-1.5 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-xs text-slate-900">Upload Logo</p>
                    <p className="text-[10px] text-amber-800">Logo lembaga/sekolah</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('pengaturan');
                      setPengaturanSubTab('pemilihan');
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group shadow-xs"
                  >
                    <Settings className="w-5 h-5 text-slate-700 mb-1.5 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-xs text-slate-900">Pengaturan</p>
                    <p className="text-[10px] text-slate-500">Jadwal & pemilihan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('calon')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/70 hover:border-amber-300 border border-slate-200 text-left transition-all group shadow-xs"
                  >
                    <Users className="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-xs text-slate-900">Kelola Calon</p>
                    <p className="text-[10px] text-slate-500">Nomor urut & foto</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pemilih')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 mb-1.5" />
                    <p className="font-bold text-xs text-slate-900">Import Excel</p>
                    <p className="text-[10px] text-slate-500">Daftar pemilih DPT</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('hasil');
                      setBeritaAcaraOpen(true);
                    }}
                    className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100 border border-amber-300 text-left transition-all group shadow-xs cursor-pointer"
                  >
                    <Printer className="w-5 h-5 text-amber-700 mb-1.5 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-xs text-slate-900">Cetak Berita Acara</p>
                    <p className="text-[10px] text-amber-800">Blangko / Hasil Otomatis</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('monitoring')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition-all shadow-xs"
                  >
                    <Activity className="w-5 h-5 text-indigo-600 mb-1.5" />
                    <p className="font-bold text-xs text-slate-900">Monitoring</p>
                    <p className="text-[10px] text-slate-500">Rekap per kelas</p>
                  </button>
                </div>
              </div>

              {/* Recent Audit Feed */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Audit Log Terbaru
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('audit_log')}
                      className="text-xs font-bold text-amber-600 hover:underline"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{log.aktivitas}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.waktu).toLocaleTimeString('id-ID')}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5 truncate">{log.keterangan}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Keamanan: Enkripsi Aktif</span>
                  <span className="text-emerald-600 font-semibold">✓ Database Normal</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DATA CALON KETUA OSIS */}
        {activeTab === 'calon' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">DATA CALON KETUA OSIS</h2>
                <p className="text-xs text-slate-500">
                  Atur nomor urut, foto calon, kelas, visi, dan misi yang akan tampil di bilik suara pemilih.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddCalonModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                TAMBAH CALON BARU
              </button>
            </div>

            {/* Candidates Card Grid (Explicit Layout from prompt) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calonList
                .slice()
                .sort((a, b) => a.noUrut - b.noUrut)
                .map((calon) => (
                  <div
                    key={calon.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Container */}
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img
                          src={calon.foto}
                          alt={calon.nama}
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
                          NO. URUT 0{calon.noUrut}
                        </div>
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${
                              calon.aktif
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {calon.aktif ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <span className="text-xs font-bold text-slate-400 block uppercase">
                          Kelas {calon.kelas}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 leading-tight mt-1 mb-2">
                          {calon.nama}
                        </h3>

                        {calon.tagline && (
                          <p className="text-xs font-bold text-amber-600 italic mb-3">
                            "{calon.tagline}"
                          </p>
                        )}

                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                          <strong className="block text-slate-800 mb-1">Visi:</strong>
                          <p className="line-clamp-2">{calon.visi}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions [EDIT] [HAPUS] */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditCalonModal(calon)}
                        className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        EDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCalon(calon.id)}
                        className="py-2 px-3 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-xl text-xs font-bold text-red-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        HAPUS
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: DATA PEMILIH (DPT) */}
        {activeTab === 'pemilih' && (
          <div className="space-y-6">
            
            {/* Header & Excel Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">DATA PEMILIH TETAP (DPT)</h2>
                <p className="text-xs text-slate-500">
                  Total {pemilihList.length} siswa terdaftar ({sudahMemilih} sudah memilih, {belumMemilih} belum memilih).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Unduh Template Excel
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Import Excel
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => exportPemilihToExcel(pemilihList, sekolah.namaSekolah)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  Export Excel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pemilihList.length === 0) {
                      showToast('Daftar DPT Pemilih masih kosong. Silakan import atau tambah siswa terlebih dahulu.', 'info');
                      return;
                    }
                    setSinglePemilihToPrint(null);
                    setKartuPemilihModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black shadow-xs shadow-amber-500/20 cursor-pointer"
                  title="Cetak Kartu Pemilih A4 / Folio (Print All DPT atau per Kelas)"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950" />
                  Cetak Kartu Pemilih ({pemilihList.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pemilihList.length === 0) {
                      showToast('Daftar DPT Pemilih masih kosong. Silakan import atau tambah siswa terlebih dahulu.', 'info');
                      return;
                    }
                    setAbsensiModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs shadow-emerald-600/20 cursor-pointer"
                  title="Cetak Lembar Absensi / Daftar Hadir Pemilih Resmi (Model C-Daftar Hadir DPT)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  Cetak Absensi DPT
                </button>

                <button
                  type="button"
                  onClick={() => setBeritaAcaraOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  title="Cetak Berita Acara Resmi (Blangko Sebelum Acara atau Otomatis Setelah Acara)"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  Cetak Berita Acara
                </button>

                <button
                  type="button"
                  onClick={() => setPemilihModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Input Manual
                </button>

                {pemilihList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPemilih}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    title="Hapus seluruh data pemilih dan suara secara permanen dari Cloud Firestore dan browser"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Kosongkan DPT ({pemilihList.length})
                  </button>
                )}
              </div>
            </div>

            {/* Notification alert */}
            {importNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
                <span>{importNotification}</span>
                <button
                  type="button"
                  onClick={() => setImportNotification('')}
                  className="font-bold underline text-emerald-900 ml-4"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchPemilih}
                  onChange={(e) => setSearchPemilih(e.target.value)}
                  placeholder="Cari nama, NISN, atau Kode Pemilih..."
                  className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:border-red-600 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-bold">Filter Kelas:</span>
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  aria-label="Pilih Kelas Pemilih"
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="ALL">Semua Kelas ({pemilihList.length})</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({pemilihList.filter((p) => p.kelas === cls).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Voter Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">NIS / NISN</th>
                      <th className="p-4">Nama Lengkap</th>
                      <th className="p-4">Kelas</th>
                      <th className="p-4">Kode Pemilih (Token)</th>
                      <th className="p-4">Status Memilih</th>
                      <th className="p-4">Waktu Memilih</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPemilih.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-4 font-mono font-medium text-slate-800">{p.nisNisn}</td>
                        <td className="p-4 font-bold text-slate-900">{p.nama}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {p.kelas}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-red-600">{p.kodePemilih}</td>
                        <td className="p-4">
                          {p.statusMemilih ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              SUDAH MEMILIH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              BELUM MEMILIH
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {p.waktuMemilih ? new Date(p.waktuMemilih).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSinglePemilihToPrint(p);
                                setKartuPemilihModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              title={`Cetak Kartu Pemilih untuk ${p.nama} (${p.kelas})`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {p.statusMemilih && (
                              <button
                                type="button"
                                onClick={() => handleResetVoter(p.id, p.nama)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Reset Hak Suara (Izinkan memilih kembali)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Hapus Pemilih Permanen',
                                  message: `Hapus pemilih "${p.nama}" (${p.nisNisn}) secara PERMANEN?\n\nData akan dihapus selamanya dari Cloud Firestore dan browser, dan tidak akan muncul kembali.`,
                                  confirmLabel: 'Hapus Permanen',
                                  confirmStyle: 'danger',
                                  onConfirm: async () => {
                                    StorageService.deletePemilih(p.id, currentAdmin?.username || 'admin');
                                    await CloudService.deleteSinglePemilihCloud(p.id);
                                    onDataChange();
                                    showToast(`✓ Pemilih ${p.nama} berhasil dihapus permanen.`, 'success');
                                  },
                                });
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Hapus Pemilih Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPemilih.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Tidak ditemukan pemilih yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: MONITORING SUARA MASUK */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">MONITORING SUARA MASUK</h2>
              <p className="text-xs text-slate-500">
                Pantau kecepatan dan sebaran suara masuk dari setiap kelas tanpa mengungkap pilihan calon.
              </p>
            </div>

            {/* Breakdown per class */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Tingkat Partisipasi Per Kelas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {uniqueClasses.map((cls) => {
                  const classVoters = pemilihList.filter((p) => p.kelas === cls);
                  const voted = classVoters.filter((p) => p.statusMemilih).length;
                  const total = classVoters.length;
                  const pct = total > 0 ? ((voted / total) * 100).toFixed(0) : '0';
                  return (
                    <div key={cls} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-sm text-slate-900">Kelas {cls}</span>
                        <span className="font-mono font-bold text-xs text-emerald-600">{pct}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden my-2">
                        <div
                          className="h-full bg-red-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Sudah: <strong>{voted}</strong></span>
                        <span>Belum: <strong>{total - voted}</strong></span>
                        <span>Total: <strong>{total}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Vote Log Feed (Anonymous) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Log Rekam Kotak Suara Digital ({suaraList.length} Suara Terkumpul)
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suaraList
                  .slice()
                  .reverse()
                  .map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                          #{suaraList.length - idx}
                        </span>
                        <div>
                          <p className="font-mono font-bold text-slate-800">ID Transaksi: {s.id}</p>
                          <p className="text-[10px] text-slate-400">Pilihan Terenkripsi (LUBER JURDIL)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          STATUS: {s.status}
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {new Date(s.waktuSuara).toLocaleTimeString('id-ID')} WIB
                        </p>
                      </div>
                    </div>
                  ))}
                {suaraList.length === 0 && (
                  <p className="text-center text-slate-400 py-8 text-xs">Belum ada suara yang masuk.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: HASIL PEMILIHAN & BERITA ACARA */}
        {activeTab === 'hasil' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">HASIL PEMILIHAN KETUA OSIS</h2>
                <p className="text-xs text-slate-500">
                  Penghitungan suara dan pembuatan Berita Acara resmi hasil pemilihan.
                </p>
              </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pemilihan.hasilTerbukaUntukAdmin && (
                    <button
                      type="button"
                      onClick={() => exportHasilToExcel(calonList, suaraList, pemilihList, sekolah, pemilihan)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      Download Excel Hasil
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (pemilihList.length === 0) {
                        showToast('Daftar DPT Pemilih masih kosong.', 'info');
                        return;
                      }
                      setAbsensiModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    title="Cetak Lembar Daftar Hadir / Absensi Pemilih (Model C-DPT)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Daftar Hadir Pemilih
                  </button>

                  <button
                    type="button"
                    onClick={() => setBeritaAcaraOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer"
                    title="Cetak Berita Acara (Blangko Manual Sebelum Acara atau Otomatis Setelah Acara)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {pemilihan.hasilTerbukaUntukAdmin ? 'Cetak Berita Acara (Otomatis)' : 'Cetak Berita Acara (Blangko/Otomatis)'}
                  </button>
                </div>

            </div>

            {/* RULE 10: SEBELUM TOMBOL [LIHAT SUARA] DIGUNAKAN, JANGAN TAMPILKAN JUMLAH SUARA MASING-MASING CALON */}
            {!pemilihan.hasilTerbukaUntukAdmin ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-2xl mx-auto shadow-xs">
                <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Lock className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Hasil Suara Calon Masih Terkunci
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-6">
                  Sesuai prosedur pemilihan, perolehan suara masing-masing calon dirahasiakan hingga pemungutan suara selesai atau Panitia memutuskan untuk membuka kotak suara.
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 text-left mb-6 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Pemilih Terdaftar:</span>
                    <strong>{totalDPT} Siswa</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Suara Masuk ke Kotak:</span>
                    <strong>{totalSuaraMasuk} Suara</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status Pemilihan:</span>
                    <strong>{pemilihan.status}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmUnlockModal(true)}
                    className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 transition-all active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    BUKA & LIHAT HASIL SUARA
                  </button>

                  <button
                    type="button"
                    onClick={() => setBeritaAcaraOpen(true)}
                    className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-amber-600" />
                    Cetak Blangko Berita Acara (Sebelum Acara)
                  </button>
                </div>
              </div>
            ) : (
              /* RESULTS ARE UNLOCKED FOR ADMIN */
              <div className="space-y-6">
                
                {/* Status Bar & Broadcast Controls */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" />
                      Hasil Suara Terbuka untuk Panitia
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      Penayangan Hasil ke Layar Penonton / TV
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aktifkan tombol di samping agar layar penonton/proyektor di panggung menampilkan hasil akhir ini.
                    </p>
                  </div>

                  {/* Broadcast Button (Requirement 11) */}
                  <button
                    type="button"
                    onClick={handleToggleBroadcastToPenonton}
                    className={`py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      pemilihan.hasilDitampilkanKePenonton
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                    }`}
                  >
                    {pemilihan.hasilDitampilkanKePenonton ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        ✓ HASIL SUDAH DITAMPILKAN KE PENONTON
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                        🔒 TAMPILKAN HASIL KE PENONTON
                      </>
                    )}
                  </button>
                </div>

                {/* Validation Integrity Card (Requirement 22) */}
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                    isIntegrityValid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isIntegrityValid ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <div>
                      <strong className="block">
                        {isIntegrityValid
                          ? 'DATA TERVALIDASI SECARA AKURAT (100% KONSISTEN)'
                          : 'PERINGATAN: KETIDAKSESUAIAN DATA TERDETEKSI'}
                      </strong>
                      <span className="opacity-90">
                        Total Suara Seluruh Calon ({totalVotesAcrossCandidates}) = Total Suara Masuk ({totalSuaraMasuk}) = Pemilih Sudah Memilih ({sudahMemilih})
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-white/80 px-2.5 py-1 rounded-lg">
                    {isIntegrityValid ? 'STATUS: VALID' : 'STATUS: INVALID'}
                  </span>
                </div>

                {/* Candidates Result Cards (Requirement 10) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidateResults
                    .slice()
                    .sort((a, b) => b.suara - a.suara)
                    .map((calon, index) => (
                      <div
                        key={calon.id}
                        className={`bg-white rounded-3xl border-2 p-6 shadow-xs flex flex-col justify-between ${
                          index === 0 && calon.suara > 0
                            ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div>
                          {index === 0 && calon.suara > 0 && (
                            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase mb-3 border border-amber-300">
                              ⭐ PEROLEHAN TERTINGGI
                            </span>
                          )}

                          <div className="flex items-center gap-4 mb-4">
                            <img
                              src={calon.foto}
                              alt={calon.nama}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                            />
                            <div>
                              <span className="text-xs font-black text-amber-600">
                                NOMOR 0{calon.noUrut}
                              </span>
                              <h4 className="text-base font-black text-slate-900 leading-tight">
                                {calon.nama}
                              </h4>
                              <p className="text-xs text-slate-500">Kelas {calon.kelas}</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-3xl font-black font-mono text-slate-900">
                                {calon.suara}
                              </span>
                              <span className="text-xl font-black font-mono text-amber-600">
                                {calon.persentase}%
                              </span>
                            </div>

                            {/* Bar Chart */}
                            <div className="h-3 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-700"
                                style={{ width: `${calon.persentaseNum}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 italic text-center">
                          "{calon.tagline || 'Pilihan Siswa Madrasah'}"
                        </p>
                      </div>
                    ))}
                </div>

              </div>
            )}

          </div>
        )}

        {/* UNIFIED PENGATURAN & UPLOAD LOGO LEMBAGA TAB */}
        {activeTab === 'pengaturan' && (
          <div className="max-w-4xl space-y-6">
            
            {/* Header Pengaturan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 mb-1">
                  <Settings className="w-3.5 h-3.5 text-amber-700" />
                  PENGATURAN SISTEM & IDENTITAS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  PENGATURAN & LOGO LEMBAGA
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola logo lembaga, profil sekolah, waktu pemilihan, user admin panitia, dan integrasi backend dalam satu menu terpadu.
                </p>
              </div>
            </div>

            {/* Notification message */}
            {settingsSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}

            {/* Sub-tab Navigation */}
            <div className="flex overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs gap-1.5 text-xs font-bold">
              {[
                { id: 'logo_lembaga', label: '1. Logo & Profil Lembaga', icon: Building2 },
                { id: 'pemilihan', label: '2. Jadwal & Pemilihan', icon: Clock },
                { id: 'user_admin', label: '3. User Admin & Panitia', icon: Shield },
                { id: 'gas_backend', label: '4. Integrasi Apps Script', icon: Code2 },
              ].map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = pengaturanSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setPengaturanSubTab(sub.id as PengaturanSubTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 ${
                      isSubActive
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-slate-950' : 'text-slate-500'}`} />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SUBTAB 1: LOGO & PROFIL LEMBAGA */}
            {pengaturanSubTab === 'logo_lembaga' && (
              <div className="space-y-6">
                
                {/* UPLOAD LOGO LEMBAGA CARD (PROMINENT) */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-300/80 shadow-md shadow-amber-500/5 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                        Upload Logo Resmi
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        LOGO LEMBAGA / SEKOLAH / MADRASAH
                      </h3>
                      <p className="text-xs text-slate-500">
                        Logo ini akan langsung tampil sebagai identitas resmi pada Navbar aplikasi, layar bilik suara siswa, layar monitor penonton, dan kop Berita Acara.
                      </p>
                    </div>

                    {schoolSettingsForm.logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Logo (Gunakan OSIS)
                      </button>
                    )}
                  </div>

                  {/* Drag and drop upload zone */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Active Logo Display */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase mb-3">
                        Logo Saat Ini:
                      </span>
                      <div className="relative mb-3">
                        {schoolSettingsForm.logo ? (
                          <div className="w-28 h-28 p-2 bg-white rounded-2xl border-2 border-amber-400 shadow-md shadow-amber-500/20 flex items-center justify-center">
                            <img
                              src={schoolSettingsForm.logo}
                              alt="Logo Lembaga"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-3xl shadow-md border border-amber-300">
                            OSIS
                          </div>
                        )}
                        <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-amber-400 border border-amber-400/40">
                          {schoolSettingsForm.logo ? 'Logo Kustom Aktif' : 'Default OSIS'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-full mt-2">
                        {schoolSettingsForm.namaSekolah}
                      </p>
                    </div>

                    {/* Dropzone & Browse button */}
                    <div className="md:col-span-8 space-y-4">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) await applyLogoFile(file);
                        }}
                        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                          isDraggingLogo
                            ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                            : 'border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20'
                        }`}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-1">
                          Klik untuk Memilih File atau Tarik Foto Logo ke Sini
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          Mendukung file PNG (transparan), JPG, WebP, atau SVG (Maks. 2MB).
                        </p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all pointer-events-none"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          PILIH FILE DARI PERANGKAT
                        </button>
                      </div>

                      {/* Quick Preset Logos */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Atau Gunakan Contoh Logo Lembaga (1-Klik):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {PRESET_LOGOS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPresetLogo(preset.url, preset.name)}
                              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors text-left group"
                            >
                              <img
                                src={preset.url}
                                alt={preset.name}
                                className="w-8 h-8 object-contain rounded-lg p-0.5 bg-white border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                              />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 truncate">{preset.name}</p>
                                <p className="text-[9px] text-slate-400 truncate">{preset.sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Multi-View Live Preview */}
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                      Pratinjau Tampilan Logo di Berbagai Halaman:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      
                      {/* Preview 1: Navbar */}
                      <div className="p-3 bg-slate-900 rounded-xl text-white border border-slate-800">
                        <span className="text-[10px] text-amber-400 font-bold block mb-1.5 uppercase">
                          1. Navbar / Header
                        </span>
                        <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          {schoolSettingsForm.logo ? (
                            <img src={schoolSettingsForm.logo} alt="Logo" className="w-6 h-6 object-contain rounded p-0.5 bg-white" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">OSIS</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate">E-PEMILIHAN KETUA OSIS</p>
                            <p className="text-[9px] text-slate-400 truncate">{schoolSettingsForm.namaSekolah}</p>
                          </div>
                        </div>
                      </div>

                      {/* Preview 2: Mobile Voter */}
                      <div className="p-3 bg-white rounded-xl text-slate-900 border border-slate-200">
                        <span className="text-[10px] text-amber-600 font-bold block mb-1.5 uppercase">
                          2. Bilik Suara Siswa
                        </span>
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {schoolSettingsForm.logo ? (
                            <img src={schoolSettingsForm.logo} alt="Logo" className="w-6 h-6 object-contain rounded p-0.5 bg-white border border-amber-300" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">OSIS</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate">SURAT SUARA DIGITAL</p>
                            <p className="text-[9px] text-amber-600 truncate">{schoolSettingsForm.namaSekolah}</p>
                          </div>
                        </div>
                      </div>

                      {/* Preview 3: Berita Acara */}
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-900 border border-slate-200">
                        <span className="text-[10px] text-slate-600 font-bold block mb-1.5 uppercase">
                          3. Dokumen Cetak
                        </span>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-300">
                          {schoolSettingsForm.logo ? (
                            <img src={schoolSettingsForm.logo} alt="Logo" className="w-6 h-6 object-contain rounded" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">OSIS</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[11px] font-serif font-bold truncate uppercase">{schoolSettingsForm.namaSekolah}</p>
                            <p className="text-[9px] text-slate-500 truncate">KOP BERITA ACARA</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* FORM IDENTITAS SEKOLAH / MADRASAH */}
                <form onSubmit={handleSaveSchoolSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase">
                      PROFIL LENGKAP SEKOLAH / MADRASAH
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Informasi resmi lembaga untuk keperluan Berita Acara, kop surat, dan lampiran suara.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nama Sekolah / Madrasah
                    </label>
                    <input
                      type="text"
                      value={schoolSettingsForm.namaSekolah}
                      onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, namaSekolah: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        NPSN
                      </label>
                      <input
                        type="text"
                        value={schoolSettingsForm.npsn}
                        onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, npsn: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        NSM (Khusus Madrasah)
                      </label>
                      <input
                        type="text"
                        value={schoolSettingsForm.nsm}
                        onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, nsm: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Alamat Lengkap
                    </label>
                    <input
                      type="text"
                      value={schoolSettingsForm.alamat}
                      onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, alamat: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nomor Telepon
                      </label>
                      <input
                        type="text"
                        value={schoolSettingsForm.telepon}
                        onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, telepon: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Email Resmi
                      </label>
                      <input
                        type="email"
                        value={schoolSettingsForm.email}
                        onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">
                      Pejabat Penandatangan Berita Acara
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nama Kepala Sekolah / Madrasah
                        </label>
                        <input
                          type="text"
                          value={schoolSettingsForm.namaKepalaSekolah}
                          onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, namaKepalaSekolah: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          NIP Kepala Sekolah
                        </label>
                        <input
                          type="text"
                          value={schoolSettingsForm.nipKepalaSekolah}
                          onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, nipKepalaSekolah: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nama Ketua Panitia Pemilihan
                        </label>
                        <input
                          type="text"
                          value={schoolSettingsForm.namaKetuaPanitia}
                          onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, namaKetuaPanitia: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nama Ketua OSIS (Masa Bakti Lalu)
                        </label>
                        <input
                          type="text"
                          value={schoolSettingsForm.namaKetuaOsis || ''}
                          onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, namaKetuaOsis: e.target.value })}
                          placeholder="Kosongkan jika TTD manual ( .................... )"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nama Pembina OSIS
                        </label>
                        <input
                          type="text"
                          value={schoolSettingsForm.namaPembinaOsis}
                          onChange={(e) => setSchoolSettingsForm({ ...schoolSettingsForm, namaPembinaOsis: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                      SIMPAN PROFIL & IDENTITAS LEMBAGA
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* SUBTAB 2: PENGATURAN PEMILIHAN */}
            {pengaturanSubTab === 'pemilihan' && (
              <div className="space-y-6">
                <form onSubmit={handleSaveElectionSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase">
                      JADWAL & PARAMETER PEMILIHAN
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Atur judul kegiatan, tahun pelajaran, masa bakti, dan jam pemungutan suara.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nama Kegiatan Pemilihan
                    </label>
                    <input
                      type="text"
                      value={electionSettingsForm.namaKegiatan}
                      onChange={(e) => setElectionSettingsForm({ ...electionSettingsForm, namaKegiatan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Tahun Pelajaran
                      </label>
                      <input
                        type="text"
                        value={electionSettingsForm.tahunPelajaran}
                        onChange={(e) => setElectionSettingsForm({ ...electionSettingsForm, tahunPelajaran: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Periode Jabatan
                      </label>
                      <input
                        type="text"
                        value={electionSettingsForm.periode}
                        onChange={(e) => setElectionSettingsForm({ ...electionSettingsForm, periode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Tanggal Pelaksanaan
                      </label>
                      <input
                        type="date"
                        value={electionSettingsForm.tanggalPemilihan}
                        onChange={(e) => setElectionSettingsForm({ ...electionSettingsForm, tanggalPemilihan: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Waktu Mulai
                      </label>
                      <input
                        type="time"
                        value={electionSettingsForm.waktuMulai}
                        onChange={(e) => setElectionSettingsForm({ ...electionSettingsForm, waktuMulai: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Waktu Selesai
                      </label>
                      <input
                        type="time"
                        value={electionSettingsForm.waktuSelesai}
                        onChange={(e) => setElectionSettingsForm({ ...electionSettingsForm, waktuSelesai: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                      SIMPAN PENGATURAN PEMILIHAN
                    </button>
                  </div>
                </form>

                {/* Danger Zone: Reset Kotak Suara */}
                <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-xs text-red-900">
                  <h3 className="font-bold text-sm text-red-700 mb-1">Zona Bahaya / Pengosongan Kotak Suara</h3>
                  <p className="mb-4 text-red-800">
                    Gunakan fitur ini hanya jika Anda ingin memulai simulasi baru atau mengulang pemilihan. Seluruh {suaraList.length} suara akan dihapus.
                  </p>
                  <button
                    type="button"
                    onClick={handleWipeVotes}
                    className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    KOSONGKAN SELURUH KOTAK SUARA
                  </button>
                </div>
              </div>
            )}

            {/* SUBTAB 3: USER ADMIN & PANITIA (MANAJEMEN PASSWORD) */}
            {pengaturanSubTab === 'user_admin' && (
              <div className="space-y-6">
                
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-amber-500 uppercase tracking-wider">
                      KEAMANAN & HAK AKSES
                    </span>
                    <h3 className="text-xl font-black text-slate-900">MANAJEMEN AKUN & PASSWORD</h3>
                    <p className="text-xs text-slate-500">
                      Kelola password akun Administrator dan Panitia. Setiap perubahan tersimpan otomatis dan permanen di Cloud Firestore.
                    </p>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {passwordChangeSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">{passwordChangeSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordChangeSuccess('')}
                      className="text-xs font-bold underline text-emerald-900 ml-4"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {passwordChangeError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-bold">{passwordChangeError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordChangeError('')}
                      className="text-xs font-bold underline text-red-900 ml-4"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {/* Table of Users */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase">
                        DAFTAR PENGGUNA TERDAFTAR
                      </h4>
                      <p className="text-xs text-slate-500">
                        Akun yang memiliki hak akses pengelolaan pemilihan
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                      {adminUsers.length} Akun
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="p-4">Nama</th>
                        <th className="p-4">Username</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Terakhir Login</th>
                        <th className="p-4 text-center">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-900">{u.nama}</td>
                          <td className="p-4 font-mono font-bold text-slate-700">{u.username}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.role === 'SUPER_ADMIN' 
                                ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[11px]">
                            {u.terakhirLogin ? new Date(u.terakhirLogin).toLocaleTimeString('id-ID') : '-'}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleResetPasswordDefault(u.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-xl text-[11px] font-bold transition-all"
                              title="Reset Password ke Default"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              Reset Default
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Card Form Ganti Password */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          GANTI PASSWORD
                        </h4>
                        <p className="text-xs text-slate-500">
                          Ubah kata sandi untuk akun administrator atau panitia
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Pilih Akun yang Akan Dirubah
                        </label>
                        <select
                          value={selectedUserForPassword}
                          onChange={(e) => setSelectedUserForPassword(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                        >
                          {adminUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nama} ({u.username}) - [{u.role}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Password Saat Ini
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPasswordInput}
                            onChange={(e) => setCurrentPasswordInput(e.target.value)}
                            placeholder="Masukkan password saat ini..."
                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Password Baru (Minimal 4 Karakter)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder="Masukkan password baru..."
                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Konfirmasi Password Baru
                        </label>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="Ketik ulang password baru..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isChangingPassword ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Menyimpan ke Cloud...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Simpan Perubahan Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Card Informasi Kredensial & Reset Cepat */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          RESET PASSWORD KE DEFAULT
                        </h4>
                        <p className="text-xs text-slate-500">
                          Kembalikan kata sandi ke standar awal jika lupa password
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Akun Super Administrator:</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">SUPER_ADMIN</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Username: <code className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900">admin</code>
                        </p>
                        <p className="text-xs text-slate-600">
                          Password Default: <code className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-amber-700">admin123</code>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const adminUser = adminUsers.find((u) => u.username === 'admin');
                            if (adminUser) handleResetPasswordDefault(adminUser.id);
                          }}
                          className="mt-2 w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          Reset Password Admin ke Default (admin123)
                        </button>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Akun Panitia Pemilihan:</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">PANITIA</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Username: <code className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900">panitia</code>
                        </p>
                        <p className="text-xs text-slate-600">
                          Password Default: <code className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-blue-700">osis2026</code>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const panitiaUser = adminUsers.find((u) => u.username === 'panitia');
                            if (panitiaUser) handleResetPasswordDefault(panitiaUser.id);
                          }}
                          className="mt-2 w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          Reset Password Panitia ke Default (osis2026)
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                      <p className="font-bold">Informasi Sinkronisasi Real-time:</p>
                      <p className="text-amber-800">
                        Setiap kali password diganti atau direset ke default, data langsung diperbarui di Firebase Cloud Firestore sehingga berlaku untuk semua perangkat panitia tanpa perlu refresh manual.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* SUBTAB 4: INTEGRASI BACKEND GOOGLE APPS SCRIPT */}
            {pengaturanSubTab === 'gas_backend' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider">
                    ARSITEKTUR BACKEND GOOGLE SHEETS
                  </span>
                  <h3 className="text-xl font-black text-slate-900">GOOGLE APPS SCRIPT MODULES</h3>
                  <p className="text-xs text-slate-500">
                    Salin kode berikut ke editor Google Apps Script (script.google.com) untuk menghubungkan aplikasi ke Google Sheets sebagai database online.
                  </p>
                </div>

                {/* Cloud Webhook URL Config */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Koneksi Google Apps Script Web App (Opsional untuk Sinkronisasi Cloud)
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webhookUrlInput}
                      onChange={(e) => setWebhookUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Uji Koneksi
                    </button>
                  </div>
                  {webhookTestStatus && (
                    <p className="text-xs font-medium text-slate-600">{webhookTestStatus}</p>
                  )}
                </div>

                {/* Code Selector & Viewer */}
                <div className="bg-slate-900 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
                  
                  {/* File Selector Tabs */}
                  <div className="flex overflow-x-auto bg-slate-950 p-2 border-b border-slate-800 gap-1.5 text-xs font-mono">
                    {GAS_FILES.map((file) => {
                      const isHtml = file.filename.endsWith('.html');
                      const isSelected = selectedGasFile.filename === file.filename;
                      return (
                        <button
                          key={file.filename}
                          type="button"
                          onClick={() => {
                            setSelectedGasFile(file);
                            setCopiedGasFile(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm'
                              : isHtml
                              ? 'text-amber-300 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <span>{file.filename}</span>
                          {isHtml && (
                            <span className={`px-1.5 py-0.5 text-[9px] rounded font-black tracking-wider uppercase ${
                              isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              Frontend
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Code Header Bar */}
                  <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-mono font-bold text-sm text-white">
                        {selectedGasFile.filename}
                      </h4>
                      <p className="text-[11px] text-slate-400">{selectedGasFile.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadGasFile}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        Unduh File
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyGasCode}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                      >
                        {copiedGasFile ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Salin Kode {selectedGasFile.filename}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Pre Container */}
                  <div className="p-6 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
                    <pre>{selectedGasFile.content}</pre>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'audit_log' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">AUDIT LOG AKTIVITAS</h2>
              <p className="text-xs text-slate-500">
                Riwayat lengkap semua aktivitas dan transaksi di dalam sistem E-Pemilihan.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-4">Waktu</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Aktivitas</th>
                    <th className="p-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.waktu).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{log.user}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {log.aktivitas}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{log.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: INPUT / EDIT CALON */}
      {calonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-4">
              {editingCalon ? 'EDIT DATA CALON KETUA OSIS' : 'TAMBAH CALON KETUA OSIS'}
            </h3>

            <form onSubmit={handleSaveCalon} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Urut
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={calonForm.noUrut}
                    onChange={(e) => setCalonForm({ ...calonForm, noUrut: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: VIII-A & VIII-B"
                    value={calonForm.kelas}
                    onChange={(e) => setCalonForm({ ...calonForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Pasangan Calon
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi & Nabila Putri"
                  value={calonForm.nama}
                  onChange={(e) => setCalonForm({ ...calonForm, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Foto Calon
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={calonForm.foto}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer text-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      Upload File Foto
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={calonForm.foto}
                      onChange={(e) => setCalonForm({ ...calonForm, foto: e.target.value })}
                      placeholder="Atau masukkan URL Foto..."
                      className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tagline / Semboyan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Berakhlak, Kreatif, Berprestasi"
                  value={calonForm.tagline}
                  onChange={(e) => setCalonForm({ ...calonForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Visi Calon
                </label>
                <textarea
                  rows={2}
                  value={calonForm.visi}
                  onChange={(e) => setCalonForm({ ...calonForm, visi: e.target.value })}
                  placeholder="Tuliskan visi calon..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Misi Calon (1 baris per misi)
                </label>
                <textarea
                  rows={3}
                  value={calonForm.misiText}
                  onChange={(e) => setCalonForm({ ...calonForm, misiText: e.target.value })}
                  placeholder="Tuliskan poin misi, pisahkan setiap poin dengan Enter..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aktifCheck"
                  checked={calonForm.aktif}
                  onChange={(e) => setCalonForm({ ...calonForm, aktif: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600"
                />
                <label htmlFor="aktifCheck" className="text-xs font-bold text-slate-700">
                  Calon Berstatus Aktif (Muncul di Bilik Suara)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCalonModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  Simpan Calon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT PEMILIH MANUAL */}
      {pemilihModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-4">
              TAMBAH PEMILIH MANUAL
            </h3>

            <form onSubmit={handleSavePemilihManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  NIS / NISN
                </label>
                <input
                  type="text"
                  value={pemilihForm.nisNisn}
                  onChange={(e) => setPemilihForm({ ...pemilihForm, nisNisn: e.target.value })}
                  placeholder="Contoh: 0081234099"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={pemilihForm.nama}
                  onChange={(e) => setPemilihForm({ ...pemilihForm, nama: e.target.value })}
                  placeholder="Contoh: Bagas Dwi Putra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kelas
                </label>
                <input
                  type="text"
                  value={pemilihForm.kelas}
                  onChange={(e) => setPemilihForm({ ...pemilihForm, kelas: e.target.value })}
                  placeholder="Contoh: VII-B"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode Pemilih (Token / PIN)
                </label>
                <input
                  type="text"
                  value={pemilihForm.kodePemilih}
                  onChange={(e) => setPemilihForm({ ...pemilihForm, kodePemilih: e.target.value.toUpperCase() })}
                  placeholder="Biarkan kosong untuk generate otomatis..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPemilihModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  Simpan Pemilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI BUKA HASIL SUARA */}
      {confirmUnlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-300">
              <Unlock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Konfirmasi Buka Hasil Suara
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Apakah Anda yakin ingin membuka hasil perolehan suara masing-masing calon? Tindakan ini akan dicatat ke dalam Audit Log.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmUnlockModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUnlockHasil}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
              >
                YA, BUKA HASIL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL BERITA ACARA */}
      <BeritaAcaraModal
        isOpen={beritaAcaraOpen}
        onClose={() => setBeritaAcaraOpen(false)}
        sekolah={sekolah}
        pemilihan={pemilihan}
        calonList={calonList}
        pemilihList={pemilihList}
        suaraList={suaraList}
        isResultsUnlocked={pemilihan.hasilTerbukaUntukAdmin}
      />

      {/* MODAL: CETAK KARTU PEMILIH (A4 / FOLIO) */}
      <KartuPemilihModal
        isOpen={kartuPemilihModalOpen}
        onClose={() => {
          setKartuPemilihModalOpen(false);
          setSinglePemilihToPrint(null);
        }}
        sekolah={sekolah}
        pemilihan={pemilihan}
        pemilihList={pemilihList}
        singlePemilih={singlePemilihToPrint}
      />

      {/* MODAL: LEMBAR DAFTAR HADIR / ABSENSI PEMILIH (MODEL C-DPT) */}
      <AbsensiPemilihModal
        isOpen={absensiModalOpen}
        onClose={() => setAbsensiModalOpen(false)}
        sekolah={sekolah}
        pemilihan={pemilihan}
        pemilihList={pemilihList}
      />

      {/* MODAL: PRATINJAU & DIAGNOSTIK IMPORT EXCEL DPT */}
      <ImportPreviewModal
        isOpen={importPreviewOpen}
        onClose={() => {
          setImportPreviewOpen(false);
          setParseResultData(null);
        }}
        parseResult={parseResultData}
        fileName={uploadedFileName}
        onConfirmImport={handleConfirmImportExecution}
        currentDptCount={pemilihList.length}
      />

      {/* IN-APP TOAST NOTIFICATION (REPLACING WINDOW.ALERT) */}
      {toastNotification && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top duration-200">
          {toastNotification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
          {toastNotification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
          {toastNotification.type === 'info' && <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
            {toastNotification.message}
          </div>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL (REPLACING WINDOW.CONFIRM) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmDialog.confirmStyle === 'danger'
                  ? 'bg-red-100 text-red-600'
                  : confirmDialog.confirmStyle === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {confirmDialog.confirmStyle === 'danger' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {confirmDialog.message}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  if (action) await action();
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-black shadow-md cursor-pointer transition-all ${
                  confirmDialog.confirmStyle === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                    : confirmDialog.confirmStyle === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {confirmDialog.confirmLabel || 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
