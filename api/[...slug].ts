import serverModule from '../server/src/index.js';

const app: any = (serverModule as any).default ?? serverModule;

export default (req: any, res: any) => {
  try {
    // Vercel's [...slug] route may strip the /api prefix from req.url.
    // Ensure it always starts with /api so Express routes match.
    const url: string = req.url || '/';
    if (!url.startsWith('/api')) {
      req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
    }
    return app(req, res);
  } catch (err: any) {
    console.error('API handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
    }
  }
};
