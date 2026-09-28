import { prisma } from './prisma';

export type AuditModule = 'LOGIN' | 'TRANSACTION' | 'CATEGORY' | 'EMPLOYEE' | 'BILL';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

export interface AuditInput {
  companyId: number;
  module: AuditModule;
  action: AuditAction;
  recordId?: number;
  userId: number;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Mask sensitive personal information (PII) in audit data
 */
function maskPII(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data) return undefined;

  const masked = { ...data };
  const sensitiveFields = ['password', 'email', 'phone', 'address', 'gstNumber', 'creditCard'];

  sensitiveFields.forEach((field) => {
    if (field in masked && masked[field]) {
      // For email: show first 2 chars and domain
      if (field === 'email') {
        const [localPart, domain] = (masked[field] as string).split('@');
        masked[field] = `${localPart?.substring(0, 2)}***@${domain}`;
      }
      // For phone: show last 4 digits
      else if (field === 'phone') {
        masked[field] = `***-***-${(masked[field] as string).slice(-4)}`;
      }
      // For other sensitive fields: mask completely
      else {
        masked[field] = '***MASKED***';
      }
    }
  });

  return masked;
}

/**
 * Generate a human-readable description for the audit entry
 */
function generateDescription(
  module: AuditModule,
  action: AuditAction,
  beforeData?: Record<string, any>,
  afterData?: Record<string, any>
): string {
  switch (action) {
    case 'CREATE':
      return `Created new ${module.toLowerCase()}`;

    case 'UPDATE': {
      const changes: string[] = [];
      if (beforeData && afterData) {
        Object.keys(afterData).forEach((key) => {
          if (beforeData[key] !== afterData[key]) {
            changes.push(`${key}: ${beforeData[key]} → ${afterData[key]}`);
          }
        });
      }
      return `Updated ${module.toLowerCase()}${changes.length > 0 ? `: ${changes.slice(0, 3).join(', ')}` : ''}`;
    }

    case 'DELETE':
      return `Deleted ${module.toLowerCase()}`;

    case 'LOGIN':
      return 'User logged in';

    case 'LOGOUT':
      return 'User logged out';

    default:
      return `${action} ${module.toLowerCase()}`;
  }
}

/**
 * Create an audit log entry
 */
export async function createAudit(input: AuditInput): Promise<any> {
  try {
    const {
      companyId,
      module,
      action,
      recordId,
      userId,
      beforeData,
      afterData,
      description,
      ipAddress,
      userAgent,
    } = input;

    // Mask sensitive data
    const maskedBefore = maskPII(beforeData);
    const maskedAfter = maskPII(afterData);

    // Generate description if not provided
    const finalDescription =
      description ||
      generateDescription(module, action, maskedBefore, maskedAfter);

    const audit = await prisma.audit.create({
      data: {
        companyId,
        module,
        action,
        recordId,
        userId,
        beforeData: maskedBefore || null,
        afterData: maskedAfter || null,
        description: finalDescription,
        ipAddress,
        userAgent,
      },
    });

    return audit;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit failures shouldn't break the main operation
    return null;
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function getClientIP(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-client-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  );
}

/**
 * Helper to extract user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}

/**
 * Clean old audit logs based on company's retention policy
 */
export async function cleanupOldAuditLogs(
  companyId: number,
  retentionDays?: number
): Promise<number> {
  try {
    // Get company's retention setting if not provided
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { auditRetentionDays: true },
    });

    const days = retentionDays || company?.auditRetentionDays || 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.audit.deleteMany({
      where: {
        companyId,
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    return 0;
  }
}
