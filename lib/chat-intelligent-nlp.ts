/**
 * Intelligent NLP Engine for BrickAdvisor
 * More flexible and context-aware question understanding
 * Handles any question within Brickbook scope
 */

import { prisma } from '@/lib/prisma';

export interface EntityMap {
  tables: string[];
  fields: string[];
  keywords: string[];
  aggregations: string[];
  filters: Record<string, any>;
  question: string;
}

/**
 * Semantic keyword matching with fuzzy logic
 */
function fuzzyMatch(text: string, keywords: string[]): { matched: string[]; confidence: number } {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];
  let confidence = 0;

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Exact match
    if (lowerText.includes(lowerKeyword)) {
      matched.push(keyword);
      confidence += 1;
    } 
    // Partial match (word boundaries)
    else if (lowerKeyword.split(' ').some(word => lowerText.includes(word))) {
      matched.push(keyword);
      confidence += 0.5;
    }
  }

  return { matched, confidence: Math.min(confidence, 1) };
}

/**
 * Entity Domain Mapping - Maps user words to database entities
 */
const ENTITY_DOMAINS = {
  EMPLOYEE: {
    tables: ['Employee', 'Attendance', 'Payroll', 'Advance'],
    keywords: ['employee', 'staff', 'worker', 'person', 'team', 'crew', 'resource'],
    fields: ['name', 'salary', 'etype', 'status'],
    aggregations: ['count', 'sum', 'avg', 'max', 'min'],
  },
  TRANSACTION: {
    tables: ['Transaction', 'Account', 'Category'],
    keywords: ['transaction', 'entry', 'record', 'payment', 'transfer', 'movement', 'flow'],
    fields: ['amount', 'description', 'category', 'date', 'type'],
    aggregations: ['total', 'count', 'average'],
  },
  EXPENSE: {
    tables: ['Transaction'],
    keywords: ['expense', 'spend', 'spending', 'spent', 'cost', 'costs', 'outflow', 'paid'],
    fields: ['amount', 'category', 'description'],
    aggregations: ['total', 'highest', 'biggest', 'largest'],
  },
  INCOME: {
    tables: ['Transaction'],
    keywords: ['income', 'earned', 'revenue', 'received', 'earning', 'earn', 'inflow', 'received'],
    fields: ['amount', 'category', 'description'],
    aggregations: ['total', 'highest', 'biggest'],
  },
  ATTENDANCE: {
    tables: ['Attendance'],
    keywords: ['attendance', 'present', 'absent', 'worked', 'work', 'days', 'hours'],
    fields: ['status', 'date', 'employeeId'],
    aggregations: ['count', 'total', 'average'],
  },
  SALARY: {
    tables: ['Payroll', 'Advance'],
    keywords: ['salary', 'payroll', 'payment', 'paid', 'advance', 'get', 'receive'],
    fields: ['amount', 'fromDate', 'toDate'],
    aggregations: ['total', 'highest', 'average'],
  },
  ACCOUNT: {
    tables: ['Account'],
    keywords: ['account', 'ledger', 'balance', 'fund', 'bank'],
    fields: ['name', 'balance', 'type'],
    aggregations: ['sum', 'count'],
  },
  CATEGORY: {
    tables: ['Category'],
    keywords: ['category', 'type', 'classification', 'breakdown'],
    fields: ['name', 'description'],
    aggregations: ['count', 'sum'],
  },
  INVENTORY: {
    tables: ['Item'],
    keywords: ['stock', 'inventory', 'items', 'quantity', 'available', 'supplies', 'supplies'],
    fields: ['name', 'quantity', 'price'],
    aggregations: ['count', 'sum', 'average'],
  },
};

/**
 * Question Pattern Recognition
 */
const QUESTION_PATTERNS = {
  WHO: /^who\s+|who\s+is\s+|which\s+/i,
  WHAT: /^what\s+|show\s+|display\s+|list\s+|get\s+/i,
  HOW_MUCH: /how\s+much|total|sum|amount|value/i,
  HOW_MANY: /how\s+many|count|number of|total\s+number/i,
  TOP: /top\s+(\d+)?|highest|biggest|largest|most\s+|max/i,
  BOTTOM: /bottom\s+(\d+)?|lowest|smallest|least|min/i,
  COMPARE: /compare|vs|versus|difference|between|against/i,
  TREND: /trend|growth|increase|decrease|over\s+time|month\s+over|year\s+over/i,
  AVERAGE: /average|avg|mean|typical/i,
  RANGE: /between|from.*to|range|above|below|more than|less than/i,
};

/**
 * Detect question type and patterns
 */
function detectQuestionPatterns(question: string): string[] {
  const patterns: string[] = [];

  for (const [pattern, regex] of Object.entries(QUESTION_PATTERNS)) {
    if (regex.test(question)) {
      patterns.push(pattern);
    }
  }

  return patterns;
}

/**
 * Intelligently map question to database entities
 */
