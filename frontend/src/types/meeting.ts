import type { ActionItem } from './actionItem'
import type { EmailDraft } from './email'

export type MeetingStatus = 'ANALYZING' | 'SUMMARIZING' | 'EXTRACTING' | 'DRAFTING' | 'REVIEWING' | 'COMPLETED' | 'FAILED'

export interface MeetingSummary {
  id: string
  title: string
  overview: string
  keyDecisions: string[]
  discussionTopics: string[]
}

export interface MeetingReview {
  id: string
  verified: boolean
  hallucinatedItems: string[]
  missedItems: string[]
  dateOrAssigneeDiscrepancies: string[]
  commentary: string
}

export interface Meeting {
  id: string
  title: string
  status: MeetingStatus
  createdAt: string
  updatedAt: string
}

export interface MeetingDetail extends Meeting {
  transcript: string
  summary: MeetingSummary | null
  review: MeetingReview | null
  emailDraft: EmailDraft | null
  actionItems: ActionItem[] | null
}
