"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { easeOut } from "@/lib/motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);

  function showError(message: string) {
    setError(message);
    setErrorKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Giriş başarısız");
        return;
      }
      // 8-saatlik admin token cookie'si
      const maxAge = 8 * 60 * 60;
      document.cookie = `adminToken=${data.adminToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
      router.push("/admin");
    } catch {
      showError("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="mb-10">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          Admin paneli
        </h1>
        <p
          className="text-[var(--color-fg-muted)]"
          style={{ fontSize: 15, margin: "8px 0 0", letterSpacing: "var(--tracking-body)" }}
        >
          Yönetici hesabınla giriş yap
        </p>
      </header>

      <AnimatePresence>
        {error && (
          <motion.div
            key={errorKey}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0, x: [-4, 4, -4, 4, 0] }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="mb-5 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.08] px-4 py-3 text-[14px] text-[var(--color-danger)]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@chekkify.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="admin-password" className="mb-0">
              Şifre
            </Label>
            <Link
              href="/admin/reset-password"
              className="text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:underline"
            >
              Şifremi değiştir
            </Link>
          </div>
          <div className="mt-2">
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>

      <p className="mt-8 text-center text-[12px] text-[var(--color-fg-faint)]">
        Yetkisiz erişim yasaktır.
      </p>
    </>
  );
}
