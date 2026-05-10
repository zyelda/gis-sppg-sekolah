"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, LogIn, Menu, X } from 'lucide-react';

// 1. Definisikan tipe data untuk props (fleksibilitas)
interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  title?: string;
  links?: NavLink[];
  showAdminBtn?: boolean;
}

export default function Navbar({ 
  title = "SIG Mataram", 
  // Menu default bisa diatur di sini
  links = [
    { label: 'Beranda Peta', href: '/' }
  ],
  showAdminBtn = true 
}: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 2. Efek untuk mendeteksi scroll (UI Dinamis)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sembunyikan navbar di halaman admin atau login
  if (pathname.startsWith('/admin') || pathname.startsWith('/login')) {
    return null;
  }

  return (
    <>
      {/* Navbar Desktop & Tablet */}
      <nav className={`fixed top-0 left-0 right-0 z-[500] pointer-events-none transition-all duration-300 ${isScrolled ? 'px-4 py-3' : 'px-0 py-0'}`}>
        <div className={`mx-auto flex items-center justify-between pointer-events-auto transition-all duration-300 ${
          isScrolled 
            ? 'max-w-7xl bg-white/80 backdrop-blur-md shadow-sm border border-neutral-200/50 rounded-2xl px-5 py-3' 
            : 'max-w-full bg-white border-b border-neutral-200/50 px-6 py-4'
        }`}>
          
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition-colors">
              <MapPin size={18} />
            </div>
            <span className="font-bold text-neutral-800 tracking-tight text-lg group-hover:text-blue-600 transition-colors">
              {title}
            </span>
          </Link>

          {/* Desktop Menu (Looping dari array links) */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link, index) => (
              <Link 
                key={index}
                href={link.href} 
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href ? 'text-blue-600' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {showAdminBtn && (
              <>
                <div className="w-px h-5 bg-neutral-300"></div> {/* Divider */}
                <Link 
                  href="/login" 
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <LogIn size={16} /> Masuk Admin
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed top-20 left-4 right-4 z-[499] md:hidden bg-white shadow-xl border border-neutral-100 rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
          {links.map((link, index) => (
            <Link 
              key={index}
              href={link.href} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium ${
                pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {showAdminBtn && (
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex justify-center items-center gap-2 w-full bg-neutral-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-sm"
            >
              <LogIn size={18} /> Masuk sebagai Admin
            </Link>
          )}
        </div>
      )}
    </>
  );
}