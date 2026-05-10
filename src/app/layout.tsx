import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GIS SPPG Mataram",
  description: "Pemetaan SPPG dan Sekolah Kota Mataram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-neutral-100 text-neutral-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}