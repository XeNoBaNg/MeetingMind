---
name: meetingmind-frontend
description: >-
  Implementation guide and conventions for the React and TypeScript frontend in MeetingMind.
  Use when developing, modifying, or testing UI pages, components, API client hooks,
  TanStack Query server-state management, types, and styling.
---

# MeetingMind Frontend Implementation Guide

This skill defines the technical standards, directory layout, and UI conventions for the React, TypeScript, and Vite frontend in MeetingMind.

---

## 1. Technology Stack & Core Tooling

- **Core Framework**: React 18+ with TypeScript (Strict Mode)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom theme design tokens
- **Data Fetching & Server State**: TanStack React Query (`@tanstack/react-query`)
- **HTTP Client**: Axios with configured interceptors
- **Icons**: Lucide React (`lucide-react`)
- **Routing**: React Router (`react-router-dom`)

---

## 2. Feature-Oriented Directory Hierarchy

The frontend organizes code by domain feature alongside cross-cutting directories:

```text
frontend/src/
  ├── assets/                     # Static imagery, icons, and fonts
  ├── api/                        # Axios client & typed API service endpoints
  │     ├── client.ts             # Axios instance & interceptors
  │     ├── meetingApi.ts
  │     ├── actionItemApi.ts
  │     └── emailApi.ts
  ├── components/
  │     ├── common/               # Buttons, modals, badges, inputs, skeletons
  │     ├── layout/               # Header, sidebar, shell, navigation
  │     ├── meeting/              # Transcript viewer, analysis trigger, summary card
  │     ├── actionitem/           # Action item row, workload badge, status toggle
  │     ├── email/                # Draft previewer, copy button, edit modal
  │     └── ai/                   # Pipeline progress indicators, review alerts
  ├── pages/
  │     ├── dashboard/            # Overview, stats, recent meetings, workload
  │     ├── meetings/             # New meeting submission & meeting details view
  │     ├── actionitems/          # Filterable deliverables table & status toggle
  │     └── drafts/               # Email follow-up drafts management
  ├── hooks/                      # Custom hooks (e.g., useMeeting, useActionItems)
  ├── types/                      # TypeScript definitions matching backend DTOs
  ├── utils/                      # Formatting (dates, names) and helper functions
  ├── lib/                        # Third-party library initializations (queryClient)
  ├── routes/                     # Router setup and route definitions
  ├── App.tsx                     # Main layout shell and query provider
  └── main.tsx                    # React DOM root entrypoint
```

---

## 3. Page Specifications & Workflows

### 3.1 Dashboard (`pages/dashboard/`)
- **Key Metrics**: Total meetings analyzed, open vs. completed action items, pending drafts.
- **Widgets**:
  - Recent meetings list with quick-access links.
  - Workload distribution summary grouped by assignee.
  - Urgent/impending action items with due dates.

### 3.2 Meeting Submission & Details (`pages/meetings/`)
- **New Meeting View (`/meetings/new`)**:
  - Form fields: Title, participants (tag/pill input), raw transcript text area.
  - Action button: `Analyze Meeting`.
  - Progress state: Multi-step stepper reflecting agent execution (Summarizing ➔ Extracting ➔ Drafting ➔ Reviewing).
- **Meeting Detail View (`/meetings/:id`)**:
  - Tabbed or sectioned layout:
    1. **Summary**: Executive overview and key decision callouts.
    2. **Action Items**: Discrete task cards showing assignee and due date.
    3. **Follow-up Draft**: Formatted email preview with copy-to-clipboard and edit options.
    4. **AI Review**: Audit findings, hallucination flags, or discrepancy warnings.

### 3.3 Action Items Management (`pages/actionitems/`)
- **Features**:
  - Filterable by status (`OPEN`, `DONE`), assignee, or meeting.
  - Inline toggle to mark an item as completed (optimistic UI update).
  - Workload overview tab showing deliverable counts per team member.

