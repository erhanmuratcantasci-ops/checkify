"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { easeOut } from "@/lib/motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getAdminToken() {
  return document.cookie.split("; ").find((r) => r.startsWith("adminToken="))?.split("=")[1] ?? null;
}

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [success, setSuccess] = useState(false);

  function showError(message: string) {
    setError(message);
    setErrorKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPw.length < 8) {
      showError("Yeni şifre en az 8 karakter olmalı");
      return;
    }
    if (newPw !== confirm) {
      showError("Yeni şifreler eşleşmiyor");
      return;
    }

    const token = getAdminToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/admin-auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Hata oluştu");
        return;
      }
      setSuccess(true);
    } catch {
      showError("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="flex flex-col items-center pt-2 text-center"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent-faded)]"
        >
          <CheckCircle2 size={42} strokeWidth={1.6} aria-hidden className="text-[var(--color-accent)]" />
        </motion.div>
        <h1
          className="mt-6 text-[var(--color-fg)]"
          style={{
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          Şifre güncellendi
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-fg-muted)]">
          Yeni şifrenle tekrar giriş yapabilirsin.
        </p>
        <Button size="lg" className="mt-7" onClick={() => router.push("/admin/login")}>
          Giriş sayfasına dön
        </Button>
      </motion.div>
    );
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
          Şifre değiştir
        </h1>
        <p
          className="text-[var(--color-fg-muted)]"
          style={{ fontSize: 15, margin: "8px 0 0", letterSpacing: "var(--tracking-body)" }}
        >
          Admin şifreni güncelle
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
          <Label htmlFor="admin-current-pw">Mevcut şifre</Label>
          <Input
            id="admin-current-pw"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <Label htmlFor="admin-new-pw">Yeni şifre</Label>
          <Input
            id="admin-new-pw"
            type="password"
            autoComplete="new-password"
            required
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Min. 8 karakter"
          />
        </div>
        <div>
          <Label htmlFor="admin-confirm-pw">Yeni şifre (tekrar)</Label>
          <Input
            id="admin-confirm-pw"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <Button type="submit" size="lg" block loading={loading}>
            {loading ? "Güncelleniyor…" : "Güncelle"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            block
            onClick={() => router.push("/admin/login")}
          >
            İptal
          </Button>
        </div>
      </form>
    </>
  );
}
