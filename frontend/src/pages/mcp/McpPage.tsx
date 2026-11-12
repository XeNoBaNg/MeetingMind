import { useState } from 'react'
import {
  Cpu,
  Server,
  ShieldCheck,
  Terminal,
  Check,
  Copy,
  Zap,
  Layers
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'

const MCP_TOOLS = [
  {
    name: 'list_meetings',
    description: 'Lists all meetings stored in MeetingMind, including title, status, and creation timestamps.',
    params: 'none'
  },
  {
    name: 'get_meeting_summary',
    description: 'Retrieves the executive summary, key decisions, and discussion topics for a specific meeting.',
    params: 'meetingId (UUID)'
  },
  {
    name: 'list_action_items',
    description: 'Fetches all action items and deliverables across meetings, filterable by status.',
    params: 'status? ("OPEN" | "DONE")'
  },
  {
    name: 'mark_action_item_done',
    description: 'Updates an action item status to DONE via MeetingMind application services.',
    params: 'actionItemId (UUID)'
  },
  {
    name: 'get_person_workload',
    description: 'Computes open and completed tasks for a specific person or team member.',
    params: 'personName (String)'
  },
  {
    name: 'delete_meeting',
    description: 'Permanently deletes a meeting and all associated vectors, action items, and drafts.',
    params: 'meetingId (UUID)'
  }
]

export function McpPage() {
  const [copiedConfig, setCopiedConfig] = useState(false)

  const configSnippet = `{
  "mcpServers": {
    "meetingmind": {
      "command": "node",
      "args": [
        "<path-to-meetingmind>/mcp-stdio-server.js"
      ]
    }
  }
}`

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configSnippet)
    setCopiedConfig(true)
    setTimeout(() => setCopiedConfig(false), 2500)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Model Context Protocol (MCP) Server
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Connect external AI agents (Claude Desktop, Cursor, IDEs) to MeetingMind via standardized MCP tools and OAuth 2.0 PKCE authentication.
        </p>
      </div>

      {/* Protocol Architecture Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlassCard padding="md" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Local Stdio Bridge</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The <code className="text-cyan-300">mcp-stdio-server.js</code> bridge connects desktop AI clients to the MeetingMind Spring Boot REST API using JSON-RPC.
          </p>
        </GlassCard>

        <GlassCard padding="md" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">OAuth 2.0 PKCE Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Compliant with RFC 7636. Clients exchange cryptographic code verifiers and authorization codes for long-lived access tokens via <code className="text-cyan-300">/api/mcp/token</code>.
          </p>
        </GlassCard>

        <GlassCard padding="md" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">6 Production Tools</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            External LLMs can inspect meeting summaries, query deliverables, update task completion statuses, and calculate individual workloads.
          </p>
        </GlassCard>
      </div>

      {/* Tools Catalog */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="p-6 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registered MCP Tools</h2>
              <p className="text-xs text-slate-400">Tools exposed to external MCP clients</p>
            </div>
          </div>
          <Badge variant="cyan" size="sm">6 Active Tools</Badge>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {MCP_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {tool.name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="flex-shrink-0">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400">
                  {tool.params}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Claude Desktop Config Guide */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="p-6 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Client Configuration</h2>
              <p className="text-xs text-slate-400">Add to your claude_desktop_config.json</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={copiedConfig ? Check : Copy}
            onClick={handleCopyConfig}
          >
            {copiedConfig ? 'Copied' : 'Copy JSON'}
          </Button>
        </div>

        <div className="p-6 bg-[#070e19]">
          <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-4 rounded-xl bg-black/40 border border-white/5 leading-relaxed">
            {configSnippet}
          </pre>
        </div>
      </GlassCard>
    </div>
  )
}
