/**
 * Generates barrel export file for all API modules.
 * @param {Array<string>} moduleNames — list of module names
 * @returns {string} — index.js barrel export content
 */
export function generateBarrelExport(moduleNames) {
    let code = '';

    for (const name of moduleNames) {
        code += `export * from './${name}.api.js';\n`;
    }

    return code;
}
