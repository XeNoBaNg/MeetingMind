#!/usr/bin/env node

/**
 * Mock Calendar MCP Server (stdio)
 * Returns deterministic availability responses for testing.
 */

const TOOLS = [
  {
    name: 'check_availability',
    description: 'Checks if a given date and time is available in the calendar.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'The date to check (e.g., Friday, 2023-10-27)' },
        time: { type: 'string', description: 'The time to check (e.g., 2:00 PM)' }
      },
      required: ['date', 'time']
    }
  }
];

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'calendar-mcp-debug.log');

function logDebug(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

logDebug('Calendar Mock Server started');

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

async function handleMessage(message) {
  const { id, method, params } = message;
  logDebug(`RECV: method=${method} id=${id} params=${JSON.stringify(params)}`);

  switch (method) {
    case 'initialize': {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false }
        },
        serverInfo: { name: 'calendar-mock', version: '1.0.0' }
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
      
      if (toolName === 'check_availability') {
        const timeStr = (toolArgs.time || '').toUpperCase();
        const dateStr = (toolArgs.date || '').toUpperCase();
        
        let isAvailable = true;
        let reason = "Time is available.";

        // Deterministic mock rules
        if (dateStr.includes('FRIDAY') && timeStr.includes('2:00 PM')) {
          isAvailable = false;
          reason = "Conflict: Weekly Team Sync is scheduled at this time.";
        } else if (dateStr.includes('FRIDAY') && timeStr.includes('4:00 PM')) {
          isAvailable = true;
          reason = "Time is available.";
        } else if (timeStr.includes('2:00')) {
          // General conflict for 2:00 just in case
           isAvailable = false;
           reason = "Conflict: Busy at 2:00 PM.";
        }

        const resultJson = JSON.stringify({
          isAvailable: isAvailable,
          reason: reason
        }, null, 2);

        sendResponse(id, {
          content: [{ type: 'text', text: resultJson }]
        });
      } else {
        sendResponse(id, {
          content: [{ type: 'text', text: `Unknown tool: ${toolName}` }]
        });
      }
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
      }
    }
  }
});

process.stdin.on('end', () => {
  logDebug('stdin ended, exiting');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logDebug(`Uncaught exception: ${err.message}`);
});
