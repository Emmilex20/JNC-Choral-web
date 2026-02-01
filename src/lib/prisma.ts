import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const createClient = () =>
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

const hasGalleryItem = (client?: PrismaClient) =>
  Boolean((client as { galleryItem?: unknown } | undefined)?.galleryItem);

export const prisma =
  globalForPrisma.prisma && hasGalleryItem(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
