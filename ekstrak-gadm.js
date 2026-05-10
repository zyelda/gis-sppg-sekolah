const fs = require('fs');

console.log("Membaca file raksasa GADM Level 3 seluruh Indonesia...");

// Membaca file GADM yang Anda temukan
const rawData = fs.readFileSync('./gadm41_IDN_3.json', 'utf-8');
const geojson = JSON.parse(rawData);

// 6 Kecamatan yang ingin kita potong
const targetKecamatan = ["ampenan", "cakranegara", "mataram", "sandubaya", "sekarbela", "selaparang"];

console.log("Mencari dan mengekstrak 6 Kecamatan di Kota Mataram...");

const fiturMataram = geojson.features.filter(feature => {
  // Di GADM, NAME_2 adalah Kabupaten/Kota, NAME_3 adalah Kecamatan
  const namaKota = (feature.properties.NAME_2 || "").toLowerCase();
  const namaKec = (feature.properties.NAME_3 || "").toLowerCase();
  
  // Pastikan kotanya Mataram dan nama kecamatannya cocok dengan target kita
  return namaKota.includes("mataram") && targetKecamatan.includes(namaKec);
});

// Merapikan data agar cocok dengan website GIS kita
const finalGeoJSON = {
  type: "FeatureCollection",
  features: fiturMataram.map(f => {
    // Kita rapikan namanya (contoh: "ampenan" jadi "Ampenan")
    const namaKecamatan = f.properties.NAME_3;
    
    return {
      type: "Feature",
      // Web kita butuh property 'kecamatan' (sebelumnya NAME_3)
      properties: { kecamatan: namaKecamatan }, 
      geometry: f.geometry
    };
  })
};

// Simpan hasilnya ke dalam folder public
fs.writeFileSync('./public/mataram.geojson', JSON.stringify(finalGeoJSON, null, 2));

console.log(`\n✅ BERHASIL! File 'mataram.geojson' yang sangat akurat telah dibuat di folder 'public'.`);
console.log(`🗺️ Ditemukan: ${fiturMataram.length} wilayah kecamatan. Data siap mengudara!`);