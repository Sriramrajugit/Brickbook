/**
 * Chat Query Engine Types & Interfaces
 * Handles Natural Language Query (NLQ) parsing and execution
 */

// Intent types supported by the chat engine
export type ChatIntent =
  | 'GET_RECENT_TRANSACTIONS'
  | 'GET_EXPENSES'
  | 'GET_INCOME'
  | 'GET_SUMMARY_STATISTICS'
  | 'GET_TOP_EXPENSES'
  | 'GET_ACCOUNT_LEDGER'
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSACTION'
  | 'SUMMARY'
  | 'COMPARISON'
  | 'EMPLOYEE'
  | 'PAYROLL'
  | 'TOP'
  | 'TREND'
  | 'DYNAMIC_QUERY'
  | 'UNKNOWN';

// Date range presets
export type DateRangeType =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_year'
  | 'all_time'
  | 'custom';

// Parsed intent structure
export interface ParsedIntent {
  intent: ChatIntent;
  confidence: number; // 0-1 score
  filters: IntentFilters;
  rawInput: string;
}

// Filters applicable to different intents
export interface IntentFilters {
  // Time-based filters
  dateRange?: DateRangeType;
  startDate?: Date;
  endDate?: Date;
  
  // Quantity filters
  limit?: number; // For RECENT_TRANSACTIONS, TOP_EXPENSES
  
  // Entity filters
  accountName?: string; // For GET_ACCOUNT_LEDGER
  category?: string; // For GET_EXPENSES, GET_INCOME
  accountId?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Query result structure
export interface ChatQueryResult {
  intent: ChatIntent;
  filters: IntentFilters;
  data: any[];
  metadata?: {
    [key: string]: any;
  };
}

// Formatted response for UI
export interface ChatResponse {
  intent: ChatIntent;
  filters: IntentFilters | Record<string, any>;
  data: ChatQueryResult | any;
  formattedResponse: string;
  timestamp: Date;
}

// Transaction data structure (for query results)
export interface TransactionData {
  id: number;
  date: Date;
  description?: string;
  category: string;
  type: 'Cash-In' | 'Cash-Out';
  amount: number;
  accountName: string;
  paymentMode: string;
}

// Summary statistics
export interface SummaryStatistics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  periodStart: Date;
  periodEnd: Date;
}

// Top expenses structure
export interface TopExpense {
  rank: number;
  category: string;
  amount: number;
  date: Date;
  description?: string;
  accountName: string;
}

// Account ledger entry
export interface AccountLedgerEntry {
  id: number;
  date: Date;
  description?: string;
  type: 'Cash-In' | 'Cash-Out';
  amount: number;
  runningBalance: number;
}

// Error response
export interface ChatErrorResponse {
  error: string;
  intent?: ChatIntent;
  suggestion?: string;
}
