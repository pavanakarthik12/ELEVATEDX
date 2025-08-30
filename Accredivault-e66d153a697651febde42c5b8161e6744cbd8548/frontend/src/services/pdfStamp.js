import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

async function generateQrDataUrl(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 256 });
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function stampPdfWithHash(inputFile, { docId, fileHash, verifyUrl }) {
  const arrayBuffer = await inputFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const metadataText = `AccrediVault • Doc: ${docId} • SHA-256: ${fileHash.slice(0, 10)}…`;
  const fontSize = 10;
  const textColor = rgb(0.2, 0.2, 0.2);

  const qrContent = verifyUrl || `doc_id=${docId}&file_hash=${fileHash}`;
  const qrDataUrl = await generateQrDataUrl(qrContent);
  const qrPng = await pdfDoc.embedPng(dataUrlToUint8Array(qrDataUrl));

  const qrDim = 64;
  const margin = 24;

  pages.forEach((page) => {
    const { width } = page.getSize();
    page.drawRectangle({ x: 0, y: margin - 8, width, height: 28, color: rgb(0.95, 0.95, 0.95) });
    page.drawText(metadataText, { x: margin, y: margin, size: fontSize, font, color: textColor, maxWidth: width - (qrDim + margin * 3) });
    page.drawImage(qrPng, { x: width - qrDim - margin, y: margin - 4, width: qrDim, height: qrDim });
  });

  const stampedBytes = await pdfDoc.save();
  // Append machine-readable PDF comments for backend extraction
  const suffix = `\n%%ACREDIVAULT-HASH:${fileHash}\n%%ACREDIVAULT-DOCID:${docId}\n`;
  const encoder = new TextEncoder();
  const suffixBytes = encoder.encode(suffix);
  const merged = new Uint8Array(stampedBytes.length + suffixBytes.length);
  merged.set(stampedBytes, 0);
  merged.set(suffixBytes, stampedBytes.length);
  return new Blob([merged], { type: 'application/pdf' });
}


