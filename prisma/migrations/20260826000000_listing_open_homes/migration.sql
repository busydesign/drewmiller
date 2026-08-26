-- CreateEnum
CREATE TYPE "OpenHomeSource" AS ENUM ('IMPORT', 'MANUAL');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "auctionAt" TIMESTAMP(3),
ADD COLUMN "auctionLocation" TEXT;

-- CreateTable
CREATE TABLE "ListingOpenHome" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "source" "OpenHomeSource" NOT NULL DEFAULT 'IMPORT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingOpenHome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingOpenHome_listingId_startsAt_idx" ON "ListingOpenHome"("listingId", "startsAt");

-- AddForeignKey
ALTER TABLE "ListingOpenHome" ADD CONSTRAINT "ListingOpenHome_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
