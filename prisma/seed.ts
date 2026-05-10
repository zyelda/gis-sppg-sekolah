// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai proses seeding data...');

  // 1. Tentukan password default
  const plainPassword = 'admin123';
  
  // 2. Enkripsi (Hash) password menggunakan bcrypt
  // Angka 10 adalah "salt rounds", standar yang cukup aman dan cepat
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 3. Gunakan upsert agar tidak terjadi error duplikat jika seeder dijalankan 2 kali
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {}, 
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Seeding selesai! Admin berhasil dibuat:`);
  console.log(`👤 Username : ${admin.username}`);
  console.log(`🔑 Password : ${plainPassword} (Telah di-hash di database)`);
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding: ', e);
    process.exit(1);
  })
  .finally(async () => {
    // Putuskan koneksi setelah selesai
    await prisma.$disconnect();
  });