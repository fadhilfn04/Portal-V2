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

      {/* Table placeholder */}
      <div>{/* Table placeholder */}</div>
    </div>
  )
}
