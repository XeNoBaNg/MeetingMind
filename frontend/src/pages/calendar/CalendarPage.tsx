import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useActionItems } from '../../hooks/useActionItems'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react'
import * as chrono from 'chrono-node'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday
} from 'date-fns'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/common/Button'
import { PageSkeleton } from '../../components/common/LoadingSkeleton'

export function CalendarPage() {
  const { data, isLoading, error } = useActionItems()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Parse items and assign them to dates
  const calendarEvents = useMemo(() => {
    const items = data?.data
    if (!items) return []

    return items
      .filter(item => item.dueDate)
      .map(item => {
        const parsedResults = chrono.parse(item.dueDate || '')
        if (parsedResults.length > 0) {
          return {
            ...item,
            parsedDate: parsedResults[0].start.date()
          }
        }
        return null
      })
      .filter(Boolean) as (typeof items[0] & { parsedDate: Date })[]
  }, [data?.data])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error) {
    return (
      <GlassCard className="border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center gap-3 text-rose-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h2 className="text-lg font-bold">Failed to load calendar</h2>
        </div>
        <p className="text-sm text-slate-400">{error.message}</p>
      </GlassCard>
    )
  }

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Action Item Schedule
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual calendar of deliverables and deadlines parsed automatically by Extractor Agent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center rounded-xl bg-[#081220] border border-white/10 p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold w-32 text-center text-white">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDaysOfWeek = () => {
    const days = []
    const startDate = startOfWeek(currentDate)
    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-center font-bold text-[11px] text-cyan-400 uppercase tracking-wider py-3 border-b border-white/[0.08] bg-white/[0.02]"
        >
          {format(addDays(startDate, i), 'EEE')}
        </div>
      )
    }
    return <div className="grid grid-cols-7">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd')
        const cloneDay = day
        const dayEvents = calendarEvents.filter(event => isSameDay(event.parsedDate, cloneDay))
        const isCurrentDay = isToday(day)
        const isCurrentMonth = isSameMonth(day, monthStart)

        days.push(
          <div
            key={day.toString()}
            className={`
              min-h-[120px] p-2.5 border-b border-r border-white/[0.06] transition-colors flex flex-col justify-between
              ${
                !isCurrentMonth
                  ? 'bg-[#060e19]/40 text-slate-600'
                  : 'bg-[#0a1526]/60 text-slate-300'
              }
              ${isCurrentDay ? 'bg-cyan-950/25 ring-1 ring-inset ring-cyan-500/40' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <span
                className={`text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-xl font-mono ${
                  isCurrentDay
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/40 font-bold'
                    : isCurrentMonth
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                {formattedDate}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold">
                  {dayEvents.length}
                </span>
              )}
            </div>

            <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar">
              {dayEvents.map((event, idx) => (
                <Link
                  key={event.id + idx}
                  to={`/meetings/${event.meetingId}`}
                  className={`
                    block text-[11px] p-2 rounded-xl border text-left transition-all truncate hover:whitespace-normal group
                    ${
                      event.status === 'DONE'
                        ? 'bg-white/[0.02] border-white/5 text-slate-500 line-through'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-200 shadow-sm'
                    }
                  `}
                  title={`${event.description} (${event.dueDate})`}
                >
                  <div className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{format(event.parsedDate, 'h:mm a')}</span>
                  </div>
                  <div className="truncate font-medium">{event.description}</div>
                </Link>
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }

    return <div>{rows}</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {renderHeader()}

      <GlassCard padding="none" className="overflow-hidden border-white/10 shadow-2xl">
        {renderDaysOfWeek()}
        {renderCells()}
      </GlassCard>
    </div>
  )
}
