import app from '../server/src/index.js';

export default (req: any, res: any) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
