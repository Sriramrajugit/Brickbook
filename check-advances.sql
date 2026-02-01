-- Check Advances table
SELECT id, "employeeId", amount, reason, date, "companyId" FROM advances ORDER BY date DESC LIMIT 10;

-- Check Salary Advance transactions
SELECT id, amount, description, category, type, date FROM transactions WHERE category = 'Salary Advance' ORDER BY date DESC LIMIT 10;
