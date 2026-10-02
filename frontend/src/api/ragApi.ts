import { apiClient } from './client'
import type { MeetingCitation, RagQueryRequest, RagResponse } from '../types/rag'

export const ragApi = {
  search: async (request: RagQueryRequest): Promise<MeetingCitation[]> => {
    return apiClient.post('/rag/search', request)
  },

  query: async (request: RagQueryRequest): Promise<RagResponse> => {
    return apiClient.post('/rag/query', request)
  },

  indexMeeting: async (meetingId: string): Promise<{ status: string; message: string }> => {
    return apiClient.post(`/rag/index/${meetingId}`)
  },

  indexAll: async (): Promise<{ status: string; indexedMeetings: number; message: string }> => {
    return apiClient.post('/rag/index-all')
  }
}
