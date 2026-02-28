import path from 'path';
import fs from 'fs-extra';
import { loadSchema } from '../utils/schemaLoader.js';
import { loadConfig } from '../utils/configLoader.js';
import { writeFile } from '../utils/fileWriter.js';
import { logger } from '../utils/logger.js';
import { generateRoutes } from '../generators/generateRoutes.js';
import { generateController } from '../generators/generateController.js';
import { generateService } from '../generators/generateService.js';
import { generateValidator } from '../generators/generateValidator.js';
import { generatePrismaModel } from '../generators/generatePrismaModel.js';
import { generatePrismaSchema } from '../generators/generatePrismaSchema.js';
import { generateAuthMiddleware } from '../generators/generateAuthMiddleware.js';
import { generateErrorMiddleware } from '../generators/generateErrorMiddleware.js';
import { generateConfig } from '../generators/generateConfig.js';
import { generateApp } from '../generators/generateApp.js';
import { generateServer } from '../generators/generateServer.js';
import { generateProjectPackage } from '../generators/generateProjectPackage.js';

export async function forgeCommand(options) {
    const cwd = process.cwd();
    const dryRun = options.dryRun || false;

    logger.section('Forging backend structure...\n');

    if (dryRun) {
        logger.info('DRY RUN — no files will be written.\n');
    }

    const config = await loadConfig(cwd);
    const schema = await loadSchema(cwd);
    const { framework } = config;
    const srcDir = path.join(cwd, 'src');

    // 1. Generate config files
    logger.section('Config');
    const configs = generateConfig(config.auth);
    await writeFile(path.join(srcDir, 'config', 'db.js'), configs.db, { dryRun });
    await writeFile(path.join(srcDir, 'config', 'env.js'), configs.env, { dryRun });

    // 2. Generate auth middleware
    logger.section('Auth Middleware');
    const authMiddleware = generateAuthMiddleware(framework);
    await writeFile(
        path.join(srcDir, 'middleware', 'auth', 'verifyToken.js'),
        authMiddleware.verifyToken,
        { dryRun }
    );
    await writeFile(
        path.join(srcDir, 'middleware', 'auth', 'requireRole.js'),
        authMiddleware.requireRole,
        { dryRun }
    );
    await writeFile(
        path.join(srcDir, 'middleware', 'auth', 'apiKeyCheck.js'),
        authMiddleware.apiKeyCheck,
        { dryRun }
    );

    // 3. Generate error middleware
    const errorMw = generateErrorMiddleware(framework);
    await writeFile(
        path.join(srcDir, 'middleware', 'error.middleware.js'),
        errorMw,
        { dryRun }
    );

    // 4. Generate module files
    for (const moduleDef of schema) {
        const modDir = path.join(srcDir, 'modules', moduleDef.module);
        logger.section(`Module: ${moduleDef.module}`);

        // Routes
        const routes = generateRoutes(moduleDef, framework);
        await writeFile(
            path.join(modDir, `${moduleDef.module}.routes.js`),
            routes, { dryRun }
        );

        // Controller
        const ctrl = generateController(moduleDef, framework);
        await writeFile(
            path.join(modDir, `${moduleDef.module}.controller.js`),
            ctrl, { dryRun }
        );

        // Service (Canvas file — developer writes logic here)
        const svc = generateService(moduleDef);
        const svcPath = path.join(modDir, `${moduleDef.module}.service.js`);

        if (!dryRun && await fs.pathExists(svcPath)) {
            logger.warn(`${moduleDef.module}.service.js already exists — skipping (developer file).`);
        } else {
            await writeFile(svcPath, svc, { dryRun, isCanvas: true });
        }

        // Validator
        const validator = generateValidator(moduleDef, framework);
        await writeFile(
            path.join(modDir, `${moduleDef.module}.validator.js`),
            validator, { dryRun }
        );

        // Prisma model
        const prismaModel = generatePrismaModel(moduleDef);
        if (prismaModel) {
            await writeFile(
                path.join(modDir, `${moduleDef.module}.model.prisma`),
                prismaModel,
                { dryRun, noHeader: true }
            );
        }
    }

    // 5. Assemble Prisma schema
    logger.section('Prisma Schema');
    const prismaSchema = generatePrismaSchema(schema);
    await writeFile(
        path.join(srcDir, 'prisma', 'schema.prisma'),
        prismaSchema,
        { dryRun, noHeader: true }
    );

    // 6. Generate app.js and server.js
    logger.section('App & Server');
    const app = generateApp(schema, framework);
    await writeFile(path.join(srcDir, 'app.js'), app, { dryRun });

    const server = generateServer(framework);
    await writeFile(path.join(srcDir, 'server.js'), server, { dryRun });

    // 7. Update .env.example with auth keys
    if (config.auth) {
        const envPath = path.join(cwd, '.env.example');
        if (!dryRun) {
            let envContent = '';
            if (await fs.pathExists(envPath)) {
                envContent = await fs.readFile(envPath, 'utf-8');
            }
            if (!envContent.includes('JWT_SECRET')) {
                envContent += '\nJWT_SECRET="your-super-secret-jwt-key"\n';
            }
            if (!envContent.includes('API_KEY')) {
                envContent += 'API_KEY="your-api-key"\n';
            }
            await fs.writeFile(envPath, envContent, 'utf-8');
        } else {
            logger.dryRun('.env.example (added JWT_SECRET & API_KEY)');
        }
    }

    // 8. Generate project package.json
    logger.section('Package JSON');
    const projectPackageJson = generateProjectPackage(config);
    await writeFile(path.join(cwd, 'package.json'), projectPackageJson, { dryRun, noHeader: true });

    logger.success('\nForge complete! 🔱');
    if (!dryRun) {
        logger.info('Next steps:');
        logger.info('  1. Install deps:     npm install');
        logger.info('  2. Set up .env:      cp .env.example .env');
        logger.info('  3. Generate Prisma:  npx prisma generate');
        logger.info('  4. Write logic in:   src/modules/*/[module].service.js');
        logger.info('  5. Start server:     npm run dev');
    }
}
