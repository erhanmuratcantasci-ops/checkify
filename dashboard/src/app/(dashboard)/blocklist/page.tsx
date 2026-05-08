"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MapPin, Lock, Store, ShieldCheck, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

interface Shop {
  id: number;
  name: string;
  shopDomain: string | null;
}

interface BlockedPhone {
  id: number;
  phone: string;
  reason: string | null;
  createdAt: string;
}

interface BlockedPostal {
  id: number;
  postalCode: string;
  reason: string | null;
  createdAt: string;
}

type Tab = "phone" | "postal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlocklistPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("phone");
  const [phones, setPhones] = useState<BlockedPhone[]>([]);
  const [postals, setPostals] = useState<BlockedPostal[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [planError, setPlanError] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list: Shop[] = data.shops ?? data ?? [];
        setShops(list);
        if (list.length > 0) setSelectedShop(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const fetchList = useCallback(() => {
    if (!selectedShop) return;
    const token = getToken();
    setListLoading(true);
    const endpoint =
      tab === "phone"
        ? `/shops/${selectedShop}/blocked-phones`
        : `/shops/${selectedShop}/blocked-postal-codes`;
    fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (tab === "phone") setPhones(data.blocked ?? []);
        else setPostals(data.blocked ?? []);
        setListLoading(false);
      })
      .catch(() => setListLoading(false));
  }, [selectedShop, tab]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleAdd() {
    if (!addValue.trim() || !selectedShop) return;
    const token = getToken();
    setAddLoading(true);
    setError("");
    setSuccess("");
    setPlanError(false);
    const endpoint =
      tab === "phone"
        ? `/shops/${selectedShop}/blocked-phones`
        : `/shops/${selectedShop}/blocked-postal-codes`;
    const body =
      tab === "phone"
        ? { phone: addValue.trim(), reason: addReason.trim() || null }
        : { postalCode: addValue.trim(), reason: addReason.trim() || null };
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) setPlanError(true);
        else setError(data.error ?? "Bir hata oluştu");
      } else {
        setAddValue("");
        setAddReason("");
        setSuccess(tab === "phone" ? "Numara engellendi." : "Posta kodu engellendi.");
        fetchList();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Bağlantı hatası");
    }
    setAddLoading(false);
  }

  async function handleDelete(value: string) {
    if (!selectedShop) return;
    const token = getToken();
    const endpoint =
      tab === "phone"
        ? `/shops/${selectedShop}/blocked-phones/${encodeURIComponent(value)}`
        : `/shops/${selectedShop}/blocked-postal-codes/${encodeURIComponent(value)}`;
    await fetch(`${API}${endpoint}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchList();
  }

  const list: (BlockedPhone | BlockedPostal)[] = tab === "phone" ? phones : postals;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-6 py-10">
        <p className="text-[14px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-8 md:py-10">
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
          Engel listesi
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          Belirli telefon numaralarını veya posta kodlarını COD doğrulamasından hariç tut.
        </p>
      </header>

      {shops.length === 0 ? (
        <Card>
          <EmptyState
            icon={Store}
            title="Mağaza eklenmemiş"
            description="Engel listesini kullanmak için önce bir mağaza eklemen gerekiyor."
            action={
              <Link
                href="/shops"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 text-[14px] font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
              >
                Mağaza ekle
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {shops.length > 1 && (
            <Card className="mb-4">
              <Label htmlFor="shop-select">Mağaza</Label>
              <select
                id="shop-select"
                value={selectedShop ?? ""}
                onChange={(e) => setSelectedShop(Number(e.target.value))}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-[14px] text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.shopDomain ? ` — ${s.shopDomain}` : ""}
                  </option>
                ))}
              </select>
            </Card>
          )}

          {planError && (
            <Card className="mb-4 border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.06]">
              <div className="flex items-start gap-3">
                <Lock
                  size={18}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                />
                <div>
                  <p className="text-[14px] font-medium text-[var(--color-danger)]">
                    PRO plan gerekli
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                    Engel listesi özelliği PRO ve üzeri planlarda kullanılabilir.{" "}
                    <Link
                      href="/pricing"
                      className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      Planı yükselt →
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="mb-5 flex gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
            {(
              [
                { key: "phone" as Tab, label: "Telefon numaraları", Icon: Phone },
                { key: "postal" as Tab, label: "Posta kodları", Icon: MapPin },
              ] as const
            ).map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    setError("");
                    setPlanError(false);
                  }}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-[calc(var(--radius-md)-2px)] text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                      : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
                  )}
                >
                  <Icon size={15} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                {tab === "phone" ? "Numara engelle" : "Posta kodu engelle"}
              </CardTitle>
            </CardHeader>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[160px] flex-1">
                <Label htmlFor="block-value" className="text-[12px]">
                  {tab === "phone" ? "Telefon" : "Posta kodu"}
                </Label>
                <Input
                  id="block-value"
                  type="text"
                  value={addValue}
                  placeholder={tab === "phone" ? "+90 5xx xxx xx xx" : "34000"}
                  onChange={(e) => setAddValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="min-w-[160px] flex-1">
                <Label htmlFor="block-reason" className="text-[12px]">
                  Sebep <span className="text-[var(--color-fg-faint)]">opsiyonel</span>
                </Label>
                <Input
                  id="block-reason"
                  type="text"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <Button
                size="md"
                loading={addLoading}
                disabled={!addValue.trim()}
                onClick={handleAdd}
              >
                Ekle
              </Button>
            </div>
            {error && (
              <p className="mt-3 text-[13px] text-[var(--color-danger)]">{error}</p>
            )}
            {success && (
              <p className="mt-3 text-[13px] text-[var(--color-success)]">{success}</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tab === "phone" ? "Engellenen numaralar" : "Engellenen posta kodları"}
                <Badge tone="accent">{list.length}</Badge>
              </CardTitle>
            </CardHeader>

            {listLoading ? (
              <p className="text-[13px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
            ) : list.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title={
                  tab === "phone"
                    ? "Engellenen numara yok"
                    : "Engellenen posta kodu yok"
                }
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {list.map((item) => {
                  const value =
                    tab === "phone"
                      ? (item as BlockedPhone).phone
                      : (item as BlockedPostal).postalCode;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-[var(--color-fg)] tabular-nums">
                          {value}
                          {item.reason && (
                            <span className="ml-2 font-normal text-[var(--color-fg-muted)]">
                              · {item.reason}
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-[var(--color-fg-faint)]">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]"
                        onClick={() => handleDelete(value)}
                      >
                        <X size={14} aria-hidden />
                        Kaldır
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
