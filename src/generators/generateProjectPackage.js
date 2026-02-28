export function generateProjectPackage(config) {
    const { projectName, framework } = config;

    const frameworkDep = framework === 'fastify'
        ? { "fastify": "^4.26.0" }
        : { "express": "^4.18.2" };

    const pkg = {
        name: projectName,
        version: "1.0.0",
        type: "module",
        scripts: {
            dev: "node src/server.js",
            start: "node src/server.js"
        },
        dependencies: {
            ...frameworkDep,
            "@prisma/client": "^5.0.0",
            "jsonwebtoken": "^9.0.0",
            "zod": "^3.22.0",
            "dotenv": "^16.0.0"
        },
        devDependencies: {
            "prisma": "^5.0.0"
        }
    };

    return JSON.stringify(pkg, null, 2);
}