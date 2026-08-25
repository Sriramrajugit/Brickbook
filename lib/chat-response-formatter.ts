/**
 * Response Formatter
 * Converts query results into human-friendly chat responses
 * Handles formatting for currency, dates, and different intent types
 */

import { formatINR, formatDateDDMMYYYY } from '@/lib/formatters';
import {
  ChatIntent,
  ChatQueryResult,
  IntentFilters,
  TransactionData,
  SummaryStatistics,
  TopExpense,
  AccountLedgerEntry,
} from '@/types/chat-query';

/**
 * Format recent transactions
 */
function formatRecentTransactions(result: ChatQueryResult): string {
  if (!result.data || result.data.length === 0) {
    return `No recent transactions found.`;
  }

  const transactions = result.data as TransactionData[];
  const lines: string[] = [
    `📊 Recent Transactions (Last ${transactions.length}):`,
    '',
  ];

  transactions.forEach((tx, index) => {
    const icon = tx.type === 'Cash-In' ? '📈' : '📉';
    const date = formatDateDDMMYYYY(tx.date);
    lines.push(`${index + 1}. ${icon} ${tx.description || tx.category}`);
    lines.push(`   ${formatINR(tx.amount)} • ${date} • ${tx.accountName}`);
    lines.push(``);
  });

  return lines.join('\n').trim();
}

/**
 * Format expenses
 */
function formatExpenses(result: ChatQueryResult): string {
  if (!result.data || result.data.length === 0) {
    return `No expenses found for the selected period.`;
  }

  const transactions = result.data as TransactionData[];
  const totalExpenses = result.metadata?.total || 0;
  const byCategory = result.metadata?.totalByCategory || {};

  const lines: string[] = [
    `💰 Expense Summary`,
    ``,
    `Total Expenses: ${formatINR(totalExpenses)}`,
    `Number of Entries: ${result.metadata?.count || 0}`,
    ``,
  ];

  if (Object.keys(byCategory).length > 0) {
    lines.push(`By Category:`);
    Object.entries(byCategory).forEach(([cat, amount]) => {
      const percentage = ((amount as number / totalExpenses) * 100).toFixed(1);
      lines.push(`  • ${cat}: ${formatINR(amount as number)} (${percentage}%)`);
    });
    lines.push(``);
  }

  lines.push(`Top Expenses:`);
  transactions.slice(0, 5).forEach((tx, index) => {
    const date = formatDateDDMMYYYY(tx.date);
    lines.push(`  ${index + 1}. ${tx.description || tx.category}`);
    lines.push(`     ${formatINR(tx.amount)} • ${date}`);
  });

  return lines.join('\n').trim();
}

/**
 * Format income
 */
function formatIncome(result: ChatQueryResult): string {
  if (!result.data || result.data.length === 0) {
    return `No income found for the selected period.`;
  }

  const transactions = result.data as TransactionData[];
  const totalIncome = result.metadata?.total || 0;
  const byCategory = result.metadata?.totalByCategory || {};

  const lines: string[] = [
    `💵 Income Summary`,
    ``,
    `Total Income: ${formatINR(totalIncome)}`,
    `Number of Entries: ${result.metadata?.count || 0}`,
    ``,
  ];

  if (Object.keys(byCategory).length > 0) {
    lines.push(`By Category:`);
    Object.entries(byCategory).forEach(([cat, amount]) => {
      const percentage = ((amount as number / totalIncome) * 100).toFixed(1);
      lines.push(`  • ${cat}: ${formatINR(amount as number)} (${percentage}%)`);
    });
    lines.push(``);
  }

  lines.push(`Recent Income:`);
  transactions.slice(0, 5).forEach((tx, index) => {
    const date = formatDateDDMMYYYY(tx.date);
    lines.push(`  ${index + 1}. ${tx.description || tx.category}`);
    lines.push(`     ${formatINR(tx.amount)} • ${date}`);
  });

  return lines.join('\n').trim();
}

/**
 * Format summary statistics
 */
