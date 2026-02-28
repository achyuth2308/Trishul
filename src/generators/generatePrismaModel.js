/**
 * Generates a Prisma model block for a module.
 * @param {object} moduleDef — module definition from schema
 * @returns {string} — Prisma model block
 */
export function generatePrismaModel(moduleDef) {
    const { db, endpoints } = moduleDef;
    if (!db) return '';

    // Collect all fields from input/output across endpoints
    const fields = new Map();
    fields.set('id', 'String @id @default(cuid())');
    fields.set('createdAt', 'DateTime @default(now())');
    fields.set('updatedAt', 'DateTime @updatedAt');

    for (const ep of endpoints) {
        const allFields = { ...(ep.input || {}), ...(ep.output || {}) };
        for (const [key, type] of Object.entries(allFields)) {
            if (key === 'id' || key === 'token' || key === 'success') continue;
            if (!fields.has(key)) {
                fields.set(key, mapTypeToPrisma(type));
            }
        }
    }

    let model = `model ${db} {\n`;
    for (const [key, type] of fields) {
        model += `  ${key.padEnd(12)} ${type}\n`;
    }
    model += `}\n`;

    return model;
}

function mapTypeToPrisma(type) {
    switch (type) {
        case 'string': return 'String';
        case 'number': return 'Float';
        case 'integer': return 'Int';
        case 'boolean': return 'Boolean';
        default: return 'String';
    }
}
