'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'

interface PendingAdmin {
  id: string
  full_name: string | null
  email: string
  registered_at: string
}

export default function PendingAdminsPage() {
  const router = useRouter()
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingAdmins()
  }, [])

  const fetchPendingAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admin-registrations')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data')
      }

      setPendingAdmins(data.data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, name: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/admin-registrations/${id}/approve`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyetujui admin')
      }

      toast.success(data.message || 'Admin berhasil disetujui')
      // Small delay to ensure DB update has propagated
      await new Promise(resolve => setTimeout(resolve, 100))
      await fetchPendingAdmins() // Refresh list
      router.refresh() // Force Next.js revalidation
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyetujui admin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Tolak pendaftaran ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/admin-registrations/${id}/reject`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menolak admin')
      }

      toast.success(data.message || 'Pendaftaran berhasil ditolak')
      await fetchPendingAdmins() // Refresh list
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menolak admin')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Users size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-heading">Admin Baru</h1>
          <p className="text-sm text-neutral-500">
            {pendingAdmins.length} pendaftaran menunggu persetujuan
          </p>
        </div>
      </div>

      {/* Content */}
      {pendingAdmins.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h3 className="text-base font-semibold text-neutral-700 mb-1">Semua beres!</h3>
          <p className="text-sm text-neutral-400">Tidak ada pendaftaran admin yang perlu ditinjau saat ini.</p>
        </div>
      ) : (
        // Pending admins list
        <div className="space-y-4">
          {pendingAdmins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Admin info */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar with initials */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-base">
                    {admin.full_name
                      ? admin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : admin.email.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">
                      {admin.full_name || 'Tanpa Nama'}
                    </h3>
                    <p className="text-sm text-neutral-500">{admin.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-400">
                      <Clock size={12} />
                      <span>Terdaftar {formatDate(admin.registered_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(admin.id, admin.full_name || admin.email)}
                    disabled={actionLoading === admin.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === admin.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    Setujui
                  </button>
                  <button
                    onClick={() => handleReject(admin.id, admin.full_name || admin.email)}
                    disabled={actionLoading === admin.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === admin.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <XCircle size={12} />
                    )}
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
