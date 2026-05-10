import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Setup koneksi Prisma 7 menggunakan Driver Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipe = searchParams.get('tipe');

    if (tipe === 'sppg') {
      const data = await prisma.sppg.findMany({ orderBy: { createdAt: 'desc' } });
      return NextResponse.json(data, { status: 200 });
    } else if (tipe === 'sekolah') {
      const data = await prisma.sekolah.findMany({ orderBy: { createdAt: 'desc' } });
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json({ error: 'Tipe parameter tidak valid' }, { status: 400 });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipe, nama, kecamatan, latitude, longitude } = body;

    if (!nama || latitude === null || longitude === null) {
      return NextResponse.json({ error: 'Nama dan koordinat wajib diisi' }, { status: 400 });
    }

    if (tipe === 'sppg') {
      const newSppg = await prisma.sppg.create({
        data: { nama, kecamatan, latitude, longitude }
      });
      return NextResponse.json({ message: 'SPPG berhasil disimpan', data: newSppg }, { status: 201 });
    } else {
      const newSekolah = await prisma.sekolah.create({
        data: { nama, kecamatan, latitude, longitude }
      });
      return NextResponse.json({ message: 'Sekolah berhasil disimpan', data: newSekolah }, { status: 201 });
    }
  } catch (error) {
    console.error("POST Database Error:", error);
    return NextResponse.json({ error: 'Gagal menyimpan data ke database' }, { status: 500 });
  }
}