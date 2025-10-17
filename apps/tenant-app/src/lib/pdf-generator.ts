import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  number: string | null;
  issuedAt: Date;
  dueDate: Date | null;
  customer: {
    company: string | null;
    primaryName: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    amountCents: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  amount: number;
  terms: string | null;
  notes: string | null;
}

export function generateInvoicePDF(invoice: InvoiceData, orgName: string = 'Your Company') {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(orgName, 20, 20);
  
  doc.setFontSize(16);
  doc.text('INVOICE', 150, 20);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.number || 'DRAFT'}`, 150, 30);
  doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, 150, 36);
  if (invoice.dueDate) {
    doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 150, 42);
  }
  
  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 50);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 56;
  if (invoice.Customer.company) {
    doc.text(invoice.Customer.company, 20, yPos);
    yPos += 6;
  }
  if (invoice.Customer.primaryName) {
    doc.text(invoice.Customer.primaryName, 20, yPos);
    yPos += 6;
  }
  if (invoice.Customer.primaryEmail) {
    doc.text(invoice.Customer.primaryEmail, 20, yPos);
    yPos += 6;
  }
  if (invoice.Customer.primaryPhone) {
    doc.text(invoice.Customer.primaryPhone, 20, yPos);
    yPos += 6;
  }
  
  // Line items table
  const tableData = invoice.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    `$${(item.unitPriceCents / 100).toFixed(2)}`,
    `$${(item.amountCents / 100).toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: yPos + 10,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;
  
  // Totals
  const totalsX = 150;
  let totalsY = finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`$${(invoice.subtotal / 100).toFixed(2)}`, 185, totalsY, { align: 'right' });
  
  if (invoice.discountAmount > 0) {
    totalsY += 6;
    doc.text('Discount:', totalsX, totalsY);
    doc.text(`-$${(invoice.discountAmount / 100).toFixed(2)}`, 185, totalsY, { align: 'right' });
  }
  
  if (invoice.taxAmount > 0) {
    totalsY += 6;
    doc.text('Tax:', totalsX, totalsY);
    doc.text(`$${(invoice.taxAmount / 100).toFixed(2)}`, 185, totalsY, { align: 'right' });
  }
  
  totalsY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, totalsY);
  doc.text(`$${(invoice.amount / 100).toFixed(2)}`, 185, totalsY, { align: 'right' });
  
  // Terms and notes
  if (invoice.terms || invoice.notes) {
    totalsY += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (invoice.terms) {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Terms:', 20, totalsY);
      doc.setFont('helvetica', 'normal');
      totalsY += 6;
      const termsLines = doc.splitTextToSize(invoice.terms, 170);
      doc.text(termsLines, 20, totalsY);
      totalsY += termsLines.length * 6 + 6;
    }
    
    if (invoice.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, totalsY);
      doc.setFont('helvetica', 'normal');
      totalsY += 6;
      const notesLines = doc.splitTextToSize(invoice.notes, 170);
      doc.text(notesLines, 20, totalsY);
    }
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  
  return doc;
}

export function downloadInvoicePDF(invoice: InvoiceData, orgName?: string) {
  const doc = generateInvoicePDF(invoice, orgName);
  const filename = `invoice-${invoice.number || 'draft'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

