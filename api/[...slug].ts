import app from '../server/src/index.js';

export default (req: any, res: any) => {
  // Vercel's [...slug] route may strip the /api prefix from req.url.
  // Ensure it always starts with /api so Express routes match.
  const url: string = req.url || '/';
  if (!url.startsWith('/api')) {
    req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
  }
  return app(req, res);
};
