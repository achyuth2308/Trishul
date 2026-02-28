import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

/**
 * Loads trishul.config.json from the given directory.
 * @param {string} dir — directory containing trishul.config.json
 * @returns {Promise<object>} — parsed config object
 */
export async function loadConfig(dir) {
    const configPath = path.join(dir, 'trishul.config.json');

    if (!await fs.pathExists(configPath)) {
        logger.error(`trishul.config.json not found in ${dir}`);
        logger.info('Run "trishul init" first to generate a config file.');
        process.exit(1);
    }

    try {
        const raw = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(raw);

        if (!config.framework) {
            logger.error('trishul.config.json is missing the "framework" field.');
            process.exit(1);
        }

        if (!['express', 'fastify'].includes(config.framework)) {
            logger.error(
                `Invalid framework "${config.framework}" in trishul.config.json. ` +
                `Must be "express" or "fastify".`
            );
            process.exit(1);
        }

        return config;
    } catch (err) {
        logger.error(`Failed to parse trishul.config.json: ${err.message}`);
        process.exit(1);
    }
}
