import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Atau font pilihan Anda
import './globals.css';
import Navbar from '@/components/Navbar'; // Pastikan path import sesuai

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIG Mataram - Pemetaan Lokasi',
  description: 'Sistem Informasi Geografis untuk pemetaan SPPG dan Sekolah di Mataram.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Navbar akan mengecek sendiri apakah ia perlu tampil atau sembunyi */}
        <Navbar /> 
        
        {/* Konten Utama (Page) */}
        {children}
      </body>
    </html>
  );
}