# Smart Bookmark App

A simple bookmark manager built with Next.js, Supabase, and Tailwind CSS. Features Google OAuth authentication, real-time updates, and private bookmarks per user.

## Features

- Google OAuth authentication (no email/password required)
- Add bookmarks with URL and title
-  Private bookmarks (users can only see their own bookmarks)
-  Real-time updates (changes appear instantly across all tabs)
-  Delete bookmarks
-  Modern UI with Tailwind CSS

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Authentication, Database, Realtime)
- **Tailwind CSS** (Styling)
- **TypeScript**

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Google OAuth application (for Google sign-in)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bookmark-application
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/public key
3. Go to **Authentication** → **Providers** and enable **Google**
   - Add your Google OAuth Client ID and Client Secret
   - Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Also add your Vercel URL (once deployed): `https://your-app.vercel.app/auth/callback`

### 4. Set Up Database

1. In Supabase, go to **SQL Editor**
2. Run the migration file located at `supabase/migrations/001_create_bookmarks_table.sql`:

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env  
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production (Vercel), also set:
```env
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### 6. Run the Development Server

```bash
npm run dev
```

**Important**: After deployment, update your Supabase Google OAuth redirect URL to include your Vercel URL.

## Problems Encountered and Solutions

### 1. **HTTP 405 Error with Google OAuth**

**Problem**: When clicking "Sign in with Google", the browser showed an HTTP 405 error. The OAuth flow was failing because `signInWithOAuth` was being called from a server-side route handler, which doesn't handle redirects properly.

**Solution**: 
- Moved the OAuth sign-in logic to a client-side component (`LoginButton.tsx`)
- Used `signInWithOAuth` directly in the browser instead of through a server route
- This allows the browser to properly handle the redirect to Google's authorization page
- The redirect flow now works seamlessly without server-side complications

### 2. **Next.js 15+ searchParams Promise Issue**

**Problem**: Getting an error that `searchParams` is a Promise and must be unwrapped. In Next.js 15+, `searchParams` is now a Promise and requires `await` before accessing properties.

**Solution**:
- Changed the function signature from `searchParams: { error?: string }` to `searchParams: Promise<{ error?: string }>`
- Added `const params = await searchParams` before accessing properties
- Updated all references from `searchParams.error` to `params.error`

### 3. **Real-time Updates Not Working Across Tabs**

**Problem**: Real-time updates weren't triggering when bookmarks were added or deleted, especially across multiple browser tabs. DELETE events weren't being handled correctly.

**Solution**: 
- Ensured the `supabase_realtime` publication includes the `bookmarks` table in the migration
- Used `postgres_changes` event listener with `event: '*'` to catch all changes (INSERT, UPDATE, DELETE)
- Fixed DELETE event handling: DELETE events only have `payload.old` (no `payload.new`), so updated the handler to check both
- Implemented a refetch strategy in the realtime callback to ensure data consistency
- Added unique channel names per tab instance to avoid conflicts
- Made sure the channel subscription is properly cleaned up in the useEffect cleanup function
- Added fallback refetch mechanism after delete operations in case realtime doesn't trigger

### 4. **Middleware Redirect Loop**

**Problem**: Users were getting stuck in redirect loops when trying to access protected routes. The middleware was redirecting users even when they were on auth routes.

**Solution**:
- Added proper path exclusions in the middleware matcher for static assets and auth routes
- Ensured the middleware only redirects unauthenticated users, not those on `/login` or `/auth/*` routes
- Used `await cookies()` in Next.js 15+ for proper cookie handling
- Added checks to prevent redirecting users who are already on the login page

### 5. **Google OAuth Redirect URL Configuration**

**Problem**: OAuth callback wasn't working after deployment. The redirect URL was hardcoded or not properly configured for both development and production environments.

**Solution**:
- Added both localhost and production URLs to Supabase Google OAuth settings
- Used `NEXT_PUBLIC_SITE_URL` environment variable to dynamically set the redirect URL
- Ensured the callback route properly exchanges the code for a session using `exchangeCodeForSession`
- Added error handling in the callback route to redirect to login with error messages if something fails

### 6. **Row Level Security (RLS) Policies**

**Problem**: Users could see other users' bookmarks or couldn't insert/delete their own. The RLS policies weren't properly configured.

**Solution**:
- Created comprehensive RLS policies for SELECT, INSERT, and DELETE operations
- All policies check `auth.uid() = user_id` to ensure users can only access their own data
- Enabled RLS on the bookmarks table
- Tested policies thoroughly with multiple user accounts to verify isolation
- Used `with check` for INSERT policies and `using` for SELECT/DELETE policies

### 7. **TypeScript Type Safety for Database**

**Problem**: No type safety when working with Supabase queries. This led to potential runtime errors and made development slower.

**Solution**:
- Created a `database.types.ts` file with TypeScript interfaces for the bookmarks table
- Defined proper types for Row, Insert, and Update operations
- Used these types in components to ensure type safety
- This helps catch errors at compile time rather than runtime, improving developer experience

### 8. **URL Validation**

**Problem**: Users could add invalid URLs or URLs without protocols, leading to broken bookmarks.

**Solution**:
- Added URL validation in the `AddBookmarkForm` component
- Automatically prepends `https://` if no protocol is provided
- Validates the URL using the native `URL` constructor before submission
- Shows user-friendly error messages for invalid URLs


### 9. **Realtime Publication Already Exists Error**

**Problem**: Running the migration multiple times would fail because the table was already added to the `supabase_realtime` publication.

**Solution**:
- Updated the migration SQL to check if the table already exists in the publication before adding it
- Used a `DO $$` block with conditional logic to prevent errors on re-runs
- This makes the migration idempotent and safe to run multiple times

## License

MIT
