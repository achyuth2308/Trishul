/**
 * Generates app.js that mounts all modules.
 * @param {Array} schema — array of module definitions
 * @param {string} framework — "express" or "fastify"
 * @returns {string} — app.js content
 */
export function generateApp(schema, framework) {
    if (framework === 'express') {
        return generateExpressApp(schema);
    }
    return generateFastifyApp(schema);
}

function generateExpressApp(schema) {
    let code = `import express from 'express';\n`;
    code += `import cors from 'cors';\n`;
    code += `import { errorHandler } from './middleware/error.middleware.js';\n\n`;

    for (const mod of schema) {
        code += `import ${mod.module}Routes from './modules/${mod.module}/${mod.module}.routes.js';\n`;
    }

    code += `\nconst app = express();\n\n`;
    code += `// Global middleware\n`;
    code += `app.use(cors());\n`;
    code += `app.use(express.json());\n`;
    code += `app.use(express.urlencoded({ extended: true }));\n\n`;
    code += `// Health check\n`;
    code += `app.get('/health', (req, res) => {\n`;
    code += `  res.json({ status: 'ok', timestamp: new Date().toISOString() });\n`;
    code += `});\n\n`;
    code += `// Mount module routes\n`;

    for (const mod of schema) {
        code += `app.use(${mod.module}Routes);\n`;
    }

    code += `\n// Global error handler (must be last)\n`;
    code += `app.use(errorHandler);\n\n`;
    code += `export default app;\n`;

    return code;
}

function generateFastifyApp(schema) {
    let code = `import Fastify from 'fastify';\n`;
    code += `import cors from '@fastify/cors';\n`;
    code += `import { setupErrorHandler } from './middleware/error.middleware.js';\n\n`;

    for (const mod of schema) {
        code += `import ${mod.module}Routes from './modules/${mod.module}/${mod.module}.routes.js';\n`;
    }

    code += `\nexport async function buildApp() {\n`;
    code += `  const fastify = Fastify({\n`;
    code += `    logger: process.env.NODE_ENV === 'development',\n`;
    code += `  });\n\n`;
    code += `  // Plugins\n`;
    code += `  await fastify.register(cors);\n\n`;
    code += `  // Error handler\n`;
    code += `  setupErrorHandler(fastify);\n\n`;
    code += `  // Health check\n`;
    code += `  fastify.get('/health', async () => {\n`;
    code += `    return { status: 'ok', timestamp: new Date().toISOString() };\n`;
    code += `  });\n\n`;
    code += `  // Register module routes\n`;

    for (const mod of schema) {
        code += `  await fastify.register(${mod.module}Routes);\n`;
    }

    code += `\n  return fastify;\n`;
    code += `}\n`;

    return code;
}
