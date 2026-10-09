export default async function handler(req: any, res: any) {
  const steps: string[] = [];
  try {
    steps.push('start');
    const m1 = await import('express');
    steps.push('express: ' + typeof (m1.default ?? m1));
    const m2 = await import('@supabase/supabase-js');
    steps.push('supabase-js: ok');
    const m3 = await import('../server/src/config/env.js');
    steps.push('env: ok, SUPABASE_URL set=' + !!(m3 as any).env?.SUPABASE_URL);
    const m4 = await import('../server/src/lib/supabase.js');
    steps.push('supabase lib: ok');
    const m5 = await import('../server/src/index.js');
    const app = (m5 as any).default?.default ?? (m5 as any).default ?? m5;
    steps.push('server index: type=' + typeof app);
    if (typeof app !== 'function') {
      throw new Error('app not a function, keys=' + Object.keys(m5 as any).join(','));
    }
    const url: string = req.url || '/';
    if (!url.startsWith('/api')) {
      req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
    }
    return app(req, res);
  } catch (err: any) {
    console.error('API DEBUG ERROR. Steps:', steps.join(' -> '), 'Error:', err?.stack || err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, steps, error: err?.message }));
    }
  }
}
