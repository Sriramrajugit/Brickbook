# Quick Reference: Local vs Production Differences

## 🎯 One-Minute Summary

**Production is behind local.** Local version has:
- ✅ Complete Bills management module  
- ✅ Chat/Q&A analytics interface
- ✅ Bill payment transaction linking
- ✅ Enhanced employee management (10 fields vs 4)
- ✅ ProfileMenu in header
- ✅ Configuration-driven category logic

---

## 📑 What's Missing from Production

### CRITICAL (Implement Immediately)
```
📦 Bills Module
  ├── app/bills/page.tsx              → Full invoice/bill management UI
  ├── app/api/bills/route.ts          → List and create bills API
  ├── app/api/bills/[id]/route.ts     → Edit/delete individual bills
  ├── app/api/bills/upload/           → Bill image upload (with OCR support)
  └── app/api/bills/ocr/              → OCR processing for bill data

💬 Chat/Analytics Module
  ├── app/chat/page.tsx               → Natural language query interface
  ├── lib/chat-intent-parser.ts       → Intent detection (What does user want?)
  ├── lib/chat-query-builder.ts       → SQL query generation from intent
  ├── lib/chat-response-formatter.ts  → Format results as natural language
  ├── lib/chat-nlp-extractor.ts       → Entity extraction (dates, amounts, etc)
  ├── lib/chat-intelligent-nlp.ts     → Advanced NLP processing
  ├── lib/chat-dynamic-query.ts       → Dynamic query composition
  └── types/chat-query.ts             → TypeScript definitions
```

### HIGH PRIORITY (Should Have)
```
🔐 Bill Payment Linking
  └── Prevents editing transactions linked to bills (in app/api/transactions/route.ts)

⚙️ Configuration System  
  └── lib/transactionConfig.ts        → Category rules instead of hardcoded

👤 UI Improvements
  └── app/components/ProfileMenu.tsx  → User profile dropdown in header
```

### MEDIUM PRIORITY (Nice to Have)
```
🤝 Partners Management
  ├── app/partners/page.tsx           → Dedicated partners page
  └── app/api/partners/*              → Partner CRUD APIs

📝 Enhanced Employee Fields
  ├── partnerType, gstNumber, creditPeriodDays, phone, address, email
  ├── salaryFrequency (M/D distinction)
  └── Better partner categorization
```

---

## 🔄 Key Behavioral Differences

### Attendance Status Model
| Local | Production | Implication |
|-------|-----------|------------|
| Numeric: `0`, `1`, `1.5`, `2` | String: `'Absent'`, `'Present'`, `'OT-4hr'`, `'OT-8hr'` | Data model incompatibility |

### Payroll Approach
| Local | Production |
|-------|-----------|
| **Client-side preview/calculation** | **Database records** |
| Shows payroll preview before saving | Direct database records |
| Selects specific employees to pay | Less UI control |

### Transaction Type Values
| Local | Production |
|-------|-----------|
| `'Cash-In'` / `'Cash-Out'` | `'Income'` / `'Expense'` |

### Account Filter Query Param
| Local | Production |
|-------|-----------|
| `?account=ID` | `?accountId=ID` |

---

## 📋 File Sync Checklist

**To fully sync local to production, copy:**

### Pages (UI Components)
- [ ] `app/bills/page.tsx` 
- [ ] `app/chat/page.tsx`
- [ ] `app/partners/page.tsx` (optional - architectural choice)

### API Routes  
- [ ] `app/api/bills/route.ts` (GET, POST for bills)
- [ ] `app/api/bills/[id]/route.ts` (PUT, DELETE)
- [ ] `app/api/bills/upload/route.ts`
- [ ] `app/api/bills/ocr/route.ts`
- [ ] Update `app/api/transactions/route.ts` (add bill payment linking)
- [ ] `app/api/partners/route.ts` (if using partners module)
- [ ] `app/api/partners/[id]/route.ts`

### Libraries & Utilities
- [ ] `lib/transactionConfig.ts`
- [ ] `lib/chat-intent-parser.ts`
- [ ] `lib/chat-query-builder.ts`
- [ ] `lib/chat-response-formatter.ts`
- [ ] `lib/chat-nlp-extractor.ts`
- [ ] `lib/chat-intelligent-nlp.ts`
- [ ] `lib/chat-dynamic-query.ts`
- [ ] `types/chat-query.ts`

### Components
- [ ] `app/components/ProfileMenu.tsx` (add to transactions, payroll, attendance pages)

### Schema Updates (Prisma)
- [ ] May need `PartnerBill`, `BillPayment` models for bills
- [ ] May need chat session/message tables
- [ ] Update transaction model for bill linking

---

## 🔍 Query Parameter Changes Needed

If syncing, standardize these API params:

| Endpoint | Local Param | Production Param | Action |
|----------|------------|------------------|--------|
| Transactions filter | `?account=ID` | `?accountId=ID` | Align to production |
| Transactions filter | N/A (no type) | `?type=Income/Expense` | Production is better |
| Attendance status | Numeric (0,1,1.5,2) | String ('Present',...) | Pick one standard |

---

## 🎨 Component Tree - Production

```
app/layout.tsx
├── Navigation.tsx           ← Add ProfileMenu here
├── pages
│   ├── /transactions       ← Add ProfileMenu header
│   ├── /payroll            ← Add ProfileMenu header  
│   ├── /attendance         ← Keep as-is (no menu needed)
│   ├── /employees          ← Keep simplified form
│   ├── /bills             ← NEW (copy from local)
│   ├── /chat              ← NEW (copy from local)
│   └── /partners          ← NEW (optional)
└── components
    ├── Navigation.tsx
    ├── MobileNav.tsx
    ├── AuthProvider.tsx
    ├── ProfileMenu.tsx    ← NEW
    └── [other components]
```

---

## 🚀 Implementation Priority

### Phase 1 (Critical - Week 1)
1. Add ProfileMenu component to header
2. Copy Bills module (all files)
3. Update transactions API with bill payment linking

### Phase 2 (High - Week 2-3)
1. Copy Chat module (all libraries + page)
2. Add transactionConfig.ts
3. Update employee pages with enhanced fields

### Phase 3 (Medium - Week 4)
1. Add Partners management module
2. Align data models (attendance status, etc)
3. Performance optimization

### Phase 4 (Nice to Have - Later)
1. OCR improvements
2. Advanced analytics
3. Chat enhancements

---

## 📚 Related Documentation

- See `LOCAL_VS_PRODUCTION_COMPARISON.md` for detailed analysis
- See [Copilot Instructions](../copilot-instructions.md) for architecture overview
- See [ER-DIAGRAM.md](../ER-DIAGRAM.md) for database schema

---

## ✅ Verification Checklist

After syncing:
- [ ] Bills page loads and lists bills correctly
- [ ] Chat interface appears and responds
- [ ] Bill payments show as linked/locked in transactions
- [ ] ProfileMenu displays company name
- [ ] All API endpoints working with proper filters
- [ ] Employee creation accepts extended fields
- [ ] Tests pass
- [ ] No console errors

