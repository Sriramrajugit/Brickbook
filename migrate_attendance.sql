-- Migrate existing attendance string values to numeric multipliers
UPDATE "public"."attendances" 
SET status = 1 WHERE status::text = 'Present';

UPDATE "public"."attendances" 
SET status = 1.5 WHERE status::text = 'OT4Hrs';

UPDATE "public"."attendances" 
SET status = 2 WHERE status::text = 'OT8Hrs';

UPDATE "public"."attendances" 
SET status = 0 WHERE status::text = 'Absent';

UPDATE "public"."attendances" 
SET status = 0 WHERE status::text = 'Half Day';

-- Verify the migration
SELECT COUNT(*) as total_records FROM "public"."attendances";
