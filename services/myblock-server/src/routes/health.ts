import { Router } from 'express';
import { get311Count, get311DataSource, get311LastRefresh } from '../services/data311.js';
import { getPermitsCount, getPermitsDataSource, getPermitsLastRefresh } from '../services/permits.js';
import { getSdpdStatus } from '../services/sdpdDispatch.js';

export const healthRouter = Router();

let dataReady = false;

export function setDataReady(ready: boolean) {
  dataReady = ready;
}

healthRouter.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/readyz', (_req, res) => {
  if (dataReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'loading' });
  }
});

healthRouter.get('/api/status', (_req, res) => {
  const sdpd = getSdpdStatus();
  res.json({
    data311: {
      count: get311Count(),
      lastRefresh: get311LastRefresh()?.toISOString() || null,
      source: get311DataSource(),
    },
    permits: {
      count: getPermitsCount(),
      lastRefresh: getPermitsLastRefresh()?.toISOString() || null,
      source: getPermitsDataSource(),
    },
    sdpd,
    agentAvailable: !!process.env.ANTHROPIC_API_KEY,
  });
});
