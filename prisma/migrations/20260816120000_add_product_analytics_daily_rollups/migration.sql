CREATE TABLE "product_analytics_daily_rollups" (
    "date" DATE NOT NULL,
    "dimension_type" TEXT NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "event_count" INTEGER NOT NULL,

    CONSTRAINT "product_analytics_daily_rollups_pkey" PRIMARY KEY ("date","dimension_type","dimension_key")
);

CREATE INDEX "product_analytics_daily_rollups_date_idx" ON "product_analytics_daily_rollups"("date");

CREATE INDEX "product_analytics_daily_rollups_dimension_type_date_idx" ON "product_analytics_daily_rollups"("dimension_type", "date");
