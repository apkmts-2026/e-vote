import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Calon,
  Pemilih,
  Suara,
  PengaturanSekolah,
  PengaturanPemilihan,
  AuditLogItem,
  AdminUser
} from '../types';
import {
  DEFAULT_CALON,
  DEFAULT_PEMILIH,
  DEFAULT_PENGATURAN_SEKOLAH,
  DEFAULT_PENGATURAN_PEMILIHAN,
  DEFAULT_ADMIN_USERS,
  DEFAULT_AUDIT_LOGS
} from './storage';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID if provided, otherwise default
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✓ Firebase Firestore terhubung sukses!');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
      return false;
    }
    // If permission or not found, it still proves connection reached server
    console.log('Firestore connection verified');
    return true;
  }
}

// Collections
const COLLECTIONS = {
  CALON: 'calon',
  PEMILIH: 'pemilih',
  SUARA: 'suara',
  PENGATURAN: 'pengaturan',
  AUDIT_LOGS: 'audit_logs',
  ADMIN_USERS: 'admin_users'
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if Firestore has been seeded, if not seed it with default data
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const sekolahRef = doc(db, COLLECTIONS.PENGATURAN, 'sekolah');
    const snap = await getDoc(sekolahRef);
    if (!snap.exists()) {
      console.log('Menyiapkan data awal E-Pemilihan ke Firebase Firestore...');

      // 1. Pengaturan Sekolah & Pemilihan
      await setDoc(sekolahRef, DEFAULT_PENGATURAN_SEKOLAH);
      await setDoc(doc(db, COLLECTIONS.PENGATURAN, 'pemilihan'), DEFAULT_PENGATURAN_PEMILIHAN);

      // 2. Calon
      for (const c of DEFAULT_CALON) {
        await setDoc(doc(db, COLLECTIONS.CALON, c.id), c);
      }

      // 3. Pemilih Sample
      for (const p of DEFAULT_PEMILIH) {
        await setDoc(doc(db, COLLECTIONS.PEMILIH, p.id), p);
      }

      // 4. Admin users
      for (const u of DEFAULT_ADMIN_USERS) {
        await setDoc(doc(db, COLLECTIONS.ADMIN_USERS, u.id), u);
      }

      // 5. Initial log
      for (const l of DEFAULT_AUDIT_LOGS) {
        await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, l.id), l);
      }

      console.log('✓ Data awal berhasil di-seed ke Firebase Firestore!');
    }
  } catch (err) {
    console.warn('Status seed data Firestore:', err);
  }
}

