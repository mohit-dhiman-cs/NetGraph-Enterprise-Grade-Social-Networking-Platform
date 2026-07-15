#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         NetGraph — LinkedIn CSV Importer                ║
 * ║  Seeds your real LinkedIn network into NetGraph          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * HOW TO GET YOUR LINKEDIN DATA:
 *   1. Go to LinkedIn → Me → Settings & Privacy
 *   2. Data Privacy → Get a copy of your data
 *   3. Select "Connections" only → Request Archive
 *   4. Download and extract → find "Connections.csv"
 *   5. Place Connections.csv in this /scripts folder
 *   6. Run: node scripts/import-linkedin.js
 */

const fs   = require('fs');
const path = require('path');
const http = require('http');

// ── CONFIG ────────────────────────────────────────────────────
const API_BASE     = 'http://localhost:8080/api';
const CSV_PATH     = path.join(__dirname, 'Connections.csv');
const YOUR_NAME    = process.env.YOUR_NAME    || 'You';        // Your display name
const YOUR_USER    = process.env.YOUR_USER    || 'me';         // Your NetGraph username
const YOUR_EMAIL   = process.env.YOUR_EMAIL   || 'me@netgraph.demo';
const YOUR_PASS    = process.env.YOUR_PASS    || 'netgraph123';
const DELAY_MS     = 300;  // Delay between API calls to avoid hammering the server
// ─────────────────────────────────────────────────────────────

let authToken = null;
let myUserId  = null;
const createdUsers = [];

// ── HELPERS ───────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data    = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token)  headers['Authorization'] = `Bearer ${token}`;
    if (data)   headers['Content-Length'] = Buffer.byteLength(data);

    const url  = new URL(API_BASE + path);
    const opts = { hostname: url.hostname, port: url.port || 80,
                   path: url.pathname, method, headers };

    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── PARSE LINKEDIN CSV ────────────────────────────────────────
function parseLinkedInCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines   = content.split('\n').filter(l => l.trim());

  // LinkedIn CSV has a header row, skip notes/empty rows at top
  let headerIdx = lines.findIndex(l => l.includes('First Name') || l.includes('FirstName'));
  if (headerIdx === -1) headerIdx = 0;

  const headers = lines[headerIdx].split(',').map(h => h.replace(/"/g, '').trim());
  const connections = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    // Handle quoted CSV fields
    const cols = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const row  = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').replace(/"/g, '').trim();
    });

    const firstName = row['First Name'] || row['FirstName'] || '';
    const lastName  = row['Last Name']  || row['LastName']  || '';
    const company   = row['Company']    || '';
    const position  = row['Position']   || '';

    if (!firstName && !lastName) continue;

    const fullName   = `${firstName} ${lastName}`.trim();
    const username   = `${firstName}${lastName}`.toLowerCase()
                         .replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 900 + 100);

    connections.push({ fullName, firstName, lastName, username, company, position });
  }

  return connections;
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    NetGraph LinkedIn Importer  🔗             ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. Check CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  CSV file not found at: ${CSV_PATH}`);
    console.error('    Please place your LinkedIn Connections.csv in the /scripts folder.');
    process.exit(1);
  }

  // 2. Parse connections
  const connections = parseLinkedInCSV(CSV_PATH);
  console.log(`📄  Parsed ${connections.length} connections from LinkedIn CSV\n`);

  // 3. Register/Login as "YOU"
  console.log('🔐  Setting up your account...');
  let res = await apiRequest('POST', '/auth/register', {
    username: YOUR_USER, email: YOUR_EMAIL,
    password: YOUR_PASS, displayName: YOUR_NAME
  });

  if (res.status === 200) {
    authToken = res.body.token;
    myUserId  = res.body.userId;
    console.log(`✅  Registered as "${YOUR_NAME}" (ID: ${myUserId})`);
  } else {
    // Try login if already exists
    res = await apiRequest('POST', '/auth/login', { username: YOUR_USER, password: YOUR_PASS });
    if (res.status === 200) {
      authToken = res.body.token;
      myUserId  = res.body.userId;
      console.log(`✅  Logged in as "${YOUR_NAME}" (ID: ${myUserId})`);
    } else {
      console.error('❌  Could not authenticate. Is the NetGraph server running on port 8080?');
      process.exit(1);
    }
  }

  // 4. Create users for each LinkedIn connection
  console.log(`\n👥  Creating ${connections.length} users from your LinkedIn network...\n`);
  let created = 0, skipped = 0;

  for (const conn of connections) {
    const email    = `${conn.username}@linkedin.import`;
    const password = 'import@netgraph123';

    const r = await apiRequest('POST', '/auth/register', {
      username: conn.username, email,
      password, displayName: conn.fullName
    });

    if (r.status === 200) {
      createdUsers.push({ ...conn, userId: r.body.userId, token: r.body.token });
      created++;
      process.stdout.write(`  ✔ ${conn.fullName.padEnd(28)} @${conn.username}\n`);
    } else {
      skipped++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n  📊 Created: ${created}  |  Skipped (already exists): ${skipped}\n`);

  // 5. Make YOU follow all imported connections
  console.log('🔗  Creating follow relationships (You → Your Connections)...\n');
  let followed = 0;

  for (const conn of createdUsers) {
    const r = await apiRequest('POST', `/users/${conn.userId}/follow`, null, authToken);
    if (r.status === 200) {
      followed++;
      process.stdout.write(`  ↗ Following ${conn.fullName}\n`);
    }
    await sleep(DELAY_MS);
  }

  // 6. Create some random inter-connections (simulates the real network)
  console.log('\n🕸️   Creating random cross-connections (simulates real-world mutual friends)...\n');
  let crossLinks = 0;
  const CROSS_RATIO = 0.3; // 30% of users will follow each other

  for (let i = 0; i < createdUsers.length; i++) {
    for (let j = i + 1; j < createdUsers.length; j++) {
      if (Math.random() < CROSS_RATIO) {
        await apiRequest('POST', `/users/${createdUsers[j].userId}/follow`, null, createdUsers[i].token);
        crossLinks++;
        await sleep(100);
      }
    }
  }

  // ── SUMMARY ─────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║            Import Complete! 🎉                ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  👤 Users created      : ${String(created).padEnd(19)}║`);
  console.log(`║  🔗 Follow links (you) : ${String(followed).padEnd(19)}║`);
  console.log(`║  🕸️  Cross-connections  : ${String(crossLinks).padEnd(19)}║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  🚀 Open http://localhost to see your graph! ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  console.log(`🔑  Your login: username="${YOUR_USER}", password="${YOUR_PASS}"\n`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
