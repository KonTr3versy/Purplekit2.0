-- =============================================================================
-- PurpleKit Row-Level Security (RLS) Policies
-- =============================================================================
-- These policies enforce multi-tenant data isolation at the database level.
-- 
-- HOW IT WORKS:
-- 1. Application sets current org context: SET app.current_org_id = 'uuid';
-- 2. PostgreSQL automatically filters all queries by org_id
-- 3. Even if application has a bug, data cannot leak between tenants
--
-- USAGE:
-- Run this AFTER running Prisma migrations: npx prisma migrate dev
-- Then run: psql $DATABASE_URL -f rls-policies.sql
-- =============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE technique_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE defensive_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION: Get current organization ID from session context
-- =============================================================================
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_org_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USERS
-- Users can only see other users in their organization
-- =============================================================================
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- SESSIONS
-- Users can only see their own sessions
-- =============================================================================
DROP POLICY IF EXISTS sessions_tenant_isolation ON sessions;
CREATE POLICY sessions_tenant_isolation ON sessions
  FOR ALL
  USING (
    user_id IN (SELECT id FROM users WHERE org_id = current_org_id())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE org_id = current_org_id())
  );

-- =============================================================================
-- ENGAGEMENTS
-- =============================================================================
DROP POLICY IF EXISTS engagements_tenant_isolation ON engagements;
CREATE POLICY engagements_tenant_isolation ON engagements
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- ENGAGEMENT TECHNIQUES
-- =============================================================================
DROP POLICY IF EXISTS engagement_techniques_tenant_isolation ON engagement_techniques;
CREATE POLICY engagement_techniques_tenant_isolation ON engagement_techniques
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- TECHNIQUE DEPENDENCIES
-- =============================================================================
DROP POLICY IF EXISTS technique_dependencies_tenant_isolation ON technique_dependencies;
CREATE POLICY technique_dependencies_tenant_isolation ON technique_dependencies
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- ACTIONS
-- =============================================================================
DROP POLICY IF EXISTS actions_tenant_isolation ON actions;
CREATE POLICY actions_tenant_isolation ON actions
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- DETECTION VALIDATIONS
-- =============================================================================
DROP POLICY IF EXISTS detection_validations_tenant_isolation ON detection_validations;
CREATE POLICY detection_validations_tenant_isolation ON detection_validations
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- TIMING METRICS
-- =============================================================================
DROP POLICY IF EXISTS timing_metrics_tenant_isolation ON timing_metrics;
CREATE POLICY timing_metrics_tenant_isolation ON timing_metrics
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- DEFENSIVE TOOLS
-- =============================================================================
DROP POLICY IF EXISTS defensive_tools_tenant_isolation ON defensive_tools;
CREATE POLICY defensive_tools_tenant_isolation ON defensive_tools
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- FINDINGS
-- =============================================================================
DROP POLICY IF EXISTS findings_tenant_isolation ON findings;
CREATE POLICY findings_tenant_isolation ON findings
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- REPORT JOBS
-- =============================================================================
DROP POLICY IF EXISTS report_jobs_tenant_isolation ON report_jobs;
CREATE POLICY report_jobs_tenant_isolation ON report_jobs
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- AUDIT LOGS
-- Read-only for most users, only admins should query
-- =============================================================================
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- PRODUCT EVENTS
-- =============================================================================
DROP POLICY IF EXISTS product_events_tenant_isolation ON product_events;
CREATE POLICY product_events_tenant_isolation ON product_events
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- API KEYS
-- =============================================================================
DROP POLICY IF EXISTS api_keys_tenant_isolation ON api_keys;
CREATE POLICY api_keys_tenant_isolation ON api_keys
  FOR ALL
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =============================================================================
-- FEATURE FLAGS
-- Global flags (org_id IS NULL) are visible to all
-- Org-specific flags only visible to that org
-- =============================================================================
DROP POLICY IF EXISTS feature_flags_tenant_isolation ON feature_flags;
CREATE POLICY feature_flags_tenant_isolation ON feature_flags
  FOR SELECT
  USING (org_id IS NULL OR org_id = current_org_id());

DROP POLICY IF EXISTS feature_flags_tenant_write ON feature_flags;
CREATE POLICY feature_flags_tenant_write ON feature_flags
  FOR INSERT
  WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS feature_flags_tenant_update ON feature_flags;
CREATE POLICY feature_flags_tenant_update ON feature_flags
  FOR UPDATE
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS feature_flags_tenant_delete ON feature_flags;
CREATE POLICY feature_flags_tenant_delete ON feature_flags
  FOR DELETE
  USING (org_id = current_org_id());

-- =============================================================================
-- BYPASS POLICY FOR SERVICE ROLE
-- Create a role that bypasses RLS for admin operations, migrations, etc.
-- =============================================================================
-- CREATE ROLE purplekit_service NOINHERIT;
-- ALTER TABLE users FORCE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
-- GRANT purplekit_service TO your_migration_user;

-- =============================================================================
-- ORGANIZATIONS TABLE
-- No RLS - accessed via join from authenticated user context
-- =============================================================================
-- Organizations table does NOT have RLS enabled
-- Access is controlled by the application layer checking user membership

-- =============================================================================
-- ATTACK_TECHNIQUES TABLE  
-- No RLS - this is reference data shared across all tenants
-- =============================================================================
-- attack_techniques table does NOT have RLS enabled
-- It contains MITRE ATT&CK reference data, not tenant-specific data

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these to verify RLS is working correctly
-- =============================================================================
/*
-- Test 1: Set org context and query
SET app.current_org_id = 'your-org-uuid-here';
SELECT * FROM engagements;  -- Should only show engagements for that org

-- Test 2: Clear context and query (should return nothing)
SET app.current_org_id = '';
SELECT * FROM engagements;  -- Should return 0 rows

-- Test 3: Try to insert with wrong org_id (should fail)
SET app.current_org_id = 'org-a-uuid';
INSERT INTO engagements (org_id, name, ...) VALUES ('org-b-uuid', 'test', ...);
-- Should fail with RLS policy violation

-- Test 4: Check which policies are enabled
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
*/
