"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { easeOut } from "@/lib/motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const [require2FA, setRequire2FA] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  function showError(message: string) {
    setError(message);
    setErrorKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setEmailNotVerified(true);
          setUnverifiedEmail(email);
          setLoading(false);
          return;
        }
        throw new Error(data.error || t("login_error_default"));
      }
      if (data.require2FA) {
        setPreAuthToken(data.preAuthToken);
        setRequire2FA(true);
        setLoading(false);
        return;
      }
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      }
      setEmailNotVerified(false);
      router.push("/dashboard");
    } catch (err) {
      showError(err instanceof Error ? err.message : t("error_occurred"));
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA() {
    setTwoFALoading(true);
    const res = await fetch(`${API}/auth/2fa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preAuthToken, token: twoFACode }),
    });
    const data = await res.json();
    if (data.token) {
      document.cookie = `token=${data.token}; path=/; max-age=${24 * 3600}; SameSite=Lax`;
      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      }
      router.push("/dashboard");
    } else {
      showError(data.error ?? "Geçersiz kod");
    }
    setTwoFALoading(false);
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("forgot_error_default"));
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : t("forgot_error_default"));
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgot() {
    setForgotOpen(true);
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotError("");
  }

  async function resendVerification() {
    await fetch(`${API}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    alert("Doğrulama emaili gönderildi!");
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
          {t("login_welcome")}
        </h1>
        <p
          className="text-[var(--color-fg-muted)]"
          style={{ fontSize: 15, margin: "8px 0 0", letterSpacing: "var(--tracking-body)" }}
        >
          {t("login_sign_in_subtitle")}
        </p>
      </header>

      {emailNotVerified && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: easeOut }}
          className="mb-5 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/[0.08] p-4"
        >
          <p className="m-0 text-[14px] font-medium text-[var(--color-warning)]">
            Email adresiniz doğrulanmamış
          </p>
          <p className="mt-1 mb-3 text-[13px] text-[var(--color-fg-muted)]">
            Gelen kutunuzu kontrol edin veya yeni doğrulama emaili isteyin.
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={resendVerification}>
            Tekrar gönder
          </Button>
        </motion.div>
      )}

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
          <Label htmlFor="email">{t("login_email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              {t("login_password")}
            </Label>
            <button
              type="button"
              onClick={openForgot}
              className="text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:underline"
            >
              {t("login_forgot")}
            </button>
          </div>
          <div className="mt-2">
            <Input
              id="password"
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
          {loading ? t("login_submitting") : t("login_submit")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)] opacity-60" />
        <span className="text-[12px] uppercase tracking-[0.08em] text-[var(--color-fg-faint)]">
          {t("or")}
        </span>
        <div className="h-px flex-1 bg-[var(--color-border)] opacity-60" />
      </div>

      <Button
        type="button"
        size="lg"
        variant="secondary"
        block
        onClick={() => signIn("google", { callbackUrl: "/auth/google/callback" })}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
        {t("login_google")}
      </Button>

      <p className="mt-8 text-center text-[14px] text-[var(--color-fg-muted)]">
        {t("login_no_account")}
        <Link
          href="/register"
          className="ml-1.5 font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
        >
          {t("login_register_link")}
        </Link>
      </p>

      <AnimatePresence>
        {require2FA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-overlay)] p-7 shadow-[var(--shadow-lg)]"
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "var(--tracking-heading)",
                }}
                className="mb-2 text-center text-[var(--color-fg)]"
              >
                İki faktörlü doğrulama
              </h2>
              <p className="mb-6 text-center text-[13px] text-[var(--color-fg-muted)]">
                Authenticator uygulamasındaki 6 haneli kodu girin
              </p>
              <Input
                inputSize="lg"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && twoFACode.length === 6) handle2FA();
                }}
                className="mb-3 text-center text-[26px] font-medium tracking-[8px]"
              />
              {error && (
                <p className="mb-3 text-center text-[13px] text-[var(--color-danger)]">{error}</p>
              )}
              <Button
                type="button"
                size="lg"
                block
                disabled={twoFACode.length !== 6}
                loading={twoFALoading}
                onClick={handle2FA}
              >
                {twoFALoading ? "Doğrulanıyor..." : "Doğrula"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setForgotOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-overlay)] p-7 shadow-[var(--shadow-lg)]"
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "var(--tracking-heading)",
                }}
                className="mb-2 text-center text-[var(--color-fg)]"
              >
                {t("forgot_title")}
              </h2>

              {forgotSuccess ? (
                <>
                  <p className="mb-6 text-center text-[14px] leading-relaxed text-[var(--color-fg-muted)]">
                    {t("forgot_sent_desc")}
                  </p>
                  <Button type="button" size="lg" block onClick={() => setForgotOpen(false)}>
                    {t("ok")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-5 text-center text-[13px] text-[var(--color-fg-muted)]">
                    {t("forgot_desc")}
                  </p>
                  {forgotError && (
                    <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.08] px-3 py-2 text-center text-[13px] text-[var(--color-danger)]">
                      {forgotError}
                    </p>
                  )}
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
                    <Input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ornek@email.com"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="md" block loading={forgotLoading}>
                        {forgotLoading ? t("forgot_sending") : t("forgot_send")}
                      </Button>
                      <Button
                        type="button"
                        size="md"
                        variant="secondary"
                        block
                        onClick={() => setForgotOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
