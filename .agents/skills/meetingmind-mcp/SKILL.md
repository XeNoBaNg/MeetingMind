---
name: meetingmind-mcp
description: >-
  Implementation guide and reference for Model Context Protocol (MCP) integration in MeetingMind.
  Use when designing, configuring, testing, or modifying the MeetingMind MCP Server (Phase 6),
  MCP tool definitions, resource providers, and the future external MCP Client integrations (Phase 8).
---

# MeetingMind MCP Integration Guide

This skill defines the architecture, tool specifications, and integration boundaries for the Model Context Protocol (MCP) in MeetingMind.

---

## 1. Dual MCP Capabilities Overview

MeetingMind participates in the MCP ecosystem in two distinct capacities:

```text
=== Phase 6: MeetingMind as MCP Server ===
External MCP Client (e.g., Claude Desktop, Cursor, Antigravity)
               │
               │ MCP Protocol (stdio / SSE)
               ▼
┌─────────────────────────────────────────────────┐
│           MeetingMind MCP Server                │
│                                                 │
│   [ Tools ]           [ Resources ]             │
│   - list_meetings     - meeting://{id}/summary  │
│   - get_summary       - meeting://{id}/actions  │
│   - list_actions                                │
│   - mark_action_done                            │
│   - get_workload                                │
│               │                                 │
│               ▼                                 │
│   Application / Domain Services                 │
│   (MeetingService, ActionItemService)           │
└─────────────────────────────────────────────────┘
               │
               ▼
           PostgreSQL


=== Phase 8: MeetingMind as MCP Client ===
┌─────────────────────────────────────────────────┐
│            Drafter / AI Pipeline                │
│                      │                          │
│                      ▼                          │
│          MeetingMind MCP Client                 │
└─────────────────────────────────────────────────┘
               │
               │ MCP Protocol
               ▼
External Tool Server (e.g., Google Calendar MCP Server)
               │
               ▼
Calendar Verification & Conflict Checks
```

---

## 2. MeetingMind MCP Server (Phase 6)

### 2.1 Core Architectural Rule: Service Delegation
**MCP Tools must remain thin transport adapters.** They must invoke existing application services (`MeetingService`, `ActionItemService`), never query repositories directly, and never execute raw SQL.

```text
[ REST Controller ]      [ MCP Tool ]
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
       [ Application Service ]
                    │
                    ▼
             [ Repository ]
                    │
                    ▼
              [ Database ]
```

This guarantees that validation rules, transactional guarantees, and business logic are 100% shared between REST consumers and MCP clients.

---

## 3. Initial MCP Tool Catalog

### 3.1 `list_meetings`
- **Description**: Returns a list of recently analyzed meetings with identifiers, dates, and titles.
- **Parameters**:
  - `limit` (integer, optional, default: 10): Maximum items to return.
- **Service Delegate**: `MeetingService.getRecentMeetings(limit)`

### 3.2 `get_meeting_summary`
- **Description**: Retrieves the executive summary and key decisions for a specific meeting.
- **Parameters**:
  - `meetingId` (string, required): The UUID of the meeting.
- **Service Delegate**: `MeetingService.getMeetingSummary(meetingId)`

### 3.3 `list_action_items`
- **Description**: Lists action items filtered by completion status or assignee.
- **Parameters**:
  - `status` (string, optional: "OPEN", "DONE"): Filter by status.
  - `assignee` (string, optional): Filter by assignee name.
- **Service Delegate**: `ActionItemService.getActionItems(status, assignee)`

### 3.4 `mark_action_item_done`
- **Description**: Updates the status of an open action item to completed (`DONE`).
- **Parameters**:
  - `actionItemId` (string, required): The UUID of the action item.
- **Service Delegate**: `ActionItemService.markDone(actionItemId)`

### 3.5 `get_person_workload`
- **Description**: Aggregates deliverable statistics and counts for a specific person.
- **Parameters**:
  - `assignee` (string, required): Name of the individual.
- **Service Delegate**: `ActionItemService.getWorkloadForAssignee(assignee)`

---

## 4. MCP Package Hierarchy (`com.meetingmind.mcp/`)

```text
backend/src/main/java/com/meetingmind/mcp/
  ├── server/                     # MCP Server lifecycle and session management
  │     └── McpServerRunner.java
  ├── tools/                      # Tool handler implementations
  │     ├── MeetingTools.java
  │     └── ActionItemTools.java
  ├── resources/                  # Resource uri handlers (e.g. transcript URIs)
  │     └── MeetingResourceProvider.java
  └── config/                     # Spring configuration for stdio / SSE transport
        └── McpConfig.java
```

---

## 5. Tool Implementation Pattern (Spring AI MCP)

```java
@Component
public class ActionItemTools {

    private final ActionItemService actionItemService;

    public ActionItemTools(ActionItemService actionItemService) {
        this.actionItemService = actionItemService;
    }

    @Tool(name = "mark_action_item_done", description = "Marks a specific action item as completed")
    public ActionItemResponse markActionItemDone(
        @ToolParam(description = "UUID of the action item") String actionItemId
    ) {
        return actionItemService.markDone(UUID.fromString(actionItemId));
    }
}
```

---

## 6. Future MCP Client Integration (Phase 8)

In Phase 8, MeetingMind's AI pipeline connects to external MCP servers to augment agent decisions:
1. **Calendar Validation**: When the Drafter agent generates follow-up emails with suggested deadlines or follow-up meetings, it queries an external Calendar MCP tool (`check_availability`) to prevent scheduling conflicts.
2. **Contact Lookup**: The Drafter agent resolves attendee email addresses by querying a directory or CRM MCP server.

---

## 7. Anti-Patterns & Prohibitions

| Anti-Pattern | Why It Fails | Recommended Pattern |
| :--- | :--- | :--- |
| **Direct Repository Ingestion** | Bypasses business validation and causes divergent logic between REST and MCP. | Delegate all tool calls to `ApplicationService`. |
| **Mutating State Without Confirmation** | Dangerous tool operations can trigger accidental data deletion. | Restrict destructive tools to idempotent updates (`mark_action_item_done`). |
| **Exposing Raw Transcripts Unnecessarily** | Dumps high-token context to external MCP clients needlessly. | Return structured summaries and action item lists; provide resource URIs for full text. |
| **Implementing MCP Early** | Introducing MCP in Phase 1-5 complicates core pipeline validation. | Reserve MCP server for Phase 6 and MCP client for Phase 8. |

---

## 8. Verification Checklist

When working on MCP features (Phase 6 & 8):
- [ ] Do all tool methods delegate to existing application services?
- [ ] Are tools annotated with clear parameter descriptions for external LLM parsing?
- [ ] Is input validation applied to parameters (UUID parsing, null checks)?
- [ ] Is MCP configuration compatible with standard stdio and SSE transports?
- [ ] Are no new SQL queries or repositories introduced exclusively inside MCP packages?
