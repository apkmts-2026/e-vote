/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PemilihView } from './components/pemilih/PemilihView';
import { PenontonView } from './components/penonton/PenontonView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StorageService } from './utils/storage';
import { CloudService, testFirestoreConnection, seedInitialFirestoreData } from './utils/firebase';
import {
  Calon,
  Pemilih,
  Suara,
  PengaturanSekolah,
  PengaturanPemilihan,
  AdminUser,
  AuditLogItem,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'pemilih' | 'penonton' | 'admin'>('pemilih');

  // Application Data States
  const [calonList, setCalonList] = useState<Calon[]>([]);
  const [pemilihList, setPemilihList] = useState<Pemilih[]>([]);
  const [suaraList, setSuaraList] = useState<Suara[]>([]);
  const [sekolah, setSekolah] = useState<PengaturanSekolah>(StorageService.getPengaturanSekolah());
  const [pemilihan, setPemilihan] = useState<PengaturanPemilihan>(StorageService.getPengaturanPemilihan());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Active Admin Session (Protected Authentication)
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() =>
    StorageService.getActiveAdminSession()
  );

  const handleAdminLogin = (user: AdminUser) => {
    StorageService.setActiveAdminSession(user);
    setCurrentAdmin(user);
    loadAllData();
  };

  const handleAdminLogout = () => {
    StorageService.setActiveAdminSession(null);
    setCurrentAdmin(null);
  };

  // Load all data from storage fallback
  const loadAllData = () => {
    setCalonList(StorageService.getCalon());
    setPemilihList(StorageService.getPemilih());
    setSuaraList(StorageService.getSuara());
    setSekolah(StorageService.getPengaturanSekolah());
    setPemilihan(StorageService.getPengaturanPemilihan());
    setAdminUsers(StorageService.getAdminUsers());
    setAuditLogs(StorageService.getAuditLogs());
  };

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial local load
    loadAllData();

    // 2. Connect to Firebase Firestore & subscribe to real-time cloud data
    let isMounted = true;

    async function initCloud() {
      const ok = await testFirestoreConnection();
      if (ok && isMounted) {
        setIsCloudConnected(true);
        await seedInitialFirestoreData();
      }
    }

    initCloud();

    // 3. Real-time Listeners across all devices
    const unsubCalon = CloudService.subscribeCalon((list) => {
      const items = list || [];
      if (items.length > 0) {
        setCalonList(items);
        StorageService.saveCalon(items, 'cloud-sync');
      } else {
        const localCalon = StorageService.getCalon();
        if (localCalon.length > 0) {
          CloudService.saveCalonCloud(localCalon);
        }
      }
    });

    const unsubPemilih = CloudService.subscribePemilih((list) => {
      const items = list || [];
      setPemilihList(items);
      StorageService.savePemilih(items, 'cloud-sync');
    });

    const unsubSuara = CloudService.subscribeSuara((list) => {
      setSuaraList(list || []);
    });

    const unsubAdminUsers = CloudService.subscribeAdminUsers((users) => {
      if (users && users.length > 0) {
        setAdminUsers(users);
        StorageService.saveAdminUsers(users, 'cloud-sync');
        // Update current admin session if password changed
        const activeSession = StorageService.getActiveAdminSession();
        if (activeSession) {
          const updatedActive = users.find((u) => u.id === activeSession.id);
          if (updatedActive) {
            StorageService.setActiveAdminSession(updatedActive);
            setCurrentAdmin(updatedActive);
          }
        }
      }
    });

    const unsubPengaturan = CloudService.subscribePengaturan(
      (newSekolah) => {
        if (newSekolah) {
          setSekolah(newSekolah);
          StorageService.savePengaturanSekolah(newSekolah, 'cloud-sync');
        }
      },
      (newPemilihan) => {
        if (newPemilihan) {
          setPemilihan(newPemilihan);
          StorageService.savePengaturanPemilihan(newPemilihan, 'cloud-sync');
        }
      }
    );

    const unsubLogs = CloudService.subscribeAuditLogs((logs) => {
      if (logs) setAuditLogs(logs);
    });

    return () => {
      isMounted = false;
      unsubCalon();
      unsubPemilih();
      unsubSuara();
      unsubAdminUsers();
      unsubPengaturan();
      unsubLogs();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Header Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        sekolah={sekolah}
        pemilihan={pemilihan}
        isAdminLoggedIn={Boolean(currentAdmin)}
        onAdminLogout={handleAdminLogout}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Role Views */}
      <div className="flex-1 flex flex-col">
        {currentView === 'pemilih' && (
          <PemilihView
            sekolah={sekolah}
            pemilihan={pemilihan}
            calonList={calonList}
            pemilihList={pemilihList}
            onVoteSuccess={loadAllData}
          />
        )}

        {currentView === 'penonton' && (
          <PenontonView
            sekolah={sekolah}
            pemilihan={pemilihan}
            calonList={calonList}
            pemilihList={pemilihList}
            suaraList={suaraList}
            onToggleHasilPenonton={(tampilkan) => {
              const updated = { ...pemilihan, hasilDitampilkanKePenonton: tampilkan };
              setPemilihan(updated);
              StorageService.savePengaturanPemilihan(updated, 'operator-monitor');
              CloudService.savePengaturanPemilihanCloud(updated);
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            sekolah={sekolah}
            pemilihan={pemilihan}
            calonList={calonList}
            pemilihList={pemilihList}
            suaraList={suaraList}
            adminUsers={adminUsers}
            auditLogs={auditLogs}
            currentAdmin={currentAdmin}
            onAdminLogin={handleAdminLogin}
            onAdminLogout={handleAdminLogout}
            onDataChange={loadAllData}
            onBackToHome={() => setCurrentView('pemilih')}
          />
        )}
      </div>

    </div>
  );
}
