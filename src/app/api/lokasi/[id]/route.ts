import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Fungsi EDIT (PUT)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- 1. Tipe diubah menjadi Promise
) {
  try {
    const resolvedParams = await params; // <-- 2. Tunggu params selesai dimuat (diberi await)
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { tipe, nama, kecamatan, latitude, longitude } = body;

    let updatedData;
    if (tipe === 'sppg') {
      updatedData = await prisma.sppg.update({
        where: { id: id },
        data: { nama, kecamatan, latitude, longitude }
      });
    } else {
      updatedData = await prisma.sekolah.update({
        where: { id: id },
        data: { nama, kecamatan, latitude, longitude }
      });
    }
    return NextResponse.json({ message: 'Data berhasil diubah', data: updatedData }, { status: 200 });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: 'Gagal mengubah data' }, { status: 500 });
  }
}

// Fungsi HAPUS (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- 1. Tipe diubah menjadi Promise
) {
  try {
    const resolvedParams = await params; // <-- 2. Tunggu params selesai dimuat (diberi await)
    const id = resolvedParams.id;
    
    const { searchParams } = new URL(request.url);
    const tipe = searchParams.get('tipe');

    if (tipe === 'sppg') {
      await prisma.sppg.delete({ where: { id: id } });
    } else {
      await prisma.sekolah.delete({ where: { id: id } });
    }
    
    return NextResponse.json({ message: 'Data berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}