/**
 * Dynamic Query Engine
 * Executes flexible queries based on NLP-parsed entities
 * Handles multiple types of queries dynamically
 */

import { prisma } from '@/lib/prisma';
import { ParsedQuery } from '@/lib/chat-nlp-extractor';

export interface QueryResult {
  success: boolean;
  data: any;
  message: string;
  statistics?: Record<string, any>;
}

/**
 * Build WHERE clause from filters
 */
function buildWhereClause(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>
) {
  const where: any = {
    companyId,
  };

  if (siteId) {
    where.siteId = siteId;
  }

  // Date range filtering
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  // Category filtering
  if (filters.category) {
    where.category = {
      contains: filters.category,
      mode: 'insensitive',
    };
  }

  // Account filtering
  if (filters.account) {
    where.account = {
      name: {
        contains: filters.account,
        mode: 'insensitive',
      },
    };
  }

  // Amount filtering with operator
  if (filters.amountOperator && filters.amountValue) {
    switch (filters.amountOperator) {
      case '>':
        where.amount = { gt: filters.amountValue };
        break;
      case '<':
        where.amount = { lt: filters.amountValue };
        break;
      case '=':
        where.amount = { equals: filters.amountValue };
        break;
      case 'between':
        where.amount = { gte: filters.amountValue[0], lte: filters.amountValue[1] };
        break;
    }
  }

  return where;
}

/**
 * Query expenses dynamically
 */
