
# 🗺️ Dokumentasi Otomatis: WEB-GIS-MATARAM

> **Status Proyek**: Terintegrasi dengan GitHub
> **Terakhir Diperbarui**: 10/5/2026, 15.20.23

## 🤖 Logika Agen Sistem (Project Agents)
Dokumentasi ini merangkum seluruh fitur yang telah diimplementasikan:

1. **Geospatial Visualization Agent**: Mengelola rendering titik Sekolah (Merah) dan SPPG (Biru) pada Map Engine.
2. **CSV Validation Agent**: Menangani parsing file melalui PapaParse dan menyediakan tabel edit interaktif sebelum database push.
3. **Auto-Buffer Agent**: Penghitungan jangkauan spasial 3 level (1km, 2km, 3km) menggunakan Turf.js.
4. **Auto-Routing Engine**: Integrasi rute jalan tercepat secara massal menggunakan OSRM API.

## 🛠️ Arsitektur Teknologi
* **Framework**: Next.js (Version: 16.2.6)
* **Database**: PostgreSQL dengan Prisma ORM
* **Map Engine**: React-Leaflet & Leaflet
* **Geospatial Logic**: Turf.js

## 📊 Struktur Database (Berdasarkan schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Sekolah {
  id        String   @id @default(uuid())
  nama      String
  alamat    String?
  kecamatan String?
  latitude  Float
  longitude Float
  createdAt DateTime @default(now())
}

model Sppg {
  id        String   @id @default(uuid())
  nama      String
  alamat    String?
  kecamatan String?
  latitude  Float
  longitude Float
  createdAt DateTime @default(now())
}
```

## 🚀 Cara Menjalankan (Deployment)
1. Install Dependensi: `npm install`
2. Setup Database: `npx prisma db push npx prisma generate`
3. Jalankan Seeder `npx tsx prisma/seed.ts`
4. Jalankan Server: `npm run dev`

## Akun Default Admin
Username: `admin`
Password: `admin123`
