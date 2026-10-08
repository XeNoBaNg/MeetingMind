const { spawn } = require('child_process');
const fs = require('fs');

const child = spawn('node', ['mcp-stdio-server.js']);

let outBuffer = '';

child.stdout.on('data', (data) => {
  outBuffer += data.toString();
  const lines = outBuffer.split('\n');
  while (lines.length > 1) {
    const line = lines.shift();
    if (line.trim()) {
      console.log('RECV:', line);
    }
  }
  outBuffer = lines[0];
});

child.stderr.on('data', (data) => {
  console.error('ERR:', data.toString());
});

const msg = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'list_meetings',
    arguments: {}
  }
};

child.stdin.write(JSON.stringify(msg) + '\n');
console.log('MCP Server PID:', child.pid);

