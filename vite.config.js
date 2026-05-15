import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import { dialAircall } from './src/server/aircallDial.js'
import { createCognismPreview } from './src/server/cognismPreview.js'
import { getRedeemedContactById } from './src/server/redeemedContactStore.js'
import { suggestTargetRoles } from './src/server/roleSuggestions.js'
import { suggestAccountFieldsFromWeb, suggestClientFieldsFromWeb } from './src/server/clientSuggestions.js'
import { generateAccountScripts } from './src/server/accountScripts.js'

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function cognismPreviewApiPlugin() {
  let supabaseServer = null;

  async function getAuthenticatedCrmUser(req) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      const error = new Error('Authenticated CRM user is required');
      error.statusCode = 401;
      throw error;
    }

    if (!supabaseServer && process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      supabaseServer = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    }

    if (!supabaseServer) {
      const error = new Error('Supabase auth is not configured on the server');
      error.statusCode = 500;
      throw error;
    }

    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data.user) {
      const authError = new Error('Authenticated CRM user is required');
      authError.statusCode = 401;
      throw authError;
    }

    return {
      id: data.user.id,
      aircallUserId: data.user.user_metadata?.aircallUserId,
    };
  }

  return {
    name: 'paceops-cognism-preview-api',
    configureServer(server) {
      server.middlewares.use('/api/cognism/roles', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const payload = await suggestTargetRoles(body);
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.end(JSON.stringify({ error: error.message || 'Role suggestion failed' }));
        }
      });

      server.middlewares.use('/api/client-suggestions', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const payload = await suggestClientFieldsFromWeb(body);
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.end(JSON.stringify({ error: error.message || 'Client suggestion failed' }));
        }
      });

      server.middlewares.use('/api/account-suggestions', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const payload = await suggestAccountFieldsFromWeb(body);
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.end(JSON.stringify({ error: error.message || 'Account suggestion failed' }));
        }
      });

      server.middlewares.use('/api/account-scripts', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const payload = await generateAccountScripts(body);
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.end(JSON.stringify({ error: error.message || 'Account script generation failed' }));
        }
      });

      server.middlewares.use('/api/cognism/preview', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const payload = await createCognismPreview(body);
          console.info('Cognism preview estimated credits used:', payload.estimatedCreditsUsed);
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.end(JSON.stringify({ error: error.message || 'Cognism preview failed' }));
        }
      });

      server.middlewares.use('/api/aircall/dial', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const user = await getAuthenticatedCrmUser(req);
          const body = await readJsonBody(req);
          const payload = await dialAircall(body, {
            userId: user.id,
            aircallUserId: user.aircallUserId,
            getContactById: getRedeemedContactById,
          });
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.end(JSON.stringify({ error: error.message || 'Aircall dial failed' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [cognismPreviewApiPlugin(), react()],
  };
})
