"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { MerchantBrandedLayout } from "@/components/ui/merchant-branded-layout";
import { OTPInput } from "@/components/ui/otp-input";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { easeOut } from "@/lib/motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const MAX_ATTEMPTS = 3;

interface OrderInfo {
  maskedPhone: string;
  status: string;
  locked: boolean;
  verified: boolean;
}

function fillTemplate(tpl: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    tpl
  );
}

export default function VerifyPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [info, setInfo] = useState<OrderInfo | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Server-driven attempt count is opaque on the failure response; track
  // it locally so we can render "n deneme hakkın kaldı" without an extra
  // round-trip. Reset on success.
  const [attemptCount, setAttemptCount] = useState(0);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${API}/confirm/otp/info/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
          return;
        }
        setInfo(data);
        if (data.verified) setSuccess(true);
      })
      .catch(() => setErrorMessage(t("cod_status_lookup_failed")))
      .finally(() => setLoading(false));
  }, [orderId, t]);

  async function submitCode(code: string) {
    if (code.length !== 6) {
      setErrorMessage("6 haneli kodu eksiksiz gir.");
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API}/confirm/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: parseInt(orderId), otpCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAttemptCount((n) => n + 1);
        setErrorMessage(data.error ?? t("cod_error_generic"));
        setOtp("");
        setShake((n) => n + 1);
        if (data.error?.includes("kilitlendi") || res.status === 429) {
          setInfo((prev) => (prev ? { ...prev, locked: true } : prev));
        }
      } else {
        setSuccess(true);
        setAttemptCount(0);
      }
    } catch {
      setErrorMessage(t("cod_error_generic"));
      setShake((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - attemptCount);

  return (
    <MerchantBrandedLayout
      footer={
        info && !success && !info.locked && !loading && !errorMessage?.includes("bulunamadı") ? (
          <PrimaryActionButton
            type="button"
            disabled={otp.length !== 6}
            loading={submitting}
            onClick={() => submitCode(otp)}
          >
            {submitting ? t("cod_otp_verifying") : t("cod_otp_verify")}
          </PrimaryActionButton>
        ) : null
      }
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <Loading key="loading" />
        ) : success ? (
          <SuccessView
            key="success"
            title={t("cod_confirm_success_title")}
            already={info?.verified ? t("cod_otp_already_verified") : undefined}
          />
        ) : info?.locked ? (
          <LockedView
            key="locked"
            title={t("cod_otp_locked_title")}
            desc={t("cod_otp_locked_desc")}
          />
        ) : errorMessage && !info ? (
          <NotFoundView key="notfound" message={errorMessage} />
        ) : (
          <Form
            key="form"
            phone={info?.maskedPhone ?? ""}
            otp={otp}
            shake={shake}
            errorMessage={errorMessage}
            remaining={remaining}
            attemptCount={attemptCount}
            onChange={(v) => {
              setOtp(v);
              if (errorMessage) setErrorMessage(null);
            }}
            onComplete={(full) => submitCode(full)}
            onPasteToast={() => showToast(t("cod_otp_paste_toast"), "success")}
            disabled={submitting}
            t={t}
          />
        )}
      </AnimatePresence>
    </MerchantBrandedLayout>
  );
}

function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center pt-16"
    >
      <div className="relative h-12 w-12">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[var(--color-border)]"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-accent)]"
        />
      </div>
    </motion.div>
  );
}

function Form({
  phone,
  otp,
  shake,
  errorMessage,
  remaining,
  attemptCount,
  onChange,
  onComplete,
  onPasteToast,
  disabled,
  t,
}: {
  phone: string;
  otp: string;
  shake: number;
  errorMessage: string | null;
  remaining: number;
  attemptCount: number;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  onPasteToast: () => void;
  disabled: boolean;
  t: (k: never) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="flex flex-col items-center pt-2 text-center"
    >
      <h1
        className="text-[var(--color-fg)]"
        style={{
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "var(--tracking-display)",
          margin: 0,
        }}
      >
        {(t as (k: string) => string)("cod_otp_title")}
      </h1>
      {phone && (
        <p className="mt-2 max-w-[32ch] text-[15px] text-[var(--color-fg-muted)]">
          {fillTemplate((t as (k: string) => string)("cod_otp_subtitle"), {
            phone: `‪${phone}‬`,
          })}
        </p>
      )}

      <motion.div
        key={shake}
        animate={
          shake > 0
            ? { x: [-6, 6, -6, 6, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.35 }}
        className="mt-8 w-full"
      >
        <OTPInput
          length={6}
          value={otp}
          onChange={onChange}
          onComplete={onComplete}
          onPasteToast={onPasteToast}
          disabled={disabled}
          invalid={!!errorMessage}
        />
      </motion.div>

      <div className="mt-4 min-h-[18px] text-[13px]">
        {errorMessage ? (
          <span className="text-[var(--color-danger)]">{errorMessage}</span>
        ) : attemptCount > 0 ? (
          <span
            className={
              remaining <= 1
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-fg-faint)]"
            }
          >
            {fillTemplate((t as (k: string) => string)("cod_otp_attempts_left"), {
              n: String(remaining),
            })}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

function SuccessView({ title, already }: { title: string; already?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="flex flex-col items-center pt-4 text-center"
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
        {title}
      </h1>
      {already && (
        <p className="mt-2 text-[14px] text-[var(--color-fg-faint)]">{already}</p>
      )}
    </motion.div>
  );
}

function LockedView({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="flex flex-col items-center pt-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.08]">
        <Lock size={36} strokeWidth={1.6} aria-hidden className="text-[var(--color-danger)]" />
      </div>
      <h1
        className="mt-6 text-[var(--color-fg)]"
        style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: "var(--tracking-display)",
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p className="mt-2 max-w-[32ch] text-[15px] text-[var(--color-fg-muted)]">{desc}</p>
    </motion.div>
  );
}

function NotFoundView({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="flex flex-col items-center pt-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        <Search size={36} strokeWidth={1.6} aria-hidden className="text-[var(--color-fg-muted)]" />
      </div>
      <p className="mt-6 text-[15px] text-[var(--color-fg-muted)]">{message}</p>
    </motion.div>
  );
}
