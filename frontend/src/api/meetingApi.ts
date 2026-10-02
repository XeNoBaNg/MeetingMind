import { apiClient } from './client'
import type { ApiResponse } from '../types/api'
import type { Meeting, MeetingDetail } from '../types/meeting'

export const meetingApi = {
  create: async (title: string, transcript: string): Promise<ApiResponse<Meeting>> => {
    return apiClient.post('/meetings', { title, transcript })
  },
  getById: async (id: string): Promise<ApiResponse<MeetingDetail>> => {
    return apiClient.get(`/meetings/${id}`)
  },
  getAll: async (): Promise<ApiResponse<Meeting[]>> => {
    return apiClient.get('/meetings')
  }
}
