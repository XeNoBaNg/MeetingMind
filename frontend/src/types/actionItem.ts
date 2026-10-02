export interface ActionItem {
  id: string
  description: string
  assignee: string
  dueDate?: string
  context?: string
  status: 'OPEN' | 'DONE'
  meetingId: string
  meetingTitle: string
}
