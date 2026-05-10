import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipe, data } = body; 
    // 'data' adalah array object: [{nama: "A", latitude: -8.1, longitude: 116.1}, ...]

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data CSV kosong atau format salah' }, { status: 400 });
    }

    let result;
    if (tipe === 'sppg') {
      // createMany untuk menyimpan banyak baris sekaligus
      result = await prisma.sppg.createMany({ data: data }); 
    } else {
      result = await prisma.sekolah.createMany({ data: data });
    }

    return NextResponse.json({ 
      message: `${result.count} data ${tipe.toUpperCase()} berhasil diupload!` 
    }, { status: 201 });

  } catch (error) {
    console.error("Bulk Insert Error:", error);
    return NextResponse.json({ error: 'Gagal melakukan upload massal' }, { status: 500 });
  }
}