function formatSummaryStatistics(result: ChatQueryResult): string {
  if (!result.data || result.data.length === 0) {
    return `No data available for summary.`;
  }

  const stats = result.data[0] as SummaryStatistics;
  const startDate = formatDateDDMMYYYY(stats.periodStart);
  const endDate = formatDateDDMMYYYY(stats.periodEnd);

  const lines: string[] = [
    `📈 Financial Summary`,
    `Period: ${startDate} to ${endDate}`,
    ``,
    `💵 Total Income:      ${formatINR(stats.totalIncome)} (${stats.incomeCount} entries)`,
    `💸 Total Expenses:    ${formatINR(stats.totalExpenses)} (${stats.expenseCount} entries)`,
    ``,
  ];

  const profitColor = stats.netProfit >= 0 ? '✅' : '❌';
  lines.push(`${profitColor} Net Profit:        ${formatINR(stats.netProfit)}`);
  lines.push(``);

  if (stats.totalIncome > 0) {
    const profitMargin = ((stats.netProfit / stats.totalIncome) * 100).toFixed(2);
    lines.push(`📊 Profit Margin:    ${profitMargin}%`);
  }

  const expenseRatio = stats.totalIncome > 0 ? ((stats.totalExpenses / stats.totalIncome) * 100).toFixed(2) : '0';
  lines.push(`📉 Expense Ratio:    ${expenseRatio}%`);
  lines.push(``);
  lines.push(`Total Transactions:  ${stats.transactionCount}`);

  return lines.join('\n').trim();
}

/**
 * Format top expenses
 */
function formatTopExpenses(result: ChatQueryResult): string {
  if (!result.data || result.data.length === 0) {
    return `No expenses found for the selected period.`;
  }

  const expenses = result.data as TopExpense[];
  const totalAmount = result.metadata?.totalAmount || 0;
  const limit = result.metadata?.limit || 5;

  const lines: string[] = [
    `🔝 Top ${Math.min(expenses.length, limit)} Expenses`,
    ``,
  ];

  expenses.forEach((exp) => {
    const percentage = totalAmount > 0 ? ((exp.amount / totalAmount) * 100).toFixed(1) : '0';
    const date = formatDateDDMMYYYY(exp.date);

    lines.push(
      `${exp.rank}. ${exp.category} - ${formatINR(exp.amount)} (${percentage}%) [${date}]`
    );
    if (exp.description) {
      lines.push(`   📝 ${exp.description}`);
    }
    lines.push(`   Account: ${exp.accountName}`);
    lines.push(``);
  });

  lines.push(`Total: ${formatINR(totalAmount)}`);

  return lines.join('\n').trim();
}

/**
 * Format account ledger
 */
function formatAccountLedger(result: ChatQueryResult): string {
  if (!result.data || result.data.length === 0) {
    return `No transactions found for account "${result.filters.accountName}".`;
  }

  const entries = result.data as AccountLedgerEntry[];
  const accountName = result.metadata?.accountName || result.filters.accountName || 'Account';
  const closingBalance = result.metadata?.closingBalance || 0;

  const lines: string[] = [
    `📋 Ledger: ${accountName}`,
    `Transactions: ${result.metadata?.total || 0}`,
    ``,
    `| Date       | Description        | Debit      | Credit     | Balance       |`,
    `|------------|-------------------|------------|------------|---------------|`,
  ];

  entries.forEach((entry) => {
    const date = formatDateDDMMYYYY(entry.date);
    const debit = entry.type === 'Cash-Out' ? formatINR(entry.amount) : '—';
    const credit = entry.type === 'Cash-In' ? formatINR(entry.amount) : '—';
    const balance = formatINR(entry.runningBalance);
    const desc = (entry.description || 'Entry').substring(0, 16);

    lines.push(
      `| ${date} | ${desc.padEnd(18)} | ${debit.padEnd(10)} | ${credit.padEnd(10)} | ${balance.padEnd(13)} |`
    );
  });

  lines.push(``);
  lines.push(`Closing Balance: ${formatINR(closingBalance)}`);

  return lines.join('\n').trim();
}

/**
 * Format unknown/error responses
 */
function formatUnknownIntent(): string {
  return `I didn't understand that request. 🤔\n\nTry asking:\n• "Show recent transactions"\n• "Expenses this month"\n• "Top 5 expenses"\n• "Income this month"\n• "Financial summary"\n• "Ledger for [account name]"`;
}

/**
 * Main formatter function
 */
export function formatChatResponse(result: ChatQueryResult): string {
  switch (result.intent) {
    case 'GET_RECENT_TRANSACTIONS':
      return formatRecentTransactions(result);

    case 'GET_EXPENSES':
      return formatExpenses(result);

    case 'GET_INCOME':
      return formatIncome(result);

    case 'GET_SUMMARY_STATISTICS':
      return formatSummaryStatistics(result);

    case 'GET_TOP_EXPENSES':
      return formatTopExpenses(result);

    case 'GET_ACCOUNT_LEDGER':
      return formatAccountLedger(result);

    case 'UNKNOWN':
      return formatUnknownIntent();

    default:
      return 'Unable to format response.';
  }
}
