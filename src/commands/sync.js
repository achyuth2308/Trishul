import path from 'path';
import fs from 'fs-extra';
import { pathToFileURL } from 'url';
import { loadSchema } from '../utils/schemaLoader.js';
import { logger } from '../utils/logger.js';

export async function syncCommand() {
    const cwd = process.cwd();
    logger.section('Syncing backend schema vs frontend client...\n');

    // Load backend schema
    const schema = await loadSchema(cwd);

    // Load frontend client
    const clientPath = path.join(cwd, 'trishul.client.js');
    if (!await fs.pathExists(clientPath)) {
        logger.error('trishul.client.js not found in current directory.');
        logger.info('Create a trishul.client.js file first.');
        process.exit(1);
    }

    let clientDefs;
    try {
        const fileUrl = pathToFileURL(clientPath).href;
        const mod = await import(fileUrl);
        clientDefs = mod.default;
    } catch (err) {
        logger.error(`Failed to load trishul.client.js: ${err.message}`);
        process.exit(1);
    }

    // Flatten backend schema to endpoint list
    const backendEndpoints = [];
    for (const mod of schema) {
        for (const ep of mod.endpoints) {
            const auth = ep.auth !== undefined ? ep.auth : (mod.auth || false);
            backendEndpoints.push({
                method: ep.method,
                route: ep.route,
                name: ep.name,
                input: ep.input || {},
                output: ep.output || {},
                auth,
                module: mod.module,
            });
        }
    }

    // Build lookup maps
    const backendMap = new Map();
    for (const ep of backendEndpoints) {
        backendMap.set(`${ep.method}:${ep.route}`, ep);
    }

    const frontendMap = new Map();
    for (const ep of clientDefs) {
        frontendMap.set(`${ep.method}:${ep.url}`, ep);
    }

    // Diff
    const report = {
        timestamp: new Date().toISOString(),
        matched: [],
        missingInBackend: [],
        missingInFrontend: [],
        payloadMismatches: [],
        authMismatches: [],
    };

    // Check frontend endpoints against backend
    for (const [key, feEp] of frontendMap) {
        const beEp = backendMap.get(key);

        if (!beEp) {
            report.missingInBackend.push({
                method: feEp.method,
                route: feEp.url,
                name: feEp.name,
                source: 'frontend',
            });
            logger.missing(
                `${feEp.method} ${feEp.url} — in frontend but missing in backend`
            );
            continue;
        }

        let hasIssue = false;

        // Check payload/response shape
        const inputMatch = deepEqual(feEp.payload || {}, beEp.input);
        const outputMatch = deepEqual(feEp.response || {}, beEp.output);

        if (!inputMatch || !outputMatch) {
            hasIssue = true;
            const mismatch = {
                method: feEp.method,
                route: feEp.url,
                name: feEp.name,
            };

            if (!inputMatch) {
                mismatch.payloadDiff = {
                    frontend: feEp.payload || {},
                    backend: beEp.input,
                };
            }
            if (!outputMatch) {
                mismatch.responseDiff = {
                    frontend: feEp.response || {},
                    backend: beEp.output,
                };
            }

            report.payloadMismatches.push(mismatch);
            logger.mismatch(
                `${feEp.method} ${feEp.url} — payload/response shape mismatch`
            );
        }

        // Check auth
        const feAuth = normalizeAuth(feEp.auth);
        const beAuth = normalizeAuth(beEp.auth);

        if (feAuth !== beAuth) {
            hasIssue = true;
            report.authMismatches.push({
                method: feEp.method,
                route: feEp.url,
                name: feEp.name,
                frontend: feEp.auth,
                backend: beEp.auth,
            });
            logger.mismatch(
                `${feEp.method} ${feEp.url} — auth mismatch (FE: ${feAuth}, BE: ${beAuth})`
            );
        }

        if (!hasIssue) {
            report.matched.push({
                method: feEp.method,
                route: feEp.url,
                name: feEp.name,
            });
            logger.matched(`${feEp.method} ${feEp.url} — ✓ aligned`);
        }
    }

    // Check backend endpoints missing in frontend
    for (const [key, beEp] of backendMap) {
        if (!frontendMap.has(key)) {
            report.missingInFrontend.push({
                method: beEp.method,
                route: beEp.route,
                name: beEp.name,
                module: beEp.module,
                source: 'backend',
            });
            logger.missing(
                `${beEp.method} ${beEp.route} — in backend but missing in frontend`
            );
        }
    }

    // Write report
    const reportPath = path.join(cwd, 'trishul.sync.report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });

    // Print summary
    console.log('');
    logger.section('Sync Summary');
    logger.success(`Matched:               ${report.matched.length}`);
    logger.warn(`Missing in backend:    ${report.missingInBackend.length}`);
    logger.warn(`Missing in frontend:   ${report.missingInFrontend.length}`);
    logger.error(`Payload mismatches:    ${report.payloadMismatches.length}`);
    logger.error(`Auth mismatches:       ${report.authMismatches.length}`);

    logger.info(`\nFull report written to: trishul.sync.report.json`);
}

function normalizeAuth(auth) {
    if (auth === false || auth === undefined || auth === null) return 'none';
    return String(auth);
}

function deepEqual(a, b) {
    return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

function sortKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            acc[key] = sortKeys(obj[key]);
            return acc;
        }, {});
}
