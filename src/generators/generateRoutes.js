import path from 'path';
import { parseAuth, resolveAuth } from '../utils/authParser.js';

/**
 * Generates route file content for a module.
 * @param {object} moduleDef — module definition from schema
 * @param {string} framework — "express" or "fastify"
 * @returns {string} — route file content
 */
export function generateRoutes(moduleDef, framework) {
    if (framework === 'express') {
        return generateExpressRoutes(moduleDef);
    }
    return generateFastifyRoutes(moduleDef);
}

function generateExpressRoutes(moduleDef) {
    const { module: modName, endpoints } = moduleDef;
    const allImports = new Set();
    const controllerName = `${modName}Controller`;

    // Collect all needed auth imports
    for (const ep of endpoints) {
        const auth = resolveAuth(ep, moduleDef);
        const { imports } = parseAuth(auth);
        imports.forEach((i) => allImports.add(i));
    }

    let code = `import { Router } from 'express';\n`;
    code += `import * as ${controllerName} from './${modName}.controller.js';\n`;

    if (allImports.has('verifyToken')) {
        code += `import { verifyToken } from '../middleware/auth/verifyToken.js';\n`;
    }
    if (allImports.has('requireRole')) {
        code += `import { requireRole } from '../middleware/auth/requireRole.js';\n`;
    }
    if (allImports.has('apiKeyCheck')) {
        code += `import { apiKeyCheck } from '../middleware/auth/apiKeyCheck.js';\n`;
    }

    code += `import { validate } from './${modName}.validator.js';\n`;
    code += `\nconst router = Router();\n\n`;

    for (const ep of endpoints) {
        const auth = resolveAuth(ep, moduleDef);
        const { middlewares } = parseAuth(auth);
        const method = ep.method.toLowerCase();
        const args = [
            `'${ep.route}'`,
            ...middlewares,
            `validate('${ep.name}')`,
            `${controllerName}.${ep.name}`,
        ];
        code += `router.${method}(${args.join(', ')});\n`;
    }

    code += `\nexport default router;\n`;
    return code;
}

function generateFastifyRoutes(moduleDef) {
    const { module: modName, endpoints } = moduleDef;
    const allImports = new Set();
    const controllerName = `${modName}Controller`;

    for (const ep of endpoints) {
        const auth = resolveAuth(ep, moduleDef);
        const { imports } = parseAuth(auth);
        imports.forEach((i) => allImports.add(i));
    }

    let code = `import * as ${controllerName} from './${modName}.controller.js';\n`;

    if (allImports.has('verifyToken')) {
        code += `import { verifyToken } from '../middleware/auth/verifyToken.js';\n`;
    }
    if (allImports.has('requireRole')) {
        code += `import { requireRole } from '../middleware/auth/requireRole.js';\n`;
    }
    if (allImports.has('apiKeyCheck')) {
        code += `import { apiKeyCheck } from '../middleware/auth/apiKeyCheck.js';\n`;
    }

    code += `import { schemas } from './${modName}.validator.js';\n`;
    code += `\n/**\n * @param {import('fastify').FastifyInstance} fastify\n */\n`;
    code += `export default async function ${modName}Routes(fastify) {\n`;

    for (const ep of endpoints) {
        const auth = resolveAuth(ep, moduleDef);
        const { middlewares } = parseAuth(auth);
        const method = ep.method.toLowerCase();
        const preHandler = middlewares.length > 0
            ? `\n      preHandler: [${middlewares.join(', ')}],`
            : '';

        code += `\n  fastify.${method}('${ep.route}', {${preHandler}\n    schema: schemas.${ep.name} || {},\n  }, ${controllerName}.${ep.name});\n`;
    }

    code += `}\n`;
    return code;
}
