"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password tidak boleh kosong.');
      return;
    }

    setIsLoading(true);

    // Simulasi pemanggilan API login
   try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      if (username === 'admin' && password === 'admin123') {
        
        // --- TAMBAHKAN BARIS INI ---
        // Set cookie 'is_admin=true' yang berlaku untuk seluruh path ('/') 
        // dan akan kedaluwarsa dalam 1 hari (86400 detik)
        document.cookie = "is_admin=true; path=/; max-age=86400";
        // --------------------------

        router.push('/admin'); 
      } else {
        setError('Username atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server.');
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Dekorasi Background Latar Belakang */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/50 z-10 relative">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-neutral-900/20">
            <MapPin size={28} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Login Admin</h1>
          <p className="text-sm text-neutral-500 mt-2 font-medium">
            Sistem Informasi Geografis Mataram
          </p>
        </div>

        {/* Pesan Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Input Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1 block">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-neutral-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Masukkan username..."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1 block">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-neutral-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Masukkan password..."
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Memverifikasi...</span>
              </div>
            ) : (
              <>
                Masuk ke Dasbor
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer (Opsional) */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            &larr; Kembali ke Peta Publik
          </button>
        </div>
        
      </div>
    </div>
  );
}