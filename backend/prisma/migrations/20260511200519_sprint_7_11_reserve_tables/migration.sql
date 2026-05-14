-- CreateTable
CREATE TABLE "FormConfig" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "schema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formConfigId" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "order" INTEGER NOT NULL,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellOffer" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "discount" DOUBLE PRECISION,
    "discountType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellEvent" (
    "id" TEXT NOT NULL,
    "upsellOfferId" TEXT NOT NULL,
    "orderId" INTEGER,
    "eventType" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpsellEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudScore" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "cartToken" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerName" TEXT,
    "cartValue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "lineItems" JSONB NOT NULL,
    "abandonedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveredAt" TIMESTAMP(3),
    "recoveredOrderId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'abandoned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCartEvent" (
    "id" TEXT NOT NULL,
    "abandonedCartId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" TIMESTAMP(3),

    CONSTRAINT "AbandonedCartEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormConfig_shopId_idx" ON "FormConfig"("shopId");

-- CreateIndex
CREATE INDEX "FormField_formConfigId_idx" ON "FormField"("formConfigId");

-- CreateIndex
CREATE INDEX "UpsellOffer_shopId_idx" ON "UpsellOffer"("shopId");

-- CreateIndex
CREATE INDEX "UpsellEvent_upsellOfferId_idx" ON "UpsellEvent"("upsellOfferId");

-- CreateIndex
CREATE INDEX "UpsellEvent_orderId_idx" ON "UpsellEvent"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "FraudScore_orderId_key" ON "FraudScore"("orderId");

-- CreateIndex
CREATE INDEX "FraudScore_orderId_idx" ON "FraudScore"("orderId");

-- CreateIndex
CREATE INDEX "FraudScore_riskLevel_idx" ON "FraudScore"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_cartToken_key" ON "AbandonedCart"("cartToken");

-- CreateIndex
CREATE INDEX "AbandonedCart_shopId_idx" ON "AbandonedCart"("shopId");

-- CreateIndex
CREATE INDEX "AbandonedCart_cartToken_idx" ON "AbandonedCart"("cartToken");

-- CreateIndex
CREATE INDEX "AbandonedCart_status_idx" ON "AbandonedCart"("status");

-- CreateIndex
CREATE INDEX "AbandonedCartEvent_abandonedCartId_idx" ON "AbandonedCartEvent"("abandonedCartId");

-- AddForeignKey
ALTER TABLE "FormConfig" ADD CONSTRAINT "FormConfig_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formConfigId_fkey" FOREIGN KEY ("formConfigId") REFERENCES "FormConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellOffer" ADD CONSTRAINT "UpsellOffer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellEvent" ADD CONSTRAINT "UpsellEvent_upsellOfferId_fkey" FOREIGN KEY ("upsellOfferId") REFERENCES "UpsellOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudScore" ADD CONSTRAINT "FraudScore_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCart" ADD CONSTRAINT "AbandonedCart_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCartEvent" ADD CONSTRAINT "AbandonedCartEvent_abandonedCartId_fkey" FOREIGN KEY ("abandonedCartId") REFERENCES "AbandonedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
