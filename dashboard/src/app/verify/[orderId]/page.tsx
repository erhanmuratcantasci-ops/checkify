'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import GeometricBackground from '@/components/GeometricBackground';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

interface OrderInfo {
  maskedPhone: string;
  status: string;
  locked: boolean;
  verified: boolean;
}

export default function VerifyPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [info, setInfo] = useState<OrderInfo | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${API}/confirm/otp/info/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setInfo(data);
        if (data.verified) setSuccess(true);
      })
      .catch(() => setError('Sipariş bilgisi yüklenemedi'))
      .finally(() => setLoading(false));
  }, [orderId]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit() {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('6 haneli kodu eksiksiz girin');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API}/confirm/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: parseInt(orderId), otpCode: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Doğrulama başarısız');
        if (data.error?.includes('kilitlendi')) {
          setInfo(prev => prev ? { ...prev, locked: true } : null);
        }
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: 48,
    height: 56,
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.3)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <GeometricBackground />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 12, padding: '10px 18px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>C</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff' }}>
              chekkify
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '36px 28px',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
              Yükleniyor...
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{
                color: '#059669', fontSize: 22, fontWeight: 700,
                fontFamily: "'Syne', sans-serif", margin: '0 0 8px',
              }}>
                Siparişiniz Onaylandı
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                Teşekkürler! Siparişiniz başarıyla doğrulandı.
              </p>
            </div>
          ) : info?.locked ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
              <h2 style={{
                color: '#ef4444', fontSize: 20, fontWeight: 700,
                fontFamily: "'Syne', sans-serif", margin: '0 0 8px',
              }}>
                Sipariş Kilitlendi
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                Çok fazla hatalı deneme yapıldı. Lütfen mağaza ile iletişime geçin.
              </p>
            </div>
          ) : error && !info ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ color: '#ef4444', fontSize: 15 }}>{error}</div>
            </div>
          ) : (
            <>
              <h1 style={{
                color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 8px',
                fontFamily: "'Syne', sans-serif", textAlign: 'center',
              }}>
                SMS Doğrulama
              </h1>
              {info && (
                <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', margin: '0 0 28px' }}>
                  <strong style={{ color: '#d1d5db' }}>{info.maskedPhone}</strong> numaralı telefona gönderilen 6 haneli kodu girin
                </p>
              )}

              {/* OTP Input */}
              <div style={{
                display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24,
              }} onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    style={{
                      ...inputStyle,
                      borderColor: digit ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10, padding: '10px 14px',
                  color: '#f87171', fontSize: 13,
                  textAlign: 'center', marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || otp.join('').length !== 6}
                style={{
                  width: '100%', padding: '14px',
                  background: otp.join('').length === 6
                    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                    : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: 12,
                  color: otp.join('').length === 6 ? '#fff' : '#4b5563',
                  fontSize: 15, fontWeight: 600, cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {submitting ? 'Doğrulanıyor...' : 'Doğrula'}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: '#374151', fontSize: 12 }}>
          Powered by chekkify
        </div>
      </div>
    </div>
  );
}
