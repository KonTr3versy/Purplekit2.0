-- =============================================================================
-- PurpleKit PostgreSQL Initialization
-- =============================================================================
-- This script runs when the PostgreSQL container is first created.
-- It sets up extensions and creates the application database user.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create application user (if not using superuser)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'purplekit_app') THEN
--     CREATE ROLE purplekit_app WITH LOGIN PASSWORD 'app_password';
--   END IF;
-- END
-- $$;

-- Grant permissions
-- GRANT CONNECT ON DATABASE purplekit TO purplekit_app;
-- GRANT USAGE ON SCHEMA public TO purplekit_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO purplekit_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO purplekit_app;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'PurpleKit database initialized successfully';
END
$$;
