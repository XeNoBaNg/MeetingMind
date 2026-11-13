import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useActionItems } from '../../hooks/useActionItems'
import {
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
      <GlassCard className="border-rose-300 bg-rose-50/60 text-rose-800">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold">Failed to load calendar</h2>
        </div>
        <p className="text-xs text-rose-700">{error.message}</p>
      </GlassCard>
    )
  }

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
            Schedule Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1">
            Visual calendar of deliverables, deadlines, and action items.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center rounded-xl bg-white border border-[#648296]/20 p-0.5 shadow-[0_1px_2px_rgba(23,43,58,0.03),inset_0_1px_0_0_#ffffff]">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-[#5A6E7F] hover:text-[#172B3A] hover:bg-black/[0.04] transition-colors cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs sm:text-sm font-bold text-[#172B3A] min-w-[130px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-[#5A6E7F] hover:text-[#172B3A] hover:bg-black/[0.04] transition-colors cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDaysOfWeek = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="grid grid-cols-7 border-b border-[#648296]/14 text-center py-2.5 bg-[#EAF1F6]/60">
        {days.map((day, index) => (
          <div key={index} className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const dayEvents = calendarEvents.filter(e => isSameDay(e.parsedDate, cloneDay))
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isCurrentDay = isToday(day)

        days.push(
          <div
            key={day.toString()}
            className={`
              min-h-[95px] sm:min-h-[110px] p-2 border-b border-r border-[#648296]/14 transition-colors relative flex flex-col justify-between
              ${!isCurrentMonth ? 'bg-slate-50/50 text-[#718096]/50' : 'bg-white/80 text-[#172B3A]'}
              ${isCurrentDay ? 'bg-sky-50/40 ring-1 ring-inset ring-[#168AAD]/30' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <span
                className={`
                  text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center
                  ${isCurrentDay ? 'bg-[#168AAD] text-white shadow-2xs' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {dayEvents.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#168AAD]/10 text-[#168AAD]">
                  {dayEvents.length}
                </span>
              )}
            </div>

            {/* Event Chips */}
            <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[68px] custom-scrollbar">
              {dayEvents.map(event => (
                <Link
                  key={event.id}
                  to={event.meetingId ? `/meetings/${event.meetingId}` : '/action-items'}
                  className="block p-1 rounded-md text-[11px] font-medium bg-[#EAF1F6] hover:bg-[#168AAD]/10 text-[#172B3A] hover:text-[#168AAD] border border-[#648296]/16 truncate transition-colors"
                  title={`${event.description} (Assignee: ${event.assignee || 'Unassigned'})`}
                >
                  <span className="truncate">{event.description}</span>
                </Link>
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }
    return <div className="border-l border-[#648296]/14">{rows}</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {renderHeader()}

      {/* Calendar Card */}
      <GlassCard padding="none" className="overflow-hidden">
        {renderDaysOfWeek()}
        {renderCells()}
      </GlassCard>

      {/* Upcoming Tasks Summary */}
      <GlassCard padding="md" className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#648296]/14">
          <h3 className="text-sm font-bold text-[#172B3A]">
            Upcoming Scheduled Deliverables
          </h3>
          <span className="text-xs text-[#718096]">
            {calendarEvents.length} dated items found
          </span>
        </div>

        {calendarEvents.length === 0 ? (
          <p className="text-xs text-[#718096] py-3 text-center">
            No action items with detectable due dates. Dates mentioned in transcripts (e.g. "by Friday") appear here automatically.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {calendarEvents.slice(0, 6).map(e => (
              <div
                key={e.id}
                className="p-3 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#172B3A] truncate">
                    {e.description}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 flex-shrink-0">
                    {format(e.parsedDate, 'MMM d')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#718096]">
                  {e.assignee && <span>Assignee: <strong className="text-[#172B3A]">{e.assignee}</strong></span>}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {e.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
