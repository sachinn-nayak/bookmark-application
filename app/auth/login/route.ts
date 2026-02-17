import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  
  // Use NEXT_PUBLIC_SITE_URL, fallback to VERCEL_URL, then localhost
  const siteUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'
  
  const redirectTo = `${siteUrl}/auth/callback`
  
  // Debug: Log the redirect URL (remove in production if needed)
  console.log('OAuth redirectTo:', redirectTo)
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
  console.log('VERCEL_URL:', process.env.VERCEL_URL)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(data.url)
}
