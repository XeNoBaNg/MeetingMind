import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useActionItems } from '../../hooks/useActionItems'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
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

export function CalendarPage() {
  const { data, isLoading, error } = useActionItems()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Parse items and assign them to dates
  const calendarEvents = useMemo(() => {
    if (!data?.data) return []
    
    return data.data
      .filter(item => item.dueDate)
      .map(item => {
        // Use chrono to parse natural language date (e.g. "Friday at 4:00 PM")
        const parsedResults = chrono.parse(item.dueDate || '')
        if (parsedResults.length > 0) {
          return {
            ...item,
            parsedDate: parsedResults[0].start.date()
          }
        }
        return null
      })
      .filter(Boolean) as (typeof data.data[0] & { parsedDate: Date })[]
  }, [data?.data])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
            Calendar
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualize your scheduled follow-ups and deadlines.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          >
            Today
          </button>
          
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
            <button 
              onClick={prevMonth}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold w-32 text-center text-slate-800 dark:text-slate-200">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button 
              onClick={nextMonth}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const startDate = startOfWeek(currentDate)
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      )
    }
    return <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd')
        const cloneDay = day
        
        // Find events for this day
        const dayEvents = calendarEvents.filter(event => isSameDay(event.parsedDate, cloneDay))

        days.push(
          <div 
            key={day.toString()} 
            className={`min-h-[120px] p-2 border-b border-r border-slate-200 dark:border-slate-800 transition-colors ${
              !isSameMonth(day, monthStart)
                ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
            } ${isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                isToday(day) ? 'bg-blue-500 text-white shadow-sm' : ''
              }`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-2 flex flex-col gap-1.5 overflow-y-auto max-h-[80px] sm:max-h-none scrollbar-hide">
              {dayEvents.map((event, idx) => (
                <Link
                  key={event.id + idx}
                  to={`/meetings/${event.meetingId}`}
                  className={`group relative text-xs p-2 rounded-lg border text-left transition-all truncate hover:whitespace-normal hover:z-20 hover:shadow-lg ${
                    event.status === 'DONE' 
                      ? 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400 opacity-80'
                      : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300'
                  }`}
                  title={event.description}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.status === 'DONE' ? 'bg-slate-400' : 'bg-blue-500'}`} />
                    <span className="font-bold tracking-tight truncate">{format(event.parsedDate, 'h:mm a')}</span>
                  </div>
                  <div className="truncate group-hover:whitespace-normal group-hover:break-words leading-tight">{event.description}</div>
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
    
    return <div className="border-l border-t border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">{rows}</div>
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[80vh] flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse hidden sm:block" />
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="grid grid-cols-7 h-12 border-b border-slate-200 dark:border-slate-800">
             {[...Array(7)].map((_, i) => (
               <div key={i} className="flex items-center justify-center">
                 <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
               </div>
             ))}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-5">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="border-b border-r border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-2">
                <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse self-start" />
                {Math.random() > 0.7 && (
                  <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse mt-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 dark:text-red-400">
        <h2 className="text-xl font-bold mb-2">Failed to load calendar</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {renderHeader()}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  )
}
