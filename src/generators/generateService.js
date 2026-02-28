/**
 * Generates service file content for a module.
 * Service files are the ONLY place where devs write business logic.
 * @param {object} moduleDef — module definition from schema
 * @returns {string} — service file content
 */
export function generateService(moduleDef) {
    const { module: modName, endpoints, db } = moduleDef;

    let code = `import prisma from '../config/db.js';\n\n`;

    for (const ep of endpoints) {
        const inputKeys = Object.keys(ep.input || {});
        const outputKeys = Object.keys(ep.output || {});
        const params = (ep.route.match(/:(\w+)/g) || []).map((p) => p.slice(1));
        const allArgs = [...params, ...inputKeys];

        code += `/**\n`;
        code += ` * ${ep.method} ${ep.route}\n`;
        code += ` *\n`;

        if (allArgs.length > 0) {
            code += ` * @param {object} args\n`;
            for (const p of params) {
                code += ` * @param {string} args.${p} — from URL params\n`;
            }
            for (const key of inputKeys) {
                code += ` * @param {${ep.input[key]}} args.${key} — from request ${['GET', 'DELETE'].includes(ep.method) ? 'query' : 'body'}\n`;
            }
        }

        code += ` *\n`;
        code += ` * @returns {Promise<${JSON.stringify(ep.output)}>}\n`;
        code += ` */\n`;

        const args = allArgs.length > 0 ? `{ ${allArgs.join(', ')} }` : '';
        code += `export async function ${ep.name}(${args}) {\n`;
        code += `  // TODO: Implement ${ep.name}\n`;
        code += `  //\n`;

        if (db) {
            code += `  // Prisma model: ${db}\n`;
            code += `  // Example: const result = await prisma.${db.charAt(0).toLowerCase() + db.slice(1)}.findUnique({ where: { id } });\n`;
        }

        code += `  //\n`;
        code += `  // Expected input:  ${allArgs.length > 0 ? `{ ${allArgs.join(', ')} }` : '(none)'}\n`;
        code += `  // Expected output: ${JSON.stringify(ep.output)}\n`;
        code += `  //\n`;
        code += `  throw new Error('${ep.name} not implemented');\n`;
        code += `}\n\n`;
    }

    return code;
}
