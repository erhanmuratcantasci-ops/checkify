"use client";

import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Button,
  ButtonGroup,
  ResourceList,
  ResourceItem,
  Badge,
  CalloutCard,
  Banner,
  EmptyState,
} from "@shopify/polaris";
import { useEffect, useState } from "react";

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chekkify.com";

interface MetricTile {
  label: string;
  value: string;
  hint?: string;
}

interface MockOrder {
  id: number;
  customer: string;
  phone: string;
  total: string;
  status: "Onaylandı" | "Bekliyor" | "Hazırlanıyor" | "İptal";
  tone: "success" | "warning" | "info" | "critical";
  time: string;
}

/**
 * Embedded mini-app surface (Q1d).
 *
 * Built around Polaris primitives so the look stays "Shopify-native"
 * for Built for Shopify review while the override CSS retones the
 * tokens to our Apple-pro coral/dark palette.
 *
 * Data path is mocked in this commit per Erhan's "mock data ile build
 * et" decision (extra-C). Real wiring is two follow-up backend routes
 * mounted on /shopify-session/* — left as TODO so the wiring shape is
 * obvious to whoever lands the backend half.
 */

const MOCK_METRICS: MetricTile[] = [
  { label: "Bugünkü ciro", value: "₺ 12.480", hint: "24 sipariş" },
  { label: "Onaylanan", value: "187", hint: "%93 onay oranı" },
  { label: "Bekleyen onay", value: "14" },
  { label: "İptal oranı", value: "%6" },
];

const MOCK_ORDERS: MockOrder[] = [
  { id: 4421, customer: "Ayşe Yılmaz", phone: "+90 5•• ••• 47 12", total: "₺ 549", status: "Onaylandı", tone: "success", time: "12 dk önce" },
  { id: 4420, customer: "Mehmet Demir", phone: "+90 5•• ••• 03 88", total: "₺ 1.240", status: "Bekliyor", tone: "warning", time: "27 dk önce" },
  { id: 4419, customer: "Zeynep Aksoy", phone: "+90 5•• ••• 91 24", total: "₺ 320", status: "Hazırlanıyor", tone: "info", time: "1 saat önce" },
  { id: 4418, customer: "Buse Çetin", phone: "+90 5•• ••• 65 02", total: "₺ 689", status: "Onaylandı", tone: "success", time: "2 saat önce" },
  { id: 4417, customer: "Selim Kaya", phone: "+90 5•• ••• 18 47", total: "₺ 174", status: "İptal", tone: "critical", time: "3 saat önce" },
];

export default function EmbeddedDashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: real wiring — useShopifyApi()("/shopify-session/embedded/summary")
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <Page
      title="Genel bakış"
      subtitle="Bugün gelen kapıda ödeme siparişlerinin özeti"
      primaryAction={{
        content: "Tam dashboard",
        url: `${DASHBOARD_URL}/dashboard`,
        target: "_blank",
        external: true,
      }}
    >
      <BlockStack gap="500">
        {/* Webhook health indicator (Q7a) — small banner, not a dedicated page */}
        <Banner tone="success" title="Webhooks aktif">
          <p>Son 24 saatte 142 sipariş alındı. Sistem normal çalışıyor.</p>
        </Banner>

        {/* Metrics row */}
        <InlineStack gap="300" wrap>
          {MOCK_METRICS.map((m) => (
            <Box
              key={m.label}
              minWidth="220px"
              padding="400"
              borderRadius="300"
              borderWidth="025"
              borderColor="border"
              background="bg-surface"
            >
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">
                  {m.label}
                </Text>
                <Text as="p" variant="heading2xl" fontWeight="medium">
                  {loading ? "—" : m.value}
                </Text>
                {m.hint && (
                  <Text as="p" variant="bodyXs" tone="subdued">
                    {m.hint}
                  </Text>
                )}
              </BlockStack>
            </Box>
          ))}
        </InlineStack>

        {/* Recent orders */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd" fontWeight="medium">
                Son siparişler
              </Text>
              <Button
                variant="plain"
                url={`${DASHBOARD_URL}/orders`}
                target="_blank"
                external
                accessibilityLabel="Tüm siparişleri yeni sekmede aç"
              >
                Hepsini gör
              </Button>
            </InlineStack>

            {loading ? (
              <Text as="p" tone="subdued">
                Yükleniyor…
              </Text>
            ) : MOCK_ORDERS.length === 0 ? (
              <EmptyState
                heading="Henüz sipariş yok"
                image="/window.svg"
              >
                <p>İlk sipariş geldiğinde burada görünecek.</p>
              </EmptyState>
            ) : (
              <ResourceList
                resourceName={{ singular: "sipariş", plural: "sipariş" }}
                items={MOCK_ORDERS}
                renderItem={(order) => {
                  const url = `${DASHBOARD_URL}/orders/${order.id}`;
                  return (
                    <ResourceItem
                      id={String(order.id)}
                      url={url}
                      external
                      accessibilityLabel={`${order.customer} siparişini yeni sekmede aç`}
                      name={order.customer}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="050">
                          <Text as="p" variant="bodyMd" fontWeight="medium">
                            {order.customer}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {order.phone} · {order.time}
                          </Text>
                        </BlockStack>
                        <InlineStack gap="300" blockAlign="center">
                          <Text as="p" variant="bodyMd" fontWeight="medium">
                            {order.total}
                          </Text>
                          <Badge tone={order.tone}>{order.status}</Badge>
                        </InlineStack>
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </BlockStack>
        </Card>

        {/* Quick actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd" fontWeight="medium">
              Hızlı aksiyonlar
            </Text>
            <ButtonGroup>
              <Button
                url={`${DASHBOARD_URL}/shops`}
                target="_blank"
                external
              >
                Mağaza ayarları
              </Button>
              <Button
                url={`${DASHBOARD_URL}/blocking-rules`}
                target="_blank"
                external
              >
                Engelleme kuralları
              </Button>
              <Button
                url={`${DASHBOARD_URL}/sms-logs`}
                target="_blank"
                external
              >
                SMS geçmişi
              </Button>
            </ButtonGroup>
          </BlockStack>
        </Card>

        {/* Plan upgrade callout (Q6a) — external link to /pricing */}
        <CalloutCard
          title="Daha fazla mağaza, daha fazla SMS"
          illustration="/file.svg"
          primaryAction={{
            content: "Planları gör",
            url: `${DASHBOARD_URL}/pricing`,
            target: "_blank",
            external: true,
          }}
        >
          <p>
            Pro planda WhatsApp bildirimi, RTO analizi ve engelleme kuralları
            açılır. Plan yönetimi tam dashboard üzerinden yapılır.
          </p>
        </CalloutCard>
      </BlockStack>
    </Page>
  );
}
