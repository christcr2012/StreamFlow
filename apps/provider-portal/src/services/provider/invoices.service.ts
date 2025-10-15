// Provider Invoices Service
// Minimal helpers for invoice lines and export (HTML/PDF)

import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function listInvoiceLines(invoiceId: string) {
  const lines = await prisma.invoiceLine.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "asc" },
  });
  return lines.map((l: any) => ({
    id: l.id,
    description: l.description,
    lineType: l.lineType,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    amountCents: l.amountCents,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function addInvoiceLine(invoiceId: string, data: {
  description: string;
  lineType: "subscription" | "usage" | "addon" | "one_time";
  quantity: number;
  unitPriceCents: number;
}) {
  const amountCents = data.quantity * data.unitPriceCents;
  const line = await prisma.invoiceLine.create({
    data: {
      invoiceId,
      description: data.description,
      lineType: data.lineType,
      quantity: data.quantity,
      unitPriceCents: data.unitPriceCents,
      amountCents,
    },
  });
  await recalcInvoiceTotal(invoiceId);
  return line.id;
}

export async function recalcInvoiceTotal(invoiceId: string) {
  const lines = await prisma.invoiceLine.findMany({ where: { invoiceId }, select: { amountCents: true } });
  const totalCents = lines.reduce((sum: any, l: any) => sum + l.amountCents, 0);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amount: (totalCents / 100) as any },
  });
}

export async function exportInvoiceHtml(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { org: { select: { name: true } }, lineItems: true },
  });
  if (!invoice) return "<html><body><h1>Invoice not found</h1></body></html>";
  const rows = invoice.lineItems
    .map((li: any) => `<tr><td>${li.description}</td><td>${li.quantity}</td><td>$${(li.unitPriceCents / 100).toFixed(2)}</td><td>$${(li.amountCents / 100).toFixed(2)}</td></tr>`) 
    .join("");
  return `<!doctype html><html><head><meta charset=\"utf-8\"/><title>Invoice ${invoice.id}</title></head>
  <body style=\"font-family: ui-sans-serif, system-ui; padding:24px\"> 
  <h1>Invoice ${invoice.id}</h1>
  <div>Organization: ${invoice.org.name}</div>
  <div>Status: ${invoice.status}</div>
  <div>Issued: ${invoice.issuedAt.toISOString().split('T')[0]}</div>
  <table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"margin-top:16px; border-collapse: collapse\">
    <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan=\"4\">No line items</td></tr>'}</tbody>
  </table>
  <h3>Total: $${parseFloat(invoice.amount.toString()).toFixed(2)}</h3>
  <p style=\"color:#666\">HTML preview. Download the PDF version if needed.</p>
  </body></html>`;
}

export async function exportInvoicePdfBuffer(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { org: { select: { name: true } }, lineItems: true },
  });
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  return await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text(`Invoice ${invoice?.id ?? invoiceId}`, { align: "left" });
    doc.moveDown();
    doc.fontSize(12).text(`Organization: ${invoice?.org.name ?? "Unknown"}`);
    doc.text(`Status: ${invoice?.status ?? "unknown"}`);
    doc.text(`Issued: ${invoice?.issuedAt?.toISOString().split("T")[0] ?? ""}`);

    doc.moveDown();
    doc.fontSize(13).text("Line Items");
    doc.moveDown(0.5);

    const items = invoice?.lineItems ?? [];
    if (items.length === 0) {
      doc.text("No line items.");
    } else {
      items.forEach((li: any) => {
        doc.text(`${li.description}  x${li.quantity}  $${(li.unitPriceCents / 100).toFixed(2)}  =  $${(li.amountCents / 100).toFixed(2)}`);
      });
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total: $${parseFloat((invoice?.amount ?? 0 as any).toString()).toFixed(2)}`, { align: "right" });

    doc.end();
  });
}

