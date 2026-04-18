-- Setup initial data for Railway

-- Insert company
INSERT INTO "companies" ("id", "name", "createdAt", "updatedAt") 
VALUES (1, 'Default Company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert owner user (password: admin, bcrypt hash)
INSERT INTO "users" ("id", "email", "name", "password", "role", "companyId", "createdAt", "updatedAt")
VALUES (1, 'owner@uliixa.com', 'Owner', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG', 'OWNER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET password='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG';

-- Insert accounts
INSERT INTO "accounts" ("name", "type", "budget", "companyId", "createdAt", "updatedAt")
VALUES ('Main Account', 'General', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "accounts" ("name", "type", "budget", "companyId", "createdAt", "updatedAt")
VALUES ('Petty Cash', 'General', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert categories
INSERT INTO "categories" ("name", "description", "companyId", "createdAt", "updatedAt")
VALUES ('Capital', 'Initial investment/capital', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "companyId") DO NOTHING;

INSERT INTO "categories" ("name", "description", "companyId", "createdAt", "updatedAt")
VALUES ('Salary', 'Employee salary payments', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "companyId") DO NOTHING;

INSERT INTO "categories" ("name", "description", "companyId", "createdAt", "updatedAt")
VALUES ('Salary Advance', 'Salary advance to employees', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "companyId") DO NOTHING;

INSERT INTO "categories" ("name", "description", "companyId", "createdAt", "updatedAt")
VALUES ('Rent', 'Rent and lease payments', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "companyId") DO NOTHING;

INSERT INTO "categories" ("name", "description", "companyId", "createdAt", "updatedAt")
VALUES ('Utilities', 'Electricity, water, internet', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "companyId") DO NOTHING;

INSERT INTO "categories" ("name", "description", "companyId", "createdAt", "updatedAt")
VALUES ('Other', 'Miscellaneous expenses', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "companyId") DO NOTHING;
