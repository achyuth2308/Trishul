/**
 * Generates validator file content with zod schemas for a module.
 * @param {object} moduleDef — module definition from schema
 * @param {string} framework — "express" or "fastify"
 * @returns {string} — validator file content
 */
export function generateValidator(moduleDef, framework) {
    const { endpoints } = moduleDef;

    let code = `import { z } from 'zod';\n\n`;

    // Generate zod schemas for each endpoint
    for (const ep of endpoints) {
        const inputKeys = Object.keys(ep.input || {});
        const outputKeys = Object.keys(ep.output || {});

        if (inputKeys.length > 0) {
            code += `const ${ep.name}Input = z.object({\n`;
            for (const key of inputKeys) {
                code += `  ${key}: ${mapTypeToZod(ep.input[key])},\n`;
            }
            code += `});\n\n`;
        }

        if (outputKeys.length > 0) {
            code += `const ${ep.name}Output = z.object({\n`;
            for (const key of outputKeys) {
                code += `  ${key}: ${mapTypeToZod(ep.output[key])},\n`;
            }
            code += `});\n\n`;
        }
    }

    if (framework === 'express') {
        code += generateExpressValidation(endpoints);
    } else {
        code += generateFastifySchemas(endpoints);
    }

    return code;
}

function generateExpressValidation(endpoints) {
    let code = `const validationSchemas = {\n`;
    for (const ep of endpoints) {
        const hasInput = Object.keys(ep.input || {}).length > 0;
        if (hasInput) {
            code += `  ${ep.name}: ${ep.name}Input,\n`;
        }
    }
    code += `};\n\n`;

    code += `/**\n * Express validation middleware factory.\n`;
    code += ` * @param {string} name — endpoint name\n`;
    code += ` * @returns {Function} — Express middleware\n */\n`;
    code += `export function validate(name) {\n`;
    code += `  return (req, res, next) => {\n`;
    code += `    const schema = validationSchemas[name];\n`;
    code += `    if (!schema) return next();\n\n`;
    code += `    const source = ['GET', 'DELETE'].includes(req.method)\n`;
    code += `      ? req.query\n`;
    code += `      : req.body;\n\n`;
    code += `    const result = schema.safeParse(source);\n`;
    code += `    if (!result.success) {\n`;
    code += `      return res.status(400).json({\n`;
    code += `        error: 'Validation failed',\n`;
    code += `        details: result.error.flatten().fieldErrors,\n`;
    code += `      });\n`;
    code += `    }\n\n`;
    code += `    req.validated = result.data;\n`;
    code += `    next();\n`;
    code += `  };\n`;
    code += `}\n`;

    return code;
}

function generateFastifySchemas(endpoints) {
    let code = `export const schemas = {\n`;

    for (const ep of endpoints) {
        const hasInput = Object.keys(ep.input || {}).length > 0;
        if (hasInput) {
            const source = ['GET', 'DELETE'].includes(ep.method)
                ? 'querystring'
                : 'body';
            code += `  ${ep.name}: {\n`;
            code += `    ${source}: {\n`;
            code += `      type: 'object',\n`;
            code += `      properties: {\n`;
            for (const key of Object.keys(ep.input)) {
                code += `        ${key}: { type: '${mapTypeToJsonSchema(ep.input[key])}' },\n`;
            }
            code += `      },\n`;
            code += `      required: [${Object.keys(ep.input).map((k) => `'${k}'`).join(', ')}],\n`;
            code += `    },\n`;
            code += `  },\n`;
        }
    }

    code += `};\n`;
    return code;
}

function mapTypeToZod(type) {
    switch (type) {
        case 'string': return 'z.string()';
        case 'number': return 'z.number()';
        case 'boolean': return 'z.boolean()';
        case 'integer': return 'z.number().int()';
        default: return 'z.any()';
    }
}

function mapTypeToJsonSchema(type) {
    switch (type) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'integer': return 'integer';
        default: return 'string';
    }
}
