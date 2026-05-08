"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, Store as StoreIcon, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface User {
  name: string;
  email: string;
  createdAt: string;
}

interface Stats {
  total: number;
  totalRevenue: number;
  byStatus: Record<string, number>;
  todayOrders: number;
  todayRevenue?: number;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Shop {
  id: number;
  name: string;
  shopDomain?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
  BLOCKED: "Engellendi",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  PREPARING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  BLOCKED: "danger",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
    if (!token) {
      router.push("/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/auth/me`, { headers }).then((r) => r.json()),
      fetch(`${API}/orders/stats`, { headers }).then((r) => r.json()),
      fetch(`${API}/orders`, { headers }).then((r) => r.json()),
      fetch(`${API}/shops`, { headers }).then((r) => r.json()).catch(() => ({ shops: [] })),
    ])
      .then(([userData, statsData, ordersData, shopsData]) => {
        setUser(userData.user ?? userData);
        setStats({
          total: statsData.total ?? 0,
          totalRevenue: statsData.totalRevenue ?? 0,
          byStatus: statsData.byStatus ?? {},
          todayOrders: statsData.todayOrders ?? 0,
          todayRevenue: statsData.todayRevenue,
        });
        const list: Order[] = Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders ?? ordersData.data ?? [];
        setRecent(list.slice(0, 10));
        const shopList: Shop[] = Array.isArray(shopsData)
          ? shopsData
          : shopsData.shops ?? [];
        setShops(shopList);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const confirmed = stats?.byStatus?.["CONFIRMED"] ?? 0;
  const pending = stats?.byStatus?.["PENDING"] ?? 0;
  const cancelled = stats?.byStatus?.["CANCELLED"] ?? 0;
  const total = stats?.total ?? 0;
  const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const todayRevenue = stats?.todayRevenue ?? 0;

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-8">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          Genel bakış
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          {firstName ? `Merhaba ${firstName}, ` : ""}işletmenin durumuna kısa bir bakış.
        </p>
      </header>

      <section
        aria-label="Önemli metrikler"
        className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          label="Bugünkü ciro"
          value={loading ? "—" : formatCurrency(todayRevenue)}
          hint={`${stats?.todayOrders ?? 0} sipariş`}
        />
        <MetricCard
          label="Onaylanan sipariş"
          value={loading ? "—" : confirmed.toLocaleString("tr-TR")}
          delta={total > 0 ? `%${confirmRate}` : undefined}
          deltaTone="success"
        />
        <MetricCard
          label="Bekleyen onay"
          value={loading ? "—" : pending.toLocaleString("tr-TR")}
          deltaTone={pending > 0 ? "warning" : "neutral"}
          delta={pending > 0 ? "aksiyon" : undefined}
        />
        <MetricCard
          label="İptal oranı"
          value={loading ? "—" : `%${cancelRate}`}
          delta={cancelled > 0 ? cancelled.toLocaleString("tr-TR") : undefined}
          deltaTone={cancelRate > 20 ? "danger" : "neutral"}
          hint={cancelRate > 20 ? "Yüksek iptal oranı" : undefined}
        />
      </section>

      <section className="mb-6">
        <Card className="p-0">
          <CardHeader className="px-6 pt-5">
            <CardTitle>Son siparişler</CardTitle>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              Hepsini gör <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>

          {loading ? (
            <div className="px-6 pb-6 text-[13px] text-[var(--color-fg-faint)]">
              {t("dash_loading")}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Henüz sipariş yok"
              description="İlk siparişin geldiğinde burada görünecek."
            />
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Müşteri</TH>
                  <TH>Telefon</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH>Durum</TH>
                  <TH>Tarih</TH>
                </TR>
              </THead>
              <TBody>
                {recent.map((o) => (
                  <TR
                    key={o.id}
                    onClick={() => router.push(`/orders/${o.id}`)}
                    className="cursor-pointer"
                  >
                    <TD className="font-medium">{o.customerName || "—"}</TD>
                    <TD className="text-[var(--color-fg-muted)] tabular-nums">
                      {o.customerPhone}
                    </TD>
                    <TD className="text-right tabular-nums">{formatCurrency(o.total)}</TD>
                    <TD>
                      <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </TD>
                    <TD className="text-[var(--color-fg-muted)] tabular-nums">
                      {formatDate(o.createdAt)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Mağazalar</CardTitle>
            <Link
              href="/shops"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              Yönet <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>

          {loading ? (
            <div className="text-[13px] text-[var(--color-fg-faint)]">{t("dash_loading")}</div>
          ) : shops.length === 0 ? (
            <EmptyState
              icon={StoreIcon}
              title="Mağaza eklenmemiş"
              description="Shopify mağazanı bağlayarak başla."
              action={
                <Link
                  href="/shops"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 text-[14px] font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
                >
                  Mağaza ekle
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {shops.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[var(--color-fg)]">
                      {s.name}
                    </p>
                    {s.shopDomain && (
                      <p className="truncate text-[12px] text-[var(--color-fg-muted)]">
                        {s.shopDomain}
                      </p>
                    )}
                  </div>
                  <Badge tone="success">Bağlı</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
