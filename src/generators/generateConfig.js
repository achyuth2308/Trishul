/**
 * Generates config files: db.js (Prisma client singleton) and env.js.
 * @param {boolean} authRequired — whether auth env vars are needed
 * @returns {{ db: string, env: string }}
 */
export function generateConfig(authRequired) {
    return {
        db: generateDbConfig(),
        env: generateEnvConfig(authRequired),
    };
}

function generateDbConfig() {
    return `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export default prisma;
`;
}

function generateEnvConfig(authRequired) {
    let code = `import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,\n`;

    if (authRequired) {
        code += `  JWT_SECRET: process.env.JWT_SECRET,\n`;
        code += `  API_KEY: process.env.API_KEY,\n`;
    }

    code += `};\n\n`;

    code += `// Validate required environment variables\n`;
    code += `const required = ['DATABASE_URL'`;
    if (authRequired) {
        code += `, 'JWT_SECRET'`;
    }
    code += `];\n\n`;

    code += `for (const key of required) {\n`;
    code += `  if (!process.env[key]) {\n`;
    code += `    console.error(\`❌ Missing environment variable: \${key}\`);\n`;
    code += `    console.error('   Copy .env.example to .env and fill in the values.');\n`;
    code += `    process.exit(1);\n`;
    code += `  }\n`;
    code += `}\n`;

    return code;
}
