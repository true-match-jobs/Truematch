#!/usr/bin/env node

const https = require('https');
const WebSocket = require('ws');
const http = require('http');

const BASE_URL = 'https://truematch-o121.onrender.com';
const LOGIN_EMAIL = 'admin@truematch.com';
const LOGIN_PASSWORD = 'ADmiN_tRUEmAtch';
const TO_USER_ID = '35138728-ac0b-4a32-8d33-f0643180df09';
const TEST_MESSAGE = 'Test message from automated testing script';

// Helper function to make HTTPS requests
function makeRequest(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookie) {
      options.headers.Cookie = `accessToken=${cookie}`;
    }

    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('🧪 Starting Render messaging test...\n');

    // Step 1: Check if server is up
    console.log('1️⃣  Checking if server is reachable...');
    try {
      const healthRes = await makeRequest('GET', '/health');
      console.log(`   ✅ Server is reachable (${healthRes.status})\n`);
    } catch (err) {
      console.log(`   ❌ Server is not reachable: ${err.message}`);
      console.log('   This could be due to:');
      console.log('   - Render server is down or still starting');
      console.log('   - Network connectivity issue');
      console.log('   - CORS issues\n');
      return;
    }

    // Step 2: Login
    console.log('2️⃣  Logging in with admin credentials...');
    const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });

    if (loginRes.status !== 200) {
      console.log(`   ❌ Login failed with status ${loginRes.status}`);
      console.log(`   Response:`, JSON.stringify(loginRes.body, null, 2));
      return;
    }

    // Extract access token from Set-Cookie header
    const setCookieHeader = loginRes.headers['set-cookie'];
    let accessToken = null;
    
    if (Array.isArray(setCookieHeader)) {
      for (const cookie of setCookieHeader) {
        if (cookie.includes('accessToken=')) {
          const match = cookie.match(/accessToken=([^;]+)/);
          if (match) {
            accessToken = match[1];
            break;
          }
        }
      }
    }

    if (!accessToken) {
      console.log('   ❌ No access token in Set-Cookie header');
      console.log(`   Set-Cookie headers:`, setCookieHeader);
      return;
    }

    console.log(`   ✅ Login successful`);
    console.log(`   Token: ${accessToken.substring(0, 20)}...\n`);

    // Step 3: Get current user info
    console.log('3️⃣  Retrieving current user info...');
    const userRes = await makeRequest('GET', '/api/v1/users/me', null, accessToken);
    if (userRes.status === 200) {
      console.log(`   ✅ Current user: ${userRes.body?.fullName || 'Unknown'} (${userRes.body?.id})\n`);
    } else {
      console.log(`   ⚠️  Could not retrieve user info (${userRes.status})\n`);
    }

    // Step 4: Connect to WebSocket
    console.log('4️⃣  Connecting to WebSocket...');
    const wsUrl = BASE_URL.replace('https', 'wss').replace('http', 'ws') + '/ws?token=' + accessToken;
    console.log(`   Connecting to: ${wsUrl}\n`);

    const ws = new WebSocket(wsUrl);
    let connected = false;
    let messageReceived = false;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!connected) {
          console.log('   ❌ WebSocket connection timed out (5s)');
          ws.close();
        }
        resolve();
      }, 5000);

      ws.on('open', () => {
        connected = true;
        console.log('   ✅ WebSocket connected\n');
        clearTimeout(timeout);
        resolve();
      });

      ws.on('error', (err) => {
        if (!connected) {
          console.log(`   ❌ WebSocket error: ${err.message}`);
          clearTimeout(timeout);
          resolve();
        }
      });

      ws.on('close', (code, reason) => {
        if (!connected) {
          console.log(`   ❌ WebSocket closed before connection: ${code} ${reason}`);
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    if (!connected) {
      console.log('   Possible issues:');
      console.log('   - WebSocket server not properly initialized on Render');
      console.log('   - Render backend configuration issue');
      console.log('   - Token validation failing\n');
      return;
    }

    // Step 5: Send a test message
    console.log('5️⃣  Sending test message...');
    const messagePayload = {
      type: 'private_message',
      toUserId: TO_USER_ID,
      content: TEST_MESSAGE
    };

    console.log(`   Payload: ${JSON.stringify(messagePayload)}\n`);

    ws.send(JSON.stringify(messagePayload));

    // Step 6: Wait for response
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!messageReceived) {
          console.log('   ❌ No message confirmation received (5s timeout)');
          console.log('   This could indicate:');
          console.log('   - Database write failure');
          console.log('   - Issue with prisma on Render');
          console.log('   - Network latency\n');
        }
        ws.close();
        resolve();
      }, 5000);

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'private_message') {
            messageReceived = true;
            console.log('   ✅ Message sent successfully!');
            console.log(`   Message ID: ${msg.id}`);
            console.log(`   From: ${msg.fromUserId}`);
            console.log(`   To: ${msg.toUserId}`);
            console.log(`   Content: ${msg.content}`);
            console.log(`   Created: ${msg.createdAt}\n`);
            clearTimeout(timeout);
            ws.close();
            resolve();
          } else if (msg.type === 'error') {
            console.log(`   ❌ Error from server: ${msg.message}\n`);
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        } catch (err) {
          console.log(`   Error parsing message: ${err.message}`);
        }
      });

      ws.on('close', () => {
        if (!messageReceived) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (messageReceived) {
      console.log('✅ TEST PASSED - Messaging is working on Render!');
    } else {
      console.log('❌ TEST FAILED - Issue detected with messaging');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

test();
