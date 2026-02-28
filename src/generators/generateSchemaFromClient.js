/**
 * Reverse-generates a trishul.schema.js from trishul.client.js definitions.
 * This bridges Case 2 (frontend-first) to Case 1 (backend forge).
 * @param {Array} clientDefs — array of client endpoint definitions
 * @returns {string} — trishul.schema.js file content
 */
export function generateSchemaFromClient(clientDefs) {
    // Group by module (first URL segment)
    const modules = new Map();

    for (const def of clientDefs) {
        const segments = def.url.split('/').filter(Boolean);
        const first = segments[0] || 'api';
        const moduleName = first.endsWith('s') ? first.slice(0, -1) : first;

        if (!modules.has(moduleName)) {
            modules.set(moduleName, {
                module: moduleName,
                db: capitalize(moduleName),
                endpoints: [],
            });
        }

        modules.get(moduleName).endpoints.push({
            method: def.method,
            route: def.url,
            name: def.name,
            input: def.payload || {},
            output: def.response || {},
            auth: def.auth,
        });
    }

    // Determine module-level auth from endpoints
    for (const mod of modules.values()) {
        const auths = mod.endpoints.map((e) => e.auth);
        const allSame = auths.every((a) => JSON.stringify(a) === JSON.stringify(auths[0]));

        if (allSame && auths[0] !== undefined) {
            mod.auth = auths[0];
            // Remove endpoint-level auth since it matches module
            for (const ep of mod.endpoints) {
                delete ep.auth;
            }
        }
    }

    const schemaArray = Array.from(modules.values());

    let code = `// 🔱 Trishul Schema — Reverse-generated from trishul.client.js\n`;
    code += `// Review and adjust before running "trishul forge"\n\n`;
    code += `export default ${JSON.stringify(schemaArray, null, 2)};\n`;

    return code;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
