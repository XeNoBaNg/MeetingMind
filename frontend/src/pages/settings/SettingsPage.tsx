import { useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import {
  User,
  LogOut,
  Save,
  CheckCircle2,
  Bell,
  Database
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { formatDisplayName } from '../../utils/userGreeting'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const currentDisplayName = formatDisplayName(user)
  const [preferredName, setPreferredName] = useState(
    localStorage.getItem('meetingmind_display_name') || (currentDisplayName !== 'there' ? currentDisplayName : '')
  )
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Preferences state
  const [autoDraft, setAutoDraft] = useState(true)
  const [syncCalendar, setSyncCalendar] = useState(true)
  const [factAudit, setFactAudit] = useState(true)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (preferredName.trim()) {
      localStorage.setItem('meetingmind_display_name', preferredName.trim())
    } else {
      localStorage.removeItem('meetingmind_display_name')
    }
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      window.location.reload()
    }, 1200)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1">
          Manage your account profile, display name, and workspace preferences.
        </p>
      </div>

      {/* User Profile Card */}
      <GlassCard padding="lg" className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#648296]/14">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#168AAD]/15 text-[#168AAD] flex items-center justify-center font-bold text-base flex-shrink-0">
              {currentDisplayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172B3A]">{currentDisplayName}</h2>
              <p className="text-xs text-[#718096]">{user?.email || user?.username || 'Active User'}</p>
            </div>
          </div>
          <Badge variant="emerald" size="sm">Active Session</Badge>
        </div>

        {/* Display Name Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div className="space-y-1">
            <Input
              label="Preferred Display Name"
              icon={User}
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="e.g. Abhinav"
              helperText="This name will be used across your dashboard greetings and notifications."
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="sm" icon={savedSuccess ? CheckCircle2 : Save}>
              {savedSuccess ? 'Saved!' : 'Save Display Name'}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#648296]/14 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 space-y-1">
            <span className="font-semibold text-[#5A6E7F]">User Identifier:</span>
            <p className="font-mono text-[#172B3A] truncate">{user?.id || 'Local Account'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 space-y-1">
            <span className="font-semibold text-[#5A6E7F]">Authentication Method:</span>
            <p className="font-medium text-[#172B3A]">JWT Bearer + Google OAuth</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </GlassCard>

      {/* Workspace Preferences */}
      <GlassCard padding="lg" className="space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#648296]/14">
          <Bell className="w-4 h-4 text-[#168AAD]" />
          <h2 className="text-base font-bold text-[#172B3A]">Workspace & Analysis Preferences</h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 cursor-pointer">
            <div>
              <p className="font-semibold text-[#172B3A]">Automated Follow-up Email Drafts</p>
              <p className="text-xs text-[#5A6E7F] mt-0.5">Generate ready-to-send draft communications automatically for every analyzed meeting.</p>
            </div>
            <input
              type="checkbox"
              checked={autoDraft}
              onChange={(e) => setAutoDraft(e.target.checked)}
              className="w-4 h-4 text-[#168AAD] rounded-md border-[#648296]/30 focus:ring-[#168AAD] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 cursor-pointer">
            <div>
              <p className="font-semibold text-[#172B3A]">Calendar Deadline Detection</p>
              <p className="text-xs text-[#5A6E7F] mt-0.5">Automatically map conversational deadlines into your schedule calendar.</p>
            </div>
            <input
              type="checkbox"
              checked={syncCalendar}
              onChange={(e) => setSyncCalendar(e.target.checked)}
              className="w-4 h-4 text-[#168AAD] rounded-md border-[#648296]/30 focus:ring-[#168AAD] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4F7FA] border border-[#648296]/14 cursor-pointer">
            <div>
              <p className="font-semibold text-[#172B3A]">Quality & Accuracy Review</p>
              <p className="text-xs text-[#5A6E7F] mt-0.5">Audit extracted deliverables against the raw transcript to flag potential hallucinations.</p>
            </div>
            <input
              type="checkbox"
              checked={factAudit}
              onChange={(e) => setFactAudit(e.target.checked)}
              className="w-4 h-4 text-[#168AAD] rounded-md border-[#648296]/30 focus:ring-[#168AAD] cursor-pointer"
            />
          </label>
        </div>
      </GlassCard>

      {/* Data & Privacy */}
      <GlassCard padding="lg" className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#648296]/14">
          <Database className="w-4 h-4 text-[#168AAD]" />
          <h2 className="text-base font-bold text-[#172B3A]">Data Storage & Privacy</h2>
        </div>

        <p className="text-xs text-[#5A6E7F] leading-relaxed">
          Your meeting transcripts, extracted action items, and follow-up drafts are securely persisted in your dedicated database. Data is never shared with third-party advertisers.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const data = localStorage.getItem('meetingmind_user')
              const blob = new Blob([data || '{}'], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'meetingmind-session.json'
              a.click()
            }}
          >
            Export Account Data
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
