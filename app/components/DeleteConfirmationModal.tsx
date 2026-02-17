'use client'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  bookmarkTitle?: string
}

export default function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  bookmarkTitle,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            Delete Bookmark
          </h3>
        </div>
        <p className="mb-8 text-gray-600 leading-relaxed">
          Are you sure you want to delete this bookmark
          {bookmarkTitle && (
            <span className="font-semibold text-gray-900"> "{bookmarkTitle}"</span>
          )}
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}
