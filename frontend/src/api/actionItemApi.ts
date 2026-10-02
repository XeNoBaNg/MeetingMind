import { apiClient } from './client'
import type { ApiResponse } from '../types/api'
import type { ActionItem } from '../types/actionItem'

export const actionItemApi = {
  getAll: async (): Promise<ApiResponse<ActionItem[]>> => {
    return apiClient.get('/action-items')
  },
  updateStatus: async (id: string, status: 'OPEN' | 'DONE'): Promise<ApiResponse<ActionItem>> => {
    return apiClient.patch(`/action-items/${id}/status`, { status })
  }
}
