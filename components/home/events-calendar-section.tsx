'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, Star } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek,
  addMonths, subMonths,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { ArticleListItem } from '@/lib/types'

// Only articles with event_date set are used here
type CalendarArticle = Pick<
  ArticleListItem,
  | 'id' | 'title' | 'slug' | 'is_featured'
  | 'category_name' | 'category_color'
  | 'event_date' | 'event_end_date' | 'event_time' | 'event_end_time' | 'event_location'
>

interface EventsCalendarSectionProps {
  initialEvents?: CalendarArticle[]
}

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function EventsCalendarSection({ initialEvents = [] }: EventsCalendarSectionProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarArticle[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [isFirstMount, setIsFirstMount] = useState(true)

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/events?year=${date.getFullYear()}&month=${date.getMonth() + 1}`,
      )
      const json = await res.json()
      setEvents(json.data ?? [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Skip the very first fetch if we have server-provided initial data
    if (isFirstMount && initialEvents.length > 0) {
      setIsFirstMount(false)
      return
    }
    setIsFirstMount(false)
    setSelectedDate(null)
    fetchEvents(currentMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarArticle[]>()
    for (const ev of events) {
      if (!ev.event_date) continue
      const k = ev.event_date
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(ev)
    }
    return map
  }, [events])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return eventsByDate.get(format(selectedDate, 'yyyy-MM-dd')) ?? []
  }, [selectedDate, eventsByDate])

  function handleDayClick(day: Date) {
    if (!isSameMonth(day, currentMonth)) return
    setSelectedDate(prev => (prev && isSameDay(prev, day) ? null : day))
  }

  return (
    <section className="py-10 lg:py-14 bg-neutral-50 border-y border-neutral-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10">
              <CalendarDays size={20} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Agenda</p>
              <h2 className="text-2xl font-extrabold text-neutral-900 font-heading leading-none mt-0.5">
                Kalender Kegiatan
              </h2>
            </div>
          </div>
          {events.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-xs font-semibold text-brand-600">
              <CalendarDays size={12} />
              {events.length} kegiatan bulan ini
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
          {/* ── Calendar Card ────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-neutral-150 shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <button
                onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 transition-colors disabled:opacity-40"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>

              <AnimatePresence mode="wait">
                <motion.h3
                  key={format(currentMonth, 'yyyy-MM')}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="text-base font-bold text-neutral-900 font-heading capitalize select-none"
                >
                  {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
                </motion.h3>
              </AnimatePresence>

              <button
                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 transition-colors disabled:opacity-40"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-4 pt-3 pb-1 gap-1">
              {WEEKDAYS.map(d => (
                <div
                  key={d}
                  className="text-center text-[11px] font-bold text-neutral-400 uppercase tracking-wide py-1 select-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={format(currentMonth, 'yyyy-MM')}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="grid grid-cols-7 gap-1 px-4 pb-5"
              >
                {calendarDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDate.get(dateKey) ?? []
                  const inMonth = isSameMonth(day, currentMonth)
                  const isSelected = !!selectedDate && isSameDay(day, selectedDate)
                  const isCurrentDay = isToday(day)
                  const hasEvents = dayEvents.length > 0 && inMonth

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleDayClick(day)}
                      disabled={!inMonth}
                      className={cn(
                        'group relative flex flex-col items-center rounded-xl py-2 px-1 min-h-[58px] transition-all duration-150 select-none',
                        !inMonth && 'opacity-20 pointer-events-none',
                        inMonth && !isSelected && 'cursor-pointer hover:bg-neutral-50',
                        isSelected && 'bg-brand-600 shadow-md scale-[1.04]',
                        isCurrentDay && !isSelected && 'ring-2 ring-accent-300 ring-offset-1',
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-semibold leading-none',
                          isSelected
                            ? 'text-white'
                            : isCurrentDay
                              ? 'text-accent-600 font-extrabold'
                              : inMonth
                                ? 'text-neutral-800'
                                : 'text-neutral-300',
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                      {hasEvents && (
                        <div className="mt-1.5 flex flex-wrap justify-center gap-0.5 max-w-[40px]">
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <span
                              key={i}
                              className="block w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125"
                              style={{
                                backgroundColor: isSelected
                                  ? 'rgba(255,255,255,0.75)'
                                  : (ev.category_color ?? '#1a3c6e'),
                              }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span
                              className={cn(
                                'text-[9px] font-bold leading-none',
                                isSelected ? 'text-white/70' : 'text-neutral-400',
                              )}
                            >
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="px-5 pb-4 pt-1 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <LegendItem
                  indicator={
                    <span className="w-4 h-4 rounded-md bg-brand-600 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">✓</span>
                    </span>
                  }
                  label="Dipilih"
                />
                <LegendItem
                  indicator={
                    <span className="w-4 h-4 rounded-md ring-2 ring-accent-300 ring-offset-1 bg-white" />
                  }
                  label="Hari ini"
                />
                <LegendItem
                  indicator={<span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                  label="Ada kegiatan"
                />
              </div>
              {loading && (
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <div className="w-3.5 h-3.5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                  Memuat...
                </div>
              )}
            </div>
          </div>

          {/* ── Events Panel ─────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key={`sel-${format(selectedDate, 'yyyy-MM-dd')}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-white rounded-2xl border border-neutral-150 shadow-sm overflow-hidden"
                >
                  {/* Date header */}
                  <div className="px-5 pt-5 pb-4 border-b border-neutral-100 bg-gradient-to-br from-brand-50 to-transparent">
                    <p className="text-xs font-bold text-brand-600 uppercase tracking-wider capitalize">
                      {format(selectedDate, 'EEEE', { locale: idLocale })}
                    </p>
                    <p className="text-xl font-extrabold text-neutral-900 font-heading leading-tight mt-0.5">
                      {format(selectedDate, 'd MMMM yyyy', { locale: idLocale })}
                    </p>
                    {selectedEvents.length > 0 && (
                      <p className="text-xs text-neutral-400 mt-1.5">
                        {selectedEvents.length} kegiatan terjadwal
                      </p>
                    )}
                  </div>

                  {selectedEvents.length === 0 ? (
                    <div className="flex flex-col items-center py-12 px-5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 mb-3">
                        <CalendarDays size={24} className="text-neutral-300" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-600 mb-1">
                        Tidak ada kegiatan
                      </p>
                      <p className="text-xs text-neutral-400 leading-relaxed max-w-[200px]">
                        Tidak ada kegiatan terjadwal pada tanggal ini.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 max-h-[480px] overflow-y-auto">
                      {selectedEvents.map((ev, i) => (
                        <EventCard key={ev.id} event={ev} index={i} />
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white rounded-2xl border border-neutral-150 shadow-sm overflow-hidden"
                >
                  {/* Hint */}
                  <div className="px-5 py-8 text-center border-b border-neutral-100">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 mx-auto mb-4">
                      <CalendarDays size={28} className="text-brand-500" />
                    </div>
                    <p className="text-sm font-bold text-neutral-700 mb-1">Pilih Tanggal</p>
                    <p className="text-xs text-neutral-400 leading-relaxed max-w-[200px] mx-auto">
                      Klik tanggal pada kalender untuk melihat kegiatan yang terjadwal.
                    </p>
                  </div>

                  {/* All events list */}
                  {loading ? (
                    <div className="p-5 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="skeleton h-3 w-3/4 rounded" />
                            <div className="skeleton h-2.5 w-1/2 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : events.length > 0 ? (
                    <>
                      <div className="px-5 pt-4 pb-2">
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          Semua Kegiatan Bulan Ini
                        </p>
                      </div>
                      <div className="divide-y divide-neutral-100 max-h-[360px] overflow-y-auto">
                        {events.map(ev => (
                          <button
                            key={ev.id}
                            onClick={() => ev.event_date && setSelectedDate(parseDateOnly(ev.event_date))}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors text-left group"
                          >
                            <div
                              className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-extrabold font-heading"
                              style={{ backgroundColor: ev.category_color ?? '#1a3c6e' }}
                            >
                              {ev.event_date
                                ? format(parseDateOnly(ev.event_date), 'd')
                                : '—'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-neutral-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
                                {ev.title}
                              </p>
                              <p className="text-[11px] text-neutral-400 mt-0.5 capitalize">
                                {ev.event_date
                                  ? format(parseDateOnly(ev.event_date), 'EEEE, d MMM', {
                                      locale: idLocale,
                                    })
                                  : ''}
                                {ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
                              </p>
                            </div>
                            {ev.is_featured && (
                              <Star size={12} className="shrink-0 text-warning-500 fill-warning-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-xs text-neutral-400">
                        Belum ada kegiatan terjadwal bulan ini.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Sub-components ─────────────────────────────────────────

function LegendItem({ indicator, label }: { indicator: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
      {indicator}
      {label}
    </span>
  )
}

function EventCard({ event, index }: { event: CalendarArticle; index: number }) {
  const color = event.category_color ?? '#1a3c6e'

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
    >
      <Link
        href={`/artikel/${event.slug}`}
        className="flex gap-3 p-5 hover:bg-neutral-50 transition-colors group"
      >
        {/* Color bar */}
        <div
          className="shrink-0 w-1 rounded-full self-stretch min-h-[32px]"
          style={{ backgroundColor: color }}
        />

        <div className="flex-1 min-w-0">
          {/* Category + featured */}
          <div className="flex items-center gap-2 mb-1.5">
            {event.category_name && (
              <span
                className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                style={{ backgroundColor: color + '20', color }}
              >
                {event.category_name}
              </span>
            )}
            {event.is_featured && (
              <Star size={11} className="text-warning-500 fill-warning-500" />
            )}
          </div>

          <h4 className="text-sm font-bold text-neutral-900 group-hover:text-brand-600 leading-snug mb-2 transition-colors">
            {event.title}
          </h4>

          <div className="space-y-1.5">
            {(event.event_time || event.event_end_time) && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Clock size={11} className="shrink-0 text-neutral-400" />
                <span>
                  {event.event_time ? event.event_time.slice(0, 5) : ''}
                  {event.event_end_time
                    ? ` – ${event.event_end_time.slice(0, 5)} WIB`
                    : event.event_time
                      ? ' WIB'
                      : ''}
                </span>
              </div>
            )}
            {event.event_location && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <MapPin size={11} className="shrink-0 text-neutral-400" />
                <span className="line-clamp-1">{event.event_location}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
