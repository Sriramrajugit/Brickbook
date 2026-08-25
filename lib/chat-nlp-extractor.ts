/**
 * Advanced NLP Entity Extractor
 * Extracts structured entities from natural language queries
 * Handles: dates, amounts, categories, accounts, employees, operators
 */

import { prisma } from '@/lib/prisma';

export interface ExtractedEntity {
  type: 'date_range' | 'amount' | 'category' | 'account' | 'employee' | 'operator' | 'comparison';
  value: any;
  rawText: string;
  confidence: number;
}

export interface ParsedQuery {
  intent: string;
  entities: ExtractedEntity[];
  mainQuestion: string;
  hasComparison: boolean;
  filters: Record<string, any>;
}

/**
 * Extract date ranges from text
 */
export function extractDateRange(text: string): ExtractedEntity | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Patterns for date ranges
  const patterns = [
    {
      regex: /today/i,
      value: { dateRange: 'today', startDate: today, endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) },
      confidence: 1,
    },
    {
      regex: /this\s+week/i,
      value: {
        dateRange: 'this_week',
        startDate: new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000),
        endDate: now,
      },
      confidence: 1,
    },
    {
      regex: /this\s+month/i,
      value: {
        dateRange: 'this_month',
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: now,
      },
      confidence: 1,
    },
    {
      regex: /last\s+month/i,
      value: {
        dateRange: 'last_month',
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        endDate: new Date(today.getFullYear(), today.getMonth(), 0),
      },
      confidence: 1,
    },
    {
      regex: /this\s+quarter/i,
      value: {
        dateRange: 'this_quarter',
        startDate: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1),
        endDate: now,
      },
      confidence: 1,
    },
    {
      regex: /this\s+year/i,
      value: {
        dateRange: 'this_year',
        startDate: new Date(today.getFullYear(), 0, 1),
        endDate: now,
      },
      confidence: 1,
    },
    {
      regex: /last\s+(\d+)\s+days?/i,
      value: null, // Dynamic
      confidence: 0.9,
      dynamic: (match: RegExpMatchArray) => {
        const days = parseInt(match[1]);
        return {
          dateRange: `last_${days}_days`,
          startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
          endDate: now,
        };
      },
    },
    {
      regex: /past\s+(\d+)\s+months?/i,
      value: null, // Dynamic
      confidence: 0.9,
      dynamic: (match: RegExpMatchArray) => {
        const months = parseInt(match[1]);
        return {
          dateRange: `past_${months}_months`,
          startDate: new Date(today.getFullYear(), today.getMonth() - months, 1),
          endDate: now,
        };
      },
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const value = (pattern as any).dynamic ? (pattern as any).dynamic(match) : pattern.value;
      return {
        type: 'date_range',
        value,
        rawText: match[0],
        confidence: pattern.confidence,
      };
    }
  }

  return null;
}

/**
 * Extract amount/money from text
 */
export function extractAmount(text: string): ExtractedEntity | null {
  // Patterns: ₹5000, $100, 1000 rupees, 5k, 100000
  const patterns = [
    {
      regex: /[₹\$]?\s*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/g,
      confidence: 0.8,
    },
    {
      regex: /(\d+(?:\.\d{2})?)\s*(?:rupees?|inr|₹)/i,
      confidence: 0.9,
    },
    {
      regex: /(\d+)[kK](?:\s+rupees?|inr)?/,
      confidence: 0.85,
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const amountStr = match[1].replace(/[,]/g, '');
      let amount = parseFloat(amountStr);
      // Handle 'k' suffix
      if (/[kK]$/.test(match[0])) {
        amount *= 1000;
      }

      return {
        type: 'amount',
        value: amount,
        rawText: match[0],
        confidence: pattern.confidence,
      };
    }
  }

  return null;
}

/**
 * Extract comparison operators (greater than, less than, equal to)
 */
export function extractOperator(text: string): ExtractedEntity | null {
  const operators = [
    {
      regex: /(?:more|greater|above|exceeds?|greater than|over)\s+(?:than)?\s*(₹|\$)?(\d+)/i,
      operator: '>',
      confidence: 0.95,
    },
    {
      regex: /(?:less|below|under|less than)\s+(₹|\$)?(\d+)/i,
      operator: '<',
      confidence: 0.95,
    },
    {
      regex: /(?:equals?|exactly|is)\s+(₹|\$)?(\d+)/i,
      operator: '=',
      confidence: 0.9,
    },
    {
      regex: /(?:between|from)\s+(₹|\$)?(\d+)\s+(?:and|to)\s+(₹|\$)?(\d+)/i,
      operator: 'between',
      confidence: 0.95,
    },
  ];

  for (const opPattern of operators) {
    const match = text.match(opPattern.regex);
    if (match) {
      return {
        type: 'operator',
        value: {
          operator: opPattern.operator,
          amount: parseInt(match[2]),
        },
        rawText: match[0],
        confidence: opPattern.confidence,
      };
    }
  }

  return null;
}

