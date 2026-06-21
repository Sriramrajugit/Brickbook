/**
 * Chat Query API Endpoint
 * POST /api/chat-query
 * 
 * Handles natural language queries using intelligent NLP
 * Context-aware, flexible question understanding
 * All queries are multi-tenant scoped (company-based)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { intelligentEntityMapping, buildQuerySuggestion, getPrimaryTable } from '@/lib/chat-intelligent-nlp';
import { parseNLPQuery } from '@/lib/chat-nlp-extractor';
import { executeDynamicQuery } from '@/lib/chat-dynamic-query';
import { ChatResponse, ChatErrorResponse } from '@/types/chat-query';
import { prisma } from '@/lib/prisma';

/**
 * Detect and handle meta-questions about the chatbot itself
 */
function handleMetaQuestion(message: string, userName: string): string | null {
  const lowerMessage = message.toLowerCase().trim();

  // Who are you / Identity questions
  if (
    lowerMessage.match(/^(who|what)\s+(are|is)\s+(you|brickadvisor)/i) ||
    lowerMessage.match(/^what.*your.*name/i) ||
    lowerMessage.match(/^tell.*(about|me)\s+(yourself|you)/i)
  ) {
    return `👋 Hi ${userName}! I'm **BrickAdvisor**, your intelligent business assistant for BrickBook. I help you analyze transactions, employee data, payroll, attendance, and more using natural language questions. Ask me anything about your business!`;
  }

  // Capabilities questions
  if (
    lowerMessage.match(/^(what\s+(can|do)|how|capabilities|features)/i) ||
    lowerMessage.match(/^(help|assistance|support|what.*can.*you.*do)/i)
  ) {
    return `🤖 I can help you with:
• **Transactions**: View expenses, income, and transaction details
• **Employees**: Check employee info and active staff
• **Attendance**: Track employee attendance and work hours
• **Payroll**: View salary and payroll information
• **Salary Advances**: Check advance salary details
• **Financial Analysis**: Summary, totals, top expenses/income
• **Trends**: See data over different time periods
• **Comparisons**: Compare income vs expenses

Just ask me naturally! Example questions:
  - "Show total expenses this month"
  - "Who worked most this month?"
  - "Top 5 expenses"
  - "Compare income vs expenses"`;
  }

  // Greeting questions
  if (
    lowerMessage.match(/^(hello|hi|hey|greetings)/i) ||
    lowerMessage.match(/^how\s+(are\s+)?you/i)
  ) {
    return `👋 Hello ${userName}! I'm BrickAdvisor, ready to help you with your business data. What would you like to know?`;
  }

  // About company/system
  if (lowerMessage.match(/^about|what\s+is.*brickbook/i)) {
    return `📚 **BrickBook** is a comprehensive accounting and business management system that helps you track:
• Financial transactions and accounts
• Employee management and payroll
• Attendance tracking
• Inventory management

I'm BrickAdvisor, your AI assistant integrated into BrickBook to answer your business questions in natural language! Ask me anything.`;
  }

  return null; // Not a meta-question, continue with regular query
}

/**
 * Format result for chat display
 */
