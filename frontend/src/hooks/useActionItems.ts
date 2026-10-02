import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionItemApi } from '../api/actionItemApi'
import { meetingKeys } from './useMeetings'

export const actionItemKeys = {
  all: ['action-items'] as const,
  lists: () => [...actionItemKeys.all, 'list'] as const,
}

export function useActionItems() {
  return useQuery({
    queryKey: actionItemKeys.lists(),
    queryFn: () => actionItemApi.getAll(),
  })
}

export function useUpdateActionItemStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'OPEN' | 'DONE' }) => 
      actionItemApi.updateStatus(id, status),
    onSuccess: (res, _variables) => {
      // Invalidate the global action items list
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all })
      
      // We should also invalidate the meeting details query if the action item was modified there.
      // But we don't necessarily know the meetingId here unless we check the response data.
      if (res.data?.meetingId) {
        queryClient.invalidateQueries({ queryKey: meetingKeys.detail(res.data.meetingId) })
      }
    }
  })
}
