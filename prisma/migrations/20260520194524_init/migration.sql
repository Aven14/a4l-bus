-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CIVIL', 'DRIVER', 'CONTROLLER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "roles" "UserRole"[] DEFAULT ARRAY['CIVIL']::"UserRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMPTZ(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportLine" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1d4ed8',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "lineId" TEXT NOT NULL,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverShift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "currentStopId" TEXT,
    "destinationStopId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "DriverShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveAnnouncement" (
    "id" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "played" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LiveAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadioState" (
    "id" TEXT NOT NULL,
    "trackIndex" INTEGER NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadioState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roles_idx" ON "User"("roles");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Ticket_firstname_lastname_idx" ON "Ticket"("firstname", "lastname");

-- CreateIndex
CREATE INDEX "Ticket_expiresAt_idx" ON "Ticket"("expiresAt");

-- CreateIndex
CREATE INDEX "Ticket_issuedById_idx" ON "Ticket"("issuedById");

-- CreateIndex
CREATE INDEX "Ticket_cancelled_idx" ON "Ticket"("cancelled");

-- CreateIndex
CREATE UNIQUE INDEX "TransportLine_number_key" ON "TransportLine"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Stop_lineId_slug_key" ON "Stop"("lineId", "slug");

-- CreateIndex
CREATE INDEX "DriverShift_userId_endedAt_idx" ON "DriverShift"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "DriverShift_lineId_endedAt_idx" ON "DriverShift"("lineId", "endedAt");

-- CreateIndex
CREATE INDEX "LiveAnnouncement_createdAt_idx" ON "LiveAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "LiveAnnouncement_played_idx" ON "LiveAnnouncement"("played");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");

-- CreateIndex
CREATE INDEX "RadioState_lastSync_idx" ON "RadioState"("lastSync");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "TransportLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverShift" ADD CONSTRAINT "DriverShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverShift" ADD CONSTRAINT "DriverShift_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "TransportLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
