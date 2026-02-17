'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import DeleteConfirmationModal from './DeleteConfirmationModal'

type Bookmark = Database['public']['Tables']['bookmarks']['Row']

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    bookmarkId: string | null
    bookmarkTitle: string | null
  }>({
    isOpen: false,
    bookmarkId: null,
    bookmarkTitle: null,
  })

  // Helper function to refetch bookmarks
  const refetchBookmarks = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    const { data, error: fetchError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching bookmarks:', fetchError)
    } else if (data) {
      setBookmarks(data)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Fetch initial bookmarks and set up realtime
    const setup = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('You must be logged in')
          setLoading(false)
          return
        }

        // Fetch initial bookmarks
        const { data, error: fetchError } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setBookmarks(data || [])
        }

        // Set up realtime subscription
        const channelName = `bookmarks-changes-${user.id}-${Date.now()}-${Math.random()}`
        
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, and DELETE
              schema: 'public',
              table: 'bookmarks',
            },
            async (payload) => {
              console.log('Realtime update received:', payload.eventType, payload)
              
              // For DELETE events, payload.old contains the deleted record
              const record = (payload.new || payload.old) as { user_id?: string } | null
              
              // With RLS enabled, we should only receive events for our own bookmarks
              const isOurBookmark = record && record.user_id === user.id
              
              if (isOurBookmark || payload.eventType === 'DELETE') {
                // For DELETE, we might not have complete record data, so always refetch
                // For INSERT/UPDATE, verify it's our bookmark
                console.log('Refetching bookmarks after realtime event:', payload.eventType)
                await refetchBookmarks()
              } else {
                console.log('Ignoring realtime event - not for current user')
              }
            }
          )
          .subscribe((status, err) => {
            console.log('Subscription status:', status, 'for channel:', channelName)
            if (err) {
              console.error('Subscription error:', err)
            }
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to realtime updates for user:', user.id)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Channel error - realtime may not be enabled in Supabase')
              console.error('Please check:')
              console.error('1. Realtime is enabled in Supabase Dashboard → Database → Replication')
              console.error('2. The bookmarks table is added to the supabase_realtime publication')
            } else if (status === 'TIMED_OUT') {
              console.error('❌ Subscription timed out - check your network connection')
            } else if (status === 'CLOSED') {
              console.warn('⚠️ Subscription closed')
            }
          })
      } catch (err) {
        setError('An error occurred while fetching bookmarks')
      } finally {
        setLoading(false)
      }
    }

    setup()

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      bookmarkId: id,
      bookmarkTitle: title,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.bookmarkId) return

    const id = deleteModal.bookmarkId

    // Close modal
    setDeleteModal({ isOpen: false, bookmarkId: null, bookmarkTitle: null })

    // Optimistically remove from UI
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))

    const supabase = createClient()
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)

    if (error) {
      // Revert optimistic update on error by refetching
      await refetchBookmarks()
      alert('Error deleting bookmark: ' + error.message)
    } else {
      // As a fallback, refetch after a short delay in case realtime doesn't work
      setTimeout(async () => {
        await refetchBookmarks()
      }, 500)
    }
    // Real-time update should handle the UI update, but refetch is a fallback
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, bookmarkId: null, bookmarkTitle: null })
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-xl border border-gray-100">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading your bookmarks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold">Error loading bookmarks</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-xl border border-gray-100">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
          <span className="text-4xl">📑</span>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">No bookmarks yet</h3>
        <p className="text-gray-600">Add your first bookmark above to get started! 🚀</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5">
            <span className="text-xl">⭐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your Bookmarks <span className="text-lg font-normal text-gray-500">({bookmarks.length})</span>
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-1">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group flex items-center justify-between rounded-xl bg-white p-5 shadow-md transition-all hover:shadow-xl border border-gray-100 hover:border-blue-200"
            >
              <div className="flex flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                  <span className="text-2xl">🔖</span>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {bookmark.title}
                  </a>
                  <p className="mt-1.5 text-sm text-gray-500 truncate">{bookmark.url}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>📅</span>
                    <span>{new Date(bookmark.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteClick(bookmark.id, bookmark.title)}
                className="ml-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border border-red-200 hover:border-red-300"
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        bookmarkTitle={deleteModal.bookmarkTitle || undefined}
      />
    </>
  )
}
