import express from 'express';
import cors from 'cors';
import { briefingRouter } from './routes/briefing.js';
import { liveRouter } from './routes/live.js';
import { chatRouter } from './routes/chat.js';
import { healthRouter, setDataReady } from './routes/health.js';
import { initData311, refreshData311 } from './services/data311.js';
import { initPermits, refreshPermits } from './services/permits.js';
import { initSdpdCache } from './services/sdpdDispatch.js';
import { initCouncilDistricts } from './services/councilDistricts.js';
import { initCivicPoints } from './services/civicPoints.js';
import { setupMcp } from './mcp/server.js';

const app = express();
const port = parseInt(process.env.PORT || '8080');
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
}));
app.use(express.json());

// Routes
app.use(healthRouter);
app.use('/api', briefingRouter);
app.use('/api', liveRouter);
app.use('/api', chatRouter);

// MCP endpoint
setupMcp(app);

// Daily refresh of 311 + permits data
async function refreshAllData() {
  console.log(`[refresh] Starting daily data refresh...`);
  const results = await Promise.allSettled([refreshData311(), refreshPermits()]);
  for (const [i, r] of results.entries()) {
    const name = ['311', 'Permits'][i];
    if (r.status === 'fulfilled') console.log(`[refresh] ${name}: ${r.value} items loaded`);
    else console.error(`[refresh] ${name} failed, keeping previous data:`, r.reason);
  }
}

// Initialize data and start
async function start() {
  console.log(`[startup] Initializing data...`);

  // Try live download first, fall back to committed JSON
  await initData311();
  await initPermits();
  await initCouncilDistricts();
  await initCivicPoints();
  initSdpdCache();

  setDataReady(true);

  // Schedule daily refresh
  setInterval(refreshAllData, REFRESH_INTERVAL_MS);

  app.listen(port, () => {
    console.log(`MyBlock server running on :${port}`);
  });
}

start().catch(err => {
  console.error('[startup] Fatal error:', err);
  process.exit(1);
});
