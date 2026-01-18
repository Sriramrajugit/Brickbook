## Salary Advance Data Flow (FIXED)

### CREATE Salary Advance Transaction:
1. User fills form with Category="Salary Advance", selects employee, enters amount, date
2. **Transaction table**: INSERT 1 record with category="Salary Advance", type="Cash-Out"
3. **Advance table**: INSERT 1 record with employeeId, amount, date
4. ✅ Both records created for same day

### UPDATE (EDIT) Salary Advance Transaction:
1. User edits existing Salary Advance transaction
2. **Transaction table**: UPDATE the existing transaction record
3. **Advance table**: 
   - FIND old advance record (by employeeId and date)
   - DELETE old advance record
   - INSERT new advance record with updated amount
4. ✅ Both tables synchronized

### DELETE Salary Advance Transaction:
1. User clicks Delete on Salary Advance transaction
2. **Transaction table**: DELETE the transaction record
3. **Advance table**: FIND and DELETE the matching advance record (by amount and date)
4. ✅ Clean removal from both tables

### Payroll Screen Impact:
- Payroll looks for advances within date range: `date >= fromDate AND date <= toDate`
- totalAdvance = SUM of all advances for employee in that date range
- ✅ Advances created on same date as transaction will show in payroll for that week

### Key Points:
- 1 Salary Advance transaction = 1 corresponding Advance record
- Both must be kept in sync during edits
- Deletion of transaction also deletes the advance
- Payroll queries advances table directly (not transactions) for the totalAdvance amount
