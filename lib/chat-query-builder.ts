/**
 * Query Builder Engine
 * Executes parameterized database queries based on parsed intents
 * Ensures multi-tenant security (company-scoped queries)
 */

import { prisma } from '@/lib/prisma';
import {
  ChatIntent,
  IntentFilters,
  ChatQueryResult,
  TransactionData,
  SummaryStatistics,
  TopExpense,
  AccountLedgerEntry,
} from '@/types/chat-query';

/**
 * Get recent transactions
 */
export async function getRecentTransactions(
  companyId: number,
  siteId: number | null,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  const limit = Math.min(filters.limit || 5, 100);

  const where: any = {
    companyId,
  };

  if (siteId) {
    where.siteId = siteId;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  const data: TransactionData[] = transactions.map((tx: any) => ({
    id: tx.id,
    date: tx.date,
    description: tx.description,
    category: tx.category,
    type: tx.type as 'Cash-In' | 'Cash-Out',
    amount: tx.amount,
    accountName: tx.account.name,
    paymentMode: tx.paymentMode,
  }));

  return {
    intent: 'GET_RECENT_TRANSACTIONS',
    filters,
    data,
    metadata: {
      total: data.length,
      limit,
    },
  };
}

/**
 * Get expenses with filtering
 */
export async function getExpenses(
  companyId: number,
  siteId: number | null,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  const where: any = {
    companyId,
    type: 'Cash-Out', // Expenses are Cash-Out
  };

  if (siteId) {
    where.siteId = siteId;
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { date: 'desc' },
  });

  const data: TransactionData[] = transactions.map((tx: any) => ({
    id: tx.id,
    date: tx.date,
    description: tx.description,
    category: tx.category,
    type: 'Cash-Out',
    amount: tx.amount,
    accountName: tx.account.name,
    paymentMode: tx.paymentMode,
  }));

  // Group by category if needed
  const byCategory = data.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    intent: 'GET_EXPENSES',
    filters,
    data,
    metadata: {
      total: data.reduce((sum, item) => sum + item.amount, 0),
      totalByCategory: byCategory,
      count: data.length,
    },
  };
}

/**
 * Get income with filtering
 */
export async function getIncome(
  companyId: number,
  siteId: number | null,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  const where: any = {
    companyId,
    type: 'Cash-In', // Income is Cash-In
  };

  if (siteId) {
    where.siteId = siteId;
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { date: 'desc' },
  });

  const data: TransactionData[] = transactions.map((tx: any) => ({
    id: tx.id,
    date: tx.date,
    description: tx.description,
    category: tx.category,
    type: 'Cash-In',
    amount: tx.amount,
    accountName: tx.account.name,
    paymentMode: tx.paymentMode,
  }));

  // Group by category if needed
  const byCategory = data.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    intent: 'GET_INCOME',
    filters,
    data,
    metadata: {
      total: data.reduce((sum, item) => sum + item.amount, 0),
      totalByCategory: byCategory,
      count: data.length,
    },
  };
}

/**
 * Get summary statistics (total income, expenses, net profit)
 */
export async function getSummaryStatistics(
  companyId: number,
  siteId: number | null,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  const where: any = { companyId };

  if (siteId) {
    where.siteId = siteId;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    where,
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((tx: any) => tx.type === 'Cash-In')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx: any) => tx.type === 'Cash-Out')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const incomeCount = transactions.filter((tx: any) => tx.type === 'Cash-In').length;
  const expenseCount = transactions.filter((tx: any) => tx.type === 'Cash-Out').length;

  const stats: SummaryStatistics = {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    incomeCount,
    expenseCount,
    periodStart: filters.startDate || new Date('2000-01-01'),
    periodEnd: filters.endDate || new Date(),
  };

  return {
    intent: 'GET_SUMMARY_STATISTICS',
    filters,
    data: [stats],
  };
}

/**
 * Get top N expenses
 */
export async function getTopExpenses(
  companyId: number,
  siteId: number | null,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  const limit = Math.min(filters.limit || 5, 50);

  const where: any = {
    companyId,
    type: 'Cash-Out',
  };

  if (siteId) {
    where.siteId = siteId;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { amount: 'desc' },
    take: limit,
  });

  const data: TopExpense[] = transactions.map((tx: any, index: number) => ({
    rank: index + 1,
    category: tx.category,
    amount: tx.amount,
    date: tx.date,
    description: tx.description || '',
    accountName: tx.account.name,
  }));

  return {
    intent: 'GET_TOP_EXPENSES',
    filters,
    data,
    metadata: {
      limit,
      total: data.length,
      totalAmount: data.reduce((sum, item) => sum + item.amount, 0),
    },
  };
}

/**
 * Get account/customer ledger
 */
export async function getAccountLedger(
  companyId: number,
  siteId: number | null,
  accountName: string | undefined,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  if (!accountName) {
    throw new Error('Account name is required for ledger query');
  }

  // Find the account
  const account = await prisma.account.findFirst({
    where: {
      companyId,
      name: { contains: accountName, mode: 'insensitive' },
    },
  });

  if (!account) {
    return {
      intent: 'GET_ACCOUNT_LEDGER',
      filters,
      data: [],
      metadata: { error: `Account "${accountName}" not found` },
    };
  }

  const where: any = {
    companyId,
    accountId: account.id,
  };

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  // Calculate running balance
  let runningBalance = 0;
  const data: AccountLedgerEntry[] = transactions.map((tx: any) => {
    const change = tx.type === 'Cash-In' ? tx.amount : -tx.amount;
    runningBalance += change;

    return {
      id: tx.id,
      date: tx.date,
      description: tx.description,
      type: tx.type as 'Cash-In' | 'Cash-Out',
      amount: tx.amount,
      runningBalance,
    };
  });

  return {
    intent: 'GET_ACCOUNT_LEDGER',
    filters: { ...filters, accountName },
    data,
    metadata: {
      accountName: account.name,
      total: data.length,
      openingBalance: 0,
      closingBalance: runningBalance,
    },
  };
}

/**
 * Router function to execute appropriate query builder
 */
export async function executeQuery(
  intent: ChatIntent,
  companyId: number,
  siteId: number | null,
  filters: IntentFilters
): Promise<ChatQueryResult> {
  switch (intent) {
    case 'GET_RECENT_TRANSACTIONS':
      return getRecentTransactions(companyId, siteId, filters);

    case 'GET_EXPENSES':
      return getExpenses(companyId, siteId, filters);

    case 'GET_INCOME':
      return getIncome(companyId, siteId, filters);

    case 'GET_SUMMARY_STATISTICS':
      return getSummaryStatistics(companyId, siteId, filters);

    case 'GET_TOP_EXPENSES':
      return getTopExpenses(companyId, siteId, filters);

    case 'GET_ACCOUNT_LEDGER':
      return getAccountLedger(companyId, siteId, filters.accountName, filters);

    default:
      throw new Error(`Unknown intent: ${intent}`);
  }
}
