import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './logger.js';

const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const VALID_AUTH = [false, 'jwt', 'apiKey'];

/**
 * Loads and validates trishul.schema.js from the given directory.
 * @param {string} dir — directory containing trishul.schema.js
 * @returns {Promise<Array>} — array of module definitions
 */
export async function loadSchema(dir) {
    const schemaPath = path.join(dir, 'trishul.schema.js');

    if (!await fs.pathExists(schemaPath)) {
        logger.error(`trishul.schema.js not found in ${dir}`);
        logger.info('Run "trishul init" first or create trishul.schema.js manually.');
        process.exit(1);
    }

    try {
        const fileUrl = pathToFileURL(schemaPath).href;
        const mod = await import(fileUrl);
        const schema = mod.default;

        if (!Array.isArray(schema)) {
            logger.error('trishul.schema.js must export a default array of module definitions.');
            process.exit(1);
        }

        for (const moduleDef of schema) {
            validateModule(moduleDef);
        }

        return schema;
    } catch (err) {
        if (err.code === 'ERR_MODULE_NOT_FOUND' || err instanceof SyntaxError) {
            logger.error(`Failed to parse trishul.schema.js: ${err.message}`);
            logger.info('Ensure the file uses valid ESM syntax (export default [...]).');
            process.exit(1);
        }
        throw err;
    }
}

function validateModule(moduleDef) {
    if (!moduleDef.module || typeof moduleDef.module !== 'string') {
        logger.error('Each module must have a "module" field (string).');
        process.exit(1);
    }

    if (moduleDef.auth !== undefined) {
        validateAuthField(moduleDef.auth, `module "${moduleDef.module}"`);
    }

    if (!Array.isArray(moduleDef.endpoints)) {
        logger.error(`Module "${moduleDef.module}" must have an "endpoints" array.`);
        process.exit(1);
    }

    for (const ep of moduleDef.endpoints) {
        validateEndpoint(ep, moduleDef.module);
    }
}

function validateEndpoint(ep, moduleName) {
    if (!ep.method || !VALID_METHODS.includes(ep.method.toUpperCase())) {
        logger.error(
            `Invalid method "${ep.method}" in module "${moduleName}". ` +
            `Valid: ${VALID_METHODS.join(', ')}`
        );
        process.exit(1);
    }

    if (!ep.route || typeof ep.route !== 'string') {
        logger.error(`Endpoint in module "${moduleName}" must have a "route" string.`);
        process.exit(1);
    }

    if (!ep.name || typeof ep.name !== 'string') {
        logger.error(`Endpoint in module "${moduleName}" must have a "name" string.`);
        process.exit(1);
    }

    if (ep.auth !== undefined) {
        validateAuthField(ep.auth, `endpoint "${ep.name}" in module "${moduleName}"`);
    }
}

function validateAuthField(auth, context) {
    if (auth === false) return;
    if (typeof auth === 'string') {
        if (auth === 'jwt' || auth === 'apiKey') return;
        if (auth.startsWith('role:') && auth.length > 5) return;

        logger.error(
            `Invalid auth value "${auth}" in ${context}.\n` +
            `  Valid options:\n` +
            `    auth: false          → public (no middleware)\n` +
            `    auth: "jwt"          → JWT Bearer token\n` +
            `    auth: "apiKey"       → x-api-key header\n` +
            `    auth: "role:<name>"  → JWT + role guard (e.g. "role:admin")`
        );
        process.exit(1);
    }

    logger.error(
        `Auth field must be false, a string ("jwt", "apiKey", "role:X"), ` +
        `in ${context}. Received: ${typeof auth}`
    );
    process.exit(1);
}
