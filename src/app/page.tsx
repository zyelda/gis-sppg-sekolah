"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapPin, 
  Search, 
  Building2, 
  School, 
  Layers,
  Map as MapIcon,
  Navigation
} from 'lucide-react';

// Pastikan Anda mengarahkan ini ke komponen Map Anda. 
// Anda bisa menggunakan ulang komponen AdminMap atau membuat komponen Map khusus publik.
const PublicMap = dynamic(() => import('@/components/AdminMap'), { ssr: false });

const KECAMATAN_MATARAM = ["Ampenan", "Cakranegara", "Mataram", "Pejanggik", "Sekarbela", "Selaparang"];

export default function PublicPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterTipe, setFilterTipe] = useState<'semua' | 'sppg' | 'sekolah'>('semua');
  
  // State untuk interaksi Peta
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [resSppg, resSekolah] = await Promise.all([
        fetch('/api/lokasi?tipe=sppg'), 
        fetch('/api/lokasi?tipe=sekolah')
      ]);
      
      const sppgJson = await resSppg.json();
      const sekolahJson = await resSekolah.json();
      
      const mappedSppg = sppgJson.map((item: any) => ({ ...item, kategori: 'sppg' }));
      const mappedSekolah = sekolahJson.map((item: any) => ({ ...item, kategori: 'sekolah' }));
      
      setDataList([...mappedSppg, ...mappedSekolah]);
    } catch (e) { 
      console.error("Gagal mengambil data lokasi:", e); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationClick = (item: any) => {
    if (item.latitude && item.longitude) {
      setFocusLocation([Number(item.latitude), Number(item.longitude)]);
    }
  };

  // Logika Penyaringan Data
  const filteredData = useMemo(() => {
  return dataList.filter(item => {
    const matchName = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKecamatan = filterKecamatan === '' || item.kecamatan === filterKecamatan;
    const matchTipe = filterTipe === 'semua' || item.kategori === filterTipe;
    
    return matchName && matchKecamatan && matchTipe;
  });
}, [dataList, searchQuery, filterKecamatan, filterTipe]);

  return (
   <div className="flex flex-col md:flex-row h-screen pt-20 bg-neutral-50 text-neutral-800 overflow-hidden font-sans">
      {/* SIDEBAR - Panel Pencarian & Daftar */}
<aside className="w-full md:w-96 flex flex-col bg-white border-r border-neutral-200 z-20 shadow-xl md:shadow-none h-full shrink-0">
        
        {/* Header Publik */}
        <div className="p-6 border-b border-neutral-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <MapIcon size={22} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-neutral-900">SIG Mataram</h1>
              <p className="text-xs text-neutral-500 font-medium">Pemetaan SPPG & Sekolah</p>
            </div>
          </div>

          {/* Kolom Pencarian */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama lokasi..." 
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm transition-all outline-none"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* Filter Tipe Kategori */}
          <div className="flex gap-2 mb-4 bg-neutral-100 p-1 rounded-lg">
            <FilterButton 
              active={filterTipe === 'semua'} 
              onClick={() => setFilterTipe('semua')} 
              icon={<Layers size={14}/>} 
              label="Semua" 
            />
            <FilterButton 
              active={filterTipe === 'sppg'} 
              onClick={() => setFilterTipe('sppg')} 
              icon={<Building2 size={14}/>} 
              label="SPPG" 
            />
            <FilterButton 
              active={filterTipe === 'sekolah'} 
              onClick={() => setFilterTipe('sekolah')} 
              icon={<School size={14}/>} 
              label="Sekolah" 
            />
          </div>

          {/* Filter Kecamatan */}
          <select 
            className="w-full px-4 py-2.5 bg-neutral-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm transition-all outline-none appearance-none cursor-pointer"
            value={filterKecamatan} 
            onChange={(e) => setFilterKecamatan(e.target.value)}
          >
            <option value="">Seluruh Kecamatan (Mataram)</option>
            {KECAMATAN_MATARAM.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Daftar Hasil */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 px-2">
            Hasil Pencarian ({filteredData.length})
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-neutral-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Memuat data lokasi...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-neutral-100 border-dashed">
              <MapPin size={32} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">Lokasi tidak ditemukan. Coba ubah kata kunci atau filter.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredData.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleLocationClick(item)}
                  className={`bg-white p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                    focusLocation?.[0] === Number(item.latitude) && focusLocation?.[1] === Number(item.longitude)
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                      : 'border-neutral-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${item.kategori === 'sppg' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {item.kategori === 'sppg' ? <Building2 size={18} /> : <School size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-800 leading-tight mb-1">{item.nama}</h3>
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <MapPin size={12} /> {item.kecamatan || 'Kecamatan tidak diketahui'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* AREA UTAMA - Peta Interaktif */}
      <main className="flex-1 relative h-[50vh] md:h-screen bg-neutral-200">
        <PublicMap 
          markers={filteredData} 
          focusLocation={focusLocation}
          zoom={focusLocation ? 16 : 13}
        />
        
        {/* Tombol Bantuan (Opsional) */}
       
        
      </main>

    </div>
  );
}

// Komponen Pembantu untuk Tombol Filter
function FilterButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
        active 
          ? 'bg-white shadow-sm text-blue-600 ring-1 ring-neutral-200/50' 
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}