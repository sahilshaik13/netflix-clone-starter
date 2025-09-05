-- Grant USAGE on schema public to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on all tables in public schema to anon and authenticated roles
-- This is often needed in conjunction with RLS policies to ensure basic visibility
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant SELECT on all sequences in public schema (if any are used for IDs, etc.)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO public;

-- Grant EXECUTE on all functions in public schema (if any are used by anon/authenticated)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Optionally, if you have views, grant SELECT on them too
-- GRANT SELECT ON ALL VIEWS IN SCHEMA public TO anon, authenticated;
