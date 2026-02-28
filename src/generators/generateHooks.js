/**
 * Generates React hooks wrapping API calls.
 * @param {Array} clientDefs — array of endpoint definitions
 * @returns {Map<string, string>} — map of hookName → file content
 */
export function generateHooks(clientDefs) {
    const hooks = new Map();
    const moduleNames = new Set();

    for (const def of clientDefs) {
        const segments = def.url.split('/').filter(Boolean);
        const first = segments[0] || 'api';
        const moduleName = first.endsWith('s') ? first.slice(0, -1) : first;
        moduleNames.add(moduleName);
    }

    for (const def of clientDefs) {
        const hookName = `use${capitalize(def.name)}`;
        const code = generateHook(def, hookName);
        hooks.set(hookName, code);
    }

    return hooks;
}

function generateHook(def, hookName) {
    const { name, method, url, payload, response, auth } = def;
    const params = (url.match(/:(\w+)/g) || []).map((p) => p.slice(1));
    const payloadKeys = Object.keys(payload || {});
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Determine module name for import
    const segments = url.split('/').filter(Boolean);
    const first = segments[0] || 'api';
    const moduleName = first.endsWith('s') ? first.slice(0, -1) : first;

    let code = `import { useState, useCallback } from 'react';\n`;
    code += `import { ${name} } from '../api/${moduleName}.api.js';\n\n`;

    code += `/**\n`;
    code += ` * React hook for ${method} ${url}\n`;
    code += ` * @returns {{ `;

    if (isMutation) {
        code += `execute: Function, `;
    }

    code += `data: ${JSON.stringify(response)} | null, loading: boolean, error: Error | null }}\n`;
    code += ` */\n`;

    code += `export function ${hookName}() {\n`;
    code += `  const [data, setData] = useState(null);\n`;
    code += `  const [loading, setLoading] = useState(${isMutation ? 'false' : 'false'});\n`;
    code += `  const [error, setError] = useState(null);\n\n`;

    if (isMutation) {
        code += `  const execute = useCallback(async (params = {}) => {\n`;
    } else {
        code += `  const execute = useCallback(async (params = {}) => {\n`;
    }

    code += `    try {\n`;
    code += `      setLoading(true);\n`;
    code += `      setError(null);\n`;
    code += `      const result = await ${name}(params);\n`;
    code += `      setData(result);\n`;
    code += `      return result;\n`;
    code += `    } catch (err) {\n`;
    code += `      setError(err);\n`;
    code += `      throw err;\n`;
    code += `    } finally {\n`;
    code += `      setLoading(false);\n`;
    code += `    }\n`;
    code += `  }, []);\n\n`;

    code += `  return { execute, data, loading, error };\n`;
    code += `}\n`;

    return code;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
