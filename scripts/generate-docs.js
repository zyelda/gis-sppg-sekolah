const fs = require('fs');
const path = require('path');

// 1. Ambil info dari package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// 2. Baca Skema Prisma untuk dokumentasi Database
const prismaSchema = fs.readFileSync('./prisma/schema.prisma', 'utf-8');

const content = `
# 🗺️ Dokumentasi Otomatis: ${pkg.name.toUpperCase()}

> **Status Proyek**: Terintegrasi dengan GitHub
> **Terakhir Diperbarui**: ${new Date().toLocaleString('id-ID')}

## 🤖 Logika Agen Sistem (Project Agents)
Dokumentasi ini merangkum seluruh fitur yang telah diimplementasikan:

1. **Geospatial Visualization Agent**: Mengelola rendering titik Sekolah (Merah) dan SPPG (Biru) pada Map Engine.
2. **CSV Validation Agent**: Menangani parsing file melalui PapaParse dan menyediakan tabel edit interaktif sebelum database push.
3. **Auto-Buffer Agent**: Penghitungan jangkauan spasial 3 level (1km, 2km, 3km) menggunakan Turf.js.
4. **Auto-Routing Engine**: Integrasi rute jalan tercepat secara massal menggunakan OSRM API.

## 🛠️ Arsitektur Teknologi
* **Framework**: Next.js (Version: ${pkg.dependencies.next})
* **Database**: PostgreSQL dengan Prisma ORM
* **Map Engine**: React-Leaflet & Leaflet
* **Geospatial Logic**: Turf.js

## 📊 Struktur Database (Berdasarkan schema.prisma)
\`\`\`prisma
${prismaSchema}
\`\`\`

## 🚀 Cara Menjalankan (Deployment)
1. Install Dependensi: \`npm install\`
2. Sinkronisasi Database: \`npx prisma db push\`
3. Jalankan Server: \`npm run dev\`
`;

fs.writeFileSync('./AGENTS.md', content);
console.log('✅ Dokumentasi AGENTS.md berhasil dibuat 100% sesuai proyek!');