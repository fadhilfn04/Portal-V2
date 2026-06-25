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

  return (
    <div className="space-y-6">
      {/* Content will be added in next tasks */}
    </div>
  )
}
