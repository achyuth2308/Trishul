import path from 'path';
import fs from 'fs-extra';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';
import { writeFile } from '../utils/fileWriter.js';
import { generateAxiosInstance } from '../generators/generateAxiosInstance.js';
import { generateAxiosClient } from '../generators/generateAxiosClient.js';
import { generateBarrelExport } from '../generators/generateBarrelExport.js';
import { generateHooks } from '../generators/generateHooks.js';
import { generateSchemaFromClient } from '../generators/generateSchemaFromClient.js';

export async function invokeCommand(clientFile, options) {
    const cwd = process.cwd();
    const dryRun = options.dryRun || false;
    const clientPath = path.resolve(cwd, clientFile);

    logger.section('Invoking frontend generation...\n');

    if (dryRun) {
        logger.info('DRY RUN — no files will be written.\n');
    }

    // Load client definitions
    if (!await fs.pathExists(clientPath)) {
        logger.error(`Client file not found: ${clientPath}`);
        logger.info('Create a trishul.client.js file or specify the correct path.');
        process.exit(1);
    }

    let clientDefs;
    try {
        const fileUrl = pathToFileURL(clientPath).href;
        const mod = await import(fileUrl);
        clientDefs = mod.default;

        if (!Array.isArray(clientDefs)) {
            logger.error('Client file must export a default array of endpoint definitions.');
            process.exit(1);
        }
    } catch (err) {
        logger.error(`Failed to load client file: ${err.message}`);
        process.exit(1);
    }

    // 1. Generate axiosInstance.js
    logger.section('Axios Instance');
    const axiosInst = generateAxiosInstance();
    await writeFile(path.join(cwd, 'axiosInstance.js'), axiosInst, { dryRun });

    // 2. Generate API files
    logger.section('API Functions');
    const apiFiles = generateAxiosClient(clientDefs);
    const moduleNames = [];

    for (const [moduleName, content] of apiFiles) {
        moduleNames.push(moduleName);
        await writeFile(
            path.join(cwd, 'api', `${moduleName}.api.js`),
            content,
            { dryRun }
        );
    }

    // 3. Generate barrel export
    const barrel = generateBarrelExport(moduleNames);
    await writeFile(path.join(cwd, 'api', 'index.js'), barrel, { dryRun });

    // 4. Check for React and generate hooks
    const hasReact = await detectReact(cwd);
    if (hasReact) {
        logger.section('React Hooks');
        const hooks = generateHooks(clientDefs);
        for (const [hookName, content] of hooks) {
            await writeFile(
                path.join(cwd, 'hooks', `${hookName}.js`),
                content,
                { dryRun }
            );
        }
    } else {
        logger.info('React not detected in package.json — skipping hooks generation.');
    }

    // 5. Reverse-generate trishul.schema.js
    logger.section('Bridge: Backend Schema');
    const reverseSchema = generateSchemaFromClient(clientDefs);
    await writeFile(
        path.join(cwd, 'trishul.schema.js'),
        reverseSchema,
        { dryRun, noHeader: true }
    );

    logger.success('\nInvoke complete! ⚡');
    if (!dryRun) {
        logger.info('Generated files:');
        logger.info('  📁 api/          — Axios API functions');
        logger.info('  📄 axiosInstance.js — Configured Axios instance');
        if (hasReact) {
            logger.info('  📁 hooks/        — React hooks for each endpoint');
        }
        logger.info('  📄 trishul.schema.js — Backend blueprint (reverse-generated)');
        logger.info('\nThe backend team can now run "trishul forge" with the generated schema.');
    }
}

async function detectReact(dir) {
    const pkgPath = path.join(dir, 'package.json');
    if (!await fs.pathExists(pkgPath)) return false;

    try {
        const pkg = await fs.readJSON(pkgPath);
        const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
        };
        return 'react' in allDeps;
    } catch {
        return false;
    }
}