function formatChatResult(result: any): string {
  if (!result.success) {
    return `❌ ${result.message}`;
  }

  let formatted = `✅ ${result.message}\n\n`;

  // Display data
  if (Array.isArray(result.data)) {
    if (result.data.length === 0) {
      formatted += 'No results found.';
    } else {
      formatted += result.data
        .slice(0, 10)
        .map((item: any, idx: number) => {
          if (item.date) {
            const date = new Date(item.date).toLocaleDateString();
            return `${idx + 1}. ${date} - ${item.description || item.category} (₹${item.amount?.toLocaleString('en-IN') || 0})`;
          }
          return `${idx + 1}. ${JSON.stringify(item)}`;
        })
        .join('\n');

      if (result.data.length > 10) {
        formatted += `\n\n... and ${result.data.length - 10} more`;
      }
    }
  } else if (typeof result.data === 'object') {
    // For summary/statistics
    formatted += Object.entries(result.data)
      .map(([key, value]: [string, any]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map((v: any) => `  • ${JSON.stringify(v)}`).join('\n')}`;
        }
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('total')) {
            return `${key}: ₹${value.toLocaleString('en-IN')}`;
          }
        }
        return `${key}: ${value}`;
      })
      .join('\n');
  }

  // Add statistics if available
  if (result.statistics && Object.keys(result.statistics).length > 0) {
    formatted += '\n\n📊 Statistics:\n';
    formatted += Object.entries(result.statistics)
      .map(([key, value]: [string, any]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        return `• ${formattedKey}: ${value}`;
      })
      .join('\n');
  }

  return formatted;
}

/**
 * POST /api/chat-query
 * Request body: { message: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' } as ChatErrorResponse,
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request - message is required and must be a string' } as ChatErrorResponse,
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0 || trimmedMessage.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be between 1 and 1000 characters' } as ChatErrorResponse,
        { status: 400 }
      );
    }

    // 3. Check if this is a meta-question about BrickAdvisor itself
    const metaAnswer = handleMetaQuestion(trimmedMessage, user.name || 'there');
    if (metaAnswer) {
      const chatResponse: ChatResponse = {
        intent: 'UNKNOWN' as any,
        filters: {},
        data: null,
        formattedResponse: metaAnswer,
        timestamp: new Date(),
      };
      return NextResponse.json(chatResponse, { status: 200 });
    }

    // 4. Use intelligent entity mapping to understand the question
    const entityMap = await intelligentEntityMapping(trimmedMessage, user.companyId);

    // 5. If intelligent mapping found entities, use dynamic query
    if (entityMap.tables.length > 0) {
      // Build a structured query from entity map
      const primaryTable = getPrimaryTable(entityMap);
      
      // Execute intelligent query based on primary table
      const queryResult = await executeIntelligentQuery(
        primaryTable,
        entityMap,
        user.companyId,
        user.siteId || null
      );

      if (queryResult.success) {
        const formattedResponse = formatChatResult(queryResult);
        const chatResponse: ChatResponse = {
          intent: primaryTable as any,
          filters: entityMap.filters,
          data: queryResult.data,
          formattedResponse,
          timestamp: new Date(),
        };
        return NextResponse.json(chatResponse, { status: 200 });
      }
    }

    // 6. Fallback to traditional NLP parsing
    const parsedQuery = await parseNLPQuery(trimmedMessage, user.companyId);
    const queryResult = await executeDynamicQuery(
      parsedQuery,
      user.companyId,
      user.siteId || null
    );

    // 7. Format response
    const formattedResponse = formatChatResult(queryResult);
    const chatResponse: ChatResponse = {
      intent: parsedQuery.intent as any,
      filters: parsedQuery.filters,
      data: queryResult.data,
      formattedResponse,
      timestamp: new Date(),
    };

    return NextResponse.json(chatResponse, { status: 200 });
  } catch (error) {
    console.error('Chat query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        error: 'Failed to process your query',
        suggestion: 'Try asking about expenses, income, employees, attendance, or any financial data',
      } as ChatErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * Execute intelligent query based on primary table
 */
async function executeIntelligentQuery(
  table: string,
  entityMap: any,
  companyId: number,
  siteId: number | null
): Promise<any> {
  try {
    let where: any = { companyId };

    // Apply filters
    if (entityMap.filters.startDate) {
      where.date = { gte: new Date(entityMap.filters.startDate) };
    }
    if (entityMap.filters.endDate) {
      where.date = { ...where.date, lte: new Date(entityMap.filters.endDate) };
    }

    // Build query based on table type
    switch (table) {
      case 'Transaction':
        return await buildTransactionQuery(where, entityMap);
      case 'Employee':
        return await buildEmployeeQuery(where, entityMap);
      case 'Attendance':
        return await buildAttendanceQuery(where, entityMap);
      case 'Payroll':
        return await buildPayrollQuery(where, entityMap);
      case 'Account':
        return await buildAccountQuery(where, entityMap);
      case 'Category':
        return await buildCategoryQuery(where, entityMap);
      case 'Item':
        return await buildInventoryQuery(where, entityMap);
      default:
        return {
          success: false,
          data: null,
          message: 'Unable to determine query type',
        };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build intelligent transaction query
 */
async function buildTransactionQuery(where: any, entityMap: any): Promise<any> {
  try {
    const limit = entityMap.filters.limit || 10;
    let orderBy: any = { date: 'desc' };

    if (entityMap.aggregations.includes('ORDER_BY_DESC')) {
      orderBy = { amount: 'desc' };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy,
      take: limit,
    });

    if (entityMap.aggregations.includes('SUM')) {
      const total = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      return {
        success: true,
        data: transactions,
        message: `Total: ₹${total.toLocaleString('en-IN')}`,
        statistics: {
          total: total,
          count: transactions.length,
          average: transactions.length > 0 ? total / transactions.length : 0,
        },
      };
    }

    if (entityMap.aggregations.includes('COUNT')) {
      return {
        success: true,
        data: transactions,
        message: `Found ${transactions.length} transaction(s)`,
        statistics: { count: transactions.length },
      };
    }

    return {
      success: true,
      data: transactions,
      message: `Found ${transactions.length} transaction(s)`,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build intelligent employee query
 */
async function buildEmployeeQuery(where: any, entityMap: any): Promise<any> {
  try {
    const limit = entityMap.filters.limit || 10;

    const employees = await prisma.employee.findMany({
      where: { companyId: where.companyId },
      take: limit,
    });

    return {
      success: true,
      data: employees.map((e: any) => ({
        name: e.name,
        designation: e.etype,
        salary: e.salary,
        status: e.status,
      })),
      message: `Found ${employees.length} employee(s)`,
      statistics: {
        total: employees.length,
        active: employees.filter((e: any) => e.status === 'Active').length,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build attendance query
 */
async function buildAttendanceQuery(where: any, entityMap: any): Promise<any> {
  try {
    const attendances = await prisma.attendance.findMany({
      where: { companyId: where.companyId, ...where },
      include: { employee: true },
      take: entityMap.filters.limit || 20,
    });

    return {
      success: true,
      data: attendances.map((a: any) => ({
        employee: a.employee?.name,
        date: a.date,
        status: a.status > 0 ? 'Present' : 'Absent',
      })),
      message: `Found ${attendances.length} attendance record(s)`,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build payroll query
 */
async function buildPayrollQuery(where: any, entityMap: any): Promise<any> {
  try {
    const payrolls = await prisma.payroll.findMany({
      where: { companyId: where.companyId },
      include: { employee: true },
      orderBy: { amount: 'desc' },
      take: entityMap.filters.limit || 10,
    });

    const total = payrolls.reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      success: true,
      data: payrolls.map((p: any) => ({
        employee: p.employee?.name,
        amount: p.amount,
        period: `${p.fromDate} to ${p.toDate}`,
      })),
      message: `Total payroll: ₹${total.toLocaleString('en-IN')}`,
      statistics: {
        total,
        count: payrolls.length,
        average: payrolls.length > 0 ? total / payrolls.length : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build account query
 */
async function buildAccountQuery(where: any, entityMap: any): Promise<any> {
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId: where.companyId },
      take: entityMap.filters.limit || 10,
    });

    return {
      success: true,
      data: accounts.map((a: any) => ({
        name: a.name,
        type: a.type,
        budget: a.budget,
      })),
      message: `Found ${accounts.length} account(s)`,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build category query
 */
async function buildCategoryQuery(where: any, entityMap: any): Promise<any> {
  try {
    const categories = await prisma.category.findMany({
      where: { companyId: where.companyId },
    });

    return {
      success: true,
      data: categories.map((c: any) => ({
        name: c.name,
        description: c.description,
      })),
      message: `Found ${categories.length} categor(y/ies)`,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build inventory query
 */
async function buildInventoryQuery(where: any, entityMap: any): Promise<any> {
  try {
    const items = await prisma.item.findMany({
      where: { companyId: where.companyId },
      orderBy: { quantity: 'desc' },
      take: entityMap.filters.limit || 10,
    });

    return {
      success: true,
      data: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      message: `Found ${items.length} item(s)`,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * GET /api/chat-query/suggestions
 * Returns available quick actions/suggestions
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return comprehensive suggestions covering all question types
    const suggestions = [
      // Transactions
      {
        title: 'Recent Transactions',
        query: 'Show last 10 transactions',
        icon: '📊',
      },
      {
        title: 'Total Expenses',
        query: 'How much did I spend this month?',
        icon: '💸',
      },
      {
        title: 'Total Income',
        query: 'How much income did I get this month?',
        icon: '💵',
      },
      // Top & Rankings
      {
        title: 'Top Expenses',
        query: 'Show top 5 expenses',
        icon: '🔝',
      },
      {
        title: 'Top Income',
        query: 'Top 5 income transactions',
        icon: '📈',
      },
      // Employee & Payroll
      {
        title: 'Employee List',
        query: 'Show all employees',
        icon: '👥',
      },
      {
        title: 'Who Worked Most',
        query: 'Who worked most this month?',
        icon: '⏰',
      },
      {
        title: 'Salary Summary',
        query: 'Show salary summary',
        icon: '💰',
      },
      {
        title: 'Advance Salary',
        query: 'Who got more advance salary?',
        icon: '💳',
      },
      // Categories & Breakdown
      {
        title: 'Category Breakdown',
        query: 'Breakdown by category',
        icon: '📑',
      },
      // Financial Summary
      {
        title: 'Financial Summary',
        query: 'Show financial summary',
        icon: '📋',
      },
      {
        title: 'Comparison',
        query: 'Compare income vs expenses',
        icon: '⚖️',
      },
      // Time-based queries
      {
        title: 'This Week',
        query: 'Show transactions this week',
        icon: '📅',
      },
      {
        title: 'Last Month',
        query: 'Expenses last month',
        icon: '📆',
      },
    ];

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
