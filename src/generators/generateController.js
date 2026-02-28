/**
 * Generates controller file content for a module.
 * @param {object} moduleDef — module definition from schema
 * @param {string} framework — "express" or "fastify"
 * @returns {string} — controller file content
 */
export function generateController(moduleDef, framework) {
    const { module: modName, endpoints } = moduleDef;
    const serviceName = `${modName}Service`;

    let code = `import * as ${serviceName} from './${modName}.service.js';\n\n`;

    for (const ep of endpoints) {
        const inputKeys = Object.keys(ep.input || {});
        const outputKeys = Object.keys(ep.output || {});

        if (framework === 'express') {
            code += generateExpressHandler(ep, serviceName, inputKeys, outputKeys);
        } else {
            code += generateFastifyHandler(ep, serviceName, inputKeys, outputKeys);
        }
    }

    return code;
}

function generateExpressHandler(ep, serviceName, inputKeys, outputKeys) {
    const destructure = buildDestructure(ep, inputKeys);
    let code = '';
    code += `/**\n * ${ep.method} ${ep.route}\n`;
    if (inputKeys.length) code += ` * @input {${JSON.stringify(ep.input)}}\n`;
    code += ` * @output {${JSON.stringify(ep.output)}}\n */\n`;
    code += `export async function ${ep.name}(req, res, next) {\n`;
    code += `  try {\n`;
    if (destructure) code += `    ${destructure}\n`;
    code += `    const result = await ${serviceName}.${ep.name}(${buildCallArgs(ep, inputKeys)});\n`;
    code += `    res.json(result);\n`;
    code += `  } catch (error) {\n`;
    code += `    next(error);\n`;
    code += `  }\n`;
    code += `}\n\n`;
    return code;
}

function generateFastifyHandler(ep, serviceName, inputKeys, outputKeys) {
    const destructure = buildDestructure(ep, inputKeys);
    let code = '';
    code += `/**\n * ${ep.method} ${ep.route}\n`;
    if (inputKeys.length) code += ` * @input {${JSON.stringify(ep.input)}}\n`;
    code += ` * @output {${JSON.stringify(ep.output)}}\n */\n`;
    code += `export async function ${ep.name}(request, reply) {\n`;
    code += `  try {\n`;
    if (destructure) {
        code += `    ${destructure.replace(/req\./g, 'request.')}\n`;
    }
    code += `    const result = await ${serviceName}.${ep.name}(${buildCallArgs(ep, inputKeys)});\n`;
    code += `    reply.send(result);\n`;
    code += `  } catch (error) {\n`;
    code += `    reply.status(500).send({ error: error.message });\n`;
    code += `  }\n`;
    code += `}\n\n`;
    return code;
}

function buildDestructure(ep, inputKeys) {
    if (inputKeys.length === 0 && !ep.route.includes(':')) {
        return '';
    }

    const parts = [];
    if (inputKeys.length > 0) {
        const source = ['GET', 'DELETE'].includes(ep.method.toUpperCase())
            ? 'req.query'
            : 'req.body';
        parts.push(`const { ${inputKeys.join(', ')} } = ${source};`);
    }

    const params = (ep.route.match(/:(\w+)/g) || []).map((p) => p.slice(1));
    if (params.length > 0) {
        parts.push(`const { ${params.join(', ')} } = req.params;`);
    }

    return parts.join('\n    ');
}

function buildCallArgs(ep, inputKeys) {
    const params = (ep.route.match(/:(\w+)/g) || []).map((p) => p.slice(1));
    const allArgs = [...params, ...inputKeys];
    if (allArgs.length === 0) return '';
    return `{ ${allArgs.join(', ')} }`;
}
