const http = require('http');

async function run() {
  // 1. Register a user
  try {
    await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'mcpuser', email: 'mcpuser@example.com', password: 'password123' })
    });
  } catch(e) {} // ignore if exists

  // 2. Login
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mcpuser', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const jwt = loginData.token;

  if (!jwt) {
    console.error('Failed to login:', loginData);
    return;
  }
  
  // 3. Authorize MCP
  const authRes = await fetch('http://localhost:8080/api/mcp/authorize', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + jwt 
    },
    body: JSON.stringify({
      clientId: 'mcp-claude-desktop',
      redirectUri: 'http://127.0.0.1:8181/callback',
      codeChallenge: 'fObyvsIk0H7zMLLzYM472XH0b82HIrPQVGyK9FoGiRo',
      scope: 'all',
      state: 'oABCTOLE32XuDgv0JBYQBw'
    })
  });
  const authData = await authRes.json();
  const redirectUrl = authData.redirectUrl;

  console.log('Got redirectUrl:', redirectUrl);

  // 4. Hit the callback on 8181
  if (redirectUrl) {
    const cbRes = await fetch(redirectUrl);
    const cbData = await cbRes.text();
    console.log('Callback response:', cbData.substring(0, 50) + '...');
  }
}

run().catch(console.error);
