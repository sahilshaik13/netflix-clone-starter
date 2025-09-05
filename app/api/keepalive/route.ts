// app/api/keepalive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Ensure Node runtime for supabase-js + service role
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Read the raw Authorization header
  const raw = req.headers.get('authorization') ?? ''
  const expected = (process.env.CRON_SECRET ?? '').trim()

  // Strict, simple equality against the full header line
  if (raw.trim() !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Server-only Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  // Minimal “touch” query that still registers activity
  const { error } = await supabase
    .from('heartbeat')
    .select('id', { head: true, count: 'exact' })
    .limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
