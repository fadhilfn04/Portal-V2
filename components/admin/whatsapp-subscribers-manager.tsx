'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search, Filter, MoreVertical, Edit, Trash2, Power,
  UserPlus, Download, X, ChevronDown, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelative, formatDateTime } from '@/lib/utils/format-date'
import type { WhatsAppSubscriber, PaginatedResponse } from '@/lib/types'

interface SubscriberStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
}

interface FilterState {
  status: 'all' | 'active' | 'inactive'
  source: string | null
  dateFrom: string | null
  dateTo: string | null
  search: string
  sort: 'subscribed_at' | 'name'
}

export function WhatsAppSubscribersManager() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const perPage = 10

  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    source: null,
    dateFrom: null,
    dateTo: null,
    search: '',
    sort: 'subscribed_at',
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [editingSubscriber, setEditingSubscriber] = useState<WhatsAppSubscriber | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Build query params from filters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })

  if (filters.status !== 'all') queryParams.append('status', filters.status)
  if (filters.source) queryParams.append('source', filters.source)
  if (filters.search) queryParams.append('search', filters.search)
  if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom)
  if (filters.dateTo) queryParams.append('date_to', filters.dateTo)
  queryParams.append('sort', filters.sort)

  // Fetch subscribers
  const { data: subscribersData, isLoading } = useQuery<PaginatedResponse<WhatsAppSubscriber>>({
    queryKey: ['whatsapp-subscribers', page, filters],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp-subscribers?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch subscribers')
      return res.json()
    },
  })

  const subscribers = subscribersData?.data ?? []
  const total = subscribersData?.total ?? 0
  const totalPages = subscribersData?.total_pages ?? 1

  // Reset selected on page/filter change
  useEffect(() => {
    setSelectedIds([])
  }, [page, filters])

  // Individual toggle status
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/whatsapp-subscribers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !subscribers.find(s => s.id === id)?.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscribers'] })
      toast.success('Status berhasil diupdate')
    },
    onError: () => {
      toast.error('Gagal mengupdate status')
    },
  })

  // Individual delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/whatsapp-subscribers/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscribers'] })
      toast.success('Subscriber berhasil dihapus')
    },
    onError: () => {
      toast.error('Gagal menghapus subscriber')
    },
  })

  const handleToggleStatus = (subscriber: WhatsAppSubscriber) => {
    toggleMutation.mutate(subscriber.id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus subscriber ini?')) {
      deleteMutation.mutate(id)
    }
  }

  // Bulk actions
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { ids: string[]; action: 'activate' | 'deactivate' }) => {
      const res = await fetch('/api/whatsapp-subscribers/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to bulk update')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscribers'] })
      setSelectedIds([])
      toast.success(`${data.updated} subscriber${data.updated > 1 ? 's' : ''} berhasil diupdate`)
    },
    onError: () => {
      toast.error('Gagal melakukan bulk update')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/whatsapp-subscribers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed to bulk delete')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscribers'] })
      setSelectedIds([])
      toast.success(`${data.deleted} subscriber${data.deleted > 1 ? 's' : ''} berhasil dihapus`)
    },
    onError: () => {
      toast.error('Gagal menghapus subscribers')
    },
  })

  const handleBulkAction = (action: 'activate' | 'deactivate') => {
    bulkUpdateMutation.mutate({ ids: selectedIds, action })
  }

  const handleBulkDelete = () => {
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} subscriber?`)) {
      bulkDeleteMutation.mutate(selectedIds)
    }
  }

  const handleBulkExport = () => {
    const selected = subscribers.filter(s => selectedIds.includes(s.id))
    const csv = [
      ['Phone Number', 'Name', 'Status', 'Source', 'Subscribed Date'].join(','),
      ...selected.map(s => [
        s.phone_number,
        s.name || '',
        s.is_active ? 'Active' : 'Inactive',
        s.source || '',
        s.subscribed_at,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`${selected.length} subscriber${selected.length > 1 ? 's' : ''} di-export ke CSV`)
  }

  // Fetch stats
  const { data: stats } = useQuery<SubscriberStats>({
    queryKey: ['whatsapp-subscribers-stats'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp-subscribers/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-heading">WhatsApp Subscribers</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Kelola nomor WhatsApp yang berlangganan update</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          Add Subscriber
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', value: stats?.total ?? 0, color: 'bg-blue-50 text-blue-700', icon: 'users' },
          { label: 'Active', value: stats?.active ?? 0, color: 'bg-green-50 text-green-700', icon: 'check' },
          { label: 'Inactive', value: stats?.inactive ?? 0, color: 'bg-neutral-100 text-neutral-600', icon: 'x' },
          { label: 'New This Month', value: stats?.newThisMonth ?? 0, color: 'bg-purple-50 text-purple-700', icon: 'calendar' },
        ].map((stat) => (
          <div key={stat.label} className={cn('p-4 rounded-xl border border-neutral-150', stat.color)}>
            <p className="text-2xl font-extrabold font-heading leading-none mb-1">
              {stat.value.toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl border border-neutral-150 p-5 space-y-4">
        {/* Row 1 - Primary Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama atau nomor..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as FilterState['status'] })}
            className="h-10 px-3 text-sm rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Source Dropdown */}
          <select
            value={filters.source || ''}
            onChange={(e) => setFilters({ ...filters, source: e.target.value || null })}
            className="h-10 px-3 text-sm rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="">Semua Source</option>
            <option value="web">Web</option>
            <option value="manual">Manual</option>
            <option value="import">Import</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as 'subscribed_at' | 'name' })}
            className="h-10 px-3 text-sm rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="subscribed_at">Terbaru Subscribe</option>
            <option value="name">Nama A-Z</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={() => setFilters({
              status: 'all',
              source: null,
              dateFrom: null,
              dateTo: null,
              search: '',
              sort: 'subscribed_at',
            })}
            className="h-10 px-3 text-sm rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <X size={14} />
            Reset
          </button>

          {/* Toggle Advanced */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-10 px-3 text-sm rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <Filter size={14} />
            Advanced
            <ChevronDown size={14} className={cn('transition-transform', showAdvancedFilters && 'rotate-180')} />
          </button>
        </div>

        {/* Row 2 - Advanced Filters (Date Range) */}
        {showAdvancedFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Dari:</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
                className="h-9 px-3 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Sampai:</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
                className="h-9 px-3 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-900">
              {selectedIds.length} subscriber{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-brand-600 hover:text-brand-800 underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={bulkUpdateMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCircle2 size={16} />
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              disabled={bulkUpdateMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <XCircle size={16} />
              Deactivate
            </button>
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-white rounded-2xl border border-neutral-150 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150">
          <h2 className="text-sm font-semibold text-neutral-900">Daftar Subscribers</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-subscribers'] })}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-neutral-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" title="Export">
              <Download size={16} className="text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === subscribers.length && subscribers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(subscribers.map(s => s.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                    className="rounded border-neutral-300"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Subscriber
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Subscribed At
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-150">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                    No subscribers found
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(subscriber.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, subscriber.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== subscriber.id))
                          }
                        }}
                        className="rounded border-neutral-300"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{subscriber.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{subscriber.phone_number}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {subscriber.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg">
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-neutral-600 capitalize">{subscriber.source}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-neutral-600">
                        {formatRelative(new Date(subscriber.subscribed_at))}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {formatDateTime(new Date(subscriber.subscribed_at))}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(subscriber)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            subscriber.is_active
                              ? "hover:bg-red-50 text-red-600"
                              : "hover:bg-green-50 text-green-600"
                          )}
                          title={subscriber.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => setEditingSubscriber(subscriber)}
                          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(subscriber.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-150 bg-neutral-50">
          <p className="text-sm text-neutral-600">
            Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} subscribers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-neutral-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
