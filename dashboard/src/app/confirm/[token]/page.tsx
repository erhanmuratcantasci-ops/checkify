"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { MerchantBrandedLayout } from "@/components/ui/merchant-branded-layout";
import { OrderSummaryCard } from "@/components/ui/order-summary-card";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { easeOut } from "@/lib/motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const MIN_LOADING_MS = 1000; // perceived "we're working" window

type State =
  | { kind: "loading" }
  | { kind: "success"; order: Order }
  | { kind: "error"; message: string; httpStatus?: number };

interface Order {
  id: number;
  customerName: string;
  total: number;
  status: string;
}

function fillTemplate(tpl: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    tpl
  );
}

export default function ConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) return;
    const startedAt = Date.now();
    const minWait = new Promise((r) => setTimeout(r, MIN_LOADING_MS));

    Promise.all([fetch(`${API}/confirm/${token}`).then(async (r) => ({ res: r, body: await r.json() })), minWait])
      .then(([{ res, body }]) => {
        const elapsed = Date.now() - startedAt;
        const settle = () => {
          if (!res.ok) {
            const message =
              res.status === 410
                ? t("cod_error_token_expired")
                : res.status === 404
                  ? t("cod_error_token_invalid")
                  : (body?.error as string) || t("cod_error_generic");
            setState({ kind: "error", message, httpStatus: res.status });
            return;
          }
          setState({ kind: "success", order: body.order });
        };
        // ensure perceived loading even if API was very fast (paranoia)
        if (elapsed < MIN_LOADING_MS) setTimeout(settle, MIN_LOADING_MS - elapsed);
        else settle();
      })
      .catch(() => setState({ kind: "error", message: t("cod_error_generic") }));
  }, [token, t]);

  return (
    <MerchantBrandedLayout
      footer={
        state.kind === "success" ? (
          <Link
            href="/"
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-[var(--radius-md)]"
          >
            <PrimaryActionButton type="button">
              {t("cod_track_status")}
              <ArrowRight size={16} aria-hidden />
            </PrimaryActionButton>
          </Link>
        ) : null
      }
    >
      <AnimatePresence mode="wait">
        {state.kind === "loading" && <LoadingState key="loading" label={t("cod_confirm_loading")} />}
        {state.kind === "success" && (
          <SuccessState
            key="success"
            order={state.order}
            intro={fillTemplate(t("cod_confirm_success_intro"), {
              customer: state.order.customerName.split(" ")[0] ?? state.order.customerName,
            })}
            title={t("cod_confirm_success_title")}
            shopThanks={t("cod_confirm_delivery_hint")}
          />
        )}
        {state.kind === "error" && (
          <ErrorState
            key="error"
            title={t("cod_error_title")}
            message={state.message}
            backLabel={t("cod_back_home")}
            httpStatus={state.httpStatus}
          />
        )}
      </AnimatePresence>
    </MerchantBrandedLayout>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="flex flex-col items-center justify-center pt-12 text-center"
    >
      <div className="relative h-16 w-16">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[var(--color-border)]"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-accent)]"
        />
      </div>
      <p className="mt-6 text-[15px] text-[var(--color-fg-muted)]">{label}</p>
    </motion.div>
  );
}

function SuccessState({
  order,
  intro,
  title,
  shopThanks,
}: {
  order: Order;
  intro: string;
  title: string;
  shopThanks: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="flex flex-col items-center pt-4 text-center"
    >
      <SuccessCheckmark />
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
      <p className="mt-2 text-[15px] text-[var(--color-fg-muted)]">{intro}</p>
      <p className="mt-1 text-[14px] text-[var(--color-fg-faint)]">{shopThanks}</p>

      <OrderSummaryCard
        className="mt-6 w-full text-left"
        customerName={order.customerName}
        orderId={order.id}
        total={order.total}
      />
    </motion.div>
  );
}

function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent-faded)]"
    >
      <motion.span
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 460, damping: 20, delay: 0.12 }}
      >
        <CheckCircle2
          size={42}
          strokeWidth={1.6}
          className="text-[var(--color-accent)]"
          aria-hidden
        />
      </motion.span>
    </motion.div>
  );
}

function ErrorState({
  title,
  message,
  backLabel,
  httpStatus,
}: {
  title: string;
  message: string;
  backLabel: string;
  httpStatus?: number;
}) {
  const Icon = httpStatus === 410 ? Clock : AlertTriangle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="flex flex-col items-center pt-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.08]">
        <Icon
          size={36}
          strokeWidth={1.6}
          aria-hidden
          className="text-[var(--color-danger)]"
        />
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
      <p className="mt-2 max-w-[28ch] text-[15px] text-[var(--color-fg-muted)]">
        {message}
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-transparent px-5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]"
      >
        {backLabel}
      </Link>
    </motion.div>
  );
}