### 3.4 Drafts Management (`pages/drafts/`)
- **Features**:
  - Catalog of generated follow-up emails across meetings.
  - Inline draft preview with markdown/plain-text switching.
  - One-click "Copy to Clipboard" and "Mark Reviewed" toggles.

---

## 4. API & Server State Patterns (TanStack Query)

### 4.1 Centralized Axios Client (`api/client.ts`)
- Configured with `baseURL: '/api/v1'` (or `import.meta.env.VITE_API_BASE_URL`).
- Intercepts backend `ApiResponse<T>` to extract payload `data` or handle errors globally.

### 4.2 Query Key Conventions
Keep query keys structured and predictable:
```typescript
export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  detail: (id: string) => [...meetingKeys.all, 'detail', id] as const,
};

export const actionItemKeys = {
  all: ['action-items'] as const,
  byStatus: (status: 'OPEN' | 'DONE') => [...actionItemKeys.all, status] as const,
  byAssignee: (assignee: string) => [...actionItemKeys.all, 'assignee', assignee] as const,
};
```

### 4.3 Custom Query & Mutation Hooks
Always wrap API calls in custom hooks under `hooks/`:

```typescript
// hooks/useMeetings.ts
export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => meetingApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useMarkActionItemDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actionItemApi.markDone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all });
    },
  });
}
```

---

## 5. TypeScript Types & Backend Alignment

All types under `types/` must strictly mirror the backend contracts and response envelopes:

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// types/meeting.ts
export interface Meeting {
  id: string;
  title: string;
  transcript: string;
  meetingDate: string;
  createdAt: string;
  status: 'ANALYZING' | 'SUMMARIZING' | 'EXTRACTING' | 'DRAFTING' | 'REVIEWING' | 'COMPLETED' | 'FAILED';
}

// types/actionItem.ts
export interface ActionItem {
  id: string;
  meetingId: string;
  description: string;
  assignee: string;
  dueDate?: string;
  status: 'OPEN' | 'DONE';
}

// types/email.ts
export interface EmailDraft {
  id: string;
  meetingId: string;
  subject: string;
  body: string;
  recipientSuggestions: string[];
  reviewed: boolean;
  createdAt: string;
}
```

---

## 6. Design System & Component Guidelines

1. **Rich & Modern Visuals**: Use clean dark/light surfaces, subtle borders (`border-slate-200 dark:border-slate-800`), refined typography, and purposeful badge accents.
2. **State Transparency**: Every asynchronous interaction must present clear visual states:
   - Loading skeletons during fetch operations.
   - Distinct error alerts with retry triggers.
   - Empty states with illustrative prompts when lists are empty.
3. **Optimistic Updates**: For single-click actions like toggling action item status (`OPEN` ➔ `DONE`), implement optimistic updates with query cache rollback on failure.

---

## 7. Anti-Patterns & Prohibitions

| Anti-Pattern | Why It Fails | Recommended Pattern |
| :--- | :--- | :--- |
| **Direct Axios Calls in UI Components** | Couples UI to transport; duplicates error and cache handling. | Wrap API calls in custom TanStack Query hooks. |
| **Using `any` Types** | Bypasses TypeScript safety and invites runtime bugs. | Use strict TypeScript interfaces matching backend DTOs. |
| **Global State Duplication** | Storing server data in global stores creates stale-state desynchronization. | Treat TanStack Query cache as the single source of truth for server state. |
| **Direct LLM Calls from Frontend** | Exposes secret API keys and bypasses backend pipeline. | All AI analysis calls route strictly through the Spring Boot API. |

---

## 8. Verification Checklist

Before completing frontend tasks:
- [ ] Are components placed in their feature directory (`components/meeting/`, `pages/actionitems/`)?
- [ ] Are API endpoints wrapped in typed TanStack Query hooks?
- [ ] Does every async view handle loading, error, and empty states?
- [ ] Are all types aligned with backend Java DTOs/records?
- [ ] Is TypeScript running in strict mode without `any` workarounds?
