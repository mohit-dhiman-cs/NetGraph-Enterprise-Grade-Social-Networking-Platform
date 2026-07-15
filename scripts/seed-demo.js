#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║         NetGraph — Demo Network Seeder                   ║
 * ║  Creates a realistic social graph for demos & pitches     ║
 * ║                                                           ║
 * ║  RUN:  node scripts/seed-demo.js                          ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const http = require('http');

const API_BASE = 'http://localhost:8080/api';
const DELAY_MS = 200;

// ── DEMO USERS (realistic tech network) ──────────────────────
const DEMO_USERS = [
  { username: 'alex_theta',    displayName: 'Alex Theta',    email: 'alex@demo.ng',    bio: 'Full-Stack Engineer @ Google' },
  { username: 'priya_sharma',  displayName: 'Priya Sharma',  email: 'priya@demo.ng',   bio: 'Product Manager @ Microsoft' },
  { username: 'liam_chen',     displayName: 'Liam Chen',     email: 'liam@demo.ng',    bio: 'ML Engineer @ OpenAI' },
  { username: 'sofia_martin',  displayName: 'Sofia Martin',  email: 'sofia@demo.ng',   bio: 'UX Designer @ Apple' },
  { username: 'dev_patel',     displayName: 'Dev Patel',     email: 'dev@demo.ng',     bio: 'Backend Engineer @ Amazon' },
  { username: 'nina_brooks',   displayName: 'Nina Brooks',   email: 'nina@demo.ng',    bio: 'Data Scientist @ Netflix' },
  { username: 'james_osei',    displayName: 'James Osei',    email: 'james@demo.ng',   bio: 'DevOps @ Spotify' },
  { username: 'yuki_tanaka',   displayName: 'Yuki Tanaka',   email: 'yuki@demo.ng',    bio: 'iOS Developer @ Meta' },
  { username: 'carlos_vega',   displayName: 'Carlos Vega',   email: 'carlos@demo.ng',  bio: 'Startup Founder @ TechHub' },
  { username: 'aisha_ali',     displayName: 'Aisha Ali',     email: 'aisha@demo.ng',   bio: 'Security Engineer @ Stripe' },
  { username: 'tom_walker',    displayName: 'Tom Walker',    email: 'tom@demo.ng',     bio: 'Frontend Dev @ Vercel' },
  { username: 'mia_russo',     displayName: 'Mia Russo',     email: 'mia@demo.ng',     bio: 'Engineering Manager @ Uber' },
  { username: 'raj_nair',      displayName: 'Raj Nair',      email: 'raj@demo.ng',     bio: 'Cloud Architect @ AWS' },
  { username: 'zara_khan',     displayName: 'Zara Khan',     email: 'zara@demo.ng',    bio: 'CTO @ FinTech Startup' },
  { username: 'ben_foster',    displayName: 'Ben Foster',    email: 'ben@demo.ng',     bio: 'Open Source Developer' },
];

// ── FOLLOW GRAPH (who follows who: [follower_idx, following_idx]) ──
// Designed to create interesting BFS paths and mutual connections
const FOLLOW_EDGES = [
  [0, 1], [0, 2], [0, 4], [0, 9],   // alex follows: priya, liam, dev, aisha
  [1, 0], [1, 3], [1, 5], [1, 12],  // priya follows: alex, sofia, nina, raj
  [2, 0], [2, 6], [2, 13], [2, 14], // liam follows: alex, james, zara, ben
  [3, 1], [3, 7], [3, 11],          // sofia follows: priya, yuki, mia
  [4, 0], [4, 9], [4, 12],          // dev follows: alex, aisha, raj
  [5, 1], [5, 8], [5, 11],          // nina follows: priya, carlos, mia
  [6, 2], [6, 7], [6, 14],          // james follows: liam, yuki, ben
  [7, 3], [7, 6], [7, 10],          // yuki follows: sofia, james, tom
  [8, 5], [8, 13], [8, 14],         // carlos follows: nina, zara, ben
  [9, 0], [9, 4], [9, 12],          // aisha follows: alex, dev, raj
  [10, 7], [10, 11], [10, 14],      // tom follows: yuki, mia, ben
  [11, 1], [11, 5], [11, 12],       // mia follows: priya, nina, raj
  [12, 4], [12, 9], [12, 13],       // raj follows: dev, aisha, zara
  [13, 2], [13, 8], [13, 14],       // zara follows: liam, carlos, ben
  [14, 6], [14, 10], [14, 13],      // ben follows: james, tom, zara
];

