import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Import started for user:', user.id, 'company:', user.companyId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!worksheet) {
      return NextResponse.json(
        { error: 'No data found in Excel file' },
        { status: 400 }
      );
    }

    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    // If preview mode, return first 10 rows
    if (isPreview) {
      return NextResponse.json({
        preview: rows.slice(0, 10),
        total: rows.length,
      });
    }

    // Validate and import
    const errors: string[] = [];
    let successCount = 0;
    const details: any[] = [];

    // Fetch accounts and categories for validation
    const accounts = await prisma.account.findMany({
      where: { companyId: user.companyId },
    });

    const categories = await prisma.category.findMany({
      where: { companyId: user.companyId },
    });

    // Process each row
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx] as any;
      const rowNum = idx + 2; // +2 because header is row 1, data starts at row 2

      try {
        // Validate required fields
        const date = row.Date;
        const amount = parseFloat(row.Amount);
        const type = row.Type?.trim();
        const accountName = row.Account?.trim();
        const categoryName = row.Category?.trim() || null;
        const description = row.Description?.trim() || null;
        const paymentMode = row.PaymentMode?.trim() || 'G-Pay';

        // Validate date format (DD-MM-YYYY)
        if (!date) {
          errors.push(`Row ${rowNum}: Date is required`);
          continue;
        }

        const dateObj = parseDate(date);
        if (!dateObj) {
          errors.push(`Row ${rowNum}: Invalid date format. Use DD-MM-YYYY`);
          continue;
        }

        // Validate amount
        if (isNaN(amount)) {
          errors.push(`Row ${rowNum}: Amount must be a number`);
          continue;
        }

        if (amount <= 0) {
          errors.push(`Row ${rowNum}: Amount must be greater than 0`);
          continue;
        }

        // Validate type
        if (!type || !['Cash-In', 'Cash-Out'].includes(type)) {
          errors.push(`Row ${rowNum}: Type must be 'Cash-In' or 'Cash-Out'`);
          continue;
        }

        // Validate/Get account
        if (!accountName) {
          errors.push(`Row ${rowNum}: Account name is required`);
          continue;
        }

        const account = accounts.find(
          a => a.name.toLowerCase() === accountName.toLowerCase()
        );

        if (!account) {
          errors.push(`Row ${rowNum}: Account '${accountName}' not found`);
          continue;
        }

        // Validate/Get category
        let categoryId: number | null = null;
        if (categoryName) {
          const category = categories.find(
            c => c.name.toLowerCase() === categoryName.toLowerCase()
          );

          if (!category) {
            errors.push(
              `Row ${rowNum}: Category '${categoryName}' not found. Available: ${categories.map(c => c.name).join(', ')}`
            );
            continue;
          }

          categoryId = category.id;
        }

        // Create transaction
        try {
          const transaction = await prisma.transaction.create({
            data: {
              amount,
              type,
              category: categoryName || type,
              description,
              date: dateObj,
              paymentMode,
              accountId: account.id,
              categoryId,
              companyId: user.companyId,
              siteId: user.siteId || undefined,
              createdBy: user.id,
            },
          });

          successCount++;
          details.push({
            rowNum,
            date: date,
            amount,
            type,
            account: accountName,
            category: categoryName,
          });
        } catch (createError: any) {
          console.error(`Error creating transaction for row ${rowNum}:`, createError);
          errors.push(`Row ${rowNum}: Failed to save - ${createError.message}`);
        }
      } catch (error: any) {
        errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    console.log('Import completed:', { successCount, failedCount: rows.length - successCount });

    return NextResponse.json({
      success: successCount,
      failed: rows.length - successCount,
      errors,
      details: details.slice(0, 10),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD-MM-YYYY format
  const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(dateStr));
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try Excel serial date format
  if (typeof dateStr === 'number') {
    // Excel stores dates as days since 1900-01-01
    // Adjust for the Excel bug (1900 is not a leap year)
    const excelDate = dateStr - 1; // Adjust for off-by-one error
    const date = new Date(1900, 0, excelDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try ISO format
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}
