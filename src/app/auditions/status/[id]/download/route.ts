import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/auth/login?callbackUrl=/auditions/status", _req.url)
    );
  }

  const app = await prisma.auditionApplication.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        session.user.email ? { email: session.user.email } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!app || app.status !== "ACCEPTED") {
    return new NextResponse("Not found", { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const width = 105 / 25.4 * 72;
  const height = 148 / 25.4 * 72;
  const page = pdf.addPage([width, height]);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontBrand = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const margin = 18;
  const cardX = margin;
  const cardY = margin;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 0.98, 0.94),
  });

  page.drawRectangle({
    x: cardX,
    y: cardY + cardH - 30,
    width: cardW,
    height: 30,
    color: rgb(0.95, 0.78, 0.29),
  });

  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    borderColor: rgb(0.93, 0.82, 0.52),
    borderWidth: 1.2,
    color: rgb(1, 1, 1),
  });

  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBytes = await readFile(logoPath);
  const logoImage = await pdf.embedPng(logoBytes);
  const logoDims = logoImage.scale(0.03);
  const logoX = cardX + 14;
  const brandY = cardY + cardH - 24;
  const logoY = brandY - logoDims.height + 1;
  page.drawImage(logoImage, {
    x: logoX,
    y: logoY,
    width: logoDims.width,
    height: logoDims.height,
  });

  const watermarkDims = logoImage.scale(0.28);
  page.drawImage(logoImage, {
    x: cardX + (cardW - watermarkDims.width) / 2,
    y: cardY + (cardH - watermarkDims.height) / 2 - 20,
    width: watermarkDims.width,
    height: watermarkDims.height,
    opacity: 0.08,
  });

  const brandX = logoX + logoDims.width + 6;
  page.drawText("JUDE NNAM CHORAL", {
    x: brandX,
    y: brandY,
    size: 10,
    font: fontBrand,
    color: rgb(0.22, 0.18, 0.1),
  });

  let y = brandY - 30;
  page.drawText("Audition Status", {
    x: cardX + 16,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.07, 0.07, 0.07),
  });

  y -= 18;
  page.drawText("Acceptance Notice", {
    x: cardX + 16,
    y,
    size: 10,
    font,
    color: rgb(0.45, 0.4, 0.25),
  });

  y -= 20;
  const badgeText = "ACCEPTED";
  const badgeW = 80;
  const badgeH = 18;
  page.drawRectangle({
    x: cardX + 16,
    y: y - 2,
    width: badgeW,
    height: badgeH,
    color: rgb(0.86, 0.98, 0.91),
    borderColor: rgb(0.67, 0.86, 0.72),
    borderWidth: 0.5,
  });
  page.drawText(badgeText, {
    x: cardX + 26,
    y: y + 3,
    size: 10,
    font: fontBold,
    color: rgb(0.09, 0.4, 0.2),
  });

  y -= 24;
  page.drawRectangle({
    x: cardX + 14,
    y: y - 94,
    width: cardW - 28,
    height: 98,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.9, 0.9, 0.93),
    borderWidth: 0.8,
  });

  y -= 12;
  const rows = [
    ["Name", app.fullName],
    ["Category", app.category],
    ["Email", app.email],
    ["Phone", app.phone],
    ["Submitted", app.createdAt.toLocaleString()],
  ];

  rows.forEach(([label, value]) => {
    page.drawText(`${label}:`, {
      x: cardX + 24,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(String(value), {
      x: cardX + 92,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: cardW - 110,
    });
    y -= 12;
  });

  y -= 20;
  page.drawText("Please keep this for your records.", {
    x: cardX + 16,
    y,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  page.drawText("jnc-choral.vercel.app", {
    x: cardX + 16,
    y: cardY + 10,
    size: 8,
    font,
    color: rgb(0.6, 0.62, 0.67),
  });

  const pdfBytes = await pdf.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="audition-status-${app.id}.pdf"`,
    },
  });
}
