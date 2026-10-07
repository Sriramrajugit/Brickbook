# Professional Transaction Report — Requirements

## 1. Objective

Upgrade the existing system-generated transaction report into a clean, professional, printable, and export-friendly financial report. The report must clearly present its reporting context, key financial totals, and an auditable transaction-level ledger.

## 2. Report Context

- Report type: Transaction Report
- Account: Marketing Project
- Reporting period: User-selected start and end dates
- Generated date and time: Current system timestamp at report generation
- Expected data fields: Date, Account, Description, Category, Debit, Credit, and running Balance
- Currency: Configurable; default display should support Indian Rupee (`₹`)

## 3. Required Layout

Render the report in the following order:

1. Branded report header
2. Report metadata
3. Financial summary cards/table
4. Detailed transaction table
5. Optional category summary and chart
6. Footer

Use a centered content area with consistent spacing. The design must work well on screen, in PDF exports, and when printed on A4 paper.

## 4. Header Requirements

Display a prominent report title:

```text
TRANSACTION REPORT
```

Under the title, display the account name, for example:

```text
Marketing Project
```

Display metadata below or alongside the title:

- Reporting Period: `DD-MMM-YYYY to DD-MMM-YYYY`
- Report Generated: `DD-MMM-YYYY, hh:mm AM/PM`
- Total Transactions: calculated count of displayed transaction records

Example:

```text
Reporting Period: 31-Aug-2026 to 30-Sep-2026
Report Generated: 30-Sep-2026, 12:15 PM
Total Transactions: 23
```

### Header styling

- Use a dark navy or dark charcoal background for the title band.
- Use white, bold title text.
- Use a professional sans-serif font such as Aptos, Calibri, Arial, Inter, or Segoe UI.
- The title should be visually distinct from the account name and metadata.
- Do not use excessive borders, gradients, decorative fonts, or more than one accent color.

## 5. Financial Summary Requirements

Place a summary section directly before the transaction table. It must show these calculated values for the selected report period:

| Metric | Calculation |
|---|---|
| Total Income | Sum of all Credit values |
| Total Expenses | Sum of all Debit values |
| Net Balance | Total Income minus Total Expenses |
| Total Transactions | Number of transaction records displayed |

Example presentation:

| Total Income | Total Expenses | Net Balance | Transactions |
|---:|---:|---:|---:|
| ₹402,500.00 | ₹174,000.00 | ₹228,500.00 | 23 |

### Summary styling

- Use four cards on desktop and a responsive grid/stacked layout on smaller screens.
- Use concise labels and large, easy-to-scan figures.
- Income may use dark green text or a subtle green accent.
- Expenses may use dark red text or a subtle red accent.
- Net Balance should use a neutral dark blue/black or status color based on whether it is positive or negative.
- Do not rely on color alone; labels must always remain clear.

## 6. Transaction Table Requirements

### Columns

Display the columns in exactly this order:

| Column | Type | Notes |
|---|---|---|
| Date | Date | Display as `DD-MMM-YYYY`, for example `28-Sep-2026` |
| Account | Text | Account/project name |
| Description | Text | Transaction narrative |
| Category | Text | Expense or income category |
| Debit | Currency | Expense/outflow amount |
| Credit | Currency | Income/inflow amount |
| Balance | Currency | Running balance after the transaction |

### Data rules

- Each transaction must contain either a Debit or a Credit value; both should not normally be populated for the same record.
- Debit and Credit values must be non-negative stored values.
- The running balance must be calculated chronologically using:

```text
currentBalance = previousBalance + credit - debit
```

- Sort transactions by date descending by default, with the most recent transaction first.
- When multiple records have the same date, preserve a consistent secondary ordering, such as transaction creation time or transaction ID.
- If the report is sorted in descending order, ensure the displayed running balance still represents the correct chronological balance for each transaction. Calculate balances in ascending chronological order before reversing rows for display, or use the stored ledger balance.
- Show zero or unavailable Debit/Credit values as an em dash (`—`) rather than `0.00`, unless a business rule requires zero to be explicit.
- Use a clear empty state when no transactions exist for the selected date range.

### Table interaction

