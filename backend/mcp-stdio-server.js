#!/usr/bin/env node

/**
 * MeetingMind MCP Server (stdio)
 * 
 * A lightweight Node.js MCP server that bridges Claude Desktop (stdio)
 * to the MeetingMind Spring Boot REST API (HTTP).
 * 
 * This avoids all SSE timeout issues by using pure stdio + HTTP REST calls.
 */

const http = require('http');

const BASE_URL = process.env.MEETINGMIND_URL || 'http://localhost:8080';

// --- HTTP helper ---
function httpRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = JSON.stringify(body);
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function httpPatch(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, { method: 'PATCH' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// --- Tool definitions ---
const TOOLS = [
  {
    name: 'list_meetings',
    description: 'Returns a list of recently analyzed meetings with identifiers, dates, and titles.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Maximum items to return (default 10)' }
      }
    }
  },
  {
    name: 'get_meeting_summary',
    description: 'Retrieves the executive summary and key decisions for a specific meeting.',
    inputSchema: {
      type: 'object',
      properties: {
        meetingId: { type: 'string', description: 'The UUID of the meeting' }
      },
      required: ['meetingId']
    }
  },
  {
    name: 'list_action_items',
    description: 'Lists action items, optionally filtered by status or assignee.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: OPEN or DONE', enum: ['OPEN', 'DONE'] },
        assignee: { type: 'string', description: 'Filter by assignee name' }
      }
    }
  },
  {
    name: 'mark_action_item_done',
    description: 'Marks a specific action item as completed (DONE).',
    inputSchema: {
      type: 'object',
      properties: {
        actionItemId: { type: 'string', description: 'The UUID of the action item' }
      },
      required: ['actionItemId']
    }
  },
  {
    name: 'get_person_workload',
    description: 'Gets workload statistics for a specific person including open and completed action items.',
    inputSchema: {
      type: 'object',
      properties: {
        assignee: { type: 'string', description: 'Name of the person' }
      },
      required: ['assignee']
    }
  },
  {
    name: 'create_meeting',
    description: 'Creates a new meeting with a title and raw transcript, triggering the AI pipeline to analyze it, extract action items, and draft a follow-up email.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title of the meeting' },
        transcript: { type: 'string', description: 'The raw conversation transcript of the meeting' }
      },
      required: ['title', 'transcript']
    }
  },
  {
    name: 'get_followup_email',
    description: 'Retrieves the AI-generated follow-up email draft (subject, recipients, and body) for a meeting.',
    inputSchema: {
      type: 'object',
      properties: {
        meetingId: { type: 'string', description: 'The UUID of the meeting' }
      },
      required: ['meetingId']
    }
  }
];

// --- Tool handlers ---
async function handleTool(name, args) {
  try {
    switch (name) {
      case 'list_meetings': {
        const res = await httpRequest('GET', '/api/meetings');
        const meetings = res.data || res;
        const limited = Array.isArray(meetings) ? meetings.slice(0, args.limit || 10) : meetings;
        return JSON.stringify(limited, null, 2);
      }
      case 'get_meeting_summary': {
        const res = await httpRequest('GET', `/api/meetings/${args.meetingId}`);
        const meeting = res.data || res;
        return JSON.stringify({
          title: meeting.title,
          summary: meeting.summary,
          status: meeting.status
        }, null, 2);
      }
      case 'list_action_items': {
        let url = '/api/action-items';
        const params = [];
        if (args.status) params.push(`status=${args.status}`);
        if (args.assignee) params.push(`assignee=${encodeURIComponent(args.assignee)}`);
        if (params.length) url += '?' + params.join('&');
        const res = await httpRequest('GET', url);
        return JSON.stringify(res.data || res, null, 2);
      }
      case 'mark_action_item_done': {
        const res = await httpPatch(`/api/action-items/${args.actionItemId}/done`);
        return JSON.stringify(res.data || res, null, 2);
      }
      case 'get_person_workload': {
        const res = await httpRequest('GET', `/api/action-items/workload/${encodeURIComponent(args.assignee)}`);
        return JSON.stringify(res.data || res, null, 2);
      }
      case 'create_meeting': {
        const res = await httpPost('/api/meetings', {
          title: args.title,
          transcript: args.transcript
        });
        const meeting = res.data || res;
        return JSON.stringify({
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          message: 'Meeting created successfully. The AI multi-agent pipeline is analyzing the transcript.'
        }, null, 2);
      }
      case 'get_followup_email': {
        const res = await httpRequest('GET', `/api/meetings/${args.meetingId}`);
        const meeting = res.data || res;
        if (!meeting.emailDraft) {
          return JSON.stringify({
            status: meeting.status,
            message: 'Email draft is not ready yet. The AI pipeline is still processing the meeting.'
          }, null, 2);
        }
        return JSON.stringify({
          subject: meeting.emailDraft.subject,
          recipients: meeting.emailDraft.recipientSuggestions,
          body: meeting.emailDraft.body,
          reviewed: meeting.emailDraft.reviewed
        }, null, 2);
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err.message}. Make sure the MeetingMind backend is running on ${BASE_URL}`;
  }
}

// --- JSON-RPC over stdio ---
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'mcp-debug.log');

function logDebug(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

logDebug('Server started / restarted');

let buffer = '';

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  logDebug(`SEND: ${msg}`);
  process.stdout.write(`${msg}\n`);
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  logDebug(`SEND ERROR: ${msg}`);
  process.stdout.write(`${msg}\n`);
}

function sendNotification(method, params) {
  const msg = JSON.stringify({ jsonrpc: '2.0', method, params });
  logDebug(`SEND NOTIF: ${msg}`);
  process.stdout.write(`${msg}\n`);
}

async function handleMessage(message) {
  const { id, method, params } = message;
  logDebug(`RECV: method=${method} id=${id} params=${JSON.stringify(params)}`);

  switch (method) {
    case 'initialize': {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true }
        },
        serverInfo: { name: 'meetingmind', version: '1.0.0' }
      });
      break;
    }

    case 'notifications/initialized':
      break;

    case 'tools/list':
      sendResponse(id, { tools: TOOLS });
      break;

    case 'resources/list':
      sendResponse(id, { resources: [] });
      break;

    case 'prompts/list':
      sendResponse(id, { prompts: [] });
      break;

    case 'logging/setLevel':
      sendResponse(id, {});
      break;

    case 'tools/call': {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      const result = await handleTool(toolName, toolArgs);
      sendResponse(id, {
        content: [{ type: 'text', text: result }]
      });
      break;
    }

    case 'ping':
      sendResponse(id, {});
      break;

    default:
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
      break;
  }
}

// Read JSON-RPC messages from stdin (newline-delimited JSON)
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (line) {
      try {
        const message = JSON.parse(line);
        handleMessage(message);
      } catch (err) {
        logDebug(`JSON parse error: ${err.message}, line: ${line}`);
        process.stderr.write(`Failed to parse message: ${err.message}\n`);
      }
    }
  }
});

process.stdin.on('end', () => {
  logDebug('stdin ended, exiting');
  process.exit(0);
});

// Suppress any uncaught errors from going to stdout
process.on('uncaughtException', (err) => {
  logDebug(`Uncaught exception: ${err.stack || err.message}`);
  process.stderr.write(`Uncaught error: ${err.message}\n`);
});
