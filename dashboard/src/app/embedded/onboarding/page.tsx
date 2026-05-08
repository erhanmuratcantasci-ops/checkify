"use client";

import { Page, EmptyState, BlockStack, Card, Text, Button, ButtonGroup } from "@shopify/polaris";

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chekkify.com";

/**
 * First-install landing for the embedded app (Q5b: EmptyState + CTA,
 * not a stepped wizard). Merchants who land here have just authorized
 * Chekkify on their Shopify store but don't yet have any verified
 * orders — they pick a plan, optionally tweak settings, and let the
 * webhook do its job.
 *
 * Once the first order arrives the merchant moves on to /embedded
 * naturally; this page stays available as a "getting started" anchor
 * via the Shopify Admin nav.
 */
export default function EmbeddedOnboardingPage() {
  return (
    <Page
      title="Hoş geldin"
      subtitle="Chekkify mağazana bağlandı. İlk siparişin gelince Genel bakış ekranı dolar."
    >
      <BlockStack gap="500">
        <Card>
          <EmptyState
            heading="İlk siparişin gelince burada görünecek"
            action={{
              content: "Planları gör",
              url: `${DASHBOARD_URL}/pricing`,
              target: "_blank",
              external: true,
            }}
            secondaryAction={{
              content: "Mağaza ayarları",
              url: `${DASHBOARD_URL}/shops`,
              target: "_blank",
              external: true,
            }}
            image="/window.svg"
          >
            <p>
              Webhook kuruldu, müşteri SMS'leri otomatik gidiyor. Plan seçerek
              SMS kotanı belirle ve mağaza ayarlarından şablonunu özelleştir —
              her şey tam dashboard üzerinden yapılır.
            </p>
          </EmptyState>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd" fontWeight="medium">
              Sıradaki adımlar
            </Text>
            <Text as="p" tone="subdued">
              Aşağıdaki üçü tam dashboard&apos;da yapılır. Embedded uygulama
              günlük takip için tasarlandı.
            </Text>
            <ButtonGroup>
              <Button
                url={`${DASHBOARD_URL}/pricing`}
                target="_blank"
                external
                variant="primary"
              >
                Plan seç
              </Button>
              <Button url={`${DASHBOARD_URL}/shops`} target="_blank" external>
                SMS şablonunu özelleştir
              </Button>
              <Button
                url={`${DASHBOARD_URL}/blocking-rules`}
                target="_blank"
                external
              >
                Engelleme kurallarını ayarla
              </Button>
            </ButtonGroup>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
