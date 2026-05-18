import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleApiRequest } from './src/server/apiHandler.js'

function cognismPreviewApiPlugin() {
  return {
    name: 'paceops-lead-finder-preview-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          next();
          return;
        }
        if (await handleApiRequest(req, res)) return;
        next();
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
