# 🧱 Brickbook – Inventory + Invoice Upload (OCR)
Functional & Technical Design Document

---

## 1. Purpose

The purpose of this document is to define the design and implementation plan for adding Inventory Management with Invoice Upload & OCR extraction to the Brickbook ledger application.

The feature aims to:
- Reduce manual data entry
- Automatically extract material details from supplier invoices
- Allow user confirmation before posting
- Seamlessly integrate inventory with ledger

Target users: Small construction businesses

---

## 2. High-Level Workflow

1. User uploads supplier invoice (PDF/Image)
2. OCR engine extracts header & line items
3. Extracted data shown in editable preview table
4. User confirms / edits data
5. Inventory stock is updated
6. Ledger entries are auto-posted
7. Invoice is stored for audit

---

## 3. Inventory Functional Scope

### 3.1 Item / Material Master

Fields:
- id
- name
- category
- unit (Bag / Kg / Ton / Nos)
- opening_stock
- reorder_level
- default_rate
- created_at

Purpose:
- Single source of truth for all materials
- Used for matching OCR results

---

### 3.2 Stock In (Purchase)

Triggered by:
- Manual entry
- Invoice upload confirmation

Rules:
- Stock quantity increases
- Creates stock transaction
- Triggers ledger entry (cash or credit)

---

### 3.3 Stock Out (Consumption)

Triggered by:
- Material usage at site

Rules:
- Stock quantity decreases
- No ledger impact

---

### 3.4 Stock Visibility

- Current stock by item
- Low stock indicator
- Basic summary metrics

---

## 4. Invoice Upload & OCR

### 4.1 Supported Formats
- PDF
- JPG
- PNG

### 4.2 OCR Data Extraction

Header:
- Supplier Name
- Invoice Number
- Invoice Date
- Total Amount
- Tax (optional)

Line Items:
- Item description
- Quantity
- Unit
- Rate
- Line total

---

### 4.3 OCR Matching Logic

- Exact item match → Auto-link
- Partial match → Suggest existing items
- No match → Allow new item creation

User always has final control.

---

## 5. User Confirmation Screen

Editable Table:
- Item Name
- Quantity
- Unit
- Rate
- Total
- Category

User can:
- Edit values
- Remove lines
- Add missing lines
- Create new items

Only Confirm posts data.

---

## 6. Database Design (Prisma)

### Item

model Item {
  id            String   @id @default(uuid())
  name          String
  category      String?
  unit          String
  openingStock  Float    @default(0)
  reorderLevel  Float?
  defaultRate   Float?
  createdAt     DateTime @default(now())
}

---

### Invoice

model Invoice {
  id            String   @id @default(uuid())
  supplierId    String?
  invoiceNumber String
  invoiceDate   DateTime
  totalAmount   Float
  fileUrl       String
  createdAt     DateTime @default(now())
}

---

### StockTransaction

model StockTransaction {
  id              String   @id @default(uuid())
  itemId          String
  transactionType String
  quantity        Float
  rate            Float?
  totalAmount     Float?
  invoiceId       String?
  createdAt       DateTime @default(now())
}

---

## 7. API Design

POST /api/invoice/upload  
POST /api/invoice/ocr  
POST /api/invoice/confirm  

---

## 8. OCR Architecture

Phase 1:
- Tesseract OCR

Phase 2:
- Google Vision / Azure Form Recognizer

OCR should be asynchronous.

---

## 9. Ledger Integration Rules

- Credit purchase → Supplier balance increases
- Cash purchase → Cash balance decreases
- Consumption → No impact
- Invoice delete → Reverse stock & ledger

---

## 10. Implementation Order

1. Item master & stock logic
2. Invoice upload & OCR
3. Confirmation UI
4. Ledger integration

---

## 11. Final Summary

This feature transforms Brickbook from a ledger-only app into a business operations tool by connecting Invoice → Inventory → Ledger while keeping the experience simple and controlled.
