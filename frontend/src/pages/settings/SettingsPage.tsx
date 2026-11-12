import { useAuth } from '../../features/auth/AuthContext'
import {
  Settings,
  Cpu,
  Database,
  LogOut,
  Sparkles,
  Server,
  Zap
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'

export function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Settings & Architecture Overview
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account profile and inspect the MeetingMind system architecture configuration.
        </p>
      </div>

      {/* User Profile Card */}
      <GlassCard padding="lg" className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-cyan-950/40">
              {user?.username?.substring(0, 2).toUpperCase() || 'MM'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.username || 'Executive'}</h2>
              <p className="text-xs text-slate-400">{user?.email || 'Authenticated User'}</p>
            </div>
          </div>
          <Badge variant="emerald" size="sm">Active Session</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="font-semibold text-slate-400">Account ID:</span>
            <p className="font-mono text-cyan-300 truncate">{user?.id || 'Local User'}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="font-semibold text-slate-400">Security Standard:</span>
            <p className="font-medium text-emerald-400">OAuth 2.0 PKCE + JWT Bearer</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </GlassCard>

      {/* Architecture & Infrastructure Status Card */}
      <GlassCard padding="lg" className="space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.08]">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">System Architecture Specifications</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                AI Pipeline Model
              </span>
              <span className="text-[11px] text-cyan-300 font-mono">Grok / xAI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              OpenAI-compatible client via Spring AI abstraction. Free-tier compliant, zero-cost multi-agent pipeline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Phase 7 RAG Store
              </span>
              <span className="text-[11px] text-emerald-300 font-mono">PostgreSQL pgvector</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Local-first vector similarity search. Chunks and embeddings stored directly in relational schema.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                Phase 11 Event Broker
              </span>
              <span className="text-[11px] text-purple-300 font-mono">Apache Kafka</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decoupled asynchronous analysis queue on topic <code className="text-cyan-300 font-mono text-[11px]">meeting-analysis-requests</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Phase 10 Cache Layer
              </span>
              <span className="text-[11px] text-amber-300 font-mono">Redis (TTL 1h)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cache-aside pattern with automatic eviction on meeting updates and task completion toggles.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
