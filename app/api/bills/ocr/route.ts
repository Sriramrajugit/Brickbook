import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream, unlinkSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import Tesseract from 'tesseract.js';
import { getCurrentUser } from '@/lib/auth';

interface ExtractedData {
  supplierName: string | null;
  invoiceNumber: string | null;
  date: string | null;
  amount: string | null;
}

// Helper function to parse OCR text and extract relevant data
function parseOCRText(text: string): ExtractedData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const result: ExtractedData = {
    supplierName: null,
    invoiceNumber: null,
    date: null,
    amount: null,
  };

  // Join all text for pattern matching
  const allText = text.toUpperCase();

  // Search for patterns in the text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();

    // Invoice number patterns (INV-, Invoice #, Invoice No, etc.)
    if (!result.invoiceNumber) {
      const invMatch = line.match(
        /(?:INV[.\-]?|INVOICE\s*(?:#|NO\.?|NUMBER)?\s*:?\s*)([A-Z0-9\-\/\.]+)/i
      );
      if (invMatch) {
        result.invoiceNumber = invMatch[1].trim();
      }
    }

    // Date patterns (DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.)
    if (!result.date) {
      const dateMatch = line.match(
        /(\d{1,2}[-\/.\s]\d{1,2}[-\/.\s]\d{2,4})|(\d{4}[-\/.\s]\d{1,2}[-\/.\s]\d{1,2})/
      );
      if (dateMatch) {
        result.date = dateMatch[0];
      }
    }

    // Amount patterns (Total, Amount, Rs., ₹, INR, etc.)
    if (!result.amount) {
      const amountMatch = line.match(
        /(?:TOTAL|AMOUNT|RS\.?|₹|INR|VALUE)\s*:?\s*[\s]*([\d,]+\.?\d*)/i
      );
      if (amountMatch) {
        result.amount = amountMatch[1].replace(/,/g, '');
      }
    }

    // Supplier name - often appears near top or near company keywords
    if (!result.supplierName) {
      const companyKeywords = /(?:LIMITED|LTD|COMPANY|CO\.?|PVT|CORPORATION|CORP|INC|LLC|SERVICES|SUPPLIERS?|TRADERS?|EXPORTS?|IMPORTS?|MANUFACTURING)/i;
      if (
        line.length > 2 &&
        line.length < 80 &&
        i < Math.min(8, lines.length) && // Look in first 8 lines
        (companyKeywords.test(line) || 
          (line.split(/\s+/).length <= 6 && /[A-Z]/.test(line) && line !== line.toLowerCase()))
      ) {
        result.supplierName = line;
      }
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temp directory if it doesn't exist
    const tempDir = resolve(process.cwd(), 'tmp');
    try {
      mkdirSync(tempDir, { recursive: true });
    } catch (err) {
      console.error('Error creating tmp directory:', err);
    }

    const tempFilePath = resolve(tempDir, `ocr-${Date.now()}-${file.name}`);

    // Write buffer to temp file
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(tempFilePath);
      writeStream.write(buffer);
      writeStream.end(() => resolve());
      writeStream.on('error', reject);
    });

    try {
      // Run OCR using Tesseract with optimizations
      console.log('Starting OCR processing for:', file.name);
      
      // Set timeout for OCR processing (60 seconds max)
      let ocrTimeout: NodeJS.Timeout | null = null;
      const ocrPromise = new Promise<{ text: string }>((resolve, reject) => {
        ocrTimeout = setTimeout(() => {
          reject(new Error('OCR processing timeout - image took too long to process'));
        }, 60000);

        Tesseract.recognize(tempFilePath, 'eng', {
          logger: (m) => {
            console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
            if (ocrTimeout) clearTimeout(ocrTimeout);
          },
        }).then((result) => {
          if (ocrTimeout) clearTimeout(ocrTimeout);
          resolve({ text: result.data.text });
        }).catch((err) => {
          if (ocrTimeout) clearTimeout(ocrTimeout);
          reject(err);
        });
      });

      const { text } = await ocrPromise;

      console.log('OCR Text extracted:', text.substring(0, 300));

      // Parse the extracted text
      const extractedData = parseOCRText(text);

      return NextResponse.json({
        success: true,
        data: extractedData,
        rawText: text.substring(0, 1000),
      });
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      {
        error: 'OCR processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
