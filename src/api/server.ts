/**
 * Development API Server
 * 
 * Simple API server for development purposes using Vite's built-in server.
 * For production, these endpoints should be deployed as serverless functions
 * or integrated into your backend API server.
 */
import type { Plugin } from 'vite';
import { 
  calculateConfidence, 
  validateUnits, 
  getCompatibleUnits,
  isErrorResponse,
  type ConfidenceRequest,
  type ValidateUnitsRequest,
  type CompatibleUnitsRequest
} from './conversions';

/**
 * Vite plugin to add API routes during development
 */
export function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Add API routes
      server.middlewares.use(async (req, res, next) => {
        // Only handle API routes
        if (!req.url?.startsWith('/api/')) {
          return next();
        }
        
        // Set JSON response headers
        res.setHeader('Content-Type', 'application/json');
        
        // Handle CORS for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle OPTIONS requests
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        
        // Route handling
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          
          // POST /api/v2/conversions/confidence
          if (url.pathname === '/api/v2/conversions/confidence' && req.method === 'POST') {
            const body = await getRequestBody<ConfidenceRequest>(req);
            const response = await calculateConfidence(body);
            
            if (isErrorResponse(response)) {
              res.statusCode = 400;
            } else {
              res.statusCode = 200;
            }
            
            res.end(JSON.stringify(response, null, 2));
            return;
          }
          
          // POST /api/v2/units/validate
          if (url.pathname === '/api/v2/units/validate' && req.method === 'POST') {
            const body = await getRequestBody<ValidateUnitsRequest>(req);
            const response = await validateUnits(body);
            
            res.statusCode = 200;
            res.end(JSON.stringify(response, null, 2));
            return;
          }
          
          // POST /api/v2/units/compatible
          if (url.pathname === '/api/v2/units/compatible' && req.method === 'POST') {
            const body = await getRequestBody<CompatibleUnitsRequest>(req);
            const response = await getCompatibleUnits(body);
            
            res.statusCode = 200;
            res.end(JSON.stringify(response, null, 2));
            return;
          }
          
          // 404 for unknown API routes
          res.statusCode = 404;
          res.end(JSON.stringify({
            error: 'NotFound',
            message: `Unknown API endpoint: ${url.pathname}`,
            availableEndpoints: [
              'POST /api/v2/conversions/confidence',
              'POST /api/v2/units/validate',
              'POST /api/v2/units/compatible'
            ]
          }, null, 2));
          
        } catch (error) {
          console.error('API Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            error: 'InternalServerError',
            message: error instanceof Error ? error.message : 'An unknown error occurred'
          }, null, 2));
        }
      });
    }
  };
}

/**
 * Helper to parse request body
 */
async function getRequestBody<T>(req: any): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Example serverless function exports for production deployment
 * These can be deployed to AWS Lambda, Vercel, Netlify Functions, etc.
 */
export { calculateConfidence, validateUnits, getCompatibleUnits };