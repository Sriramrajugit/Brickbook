/**
 * Intent Parser Engine
 * Converts natural language input to structured intents
 * Phase 1: Rule-based parsing with pattern matching
 */

import { ChatIntent, ParsedIntent, DateRangeType, IntentFilters } from '@/types/chat-query';

// Intent patterns for rule-based matching
const INTENT_PATTERNS: Record<string, RegExp[]> = {
  GET_RECENT_TRANSACTIONS: [
    /(?:last|recent|show|get)\s+(?:me\s+)?(\d+)?\s*(?:transactions|tx)/i,
    /(?:transactions|recent activity)/i,
    /last\s+\d+\s+entries/i,
  ],
  GET_EXPENSES: [
    /(?:expenses?|spending|spent|costs?)\s+(?:for|this|in|last)?\s*(.+)?/i,
    /(?:how much|total)\s+(?:did\s+)?(?:i\s+)?spend/i,
    /expense\s+summary/i,
  ],
  GET_INCOME: [
    /(?:income|revenue|earnings?|sales|received)\s+(?:for|this|in|last)?\s*(.+)?/i,
    /(?:how much|total)\s+(?:did\s+)?(?:i\s+)?earn/i,
    /income\s+summary/i,
  ],
  GET_SUMMARY_STATISTICS: [
    /(?:summary|overview|dashboard|stats?|financial\s+summary)/i,
    /(?:total\s+)?(profit|net\s+profit|income\s+vs\s+expense)/i,
    /(?:show me|give me)\s+(?:a\s+)?(?:financial\s+)?overview/i,
  ],
  GET_TOP_EXPENSES: [
    /(?:top\s+)?(\d+)?\s*(?:expenses?|spending)/i,
    /(?:highest|biggest|largest)\s+(?:expense|spend)/i,
    /(?:which\s+)?(?:expense|spending)\s+(?:was\s+)?(?:the\s+)?(?:highest|most)/i,
  ],
  GET_ACCOUNT_LEDGER: [
    /(?:ledger|account|transactions?)\s+(?:for|of)?\s+([A-Za-z\s]+?)(?:\?|$)/i,
    /(?:show|get)\s+(?:me\s+)?(?:ledger|account)\s+(?:for|of)?\s+([A-Za-z\s]+)/i,
  ],
  UNKNOWN: [/^$/],
};

/**
 * Extract date range from user input
 */
function extractDateRange(input: string): { dateRange: DateRangeType; startDate?: Date; endDate?: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check for specific date range keywords
  if (/today/i.test(input)) {
    return {
      dateRange: 'today',
      startDate: today,
      endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    };
  }
  if (/this\s+week/i.test(input)) {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return {
      dateRange: 'this_week',
      startDate: startOfWeek,
      endDate: now,
    };
  }
  if (/this\s+month/i.test(input)) {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      dateRange: 'this_month',
      startDate: startOfMonth,
      endDate: now,
    };
  }
  if (/last\s+month/i.test(input)) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      dateRange: 'last_month',
      startDate: lastMonth,
      endDate: endOfLastMonth,
    };
  }
  if (/this\s+quarter/i.test(input)) {
    const quarter = Math.floor(today.getMonth() / 3);
    const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
    return {
      dateRange: 'this_quarter',
      startDate: startOfQuarter,
      endDate: now,
    };
  }
  if (/this\s+year/i.test(input)) {
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    return {
      dateRange: 'this_year',
      startDate: startOfYear,
      endDate: now,
    };
  }
  if (/all\s+time/i.test(input)) {
    return {
      dateRange: 'all_time',
      startDate: new Date('2000-01-01'),
      endDate: now,
    };
  }

  // Default to this_month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    dateRange: 'this_month',
    startDate: startOfMonth,
    endDate: now,
  };
}

/**
 * Extract numeric parameters from input
 */
function extractNumbers(input: string): number | null {
  const match = input.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Extract account/customer name from input
 */
function extractAccountName(input: string): string | null {
  // Pattern: "ledger for XYZ" or "account of XYZ"
  const match = input.match(/(?:for|of)\s+([A-Za-z\s\&]+?)(?:\?|$)/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract category from input
 */
function extractCategory(input: string): string | null {
  // Common category patterns
  const categories = ['salary', 'rent', 'utilities', 'supplies', 'travel', 'food', 'office', 'marketing'];
  for (const cat of categories) {
    if (new RegExp(cat, 'i').test(input)) {
      return cat;
    }
  }
  return null;
}

/**
 * Determine intent and extract filters
 */
export function parseIntent(input: string): ParsedIntent {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      filters: {},
      rawInput: input,
    };
  }

  let bestMatch: ChatIntent | null = null;
  let bestConfidence = 0;

  // Match against patterns
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'UNKNOWN') continue;

    for (const pattern of patterns) {
      if (pattern.test(trimmedInput)) {
        const confidence = 0.9; // Rule-based matches are high confidence
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = intent as ChatIntent;
        }
      }
    }
  }

  // If no match found, return UNKNOWN
  if (!bestMatch) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      filters: {},
      rawInput: input,
    };
  }

  // Extract specific filters based on intent
  const filters: IntentFilters = {};
  const dateRangeInfo = extractDateRange(trimmedInput);
  filters.dateRange = dateRangeInfo.dateRange;
  filters.startDate = dateRangeInfo.startDate;
  filters.endDate = dateRangeInfo.endDate;

  // Extract intent-specific parameters
  switch (bestMatch) {
    case 'GET_RECENT_TRANSACTIONS':
      const txLimit = extractNumbers(trimmedInput);
      filters.limit = txLimit || 5;
      filters.sortBy = 'date';
      filters.sortOrder = 'desc';
      break;

    case 'GET_TOP_EXPENSES':
      const topLimit = extractNumbers(trimmedInput);
      filters.limit = topLimit || 5;
      filters.sortBy = 'amount';
      filters.sortOrder = 'desc';
      break;

    case 'GET_EXPENSES':
    case 'GET_INCOME':
      filters.category = extractCategory(trimmedInput) || undefined;
      break;

    case 'GET_ACCOUNT_LEDGER':
      filters.accountName = extractAccountName(trimmedInput) || undefined;
      break;

    case 'GET_SUMMARY_STATISTICS':
      // No specific parameters needed
      break;
  }

  return {
    intent: bestMatch,
    confidence: bestConfidence,
    filters,
    rawInput: input,
  };
}

/**
 * Get user-friendly suggestion for unknown intent
 */
export function getSuggestion(): string {
  return 'Try asking: "Show recent transactions", "Expenses this month", "Top 5 expenses", or "Summary"';
}
