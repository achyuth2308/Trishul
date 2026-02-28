/**
 * Generates server.js entry point.
 * @param {string} framework — "express" or "fastify"
 * @returns {string} — server.js content
 */
export function generateServer(framework) {
    if (framework === 'express') {
        return `import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(\`🔱 Trishul server running on http://localhost:\${PORT}\`);
  console.log(\`   Environment: \${env.NODE_ENV}\`);
  console.log(\`   Health check: http://localhost:\${PORT}/health\`);
});
`;
    }

    return `import { buildApp } from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT;

async function start() {
  try {
    const fastify = await buildApp();

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(\`🔱 Trishul server running on http://localhost:\${PORT}\`);
    console.log(\`   Environment: \${env.NODE_ENV}\`);
    console.log(\`   Health check: http://localhost:\${PORT}/health\`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
`;
}