export async function intelligentEntityMapping(
  question: string,
  companyId: number
): Promise<EntityMap> {
  const lowerQuestion = question.toLowerCase();
  const entities: EntityMap = {
    tables: [],
    fields: [],
    keywords: [],
    aggregations: [],
    filters: {},
    question,
  };

  // Step 1: Identify domains (tables)
  for (const [domain, config] of Object.entries(ENTITY_DOMAINS)) {
    const { matched, confidence } = fuzzyMatch(question, config.keywords);
    if (confidence > 0.3) {
      entities.tables.push(...config.tables);
      entities.keywords.push(...matched);
      
      // Add relevant fields
      if (lowerQuestion.includes('how much') || lowerQuestion.includes('total')) {
        entities.fields.push(...config.fields.filter(f => ['amount', 'quantity'].includes(f)));
        entities.aggregations.push('SUM', 'AVG', 'MAX');
      } else if (lowerQuestion.includes('how many')) {
        entities.aggregations.push('COUNT');
      } else {
        entities.fields.push(...config.fields);
      }
    }
  }

  // Step 2: Detect question patterns
  const patterns = detectQuestionPatterns(question);
  
  if (patterns.includes('TOP')) {
    entities.aggregations.push('ORDER_BY_DESC');
    entities.filters.limit = extractNumber(question) || 10;
  }
  if (patterns.includes('BOTTOM')) {
    entities.aggregations.push('ORDER_BY_ASC');
    entities.filters.limit = extractNumber(question) || 10;
  }
  if (patterns.includes('AVERAGE')) {
    entities.aggregations.push('AVG');
  }
  if (patterns.includes('HOW_MANY')) {
    entities.aggregations.push('COUNT');
  }
  if (patterns.includes('HOW_MUCH')) {
    entities.aggregations.push('SUM');
  }

  // Step 3: Extract temporal filters
  const dateFilter = extractDateRange(question);
  if (dateFilter) {
    entities.filters.startDate = dateFilter.startDate;
    entities.filters.endDate = dateFilter.endDate;
  }

  // Step 4: Extract numeric filters
  const amountFilter = extractAmountFilter(question);
  if (amountFilter) {
    entities.filters.amount = amountFilter;
  }

  // Deduplicate tables
  entities.tables = [...new Set(entities.tables)];
  entities.fields = [...new Set(entities.fields)];
  entities.keywords = [...new Set(entities.keywords)];
  entities.aggregations = [...new Set(entities.aggregations)];

  return entities;
}

/**
 * Extract numbers from text
 */
function extractNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

/**
 * Extract date ranges
 */
function extractDateRange(text: string): { startDate: Date; endDate: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const patterns = [
    {
      regex: /today/i,
      getRange: () => ({
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }),
    },
    {
      regex: /this\s+week/i,
      getRange: () => ({
        startDate: new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000),
        endDate: now,
      }),
    },
    {
      regex: /this\s+month/i,
      getRange: () => ({
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: now,
      }),
    },
    {
      regex: /last\s+month/i,
      getRange: () => ({
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        endDate: new Date(today.getFullYear(), today.getMonth(), 0),
      }),
    },
    {
      regex: /this\s+quarter/i,
      getRange: () => ({
        startDate: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1),
        endDate: now,
      }),
    },
    {
      regex: /this\s+year/i,
      getRange: () => ({
        startDate: new Date(today.getFullYear(), 0, 1),
        endDate: now,
      }),
    },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return pattern.getRange();
    }
  }

  return null;
}

/**
 * Extract amount filters (greater than, less than, etc)
 */
function extractAmountFilter(text: string): Record<string, any> | null {
  const patterns = [
    {
      regex: /(?:more|greater|above|over)\s+(?:than\s+)?(₹|\$)?(\d+)/i,
      operator: 'gt',
    },
    {
      regex: /(?:less|below|under)\s+(?:than\s+)?(₹|\$)?(\d+)/i,
      operator: 'lt',
    },
    {
      regex: /between\s+(₹|\$)?(\d+)\s+(?:and|to)\s+(₹|\$)?(\d+)/i,
      operator: 'between',
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      if (pattern.operator === 'between') {
        return { operator: 'between', min: parseInt(match[2]), max: parseInt(match[4]) };
      }
      return { operator: pattern.operator, value: parseInt(match[2]) };
    }
  }

  return null;
}

/**
 * Determine primary data type to fetch
 */
export function getPrimaryTable(entities: EntityMap): string {
  // Priority order for tables
  const priority = [
    'Transaction',
    'Employee',
    'Attendance',
    'Payroll',
    'Account',
    'Category',
    'Item',
    'Advance',
  ];

  for (const table of priority) {
    if (entities.tables.includes(table)) {
      return table;
    }
  }

  return entities.tables[0] || 'Transaction';
}

/**
 * Build intelligent query response suggestion
 */
export function buildQuerySuggestion(entities: EntityMap): string {
  const parts: string[] = [];

  // What are we fetching?
  if (entities.aggregations.includes('COUNT')) {
    parts.push('Count of');
  } else if (entities.aggregations.includes('SUM')) {
    parts.push('Total');
  } else if (entities.aggregations.includes('AVG')) {
    parts.push('Average');
  } else {
    parts.push('Fetching');
  }

  // From which domain?
  parts.push(entities.keywords.join(' and '));

  // With what filters?
  if (entities.filters.startDate) {
    parts.push(`from ${entities.filters.startDate.toLocaleDateString()}`);
  }
  if (entities.filters.amount) {
    const amt = entities.filters.amount;
    if (amt.operator === 'gt') parts.push(`above ₹${amt.value}`);
    if (amt.operator === 'lt') parts.push(`below ₹${amt.value}`);
    if (amt.operator === 'between') parts.push(`between ₹${amt.min} and ₹${amt.max}`);
  }

  return parts.join(' ');
}
