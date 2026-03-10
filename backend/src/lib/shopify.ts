import { shopifyApi, ApiVersion, LogSeverity, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

export { Session };

export const shopify = shopifyApi({
  apiKey: process.env['SHOPIFY_API_KEY'] || '',
  apiSecretKey: process.env['SHOPIFY_API_SECRET'] || '',
  scopes: ['read_orders', 'write_orders'],
  hostName: (process.env['BASE_URL'] || 'http://localhost:3001').replace(/^https?:\/\//, ''),
  apiVersion: ApiVersion.January25,
  isEmbeddedApp: false,
  logger: { level: LogSeverity.Warning },
});
