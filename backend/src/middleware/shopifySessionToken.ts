import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

/**
 * Shopify embedded apps issue per-request JWTs ("session tokens") signed
 * with the app's API secret (HS256). They look like:
 *   header.payload.signature
 * with payload claims:
 *   { iss, dest, aud, sub, exp, nbf, iat, jti, sid }
 * - `aud` MUST equal our SHOPIFY_API_KEY
 * - `dest` is `https://{shop}.myshopify.com` — we read shopDomain from it
 * - `iss` matches `dest` + `/admin`
 *
 * Built for Shopify makes session-token auth mandatory; this is the
 * embedded-app counterpart of `authenticate` (which checks our own JWT).
 *
 * Mounted on /shopify-session/* routes that the embedded app calls.
 */

export interface ShopifySessionRequest extends Request {
  shopifySession?: {
    shopDomain: string;
    accessToken: string;
    shopId: number;
    userId: number;
  };
}

interface ShopifyJwtPayload {
  iss: string;
  dest: string;
  aud: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid?: string;
}

const LEEWAY_SECONDS = 10;

export async function shopifySessionToken(
  req: ShopifySessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = process.env['SHOPIFY_API_KEY'];
  const apiSecret = process.env['SHOPIFY_API_SECRET'];
  if (!apiKey || !apiSecret) {
    res.status(500).json({ error: 'Shopify yapılandırması eksik' });
    return;
  }

  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Session token gerekli' });
    return;
  }
  const token = auth.slice('Bearer '.length).trim();

  let payload: ShopifyJwtPayload;
  try {
    payload = jwt.verify(token, apiSecret, {
      algorithms: ['HS256'],
      audience: apiKey,
      clockTolerance: LEEWAY_SECONDS,
    }) as ShopifyJwtPayload;
  } catch {
    res.status(401).json({ error: 'Geçersiz session token' });
    return;
  }

  // dest looks like "https://example.myshopify.com" — extract host
  let shopDomain: string;
  try {
    shopDomain = new URL(payload.dest).hostname;
  } catch {
    res.status(401).json({ error: 'Token dest formatı geçersiz' });
    return;
  }
  if (!shopDomain.endsWith('.myshopify.com')) {
    res.status(401).json({ error: 'Token dest kabul edilmeyen domain' });
    return;
  }
  // iss should be dest + /admin
  if (payload.iss !== `${payload.dest}/admin`) {
    res.status(401).json({ error: 'Token iss/dest uyumsuz' });
    return;
  }

  const shop = await prisma.shop.findFirst({
    where: { shopDomain },
    select: { id: true, accessToken: true, userId: true },
  });
  if (!shop || !shop.accessToken) {
    res.status(404).json({ error: 'Mağaza Chekkify\'a bağlı değil' });
    return;
  }

  req.shopifySession = {
    shopDomain,
    accessToken: shop.accessToken,
    shopId: shop.id,
    userId: shop.userId,
  };
  next();
}
