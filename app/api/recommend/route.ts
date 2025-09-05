import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.VERCEL_URL || "http://localhost:3000";
const SITE_NAME = "YourSiteName";
const MODEL_ID = "meta-llama/llama-3.3-70b-instruct:free";

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Fetch genres & languages
    const [
      { data: allGenres, error: genresError },
      { data: allLanguages, error: languagesError },
    ] = await Promise.all([
      supabase.from("genres").select("id, name"),
      supabase.from("languages").select("id, name"),
    ]);
    if (genresError) throw genresError;
    if (languagesError) throw languagesError;

    const genreMap = new Map((allGenres ?? []).map((g) => [String(g.id), g.name]));
    const languageMap = new Map((allLanguages ?? []).map((l) => [String(l.id), l.name]));

    // 2. Fetch watched content (no nested ratings)
    const { data: watchedContent, error: watchedError } = await supabase
      .from("user_watched_content")
      .select(`
        movie_id,
        watched_at,
        movies_tv_shows (
          id,
          title,
          release_year,
          genre_ids,
          language_ids,
          type
        )
      `)
      .eq("user_id", userId)
      .order("watched_at", { ascending: false })
      .limit(10);
    if (watchedError) throw watchedError;

    // Get watched movie/show ids so we do not recommend these again
    const watchedIds = (watchedContent ?? [])
      .map((w) => w.movie_id)
      .filter(Boolean);

    // 3. Fetch ratings and preferences (separately)
    const [
      { data: userRatings, error: ratingsError },
      { data: userProfile, error: profileError },
    ] = await Promise.all([
      supabase.from("ratings").select("movie_id, rating_value").eq("user_id", userId),
      supabase.from("user_profiles").select("preferred_genres, preferred_languages").eq("user_id", userId).single(),
    ]);
    if (ratingsError) throw ratingsError;
    if (profileError) throw profileError;

    // 4. Query ALL movies/TV shows in your DB (these are the *only* available for recommendation)
    const { data: allContent, error: contentError } = await supabase
      .from("movies_tv_shows")
      .select("id, title, release_year, genre_ids, language_ids, type")
      .neq("title", null); // Only valid titles
    if (contentError) throw contentError;

    // 5. Build watched movies summary (manual join to ratings)
    const watchedMovies =
      watchedContent && watchedContent.length > 0
        ? watchedContent
            .map((wc) => {
              const m = wc.movies_tv_shows || {};
              const genres =
                Array.isArray(m.genre_ids) && m.genre_ids.length
                  ? m.genre_ids
                      .map((id: string) => genreMap.get(String(id)) || id)
                      .filter(Boolean)
                      .join(", ")
                  : "N/A";
              const languages =
                Array.isArray(m.language_ids) && m.language_ids.length
                  ? m.language_ids
                      .map((id: string) => languageMap.get(String(id)) || id)
                      .filter(Boolean)
                      .join(", ")
                  : "N/A";
              const rating =
                userRatings?.find((r) => r.movie_id === wc.movie_id)?.rating_value ??
                "Not Rated";
              return `- ${m.title ?? "Untitled"} (${m.release_year ?? "?"}), Genres: ${genres}, Languages: ${languages}, Your Rating: ${rating}`;
            })
            .join("\n")
        : "No content watched yet.";

    // 6. Pretty names for user preferences
    const preferredGenres =
      Array.isArray(userProfile?.preferred_genres) && userProfile.preferred_genres.length
        ? userProfile.preferred_genres
            .map((id: string) => genreMap.get(String(id)))
            .filter(Boolean)
            .join(", ")
        : "None specified";
    const preferredLanguages =
      Array.isArray(userProfile?.preferred_languages) && userProfile.preferred_languages.length
        ? userProfile.preferred_languages
            .map((id: string) => languageMap.get(String(id)))
            .filter(Boolean)
            .join(", ")
        : "None specified";

    // 7. Prepare the LLM candidate movie/show list (exclude watched)
    const recommendableContent = (allContent ?? [])
      .filter((c) => !watchedIds.includes(c.id))
      .map((m) => ({
        id: m.id,
        title: m.title,
        year: m.release_year,
        type: m.type,
        genres: Array.isArray(m.genre_ids)
          ? m.genre_ids.map((id: string) => genreMap.get(String(id))).filter(Boolean)
          : [],
        languages: Array.isArray(m.language_ids)
          ? m.language_ids.map((id: string) => languageMap.get(String(id))).filter(Boolean)
          : [],
      }));

    // Limit to first 50 items for prompt size, adjust as needed
    const recommendableTitles = recommendableContent
      .map((m) => `- ${m.title} (${m.year ?? "?"}, ${m.type}, Genres: ${m.genres.join(", ") || "N/A"}, Languages: ${m.languages.join(", ") || "N/A"})`)
      .slice(0, 50)
      .join("\n");

    // 8. Build AI prompt, enforce strict JSON array, only from the allowed titles
    const prompt = `
You are a movie and TV show recommendation AI.
Recommend exactly 5-7 movies or TV shows for the user, selecting ONLY from the following list of titles:

${recommendableTitles}

Base your choices on their preferred genres and languages:

Preferred Genres: ${preferredGenres}
Preferred Languages: ${preferredLanguages}

Their recently watched content:
${watchedMovies}

For each recommendation, respond as a JSON array of objects with fields: "title", "year", "type" ("movie" or "tv_show"), and a brief "reason". 
Do NOT recommend any movie or TV show not listed above.
Do NOT include any explanation or markdown, only the JSON array.
`;

    // PRINT DEBUG: See exactly what is sent to AI
    console.log("[RECOMMEND ROUTE] AI PROMPT SENT:\n--------------------\n" + prompt);

    // 9. Call OpenRouter (fetch, not SDK)
    let aiRaw = "";
    let recommendations: any[] = [];
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [{
            role: "user",
            content: prompt
          }],
          max_tokens: 1500,
          temperature: 0.8
        })
      });

      if (resp.status === 429) {
        // Rate limit!
        return NextResponse.json(
          { error: "Rate limit reached for OpenRouter. Please try again in 1 minute." },
          { status: 429 }
        );
      }
      aiRaw = await resp.text();
      // Parse OpenAI style response
      let aiJson: any;
      try {
        aiJson = JSON.parse(aiRaw);
        // For OpenRouter, the assistant reply is in: choices[0].message.content
        const responseText = aiJson.choices?.[0]?.message?.content || "";
        const start = responseText.indexOf("[");
        const end = responseText.lastIndexOf("]");
        if (start > -1 && end > start) {
          recommendations = JSON.parse(responseText.slice(start, end + 1));
        }
      } catch (e) {
        // fallback: try to parse the whole thing as JSON array if needed
        try {
          const start = aiRaw.indexOf("[");
          const end = aiRaw.lastIndexOf("]");
          if (start > -1 && end > start) {
            recommendations = JSON.parse(aiRaw.slice(start, end + 1));
          } else {
            recommendations = [];
          }
        } catch {
          recommendations = [];
        }
      }
    } catch (e) {
      console.error("Error fetching OpenRouter:", e);
      return NextResponse.json(
        { error: "AI provider error. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
