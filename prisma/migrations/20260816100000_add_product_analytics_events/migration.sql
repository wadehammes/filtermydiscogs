CREATE TABLE "product_analytics_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "page_path" TEXT,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_analytics_events_event_created_at_idx" ON "product_analytics_events"("event", "created_at");

CREATE INDEX "product_analytics_events_page_path_created_at_idx" ON "product_analytics_events"("page_path", "created_at");

CREATE INDEX "product_analytics_events_created_at_idx" ON "product_analytics_events"("created_at");
