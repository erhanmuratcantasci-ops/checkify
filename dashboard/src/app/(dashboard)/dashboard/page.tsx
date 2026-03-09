'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, User } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    auth.me()
      .then(({ user }) => setUser(user))
      .catch(() => router.push('/login'));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  const memberSince = new Date(user.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Checkify</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name ?? user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Çıkış yap
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Hoş geldin, {user.name ?? 'kullanıcı'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Dashboard'una genel bakış</p>
        </div>

        {/* Profil Kartı */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Profil Bilgileri</h3>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              {user.name && (
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              )}
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">Üye olma tarihi: {memberSince}</p>
            </div>
          </div>
        </div>

        {/* Bilgi Satırları */}
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-500">Kullanıcı ID</span>
            <span className="text-sm font-medium text-gray-900">#{user.id}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-500">Ad Soyad</span>
            <span className="text-sm font-medium text-gray-900">{user.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-500">Kayıt tarihi</span>
            <span className="text-sm font-medium text-gray-900">{memberSince}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