- Allow sorting by Date, Account, Category, Debit, Credit, and Balance.
- Provide filters for date range, account, and category.
- Provide a text search covering Description, Account, and Category.
- Freeze or keep the table header visible while scrolling on screen.
- Make the table responsive. On narrow screens, permit horizontal scrolling rather than compressing financial data into unreadable columns.
- If the report is paginated, repeat column headers on every page and preserve totals for the selected filter criteria.

### Table styling

- Use a dark header row with white, bold text.
- Right-align Debit, Credit, and Balance values.
- Left-align text columns.
- Use alternating row shading for readability.
- Use subtle light-gray horizontal borders; avoid heavy cell boxes.
- Allow descriptions to wrap without cutting off meaningful text.
- Keep row height and padding consistent.

## 7. Currency and Negative Number Formatting

- Display monetary values with thousand separators and exactly two decimal places.
- Default currency format: `₹1,234.56`.
- Display negative figures with parentheses, for example `(₹15,000.00)`, rather than a minus sign where applicable.
- Apply the same currency formatting consistently to Debit, Credit, Balance, summary cards, category summaries, exports, and print views.
- Currency symbol and locale must be configurable for future multi-currency support.

## 8. Optional Category Summary

Include an optional summary section after the transaction table or in a side panel. It should show:

- Category
- Total debit/expense amount
- Total credit/income amount
- Transaction count

Example:

| Category | Expenses | Income | Transactions |
|---|---:|---:|---:|
| Marketing | ₹30,000.00 | ₹150,000.00 | 4 |
| Rent | ₹60,000.00 | — | 2 |
| Travel | — | ₹200,000.00 | 2 |

If a visual is added, use one simple chart only, such as an expense-by-category bar chart. The chart must use the same date range and filters as the table and summary.

## 9. Footer Requirements

Include a low-emphasis footer containing:

- System or organization name
- Generation timestamp
- Page number in printed/PDF views, for example `Page 1 of 2`
- Optional confidentiality notice if applicable

Example:

```text
Generated by [System Name] on 30-Sep-2026, 12:15 PM | Page 1 of 2
```

## 10. Export and Print Requirements

- Support PDF export and spreadsheet export (XLSX or CSV, depending on the existing system capabilities).
- Exported reports must retain the selected date range, account, filters, sort order where appropriate, report title, metadata, summary totals, and transaction data.
- PDF and print versions must use A4-friendly margins, repeat table headers on subsequent pages, and avoid splitting a transaction row across pages where possible.
- Screen-only controls such as search fields, filter buttons, and export buttons must not appear in the PDF/print output.

## 11. Validation and Reconciliation

The implementation must validate the report before display/export:

- `totalIncome = sum(credit)`
- `totalExpenses = sum(debit)`
- `netBalance = totalIncome - totalExpenses` when opening balance is zero
- If an opening balance exists, `closingBalance = openingBalance + totalIncome - totalExpenses`
- The final running balance must equal the calculated closing balance.
- The displayed transaction count must equal the number of records after all filters are applied.
- Date range must be valid: start date cannot be after end date.
- Report metadata must reflect the actual selected filters and generated timestamp.

## 12. Acceptance Criteria

The enhancement is complete when all of the following are true:

- The report has a clear title, account name, reporting period, generated timestamp, and transaction count.
- A summary section accurately displays total income, total expenses, net balance, and transaction count.
- The transaction table contains Date, Account, Description, Category, Debit, Credit, and Balance in the required order.
- Dates and currency values follow the defined formatting rules.
- Financial columns are right-aligned, sortable, filterable, and readable.
- The balance calculation reconciles with income, expenses, and any opening balance.
- The table works on desktop and smaller screens without hiding financial data.
- Empty, loading, and error states are handled clearly.
- PDF/print output is professional, A4-friendly, and contains repeated table headers and page numbers.
- The visual design is clean, restrained, consistent, and suitable for a business financial report.

## 13. Implementation Notes for Copilot

- Preserve the current report data source and business logic unless a change is required to meet the validation rules.
- Keep calculation logic separate from presentation/UI components.
- Use a reusable currency formatter and date formatter; do not hardcode formatting in multiple components.
- Use decimal-safe handling for financial amounts. Do not use floating-point arithmetic without appropriate rounding/decimal safeguards.
- Add automated tests for totals, running-balance calculations, date filtering, sorting, no-data state, and export/print data consistency.
- Ensure accessibility: semantic table markup, sufficient color contrast, keyboard-accessible filters, and labels for controls.
