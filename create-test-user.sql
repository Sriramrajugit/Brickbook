-- Insert test user without @ symbol for mobile testing
-- Password: test123 (bcrypt hashed)
INSERT INTO public."User" (email, password, name, role, "companyId", "createdAt", "updatedAt")
VALUES ('testuser', '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu', 'Test User', 'OWNER', 1, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

SELECT 'User created or already exists' as result;
