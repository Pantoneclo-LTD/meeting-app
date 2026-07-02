-- ============================================================
-- Meeting App - PostgreSQL Schema
-- Generated from prisma/schema.prisma
-- ============================================================

-- Enums
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Users Table
CREATE TABLE "User" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "password"  TEXT         NOT NULL,
    "team"      TEXT,
    "role"      "Role"       NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Bookings Table
CREATE TABLE "Booking" (
    "id"              TEXT            NOT NULL,
    "startTime"       TIMESTAMP(3)    NOT NULL,
    "endTime"         TIMESTAMP(3)    NOT NULL,
    "preparationTime" INTEGER         NOT NULL DEFAULT 10,
    "purpose"         TEXT            NOT NULL,
    "status"          "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "reminder30Sent"  BOOLEAN         NOT NULL DEFAULT false,
    "reminder15Sent"  BOOLEAN         NOT NULL DEFAULT false,
    "userId"          TEXT            NOT NULL,
    "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- Notifications Table
CREATE TABLE "Notification" (
    "id"        TEXT         NOT NULL,
    "message"   TEXT         NOT NULL,
    "isRead"    BOOLEAN      NOT NULL DEFAULT false,
    "userId"    TEXT         NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_idx"    ON "Notification"("userId");
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- Foreign Keys
ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_bookingId_fkey"
    FOREIGN KEY ("bookingId")
    REFERENCES "Booking"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
