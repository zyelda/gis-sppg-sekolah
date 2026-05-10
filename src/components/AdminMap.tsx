"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup, GeoJSON, LayersControl, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
// 1. TAMBAHKAN useRef DISINI
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as turf from '@turf/turf'; 
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Loader2, Route } from 'lucide-react';

export default function AdminMap({ markers = [], focusLocation, onLocationSelect, onKecamatanDetected }: any) {
  const centerMataram: [number, number] = [-8.5833, 116.1167];
  
  const [geoData, setGeoData] = useState<any>(null);
  const [maskData, setMaskData] = useState<any>(null);
  const [outerBoundary, setOuterBoundary] = useState<any>(null);

  const COLOR_SEKOLAH = '#ef4444';
  const COLOR_SPPG = '#3b82f6';
  const COLOR_UNKNOWN = '#9ca3af';

  // State untuk Buffer & Auto-Routing
  const [isBufferMode, setIsBufferMode] = useState(false);
  const [radii, setRadii] = useState({ r1: 1, r2: 2, r3: 3 }); 
  const [activeSppgIds, setActiveSppgIds] = useState<string[]>([]);
  
  // Array untuk menyimpan garis rute otomatis
  const [routeLines, setRouteLines] = useState<any[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  
  // Caching Memory agar tidak request OSRM berulang-ulang
  const routeCache = useRef<Record<string, any>>({});
  const uiRef = useRef<HTMLDivElement>(null);

  // 2. BUNGKUS DENGAN useMemo AGAR REFERENSINYA STABIL
  const sppgList = useMemo(() => markers.filter((m: any) => m.kategori === 'sppg'), [markers]);
  const sekolahList = useMemo(() => markers.filter((m: any) => m.kategori === 'sekolah'), [markers]);

  // Mencegah klik UI tembus ke peta
  useEffect(() => {
    if (uiRef.current) {
      L.DomEvent.disableClickPropagation(uiRef.current);
      L.DomEvent.disableScrollPropagation(uiRef.current);
    }
  }, [isBufferMode]);

  // Efek menyalakan semua buffer secara default saat mode diaktifkan
  useEffect(() => {
    if (isBufferMode) {
      setActiveSppgIds(sppgList.map((s: any) => s.id));
    } else {
      setActiveSppgIds([]);
      setRouteLines([]);
    }
  // 3. UBAH DEPENDENCY DARI markers MENJADI sppgList
  }, [isBufferMode, sppgList]);

  // ENGINE AUTO-ROUTING (Berjalan otomatis saat radius/SPPG aktif berubah)
  useEffect(() => {
    if (!isBufferMode) {
      setRouteLines([]);
      return;
    }

    let isCancelled = false;

    const generateRoutes = async () => {
      setIsRouting(true);
      const newRoutes: any[] = [];
      const maxRadius = Math.max(radii.r1, radii.r2, radii.r3);
      const promises: Promise<any>[] = [];

      activeSppgIds.forEach(sppgId => {
        const sppg = sppgList.find((s: any) => s.id === sppgId);
        if (!sppg) return;

        const centerPt = turf.point([Number(sppg.longitude), Number(sppg.latitude)]);

        sekolahList.forEach((sch: any) => {
          const schoolPt = turf.point([Number(sch.longitude), Number(sch.latitude)]);
          const dist = turf.distance(centerPt, schoolPt, { units: 'kilometers' });

          // Jika sekolah berada dalam radius, otomatis cari rutenya
          if (dist <= maxRadius) {
            const cacheKey = `${sppg.id}-${sch.id}`;
            
            if (routeCache.current[cacheKey]) {
              // Pakai cache jika sudah pernah dicari
              newRoutes.push(routeCache.current[cacheKey]);
            } else {
              // Jika belum, request ke API OSRM
              const start = `${sppg.longitude},${sppg.latitude}`; 
              const end = `${sch.longitude},${sch.latitude}`;
              promises.push(
                fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.routes && data.routes.length > 0) {
                      const geom = data.routes[0].geometry;
                      routeCache.current[cacheKey] = geom; // Simpan ke memory
                      return geom;
                    }
                    return null;
                  }).catch(() => null)
              );
            }
          }
        });
      });

      // Tunggu semua request selesai
      if (promises.length > 0) {
        const resolved = await Promise.all(promises);
        resolved.forEach(geom => {
          if (geom) newRoutes.push(geom);
        });
      }

      if (!isCancelled) {
        setRouteLines(newRoutes);
        setIsRouting(false);
      }
    };

    // Memberikan delay (debounce) 800ms agar API tidak jebol saat Anda sedang mengetik angka radius
    const timer = setTimeout(() => {
      generateRoutes();
    }, 800);

    return () => {
      clearTimeout(timer);
      isCancelled = true;
    };
  }, [isBufferMode, activeSppgIds, radii, sppgList, sekolahList]);

  const getDotIcon = (kategori: string) => {
    const kat = kategori?.toLowerCase() || '';
    let color = COLOR_UNKNOWN;
    if (kat === 'sekolah') color = COLOR_SEKOLAH;
    else if (kat === 'sppg') color = COLOR_SPPG;

    const htmlContent = `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
    return L.divIcon({ className: 'custom-dot-icon', html: htmlContent, iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10] });
  };

  useEffect(() => {
    fetch('/mataram.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        try {
          const fc = turf.featureCollection(data.features);
          const unioned = turf.union(fc as any);
          if (unioned) {
            setOuterBoundary(unioned);
            setMaskData(turf.mask(unioned as any));
          }
        } catch (e) { console.error(e); }
      });
  }, []);

  const toggleSppgBuffer = (id: string) => {
    setActiveSppgIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        if (isBufferMode) return; 

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        if (onLocationSelect) onLocationSelect(lat, lng);
        if (geoData && onKecamatanDetected) {
          const pt = turf.point([lng, lat]);
          let foundKecamatan = "";
          for (const feature of geoData.features) {
            if (turf.booleanPointInPolygon(pt, feature)) {
              foundKecamatan = feature.properties.kecamatan; break;
            }
          }
          if (foundKecamatan) onKecamatanDetected(foundKecamatan);
        }
        map.flyTo(e.latlng, map.getZoom());
      },
    });
    return null;
  }

  function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      if (center && !isBufferMode) {
        map.flyTo(center, 16);
        setTimeout(() => map.invalidateSize(), 100);
      }
    }, [center, map]);
    return null;
  }

  return (
    <div className="w-full h-full min-h-[400px] relative z-[1]">
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-control-layers { border: none !important; border-radius: 12px !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
        .leaflet-control-layers-expanded { padding: 12px 16px !important; background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(8px); }
        .leaflet-bar { border: none !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}} />

      {/* PANEL ANALISIS JANGKAUAN (KANAN ATAS) */}
      <div 
        ref={uiRef}
        className="absolute top-4 right-16 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 w-80 max-h-[85%] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Crosshair size={18} className="text-blue-600"/> Analisis Jangkauan
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isBufferMode} onChange={() => setIsBufferMode(!isBufferMode)} />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {isBufferMode && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Indikator Loading Auto-Routing */}
            {isRouting && (
              <div className="mb-3 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-1.5 px-3 rounded-lg border border-purple-100 animate-pulse text-xs font-medium">
                <Loader2 size={14} className="animate-spin" /> Menghitung Rute Otomatis...
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
              {['r1', 'r2', 'r3'].map((r, i) => (
                <div key={r}>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Zona {i+1} (km)</label>
                  <input type="number" value={(radii as any)[r]} onChange={e => setRadii({...radii, [r]: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
            </div>

            <div className="text-xs font-bold text-gray-700 mb-2 shrink-0 border-b pb-2 flex justify-between items-center">
              <span>Daftar SPPG Aktif</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{activeSppgIds.length}/{sppgList.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {sppgList.map((sppg: any) => {
                const isActive = activeSppgIds.includes(sppg.id);
                let schoolsInRange: any[] = [];

                if (isActive) {
                  const centerPt = turf.point([Number(sppg.longitude), Number(sppg.latitude)]);
                  const maxRadius = Math.max(radii.r1, radii.r2, radii.r3);
                  
                  schoolsInRange = sekolahList.reduce((acc: any[], sch: any) => {
                    const schoolPt = turf.point([Number(sch.longitude), Number(sch.latitude)]);
                    const dist = turf.distance(centerPt, schoolPt, { units: 'kilometers' });
                    if (dist <= maxRadius) acc.push({ ...sch, distance: dist.toFixed(2) });
                    return acc;
                  }, []).sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
                }

                return (
                  <div key={sppg.id} className={`border rounded-xl transition-all ${isActive ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                    <div className="p-3 flex items-center gap-3">
                      <input type="checkbox" checked={isActive} onChange={() => toggleSppgBuffer(sppg.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                      <div className="flex-1 cursor-pointer" onClick={() => toggleSppgBuffer(sppg.id)}>
                        <h4 className="text-sm font-bold text-gray-800 leading-tight">{sppg.nama}</h4>
                        {isActive && <p className="text-[10px] text-gray-500 mt-0.5">{schoolsInRange.length} Sekolah dalam radius</p>}
                      </div>
                    </div>

                    {isActive && schoolsInRange.length > 0 && (
                      <details className="px-3 pb-3 border-t border-blue-100/50 pt-2 group">
                        <summary className="text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors flex items-center gap-1">
                          Lihat Rute Tersambung <span className="text-[10px] opacity-70">(Klik)</span>
                        </summary>
                        <ul className="mt-2 space-y-1.5 border-l-2 border-blue-200 pl-2">
                          {schoolsInRange.map(sch => (
                            <li key={sch.id} className="flex justify-between items-center bg-white p-1.5 rounded border border-gray-100 shadow-sm">
                              <div>
                                <p className="text-[11px] font-bold text-gray-700 line-clamp-1">{sch.nama}</p>
                                <p className="text-[9px] text-gray-500">{sch.distance} km lurus</p>
                              </div>
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Route size={10}/> Rute Aktif
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <MapContainer center={centerMataram} zoom={13} zoomControl={false} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <ZoomControl position="bottomright" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Peta Terang"><TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" /></LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satelit"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Peta Jalan"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
        </LayersControl>

        {maskData && <GeoJSON data={maskData} style={{ stroke: false, fillColor: '#000000', fillOpacity: 0.6 }} />}
        {outerBoundary && <GeoJSON data={outerBoundary} style={{ color: '#1e3a8a', weight: 3, fillOpacity: 0 }} />}
        {geoData && <GeoJSON data={geoData} style={{ color: '#64748b', weight: 1.5, dashArray: '5, 5', fillOpacity: 0 }} />}

        {focusLocation && <ChangeView center={focusLocation} />}
        <MapEvents />

        {/* Gambar Buffer */}
        {isBufferMode && activeSppgIds.map(id => {
          const sppg = sppgList.find((s: any) => s.id === id);
          if (!sppg) return null;
          const lat = Number(sppg.latitude);
          const lng = Number(sppg.longitude);
          return (
            <div key={`buffer-group-${id}`}>
              <GeoJSON data={turf.circle([lng, lat], radii.r3, {units:'kilometers'}) as any} style={{ color: '#22c55e', weight: 1, fillOpacity: 0.1 }} />
              <GeoJSON data={turf.circle([lng, lat], radii.r2, {units:'kilometers'}) as any} style={{ color: '#eab308', weight: 1, fillOpacity: 0.15 }} />
              <GeoJSON data={turf.circle([lng, lat], radii.r1, {units:'kilometers'}) as any} style={{ color: '#ef4444', weight: 1, fillOpacity: 0.2 }} />
            </div>
          );
        })}

        {/* GAMBAR RUTE OTOMATIS MASSAL */}
        {isBufferMode && routeLines.map((routeGeom, idx) => (
          <GeoJSON 
            key={`route-${idx}-${routeGeom.coordinates[0][0]}`} 
            data={routeGeom} 
            style={{ color: '#8b5cf6', weight: 4, opacity: 0.8 }} 
          />
        ))}

        {/* Gambar Marker */}
        {markers.map((m: any, idx: number) => (
          <Marker key={`marker-${m.id || idx}`} position={[Number(m.latitude), Number(m.longitude)]} icon={getDotIcon(m.kategori)}>
            <Popup>
              <div className="text-sm font-bold">{m.nama}</div>
              <div className="text-xs text-gray-500">{m.kategori?.toUpperCase()}</div>
            </Popup>
          </Marker>
        ))}

        {/* Legenda */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 min-w-[120px]" onMouseDown={(e)=>e.stopPropagation()} onDoubleClick={(e)=>e.stopPropagation()}>
          <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase">Legenda</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: COLOR_SEKOLAH }}></span>
              <span className="text-sm text-gray-700 font-medium">Sekolah</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: COLOR_SPPG }}></span>
              <span className="text-sm text-gray-700 font-medium">SPPG</span>
            </div>
          </div>
        </div>
      </MapContainer>
    </div>
  );
}