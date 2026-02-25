import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { ICourse } from "../models/Course";
import { IUser } from "../models/User";

interface GeneratedCertificateFile {
  certificateNumber: string;
  issuedAt: Date;
  pdfPath: string;
  fileName: string;
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdfBuffer(lines: string[]): Buffer {
  const safeLines = lines.map((line) => escapePdfText(line));
  let stream = "BT\n/F1 24 Tf\n72 720 Td\n";

  safeLines.forEach((line, index) => {
    if (index === 0) {
      stream += `(${line}) Tj\n`;
      return;
    }
    stream += "0 -32 Td\n";
    stream += "/F1 16 Tf\n";
    stream += `(${line}) Tj\n`;
  });

  stream += "ET";

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += "trailer << /Size 6 /Root 1 0 R >>\n";
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function generateCertificateFile(user: IUser, course: ICourse): Promise<GeneratedCertificateFile> {
  const issuedAt = new Date();
  const certificateNumber = `TT-${issuedAt.getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const courseSlug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const fileName = `${courseSlug || "course"}-${certificateNumber}.pdf`;

  const storageRoot = path.join(process.cwd(), "storage", "certificates");
  await fs.mkdir(storageRoot, { recursive: true });
  const pdfPath = path.join(storageRoot, fileName);

  const lines = [
    "Certificate of Completion",
    `This certifies that ${user.name}`,
    `has successfully completed ${course.title}.`,
    `Issued: ${issuedAt.toDateString()}`,
    `Certificate #: ${certificateNumber}`,
  ];

  await fs.writeFile(pdfPath, buildSimplePdfBuffer(lines));

  return {
    certificateNumber,
    issuedAt,
    pdfPath,
    fileName,
  };
}

