import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddBookmarkForm from './components/AddBookmarkForm'
import BookmarkList from './components/BookmarkList'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📚 Smart Bookmark App
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back, <span className="font-semibold text-gray-900">{user.email || user.user_metadata?.full_name || 'User'}</span>!
              </p>
            </div>
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-gray-800 hover:to-gray-900 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <AddBookmarkForm />
        <BookmarkList />
      </div>
    </div>
  )
}
