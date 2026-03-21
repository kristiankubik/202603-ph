/*
  Warnings:

  - You are about to drop the `Slot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SlotConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `slotId` on the `Reservation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Slot_date_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Slot";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SlotConfig";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ReservationSlotConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservationSlotsPerDay" INTEGER NOT NULL,
    "openingRule" TEXT NOT NULL,
    "specificDay" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReservationSlot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "totalCapacity" INTEGER NOT NULL,
    "usedCapacity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "assignedDate" DATETIME,
    "registrationId" INTEGER NOT NULL,
    "reservationSlotId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_reservationSlotId_fkey" FOREIGN KEY ("reservationSlotId") REFERENCES "ReservationSlot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("assignedDate", "createdAt", "id", "registrationId", "status") SELECT "assignedDate", "createdAt", "id", "registrationId", "status" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_registrationId_key" ON "Reservation"("registrationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSlot_date_key" ON "ReservationSlot"("date");
