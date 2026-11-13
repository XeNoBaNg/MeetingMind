import { useState } from 'react'
import {
  Layers,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CheckCircle2
} from 'lucide-react'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'

const AVAILABLE_CAPABILITIES = [
  {
    name: 'list_meetings',
    label: 'Meeting Directory',
    description: 'Lists all meetings with titles, dates, and processing status.'
  },
  {
    name: 'get_meeting_summary',
    label: 'Executive Summaries',
    description: 'Retrieves executive summary, key decisions, and discussion takeaways.'
  },
  {
    name: 'list_action_items',
    label: 'Deliverables & Tasks',
    description: 'Retrieves action items across meetings with statuses and assignees.'
  },
  {
    name: 'mark_action_item_done',
    label: 'Task Completion',
    description: 'Updates task status to completed directly from your assistant.'
  },
  {
    name: 'get_person_workload',
    label: 'Team Workload',
    description: 'Calculates active and completed deliverables for any team member.'
  },
  {
    name: 'delete_meeting',
    label: 'Meeting Management',
    description: 'Permanently removes meeting records and associated deliverables.'
  }
]

export function McpPage() {
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [showDeveloperConfig, setShowDeveloperConfig] = useState(false)

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
          Integrations & Connected Apps
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E7F] mt-1 max-w-2xl">
          Connect MeetingMind with your desktop AI assistants, calendar, and productivity workflows.
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Claude Desktop & AI Assistants */}
        <GlassCard padding="lg" className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#168AAD]/10 text-[#168AAD] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <Badge variant="emerald" size="sm">Ready to Connect</Badge>
            </div>

            <h3 className="font-bold text-[#172B3A] text-base">Desktop AI Assistants</h3>
            <p className="text-xs text-[#5A6E7F] leading-relaxed">
              Connect Claude Desktop or Cursor to ask questions about your meetings, search past discussions, and check action items directly inside your assistant.
            </p>

            <ul className="space-y-1.5 text-xs text-[#172B3A] pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Query meeting summaries on demand</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Search assigned action items</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Inspect team workload statistics</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#648296]/14">
            <button
              onClick={() => setShowDeveloperConfig(true)}
              className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] flex items-center gap-1 cursor-pointer"
            >
              <span>View setup instructions</span>
              <span>→</span>
            </button>
          </div>
        </GlassCard>

        {/* Schedule Calendar Integration */}
        <GlassCard padding="lg" className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#48A9A6]/10 text-[#48A9A6] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <Badge variant="cyan" size="sm">Integrated</Badge>
            </div>

            <h3 className="font-bold text-[#172B3A] text-base">Calendar & Schedule</h3>
            <p className="text-xs text-[#5A6E7F] leading-relaxed">
              Action item due dates mentioned in meeting transcripts are parsed and mapped directly to your MeetingMind calendar schedule.
            </p>

            <ul className="space-y-1.5 text-xs text-[#172B3A] pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Automatic natural-language date parsing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Monthly calendar visualization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Deliverable tracking and filtering</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#648296]/14">
            <a
              href="/calendar"
              className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] flex items-center gap-1"
            >
              <span>Open Calendar</span>
              <span>→</span>
            </a>
          </div>
        </GlassCard>

        {/* Meeting Intelligence API */}
        <GlassCard padding="lg" className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#5A6E7F] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <Badge variant="slate" size="sm">Available</Badge>
            </div>

            <h3 className="font-bold text-[#172B3A] text-base">Custom Integrations</h3>
            <p className="text-xs text-[#5A6E7F] leading-relaxed">
              Integrate your own internal tools, workflows, or scripts to access meeting summaries and action items securely with authenticated tokens.
            </p>

            <ul className="space-y-1.5 text-xs text-[#172B3A] pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Secure OAuth authorization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>REST and tool interfaces</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Grounded transcript querying</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#648296]/14">
            <button
              onClick={() => setShowDeveloperConfig(true)}
              className="text-xs font-semibold text-[#168AAD] hover:text-[#13728F] flex items-center gap-1 cursor-pointer"
            >
              <span>View capabilities</span>
              <span>→</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Advanced Developer & Setup Section (Collapsible) */}
      <GlassCard padding="none" className="overflow-hidden">
        <button
          onClick={() => setShowDeveloperConfig(!showDeveloperConfig)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
        >
          <div>
            <h3 className="text-sm font-bold text-[#172B3A]">
              Advanced Client & Developer Configuration
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              Configuration snippets and tool interfaces for desktop assistants and developers
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#168AAD]">
            <span>{showDeveloperConfig ? 'Hide Details' : 'Show Details'}</span>
            {showDeveloperConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showDeveloperConfig && (
          <div className="p-6 border-t border-[#648296]/14 space-y-6 bg-[#F4F7FA]">
            {/* Claude Desktop Config Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A6E7F]">
                  Claude Desktop Configuration (<code className="text-[#168AAD]">claude_desktop_config.json</code>)
                </h4>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedConfig ? Check : Copy}
                  onClick={handleCopyConfig}
                >
                  {copiedConfig ? 'Copied' : 'Copy Configuration'}
                </Button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
                {configSnippet}
              </pre>
            </div>

            {/* Supported Tools List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A6E7F]">
                Available Integration Capabilities
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_CAPABILITIES.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3.5 rounded-xl bg-white border border-[#648296]/14 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172B3A]">{tool.label}</span>
                      <code className="text-[11px] text-[#168AAD] font-mono">{tool.name}</code>
                    </div>
                    <p className="text-xs text-[#5A6E7F]">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
