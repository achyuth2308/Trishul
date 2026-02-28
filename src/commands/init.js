import { select, input, confirm } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';
import { writeFile } from '../utils/fileWriter.js';

export async function initCommand() {
    logger.section('Initializing new Trishul project...\n');

    const projectName = await input({
        message: '📛 Project name?',
        default: 'my-trishul-app',
        validate: (v) => v.trim().length > 0 || 'Project name cannot be empty',
    });

    const architecture = await select({
        message: '🏗️  Architecture?',
        choices: [
            { name: 'Modular Monolith', value: 'modular-monolith' },
            { name: 'Microservices', value: 'microservices' },
        ],
    });

    const framework = await select({
        message: '⚡ Framework?',
        choices: [
            { name: 'Express.js', value: 'express' },
            { name: 'Fastify', value: 'fastify' },
        ],
    });

    const authRequired = await confirm({
        message: '🔐 Auth required?',
        default: true,
    });

    const cwd = process.cwd();

    // 1. trishul.config.json
    const config = {
        projectName,
        architecture,
        framework,
        database: 'postgresql',
        orm: 'prisma',
        auth: authRequired,
    };
    await writeFile(
        path.join(cwd, 'trishul.config.json'),
        JSON.stringify(config, null, 2),
        { noHeader: true }
    );

    // 2. trishul.schema.js
    await writeFile(
        path.join(cwd, 'trishul.schema.js'),
        generateSchemaTemplate(),
        { noHeader: true }
    );

    // 3. .env.example
    await writeFile(
        path.join(cwd, '.env.example'),
        generateEnvExample(authRequired),
        { noHeader: true }
    );

    // 4. package.json
    await writeFile(
        path.join(cwd, 'package.json'),
        generatePackageJson(projectName, framework, authRequired),
        { noHeader: true }
    );

    logger.success(`\nProject "${projectName}" initialized!`);
    logger.info('Next steps:');
    logger.info('  1. Edit trishul.schema.js to define your modules');
    logger.info('  2. Run "trishul forge" to generate your backend');
}

function generateSchemaTemplate() {
    return `// 🔱 Trishul Schema — Define your backend modules here
//
// Each module has:
//   module     — module name (lowercase, used for folder names)
//   auth       — module-level auth (applies to all endpoints unless overridden)
//   db         — Prisma model name (PascalCase)
//   endpoints  — array of endpoint definitions
//
// Each endpoint has:
//   method  — HTTP method (GET, POST, PUT, PATCH, DELETE)
//   route   — route path (e.g. "/users/:id")
//   name    — function name (camelCase, used for controller/service methods)
//   input   — request payload shape { fieldName: "type" }
//   output  — response shape { fieldName: "type" }
//   auth    — endpoint-level auth (overrides module-level)
//
// Auth options:
//   auth: false          → public route, no middleware
//   auth: "jwt"          → JWT Bearer token verification
//   auth: "apiKey"       → x-api-key header check
//   auth: "role:admin"   → JWT + admin role guard
//   auth: "role:<name>"  → JWT + custom role guard
//
// Example:
//
// export default [
//   {
//     module: "user",
//     auth: "jwt",
//     db: "User",
//     endpoints: [
//       {
//         method: "POST",
//         route: "/users/register",
//         name: "registerUser",
//         input: { email: "string", password: "string" },
//         output: { id: "string", token: "string" },
//         auth: false
//       },
//       {
//         method: "GET",
//         route: "/users/:id",
//         name: "getUserById",
//         input: {},
//         output: { id: "string", name: "string" },
//         auth: "jwt"
//       }
//     ]
//   }
// ];

export default [];
`;
}

function generateEnvExample(authRequired) {
    let env = `# Database\nDATABASE_URL="postgresql://user:password@localhost:5432/mydb"\n\n# Server\nPORT=3000\n`;
    if (authRequired) {
        env += `\n# Auth\nJWT_SECRET="your-super-secret-jwt-key"\nAPI_KEY="your-api-key"\n`;
    }
    return env;
}

function generatePackageJson(name, framework, authRequired) {
    const deps = {
        dotenv: '^16.4.7',
        zod: '^3.24.2',
        '@prisma/client': '^6.4.1',
    };

    if (framework === 'express') {
        deps['express'] = '^4.21.2';
        deps['cors'] = '^2.8.5';
    } else {
        deps['fastify'] = '^5.2.1';
        deps['@fastify/cors'] = '^11.0.1';
    }

    if (authRequired) {
        deps['jsonwebtoken'] = '^9.0.2';
    }

    const pkg = {
        name,
        version: '1.0.0',
        type: 'module',
        main: 'src/server.js',
        scripts: {
            dev: framework === 'express'
                ? 'node --watch src/server.js'
                : 'node --watch src/server.js',
            start: 'node src/server.js',
            'db:generate': 'npx prisma generate',
            'db:push': 'npx prisma db push',
            'db:migrate': 'npx prisma migrate dev',
        },
        dependencies: deps,
        devDependencies: {
            prisma: '^6.4.1',
        },
    };

    return JSON.stringify(pkg, null, 2);
}
