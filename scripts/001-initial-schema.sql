-- Ensure basic permissions for authenticated users on the public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Also grant insert on user_profiles for initial creation
GRANT INSERT ON public.user_profiles TO authenticated;

-- Create the languages table
CREATE TABLE public.languages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Create the genres table
CREATE TABLE public.genres (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Create the OTT platforms table
CREATE TABLE public.ott_platforms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Create the movies_tv_shows table
CREATE TABLE public.movies_tv_shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    release_year INT,
    overview TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('Movie', 'TV Show')),
    runtime_minutes INT,
    imdb_id TEXT UNIQUE,
    tmdb_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Change these to INT[] to match genres.id and languages.id
    genre_ids INT[] DEFAULT '{}'::INT[],
    language_ids INT[] DEFAULT '{}'::INT[]
);

-- Create junction table for movies and genres (many-to-many)
CREATE TABLE public.movie_genres (
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    genre_id INT REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- Create junction table for movies and languages (many-to-many)
CREATE TABLE public.movie_languages (
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    language_id INT REFERENCES public.languages(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, language_id)
);

-- Create junction table for movies and OTT platforms (many-to-many)
CREATE TABLE public.movie_ott_platforms (
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    ott_platform_id INT REFERENCES public.ott_platforms(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, ott_platform_id)
);

-- Create the user_profiles table
CREATE TABLE public.user_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    preferred_genres INT[], -- Array of genre IDs
    preferred_languages INT[], -- Array of language IDs
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select their own profile
CREATE POLICY "Users can view their own profile."
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert their own profile (during sign-up)
CREATE POLICY "Users can insert their own profile."
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile."
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);
WITH CHECK (auth.uid() = user_id);


-- Create the user_watched_content table
CREATE TABLE public.user_watched_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, movie_id) -- Ensure a user can only mark a movie as watched once
);

-- Enable Row Level Security for user_watched_content
ALTER TABLE public.user_watched_content ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select their own watched content
CREATE POLICY "Users can view their own watched content."
ON public.user_watched_content FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert their own watched content
CREATE POLICY "Users can insert their own watched content."
ON public.user_watched_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to delete their own watched content
CREATE POLICY "Users can delete their own watched content."
ON public.user_watched_content FOR DELETE
USING (auth.uid() = user_id);


-- Create the ratings table
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    rating_value INT NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, movie_id) -- Ensure a user can only rate a movie once
);

-- Enable Row Level Security for ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select their own ratings
CREATE POLICY "Users can view their own ratings."
ON public.ratings FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert their own ratings
CREATE POLICY "Users can insert their own ratings."
ON public.ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own ratings
CREATE POLICY "Users can update their own ratings."
ON public.ratings FOR UPDATE
USING (auth.uid() = user_id);
WITH CHECK (auth.uid() = user_id);


-- Create the reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, movie_id) -- Ensure a user can only review a movie once
);

-- Enable Row Level Security for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select their own reviews
CREATE POLICY "Users can view their own reviews."
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert their own reviews
CREATE POLICY "Users can insert their own reviews."
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own reviews
CREATE POLICY "Users can update their own reviews."
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);
WITH CHECK (auth.uid() = user_id);


-- Create the user_watchlists table
CREATE TABLE public.user_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies_tv_shows(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, movie_id) -- Ensure a movie can only be on a user's watchlist once
);

-- Enable Row Level Security for user_watchlists
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select their own watchlist items
CREATE POLICY "Users can view their own watchlist."
ON public.user_watchlists FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert into their own watchlist
CREATE POLICY "Users can insert into their own watchlist."
ON public.user_watchlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to delete from their own watchlist
CREATE POLICY "Users can delete from their own watchlist."
ON public.user_watchlists FOR DELETE
USING (auth.uid() = user_id);
