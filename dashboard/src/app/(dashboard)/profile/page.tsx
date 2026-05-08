"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
} from "lucide-react";
import { SkeletonProfile } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { easeOut } from "@/lib/motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface User {
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  referralCode?: string | null;
  referredCount?: number;
  twoFactorEnabled?: boolean;
  smsCredits?: number;
  whatsappCredits?: number;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function authHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFAStep, setTwoFAStep] = useState<"idle" | "setup" | "disable">("idle");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState<string | null>(null);

  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const u = data.user ?? data;
        setUser(u);
        setName(u.name ?? "");
        setEmail(u.email ?? "");
        setTwoFAEnabled(u.twoFactorEnabled ?? false);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function setup2FA() {
    setTwoFALoading(true);
    setTwoFAMsg(null);
    const res = await fetch(`${API}/auth/2fa/setup`, { headers: authHeaders() });
    const data = await res.json();
    if (data.qrCode) {
      setQrCode(data.qrCode);
      setTwoFAStep("setup");
    } else setTwoFAMsg(data.error ?? "Hata");
    setTwoFALoading(false);
  }

  async function enable2FA() {
    setTwoFALoading(true);
    setTwoFAMsg(null);
    const res = await fetch(`${API}/auth/2fa/enable`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token: twoFAToken }),
    });
    const data = await res.json();
    if (data.success) {
      setTwoFAEnabled(true);
      setTwoFAStep("idle");
      setQrCode(null);
      setTwoFAToken("");
      setTwoFAMsg("2FA aktif edildi");
    } else setTwoFAMsg(data.error ?? "Hata");
    setTwoFALoading(false);
  }

  async function disable2FA() {
    setTwoFALoading(true);
    setTwoFAMsg(null);
    const res = await fetch(`${API}/auth/2fa/disable`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token: twoFAToken }),
    });
    const data = await res.json();
    if (data.success) {
      setTwoFAEnabled(false);
      setTwoFAStep("idle");
      setTwoFAToken("");
      setTwoFAMsg("2FA devre dışı bırakıldı");
    } else setTwoFAMsg(data.error ?? "Hata");
    setTwoFALoading(false);
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const body: Record<string, string> = {};
      if (name !== user?.name) body.name = name;
      if (email !== user?.email) body.email = email;
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setUser(data.user);
      showToast(t("profile_toast_info_updated"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(t("profile_pw_mismatch"), "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast(t("profile_pw_too_short"), "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("profile_toast_pw_updated"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      document.cookie = "token=; path=/; max-age=0";
      document.cookie = "refreshToken=; path=/; max-age=0";
      router.push("/");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
      setDeleting(false);
    }
  }

  function copyReferral() {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  const initials =
    user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-8 md:px-8 md:py-10">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        <ArrowLeft size={14} aria-hidden />
        {t("back_dashboard")}
      </button>

      <header className="mb-6">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          {t("profile_title")}
        </h1>
      </header>

      {loading ? (
        <SkeletonProfile />
      ) : (
        <>
          <Card className="mb-4">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-faded)] text-[15px] font-medium text-[var(--color-accent)]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[var(--color-fg)]">
                  {user?.name || "—"}
                </p>
                <p className="truncate text-[13px] text-[var(--color-fg-muted)]">
                  {user?.email}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                [
                  t("profile_created_at"),
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—",
                ],
                [
                  t("profile_last_login"),
                  user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("profile_last_login_unknown"),
                ],
                ["SMS kredisi", String(user?.smsCredits ?? 0)],
                ["WhatsApp kredisi", String(user?.whatsappCredits ?? 0)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5"
                >
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[13px] text-[var(--color-fg)]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{t("profile_account_info")}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSaveInfo} className="flex flex-col gap-3">
              <div>
                <Label htmlFor="profile-name">{t("profile_name")}</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("profile_name_placeholder")}
                />
              </div>
              <div>
                <Label htmlFor="profile-email">{t("profile_email")}</Label>
                <Input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mt-1">
                <Button type="submit" loading={savingInfo}>
                  {savingInfo ? t("profile_saving_info") : t("profile_save_info")}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{t("profile_change_password")}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSavePassword} className="flex flex-col gap-3">
              {[
                {
                  id: "pw-current",
                  label: t("profile_current_password"),
                  value: currentPassword,
                  onChange: setCurrentPassword,
                  autoComplete: "current-password",
                },
                {
                  id: "pw-new",
                  label: t("profile_new_password"),
                  value: newPassword,
                  onChange: setNewPassword,
                  autoComplete: "new-password",
                },
                {
                  id: "pw-confirm",
                  label: t("profile_confirm_password"),
                  value: confirmPassword,
                  onChange: setConfirmPassword,
                  autoComplete: "new-password",
                },
              ].map((f) => (
                <div key={f.id}>
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input
                    id={f.id}
                    type="password"
                    required
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={f.autoComplete}
                  />
                </div>
              ))}
              <div className="mt-1">
                <Button type="submit" loading={savingPassword}>
                  {savingPassword ? t("profile_changing_pw") : t("profile_change_pw")}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Referral programı</CardTitle>
            </CardHeader>
            <p className="mb-4 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
              Davet kodunu paylaş — her yeni üye için sen ve arkadaşın{" "}
              <span className="font-medium text-[var(--color-accent)]">
                50&apos;şer SMS kredisi
              </span>{" "}
              kazanırsın.
            </p>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-accent-faded)] px-4 py-3 text-center font-mono text-[16px] font-medium tracking-[3px] text-[var(--color-accent)]">
                {user?.referralCode || "—"}
              </div>
              <Button size="md" variant="secondary" onClick={copyReferral}>
                {referralCopied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                {referralCopied ? "Kopyalandı" : "Kopyala"}
              </Button>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                Davet ettiğin kişi
              </p>
              <p className="mt-1 text-[22px] font-medium text-[var(--color-fg)] tabular-nums">
                {user?.referredCount ?? 0}
              </p>
            </div>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>İki faktörlü doğrulama</CardTitle>
              {twoFAEnabled ? (
                <Badge tone="success">
                  <ShieldCheck size={11} aria-hidden /> Aktif
                </Badge>
              ) : (
                <Badge tone="neutral">
                  <ShieldAlert size={11} aria-hidden /> Devre dışı
                </Badge>
              )}
            </CardHeader>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-[var(--color-fg-muted)]">
                {twoFAEnabled
                  ? "Hesabın iki faktörlü doğrulama ile korunuyor."
                  : "Google Authenticator ile hesabını güvende tut."}
              </p>
              {twoFAStep === "idle" && (
                <Button
                  size="sm"
                  variant={twoFAEnabled ? "ghost" : "primary"}
                  loading={twoFALoading}
                  onClick={twoFAEnabled ? () => setTwoFAStep("disable") : setup2FA}
                  className={twoFAEnabled ? "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]" : ""}
                >
                  {twoFAEnabled ? "Devre dışı bırak" : "2FA kur"}
                </Button>
              )}
            </div>

            {twoFAMsg && (
              <p
                className={
                  "mt-3 rounded-[var(--radius-md)] px-3 py-2 text-[13px] " +
                  (twoFAMsg.includes("aktif") || twoFAMsg.includes("bırakıldı")
                    ? "border border-[var(--color-success)]/20 bg-[var(--color-success)]/[0.08] text-[var(--color-success)]"
                    : "border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/[0.08] text-[var(--color-danger)]")
                }
              >
                {twoFAMsg}
              </p>
            )}

            {twoFAStep === "setup" && qrCode && (
              <div className="mt-4">
                <p className="mb-3 text-[13px] text-[var(--color-fg-muted)]">
                  Google Authenticator uygulamasıyla QR kodu okut, ardından üretilen 6
                  haneli kodu gir.
                </p>
                <img
                  src={qrCode}
                  alt="2FA QR kod"
                  className="mb-3 h-40 w-40 rounded-[var(--radius-md)] border border-[var(--color-border)]"
                />
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFAToken}
                    onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, ""))}
                    placeholder="6 haneli kod"
                    className="flex-1 min-w-[160px] tracking-[6px] text-center text-[18px] font-medium"
                  />
                  <Button
                    onClick={enable2FA}
                    disabled={twoFAToken.length !== 6}
                    loading={twoFALoading}
                  >
                    Doğrula
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTwoFAStep("idle");
                      setQrCode(null);
                      setTwoFAToken("");
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}

            {twoFAStep === "disable" && (
              <div className="mt-4">
                <p className="mb-3 text-[13px] text-[var(--color-fg-muted)]">
                  2FA&apos;yı devre dışı bırakmak için authenticator uygulamasındaki kodu gir.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFAToken}
                    onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, ""))}
                    placeholder="6 haneli kod"
                    invalid
                    className="flex-1 min-w-[160px] tracking-[6px] text-center text-[18px] font-medium"
                  />
                  <Button
                    onClick={disable2FA}
                    disabled={twoFAToken.length !== 6}
                    loading={twoFALoading}
                    className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/85 text-white"
                  >
                    Kapat
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTwoFAStep("idle");
                      setTwoFAToken("");
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="border-[var(--color-danger)]/20 bg-[var(--color-danger)]/[0.04]">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                aria-hidden
                className="mt-0.5 shrink-0 text-[var(--color-danger)]"
              />
              <div className="flex-1">
                <p
                  className="text-[var(--color-danger)]"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "var(--tracking-heading)",
                  }}
                >
                  {t("profile_danger_zone")}
                </p>
                <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                  {t("profile_danger_desc")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(true)}
                className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]"
              >
                {t("profile_delete_account")}
              </Button>
            </div>
          </Card>
        </>
      )}

      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowDelete(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-danger)]/30 bg-[var(--color-bg-overlay)] p-6 shadow-[var(--shadow-lg)]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2
                  className="text-[var(--color-danger)]"
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: "var(--tracking-heading)",
                  }}
                >
                  {t("profile_delete_modal_title")}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDelete(false)}
                  aria-label="Kapat"
                  className="h-8 w-8 px-0"
                >
                  <X size={14} aria-hidden />
                </Button>
              </div>
              <p className="mb-5 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
                {t("profile_delete_modal_desc")}
              </p>
              <form onSubmit={handleDelete} className="flex flex-col gap-3">
                <div>
                  <Label htmlFor="delete-pw">{t("profile_delete_password_label")}</Label>
                  <Input
                    id="delete-pw"
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="••••••••"
                    invalid
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="submit"
                    block
                    loading={deleting}
                    className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/85 text-white"
                  >
                    {deleting ? t("profile_delete_deleting") : t("profile_delete_confirm")}
                  </Button>
                  <Button
                    type="button"
                    block
                    variant="secondary"
                    onClick={() => {
                      setShowDelete(false);
                      setDeletePassword("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
