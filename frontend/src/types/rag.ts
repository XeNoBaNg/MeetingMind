export interface MeetingCitation {
  meetingId: string | null
  meetingTitle: string
  meetingDate: string | null
  speakers: string[]
  excerpt: string
  similarityScore: number | null
}

export interface RagQueryRequest {
  query: string
  topK?: number
  minSimilarity?: number
}

export interface RagResponse {
  query: string
  answer: string
  citations: MeetingCitation[]
  chunksRetrieved: number
}
