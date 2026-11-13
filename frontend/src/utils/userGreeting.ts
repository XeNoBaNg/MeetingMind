/**
 * Helper utilities for dynamic time-of-day greetings and clean user display names.
 */

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 17) {
    // 12:00 PM to 4:59 PM
    return 'Good afternoon'
  }
  // 5:00 PM onwards
  return 'Good evening'
}

export function formatDisplayName(user: { username?: string; email?: string } | null): string {
  // Check for custom user-configured display name in localStorage first
  const customName = localStorage.getItem('meetingmind_display_name')
  if (customName && customName.trim()) {
    return customName.trim()
  }

  if (!user) return 'there'

  const raw = user.username || user.email || ''
  if (!raw.trim()) return 'there'

  // If it's an email address, extract handle
  const handle = raw.includes('@') ? raw.split('@')[0] : raw

  // Strip trailing numbers (e.g., abhinavchavan0782 -> abhinavchavan)
  const clean = handle.replace(/\d+$/, '')
  if (!clean) return 'there'

  // If separated by dot, underscore, or hyphen (e.g. john.doe -> John Doe)
  if (clean.includes('.') || clean.includes('_') || clean.includes('-')) {
    const parts = clean.split(/[._-]+/).filter(Boolean)
    if (parts.length > 0) {
      return parts
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')
    }
  }

  // If camelCase (e.g. JohnDoe -> John Doe)
  const camelSplit = clean.replace(/([a-z])([A-Z])/g, '$1 $2')
  if (camelSplit !== clean) {
    return camelSplit
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ')
  }

  // Detect common name compounds (e.g. abhinavchavan -> Abhinav)
  // If the string is long and lowercase, capitalize first letter nicely
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
}

