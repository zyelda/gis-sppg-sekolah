"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import { 
  MapPin, Plus, Save, Search, Trash2, Edit, 
  LayoutDashboard, Building2, School, UploadCloud, Crosshair,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

const AdminMap = dynamic(() => import('@/components/AdminMap'), { ssr: false });

const KECAMATAN_MATARAM = ["Ampenan", "Cakranegara", "Mataram", "Pejanggik", "Sekarbela", "Selaparang"];

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'sppg' | 'sekolah' | 'tambah'>('dashboard');
  const [activeTab, setActiveTab] = useState<'csv' | 'manual' | 'map'>('manual');
  
  const [dataList, setDataList] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);

  const [tipeLokasi, setTipeLokasi] = useState<'sppg' | 'sekolah'>('sppg');
  const [namaLokasi, setNamaLokasi] = useState('');
  const [kecamatanLokasi, setKecamatanLokasi] = useState('');
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchAllData();
    } else if (activeMenu === 'sppg' || activeMenu === 'sekolah') {
      fetchData(activeMenu);
      setFocusLocation(null);
    }
  }, [activeMenu]);

  const fetchAllData = async () => {
    try {
      const [resSppg, resSekolah] = await Promise.all([
        fetch('/api/lokasi?tipe=sppg'), fetch('/api/lokasi?tipe=sekolah')
      ]);
      
      const sppgJson = await resSppg.json();
      const sekolahJson = await resSekolah.json();
      
      const mappedSppg = sppgJson.map((item: any) => ({ ...item, kategori: 'sppg' }));
      const mappedSekolah = sekolahJson.map((item: any) => ({ ...item, kategori: 'sekolah' }));
      
      setAllData([...mappedSppg, ...mappedSekolah]);
    } catch (e) { 
      console.error(e); 
    }
  };

  const fetchData = async (tipe: 'sppg' | 'sekolah') => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/lokasi?tipe=${tipe}`);
      if (res.ok) {
        const json = await res.json();
        const mapped = json.map((item: any) => ({ ...item, kategori: tipe }));
        setDataList(mapped);
      }
    } finally { 
      setIsLoadingData(false); 
    }
  };

  const handleRowClick = (item: any) => {
    setFocusLocation([Number(item.latitude), Number(item.longitude)]);
  };

  const resetForm = () => {
    setNamaLokasi('');
    setKecamatanLokasi('');
    setSelectedLat(null);
    setSelectedLng(null);
    setEditId(null);
    setCsvPreview(null);
  };

  const handleEdit = (item: any, tipe: 'sppg' | 'sekolah') => {
    setActiveMenu('tambah');
    setActiveTab('manual');
    setTipeLokasi(tipe);
    setEditId(item.id);
    setNamaLokasi(item.nama);
    setKecamatanLokasi(item.kecamatan || '');
    setSelectedLat(Number(item.latitude));
    setSelectedLng(Number(item.longitude));
  };

  const handleDelete = async (id: string, tipe: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const res = await fetch(`/api/lokasi/${id}?tipe=${tipe}`, { method: 'DELETE' });
      if (res.ok) fetchData(tipe as 'sppg' | 'sekolah');
    } catch (error) { alert("Gagal menghapus."); }
  };

  const handleSimpan = async () => {
    if (!namaLokasi || selectedLat === null || selectedLng === null) {
      alert("Nama dan Koordinat wajib diisi!");
      return;
    }
    setIsLoading(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/lokasi/${editId}` : '/api/lokasi';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipe: tipeLokasi, nama: namaLokasi, kecamatan: kecamatanLokasi, latitude: selectedLat, longitude: selectedLng })
      });

      if (res.ok) {
        alert("Data berhasil disimpan!");
        resetForm();
        setActiveMenu(tipeLokasi);
      } else {
        alert("Gagal menyimpan data.");
      }
    } finally { setIsLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: (results) => {
        const formattedData = results.data.map((row: any, idx: number) => ({
          _tempId: Date.now().toString() + idx, 
          nama: row.nama || '', 
          kecamatan: row.kecamatan || '', 
          latitude: row.latitude ? parseFloat(row.latitude) : '', 
          longitude: row.longitude ? parseFloat(row.longitude) : '',
        }));
        setCsvPreview(formattedData);
        setIsLoading(false);
        e.target.value = '';
      },
      error: () => {
        alert("Gagal membaca file CSV.");
        setIsLoading(false);
      }
    });
  };

  const handleLogout = () => {
  // Menghapus cookie dengan cara mengatur max-age menjadi 0
  document.cookie = "is_admin=; path=/; max-age=0";
  
  // Arahkan kembali ke halaman login
  window.location.href = '/login'; 
};

  const handleCsvChange = (tempId: string, field: string, value: any) => {
    setCsvPreview(prev => prev?.map(row => 
      row._tempId === tempId ? { ...row, [field]: value } : row
    ) || null);
  };

  const handleCsvDeleteRow = (tempId: string) => {
    setCsvPreview(prev => prev?.filter(row => row._tempId !== tempId) || null);
  };

  const handleCsvAddRow = () => {
    setCsvPreview(prev => [
      ...(prev || []), 
      { _tempId: Date.now().toString(), nama: '', kecamatan: '', latitude: '', longitude: '' }
    ]);
  };

  const handleCsvSubmitFinal = async () => {
    if (!csvPreview || csvPreview.length === 0) return;

    const isValid = csvPreview.every(row => row.nama && row.latitude && row.longitude);
    if (!isValid) {
      alert("Ada baris yang kosong! Pastikan Nama, Latitude, dan Longitude terisi semua.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanData = csvPreview.map(({ _tempId, ...rest }) => rest);

      const response = await fetch('/api/lokasi/bulk', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipe: tipeLokasi, data: cleanData })
      });
      
      if (response.ok) {
        alert(`Berhasil mengunggah ${cleanData.length} data baru!`);
        setCsvPreview(null);
        setActiveMenu(tipeLokasi);
      } else {
        alert("Terjadi kesalahan saat menyimpan ke database.");
      }
    } catch (error) { 
      alert("Koneksi ke server gagal."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const filteredData = dataList.filter(item => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterKecamatan === '' || item.kecamatan === filterKecamatan)
  );

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-800 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-neutral-200 p-6 flex flex-col gap-2 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-white">
            <MapPin size={18} />
          </div>
          <h2 className="font-bold text-lg tracking-tight">GIS Admin</h2>
        </div>
        
        <nav className="space-y-1">
          <MenuBtn active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} icon={<LayoutDashboard size={18}/>} label="Dashboard" />
          <MenuBtn active={activeMenu === 'sppg'} onClick={() => setActiveMenu('sppg')} icon={<Building2 size={18}/>} label="Data SPPG" />
          <MenuBtn active={activeMenu === 'sekolah'} onClick={() => setActiveMenu('sekolah')} icon={<School size={18}/>} label="Data Sekolah" />
          <div className="pt-4 border-t border-neutral-100 mt-4">
            <MenuBtn active={activeMenu === 'tambah'} onClick={() => { resetForm(); setActiveMenu('tambah'); setActiveTab('manual'); }} icon={<Plus size={18}/>} label="Tambah Data" />
          </div>
                <button 
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 mt-auto rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
      >
        Keluar (Logout)
      </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-neutral-100/50">
        {activeMenu === 'dashboard' && (
          <div className="h-full w-full p-6">
            <div className="glass-panel h-full w-full relative p-2 shadow-lg rounded-2xl bg-white overflow-hidden">
              <div className="absolute top-6 left-6 z-[400] glass-panel px-5 py-3 bg-white/90 backdrop-blur-md border border-neutral-200 shadow-sm rounded-xl">
                <h1 className="font-bold text-neutral-800 text-lg">Peta Distribusi Mataram</h1>
                <p className="text-sm text-neutral-500 font-medium">{allData.length} Titik terpetakan</p>
              </div>
              <AdminMap markers={allData} />
            </div>
          </div>
        )}

        {(activeMenu === 'sppg' || activeMenu === 'sekolah') && (
          <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
            <header>
              <h1 className="text-2xl font-bold capitalize text-neutral-800 tracking-tight">Manajemen {activeMenu}</h1>
              <p className="text-sm text-neutral-500 mt-1">Pilih data pada tabel untuk melihat koordinatnya di peta.</p>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
              <div className="lg:col-span-3 glass-panel p-6 flex flex-col gap-4 overflow-hidden bg-white shadow-sm rounded-2xl">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                    <input type="text" placeholder="Cari nama..." className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm cursor-pointer min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterKecamatan} onChange={(e) => setFilterKecamatan(e.target.value)}>
                    <option value="">Semua Kec.</option>
                    {KECAMATAN_MATARAM.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-neutral-600">Nama Lokasi</th>
                        <th className="px-4 py-3 font-semibold text-neutral-600 w-32">Kecamatan</th>
                        <th className="px-4 py-3 font-semibold text-neutral-600 text-right w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {isLoadingData ? (
                         <tr><td colSpan={3} className="text-center py-10 text-neutral-500">Memuat data...</td></tr>
                      ) : filteredData.length === 0 ? (
                         <tr><td colSpan={3} className="text-center py-10 text-neutral-500">Tidak ada data ditemukan.</td></tr>
                      ) : (
                        filteredData.map((item) => (
                          <tr 
                            key={item.id} 
                            onClick={() => handleRowClick(item)}
                            className={`hover:bg-neutral-50 cursor-pointer transition-colors ${focusLocation?.[0] === Number(item.latitude) ? 'bg-blue-50/50' : ''}`}
                          >
                            <td className="px-4 py-3 font-medium text-neutral-800">{item.nama}</td>
                            <td className="px-4 py-3 text-neutral-600">{item.kecamatan || '-'}</td>
                            <td className="px-4 py-3 text-right space-x-1">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(item, activeMenu); }} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, activeMenu); }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="lg:col-span-2 glass-panel p-2 flex flex-col relative bg-white shadow-sm h-[400px] lg:h-full rounded-2xl overflow-hidden">
                <AdminMap 
                  markers={filteredData} 
                  focusLocation={focusLocation} 
                  zoom={focusLocation ? 16 : 13}
                />
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'tambah' && (
          <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-800">{editId ? 'Edit Data Lokasi' : 'Tambah Data Baru'}</h1>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
              <div className="lg:col-span-1 glass-panel p-6 flex flex-col gap-5 overflow-y-auto bg-white shadow-sm rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Tipe Entitas</label>
                  <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-neutral-50" value={tipeLokasi} onChange={(e) => setTipeLokasi(e.target.value as any)} disabled={!!editId || !!csvPreview}>
                    <option value="sppg">SPPG</option>
                    <option value="sekolah">Sekolah</option>
                  </select>
                </div>

                {!editId && !csvPreview && (
                  <div>
                     <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Metode Input</label>
                     <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('csv')} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${activeTab === 'csv' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}>
                          <UploadCloud size={14}/> CSV
                        </button>
                        <button onClick={() => setActiveTab('manual')} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${activeTab === 'manual' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}>
                          <MapPin size={14}/> Manual
                        </button>
                        <button onClick={() => setActiveTab('map')} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${activeTab === 'map' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}>
                          <Crosshair size={14}/> Peta
                        </button>
                     </div>
                  </div>
                )}

                {csvPreview && (
                  <div className="flex-1 flex flex-col bg-blue-50/50 p-4 rounded-xl border border-blue-100 justify-center text-center">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="font-bold text-neutral-800 text-lg">{csvPreview.length} Data Terbaca</h3>
                    <p className="text-sm text-neutral-500 mb-6 mt-1">
                      Data berhasil diekstrak. Silakan periksa dan edit tabel di sebelah kanan sebelum menyimpan.
                    </p>
                    
                    <button onClick={handleCsvSubmitFinal} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
                      {isLoading ? 'Menyimpan...' : <><Save size={18}/> Simpan ke Database</>}
                    </button>
                    <button onClick={() => setCsvPreview(null)} disabled={isLoading} className="w-full mt-3 bg-white text-red-600 border border-red-100 hover:bg-red-50 font-medium py-3 rounded-lg transition-colors">
                      Batalkan Upload
                    </button>
                  </div>
                )}

                {!csvPreview && (
                  <div className="flex-1 mt-2">
                    {activeTab === 'csv' && !editId && (
                      <div className="space-y-4 border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:bg-neutral-50 transition-colors">
                        <UploadCloud size={32} className="mx-auto text-neutral-400 mb-2" />
                        <p className="text-sm text-neutral-600 mb-4">Unggah file CSV dengan kolom:<br/><b className="text-neutral-800">nama, kecamatan, latitude, longitude</b></p>
                        <label className="bg-neutral-800 hover:bg-neutral-900 text-white text-sm font-medium py-2 px-4 rounded-lg cursor-pointer inline-flex w-full justify-center">
                          <span>Pilih File CSV</span>
                          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
                        </label>
                      </div>
                    )}

                    {(activeTab === 'manual' || activeTab === 'map' || editId) && (
                      <div className="space-y-4">
                        {activeTab === 'map' && !editId && (
                           <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                              <Crosshair size={16} className="mt-0.5 shrink-0"/>
                              <p>Geser peta di sebelah kanan, lalu klik lokasi yang diinginkan. Koordinat akan terisi otomatis.</p>
                           </div>
                        )}
                        <div>
                          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Nama Lokasi</label>
                          <input type="text" placeholder="Contoh: SMAN 1 Mataram" className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500" value={namaLokasi} onChange={(e) => setNamaLokasi(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Kecamatan</label>
                          <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500" value={kecamatanLokasi} onChange={(e) => setKecamatanLokasi(e.target.value)}>
                            <option value="">Pilih Kecamatan...</option>
                            {KECAMATAN_MATARAM.map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Latitude</label>
                            <input type="number" placeholder="-8.58" className={`w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 ${activeTab === 'map' ? 'bg-neutral-100 text-neutral-500' : ''}`} readOnly={activeTab === 'map'} value={selectedLat || ''} onChange={(e) => setSelectedLat(parseFloat(e.target.value))} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Longitude</label>
                            <input type="number" placeholder="116.11" className={`w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 ${activeTab === 'map' ? 'bg-neutral-100 text-neutral-500' : ''}`} readOnly={activeTab === 'map'} value={selectedLng || ''} onChange={(e) => setSelectedLng(parseFloat(e.target.value))} />
                          </div>
                        </div>
                        <button onClick={handleSimpan} disabled={isLoading} className="w-full bg-neutral-800 hover:bg-neutral-900 text-white font-medium mt-4 py-3 rounded-lg disabled:opacity-50 shadow-md">
                          <Save size={18} className="inline mr-2 -mt-1"/> {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 glass-panel p-2 flex flex-col bg-white shadow-sm h-[400px] lg:h-full relative rounded-2xl overflow-hidden">
                {csvPreview ? (
                  <div className="h-full flex flex-col p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                        <AlertCircle size={20} className="text-orange-500"/> Validasi Data CSV
                      </h2>
                      <button onClick={handleCsvAddRow} className="text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={14}/> Tambah Baris
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto border border-neutral-200 rounded-xl">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                          <tr>
                            <th className="px-3 py-3 font-semibold text-neutral-600">Nama Lokasi</th>
                            <th className="px-3 py-3 font-semibold text-neutral-600">Kecamatan</th>
                            <th className="px-3 py-3 font-semibold text-neutral-600">Latitude</th>
                            <th className="px-3 py-3 font-semibold text-neutral-600">Longitude</th>
                            <th className="px-3 py-3 font-semibold text-neutral-600 text-center w-12">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {csvPreview.map((row) => (
                            <tr key={row._tempId} className="hover:bg-blue-50/30 transition-colors">
                              <td className="p-1">
                                <input type="text" value={row.nama} onChange={(e) => handleCsvChange(row._tempId, 'nama', e.target.value)} className="w-full px-2 py-1.5 bg-transparent border-2 border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white rounded outline-none transition-all" placeholder="Nama..." />
                              </td>
                              <td className="p-1">
                                <input type="text" value={row.kecamatan} onChange={(e) => handleCsvChange(row._tempId, 'kecamatan', e.target.value)} className="w-full px-2 py-1.5 bg-transparent border-2 border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white rounded outline-none transition-all" placeholder="Kecamatan..." />
                              </td>
                              <td className="p-1">
                                <input type="number" value={row.latitude} onChange={(e) => handleCsvChange(row._tempId, 'latitude', e.target.value)} className="w-full px-2 py-1.5 bg-transparent border-2 border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white rounded outline-none transition-all" placeholder="-8.xx" />
                              </td>
                              <td className="p-1">
                                <input type="number" value={row.longitude} onChange={(e) => handleCsvChange(row._tempId, 'longitude', e.target.value)} className="w-full px-2 py-1.5 bg-transparent border-2 border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white rounded outline-none transition-all" placeholder="116.xx" />
                              </td>
                              <td className="p-1 text-center">
                                <button onClick={() => handleCsvDeleteRow(row._tempId)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded mx-auto block transition-colors">
                                  <XCircle size={18}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <AdminMap 
                    onLocationSelect={(lat: number, lng: number) => { 
                      setSelectedLat(lat); setSelectedLng(lng); 
                      if (activeTab !== 'map' && !editId) setActiveTab('map');
                    }} 
                    onKecamatanDetected={(namaKecamatan: string) => setKecamatanLokasi(namaKecamatan)}
                    focusLocation={(selectedLat !== null && selectedLng !== null) ? [selectedLat, selectedLng] : null} 
                    zoom={14}
                  />
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function MenuBtn({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}