/**
 * Detect intent from question keywords
 */
export function detectIntent(text: string): string {
  const lowerText = text.toLowerCase();

  // Check PAYROLL/SALARY/ADVANCE first (highest priority) - must check before EMPLOYEE
  const payrollKeywords = [
    'advance',
    'salary',
    'payroll',
    'paid',
    'payment',
    'earned',
    'get more',
    'received',
    'payment received',
  ];
  if (payrollKeywords.some((word) => lowerText.includes(word))) {
    return 'PAYROLL';
  }

  // Check EMPLOYEE/ATTENDANCE next (second priority) - must check before TOP
  const employeeKeywords = [
    'employee',
    'staff',
    'worker',
    'worked',
    'attendance',
    'present',
    'absent',
    'who',
  ];
  if (employeeKeywords.some((word) => lowerText.includes(word))) {
    return 'EMPLOYEE';
  }

  // Check other intents with lower priority
  const keywords = {
    EXPENSE: ['expense', 'spend', 'spending', 'spent', 'cost', 'costs'],
    INCOME: ['income', 'earned', 'revenue', 'received', 'earning', 'earn'],
    TRANSACTION: ['transaction', 'entry', 'record', 'payment', 'transfer'],
    ACCOUNT: ['account', 'ledger', 'balance'],
    SUMMARY: ['summary', 'overview', 'total', 'all', 'complete'],
    COMPARISON: ['compare', 'vs', 'versus', 'difference'],
    TOP: ['top', 'highest', 'biggest', 'most', 'maximum'],
    TREND: ['trend', 'growth', 'increase', 'decrease', 'over time'],
  };

  for (const [intent, words] of Object.entries(keywords)) {
    if (words.some((word) => lowerText.includes(word))) {
      return intent;
    }
  }

  return 'DYNAMIC_QUERY';
}

/**
 * Extract category from text
 */
export async function extractCategory(
  text: string,
  companyId: number
): Promise<ExtractedEntity | null> {
  // Get all categories from DB for matching
  const categories = await prisma.category.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });

  const lowerText = text.toLowerCase();

  for (const category of categories) {
    const categoryWords = category.name.toLowerCase().split(' ');
    for (const word of categoryWords) {
      if (lowerText.includes(word)) {
        return {
          type: 'category',
          value: { id: category.id, name: category.name },
          rawText: category.name,
          confidence: 0.85,
        };
      }
    }
  }

  return null;
}

/**
 * Extract account from text
 */
export async function extractAccount(
  text: string,
  companyId: number
): Promise<ExtractedEntity | null> {
  // Get all accounts from DB for matching
  const accounts = await prisma.account.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });

  const lowerText = text.toLowerCase();

  for (const account of accounts) {
    const accountWords = account.name.toLowerCase().split(' ');
    for (const word of accountWords) {
      if (word.length > 2 && lowerText.includes(word)) {
        return {
          type: 'account',
          value: { id: account.id, name: account.name },
          rawText: account.name,
          confidence: 0.9,
        };
      }
    }
  }

  return null;
}

/**
 * Parse natural language query into structured format
 */
export async function parseNLPQuery(
  question: string,
  companyId: number
): Promise<ParsedQuery> {
  const entities: ExtractedEntity[] = [];

  // Extract date range
  const dateRange = extractDateRange(question);
  if (dateRange) entities.push(dateRange);

  // Extract amount/operator
  const operator = extractOperator(question);
  if (operator) entities.push(operator);

  const amount = !operator && extractAmount(question);
  if (amount) entities.push(amount);

  // Extract category (async)
  const category = await extractCategory(question, companyId);
  if (category) entities.push(category);

  // Extract account (async)
  const account = await extractAccount(question, companyId);
  if (account) entities.push(account);

  // Detect intent
  const intent = detectIntent(question);
  const hasComparison = /compare|vs|versus|than|difference/i.test(question);

  // Build filters object
  const filters: Record<string, any> = {};
  if (dateRange) filters.startDate = dateRange.value.startDate;
  if (dateRange) filters.endDate = dateRange.value.endDate;
  if (category) filters.category = category.value.name;
  if (account) filters.account = account.value.name;
  if (operator) {
    filters.amountOperator = operator.value.operator;
    filters.amountValue = operator.value.amount;
  }

  return {
    intent,
    entities,
    mainQuestion: question,
    hasComparison,
    filters,
  };
}
