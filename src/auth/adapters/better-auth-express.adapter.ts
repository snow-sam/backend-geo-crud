import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

export class BetterAuthExpressAdapter {
  static async handle(
    req: ExpressRequest,
    res: ExpressResponse,
    handler: (request: Request) => Promise<Response>,
  ): Promise<void> {
    const GLOBAL_PREFIX = '/api/v1';

    // 🔑 SEMPRE use originalUrl
    let pathname = req.originalUrl;

    if (pathname.startsWith(GLOBAL_PREFIX)) {
      pathname = pathname.slice(GLOBAL_PREFIX.length);
    }

    // Mantém o /auth pois o BetterAuth usa basePath: '/auth'
    if (!pathname.startsWith('/')) {
      pathname = `/${pathname}`;
    }

    // Better Auth só precisa do path final
    const url = `http://auth.local${pathname}`;
    console.log('BetterAuth URL:', url);

    const fetchRequest = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body),
    });

    const fetchResponse = await handler(fetchRequest);
    console.log('BetterAuth Response Status:', fetchResponse.status);

    res.status(fetchResponse.status);

    // Trata múltiplos headers set-cookie corretamente
    const setCookieHeaders: string[] = [];
    
    fetchResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
        console.log('BetterAuth Set-Cookie:', value);
      } else {
        res.setHeader(key, value);
      }
    });

    // Adiciona todos os cookies - Express suporta array para set-cookie
    if (setCookieHeaders.length > 0) {
      console.log('Total Set-Cookie headers:', setCookieHeaders.length);
      res.setHeader('set-cookie', setCookieHeaders);
    }

    const body = await fetchResponse.text();
    res.send(body);
  }
}
