import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingApi } from '../api/meetingApi'

export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  detail: (id: string) => [...meetingKeys.all, 'detail', id] as const,
}

export function useMeetings() {
  return useQuery({
    queryKey: meetingKeys.lists(),
    queryFn: () => meetingApi.getAll(),
  })
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => meetingApi.getById(id),
    enabled: Boolean(id),
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ title, transcript }: { title: string; transcript: string }) =>
      meetingApi.create(title, transcript),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() })
    },
  })
}
