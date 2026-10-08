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
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.MEETINGMIND_URL || 'http://localhost:8080';
const logFile = path.join(__dirname, 'mcp-debug.log');
const tokenFile = path.join(__dirname, '.mcp-token');

let mcpToken = null;
try {
  mcpToken = fs.readFileSync(tokenFile, 'utf8').trim();
} catch {}

function logDebug(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

function base64URLEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generatePKCE() {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

// --- HTTP helper ---
function httpRequest(method, reqPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const headers = {};
    if (mcpToken) headers['Authorization'] = `Bearer ${mcpToken}`;
    
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        logDebug(`httpRequest ${method} ${reqPath} returned ${res.statusCode}: ${data}`);
        if (res.statusCode === 401) {
          reject(new Error('UNAUTHORIZED'));
          return;
        }
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

function httpPost(reqPath, body, unauth = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const bodyStr = JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) };
    if (mcpToken && !unauth) headers['Authorization'] = `Bearer ${mcpToken}`;
    
    const req = http.request(url, {
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401 && !unauth) {
          reject(new Error('UNAUTHORIZED'));
          return;
        }
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

function httpPatch(reqPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const headers = {};
    if (mcpToken) headers['Authorization'] = `Bearer ${mcpToken}`;
    
    const req = http.request(url, { method: 'PATCH', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401) {
          reject(new Error('UNAUTHORIZED'));
          return;
        }
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

// --- OAuth Flow ---
let authServer = null;

function requireAuthAndReturnLink() {
  if (authServer) {
     authServer.close();
  }
  const { verifier, challenge } = generatePKCE();
  const state = base64URLEncode(crypto.randomBytes(16));
  const clientId = 'mcp-claude-desktop';
  const redirectUri = 'http://127.0.0.1:8181/callback';

  const authUrl = `http://localhost:5173/mcp-connect?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256&state=${state}&scope=all`;

  authServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      
      if (returnedState !== state) {
        res.writeHead(400);
        res.end('State mismatch');
        authServer.close();
        authServer = null;
        return;
      }
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Successful - MeetingMind</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 flex items-center justify-center min-h-screen p-4 font-sans text-gray-900 dark:text-gray-100">
  <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
      <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Authorization Successful</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">
      MeetingMind is now connected to Claude. You can safely close this window and return to Claude to retry your request.
    </p>
    <button onclick="window.close(); document.getElementById('close-hint').classList.remove('hidden');" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
      Close Window
    </button>
    <p id="close-hint" class="hidden mt-4 text-sm text-gray-500 dark:text-gray-400">
      (If the window doesn't close, your browser is blocking it. Please close this tab manually.)
    </p>
  </div>
</body>
</html>
        `.trim());
        authServer.close();
        authServer = null;
        
        try {
          const tokenRes = await httpPost('/api/mcp/token', {
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code: code,
            code_verifier: verifier
          }, true);
          if (tokenRes.access_token) {
            mcpToken = tokenRes.access_token;
            fs.writeFileSync(tokenFile, mcpToken);
            logDebug('Token obtained and saved.');
          } else {
            logDebug('Token error: ' + JSON.stringify(tokenRes));
          }
        } catch(e) {
          logDebug('Token exception: ' + e.message);
        }
      }
    }
  });
  
  authServer.listen(8181, '127.0.0.1', () => {
    logDebug('Listening on 8181 for auth callback');
  });

  return `Authorization required. Please open this link in your browser to authenticate:\n\n${authUrl}\n\nAfter authorizing, retry your request.`;
}

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
    if (err.message === 'UNAUTHORIZED') {
      return requireAuthAndReturnLink();
    }
    return `Error: ${err.message}. Make sure the MeetingMind backend is running on ${BASE_URL}`;
  }
}

// --- JSON-RPC over stdio ---

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