// Cloud Service for Real-time Multi-Device Sync
export const CloudService = {
  // Sync real-time listener for Calon
  subscribeCalon(callback: (calon: Calon[]) => void): Unsubscribe {
    return onSnapshot(collection(db, COLLECTIONS.CALON), (snapshot) => {
      const list: Calon[] = [];
      snapshot.forEach((d) => list.push(d.data() as Calon));
      list.sort((a, b) => a.noUrut - b.noUrut);
      callback(list);
    }, (err) => console.error('Error subscribe Calon:', err));
  },

  // Sync real-time listener for Pemilih
  subscribePemilih(callback: (pemilih: Pemilih[]) => void): Unsubscribe {
    return onSnapshot(collection(db, COLLECTIONS.PEMILIH), (snapshot) => {
      const list: Pemilih[] = [];
      snapshot.forEach((d) => list.push(d.data() as Pemilih));
      callback(list);
    }, (err) => console.error('Error subscribe Pemilih:', err));
  },

  // Sync real-time listener for Suara
  subscribeSuara(callback: (suara: Suara[]) => void): Unsubscribe {
    return onSnapshot(collection(db, COLLECTIONS.SUARA), (snapshot) => {
      const list: Suara[] = [];
      snapshot.forEach((d) => list.push(d.data() as Suara));
      callback(list);
    }, (err) => console.error('Error subscribe Suara:', err));
  },

  // Sync real-time listener for Pengaturan
  subscribePengaturan(
    onSekolahChange: (sekolah: PengaturanSekolah) => void,
    onPemilihanChange: (pemilihan: PengaturanPemilihan) => void
  ): () => void {
    const unsubSekolah = onSnapshot(doc(db, COLLECTIONS.PENGATURAN, 'sekolah'), (snap) => {
      if (snap.exists()) {
        onSekolahChange(snap.data() as PengaturanSekolah);
      }
    });

    const unsubPemilihan = onSnapshot(doc(db, COLLECTIONS.PENGATURAN, 'pemilihan'), (snap) => {
      if (snap.exists()) {
        onPemilihanChange(snap.data() as PengaturanPemilihan);
      }
    });

    return () => {
      unsubSekolah();
      unsubPemilihan();
    };
  },

  // Sync real-time listener for Audit Logs
  subscribeAuditLogs(callback: (logs: AuditLogItem[]) => void): Unsubscribe {
    return onSnapshot(collection(db, COLLECTIONS.AUDIT_LOGS), (snapshot) => {
      const list: AuditLogItem[] = [];
      snapshot.forEach((d) => list.push(d.data() as AuditLogItem));
      list.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
      callback(list);
    }, (err) => console.error('Error subscribe Logs:', err));
  },

  // Cast Vote in Cloud
  async castVoteCloud(pemilih: Pemilih, idCalon: string): Promise<boolean> {
    try {
      const voteId = `vote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const voteData: Suara = {
        id: voteId,
        idPemilih: pemilih.id,
        idCalon,
        waktuSuara: new Date().toISOString(),
        status: 'SAH'
      };

      const batch = writeBatch(db);
      // 1. Simpan suara ke collection suara
      batch.set(doc(db, COLLECTIONS.SUARA, voteId), voteData);
      // 2. Tandai pemilih sudah memilih
      batch.set(doc(db, COLLECTIONS.PEMILIH, pemilih.id), {
        ...pemilih,
        statusMemilih: true,
        waktuMemilih: voteData.waktuSuara
      });
      // 3. Catat audit log
      const logId = `log-${Date.now()}`;
      batch.set(doc(db, COLLECTIONS.AUDIT_LOGS, logId), {
        id: logId,
        waktu: new Date().toISOString(),
        user: `siswa:${pemilih.nisNisn}`,
        aktivitas: 'Pemberian Hak Suara',
        keterangan: `Siswa ${pemilih.nama} (${pemilih.kelas}) berhasil memberikan suara.`
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error('Error castVoteCloud:', err);
      return false;
    }
  },

  // Save Calon list to Cloud
  async saveCalonCloud(calonList: Calon[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const c of calonList) {
        batch.set(doc(db, COLLECTIONS.CALON, c.id), c);
      }
      await batch.commit();
    } catch (err) {
      console.error('Error saveCalonCloud:', err);
    }
  },

  // Save/Update Single Calon
  async saveSingleCalonCloud(calon: Calon): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.CALON, calon.id), calon);
    } catch (err) {
      console.error('Error saveSingleCalonCloud:', err);
    }
  },

  // Save/Update Single Pemilih
  async saveSinglePemilihCloud(pemilih: Pemilih): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.PEMILIH, pemilih.id), pemilih);
    } catch (err) {
      console.error('Error saveSinglePemilihCloud:', err);
    }
  },

  // Import Bulk Pemilih
  async importPemilihBulkCloud(pemilihList: Pemilih[]): Promise<void> {
    try {
      // Chunking into batches of 400 (Firestore limit is 500 ops per batch)
      const chunkSize = 400;
      for (let i = 0; i < pemilihList.length; i += chunkSize) {
        const chunk = pemilihList.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const p of chunk) {
          batch.set(doc(db, COLLECTIONS.PEMILIH, p.id), p);
        }
        await batch.commit();
      }
    } catch (err) {
      console.error('Error importPemilihBulkCloud:', err);
    }
  },

  // Reset Voter Status
  async resetPemilihStatusCloud(idPemilih: string): Promise<void> {
    try {
      const ref = doc(db, COLLECTIONS.PEMILIH, idPemilih);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Pemilih;
        await setDoc(ref, { ...data, statusMemilih: false, waktuMemilih: undefined });
      }
    } catch (err) {
      console.error('Error resetPemilihStatusCloud:', err);
    }
  },

  // Save School Settings
  async savePengaturanSekolahCloud(sekolah: PengaturanSekolah): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.PENGATURAN, 'sekolah'), sekolah);
    } catch (err) {
      console.error('Error savePengaturanSekolahCloud:', err);
    }
  },

  // Save Election Settings
  async savePengaturanPemilihanCloud(pemilihan: PengaturanPemilihan): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.PENGATURAN, 'pemilihan'), pemilihan);
    } catch (err) {
      console.error('Error savePengaturanPemilihanCloud:', err);
    }
  },

  // Reset all votes in Cloud
  async resetOnlyVotesCloud(): Promise<void> {
    try {
      // 1. Delete all votes
      const suaraSnap = await getDocs(collection(db, COLLECTIONS.SUARA));
      const batch = writeBatch(db);
      suaraSnap.forEach((d) => batch.delete(d.ref));

      // 2. Reset pemilih
      const pemilihSnap = await getDocs(collection(db, COLLECTIONS.PEMILIH));
      pemilihSnap.forEach((d) => {
        const p = d.data() as Pemilih;
        batch.set(d.ref, { ...p, statusMemilih: false, waktuMemilih: undefined });
      });

      // 3. Update election status
      const pemilihanRef = doc(db, COLLECTIONS.PENGATURAN, 'pemilihan');
      const pemSnap = await getDoc(pemilihanRef);
      if (pemSnap.exists()) {
        const pem = pemSnap.data() as PengaturanPemilihan;
        batch.set(pemilihanRef, { ...pem, hasilTerbukaUntukAdmin: false, hasilDitampilkanKePenonton: false });
      }

      await batch.commit();
    } catch (err) {
      console.error('Error resetOnlyVotesCloud:', err);
    }
  }
};
