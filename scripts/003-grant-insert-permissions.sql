-- Grant INSERT permissions to the `authenticated` role for the `user_profiles` table
GRANT INSERT ON public.user_profiles TO authenticated;

-- Grant INSERT permissions to the `authenticated` role for the `user_watched_content` table
GRANT INSERT ON public.user_watched_content TO authenticated;

-- Grant INSERT permissions to the `authenticated` role for the `user_preferences` table
-- Note: user_preferences is now part of user_profiles, so this might not be strictly necessary
-- if user_profiles already has insert. Keeping it for completeness if a separate table existed.
-- GRANT INSERT ON public.user_preferences TO authenticated;

-- Grant SELECT permissions on `genres` and `languages` tables to `authenticated` role
-- This is crucial for onboarding and discover pages to fetch genre/language lists
GRANT SELECT ON public.genres TO authenticated;
GRANT SELECT ON public.languages TO authenticated;

-- Grant SELECT permissions on `movies_tv_shows` table to `authenticated` role
-- This is crucial for discover page and watched movies selection
GRANT SELECT ON public.movies_tv_shows TO authenticated;

-- Grant SELECT on the `genres` table to the `anon` role as well,
-- so unauthenticated users can still see genre names if needed (e.g., on public pages)
GRANT SELECT ON public.genres TO anon;
GRANT SELECT ON public.languages TO anon;
GRANT SELECT ON public.movies_tv_shows TO anon;