// ── DEMO POSTS ────────────────────────────────────────────────
const DEMO_POSTS = [
  { userIdx: 0, content: '🚀 Just launched my new project using Graph Databases. BFS for friend suggestions is a game-changer! #NetGraph #GraphDB' },
  { userIdx: 1, content: '💡 Interesting insight: companies that invest in their internal social graph see 40% better knowledge sharing. The power of connections!' },
  { userIdx: 2, content: '🤖 Graph Neural Networks are the next frontier in ML. The structure of information matters as much as the information itself.' },
  { userIdx: 13, content: '🏦 FinTech is being disrupted by graph analytics. Fraud detection using relationship graphs is 10x more accurate than rule-based systems.' },
  { userIdx: 8, content: '🌱 Building a startup? Your network is your net worth. Literally. Map it, understand it, leverage it.' },
  { userIdx: 14, content: '✨ Open source is a social network of code. Every PR is a connection, every fork is a relationship. #OpenSource' },
];

// ── HELPERS ───────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data    = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data)  headers['Content-Length'] = Buffer.byteLength(data);

    const url  = new URL(API_BASE + path);
    const opts = { hostname: url.hostname, port: url.port || 80,
                   path: url.pathname, method, headers };
    const req  = http.request(opts, res => {
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

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║       NetGraph Demo Seeder  🌐                    ║');
  console.log('║  Creating a realistic tech social network...       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const PASSWORD = 'demo@netgraph123';
  const tokens   = [];
  const userIds  = [];

  // STEP 1: Register all users
  console.log('👥  Registering demo users...\n');
  for (const u of DEMO_USERS) {
    const r = await apiRequest('POST', '/auth/register', {
      username: u.username, email: u.email,
      password: PASSWORD,   displayName: u.displayName
    });

    if (r.status === 200) {
      tokens.push(r.body.token);
      userIds.push(r.body.userId);
      console.log(`  ✔  ${u.displayName.padEnd(20)} @${u.username}`);
    } else {
      // Already exists, try login
      const lr = await apiRequest('POST', '/auth/login', { username: u.username, password: PASSWORD });
      if (lr.status === 200) {
        tokens.push(lr.body.token);
        userIds.push(lr.body.userId);
        console.log(`  ↩  ${u.displayName.padEnd(20)} @${u.username} (already exists)`);
      } else {
        console.log(`  ✗  Failed: ${u.username}`);
        tokens.push(null);
        userIds.push(null);
      }
    }
    await sleep(DELAY_MS);
  }

  // STEP 2: Create follow relationships
  console.log('\n🔗  Building the social graph...\n');
  let followCount = 0;

  for (const [followerIdx, followingIdx] of FOLLOW_EDGES) {
    const token    = tokens[followerIdx];
    const targetId = userIds[followingIdx];
    if (!token || !targetId) continue;

    const r = await apiRequest('POST', `/users/${targetId}/follow`, null, token);
    if (r.status === 200) {
      followCount++;
      const from = DEMO_USERS[followerIdx].displayName.padEnd(18);
      const to   = DEMO_USERS[followingIdx].displayName;
      console.log(`  ↗  ${from} → ${to}`);
    }
    await sleep(DELAY_MS);
  }

  // STEP 3: Create demo posts
  console.log('\n📝  Publishing demo posts...\n');
  let postCount = 0;

  for (const p of DEMO_POSTS) {
    const token = tokens[p.userIdx];
    if (!token) continue;
    const r = await apiRequest('POST', '/posts', { content: p.content }, token);
    if (r.status === 200) {
      postCount++;
      console.log(`  ✔  ${DEMO_USERS[p.userIdx].displayName}: "${p.content.slice(0, 50)}..."`);
    }
    await sleep(DELAY_MS);
  }

  // ── SUMMARY ─────────────────────────────────────────────────
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║              Seeding Complete! 🎉                  ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  👤 Users created      : ${String(DEMO_USERS.length).padEnd(23)}║`);
  console.log(`║  🔗 Follow connections : ${String(followCount).padEnd(23)}║`);
  console.log(`║  📝 Posts published    : ${String(postCount).padEnd(23)}║`);
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log('║  🚀 Open http://localhost to explore!              ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log('║  🔑 Login with any account (password same):        ║');
  console.log(`║     username: alex_theta                           ║`);
  console.log(`║     password: demo@netgraph123                     ║`);
  console.log('╚═══════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  console.error('   Is the NetGraph backend running on port 8080?');
  process.exit(1);
});
