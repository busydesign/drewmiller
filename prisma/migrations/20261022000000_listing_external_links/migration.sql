-- CreateTable
CREATE TABLE "ListingExternalLink" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingExternalLink_listingId_sortOrder_idx" ON "ListingExternalLink"("listingId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ListingExternalLink" ADD CONSTRAINT "ListingExternalLink_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
