import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  try {
    // Fetch all data
    const companies = await prisma.company.findMany();
    const users = await prisma.user.findMany();
    const accounts = await prisma.account.findMany();
    const categories = await prisma.category.findMany();

    let sql = '-- Exported data from local database\n\n';

    // Companies
    sql += '-- COMPANIES\n';
    for (const company of companies) {
      sql += `INSERT INTO "companies" ("id", "name", "createdAt", "updatedAt") VALUES (${company.id}, '${company.name.replace(/'/g, "''")}', '${company.createdAt.toISOString()}', '${company.updatedAt.toISOString()}') ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';

    // Users
    sql += '-- USERS\n';
    for (const user of users) {
      sql += `INSERT INTO "users" ("id", "email", "name", "password", "role", "companyId", "siteId", "createdAt", "updatedAt", "logoutTime") VALUES (${user.id}, ${user.email ? `'${user.email.replace(/'/g, "''")}'` : 'NULL'}, ${user.name ? `'${user.name.replace(/'/g, "''")}'` : 'NULL'}, ${user.password ? `'${user.password.replace(/'/g, "''")}'` : 'NULL'}, '${user.role}', ${user.companyId}, ${user.siteId || 'NULL'}, '${user.createdAt.toISOString()}', '${user.updatedAt.toISOString()}', ${user.logoutTime ? `'${user.logoutTime.toISOString()}'` : 'NULL'}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';

    // Accounts
    sql += '-- ACCOUNTS\n';
    for (const account of accounts) {
      sql += `INSERT INTO "accounts" ("id", "name", "type", "budget", "startDate", "endDate", "companyId", "siteId", "createdAt", "updatedAt") VALUES (${account.id}, '${account.name.replace(/'/g, "''")}', '${account.type}', ${account.budget}, ${account.startDate ? `'${account.startDate.toISOString()}'` : 'NULL'}, ${account.endDate ? `'${account.endDate.toISOString()}'` : 'NULL'}, ${account.companyId}, ${account.siteId || 'NULL'}, '${account.createdAt.toISOString()}', '${account.updatedAt.toISOString()}') ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';

    // Categories
    sql += '-- CATEGORIES\n';
    for (const category of categories) {
      sql += `INSERT INTO "categories" ("id", "name", "description", "companyId", "createdAt", "updatedAt") VALUES (${category.id}, '${category.name.replace(/'/g, "''")}', ${category.description ? `'${category.description.replace(/'/g, "''")}'` : 'NULL'}, ${category.companyId}, '${category.createdAt.toISOString()}', '${category.updatedAt.toISOString()}') ON CONFLICT ("name", "companyId") DO NOTHING;\n`;
    }

    // Write to file
    fs.writeFileSync('export-data.sql', sql);
    console.log('✅ Data exported to export-data.sql');
    console.log('\nCopy the content and run it in Railway SQL editor');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
