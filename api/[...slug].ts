let cachedApp: any = null;

async function loadApp() {
  if (cachedApp) return cachedApp;
  const mod: any = await import('../server/src/index.js');
  cachedApp = mod.default?.default ?? mod.default ?? mod;
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    // Vercel's [...slug] route may strip the /api prefix from req.url.
    const url: string = req.url || '/';
    if (!url.startsWith('/api')) {
      req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
    }
    const app = await loadApp();
    return app(req, res);
  } catch (err: any) {
    console.error('API handler error:', err?.stack || err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: err?.message || 'Internal server error',
        stack: err?.stack?.split('\n').slice(0, 5),
      }));
    }
  }
}
