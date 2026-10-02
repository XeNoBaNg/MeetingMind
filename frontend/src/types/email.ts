export interface EmailDraft {
  id: string
  subject: string
  body: string
  recipientSuggestions: string[]
  reviewed: boolean
}
