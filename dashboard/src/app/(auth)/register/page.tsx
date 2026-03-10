'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await auth.register(email, password, name);
      localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-syne)' }}>
          Hesap oluştur
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Giriş yap
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Ad Soyad', type: 'text', value: name, onChange: setName, placeholder: 'Ad Soyad', required: false },
            { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'ornek@email.com', required: true },
            { label: 'Şifre', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••', required: true },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{field.label}</label>
              <input
                type={field.type}
                required={field.required}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt ol'}
          </button>
        </form>
      </div>
    </div>
  );
}
