'use client'

import { X } from 'lucide-react'

interface RejectionReasonModalProps {
  isOpen: boolean
  onClose: () => void
  reason: string | null
  articleTitle: string
}

export function RejectionReasonModal({
  isOpen,
  onClose,
  reason,
  articleTitle
}: RejectionReasonModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 font-heading">
              Alasan Penolakan
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
              {articleTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="shrink-0 mt-0.5 text-red-500">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5zm-.75 6a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 mb-1">Artikel ditolak oleh Pusat</p>
              <p className="text-sm text-red-700 leading-relaxed">
                {reason || 'Tidak ada alasan yang diberikan.'}
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-4">
            Perbaiki artikel sesuai feedback di atas dan ajukan kembali untuk persetujuan.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