export async function queryExpenses(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>,
  limit: number = 10
): Promise<QueryResult> {
  try {
    const where = buildWhereClause(companyId, siteId, filters);
    where.type = 'Cash-Out'; // Expenses are outflows

    const expenses = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    const total = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      success: true,
      data: expenses.map((tx: any) => ({
        date: tx.date,
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        account: tx.account.name,
        paymentMode: tx.paymentMode,
      })),
      message: `Found ${expenses.length} expense(s)`,
      statistics: {
        totalAmount: total._sum.amount || 0,
        count: total._count,
        average: total._count > 0 ? (total._sum.amount || 0) / total._count : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying expenses: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Query income dynamically
 */
export async function queryIncome(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>,
  limit: number = 10
): Promise<QueryResult> {
  try {
    const where = buildWhereClause(companyId, siteId, filters);
    where.type = 'Cash-In'; // Income are inflows

    const income = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    const total = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      success: true,
      data: income.map((tx: any) => ({
        date: tx.date,
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        account: tx.account.name,
        paymentMode: tx.paymentMode,
      })),
      message: `Found ${income.length} income transaction(s)`,
      statistics: {
        totalAmount: total._sum.amount || 0,
        count: total._count,
        average: total._count > 0 ? (total._sum.amount || 0) / total._count : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying income: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Query transactions dynamically
 */
export async function queryTransactions(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>,
  limit: number = 10
): Promise<QueryResult> {
  try {
    const where = buildWhereClause(companyId, siteId, filters);

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: transactions.map((tx: any) => ({
        date: tx.date,
        description: tx.description,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        account: tx.account.name,
        paymentMode: tx.paymentMode,
      })),
      message: `Found ${transactions.length} transaction(s)`,
      statistics: {
        totalIncome: transactions
          .filter((t: any) => t.type === 'Cash-In')
          .reduce((sum: number, t: any) => sum + t.amount, 0),
        totalExpense: transactions
          .filter((t: any) => t.type === 'Cash-Out')
          .reduce((sum: number, t: any) => sum + t.amount, 0),
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get financial summary/overview
 */
export async function querySummary(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>
): Promise<QueryResult> {
  try {
    const where = buildWhereClause(companyId, siteId, filters);

    // Total income
    const income = await prisma.transaction.aggregate({
      where: { ...where, type: 'Cash-In' },
      _sum: { amount: true },
    });

    // Total expenses
    const expenses = await prisma.transaction.aggregate({
      where: { ...where, type: 'Cash-Out' },
      _sum: { amount: true },
    });

    // Top categories
    const topCategories = await prisma.transaction.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expenses._sum.amount || 0;
    const netProfit = totalIncome - totalExpense;

    return {
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netProfit,
        topCategories: topCategories.map((cat: any) => ({
          category: cat.category,
          total: cat._sum.amount,
          count: cat._count,
        })),
      },
      message: 'Financial summary',
      statistics: {
        profitMargin:
          totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) + '%' : 'N/A',
        incomeVsExpense: `₹${totalIncome} income vs ₹${totalExpense} expenses`,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get top expenses/income
 */
export async function queryTop(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>,
  type: 'expense' | 'income',
  limit: number = 10
): Promise<QueryResult> {
  try {
    const where = buildWhereClause(companyId, siteId, filters);
    where.type = type === 'expense' ? 'Cash-Out' : 'Cash-In';

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { amount: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: transactions.map((tx: any) => ({
        date: tx.date,
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        account: tx.account.name,
      })),
      message: `Top ${limit} ${type}s`,
      statistics: {
        total: transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
        average: transactions.length > 0
          ? transactions.reduce((sum: number, t: any) => sum + t.amount, 0) / transactions.length
          : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying top ${type}s: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Query advance salary and payroll data
 */
export async function queryAdvanceSalary(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>,
  limit: number = 10
): Promise<QueryResult> {
  try {
    // First, check if user is asking about ADVANCES
    const isAdvanceQuery =
      filters.mainQuestion?.toLowerCase().includes('advance') ||
      filters.mainQuestion?.toLowerCase().includes('get more');

    if (isAdvanceQuery) {
      // Query Advance table
      const where: any = {
        companyId,
      };

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = new Date(filters.startDate);
        if (filters.endDate) where.date.lte = new Date(filters.endDate);
      }

      const advances = await prisma.advance.findMany({
        where,
        include: {
          employee: true,
        },
        orderBy: { amount: 'desc' },
        take: limit,
      });

      const groupedByEmployee: Record<string, any> = {};

      advances.forEach((adv: any) => {
        if (!groupedByEmployee[adv.employeeId]) {
          groupedByEmployee[adv.employeeId] = {
            employeeId: adv.employeeId,
            employeeName: adv.employee?.name || 'Unknown',
            totalAdvance: 0,
            advanceCount: 0,
            records: [],
          };
        }
        groupedByEmployee[adv.employeeId].totalAdvance += adv.amount;
        groupedByEmployee[adv.employeeId].advanceCount += 1;
        groupedByEmployee[adv.employeeId].records.push({
          date: adv.date,
          amount: adv.amount,
          reason: adv.reason,
        });
      });

      const data = Object.values(groupedByEmployee)
        .sort((a: any, b: any) => b.totalAdvance - a.totalAdvance)
        .map((emp: any) => ({
          employeeName: emp.employeeName,
          employeeId: emp.employeeId,
          totalAdvance: emp.totalAdvance,
          advanceCount: emp.advanceCount,
          averageAdvance: emp.totalAdvance / emp.advanceCount,
        }));

      return {
        success: true,
        data,
        message: `Advance salary summary for employees`,
        statistics: {
          topEmployee: data[0]?.employeeName || 'N/A',
          maxAdvance: data[0]?.totalAdvance || 0,
          totalAdvances: advances.length,
        },
      };
    } else {
      // Query Payroll table (salary)
      const where: any = {
        companyId,
      };

      if (filters.startDate || filters.endDate) {
        where.fromDate = {};
        if (filters.startDate) where.fromDate.gte = new Date(filters.startDate);
        if (filters.endDate) where.toDate = {};
        if (filters.endDate) where.toDate.lte = new Date(filters.endDate);
      }

      const payrolls = await prisma.payroll.findMany({
        where,
        include: {
          employee: true,
        },
        orderBy: { amount: 'desc' },
        take: limit,
      });

      const groupedByEmployee: Record<string, any> = {};

      payrolls.forEach((payroll: any) => {
        if (!groupedByEmployee[payroll.employeeId]) {
          groupedByEmployee[payroll.employeeId] = {
            employeeId: payroll.employeeId,
            employeeName: payroll.employee?.name || 'Unknown',
            totalSalary: 0,
            payrollCount: 0,
          };
        }
        groupedByEmployee[payroll.employeeId].totalSalary += payroll.amount;
        groupedByEmployee[payroll.employeeId].payrollCount += 1;
      });

      const data = Object.values(groupedByEmployee)
        .sort((a: any, b: any) => b.totalSalary - a.totalSalary)
        .map((emp: any) => ({
          employeeName: emp.employeeName,
          employeeId: emp.employeeId,
          totalSalary: emp.totalSalary,
          payrollCount: emp.payrollCount,
          averageSalary: emp.totalSalary / emp.payrollCount,
        }));

      return {
        success: true,
        data,
        message: `Payroll/Salary summary for employees`,
        statistics: {
          topEmployee: data[0]?.employeeName || 'N/A',
          maxSalary: data[0]?.totalSalary || 0,
          totalPayrolls: payrolls.length,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying payroll/advance data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Query employee attendance and work data
 */
export async function queryEmployeeAttendance(
  companyId: number,
  siteId: number | null,
  filters: Record<string, any>,
  limit: number = 10
): Promise<QueryResult> {
  try {
    const where: any = {
      companyId,
    };

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    // Get all attendance records with filters
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: { date: 'desc' },
    });

    // Group by employee and calculate statistics
    const employeeStats: Record<string, any> = {};

    attendanceRecords.forEach((record: any) => {
      if (!employeeStats[record.employeeId]) {
        employeeStats[record.employeeId] = {
          employeeId: record.employeeId,
          employeeName: record.employee?.name || 'Unknown',
          presentDays: 0,
          absentDays: 0,
          totalDays: 0,
          averageStatus: 0,
          statusValues: [],
        };
      }

      employeeStats[record.employeeId].totalDays += 1;
      employeeStats[record.employeeId].statusValues.push(record.status);

      // Assume status > 0 means present, 0 means absent
      if (record.status > 0) {
        employeeStats[record.employeeId].presentDays += 1;
      } else {
        employeeStats[record.employeeId].absentDays += 1;
      }
    });

    // Calculate averages and convert to array
    const data = Object.values(employeeStats)
      .map((stats: any) => ({
        employeeName: stats.employeeName,
        employeeId: stats.employeeId,
        presentDays: stats.presentDays,
        absentDays: stats.absentDays,
        totalDays: stats.totalDays,
        averageStatus: stats.statusValues.length > 0
          ? Math.round(
              (stats.statusValues.reduce((a: number, b: number) => a + b, 0) /
                stats.statusValues.length) *
                100
            ) / 100
          : 0,
      }))
      .sort((a: any, b: any) => b.presentDays - a.presentDays)
      .slice(0, limit);

    return {
      success: true,
      data,
      message: `Employee attendance records`,
      statistics: {
        totalEmployeesTracked: data.length,
        topPresent: data[0]?.employeeName || 'N/A',
        maxDaysPresent: data[0]?.presentDays || 0,
        maxTotalDays: data[0]?.totalDays || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error querying employee attendance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Execute dynamic query based on parsed NLP
 */
export async function executeDynamicQuery(
  parsedQuery: ParsedQuery,
  companyId: number,
  siteId: number | null
): Promise<QueryResult> {
  const { intent, filters } = parsedQuery;

  // Add mainQuestion to filters for payroll queries
  const filtersWithQuestion = { ...filters, mainQuestion: parsedQuery.mainQuestion };

  // Route to appropriate query based on intent
  if (intent === 'EXPENSE') {
    return queryExpenses(companyId, siteId, filters);
  }

  if (intent === 'INCOME') {
    return queryIncome(companyId, siteId, filters);
  }

  if (intent === 'TRANSACTION') {
    return queryTransactions(companyId, siteId, filters);
  }

  if (intent === 'SUMMARY') {
    return querySummary(companyId, siteId, filters);
  }

  if (intent === 'TOP') {
    // Check if expense or income related
    const isExpense = parsedQuery.mainQuestion.toLowerCase().includes('expense');
    return queryTop(companyId, siteId, filters, isExpense ? 'expense' : 'income');
  }

  if (intent === 'EMPLOYEE') {
    return queryEmployeeAttendance(companyId, siteId, filters);
  }

  if (intent === 'PAYROLL') {
    return queryAdvanceSalary(companyId, siteId, filtersWithQuestion);
  }

  // Default to transaction query
  return queryTransactions(companyId, siteId, filters);
}
